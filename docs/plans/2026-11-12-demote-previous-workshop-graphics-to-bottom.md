# Relocate Previous-Workshop Graphics to Bottom of Portal Pages

**Date:** 2026-11-12  
**Owners:** `@prod` (UX Hierarchy), `@arch` (Blueprint), `@dev` (Implementation in `src/`), `@qa` (Build Verification)

## 1. Objective
Eliminate any confusion between historical HEMS Workshop visuals and the upcoming **16th HEMS Workshop (September 2027)** by keeping the upper half of **Overview**, **Call for Papers**, and **Accommodations** strictly focused on the upcoming symposium and moving all archival/previous-year imagery into clearly labeled bottom-of-page sections.

## 2. Page-by-Page Changes (`src/frontend/src/components/workshop/`)
1. **Overview (`PortalOverviewClient.tsx`):**
   - Keep `Official Announcements`, `Workshop Resources & Programs`, and `16th Workshop Cycle (2027)` immediately below the page header.
   - Move the `10th HEMS Workshop (2015) — Baltimore's Inner Harbor` photo card, `Featured 15th Workshop Proceedings (2025)` table, and `15th Workshop Archive` card into a bottom section clearly badged `Previous Years • Historical Reference` and titled **Highlights from Previous HEMS Workshops**.
2. **Call for Papers (`CallForPapersClient.tsx`):**
   - Keep `Submission Scope`, `Abstract Guidelines`, `Core Research Areas`, `Key Submission Dates`, `Manuscript Formatting`, and `Submission Window Status` at the top.
   - Move the 3-card `2025 / 2019` technical presentation graphics strip and the `2017` Oxnard poster session photo into a bottom section badged `Previous Years • Archival Examples` and titled **Examples from Previous HEMS Workshops**.
3. **Accommodations (`AccommodationsClient.tsx`):**
   - Keep `Official Workshop Venue`, `HEMS Group Room Block`, `General Lodging Notes`, and `16th Workshop Lodging` immediately below the header.
   - Move the `2025 Virginia Beach` and `2011 & 2013 St. Pete Beach (Don CeSar)` venue cards into a bottom section badged `Previous Years • Past Host Venues` and titled **Previous Workshop Host Venues**, explicitly noting that the 2027 host hotel is forthcoming.

