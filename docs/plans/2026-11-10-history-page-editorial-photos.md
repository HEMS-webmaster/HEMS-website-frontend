# Implementation Plan: Editorial History Page & Curated Field Photography (`/history`)

**Date:** 2026-11-10  
**Lead Agents:** `@brand`, `@sme`, `@arch`, `@dev`, `@qa`, `@ops`  
**Scope:** Curate 2 authentic harsh-environment mass spectrometry photographs from `docs/source-documents/pics/` and refactor `/history` (`src/frontend/src/app/history/page.tsx`) into the Brand v3.0.0 editorial layout to eliminate the single-column wall of text.

---

## 1. Curated Visual Selection (`@brand` & `@sme`)
Out of the 11 raw photographs in `docs/source-documents/pics/`, two complementary 4:3 horizontal photographs were selected for narrative relevance, visual clarity, and color harmony with Brand v3.0.0:

1. **`ms in nosecone.jpg` → `src/frontend/public/images/history/usf-cot-auv-nosecone-ms.jpg` (`FIG. 01`)**
   - **Placement:** Section 1 (*HEMS Workshop Early Years, 1999–2005*).
   - **Rationale:** Directly visualizes the underwater mass spectrometer and miniature turbomolecular vacuum assembly packaged inside an autonomous underwater vehicle (AUV) nosecone—anchoring both the USF COT genesis story and the miniature vacuum bottleneck that led to the 2002 joint workshop with NASA JPL.
2. **`CIMG0561.JPG` → `src/frontend/public/images/history/offshore-ms-deployment.jpg` (`FIG. 02`)**
   - **Placement:** Section 2 (*Formation of the HEMS Society, 2005–Present*).
   - **Rationale:** High-clarity offshore shipboard deployment of a pressure-housed underwater mass spectrometer in open ocean waters, bridging hardware development with collaborative field operations and harmonizing naturally with the `Oceanic Sapphire` (`#0369A1`) palette.

*(All 11 original source files in `docs/source-documents/pics/` remain untouched.)*

---

## 2. Editorial Layout & Wall-of-Text Remediation (`@dev`)
- **v3.0.0 Typography & Surface Alignment:** Replace legacy all-caps `font-black` headings on [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) with Title-Case `Source Serif 4` display headings, `Noto Sans` body copy constrained to readable editorial measure, and `IBM Plex Mono` era markers and figure plates.
- **Paced Asymmetric Grid:**
  - **Section 01 (Early Years, 1999–2005):** Split the 5-paragraph block into a 12-column editorial spread—opening 3 paragraphs on the left (`7 cols`) paired with **Figure 01** (`5 cols`), followed by a subtle horizontal divider and a 2-column narrative continuation pairing the *2001 St. Petersburg Growth & Attire* story with the *2002 NASA JPL Vacuum Workshop & Biennial Cadence* story.
  - **Section 02 (HEMS Society, 2005–Present):** Alternate the visual rhythm—placing **Figure 02** on the left (`5 cols`) and the 2008 501(c)(3) incorporation & rotating coastal symposium narrative on the right (`7 cols`).
  - **Section 03 (Chronological Ledger):** Clean 2-column Specimen White milestone cards with `IBM Plex Mono` dates and tags.
  - **Section 04 (The HEMS Philosophy):** Editorial `Source Serif 4` italic pull-quote featuring *"Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!"*

---

## 3. Verification & Preview Deployment (`@qa` & `@ops`)
1. Optimize both web JPEGs (`<= 1280px` wide, ~150–250 KB) into `src/frontend/public/images/history/`.
2. Run `npx next typegen` and `npx tsc --noEmit` (`0` errors) and verify `0` lines changed in `src/frontend/src/app/archive/**`.
3. Build static production output (`npm --prefix src/frontend run build`), commit locally, update private Firebase preview channel `preview-2027`, and restart `localhost:3000`.

