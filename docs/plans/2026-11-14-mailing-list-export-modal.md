# Implementation Plan: Flexible Mailing List Export Modal

**Date:** 2026-11-14  
**Roles:** `@web`, `@dev`, `@arch`  
**Target Route:** `/board/mailing-list`

## Scope
Replace the single-format `Export CSV` trigger on the Board Mailing List workspace with a flexible export modal supporting:
1. **Cohort Selection:** `All Subscribers` or one/more cohort tags (`availableSublists`), with `Match ANY` (union + deduplication) or `Match ALL` (intersection) when 2+ tags are selected, plus a `Select All Tags` quick helper.
2. **Status Scope:** `Active Subscribed Only` (default), `All Statuses`, or `Suppressed Only` (`unsubscribed`, `bounced`, `complained`).
3. **Default Export Formats (`MAILING_EXPORT_FORMATS`):**
   - `full_csv` — Full Directory CSV (`.csv`, headers toggleable, legacy `mailchimp_import` mapped to `csv_import`)
   - `sheets_tsv` — Google Sheets / Excel Roster TSV (`.tsv`, headers toggleable, tab-separated for direct sheet pasting)
   - `email_bcc` — Email Client To / BCC List (`.txt`, `First Last <email>` or plain email when no name)
   - `emails_only` — Plain Email Addresses Only (`.txt`, newline-separated)
4. **Delivery & Preview:** Live dark monospace preview showing sample lines and character/record count, generated filename preview, `Copy to Clipboard` (with `navigator.clipboard.writeText` + off-screen `<textarea>` fallback), and `Download` (with UTF-8 BOM `\uFEFF` for `.csv`).

## Files to Create / Modify
1. `src/frontend/src/utils/mailingExport.ts` *(new)* — Typed export formats, filtering, deduplication, serialization, and filename helpers (zero `any`).
2. `src/frontend/src/components/mailing/MailingExportModal.tsx` *(new)* — Portal modal (`createPortal(..., document.body)`, `z-[100]`, block body `maxHeight: "72vh"`).
3. `src/frontend/src/app/(portal)/board/mailing-list/page.tsx` *(edit)* — Replace inline `handleExportCsv` and `Export CSV` button with `Export List` + `MailingExportModal`.

## Verification Criteria
- Unit assertions via compiled Node script verifying `filterSubscribersForExport`, `formatSubscribersExport` (all 4 formats, RFC-4180 CSV escaping, no `"mailchimp"` output, TSV tab stripping, RFC-5322 quoting), and `buildExportFilename`.
- `npx tsc --noEmit` in `src/frontend` exits cleanly with code `0`.
- `GET http://localhost:3000/board/mailing-list/` returns HTTP `200` and client chunk includes `MailingExportModal`, `Copy to Clipboard`, and `createPortal`.

