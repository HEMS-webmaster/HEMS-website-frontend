# Implementation Plan: Phased Workspace Cleanup & Repository Hygiene

This plan outlines a 4-step phased cleanup strategy to remove legacy scrapers, transient build/debug logs, and stray test binaries while protecting active application code, Cloud Functions, and Firebase infrastructure. Each step is fully isolated, enabling explicit review and verification before advancing to the next.

## User Review Required

> [!IMPORTANT]
> - **Step 1 (Zero-Risk Deletions)** removes only transient logs, corrupted leftovers, and root-level temporary test files.
> - **Step 2 (Legacy Script Archival)** moves obsolete migration/scraping scripts into an isolated `archive/legacy_tools/` folder rather than permanently deleting them.
> - **Step 3 (Git Hygiene & Secrets Lock)** updates `.gitignore` to prevent future log and binary commits.
> - **Step 4 (Validation & Verification)** triggers full build tests across `src/frontend` and `functions`.

---

## Step-by-Step Proposed Changes

### Step 1: Purge Transient Logs & Stray Test Files (Zero Code Impact)

Delete generated debug logs, test binaries, and corrupt file copies that bloat the workspace.

#### [DELETE] [`15th_Bell_Underwater_Mass_Spectrometry_Presentation_test.pdf`](file:///c:/AntigravityP1_2/HEMS-website/15th_Bell_Underwater_Mass_Spectrometry_Presentation_test.pdf) (3.4 MB test file at root)
#### [DELETE] [`scratch_archive.zip`](file:///c:/AntigravityP1_2/HEMS-website/scratch_archive.zip) (668 KB root zip)
#### [DELETE] [`src/frontend/dev.log`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/dev.log) (3.5 MB dev log dump)
#### [DELETE] [`src/frontend/build.log`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/build.log)
#### [DELETE] [`src/frontend/build2.log`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/build2.log)
#### [DELETE] [`src/frontend/firebase-debug.log`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/firebase-debug.log)
#### [DELETE] [`src/frontend/lint.txt`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/lint.txt)
#### [DELETE] [`src/frontend/src/app/manager/page.tsx.corrupt`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/manager/page.tsx.corrupt)

**Step 1 Verification Checkpoint:**
- Check file system to ensure logs and test binaries are removed.
- Run `git status` to verify repository tree remains clean.

---

### Step 2: Consolidate Legacy Migration & Scraper Scripts

Archive completed one-off migration and scraping tools into a dedicated `archive/legacy_tools/` folder so they don't clutter the active frontend source directory, while keeping essential active build scripts intact.

#### [NEW] `archive/legacy_tools/` (Directory for retired migration tools)
#### [MOVE] [`src/frontend/create_2019_page.py`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/create_2019_page.py) -> `archive/legacy_tools/create_2019_page.py`
#### [MOVE] [`src/frontend/fetch.py`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/fetch.py) -> `archive/legacy_tools/fetch.py`
#### [MOVE] [`src/frontend/13thprogram.html`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/13thprogram.html) -> `archive/legacy_tools/13thprogram.html`
#### [MOVE] [`src/frontend/scripts/import_legacy_data.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/import_legacy_data.js) -> `archive/legacy_tools/import_legacy_data.js`
#### [MOVE] [`src/frontend/scripts/migrate_2022.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/migrate_2022.js) -> `archive/legacy_tools/migrate_2022.js`

*Active scripts retained in `src/frontend/scripts/`:*
- `build-prod.js` (used by `npm run build`)
- `generate-archives-index.js`
- `index-pdf-contents.js`
- `push-to-live.js` (used by `npm run push-to-live`)

**Step 2 Verification Checkpoint:**
- Verify `src/frontend/` contains only Next.js application files.
- Verify `src/frontend/scripts/` contains only active production build/indexing scripts.

---

### Step 3: Git Hygiene & Documentation Standardization

Ensure `.gitignore` permanently blocks log dumps and test artifacts, and document root project structure.

#### [MODIFY] [`.gitignore`](file:///c:/AntigravityP1_2/HEMS-website/.gitignore)
- Add entries for `*.log`, `*.log.*`, `lint.txt`, `archive/`, `*.corrupt`.
- Ensure credential protections remain enforced.

#### [MODIFY] [`README.md`](file:///c:/AntigravityP1_2/HEMS-website/README.md)
- Replace empty file with concise architectural overview and quick-start instructions.

**Step 3 Verification Checkpoint:**
- Run `git status` to confirm only intentional files are tracked.

---

### Step 4: Full Pipeline Build & Typecheck Verification

Run full build and compilation suites across both frontend and backend functions to guarantee zero regressions.

**Step 4 Verification Checkpoint:**
- Run `npm --prefix src/frontend run lint`
- Run `npm --prefix src/frontend run build`
- Run `npm --prefix functions run build`

---

## Verification Plan

### Automated Tests
- `npm --prefix src/frontend run build` (Ensures Next.js static and dynamic routes compile cleanly)
- `npm --prefix functions run build` (Ensures Firebase TypeScript functions compile with zero errors)

### Manual Verification
- Review file tree in IDE after each step.
- Verify Next.js dev server (`npm --prefix src/frontend run dev`) launches and renders archive pages correctly.
