# Implementation Plan: Gallery Photo Reloading, `operations` & `treasurer` Whitelist Roles, Operations & Treasurer Portals, and Stripe Setup Guide

**Date:** 2026-11-16  
**Status:** Executing  
**Owners:** `@arch`, `@dev`, `@ops`, `@qa`

## Objectives
1. **Force Browser Reload & Dimension Parity for Tweaked Gallery Photos:**
   - Preserve 100% of `@bo`'s manually edited image files in `src/frontend/public/images/gallery/`.
   - Add `src/frontend/src/utils/galleryAssets.ts` (`galleryImageUrl`) appending exact disk-mtime `?v=<mtime>` cache-busters on gallery `<img>` sources.
   - Sync updated pixel dimensions in `HeroFieldDeploymentsCarousel.tsx` (`verbeck-uav-drone-ms-2025.jpg` `1252x848`, `smith-military-cwa-gcms-2003.jpg` `1195x896`) and update `src/frontend/src/app/about/page.tsx` (`Gemini_Generated_Image_p2l87kp2l87kp2l8.jpeg` `2514x1664`).
2. **Add `"operations"` and `"treasurer"` Roles to the Whitelist System:**
   - Update `whitelistCsv.ts`, `telemetryClient.ts`, `AuthContext.tsx`, `useWhitelistAdmin.ts`, `admin/page.tsx`, `WhitelistExportModal.tsx`, `GoogleAnalyticsTag.tsx`, `robots.ts`, `firestore.rules`, `functions/src/mailing.ts`, and `functions/src/registration.ts`.
3. **Add `Operations Portal` & `Treasurer Portal` Sections to `2027 Workshop Portal`:**
   - Reorganize `(portal)/layout.tsx` to display role-gated `Operations Portal` (`Registrations Console`, `Mailing List`, `Announcements`) and `Treasurer Portal` (`Finances & Stripe`) sections alongside `Workshop Portal`, `Attendee Portal`, `Reviewer Portal`, `Board Portal`, and `Admin Portal`.
   - Expose canonical `/operations/registrations`, `/operations/mailing-list`, and `/operations/announcements` routes while preserving backward-compatible `/board/*` re-exports.
4. **Create Dedicated Treasurer Financial & Stripe Console (`/treasurer`):**
   - Provide money/fee/net tracking, Tier revenue breakdown, live/sandbox Stripe Balance & Payout summary (`get_stripe_summary`), Refund/Cancel workflow with reason logging and attendee-role revocation, Promo & Sponsor code issuance with 1-click presets, visual Stripe Dashboard launchpad & 5-step setup checklist, and 501(c)(3) Form 990 / invoice-aging CSV exports.
5. **Provide Complete Stripe Login, Setup & Visualization Guide:**
   - Document the exact steps for IRS 501(c)(3) Nonprofit fee discount activation (`nonprofit@stripe.com`), US Bank ACH enablement, Firebase Secret Manager keys, webhook registration, and live dashboard visualization.

## Strict Guardrails
- Zero edits to `/source-material/**`, `.agents/rules/**`, `src/frontend/src/data/archives/**`, `src/frontend/src/app/archive/**`, `src/frontend/src/components/archive/**`, or any binary image file inside `src/frontend/public/images/gallery/**`.
- Do not read `docs/logs/thought_trace.md` (append-only).
- Do not touch unrelated review/submission feature changes.

## Verification Plan
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` (exit `0`).
- `npm --prefix functions run build` (exit `0`).
- Python audit confirming all gallery `<img>` paths exist on disk, match exact `(width, height)`, and include `?v=...` cache-busters.
- Node/tsx check verifying `"operations"` and `"treasurer"` role normalization and permission helpers.
- Live HTTP `200` verification across all portal routes and updated gallery image URLs on `http://localhost:3000`.
- Append Addendum 31 to `docs/session_history.md`.
