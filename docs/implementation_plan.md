# Implementation Plan - HEMS Deep Full-Text PDF Extraction, Spelling Correction, & Search Operators

This plan outlines the architecture and execution steps to implement:
1. **Did You Mean (Client-Side Spelling Correction)** using Levenshtein distance.
2. **Logical Search Operators** supporting exact phrases (`"phrase"`) and exclusions (`-exclude`).
3. **Deep PDF Content Extraction & Caching Pipeline** using a pure JS `pdf-parse` engine to index actual rare words deep inside HEMS presentation and abstract PDFs.

---

## User Review Required

> [!IMPORTANT]
> **PDF Parser Integration (`pdf-parse`)**:
> We will install `pdf-parse` to dynamically read local slide presentation PDFs. To avoid heavy CPU loads and long build times on massive PDFs, we will implement an automatic caching mechanism under `src/frontend/public/assets/archives/cache/`.
>
> **Fuzzy Spelling Correction**:
> We will compile a dynamic dictionary of ~1,000 valid HEMS-specific terms from synonyms and workshop metadata to enable highly accurate "Did you mean?" suggestions on the client side.

## Open Questions

> [!WARNING]
> 1. **Cache Pre-Population**: Would you like us to parse and commit a pre-extracted text cache for the existing 2018 presentations folder so that your initial local builds remain extremely fast? (Recommended: Yes, this keeps build times under 5 seconds).

---

## Proposed Changes

### 1. Ingestion Pipeline
#### [MODIFY] [package.json](file:///c:/Antigravity/HEMS-website/src/frontend/package.json)
- Add `"pdf-parse": "^1.1.1"` to dependencies.

#### [MODIFY] [index-pdf-contents.js](file:///c:/Antigravity/HEMS-website/src/frontend/scripts/index-pdf-contents.js)
- Integrate `pdf-parse` into the pre-compilation document indexer:
  - Add search logic to check for the presence of local PDFs in `public/assets/archives/[year]/presentations/` and `abstracts/`.
  - Implement a **JSON Text Cache**: check if a cached page-text JSON file exists under `public/assets/archives/cache/[year]/[file].json`. If yes, read from cache.
  - If cache is missing, extract actual text page-by-page using `pdf-parse`, save it to the cache folder, and write it to the static index records.
  - Fall back to metadata-based simulated slide content if the PDF is not present or extraction fails, ensuring a 100% resilient build.

---

### 2. Frontend Search Logic
#### [MODIFY] [page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/archive/page.tsx)
- **Fuzzy Did-You-Mean Parser**:
  - Implement client-side Levenshtein distance calculations.
  - Build a dynamic HEMS dictionary of ~1,000 valid words.
  - Display a clean suggested chip (e.g. `"Did you mean: quadrupole?"`) when query words are misspelled.
- **Logical Search Operators Parser**:
  - Parse exact phrase quotes (`"deep sea Cold seeps"`) and contiguous strings.
  - Parse exclude tags (`-mars`) and reject matched cards containing excluded keywords.

---

## Verification Plan

### Automated Tests
- Validate successful build compilation:
  ```powershell
  npm run build
  ```

### Manual Verification
- **Fuzzy Match Test**: Search for `"quadropule"` and verify it suggests `"quadrupole"`.
- **Operator Test**: Search for `"Mass Spectrometry" -shuttle` and verify Shuttle papers are excluded.
- **Deep Word Test**: Search for `"ayodeji"` or `"wiley"` (rare words in local PDFs) and verify matching slide text snippets appear.
