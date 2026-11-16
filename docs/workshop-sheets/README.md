# Retired: Google Sheets Workshop Control Plane

> **Deprecated (2026-11-16 — Addendum 40):** External Google Sheets synchronization (`sheet_csv_url`) has been retired and replaced by the **HEMS Admin Workshop Control Center** at **`/admin/workshop-settings`** inside the authenticated Administrative Portal (`admin` role only).

## Why This Workflow Moved In-House

- **Single Canonical Schema (44 Keys):** Eliminated 8 deprecated/duplicate rows (`sheet_csv_url`, `sponsor_prospectus_url`, `cfp_submission_url`, `reg_portal_url`, `interest_form_url`, `student_award_form_url`, `dates_confirmed`, `reg_early_bird_opens`) and consolidated `registration_open` + `reg_force_closed` into `registration_mode` (`auto_schedule | open_manual | paused_closed`).
- **Live Staging Without Programming:** Admins edit Draft settings through calendar date pickers, pricing fields, and plain-English switches while visitors continue seeing Live settings.
- **Zero-Login Board Preview Links:** Generate time-boxed `?preview=<token>` URLs with a persistent `[Viewing: Draft | Switch to Live]` toggle, `noindex` headers, and automatic analytics/telemetry suppression.
- **Pre-Publish Diffs, Immutable Audit Trail & 1-Click Rollback:** Every publish and rollback commits atomically via Firestore `writeBatch` (`site_config/workshop_live`, `site_config/workshop_draft`, and append-only `site_config_history/{vNNNN}`).

## Historical Archive

The legacy Google Sheets CSV templates are retained strictly as read-only historical artifacts in [`./archive/`](./archive/):

- [`archive/1_Workshop_Config.csv`](./archive/1_Workshop_Config.csv)
- [`archive/2_Website_Ingestion_Checklist.csv`](./archive/2_Website_Ingestion_Checklist.csv)

For offline JSON snapshot synchronization into `src/frontend/src/data/upcoming_workshop.json`, use:

```bash
node src/frontend/scripts/sync-workshop-sheet.js --from-json=path/to/backup.json
```
