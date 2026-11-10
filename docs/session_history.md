# Session History: Proceedings Migration, Legacy URL Restoration, and Sponsor Reorganization

**Date:** 2026-09-02  
**Epic:** Proceedings Catalog Reconciliation, Legacy 301 Redirect Restoration, and Sponsor Logos Reorganization  
**Agents Engaged:** @arch, @ops, @dev, @qa, @bo  

---

## 1. Executive Summary

During this session, the team executed a four-phase modernization and architectural hardening of the HEMS workshop archives and local proceedings datasets:

1. **Phase 1: Canonical Registries Relocation**
   - Created `docs/registries/`.
   - Promoted `redirect_map.json` -> [`docs/registries/permalink_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/docs/registries/permalink_registry.json).
   - Relocated SEO registry -> [`docs/registries/pdf_seo_registry.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/registries/pdf_seo_registry.md).

2. **Phase 2: Proceedings Deduplication & Migration (15/15 Workshops)**
   - Audited and migrated all 15 workshop proceeding archives into [`local_data/proceedings/`](file:///c:/AntigravityP1_2/HEMS-website/local_data/proceedings) (1,590 files, 1.68 GB).
   - Rescued 22 unique slide images from the 3rd Workshop (2002).
   - Maintained strict native resolution across all files.
   - Performed bidirectional forensic comparison against public GCloud Storage: verified 1,568 bit-for-bit identical matches, 0 size mismatches, and 0 content hash mismatches.
   - Safely pruned all 15 backup directories under `docs/archives_translation/proceedings_backup/`.

3. **Legacy URL Restoration & 301 Redirect Alignment**
   - Restored **331 legacy presentation, abstract, poster, and resource URLs** across Workshops 7 through 14 into [`master_workshops.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/master_workshops.json).
   - Patched [`src/frontend/src/app/api/manager/save/route.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/api/manager/save/route.ts) lines 247–248 and 286–287 so `legacy_url` is preserved on future saves.
   - Re-mapped all 34 entries in [`permalink_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/docs/registries/permalink_registry.json) to verified on-disk canonical paths in `local_data/proceedings/14th/`.

4. **Phase 3: Sponsor Logos Reorganization & Workshop Manager Sync**
   - Created [`local_data/sponsors/`](file:///c:/AntigravityP1_2/HEMS-website/local_data/sponsors) containing the complete 91-asset master archive (union of 67 historical raw logos and 79 active web logos).
   - Audited all 52 corporate registry entries and 131 workshop sponsor references: 0 missing files.
   - Verified that `getSponsorsDir()` in [`assetPaths.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/assetPaths.ts) seamlessly switches to `local_data/sponsors/`.

5. **Phase 4: Final Cleanup & Git Hardening**
   - Completely deleted legacy directory `docs/archives_translation/`.
   - Updated [`.gitignore`](file:///c:/AntigravityP1_2/HEMS-website/.gitignore) to cleanly track `local_data/sponsors/` while ignoring local proceedings archives.
   - Updated [`README.md`](file:///c:/AntigravityP1_2/HEMS-website/README.md) with modern architecture diagrams and directory structure.
   - Verified 100% successful production build across `src/frontend` and `functions`.


---

# Session History: Mission & History Completion, 484 MB Static Bundle Cleanup & Local Archive Dev Fix

**Date:** 2026-11-10  
**Epic:** Phase 5 Frontend Modernization Completion, Workspace Hygiene & Local Archive Routing  
**Agents Engaged:** @arch, @dev, @ops, @qa, @brand, @bo  

---

## 1. Executive Summary

1. **Phase 5 Frontend Modernization Completed:**
   - Integrated canonical [`mission-statementV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/mission-statementV1.md) and [`historyV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV1.md) across [`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) and [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx).
   - Synchronized all 7 Decap CMS Markdown files in `src/frontend/content/pages/` with verified Society governance, Sheraton Virginia Beach ($124/night), $250/$500/$1,350 registration/sponsorship rates, and Tim Short billing contact details.

2. **484 MB Static Bundle Bloat Eliminated (Zero Data Loss):**
   - Relocated 615 extracted PDF page-text caches from `src/frontend/public/assets/archives/cache/` to `local_data/cache/` and updated [`index-pdf-contents.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/index-pdf-contents.js).
   - Archived legacy duplicate 2017/2018 PDFs from `src/frontend/public/assets/archives/` to git-ignored `archive/legacy_public_assets/`, shrinking static build output (`src/frontend/out/`) from **508.20 MB to ~24.3 MB**.

3. **Local Archive PDF & Preview Routing Restored:**
   - Updated [`src/frontend/src/app/archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) and [`src/frontend/next.config.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/next.config.ts) so `http://localhost:3000/archive/[year]` resolves published GCS PDFs and hover previews out-of-the-box while proxying `/api/manager/*` to `http://localhost:4000` in local dev.

4. **UI Polish & Repository Documentation:**
   - Published [`docs/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/project_charter.md) and updated [`README.md`](file:///c:/AntigravityP1_2/HEMS-website/README.md) for the standalone `tools/manager` architecture (`localhost:4000`).
   - Upgraded `/contact` (interactive static-compatible `mailto:` inquiry builder & governance card), `/formatting-guidelines` (live 15th Workshop program & archive abstract links), and `/layout-portal` (real 2025 papers & 16th Biennial status).
   - Removed dead `ConditionalNavbar`/`ConditionalFooter` pass-through wrappers, untracked stray Playwright PNGs in `tests/`, and updated integration specs to port 4000.


## 2. Addendum: Dedicated `/history` Route & Archive Page Lock Enforcement (`d611664`)

- **Strict Archive Page Lock:** Reverted [`src/frontend/src/app/archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) to baseline `b6a0075` (0 diff across `src/frontend/src/app/archive/**`) and codified an explicit rule in [`docs/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/project_charter.md) prohibiting edits to archive pages without explicit **@bo** permission.
- **Dedicated History Page (`/history`):** Extracted **Workshop & Society History** into [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) (incorporating the complete narrative from `historyV1.md`), focused [`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) on Official Mission & Core Strategic Objectives, and wired `/history` into `Navbar.tsx`, `Footer.tsx`, `page.tsx`, `sitemap.ts`, `content/pages/history.md`, and `public/admin/config.yml`.

## 3. Addendum: Evergreen Corporate Sponsorship Page & Contact-Page Discovery

- **Standalone Public Route (`/corporate-sponsorship`):** Relocated `/corporate-sponsorship` out of `(portal)/` to [`src/frontend/src/app/corporate-sponsorship/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx), adapting all canonical facts from legacy `15thCorp_Sponsors.html` into an evergreen year-after-year layout (all-volunteer 501(c)(3) open forum with no membership dues, independent funding model, Student Travel Award impact, hardware/literature exhibition + corporate poster + banner/program/website logo benefits, `$1,350` combined / `$850 + $500` split-invoice / `$850` non-attending structures via `shop.hems-workshop.org`, downloadable prospectus PDF, and Coordinator Tim Short `rtshort00@gmail.com`).
- **Dynamic Corporate Registry Binding:** Connected the Past & Continuing Corporate Sponsors showcase directly to [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json) (52 partners since 2001) with non-mutating URL protocol and Linux case-sensitive logo normalization (`Saes_Getters.png`).
- **Contact-Only Navigation Wiring:** Added prominent Corporate Sponsorship discovery to [`src/frontend/src/app/contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx) (dedicated Corporate Sponsorship feature card, Direct Channel link, contextual inquiry banner, and `?topic=sponsorship` pre-fill) while keeping [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) free of Corporate Sponsorship links.

## 4. Addendum: Standalone Student Travel Awards Page & Navbar Link (`/student-awards`)

- **Moved Out of Workshop Portal:** Relocated `/student-awards` out of `(portal)/` to standalone full-width [`src/frontend/src/app/student-awards/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/student-awards/page.tsx) and removed `Student Awards` from [`src/frontend/src/app/(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx).
- **Navbar & Site Navigation:** Added **Student Travel Awards** (`/student-awards`) directly to [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx), [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx), [`sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts), [`content/pages/student-awards.md`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/content/pages/student-awards.md), and [`public/admin/config.yml`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/admin/config.yml).
- **Legacy Content Alignment:** Synchronized Purpose, `$1,500.00` proposed award amount, M.S./M.A./Ph.D. eligibility, the 4 required application documents, the 4 evaluation criteria, the extended Friday, August 8, 2025 deadline, and HEMS Student Awards Committee submission email (`hemsworkshop@hems-workshop.org`) verbatim against `https://www.hems-workshop.org/15thWS/15thstudenttravel.html`.

## 5. Addendum: Removal of Non-Existent HEMS Store References

- Removed all mentions of `HEMS Store`, `HEMS Workshop Store`, and `http://shop.hems-workshop.org` from [`src/frontend/src/app/corporate-sponsorship/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx), [`src/frontend/src/app/(portal)/registration/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/registration/page.tsx), [`src/frontend/content/pages/corporate-sponsorship.md`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/content/pages/corporate-sponsorship.md), and [`src/frontend/content/pages/registration.md`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/content/pages/registration.md), routing sponsorship registration and split-billing inquiries directly through Coordinator Tim Short (`rtshort00@gmail.com`) and `/corporate-sponsorship`.

## 6. Addendum: Decap CMS Retirement & Google Sheets Upcoming Workshop Architecture (16th Workshop • Sept 2027)

- **Retired Decap CMS:** Removed `src/frontend/public/admin/`, `src/frontend/content/`, and `docs/decap_cms_guide.html`, eliminating GitHub-login friction for volunteer committee members and resolving the `/admin` static export path collision while preserving `tools/manager/` (`localhost:4000`) exclusively for historical Proceedings Archives.
- **Google Sheets + Static JSON Connector (`$0` Nonprofit Tier):** Implemented [`src/frontend/src/data/upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json) (seeded for the **16th HEMS Workshop • September 2027**), [`src/frontend/src/utils/upcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/upcomingWorkshop.ts), [`src/frontend/src/hooks/useUpcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useUpcomingWorkshop.ts), and [`src/frontend/scripts/sync-workshop-sheet.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/sync-workshop-sheet.js).
- **Wired All 8 Workshop-Cycle Surfaces:** Connected Home, Student Travel Awards, Contact, Portal Overview, Call for Papers, Registration, Accommodations, and Corporate Sponsorship to `useUpcomingWorkshop()` with clean `TBA` / `"Opening Soon"` fallbacks (`0` edits to `src/frontend/src/app/archive/**`).
- **Published Ready-to-Import Nonprofit Sheet Templates:** Added [`1_Workshop_Config.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/1_Workshop_Config.csv), [`2_Website_Ingestion_Checklist.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/2_Website_Ingestion_Checklist.csv), and [`docs/workshop-sheets/README.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/README.md).

## 7. Addendum: Live Google Sheet Binding, Cloud Governance & Architecture v4.0 (`7a6e6ac`–`fd907fe`)

- **Cloud & Plugin Hygiene:** Standardized `gcloud` (`hems` profile), ADC, and `firebase` CLI under `webmaster@hems-workshop.org` (`hems-workshop` / `996590178042`), purged 21 stray `googlecloudtools.datacloud` BigQuery/Spark skills from `.agents/skills/`, deleted zero-byte `firebase-key.json`, and consolidated [`src/frontend/.env.example`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/.env.example).
- **Live Nonprofit Sheet Connected:** Moved `HEMS Upcoming Workshop Control Center` into `webmaster@hems-workshop.org`'s `My Drive` (`Webmaster Access` OU), published `1_Workshop_Config` (`gid=540431442`) as read-only CSV (`HTTP 200 OK` + CORS `*`), wired [`upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json), updated [`docs/system_design_architecture.html`](file:///c:/AntigravityP1_2/HEMS-website/docs/system_design_architecture.html) to **v4.0**, and launched private 30-day Firebase Hosting Preview Channel `preview-2027`.

## 8. Addendum: Brand Guidelines v3.0.0 & Editorial Academic Homepage Preview

- **Brand Guide Archive & Upgrade (`@brand`):** Archived `v2.0.0` to [`docs/design/archive/brand-guidelines-v2.0.0.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/design/archive/brand-guidelines-v2.0.0.md) and `.agents/config/design/archive/brand-guidelines-v2.0.0.md`, and published **v3.0.0 (*"Scholarly Precision & Editorial Symposium"*)** in [`docs/design/brand-guidelines.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/design/brand-guidelines.md) and `.agents/config/design/brand-guidelines.md`.
- **Site Shell & Editorial Homepage (`@dev`):** Implemented `Source Serif 4` + `Noto Sans` + `IBM Plex Mono` via `next/font/google` in [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx), updated Alabaster Paper & Oceanic Sapphire tokens in [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css), refined [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) and [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx), created [`UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx), and built the new editorial homepage in [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) (preserving `0` changes to `src/frontend/src/app/archive/**`).
