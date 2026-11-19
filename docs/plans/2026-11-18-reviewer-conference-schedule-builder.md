# Phase 29 (Addendum 52): Reviewer Portal Conference Schedule Builder & Workshop Settings Venue/Dinner Logistics

**Date:** November 18, 2026  
**Authors:** `@arch`, `@web`, `@dev`, `@qa`  
**Status:** Completed & Verified  

---

## 1. Objective
Provide Program Committee reviewers and officers with a dedicated **Conference Schedule Builder** (`/reviewer/schedule`) inside the **Reviewer Portal** that:
1. Pulls all **hotel, plenary session room, foyer/poster area, Day 1 Welcome Reception, and Official Workshop Dinner** logistics centrally from **Workshop Settings** (`/admin/workshop-settings`).
2. Generates a HEMS-authentic **4-day single-track suggested schedule** (modeled on archived programs `src/frontend/src/data/archives/2025.json` and `2022.json`) and automatically organizes **accepted oral presentations** (`Accept (Oral)`) by research track and committee score into **Technical Sessions I–IX**.
3. Supports interactive drag-and-drop reordering, moving talks across sessions or unassigned holding tray, custom sessions/breaks/events, and **manual per-talk / per-event start & end time overrides** with optional session time ripple and conflict detection.
4. Exports **publication-ready `.pdf`** and **genuine editable Microsoft Word `.docx`** program documents directly in the browser (100% compatible with Next.js `output: "export"`).

---

## 2. Workshop Settings Schema Extension (`44 -> 53 Keys`)
Section 3 (`venue`: **3. Venue, Rooms & Dinner Plans**) in `src/frontend/src/data/upcoming_workshop.json` and `src/frontend/src/utils/upcomingWorkshop.ts` gains 9 fields:

| Field Key | Type | Default (`upcoming_workshop.json`) | Purpose |
| :--- | :--- | :--- | :--- |
| `venue_session_room` | `text` | `"Main Plenary Ballroom (TBA)"` | Single-track technical presentation room |
| `venue_foyer_room` | `text` | `"Ballroom Foyer & Exhibit Area (TBA)"` | Breakfasts, breaks, sponsors & posters |
| `welcome_reception_time` | `text` | `"6:00 p.m. – 8:00 p.m."` | Day 1 Travel Day Meet & Greet window |
| `welcome_reception_venue` | `text` | `"Host Hotel Foyer / Coastal Welcome Venue (TBA)"` | Arrival welcome reception venue |
| `dinner_day_time` | `text` | `"Wednesday • 6:30 p.m. – 9:30 p.m."` | Workshop Dinner evening & time window |
| `dinner_venue_name` | `text` | `"Coastal Banquet Venue (TBA)"` | Banquet venue / restaurant name |
| `dinner_venue_address` | `text` | `"Banquet address & transportation details TBA"` | Venue street address & directions |
| `dinner_venue_url` | `url` | `""` | Venue website or Google Maps URL |
| `dinner_plan_notes` | `textarea` | `"Included with full attendee registration..."` | Guest ticket, shuttle & sponsor notes |

`src/frontend/scripts/sync-workshop-sheet.js` and `tests/unit/upcomingWorkshopCsv.test.mjs` are updated in lockstep to validate all 53 canonical keys.

---

## 3. HEMS Archival Schedule Structure & Data Model
Based on the 15th HEMS Workshop (Virginia Beach, VA, 2025) and 14th HEMS Workshop (Cocoa Beach, FL, 2022):
- **Day 1 (Monday — Travel Day):** Evening Registration – Meet & Greet / Welcome Reception (`welcome_reception_time` at `welcome_reception_venue`).
- **Day 2 (Tuesday — Workshop Day 1):** Registration & Sponsor Setup (`07:30`), Continental Breakfast (`08:00`), Welcome Remarks (`09:45`), **Technical Session I** (`10:00`), Lunch (`12:00`), Sponsor Introductions (`13:30`), **Technical Session II** (`14:00`), Afternoon Break (`15:00`), **Technical Session III** (`15:30`), Poster Lightning / Evening Poster Session (when accepted posters exist), Dinner (`on your own`, or Banquet if configured for Tuesday).
- **Day 3 (Wednesday — Workshop Day 2):** Continental Breakfast (`07:30`), **Technical Session IV** (`08:30`), Mid-Morning Break (`10:00`), **Technical Session V** (`10:30`), Lunch (`12:00`), **Technical Session VI** (`13:30`), Afternoon Break (`15:00`), **Technical Session VII** (`15:30`), **Workshop Dinner** (`18:30` or parsed from `dinner_day_time`).
- **Day 4 (Thursday — Workshop Day 3):** Continental Breakfast (`07:30`), **Technical Session VIII** (`08:30`), Mid-Morning Break (`10:00`), **Technical Session IX** (`10:30`), Program Survey & Closing Remarks (`12:00`).

Talk slots default to **30 minutes** (configurable to `20`, `25`, or `30` minutes) and dynamically accommodate any number of accepted oral talks without losing slots.

---

## 4. Persistence & Security
- **Firestore (`firestore.rules`):** `match /workshop_schedules/{scheduleId}` grants read/write strictly to authenticated users satisfying `isReviewerOrAdmin(request.auth.uid)`.
- **Hook (`useConferenceSchedule.ts`):** Syncs `workshop_${workshopNumber}` with Firestore and `localStorage` (`hems_conference_schedule_v1_${workshopNumber}`), auto-seeding cleanly on first open.

---

## 5. Client-Side Exports (PDF & Editable DOCX)
1. **PDF (`scheduleExportPdf.ts`):** Uses `jsPDF` (Letter portrait, 1-inch margins) with `toPlainScientificText` + WinAnsi transliteration so Greek characters, super/subscripts, and accented author names render cleanly alongside a Venue & Dinner summary card and Day-by-Day session tables.
2. **DOCX (`scheduleExportDocx.ts`):** Pure TypeScript PKZIP (`STORE` with IEEE CRC-32) OOXML generator emitting `[Content_Types].xml`, `_rels/.rels`, `word/_rels/document.xml.rels`, `word/styles.xml`, and `word/document.xml` with UTF-8 Word tables and native `<w:vertAlign w:val="superscript|subscript"/>` and `<w:i/>` scientific formatting runs.

---

## 6. Verification Plan
- `node src/frontend/scripts/sync-workshop-sheet.js`
- `node tests/unit/upcomingWorkshopCsv.test.mjs`
- `node --test tests/unit/conferenceScheduleBuilder.test.mjs`
- `node --test tests/unit/unicodeAndArchiveIntegrity.test.mjs`
- `npx --prefix src/frontend tsc --noEmit`
- `npm --prefix src/frontend run build`
