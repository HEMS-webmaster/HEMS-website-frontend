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
exports.telemetryEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const ALLOWED_EVENT_TYPES = new Set([
    "page_view",
    "mailto_click",
    "outbound_click",
    "mailing_signup",
    "pdf_download",
]);
const BOT_USER_AGENT_REGEX = /bot|crawler|spider|headless|proofpoint|mimecast|barracuda|defender|safelinks|curl|wget|python-requests|go-http-client|facebookexternalhit|slackbot|linkedinbot|WhatsApp|preview/i;
function getDb() {
    return admin.firestore();
}
function cleanText(raw, maxLen) {
    return String(raw || "")
        .replace(/[\r\n\t<>]/g, " ")
        .trim()
        .slice(0, maxLen);
}
function cleanSlug(raw) {
    return String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
function encodeMapFieldKey(raw) {
    // Firestore map field paths inside update() or set({merge:true}) must avoid dots/slashes; encode safely
    return raw
        .trim()
        .replace(/\./g, "%2E")
        .replace(/\//g, "%2F")
        .slice(0, 140) || "root";
}
async function resolveOptionalUser(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return null;
    const idToken = authHeader.slice(7).trim();
    if (!idToken)
        return null;
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const userDoc = await getDb().collection("users").doc(decoded.uid).get();
        const profile = userDoc.exists ? userDoc.data() : undefined;
        return {
            uid: decoded.uid,
            email: cleanText(decoded.email || profile?.email || "", 160).toLowerCase(),
            name: cleanText(profile?.name || decoded.name || "", 100),
        };
    }
    catch {
        return null;
    }
}
/**
 * First-Party Cookie-Free Website & Email Campaign Telemetry Collector
 * Route: POST /api/telemetry/event
 *
 * Privacy & Trust Guarantees:
 * - Zero personal IP addresses read or stored.
 * - Coarse country/region derived solely from Google Cloud edge headers (`x-appengine-country`, `x-appengine-region`).
 * - Automated mail-gateway pre-fetch scanners & crawlers filtered out automatically.
 */
exports.telemetryEvent = (0, https_1.onRequest)({ cors: true, region: "us-central1" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ ok: false, error: "Method not allowed" });
        return;
    }
    const userAgent = String(req.headers["user-agent"] || "");
    if (BOT_USER_AGENT_REGEX.test(userAgent)) {
        res.status(202).json({ ok: true, skipped: "bot_filtered" });
        return;
    }
    try {
        const eventTypeRaw = cleanText(req.body?.eventType, 32);
        if (!ALLOWED_EVENT_TYPES.has(eventTypeRaw)) {
            res.status(400).json({ ok: false, error: "Unsupported eventType." });
            return;
        }
        const eventType = eventTypeRaw;
        const rawPath = cleanText(req.body?.path, 160) || "/";
        const normalizedPath = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "") || "/";
        const pageTitle = cleanText(req.body?.pageTitle, 140);
        const sessionId = cleanSlug(req.body?.sessionId).slice(0, 64) || "anon";
        const campaignSlug = cleanSlug(req.body?.campaignSlug);
        const referrerCategory = cleanText(req.body?.referrerCategory, 48) || "Direct";
        const referrerHost = cleanText(req.body?.referrerHost, 100).toLowerCase();
        const deviceTypeRaw = cleanText(req.body?.deviceType, 20);
        const deviceType = deviceTypeRaw === "Mobile" || deviceTypeRaw === "Tablet"
            ? deviceTypeRaw
            : "Desktop";
        const targetLabel = cleanText(req.body?.targetLabel, 160);
        // Coarse Geo from Google Cloud headers (no IP logging)
        const headerCountry = cleanText(req.headers["x-appengine-country"] || req.headers["x-country-code"], 8).toUpperCase();
        const headerRegion = cleanText(req.headers["x-appengine-region"], 16).toUpperCase();
        const country = headerCountry && headerCountry !== "ZZ"
            ? headerCountry
            : cleanText(req.body?.country, 32) || "Unknown";
        const region = headerRegion || cleanText(req.body?.region, 40);
        const verifiedUser = await resolveOptionalUser(req.headers.authorization);
        const now = new Date();
        const timestamp = now.toISOString();
        const dateKey = timestamp.slice(0, 10); // YYYY-MM-DD UTC
        const db = getDb();
        const inc = admin.firestore.FieldValue.increment;
        // 1. Append bounded event record (`rolledUp: true` so client aggregator knows daily counters already include it)
        await db.collection("telemetry_events").add({
            eventType,
            path: normalizedPath,
            pageTitle,
            sessionId,
            campaignSlug,
            referrerCategory,
            referrerHost,
            deviceType,
            country,
            region,
            targetLabel,
            userUid: verifiedUser?.uid || "",
            userEmail: verifiedUser?.email || "",
            userName: verifiedUser?.name || "",
            dateKey,
            timestamp,
            rolledUp: true,
        });
        // 2. Atomic daily rollup (`telemetry_daily/{YYYY-MM-DD}`)
        const isPageView = eventType === "page_view";
        const isConversion = eventType === "mailto_click" ||
            eventType === "outbound_click" ||
            eventType === "mailing_signup";
        const isDownload = eventType === "pdf_download";
        const pathKey = encodeMapFieldKey(normalizedPath);
        const refKey = encodeMapFieldKey(campaignSlug ? `Email: ${campaignSlug}` : referrerCategory);
        const countryKey = encodeMapFieldKey(country);
        const dailyUpdate = {
            dateKey,
            lastUpdatedAt: timestamp,
        };
        if (isPageView) {
            dailyUpdate.totalViews = inc(1);
            dailyUpdate[`pages.${pathKey}`] = inc(1);
            dailyUpdate[`referrers.${refKey}`] = inc(1);
            dailyUpdate[`devices.${deviceType}`] = inc(1);
            dailyUpdate[`countries.${countryKey}`] = inc(1);
            if (campaignSlug) {
                dailyUpdate.campaignViews = inc(1);
                dailyUpdate[`campaigns.${encodeMapFieldKey(campaignSlug)}`] = inc(1);
            }
        }
        else if (isConversion) {
            dailyUpdate.conversions = inc(1);
        }
        else if (isDownload) {
            dailyUpdate.downloads = inc(1);
        }
        const dailyRef = db.collection("telemetry_daily").doc(dateKey);
        await dailyRef.update(dailyUpdate).catch(async () => {
            // Initialize document if first event of the UTC day
            await dailyRef.set({
                dateKey,
                lastUpdatedAt: timestamp,
                totalViews: isPageView ? 1 : 0,
                campaignViews: isPageView && campaignSlug ? 1 : 0,
                conversions: isConversion ? 1 : 0,
                downloads: isDownload ? 1 : 0,
                pages: isPageView ? { [pathKey]: 1 } : {},
                referrers: isPageView ? { [refKey]: 1 } : {},
                devices: isPageView ? { [deviceType]: 1 } : {},
                countries: isPageView ? { [countryKey]: 1 } : {},
                campaigns: isPageView && campaignSlug
                    ? { [encodeMapFieldKey(campaignSlug)]: 1 }
                    : {},
            }, { merge: true });
        });
        // 3. Atomic per-campaign rollup (`telemetry_campaigns/{campaignSlug}`) when attributed to `?src=`
        if (campaignSlug) {
            const campRef = db.collection("telemetry_campaigns").doc(campaignSlug);
            const campUpdate = {
                campaignSlug,
                lastSeenAt: timestamp,
            };
            if (isPageView) {
                campUpdate.views = inc(1);
                campUpdate[`pages.${pathKey}`] = inc(1);
            }
            if (isConversion) {
                campUpdate.conversions = inc(1);
            }
            if (isDownload) {
                campUpdate.downloads = inc(1);
            }
            await campRef.update(campUpdate).catch(async () => {
                await campRef.set({
                    campaignSlug,
                    firstSeenAt: timestamp,
                    lastSeenAt: timestamp,
                    views: isPageView ? 1 : 0,
                    conversions: isConversion ? 1 : 0,
                    downloads: isDownload ? 1 : 0,
                    pages: isPageView ? { [pathKey]: 1 } : {},
                }, { merge: true });
            });
        }
        res.status(200).json({ ok: true });
    }
    catch (err) {
        console.error("[telemetryEvent] Unexpected error:", err);
        res.status(500).json({ ok: false, error: "Telemetry capture error." });
    }
});
//# sourceMappingURL=telemetry.js.map