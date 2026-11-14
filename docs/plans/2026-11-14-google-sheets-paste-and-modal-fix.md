# Plan: Fix Mailing List Informational Modal Visibility & Add Google Sheets Paste Table Popup

- **Date:** 2026-11-14
- **Route:** `/board/mailing-list` (plus shared `MailingSystemInfoModal` on `/board/announcements`)
- **Owner Roles:** `@arch`, `@dev`, `@web`

## 1. Root-Cause Fix for Informational Popups
- **Problem:** In `CsvImportFormatModal.tsx` and `MailingSystemInfoModal.tsx`, using `flex flex-col max-h-[88dvh]` on an auto-height modal container caused the `overflow-y-auto` body (which lacked `flex-1`) to shrink to collapsed height in Chromium/Blink, hiding all modal body content.
- **Solution:**
  - Portal all three modals (`CsvImportFormatModal`, `MailingSystemInfoModal`, `GoogleSheetsPasteModal`) into `document.body` via `createPortal(..., document.body)` at `z-[100]`.
  - Replace the collapsible flex column container with a pure block modal card and explicit `style={{ maxHeight: "70vh" }}` (`"72vh"` on the paste table modal) `overflow-y-auto` body so modal content never collapses.
  - Replace `Columns` (`columns-2`) icon in `CsvImportFormatModal.tsx` with `Table2`.

## 2. Google Sheets Paste Table Importer
- **`src/frontend/src/utils/spreadsheetPaste.ts`:**
  - `tokenizeClipboardGrid` supporting Google Sheets TSV (including double-quoted multiline/tabbed cells), CSV (`parseCsvRows`), and newline lists.
  - `applyClipboardPasteToRows` supporting header-mapped pastes, positional 2/3/4+ column pastes (including omitted Institution column when col 2 is an email), single-column vertical pastes downward from the focused row/column, and native single-cell paste pass-through.
  - `buildParsedRowsFromPasteTable` normalizing emails, reporting invalid row numbers, deduplicating emails, and attaching the selected sublist tag + inferred interests.
- **`src/frontend/src/components/mailing/GoogleSheetsPasteModal.tsx`:**
  - Accessible modal popup with Tag `<select>` dropdown (`No sublist tag`, all `availableSublists`, and `+ Create new sublist tag...` inline input).
  - Editable table with columns: **First Name**, **Last Name**, **Institution (optional)**, **Email \***.
  - Top **Paste from Clipboard** button plus direct `Ctrl+V` / `Cmd+V` `onPaste` capture inside any cell, `+ Add Row`, `Clear All`, invalid-row highlighting, and safe Firestore/sandbox batch import.
- **`src/frontend/src/app/(portal)/board/mailing-list/page.tsx`:**
  - Adds **Paste from Google Sheets** button in `CSV Import & Sublist Tagging` right alongside **Upload CSV**, wired to `importMailchimpRows` and feedback/error banners.

## 3. Verification
- Run TypeScript verification (`npx tsc --noEmit`) with exit `0`.
- Run automated assertions against `spreadsheetPaste.ts` (`npx tsx -e ...`) covering 4-col, 3-col, header-mapped, single-column vertical pastes, and validation/dedup.
- Confirm `/board/mailing-list/` returns HTTP `200` and compiled JS includes the fixed portal + `maxHeight` modal layout and `GoogleSheetsPasteModal`.
