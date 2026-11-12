# Architectural & Editorial Plan: Accommodations Sunny Venue Photos & Light TBA Consolidation

**Date:** 2026-11-12  
**Author:** `@arch` & `@prod`  
**Execution Team:** `@legal`, `@dev`, `@qa`, `@ops`  
**Status:** Approved for Immediate Execution (`@bo`)

---

## 1. Objective

Update `/accommodations` ([`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx)) per `@bo`'s direction:
1. **Sunny Free-Stock Photography:** Replace the two overcast/rainy venue photos on `/accommodations` with bright, sunny, open-licensed photographs of **Virginia Beach, VA** *(15th HEMS Workshop, 2025)* and **St. Pete Beach / The Don CeSar, FL** *(8th & 9th HEMS Workshops, 2011 & 2013)*, optimized to `1600px` web JPEGs with explicit `width`/`height` attributes (`CLS = 0`) and proper license attribution (`@legal`). Keep `public/images/history/myrtle-beach-pier-surf.jpg` untouched on disk because it remains in use on `/history`.
2. **Light `"TBA"` Consolidation:** Keep the substantive lodging overview (*Official Workshop Venue*, *HEMS Group Room Block* including the `$124/night` 15th Workshop reference rate, and *General Lodging Notes* covering the All-Under-One-Roof format), while consolidating redundant `"TBA"` boxes in the unconfirmed (`!workshop.venue_confirmed`) state so `"TBA"` is not repeated five times across main cards and sidebar panels. Preserve all live Google Sheet bindings (`useUpcomingWorkshop()`) for turnkey activation when the 2027 hotel is confirmed.

---

## 2. Planned Changes (`@dev`)

1. **Web-Optimized Sunny Venue Assets (`src/frontend/public/images/gallery/`):**
   - `virginia-beach-oceanfront-sunny.jpg` (`1600px` wide progressive JPEG)
   - `st-pete-beach-don-cesar-sunny.jpg` (`1600px` wide progressive JPEG)
   - Remove unused overcast `virginia-beach-boardwalk-2025.jpg` from `src/frontend/public/images/gallery/` while keeping `src/frontend/public/images/history/myrtle-beach-pier-surf.jpg` intact for `/history`.
2. **[`src/frontend/src/components/workshop/AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx):**
   - Update the 2-column beachfront gallery strip with the sunny **Virginia Beach, VA** and **The Don CeSar (St. Pete Beach, FL)** photographs, historical HEMS Workshop provenance captions, and concise license credits.
   - Lightly consolidate unconfirmed `"TBA"` placeholders:
     - In *HEMS Group Room Block*, render the 2-box rate/window grid when `workshop.venue_confirmed` is `true`, and render a single concise benchmark paragraph (noting the `$124/night` 2025 rate and multi-day shoulder availability) when `!workshop.venue_confirmed`.
     - In the right sidebar, merge the three separate `"TBA"` cards (*Key Dates*, *Room Block Cutoff*, *Room Block TBA*) into one clean **Schedule & Room Block Status** card while `!workshop.venue_confirmed`, expanding automatically to the full deadline + reservation portal cards once `workshop.venue_confirmed` is `true`.

---

## 3. Verification & Deployment (`@qa`, `@ops`)

- Run `npm --prefix src/frontend run build` (`40/40` static pages, `0` errors).
- Confirm `0` modifications to `src/frontend/src/app/archive/**` or `docs/source-documents/pics/`.
- Commit on `main`, deploy to Firebase Hosting preview channel `preview-2027`, and restart local `next dev`.

