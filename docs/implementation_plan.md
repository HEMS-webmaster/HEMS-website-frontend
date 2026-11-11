# Granular Implementation Plan: Workshop-by-Workshop Local Data Reorganization

This plan structures the local proceedings and registry reorganization into **discrete, verifiable checkpoints**—allowing **@bo** to inspect and verify progress **one workshop archive at a time**.

---

## User Review Required

> [!IMPORTANT]
> - **Zero-Downtime Dual-Path Engine (Phase 0):** Before moving files, we deploy [`assetPaths.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/assetPaths.ts). It resolves paths from `local_data/proceedings/[ws]` first, and automatically falls back to `docs/archives_translation/proceedings/[ws]`. The Workshop Manager continues working uninterrupted during partial migration.
> - **1 Workshop at a Time (Phase 2):** Each of the 15 workshop archives is processed, deduplicated under the **Manager Reference Authority Protocol**, and verified individually.
> - **Storage Reclaimed:** Each migrated workshop folder immediately deletes its redundant copy in `proceedings_backup/`, progressively freeing up **1.71 GB**.

---

## Phased Workflow & Checkpoint Architecture

```mermaid
graph TD
    P0[Phase 0: Path Resolver & Fallback Engine] --> G0[Gate 0: Manager Dual-Path Verified]
    G0 --> P1[Phase 1: Registries Consolidation]
    P1 --> G1[Gate 1: Registries Verified]
    G1 --> W1[Step 2.1: 1st Workshop 1999]
    W1 --> W2[Step 2.2: 2nd Workshop 2001]
    W2 --> W3[Step 2.3: 3rd Workshop 2002 - Merge 22 Slides]
    W3 --> WX[Steps 2.4 - 2.15: 4th through 15th Workshops]
    WX --> P3[Phase 3: Sponsors Consolidation]
    P3 --> P4[Phase 4: Final Cleanup & Git Hardening]
```

---

## Detailed Step-by-Step Breakdown

### Phase 0: Centralized Path Architecture & Fallback Engine
Deploy the dual-path resolution module so both old and new locations function concurrently:

#### [NEW] [`src/frontend/src/utils/assetPaths.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/assetPaths.ts)
* `getProceedingsDir()`: Resolves to `local_data/proceedings` with fallback to `docs/archives_translation/proceedings`.
* `getWorkshopDir(wsOrdinal)`: Checks `local_data/proceedings/${wsOrdinal}` first; if missing, returns `docs/archives_translation/proceedings/${wsOrdinal}`.
* `getSponsorsDir()`: Resolves to `local_data/sponsors` with fallback.
* `getRegistriesDir()`: Resolves to `docs/registries`.

#### [MODIFY] Refactor Manager API routes to use `assetPaths.ts`:
* [`serve/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/serve/route.ts), [`upload/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/upload/route.ts), [`save/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/save/route.ts), [`push-to-live/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/push-to-live/route.ts), [`preview/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/preview/route.ts), [`download-legacy/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/download-legacy/route.ts), [`delete/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/delete/route.ts), [`check-file/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/check-file/route.ts).
* Scripts: [`push-to-live.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/push-to-live.js), [`index-pdf-contents.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/index-pdf-contents.js).

**Gate 0 Checkpoint:** Confirm Workshop Manager at `http://localhost:3000/manager` loads existing files without error.

---

### Phase 1: Registries Hub Consolidation
1. **[NEW] Directory:** `docs/registries/`
2. **[MOVE] Permalink Registry:** `docs/archives_translation/proceedings/redirect_map.json` -> [`docs/registries/permalink_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/docs/registries/permalink_registry.json).
3. **[MOVE] SEO Metadata Registry:** `docs/design/pdf_seo_registry.md` -> [`docs/registries/pdf_seo_registry.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/registries/pdf_seo_registry.md).
4. Update paths in `pdf_seo_registry.md` to reference `local_data\proceedings\...`.

**Gate 1 Checkpoint:** Inspect `docs/registries/` in IDE.

---

### Phase 2: Granular Workshop-by-Workshop Migration (15 Discrete Steps)

Each workshop follows a 4-point protocol:
1. **Audit:** Scan `master_workshops.json` & `archives/*.json` for all referenced files in this workshop.
2. **Deduplicate:** Reconcile `proceedings/[N]th` vs `proceedings_backup/[N]th` (Manager-referenced version is strictly retained).
3. **Move:** Relocate `proceedings/[N]th` -> `local_data/proceedings/[N]th`.
4. **Prune Backup:** Delete `proceedings_backup/[N]th`.

| Step | Workshop | Year | File Count | Size | Special Notes | Checkpoint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2.1** | **1st Workshop** | 1999 | 2 files | 0.07 MB | Quick pilot test | [Gate 2.1: Verify 1999 in Manager](http://localhost:3000/manager) |
| **2.2** | **2nd Workshop** | 2001 | 52 files | 0.41 MB | First full oral/poster catalog | [Gate 2.2: Verify 2001 in Manager](http://localhost:3000/manager) |
| **2.3** | **3rd Workshop** | 2002 | 137 files | 20.1 MB | Merge 22 unique slides from backup | [Gate 2.3: Verify 2002 in Manager](http://localhost:3000/manager) |
| **2.4** | **4th Workshop** | 2003 | 44 files | 38.3 MB | Keynote & session papers | [Gate 2.4: Verify 2003 in Manager](http://localhost:3000/manager) |
| **2.5** | **5th Workshop** | 2005 | 130 files | 44.3 MB | Expanded technical sessions | [Gate 2.5: Verify 2005 in Manager](http://localhost:3000/manager) |
| **2.6** | **6th Workshop** | 2007 | 130 files | 71.9 MB | Full oral presentation set | [Gate 2.6: Verify 2007 in Manager](http://localhost:3000/manager) |
| **2.7** | **7th Workshop** | 2009 | 228 files | 153.9 MB | High volume session files | [Gate 2.7: Verify 2009 in Manager](http://localhost:3000/manager) |
| **2.8** | **8th Workshop** | 2011 | 166 files | 110.4 MB | Poster & oral proceedings | [Gate 2.8: Verify 2011 in Manager](http://localhost:3000/manager) |
| **2.9** | **9th Workshop** | 2013 | 132 files | 22.5 MB | Technical proceedings | [Gate 2.9: Verify 2013 in Manager](http://localhost:3000/manager) |
| **2.10**| **10th Workshop**| 2015 | 106 files | 142.7 MB | Heavy presentation slide sets | [Gate 2.10: Verify 2015 in Manager](http://localhost:3000/manager) |
| **2.11**| **11th Workshop**| 2017 | 104 files | 118.9 MB | Student award winning talks | [Gate 2.11: Verify 2017 in Manager](http://localhost:3000/manager) |
| **2.12**| **12th Workshop**| 2018 | 40 files | 94.2 MB | Streamlined sessions | [Gate 2.12: Verify 2018 in Manager](http://localhost:3000/manager) |
| **2.13**| **13th Workshop**| 2019 | 124 files | 721.4 MB | Largest media payload (721 MB) | [Gate 2.13: Verify 2019 in Manager](http://localhost:3000/manager) |
| **2.14**| **14th Workshop**| 2022 | 79 files | 74.9 MB | Modern session format | [Gate 2.14: Verify 2022 in Manager](http://localhost:3000/manager) |
| **2.15**| **15th Workshop**| 2025 | 94 files | 104.0 MB | Latest workshop archive | [Gate 2.15: Verify 2025 in Manager](http://localhost:3000/manager) |

---

### Phase 3: Sponsors Asset Consolidation & Manager Synchronization
*Detailed Architectural Plan:* [docs/plans/2026-09-02-sponsor-logos-reorganization.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-09-02-sponsor-logos-reorganization.md)

1. **Inventory & Harmonization:**
   - Migrate 67 historical raw assets from `docs/archives_translation/sponsors/` into `local_data/sponsors/`.
   - Harmonize with the 79 active web assets in `src/frontend/public/images/sponsors/` to form a unified 91-asset master archive in `local_data/sponsors/`.
2. **Manager API Sync:**
   - Verify `getSponsorsDir()` in [`assetPaths.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/assetPaths.ts) switches seamlessly to `local_data/sponsors/`.
   - Ensure manager routes (`check-file`, `upload`, `delete`, `save`, `registry`) maintain dual synchronization between `local_data/sponsors/` (master archive) and `public/images/sponsors/` (Firebase hosting static bundle).
3. **Registry Alignment:**
   - Cross-audit all entries in [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json) and workshop sponsor references to confirm 100% logo resolution.
4. **Pruning:**
   - Remove legacy `docs/archives_translation/sponsors/`.
5. **Gate 3 Checkpoint:** [PASSED] 91 unique sponsor assets unified into `local_data/sponsors/`. 0 missing logo files across 52 corporate registry entries and 131 workshop sponsor references. Manager health checks passing HTTP 200.

---

### Phase 4: Final Cleanup & Git Hardening [COMPLETED]
1. [x] Remove now-empty legacy directories: `docs/archives_translation/proceedings/`, `proceedings_backup/`, `raw_html/`, and parent `docs/archives_translation/`.
2. [x] Update [`.gitignore`](file:///c:/AntigravityP1_2/HEMS-website/.gitignore) to replace `docs/archives_translation/*/` with `local_data/`.
3. [x] Update [`README.md`](file:///c:/AntigravityP1_2/HEMS-website/README.md) with the finalized `local_data/` and `docs/registries/` architecture.
4. [x] Run full production build verification (`npm run build` in `src/frontend` and `functions`).
5. **Gate 4 Checkpoint:** [PASSED] `npm run build` passed with 0 errors across frontend and functions. Clean git hygiene with all local data and sponsor assets properly ignored or tracked.

---

### Phase 5: Frontend Webpages Modernization (Mission & History Integration) [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-10-27-frontend-webpages-revamp.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-10-27-frontend-webpages-revamp.md)

1. [x] **Source Ingestion:** Ingest and reformat canonical `mission-statementV1.md` and `historyV1.md` in `docs/source-documents/`.
2. [x] **About Page Overhaul:** Implement full mission statement, 5 core objectives grid, and interactive 1999–present chronological history in [`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx).
3. [x] **Home Page Harmony:** Update hero and mission synopsis in [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx).
4. [x] **Archive Protection Gate:** Enforce zero modifications across proceeding datasets (`master_workshops.json`, `archives/*.json`, `local_data/proceedings/**`).

---

### Phase 6: Workspace Cleanup, CMS Content Sync & Public Society Pages [COMPLETED]
*Detailed Architectural Plans:* [docs/plans/2026-11-10-cleanup-and-archive-dev-fix.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-10-cleanup-and-archive-dev-fix.md), [docs/plans/2026-11-10-dedicated-history-page.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-10-dedicated-history-page.md), [docs/plans/2026-11-10-general-corporate-sponsorship-page.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-10-general-corporate-sponsorship-page.md) & [docs/plans/2026-11-10-student-travel-awards-page.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-10-student-travel-awards-page.md)

1. [x] **484 MB Static Bundle Reduction:** Relocated `public/assets/archives/cache` -> `local_data/cache/` and archived legacy `public/assets/archives/{2017,2018}` -> `archive/legacy_public_assets/` (shrinking `src/frontend/out/` from 508.2 MB to ~24.5 MB with zero data loss).
2. [x] **Strict Archive Page Lock & Local Proxy:** Preserved 100% zero diff on `src/frontend/src/app/archive/**` while proxying `/api/manager/*` to `localhost:4000` in `next.config.ts`.
3. [x] **Dedicated `/history` Page & `/about` Split:** Created [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) holding the complete **Workshop & Society History** (`historyV1.md`) and focused [`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) on Official Mission & Core Strategic Objectives (`mission-statementV1.md`).
4. [x] **Evergreen Corporate Sponsorship Page (`/corporate-sponsorship`):** Promoted `/corporate-sponsorship` out of `(portal)/` to standalone [`src/frontend/src/app/corporate-sponsorship/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx) with year-over-year copy modeled on `15thCorp_Sponsors.html`, dynamic 52-company showcase bound to [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json), and prominent entry via [`src/frontend/src/app/contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx) (excluded from `Navbar.tsx`).
5. [x] **Standalone Student Travel Awards Page (`/student-awards`):** Moved `/student-awards` out of `(portal)/` to standalone [`src/frontend/src/app/student-awards/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/student-awards/page.tsx) aligned 100% with `15thstudenttravel.html`, removed from `(portal)/layout.tsx` sidebar, and wired directly into [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx), `Footer.tsx`, `sitemap.ts`, and Decap CMS.
6. [x] **Canonical CMS & UI Placeholder Polish:** Synced `src/frontend/content/pages/*.md` (including `history.md`, `corporate-sponsorship.md`, and `student-awards.md`), upgraded `/contact`, `/formatting-guidelines`, and `/layout-portal`, removed dead layout wrappers, and published [`docs/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/project_charter.md).

---

### Phase 7: Decap CMS Retirement & Google Sheets Upcoming Workshop Config (Sept 2027) [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-11-10-decap-retirement-and-google-sheets-workshop-config.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-10-decap-retirement-and-google-sheets-workshop-config.md)

1. [x] **Decap CMS Retirement:** Removed `src/frontend/public/admin/`, `src/frontend/content/`, and `docs/decap_cms_guide.html`, resolving the `/admin` static build collision while keeping `tools/manager/` (`localhost:4000`) dedicated exclusively to historical Proceedings Archives.
2. [x] **Canonical `upcoming_workshop.json` & Google Sheet Connector:** Created [`upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json) (seeded for the **16th HEMS Workshop • September 2027**), [`upcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/upcomingWorkshop.ts), [`useUpcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useUpcomingWorkshop.ts), and [`sync-workshop-sheet.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/sync-workshop-sheet.js).
3. [x] **8-Surface Website Ingestion Wiring:** Wired `/`, `/student-awards`, `/contact`, `/layout-portal`, `/call-for-papers`, `/registration`, `/accommodations`, and `/corporate-sponsorship` to `useUpcomingWorkshop()` with clean `TBA` / `"Opening Soon"` lifecycle states (`0` edits to `src/app/archive/**`).
4. [x] **Google Sheet Templates & Private Staging Guide:** Published ready-to-import [`1_Workshop_Config.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/1_Workshop_Config.csv), [`2_Website_Ingestion_Checklist.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/2_Website_Ingestion_Checklist.csv), and [`docs/workshop-sheets/README.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/README.md).

---

### Phase 8: Brand Guidelines v3.0.0 & Editorial Academic Homepage [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-11-10-refined-academic-homepage-and-brand-v3.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-10-refined-academic-homepage-and-brand-v3.md)

1. [x] **Brand Archive & v3.0.0 Upgrade (`@brand`):** Archived `v2.0.0` to [`docs/design/archive/brand-guidelines-v2.0.0.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/design/archive/brand-guidelines-v2.0.0.md) (and `.agents/config/design/archive/brand-guidelines-v2.0.0.md`) and authored **v3.0.0 — *"Scholarly Precision & Editorial Symposium"*** in [`docs/design/brand-guidelines.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/design/brand-guidelines.md) and `.agents/config/design/brand-guidelines.md`.
2. [x] **Typography & Token Modernization (`@dev`):** Loaded `Source Serif 4`, `Noto Sans`, and `IBM Plex Mono` via `next/font/google` in [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx), eliminated render-blocking 6-font `@import` in [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css), and shifted global surfaces from muddy `#E2E8F0` to crisp Alabaster Paper `#FAFBFD` + Specimen White `#FFFFFF` with Oceanic Sapphire `#0369A1` and Instrumentation Teal `#0F766E`.
3. [x] **Refined Site Shell & Editorial Homepage (`@dev`):** Upgraded [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) (removed sine-wave background clutter, added emblem + serif wordmark lockup, active-route indicators, `"2027 Workshop"` label, and mobile drawer), [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx), [`UpcomingHeroBadge.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingHeroBadge.tsx), [`UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx), and [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) (Editorial Split Hero with calibrated SVG EI 70 eV mass spectrum $m/z\ 1\text{–}100$, Institutional Impact Ledger, numbered Technical Charter pillars, 15th Workshop highlights, and Student Travel Awards / 501(c)(3) Sponsorship pathways).

---

### Phase 9: Website-Wide SEO, Scholarly Indexing & GEO Optimization [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-11-11-seo-optimization-architecture.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-11-seo-optimization-architecture.md)

1. [x] **Centralized SEO & Knowledge Graph Engine (`@dev`):** Implement [`src/frontend/src/utils/seo.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/seo.ts) providing trailing-slash canonical metadata builders, OpenGraph/Twitter card defaults, `Organization`/`NGO` + `WebSite` Knowledge Graph JSON-LD, upcoming `Event` JSON-LD, and `BreadcrumbList` generators; wire into [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx) and [`manifest.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/manifest.ts).
2. [x] **Brand v3.0.0 Social Share Assets (`@dev`):** Generate deterministic `1200×630` `opengraph-image.png` and `twitter-image.png` (plus `.alt.txt`) in `src/frontend/src/app/` so all routes—including locked `/archive/**` pages—emit `summary_large_image` social previews.
3. [x] **Archive Event & ScholarlyArticle JSON-LD Repair (`@dev`):** Upgrade [`generateArchiveJsonLd.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/generateArchiveJsonLd.ts) to parse en-dash (`–`) and yearless workshop dates (`15/15` valid ISO `startDate`/`endDate`), fix `"False"` string -> boolean `false`, and enrich `Event` + `ScholarlyArticle` properties (`0` edits to `src/frontend/src/app/archive/**`).
4. [x] **Sitemap, Robots, `llms.txt` & Private Route `noindex` (`@dev`):** Normalize all `27` public URLs to trailing slashes with `<lastmod>` in [`sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts), harden [`robots.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/robots.ts), add `noindex, nofollow` layouts for `/auth`, `/admin`, `/board`, `/reviewer`, and overhaul [`public/llms.txt`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/llms.txt).
5. [x] **Page-Level Metadata, `ContactClient` Split & Intrinsic Image Dimensions (`@dev`):** Extract [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx), apply unique canonical metadata + JSON-LD across all 11 non-archive public pages, fix `h2` -> `h3` hierarchy in [`formatting-guidelines/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/formatting-guidelines/page.tsx), and add explicit `width`/`height` image attributes.
6. [x] **Archive–Manager Architectural Review & Authorized Archive SEO Completion (`@arch`, `@dev`):** Reviewed the one-way `tools/manager` -> `master_workshops.json` -> `archives/[year].json` -> `build-prod.js` pipeline ([`2026-11-11-archive-manager-review-and-seo-updates.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-11-archive-manager-review-and-seo-updates.md)); extracted [`ArchiveHubClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/archive/ArchiveHubClient.tsx) (fixing the missing `2025` browse card via dynamic `master_workshops.json` derivation), converted [`archive/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/page.tsx) to a Server Component with `CollectionPage` + `ItemList` + `BreadcrumbList` JSON-LD, and upgraded [`archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) with trailing-slash canonicals, `1200×630` `og:image`/`twitter:image`, `BreadcrumbList` JSON-LD, and intrinsic `width`/`height` attributes (`0` mutations to archive JSON datasets or Manager routes).

---

### Phase 10: Website-Wide Cell Phone & Tablet Compatibility [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-11-11-mobile-and-tablet-compatibility.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-11-mobile-and-tablet-compatibility.md)

1. [x] **Viewport Metadata & Global Overflow Guards (`@dev`):** Export explicit Next.js `Viewport` (`device-width`, `initialScale: 1`, `viewportFit: "cover"`, `themeColor: "#FAFBFD"`) in [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx) and add `overflow-x: clip` + `.no-scrollbar` touch rail helpers in [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css).
2. [x] **Tablet-Safe & Touch-First Site Shell (`@dev`):** Promote desktop horizontal nav in [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) from `md:flex` to `lg:flex` (`1024px+`) to eliminate portrait-tablet (`768px–1023px`) horizontal overflow; add tap/click toggles with outside-click & `Escape` dismissal for `Archives` and signed-in `User` popovers on landscape touch tablets; upgrade the `< 1024px` drawer with `44px` tap targets, collapsible `2027 Workshop` & `Proceedings Archives` sub-menus, and authenticated `Admin` / `Sign Out` controls; expand tap spacing in [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx).
3. [x] **Mobile & Portrait-Tablet Workshop Portal Sub-Navigation (`@dev`):** Promote the fixed left sidebar in [`(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx) to `lg:flex lg:w-64`, inject a sticky touch-scrollable horizontal pill sub-navigation bar (`lg:hidden`) across all authorized portal and officer routes, normalize trailing slashes for active states, and add `min-w-0` + responsive padding to prevent flex/table blowouts.
4. [x] **Homepage, Subpage, Modal & iOS Safari `16px` Form Ergonomics (`@dev`):** Fix 2×2 / 4-col Impact Ledger border/padding alignment and narrow-phone CTAs in [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`UpcomingHeroBadge.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingHeroBadge.tsx), and [`UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx); gate [`FrontendPreviewHover.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/FrontendPreviewHover.tsx) (`hidden md:block`, `w-[min(400px,calc(100vw-2rem))]`); add `max-h-[90dvh] overflow-y-auto` to [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx) & [`CitationModal.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/CitationModal.tsx); upgrade form controls to `text-base sm:text-sm` (`16px` mobile) to prevent iOS Safari focus zoom; and apply responsive card padding, unbroken string wrapping (`break-all`), and wrapping action rows across all subpages and officer panels (`0` edits to `src/frontend/src/app/archive/**`).

### Phase 11: History Milestone Trim & Provenance-Driven Photo Captions [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-11-11-editorial-trim-and-provenance-captions.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-11-editorial-trim-and-provenance-captions.md)

1. [x] **Remove Redundant `'Key Historical Milestones'` Section (`@dev`):** Delete `TIMELINE_EVENTS` and Chapter 03 from [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), renumbering Chapter 04 to `03 — Summary & The HEMS Philosophy` with balanced section contrast.
2. [x] **Provenance-First Photo Captions Across All 8 Public Routes (`@prod`, `@dev`):** Replace visual-description captions across [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx), [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), [`PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx), [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx), [`CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx), [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx), and [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx) with EXIF- and Program-verified unseen context (dates, hotels/venues, cities, sessions, and authors/affiliations) while preserving screen-reader `alt` attributes (`0` edits to `src/frontend/src/app/archive/**`).

### Phase 12: Brand Guidelines v3.1.0 Sitewide Rollout & Web Image Optimization [COMPLETED]
*Detailed Architectural Plan:* [docs/plans/2026-11-11-brand-v3-1-typography-and-image-optimization.md](file:///c:/AntigravityP1_2/HEMS-website/docs/plans/2026-11-11-brand-v3-1-typography-and-image-optimization.md)

1. [x] **Retire `IBM_Plex_Mono` & Roll Out Dual-Font `v3.1.0` (`@dev`):** Removed `IBM_Plex_Mono` from [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx), aliased `--font-mono` to `var(--font-noto-sans)` in [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css), replaced `font-mono` / `var(--font-ibm-mono)` across all 24 unlocked frontend files with `Noto Sans` (`tabular-nums` on dates/fees/metrics), and regenerated `2x` supersampled `opengraph-image.png` & `twitter-image.png` (`0` edits to `src/frontend/src/app/archive/**`).
2. [x] **Web-Sized Photography, Non-Generative Quality Polish & Before/After Archive (`@dev`, `@ops`):** Optimized all 21 images in `src/frontend/public/images/{history,gallery}/` (`73.59 MB` -> `4.95 MB`, `-93.3%`, with the 11 camera JPEGs dropping from `72.18 MB` to `3.02 MB`, `-95.8%`) via strictly non-generative `Pillow` + `NumPy` + `SciPy` signal processing: content-preserving framing crops, EXIF upright portrait baking (`group-photo-2025.jpg`, `1029×1600`), chroma/luminance grain reduction, tungsten/fluorescent white-balance & shadow polish, and Lanczos upscaling on low-res slide graphics; preserved untouched originals and side-by-side comparison plates in git-ignored `src/frontend/photo_review/` and synchronized all `width`/`height` attributes (`CLS = 0`).

---

## Verification Plan

### Automated Tests
- Per-workshop reference cross-audit script prior to each step.
- `npm --prefix src/frontend run build`
- `npm --prefix functions run build`

### Manual Verification
- At each gate, open [http://localhost:3000/manager](http://localhost:3000/manager) and expand that specific workshop to confirm all green checks, previews, and PDF streaming.
