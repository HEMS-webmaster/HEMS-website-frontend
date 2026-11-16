# Implementation Plan: Permanent `webmaster@hems-workshop.org` Admin Lock & Strict 1-to-1 Isolation for `Operations Portal` and `Treasurer Portal`

**Date:** 2026-11-16  
**Status:** Executing  
**Owners:** `@arch`, `@web`, `@dev`, `@ops`, `@qa`

## Objectives
1. **Guarantee `webmaster@hems-workshop.org` Permanently Holds `'admin'` (`'administration'`) on the Whitelist:**
   - Map `"administration"` -> `"admin"` across [`whitelistCsv.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/whitelistCsv.ts), [`telemetryClient.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/telemetryClient.ts), [`firestore.rules`](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules), and [`functions/src/registration.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/registration.ts).
   - Seed and self-heal `webmaster@hems-workshop.org` with `"admin"` across [`useWhitelistAdmin.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useWhitelistAdmin.ts), [`AuthContext.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/context/AuthContext.tsx), and [`functions/src/index.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/index.ts), and block deleting `webmaster@hems-workshop.org` or removing its `"admin"` role via CSV overwrite, bulk role removal, UI toggles, or Firestore rules ([`admin/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/page.tsx)).
2. **Enforce Strict 1-to-1 Portal & Page Access Isolation (`operations` vs `treasurer`):**
   - Users with `'operations'` have access to `Operations Portal` webpages (`/operations/registrations`, `/operations/mailing-list`, `/operations/announcements`) — and **only** those users can open those pages.
   - Users with `'treasurer'` have access to `Treasurer Portal` (`/treasurer`) — and **only** those users can open that page.
   - Neither `board` nor `admin` inherits access to `Operations Portal` or `Treasurer Portal` unless `'operations'` or `'treasurer'` is explicitly assigned on the whitelist.

## Strict Guardrails
- Zero modifications to `/source-material/**`, `.agents/rules/**`, `src/frontend/src/data/archives/**`, `src/frontend/public/images/gallery/**`, or unrelated reviewer/abstract submission files (`reviewer/page.tsx`, `useAbstractSubmissions.ts`, `abstractReviewMetrics.ts`).
- Append-only SCoT logging to `docs/logs/thought_trace.md` (never read).

## Verification Plan
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` (exit `0`).
- `npm --prefix functions run build` (exit `0`).
- Node/TypeScript assertion matrix testing `"administration"` alias, `webmaster@hems-workshop.org` overwrite/delete immunity, and strict 1-to-1 isolation across `["operations"]`, `["treasurer"]`, `["board"]`, `["admin"]`, `["reviewer"]`, `["attendee"]`.
- Live HTTP `200` checks across `/admin/`, `/operations/registrations/`, `/operations/mailing-list/`, `/operations/announcements/`, `/treasurer/`, and `/board/` on `http://localhost:3000`.
- Append Addendum 32 to `docs/session_history.md`.
