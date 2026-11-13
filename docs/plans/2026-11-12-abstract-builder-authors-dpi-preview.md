# Structured Abstract Builder, Dynamic Presenters & Affiliations, 300-DPI Graphic, Word Paste & 1-Page Preview

**Date:** 2026-11-12  
**Routes:** `/abstract-submission`, `/reviewer`

## Summary of Changes
1. **Dynamic Affiliations & Authors (`src/frontend/src/types/abstractSubmission.ts`, `AbstractSubmissionClient.tsx`)**
   - Unlimited numbered affiliations via **`+ Add Affiliation`**.
   - Unlimited presenters & co-authors via **`+ Add Presenter`** and **`+ Add Co-Author`**, each paired with an affiliation `<select>` dropdown, presenter toggle, and delete control (when > 1).
2. **Word Copy-Paste & Equations (`src/frontend/src/utils/wordPasteNormalizer.ts`, `ScientificText.tsx`)**
   - Intercepts paste events across all text fields (`title`, `correspondingEmail`, affiliations, authors, synopsis, abstract body, graphic caption).
   - Converts Word OMML conditional blocks (`msEquation`), MathML (`<math>` / `<mml:math>`), `<sub>`/`<sup>`/`vertical-align`, legacy `Symbol` font mappings, and `U+1D400`–`U+1D7FF` Mathematical Alphanumerics into clean Unicode/inline TeX rendered natively via React (`ScientificText.tsx`, zero `dangerouslySetInnerHTML`).
3. **200-Char Synopsis & 1,500-Char Abstract Body**
   - Strict character counters (`SYNOPSIS_MAX_CHARS = 200`, `ABSTRACT_MAX_CHARS = 1500`), `.txt` loader helper, and quick scientific symbol/equation toolbar.
4. **300-DPI Minimum Graphic Upload (`src/frontend/src/utils/imageDpiValidator.ts`)**
   - Parses PNG `pHYs`, JPEG JFIF `APP0`, and JPEG EXIF `APP1` TIFF IFD0 tags + `naturalWidth`/`naturalHeight` (effective 3.0-in print DPI) + script-free SVG vectors; rejects low-DPI images (< 300 DPI metadata and < 900 px width) with diagnostic dimensions.
   - Persists graphics in IndexedDB (`hems_abstract_files_idb`, key `graphic:<id>`) and best-effort Firebase Storage (`abstracts/<year>/<id>/graphic_<name>`).
5. **Show Preview & Reviewer Panel (`AbstractOnePagePreview.tsx`, `reviewer/page.tsx`)**
   - Single US-Letter page formatted preview showing HEMS letterhead, title, numbered underlined presenters/authors + affiliations, 200-char synopsis, 1,500-char abstract with rendered equations, and 300-DPI figure + caption on 1 page (screen + `window.print()`).
   - Accessible from the form (`Show Preview`), `My Submitted Abstracts`, and the Reviewer Panel (`View 1-Page Abstract`).
