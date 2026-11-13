# Implementation Plan: Abstract Sheet Width Calibration, Single Presenter, Figure Marker & Width Control, Suggested Keywords, and 8.5" × 11" (1" Margin, 1–2 Page) Preview

**Date:** 2026-11-13  
**Owners:** `@arch` (Blueprint), `@web` (UX Specification), `@dev` (Implementation in `src/frontend/src/`)

## Scope of Updates
1. **Pro-Tip Banner Above Stage Titles:** Display `Pro-tip: Copy paste from Word to include special characters, super/subscripts, and equations.` directly above stage titles in `AbstractSubmissionClient.tsx`.
2. **Higher Label vs. Input Contrast:** Apply bold dark-sapphire uppercase labels (`text-sky-950`) against pure-white `border-2 border-slate-300` inputs with deep `text-slate-950` text on a `#F8FAFC` card surface across all stages.
3. **Single Presenter Enforcement:** Replace multi-presenter checkboxes and `+ Add Presenter` with single-presenter radio selection across author rows plus `+ Add Co-Author` in Stage 3.
4. **300-Character Synopsis:** Increase `SYNOPSIS_MAX_CHARS` from `200` to `300`.
5. **Italicized `m/z` Quick-Insert:** Italicize the `m/z` toolbar button and insert `<i>m/z</i>`.
6. **Word Copy-Paste Natural Wrapping:** Unwrap Word's ~72-char source line breaks inside text nodes / single-newline plain text paragraphs so pasted text fills the full text box width naturally while keeping `\n\n` paragraph breaks.
7. **1-Inch Margin Sheet Width Calibration:** Constrain the wizard container to `8.5in` and Stage 5 raw input + live preview text area to `6.5in` text width (`1in` horizontal margin equivalent) at `11pt` scale so live line-wrapping approximates the formatted sheet.
8. **Inline `[FIGURE]` Placement Marker:** Add `Insert Figure Here` (`[FIGURE]`) button in Stage 5 (zero visible-char cost; single marker moved on re-click) and split both Stage 5 Live Preview and `AbstractOnePagePreview.tsx` around `[FIGURE]`.
9. **Desired Figure Width (`3.0 – 6.5` in):** Add slider + numeric input + presets in both **Stage 6** and **Stage 8**, persisted to `GraphicMetadata.widthInches`.
10. **7–8 Clickable Keyword Suggestions (Stage 7):** Extract deterministic 2–3 word phrases & acronyms from `title`, `summary`, `abstractText`, and `researchTrack` via `keywordExtractor.ts` with track backfill.
11. **`8.5" × 11"` (`1"` Margin, 1–2 Page) Preview & Print:** Update `AbstractOnePagePreview.tsx` and named `@page hems-abstract` print rule to render `1"` margins (`6.5"` content width, `11pt` serif body) and flow naturally across 1–2 pages.

## Target Files
- [abstractSubmission.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/types/abstractSubmission.ts)
- [wordPasteNormalizer.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/wordPasteNormalizer.ts)
- [keywordExtractor.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/keywordExtractor.ts) *(new)*
- [ScientificText.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ScientificText.tsx)
- [globals.css](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css)
- [AbstractOnePagePreview.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractOnePagePreview.tsx)
- [useAbstractSubmissions.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useAbstractSubmissions.ts)
- [PrintableFormattingGuidelines.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PrintableFormattingGuidelines.tsx)
- [reviewer/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/reviewer/page.tsx)
- [AbstractSubmissionClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractSubmissionClient.tsx)

## Verification Gates
- `npx tsc --noEmit` inside `src/frontend` exits `0`.
- HTTP `200` on `http://localhost:3000/abstract-submission/` and `http://localhost:3000/reviewer/`.
- `git status --short` clean of forbidden file edits.
