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
