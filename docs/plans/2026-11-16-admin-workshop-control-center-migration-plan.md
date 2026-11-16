# Implementation Plan (`@arch`) — Migrating Google Sheets Control Plane to the Administrative Portal (`Workshop Control Center`)

**Date:** 2026-11-16  
**Author:** `@arch` (System Architect)  
**Target Role Gate:** Strictly **`admin`** role (`/admin/workshop-settings` inside the Administrative Portal)  
**Status:** Proposed Blueprint — Awaiting `@bo` Review & Approval (Zero source code modified yet)

---

## 1. Executive Goal & Design Philosophy (Zero Technical Knowledge Required)

While the Google Sheet (`docs/workshop-sheets/1_Workshop_Config.csv`) served well as a `$0` MVP control plane, non-technical committee admins still had to edit fragile raw strings (`"TRUE"`, `"$425"`, `"Summer 2027"`), switch out to Google Drive, wait `1–5` minutes for Google's CSV cache, and **had no private "Save Draft → Preview Live Website → Publish → Undo" safety net**.

This plan migrates the entire `docs/workshop-sheets/` workflow into a dedicated, intuitive **`Workshop Settings`** console at **`/admin/workshop-settings`** inside the **Administrative Portal**, engineered around four volunteer-friendly principles:

1. **Form Controls Instead of Spreadsheet Syntax:** Real calendar date-pickers, time/timezone dropdowns, toggle switches, USD currency inputs, and clean 3-way radio selectors replace error-prone text strings and booleans.
2. **Inline Page Impact Pills (Retiring Tab 2):** Instead of cross-referencing a separate spreadsheet (`2_Website_Ingestion_Checklist.csv`), every setting card displays clickable page chips (e.g., `Appears on: Home • Registration • Contact`) plus an instant mini preview of banners and fee badges.
3. **1-Click Draft, Shareable Board Preview & Safe Publish:** Admins edit a private **Draft** (`0` effect on `hems-workshop.org`), generate an unlisted **Board Preview Link** (`?preview=<token>`) with a `[Viewing: Draft | Switch to Live]` toggle — no Git, no terminal, and **no login required** for Board reviewers — and publish only after inspecting a clear **Before → After Visual Diff**.
4. **Google-Docs-Style Immutable Audit Trail & 1-Click Rollback:** Every publish and rollback writes a permanent, tamper-proof snapshot (`site_config_history/{versionId}`) showing *who* changed *what*, *when*, and *why*, with a **1-click "Roll Back Live Website to This Version"** button that restores a prior state in under `1` second.

---

## 2. Forensic Audit of `docs/workshop-sheets/` & `upcoming_workshop.json` — Rows Dropped vs. Retained

A full audit of all **53 keys** in [`upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json), **42 rows** in [`1_Workshop_Config.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/1_Workshop_Config.csv), and **9 rows** in [`2_Website_Ingestion_Checklist.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/2_Website_Ingestion_Checklist.csv) reduces `53` legacy keys down to **`45` clean active fields** (`44` if optional `student_award_form_url` is retired).

### Table A: 8 Deprecated, Orphaned, & Conflicting Keys Dropped or Consolidated

| Old Key(s) | Legacy Origin | Audit Finding & Reason for Removal / Consolidation | Disposition |
| :--- | :--- | :--- | :--- |
| `sheet_csv_url` | `upcoming_workshop.json` | Internal Google Sheets CSV plumbing URL. Obsolete once Firestore `site_config/workshop_live` is the live source. | **Drop** |
| `sponsor_prospectus_url` | `1_Workshop_Config` L41 | Already marked `Retired` in CSV; [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx) generates a built-in 1-page Printable Handout directly from live values. | **Drop** |
| `cfp_submission_url` | `1_Workshop_Config` L26 | Marked `Reserved` in CSV with `0` UI consumers; superseded by HEMS's built-in `/abstract-submission/` portal. | **Drop** |
| `reg_portal_url` | `1_Workshop_Config` L35 | External Google Form / Ex Ordo fallback link; superseded by HEMS's built-in Stripe + ACH + Invoice checkout on [`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx). *(Remove residual external-button branch during migration.)* | **Drop** |
| `interest_form_url` | `1_Workshop_Config` L11 | External "Save the Date" Google Form URL; superseded by HEMS's native Postmark double-opt-in `/contact#mailing-list` signup (`UpcomingHeroBadge.tsx`, `PortalOverviewClient.tsx`, `RegistrationClient.tsx` fall back natively when omitted). | **Drop** |
| `dates_confirmed` | `upcoming_workshop.json` | Orphaned boolean with `0` consumers across `src/` and `functions/`; exact date display is driven directly by `exact_dates` and `conference_start_date`/`conference_end_date`. | **Drop** |
| `reg_early_bird_opens` | `upcoming_workshop.json` | Confusing duplicate of `reg_opening_date` (even `evaluateRegistrationSchedule` checks `reg_opening_date` first and only falls back to `reg_early_bird_opens`). | **Drop** |
| `registration_open` + `reg_force_closed` | `1_Workshop_Config` + Option 1 | Two separate booleans allowed contradictory states (e.g., `registration_open=TRUE` AND `reg_force_closed=TRUE`). Replaced by a single unambiguous 3-way **`registration_mode`** enum (`auto_schedule` \| `open_manual` \| `paused_closed`), mapped cleanly on read to legacy schedule logic. | **Consolidate → 1 Field** |

> **Optional Question for `@bo` (`student_award_form_url`):** [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx) currently displays an optional Google Form upload button when `student_award_form_url` is non-empty, otherwise routing applicants to `student_award_email`. We propose keeping `student_award_form_url` tucked inside an optional *"Advanced / External Packet Upload Link (Optional)"* accordion—or dropping it too if awards packets remain email-only.

### Disposition of `docs/workshop-sheets/` Folder
* **Move/Archive CSVs:** Move `1_Workshop_Config.csv` and `2_Website_Ingestion_Checklist.csv` into `docs/workshop-sheets/archive/` after initial seeding so historical documentation stays traceable, and update [`docs/workshop-sheets/README.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/README.md) with a banner directing committee admins to **`/admin/workshop-settings`**.
* **Revoke Public Web Publishing on the Old Sheet:** Once migrated and verified live, click *File → Share → Publish to web → Stop publishing* on Google Drive so stale spreadsheet data can never diverge.

### Table B: Streamlined 45-Field Control Center Grouped Into 6 Plain-English Sections

| Wizard Section | Volunteer UI Controls | Active Fields (`45` total) | Affected Website Pages |
| :--- | :--- | :--- | :--- |
| **1. Workshop Identity & Dates** | Number/ordinal/year inputs, 4-stage visual lifecycle selector, start & end calendar pickers + *"Dates Still TBA"* auto-formatter | `workshop_number`, `workshop_ordinal`, `workshop_year`, `target_window`, `cycle_stage`, `conference_start_date`, `conference_end_date`, `exact_dates` (`8`) | Home, Portal, CFP, Reg, Accommodations, Awards, Sponsorship, Contact, Abstracts |
| **2. Announcement Banner** | Headline text input + multi-line narrative box with character gauge & live preview card | `announcement_headline`, `announcement_body` (`2`) | Portal Overview (`/layout-portal`), Schema.org `Event` SEO JSON-LD |
| **3. Hotel, Venue & Room Block** | Master *"Hotel Contract Signed"* toggle switch, city/hotel/address inputs, Maps URL, USD group rate, room cutoff calendar picker, booking URL | `venue_confirmed`, `venue_city_state`, `hotel_name`, `hotel_address`, `hotel_maps_url`, `hotel_group_rate`, `hotel_discount_window`, `hotel_booking_cutoff`, `hotel_booking_url` (`9`) | Home, Portal Overview, Accommodations, Corporate Sponsorship, Contact |
| **4. Call for Papers & Abstracts** | *"Accepting Abstracts"* toggle switch, submission & notification calendar pickers, 12h/24h time picker, friendly timezone dropdown (`America/New_York`, `UTC`, `AoE`, etc.) + live lock countdown readout | `cfp_open`, `cfp_abstract_deadline`, `cfp_abstract_deadline_time`, `cfp_abstract_deadline_timezone`, `cfp_notification_date` (`5`) | Call for Papers, Portal Overview, Abstract Submission Cutoff |
| **5. Registration Schedule & Fees** | 3-way **`registration_mode`** radio cards (*Automatic by Dates*, *Open Manually*, *Paused / Closed*), opening / early-bird / final / refund date pickers, timezone selector, Early vs. Regular USD inputs, Student Fund gift toggle + live computed phase preview badge | `registration_mode`, `reg_opening_date`, `reg_early_bird_closes`, `reg_final_cutoff`, `reg_refund_cutoff`, `reg_timezone`, `reg_student_early_fee`, `reg_professional_early_fee`, `reg_sponsor_early_fee`, `reg_student_fee`, `reg_professional_fee`, `reg_sponsor_fee`, `reg_guest_dinner_fee`, `reg_enable_student_fund_donation` (`14`) | Registration Checkout, Stripe Session Pricing, Portal Overview, Sponsorship, SEO JSON-LD |
| **6. Student Awards & Sponsors** | USD award amount, deadline date picker + *"Show Extended Badge"* switch, committee emails & optional Google Form URL, coordinator name/email | `student_award_amount`, `student_award_deadline`, `student_award_extended`, `student_award_email`, `student_award_form_url`, `sponsor_coordinator_name`, `sponsor_coordinator_email` (`7`) | Home Dossier, Student Travel Awards, Corporate Sponsorship, Abstract Submission, Contact |

---

## 3. Live Staging, Shareable Board Preview & Instant-Hydration Architecture

This architecture eliminates both Google CSV caching lag (`1–5 min`) and technical Firebase CLI/Git preview steps for content edits:

```
   ┌───────────────────────────────────────────────────────────────────────────┐
   │  ADMIN CONSOLE: /admin/workshop-settings  (strictly 'admin' role)        │
   │                                                                           │
   │   [Save Draft] ───────────────────▶ Firestore: site_config/workshop_draft │
   │        │                            (Private to Admins; Live unaffected)  │
   │        ▼                                                                  │
   │   [Create Shareable Review Link] ─▶ Firestore: site_config_previews/{tok} │
   │        │                            ▶ https://hems-workshop.org?preview=… │
   │        ▼                            (No login needed; GA4/telemetry off;  │
   │   [Publish Draft to Live]           Live <-> Draft toggle banner active)  │
   │        │ (Visual Diff + Change Note)                                      │
   └────────┼──────────────────────────────────────────────────────────────────┘
            │  Atomic Firestore writeBatch()
            ├─────────────────────────▶ Firestore: site_config/workshop_live
            │                           (<1s update for Web + Stripe Checkout)
            └─────────────────────────▶ Firestore: site_config_history/v000{N}
                                        (Append-only forever; 1-click Rollback)
```

### How Each Storage Document Works & Free-Tier Impact
1. **`site_config/workshop_live` (Public Read / Admin Write):**
   - `allow get: if true; allow list: if false; allow create, update: if request.auth != null && isAdmin(request.auth.uid); allow delete: if false;`
   - **Browser Hydration (`useUpcomingWorkshop.ts`):** Checks `sessionStorage` cache first (`hems_workshop_live_cache_v1` with e.g. `10-minute` TTL) so navigating across pages consumes **1 Firestore read per visitor session** (`~500–2,000` reads/day at normal traffic vs. `50,000/day` Always-Free limit, with baked [`upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json) as Frame-0 SEO fallback!).
   - **Backend Registration Authoritative Check (`functions/src/workshopSchedule.ts`):** Reads `admin.firestore().doc("site_config/workshop_live").get()` directly inside Google Cloud (`~5–15ms`, eliminating external Google Docs HTTP roundtrips!), falling back cleanly to `DEFAULT_SERVER_WORKSHOP_CONFIG` if unseeded.
2. **`site_config/workshop_draft` (Admin Read & Write Only):**
   - `allow read, write: if request.auth != null && isAdmin(request.auth.uid);`
   - Holds unsaved edits + a lightweight auto-draft badge (*"Draft has 4 unpublished changes vs. Live"*). Admins can test everything safely without ever touching live visitors. Includes **"Discard Draft (Reset to Current Live)"**.
3. **`site_config_previews/{previewToken}` (Zero-Login Shareable Board Staging):**
   - `allow get: if true; allow list, create, update, delete: if request.auth != null && isAdmin(request.auth.uid);`
   - When an Admin clicks **"Create Board Review Link"**, the browser generates a random 48-char hex capability token (`crypto.getRandomValues`) storing the frozen `draft` config snapshot, optional reviewer label (*"Board Pre-Opening Check — July 2027"*), creator email, and `expiresAt` (`14 days` default; `"Revoke All Share Links"` clears old tokens immediately).
   - **Reviewer Experience (`?preview=<token>`):** Opening `https://hems-workshop.org/layout-portal/?preview=<token>` saves the token in `sessionStorage` so reviewers can browse across Home, Registration, Accommodations, Call for Papers, Student Awards, Sponsorship, and Contact seamlessly!
   - **Enhanced [`PreviewChannelBanner.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/telemetry/PreviewChannelBanner.tsx):** Automatically activates for `?preview=<token>` sessions (in addition to `*--*.web.app` channels), pausing GA4 (`G-F06RZ8L5CR`) & first-party telemetry, injecting `noindex, nofollow`, and displaying a single-click **`[Viewing: Draft Preview | Switch to Live]`** comparison toggle so Board members can visually toggle between proposed changes and the live site in place!

---

## 4. Mistake-Proof Guardrails & Pre-Publish Visual Diff

Non-technical volunteers should never accidentally break pricing, cut off registration early, or publish `"TBA"` text next to a `"Confirmed"` badge.

### Live Plain-English Guardrails Inside the Form
* **Hotel Consistency Guard:** Blocks checking `venue_confirmed` if `hotel_name` still contains `"TBA"` / `"To Be Announced"` or `venue_city_state` is empty.
* **Chronological Date Validation:** Compares parsed dates cleanly and raises clear human banners (e.g., *"Early-Bird Close Date (July 15) cannot be earlier than Registration Opening Date (August 1)"* or *"Conference End Date cannot precede Start Date"*).
* **Fee Integrity Rules:** Ensures valid USD numbers and blocks saving an Early-Bird fee higher than the matching Regular fee (e.g., `Student Early ($300) > Student Regular ($250)`).
* **Auto-Formatting Helpers:** Automatically strips stray spaces, normalizes URLs to `https://` unless empty, formats USD cleanly (`$425`, `$1,500.00`), and auto-builds `exact_dates` (e.g., `September 13 – September 16, 2027`) when Start & End calendar dates are chosen (with an edit toggle if custom wording is needed).
* **Auto-Advance Schedule Preview Pill:** Shows live plain-English explanation of what visitors see right now: e.g., *"If published today, Registration is **CLOSED (`Opens June 1, 2027`)**, then flips automatically to **Early Registration (\$200 / \$425)** on June 1 and **Regular (\$250 / \$500)** on July 16."*

### "Publish Draft to Live" Confirmation Diff Modal
Clicking **Publish Draft to Live** never publishes blindly — it opens a clean confirmation dialog showing:
1. A compact table of **only modified fields**: `Field Label` | `Current Live Value` | `New Value` | `Pages Affected`.
2. An optional/recommended plain-English **Summary Note** box (e.g., *"Locked Virginia Beach hotel rate and opened early-bird window"*).
3. A single **`Confirm & Publish to Live Website`** button executing an atomic Firestore `writeBatch()` (`site_config/workshop_live` + `site_config_history/v000{N}`).

---

## 5. Immutable Audit Trail & 1-Click Rollback (`site_config_history/{versionId}`)

Firestore Security Rules enforce append-only immutability at the database level:
```
match /site_config_history/{versionId} {
  allow read: if request.auth != null && isBoardOrAdmin(request.auth.uid);
  allow create: if request.auth != null && isAdmin(request.auth.uid);
  allow update, delete: if false; // Tamper-proof forever — even Admins cannot erase history
}
```
Notice **Board Members** (`isBoardOrAdmin`) can **read** the audit trail for governance transparency, while **only Admins** (`isAdmin`) can publish or roll back!

Inside Tab 2 (**`Version History & Rollback`**) of `/admin/workshop-settings`:
* **Chronological Version Cards:** Displays Version `#12`, `LIVE NOW` pill, exact timestamp (`Nov 16, 2026 • 2:14 PM`), author (`Tim Short — webmaster@hems-workshop.org`), change note, count of modified fields, and an expandable **View Field Diff** drawer.
* **Two Safe One-Click Actions per Historical Snapshot:**
  1. **`Copy into Draft`:** Copies Version `#N` into `workshop_draft` so an Admin can adjust a couple of fields before previewing/publishing (zero live impact).
  2. **`Roll Back Live Website to Version #N`:** Shows a side-by-side diff against Current Live and asks for confirmation (*"Roll back live hems-workshop.org to Version #N?"*). When confirmed, atomically sets `site_config/workshop_live` back to Version `#N`'s snapshot AND appends a brand-new history record **Version `#13`: `"Rolled back to Version #12 by [Admin Name]"`** — so rollbacks themselves are always audited and reversible!
* **New Biennial Cycle Wizard (`Start 17th Workshop / 2029`):** Inside a locked-behind-confirmation `"New Workshop Cycle Setup"` drawer, increments `workshop_number`, updates `workshop_ordinal`/`workshop_year`, resets dates/hotel/open switches safely to clean `"TBA"` placeholders into **Draft** (never straight to live!), preserving fees & coordinator contacts as starting points.
* **Offline Portability:** One-click **`Download JSON Backup`** & **`Download Readable CSV`** buttons let any Admin export a snapshot locally anytime.

---

## 6. Portal Navigation & Strict `admin` RBAC Enforcement

1. **New Page Route:** `src/frontend/src/app/(portal)/admin/workshop-settings/page.tsx` (wrapped by `(portal)/admin/layout.tsx` `noindex, nofollow` metadata, or sibling `admin/workshop-settings/layout.tsx`).
2. **Portal Isolation & Navigation Wiring:**
   - Gated strictly on `hasAdminRole(user.roles)` (shows clean `"Administrator Access Required"` guard for `board`, `operations`, `treasurer`, `reviewer`, `attendee`, or signed-out users).
   - Add **`Workshop Settings`** (`SlidersHorizontal` icon) under **`adminPortalLinks`** in [`(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx), [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) (Desktop Admin link/dropdown + Mobile Drawer), and a clear top banner card inside [`/admin/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/page.tsx) (*"Looking to update Workshop Dates, Hotel, Deadlines, or Fees? Open Workshop Settings →"*).
3. **Hardened Firestore Rules (`firestore.rules`):**
   - Add explicit schema checks on `site_config/workshop_live` and `site_config/workshop_draft` (requiring `versionNumber is int`, `workshop_year is string`, `registration_mode in ['auto_schedule', 'open_manual', 'paused_closed']`, etc.) and `site_config_history` immutability (`allow update, delete: if false;`).

---

## 7. Phased Zero-Downtime Rollout Plan (Once `@bo` Approves)

| Phase | Owner(s) | Exact Concrete Deliverables | Zero-Downtime Guarantee |
| :--- | :--- | :--- | :--- |
| **Phase 1: Schema, Rules & Dual-Source Engine** | `@ops` + `@dev` | • Update `upcomingWorkshop.ts` & `upcoming_workshop.json` (`53 → 45` fields with backward-compatible `registration_mode` normalization + schema validators & diff helper).<br>• Add `site_config`, `site_config_previews`, and `site_config_history` rules to `firestore.rules`.<br>• Upgrade `useUpcomingWorkshop.ts` (`?preview=<token>` -> `site_config/workshop_live` with session cache -> `DEFAULT_UPCOMING_WORKSHOP`) and `functions/src/workshopSchedule.ts` (read `site_config/workshop_live` directly -> static default fallback).<br>• Keep legacy `sheet_csv_url` fallback **inactive unless unseeded**, ensuring seamless transition. | Live site & Stripe checkout keep running identically on `upcoming_workshop.json` defaults even before Version #1 is seeded. |
| **Phase 2: Admin UI, Staging Link & Version Timeline** | `@dev` | • Create `src/frontend/src/hooks/useWorkshopConfigAdmin.ts` (loads Live, Draft, Previews, History; saves Draft; creates/revokes Preview links; computes diffs; atomic Publish & Rollback batches; 1-click JSON/CSV backup).<br>• Create `src/frontend/src/components/admin/WorkshopSettingsConsole.tsx` + `src/frontend/src/app/(portal)/admin/workshop-settings/page.tsx` (6-section non-technical form + live guardrails + Visual Diff modal + `Version History & Rollback` tab + `New Workshop Cycle Wizard`).<br>• Wire `adminPortalLinks` in `(portal)/layout.tsx`, `Navbar.tsx`, and `/admin/page.tsx`.<br>• Upgrade `PreviewChannelBanner.tsx` & `GoogleAnalyticsTag.tsx` to support `?preview=<token>` Draft-vs-Live A/B toggle & telemetry pause. | Admins can test Drafts, `?preview=` Board links, Publish, and Rollback while public `hems-workshop.org` stays clean until Admin clicks Publish. |
| **Phase 3: Cutover, Deprecation & Documentation** | `@ops` + `@arch` | • Auto-seed `Version #1` into `site_config/workshop_live` from verified current state (`upcoming_workshop.json`) on first Admin visit (or seed script).<br>• Replace `scripts/sync-workshop-sheet.js` with `scripts/sync-workshop-config.js` (reads Firestore/export snapshot back into `upcoming_workshop.json` prior to full builds for instant SEO Frame-0 parity).<br>• Move CSV templates to `docs/workshop-sheets/archive/`, stop web publishing on old Google Sheet, and update `docs/system_design_architecture.html` + `docs/session_history.md`. | `0` broken references; static SEO HTML on Frame-0 stays synced with live Admin edits. |

---

## 8. Planned `@qa` Verification Gate (Post-Implementation)

1. **Automated Unit Tests (`tests/unit/`):**
   - `upcomingWorkshop.ts` schema validation & chronological/fee guardrails (confirm invalid dates, `Early > Regular` fees, and `venue_confirmed=true` with `"TBA"` hotel fail with plain-English messages).
   - Diff computation helper accurately detects changed keys & maps affected page badges.
   - `registration_mode` mapping produces exact parity across all `7` Auto-Advance lifecycle scenarios (`auto_schedule`, `open_manual`, `paused_closed`).
2. **Security Rules & RBAC Verification:**
   - Assert `firestore.rules` permits `get` on `site_config/workshop_live`, denies `update`/`delete` on `site_config_history`, restricts all Draft/Publish/Preview-creation writes to `isAdmin(uid)` + `hasVerifiedAuthEmail()`, and restricts `/admin/workshop-settings` UI cleanly to `admin`.
3. **Build, Preview & End-to-End Dry Run:**
   - `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exits `0`.
   - `npm --prefix functions run build` exits `0`.
   - End-to-end verification in browser/emulator: Edit Draft → verify live site untouched → generate `?preview=` Board link → toggle `Draft` vs `Live` with GA4/telemetry paused → inspect Visual Diff → Publish `Version #2` → verify live pages update in `<1s` → Roll back to `Version #1` (`Version #3` logged) → verify instant restoration.

---

## Decision Checkpoints for `@bo` Before Execution Starts
1. **Approve removing the 7 obsolete/duplicate keys and consolidating `registration_open` + `reg_force_closed` → `registration_mode` (`53 → 45` fields)?**
2. **Optional `student_award_form_url`:** Keep tucked under *"Advanced / External Upload Link (Optional)"* on the Student Awards card, or retire it alongside `cfp_submission_url` / `reg_portal_url` so awards stay 100% email-based?
3. Once approved, say **go** and `@dev`, `@ops`, and `@qa` will execute Phases 1–3!
