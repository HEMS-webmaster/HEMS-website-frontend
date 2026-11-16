# Plan: Homepage Field-Deployments Carousel Expansion (12 Archival Slides) & Random Initial Slide

**Date:** 2026-11-16  
**Owners:** `@arch`, `@dev`, `@qa`  
**Target Component:** [HeroFieldDeploymentsCarousel.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/home/HeroFieldDeploymentsCarousel.tsx)

## Objectives
1. Expand `FIELD_DEPLOYMENTS` from `6` to `12` authentic HEMS Proceedings Archive slides ensuring:
   - **Space-Related (`>= 2` slides):** e.g., NASA Dragonfly DraMS lander on Titan (`danell-dragonfly-titan-ms-2019.jpg`, currently unused in `public/images/gallery/`) plus a distinct flight/planetary mass spectrometry mission from the proceedings archive (such as ExoMars MOMA, NASA JPL ISS S.A.M., or Lunar LUVMI).
   - **Low-Level Engineering (`>= 1` slide, targeting 1 simulation + 1 micro-mechanical hardware):** Ion-optics / space-charge trajectory simulation and/or precision micro-machined or chip-scale ion-trap components.
   - **Military / Defense Field Operations (`>= 1` slide):** Unclassified, non-FOUO, non-Proprietary military/defense ordnance or chemical-warfare-agent field mass spectrometry deployment.
   - **Indoor Non-Sanitized Building (`>= 1` slide):** Field mass spectrometry operating inside a real working building (e.g., power station, industrial plant, museum storage vault, or nuclear facility hall) rather than a clean laboratory bench.
2. **Hydration-Safe Random Initial Slide:** Randomize the starting slide when the front page (`/`) loads in the client browser (`useEffect`) without SSR hydration mismatch or vertical scroll jumping.
3. **Single-Row Filmstrip Selector:** Upgrade the desktop `hidden sm:grid grid-cols-6` strip to a compact single-row horizontally scrollable thumbnail strip (`hidden sm:flex overflow-x-auto no-scrollbar`) that centers the active slide thumbnail automatically while preserving `< sm` mobile simplification.

## Screening & Quality Constraints
- Exclude all `FOUO`, `Confidential`, `Proprietary`, or `Do Not Distribute` decks (`15th_Snyder`, `10th_Ong`, `7th_Wells`, `12th_Gonin` confidential tail).
- Zero alcohol/bar imagery (`0%`-alcohol policy).
- Zero duplicate images against `src/frontend/src/app/page.tsx` (`CHARTER_PILLARS`, `SYMPOSIUM_CULTURE`) or `CallForPapersClient.tsx`.
- Every `archiveHref` (`/archive/<year>#<id>`) must resolve cleanly to a real presentation entry in `src/frontend/src/data/archives/*.json` without modifying archive source files.

## Verification Gates
- Visual inspection of every candidate and saved gallery JPEG via `read_file`.
- Automated Python verification of image dimensions, non-duplication, and archive anchor existence.
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exit `0`.
- Live dev server HTTP `200` on `http://localhost:3000/`.
- **Addendum 29** logged in `docs/session_history.md`.
