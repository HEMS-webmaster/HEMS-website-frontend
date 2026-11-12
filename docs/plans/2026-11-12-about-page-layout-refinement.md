# Implementation Plan: `/about` Page Editorial Layout Refinement

- **Date:** 2026-11-12
- **Author:** `@arch` (with `@prod` & `@brand`)
- **Scope:** `src/frontend/src/app/about/page.tsx`

---

## 1. Layout & Brand Audit Findings

1. **Portrait Photo Column Imbalance:** `group-photo-2025.jpg` (`1029 × 1600` vertical portrait) spanned the full 5-column width (`~750px–1,088px` tall), leaving more than `500px` of empty whitespace beneath the 2-sentence Mission Statement on desktop and creating an oversized vertical scroll on tablets.
2. **Mixed-Semantics Objectives Grid:** The 2013 Don CeSar dinner photograph occupied slot #6 inside the 5-item *Core Objectives* grid, visually impersonating a sixth strategic objective.
3. **Header Seal Scale & Charter Framing:** Header emblem used `w-28` (`112px`) instead of the `56px–72px` formal seal scale specified in `brand-guidelines.md` §4.2; the Mission Statement was wrapped in quotation marks; and corporate governance omitted the 501(c)(3) Board of Directors.

---

## 2. Structural Changes (`src/frontend/src/app/about/page.tsx`)

1. **Editorial Header:** Scale the Society seal to `w-14 sm:w-16` (`56px–64px`) inside a crisp institutional card.
2. **Section 01 (`Mission Statement`):**
   - Present the verbatim `mission-statementV1.md` text (without quotation marks) inside an accented Alabaster charter frame.
   - Correct the governance description to cite both the volunteer **Board of Directors** and biennial **Workshop Organizing Committee**.
   - Add a 2×2 **Institutional Profile** grid (*Biennial Since 1999*, *Single-Track Forum*, *Open-Access Archive*, *Student Travel Grants*) beneath the Mission Statement so the left column balances the uncropped `max-w-[380px]` 2025 staircase portrait on the right.
3. **Section 02 (`Core Objectives`):**
   - Render exclusively the 5 verbatim `mission-statementV1.md` objectives in a balanced 6-column bento grid (`3` cards at `lg:col-span-2` over `2` cards at `lg:col-span-3`).
4. **Section 03 (`Heritage & Open Archive`):**
   - Pair the relocated 2013 Don CeSar symposium photo card with structured navigation cards to `/history`, `/archive`, and `/layout-portal`.

