# Plan: Future-Proofing the Archive & Workshop Manager for Word-Pasted Equations, Inline Formatting & Scientific/International Characters (Phase 28)

**Date:** 2026-11-18  
**Phase:** 28  
**Agents:** `@dev`, `@arch`, `@qa`  
**Status:** Executing Approved Plan

## 1. Objectives
Ensure upcoming cohorts of abstracts (2027+) containing copy-pasted Microsoft Word equations (OMML / MathML / TeX `$...$`), inline HTML formatting (`<i>m/z</i>`, `CO<sub>2</sub>`, `10<sup>-6</sup>`, `δ<sup>13</sup>C`), scientific symbols (`α`–`Ω`, `±`, `×`, `≤`, `≥`, `≈`, `→`, `⇌`, `°`, `‰`), and international attendee/institution diacritics flow seamlessly from abstract submission through Workshop Manager curation (`localhost:4000`), PDF/text preview generation, static archive pages (`/archive/[year]`), Archive Search, APA/BibTeX citations, JSON-LD, and PDF program exports.

## 2. Architecture & Changes
- **Core Scientific Markup Utilities (`src/frontend/src/utils/unicodeText.ts` & `tools/manager/src/utils/unicodeText.ts`):**
  - `hasRichScientificMarkup`, `foldLatinDiacriticsToAscii`, `toPlainScientificText`, `toBibTeXScientificText`, `buildSafePresenterLastNameSlug`, `buildSafeProceedingSlugWords`, and `normalizeForArchiveSearch`.
- **Enhanced Equation Renderer (`src/frontend/src/components/workshop/ScientificText.tsx` & `tools/manager/src/components/ScientificText.tsx`):**
  - Supports `\text{}`, `\mathrm{}`, `\textit{}`, `\mathbf{}`, unbraced sub/superscripts inside `$...$`/`\(...\)` math mode (`$q_z = \frac{4eV}{m r_0^2 \Omega^2}$`), plus expanded TeX symbols (`\permil`, `\micro`, `\ohm`, `\sim`, `\simeq`, `\ll`, `\gg`, `\bullet`, `\minus`).
- **Public Archive & Search Future-Proofing:**
  - `src/frontend/src/app/archive/[year]/page.tsx`: renders titles, taglines, session titles, and student award titles through `<ScientificText />` while supplying clean `toPlainScientificText()` strings to `<Metadata>` and `sr-only`.
  - `src/frontend/src/components/FrontendPreviewHover.tsx`: renders hovered paper titles and `_preview.txt` excerpts with `<ScientificText />`.
  - `src/frontend/src/components/CitationModal.tsx`: renders preview title via `<ScientificText />`, APA/LinkedIn drafts via `toPlainScientificText()`, BibTeX via `toBibTeXScientificText()`, and ASCII-folded cite keys.
  - `src/frontend/src/utils/generateArchiveJsonLd.ts`: emits clean plain-Unicode headings/creditText via `toPlainScientificText()`.
  - `src/frontend/src/components/archive/ArchiveHubClient.tsx`: accent-, super/subscript-, markup-, and `d13c`/`δ¹³C`-tolerant search via `normalizeForArchiveSearch()` plus safe `<ScientificText />` title/snippet rendering when rich markup is present.
  - `src/frontend/src/components/workshop/AbstractSubmissionClient.tsx`: live formatted title preview bar below the Stage 1 Title field when equations/formatting are entered.
  - `src/frontend/scripts/generate-archives-index.js` & `generate-llms-catalog.js`: clean plain-Unicode citations and `llms-full.txt` entries without mutating stored title markup.
- **Workshop Manager Future-Proofing (`tools/manager/**`):**
  - Word paste handlers (`applyWordPasteToField`), live `<ScientificText />` title previews, and safe proceeding/author filename slug generation (`buildSafeProceedingSlugWords` / `buildSafePresenterLastNameSlug`) across `PresentationsManager.tsx`, `PostersManager.tsx`, `StudentsManager.tsx`, and `EventsManager.tsx`.
  - `<ScientificText />` rendering in `tools/manager/src/components/PreviewHover.tsx` and `.sci-*` CSS in `tools/manager/src/app/globals.css`.
  - `toPlainScientificText()` integration inside `tools/manager/src/app/utils/exportProgramPdf.ts`.
  - Created `tools/manager/scripts/preview_generator.py` (`fitz` + `pypdf` fallback, UTF-8 NFC `_preview.txt` + 150-DPI `_preview.png`) wired into `upload/route.ts` and `download-legacy/route.ts`.

## 3. Verification Criteria
- `node --test tests/unit/unicodeAndArchiveIntegrity.test.mjs` passes all unit, slug, search, citation, component wiring, and Python `preview_generator.py` tests.
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` and `npx --prefix tools/manager tsc -p tools/manager/tsconfig.json --noEmit` exit `0`.
- `npm --prefix src/frontend run build` exits `0` (`53/53` static routes) and validates all 15 archive JSON catalogs.
