# Implementation Plan: First-Party Website Telemetry, Automatic `?src=` Email Attribution & Expanded Analytics Suite

**Date:** 2026-11-12  
**Owner:** `@arch` (System Architect), `@ops` (DevSecOps & SRE), `@dev` (Lead Developer), `@qa` (QA)  
**Approved Scope (`@bo`):** Items 1–3 (First-Party Telemetry Pipeline, Automatic `?src=` Tagging in `/board/announcements`, and Extensive Analytics Dashboard on `/admin/analytics` with Board + Admin visibility; deferring `/go/<slug>` Short-Link Manager for now). Explicit `locksrules.md` Rule #6 override granted for `firestore.rules`, `firebase.json`, and `functions/src/`.

---

## 1. Objectives & Trust Guarantees

1. **100% `.gov` / `.edu` Email & URL Trust Preserved:**
   - Postmark `TrackOpens: false` and `TrackLinks: "None"` remain strictly enforced.
   - Outbound links in HEMS announcements point directly to canonical `https://hems-workshop.org/...` pages (`200 OK`, zero redirect hops) with a clean first-party query parameter (`?src=<campaign-slug>`), automatically stripped from the browser address bar after arrival via `history.replaceState()`.
2. **Ad-Blocker-Proof, Cookie-Free First-Party Telemetry:**
   - Events are sent to `/api/telemetry/event` on `hems-workshop.org` (with seamless live-Firestore write-only fallback for `localhost:3000` and pre-cutover previews, plus `localStorage` sandbox fallback offline).
   - Visible-tab gating (`document.visibilityState === "visible"`) and User-Agent bot filtering exclude Proofpoint/Mimecast/Defender security pre-fetches so campaign metrics reflect real human readers.
   - Coarse geography (`country`, `region`) is captured via Google Cloud's `x-appengine-country` / `x-appengine-region` headers (or browser timezone region fallback in local dev) **without storing personal IP addresses or third-party cookies**.
3. **"Which Pages, When, and By Whom" Analytics Suite:**
   - Upgrades `/admin/analytics` (and opens read access to signed-in `board` members alongside `admin`) with 6 executive KPIs, a visual daily traffic & email-arrival timeline, 5 sortable tabs (*Pages & Content*, *Email Campaigns & Sources*, *Live Activity Stream*, *Registered Members*, *Proceedings Downloads*), device/region breakdowns, and CSV export.

---

## 2. Planned File Changes

1. **Backend & Security Rules (`@ops`):**
   - [`firestore.rules`](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules): Allow `isBoardOrAdmin` read access on `users` (list), `downloads`, `telemetry_daily`, `telemetry_campaigns`, and `telemetry_events`; allow schema-validated write-only `create` (`rolledUp == false`) on `telemetry_events`.
   - [`firebase.json`](file:///c:/AntigravityP1_2/HEMS-website/firebase.json): Rewrite `/api/telemetry/event` to `telemetryEvent` (`us-central1`).
   - [`functions/src/telemetry.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/telemetry.ts) & [`functions/src/index.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/index.ts): First-party Cloud Function collector with bot filtering, AppEngine geo headers, atomic daily/campaign counters (`telemetry_daily`, `telemetry_campaigns`), and `telemetry_events` (`rolledUp: true`).
   - [`functions/src/mailing.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/mailing.ts): Server-side `sublist:<Name>` matching, `?src=<campaignSlug>` auto-tagging on `hems-workshop.org` links (excluding `/unsubscribe`), and `campaignSlug` persistence on `mailing_campaigns`.
2. **Frontend Telemetry & Attribution (`@dev`):**
   - [`src/frontend/src/types/telemetry.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/types/telemetry.ts): Strict TypeScript contracts for events, rollups, and analytics aggregations.
   - [`src/frontend/src/utils/telemetryClient.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/telemetryClient.ts): Ephemeral `sessionStorage` session manager, `?src=` capture & URL cleanup, referrer classifier, and dual Cloud Function / Firestore event emitter.
   - [`src/frontend/src/components/telemetry/TelemetryTracker.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/telemetry/TelemetryTracker.tsx) & [`src/frontend/src/app/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx): Global visible-tab page-view and `mailto:` / outbound CTA click listener with authenticated user identity binding.
   - [`src/frontend/src/components/DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx) & [`src/frontend/src/components/mailing/MailingListSignupCard.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/MailingListSignupCard.tsx): Emit `pdf_download` and `mailing_signup` conversion telemetry tied to session/campaign context.
   - [`src/frontend/src/types/mailing.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/types/mailing.ts), [`src/frontend/src/utils/mailingTemplate.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/mailingTemplate.ts), [`src/frontend/src/hooks/useMailingAdmin.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useMailingAdmin.ts), and [`src/frontend/src/app/(portal)/board/announcements/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/announcements/page.tsx): Auto-generated editable `campaignSlug` (`?src=`), live tagged preview, and live campaign visit/conversion counters in the Broadcast Audit Log.
3. **Expanded Analytics UI & Portal Navigation (`@dev`):**
   - [`src/frontend/src/hooks/useSiteAnalytics.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useSiteAnalytics.ts): Custom hook aggregating `telemetry_daily`, `telemetry_campaigns`, `telemetry_events`, `users`, `downloads`, and `mailing_campaigns`.
   - [`src/frontend/src/app/(portal)/admin/analytics/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/analytics/page.tsx): Full 5-tab analytics dashboard with visual timeline, column sorting, search/filtering, and CSV export.
   - [`src/frontend/src/app/(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx), [`src/frontend/src/app/(portal)/board/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/page.tsx), and [`src/frontend/src/components/mailing/MailingSystemInfoModal.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/MailingSystemInfoModal.tsx): Expose Website & Campaign Analytics to Board Members and document `?src=` first-party attribution in the in-app guide.

---

## 3. Verification Plan (`@qa`, `@ops`)

1. Run `npm --prefix functions run build` to verify `0` TypeScript errors across Cloud Functions (`telemetry.ts`, `mailing.ts`, `index.ts`).
2. Run `npm --prefix src/frontend run build` to verify `0` TypeScript/Next.js errors across all `43/43` static pages.
3. Restart `next dev` on `http://localhost:3000` and confirm clean compilation.

