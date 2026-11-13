# Implementation Plan: Typographic Width/Font-Size Calibration (12–15 Words/Line, Wider Interface) & 7-Stage Consolidation

**Date:** 2026-11-13  
**Owners:** `@arch` (Blueprint), `@web` (Typography & UX Audit), `@dev` (Implementation in `src/frontend/src/`)

## Root-Cause Diagnosis
1. **CSS `96 px/in` vs. Comfortable Desktop Reading Scale:** `8.5in = 816px` (`6.5in = 624px`), whereas desktop page zoom (~125% = `120 px/in`) is `1,020px` sheet / `780px` printable text column.
2. **Double-Nested Padding:** Stacking Stage-card horizontal padding (`144px`) outside Stage 5 Live Preview padding (`86px`) or Stage 8 `<AbstractOnePagePreview>` margins (`192px`) shrank the effective line width to `582px` (Stage 5) and `476px` (Stage 8), causing narrow ~8–10 word wraps.
3. **Font Advance Factor (`Source Serif 4`):** `Source Serif 4` has `c_avg ≈ 0.50 em` (~14% wider than Times New Roman's `0.44 em`). Pairing `16px` on the `780px` screen column and `9.6pt` on the `468pt` (`6.5"`) print column locks `Width / FontSize = 48.75` → `~97.5 chars/line` (**12–15 words/line**) everywhere.

## Target Files
- [AbstractOnePagePreview.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractOnePagePreview.tsx)
- [AbstractSubmissionClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractSubmissionClient.tsx)
- [PrintableFormattingGuidelines.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PrintableFormattingGuidelines.tsx)

## Verification
- `npx tsc --noEmit` in `src/frontend` exits `0`.
- `http://localhost:3000/abstract-submission/` and `http://localhost:3000/reviewer/` return HTTP `200`.

