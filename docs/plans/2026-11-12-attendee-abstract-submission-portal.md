# Implementation Plan — Attendee Portal Section, Abstract Submission & Live Reviewer Queue

- **Date:** 2026-11-12
- **Owners:** `@web` (`@sme1`), `@arch`, `@dev`
- **Target Files:**
  - `src/frontend/src/utils/firebase.ts`
  - `src/frontend/src/utils/telemetryClient.ts`
  - `src/frontend/src/context/AuthContext.tsx`
  - `src/frontend/src/types/abstractSubmission.ts`
  - `src/frontend/src/hooks/useAbstractSubmissions.ts`
  - `src/frontend/src/app/(portal)/layout.tsx`
  - `src/frontend/src/components/layout/Navbar.tsx`
  - `src/frontend/src/app/(portal)/abstract-submission/page.tsx`
  - `src/frontend/src/components/workshop/AbstractSubmissionClient.tsx`
  - `src/frontend/src/app/(portal)/reviewer/page.tsx`

## Objective
Enable authenticated users carrying the `'attendee'` role to access a dedicated **Attendees → Abstract Submission** section inside the Workshop Portal, upload single-page PDF abstracts with structured scientific metadata, and have those submissions appear immediately in the **Reviewer Panel** (`/reviewer`) for PDF inspection and scoring.

## Architecture Highlights
1. **Role Gating (`attendee`):**
   - `hasAttendeeRole(roles)` in `telemetryClient.ts` gates the `Attendees` sidebar section and `/abstract-submission` route.
   - Dev Role Switcher in `(portal)/layout.tsx` includes `Attendee`, `Attendee + Reviewer`, and `All Roles` presets for instant local testing.
2. **Dual-Mode Abstract Storage (`useAbstractSubmissions.ts`):**
   - Stores metadata cleanly in `localStorage` (`hems_abstract_submissions_v1`) + Firestore (`abstract_submissions` collection, best-effort sync) and stores uploaded PDF binary blobs (up to `10 MB`) in browser IndexedDB (`hems_abstract_files_idb`) + Firebase Storage (`abstracts/{year}/{id}/{file}`).
   - Synchronizes `/abstract-submission` and `/reviewer` immediately via both in-tab custom events and cross-tab `storage` events.
3. **Attendee Uploader (`/abstract-submission`) & Reviewer Evaluation (`/reviewer`):**
   - Attendee uploader captures Title, Presenting Author, Corresponding Email, Affiliation, Co-Authors, Presentation Format, Research Track, Plain-Text Abstract Synopsis, Student Travel Award Flag, and single-page PDF (`<= 10 MB`).
   - Reviewer Panel displays live KPIs, status/award filters, search, inline PDF preview (`View Abstract PDF`), and score/decision/feedback evaluation controls.

