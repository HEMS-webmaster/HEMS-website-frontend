# Plan: End-to-End Unicode, Scientific Notation & Foreign Diacritic Integrity

**Date:** 2026-11-18  
**Phase:** 27  
**Agents:** `@arch`, `@dev`, `@qa`, `@ops`  
**Status:** Executing Approved Plan

## 1. Scope & Objectives
Ensure all Greek letters (`δ`, `α`, `β`, `γ`, `μ`, `Ω`, etc.), mathematical operators & isotope notation (`δ¹³C`, `δ¹⁸O`, `CO₂`, `1×10⁻³`, `±`, `≈`, `≤`, `≥`, `°`, `‰`), and international attendee/presenter/venue diacritics (`é`, `ö`, `ü`, `ä`, `ç`, `ê`, `ô`, `ő`, `ł`, `ń`, `ř`, `š`, `ž`, etc.) are stored cleanly as NFC-normalized UTF-8, preserved across the Workshop Manager save/export/preview pipeline, properly decoded from user CSV uploads and rich clipboard pastes, and cleanly rendered across the static website and generated program PDFs.

## 2. Architecture & File Matrix

### Shared Unicode Utilities
- `src/frontend/src/utils/unicodeText.ts`
- `tools/manager/src/utils/unicodeText.ts`
  - `fixMojibakeAndNormalize(input)` — 2-pass UTF-8-as-Windows-1252 byte recovery, PUA symbol bullet cleanup (`•`), Unicode `.normalize("NFC")`, and optional supplementary math normalization.
  - `sanitizeDeepUnicode<T>(value)` — deep JSON sanitizer for objects/arrays/strings.
  - `decodeTextBufferSmart(buffer)` & `readUploadedTextFileSmart(file)` — strips UTF-8 BOM, attempts strict `TextDecoder("utf-8", { fatal: true })`, falls back to `TextDecoder("windows-1252")` for legacy Excel CSV exports, and runs `fixMojibakeAndNormalize`.
  - `foldSuperSubscriptsToAscii(input)` — folds `⁰–⁹` / `₀–₉` / `⁺` / `⁻` for search normalization.

### Historical Catalog, PDF Cache & Registry Restoration
- `src/frontend/src/data/master_workshops.json`
- `src/frontend/src/data/archives/{1999..2025}.json`
- `src/frontend/src/data/corporate_registry.json`
- `docs/registries/pdf_seo_registry.md`
- `local_data/cache/*.json` (restoring 16-bit truncated Math Alphanumerics `U+D400..U+D7FF` outside genuine Korean text in `2007_6_pres_168.json`)
- `src/frontend/scripts/generate-archives-index.js` (super/subscript ASCII folding in `normalizeTitle`)
- `src/frontend/scripts/index-pdf-contents.js` (UTF-8 normalization & math symbol cleanup on extracted PDF text)
- `src/frontend/scripts/validate-archives.js` (Mojibake & Character Encoding Gate)
- Regenerated public artifacts: `src/frontend/public/archives-index.json`, `src/frontend/public/mock-pdf-chunks.json`, `src/frontend/public/llms-full.txt`

### Workshop Manager Hardening (`tools/manager/**`)
- `tools/manager/src/app/api/manager/workshops/route.ts` — sanitize/normalize on load.
- `tools/manager/src/app/api/manager/save/route.ts` — sanitize/normalize on save, preserve existing `host_corporation` enriched metadata (`host_category`, `kicker_label`, `patronage_summary`, `highlights`, `historical_note`, `cta_label`), preserve existing talk/poster `id` fields on match, sanitize output `yearData`.
- `tools/manager/src/app/api/manager/registry/route.ts` — sanitize/normalize registry records on read and mutation.
- `tools/manager/src/app/api/manager/preview/route.ts` & `tools/manager/src/app/api/manager/serve/route.ts` — explicit `text/plain; charset=utf-8` headers + `fixMojibakeAndNormalize` on abstract `.txt` previews.
- `tools/manager/src/app/api/manager/push-to-live/route.ts` — use `npx --yes firebase-tools deploy --only hosting`.
- `tools/manager/src/app/utils/exportProgramPdf.ts` — WinAnsi-safe jsPDF formatting helper (`formatTextForJsPdf`) so Greek, math, super/subscripts, and Central/Eastern European diacritics render cleanly instead of multi-byte spacing artifacts.

### Website User Input & Rendering (`src/frontend/**`, 0 edits to `src/frontend/src/app/archive/**`)
- `src/frontend/src/utils/wordPasteNormalizer.ts` — wire `fixMojibakeAndNormalize`.
- `src/frontend/src/utils/spreadsheetPaste.ts` — wire `fixMojibakeAndNormalize`.
- `src/frontend/src/utils/whitelistCsv.ts` — wire `fixMojibakeAndNormalize`.
- `src/frontend/src/utils/mailingTemplate.ts` — wire `fixMojibakeAndNormalize` on parsed CSV strings.
- `src/frontend/src/app/(portal)/admin/page.tsx` — use `readUploadedTextFileSmart`.
- `src/frontend/src/app/(portal)/operations/mailing-list/page.tsx` — use `readUploadedTextFileSmart`.
- `src/frontend/src/hooks/useWorkshopConfigAdmin.ts` — use `readUploadedTextFileSmart` + sanitize imported JSON.
- `src/frontend/src/components/workshop/AbstractSubmissionClient.tsx` — use `readUploadedTextFileSmart` + `fixMojibakeAndNormalize` on abstract payload.
- `src/frontend/src/app/globals.css` — ensure system/math Unicode fallback parity across `--font-sans`, `--font-serif`, and `--font-mono`.

## 3. Verification Criteria
- `node src/frontend/scripts/validate-archives.js` passes with `0` mojibake hits.
- `node --test tests/unit/unicodeAndArchiveIntegrity.test.mjs` passes all unit & repository integrity assertions.
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` and `npx --prefix tools/manager tsc -p tools/manager/tsconfig.json --noEmit` exit `0`.
- `npm --prefix src/frontend run build` exits `0` (`53/53` static routes) with `0` changes to `src/frontend/src/app/archive/**`.
