# Implementation Plan: Brand v3.2.0 User-Data-Interface Contrast & Mailing List Workspace Tidy

**Date:** 2026-11-14  
**Roles:** `@brand`, `@web`, `@dev`, `@arch`

## Scope
1. **Brand Guidelines `v3.2.0` (`@brand`):** Archive `v3.1.0` and add User-Data-Interface color tokens (`--surface-well`, `--field-label`, `--field-border`, `--field-border-hover`, `--field-placeholder`) plus Section 5.3 governing mandatory visible labels, Title/Sentence-Case Navy (`#1E3A5F`) label vs. `#0F172A` normal-weight input text hierarchy, `#F3F6FA` grouping wells, and high-contrast data ledger tables.
2. **Global Form Tokens & Utility-Safe Classes (`globals.css`):** Expose variables in `:root, .theme-global` and `@theme inline`, and define `.hems-label`, `.hems-label-hint`, and `.hems-control` inside `@layer components` so Tailwind v4 utility overrides keep working cleanly.
3. **`/board/mailing-list` Layout & Readability Tidy (`@web`, `@dev`):**
   - Fix KPI card #4 (`Bounced / Complained`) filter bug via `DirectoryStatusFilter = "all" | SubscriberStatus | "suppressed"` and consistent active rings + click-to-toggle across all 4 KPI cards.
   - Keep `CSV Import & Sublist Tagging` above `Sublists & Cohort Tags`, structured in a labeled `#F3F6FA` 12-column control well.
   - Group `Sublists & Cohort Tags` system pills vs. custom cohort pills with high-contrast count badges and labeled creation bar.
   - Add structured `Subscriber Directory` header (count badge, active-filter reset, `+ Add Subscriber` toggle), labeled Search/Status/Bulk-Tag/Manual-Add controls, and higher-contrast table headers and row dividers.
4. **Cross-Portal Data-UI Consistency (`@dev`):** Apply `.hems-label`, `.hems-control`, and `#F3F6FA` grouping wells to `AbstractSubmissionClient.tsx` (preserving exact `1020px` / `6.5"` / `12-15` words-per-line geometry), `admin/page.tsx`, `board/announcements/page.tsx`, and `reviewer/page.tsx`.

## Files Created / Modified
- `docs/design/archive/brand-guidelines-v3.1.0.md` *(new)*
- `docs/design/brand-guidelines.md` *(updated to v3.2.0)*
- `src/frontend/src/app/globals.css` *(updated)*
- `src/frontend/src/app/(portal)/board/mailing-list/page.tsx` *(updated)*
- `src/frontend/src/components/workshop/AbstractSubmissionClient.tsx` *(updated)*
- `src/frontend/src/app/(portal)/admin/page.tsx` *(updated)*
- `src/frontend/src/app/(portal)/board/announcements/page.tsx` *(updated)*
- `src/frontend/src/app/(portal)/reviewer/page.tsx` *(updated)*
