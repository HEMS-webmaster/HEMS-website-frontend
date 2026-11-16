# Implementation Plan: Free-Tier Watchpoints 1–3 Optimization (Addendum 35)

**Date:** 2026-11-16  
**Authors:** `@arch`, `@web`, `@ops`, `@dev`, `@qa`  
**Status:** Approved / Implementing

## 1. Objective
Eliminate the three resource-efficiency watchpoints identified during the Firestore & Google Cloud Always-Free audit while keeping `0` edits inside locked `/archive/**` pages or proceedings JSONs:
1. **Watchpoint 1 (`/archive` Search Bandwidth & Typing Debounce):** Opt-in toggle for the `13.56 MB` `/mock-pdf-chunks.json` deep PDF index + `2.5s` keystroke debounce (`Enter`/chip/reset execute immediately).
2. **Watchpoint 2 (Web Image Compression, Filename Restoration & Sticky Full-Res Master):** Compress `Gemini_Generated_Image_p2l87kp2l87kp2l8.jpeg` (`2.58 MB`) back into `don-cesar-hawaiian-smiles-2013.jpg` (`1600×1059`, `< 260 KB`); preserve the exact `3756×2594` (`846,986` B) `hemslogo.jpg` master at `/images/brand/hemslogo-fullres-3756x2594.jpg`, compress `/hemslogo.jpg` (`1127×778`, `< 85 KB`), and permanently pin the full-resolution master at the top of the **Secure Board Repository** (`/board`).
3. **Watchpoint 3 (Firestore Read Trim & Cloud Housekeeping):** Reduce `telemetry_events` live-stream read cap from `1500` to `300` (`downloads` to `200`) in `useSiteAnalytics.ts`, and provide `infrastructure/configure-free-tier-guardrails.ps1` for GCP Artifact Registry (`gcf-artifacts`) 2-version cleanup + GCS region audit.

## 2. Verification Plan
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exits `0`.
- Python/Node verification of exact image sizes/hashes, updated `galleryAssets.ts` mtime, `useSiteAnalytics.ts` limits (`300`/`200`), and `HTTP 200` on `/archive/`, `/about/`, `/board/`, `/hemslogo.jpg`, `/images/brand/hemslogo-fullres-3756x2594.jpg`, and `/images/gallery/don-cesar-hawaiian-smiles-2013.jpg`.
- `git status --short` confirms locked `/source-material`, `.agents/rules`, `/archive/[year]`, `/data/archives`, and `@bo`'s open files remain untouched.
