import * as admin from "firebase-admin";
import * as crypto from "crypto";
import type { Request } from "firebase-functions/v2/https";

interface MemoryBucket {
  count: number;
  resetAtMs: number;
}

const MEMORY_BUCKETS = new Map<string, MemoryBucket>();
const MAX_MEMORY_BUCKETS = 2500;

function getUtcDateSalt(): string {
  return new Date().toISOString().slice(0, 10);
}

function sha256Short(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex").slice(0, 28);
}

function readSingleHeader(header: string | string[] | undefined): string {
  if (Array.isArray(header)) return String(header[0] || "").trim();
  return String(header || "").trim();
}

function pruneExpiredMemoryBuckets(nowMs: number): void {
  if (MEMORY_BUCKETS.size <= MAX_MEMORY_BUCKETS) return;
  for (const [k, v] of MEMORY_BUCKETS.entries()) {
    if (v.resetAtMs <= nowMs) {
      MEMORY_BUCKETS.delete(k);
    }
  }
  while (MEMORY_BUCKETS.size > MAX_MEMORY_BUCKETS) {
    const oldestKey = MEMORY_BUCKETS.keys().next().value;
    if (!oldestKey) break;
    MEMORY_BUCKETS.delete(oldestKey);
  }
}

/**
 * Extracts client IP strictly in memory and immediately returns a daily-salted
 * SHA-256 digest so raw visitor IP addresses are never stored or logged.
 */
export function extractHashedClientIp(req: Request, scope: string): string {
  const fastlyIp = readSingleHeader(req.headers["fastly-client-ip"]);
  const appEngineIp = readSingleHeader(req.headers["x-appengine-user-ip"]);
  const forwardedRaw = readSingleHeader(req.headers["x-forwarded-for"]);
  const firstForwardedIp = forwardedRaw ? forwardedRaw.split(",")[0].trim() : "";
  const rawIp = fastlyIp || appEngineIp || firstForwardedIp || req.ip || "unknown";
  const digest = sha256Short(`ip:${getUtcDateSalt()}:${scope}:${rawIp}`);
  return `${scope}_ip_${digest}`;
}

/**
 * Produces a daily-salted SHA-256 bucket key for an email or identifier
 * without storing PII in rate_limits documents.
 */
export function hashSubjectKey(subject: string, scope: string): string {
  const normalized = subject.trim().toLowerCase();
  const digest = sha256Short(`subj:${getUtcDateSalt()}:${scope}:${normalized}`);
  return `${scope}_subj_${digest}`;
}

/**
 * Fast L1 per-instance sliding/fixed-window rate limiter (zero Firestore cost).
 */
export function checkMemoryRateLimit(params: {
  bucketKey: string;
  maxHits: number;
  windowMs: number;
  nowMs?: number;
}): { allowed: boolean; retryAfterSec: number } {
  const nowMs = params.nowMs ?? Date.now();
  pruneExpiredMemoryBuckets(nowMs);

  const existing = MEMORY_BUCKETS.get(params.bucketKey);
  if (!existing || existing.resetAtMs <= nowMs) {
    MEMORY_BUCKETS.set(params.bucketKey, {
      count: 1,
      resetAtMs: nowMs + params.windowMs,
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= params.maxHits) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAtMs - nowMs) / 1000));
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Dual-layer rate limiter:
 * - L1 in-memory check short-circuits noisy floods with zero Firestore writes once tripped.
 * - Optional L2 atomic Firestore `rate_limits/{bucketKey}` window blocks distributed bots.
 */
export async function enforceRateLimit(params: {
  db?: admin.firestore.Firestore;
  bucketKey: string;
  maxHits: number;
  windowSeconds: number;
  persistToFirestore?: boolean;
}): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const windowMs = Math.max(1, params.windowSeconds) * 1000;
  const memResult = checkMemoryRateLimit({
    bucketKey: params.bucketKey,
    maxHits: params.maxHits,
    windowMs,
  });

  if (!memResult.allowed || !params.persistToFirestore || !params.db) {
    return memResult;
  }

  const nowMs = Date.now();
  const docRef = params.db.collection("rate_limits").doc(params.bucketKey);

  try {
    return await params.db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = snap.exists ? snap.data() : undefined;
      const existingResetMs =
        typeof data?.resetAtMs === "number" ? data.resetAtMs : 0;
      const existingCount =
        typeof data?.count === "number" ? data.count : 0;

      if (!snap.exists || existingResetMs <= nowMs) {
        const nextResetMs = nowMs + windowMs;
        tx.set(docRef, {
          count: 1,
          resetAtMs: nextResetMs,
          expiresAt: new Date(nextResetMs + 3_600_000).toISOString(),
        });
        return { allowed: true, retryAfterSec: 0 };
      }

      if (existingCount >= params.maxHits) {
        const retryAfterSec = Math.max(1, Math.ceil((existingResetMs - nowMs) / 1000));
        return { allowed: false, retryAfterSec };
      }

      tx.update(docRef, { count: existingCount + 1 });
      return { allowed: true, retryAfterSec: 0 };
    });
  } catch (err) {
    console.warn("[rateLimit] Firestore transaction fallback to memory check:", err);
    return memResult;
  }
}

/**
 * Constant-time SHA-256 equality check against timing side-channels on webhook secrets / tokens.
 */
export function timingSafeSecretMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedDigest = crypto.createHash("sha256").update(provided, "utf8").digest();
  const expectedDigest = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

/**
 * Ensures decoded Firebase ID tokens represent a verified email or trusted OAuth provider.
 */
export function isVerifiedDecodedToken(decoded: admin.auth.DecodedIdToken): boolean {
  return Boolean(
    decoded.email_verified === true ||
      decoded.firebase?.sign_in_provider === "google.com" ||
      decoded.firebase?.sign_in_provider === "microsoft.com"
  );
}
