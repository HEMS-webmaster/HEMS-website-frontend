# Architectural Plan: Site-Wide Inline Mailing List Capture Across All Four High-Intent Surfaces

**Date:** 2026-11-17  
**Authors:** `@brand` (`@web`), `@prod`, `@arch`, `@dev`  
**Status:** Completed & Verified (`53/53` static routes built, all 7 surfaces verified)

---

## 1. Purpose & Design Principles

During the ~18-month inter-workshop window between biennial HEMS symposia, capturing researcher emails for **Call for Papers**, **Registration Opening**, **Host Venue & Room Block**, and **Student Travel Awards** is the platform's primary conversion goal.

All new touchpoints share a single Brand v3.2 component—[`InlineMailingSignup.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/InlineMailingSignup.tsx)—governed by five strict guardrails:
1. **100% Double Opt-In & Bot-Protected:** Routes through [`mailingClient.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/mailingClient.ts) (`/api/mailing/subscribe` with static-preview fallback and hidden honeypot).
2. **Per-Surface Telemetry Attribution:** Passes a distinct `sourceLabel` (`"Homepage Spotlight"`, `"Registration Closed Alert"`, `"CFP Sidebar Alert"`, `"Student Awards Alert"`, `"Accommodations Venue Alert"`, `"Archive Hub Banner"`, `"Global Footer"`) into `recordTelemetryEvent("mailing_signup")` so Board & Operations Officers can see which pages drive signups in `/admin/analytics`.
3. **Authenticated 1-Click Pre-Fill:** Automatically pre-fills `user.email` (and name) if a visitor is already signed in from downloading proceedings.
4. **Cycle-Aware Conditional Visibility:** Closed-window alerts on `/registration`, `/call-for-papers`, `/student-awards`, `/accommodations`, and `/` automatically step aside as soon as that cycle window opens in `/admin/workshop-settings`.
5. **Print & Archive Safety:** Marked `print:hidden` (preserving 1-page printable flyers/receipts) and zero modifications to locked `/archive/[year]` routes.

---

## 2. Four Deployment Surfaces

1. **Closed-Window Workshop Pages (`variant="card"`):**
   - [`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx): Embedded inside the closed-registration status card (`!schedule.isOpen && schedule.phase !== "concluded_closed"`).
   - [`CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx): Placed in the right submission-dates column when `!workshop.cfp_open`.
   - [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx): Placed below the Web Hero card (`!isPrintView && !workshop.cfp_open`), pre-tagged `["student_awards", "workshop"]`.
   - [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx): Embedded inside the unconfirmed lodging sidebar card (`!workshop.venue_confirmed`).
2. **Homepage `16th HEMS Workshop` Spotlight (`variant="compact"`):**
   - [`UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx): Sleek 1-line capture row inside the Hero spotlight card while `workshop.cycle_stage !== "open"`.
3. **Proceedings Archive Search Hub (`variant="card"`):**
   - [`ArchiveHubClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/archive/ArchiveHubClient.tsx): Scholarly CFP & upcoming-workshop alert strip at the bottom of `/archive`.
4. **Global Footer (`variant="footer"`):**
   - [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx): Compact 1-line inline subscribe box in Column 1 across every page (auto-hiding on `/contact` and `/unsubscribe` to prevent duplicate forms).

---

## 3. Verification Gates (`@qa`)
1. `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` (`0` errors).
2. Unit assertions in `tests/unit/mailingAndWhitelistHygiene.test.mjs` verifying `<InlineMailingSignup` wiring across all 7 target components and `0` mutations to `/archive/[year]`.
3. `npm --prefix src/frontend run build` (`53/53` static routes built cleanly).
