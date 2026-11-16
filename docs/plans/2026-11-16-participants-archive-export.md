# Plan: Archive-Ready Participants List Export (`16th Workshop Registration Console`)

**Date:** 2026-11-16  
**Owners:** `@arch`, `@web`, `@dev`, `@qa`  
**Target Files:**
- [exportParticipantsPdf.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/exportParticipantsPdf.ts)
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/board/registrations/page.tsx)

## Objectives
Provide Board & Treasurer officers with one-click export of a confirmed participant roster formatted directly for post-conference upload to the HEMS Proceedings Archive (`tools/manager` -> `proceedings/${ordinal}/Administrative/${ordinal}_Participant_List.pdf`).

## Design Decisions
1. **Archive Schema Alignment (`13th`–`15th` Standard):**
   - Output PDF filename matches `${cleanOrdinal}_Participant_List.pdf` (e.g., `16th_Participant_List.pdf`) expected by `tools/manager/src/app/page.tsx` and `tools/manager/src/app/api/manager/save/route.ts`.
   - 4-column table layout (`Last Name`, `First Name`, `Affiliation`, `Email`) mirrors historical `13th_Participant_List.pdf`, `14th_Participant_List.pdf`, and `15th_Participant_List.pdf`, with an optional toggle to replace `Email` with `Country` for email-redacted distribution plus a companion `.csv` download.
   - Multi-line cell text wrapping via `doc.splitTextToSize(...)` prevents affiliation clipping on long institutional names.
2. **Confirmed-Attendee Filtering & Deduplication:**
   - Include only `status === "paid" || status === "comped"` matching `workshopYear`.
   - Deduplicate by lowercase email keeping the latest `updatedAt` record so seat transfers or re-issued receipts never duplicate an attendee.
   - Sort alphabetically by `lastName`, `firstName`, then `affiliation`.
   - Auto-exclude `isSampleSeed` / `sandboxSimulation` test rows once real registrations exist, with an explicit checkbox override so Board members can inspect or verify locally.
3. **Console Placement:**
   - Primary button **Export Participants List (`N`)** in the top header bar of [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/board/registrations/page.tsx) right alongside **Registration Page** and **Refresh**.
   - Dedicated **Proceedings Archive Participant List** card inside **Tab 4 (`Exports & Avery Name Badges`)** with toggles and both PDF + CSV download actions.

## Verification Gates
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exit `0`.
- Node smoke test verifying deduplication, filtering, alphabetical sort, and non-empty `%PDF-` output via `jsPDF`.
- HTTP `200` on `http://localhost:3000/board/registrations/`.
- Zero modifications to existing `src/frontend/src/data/archives/**` or `tools/manager/**`.
- **Addendum 30** logged in `docs/session_history.md`.
