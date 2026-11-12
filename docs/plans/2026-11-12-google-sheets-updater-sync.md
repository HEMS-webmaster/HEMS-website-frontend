# Audit & Synchronization Plan: `HEMS Upcoming Workshop Control Center` Google Sheet (`2026-11-12`)

**Spreadsheet:** `HEMS Upcoming Workshop Control Center` (`186ouD9WrOQ8tV2z4VkCOSIDJ80Uc1aCm4Dcsy99plx0`)  
**Tabs Audited:** `1_Workshop_Config` (`gid=540431442`) & `2_Website_Ingestion_Checklist` (`gid=188831938`)  
**Local Mirror Files:** [`docs/workshop-sheets/1_Workshop_Config.csv`](../workshop-sheets/1_Workshop_Config.csv) & [`docs/workshop-sheets/2_Website_Ingestion_Checklist.csv`](../workshop-sheets/2_Website_Ingestion_Checklist.csv)

---

## 1. Website vs. Google Sheet Discrepancies Found

1. **Outdated Sponsorship Coordinator Email (`1_Workshop_Config!D41`):**
   - **Previous Sheet Value:** `rtshort00@gmail.com`
   - **Current Website Standard:** `tim.short@hems-workshop.org` (used on `/corporate-sponsorship`, `/contact`, and Schema.org `Organization` metadata).
2. **Home Page (`/`) — Added `UpcomingWorkshopSpotlight` Dossier Card:**
   - Now ingests `workshop_year`, `cycle_stage` (`"Submissions Open"` vs. `"Save the Date"`), and `student_award_amount` (`$1,500.00`) alongside `UpcomingHeroBadge` (`workshop_ordinal`, `target_window`, `venue_confirmed`, `venue_city_state`, `interest_form_url`).
3. **Call for Papers (`/call-for-papers/`) — Deferred Submission CTA Card & Demoted Historical Graphics:**
   - The *Submission Window Status*, *Abstract Guidelines*, and *Manuscript Formatting* cards were deferred for a future update (`16539c1`), and past-workshop examples moved to the bottom `"Previous Years"` section (`4592c73`).
   - `interest_form_url` is no longer rendered on `/call-for-papers/`, and `cfp_submission_url` is marked as reserved in config until the submission portal card is re-enabled.
4. **Workshop Registration (`/registration/`) — Updated Closed vs. Open State:**
   - When `registration_open` is `FALSE`, `/registration/` displays the *"Registration Not Yet Open"* notice (with native `/contact#mailing-list` or `interest_form_url` link) and hides the fee cards until `registration_open` flips to `TRUE`.
   - Ingests `interest_form_url`; no longer ingests `exact_dates`, `sponsor_coordinator_name`, or `sponsor_coordinator_email`.
5. **Workshop Portal Overview (`/layout-portal/`), Accommodations (`/accommodations/`), & Contact (`/contact/`):**
   - `/layout-portal/` and `/registration/` fall back to the native Society Mailing List (`/contact#mailing-list`) when `interest_form_url` is blank.
   - `/accommodations/` also ingests `workshop_year` and separates past host venues into a bottom `"Previous Years"` gallery.
   - `/layout-portal/` uses `cfp_abstract_deadline` (not `cfp_open`).
   - `/contact/` includes the native `MailingListSignupCard` and dual Online/Email inquiry form routing Sponsorship inquiries to `tim.short@hems-workshop.org`.

---

## 2. Synchronization Actions

1. Apply narrow, non-destructive cell updates to `1_Workshop_Config` and `2_Website_Ingestion_Checklist` in `186ouD9WrOQ8tV2z4VkCOSIDJ80Uc1aCm4Dcsy99plx0` via `gsheets mutate batch`.
2. Update local repo CSV templates in `docs/workshop-sheets/` to stay 1:1 with the live Google Sheet.
3. Verify live published CSV propagation and `npm --prefix src/frontend run sync:workshop`.
