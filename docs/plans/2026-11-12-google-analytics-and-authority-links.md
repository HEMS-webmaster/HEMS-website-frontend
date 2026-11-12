# Google Analytics 4 (`G-F06RZ8L5CR`) & External Authority Links Plan

**Date:** 2026-11-12  
**Authors:** `@arch`, `@ops`, `@dev`  
**Scope:** Production readiness for Google Analytics 4 (`https://analytics.google.com/`) ahead of domain porting (`www.hems-workshop.org`), plus external console links on `/admin/analytics`.

---

## 1. Audit Findings
- Querying the live `hems-workshop` Firebase project (`firebase apps:sdkconfig WEB --project hems-workshop`) confirmed an active Google Analytics 4 Web Stream Measurement ID: **`G-F06RZ8L5CR`**.
- However, `G-F06RZ8L5CR` was not yet wired into `src/frontend/src/utils/firebase.ts`, `src/frontend/.env.local`, `src/frontend/.env.example`, or `src/frontend/src/app/layout.tsx`, meaning `gtag.js` was not present in the static HTML bundle.

---

## 2. Implementation Architecture

### A. Environment & Firebase SDK Configuration (`@ops` & `@dev`)
- Add `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-F06RZ8L5CR` to `src/frontend/.env.example` and `src/frontend/.env.local`.
- Add `measurementId: "G-F06RZ8L5CR"` to `DEFAULT_FIREBASE_CONFIG` and `firebaseConfig` in `src/frontend/src/utils/firebase.ts` and export `GA_MEASUREMENT_ID`.

### B. GA4 `gtag.js` Script & Campaign-Safe Event Forwarding (`@dev`)
- Create `src/frontend/src/components/telemetry/GoogleAnalyticsTag.tsx` and mount it in `src/frontend/src/app/layout.tsx`:
  - Injects official `https://www.googletagmanager.com/gtag/js?id=G-F06RZ8L5CR` using `next/script` (`strategy="afterInteractive"`), ensuring Google Analytics domain/tag verification immediately detects the tag once `www.hems-workshop.org` DNS resolves to Firebase Hosting.
  - Configures `send_page_view: false` on initialization so Next.js App Router client-side navigations are tracked accurately without duplicate initial page views, and disables hit collection on `localhost` / `127.0.0.1` so local dev work never pollutes society analytics.
- Update `src/frontend/src/utils/telemetryClient.ts` and `src/frontend/src/components/telemetry/TelemetryTracker.tsx`:
  - Capture the raw landing URL **before** `captureAndCleanCampaignQuery()` strips `?utm_*` / `?src=` from the visible browser bar, synthesizing `utm_campaign` when `?src=` is used so GA4 retains full email campaign attribution.
  - Forward non-internal `page_view` events and society conversions (`pdf_download`, `mailing_signup`, `contact_inquiry`, `mailto_click`, `outbound_click`) to `window.gtag` on live domains while continuing to exclude `/admin`, `/board`, and `/reviewer` portal routes.

### C. Website Analytics Portal Quick Links (`@dev`)
- Update `src/frontend/src/app/(portal)/admin/analytics/page.tsx`:
  - Update header eyebrow copy to reflect both First-Party Firestore Telemetry and Google Analytics 4 (`G-F06RZ8L5CR`).
  - Add an **External Analytics & Domain Authority** quick-launch panel directly above the KPI summary cards with 1-click links to:
    1. **Google Analytics Console** (`https://analytics.google.com/`) — labeled with property stream ID `G-F06RZ8L5CR`.
    2. **Ahrefs Website Authority Checker** (`https://ahrefs.com/website-authority-checker/?input=www.hems-workshop.org`) — pre-filled with `www.hems-workshop.org` to inspect Domain Rating (DR) and backlink authority.

