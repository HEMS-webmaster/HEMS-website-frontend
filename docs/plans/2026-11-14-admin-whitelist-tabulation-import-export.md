# Implementation Plan: Admin Whitelist Tabulation, Roster & Role Importer (CSV + Google Sheets Paste), and Export Modal

**Date:** 2026-11-14  
**Roles:** `@web`, `@dev`  
**Route:** `/admin` (`src/frontend/src/app/(portal)/admin/page.tsx`)

## 1. Scope & Governance Isolation
- **Strict Separation Between Admin Whitelist and Mailing List:**
  - **Admin Whitelist** continues to store user permission records in Firestore `whitelist/{email}` (and `sessionStorage` key `hems_mock_whitelist` in local mock mode) and exclusively governs **Assign Roles** (`attendee`, `submitter`, `oral presenter`, `poster presenter`, `corporate sponsor`, `reviewer`, `board`, `admin`; general access remains automatic for signed-in users).
  - **Mailing List** (`/board/mailing-list`, `mailing_subscribers`, **Cohort Tags**) stays 100% separate and unmodified.
- **Backward Compatibility with `AuthContext` & `firestore.rules`:**
  - All `whitelist/{email}` writes preserve canonical `name` (`"First Last"`) alongside `firstName`, `lastName`, `affiliation`, `roles`, and `updatedAt` so existing auth hydration in `src/frontend/src/context/AuthContext.tsx` remains seamless.

## 2. File Inventory
1. [whitelistCsv.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/whitelistCsv.ts): Expand `WhitelistEntry` and `WhitelistCsvParsedRow` to `firstName`, `lastName`, `affiliation`, `name`; add `splitPersonFullName`, `composePersonFullName`, `hydrateWhitelistPersonFields`, `buildWhitelistParseResultFromPasteRows`, and `WHITELIST_EXAMPLE_HEADING_ROW`; update `parseWhitelistCsv`, `computeWhitelistCsvPlan`, and `SAMPLE_WHITELIST_CSV`.
2. [whitelistExport.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/whitelistExport.ts): Independent whitelist export utility supporting All Users / No Special Roles / individual or multi-role Union/Intersection filtering across 4 formats (`full_csv`, `sheets_tsv`, `email_bcc`, `emails_only`).
3. [useWhitelistAdmin.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useWhitelistAdmin.ts): Hydrate `firstName`/`lastName`/`affiliation`/`name` in mock + Firestore reads/writes; upgrade `addOrUpdateManualUser` and `updateEntryProfile`; add `bulkUpdateRole`; persist extended person fields in `applyCsvPlan`.
4. [WhitelistCsvFormatModal.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/admin/WhitelistCsvFormatModal.tsx): CSV Format, Delimitation & Multi-Role Guide portal modal with one-click `Copy Example Heading Row`.
5. [WhitelistSheetsPasteModal.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/admin/WhitelistSheetsPasteModal.tsx): Google Sheets / Excel 4-column copy/paste portal modal (`First Name`, `Last Name`, `Institution (optional)`, `Email *`) with `Assign Role` selector + multi-role pills and Append/Overwrite mode.
6. [WhitelistExportModal.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/admin/WhitelistExportModal.tsx): Export Roster portal modal with role scope selection, format cards, live snippet preview, clipboard copy, and file download.
7. [admin/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/admin/page.tsx): Reorganize layout to mirror Mailing List (`Export Roster`, `Roster & Role Import`, `Assigned Roles & Directory Filter`, `Whitelist Directory` with `First Name | Last Name | Institution | Email | Assigned Roles | Actions`, collapsible `+ Add User`, bulk role bar, and inline profile editing) under Brand v3.2.0 contrast standards.

## 3. Verification Plan
1. `npx tsc --noEmit` in `src/frontend` exits `0`.
2. Live dev server returns HTTP `200` on `/admin/` and `/board/mailing-list/`, and compiled `/admin/` JS chunks include the new import, paste, export, and tabulation UI strings.
3. Selective `git commit` on `main` including only the 9 task files.

