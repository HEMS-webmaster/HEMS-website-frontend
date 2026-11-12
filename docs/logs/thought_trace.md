# Silent Chain-of-Thought (SCoT) Log

## [2026-09-02] Project Review & Cold Start Initialization
- **Agent**: @arch & @team
- **Context**: Human User (@bo) requested a comprehensive review of the HEMS website rebuilding project (rebuilding www.hems-workshop.org).
- **Analysis**:
  - Investigated workspace structure: Next.js 16 frontend with Tailwind CSS v4, Firebase Cloud Functions (v2 / Node 22), Firestore security rules with RBAC and whitelist-based permission sync, comprehensive archive management system (1999-2025 proceedings) with local dev PDF server and cloud sync tooling, and role-based portal architecture (Admin, Board, Reviewer, Corporate, Students).
  - Validated adherence to locks and scrum rules: domain isolation, cold start protocol, and SCoT logging.
- **Next Steps**: Formulate a structured architectural and functional assessment for @bo and the ART team.

## [2026-09-02] Ops Consultation: In-Place Cleanup vs. New Workspace
- **Agent**: @ops
- **Context**: @bo requested guidance on whether to migrate key assets to a clean new workspace or clean in-place and archive legacy scrapers/clutter.
- **Analysis**:
  - Evaluated Git integrity: `git status` is clean, `.gitignore` already properly isolates heavy payload files (`source-material/`, `docs/archives_translation/`, binary zip, credentials).
  - Evaluated migration risk: Moving to a new workspace risks breaking Firebase project bindings, Firestore security rules linkage, Functions v2 triggers, and the Next.js runtime environment.
  - Strategic recommendation: Maintain the current repository. Execute in-place cleanup by purging root test artifacts, removing transient log files (`src/frontend/*.log`), archiving legacy one-off python scripts, and consolidating directory structure.

## [2026-09-02] Arch Implementation Plan: Phased In-Place Workspace Cleanup
- **Agent**: @arch
- **Context**: @bo requested a step-by-step cleanup implementation plan with clear verification gates at each step.
- **Architectural Strategy**:
  - Phase 1: Purge transient files, root test binaries, debug logs, and corrupted file copies.
  - Phase 2: Consolidate one-off scraping/migration scripts into an archived legacy folder or purge obsolete files.
  - Phase 3: Harden `.gitignore` and audit repository configuration to prevent future payload bloat.
  - Phase 4: Full project build & regression verification (`src/frontend` and `functions`).
- **Safety Gate**: Each phase will be staged such that @bo can audit disk state and run verification before progressing.

## [2026-09-02] Arch & Ops Advisory: Local Archive Location (`docs/archives_translation` vs `src/backend`)
- **Agent**: @arch & @ops
- **Context**: @bo asked if `docs/archives_translation` (3.6 GB local archive) should be moved to `src/backend/` to maintain parallel local/cloud mirrors.
- **Analysis**:
  - Binary Scale: `docs/archives_translation` contains 3,227 files (~3.6 GB) of PDFs, PPTs, images, and HTML.
  - Source Code Isolation: `src/` is strictly for executable source code (`.ts`, `.tsx`, `.js`, `.css`). Placing 3.6 GB of binaries into `src/backend/` violates domain separation, can trigger bundler file watchers, slows down TypeScript indexing, and risks packaging issues during static builds.
  - Active Tooling Bindings: 9 API routes in `src/frontend/src/app/api/manager/*`, `push-to-live.js`, `index-pdf-contents.js`, and `pdf_seo_registry.md` are directly calibrated to `docs/archives_translation/`.

## [2026-09-02] Ops Execution: Launch Local Workshop Manager
- **Agent**: @ops
- **Context**: @bo requested running the local version of the Workshop Manager.
- **Action**: Launching Next.js development server (`npm run dev` in `src/frontend`) targeting `http://localhost:3000/manager`.

## [2026-09-02] Arch Verification: Workshop Manager (`/manager`) Dependency Audit
- **Agent**: @arch
- **Context**: @bo asked if the cleanup implementation plan ensures `http://localhost:3000/manager/` is not broken.
- **Dependency Audit**:
  - UI Source: `src/frontend/src/app/manager/` (including all subcomponents and `page.tsx`) is 100% preserved. Only `page.tsx.corrupt` (an abandoned corrupt file clone) is deleted.
  - API Endpoints: All 11 API routes in `src/frontend/src/app/api/manager/*` (`workshops`, `save`, `serve`, `upload`, `preview`, `push-to-live`, `delete`, etc.) are 100% preserved.
  - Data Files: `src/frontend/src/data/master_workshops.json`, `corporate_registry.json`, and `archives/*.json` are untouched.
  - Local Assets: `docs/archives_translation/proceedings/` and `sponsors/` remain in place, preserving local PDF streaming and file previews.
  - Build & Deploy Scripts: `src/frontend/scripts/build-prod.js`, `push-to-live.js`, and `index-pdf-contents.js` are retained.

## [2026-09-02] Ops Execution: Restart Workshop Manager Dev Server
- **Agent**: @ops
- **Context**: @bo requested restarting the Workshop Manager dev server.
- **Action**: Launching `npm run dev` in `src/frontend` with Turbopack, listening on `http://localhost:3000/manager`.

## [2026-09-02] Ops Execution: Step 1 Cleanup - Transient Logs & Test Binaries
- **Agent**: @ops
- **Context**: @bo authorized Step 1 of the workspace cleanup plan (`docs/plans/2026-09-02-workspace-cleanup.md`).
- **Action**:
  - Remove root test binary: `15th_Bell_Underwater_Mass_Spectrometry_Presentation_test.pdf`.
  - Remove root scratch archive: `scratch_archive.zip`.
  - Remove frontend build & debug logs: `src/frontend/dev.log`, `src/frontend/build.log`, `src/frontend/build2.log`, `src/frontend/firebase-debug.log`, `src/frontend/lint.txt`.
  - Remove leftover corrupt clone: `src/frontend/src/app/manager/page.tsx.corrupt`.

## [2026-09-02] Ops Execution: Git Atomic Sync for Step 1 Cleanup
- **Agent**: @ops & @arch
- **Context**: @bo requested pushing the Step 1 cleanup changes to Git.
- **Workflow**: Antigravity `/atomic-commit-push`.
- **Payload**: Deleting transient build logs, debug dumps, and root test PDF; updating SCoT and handover logs.

## [2026-09-02] Ops Execution: Step 2 Cleanup - Consolidate Legacy Migration Tools
- **Agent**: @ops
- **Context**: @bo authorized Step 2 of the workspace cleanup plan (`docs/plans/2026-09-02-workspace-cleanup.md`).
- **Action**:
  - Create directory: `archive/legacy_tools/`.
  - Move scrapers and raw extraction files: `create_2019_page.py`, `fetch.py`, `13thprogram.html` into `archive/legacy_tools/`.
  - Move completed one-off migration scripts: `src/frontend/scripts/import_legacy_data.js`, `src/frontend/scripts/migrate_2022.js` into `archive/legacy_tools/`.
  - Retain core build/indexing scripts in `src/frontend/scripts/`: `build-prod.js`, `generate-archives-index.js`, `index-pdf-contents.js`, `push-to-live.js`.

## [2026-09-02] Ops Execution: Step 3 - Git Hygiene & Documentation
- **Agent**: @ops
- **Context**: @bo authorized Step 3 of the workspace cleanup plan (`docs/plans/2026-09-02-workspace-cleanup.md`).
- **Action**:
  - Update `.gitignore` to block future log dumps (`*.log`, `*.log.*`), lint outputs (`lint.txt`), corrupt backups (`*.corrupt`), and local scraper tools (`archive/`).
  - Author comprehensive `README.md` documenting architecture, local dev workflows, Workshop Manager usage, and deployment pipeline.

## [2026-09-02] Ops Execution: Step 4 - Full Pipeline Build & Typecheck Verification
- **Agent**: @ops
- **Context**: @bo authorized Step 4 of the workspace cleanup plan (`docs/plans/2026-09-02-workspace-cleanup.md`).
- **Action**:
  - Execute frontend static production build (`npm run build` in `src/frontend`).
  - Execute Cloud Functions TypeScript compilation (`npm run build` in `functions`).
  - Verify static export and 0 TypeScript errors across all routes and portals.

## [2026-09-02] Ops Execution: Final Git Atomic Sync for Steps 2-4
- **Agent**: @ops & @arch
- **Context**: @bo authorized the final git commit and push to finalize workspace cleanup.
- **Workflow**: Antigravity `/atomic-commit-push`.
- **Payload**: Hardened `.gitignore`, comprehensive `README.md`, updated SCoT thought trace, and removal of old script paths in favor of `archive/legacy_tools/`.

## [2026-09-02] Ops Execution: System Lock Encountered on `source-material/`
- **Agent**: @ops
- **Context**: @bo requested moving `source-material/` into `archive/`.
- **Constraint**: `locksrules.md` Rule 1 explicitly locks `/source-material` as READ-ONLY (Immutable Reference Lock). Moving or modifying this directory is strictly prohibited without explicit user permission.

## [2026-09-02] Ops Execution: Authorized Move of `source-material/` to `archive/`
- **Agent**: @ops
- **Context**: @bo granted explicit permission to bypass Lock Rule #1 to move `source-material/` into `archive/`.
- **Action**: Move `source-material/` directory to `archive/source-material/`.

## [2026-09-02] Arch & Ops Architecture Plan: Local Data & Registry Reorganization
- **Agent**: @arch & @ops
- **Context**: @bo requested a comprehensive plan to clean up and reorganize `docs/archives_translation` and related registries (SEO registry, permalink registry, proceedings, sponsors).
- **Discovery Findings**:
  1. Clutter & Redundancy: `proceedings_backup/` contains 1,591 files (~1.71 GB) which is a 99% duplicate of `proceedings/` (only 22 slide JPGs in `3rd/kibelka fix` are unique). `raw_html/` is completely empty.
  2. Registry Dispersal: `redirect_map.json` is buried inside `docs/archives_translation/proceedings/`; `pdf_seo_registry.md` is mislocated under `docs/design/`.
  3. Hardcoded Coupling: 10 backend API routes and CLI scripts hardcode the string path `docs/archives_translation/proceedings`.
- **Architectural Strategy**:
  - Phase 1: Deduplicate & Purge Clutter (rescue 22 JPG slides, delete 1.71 GB `proceedings_backup`, remove empty `raw_html`).
  - Phase 2: Establish Canonical Registries Hub in `docs/registries/` (`permalink_registry.json`, `pdf_seo_registry.md`).
  - Phase 3: Transition `docs/archives_translation` to a clean top-level `local_data/` (or semantic `data/`) directory, decoupling binary storage from `docs/`.
  - Phase 4: Create a centralized path configuration helper in `src/frontend/src/config/paths.ts` (or `manager/utils/paths.ts`) and refactor the 10 endpoints/scripts to import from this single source of truth.

## [2026-09-02] Arch & Ops Plan Refinement: Manager Reference Authority Protocol
- **Agent**: @ops & @arch
- **Context**: @bo requested updating the implementation plan to guarantee that during duplicate file reconciliation/merging, the version actively referenced by the Workshop Manager is strictly retained.
- **Protocol Definition**:
  - Step 1.1: Catalog Extraction — Extract all referenced filenames and target paths from `master_workshops.json` and `archives/*.json`.
  - Step 1.2: Checksum & Reference Cross-Audit — For any colliding or duplicate files, cross-reference against the active Manager catalog.

## [2026-09-02] Arch & Ops Plan Refinement: Workshop-by-Workshop Discrete Migration
- **Agent**: @arch & @ops
- **Context**: @bo requested breaking the plan down into discrete, checkable steps (one workshop archive at a time) to allow granular monitoring and verification.
- **Architectural Design**:
  - Phase 0 (Foundation): Build `assetPaths.ts` with dual-path fallback (`local_data/proceedings/[ws]` -> `docs/archives_translation/proceedings/[ws]`). This allows partial, incremental migration with zero downtime.
  - Phase 1 (Registries): Relocate `redirect_map.json` and `pdf_seo_registry.md` to `docs/registries/`.
  - Phase 2 (15 Discrete Workshop Milestones): Migrate each workshop from 1st to 15th individually:
    1. Run catalog audit for that workshop.
    2. Deduplicate vs `proceedings_backup` using Manager Reference Authority.
    3. Move to `local_data/proceedings/[N]th`.
    4. Purge backup copy for that workshop.
    5. Checkpoint: Verify workshop in Manager UI at `http://localhost:3000/manager`.
  - Phase 3 (Sponsors): Migrate `docs/archives_translation/sponsors/` to `local_data/sponsors/`.

## [2026-09-02] Ops Execution: Phase 0 Foundation & Phase 1 Registries Hub
- **Agent**: @ops & @arch
- **Context**: @bo authorized beginning the migration plan.
- **Action**:
  - Phase 0: Deploy `src/frontend/src/utils/assetPaths.ts` with dual-path fallback (`local_data` with fallback to `docs/archives_translation`). Refactor Manager API routes to import from this resolver.
  - Phase 1: Create `docs/registries/`, relocate `redirect_map.json` -> `docs/registries/permalink_registry.json`, relocate `pdf_seo_registry.md` -> `docs/registries/pdf_seo_registry.md`.
## [2026-09-02] Ops Execution Complete: Step 1 (Foundation, Registries & 1st Workshop 1999)
- **Agent**: @ops & @arch
- **Milestone Reached**:
  - Phase 0: Created `src/frontend/src/utils/assetPaths.ts` and refactored all 8 Manager API endpoints and 2 build scripts.
  - Phase 1: Established `docs/registries/` containing `permalink_registry.json` and `pdf_seo_registry.md`.
  - Step 2.1: Migrated 1st Workshop (1999) to `local_data/proceedings/1st`, audited duplicate against `proceedings_backup`, retained Manager-referenced file, pruned backup copy.
  - Git Hygiene: Updated `.gitignore` to ignore `local_data/*/` while preserving sponsor tracking.

## [2026-09-02] Ops Execution: Step 2 (2nd Workshop 2001 Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized Step 2: 2nd Workshop (2001).
- **Procedure**:
  1. Catalog Extraction: Scan `master_workshops.json` and `archives/2001.json` for all referenced files in 2nd workshop.
  2. Duplicate Comparison: Cross-reference files and hashes between `docs/archives_translation/proceedings/2nd` and `docs/archives_translation/proceedings_backup/2nd`.
  3. Manager Reference Authority: Verify all referenced files are retained.
  4. Migration: Move `docs/archives_translation/proceedings/2nd` to `local_data/proceedings/2nd`.
  5. Backup Pruning: Delete `docs/archives_translation/proceedings_backup/2nd`.
- **Result**:
  - Catalog audit confirmed 52 files in 2nd workshop. 50 were bit-for-bit identical with backup. 2 administrative files had newer web-optimized versions in `proceedings/` which were retained under Manager Reference Authority.
  - Successfully moved `proceedings/2nd` -> `local_data/proceedings/2nd` (52 files, 0.41 MB).
  - Pruned `proceedings_backup/2nd`.

## [2026-09-02] Ops Execution: Step 2.3 (3rd Workshop 2002 Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized Step 2.3: 3rd Workshop (2002).
- **Procedure**:
  1. Catalog Extraction: Scan `master_workshops.json` and `archives/2002.json` for all referenced files in 3rd workshop.
  2. Duplicate Comparison: Audit `proceedings/3rd` vs `proceedings_backup/3rd`.
  3. Unique Slide Rescue: Copy 22 slide JPGs from `proceedings_backup/3rd/kibelka fix/` to `local_data/proceedings/3rd/kibelka fix/` to ensure no historical assets are lost.
  4. Manager Reference Authority: Verify all referenced files are retained from `proceedings/3rd`.
  5. Migration: Move `proceedings/3rd` to `local_data/proceedings/3rd`.
  6. Backup Pruning: Delete `proceedings_backup/3rd`.
- **Result**:
  - Catalog audit confirmed 137 files in `proceedings/3rd` and 159 files in `proceedings_backup/3rd`.
  - Rescued the 22 unique JPG slide images from `proceedings_backup/3rd/kibelka fix` into `local_data/proceedings/3rd/kibelka fix/`.
  - Manager Reference Authority retained the newer, assembled 137 files from `proceedings/3rd` (including the 1.37 MB assembled Kibelka presentation vs 1.14 MB backup).
  - Pruned `proceedings_backup/3rd`.

## [2026-09-02] Ops Execution: Step 2.4 (4th Workshop 2003 Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized Step 2.4: 4th Workshop (2003).
- **Procedure**:
  1. Catalog Extraction: Scan `master_workshops.json` and `archives/2003.json` for all referenced files in 4th workshop.
  2. Duplicate Comparison: Audit `proceedings/4th` vs `proceedings_backup/4th`.
  3. Manager Reference Authority: Verify all referenced files are retained from `proceedings/4th`.
  4. Migration: Move `proceedings/4th` to `local_data/proceedings/4th`.
  5. Backup Pruning: Delete `proceedings_backup/4th`.
- **Result**:
  - Catalog audit confirmed 44 files in both `proceedings/4th` and `proceedings_backup/4th`. 43 files were bit-for-bit identical; 1 participant list file had an updated web-optimized version in `proceedings/` retained under Manager Reference Authority.
  - Successfully moved `proceedings/4th` -> `local_data/proceedings/4th` (44 files, 38.27 MB).
  - Pruned `proceedings_backup/4th`.

## [2026-09-02] Ops Execution: Step 2.5 (5th Workshop 2005 Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized Step 2.5: 5th Workshop (2005).
- **Procedure**:
  1. Catalog Extraction: Scan `master_workshops.json` and `archives/2005.json` for all referenced files in 5th workshop.
  2. Duplicate Comparison: Audit `proceedings/5th` vs `proceedings_backup/5th`.
  3. Manager Reference Authority: Verify all referenced files are retained from `proceedings/5th`.
  4. Migration: Move `proceedings/5th` to `local_data/proceedings/5th`.
  5. Backup Pruning: Delete `proceedings_backup/5th`.
- **Result**:
  - Catalog audit confirmed 130 files in both `proceedings/5th` and `proceedings_backup/5th`. 129 files were bit-for-bit identical; 1 participant list file had an updated web-optimized version in `proceedings/` retained under Manager Reference Authority.
  - Successfully moved `proceedings/5th` -> `local_data/proceedings/5th` (130 files, 44.30 MB).
  - Pruned `proceedings_backup/5th`.

## [2026-09-02] Ops Execution: Step 2.6 (6th Workshop 2007 Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized Step 2.6: 6th Workshop (2007).
- **Procedure**:
  1. Catalog Extraction: Scan `master_workshops.json` and `archives/2007.json` for all referenced files in 6th workshop.
  2. Duplicate Comparison: Audit `proceedings/6th` vs `proceedings_backup/6th`.
  3. Manager Reference Authority: Verify all referenced files are retained from `proceedings/6th`.
  4. Migration: Move `proceedings/6th` to `local_data/proceedings/6th`.
  5. Backup Pruning: Delete `proceedings_backup/6th`.
- **Result**:
  - Catalog audit confirmed 130 files in both `proceedings/6th` and `proceedings_backup/6th`. 125 files were bit-for-bit identical; 5 administrative and student award files had updated web-optimized versions in `proceedings/` (including the full 1.2 MB complete program vs 31 KB stub in backup), which were retained under Manager Reference Authority.
  - Successfully moved `proceedings/6th` -> `local_data/proceedings/6th` (130 files, 71.88 MB).
  - Pruned `proceedings_backup/6th`.

## [2026-09-02] Ops Execution: Steps 7, 8, and 9 (7th, 8th, and 9th Workshops Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized batch execution of Steps 7 (2009), 8 (2011), and 9 (2013).
- **Procedure**:
  - For each workshop (7th, 8th, 9th):
    1. Catalog Extraction: Scan `master_workshops.json` and respective `archives/[year].json`.
    2. Duplicate Comparison: Audit `proceedings/[N]th` vs `proceedings_backup/[N]th`.
    3. Manager Reference Authority: Verify all referenced files are retained.
    4. Migration: Move `proceedings/[N]th` to `local_data/proceedings/[N]th`.
    5. Backup Pruning: Delete `proceedings_backup/[N]th`.
- **Result**:
  - 7th Workshop (2009): 228 files audited (5 hash diffs, web-optimized versions retained). Migrated to `local_data/proceedings/7th` (153.9 MB). Backup pruned.
  - 8th Workshop (2011): 166 files audited (13 hash diffs, including full 1.87 MB program vs 31 KB stub in backup). Migrated to `local_data/proceedings/8th` (110.38 MB). Backup pruned.
  - 9th Workshop (2013): 132 files audited (7 hash diffs, including full 2.18 MB program vs 30 KB stub in backup). Migrated to `local_data/proceedings/9th` (22.48 MB). Backup pruned.
  - Total files migrated across steps 7-9: 526 files (286.76 MB).
  - Pruned `proceedings_backup` for 7th, 8th, and 9th.

## [2026-09-02] Ops Execution: Steps 10, 11, and 12 (10th, 11th, and 12th Workshops Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized batch execution of Steps 10 (2015), 11 (2017), and 12 (2018).
- **Procedure**:
  - For each workshop (10th, 11th, 12th):
    1. Catalog Extraction: Scan `master_workshops.json` and respective `archives/[year].json`.
    2. Duplicate Comparison: Audit `proceedings/[N]th` vs `proceedings_backup/[N]th`.
    3. Manager Reference Authority: Verify all referenced files are retained.
    4. Migration: Move `proceedings/[N]th` to `local_data/proceedings/[N]th`.
    5. Backup Pruning: Delete `proceedings_backup/[N]th`.
- **Result**:
  - 10th Workshop (2015): 106 files audited (5 hash diffs, including full 284 KB program vs 22 KB stub in backup). Migrated to `local_data/proceedings/10th` (142.71 MB). Backup pruned.
  - 11th Workshop (2017): 104 files audited (2 hash diffs, web-optimized versions retained). Migrated to `local_data/proceedings/11th` (118.93 MB). Backup pruned.
  - 12th Workshop (2018): 40 files audited (1 hash diff, web-optimized version retained). Migrated to `local_data/proceedings/12th` (94.23 MB). Backup pruned.
  - Total files migrated across steps 10-12: 250 files (355.87 MB).
  - Pruned `proceedings_backup` for 10th, 11th, and 12th.

## [2026-09-02] Ops Execution: Steps 13, 14, and 15 (13th, 14th, and 15th Workshops Migration)
- **Agent**: @ops & @arch
- **Context**: @bo authorized batch execution of Steps 13 (2019), 14 (2022), and 15 (2025).
- **Procedure**:
  - For each workshop (13th, 14th, 15th):
    1. Catalog Extraction: Scan `master_workshops.json` and respective `archives/[year].json`.
    2. Duplicate Comparison: Audit `proceedings/[N]th` vs `proceedings_backup/[N]th`.
    3. Manager Reference Authority: Verify all referenced files are retained.
    4. Migration: Move `proceedings/[N]th` to `local_data/proceedings/[N]th`.
    5. Backup Pruning: Delete `proceedings_backup/[N]th`.
- **Result**:
  - 13th Workshop (2019): 124 files audited (14 hash diffs, web-optimized versions retained). Migrated to `local_data/proceedings/13th` (721.37 MB). Backup pruned.
  - 14th Workshop (2022): 79 files audited (4 hash diffs, web-optimized versions retained). Migrated to `local_data/proceedings/14th` (74.90 MB). Backup pruned.
  - 15th Workshop (2025): 94 files audited (4 hash diffs, web-optimized versions retained). Migrated to `local_data/proceedings/15th` (103.98 MB). Backup pruned.
  - Total files migrated across steps 13-15: 297 files (900.25 MB).
  - Pruned `proceedings_backup` for 13th, 14th, and 15th.
  - Phase 2 Proceedings Complete: All 15 workshops (1,590 files, 1.68 GB) now live in `local_data/proceedings/` with 100% Manager Reference Authority adherence.

## [2026-09-02] Ops Execution: Direct Comparison Audit (GCloud vs local_data\proceedings)
- **Agent**: @ops & @arch
- **Context**: @bo requested a direct bit-for-bit comparison between Google Cloud Storage (`gs://hems-workshop-archives/proceedings`) and `local_data\proceedings`.
- **Procedure**:
  1. Queried GCS REST API (`https://storage.googleapis.com/storage/v1/b/hems-workshop-archives/o?prefix=proceedings/`) paginating through all 1,569 objects.
  2. Extracted exact sizes, MD5 hashes, and relative paths.
  3. Scanned all 1,590 local files in `local_data/proceedings` and computed base64 MD5 hashes.
  4. Performed bidirectional diff.
- **Result**:
  - Total files on GCloud Storage: 1,569
  - Total files in `local_data/proceedings`: 1,590
  - **Exact 100% Bit-for-Bit Matches: 1,568 files**
  - **Size Mismatches: 0**
  - **Content Hash Mismatches: 0**
  - **Files Only on Local (22 files)**: The 22 rescued slide JPGs (`3rd/kibelka fix/Slide01.JPG ... Slide22.JPG`).
  - **Files Only on GCloud (1 file)**: `redirect_map.json` (promoted to `docs/registries/permalink_registry.json`).

## [2026-09-02] Arch Planning: Sponsor Logos Reorganization & Manager Synchronization
- **Agent**: @arch
- **Context**: @bo requested a comprehensive plan for re-organizing the sponsor logos (`docs\archives_translation\sponsors`) into `local_data\sponsors` while keeping the Workshop Manager 100% in sync.
- **Analysis**:
  - Current state:
    1. `docs/archives_translation/sponsors/`: 67 historical raw assets.
    2. `src/frontend/public/images/sponsors/`: 79 standardized web assets used for production builds.
    3. `local_data/sponsors/`: Does not exist yet.
    4. `assetPaths.ts`: `getSponsorsDir()` already written with fallback: checks `local_data/sponsors` first, then falls back to `docs/archives_translation/sponsors`.
    5. Manager API routes (`check-file`, `upload`, `delete`): Already support dual checking and sync between `getSponsorsDir()` and `public/images/sponsors`.
  - Architecture Blueprint:
    1. Consolidate `docs/archives_translation/sponsors` into `local_data/sponsors`.
    2. Synchronize the union of all active sponsor logos between `local_data/sponsors` and `src/frontend/public/images/sponsors`.
    3. Verify that `corporate_registry.json` correctly maps to valid logos in both directories.
    4. Prune empty legacy directory `docs/archives_translation/sponsors`.
    5. Ensure Workshop Manager UI (`SponsorsManager.tsx`) and API routes (`check-file`, `upload`, `delete`, `save`, `registry`) seamlessly resolve and write to `local_data/sponsors`.

## [2026-09-02] Ops Execution: Legacy URLs Restoration & Phase 3 Sponsor Reorganization
- **Agent**: @ops
- **Context**: @bo approved execution of legacy URL restoration across master_workshops and permalink_registry, as well as Phase 3 sponsor logo consolidation into local_data/sponsors.
- **Execution Steps**:
  1. Patch `src/frontend/src/app/api/manager/save/route.ts` to map `legacy_url` and `legacy_abstract_url` properly.
  2. Populate 331 missing legacy URLs into `src/frontend/src/data/master_workshops.json` from `archives/*.json`.
  3. Update destinations in `docs/registries/permalink_registry.json` to canonical paths under `/archive/proceedings/...`.
  4. Create `local_data/sponsors/` and populate with the consolidated union of historical and active logos (91 assets).
  5. Audit corporate_registry.json against `local_data/sponsors/`.
  6. Verify manager API route `api/manager/check-file` against `local_data/sponsors/`.
  7. Safely delete legacy `docs/archives_translation/sponsors/`.

## [2026-09-02] Ops Execution: Phase 4 Final Cleanup & Workspace Hardening
- **Agent**: @ops & @arch
- **Context**: @bo gave explicit approval: "ok, go on clenaup". Initiating Phase 4 final cleanup.
- **Execution Steps**:
  1. Remove legacy `docs/archives_translation/` directory completely (including `proceedings/`, `proceedings_backup/`, `raw_html/`).
  2. Update `.gitignore` to replace legacy paths with clean `local_data/` specifications.
  3. Update `README.md` to reflect canonical `local_data/` and `docs/registries/` repository layout.
  4. Verify Cloud Functions and frontend static builds.
  5. Update `docs/implementation_plan.md` and `walkthrough.md`.

## [2026-09-02] Brand & Arch: Creating Comprehensive Design, Layout & Architecture Specification
- **Agent**: @brand & @arch (collaborative team output)
- **Context**: @bo requested an HTML document in `docs/design/` describing the website's design features, layout, and backend architecture in complete detail for any human developer or AI agent to pick up development seamlessly.
- **Blueprint & Structure**:
  1. Header & Navigation: Interactive, sticky TOC, search/jump links, academic branding.
  2. Section 1: Executive Overview & Tech Stack (Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Firebase Functions v2, Firestore, GCloud Storage).
  3. Section 2: Visual Identity & Design System (Color palettes, dark/light modes, glassmorphism, typography tokens, component anatomy).
  4. Section 3: Page Hierarchy & Layout Blueprints (Universal header/footer, landing page, interactive `/archive` & `/archive/[year]` proceedings viewer, protected portals, Workshop Manager workbench).
  5. Section 4: Backend & Cloud Infrastructure (Dual-mode asset streaming vs GCloud CDN, Firebase Cloud Functions v2 triggers, Firestore RBAC & daily quota security rules, Algolia/client search indexing pipeline).
  6. Section 5: Data Schemas & Registries (`master_workshops.json`, `corporate_registry.json`, `permalink_registry.json`, `pdf_seo_registry.md`).
  7. Section 6: Developer Operations & Maintenance Playbook (CLI commands, build scripts, local development streaming, deployment pipeline, ART pair programming rules).
- **Target File**: `docs/design/system_design_architecture.html`

## [2026-09-02] Ops Advisory: Environment Variables Architecture (.env)
- **Agent**: @ops
- **Context**: @bo asked whether the project should have an env file.
- **Analysis**:
  - `src/frontend/.env.local` already exists and contains the active Firebase project credentials (`NEXT_PUBLIC_FIREBASE_*`).
  - `.gitignore` already protects `.env`, `.env.local`, etc. from being committed.
  - `src/frontend/.env.example` exists but only contains Firebase keys; it lacks the optional Algolia credentials (`NEXT_PUBLIC_ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_KEY`) used during search index compilation.
  - Adding a root `.env.example` and updating `src/frontend/.env.example` provides clarity for new developers/AIs onboarding.
- **Recommendation**: Maintain `src/frontend/.env.local` (local secrets), update `src/frontend/.env.example` with full documentation, and create a root `.env.example` pointer.

## [2026-09-02] Dev: Scaling HEMS Logo and Optimizing Corporate Sponsor Logos
- **Agent**: @dev
- **Context**: @bo requested scaling down the oversized HEMS logo and optimizing the size and location of corporate logos on the online archived workshops (`src/frontend/src/app/archive/[year]/page.tsx`).
- **Visual Audit Findings**:
  1. HEMS Logo on desktop hero was `w-[240px] lg:w-[270px]` inside a large `p-4` white box with `mt-4 md:mt-12`, dominating the header.
  2. Official Host was a standalone block with a massive `h-40 w-64` box (256px wide x 160px tall).
  3. Corporate Sponsors used `grid-cols-[repeat(auto-fill,minmax(246px,1fr))]` with large horizontal cards (`h-20 w-32`), rendering as 8 stacked full-width rows (~800px tall) that pushed technical proceedings far below the fold.
- **Implementation Strategy**:
  1. **HEMS Logo**: Scale down to `w-[140px] lg:w-[150px]`, `p-2.5`, `rounded-xl`, clean `shadow-md`, and align to `self-start` without excessive top margin.
  2. **Location Optimization**: Unify Official Host & Corporate Sponsors into a streamlined section placed cleanly beneath Workshop Resources.
  3. **Size Optimization**: Convert corporate sponsors into a responsive grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5`) with compact `h-24` cards, uniform `h-12` white logo boxes, crisp company titles with hover zoom, and "Since YYYY" badges.
  4. **Official Host Badge**: Restyle as a sleek, distinguished partner card (`h-12 w-28` logo) alongside the partner count.

## [2026-09-02] Dev: Restoring Horizontal Logo-Focused Sponsor Cards in Responsive Grid
- **Agent**: @dev
- **Context**: @bo provided an attached reference image showing the desired card design (horizontal card with white logo box on left, blue company name on right, and green "SINCE [YEAR]" tracking tag). Requested returning to this former gridded layout with logo-focused styling.
- **Card Design Specs**:
  - Container: `bg-surface/80 border border-foreground/15 rounded-lg p-2.5 flex items-center gap-3 hover:border-primary/60 hover:bg-primary/5 transition-all group shadow-xs`
  - Logo Box (Left): `bg-white rounded p-1.5 h-16 w-28 flex items-center justify-center flex-shrink-0 shadow-inner border border-slate-100 overflow-hidden`
  - Image: `style={{ maxHeight: '48px', maxWidth: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}` with subtle hover scale.
  - Text Column (Right):
    - Company Name: `text-primary font-bold text-sm leading-snug group-hover:underline truncate`
    - Tenure Tag: `text-secondary font-bold text-[10px] uppercase tracking-wider font-mono mt-0.5`
  - Grid: `grid gap-3` with `style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}` to ensure a multi-column responsive layout on desktop and tablet.

## [2026-09-02] Dev: Widening Sponsor Logo Placards and Removing Black Boundary
- **Agent**: @dev
- **Context**: @bo requested widening the logo container to accommodate widescreen logos (e.g. BaySpec, FLIR, Pfeiffer Vacuum) and removing the harsh black boundary around each logo.
- **Root Cause of Black Boundary**:
  - The white logo container had `shadow-inner border border-slate-100`. In Tailwind v4, `border` without a defined palette entry defaulted to `var(--foreground)` (#334155), drawing a dark charcoal/black border around the white card, reinforced by `shadow-inner`.
- **Changes**:
  1. Remove `border`, `border-slate-100`, and `shadow-inner` from the white logo placard. Use `bg-white rounded-md p-1.5 shadow-xs overflow-hidden`.
  2. Increase width of white logo box from `w-28` (112px) to `w-36` (144px) to give widescreen logos ample horizontal breathing room.
  3. Increase image max constraints to `maxHeight: 48px, maxWidth: 132px` with `objectFit: contain`.
  4. Adjust responsive grid `minmax` to `repeat(auto-fill, minmax(280px, 1fr))` to accommodate the wider logo frame while preserving a crisp 3-column desktop layout.

## [2026-09-02] Dev: Enforcing 3-Column Across Grid and Logo-Dominant Placard Sizing
- **Agent**: @dev
- **Context**: @bo requested keeping the corporate card wide enough to fit three companies across, but making the logo wider so it takes more space than the corporate name text.
- **Analysis & Calculation**:
  - Container: Max-w-5xl (~860px inner space).
  - Explicit grid definition: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3` guarantees exactly 3 equal columns across on desktop (`md:` breakpoint and above).
  - Card proportion: In each ~280-290px card, expand the white logo placard from `w-36` (144px) to `w-[165px]` or `flex-[3]` (~60-65% of total card width).
  - Logo constraints: Increase `maxWidth` to `155px` (maxHeight: `50px`).
  - Result: Logo is visually dominant, taking significantly more width than the corporate name text, while the grid strictly displays 3 columns across.

## [2026-09-02] Dev: Enlarging Official Host Card (1.5x) and Center Justifying
- **Agent**: @dev
- **Context**: @bo requested making the Official Workshop Host card 50% bigger than the other cards and center justifying it.
- **Specifications (50% Increase)**:
  - Standard card: Logo frame `h-16 w-[165px]`, max image `50px x 150px`, outer card ~280px.
  - Official Host (1.5x):
    - Logo placard: `h-24 w-[245px]` (64px * 1.5 = 96px, 165px * 1.5 ≈ 247px).
    - Image constraints: `maxHeight: 75px, maxWidth: 225px` (1.5x scale).
    - Typography: "OFFICIAL WORKSHOP HOST" tag at `text-xs tracking-widest`, company title at `text-base sm:text-lg font-bold`.
    - Total card width: ~420px–440px with `p-3 sm:p-3.5`, `rounded-xl`, `border-2 border-primary/30`, `shadow-sm`.
    - Layout: Centered horizontally via `flex justify-center w-full mb-6`.

## [2026-09-02] Dev: Removing DOI Numbers & References
- **Agent**: @dev
- **Context**: @bo directed to remove any mention of DOI numbers as they will not be implemented.
- **Scope Audit**:
  - Grepped codebase across `src/frontend/` and `docs/`.
  - Identified `src/frontend/src/components/CitationModal.tsx` as the single location referencing DOI (`doi` variable, `doi = {...}` in BibTeX generator, and the "Digital Object Identifier (DOI)" copy/display card).
- **Modifications**:
  1. Remove `const doi` mock generation from `CitationModal.tsx`.
  2. Remove `doi = {...}` from the BibTeX citation export template.
  3. Remove the DOI copy/display section from the modal UI, giving the permanent link (permalink) clean full-width display under Identifiers.

## [2026-09-02] Ops: Architectural & Security Analysis of Decap CMS for Customer Content Editing
- **Agent**: @ops
- **Context**: @bo requested an architectural and operational assessment on giving customers Git access via Decap CMS to edit website copy directly.
- **Analysis**:
  - **Strengths**: Zero hosting database overhead, full Git audit trail/versioning, automatic trigger of GitHub Actions CI/CD to Firebase Hosting.
  - **Risks & Friction Points**:
    1. *OAuth Dependency*: Decap CMS is a client-side SPA that requires an external OAuth backend (e.g. Netlify Identity, or a custom GitHub OAuth proxy on Cloud Functions/Firebase) to exchange GitHub tokens securely.
    2. *Schema Compatibility*: Decap handles flat Markdown collections well, but struggles with deep nested JSON schemas like our 15-year conference archives (`2022.json` sessions/presentations/authors/sponsors).
    3. *Repository Bloat*: Decap media uploads commit directly into Git. Conference PDFs/slides (20MB+) must strictly remain in GCS (`gs://hems-workshop-archives`), not Git.
    4. *Build Failure Risk*: Malformed schema edits can break Next.js static builds during deployment unless guarded by an editorial PR workflow.
  - **Recommended Architecture**: If implemented, limit Decap CMS strictly to flat marketing pages (`/about`, `/registration`, `/call-for-papers`), use an Editorial Workflow (`publish_mode: editorial_workflow`) with a staging branch to prevent direct commits to `main`, and deploy a small Firebase/Cloud Function OAuth gateway.

## [2026-09-02] Ops: Local Sandbox Testing Protocol for Decap CMS
- **Agent**: @ops
- **Context**: @bo asked if Decap CMS can be tested locally before implementing any production infrastructure or GitHub integrations.
- **Feasibility**: 100% yes. Decap CMS provides two zero-risk local test modes:
  1. `backend: { name: 'test-repo' }`: In-memory browser sandbox. Loads via CDN in an isolated static HTML page (`/decap-test/`). Requires 0 GitHub accounts, 0 tokens, 0 backend proxies. Allows immediate testing of UI, rich text editing, markdown generation, and layout.
  2. `local_backend: true` (with `npx decap-server`): Connects to local file system without Git or GitHub.
- **Recommendation**: Propose creating a temporary, standalone demo page at `src/frontend/public/decap-test/` so @bo can open `http://localhost:3000/decap-test/` in the browser, explore the interface, and decide if it meets the customer's needs without touching any production code.

## [2026-09-02] Ops/Dev: Provisioning Standalone Decap CMS Sandbox
- **Agent**: @ops & @dev
- **Action**: Creating a self-contained test environment in `src/frontend/public/decap-test/` with:
  1. `index.html`: Decap CMS SPA loader via unpkg CDN.
  2. `config.yml`: Mock configuration using `backend: { name: "test-repo" }` with sample collections for About, Call for Papers, Accommodations, and Announcements.
- **Safety**: Fully isolated static assets. 0 modifications to production routes, components, build scripts, or Git credentials.

## [2026-09-02] Ops: Manager Mechanics & Decap CMS Architectural Isolation
- **Agent**: @ops
- **Context**: @bo requested an explanation of how the workshop manager currently works and architectural recommendations to keep it entirely local and inaccessible to Decap CMS/customer.
- **Current Manager Anatomy**:
  - Code resides in `src/frontend/src/app/manager/` and `src/frontend/src/app/api/manager/`.
  - Operates via Node.js `fs` access directly against `local_data/proceedings/`, `local_data/sponsors/`, and `src/frontend/src/data/archives/*.json`.
  - In production (`scripts/build-prod.js`), manager files are temporarily renamed to `.disabled` so they are **never built or deployed** to Firebase Hosting.
- **Decap CMS Exposure Analysis**:
  - Decap CMS only sees collections defined in `config.yml`. If `manager/`, `api/manager/`, and `local_data/` are omitted from `config.yml`, Decap cannot browse or edit them.
  - However, customer Git repo access could expose files if they view the repository directly on GitHub.
- **Architectural Recommendations**:
  1. *Option A (Zero-Code / Config Isolation)*: Decap `config.yml` strictly points to a `/content/` directory for flat markdown pages. Staging branch with PRs (`editorial_workflow`). Manager remains local-only.
  2. *Option B (Decoupled Local Tool)*: Move the manager completely out of the Next.js app into a standalone local CLI/Vite app (e.g. `tools/manager/`) running on a dedicated local port (e.g. 4000). Completely purges manager code and `.disabled` build hacks from the frontend repo.
  3. *Option C (Repository Split)*: Separate public website repo from the operational data/manager repo.

## [2026-09-02] Arch: Blueprint for Decoupling Workshop Manager to Standalone Local Tool (Option 1)
- **Agent**: @arch
- **Context**: @bo requested an architectural implementation plan for Option 1 (decoupling the Workshop Manager from the public Next.js frontend into a dedicated local tool running on port 4000).
- **Architectural Design**:
  1. **New Home**: `tools/manager/` at the repository root.
  2. **Framework**: Independent lightweight Next.js runtime running on `port 4000`. Reusing Next.js preserves 100% of existing React components, DnD handlers, PDF parsers, and API route code without expensive refactoring.
  3. **Data Path Normalization**: Update path resolvers in `tools/manager/src/app/api/manager/*` to target `../../src/frontend/src/data/archives`, `../../local_data/proceedings`, and `../../docs/registries`.
  4. **Frontend Sanitization**:
     - Remove `src/frontend/src/app/manager/` and `src/frontend/src/app/api/manager/`.
     - Remove `toggleManagerFiles` (.disabled hack) from `src/frontend/scripts/build-prod.js`.
     - Enable standard `next build` in `src/frontend/package.json`.
  5. **Orchestration**: Root `package.json` script: `"manager": "npm --prefix tools/manager run dev"`.
  6. **Decap CMS Barrier**: Once decoupled, Decap CMS operating inside `src/frontend` cannot access manager code, APIs, or local proceedings.

## [2026-09-02] Ops: Scope Audit of Manager Domain vs Non-Archive Pages & Git Sync Workflow
- **Agent**: @ops
- **Context**: @bo asked if the Workshop Manager impacts any non-archive pages and confirmed the Git pull synchronization protocol when Decap CMS is enabled.
- **Data Footprint Audit**:
  - Files touched by the Manager:
    1. `src/frontend/src/data/archives/*.json` -> Read exclusively by `src/frontend/src/app/archive/[year]/page.tsx`.
    2. `src/frontend/src/data/master_workshops.json` -> Read by `src/frontend/src/app/archive/page.tsx` (index/filter) and `src/frontend/src/components/layout/Navbar.tsx` (the "Archives" year dropdown list).
    3. `src/frontend/src/data/corporate_registry.json` -> Internal registry file for auto-populating sponsor tenures/logos in the manager. Not read by public pages.
    4. `src/frontend/public/images/sponsors/*.png` -> Sponsor logo assets rendered on `/archive/[year]` sponsor cards.
    5. `local_data/proceedings/` & `local_data/sponsors/` -> Raw disk storage synchronized with Google Cloud Storage.
  - Non-Archive Pages:
    - `/about`, `/call-for-papers`, `/registration`, `/accommodations`, `/formatting-guidelines`, `/student-awards`, `/board`, `/corporate-sponsorship`, `/contact`.
    - **Conclusion**: The Manager has **zero impact** on non-archive marketing/editorial pages (except populating the year links in the Navbar dropdown).
- **Git Sync Workflow**:
  - Pull-before-edit protocol is accurate. If a customer commits text changes via Decap CMS, running `git pull` locally prevents divergence.
  - Furthermore, because Decap CMS manages flat Markdown (`content/*.md`) while the Manager manages JSON catalogs (`data/archives/*.json`), their file domains are orthogonal, eliminating file merge collisions.

## [2026-09-02] Ops: System Architecture Evaluation & Next-Level Roadmap
- **Agent**: @ops & @arch
- **Context**: @bo requested an operational and architectural evaluation of the current system design and strategic recommendations for improvement.
- **Current Architecture Evaluation**:
  - *Core Strengths*:
    1. Hybrid Storage Strategy: Decoupling 1.68GB of heavy binary PDFs to GCS keeps the Git repository tiny, builds blazing fast, and hosting costs at near zero.
    2. Zero-Database Jamstack: Next.js SSG + Firebase Hosting CDN delivers sub-second TTFB, immune to database outages, SQL injection, or runtime server crashes.
    3. Standalone Operations Console: Decoupling Workshop Manager to `tools/manager/` (port 4000) permanently fixed build-time file-renaming and Windows lock issues.
    4. Dual Search Engine: Algolia for fast semantic indexing with full offline local fallback.
- **Targeted Improvements (Roadmap)**:
  1. *Decap CMS OAuth Gateway*: Deploy a lightweight Firebase Function (`functions/api/oauth`) to exchange GitHub tokens securely without third-party services like Netlify.
  2. *Staging Branch & Preview Channels*: Leverage Firebase Hosting Preview Channels (`channel:deploy`) so customer edits in Decap can be previewed on a live staging URL before merging to `main`.
  3. *Type Safety with Zod*: Implement runtime Zod schemas on `WorkshopArchive` and `MasterWorkshops` to prevent schema drift during local catalog edits.
  4. *Push-to-Live GUI Stream*: Re-activate the Manager GUI "Push to Live" button to stream GCS rsync and Git push logs directly in the browser now that dev server port locks are eliminated.
  5. *Automated Broken-Link Auditor*: Create an offline pre-flight validator that checks all 436 paper links against GCS HTTP headers before deployment.

## [2026-09-02] Arch: Step-Wise Blueprint for System Architecture Improvements & Decap CMS Page Scoping
- **Agent**: @arch
- **Context**: @bo requested a comprehensive, step-wise implementation plan for the proposed architectural improvements, explicitly identifying which pages Decap CMS will have access to and which pages remain strictly off-limits.
- **Decap CMS Page Domain Scoping**:
  - *EXPOSED to Decap CMS (Marketing & Content)*:
    1. `/about` -> `content/pages/about.md` (Mission, overview, leadership narrative).
    2. `/call-for-papers` -> `content/pages/call-for-papers.md` (Topics, deadline, instructions).
    3. `/accommodations` -> `content/pages/accommodations.md` (Hotel, cut-off dates, group code).
    4. `/registration` -> `content/pages/registration.md` (Fee schedule, policies, links).
    5. `/formatting-guidelines` -> `content/pages/formatting-guidelines.md` (Abstract & slide templates).
    6. `/corporate-sponsorship` -> `content/pages/corporate-sponsorship.md` (Tier benefits, prospectus).
    7. `/contact` -> `content/pages/contact.md` (Inquiries, addresses, chair info).
    8. `/announcements` -> `content/announcements/*.md` (Dynamic news posts & banner alerts).
  - *OFF-LIMITS to Decap CMS (Hard-Locked from CMS)*:
    1. `/archive` and `/archive/[year]` (15 years of proceedings catalogs in `data/archives/*.json`).
    2. `/board` (Executive board directory).
    3. `/student-awards` (Historical student winner rolls).
    4. `tools/manager/` (Internal console on port 4000).
    5. Root infrastructure configs (`.env`, `firebase.json`, `firestore.rules`).
- **Step-Wise Execution Roadmap**:
  - Phase 1: Push-to-Live GUI Stream in Manager (Immediate Quick Win).
  - Phase 2: Runtime Schema Validation with Zod (Catalog Hardening).
  - Phase 3: Decap CMS Scoped Marketing Structure & Migration (`content/` directory).
  - Phase 4: Serverless GitHub OAuth Gateway for Decap CMS.
  - Phase 5: Editorial Staging Workflow & Firebase Preview Channels.
  - Phase 6: Automated GCS Link Integrity Auditor (`audit:assets`).

## [2026-09-02] Arch & Ops: Domain Lock Encounter on docs/design/system_design_architecture.html
- **Agents**: @ops & @arch
- **Context**: @bo requested @ops and @arch to update `docs/design/system_design_architecture.html` with extensive details on the new architecture.
- **Rule Check**:
  - `locksrules.md` Rule 3 (Domain Isolation Locks) mandates:
    * `@brand` is the ONLY agent permitted to write to aesthetic styling guides located in `docs/design/`.
    * `@ops` and `@arch` have no write permissions inside `docs/design/`.
  - `locksrules.md` Rule 6 (Escape Hatch / Workflow Override) mandates:
    * If a task requires modifying a file crossing these locks, agents MUST STOP immediately and prompt @bo with the explicit verbatim lock bypass confirmation.
- **Action**: Halt modification and request explicit user confirmation per Lock Rule 6 before modifying `docs/design/system_design_architecture.html`.

## [2026-09-02] Arch & Ops: Execution of Architecture Documentation Update in docs/design/system_design_architecture.html
- **Agents**: @ops & @arch
- **Authorization**: @bo granted explicit permission to bypass Lock Rule #3 to update `docs/design/system_design_architecture.html`.
- **Target Updates**:
  1. Header & Badges: Bump to v3.0 (Decoupled Workbench & Scoped Decap CMS).
  2. Tech Stack: Add Decap CMS, Zod, Gray-Matter; document dual-port architecture (3000 vs 4000).
  3. Layout & Page Routes: Document `/admin` Decap CMS route, `content/pages/` schema, and scrubbed `/manager` 404 behavior on public site.
  4. Workshop Manager (Section 6): Comprehensive rewrite detailing `tools/manager/` standalone architecture, eliminating `.disabled` hacks, and re-enabling Push-to-Live GUI.
  5. Decap CMS & Content Isolation (New Sub-Section): Detailed matrix of 8 client-editable marketing pages vs locked proceedings.
  6. Backend & Cloud: Add automated 1,398-link asset integrity audit (`audit:assets`).
  7. Data Schemas: Document runtime Zod schemas (`archive.schema.ts`) and pre-flight validation in build script.
  8. Developer Playbook: Update workspace root orchestration (`npm run dev`, `npm run manager`, `npm run build`, `npm run audit:assets`, `npm run push-to-live`).

## [2026-09-02] Ops: Authoring Client User Guide for Decap CMS in docs/decap_cms_guide.html
- **Agent**: @ops
- **Context**: @bo requested a dedicated HTML user manual in `docs/` explaining Decap CMS and providing clear, non-technical instructions for future client-users.
- **Content Outline for User Manual**:
  1. Executive Summary: What Decap CMS is, how it works, and why it is safe (Git-backed, zero database).
  2. Getting Started: How to log in at `http://[your-domain]/admin/index.html`.
  3. The Workspace Tour:
     - "Contents" tab: Browsing collections.
     - "Workflow" tab: Reviewing drafts, in-review, and ready-to-publish stages.
     - "Media" tab: Uploading images.
  4. The 8 Editable Collections:
     - About the Society, Call for Papers, Accommodations, Registration, Formatting Guidelines, Sponsorship, Contact Us, Announcements.
     - Detailed field-by-field guidance for each.
  5. How to Edit & Publish: Step-by-step walkthrough (edit fields -> save draft -> review preview -> publish).
  6. Safety Boundaries (FAQ): Why proceedings archives and technical catalogs are protected and cannot be broken.
  7. Troubleshooting & Best Practices (e.g. image sizing, formatting tips).
- **Design Language**: Clean, modern dark-navy aesthetic consistent with HEMS brand guidelines, responsive Tailwind CSS CDN, glass panels, callout boxes, and readable typography.

## [2026-09-02] Dev: Remove Admin Badge & Implement Administrative Levels Hover Tooltip in Navbar
- **Agent**: @dev
- **Context**: @bo requested to remove the green "Admin" badge next to Contact/logout, and instead add hover text over the username displaying a list of the user's administrative levels.
- **Implementation Details**:
  1. Remove the standalone green `<Link href="/admin">Admin</Link>` badge from `src/frontend/src/components/layout/Navbar.tsx`.
  2. Map user roles (`user.roles` array, e.g. `admin`, `board`, `reviewer`, `submitter`, `attendee`, `general`) to human-readable titles, descriptions, and styled color badges.
  3. Wrap the username in an interactive `group relative` container with:
     - HTML `title` fallback attribute containing the formatted list of administrative levels.
     - Styled CSS hover tooltip card (`opacity-0 group-hover:opacity-100 group-hover:visible transition-all`) that lists each assigned administrative level with a shield icon, role title, and brief permission summary.
     - Direct administrative portal shortcut within the tooltip when `admin` or `board` roles are present.
  4. Build & visual verification via browser subagent.

## 2026-09-30: Local Website Dev Server Startup
- **Agent**: @ops / @arch
- **Action**: Cold Start ingestion performed on session history and implementation plan. Started Next.js development server on port 3000 (
pm run dev). Confirmed 200 OK response on http://localhost:3000 and launched browser window for @bo.

## [2026-10-20] SCoT: Local Dev Server Startup (@ops)
- **Goal:** Run local version of the HEMS website as requested by @bo.
- **Analysis:** Root package.json defines "dev": "npm --prefix src/frontend run dev", which launches Next.js on port 3000.
- **Action:** Start background dev server daemon, verify startup heuristics ("Ready in", "http://localhost:3000"), and yield control.
- **Outcome:** Provide access links for the public portal and Workshop Manager.

## [2026-10-27] SCoT: Source Documents Formatting & Frontend Initiation (@dev / @arch)
- **Goal:** Address @bo's request to work on frontend webpages (excluding archive pages) and reformat source documents in 'docs\source-documents'.
- **Analysis:**
  1. Files requested for reformatting: docs\source-documents\historyV1.md and docs\source-documents\mission-statementV1.md.
  2. Lock Rule 3 enforces Domain Isolation: @dev can ONLY write to src/. Writing to docs/ violates Lock Rule 3.
  3. Lock Rule 1 protects reference documents/source material as read-only.
  4. Lock Rule 6 (Escape Hatch) dictates immediate halt:
     SYSTEM LOCK ENCOUNTERED: I need to modify docs\source-documents which violates Lock Rule 3. User, do I have explicit permission to bypass this lock for this task?
  5. Chain of Command: Working on frontend web pages requires @arch to establish an Implementation Plan in docs/plans/ aligning the new Mission & History copy with the Global Symposium design system before @dev writes code in src/.
- **Action:** Halt file modifications to docs/source-documents/ and trigger Lock Rule 6 escape hatch prompt, while providing @arch's roadmap for frontend implementation.

## [2026-10-27] SCoT: Source Documents Reformatting (@dev)
- **Goal:** Format mission-statementV1.md and historyV1.md into clean GitHub-flavored Markdown without changing content.
- **Authorization:** @bo explicitly confirmed bypass via "@dev ok, go".
- **Execution Plan:**
  1. Write structured markdown to docs/source-documents/mission-statementV1.md preserving all wording from input.
  2. Write structured markdown to docs/source-documents/historyV1.md preserving all wording and section breakdown.
  3. Validate file writes and content fidelity.
- **Outcome:** Clean markdown source docs ready for frontend incorporation.

## [2026-10-27] SCoT: Frontend Webpages Architectural Planning (@arch)
- **Goal:** Draft comprehensive implementation plan for frontend webpages revamp incorporating source documents (mission & history) without touching archive pages.
- **Analysis:**
  1. Content ingested: mission-statementV1.md and historyV1.md.
  2. Target pages:
     - src/frontend/src/app/about/page.tsx: Complete overhaul with Mission Statement, 5 Core Objectives, and Interactive/Timeline History of HEMS from 1999 to Present.
     - src/frontend/src/app/page.tsx: Align home page copy with official Mission and core focus areas.
  3. Strict Constraint: Zero modifications to /archive or archive data files.
  4. Design System Compliance: Adhere to rand-guidelines.md (Global Symposium theme: Summit White #FFFFFF, Slate Black #334155, Protocol Gray #E2E8F0, Global Cerulean #0284C7, Diplomatic Emerald #059669).
- **Action:**
  - Create docs/plans/2026-10-27-frontend-webpages-revamp.md.
  - Update docs/implementation_plan.md.

## [2026-10-27] SCoT: About Page Implementation (@dev)
- **Goal:** Overhaul src/frontend/src/app/about/page.tsx with canonical Mission Statement, 5 Core Objectives, and complete History narrative from source documents.
- **Design Alignment:** Apply Global Symposium tokens (Summit White, Protocol Gray, Global Cerulean, Diplomatic Emerald) and clean typography.
- **Content Integrity:** Every paragraph and detail from mission-statementV1.md and historyV1.md faithfully represented.
- **Archive Protection:** Purely focused on /about, leaving /archive routes and datasets untouched.
- **Action:** Replace src/frontend/src/app/about/page.tsx with full component.


## [2026-11-10T08:43:00-07:00] @arch & @ops — Cold Start & Local Website Dev Server Startup
- **@arch Cold Start**: Ingested `README.md` (Project Charter context), `docs/session_history.md`, and `docs/implementation_plan.md`.
- **@ops Execution**: Starting the local Next.js development server (`npm run dev` -> `npm --prefix src/frontend run dev`) as a background daemon (`IsDaemon: true`) and monitoring log output per CLI Process & Polling Rule (#10) until `http://localhost:3000` is ready.


## [2026-11-10T09:16:30-07:00] @arch, @prod, @ops, @qa — Read-Only Project Assessment & Cleanup Audit
- **@bo Directive**: Read-only assessment ("no changes") of current project state, cleanup opportunities, and where the last session left off.
- **Findings**:
  1. **Uncommitted In-Flight Work (Phase 5 Frontend Revamp)**: `src/frontend/src/app/about/page.tsx` and `src/frontend/src/app/page.tsx` have uncommitted changes implementing the canonical Mission Statement and History (`docs/source-documents/mission-statementV1.md` and `historyV1.md`) per `docs/plans/2026-10-27-frontend-webpages-revamp.md`.
  2. **Broken Local Dev PDF Streaming after Manager Decoupling**: Moving `/api/manager/*` to `tools/manager` (port 4000) left `src/frontend/src/app/archive/[year]/page.tsx` pointing `isLocal` links to `/api/manager/serve?file=...` on port 3000 (which 404s unless proxied or served locally).
  3. **484 MB Legacy Bloat in `src/frontend/public/assets/`**: Duplicate 2017 (108.6 MB) and 2018 (371.8 MB) PDFs plus 615 cache files (3.5 MB) inside `public/assets/archives/` are copied into `src/frontend/out/assets/` on every static build (inflating `out/` from 24 MB to 508 MB).
  4. **Half-Wired Decap CMS Markdown Pipeline**: `src/frontend/content/pages/*.md` and `public/admin/config.yml` exist, but the Next.js page components still render hardcoded JSX rather than reading from those Markdown files, and `content/pages/about.md` is out of sync with the newly revamped `about/page.tsx`.
  5. **Workspace & Documentation Hygiene**: `README.md` and `implementation_plan.md` still reference `/manager` on port 3000 instead of `tools/manager` on port 4000; stray `firebase-debug.log`, test screenshots in `tests/`, and redundant `ConditionalNavbar`/`ConditionalFooter` wrappers remain.


## [2026-11-10T09:48:00-07:00] @arch, @dev, @ops, @qa, @brand — Full Execution Sweep ("go on all")
- **@arch Blueprint & Charter**:
  - Creating `docs/project_charter.md` to satisfy Cold Start initialization rules permanently.
  - Publishing permanent sprint plan `docs/plans/2026-11-10-cleanup-and-archive-dev-fix.md`.
  - Updating `docs/plans/2026-10-27-frontend-webpages-revamp.md`, `docs/implementation_plan.md`, and `docs/session_history.md`.
- **@dev Implementation (`src/`)**:
  - Fixing broken local PDF/preview URLs on `http://localhost:3000/archive/[year]` (`src/frontend/src/app/archive/[year]/page.tsx`) by defaulting to verified `public_website_url` (with `local_target_path` fallback for unpublished local files and opt-in `NEXT_PUBLIC_USE_LOCAL_MANAGER=true`) plus adding dev-only `/api/manager/:path*` -> `http://localhost:4000/api/manager/:path*` rewrites in `src/frontend/next.config.ts`.
  - Updating `src/frontend/scripts/index-pdf-contents.js` to store PDF text extraction caches in `local_data/cache/` instead of `src/frontend/public/assets/archives/cache/`.
  - Removing obsolete pass-through wrappers `ConditionalNavbar.tsx` and `ConditionalFooter.tsx`, wiring `Navbar` and `Footer` directly in `src/frontend/src/app/layout.tsx`, and removing stale `@source "./manager/**/*.{ts,tsx}";` from `globals.css`.
  - Polishing placeholders in `contact/page.tsx` (interactive `mailto:` inquiry builder + Society/Venue card), `formatting-guidelines/page.tsx` (real program/archive sample links instead of dead buttons), and `(portal)/layout-portal/page.tsx` (real 15th Workshop archive papers and post-2025 biennial status instead of `J. Smith` mock data).
  - Syncing `src/frontend/content/pages/*.md` with canonical Mission, History, Sheraton Virginia Beach ($124/night), $250/$500/$1,350 registration/sponsorship rates, and Tim Short contact info.
- **@ops & @qa Hygiene, Relocation & Build Verification**:
  - Zero-data-loss relocation: moving `src/frontend/public/assets/archives/cache` -> `local_data/cache` and `src/frontend/public/assets/archives/{2017,2018}` -> `archive/legacy_public_assets/`, shrinking static export `src/frontend/out/` by ~484 MB.
  - Cleaning up `firebase-debug.log`, moving tracked `tests/manager_*.png` screenshots out of git, updating `tests/integration/manager_ingestion.spec.ts` to port 4000, updating `.gitignore` and `src/frontend/.gitignore`, and syncing `README.md`.
  - Running `npm run audit:assets` and `npm run build` (`src/frontend` + `functions`), committing clean git state, and restarting local dev server on `http://localhost:3000`.


## [2026-11-10T10:00:40-07:00] @ops — Local Environment Launch (Public Website + Workshop Manager + Browser Open)
- Verified `http://localhost:3000` (`npm run dev`, task-180) returning `HTTP 200 OK` (57,716 bytes).
- Starting standalone Workshop Manager (`npm run manager`) on `http://localhost:4000` (`IsDaemon: true`) and opening `http://localhost:3000` in the default system browser for `@bo`.


## [2026-11-10T10:06:00-07:00] @arch, @dev, @ops, @qa, @brand — Strict Archive Page Revert & Dedicated /history Page
- **@bo Directives**:
  1. Do NOT modify archive pages (`src/frontend/src/app/archive/**`) without explicit permission.
  2. Create a dedicated new page (`/history`) to hold the 'Workshop & Society History' content.
- **@arch Actions**:
  - Reverting `src/frontend/src/app/archive/[year]/page.tsx` to `b6a0075` so `src/frontend/src/app/archive/**` has 0 diff (local dev PDF streaming still works untouched via `next.config.ts` rewrite to `localhost:4000`).
  - Codifying the Strict Archive Page Lock in `docs/project_charter.md`.
  - Publishing permanent plan `docs/plans/2026-11-10-dedicated-history-page.md` and updating `docs/implementation_plan.md` & `docs/session_history.md`.
- **@dev Actions**:
  - Creating `src/frontend/src/app/history/page.tsx` with the complete narrative from `docs/source-documents/historyV1.md` (Early Years 1999–2005, HEMS Society 2005–Present, Key Historical Milestones timeline, and Summary / Beachfront Philosophy).
  - Updating `src/frontend/src/app/about/page.tsx` to focus exclusively on Mission & Core Strategic Objectives (`mission-statementV1.md`) with a prominent link card to `/history`.
  - Linking `/history` across `Navbar.tsx`, `Footer.tsx`, `page.tsx`, `sitemap.ts`, `content/pages/history.md`, and `public/admin/config.yml`.


---

## [2026-11-10] SCoT Trace — Evergreen Corporate Sponsorship Page & Contact-Page Routing (@arch, @dev, @brand, @qa, @ops)
- **Objective**: Create a general, year-after-year public Corporate Sponsorship page (`/corporate-sponsorship`) modeled on the canonical facts of legacy `https://www.hems-workshop.org/15thWS/15thCorp_Sponsors.html`, accessible prominently through the Contact page (`/contact`) and excluded from the top Navigation Bar (`Navbar.tsx`).
- **Firewall & Lock Verification**:
  - Zero reads performed on `docs/logs/thought_trace.md` (append-only).
  - Zero edits permitted on `src/frontend/src/app/archive/**`, `src/frontend/src/data/archives/**`, `src/frontend/src/data/master_workshops.json`, `/source-material`, or `.agents/`.
- **Architectural & Routing Decisions**:
  1. Promote `/corporate-sponsorship` out of the Attendee Portal sidebar route group (`src/frontend/src/app/(portal)/corporate-sponsorship/page.tsx`) to a standalone top-level public route (`src/frontend/src/app/corporate-sponsorship/page.tsx`). Retaining the `/corporate-sponsorship` slug preserves backward compatibility with existing portal cards and Decap CMS references while giving the page full-width Global Symposium public styling matching `/about`, `/history`, and `/contact`.
  2. Frame all copy to stand year after year: highlight HEMS as an all-volunteer 501(c)(3) organization bridging academic, industrial, and government circles with no formal membership fee; detail how workshop sponsorships independently fund the biennial symposium and Student Travel Awards; present the four core sponsor benefits (exhibition table for hardware/literature, corporate poster display including remote posting for non-attending sponsors, workshop banner/program recognition, and website logo + link); and outline the three evergreen participation structures ($1,350 full package with 1 attendee registration, $850 + $500 split invoicing for corporate purchasing limits, and $850 non-attending sponsor) via `http://shop.hems-workshop.org` and Coordinator Tim Short (`rtshort00@gmail.com`).
  3. Dynamically bind the Past & Continuing Corporate Sponsors showcase to `src/frontend/src/data/corporate_registry.json` (52 organizations since 2001) so future sponsors added via Workshop Manager appear automatically year over year. Apply non-mutating runtime normalization in `page.tsx` for bare domains (`www.hamiltonsundstrand.com`, `pascaltechnologies.com`, `SpyglassWater.com`) and the single Linux case-sensitive filename discrepancy (`SAES_Getters.png` -> `Saes_Getters.png` on disk).
  4. Wire prominent discovery through `src/frontend/src/app/contact/page.tsx` (dedicated Corporate Sponsorship callout card, inline Direct Channel link, contextual inquiry banner when "Sponsorship & Billing Inquiries" is selected, and `?topic=sponsorship` pre-selection) while leaving `Navbar.tsx` completely untouched.


---

## [2026-11-10] SCoT Trace — Standalone Student Travel Awards Page & Navbar Integration (@arch, @dev, @brand, @qa, @ops)
- **Objective**: Move the `Student Travel Awards` page out of the Workshop Portal (`(portal)/`), expose it directly via a link in `Navbar.tsx`, and ensure 100% content alignment with legacy `https://www.hems-workshop.org/15thWS/15thstudenttravel.html`.
- **Firewall & Lock Verification**:
  - Zero reads performed on `docs/logs/thought_trace.md` (append-only).
  - Zero edits on `src/frontend/src/app/archive/**`, archive JSONs, `/source-material`, or `.agents/`.
- **Legacy Content Audit (`15thstudenttravel.html`)**:
  - Heading: *HEMS Workshop Student Travel Award* (`Student Travel Awards`)
  - Deadline Notice: *Student Travel Award Application Deadline EXTENDED to Friday, August 8, 2025*
  - Purpose: *"The workshop award is intended to encourage interest in the topics applicable to Harsh Environment Mass Spectrometry (HEMS) and reward the scientific merit and quality of student research in the area of HEMS."*
  - Award Amount: *"For the 2025 HEMS Workshop the proposed award is $1,500.00."*
  - Eligibility: *"Any full-time graduate student pursuing an M.S., M.A., or Ph.D. degree within a discipline applicable to the HEMS conference. Students must be in good standing with their university."*
  - Guidelines (4 required items):
    1. Student letter describing academic standing and interests, expected graduation date and degree, advisor's name, and, if available, a URL for a working Web page.
    2. Detailed letter from the student's faculty advisor indicating why the student is deserving of receiving a travel award and any special circumstances.
    3. Title of the presentation to be presented by the student at the meeting, along with the abstract, and authors. (Remove the unverified "scheduled session" phrase from the legacy portal draft.)
    4. Vita including the student's research interests, projects, and papers published.
  - Criteria (4 items): Meets eligibility requirements; Completes Guideline list; Quality and intellectual merit of the abstract and research; Potential for future publications from research focus.
  - Submission: *Submit Applications by e-mail to HEMS Student Awards Committee — `hemsworkshop@hems-workshop.org`*.
- **Routing & Navigation Changes**:
  - Promote `src/frontend/src/app/(portal)/student-awards/page.tsx` -> `src/frontend/src/app/student-awards/page.tsx` and delete `(portal)/student-awards/`.
  - Remove `Student Awards` from `portalLinks` in `src/frontend/src/app/(portal)/layout.tsx`.
  - Add `Student Travel Awards` (`/student-awards`) to `src/frontend/src/components/layout/Navbar.tsx` (with clean responsive horizontal spacing) and `Footer.tsx`, register `/student-awards` in `sitemap.ts`, and add `content/pages/student-awards.md` + `public/admin/config.yml` entry for CMS parity.


---

## [2026-11-10] SCoT Trace — Remove Non-Existent HEMS Store References & Propose Local Sept 2027 Workshop Form (@dev, @arch, @prod, @qa, @ops)
- **User Request Analysis**:
  1. Concrete execution task for `@dev`: Remove all mentions of the non-existent `HEMS Store` / `Workshop Store` / `http://shop.hems-workshop.org`.
  2. Architectural brainstorm/suggestion (`scrumrules.md` Rules #8 & #9): Suggest a local form workflow to enter upcoming 16th HEMS Workshop (Sept 2027) details, paired with a checklist/map of website pages that ingest those updates, staying strictly within Google Nonprofits / Firebase free tier (`$0/mo`). Per Rule #9, treat Part 2 strictly as an architectural proposal with pros/cons and exact ingestion mapping—do not write form code until `@bo` approves.
- **Audit of Store / Shop References (`src/frontend/`)**:
  - `src/frontend/src/app/corporate-sponsorship/page.tsx`: lines 86 (`hemsShopUrl`), 154–159 (`Register via HEMS Store`), 300–305 (`shop.hems-workshop.org`), 368–373 (`HEMS Workshop Store`). Replace with direct coordinator inquiry (`rtshort00@gmail.com` / `/contact?topic=sponsorship`).
  - `src/frontend/src/app/(portal)/registration/page.tsx`: lines 10 (`hemsShopUrl`), 130 (`Register Sponsor`), 192 (`online store portal at shop.hems-workshop.org`). Point `Register Sponsor` CTA to `/corporate-sponsorship` and direct split-billing inquiries to Tim Short (`rtshort00@gmail.com`).
  - `src/frontend/content/pages/corporate-sponsorship.md` & `src/frontend/content/pages/registration.md`: strip `shop.hems-workshop.org` references.
- **Firewall & Lock Check**:
  - Zero reads on `docs/logs/thought_trace.md`.
  - Zero edits on `src/frontend/src/app/archive/**` or archive JSONs.


---

## [2026-11-10] SCoT Trace — Brainstorm: Archive-Only Local Manager, Multi-User CMS (Google Sheets vs Decap CMS), and Free Private Staging (@dev -> @prod, @arch, @ops)
- **Protocol Check (`scrumrules.md` Rules #8 & #9)**:
  - `@bo` typed `@dec` (clear typo for `@dev`) with speculative/brainstorming questions (*"I'm thinking of keeping... Perhaps a simpler interface via google forms or sheets... Perhaps I should just lean on the Decap CMS? ... suggest a way to privately host the website"*).
  - Per Rule #8 (Misroute) and Rule #9 (Speculation), `@dev` briefly acknowledges its `src/` implementation scope and routes the analysis to `@prod`, `@arch`, and `@ops`. Zero code files modified.
- **Technical Findings Grounding the Analysis**:
  1. Keep `localhost:4000` Workshop Manager strictly for historical Proceedings Archive curation (PDF ingestion, GCS sync, sponsor registry)—clean separation of concerns.
  2. Decap CMS is already scaffolded in `src/frontend/public/admin/index.html` + `config.yml` (`backend: test-repo`) and viewable immediately in sandbox mode at `http://localhost:3000/admin/index.html` (with user guide at `docs/decap_cms_guide.html`). However, two caveats exist before using it in production:
     - Static export route collision: `src/app/(portal)/admin/page.tsx` overwrites `out/admin/index.html` during `npm run build` (easy fix: move Decap CMS to `/cms/`).
     - React `.tsx` pages currently render hardcoded JSX rather than importing `content/pages/*.md`, and production multi-user editing in Decap CMS requires GitHub accounts for every committee editor plus an OAuth proxy.
  3. Google Sheets (inside HEMS's free Google Workspace for Nonprofits) vs. Decap CMS:
     - A structured Google Sheet (`Upcoming_Workshop` config tab + Ingestion Checklist tab) gives zero-training multi-user access using existing Google Nonprofits accounts at `$0/mo`, with zero GitHub account friction for rotating volunteer Workshop Chairs.
  4. Private Hosting (`$0` Free Tier):
     - **Firebase Hosting Preview Channels** (`firebase hosting:channel:deploy preview --expires 30d` on existing `hems-workshop` Spark project): instant unlisted capability URL (`https://hems-workshop--preview-<random>.web.app`), `$0`, zero new accounts.
     - **Cloudflare Pages + Cloudflare Access (Zero Trust Free Tier)**: adds a true email-PIN or Google Workspace login wall in front of the entire staging site (`$0` up to 50 users).
     - **IDE Private Port Forwarding** (`localhost:3000`): instant zero-deploy private preview while local server is running.


---

## [2026-11-10] SCoT Trace — Product Evaluation: Why Decap CMS Was Blank & Whether to Retire Decap in Favor of Google Sheets/Forms (@prod, @arch)
- **Protocol Check (`scrumrules.md` Rules #7 & #9)**:
  - `@bo` addressed `@prod` in a strategic product brainstorm (*"debating in my head if the Decap CMS is worth keeping"*). Interpret typos cleanly (*leaning toward*, *debating*). Perform zero code modifications during brainstorm; log SCoT first.
- **Root Cause of Blank Decap Fields**:
  - `src/frontend/public/admin/config.yml` currently sets `backend: { name: test-repo }`, which initializes an empty in-memory browser store rather than reading `src/frontend/content/pages/*.md` from disk (`local_backend: true` + `npx decap-server`) or GitHub (`backend: { name: github }`). Furthermore, `.tsx` pages do not yet consume `content/pages/*.md`, and Decap's preview pane only renders unstyled fields unless custom preview templates are maintained.
- **Product Value Assessment (`@prod`)**:
  - Website content splits cleanly into three buckets:
    1. Evergreen Society pages (`About`, `History`, `Corporate Sponsorship`, `Contact`, `Formatting Guidelines`) — rarely change across years.
    2. Historical Proceedings Archives — handled by Local Workshop Manager (`localhost:4000`).
    3. Biennial Upcoming Workshop parameters (edition, Sept 2027 dates, hotel/rates, CFP/registration/student-award deadlines & URLs, announcements) — structured key-value data edited by rotating volunteer scientists.
  - Requiring GitHub accounts + OAuth infrastructure for Decap CMS creates unnecessary onboarding friction for volunteer committee members while offering poor ROI for structured dates/rates.
  - **Recommendation**: Retire Decap CMS cleanly (Git history preserves it if ever needed), keep `localhost:4000` strictly for Archives, and use a shared **Google Sheet** (in HEMS's `$0` Google Workspace for Nonprofits) paired with a local/build-time `upcoming_workshop.json` snapshot + **Google Forms** for intake.


---

## [2026-11-10] SCoT Trace — Auto-Advance Execution: Retire Decap CMS & Implement Google Sheets + Static JSON Upcoming Workshop System (@arch, @dev, @qa, @brand, @ops)
- **Directive from `@bo`**: Develop architectural plan and auto-advance through all recommended steps:
  1. Retire Decap CMS (`src/frontend/public/admin/`, `src/frontend/content/`, `docs/decap_cms_guide.html`, and unused `gray-matter` dependency if appropriate).
  2. Keep Local Workshop Manager (`localhost:4000`) strictly for historical Proceedings Archives & Sponsor Registry.
  3. Build the `$0` Google Nonprofits / Firebase Spark "Upcoming Workshop" configuration architecture seeded for the **16th HEMS Workshop (September 2027)** (`src/frontend/src/data/upcoming_workshop.json` + custom hook `src/frontend/src/hooks/useUpcomingWorkshop.ts` + RFC-4180 CSV parser `src/frontend/src/utils/upcomingWorkshop.ts` + CLI sync script `src/frontend/scripts/sync-workshop-sheet.js`).
  4. Wire all 8 public/portal workshop-cycle surfaces (`Home`, `Student Travel Awards`, `Contact`, `Portal Overview`, `Call for Papers`, `Registration`, `Accommodations`, `Corporate Sponsorship`) so static builds render SEO-complete 16th Workshop (Sept 2027) defaults on frame 0 and hydrate live updates when a published Google Sheet CSV URL is configured.
  5. Deliver ready-to-import Google Sheet CSV templates (`1_Workshop_Config.csv` and `2_Website_Ingestion_Checklist.csv`) plus a concise committee & private-staging setup guide in `docs/workshop-sheets/`.
- **Firewall & Rule Compliance**:
  - Zero reads on `docs/logs/thought_trace.md`.
  - Zero modifications to `src/frontend/src/app/archive/**` or archive JSONs.
  - Zero `any` types (`scrumrules.md` Rule #5.2); custom hook in `src/frontend/src/hooks/` (Rule #5.3); `try/catch` around all async calls with meaningful error logging (Rule #5.4).

## [2026-11-10T11:56:30-07:00] Step 5 Verification & Deployment Gate (@qa, @brand, @rte, @ops)
- **@qa Verification:**
  - Executed `node tests/unit/upcomingWorkshopCsv.test.mjs`: PASS (`0` exit code) — 100% key parity across `upcoming_workshop.json` (40 keys), `docs/workshop-sheets/1_Workshop_Config.csv` (40 keys), and `docs/workshop-sheets/2_Website_Ingestion_Checklist.csv` (8 surfaces), plus RFC-4180 quoted comma/newline CSV parsing and fallback resilience.
  - Executed `npm --prefix src/frontend run sync:workshop`: PASS (`0` exit code) — graceful no-op when `sheet_csv_url` is empty.
  - Executed `npx next typegen` and `npx tsc --noEmit` in `src/frontend`: PASS (`0` exit code, zero `any` types).
  - Verified archive immutability lock: `git diff b6a0075 -- src/frontend/src/app/archive src/frontend/src/data/archives src/frontend/src/data/master_workshops.json` produced `0` diff lines.
- **@brand & HTTP Probe Verification:**
  - Probed all 8 dynamic workshop surfaces (`/`, `/student-awards/`, `/contact/`, `/layout-portal/`, `/call-for-papers/`, `/registration/`, `/accommodations/`, `/corporate-sponsorship/`), `/admin/`, and `http://localhost:4000/`: all returned HTTP `200 OK`.
  - Confirmed zero remaining references to `decap-cms`, `/admin/config.yml` (`404` as expected), `HEMS Store` / `shop.hems-workshop.org`, or expired 2025 `hems2025.exordo.com` / `marriott.com/event-reservations` links.
- **@rte Deployment Gate:** `[PASS]` tags verified across `@qa`, `@brand`, and `@arch`. Handing off to `@ops` for local Git commit on `main` (without pushing to `origin/main` so live production remains untouched until `@bo` reviews).

## [2026-11-10T12:54:30-07:00] Cloud-House & Project Cleanup (@ops — authorized by @bo)
- **Context:** `@bo` explicitly approved project & Data Agent Kit cleanup (`@ops yes, clean up the project`).
- **Root Cause Identified:** The Antigravity IDE extension `googlecloudtools.datacloud-1.2.0-universal` unpacked 21 GCP BigQuery/Spark/dbt/Dataflow skill folders + `.datacloud_skills_manifest` into `c:\AntigravityP1_2\HEMS-website\.agents\skills\` and injected duplicate `notebooks` + `data-agent-kit` MCP server entries into `C:\Users\ryanb\.gemini\config\mcp_config.json`, duplicating the global `data-agent-kit-plugin` bundle on a `$0` Firebase Spark static site.
- **Actions Executed (`@ops`):**
  1. Remove the 21 stray Data Cloud skill folders and `.datacloud_skills_manifest` from `.agents/skills/` while leaving `.agents/rules/` (`locksrules.md`, `scrumrules.md`), `.agents/personas/`, `.agents/workflows/`, `.agents/config/`, `.agents/logs/`, `.agents/state/`, `creative_product_log.md`, and `handover.md` 100% untouched.
  2. Clear the duplicate `notebooks` and `data-agent-kit` MCP server entries in `C:\Users\ryanb\.gemini\config\mcp_config.json` so `data-agent-kit-plugin` is controlled cleanly from one toggle.
  3. Delete the leftover `0`-byte `firebase-key.json` at repo root.
  4. Consolidate `.env.example` into the single canonical `src/frontend/.env.example` (removing the duplicate root `.env.example`), documenting `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL`, and optional offline-fallback Algolia indexing keys; append commented `NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL` slot to `src/frontend/.env.local` without modifying existing Firebase keys.

## [2026-11-10T14:28:00-07:00] Live Google Sheet CSV Endpoint Verification & Wiring (@ops, @dev, @arch, @qa)
- **Live Endpoint Verified:** `https://docs.google.com/spreadsheets/d/e/2PACX-1vSC_UL5aibfE3gVGds5Yzzu2eMVaFYNcqXGgtrCaWJwbrNfcHNblX08CeyWhbYVfjmiPiUbUC7erPwl/pub?gid=540431442&single=true&output=csv` returned HTTP `200 OK` (`text/csv; charset=utf-8`, `6,566` bytes) with `Access-Control-Allow-Origin: *` after moving the Sheet from a Shared Drive into `webmaster@hems-workshop.org`'s `My Drive` under the `Webmaster Access` Organizational Unit.
- **Execution Steps:**
  1. `@ops`: Populate `NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL` in `src/frontend/.env.local`.
  2. `@dev`: Populate `"sheet_csv_url"` in `src/frontend/src/data/upcoming_workshop.json` and execute `npm --prefix src/frontend run sync:workshop` against the live Google Sheet CDN endpoint.
  3. `@arch`: Document the `My Drive` (vs. `Shared Drive`) and `Webmaster Access` OU setup note in `docs/workshop-sheets/README.md` and `docs/session_history.md`.
  4. `@qa` & `@ops`: Run `node tests/unit/upcomingWorkshopCsv.test.mjs`, restart `npm run dev` on `http://localhost:3000`, verify `200 OK`, and commit locally on `main`.

## [2026-11-10T14:36:00-07:00] Comprehensive v4.0 Upgrade of `docs/system_design_architecture.html` (@arch with @dev & @ops specs)
- **Routing Note (Rule #3 / Rule #8):** `@bo` addressed `@dev @ops` to update `docs/system_design_architecture.html`. Because `@dev` is restricted to `src/` and `@ops` to `.env` / infrastructure configs, `@dev` and `@ops` compiled all recent frontend/cloud specifications and routed the `docs/` architecture blueprint write through `@arch`.
- **Key Architectural Updates Documented in v4.0:**
  1. Corrected society title throughout from `"Harbor & Environmental"` to **`Harsh-Environment Mass Spectrometry (HEMS) Society & Biennial Workshop`** (501(c)(3), est. 1999).
  2. Replaced Section 07 (legacy Decap CMS) with the **`$0` Nonprofit Google Sheets CSV + Static JSON Hybrid Control Plane** (`HEMS Upcoming Workshop Control Center` in `webmaster@hems-workshop.org` `My Drive`, `gid=540431442`, `upcoming_workshop.json`, RFC-4180 `upcomingWorkshop.ts`, `useUpcomingWorkshop.ts`, `sync-workshop-sheet.js`, `upcomingWorkshopCsv.test.mjs`, and the full 8-surface ingestion matrix). Documented why Decap CMS was retired.
  3. Updated Section 04 (Layout & Page Routes) with standalone `/history/`, standalone top-nav `/student-awards/`, standalone Contact-linked `/corporate-sponsorship/` (excluded from `Navbar`, dead `HEMS Store` links purged), updated `(portal)` routes, and resolved `/admin/` route ownership.
  4. Updated Section 05 & 06 with the `508.2 MB -> 24.5 MB` static export reduction, `next.config.ts` dev rewrite (`/api/manager/:path* -> localhost:4000`), and strict separation between Port 4000 Archive Workbench and Google Sheets Upcoming Workshop Config.
  5. Expanded Section 08 & 09 with Cloud-House Governance (`webmaster@hems-workshop.org`, `Webmaster Access` OU, `My Drive` vs. `Shared Drive` publishing constraint, `gcloud` `hems` profile isolation, canonical `src/frontend/.env.example` + `.env.local`, `$0` Firebase Hosting Preview Channels, keyless GitHub Actions WIF, and Archive Immutability Lock).
  6. Updated Section 10 & 11 with new registries, unit tests, and CLI runbooks.

## [2026-11-10T14:40:30-07:00] Private Firebase Hosting Preview Channel Deployment (@ops — authorized by @bo)
- **Objective:** Build the lean static export (`src/frontend/out/`) with live Google Sheet sync and deploy an unlisted 30-day Firebase Hosting Preview Channel (`preview-2027`) on project `hems-workshop` without modifying live production (`hems-workshop.org`).
- **Steps:**
  1. Stop `task-595` (`npm run dev` on port 3000) cleanly to release `.next` locks during static build.
  2. Run `npm --prefix src/frontend run sync:workshop` -> `npm run build` -> verify `src/frontend/out` bundle size (~24.5 MB).
  3. Deploy via `firebase hosting:channel:deploy preview-2027 --project hems-workshop --expires 30d` under `webmaster@hems-workshop.org`.
  4. Probe the returned HTTPS preview channel URL (`200 OK`) and restart `npm run dev` locally.

## [2026-11-10T15:04:00-07:00] Brand Guidelines v3.0.0 Upgrade & Refined Editorial Homepage Build (@brand, @arch, @dev, @qa, @ops)
- **@bo Directive:** `@brand update the guide as you recommend, store an archive of the previous guide. @dev suggest and build an upated homepage to preview.`
- **@brand Execution:**
  1. Archive exact v2.0.0 `brand-guidelines.md` into `.agents/config/design/archive/brand-guidelines-v2.0.0.md` and `docs/design/archive/brand-guidelines-v2.0.0.md`.
  2. Author **v3.0.0 ("Scholarly Precision & Editorial Symposium")** in `.agents/config/design/brand-guidelines.md` and mirror in `docs/design/brand-guidelines.md`:
     - Replace all-caps `font-black` shouting headings with Title-Case `Source Serif 4` editorial display headings (`--font-serif`), `Noto Sans` UI/body (`--font-sans`), and `IBM Plex Mono` technical kickers/metrics (`--font-mono`) loaded via `next/font/google` (retiring the 6-family render-blocking `@import` in `globals.css`).
     - Refine palette to Alabaster Paper (`#FAFBFD`), Specimen White (`#FFFFFF`), Porcelain Mist (`#F1F5F9`), Oxford Ink (`#0F172A`), Editorial Slate (`#334155`), Oceanic Sapphire (`#0369A1`), and Instrumentation Teal (`#0F766E`).
     - Retire sci-fi spinning HUD widgets in favor of calibrated analytical $m/z$ mass spectrum graphics and institutional ledgers.
     - Define clean Navbar rules (no decorative wave clutter, `"2027 Workshop"` label clarity, responsive mobile menu drawer, active route underline, and moving unauthenticated Committee Sign In to Footer).
- **@arch & @dev Execution:**
  1. Save permanent plan at `docs/plans/2026-11-10-refined-academic-homepage-and-brand-v3.md`.
  2. Update `globals.css` and `layout.tsx` with `next/font/google` (`Source_Serif_4`, `Noto_Sans`, `IBM_Plex_Mono`) and refined v3.0.0 color tokens (backward-compatible with all existing pages).
  3. Upgrade `Navbar.tsx` (emblem lockup, active state, mobile drawer, clean translucent white chrome) and `Footer.tsx` (multi-column institutional footer with subtle Committee Sign In link).
  4. Build `UpcomingWorkshopSpotlight.tsx` + refined `UpcomingHeroBadge.tsx` + editorial `src/app/page.tsx` featuring a calibrated SVG harsh-environment $m/z$ mass spectrum specimen card, 4-column institutional ledger, numbered Technical Charter cards, and 15th Workshop open-access repository spotlight.
  5. Verify with `npx tsc --noEmit` (`@qa`), commit locally, and update the private `preview-2027` Firebase Preview Channel (`@ops`).


## [2026-11-10T15:10:00-07:00] @qa / @sme / @arch / @ops — Post-Build Verification, Factual Audit & Preview Deployment
- **@sme / @qa Factual Audit Catch:** In `src/frontend/src/app/page.tsx` (Student Travel Awards card), adjusted eligibility wording from "graduate and undergraduate student presenters" to "full-time M.S., M.A., and Ph.D. graduate student presenters" and link label to "Eligibility, Selection Criteria & Application Guidelines" to match canonical HEMS Student Travel Award rules verbatim (`15thstudenttravel.html` / `StudentAwardsClient.tsx`).
- **@qa Verification:** `npx next typegen` and `npx tsc --noEmit` returned 0 errors; `node tests/unit/upcomingWorkshopCsv.test.mjs` passed 40/40 keys; `git diff b6a0075` across `src/frontend/src/app/archive/**` and archive JSONs confirmed 0 lines changed.
- **@ops Git Hygiene:** Added `.firebase/` to `.gitignore` and untracked `.firebase/hosting.*.cache` via `git rm --cached` so Firebase Hosting local upload hashes remain on disk without polluting git commits. Left `@bo`'s newly staged `docs/source-documents/pics/` untouched and untracked until `@bo` directs how to curate those photos.
- **@arch Documentation Sync:** Appended Phase 8 (Brand Guidelines v3.0.0 & Editorial Homepage Redesign) to `docs/implementation_plan.md` and Addendum 7 to `docs/session_history.md`.
- **@ops Preview Deployment:** Stopping dev daemon cleanly, running `npm run build` + `firebase hosting:channel:deploy preview-2027 --project hems-workshop --expires 30d`, and restarting `npm run dev` on `localhost:3000`.


## [2026-11-10T15:20:30-07:00] @brand / @sme / @arch / @dev — Curated Archival Photography & Editorial Layout for `/history`
- **Context:** `@bo` approved the v3.0.0 look and requested selecting 1–2 photos from `docs/source-documents/pics/` (not all 11) to break up the wall-of-text on `/history` (`src/frontend/src/app/history/page.tsx`).
- **Visual & Domain Curation (`@brand` & `@sme`):** Inspected all 11 staged photographs in `docs/source-documents/pics/`:
  1. Selected `ms in nosecone.jpg` -> `src/frontend/public/images/history/usf-cot-auv-nosecone-ms.jpg` (Figure 01): Depicts an early underwater mass spectrometer and compact turbopump pressure housing mounted inside a yellow AUV hull/nosecone in the lab—directly illustrating the late-1990s USF COT underwater MS genesis and miniature vacuum packaging challenge in Section 1 (*Early Years, 1999–2005*).
  2. Selected `CIMG0561.JPG` -> `src/frontend/public/images/history/offshore-ms-deployment.jpg` (Figure 02): Crisp, sunlit 4:3 horizontal photograph of researchers deploying a caged underwater mass spectrometer over the stern of a research vessel in open blue water—directly illustrating real-world harsh-environment marine deployment in Section 2 (*Formation of the HEMS Society, 2005–Present*).
- **Editorial Layout & Wall-of-Text Breakup (`@dev`):**
  - Web-optimize both selected JPEGs (`<= 1280px` width, progressive/high-clarity JPEG ~150–220 KB each) into `src/frontend/public/images/history/` while leaving `docs/source-documents/pics/` completely untouched.
  - Refactor `src/frontend/src/app/history/page.tsx` to Brand v3.0.0 (*Scholarly Precision & Editorial Symposium*): Title-Case `Source Serif 4` headings, comfortable 65ch prose measure, 12-column asymmetric split blocks pairing narrative prose with museum-style captioned `<figure>` plates, a split sub-grid + callout between the 1999 inaugural workshop and the 2002 JPL vacuum-pump milestone, a clean 2-column chronological timeline ledger, and the iconic HEMS beachfront pull-quote. Preserve 100% of canonical historical prose.


## [2026-11-10T15:52:00-07:00] @prod / @sme / @brand — Surveying Recent Downloadable Presentations (15th & 14th Workshops) for Choice Graphical Assets
- **Objective:** Review recent downloadable presentations (`local_data/proceedings/15th` and `14th` in strict read-only mode) and curate 5–10 choice graphical examples into `docs\source-documents\pics\PresentionExtracted`.
- **Folder Structure Verification:** Inspected `docs\source-documents\pics\PresentionExtracted` and found two user-created subdirectories: `Raw` and `Modified`.
  - Unmodified byte-exact embedded graphics extracted from PDFs belong in `docs\source-documents\pics\PresentionExtracted\Raw\`.
  - Any graphic cropped, composited, background-cleaned, or rasterized/trimmed from a vector slide belongs in `docs\source-documents\pics\PresentionExtracted\Modified\`.
- **Method:** Using a temporary scratch script in the conversation artifact `scratch/` directory (`PyMuPDF` + `Pillow`) to catalog embedded high-res graphics and vector-rich slide diagrams across 2025 (15th) and 2022 (14th) presentations, render contact sheets for visual inspection, and select 8–9 top-tier scientific graphics spanning spaceflight, deep-ocean/polar robotics, miniature vacuum/CAD hardware, ion-optics simulations, and field deployments.


## [2026-11-10T16:10:30-07:00] @prod / @brand / @arch / @dev — Site-Wide Unmodified Photo Curation & Brand v3.0.0 ("Casual, Beach, Academic") Rollout
- **Directive from `@bo`:** Do NOT modify any images (`Copy-Item` exact unmodified files only); only use surviving approved files in `docs\source-documents\pics` (`Group photo2025.JPG`, `FromGottfried\2019`, `FromGottfried\2025`, `FromTimShort`, and `PresentionExtracted\Raw`); weave them across the website for an authentic **casual, beach, academic** HEMS feel.
- **Byte-Exact Asset Policy:** All 14 selected `.jpg` files are copied verbatim via `Copy-Item` (preserving exact SHA-256 hashes, dimensions, and EXIF orientation) into `src/frontend/public/images/history/` and `src/frontend/public/images/gallery/`, including replacing the 2 earlier resized `/history` files with exact unmodified copies of `FromTimShort\ms in nosecone.jpg` and `FromTimShort\CIMG0561.JPG`. Skipped `.jpx`, `.mp4`, and multi-megabyte `.MP.jpg` Motion Photos in favor of crisp standard `.jpg` files.
- **Page-by-Page Curation & Brand v3.0.0 Alignment (`0` changes to `/archive/**`):**
  1. **Home (`/`, `page.tsx`):** Added unmodified presentation graphics (`01` Volcanic Fumarole Backpack MS, `07` Spaceflight Orbitrap CAD, `03` Icefin Under-Ice ROV) to the 3 Technical Charter domain cards, plus a new **"The HEMS Symposium Spirit — Casual, Beachfront & Single-Track"** 3-photo editorial feature (`virginia-beach-boardwalk-2025.jpg`, `single-track-session-2019.jpg`, `oceanfront-reception-2025.jpg`).
  2. **About (`/about`, `about/page.tsx`):** Upgraded to Brand v3.0.0 typography; paired the Official Mission Statement with `group-photo-2025.jpg` (2025 Virginia Beach Society group portrait) and paired the 5 Core Objectives in a symmetric `3x2` grid with `hardware-demo-hawaiian-shirts-2025.jpg`.
  3. **History (`/history`, `history/page.tsx`):** Swapped in byte-exact unmodified `FromTimShort` originals and added `myrtle-beach-pier-surf.jpg` alongside the *"Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!"* philosophy section.
  4. **Workshop Portal (`/layout-portal`, `/accommodations`, `/call-for-papers`, `/registration`, `(portal)/layout.tsx`):** Aligned headers and sidebar to Brand v3.0.0; showcased `oceanfront-reception-2025.jpg` on Portal Overview, `myrtle-beach-pier-surf.jpg` + `virginia-beach-boardwalk-2025.jpg` on Accommodations, and `serpa-cycloidal-ion-trajectories.jpg` + `amerom-moma-mars-ms-cad.jpg` on Call for Papers.
  5. **Student Travel Awards, Corporate Sponsorship & Contact (`StudentAwardsClient.tsx`, `CorporateSponsorshipClient.tsx`, `contact/page.tsx`):** Upgraded headers to Title-Case `Source Serif 4`; featured `roundtable-fellowship-2025.jpg` on Student Travel Awards & Contact, and `hardware-demo-hawaiian-shirts-2025.jpg` on Corporate Sponsorship.


---
### [2026-11-10] `@ops` & `@qa` — Production Static Build, Local Commit & Private Preview Deployment (Unmodified Sitewide Imagery)
- **Context**: Resuming final build, local commit, and `preview-2027` deployment after staging 14 byte-exact unmodified photos/presentation graphics from `docs/source-documents/pics/` and updating 10 frontend `.tsx` files (`0` TypeScript errors, `40/40` CSV unit tests passed).
- **Plan**:
  1. Stop running local dev server (`task-742`) so `scripts/build-prod.js` runs cleanly.
  2. Verify `git status` and SHA-256 parity of all 14 staged assets against `docs/source-documents/pics/` (leaving `docs/source-documents/pics/` untracked so ~180 MB of raw albums/videos do not enter git).
  3. Execute `npm --prefix src/frontend run build` to compile static export (`src/frontend/out`).
  4. Commit locally on `main` (no `git push` to `origin/main`).
  5. Deploy to Firebase Hosting preview channel `preview-2027` (`https://hems-workshop--preview-2027-v4fnxb3i.web.app/`), restart local dev server (`http://localhost:3000/`), verify HTTP `200 OK` responses, and report to `@bo`.


---
### [2026-11-10] `@prod`, `@arch`, `@brand`, `@dev`, `@qa` & `@ops` — Smiling Community Curation, History Page Photo Swap & Round-2 Archived Presentation Extraction
- **Request (`@bo`)**:
  1. Choose warmer, more smiling community photos from the newly added albums (`docs/source-documents/pics/Older Pics` — `HEMS2013_*`, `10thHEMS_*`, `GPK_*` — plus `FromGottfried/2025`).
  2. Change one of the History page (`/history`) pictures (`Fig. 02`: swap `offshore-ms-deployment.jpg` [backs turned on ship deck] to `HEMS2013_55.JPG` [smiling HEMS Society group under palm trees on the beachfront terrace of The Don CeSar in St. Pete Beach, FL, 9th Workshop 2013]).
  3. Extract another 5 to 10 unmodified raw pictures (`11`–`20`, 10 total) from recent archived presentations (`15th` [2025], `14th` [2022], `13th` [2019]) into `docs/source-documents/pics/PresentionExtracted/Raw/` and weave top selections into `/` and `/call-for-papers`.
- **Constraints**:
  - Zero byte modification on all extracted PDF graphics and all copied photographs (verified via SHA-256).
  - `/source-material` and `src/frontend/src/app/archive/**` remain 100% untouched.
  - Keep `docs/source-documents/pics/` untracked in git; commit locally on `main` (do not `git push`) and redeploy `preview-2027`.


---
### [2026-11-10] `@prod`, `@arch`, `@dev`, `@qa` & `@ops` — Lively Student Awards Photo & Native Aspect-Ratio Framing Fix on 16th Workshop Overview
- **Feedback (`@bo`)**:
  1. Find a livelier photo for `/student-awards`.
  2. Fix `/layout-portal` (`16th HEMS Workshop Overview`), where `h-44 object-cover object-top` on `10thHEMS_44.JPG` anchored to the tall upper wall and sliced across attendees' faces.
- **Root Cause & Fix**:
  - Fixed-height containers (`h-44`, `h-48`, `h-52`) paired with `w-full object-cover object-top` force ~2.1:1–2.9:1 letterbox crops onto `3:2` and `4:3` photographs, slicing across faces when subjects stand below the top third of the frame.
  - Swap `/student-awards` to `FromGottfried/2019/IMG_20190918_191514.jpg` (`banquet-awards-applause-2019.jpg` — lively evening awards banquet applause, beaming smiles, attendees standing up snapping photos in Hawaiian shirts, oceanfront palm trees outside window) inside a native `aspect-[4/3]` container (`0%` crop).
  - Swap `/layout-portal` (`16th HEMS Workshop Overview`) to `Older Pics/10thHEMS_48.JPG` (`golden-hour-harbor-reception-2015.jpg` — golden-hour open-air waterfront marina reception with full-view smiling colleagues) inside a native `aspect-[3/2]` container (`0%` crop).
  - Proactively replace fixed `h-48`/`h-52` `object-top` classes on `3:2` DSLR community photos across `/`, `/about`, `/corporate-sponsorship`, and `/history` `Fig. 02` with native `aspect-[3/2]` so no faces or edge subjects are ever clipped at any viewport width.


---

### [2026-11-11T07:30:00-07:00] @arch, @web (@sme1), @prod & @dev — Website-Wide SEO & Scholarly Indexing Optimization
- **Request (@bo):** `@arch review the website for SEO optimization and have @web update as necessary.`
- **Governance & Misroute Protocol (`scrumrules.md` Rules #2 & #8, `.agents/config/project_charter.md`, `.agents/personas/smeN.md`):**
  1. `@web` is the charter-defined alias for `@sme1` (*Website design, modern UI/UX, SEO, high-performance, accessibility, scientific archive management*).
  2. Under `scrumrules.md` Rule #2 and `smeN.md` Section 3.C, `@web` (`@sme1`) is **strictly read-only** for `src/` codebase files (permitted to author specifications in `docs/` and conduct Upstream Validation + Downstream `SMEX Domain Audit`), whereas `@dev` is the **sole agent permitted to write to `src/`**.
  3. Accordingly, `@arch` conducts the structural SEO audit and authors the permanent blueprint (`docs/plans/2026-11-11-seo-optimization-architecture.md`); `@web` (`@sme1`) invokes the Misroute Protocol to clarify its read-only SME mandate, validates the SEO/GEO/Scholarly specifications, and routes `src/frontend/` implementation to `@dev`; `@prod` signs off on academic & attendee discovery ROI; `@dev` executes all `src/frontend/` changes while strictly preserving the Archive Page Lock (`0` edits to `src/frontend/src/app/archive/**`).
- **Forensic Baseline Defects Identified (`seo_audit.py` across 33 exported HTML routes + `sitemap.xml` + `robots.txt` + `llms.txt`):**
  1. **Root Metadata (`layout.tsx`):** Missing `metadataBase`, `title.template`, `openGraph`, `twitter` (`summary_large_image`), `robots` Googlebot directives, and global `Organization`/`NGO` + `WebSite` Schema.org JSON-LD. Zero routes currently emit an `og:image`.
  2. **Canonical URLs:** `0/11` non-archive public pages emit `<link rel="canonical">`. Archive pages emit canonicals without trailing slashes while `next.config.ts` enforces `trailingSlash: true`.
  3. **Broken Archive Event JSON-LD (`generateArchiveJsonLd.ts`):** `parseDateRange` fails on Unicode en-dashes (`–`), missing commas (`October 7–10 2003`), and yearless strings (`February 21–23` in `1999.json`, `March 18–21` in `2001.json`), leaving **6 of 15 workshops (`1999`, `2001`, `2003`, `2011`, `2013`, `2015`) with `startDate: undefined`** (rejected by Google Event Rich Results). Additionally, `ScholarlyArticle.isAccessibleForFree` is string `"False"` instead of boolean `false`, and `eventStatus`, `url`, `image`, `headline`, `datePublished`, and author `affiliation` are missing.
  4. **Sitemap Defects (`sitemap.ts`):** 21/22 URLs lack trailing slashes (triggering 308 redirects under `trailingSlash: true`), 5 public routes are missing (`/layout-portal/`, `/call-for-papers/`, `/registration/`, `/accommodations/`, `/formatting-guidelines/`), and `<lastmod>` is absent.
  5. **Indexation Leaks (`robots.ts` & Auth/Admin Portals):** `/admin/`, `/admin/analytics/`, `/board/`, `/reviewer/`, and `/auth/` export with duplicate root titles, zero `noindex` meta tags, and no `/admin/`, `/board/`, `/reviewer/` rules in `robots.txt`.
  6. **Duplicate Client-Only Metadata on `/contact` & Generic `/layout-portal` Title:** `contact/page.tsx` uses `"use client"` directly, inheriting the homepage title/description verbatim; `layout-portal/page.tsx` uses generic `"HEMS Workshop Portal"` instead of `"16th HEMS Workshop Overview (September 2027)"`.
  7. **Hallucinated / Broken `public/llms.txt`:** Contains `file:///archives-index.json` and 404 routes `/archive/2023`, `/archive/2020`, `/archive/2016` while omitting `/archive/2025/`, `/history/`, `/student-awards/`, `/corporate-sponsorship/`, and `/layout-portal/`.
  8. **CLS & Heading Hierarchy:** `formatting-guidelines/page.tsx` skips `h2` -> `h4`; `<img>` tags across shell and feature cards lack explicit intrinsic `width`/`height` attributes.
- **Architectural Plan:** Implement `src/frontend/src/utils/seo.ts`, generate a Brand v3.0.0 `1200×630` `opengraph-image.png` / `twitter-image.png` in `src/frontend/src/app/` (cascading automatically into all 37 routes including locked `/archive/**`!), add `manifest.ts`, upgrade `generateArchiveJsonLd.ts`, `sitemap.ts`, `robots.ts`, `llms.txt`, `noindex` layouts for private portals, `ContactClient.tsx` split, full metadata + JSON-LD across all 11 public non-archive routes, and intrinsic `width`/`height` attributes.

---
### [2026-11-11] Phase 9 Final Gate Verification & Preview Deployment (`@arch`, `@web` / `@sme1`, `@qa`, `@brand`, `@legal`, `@ops`, `@rte`)
- **Build & Static Export Verification (`@qa` & `@web`):** `npm --prefix src/frontend run build` generated `40/40` static routes with exit code `0`. `verify_seo_post.py` confirmed `27/27` trailing-slash `<url>` entries with `<lastmod>` in `out/sitemap.xml`, `15/15` `/archive/[year]/` pages emitting valid ISO `startDate`/`endDate` and boolean `isAccessibleForFree: false` alongside `@graph` `Organization`/`WebSite` JSON-LD, `11/11` non-archive public pages emitting unique `<title>`, `144–162` char `<meta name="description">`, trailing-slash `<link rel="canonical">`, `og:image`, `twitter:card="summary_large_image"`, `h1=1`, `noAlt=0`, `noDim=0`, and `5/5` private/auth routes emitting `robots="noindex, nofollow"`.
- **Archive Lock & Brand/Legal Verification (`@brand`, `@legal`, `@rte`):** `git diff` on `src/frontend/src/app/archive`, `src/frontend/src/data/archives`, and `src/frontend/src/data/master_workshops.json` is `0` bytes. Social card `1200x630` adheres strictly to Brand v3.0.0 (`#0A192F`, `#38BDF8`, `#FAFBFD`, `Source Serif 4` / `Noto Sans` / `IBM Plex Mono`). Historical founding (`1999 St. Petersburg, FL`) and `501(c)(3)` incorporation (`2008`) align 100% across `page.tsx`, `history/page.tsx`, `contact/page.tsx`, `seo.ts` JSON-LD, and `llms.txt`. `[PASS]` issued across `@web`, `@qa`, `@brand`, and `@legal`.
- **Deployment Action (`@ops`):** Mark Phase 9 `[COMPLETED]` in `docs/implementation_plan.md`, commit locally on `main` (excluding `docs/source-documents/pics/`, no `git push`), deploy `src/frontend/out/` to Firebase Hosting preview channel `preview-2027`, verify live SEO endpoints (`200 OK`), and restart `npm --prefix src/frontend run dev` daemon.

---
### [2026-11-11] Archive-Manager Construction Review & Authorized Archive SEO Updates (`@arch`, `@dev`, `@web` / `@sme1`, `@qa`)
- **Authorization:** `@bo` granted explicit permission to apply the archive SEO updates upon completing a joint `@arch` + `@dev` review of how the archive is constructed and interacts with the Workshop Manager.
- **Architectural Review Findings (`@arch` + `@dev`):**
  1. **Authoring & Fan-out (`tools/manager` on port `4000`):** `GET /api/manager/workshops` loads `src/frontend/src/data/master_workshops.json`. `POST /api/manager/save` writes `master_workshops.json`, checks on-disk PDFs in `local_data/proceedings/{ordinal}/...`, resolves corporate sponsor logos from `corporate_registry.json` + `public/images/sponsors/` with `?v=<mtimeMs>`, compiles all 15 `src/frontend/src/data/archives/{year}.json` files with 4 parallel URL tiers (`local_target_path` `/api/manager/serve?file=...`, `public_website_url` `https://storage.googleapis.com/...`, `gcloud_url` `gs://...`, `legacy_url`), and opens `http://localhost:3000/archive/{year}`.
  2. **Pre-Build & Search Pipeline (`src/frontend/scripts/build-prod.js`):** Runs `validate-archives.js` (Zod schema check on `src/data/archives/*.json`), `generate-archives-index.js` (`master_workshops.json` -> `public/archives-index.json`), `index-pdf-contents.js` (`local_data/cache/*.json` -> `public/mock-pdf-chunks.json` or Algolia), and `npx next build` (`output: "export"`, `trailingSlash: true`).
  3. **Runtime Interaction:** `next.config.ts` proxies `/api/manager/:path*` to `localhost:4000` in `next dev` so `isLocal = process.env.NODE_ENV === 'development'` streams local PDFs and `_preview.png`/`_preview.txt` hover cards (`FrontendPreviewHover.tsx`), while static builds bind strictly to `public_website_url`. `DownloadGate.tsx` intercepts `.pdf`/`serve?file=` clicks client-side without blocking HTML/metadata crawlers; `CitationButton.tsx` anchors to `<div id={talk.id}>`.
  4. **Hidden Bug Uncovered During Review:** `src/frontend/src/app/archive/page.tsx` lines 964–979 hardcoded the `Browse Past Workshops` grid from `14th (2022)` down to `1st (1999)`, omitting `15th HEMS Workshop (2025)` (`/archive/2025/`) even though `2025` is in `master_workshops.json` and `src/data/archives/2025.json`, and using non-trailing-slash links. Deriving that browse list dynamically from `workshopsData` fixes the orphaned `2025` link and guarantees future Manager saves appear automatically.
- **Surgical Execution Plan (`@dev`):**
  - Extract client search UI to `src/frontend/src/components/archive/ArchiveHubClient.tsx` (deriving browse cards dynamically from `workshopsData` with `/archive/${year}/` links and `width={96} height={96}` on `/hemslogo.jpg`).
  - Convert `src/frontend/src/app/archive/page.tsx` into a Server Component exporting `buildPageMetadata` for `/archive/` plus `CollectionPage` (`ItemList` of all 15 workshops) and `BreadcrumbList` JSON-LD.
  - Update `src/frontend/src/app/archive/[year]/page.tsx`: normalize trailing-slash canonical `https://www.hems-workshop.org/archive/${year}/`, strip trailing comma from `data.venue` in meta descriptions, add `DEFAULT_OG_IMAGE` + `twitter` (`summary_large_image`) in `generateMetadata`, emit `BreadcrumbList` JSON-LD alongside `generateArchiveJsonLd`, and add intrinsic `width`/`height` attributes to host/sponsor `<img>` tags without altering visual styles or schedule/preview/citation logic.
  - Zero edits to `master_workshops.json`, `src/data/archives/*.json`, `local_data/`, or `tools/manager/`.


## [2026-11-11] Phase 10 — Cell Phone & Tablet Compatibility Audit, Plan & Auto-Advance Implementation (`@arch`, `@dev`, `@qa`, `@ops`)
- **Directive (`@bo`):** `@arch` review the website for cell phone and tablet compatibility, develop a permanent plan to ensure full compatibility, and begin implementation immediately via auto-advance.
- **Boundary & Lock Verification:**
  - `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, and `tools/manager/**` remain strictly untouched (`0` bytes diff) per `docs/project_charter.md` Section 3.1.
  - `docs/source-documents/pics/` remains untracked and unmodified; `/source-material` remains read-only.
- **Architectural Audit Findings Across Cell Phones (`320px–430px`) & Tablets (`768px–1024px`):**
  1. **Root Viewport & CSS Guard (`layout.tsx`, `globals.css`):** Add explicit Next.js `export const viewport: Viewport` (`device-width`, `initialScale: 1`, `viewportFit: "cover"`, `themeColor: "#FAFBFD"`) and `overflow-x: clip` on `html, body` (prevents stray horizontal scrollbars while preserving `position: sticky` on `Navbar` and portal sub-nav) plus a `.no-scrollbar` utility for touch pill rails.
  2. **Navbar Portrait-Tablet Overflow & Touch Dropdown Defect (`Navbar.tsx`):**
     - `hidden md:flex` (`768px`) overflows horizontally on all portrait tablets (`768px–1023px`) because Brand Lockup + 6 nav items + CTA totals `~925px` (`~1,030px` signed in). Promote desktop nav to `lg:flex` (`1024px+`) with compact `lg` spacing (`gap-0.5 xl:gap-1.5`, `px-2 xl:px-3`) and render the drawer button (`lg:hidden`, `44×44px`) across all phones and portrait tablets.
     - Desktop `Archives` and signed-in `User` popovers previously relied solely on `group-hover:`, trapping touch-screen landscape tablets (`1024px+`). Add explicit click/tap toggle buttons with ARIA attributes, outside-click & `Escape` dismissal, and route-change auto-close alongside hover support.
     - Upgrade `< 1024px` drawer with `max-h-[calc(100dvh-4rem)] overflow-y-auto`, `44px` minimum tap targets, collapsible `2027 Workshop` portal links, collapsible `Proceedings Archives` year selector (`2025`–`1999`), and authenticated officer role/Admin/Sign-Out controls.
  3. **Missing Mobile Portal Sub-Navigation & Crushed Tablet Column (`(portal)/layout.tsx`):**
     - `<aside className="hidden md:flex md:w-64">` hid all portal navigation on `< 768px` phones and crushed `<main>` to `416px` on `768px` portrait tablets (`768 - 256 - 96`).
     - Move fixed sidebar to `lg:flex lg:w-64`, inject a sticky horizontal scrollable pill sub-navigation bar (`lg:hidden`) for all authorized `Workshop Portal` and `Administration` pages (plus Dev Role Switcher in mock mode), normalize trailing slashes in active-route checks, and replace nested `<main>` with `<div className="flex-grow min-w-0 p-4 sm:p-6 lg:p-10 xl:p-12 bg-surface">`.
  4. **Homepage Impact Ledger & Hero Touch Ergonomics (`page.tsx`, `UpcomingHeroBadge.tsx`, `UpcomingWorkshopSpotlight.tsx`):**
     - Replace misaligned `divide-y sm:divide-y-0 sm:divide-x` + `first:pl-0` on the 2×2 / 4-column Impact Ledger with exact cell-level borders across `< 1024px` (2×2) and `>= 1024px` (1×4).
     - Stack primary/secondary hero CTAs cleanly (`w-full sm:w-auto justify-center`) on narrow phones and refine multi-line pill wrapping (`rounded-2xl sm:rounded-full`).
  5. **Coarse-Pointer Hover Card & Short-Viewport Modals (`FrontendPreviewHover.tsx`, `DownloadGate.tsx`, `CitationModal.tsx`):**
     - Gate `FrontendPreviewHover` floating card with `hidden md:block` and `w-[min(400px,calc(100vw-2rem))]` so `320px–390px` phones never clip or trap taps.
     - Add `max-h-[90dvh] overflow-y-auto p-5 sm:p-8` to `DownloadGate.tsx` modals and `max-h-[90dvh] p-4 sm:p-6` + `break-all` permalink/APA wrapping to `CitationModal.tsx`.
  6. **iOS Safari `< 16px` Auto-Zoom Prevention & Subpage Narrow-Screen Fit:**
     - Set `text-base sm:text-sm` (`16px` mobile, `14px` `sm:`+) on form inputs/selects/textareas in `ContactClient.tsx`, `DownloadGate.tsx`, `auth/page.tsx`, `admin/page.tsx`, and `admin/analytics/page.tsx`.
     - Apply `p-5 sm:p-8` card padding, `rounded-2xl sm:rounded-full` header badges, `break-all` on long filenames/emails (`HEMS_Abstract_LastName_FirstName.pdf`, coordinator mailto links), `flex-wrap` on `ArchiveHubClient.tsx` result action buttons and `admin/analytics` / `board` / `reviewer` rows, and `min-[380px]:grid-cols-2` on the Corporate Sponsor logo grid.

## [2026-11-11] @qa & @ops — Phase 10 Verification Sign-Off & Local Release Commit
- **@qa Verification Results:**
  - `npm --prefix src/frontend run build`: Passed (`40/40` static routes, `0` TypeScript errors, `15/15` Zod archive schemas valid).
  - Archive Lock check (`git diff --stat src/frontend/src/app/archive src/frontend/src/data tools/manager`): `0` bytes changed.
  - `verify_seo_post.py`: Passed across all 32 exported HTML routes, `sitemap.xml` (27 trailing-slash URLs), `robots.txt`, `manifest.webmanifest`, and `llms.txt` (`Errors: 0`).
  - `verify_responsive.py`: Real headless Chrome DevTools Protocol audit across 19 routes × 6 viewports (`320×568`, `375×812`, `390×844`, `768×1024`, `820×1180`, `1024×768` = 114 live combinations) + interactive mobile/tablet drawer & touch dropdown toggle tests passed with `TOTAL RESPONSIVE ERRORS: 0` (`0` horizontal overflows, `0` `<16px` mobile inputs, `44×44px` touch targets verified).
- **@rte Gate:** `[PASS]` tags confirmed across `@arch`, `@dev`, `@brand`, `@sme`, `@legal`, and `@qa`.
- **@ops Action:** Staging `src/frontend/`, `docs/implementation_plan.md`, `docs/session_history.md`, `docs/logs/thought_trace.md`, and `docs/plans/2026-11-11-mobile-and-tablet-compatibility.md` (keeping `docs/source-documents/pics/` untracked), committing locally on `main`, and starting local preview server on `http://localhost:3000`.

## [2026-11-11] @prod, @arch & @dev — Removal of 'Key Historical Milestones' & Non-Obvious Provenance Photo Captions
- **User Request (@bo):** Remove the `'Key Historical Milestones'` section (`history/page.tsx`), refactor picture captions across the website so they do NOT describe what is visually obvious in the photo and instead provide unseen context (time, location, occasion, presenter/institution), and ask `@bo` for additional background on any photos needing deeper context.
- **Role Routing (`scrumrules.md` Rules #2 & #8):** `@prod` is strictly read-only for `src/` codebase files. `@prod` audited all 20 photo placements across 8 routes against EXIF timestamps/GPS and the official printed Workshop Programs (`9th`–`15th_Program.pdf` in `local_data/proceedings/`), formulated the editorial specification and targeted context questions for `@bo`, and routed blueprint updates to `@arch` and `src/` implementation to `@dev`.
- **Provenance Verification (Zero Hallucinations — Rule #5):**
  - `usf-cot-auv-nosecone-ms.jpg` (`FromTimShort/ms in nosecone.jpg`): Olympus C-2000Z, USF COT lab in St. Petersburg, FL (wall poster shows Sept 1998–Jan 1999 West Florida Shelf transects -> c. 1999–2001). Ask `@bo` for exact year, AUV name, and analyzer generation.
  - `st-pete-beach-don-cesar-2013.jpg`, `don-cesar-terrace-smiles-2013.jpg`, `don-cesar-hawaiian-smiles-2013.jpg`: EXIF `2013-09-17` -> 9th HEMS Workshop Tuesday Dinner at The Don CeSar, St. Pete Beach, FL (`9th_Program.pdf` p.9). Ask `@bo` who is receiving the acrylic award plaque in `HEMS2013_38.JPG`.
  - `sponsor-exhibit-smiles-2015.jpg` (`2015-09-14 17:04`), `single-track-auditorium-smiles-2015.jpg` (`2015-09-15 10:56`), `golden-hour-harbor-reception-2015.jpg` (`2015-09-15 18:33`): 10th HEMS Workshop, University of Maryland School of Pharmacy & Baltimore Inner Harbor, MD (`10th_Program.pdf`). Ask `@bo` whether `10thHEMS_48.JPG` was aboard an Inner Harbor boat/water taxi or on the Rusty Scupper waterfront deck.
  - `poster-session-smiles-oxnard-2017.jpg` (`2017-09-20 17:08`): 11th HEMS Workshop, Mandalay Beach Resort, Oxnard, CA (`11th_Program.pdf`).
  - `myrtle-beach-pier-surf.jpg` (`2019-09-16 16:32`, GPS `33.76619, -78.78036`) & `banquet-awards-applause-2019.jpg` (`2019-09-18 19:15`): 13th HEMS Workshop, Myrtle Beach, SC (`13th_Program.pdf`: Lands End Workshop Dinner). Ask `@bo` to confirm the exact Myrtle Beach host hotel name.
  - `group-photo-2025.jpg` (`2025-09-17 18:27`) & `virginia-beach-boardwalk-2025.jpg` (`2025-09-18 12:10`): 15th HEMS Workshop, Sheraton Virginia Beach Oceanfront Hotel (`3501 Atlantic Ave`, Virginia Beach, VA).
  - Presentation graphics (`Fox`, `Raith`, `Coppin-Massanet`, `Danell`, `Bell`, `Verbeck` 2019 & 2025, `Serpa`, `Kibelka`): Matched to exact talk records and slides in `13th` & `15th` Workshop proceedings; ask `@bo` for vessel/expedition details on `bell-subsea-lander-ms-2025.jpg` and volcano/polar site specifics on `fox` & `coppin`.
- **Accessibility Note (`@web` / WCAG 2.1):** Screen-reader `alt` attributes remain descriptive for visually impaired users, while visible `<figcaption>` text is strictly dedicated to unseen historical, geographical, temporal, and scientific provenance.
- **Archive Lock Check:** `0` modifications to `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, or `tools/manager/**`.

## [2026-11-11] @ops — Firebase Preview Channel Status Check & Pre-Staging Build (`src/frontend/out/`)
- **User Request (@bo):** Provide the link to the online Firebase preview and confirm whether it is updated.
- **Findings:**
  - Exact preview channel URL: `https://hems-workshop--preview-2027-v4fnxb3i.web.app/` (channel `preview-2027` on project `hems-workshop`).
  - Checked `firebase hosting:channel:list --project hems-workshop` and `gcloud auth application-default`: `webmaster@hems-workshop.org`'s interactive Google Workspace OAuth session has expired (`Please run firebase login --reauth`).
  - Therefore, the online preview channel is **not yet updated** with today's SEO (`7956483` / `3279544`), Mobile & Tablet Compatibility (`0ffc240`), and Milestone/Caption (`891c38c`) commits—it currently reflects yesterday's `e98df44` deploy, whereas `http://localhost:3000` has all latest updates.
- **Action:** Pre-building `src/frontend/out/` via `npm --prefix src/frontend run build` (and restarting `next dev`) while verifying `https://hems-workshop--preview-2027-v4fnxb3i.web.app/` reachability so that once `@bo` completes `firebase login --reauth`, `@ops` (or `@bo` directly) can deploy immediately with `firebase hosting:channel:deploy preview-2027 --expires 30d --project hems-workshop`.

## [2026-11-11] @brand & @ops — Brand Guide v3.1.0 (Retiring IBM Plex Mono) & Online Image Load Latency Diagnosis
- **User Request (@bo):**
  1. `@brand`: Remove the attached monospace font (`IBM Plex Mono` / `font-mono`, shown in screenshot `15th HEMS WS • Volcanic Fumarole MS`) from our style guide because the "computer-readout" feel is tacky.
  2. `@ops`: Explain why images in the online Firebase version load very slowly and whether that will automatically improve before publication.
- **Domain Isolation Check (`locksrules.md` Rule #3):** `@brand` is strictly restricted to `docs/design/` (and synchronized `.agents/config/design/brand-guidelines.md` which `@bo` has open) and CANNOT modify `src/`. `@brand` archives `v3.0.0` to `brand-guidelines-v3.0.0.md`, publishes `v3.1.0` (Dual-Font Editorial Hierarchy: `Source Serif 4` + `Noto Sans` with `tabular-nums`, retiring `IBM Plex Mono` / `font-mono` as an explicit Anti-Pattern), and awaits `@bo`'s green light to route sitewide `src/` rollout to `@dev`.
- **@ops Image Performance Diagnosis:**
  - Measured `src/frontend/public/images/{gallery,history}`: 11 camera JPEGs are raw `16–21 MP` (`4928×3264` to `5568×3712`) files ranging from `1.23 MB` up to `10.36 MB` (`72.2 MB` total; `23.4 MB` on the Homepage alone), whereas presentation graphics (`70–160 KB`) load immediately.
  - Because `next.config.ts` uses Static Export (`output: "export"`, `images: { unoptimized: true }`) and `preview-2027` shares the exact same Firebase Hosting CDN as live production (`hems-workshop.org`), publishing alone will **not** speed up first-visit downloads.
  - Recommended fix for `@dev` (upon `@bo` approval): Keep raw archival originals untouched in `docs/source-documents/pics/` and generate `1600px` max-width web delivery copies (`~120–220 KB`, zero cropping/color changes) in `src/frontend/public/images/`, cutting payload by `~97%`.


---
### [2026-11-11T14:52:00-07:00] SCoT Trace — `@arch`, `@ops`, `@dev`, `@qa`, `@prod`, `@brand`, `@legal`
- **Directive (`@bo`):** Execute Brand Guidelines `v3.1.0` rollout across `src/frontend/` (retiring `IBM_Plex_Mono` / `font-mono` computer-readout styling), convert oversized public photographs (`72.2 MB` across 11 camera JPEGs) to fast-loading web-sized assets while applying strictly non-generative, content-preserving photographic quality improvements (composition crops, chroma/luma grain reduction, tonal/white-balance polish, and Lanczos + edge-aware clarity upscaling on low-resolution slides), save full Before/After comparisons for `@bo`'s review, and then open a structured discussion on whether to remove/crop/swap images containing visible alcohol.
- **Guardrails & Domain Locks:**
  1. Zero edits to `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, `tools/manager/**`, `/source-material`, or `docs/source-documents/pics/`.
  2. In `src/frontend/src/app/globals.css`, alias `--font-mono: var(--font-noto-sans), system-ui, -apple-system, sans-serif;` so locked `/archive/[year]` pages seamlessly inherit `Noto Sans` without touching a single byte of `src/frontend/src/app/archive/**`.
  3. Remove `IBM_Plex_Mono` from `layout.tsx`, update all unlocked `.tsx` components (`page.tsx` including SVG mass spectrum `fontFamily`, `about`, `history`, `formatting-guidelines`, `Navbar`, `Footer`, `ArchiveHubClient`, `CitationModal`, `(portal)/*`, and `components/workshop/*`) to `Noto Sans` (`tabular-nums` on figures/dates), and regenerate `opengraph-image.png` / `twitter-image.png` without `Consolas` monospace labels.
  4. Apply strictly classical signal-processing (`Pillow` + `NumPy` + `SciPy` — zero generative AI, zero facial/content alteration) across all 21 images in `src/frontend/public/images/{history,gallery}/`, fixing `group-photo-2025.jpg`'s EXIF orientation (`exif_orient=8` -> upright portrait) and syncing `width`/`height` attributes across `src/frontend/src/` for `CLS = 0`.
  5. Store untouched `before/`, `after/`, and `comparisons/` plates in git-ignored `src/frontend/photo_review/` (outside `public/`) and embed visual comparison plates in a User-Facing Artifact (`photo_enhancements_review.md`).
  6. Keep existing alcohol visible during this pass per `@bo`'s sequencing instruction, then present a complete 7-photo inventory and policy options (`A`, `B`, `C`) for `@bo`'s decision.


## [2026-11-11] @dev / @arch / @qa / @ops / @prod — Brand v3.1.0 Completion, Image Dimension Sync, Social Cards, Before/After Review Artifact & Alcohol Photo Discussion
- **Context:** Resuming Phase 12 execution. All 21 web-sized non-generatively enhanced images (`73.59 MB -> 4.95 MB`, `-93.3%`) and Before/After comparison plates are generated in `src/frontend/public/images/{history,gallery}/`, git-ignored `src/frontend/photo_review/`, and the conversation artifact directory. 13 frontend files are already updated to Brand `v3.1.0`.
- **Execution Steps:**
  1. Complete `font-mono` / `var(--font-ibm-mono)` removal and synchronize exact intrinsic `width`/`height` dimensions across the remaining 11 unlocked `.tsx` files (`page.tsx`, `about/page.tsx`, `history/page.tsx`, `AccommodationsClient.tsx`, `CallForPapersClient.tsx`, `CorporateSponsorshipClient.tsx`, `PortalOverviewClient.tsx`, `StudentAwardsClient.tsx`, `(portal)/admin/analytics/page.tsx`, `(portal)/board/page.tsx`, `(portal)/reviewer/page.tsx`).
  2. Regenerate `1200x630` `opengraph-image.png` and `twitter-image.png` using `Georgia` + `Segoe UI` (retiring `Consolas` monospace labels).
  3. Author user-facing review artifact `photo_enhancements_review.md` embedding side-by-side Before/After carousels and exact byte/dimension metrics.
  4. Update `docs/implementation_plan.md` (Phase 12 `[COMPLETED]`) and `docs/session_history.md` (Section 13 Addendum), verify `0` `font-mono` in unlocked components and `0` diff in `src/frontend/src/app/archive/**`, run full Next.js static export (`40/40` pages), commit locally on `main`, and restart `npm --prefix src/frontend run dev`.
  5. Open structured `@prod` / `@brand` / `@legal` discussion with `@bo` covering the 7 photographs containing visible alcohol and presenting Options A (Recommended targeted cleanup), B (Full sitewide alcohol-free pass), and C (Retain evening reception photos as-is).


## [2026-11-11] Phase 13 Addendum — Option A Alcohol Photo Curation & Non-Generative Crop/Enhancement Pass (@prod, @arch, @dev, @qa)
- **Directive (`@bo`)**: Keep the Brand `v3.1.0` Dual-Font and web-sized photo quality upgrades. Execute Option A alcohol policy: strictly zero alcohol on the Front (`/`), Student (`/student-awards`), and Corporate Sponsorship (`/corporate-sponsorship`) pages; crop out or replace prominent bottles/foreground glasses elsewhere; preserve subtle alcohol ambiance strictly at evening meals and poster sessions on inner pages. Maintain provenance-first captions (describe unseen time/location/event context, never obvious visual content) and 100% non-generative image enhancement (`Pillow`/`NumPy`/`SciPy` only) with Before/After review plates.
- **Audit & Curation Mapping**:
  1. `/student-awards` (`StudentAwardsClient.tsx`): Replace `banquet-awards-applause-2019.jpg` (foreground beer bottle + ale can) with `student-award-certificate-2015.jpg` (`Older Pics/10thHEMS_52.JPG`, 2015 Student Travel Award recipient Andrew Hampton of UNC-Chapel Hill holding his official certificate alongside Student Awards Committee Chair Torben Gentz of AWI — 100% alcohol-free).
  2. `/corporate-sponsorship` (`CorporateSponsorshipClient.tsx`): Replace `sponsor-exhibit-smiles-2015.jpg` (beer bottle on Edwards booth table) with `sponsor-exhibit-roundtable-2017.jpg` (`Older Pics/GPK_4559.JPG`, smiling attendees in Hawaiian shirt and INFICON polo seated before IPI InProcess Instruments and PerkinElmer Torion T-9 GC/MS booths at the 11th HEMS Workshop in Oxnard, CA — 100% alcohol-free).
  3. `/` Front Page (`src/frontend/src/app/page.tsx`): Keep `single-track-auditorium-smiles-2015.jpg` (verified 11:57 AM auditorium session, bottled water only); replace `don-cesar-terrace-smiles-2013.jpg` with `mandalay-beach-corridor-smiles-2017.jpg` (`Older Pics/GPK_4424.JPG`, Tim Short in Hawaiian shirt laughing with colleague in Oxnard, CA — 100% alcohol-free); move `poster-session-smiles-oxnard-2017.jpg` off `/` to `/call-for-papers` and place `virginia-beach-staircase-smiles-2025.jpg` (`FromGottfried/2025/PXL_20250917_222521232.jpg`, multi-generational smiles on the Sheraton Virginia Beach atrium staircase — 100% alcohol-free) as Card 3.
  4. Inner-Page Subtle Evening Meals & Poster Session:
     - `/about`: Keep `don-cesar-hawaiian-smiles-2013.jpg` (subtle evening Workshop Dinner award presentation on The Don CeSar terrace).
     - `/history` Fig. 02 (`st-pete-beach-don-cesar-2013.jpg`, re-cut from full `4928x3264` `Older Pics/HEMS2013_55.JPG`): Crop `x = 0.210..0.966` to eliminate both the chest-high brown beer bottle on the far left and the plastic cup on the far right while preserving 12 smiling attendees and two subtle wine glasses on the white Workshop Dinner tablecloth.
     - `/layout-portal` (`golden-hour-harbor-reception-2015.jpg`, `Older Pics/10thHEMS_48.JPG`): Crop `y = 0.03..0.82` to eliminate the blurry foreground photobombing red wine glass at bottom-center while retaining subtle evening reception glasses in hand overlooking Baltimore's Inner Harbor.
     - `/call-for-papers` (`CallForPapersClient.tsx`): Showcase `poster-session-smiles-oxnard-2017.jpg` (`Older Pics/GPK_4550.JPG`) in the Presentation Formats / Poster Session spotlight, preserving subtle cocktail-table glassware during an evening poster session.
- **Lock Verification**: Zero modifications to `/source-material`, `docs/source-documents/pics/`, `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, or `tools/manager/**`.


## [2026-11-11T16:20:30-07:00] @prod, @arch, @dev, @qa, @ops — Option A Alcohol Curation Execution & Margin Verification
- **Visual QA Findings:** Inspected all 6 new/updated Before/After comparison plates from `optimize_and_enhance_photos.py`. Refined left crop boundary on `st-pete-beach-don-cesar-2013.jpg` (`x0 = 0.195`) so Ben Gardner's head/ear has clean margin while 100% of the left held beer bottle and right plastic cup remain excluded; refined right crop boundary on `virginia-beach-staircase-smiles-2025.jpg` (`x1 = 0.966`) to exclude the partial edge face while preserving Jason Amsden's full sleeve.
- **Payload Verification:** Total across all 22 active site images is `79.27 MB` (`81,168.3 KB`) -> `5.02 MB` (`5,137.1 KB`, `-93.7%`), 100% classical `Pillow` + `NumPy` + `SciPy` processing with zero generative AI.
- **Policy Enforcement:**
  - `/`, `/student-awards`, `/corporate-sponsorship`: 100% zero alcohol (`single-track-auditorium-smiles-2015.jpg`, `mandalay-beach-corridor-smiles-2017.jpg`, `virginia-beach-staircase-smiles-2025.jpg`, `student-award-certificate-2015.jpg`, `sponsor-exhibit-roundtable-2017.jpg`).
  - `/about`, `/history`, `/layout-portal`, `/call-for-papers`: Subtle alcohol only at evening Workshop Dinners and Poster Session, with foreground/prominent bottles and photobombing glassware cropped out.
- **CSS Container Safety:** Set standalone figures on `/student-awards`, `/corporate-sponsorship`, `/history` (`Fig. 02`), `/layout-portal`, and `/call-for-papers` to `w-full h-auto block` with exact intrinsic `width`/`height` (`CLS = 0`, `0` CSS edge clipping), and `aspect-[16/10] object-cover` on the 3-card `/` grid.


## [2026-11-11T16:38:05-07:00] @ops — Firebase Preview Channel `preview-2027` Deployment
- `@bo` completed `firebase login --reauth`.
- Verifying `src/frontend/out` contains the latest Option A + Brand `v3.1.0` + web-optimized (`5.02 MB`) static export and deploying to Firebase Hosting preview channel `preview-2027` (`--expires 30d --project hems-workshop`).


## [2026-11-11T16:56:45-07:00] @prod — Front Page (`src/frontend/src/app/page.tsx`) Content Value Audit
- Audited all 5 sections (`737` lines) of `/` against actual visitor intent (prospective/returning HEMS investigators, graduate students, corporate sponsors):
  1. **Duplicate Research Sections (Lowest-Value Bloat):** Section 3 (`01 — Technical Charter: Core Domains`, 3 cards + 9 unclickable tag pills) and Section 5 Left (`03 — Recent Highlights from the Proceedings`, 3 category blurb cards with zero direct paper links) repeat the exact same three HEMS research themes twice on the same page.
  2. **Hero Clutter & Synthetic Spectrum:** Left column stacks a redundant society eyebrow, duplicate `16th Biennial Workshop` badge, lead paragraph, AND an unattributed filler pull-quote repeating the lead paragraph; right column places a synthetic decorative SVG stick-plot mass spectrum (`EI 70 eV`, `10⁻⁶ Torr`) above the high-value `16th HEMS Workshop (2027)` dossier.
  3. **Verbose Chrome & Secondary Cards:** Numbered `01 — / 02 — / 03 —` kickers, `01 / DOMAIN` labels, multi-line blurbs under the `1999 / 15 / 1,590 / 52` stat strip, and lengthy prose in the `Student Travel Awards` and `501(c)(3)` cards inflate scroll depth without adding new information beyond the dedicated subpages.
- Consulting `@bo` via `ask_question` to confirm Hero visual preference and below-the-fold cuts before `@arch` updates the blueprint and `@dev` implements.


## [2026-11-11T17:06:15-07:00] @arch, @dev, @qa, @ops — Front Page Low-Value Content Reduction (Mobile Hero + Stats Strip Removal)
- **@bo Direction Confirmed:**
  1. **Hero (`A1`):** Apply Option 1 specifically to the cell phone version (`< md` / `< 768px`) — hide the synthetic SVG mass spectrum (`EI 70 eV` header + plot), unattributed `<blockquote>` pull-quote, redundant society eyebrow, duplicate `<UpcomingHeroBadge />` pill, and tertiary `Society History` button on mobile so cell phone visitors immediately see the concise mission + primary Archive/2027 CTAs + crisp `16th HEMS Workshop (2027)` card, while preserving the full two-column split hero on `md:`+ tablet/desktop viewports.
  2. **Stats Strip (`A2`):** Remove the 4-box `IMPACT_METRICS` (`1999 / 15 / 1,590 / 52`) section from `src/frontend/src/app/page.tsx`, eliminating redundant vanity counters and multi-line sub-paragraphs while leaving `Core Domains`, `The Symposium Spirit`, and `Recent Highlights / Institutional Pathways` intact.
- **Component Polish:** Update `UpcomingWorkshopSpotlight.tsx` top divider to `md:pt-4 md:border-t md:border-slate-100` so no orphan top hairline appears when the SVG spectrum above it is hidden on `< md` cell phones.


## [2026-11-11T17:31:30-07:00] @prod, @brand, @arch, @dev, @qa, @ops — Mainpage Society Title Sizing & Site-Wide HEMS Logo Prominence
- **Root-Cause Audit:**
  1. On `/`, `'Harsh-Environment Mass Spectrometry Society'` was previously rendered at `11px` muted gray (`text-slate-500`) and hidden below `md`, while `/hemslogo.jpg` appeared `0` times on `/`!
  2. `/hemslogo.jpg` is a `3756×2594` (`~3:2` landscape) scientific illustration (Earth ocean map + 5 orbiting mass analyzers + spacecraft). Cramming it into `w-9 h-9` (`36×36px` square = `28×19px` inner image) in `Navbar.tsx` and `Footer.tsx`, or omitting it from `/`, `/contact`, `(portal)/layout.tsx`, `/call-for-papers`, `/registration`, `/accommodations`, and `/formatting-guidelines`, made the Society's official emblem nearly invisible or absent across key routes.
- **Architectural & Brand Plan:**
  1. Enlarge `'Harsh-Environment Mass Spectrometry Society'` on `/` to `font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-primary tracking-tight leading-snug` across ALL viewports (mobile + desktop), paired directly with a prominent `w-24 sm:w-32 lg:w-36` (`96px–144px` wide) `3:2` `/hemslogo.jpg` emblem frame in the Hero, plus a `w-20` `/hemslogo.jpg` seal in the bottom 501(c)(3) Society card (`<UpcomingHeroBadge />` remains `hidden md:block` on mobile).
  2. Upgrade `Navbar.tsx` (`w-14 h-10 sm:w-[70px] sm:h-12` inside `h-16 sm:h-[72px]`) and `Footer.tsx` (`w-24 sm:w-28`) to proper `3:2` landscape proportions, and roll out prominent `3:2` HEMS Emblem headers (`96px–128px` wide) across `/about`, `/history`, `/contact`, `/student-awards`, `/corporate-sponsorship`, `/archive`, `(portal)/layout.tsx`, `/layout-portal`, `/call-for-papers`, `/registration`, `/accommodations`, and `/formatting-guidelines` (`0` edits to `src/frontend/src/app/archive/[year]/**`).

---
### [2026-11-11T21:34:15-07:00] @prod -> @arch -> @dev -> @qa -> @ops — Registration Page Academic Language & Closed-Window Content Reduction
- **Directive (`@bo`):** Update `/registration` (`RegistrationClient.tsx` and `(portal)/registration/page.tsx`), fine-tune language for an academic scientific meeting, and drastically reduce content since registration is not currently open (`workshop.registration_open === false`).
- **Audit Findings:**
  1. `RegistrationClient.tsx` (`313` lines) previously rendered commercial conference/ticketing jargon (`"Workshop Access"` with `<CreditCard>`, `"Student Pass"`, `"Professional Pass"` with a floating `"STANDARD"` pill, `"Sponsor Pass"`, `"Discounted access pass"`, `"Full technical access"`, `"Online ticketing and attendee badge registration"`).
  2. Worse, even when `workshop.registration_open === false`, it displayed 3 pricing cards (`$250 / $500 / $1,350`), a 3-item vertical timeline of `"TBA"` dates, a `$50` cancellation fee policy for `August 2027 (TBA)`, a corporate split-billing box, and a redundant `"Registration Window"` card.
- **Architectural & Editorial Solution:**
  1. **Closed State (`!workshop.registration_open` — active default):** Render only the clean academic header (`Symposium Registration`, `Calendar` eyebrow, HEMS Society Emblem) and a single concise, dignified status card stating that registration for the `{workshop.workshop_ordinal}` HEMS Workshop (`{workshop.target_window}`) is not yet open, noting that dates and fee schedules (including reduced student rates) will be posted once the host venue and program schedule are finalized, and reminding prospective participants that HEMS requires no society membership or membership fee—followed by quiet links to `/contact`, `/student-awards`, and `/corporate-sponsorship`.
  2. **Live Open State (`workshop.registration_open === true` via Google Sheet sync):** Preserve Google Sheet turn-key activation using scholarly terminology (*Regular Registration*, *Student Registration*, *Corporate Sponsor Registration*, *Important Dates*, *Cancellations & Transfers*) with zero SaaS ticketing language.
  3. **Metadata (`(portal)/registration/page.tsx`):** Align `PAGE_DESCRIPTION` with concise academic meeting phrasing.

---
### [2026-11-11T22:03:15-07:00] @prod (with @legal / @brand input) — Review & Brainstorm for `/accommodations` (`AccommodationsClient.tsx`)
- **Rule #9 Trigger (`scrumrules.md`):** `@bo` asked `@prod` to *"reveiw the accomadatoins page, it's mostly fine, Maybe some stock photos of these locations instead of the the heppens-to-be-rainy photos you've found in the pics I provided."* Because `@bo` requested a review and used speculative phrasing (*"Maybe some stock photos..."*), treat strictly as a review + brainstorm analyzing pros and cons without modifying `src/` code yet.
- **Visual & Content Audit of `AccommodationsClient.tsx`:**
  1. **The Two Current Photos (`virginia-beach-boardwalk-2025.jpg` & `myrtle-beach-pier-surf.jpg`):** Both were taken on overcast/rainy days (`Sept 18, 2025` in Virginia Beach shows wet pavement, heavy grey storm clouds, and a green portable restroom in the foreground; `Sept 16, 2019` in Myrtle Beach shows heavy grey clouds and dark grey-green water). They undersell HEMS's signature sunny coastal venue tradition.
  2. **Content / Copy Review (while `venue_confirmed === false`):** Overall structure is clean, though like `/registration` before our trim, there is minor repetition of `"TBA"` across `Official Workshop Venue`, `HEMS Group Room Block` (`TBA` + `September 2027 (Dates TBA)`), `Key Dates` sidebar (`September 2027 (Exact Dates TBA)` + `September 2027 (Dates TBA)`), `Room Block Cutoff` (`Summer 2027 (TBA)`), and `Room Block Status` (`Room Block TBA`)—5 separate boxes saying `TBA`! We should note this briefly in our review in case `@bo` also wants a light tightening, while noting the page is otherwise solid.
  3. **Photo Options & Pros/Cons Analysis:**
     - **Option 1 (Recommended): Curated Open-License (`CC0` / Public Domain / `CC BY-SA` Wikimedia Commons or Unsplash) Sunny Real Photography of Actual HEMS Host Destinations** — e.g., sunny **Virginia Beach Oceanfront & Boardwalk** (15th Workshop, 2025) paired with iconic sunny **The Don CeSar ("Pink Palace") on St. Pete Beach, FL** (8th & 9th Workshops, 2011 & 2013) or sunny **Myrtle Beach / Cocoa Beach**.
       - *Pros:* Bright blue skies, turquoise/blue water, zero rain/portable-toilets, depicts the *exact* real coastal landmarks HEMS actually uses, `100%` legally clear (`@legal`: CC0/Unsplash/Wikimedia Commons with proper attribution in caption or license metadata; zero Getty/hotel-brochure copyright risk, zero AI-generated imagery).
       - *Cons:* Not shot by an attendee's phone during the meeting (so captions shift from *"taken Thursday morning after session"* to clean venue provenance like *"Virginia Beach Oceanfront, VA — Host city of the 15th HEMS Workshop (2025)"* and *"The Don CeSar, St. Pete Beach, FL — Host venue of the 8th & 9th HEMS Workshops (2011, 2013)"*).
     - **Option 2: Clear-Sky Shots Already in `@bo`'s Archive (`docs/source-documents/pics/`):**
       - Our scan found clear-sky morning shots from `2019 Myrtle Beach` (`IMG_20190919_071405.jpg` — golden-hour sunrise sunlight illuminating the Kingston Plantation oceanfront towers on the beach; `IMG_20190919_063912.jpg` — crisp blue-hour/dawn ocean tide pools) and `2015 Baltimore Inner Harbor` (`10thHEMS_40.JPG` — sunny blue sky over the harbor & boats).
       - *Pros:* `100%` first-party HEMS attendee photography.
       - *Cons:* `IMG_20190919_071405.jpg` has warm 7:14 AM low-angle sun (long photographer shadow on dark wet sand rather than bright midday turquoise beach), `10thHEMS_40.JPG` is urban harbor rather than beachfront resort, and there are zero sunny exterior shots of Virginia Beach in the 2025 folder.
     - **Option 3: Hybrid (1 Sunny Stock Photo + 1 Clear-Sky HEMS Archive Shot).**
- **Action:** Present a concise `@prod` review of [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx) + pros/cons of replacing the two overcast photos with sunny open-license destination photos, and ask `@bo` for the green light (and preferred venue pair) before `@dev` writes code.

---
### [2026-11-12T06:47:10-07:00] @prod -> @arch -> @legal -> @dev -> @qa -> @ops — Accommodations Sunny Stock Photos (Virginia Beach & Don CeSar) + Light TBA Consolidation
- **Directive (`@bo`):** *"ightly consolidate the TBA, use free-stock photos for Virginia Beach, VA + St. Pete Beach / Don CeSar, FL"*
- **Safety Check on Existing Files:** `myrtle-beach-pier-surf.jpg` is referenced on `/history` (`src/frontend/src/app/history/page.tsx`), so `src/frontend/public/images/history/myrtle-beach-pier-surf.jpg` MUST remain untouched. `virginia-beach-boardwalk-2025.jpg` is referenced nowhere else and can be cleanly replaced by two web-optimized (`1600px` wide, `< 300 KB` each, `CLS = 0` explicit `width`/`height`) sunny free-licensed photographs in `src/frontend/public/images/gallery/`:
  1. `virginia-beach-oceanfront-sunny.jpg` — Sunny Virginia Beach, VA oceanfront & boardwalk (host city of the 15th HEMS Workshop, Sept 2025).
  2. `st-pete-beach-don-cesar-sunny.jpg` — Sunny St. Pete Beach & The Don CeSar ("Pink Palace"), FL (host venue of the 8th & 9th HEMS Workshops, 2011 & 2013).
- **Licensing Hygiene (`@legal`):** Verify exact Creative Commons / Public Domain license + photographer attribution from Wikimedia Commons `extmetadata` and include clean attribution in each `<figcaption>` (e.g., `Photo: [Author], CC BY-SA ...` or `Public Domain`) so copyright/license terms are 100% honored.
- **Light TBA Consolidation (`AccommodationsClient.tsx`):**
  - Keep the substantive content intact (`Official Workshop Venue`, `HEMS Group Room Block` with the `$124/night` 2025 reference rate, and `General Lodging Notes` with the All-Under-One-Roof format).
  - Replace the `<DollarSign>` icon on `HEMS Group Room Block` with `<Hotel>` / `<BedDouble>` for scholarly polish, and when `!workshop.venue_confirmed`:
    - Instead of repeating `"TBA"` across 5 separate boxes (`Address box` + `Group Rate` + `Availability Window` + `Key Dates` sidebar + `Room Block Cutoff` sidebar + `Room Block TBA` button), consolidate the right sidebar into **one clean `Schedule & Room Block Status` card** (showing `Target Window: September 2027`, noting that room-block dates and reservation links will open once the host hotel is announced, with a quiet link to `/contact`) and condense the `HEMS Group Room Block` unconfirmed state into a clean prose summary citing the `$124/night` 2025 benchmark without two giant `"TBA"` / `"Dates TBA"` boxes!
    - Preserve 100% of the live Google Sheet bindings (`workshop.venue_confirmed`, `workshop.hotel_name`, `workshop.hotel_address`, `workshop.hotel_maps_url`, `workshop.hotel_group_rate`, `workshop.hotel_discount_window`, `workshop.hotel_booking_cutoff`, `workshop.hotel_booking_url`) so when `venue_confirmed` flips to `true`, the full booking rate cards, cutoff date, and `Book Hotel Room` button render automatically.

---
### [2026-11-12T07:10:30-07:00] @prod & @ops (with @arch & @legal) — Implementation Advice: Replacing Mailchimp with High-Deliverability Google/Firebase Mailing Architecture
- **Context & Rule #9 (`scrumrules.md`):** `@bo` asked `@prod` and `@ops` for implementation advice on migrating off Mailchimp, improving bulk send deliverability (minimizing spam flags and maximizing URL trust), moving the domain and stack into the Google-centric architecture, and adding ~2 signed-in Board Member email-interface pages. Strictly advisory/brainstorm response — zero `src/` or `functions/` edits.
- **Codebase Alignment Audit:**
  - `firebase.json` & `functions/src/index.ts` already run **Firebase Hosting** (`src/frontend/out`) + **Cloud Firestore** (`firestore.rules` already defines `board` and `admin` roles!) + **Cloud Functions v2 on Node 22**.
  - `ContactClient.tsx` currently uses a `mailto:` link (`Prepare Email Inquiry`) and `RegistrationClient.tsx` has a hook for mailing list signups.
  - `(portal)/board/page.tsx` already enforces `user.roles?.includes("board") || user.roles?.includes("admin")`.
- **Core Deliverability Findings (`@ops`):**
  1. Mailchimp hurts `.gov` (NASA, NRL, DOE national labs) and `.edu` inbox placement primarily because of shared marketing IPs, click-tracking link rewriting (`list-manage.com` mismatching `hems-workshop.org`), `1x1` spy pixels, heavy HTML tables, and stale biennial `.edu` bounces.
  2. **Crucial Warning:** While HEMS (as a 2008 501(c)(3)) qualifies for free **Google Workspace for Nonprofits** (`@hems-workshop.org` human mailboxes) and should host DNS on **Google Cloud DNS** + website on **Firebase Hosting**, bulk workshop blasts MUST NOT be sent directly out of an officer's Gmail SMTP / Google Group—doing so risks 24-hour mailbox lockouts, lacks bounce/complaint suppression webhooks, and lacks `RFC 8058` one-click unsubscribe headers.
  3. **Optimal Google-Centric Hybrid:** Keep 100% of DNS, Hosting, Auth, Subscriber DB (Firestore), Unsubscribe UI, and Board Composer UI inside Google Cloud / Firebase, and wire a single Firebase Cloud Function v2 to a high-trust SMTP/API relay (**Amazon SES** at ~$0.10/1,000 emails with $0/mo idle cost for biennial cadence, **Resend**, or **Postmark Broadcast**) authenticated on `mail.hems-workshop.org` with **click-tracking and open-pixels turned OFF** so every URL in the email is a direct `https://hems-workshop.org/...` link.
- **Proposed UI Surface (`@prod`):**
  - Public: Embedded Double Opt-In signup widget (`/contact`, Footer, `/registration`) + token-signed 1-click `/unsubscribe` & email-update page.
  - Signed-In Board/Admin (`/board/subscribers` & `/board/campaigns`): Mailchimp CSV importer (preserving unsubscribes/bounces!), subscriber search/hygiene table, and a clean academic announcement composer with mandatory test-send + audit log.

---
### [2026-11-12T07:20:30-07:00] @ops, @arch, @prod — Postmark Mailing List & Board Interface Blueprint + Lock Check
- **Decision (`@bo`):**
  1. Selected **Postmark** (`outbound` Transactional stream + `broadcast` Broadcast stream, with click-tracking & open-tracking disabled for 100% direct `https://hems-workshop.org/...` URL trust).
  2. Approved building the Firestore schema, Cloud Functions backend, Public Signup / Unsubscribe UI, and two signed-in Board Member pages (`/board/mailing-list` & `/board/announcements` with Mailchimp CSV import & sandbox preview) now, ahead of live DNS cutover.
- **Lock Check (`locksrules.md` Rule #3 & Rule #6):**
  - `src/frontend/src/**` (`@dev`), `infrastructure/**` (`@ops`), and `docs/**` (`@arch`) are within standard agent write boundaries.
  - Modifying root `firestore.rules`, root `firebase.json`, and `functions/src/index.ts` crosses strict directory boundaries (`locksrules.md` Rule #3: `@dev` = `src/` only, `@ops` = `.env`, `Dockerfile`, `infrastructure/`).
  - Per `locksrules.md` Rule #6 (`ESCAPE HATCH`), publish `@arch`'s permanent plan (`docs/plans/2026-11-12-postmark-mailing-list-architecture.md`) first, halt before modifying locked paths, and output the exact `SYSTEM LOCK ENCOUNTERED` request for `firestore.rules`, `firebase.json`, and `functions/src/index.ts`.

---
### [2026-11-12T07:49:00-07:00] @ops -> @dev -> @qa — Executing Postmark Mailing List, Cloud Functions v2, Public Signup/Unsubscribe & Two Board Interfaces
- **Lock Override Confirmed (`@bo`):** Explicit `"yes, go"` received for `firestore.rules`, `firebase.json`, and `functions/src/index.ts`.
- **Implementation Sequence:**
  1. `@ops`: Update `firestore.rules` (`mailing_subscribers`, `mailing_campaigns`, `mailing_public_requests`), `firebase.json` (`/api/mailing/*` Hosting rewrites before `404.html`), `functions/src/mailing.ts` + `functions/src/index.ts` (Postmark Transactional & Broadcast streams with `TrackOpens: false`, `TrackLinks: "None"`, `RFC 8058` `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, Double Opt-In, and hard-bounce/spam-complaint webhook suppression), plus `infrastructure/postmark-dns-cutover.md` & `infrastructure/.env.postmark.example`.
  2. `@dev`: Create strict TypeScript models (`src/frontend/src/types/mailing.ts`), academic letterhead + URL-trust deliverability auditor + RFC-4180 Mailchimp CSV parser (`src/frontend/src/utils/mailingTemplate.ts`), custom hook (`src/frontend/src/hooks/useMailingAdmin.ts`), public signup card (`MailingListSignupCard.tsx` wired into `/contact`, `/registration`, and `Footer.tsx`), `/unsubscribe` route (`noindex`), and the two signed-in Board Member routes (`/board/mailing-list` & `/board/announcements` wired into `(portal)/layout.tsx` and `/board`).
  3. `@qa` & `@ops`: Build `functions` (`npm --prefix functions run build`) AND `src/frontend` (`npm --prefix src/frontend run build`), commit on `main`, deploy Hosting preview to `preview-2027`, and restart local `next dev`.

## [2026-11-12] Phase 18 Execution Continuation — Frontend Entry Wiring, Build & Preview Deploy (@dev, @arch, @qa, @ops)
- **@dev**: Wiring `<MailingListSignupCard />` (`id="mailing-list"`) onto `/contact` (`ContactClient.tsx`), adding `/contact#mailing-list` CTA to `RegistrationClient.tsx` and `Footer.tsx` (plus `/unsubscribe` in footer utility bar), disallowing `/unsubscribe/` in `robots.ts`, and wiring `/board/mailing-list` + `/board/announcements` into `(portal)/layout.tsx` (`requiredRole: "board"`) and `(portal)/board/page.tsx`.
- **@arch**: Recording Phase 18 in `docs/implementation_plan.md` and Section 19 in `docs/session_history.md` linking `docs/plans/2026-11-12-postmark-mailing-list-architecture.md`.
- **@qa & @ops**: Stopping background `next dev`, running `npm --prefix src/frontend run build` and `npm --prefix functions run build`, verifying zero archive/source-material mutations, committing to `main`, deploying `firestore:rules` and Hosting channel `preview-2027`, and restarting `next dev`.

## [2026-11-12] @ops Operations & Architecture Q&A — Mailing List Storage, Hygiene Environments & Postmark Connection
- **@ops**: Verified `src/frontend/src/utils/firebase.ts` and `src/frontend/.env.local` key names. Because `NEXT_PUBLIC_FIREBASE_API_KEY` is present in `src/frontend/.env.local` AND `isLiveDomain` matches `*.web.app`, BOTH `http://localhost:3000` and `https://hems-workshop--preview-2027-v4fnxb3i.web.app` read/write directly to the same live Google Cloud Firestore database (`projectId: hems-workshop`) once authenticated with a `board` or `admin` role—meaning `@bo` can perform real Mailchimp CSV import and subscriber hygiene right now on either `localhost:3000` or `preview-2027` and those cleaned records persist permanently in Google Cloud! Explained exact storage collections, Postmark API/Webhook/DNS wiring (not yet live-sending until `@bo` creates a Postmark account + API token), and why only `@bo` needs a Postmark owner login while other Board Members never need a Postmark login.

## [2026-11-12] Phase 19 — Mailing Architecture Info Dialog & Custom Sublists / Tags (@prod, @ops, @arch, @dev)
- **@prod & @ops**: Designing an in-app `MailingSystemInfoModal` on `/board/mailing-list` documenting Firestore storage (`hems-workshop` shared live across `localhost:3000` and `preview-2027`), end-to-end Postmark deliverability (`TrackOpens: false`, `TrackLinks: "None"`, `RFC 8058`, bounce/spam webhooks), Postmark account policy (1 Society owner login; zero Board logins needed; currently in safe sandbox pre-cutover), and Sublist/Tag workflows.
- **@arch & @dev**: Extending `MailingSubscriber` non-destructively with `sublists: string[]` (preserving all lists `@bo` already uploaded to live Firestore!), persisting the Board Sublist Catalog in `mailing_subscribers/_meta_sublists` (already authorized under deployed `firestore.rules`), mirroring `sublist:<Name>` tokens in Firestore `interests` for seamless `functions/src/mailing.ts` compatibility, and adding:
  1. Sublist & Cohort Filter Bar (`All Subscribers`, `All Active Subscribed`, custom sublists like `Board Members`, `2025 Attendees`, `2025 Presenters`, `2025 Corporate Sponsors` + starter presets & custom creator),
  2. Multi-select checkboxes + Bulk Tag Add/Remove action bar for tagging already-imported subscribers rapidly,
  3. Inline per-row `+ Tag` / `×` tag chips, CSV import tag assignment (`importTag`), lossless CSV export of `Sublists`, and
  4. Sublist targeting in `/board/announcements` (`Recipient Segment / Sublist` selector).

## [2026-11-12] @ops Pre-Cutover Timing Advice — What to Do in Postmark Now vs. During Domain Port
- **@ops**: Advising `@bo` NOT to touch DNS (`DKIM`/`Return-Path`) on the outgoing registrar or wire live Cloud Function tokens today since `hems-workshop.org` ports to Google/Firebase in 1–2 days (avoiding duplicate DNS work). However, recommending two 5-minute zero-DNS actions inside Postmark today that clear human review queues ahead of cutover: (1) submitting Postmark's Account + Broadcast Stream human approval questionnaire (saves 1–2 business days at launch) and (2) emailing Postmark Support with HEMS's 501(c)(3) status for the nonprofit discount, plus optionally creating the `HEMS Society Production` server & staging `hems-workshop.org` unverified so its DKIM/Return-Path strings are ready to paste into Google Cloud DNS in one pass.

## [2026-11-12] Phase 20 — Mailing List Column Sorting & Date Added Column (@ops, @arch, @dev, @qa)
- **@arch & @ops**: Adding `Date Added` (`createdAt`) display and CSV round-trip support (`Date Added`, Mailchimp `OPTIN_TIME` / `CONFIRM_TIME` parsing in `mailingTemplate.ts` + earliest-timestamp preservation in `useMailingAdmin.ts`) so both newly added addresses and Mailchimp historical opt-in timestamps are preserved accurately in `mailing_subscribers`.
- **@dev**: Adding interactive multi-column sorting (`Subscriber`, `Institution`, `Sublists & Topics`, `Status`, and `Date Added`) with directional indicators (`ArrowUp`, `ArrowDown`, `ArrowUpDown`), `aria-sort` accessibility attributes, empty-value-last tie-breaking, and `tabular-nums` ISO date formatting (`YYYY-MM-DD`) in `src/frontend/src/app/(portal)/board/mailing-list/page.tsx`.

## [2026-11-12] @ops Advisory Analysis — Postmark Open Tracking vs. Link Tracking Trade-Offs
- **@ops**: Reviewed `@bo`'s uploaded screenshot of Postmark's Server-level `Tracking` settings (`Open tracking: Disabled`, `Link tracking: Disabled`). Prepared an objective engineering comparison separating Open Tracking (`1x1` pixel) from Link Tracking (`click.pstmrk.it` URL rewrite), highlighting why Link Tracking poses the highest risk to `.gov`/`.mil`/national-lab URL trust, why Open Tracking triggers Outlook "blocked sender tracking image" banners and ~50% bot/Apple MPP distortion, what Postmark ALREADY tracks without either toggle (Delivered, Bounces, Spam Complaints), and how first-party website analytics on `hems-workshop.org` captures click engagement with zero deliverability penalty. Also noted that `functions/src/mailing.ts` explicitly sets `TrackOpens: false` and `TrackLinks: "None"` per API call so `@bo` can choose either policy cleanly.

## [2026-11-12] Phase 21 — Site-Wide Official `@hems-workshop.org` Contact Channels (@prod, @ops, @arch, @dev)
- **@ops**: Confirmed Open Tracking and Link Tracking remain strictly OFF (`TrackOpens: false`, `TrackLinks: "None"`). Updating `infrastructure/.env.postmark.example` (`POSTMARK_REPLY_TO=president@hems-workshop.org`) and `infrastructure/postmark-dns-cutover.md` with the official Google Workspace mailboxes (`president@hems-workshop.org`, `webmaster@hems-workshop.org`, `tim.short@hems-workshop.org`, `hemsworkshop@hems-workshop.org`).
- **@prod & @dev**: Updating all public and portal contact channels across `ContactClient.tsx` (Direct Channels + Topic router for `president@hems-workshop.org`, `tim.short@hems-workshop.org`, and `webmaster@hems-workshop.org`), `upcoming_workshop.json` + `upcomingWorkshop.ts` (upgrading `sponsor_coordinator_email` from `rtshort00@gmail.com` to `tim.short@hems-workshop.org`, including runtime CSV normalization), `seo.ts` JSON-LD `contactPoint` graph, `Footer.tsx`, `auth/page.tsx`, and `UnsubscribeClient.tsx`.

## [2026-11-12T09:53:30-07:00] @ops & @arch — SCoT: First-Party Website & Email Campaign Analytics Without Compromising Trust
- **Context:** `@bo` asked `@ops` how to make `/admin/analytics` much more extensive (which pages are visited, when, by whom, etc.) given that Postmark open/link tracking are OFF, specifically asking: (1) how a "first-party query tag" works, (2) whether temporary redirect webpages can be used for specific emails, and (3) how to monitor deeply while keeping `.gov`/`.edu` URL & email trust maximized.
- **Codebase Inspection:** `src/frontend/src/app/(portal)/admin/analytics/page.tsx` currently only queries Firestore `users` (`loginCount`, `downloadCount`, `lastLogin`) and `downloads` (`fileName`, `downloadCount`, `lastDownloaded`, `category`, `workshopName`). `src/frontend/src/utils/firebase.ts` does not load third-party GA4 (`googletagmanager.com`), which is actually an advantage against ad-blockers if we build a clean first-party telemetry pipeline.
- **Architectural & Deliverability Analysis:**
  1. **First-Party Query Tags (`?src=2027-cfp`):** Direct canonical URLs on `hems-workshop.org` return `200 OK` immediately at the Firebase CDN edge (zero HTTP `301/302` redirects, zero domain mismatch). Client-side JS logs the visit after hydration (naturally filtering out non-JS Proofpoint/Defender pre-fetch bots!) and strips `?src=` via `history.replaceState` so copied URLs stay clean. `/board/announcements` can auto-tag outbound `hems-workshop.org` links per campaign/sublist.
  2. **Temporary Redirect Pages (`/go/...`):** Third-party shorteners kill trust; even first-party `301/302` redirects can draw mild scrutiny in bulk mail and—worse—if "temporary" pages are later deleted, archived emails in scientists' inboxes break (`404`). Therefore: prefer `?src=` query tags for email links (`200 OK`, never breaks), and optionally support permanent first-party vanity routes (`/go/cfp27`) for slides/QR codes/plain-text using a permanent Firestore slug map (`200 OK` instant client/rewrite routing, never deleted).
  3. **"By Whom" & Privacy/Trust Boundary:**
     - *Anonymous visitors:* Track page path, timestamp, session flow, referrer, campaign `?src=`, device class, and coarse geo (via Cloud Function AppEngine country/region headers, never storing raw IPs or third-party cookies).
     - *Signed-in members/downloaders:* Link page & PDF download events to authenticated `uid`/`email` (already consented via HEMS portal login).
     - *Individual recipient hashes (`?u=...`) in bulk email:* Explicitly advise AGAINST per-person tracking tokens in emails (breaks when scientists forward emails to colleagues and erodes trust if noticed); cohort/sublist tags (`?src=std27-sponsors`) provide actionable attribution with zero surveillance risk.
- **Action:** Advisory response only (`scrumrules.md` Rule #9 — no code changes until `@bo` selects options).

## [2026-11-12T10:02:00-07:00] @ops & @arch — SCoT: Lock Check Before Building First-Party Telemetry & Campaign Attribution (Items 1–3)
- **Trigger:** `@bo` instructed `@team go on 1-3, pass on 'First-Party Short-Link Manager' (for now).`
- **Lock Audit (`locksrules.md` Rule #3 & Rule #6):**
  - Implementing items 1–3 end-to-end requires modifying `firestore.rules`, `firebase.json`, `functions/src/telemetry.ts`, `functions/src/mailing.ts`, and `functions/src/index.ts` in addition to `src/frontend/...` (`@dev`), `infrastructure/...` (`@ops`), and `docs/...` (`@arch`).
  - Also spotted during inspection of `functions/src/mailing.ts` (lines 720–723): updating `functions/src/mailing.ts` lets us ensure server-side `sublist:<name>` filtering AND `?src=<campaignSlug>` auto-tagging parity alongside `telemetryEvent`.
- **Action:** Invoke `locksrules.md` Rule #6 Escape Hatch immediately and await `@bo`'s confirmation before modifying any files.

## [2026-11-12T10:04:00-07:00] @arch, @ops & @dev — SCoT: Implementing Phase 22 First-Party Telemetry, Auto `?src=` Tagging & Extensive Analytics
- **Authorization:** `@bo` granted explicit `locksrules.md` Rule #6 override for `firestore.rules`, `firebase.json`, `functions/src/telemetry.ts`, `functions/src/mailing.ts`, and `functions/src/index.ts`.
- **Architecture:**
  1. **Permanent Plan:** Save `docs/plans/2026-11-12-first-party-telemetry-and-campaign-attribution.md` (`@arch`).
  2. **Backend & Rules (`@ops`):**
     - `firestore.rules`: Grant `isBoardOrAdmin` read access to `users` (list), `downloads`, `telemetry_daily`, `telemetry_campaigns`, and `telemetry_events`. Allow strictly schema-validated write-only `create` on `telemetry_events` (`rolledUp == false`, bounded string sizes, whitelisted keys, zero public read) so live Cloud Firestore telemetry works immediately on `localhost:3000` and static previews even before Cloud Functions are deployed.
     - `firebase.json`: Add Hosting rewrite `/api/telemetry/event` -> `telemetryEvent` (`us-central1`).
     - `functions/src/telemetry.ts` & `functions/src/index.ts`: Implement `telemetryEvent` HTTP v2 endpoint filtering bot/scanner User-Agents, reading `x-appengine-country` & `x-appengine-region` (never storing raw client IPs), atomically incrementing `telemetry_daily/{YYYY-MM-DD}` and `telemetry_campaigns/{campaignSlug}`, and writing `telemetry_events` (`rolledUp: true`).
     - `functions/src/mailing.ts`: Add `sublist:<Name>` recipient matching and server-side `?src=<campaignSlug>` first-party URL auto-tagging (excluding `/unsubscribe`) + persist `campaignSlug` on `mailing_campaigns`.
  3. **Frontend Telemetry & Campaign Auto-Tagging (`@dev`):**
     - `src/frontend/src/types/telemetry.ts`: Strict TypeScript interfaces (zero `any`).
     - `src/frontend/src/utils/telemetryClient.ts`: Cookie-free `sessionStorage` session ID, `?src=`/`?utm_campaign=` extraction + URL cleanup via `history.replaceState`, referrer classifier, bot/visibility guard, `/api/telemetry/event` dispatch with automatic Firestore `telemetry_events` (`rolledUp: false`) and offline mock fallbacks.
     - `src/frontend/src/components/telemetry/TelemetryTracker.tsx`: Mounted inside `AuthProvider` in `src/frontend/src/app/layout.tsx`; logs visible-tab `page_view` and delegated `mailto:` / key outbound CTA clicks with authenticated `user` metadata when signed in. Hook `DownloadGate.tsx` and `MailingListSignupCard.tsx` into `recordTelemetryEvent` for `pdf_download` and `mailing_signup` attribution.
     - `src/frontend/src/utils/mailingTemplate.ts`, `src/frontend/src/types/mailing.ts`, `src/frontend/src/hooks/useMailingAdmin.ts`, `src/frontend/src/app/(portal)/board/announcements/page.tsx`: Add `buildCampaignSlug`, `appendCampaignTagToMarkdown`, editable `Campaign Tag (?src=)` field in composer, live tagged preview, and live campaign visit/conversion counts in the Broadcast Audit Log.
     - `src/frontend/src/hooks/useSiteAnalytics.ts` & `src/frontend/src/app/(portal)/admin/analytics/page.tsx` (+ `PortalLayout` & `BoardPage`): Full 5-tab analytics suite (`Pages & Content`, `Email Campaigns & Sources`, `Live Activity Stream`, `Registered Members`, `PDF Downloads`), daily timeline chart, date filters, sortable columns, CSV export, and Board + Admin access.

## [2026-11-12T10:24:30-07:00] @ops & @dev — SCoT: Resolving `webmaster@hems-workshop.org` Board Role Analytics Permission Error
- **Root Cause Diagnosis:**
  1. `webmaster@hems-workshop.org` has the `board` role (confirmed because `/board/mailing-list` worked against live Firestore under Phase 18 rules).
  2. Live Cloud Firestore (`hems-workshop`) is still running the Phase 18 `firestore.rules` because `firebase` CLI OAuth credentials expired (`Please run firebase login --reauth`) before Phase 22's `firestore.rules` (which added `isBoardOrAdmin` to `users` list, `downloads` read, and `telemetry_*` collections) could be deployed to Google Cloud.
  3. Additionally, `useSiteAnalytics.ts` used `Promise.all(...)` across all 6 Firestore collections, causing the entire dashboard to fail when `users`/`downloads`/`telemetry_*` returned `permission-denied` under the stale cloud rules.
- **Fix:**
  1. Harden `firestore.rules` `isBoardOrAdmin()` to safely check `exists(...users/$(userId))` for `'board'`, `'board_member'`, `'board member'`, or `'admin'`, AND check `whitelist/$(request.auth.token.email.lower())` as a fallback so whitelisted Board accounts always pass even before user-doc role sync.
  2. Switch `useSiteAnalytics.ts` from `Promise.all` to `Promise.allSettled` so partial collection results render immediately and detect `permission-denied` with a clear `firestore:rules` deployment notice.
  3. Normalize frontend Board role checks (`board`, `board_member`, `board member`, `admin` case-insensitive) in `analytics/page.tsx` and `(portal)/layout.tsx`.

---
## [2026-11-12T10:59:30-07:00] @arch / @ops / @dev — Dual Online + Email Client Submission on `/contact`
- **Context:** `@bo` reported that clicking "Prepare Email Inquiry" on `/contact` failed to open a mail client (standard failure mode when Windows/Chrome has no desktop `mailto:` handler registered) and requested an **Online Submission button** side-by-side with an **Email Submission button**, granting explicit `locksrules.md` Rule #6 override permission.
- **Architectural Plan (`docs/plans/2026-11-12-dual-online-and-email-inquiry-submission.md`):**
  1. **Backend Cloud Function (`contactInquiry` in `functions/src/mailing.ts`, exported in `functions/src/index.ts`, rewritten at `/api/contact/inquiry` in `firebase.json`):**
     - Validates `firstName`, `lastName`, `email`, `subject` (topic), `message`, and honeypot `websiteUrl`.
     - Maps topic to official Society officer recipient (`Sponsorship & Billing Inquiries` -> `tim.short@hems-workshop.org`, `Website & Technical Support` -> `webmaster@hems-workshop.org`, all other topics -> `president@hems-workshop.org`).
     - Stores every online inquiry in `mailing_public_requests` (`type: "contact_inquiry"`, `status: "pending"` or `"forwarded"`).
     - When `POSTMARK_SERVER_TOKEN` is configured, immediately forwards a formatted transactional email via Postmark (`TrackOpens: false`, `TrackLinks: "None"`, `ReplyTo: <sender email>`) directly to the appropriate officer's `@hems-workshop.org` inbox.
  2. **Firestore Security Rules (`firestore.rules`):**
     - Extend `mailing_public_requests` write-only `allow create` schema to permit `'contact_inquiry'` with `subject`, `message`, and `recipientEmail` fields (message bounded `<= 5000` chars) so online submissions also work 100% natively on localhost and static previews prior to Cloud Function/DNS cutover.
     - Add `'contact_inquiry'` to `telemetry_events` allowed `eventType`s (and `functions/src/telemetry.ts`).
  3. **Frontend Contact Page (`src/frontend/src/components/workshop/ContactClient.tsx`):**
     - Replace the single mailto button with a responsive side-by-side dual button bar:
       - Primary: **Submit Online** (instant website submission + clear confirmation card showing which officer received it).
       - Secondary: **Open in Email App** (triggers `mailto:` draft AND displays a helper strip with one-click **Open in Gmail Web** + **Copy Address & Message** in case the visitor's OS has no desktop mail client).
  4. **Board Panel Inquiry Inbox (`src/frontend/src/app/(portal)/board/page.tsx` & `src/frontend/src/hooks/useMailingAdmin.ts`):**
     - Ensure `useMailingAdmin.ts` ignores `contact_inquiry` items when syncing mailing subscribers, and add a clean **Website Inquiries Inbox** section on `/board` so Board Members can read, reply (`mailto:` / `Gmail Web`), or archive online inquiries submitted before or after Postmark cutover.

---
## [2026-11-12T11:45:10-07:00] @prod / @arch / @dev — Workshop Portal & Board Portal Left-Side Navigation Refactor
- **Context:** `@bo` addressed `@prod` to restructure the Workshop Portal left-side navigation bar, bring `Corporate Sponsorship` and `Student Travel Awards` into the `Workshop Portal` subsection, replace `Administration` with `Board Portal`, delete the placeholder `Board Panel` (`/board`) page, and grey out `Reviewer Panel` and `Admin` under `Board Portal` unless `'reviewer'` or `'admin'` roles are assigned respectively in the whitelist.
- **Role Routing (`scrumrules.md` Rule #8):** `@prod` is read-only for codebase files, so `@prod` confirms UX specifications and routes architecture documentation to `@arch` (`docs/plans/2026-11-12-workshop-and-board-portal-sidebar-nav.md`) and implementation in `src/` to `@dev`.
- **Execution Steps:**
  1. Add `hasAdminRole` and `hasReviewerRole` helpers in `src/frontend/src/utils/telemetryClient.ts`.
  2. Refine `fetchInitialRoles` in `src/frontend/src/context/AuthContext.tsx` so when `whitelist/{email}` exists and is readable, its `roles` array is authoritative (reflecting both additions and removals of `'reviewer'` / `'admin'`), while falling back to `users/{uid}.roles` if `whitelist/{email}` does not exist or rules await deployment.
  3. Move `src/frontend/src/app/corporate-sponsorship/page.tsx` and `src/frontend/src/app/student-awards/page.tsx` into `src/frontend/src/app/(portal)/` (preserving identical `/corporate-sponsorship` and `/student-awards` URLs) and remove duplicate outer padding in `CorporateSponsorshipClient.tsx` and `StudentAwardsClient.tsx` so the Workshop Portal sidebar remains mounted across all 6 `Workshop Portal` links.
  4. Delete `src/frontend/src/app/(portal)/board/page.tsx` (`Board Panel`), preserve any open online contact inquiries inside `useMailingAdmin.ts` + `/board/mailing-list/page.tsx` (shown conditionally when inquiries exist), and update `Navbar.tsx`, `reviewer/page.tsx`, `admin/page.tsx`, and `(portal)/layout.tsx`.

---
## [2026-11-12T12:12:30-07:00] @prod / @arch / @dev — Relocate Previous-Years Graphics to Bottom of Overview, Call for Papers, and Accommodations
- **Context:** `@bo` noted that Overview (`/layout-portal`), Call for Papers (`/call-for-papers`), and Accommodations (`/accommodations`) all feature visual cards from previous workshops right at the top of the page (e.g., 2015 Baltimore Inner Harbor, 2025/2019 presentation graphics, and 2025 Virginia Beach / 2011–2013 Don CeSar hotel photos), risking confusion with the upcoming 16th Workshop (Sept 2027).
- **Role Routing (`scrumrules.md` Rule #8):** `@prod` is read-only for codebase files; `@prod` confirms the information-hierarchy spec, routes documentation to `@arch` (`docs/plans/2026-11-12-demote-previous-workshop-graphics-to-bottom.md`), and routes `src/` updates to `@dev`.
- **Implementation Details:**
  1. `PortalOverviewClient.tsx`: Remove top-of-page 2015 Baltimore photo banner and group all past-workshop material (2015 Inner Harbor photo + 2025 Featured Proceedings table & 2025 Archive card) into a clearly demarcated bottom section titled **Highlights from Previous HEMS Workshops** (`Past Biennial Symposia • Archival Reference`).
  2. `CallForPapersClient.tsx`: Move the 3-card 2025/2019 presentation graphics strip and the 2017 Oxnard poster session photo to a clearly labeled bottom section titled **Examples from Previous HEMS Workshops** (`Past Biennial Symposia • Archival Reference`).
  3. `AccommodationsClient.tsx`: Move the 2025 Virginia Beach and 2011/2013 Don CeSar venue photo cards to a clearly labeled bottom section titled **Previous Workshop Host Venues** (`Past Biennial Venues • Not the 2027 Host Hotel`), switching moved images from `eager` to `lazy` loading.


## [2026-11-12T12:20:45-07:00] @dev — Remove Deferred CFP Cards (Abstract Guidelines, Manuscript Formatting, Submission Window Status)
- **Request (`@bo`):** Remove everything shown in the screenshot snippet on `/call-for-papers` (`Abstract Guidelines` card on the left, plus `Manuscript Formatting` and `Submission Window Status` cards on the right sidebar) for future re-addition.
- **Implementation (`CallForPapersClient.tsx`):**
  1. Delete `ABSTRACT_REQUIREMENTS`, `canSubmitNow`, and unused Lucide icons (`ExternalLink`, `List`, `Clock`).
  2. Remove the `Abstract Guidelines` `<section>`, the `Manuscript Formatting` card, and the `Submission Window Status` card while preserving `Submission Scope`, `Core Research Areas`, `Key Submission Dates`, and the bottom `Previous Years • Archival Examples` section.
  3. Update header subtitle from "Abstract submission guidelines and core research areas..." to "Technical submission scope and core research areas..." so copy matches the visible page sections.
- **Verification:** Kill `next dev`, run `npm --prefix src/frontend run build`, commit on `main`, and restart `next dev`.


## [2026-11-12T12:32:00-07:00] @ms (@sme2) / @brand / @arch / @dev — Calibrated NIST 70 eV EI Front-Page Mass Spectrum Upgrade
- **Request (`@bo`):** `@ms` review the front-page mass spectrum and make it highly accurate and professionally produced; `@brand` make it look amazing.
- **Scientific Audit (`@ms` / `@sme2`):**
  - Identified 8 scientific defects in the legacy inline `IN_SITU_SPECTRUM_PEAKS` stick chart (`src/frontend/src/app/page.tsx`):
    1. Unphysical $^{15}\text{N}/^{13}\text{C}$ isotopologue heights ($m/z\ 29 = 8\%$ vs. NIST $0.73\%$; $m/z\ 45 = 9\%$ vs. NIST $1.19\%$; $m/z\ 66 = 5\%$ vs. $2.5\%$).
    2. Missing mandatory 70 eV EI atomic & doubly-charged ions: $m/z\ 14$ ($\text{N}^+ + \text{CH}_2^{\bullet +}$), $m/z\ 12$ ($\text{C}^{\bullet +}$), $m/z\ 20$ ($^{40}\text{Ar}^{2+}$), $m/z\ 22$ ($\text{CO}_2^{2+}$), and $m/z\ 2$ ($\text{H}_2^{\bullet +}$).
    3. Broken sulfur chemistry: $m/z\ 34 = 18\%$ ($\text{H}_2\text{S}^{\bullet +}$) lacked its mandatory $m/z\ 33$ ($\text{HS}^+$, $42\%$ of $m/z\ 34$) fragment.
    4. Broken BTEX aromatic cracking: $m/z\ 91$ ($\text{C}_7\text{H}_7^+$ tropylium) appeared with $0\%$ molecular ion at $m/z\ 92$ ($\text{C}_7\text{H}_8^{\bullet +}$, NIST $68.4\%$ of $m/z\ 91$), and $m/z\ 78$ ($\text{C}_6\text{H}_6^{\bullet +}$) lacked $m/z\ 77, 52, 51, 50, 39$ ring-cleavage fragments.
  - Solution: Forward-calculate linear superpositions $I(m/z) = \sum_k c_k S_k^{\text{NIST}}(m/z)$ directly from NIST Chemistry WebBook 70 eV EI reference fragmentation patterns + IUPAC natural isotopic abundances across three signature HEMS field regimes (`Subsea Vent MIMS`, `Volcanic Plume QMS`, `Planetary Probe QMS`), rendered with both a continuous unit-resolution quadrupole Gaussian profile ($\Delta m_{\text{FWHM}} = 0.42\text{ Da}$) and crisp `butt`-capped centroid sticks.
- **Visual & Brand Design (`@brand` — Brand Guide v3.1.0):**
  - Strictly adhere to Alabaster Paper (`#FAFBFD`), Specimen White (`#FFFFFF`), Oceanic Sapphire (`#0369A1`), Instrumentation Teal (`#0F766E`), Oxford Ink (`#0F172A`), and `Noto Sans` `tabular-nums` + italic `Source Serif 4` (*m/z*) — zero `font-mono` and zero sci-fi HUD tropes.
  - Expand headroom to `118%` inside a full calibrated analytical frame (`m/z 0–100` major ticks every `10 Da`, minor ticks every `2 Da` & `5 Da`), add `<tspan>` chemical subscripts/superscripts with `paintOrder="stroke"` haloing and verified zero-collision leader hairlines, expose on mobile as well as desktop, and provide a constant-height (`CLS = 0`) interactive ion-assignment readout bar on hover/tap.


## [2026-11-12T12:47:15-07:00] @prod / @brand / @arch / @dev — Tidy `/about` Layout & Audit Against `mission-statementV1.md`
- **Request (`@bo`):** Tidy up the `/about` page layout, compare the Mission Statement and Core Objectives against `docs/source-documents/mission-statementV1.md`, highlight any differences, and suggest conceptual/wordcrafting improvements.
- **Comparison Findings (`about/page.tsx` vs. `mission-statementV1.md`):**
  1. Verbatim match on all Mission Statement prose and all 5 Objective titles & descriptions.
  2. Differences in framing: `/about` renamed headings (`Our Mission`, `Core Strategic Objectives`), wrapped the Society's own mission in third-party quotation marks, and attributed corporate governance solely to a "rotating volunteer Organizing Committee" rather than the 501(c)(3) Board of Directors + Workshop Organizing Committee.
- **Layout Defects Fixed (`about/page.tsx`):**
  1. `group-photo-2025.jpg` (`1029 × 1600` portrait) rendered full-column width (`~750–1,088 px` tall) opposite a short 2-sentence mission, creating `>500 px` of blank vertical void; constrained portrait container (`max-w-[380px]`) without cropping any attendees and paired the left column with a 2×2 Institutional Snapshot ledger so left and right columns align cleanly.
  2. Separated the 2013 Don CeSar dinner photo out of slot #6 of the 5-item Objectives grid into Section 3 (`Community & Heritage`), formatting the 5 Objectives in a clean 6-column symmetrical bento grid (`3` × `col-span-2` + `2` × `col-span-3`).
  3. Resized header society seal from `w-28` (`112px`) to `w-16` (`64px`) per `brand-guidelines.md` §4.2 (`56px–72px`), aligned headings to `Mission Statement` and `Core Objectives`, and preserved verbatim `mission-statementV1.md` text pending `@bo` approval of proposed V2 copy refinements.


## [2026-11-12T12:53:00-07:00] @prod / @brand / @dev — Create `mission-statementV2.md` with Changelog & Sync `/about`
- **Request (`@bo`):** Create `docs/source-documents/mission-statementV2.md` with the proposed V2 Mission Statement, 5 Core Objectives, and a detailed V1 -> V2 changelog explaining each change and its reasoning; then update `/about` (`src/frontend/src/app/about/page.tsx`) to match `V2` word-for-word.
- **Execution:**
  1. Preserve `docs/source-documents/mission-statementV1.md` untouched as historical baseline.
  2. Author `docs/source-documents/mission-statementV2.md` containing the ratified V2 Mission Statement, 5 parallel Verb+Noun Objectives in unified active `we` voice, and a structured V1 -> V2 Changelog table + item-by-item rationale.
  3. Update `src/frontend/src/app/about/page.tsx` (`@dev`) so the Mission Statement and `OBJECTIVES` array match `mission-statementV2.md` verbatim.
  4. Verify via `npm --prefix src/frontend run build` (`@qa`), commit on `main`, and restart `next dev` (`@ops`).


## [2026-11-12T13:01:00-07:00] @prod / @brand / @arch / @dev — Tidy `/history` Layout & Audit Against `historyV1.md`
- **Request (`@bo`):** Tidy up the `/history` page layout, compare its text to `docs/source-documents/historyV1.md`, surface all differences, and recommend conceptual and wordcrafting improvements.
- **Comparison Audit (`history/page.tsx` vs. `historyV1.md`):**
  1. Two silent typo corrections on `/history`: `biannual` -> `biennial` (line 13 of V1) and `by the member of the board member leading` -> `by the board member leading` (line 19 of V1).
  2. Partial abbreviation expansion: `ARCHIVES` converted to a link (`Archives`), and `WSs` expanded to `Workshops` in 3 spots while `WS` / `WSs` remained unexpanded in 8 other places.
  3. Structural differences: Renamed headings (`HEMS Workshop Early Years`, `Formation of the HEMS Society`, `Summary & The HEMS Philosophy`), split Paragraphs 4–5 of Section 1 into two unequal-height side-by-side boxes with invented subheadings, and extracted Sentence 2 of `Summary` out of sequence into a pull-quote above Paragraph 1.
  4. Chronological / conceptual catches in `V1` to report to `@bo`: (a) `V1` states incorporation occurred in **2008** yet says *"The newly incorporated HEMS Society held its 6th WS in Cocoa Beach, FL in 2007"*; (b) the post-2009 city list mentions St. Pete Beach once even though it hosted consecutively in **2011 (8th) & 2013 (9th)**, omits noting **2018 Cologne** as an off-cycle first European workshop and the **2019 -> 2022 -> 2025** pandemic shift, and ends with *"and finally, Virginia Beach, VA"* (implying finality rather than *"most recently"*); (c) tentative passive *"It was hoped..."* phrasing in `Summary`.
- **Layout Refinements (`history/page.tsx`):**
  1. Resize header seal from `w-28` (`112px`) to `w-14 sm:w-16` (`56–64px`) matching `/about` and `brand-guidelines.md` §4.2.
  2. Re-unify all 5 paragraphs of `HEMS WS Early Years` into one uninterrupted left narrative column, balanced on the right by `Fig. 01` (USF COT AUV MS) + a clean **Formative Symposia (1999–2005)** timeline card.
  3. Pair Chapter 02 (`HEMS Society`) with `Fig. 02` (2013 Don CeSar) and a compact clickable **All 15 Workshops (1999–2025)** roster linking directly to `/archive/[year]`.
  4. Tidy Chapter 03 (`Summary`) and match bottom pathway cards to `/about`.
