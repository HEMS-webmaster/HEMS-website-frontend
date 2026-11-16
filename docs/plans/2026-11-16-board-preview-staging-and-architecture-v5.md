# Implementation Plan — Addendum 38: Post-Launch Board Review Staging Pipeline & Architecture Specification v5.0

**Date:** 2026-11-16  
**Leads:** `@ops` (preview channel CLI & rollback pipeline), `@dev` (preview banner, analytics/telemetry isolation, `?sheet=static` override), `@arch` (`docs/system_design_architecture.html` v5.0 & governance), `@qa` (verification)

## 1. Board Review Staging Workflow (`Zero Risk to Live hems-workshop.org`)

Because `.github/workflows/firebase-hosting-merge.yml` automatically deploys every push to `origin/main` directly to live `hems-workshop.org`, post-launch Board reviews use **unlisted 14-day Firebase Hosting Preview Channels** managed by [`manage-board-preview.ps1`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/manage-board-preview.ps1):

1. **Draft & Stage:** Edit on a feature/review branch (never pushing unfinished work to `origin/main`), then deploy to a private unlisted channel (`https://hems-workshop--board-review-<hash>.web.app`). Pass `-UseLocalWorkshopJson` (or append `?sheet=static`) when testing changes to `upcoming_workshop.json` without editing the live Google Sheet.
2. **Board Review Isolation:** Preview channel hostnames (`*--*.web.app` / `*--*.firebaseapp.com`) automatically:
   - Inject `<meta name="robots" content="noindex, nofollow" />`.
   - Disable GA4 (`G-F06RZ8L5CR`) and first-party `telemetry_events` writes.
   - Display [`PreviewChannelBanner.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/telemetry/PreviewChannelBanner.tsx) with a 1-click **Compare with Live Page** button.
3. **Atomic Promotion & 1-Second Rollback:** After Board sign-off, `manage-board-preview.ps1 -Action promote` snapshots current `live` to `pre-promote-backup` and atomically promotes the exact reviewed artifact via `firebase hosting:clone` (`hems-workshop:board-review` -> `hems-workshop:live`), then clean up with `-Action delete` and merge to `main`.

## 2. Architecture Specification v5.0 ([`system_design_architecture.html`](file:///c:/AntigravityP1_2/HEMS-website/docs/system_design_architecture.html))

Upgrades the master HTML engineering specification from v4.0 (`2026-11-10`) to **v5.0 (`2026-11-16`)** across 12 interactive sections covering every feature, Cloud Function (`14` total), Firestore collection (`19` total), RBAC boundary (`6` portals / `10` roles), free-tier budget circuit breaker, and Board preview workflow added through Addendum 38.
