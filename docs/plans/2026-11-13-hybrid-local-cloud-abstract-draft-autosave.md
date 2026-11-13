# Plan: Option B — Hybrid Local (`localStorage` + `IndexedDB`) & Throttled Firestore Cloud Draft Autosave

## Architecture Summary
1. **Tier 1 — Instant Local Browser Autosave (`400 ms` debounce + `beforeunload`/`pagehide` flush):**
   - `localStorage` (`hems_abstract_draft_v1:<uid>_<year>`) for Stage 1–7 metadata & text.
   - `IndexedDB` (`hems_abstract_files_idb` / `abstract_pdfs`, key `draft_graphic:<draftKey>`) for the uploaded 300-DPI graphic `Blob`, restoring the `File` object and object URL across reloads.
2. **Tier 2 — Throttled Firestore Sync (`abstract_drafts/<draftKey>`):**
   - At most 1 `getDoc` read on mount to resume newer cross-device drafts (`cloudTime > localTime + 1000`).
   - `setDoc` writes throttled strictly to stage transitions (`Next` / `Back` / stepper jump), `45 s` idle timeout, or explicit `Save Draft` click (only when content hash changed).
   - Never uploads heavy graphics to Cloud Storage during drafting; clears local + IndexedDB + cloud draft cleanly upon final submit or explicit `Clear Draft`.

## Modified / Created Files
- [abstractSubmission.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/types/abstractSubmission.ts)
- [useAbstractDraft.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useAbstractDraft.ts)
- [AbstractSubmissionClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AbstractSubmissionClient.tsx)
