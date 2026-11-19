# Phase 30 Architectural Plan: Reviewer Workflow Overhaul, Dense Selection & Email Triage, Real-Time Conflict Resolution, and Extended Program Export

**Date:** 2026-11-19  
**Authors:** `@arch`, `@dev`, `@qa`  
**Status:** Executing  

---

## 1. Objectives & User Requirements

1. **Reviewer Panel & Attendee Submission Track Alignment (`/reviewer`, `/abstract-submission`):**
   - Identify **Corporate** (`Corporate / Industry / Sponsor`) and **Student** (`Student Presenter` / `Student Travel Award`) submissions unmistakably across Reviewer Panel, Abstract Overview, and Schedule Builder.
   - Add `Miscellaneous` to `RESEARCH_TRACK_OPTIONS` across the Attendee submission wizard (`AbstractSubmissionClient.tsx`), drafts (`useAbstractDraft.ts`), keyword suggestions (`keywordExtractor.ts`), and Reviewer evaluation controls.
   - Add reviewer-modifiable **`Recommended Track`** inside the individual reviewer evaluation form so committee members can re-route an abstract to a better-fitting track (or `Miscellaneous`), reflected immediately via consensus in Overview & Schedule Builder.
   - Eliminate vertical card whitespace on `/reviewer` by switching from constrained side-by-side splits to a compact full-width card header/body/action footer layout.
   - Add a **conditionless, reversible `Completed` button** on every abstract card that enables/disables `Edit Evaluation` cleanly without injecting fake numeric scores, while allowing unlimited re-editing at any time once toggled back open.

2. **Information-Dense Abstract Overview, Selection, HEMS Response Popup & Multi-Reviewer Sync (`/reviewer/overview`):**
   - Maximize information density with compact table cells (`px-2 py-1.5`), concise header KPI strip, and Cohort/Selection filter pills.
   - Add an official **`Selection`** dropdown column (`Accept to Oral`, `Accept to Poster`, `Decline`, or unselected) cleanly decoupled from individual reviewer recommendation tallies.
   - Add a **`HEMS Response`** column next to `Selection` with an **`Email`** popup button displaying two editable, copy-ready boxes (`Formatted Email Address` + `Prepared HEMS Response Body`) with one dedicated copy button each, pre-populated with a warm, professional HEMS committee message tailored to the selected decision and Unicode/plain-scientific formatting (`toPlainScientificText`).
   - Provide live real-time updates (`onSnapshot` on Firestore `abstract_submissions`, `reviews`, and `workshop_schedules`, plus `BroadcastChannel` for same-origin local tabs) and optimistic-concurrency **`selectionVersion` + Firestore `runTransaction`** conflict detection with a 1-click resolution modal (`Keep Colleague's Selection` vs. `Override with My Selection`).

3. **Schedule Builder & Extended Program Export (`/reviewer/schedule`):**
   - Restrict the Schedule Builder candidate sorter strictly to officially selected abstracts (`accept_oral` for Oral Talks, `accept_poster` for Poster Directory), automatically excluding `pending` and `decline` abstracts.
   - Support customizable **`Miscellaneous` category naming** (`miscellaneousCategoryTitle`) and 1-click grouping of Miscellaneous talks into their own dedicated session.
   - Ensure standard Program exports (PDF & `.docx`) start with the chronological conference schedule containing technical sessions plus both **accepted oral titles** and **accepted poster titles**.
   - Add **`Extended Program`** exports (PDF & `.docx`) that begin with the exact same schedule at the top, followed by every selected oral and poster abstract separated by explicit **page breaks** (`doc.addPage()` in PDF, `<w:br w:type="page"/>` in OpenXML `.docx`).

---

## 2. File Inventory

- `src/frontend/src/types/abstractSubmission.ts` — `PresenterCategory`, `PRESENTER_CATEGORY_OPTIONS`, `CommitteeSelection`, `"Miscellaneous"` track, nullable review scores & `isCompleted`/`recommendedTrack`.
- `src/frontend/src/utils/keywordExtractor.ts` — `"Miscellaneous"` keyword fallback entries.
- `src/frontend/src/utils/abstractReviewMetrics.ts` — `classifySubmissionCohort`, `resolveOfficialSelection`, `resolveEffectiveTrack`, `findReviewerEvaluation`, completed-only scoring safety.
- `src/frontend/src/utils/hemsResponseEmail.ts` — `buildHemsResponseEmail` formatter.
- `src/frontend/src/hooks/useAbstractSubmissions.ts` — v4 storage key + corporate/Misc sample seed (`ABS-2027-004`), real-time `onSnapshot` + `BroadcastChannel`, `toggleReviewCompleted`, and transactional `updateCommitteeSelection` with `SelectionConflictInfo`.
- `src/frontend/src/hooks/useAbstractDraft.ts`, `AbstractSubmissionClient.tsx`, `AbstractOnePagePreview.tsx` — Presenter category selector & `"Miscellaneous"` track support.
- `src/frontend/src/app/(portal)/layout.tsx`, `reviewer/page.tsx`, `reviewer/overview/page.tsx` — Layout compaction, Reviewer Panel, Dense Overview, `HEMS Response` modal, Conflict modal.
- `src/frontend/src/utils/conferenceScheduleBuilder.ts`, `hooks/useConferenceSchedule.ts`, `utils/scheduleExportPdf.ts`, `utils/scheduleExportDocx.ts`, `reviewer/schedule/page.tsx` — Selected-only sorter, customizable `Miscellaneous` category, real-time schedule sync, Extended Program collectors & PDF/DOCX exporters.
- `tests/unit/conferenceScheduleBuilder.test.mjs`, `tests/unit/reviewerWorkflowAndExtendedProgram.test.mjs` — Comprehensive automated verification.
