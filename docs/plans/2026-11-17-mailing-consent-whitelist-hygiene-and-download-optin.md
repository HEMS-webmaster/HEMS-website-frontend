# Architectural Plan: Mailing Consent Enforcement, Whitelist Seat/Refund Hygiene & Voluntary Download Opt-In

**Date:** 2026-11-17  
**Authors:** `@arch`, `@prod`, `@brand`, `@dev`  
**Status:** Completed & Verified (`functions` & `frontend` TypeScript clean, unit tests passing)

---

## 1. Objectives & Scope

Implement all three approved audit improvements across Cloud Functions and the Proceedings Download Gate:

1. **Item #1 — Respect Unchecked `mailingListOptIn` for New Registrants ([`registration.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/registration.ts)):**
   - Prevent `fulfillRegistration` from creating an `active` record in `mailing_subscribers` when a new registrant unchecks *"Include me on the HEMS mailing list"* (`mailingListOptIn === false`).
   - Preserve existing `status` if a prior `mailing_subscribers` record exists, never promoting `unsubscribed`, `pending_opt_in`, `bounced`, or `complained` to `active` without explicit opt-in.
   - Tailor `buildReceiptEmailHtml` so the receipt email mentions the mailing list cohort tag only when `reg.mailingListOptIn === true`.

2. **Item #2 — Multi-Seat-Safe Whitelist & Sublist Hygiene on Transfers & External Stripe Refunds ([`registration.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/registration.ts)):**
   - Introduce `revokeAttendeeAccessIfNoActiveSeat(...)`, which verifies whether `email` still holds any other `paid` or `comped` registration for `workshopYear` before revoking:
     - `"attendee"` (and `"corporate sponsor"` when no active sponsor seat remains) + `workshopYear` on `whitelist/{email}` (preserving `board`, `reviewer`, `operations`, `treasurer`, `admin`, `submitter`, and `webmaster@hems-workshop.org`), automatically syncing `users/{uid}` via `syncWhitelistToUserV2`.
     - `"${workshopYear} Attendees"` (and `"${workshopYear} Corporate Sponsors"`) cohort sublist tags on `mailing_subscribers/{emailDocId}`.
   - Wire `revokeAttendeeAccessIfNoActiveSeat` into:
     1. `refund_or_cancel` (Treasurer Console),
     2. `charge.refunded` (Stripe Dashboard webhook), and
     3. `transfer_seat` (Operations Console, when transferring from `fromEmail` to a different `toEmail`, while also respecting `mailingListOptIn` / suppression status on `toEmail`).

3. **Item #3 — Voluntary Double-Opt-In Newsletter Signup in [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx):**
   - Extract reusable [`mailingClient.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/mailingClient.ts) (`submitPublicMailingSignup`) used by both [`MailingListSignupCard.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/MailingListSignupCard.tsx) and [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx).
   - Add an **unchecked** opt-in checkbox (`Also send me biennial HEMS Call for Papers & Student Travel Award announcements`) inside `DownloadGate.tsx` (firing Double Opt-In on both 1-Click Email Link and Google/Microsoft OAuth sign-ins when checked), plus a 1-click voluntary subscribe button on the `"Proceedings Ready"` modal if not already checked.

---

## 2. Verification Gates (`@qa`)
1. `npm --prefix functions run build` (`tsc` across Cloud Functions v2 — `0` errors).
2. `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` (`0` errors).
3. Unit test assertions covering Items #1, #2, and #3 (`tests/unit/mailingAndWhitelistHygiene.test.mjs`).
4. `npm --prefix src/frontend run build` (`53/53` static routes exported cleanly).
