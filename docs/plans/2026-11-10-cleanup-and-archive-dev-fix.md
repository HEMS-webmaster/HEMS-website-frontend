# Architectural Implementation Plan: Workspace Cleanup, Phase 5 Completion & Local Archive Dev Routing

**Date:** 2026-11-10  
**Custodian:** `@arch`  
**Execution Team:** `@dev`, `@ops`, `@qa`, `@brand`  
**Status:** COMPLETED  

---

## 1. Objective

Execute a comprehensive consolidation sweep authorized by **@bo** to:
1. Finalize and commit **Phase 5: Frontend Webpages Modernization** (Mission Statement & 1999–present Society History on `/` and `/about`, plus canonical sync across `src/frontend/content/pages/*.md`).
2. Eliminate **483.93 MB** of duplicate legacy PDFs and PDF-indexer cache files inside `src/frontend/public/assets/` (with zero data loss by archiving raw 2017/2018 files to `archive/legacy_public_assets/` and moving the text cache to `local_data/cache/`), shrinking `src/frontend/out/` from **508.20 MB to ~24.3 MB**.
3. Restore 100% working PDF streaming and hover previews on `http://localhost:3000/archive/[year]` following the Workshop Manager decoupling to port 4000.
4. Polish placeholder UI elements across `/contact`, `/formatting-guidelines`, and `/layout-portal`, remove dead layout wrappers, and synchronize repository documentation (`docs/project_charter.md`, `README.md`, `.gitignore`).

---

## 2. Work Breakdown Structure (WBS)

### Workstream 1: Phase 5 Completion & Canonical Content Sync (`@arch`, `@dev`, `@brand`)
- [x] Verify `/` ([`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx)) and `/about` ([`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx)) against `mission-statementV1.md`, `historyV1.md`, and `brand-guidelines.md`.
- [x] Synchronize all 7 Markdown files in `src/frontend/content/pages/` (`about.md`, `accommodations.md`, `call-for-papers.md`, `contact.md`, `corporate-sponsorship.md`, `formatting-guidelines.md`, `registration.md`) with verified canonical HEMS Society & 15th Workshop facts (eliminating placeholder hotel/pricing stubs).

### Workstream 2: Local Archive PDF & Preview Resolution (`@dev`)
- [x] Update [`src/frontend/src/app/archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) so local dev (`localhost:3000`) resolves published `public_website_url` GCS assets by default (with automatic fallback to `local_target_path` for unpublished local files and opt-in `NEXT_PUBLIC_USE_LOCAL_MANAGER=true`).
- [x] Add dev-only Next.js `rewrites()` in [`src/frontend/next.config.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/next.config.ts) proxying `/api/manager/:path*` to `http://localhost:4000/api/manager/:path*` when `!isBuild`.

### Workstream 3: Public/Portal Page Placeholder Polish & Dead Code Removal (`@dev`, `@qa`)
- [x] Remove obsolete 7-line pass-through wrappers `ConditionalNavbar.tsx` and `ConditionalFooter.tsx`; wire `Navbar` and `Footer` directly in [`src/frontend/src/app/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx) and remove stale `@source "./manager/**/*.{ts,tsx}";` from `globals.css`.
- [x] Upgrade [`src/frontend/src/app/contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx) with a working static-compatible `mailto:` inquiry builder and replace `[Interactive Map Integration pending]` with an official Society Governance & Venue card.
- [x] Replace unlinked template `<button>` elements in [`src/frontend/src/app/formatting-guidelines/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/formatting-guidelines/page.tsx) with live links to official 15th Workshop reference documents and archive examples.
- [x] Replace placeholder `J. Smith` / `A. Johnson` rows and outdated `"OPEN"` banner in [`src/frontend/src/app/(portal)/layout-portal/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/layout-portal/page.tsx) with real 15th Workshop proceedings links and biennial 16th Workshop status.
- [x] Update [`tests/integration/manager_ingestion.spec.ts`](file:///c:/AntigravityP1_2/HEMS-website/tests/integration/manager_ingestion.spec.ts) to target `http://localhost:4000` and output screenshots to `test-results/`.

### Workstream 4: 484 MB Bloat Relocation & Repo Hygiene (`@ops`)
- [x] Update [`src/frontend/scripts/index-pdf-contents.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/index-pdf-contents.js) to read/write PDF text caches at `local_data/cache/`.
- [x] Relocate `src/frontend/public/assets/archives/cache` -> `local_data/cache/` and `src/frontend/public/assets/archives/{2017,2018}` -> `archive/legacy_public_assets/`; remove `src/frontend/public/assets/`.
- [x] Purge root `firebase-debug.log`, untrack `tests/manager_*.png` (relocating to `archive/legacy_tools/`), clean `.gitignore` files, and update [`README.md`](file:///c:/AntigravityP1_2/HEMS-website/README.md).
- [x] Run `npm run audit:assets`, `npm --prefix functions run build`, and `npm run build` (`src/frontend`), verify `src/frontend/out/` size (~24 MB), commit cleanly to Git, and restart `npm run dev` on `http://localhost:3000`.
