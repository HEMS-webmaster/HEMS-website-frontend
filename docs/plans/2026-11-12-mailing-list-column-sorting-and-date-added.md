# Mailing List Multi-Column Sorting & Date Added Column Plan (`2026-11-12`)

## 1. Objective (`@bo` Directive)
Enhance `/board/mailing-list` (`@ops` & `@dev`) with:
1. Interactive **sort-by-column** controls across every data column in the subscriber directory (`Subscriber`, `Institution`, `Sublists & Topics`, `Status`, and `Date Added`).
2. A dedicated **`Date Added`** column displaying when each email address was added to the HEMS mailing list (`createdAt`), with full CSV import/export round-tripping.

## 2. Data & CSV Round-Trip Architecture (`@ops`, `@arch`)
- **Firestore Field:** Uses `MailingSubscriber.createdAt` (ISO-8601 timestamp stored on every subscriber record in `mailing_subscribers`).
- **CSV Import Preservation (`parseMailchimpCsvExport` & `importMailchimpRows`):** Automatically detects `Date Added`, `OPTIN_TIME`, `CONFIRM_TIME`, `Created At`, or `Timestamp` columns in Mailchimp / HEMS CSV uploads, normalizing valid dates to ISO-8601 and preserving the earliest known opt-in timestamp if an existing subscriber is re-imported.
- **CSV Export (`handleExportCsv`):** Exports `Date Added` alongside `Updated At` so backups retain original list-addition dates.

## 3. Interactive Table Sorting (`@dev`)
- **Sortable Columns:**
  1. `Subscriber` (`email`, secondary `lastName` / `firstName`)
  2. `Institution` (`affiliation`, empty `"—"` sorted last when ascending)
  3. `Sublists & Topics` (joined sublist + topic label string, untagged sorted last when ascending)
  4. `Status` (logical lifecycle rank: `Active` → `Pending Opt-In` → `Unsubscribed` → `Hard Bounced` → `Complained`)
  5. `Date Added` (`createdAt` chronological sort; defaults to newest-first `desc` on first click, toggles to oldest-first `asc`)
- **UI & Accessibility:** Clickable column header buttons with `ArrowUp` / `ArrowDown` / `ArrowUpDown` indicators, `<th aria-sort="...">`, and `tabular-nums` `YYYY-MM-DD` date formatting (with hover tooltip showing full timestamp and acquisition source).

