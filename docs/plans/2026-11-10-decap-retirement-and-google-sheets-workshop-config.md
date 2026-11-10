# Architectural Plan: Decap CMS Retirement & Google Sheets "Upcoming Workshop" Configuration System (Sept 2027)

**Date:** 2026-11-10  
**Owner:** @arch  
**Execution Team:** @dev, @qa, @brand, @ops  
**Cost Profile:** `$0.00 / month` (Google Workspace for Nonprofits + Firebase Spark Free Tier)

---

## 1. Executive Summary & Architectural Goals

1. **Retire Decap CMS Cleanly:** Remove `src/frontend/public/admin/`, `src/frontend/content/`, and `docs/decap_cms_guide.html` (eliminating GitHub-account onboarding friction for volunteer committee chairs and resolving the `/admin` static build collision with [`src/app/(portal)/admin/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/page.tsx)).
2. **Preserve Archive Isolation:** Keep the standalone Local Workshop Manager ([`tools/manager/`](file:///c:/AntigravityP1_2/HEMS-website/tools/manager/src/app/page.tsx) on `http://localhost:4000`) strictly dedicated to historical Proceedings Archives and the Corporate Sponsor Registry. Also preserve `0` modifications on `src/frontend/src/app/archive/**`.
3. **Single Source of Truth for the 16th HEMS Workshop (Sept 2027):**
   - Seed [`src/frontend/src/data/upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json) for the **16th HEMS Workshop (September 2027)** (`cycleStage: "save_the_date"`).
   - Implement strict TypeScript interfaces and an RFC-4180 Google Sheet CSV parser in [`src/frontend/src/utils/upcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/upcomingWorkshop.ts) and custom hook [`src/frontend/src/hooks/useUpcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useUpcomingWorkshop.ts).
   - Provide an optional CLI snapshot script ([`src/frontend/scripts/sync-workshop-sheet.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/sync-workshop-sheet.js)) so `npm run sync:workshop` can also snapshot the Google Sheet into Git prior to production builds.
4. **Wire All 8 Dynamic Workshop Surfaces:** Replace hardcoded 2025/15th Workshop active deadlines and expired Ex Ordo/Marriott booking links with clean, stage-aware components reading `useUpcomingWorkshop()` (displaying `"TBA"` / `"Opening Soon"` gracefully until committee chairs flip each section live).
5. **Deliver Turnkey Google Sheet Templates & Staging Guide:** Create [`docs/workshop-sheets/1_Workshop_Config.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/1_Workshop_Config.csv), [`docs/workshop-sheets/2_Website_Ingestion_Checklist.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/2_Website_Ingestion_Checklist.csv), and [`docs/workshop-sheets/README.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/README.md) (including 1-command Firebase Hosting Preview Channel instructions for private staging).

---

## 2. Step-by-Step Auto-Advance Execution Plan

### Step 1: Retire Decap CMS & Align Documentation
- **[DELETE]** `src/frontend/public/admin/` (`config.yml`, `index.html`)
- **[DELETE]** `src/frontend/content/` (`pages/*.md`, `announcements/*.md`)
- **[DELETE]** `docs/decap_cms_guide.html`
- **[MODIFY]** [`docs/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/project_charter.md) & [`README.md`](file:///c:/AntigravityP1_2/HEMS-website/README.md)

### Step 2: Canonical `upcoming_workshop.json`, CSV Parser & `useUpcomingWorkshop` Hook
- **[NEW]** [`src/frontend/src/data/upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json) — Seeded for the **16th HEMS Workshop (September 2027)** with optional `sheetCsvUrl` override (`process.env.NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL || config.sheetCsvUrl`).
- **[NEW]** [`src/frontend/src/utils/upcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/upcomingWorkshop.ts) — Typed `UpcomingWorkshopConfig` interface, `WorkshopCycleStage` union, RFC-4180 CSV parser (`parseWorkshopSheetCsv`), and safe URL helpers.
- **[NEW]** [`src/frontend/src/hooks/useUpcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useUpcomingWorkshop.ts) — Custom React hook returning `{ workshop, isLiveSynced }` with `try/catch` error handling and instant static initial render.
- **[NEW]** [`src/frontend/scripts/sync-workshop-sheet.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/sync-workshop-sheet.js) + `sync:workshop` npm script in `package.json` & `src/frontend/package.json`.

### Step 3: Wire All 8 Website Surfaces (`src/frontend/src/`)
1. **Home Page** ([`src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) + [`src/components/workshop/UpcomingHeroBadge.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingHeroBadge.tsx)) — Displays upcoming 16th Workshop (September 2027) badge + optional Save-the-Date Google Form link alongside the 15th Workshop proceedings link.
2. **Student Travel Awards** ([`src/app/student-awards/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/student-awards/page.tsx) + [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx)) — Dynamically renders proposed award amount (`$1,500.00`), active vs. TBA application deadline, conditional `Extended` badge, committee email, and optional Google Form application button.
3. **Contact Page** ([`src/app/contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx)) — Updates coordinator details and Symposium Venue block (shows upcoming 16th Workshop target window/venue alongside 15th Workshop Virginia Beach reference when upcoming venue is still TBA).
4. **Workshop Portal Overview** ([`src/app/(portal)/layout-portal/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout-portal/page.tsx) + [`PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx)) — Feeds live announcement headline/body, upcoming milestone cards, and cycle status card.
5. **Call for Papers** ([`src/app/(portal)/call-for-papers/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/call-for-papers/page.tsx) + [`CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx)) — Binds workshop ordinal (`16th`), submission dates, and conditional Open vs. *"Submissions Opening Closer to Workshop"* state (retiring expired 2025 Ex Ordo link).
6. **Workshop Registration** ([`src/app/(portal)/registration/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/registration/page.tsx) + [`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx)) — Binds pass rates (`$250` / `$500` / `$1,350`), registration timeline dates, refund cutoff, and conditional Open vs. *"Registration Opening Soon"* state.
7. **Venue & Accommodations** ([`src/app/(portal)/accommodations/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/accommodations/page.tsx) + [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx)) — Binds hotel name, address, group rate, discount window, cutoff date, and conditional booking button (showing a clean coastal venue selection status + 15th Workshop reference when `TBA`).
8. **Corporate Sponsorship** ([`src/app/corporate-sponsorship/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx) + [`CorporateSponsorshipHeaderActions.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx)) — Binds current Sponsorship Info PDF URL, reference package rates, and coordinator email.

### Step 4: Google Sheet CSV Templates & Private Staging Guide
- **[NEW]** [`docs/workshop-sheets/1_Workshop_Config.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/1_Workshop_Config.csv)
- **[NEW]** [`docs/workshop-sheets/2_Website_Ingestion_Checklist.csv`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/2_Website_Ingestion_Checklist.csv)
- **[NEW]** [`docs/workshop-sheets/README.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/workshop-sheets/README.md)

### Step 5: QA Verification & Local Commit
- **[NEW]** [`tests/unit/upcomingWorkshopCsv.test.mjs`](file:///c:/AntigravityP1_2/HEMS-website/tests/unit/upcomingWorkshopCsv.test.mjs) — Automated Node test verifying round-trip parsing of `1_Workshop_Config.csv` into `UpcomingWorkshopConfig`.
- Verify `0` diff lines on `src/frontend/src/app/archive/**`.
- Run `npx next typegen` + `npx tsc --noEmit` (`0` errors, zero `any`).
- Verify `HTTP 200 OK` across all 8 routes + `/admin/` on `http://localhost:3000`.

