# Implementation Plan: Option A Alcohol Photo Curation & Framing Refinement

**Date:** 2026-11-11  
**Author:** `@arch` (with `@prod`, `@dev`, `@qa`)  
**Status:** Approved by `@bo` — Executing Auto-Advance

---

## 1. Objective & Policy Mandate (`Option A`)

Per `@bo` directive following review of the Brand `v3.1.0` and web-sized photo enhancement rollout:
1. **Preserve Quality & Web-Sizing Upgrades:** Retain the classical, 100% non-generative photographic enhancement pipeline (`Pillow` + `NumPy` + `SciPy`, `<= 1600px` max edge, progressive `4:2:0` JPEG, zero AI content alteration) and maintain side-by-side Before/After plates for `@bo` verification.
2. **Zero Alcohol on Front (`/`), Student (`/student-awards`), and Corporate (`/corporate-sponsorship`) Pages:**
   - Every photograph on `/`, `/student-awards`, and `/corporate-sponsorship` must be **100% free of alcoholic beverages, beer bottles, cans, and wine/cocktail glassware**.
3. **Subtle Alcohol Only at Evening Meals & Poster Sessions on Inner Pages:**
   - Crop out or replace prominent foreground/chest-high bottles and photobombing glassware on inner pages while preserving authentic, subtle evening-meal and poster-session ambiance on `/about`, `/history`, `/layout-portal`, and `/call-for-papers`.
4. **Provenance-First Captions:**
   - Describe unseen archival provenance (workshop ordinal, exact date/time from EXIF + official Program records, host institution/chair, venue, city/state, and scheduled event) rather than describing obvious visual elements.

---

## 2. Sitewide Photo Action Matrix

| Route & Component | Previous Asset | Policy Issue | Action & New/Updated Asset | Alcohol Status |
| :--- | :--- | :--- | :--- | :--- |
| **`/student-awards`** (`StudentAwardsClient.tsx`) | `banquet-awards-applause-2019.jpg` | Foreground green beer bottle + yellow ale can | **Swap** to `student-award-certificate-2015.jpg` (`Older Pics/10thHEMS_52.JPG` — 2015 Student Travel Award winner Andrew Hampton of UNC–Chapel Hill holding his official Award Certificate beside Committee Chair Torben Gentz) | **0% Alcohol** |
| **`/corporate-sponsorship`** (`CorporateSponsorshipClient.tsx`) | `sponsor-exhibit-smiles-2015.jpg` | Brown beer bottle on Edwards Vacuum exhibit table | **Swap** to `sponsor-exhibit-roundtable-2017.jpg` (`Older Pics/GPK_4559.JPG` — smiling attendees in Hawaiian shirt & INFICON polo in front of IPI InProcess Instruments and PerkinElmer Torion T-9 GC/MS booths, 11th WS, Oxnard, CA) | **0% Alcohol** |
| **`/` Card 1** (`src/app/page.tsx`) | `don-cesar-terrace-smiles-2013.jpg` | Held brown beer bottle + foreground plastic beer cup | **Reorder/Swap:** Card 1 = `single-track-auditorium-smiles-2015.jpg` (10th WS 11:57 AM auditorium smiles, bottled water only) | **0% Alcohol** |
| **`/` Card 2** (`src/app/page.tsx`) | `single-track-auditorium-smiles-2015.jpg` | None (verified clean) | **Swap** Card 2 to `mandalay-beach-corridor-smiles-2017.jpg` (`Older Pics/GPK_4424.JPG` — founding HEMS leader Tim Short in blue Hawaiian shirt sharing a laugh with colleague at Mandalay Beach Resort, 11th WS, Sept 19, 2017) | **0% Alcohol** |
| **`/` Card 3** (`src/app/page.tsx`) | `poster-session-smiles-oxnard-2017.jpg` | Subtle cocktail-table glass + side-table wine glass | **Relocate** `poster-session-smiles-oxnard-2017.jpg` to `/call-for-papers`; **Swap** `/` Card 3 to `virginia-beach-staircase-smiles-2025.jpg` (`FromGottfried/2025/PXL_20250917_222521232.jpg` — smiling multi-generational attendees & Hawaiian shirt on Sheraton atrium staircase, 15th WS, Sept 17, 2025) | **0% Alcohol** |
| **`/about` Card 6** (`src/app/about/page.tsx`) | `don-cesar-hawaiian-smiles-2013.jpg` | None — already subtle evening dinner ambiance | **Keep** as-is (Tuesday evening Workshop Dinner award presentation on The Don CeSar Courtyard Terrace, Sept 17, 2013) | **Subtle (Evening Meal)** |
| **`/history` Fig. 02** (`src/app/history/page.tsx`) | `st-pete-beach-don-cesar-2013.jpg` | Standing attendee at left (`x = 0.00..0.20`) holds prominent chest-high brown beer bottle | **Re-crop** from full `4928x3264` `Older Pics/HEMS2013_55.JPG` (`x = 0.210..0.966, y = 0.04..0.80`) removing both the left beer bottle and far-right plastic cup while keeping 12 smiling attendees + two subtle wine glasses on the white dinner tablecloth | **Subtle (Evening Meal)** |
| **`/layout-portal` Banner** (`PortalOverviewClient.tsx`) | `golden-hour-harbor-reception-2015.jpg` | Blurry foreground photobombing red wine glass at bottom center (`y = 0.84..1.00`) | **Re-crop** (`x = 0.00..0.98, y = 0.03..0.82`) removing the foreground wine glass while retaining subtle evening-dinner reception glasses held in hand against Baltimore's Inner Harbor | **Subtle (Evening Meal)** |
| **`/call-for-papers`** (`CallForPapersClient.tsx`) | Presentation graphics only | Opportunity to preserve subtle poster-session camaraderie | **Add** Poster Session spotlight card featuring relocated `poster-session-smiles-oxnard-2017.jpg` (`Older Pics/GPK_4550.JPG` — 11th WS Wednesday evening Poster & Exhibitor Session in Oxnard, CA) | **Subtle (Poster Session)** |

---

## 3. Execution & Verification Checklist

1. **Non-Generative Photo Enhancement & Before/After Review (`@dev`):**
   - Stage untouched raw originals in untracked `src/frontend/photo_review/before/`.
   - Update `optimize_and_enhance_photos.py` with exact crop coordinates + classical tone/denoise/sharpen parameters for the 4 new photos and 2 re-cropped photos, and retire the 3 unused `.jpg` files (`banquet-awards-applause-2019.jpg`, `sponsor-exhibit-smiles-2015.jpg`, `don-cesar-terrace-smiles-2013.jpg`) from `src/frontend/public/images/gallery/`.
   - Regenerate `src/frontend/photo_review/{after,comparisons,manifest.json}` and update artifact `photo_enhancements_review.md`.
2. **Component & Provenance Caption Updates (`@dev`):**
   - Update `src/frontend/src/app/page.tsx`, `src/frontend/src/components/workshop/StudentAwardsClient.tsx`, `src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx`, `src/frontend/src/app/history/page.tsx`, `src/frontend/src/components/workshop/PortalOverviewClient.tsx`, and `src/frontend/src/components/workshop/CallForPapersClient.tsx`.
   - Maintain strict `v3.1.0` Dual-Font compliance (`0` `font-mono` occurrences).
3. **Static Export Build & Domain Lock Verification (`@qa`, `@ops`):**
   - Verify `npm --prefix src/frontend run build` compiles all `40/40` static pages with `0` TypeScript errors and `0` modifications to `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, or `docs/source-documents/pics/`.

