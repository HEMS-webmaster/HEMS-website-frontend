# Implementation Plan — Frontpage Layout Refinement (3 Tweaks)

- **Date:** 2026-11-12
- **Owners:** `@arch`, `@brand`, `@dev`
- **Target Files:**
  - `src/frontend/src/components/layout/Navbar.tsx`
  - `src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx`
  - `src/frontend/src/app/page.tsx`

## Approved Layout Tweaks
1. **Tweak 1 — Eliminate Top-Left Stacked Logos:**
   - Hide the compact `/hemslogo.jpg` thumbnail box in `Navbar.tsx` on `/` (`cleanPathname === "/"`) while keeping it visible on all subpages, so the large Society Masthead emblem on `/` never collides vertically with a duplicate Navbar logo.
2. **Tweak 2 — Balance Hero Left & Right Columns:**
   - Step the Hero `<h2>` scale (`lg:text-[2.2rem]`) cleanly beneath the Masthead `<h1>` (`xl:text-5xl`).
   - Move `<UpcomingWorkshopSpotlight />` out of the right-hand mass spectrum frame and render it as a crisp Save-the-Date card beneath the Hero CTAs in the left column, equalizing left and right column heights while giving `<HeroMassSpectrum />` a dedicated analytical showcase card.
3. **Tweak 3 — De-Duplicate Section 4 into a Clean Proceedings Index:**
   - Replace Section 4's repeated domain photo blurbs (already covered in Section 2's Technical Charter cards) with a scannable `2×3` quick-jump grid into verified biennial workshop proceedings (`2025` back to `1999`, `436` open-access papers & slide decks) alongside the Student Travel Awards and Corporate Sponsorship pathway cards.

