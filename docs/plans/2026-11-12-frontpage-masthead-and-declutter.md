# Frontpage Masthead Scale-Up & Layout De-Clutter Plan

**Date:** 2026-11-12  
**Agents:** `@brand`, `@web` (`@sme1`), `@arch`, `@dev`, `@qa`  
**Scope:** Reclaim top-most hero whitespace on `/` with a larger HEMS emblem and `'Harsh-Environment Mass Spectrometry Society'` masthead, while reducing visual busyness across the frontpage (`src/frontend/src/app/page.tsx` and `src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx`).

## 1. Top Masthead & Whitespace Reclamation
- Reduce hero top padding from `py-10 sm:py-18 lg:py-24` (`96px` desktop gap) to `pt-5 pb-12 sm:pt-7 sm:pb-16 lg:pt-8 lg:pb-20`.
- Create a full-width top institutional masthead row across `max-w-7xl`:
  - Enlarge `/hemslogo.jpg` frame from `w-24 sm:w-32 lg:w-36` to `w-28 sm:w-40 lg:w-48` (`112px` → `160px` → `192px`).
  - Promote `'Harsh-Environment Mass Spectrometry Society'` to `<h1>` at `text-2xl sm:text-4xl lg:text-[2.65rem] xl:text-5xl` (`Source Serif 4`, Oceanic Sapphire).

## 2. Visual De-Cluttering ("Less Busy")
- **Hero Split (`lg:grid-cols-12`, balanced `6 / 6` columns):**
  - Remove duplicate `<UpcomingHeroBadge />` pill + secondary link from the left column (already represented in the right-hand 2027 Workshop strip).
  - Remove redundant italic `<blockquote>` and keep one concise narrative paragraph + two clean CTA buttons (`Explore Proceedings Archive`, `2027 Workshop Overview`).
  - Condense [UpcomingWorkshopSpotlight.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx) into a compact inline metadata bar below `HeroMassSpectrum` instead of two nested gray boxes.
- **Lower Frontpage Sections ([page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx)):**
  - Remove `01 / DOMAIN` kickers and the 9 bottom tag pills from the three Section 2 Charter Pillar cards.
  - Remove `13th–15th WS` corner micro-labels and the duplicate bottom-right `/hemslogo.jpg` box in Section 4.

