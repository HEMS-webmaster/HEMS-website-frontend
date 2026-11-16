"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetCircuitBreaker = void 0;
exports.parseBudgetPubSubPayload = parseBudgetPubSubPayload;
exports.evaluateCircuitBreakerDecision = evaluateCircuitBreakerDecision;
exports.stripPublicReadFromIamPolicy = stripPublicReadFromIamPolicy;
const pubsub_1 = require("firebase-functions/v2/pubsub");
const admin = __importStar(require("firebase-admin"));
const BUDGET_ALERTS_TOPIC = "billing-budget-alerts";
const ARCHIVE_BUCKET_NAME = (process.env.HEMS_ARCHIVE_BUCKET || "hems-workshop-archives").trim();
const DEFAULT_CUTOFF_USD = 7.5;
const EXPECTED_BUDGET_ID = (process.env.HEMS_BILLING_BUDGET_ID || "8e66a672-bc09-401c-bf59-6f5c98bdf1e4").trim();
const PUBLIC_IAM_MEMBERS = new Set(["allUsers", "allAuthenticatedUsers"]);
const PUBLIC_READ_ROLES = new Set([
    "roles/storage.objectViewer",
    "roles/storage.legacyObjectReader",
    "roles/storage.objectAdmin",
    "roles/storage.admin",
]);
function getCutoffUsd() {
    const raw = Number.parseFloat(process.env.HEMS_ARCHIVE_CUTOFF_USD || "");
    if (Number.isFinite(raw) && raw > 0)
        return raw;
    return DEFAULT_CUTOFF_USD;
}
/**
 * Safely normalizes Google Cloud Billing Budget Pub/Sub notification payloads (v1.0 schema).
 */
function parseBudgetPubSubPayload(rawJson) {
    if (!rawJson || typeof rawJson !== "object")
        return null;
    const obj = rawJson;
    const costAmount = typeof obj.costAmount === "number"
        ? obj.costAmount
        : Number.parseFloat(String(obj.costAmount ?? ""));
    if (!Number.isFinite(costAmount))
        return null;
    const budgetAmountRaw = typeof obj.budgetAmount === "number"
        ? obj.budgetAmount
        : Number.parseFloat(String(obj.budgetAmount ?? "0"));
    return {
        budgetDisplayName: String(obj.budgetDisplayName || "HEMS Billing Budget").trim(),
        costAmount,
        budgetAmount: Number.isFinite(budgetAmountRaw) ? budgetAmountRaw : 0,
        currencyCode: String(obj.currencyCode || "USD").trim().toUpperCase(),
        costIntervalStart: String(obj.costIntervalStart || new Date().toISOString().slice(0, 7)).trim(),
        alertThresholdExceeded: typeof obj.alertThresholdExceeded === "number"
            ? obj.alertThresholdExceeded
            : undefined,
        forecastThresholdExceeded: typeof obj.forecastThresholdExceeded === "number"
            ? obj.forecastThresholdExceeded
            : undefined,
    };
}
/**
 * Evaluates whether public GCS archive access should be revoked.
 * Only trips on actual incurred spend >= cutoffUsd (ignores forecast-only spikes)
 * and enforces per-interval idempotency across 20-minute repeat Pub/Sub pings.
 */
function evaluateCircuitBreakerDecision(payload, cutoffUsd, existingState) {
    if (payload.costAmount < cutoffUsd) {
        return { shouldTrip: false, reason: "below_cutoff" };
    }
    if (existingState?.publicAccessRevoked === true &&
        existingState?.trippedInterval === payload.costIntervalStart) {
        return { shouldTrip: false, reason: "already_tripped_for_interval" };
    }
    return { shouldTrip: true, reason: "actual_cost_exceeded_cutoff" };
}
/**
 * Strips `allUsers` and `allAuthenticatedUsers` read bindings from a GCS IAM policy
 * while preserving service-account, admin, project-owner bindings, `etag`, and `version`.
 */
function stripPublicReadFromIamPolicy(policy) {
    const bindings = Array.isArray(policy.bindings) ? policy.bindings : [];
    const nextBindings = [];
    const removedBindings = [];
    let changed = false;
    for (const binding of bindings) {
        const members = Array.isArray(binding.members) ? binding.members : [];
        const shouldInspectRole = PUBLIC_READ_ROLES.has(binding.role) ||
            members.some((m) => m === "allUsers");
        if (!shouldInspectRole) {
            nextBindings.push(binding);
            continue;
        }
        const stripped = members.filter((m) => PUBLIC_IAM_MEMBERS.has(m));
        const kept = members.filter((m) => !PUBLIC_IAM_MEMBERS.has(m));
        if (stripped.length > 0) {
            changed = true;
            removedBindings.push({
                role: binding.role,
                members: stripped,
                ...(binding.condition ? { condition: binding.condition } : {}),
            });
        }
        if (kept.length > 0) {
            nextBindings.push({
                ...binding,
                members: kept,
            });
        }
    }
    return {
        updatedPolicy: {
            ...policy,
            bindings: nextBindings,
        },
        removedBindings,
        changed,
    };
}
async function revokePublicGcsAccess(bucketName) {
    const tokenObj = await admin.credential.applicationDefault().getAccessToken();
    const accessToken = tokenObj?.access_token;
    if (!accessToken) {
        throw new Error("Application default credentials returned no OAuth2 token.");
    }
    const encodedBucket = encodeURIComponent(bucketName);
    const getRes = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodedBucket}/iam?optionsRequestedPolicyVersion=3`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
    });
    if (!getRes.ok) {
        const errText = await getRes.text();
        throw new Error(`GCS getIamPolicy failed (${getRes.status}): ${errText}`);
    }
    const currentPolicy = (await getRes.json());
    const { updatedPolicy, removedBindings, changed } = stripPublicReadFromIamPolicy(currentPolicy);
    if (changed) {
        const putRes = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodedBucket}/iam`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedPolicy),
            signal: AbortSignal.timeout(10_000),
        });
        if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GCS setIamPolicy failed (${putRes.status}): ${errText}`);
        }
    }
    return { changed, removedBindings };
}
async function sendCircuitBreakerAlertEmail(params) {
    const serverToken = (process.env.POSTMARK_SERVER_TOKEN || "").trim();
    if (!serverToken)
        return;
    const recipient = (process.env.HEMS_WEBMASTER_EMAIL || "webmaster@hems-workshop.org").trim();
    const fromAddr = process.env.POSTMARK_FROM_TRANSACTIONAL ||
        "HEMS Society <announcements@mail.hems-workshop.org>";
    const subject = `[HEMS ACTION NOTICE] Archive Public Access Paused at $${params.costAmount.toFixed(2)} ${params.currencyCode}`;
    const textBody = [
        "HEMS Google Cloud Billing Archive Circuit Breaker Engaged",
        "",
        `Bucket Paused: gs://${params.bucketName}`,
        `Actual Monthly Spend: $${params.costAmount.toFixed(2)} ${params.currencyCode} (Cutoff: $${params.cutoffUsd.toFixed(2)})`,
        `Billing Interval: ${params.intervalStart}`,
        `Budget ID: ${params.budgetId}`,
        `Removed Public Bindings: ${JSON.stringify(params.removedBindings)}`,
        "",
        "What remains online:",
        "- Main HEMS website, portal logins, Firestore, and 2027 Workshop Registration stay 100% online.",
        "- Only unauthenticated public GCS PDF downloads on hems-workshop-archives were paused to stop runaway egress.",
        "",
        "To restore public Google Scholar access once billing traffic is reviewed:",
        "  powershell -ExecutionPolicy Bypass -File infrastructure\\manage-archive-circuit-breaker.ps1 -Action restore-public",
    ].join("\n");
    const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": serverToken,
        },
        body: JSON.stringify({
            From: fromAddr,
            To: recipient,
            Subject: subject,
            TextBody: textBody,
            MessageStream: process.env.POSTMARK_TRANSACTIONAL_STREAM || "outbound",
            TrackOpens: false,
            TrackLinks: "None",
        }),
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
        const errText = await res.text();
        console.error(`[budgetCircuitBreaker] Alert email failed (${res.status}): ${errText}`);
    }
}
/**
 * Automated GCS Public Archive Circuit Breaker subscribed to `billing-budget-alerts`.
 * Trips when actual spend crosses HEMS_ARCHIVE_CUTOFF_USD (default $7.50 = 150% of $5 budget),
 * revoking unauthenticated `allUsers` access on `gs://hems-workshop-archives` while leaving
 * the main website, portals, Firestore, and Stripe registration online.
 */
exports.budgetCircuitBreaker = (0, pubsub_1.onMessagePublished)({
    topic: BUDGET_ALERTS_TOPIC,
    region: "us-central1",
    maxInstances: 2,
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (event) => {
    const msg = event.data?.message;
    let rawPayload = msg?.json;
    if (!rawPayload && typeof msg?.data === "string" && msg.data.length > 0) {
        try {
            rawPayload = JSON.parse(Buffer.from(msg.data, "base64").toString("utf8"));
        }
        catch (err) {
            console.warn("[budgetCircuitBreaker] Failed to decode Pub/Sub message data:", err);
            return;
        }
    }
    const parsed = parseBudgetPubSubPayload(rawPayload);
    if (!parsed) {
        console.warn("[budgetCircuitBreaker] Received non-budget or malformed payload; skipping.");
        return;
    }
    const cutoffUsd = getCutoffUsd();
    const budgetId = String(msg?.attributes?.budgetId || EXPECTED_BUDGET_ID).trim();
    const db = admin.firestore();
    const stateRef = db.collection("system_alerts").doc("budget_circuit_breaker");
    const existingSnap = await stateRef.get();
    const existingState = existingSnap.exists
        ? existingSnap.data()
        : null;
    const nowIso = new Date().toISOString();
    const decision = evaluateCircuitBreakerDecision(parsed, cutoffUsd, existingState);
    await stateRef.set({
        budgetId,
        budgetDisplayName: parsed.budgetDisplayName,
        bucketName: ARCHIVE_BUCKET_NAME,
        cutoffUsd,
        lastHeartbeatAt: nowIso,
        lastCostAmount: parsed.costAmount,
        lastBudgetAmount: parsed.budgetAmount,
        lastCurrencyCode: parsed.currencyCode,
        lastIntervalStart: parsed.costIntervalStart,
        lastDecisionReason: decision.reason,
        ...(parsed.alertThresholdExceeded !== undefined
            ? { lastAlertThresholdExceeded: parsed.alertThresholdExceeded }
            : {}),
        ...(parsed.forecastThresholdExceeded !== undefined
            ? { lastForecastThresholdExceeded: parsed.forecastThresholdExceeded }
            : {}),
    }, { merge: true });
    if (!decision.shouldTrip) {
        console.log(`[budgetCircuitBreaker] Heartbeat OK (cost=$${parsed.costAmount.toFixed(2)}, cutoff=$${cutoffUsd.toFixed(2)}, decision=${decision.reason}).`);
        return;
    }
    console.warn(`[budgetCircuitBreaker] TRIPPING circuit breaker for gs://${ARCHIVE_BUCKET_NAME}! Actual cost=$${parsed.costAmount.toFixed(2)} >= $${cutoffUsd.toFixed(2)}.`);
    const revokeRes = await revokePublicGcsAccess(ARCHIVE_BUCKET_NAME);
    await stateRef.set({
        publicAccessRevoked: true,
        trippedAt: nowIso,
        trippedInterval: parsed.costIntervalStart,
        trippedCostAmount: parsed.costAmount,
        removedBindings: revokeRes.removedBindings,
        iamPolicyMutated: revokeRes.changed,
        restoreCommand: "powershell -ExecutionPolicy Bypass -File infrastructure\\manage-archive-circuit-breaker.ps1 -Action restore-public",
    }, { merge: true });
    await sendCircuitBreakerAlertEmail({
        bucketName: ARCHIVE_BUCKET_NAME,
        costAmount: parsed.costAmount,
        currencyCode: parsed.currencyCode,
        cutoffUsd,
        budgetId,
        intervalStart: parsed.costIntervalStart,
        removedBindings: revokeRes.removedBindings,
    });
});
//# sourceMappingURL=budgetCircuitBreaker.js.map