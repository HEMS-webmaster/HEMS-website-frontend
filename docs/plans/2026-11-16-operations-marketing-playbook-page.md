# Implementation Plan: Operations Portal Marketing Playbook Webpage (Addendum 33)

**Date:** 2026-11-16  
**Authors:** `@arch`, `@web`, `@dev`, `@qa`  
**Status:** Approved / Implementing  
**Source Document:** `docs/marketing/hems_2027_marketing_and_ads_playbook.html`

## 1. Objective
Embed the complete **16th HEMS Workshop Online Advertising & Volunteer Multiplier Playbook** (`docs/marketing/hems_2027_marketing_and_ads_playbook.html`) inside a native, interactive **Operations Portal** webpage at `/operations/marketing-playbook`, enforcing strict `'operations'`-only whitelist RBAC (per Addendum 32) and integrating navigation across all portal entry points.

## 2. Architecture & Security Design
- **Strict RBAC Gate (`src/frontend/src/app/(portal)/operations/marketing-playbook/page.tsx`):**
  - Client component gated exclusively by `hasOperationsRole(user.roles)`.
  - Unauthorized or unauthenticated visitors receive the standard `Operations Access Required` guard card without mounting playbook data.
  - Because `hems_2027_marketing_and_ads_playbook.html` contains internal strategy, committee guidance, and ad-spend modeling, content is bundled inside TypeScript data/components rather than placed as a public static HTML asset in `src/frontend/public/`.
  - Inherited `/operations/` protections: `buildNoIndexMetadata` in `operations/layout.tsx`, `robots.ts` disallow rule, GA4 suppression in `GoogleAnalyticsTag.tsx`, and internal portal telemetry exclusion in `telemetryClient.ts`.
- **Internal Cross-Link Hygiene:**
  - Legacy `/board/mailing-list` and `/board/announcements` references in the playbook copy are routed directly to `/operations/mailing-list` and `/operations/announcements`.
  - References to `/admin/analytics` render as clickable links only when `hasBoardRole(user.roles)` is true (`canViewBoardAnalytics`), rendering as plain code/reference text for `'operations'`-only users to avoid dead-end 403 views.
- **Responsive Mobile/Desktop & Print Layout:**
  - Top jump-nav + progress toolbar sits inline on mobile (`< 1024px`) so it does not stack atop the mobile portal horizontal strip, becoming sticky (`lg:sticky lg:top-[76px] lg:z-20`) on desktop viewports.
  - Print styles (`@media print`) expand all tabbed campaign panels, hide copy/toolbar chrome, and preserve clean contrast for committee PDF handouts.

## 3. Target Files
- `src/frontend/src/data/marketingPlaybookData.ts` *(new)* — Structured typed data holding all 4 Google Ad Grant campaigns, Negative Keyword Shield, 3 LinkedIn 21-day ad bursts, 6 society calendar directories + copy blurbs, 6 monthly archive spotlight LinkedIn drafts, Sponsor & Speaker promo kits, 40-department grad coordinator cluster roster + forwarding template, 5-method on-site ad/host matrix, 5-phase 12-month roadmap, 8 UTM preset links, and 20-item Track A / Track B checklist.
- `src/frontend/src/components/operations/MarketingPlaybookContent.tsx` *(new)* — Complete scoped Brand Spec v3.2.0 layout featuring the KPI cards, 5-slider Media Value & Break-Even Simulator, tabbed ad/archive/host showcases, one-click clipboard copy with `"Copied ✓"` feedback, and persistent `localStorage` (`hems_2027_marketing_checklist_v1`) checklist.
- `src/frontend/src/app/(portal)/operations/marketing-playbook/page.tsx` *(new)* — Role-gated Operations Portal page.
- `src/frontend/src/app/(portal)/layout.tsx` *(edit)* — Append `Marketing Playbook` (`Megaphone`) to `operationsPortalLinks`.
- `src/frontend/src/components/layout/Navbar.tsx` *(edit)* — Add `Marketing Playbook` links to `hasOperationsRole` desktop dropdown and mobile drawer.
- `src/frontend/src/app/(portal)/board/page.tsx` *(edit)* — Add `Marketing Playbook` card inside `{canViewOperations && ...}`.
- `src/frontend/src/app/(portal)/operations/layout.tsx` *(edit)* — Refine no-index metadata description to reflect logistics and marketing console.

## 4. Verification Plan
1. `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exits `0`.
2. `http://localhost:3000/operations/marketing-playbook/` returns HTTP `200` on the running `next dev` server.
3. Live Chromium browser verification via `browser` subagent confirming:
   - Role isolation (`operations` sees link & renders full interactive playbook; `general`, `treasurer`, `board` without `operations` see `Operations Access Required` and do not see `Operations Portal -> Marketing Playbook`).
   - Masthead logo & sponsor/host mockup images load cleanly, ROI sliders recompute live, tabs switch cleanly, copy buttons trigger `"Copied ✓"`, and checklist toggles update progress & persist.
4. `git status --short` verifies untouched protected files (`/source-material`, `.agents/rules`, `/archive`, `/images/gallery`, open reviewer/abstract/V3 files).
5. Append Addendum 33 to `docs/session_history.md`.
