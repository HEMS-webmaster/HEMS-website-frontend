# Architectural Implementation Plan: Dedicated Workshop & Society History Page (`/history`) & Archive Page Lock

**Date:** 2026-11-10  
**Custodian:** `@arch`  
**Execution Team:** `@dev`, `@ops`, `@qa`, `@brand`  
**Status:** COMPLETED  

---

## 1. Executive Summary

Per **@bo**'s directives:
1. **Strict Archive Page Lock:** Restore [`src/frontend/src/app/archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) to its exact baseline (`b6a0075`) so `src/frontend/src/app/archive/**` has **zero modifications**, and codify an explicit Archive Page Lock in [`docs/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/project_charter.md) prohibiting any edits to archive routes without explicit **@bo** permission. (Local PDF streaming continues to work seamlessly via the dev-only proxy in `next.config.ts` to `localhost:4000`.)
2. **Dedicated History Page (`/history`):** Extract the **Workshop & Society History** content out of `/about` into a dedicated standalone route at [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), incorporating 100% of the narrative from [`docs/source-documents/historyV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV1.md).

---

## 2. Work Breakdown Structure (WBS)

- [x] **Archive Page Revert & Charter Lock (`@arch`, `@ops`):**
  - Checkout `b6a0075 -- src/frontend/src/app/archive/[year]/page.tsx` and verify `git diff b6a0075 -- src/frontend/src/app/archive/` is empty.
  - Record the immutable Archive Page Lock in [`docs/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/project_charter.md).
- [x] **Standalone History Route (`@dev`, `@brand`):**
  - Create [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) presenting the completeUSF COT Early Years (1999–2005), HEMS Society 501(c)(3) Incorporation & National/International Tour (2005–Present), Key Historical Milestones timeline, and Beachfront Philosophy summary.
- [x] **About Page Refocus (`@dev`):**
  - Streamline [`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) to focus on Society identity, Official Mission Statement, and the 5 Core Strategic Objectives, paired with dual navigation cards to `/history` and `/archive`.
- [x] **Navigation, Sitemap & CMS Alignment (`@dev`):**
  - Add `/history` to [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx), [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx), [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts), [`content/pages/history.md`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/content/pages/history.md), and [`public/admin/config.yml`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/admin/config.yml).
- [x] **Verification (`@qa`):**
  - Run TypeScript check (`npx tsc --noEmit`) and verify live `HTTP 200 OK` rendering on `http://localhost:3000/history/` and `http://localhost:3000/about/`.
