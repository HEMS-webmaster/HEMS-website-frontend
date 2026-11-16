# Implementation Plan: `historyV4.md`, Verbatim `/history` Update & Site-Wide 1999 Formation Alignment

**Date:** 2026-11-15  
**Agents:** `@arch`, `@web`, `@dev`  
**Status:** Active Execution  

## Objective
1. Author [`docs/source-documents/historyV4.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV4.md) from `historyV3.md` with three `@bo`-directed updates:
   - Align the 2nd HEMS Workshop date to `March 18–21, 2001` (`on March 18–21, 2001,`).
   - Retain the Board-reviewed `all-volunteer` policy (`an all-volunteer nonprofit corporation`).
   - Use `"defense and security missions"` in Summary for exact symmetry with `mission-statementV4.md`.
2. Sync [`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) verbatim to `historyV4.md` and update milestone dates and badges (`Est. Feb 1999`).
3. Ensure HEMS's **1999 formation year** (`Est. 1999` / `Formed in 1999`, distinguished cleanly from `2008` Florida 501(c)(3) incorporation) and **all-volunteer** policy are clearly and consistently stated across `/`, `/about`, `/contact`, `/corporate-sponsorship`, `/student-awards`, `Footer.tsx`, `seo.ts`, `llms.txt`, and `llms-full.txt`.

## Verification Gates
- Python verbatim parity assertion between `historyV4.md` and Chapters `01–03` of `history/page.tsx`.
- Site-wide scan confirms zero `"February 2001"`, `"Feb 2001"`, `"since 2008"`, `"Est. 2008"`, or `"Est. 2005"`, and confirms `foundingDate: "1999"` in `seo.ts`.
- `node src/frontend/scripts/generate-llms-catalog.js`, `tsc -p src/frontend/tsconfig.json --noEmit`, and live `http://localhost:3000` route checks (`/history/`, `/about/`, `/contact/`, `/corporate-sponsorship/`, `/`) all pass (`200`).
