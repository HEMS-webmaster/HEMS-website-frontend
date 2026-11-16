# Plan: Right-Aligned Squared Figure Text Wrapping (< 3.5"), Row-Level `[FIGURE]` Marker, Website Usage Warning & Collapsible Top Figure Interface

## Objectives
1. When a figure's Desired Figure Width is `< 3.5` inches (`isRightWrappedFigureWidth(w)`), float it to the right of the abstract text with squared justified text wrapping (`float-right clear-right ml-[1em] mb-2.5 mt-0.5`) inside a `flow-root` container.
2. When `< 3.5"` wide, have `[FIGURE]` mark the **first row broken** by the figure's presence (inline insertion without `\n\n` breaks in `insertOrMoveFigureMarker`), placing the figure cleanly inside `<p>` via HTML5 phrasing content (`<span role="figure">`) in `ScientificText.tsx`.
3. Display a clear amber **Website Usage Warning** inside Stage 5 noting that uploaded figures and captions may be used on the HEMS website.
4. Move the Figure Input Interface **above** the Raw Abstract Input Text interface in Stage 5 and add a **`Hide`** toggle button (`figurePanelHidden`), auto-unhiding if a figure/caption validation rule triggers.

## Modified Files
- [abstractSubmission.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/types/abstractSubmission.ts)
- [ScientificText.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ScientificText.tsx)
- [AbstractOnePagePreview.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractOnePagePreview.tsx)
- [AbstractSubmissionClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractSubmissionClient.tsx)
- [PrintableFormattingGuidelines.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PrintableFormattingGuidelines.tsx)

