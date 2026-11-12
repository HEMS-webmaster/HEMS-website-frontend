# Implementation Plan: `/history` Page Editorial Layout Refinement

- **Date:** 2026-11-12
- **Author:** `@arch` (with `@prod` & `@brand`)
- **Scope:** `src/frontend/src/app/history/page.tsx`

---

## 1. Layout & Editorial Audit Findings

1. **Interrupted Reading Flow in Chapter 01:** Paragraphs 1–3 of *HEMS WS Early Years* rendered in a prose column, while Paragraphs 4–5 of the same chronological story were broken out into two unequal-height side-by-side boxes (`10 lines` vs. `16 lines`), disrupting continuous reading.
2. **Header Seal Scale:** Rendered `/hemslogo.jpg` at `w-28` (`112px`) rather than the `56–64px` (`w-14 sm:w-16`) Society seal scale established in `brand-guidelines.md` §4.2 and `/about`.
3. **Unlinked Prose Venue List in Chapter 02:** Chapter 02 lists workshop host cities from 1999 to 2025 in prose without providing a structured, scannable chronological index into the 15 archived proceedings (`/archive/[year]`).

---

## 2. Structural Changes (`src/frontend/src/app/history/page.tsx`)

1. **Unified Header Chrome:** Match `/about` with a `w-14 sm:w-16` Society seal card and clean breadcrumb back-link.
2. **Chapter 01 (`HEMS WS Early Years`):**
   - Restore all 5 paragraphs into a single, continuous editorial narrative column (`lg:col-span-7`).
   - Balance the right column (`lg:col-span-5`) by stacking `Fig. 01` (USF COT AUV payload integration) above a concise **Formative Milestones (1999–2005)** reference ledger.
3. **Chapter 02 (`HEMS Society`):**
   - Present the 3 narrative paragraphs opposite `Fig. 02` (2013 St. Pete Beach Courtyard Terrace), followed by a compact **Complete Symposium Chronology (1st–15th Workshops, 1999–2025)** grid linking each workshop directly to `/archive/[year]`.
4. **Chapter 03 (`Summary`) & Pathways:**
   - Frame the Summary section cleanly alongside `Fig. 03` (2019 Myrtle Beach shoreline) and align the bottom navigation cards (`/about` and `/archive`) with `/about`.

