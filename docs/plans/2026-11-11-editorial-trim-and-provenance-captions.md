# Editorial Trim & Provenance-Driven Photo Captions Plan

**Date:** 2026-11-11  
**Authors:** `@prod` (Editorial Specification & Provenance Audit), `@arch` (Blueprint), `@dev` (Frontend Implementation)  
**Scope:** `src/frontend/src/app/{page,about/page,history/page}.tsx` and `src/frontend/src/components/workshop/{PortalOverviewClient,AccommodationsClient,CallForPapersClient,CorporateSponsorshipClient,StudentAwardsClient}.tsx` (`0` edits to `src/frontend/src/app/archive/**`)

---

## 1. Objectives

1. **Remove Redundant `'Key Historical Milestones'` Section (`/history`):**
   - Delete `TimelineEvent`, `TIMELINE_EVENTS`, and `{/* CHAPTER 03: CHRONOLOGICAL MILESTONE LEDGER */}` from [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), since Chapters 01 and 02 already narrate every milestone in full prose.
   - Renumber Chapter 04 to `03 — Summary & The HEMS Philosophy` and rebalance alternating `bg-[#FAFBFD]` / `bg-white` section backgrounds.

2. **Refactor All Picture Captions to Unseen Context (Time, Location, Occasion & Provenance):**
   - Eliminate caption phrasing that describes what is already visually obvious in the image (e.g., *"smiling together beneath palm trees"*, *"Hawaiian shirts"*, *"steps from the boardwalk, dunes, and surf"*, *"tabletop hardware and literature"*).
   - Ground every visible `<figcaption>` and photo credit in **verified archival facts** extracted from EXIF timestamps, GPS coordinates, and official printed Workshop Program PDFs (`9th` through `15th` Workshops), while preserving WCAG 2.1 descriptive `alt` text for screen readers.
   - Collect targeted follow-up context from `@bo` on the subset of photos where deeper backstory (exact early-2000s AUV test year, 2013 award recipient, cold-seep research vessel, specific volcano/glacier site, 2015 harbor boat vs. pier, and 2019 Myrtle Beach hotel name) is not recorded in EXIF or printed programs.

---

## 2. File-by-File Execution Matrix (`@dev`)

| Route | File | Updates |
| :--- | :--- | :--- |
| `/history` | [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) | Remove `Key Historical Milestones` (`TIMELINE_EVENTS` + Chapter 03); renumber Chapter 04 → `03`; update `Fig. 01` (USF COT lab, St. Petersburg, FL, c. 1999–2001), `Fig. 02` (9th WS Tuesday Dinner, The Don CeSar, Sept 17, 2013), and `Fig. 03` (13th WS opening day, Myrtle Beach, SC, Sept 16, 2019, two weeks post-Hurricane Dorian). |
| `/about` | [`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) | Update 2025 group portrait caption (Sheraton Virginia Beach Oceanfront atrium prior to Wednesday Workshop Dinner, Sept 17, 2025) and 6th pillar card caption (9th WS Tuesday Dinner recognition at The Don CeSar, St. Pete Beach, FL, Sept 17, 2013). |
| `/` | [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) | Update `CHARTER_PILLARS` credit badges with presenter/institution/year provenance; rewrite all 3 `SYMPOSIUM_CULTURE` captions (`Sept 17, 2013` St. Pete Beach; `Sept 15, 2015` UMD School of Pharmacy, Baltimore; `Sept 20, 2017` Mandalay Beach Resort, Oxnard); add provenance sub-captions to the 3 Proceedings Spotlight thumbnails (`Danell 2019`, `Bell & AWI 2025`, `Verbeck 2025`). |
| `/layout-portal` | [`src/frontend/src/components/workshop/PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx) | Update banner `<figcaption>` to cite the 10th HEMS Workshop Tuesday evening gathering on Baltimore's Inner Harbor (`September 15, 2015`). |
| `/accommodations` | [`src/frontend/src/components/workshop/AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx) | Update both venue captions with exact compass orientation, hotel location, and session date (`35th Street outside Sheraton Virginia Beach Oceanfront, Sept 18, 2025`; `Kingston Plantation looking north toward Apache Pier, Myrtle Beach, SC, Sept 16, 2019`). |
| `/call-for-papers` | [`src/frontend/src/components/workshop/CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx) | Replace generic topic blurbs on the 3 presentation figures with presenter, institution, field city (downtown Dallas, TX for Verbeck 2019), workshop ordinal, and presentation date. |
| `/corporate-sponsorship` | [`src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx) | Update `<figcaption>` to cite the Monday afternoon Poster & Sponsor Exhibition (`Extrel CMS`, `Edwards Vacuum`, `BaySpec`) at the 10th HEMS Workshop, UMD School of Pharmacy, Baltimore, MD (`Sept 14, 2015`). |
| `/student-awards` | [`src/frontend/src/components/workshop/StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx) | Update `<figcaption>` to cite the Wednesday evening Workshop Dinner & Student Travel Award recognition at Lands End, 13th HEMS Workshop, Myrtle Beach, SC (`Sept 18, 2019`). |
