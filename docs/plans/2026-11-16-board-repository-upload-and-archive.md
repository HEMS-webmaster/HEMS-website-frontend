# Implementation Plan: Board Repository File Upload, Outdated Archiving & 10 MB Limit (Addendum 34)

**Date:** 2026-11-16  
**Authors:** `@arch`, `@web`, `@dev`, `@ops`, `@qa`  
**Status:** Approved / Implementing

## 1. Objective
Upgrade the **Secure Board Repository** on `/board` (`src/frontend/src/app/(portal)/board/page.tsx`) so authenticated **HEMS Board Members (`'board'`)** can upload governance/financial/planning files, enforce a `10 MB` per-file size limit and safe document extension whitelist, and archive outdated files cleanly into an `Archived / Outdated` view with restore and permanent delete controls.

## 2. File Size & Format Policy (`$0/mo` Nonprofit Protection)
- **Hard Per-File Cap:** `10 MB` (`10,485,760` bytes), enforced both client-side in `validateBoardUploadFile` and server-side in `firestore.rules` (`fileSizeBytes > 0 && fileSizeBytes <= 10485760`) and `infrastructure/storage.rules`. Preserves generous headroom inside Firebase's no-cost tier (`5 GB` Storage / `1 GB` Firestore) across hundreds to thousands of Board PDFs, decks, and spreadsheets.
- **Soft Size Hint:** `5 MB` (`5,242,880` bytes) displays a gentle recommendation to compress large presentations/scans while allowing uploads up to `10 MB`.
- **Safe Document Extension Policy:**
  - Allowed: `.pdf`, `.doc`, `.docx`, `.odt`, `.rtf`, `.txt`, `.md`, `.xls`, `.xlsx`, `.ods`, `.csv`, `.ppt`, `.pptx`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.zip`.
  - Explicitly blocked: `.exe`, `.msi`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.js`, `.mjs`, `.cjs`, `.vbs`, `.scr`, `.dmg`, `.app`, `.apk`, `.jar`.

## 3. Architecture & Target Files
- `src/frontend/src/types/boardRepository.ts` *(new)* — Interfaces (`BoardDocumentRecord`, `BoardDocumentCategory`, `BoardDocumentStatus`, `UploadBoardDocumentInput`) + pure validation and formatting helpers (`formatFileSize`, `getFileExtension`, `validateBoardUploadFile`). Zero `any`.
- `src/frontend/src/hooks/useBoardRepository.ts` *(new)* — Custom hook managing Board documents across:
  1. IndexedDB blob cache (`hems_board_files_idb` / `board_blobs`) for offline & Dev Mock Mode support;
  2. Primary Firebase Cloud Storage (`board_repository/${docId}/${safeFileName}`) with real `uploadBytesResumable` progress tracking;
  3. Automatic Firestore chunked fallback (`board_document_blobs/${docId}_${chunkIndex}` at `<= 600 KB` raw slice -> `< 900 KB` base64 string) if Storage is unavailable;
  4. Metadata persistence in `board_documents/${docId}` (preserving & managing active/archived status, `archivedAt`, `archivedByEmail`, `archiveReason`, restore, and cleanup on delete).
- `src/frontend/src/app/(portal)/board/page.tsx` *(edit)* — Full interactive **Secure Board Repository** UI (upload drawer with drag-and-drop & live progress bar, Active vs. Archived/Outdated tabs, search/category/sort controls, inline archive reason confirmation, restore, and 2-step delete).
- `firestore.rules` *(edit)* — Add strict `isBoard(userId)` helper, harden `/board_documents/{document}` with schema + `<= 10485760` byte cap, and add `/board_document_blobs/{chunkId}` rules for chunked fallback.
- `infrastructure/storage.rules` *(new)* — Reference Firebase Storage rules for `/board_repository/{docId}/{fileName}` enforcing `request.auth != null`, Board role check via `firestore.get`, and `<= 10 * 1024 * 1024` size cap.

## 4. Verification Criteria
1. `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exits `0`.
2. Node unit assertions pass across `validateBoardUploadFile` (420 KB `.pdf` ok, 6.5 MB `.pptx` warning, 10.5 MB `.pdf` rejected, 0 B rejected, `.exe`/`.js`/`.bat` rejected), `formatFileSize`, and `firestore.rules` `isBoard` + `10485760` checks.
3. `GET http://localhost:3000/board/` returns `HTTP 200` on running `next dev`.
4. `git status --short` verifies untouched protected & open files.
5. `docs/session_history.md` updated with Addendum 34.
