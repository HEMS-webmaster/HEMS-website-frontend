# Implementation Plan: Sponsor Logos Reorganization & Manager Synchronization

**Date:** 2026-09-02  
**Author:** @arch & @ops  
**Status:** PROPOSED  

---

## 1. Context & Motivation

Following the successful migration of all 15 workshop proceedings into `local_data/proceedings/`, the legacy folder `docs/archives_translation/sponsors` remains to be reorganized. 

Currently:
1. **`docs/archives_translation/sponsors/`** contains **67 historical raw assets** (some dating back to 2001, including historical variants like `HamSundstrand_logo.gif`, `cot_logo.jpg`, etc.).
2. **`src/frontend/public/images/sponsors/`** contains **79 standardized web-facing logos** referenced directly by [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json) and deployed via Firebase static hosting.
3. **`local_data/sponsors/`** does not yet exist on disk.

We need to consolidate these sponsor assets into `local_data/sponsors/` while maintaining 100% synchronization with the Workshop Manager (`http://localhost:3000/manager`), ensuring that drag-and-drop uploads, corporate registry lookups, and website builds work seamlessly.

---

## 2. Architecture & Directory Roles

| Directory | Purpose | Deployment Target | Tracking |
| :--- | :--- | :--- | :--- |
| **`local_data/sponsors/`** | Canonical master repository of all historical & current sponsor logo assets. | Master archive | Explicitly tracked in Git (`!local_data/sponsors/` in `.gitignore`) |
| **`src/frontend/public/images/sponsors/`** | Public static assets directory served by Next.js and Firebase Hosting. | Web client bundle | Tracked in Git |
| **`docs/archives_translation/sponsors/`** | Legacy staging directory. | **DELETED** post-migration | Pruned |

---

## 3. Discrete Step-by-Step Execution Plan

### Step 3.1: Inventory & Harmonization
1. Copy all 67 files from `docs/archives_translation/sponsors/` into `local_data/sponsors/`.
2. Sync all 79 web-optimized files from `src/frontend/public/images/sponsors/` into `local_data/sponsors/` (preserving newer/active versions).
3. Result: `local_data/sponsors/` becomes the complete master set (91 total unique assets, including historical originals and current standardized logos).

### Step 3.2: Manager API & Path Synchronization
1. **Resolver Verification:**
   - Confirm `getSponsorsDir()` in [`assetPaths.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/assetPaths.ts) points to `local_data/sponsors/` once populated.
2. **Bi-directional Sync Verification:**
   - **Upload (`api/manager/upload`):** Already configured to write to both `getSponsorsDir()` (`local_data/sponsors`) and `public/images/sponsors`.
   - **Delete (`api/manager/delete`):** Already configured to remove from both `getSponsorsDir()` (`local_data/sponsors`) and `public/images/sponsors`.
   - **Check-File (`api/manager/check-file`):** Resolves against `getSponsorsDir()` and verifies public assets.
   - **Corporate Registry (`api/manager/registry`):** Reads and updates [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json).

### Step 3.3: Corporate Registry & Master Workshops Alignment
1. Validate every entry in [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json) to ensure its `logo_file` physically exists in both `local_data/sponsors/` and `src/frontend/public/images/sponsors/`.
2. Validate all workshop sponsor references across all 15 workshops in `master_workshops.json`.

### Step 3.4: Legacy Directory Pruning
1. Once `local_data/sponsors/` is verified, permanently delete `docs/archives_translation/sponsors/`.
2. Clean up any lingering temporary artifacts in `docs/archives_translation/`.

---

## 4. Verification Plan

1. **Automated File Integrity Check:**
   - Run verification script ensuring all 79 public logos exist in `local_data/sponsors/` and all 67 legacy logos were retained.
2. **Live Workshop Manager Verification:**
   - Test `GET /api/manager/check-file?category=Sponsor&fileName=Adaptas_Solutions.png` -> `exists: true`.
   - Test `GET /api/manager/check-file?category=Sponsor&fileName=BaySpec.png` -> `exists: true`.
   - Inspect [http://localhost:3000/manager](http://localhost:3000/manager) -> Corporate Registry tab & Workshop 14/15 sponsor cards.
3. **Build & Git Hygiene:**
   - Run `npm --prefix src/frontend run build` to verify 0 missing asset errors during static generation.
   - Verify `git status` shows `local_data/sponsors/` properly tracked while raw proceedings remain ignored.
