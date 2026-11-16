# Plan: Mailing List CSV Format Guide Popup, Mailchimp De-Branding & Layout Reorder

- **Date:** 2026-11-14
- **Route:** `/board/mailing-list`
- **Owner Roles:** `@arch`, `@dev`, `@web`

## 1. Objectives
1. Remove all user-facing mentions of **Mailchimp** from the Mailing List importer, table metadata labels, modals, and CSV sample/imported bounce descriptions while preserving internal schema values (`SubscriberSource = "mailchimp_import"`) for backwards compatibility with existing Firestore documents.
2. Add an accessible informational popup (`CsvImportFormatModal`) triggered from **CSV Import & Sublist Tagging** that includes:
   - A **"Copy Example Heading Row"** button copying `Email Address,First Name,Last Name,Affiliation,Sublists,Status,Date Added` (matching `parseMailchimpCsvExport` 1-to-1).
   - A multi-row CSV example illustrating commas inside quoted text, semicolon multi-tags, and double-quoted comma multi-tags.
   - Explicit rules explaining comma column delimitation, RFC-4180 double-quoting (`"..."`), and multi-tag cell formatting (`;` recommended or `"Tag A, Tag B"`).
   - Accepted column header aliases and status values (`active`, `unsubscribed`, `bounced`/`cleaned`, `complained`).
3. Reorder `/board/mailing-list` so **CSV Import & Sublist Tagging** renders directly above **Sublists & Cohort Tags**.
4. Remove **Quick-add preset** options (`SUGGESTED_SUBLIST_PRESETS`, `unusedPresets`, and the quick-add preset button bar) from **Sublists & Cohort Tags**, keeping the sublist datalist populated from live `availableSublists`.

## 2. Files Created & Modified
- `src/frontend/src/components/mailing/CsvImportFormatModal.tsx` (new)
- `src/frontend/src/components/mailing/MailingSystemInfoModal.tsx` (modified)
- `src/frontend/src/app/(portal)/board/mailing-list/page.tsx` (modified)
- `src/frontend/src/hooks/useMailingAdmin.ts` (modified)

## 3. Verification Criteria
- Zero user-facing "Mailchimp" text strings in `board/mailing-list/page.tsx` or `src/components/mailing/`.
- `npx tsc --noEmit` exits cleanly (`0`).
- Local Next.js server serves `/board/mailing-list/` with HTTP `200`.

