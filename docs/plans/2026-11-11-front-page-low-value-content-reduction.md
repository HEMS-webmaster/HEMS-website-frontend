# Architectural Plan: Front Page Low-Value Content Reduction (Mobile Hero Streamlining & Stats Strip Removal)

- **Date:** 2026-11-11
- **Authors:** `@prod` (Product Audit) & `@arch` (System Blueprint)
- **Implementer:** `@dev`
- **Status:** APPROVED BY `@bo`

---

## 1. Objective & `@bo` Decisions

Following `@prod`'s content-value audit of [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), `@bo` approved two targeted reductions:

1. **Cell-Phone Hero Streamlining (`< md` / `< 768px` Only):**
   - Preserve the full two-column Editorial Split Hero (including the calibrated `EI 70 eV` SVG spectrum, pull-quote, and `UpcomingHeroBadge`) on tablet and desktop screens (`md:`+).
   - On cell phones (`< md`), hide low-signal vertical scroll clutter:
     - Redundant `"Harsh-Environment Mass Spectrometry Society"` eyebrow (`hidden md:block`, already visible in the sticky mobile navbar).
     - Duplicate `<UpcomingHeroBadge />` (`hidden md:block`, duplicated immediately below by `<UpcomingWorkshopSpotlight />`).
     - Unattributed `<blockquote>` pull-quote (`hidden md:block`).
     - Tertiary `"Society History (1999–2025)"` hero link (`hidden sm:inline-flex`, keeping the primary `Explore Proceedings Archive` and `2027 Workshop Overview` buttons prominent).
     - Decorative `In-Situ Volatile Profile • EI 70 eV` header and synthetic SVG stick-plot mass spectrum (`hidden md:flex` / `hidden md:block`), so mobile visitors immediately reach the live-hydrated `16th HEMS Workshop (2027)` card (`<UpcomingWorkshopSpotlight />`) with zero orphan top border (`md:pt-4 md:border-t md:border-slate-100`).
2. **Removal of the 4-Box Institutional Stats Strip (`IMPACT_METRICS`):**
   - Remove `IMPACT_METRICS` (`1999` / `15` / `1,590` / `52`) and Section 2 from [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), eliminating redundant vanity counters and multi-line sub-paragraphs while keeping `Core Domains`, `The Symposium Spirit`, and `Recent Highlights & Institutional Pathways` intact.

---

## 2. File Scope & Domain Locks

- [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) (`@dev`)
- [`src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx) (`@dev`)
- [`docs/implementation_plan.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/implementation_plan.md) & [`docs/session_history.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/session_history.md) (`@arch`)
- **Zero modifications** to `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, or `docs/source-documents/pics/`.

---

## 3. Verification & Deployment

1. Static export verification via `npm --prefix src/frontend run build` (`40/40` static pages).
2. Commit on `main`, refresh Firebase Hosting preview channel `preview-2027` (`@ops`), and restart local `next dev` server.

