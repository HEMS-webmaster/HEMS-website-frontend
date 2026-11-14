# Implementation Plan: Presenter Overview Stage, Multi-Draft Management, Firestore Rules & Google Sheets Deadline (Date + Time + Timezone)

**Date:** 2026-11-13  
**Agents:** `@ops`, `@web`, `@dev`, `@arch`  
**Target Domain:** Abstract Submission Portal (`/abstract-submission`), Reviewer Panel (`/reviewer`), Firebase Security Rules (`firestore.rules`), and Workshop Control Center Google Sheet (`186ouD9WrOQ8tV2z4VkCOSIDJ80Uc1aCm4Dcsy99plx0`).

---

## 1. Architecture Summary

1. **Firestore Security Model (`firestore.rules`):**
   - Introduce `isReviewerOrAdmin(userId)` and `isAttendee(userId)` role helpers inspecting both `users/{userId}` and `whitelist/{email}` (case-normalized variants).
   - Add `match /abstract_drafts/{draftId}` allowing owner CRUD (`uid == request.auth.uid`), safe `resource == null` `get`, and UID-scoped `list` queries (`where("uid", "==", uid)`).
   - Add `match /abstract_submissions/{submissionId}` allowing attendee/reviewer/admin creation, owner/reviewer/admin reads (`where("submittedByUid", "==", uid)` for attendees, full collection read for reviewers/board/admins), owner updates prior to review/resetting to `Pending`, reviewer review-scoring updates, and owner/admin deletion.
   - Deploy rules directly to `hems-workshop` using `npx firebase deploy --only firestore:rules`.

2. **Google Sheets Deadline Schema (Date + Time + Timezone):**
   - Extend `1_Workshop_Config` (`cfp_abstract_deadline_time`, `cfp_abstract_deadline_timezone`), `2_Website_Ingestion_Checklist`, local CSV templates (`docs/workshop-sheets/`), and `upcoming_workshop.json`.
   - Upgrade `src/frontend/src/utils/upcomingWorkshop.ts` with `AbstractDeadlineEvaluation`, `formatAbstractDeadlineDisplay()`, and `evaluateAbstractDeadline()` to parse ISO/US/written dates, 12h/24h times, and UTC/GMT offsets, abbreviations (`EDT`, `EST`, `PDT`, `AoE`, etc.), or IANA timezones.
   - Propagate formatted Date + Time + Timezone deadline displays to `/abstract-submission`, `/call-for-papers`, `/layout-portal`, and Printable Formatting Guidelines.

3. **Multi-Draft & Submission Editing Hooks:**
   - Upgrade `AbstractDraftRecord` (`draftId`, `createdAt`, `updatedAt`) and `useAbstractDraft.ts` to support multiple independent drafts per user/year (`hems_abstract_drafts_v2:...`), migrating any legacy v1 single draft automatically while cloning IndexedDB graphics cleanly on `duplicateDraft` and `createDraftFromSubmission`.
   - Update `useAbstractSubmissions.ts` to scope Firestore queries by `submittedByUid` for attendees, and add `updateSubmission()` plus `getSubmissionGraphicAsset()` so existing submissions can be edited in place or cloned into drafts cleanly.

4. **Presenter Overview Stage (`AbstractSubmissionClient.tsx`):**
   - Make `viewMode = "overview"` the landing hub (`Presenter Overview`) featuring:
     - Live Deadline Banner showing **Date**, **Time**, and **Timezone** plus Open / Closed status badge.
     - `+ Create New Submission` primary action (gated at deadline cutoff).
     - **Submission Drafts** list with **Edit**, **Copy**, and **Delete** per draft.
     - **Submitted Abstracts** list with **Preview** (always enabled), **Edit** (up to deadline), **Copy** (up to deadline), and **Delete** (up to deadline).
   - Add `← Presenter Overview` navigation and context banner inside the 7-stage editor (`Draft Mode` vs. `Editing Submitted Abstract ABS-...`), enforcing `evaluateAbstractDeadline` at submit/update time.

---

## 2. Verification Gates

1. `npx firebase deploy --only firestore:rules` completes without compilation or deployment errors.
2. `npm --prefix src/frontend run sync:workshop` completes without error.
3. `Set-Location src/frontend ; npx tsc --noEmit` exits with code `0` and zero TypeScript errors.
4. Dev server returns HTTP `200` on `/abstract-submission/`, `/reviewer/`, `/call-for-papers/`, and `/layout-portal/`.

