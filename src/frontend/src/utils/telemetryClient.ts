import {
  TelemetryDeviceType,
  TelemetryEventRecord,
  TelemetryEventType,
} from "@/types/telemetry";
import { auth, db, hasFirebaseKeys } from "@/utils/firebase";

const SESSION_ID_STORAGE_KEY = "hems_telemetry_session_v1";
const SESSION_CAMPAIGN_STORAGE_KEY = "hems_telemetry_campaign_v1";
const SESSION_REFERRER_STORAGE_KEY = "hems_telemetry_referrer_v1";
export const MOCK_TELEMETRY_STORAGE_KEY = "hems_mock_telemetry_events_v1";

const BOT_UA_PATTERN =
  /bot|crawler|spider|headless|proofpoint|mimecast|barracuda|defender|safelinks|facebookexternalhit|slackbot|linkedinbot|preview/i;

const PAGE_TITLES: Record<string, string> = {
  "/": "Home — HEMS Society",
  "/about": "About HEMS Society",
  "/history": "25+ Year Workshop History",
  "/archive": "Proceedings Archive Index",
  "/layout-portal": "16th Workshop Hub (2027)",
  "/call-for-papers": "Call for Papers",
  "/formatting-guidelines": "Abstract Formatting Guidelines",
  "/student-awards": "Student Travel Awards",
  "/registration": "Workshop Registration",
  "/accommodations": "Accommodations & Coastal Venues",
  "/corporate-sponsorship": "Corporate Sponsorship",
  "/contact": "Contact & Mailing Signup",
  "/unsubscribe": "Mailing Preferences / Unsubscribe",
  "/auth": "Member & Committee Sign In",
};

export function normalizeTelemetryPath(rawPath: string | null | undefined): string {
  if (!rawPath) return "/";
  const clean = rawPath.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean || "/";
}

export function isInternalPortalManagementRoute(path: string): boolean {
  const norm = normalizeTelemetryPath(path);
  return (
    norm === "/admin" ||
    norm.startsWith("/admin/") ||
    norm === "/board" ||
    norm.startsWith("/board/") ||
    norm === "/reviewer" ||
    norm.startsWith("/reviewer/")
  );
}

export function formatFriendlyPageTitle(path: string): string {
  const norm = normalizeTelemetryPath(path);
  if (PAGE_TITLES[norm]) return PAGE_TITLES[norm];
  if (norm.startsWith("/archive/")) {
    const year = norm.slice("/archive/".length);
    return `${year} Workshop Proceedings`;
  }
  return norm;
}

export function sanitizeCampaignSlug(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getOrCreateTabSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const bytes = new Uint8Array(6);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const created = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return "ephemeral";
  }
}

/**
 * Captures `?src=`, `?utm_campaign=`, or `?ref=` on arrival, stores it in cookie-free
 * tab sessionStorage so multi-page journeys retain attribution, and cleans the URL bar
 * via `history.replaceState` while preserving functional query params (`?topic=`, `?token=`, etc.).
 */
export function captureAndCleanCampaignQuery(): string {
  if (typeof window === "undefined") return "";
  try {
    const url = new URL(window.location.href);
    const rawTag =
      url.searchParams.get("src") ||
      url.searchParams.get("utm_campaign") ||
      url.searchParams.get("ref") ||
      "";
    const slug = sanitizeCampaignSlug(rawTag);

    if (slug) {
      window.sessionStorage.setItem(SESSION_CAMPAIGN_STORAGE_KEY, slug);
      // Clean tracking parameters from visible address bar without reloading
      const keysToRemove = [
        "src",
        "utm_campaign",
        "utm_source",
        "utm_medium",
        "utm_content",
        "ref",
      ];
      let mutated = false;
      for (const k of keysToRemove) {
        if (url.searchParams.has(k)) {
          url.searchParams.delete(k);
          mutated = true;
        }
      }
      if (mutated && window.history?.replaceState) {
        const nextSearch = url.searchParams.toString();
        const cleanUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
        window.history.replaceState(window.history.state, "", cleanUrl);
      }
      return slug;
    }

    return window.sessionStorage.getItem(SESSION_CAMPAIGN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function classifyReferrer(): { category: string; host: string } {
  if (typeof window === "undefined") {
    return { category: "Direct", host: "" };
  }

  try {
    const cached = window.sessionStorage.getItem(SESSION_REFERRER_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as { category?: string; host?: string };
      if (parsed.category) {
        return { category: parsed.category, host: parsed.host || "" };
      }
    }

    const ref = document.referrer || "";
    if (!ref) {
      const direct = { category: "Direct", host: "" };
      window.sessionStorage.setItem(SESSION_REFERRER_STORAGE_KEY, JSON.stringify(direct));
      return direct;
    }

    const refUrl = new URL(ref);
    const host = refUrl.hostname.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();
    if (
      host === currentHost ||
      host.endsWith("hems-workshop.org") ||
      host.endsWith(".web.app") ||
      host === "localhost"
    ) {
      const internal = { category: "Direct", host: "" };
      window.sessionStorage.setItem(SESSION_REFERRER_STORAGE_KEY, JSON.stringify(internal));
      return internal;
    }

    let category = host;
    if (host.includes("google.")) category = "Google Search";
    else if (host.includes("bing.") || host.includes("duckduckgo.")) category = "Bing / DuckDuckGo";
    else if (host.includes("linkedin.") || host === "lnkd.in") category = "LinkedIn";
    else if (host.includes("mail.") || host.includes("outlook.")) category = "Webmail Client";
    else if (host.endsWith(".gov") || host.endsWith(".mil")) category = `Government (${host})`;
    else if (host.endsWith(".edu") || host.endsWith(".ac.uk")) category = `Academic (${host})`;

    const result = { category, host };
    window.sessionStorage.setItem(SESSION_REFERRER_STORAGE_KEY, JSON.stringify(result));
    return result;
  } catch {
    return { category: "Direct", host: "" };
  }
}

export function detectDeviceType(): TelemetryDeviceType {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent || "";
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobi|android|iphone|ipod/i.test(ua) || window.innerWidth < 768) return "Mobile";
  return "Desktop";
}

function inferTimezoneRegionFallback(): { country: string; region: string } {
  if (typeof Intl === "undefined") return { country: "Unknown", region: "" };
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (!tz) return { country: "Unknown", region: "" };
    if (tz.startsWith("America/")) {
      const city = tz.split("/")[1]?.replace(/_/g, " ") || "";
      return { country: "Americas", region: city };
    }
    if (tz.startsWith("Europe/")) {
      const city = tz.split("/")[1]?.replace(/_/g, " ") || "";
      return { country: "Europe", region: city };
    }
    if (tz.startsWith("Asia/")) {
      const city = tz.split("/")[1]?.replace(/_/g, " ") || "";
      return { country: "Asia-Pacific", region: city };
    }
    return { country: tz.split("/")[0] || "Unknown", region: "" };
  } catch {
    return { country: "Unknown", region: "" };
  }
}

export async function recordTelemetryEvent(params: {
  eventType: TelemetryEventType;
  path?: string;
  targetLabel?: string;
  user?: { uid?: string; email?: string; name?: string } | null;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (BOT_UA_PATTERN.test(navigator.userAgent || "")) return;

  const normalizedPath = normalizeTelemetryPath(
    params.path || window.location.pathname
  );

  // Skip internal admin/board maintenance screens for page_views so officer dashboard checks don't skew society traffic
  if (
    params.eventType === "page_view" &&
    isInternalPortalManagementRoute(normalizedPath)
  ) {
    return;
  }

  const sessionId = getOrCreateTabSessionId();
  const campaignSlug = captureAndCleanCampaignQuery();
  const { category: referrerCategory, host: referrerHost } = classifyReferrer();
  const deviceType = detectDeviceType();
  const tzFallback = inferTimezoneRegionFallback();
  const nowIso = new Date().toISOString();
  const dateKey = nowIso.slice(0, 10);
  const pageTitle = formatFriendlyPageTitle(normalizedPath);

  const eventPayload: Omit<TelemetryEventRecord, "id"> = {
    eventType: params.eventType,
    path: normalizedPath.slice(0, 160),
    pageTitle: pageTitle.slice(0, 140),
    sessionId: sessionId.slice(0, 64),
    campaignSlug: campaignSlug.slice(0, 80),
    referrerCategory: referrerCategory.slice(0, 48),
    referrerHost: referrerHost.slice(0, 100),
    deviceType,
    country: tzFallback.country.slice(0, 32),
    region: tzFallback.region.slice(0, 40),
    targetLabel: (params.targetLabel || "").trim().slice(0, 160),
    userUid: (params.user?.uid || "").slice(0, 80),
    userEmail: (params.user?.email || "").toLowerCase().slice(0, 160),
    userName: (params.user?.name || "").slice(0, 100),
    dateKey,
    timestamp: nowIso,
    rolledUp: false,
  };

  // 1. Primary Production Path: First-Party Cloud Function `/api/telemetry/event` (only on deployed non-localhost domains)
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocalhost && hasFirebaseKeys) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        } catch {
          // Proceed unauthenticated if token refresh fails
        }
      }
      const res = await fetch("/api/telemetry/event", {
        method: "POST",
        headers,
        body: JSON.stringify(eventPayload),
        keepalive: true,
      });
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        return;
      }
    } catch {
      // Fall through to validated Firestore write-only event stream
    }
  }

  // 2. Live Firestore Write-Only Stream Fallback (`localhost:3000` with `.env.local` or static preview prior to Functions deploy)
  if (hasFirebaseKeys && db) {
    try {
      const { addDoc, collection } = await import("firebase/firestore");
      await addDoc(collection(db, "telemetry_events"), eventPayload);
      return;
    } catch {
      // Silently ignore telemetry write errors so visitor UX is never impacted
    }
  }

  // 3. Offline Mock Mode (`!hasFirebaseKeys`)
  try {
    const raw = window.localStorage.getItem(MOCK_TELEMETRY_STORAGE_KEY) || "[]";
    const list = JSON.parse(raw) as TelemetryEventRecord[];
    const next: TelemetryEventRecord[] = [
      { id: `mock-ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...eventPayload },
      ...list,
    ].slice(0, 500);
    window.localStorage.setItem(MOCK_TELEMETRY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

