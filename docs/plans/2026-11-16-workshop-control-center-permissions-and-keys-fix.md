# Plan: Fix Workshop Control Center Firestore Permissions & Next.js DevTools "2 Issues"

- **Date:** 2026-11-16 (Addendum 42)
- **Owners:** `@ops`, `@dev`, `@qa`

## Root Causes Diagnosed
1. **`Missing or insufficient permissions.` (`@ops`):** `localhost:3000` connects to live Firebase (`Firestore Live Sync` via `.env.local`), and the `site_config`, `site_config_previews`, and `site_config_history` rules added to [`firestore.rules`](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules) had not been deployed to project `hems-workshop`.
2. **`2 Issues` in Next.js DevTools (`@dev`):** Duplicate React keys `reg_student_early_fee-/registration` and `reg_professional_early_fee-/registration` in [`WorkshopSettingsConsole.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/admin/WorkshopSettingsConsole.tsx) line 772 because two `usedOnPages` badges (`Registration` and `Stripe Checkout`) share `href: "/registration"`.

## Fixes
1. Include `pageRef.label` and `pageIdx` in the React key for `field.usedOnPages.map(...)` in `WorkshopSettingsConsole.tsx`.
2. Split `isAdmin(userId)` into a short-circuiting helper + `hasStoredAdminRole(userId)` in `firestore.rules` so verified `webmaster@hems-workshop.org` avoids unnecessary `get()` quota calls during multi-doc `writeBatch` operations, then deploy rules live via `npx firebase deploy --only firestore:rules`.
3. Verify `tsc --noEmit`, `tests/unit/upcomingWorkshopCsv.test.mjs`, and `HTTP 200` on `http://localhost:3000/admin/workshop-settings/`.
