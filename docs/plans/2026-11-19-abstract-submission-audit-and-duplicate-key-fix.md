# Audit & Remediation Plan: End-to-End Abstract Submission Process & Duplicate Key (`ABS-2027-004`) Fix

**Date:** `2026-11-19`  
**Owner:** `@arch`, `@dev`, `@qa`, `@ops`  
**Status:** In Progress

---

## 1. Root Cause Analysis
1. **React Console Error (`Encountered two children with the same key, 'ABS-2027-004'` at `reviewer/page.tsx:712`):**
   - Previous schema (`v3`) seeded `ABS-2027-001`..`003`. An earlier test submission by a signed-in user received `ABS-2027-004`.
   - Adding a 4th corporate seed with `id: "ABS-2027-004"` in `v4` while migrating `legacyUserItems` via `[...legacyUserItems, ...INITIAL_SAMPLE_SUBMISSIONS]` without ID deduplication persisted two records sharing `id: "ABS-2027-004"` into `localStorage`.
2. **Additional Audit Findings Across the Submission Pipeline:**
   - **Cross-Browser ID Collisions:** Attendees query only `where("submittedByUid", "==", user.uid)`, so sequential `maxSeq + 1` ID generation produces duplicate `ABS-YYYY-NNN` IDs across separate attendees and causes Firestore `PERMISSION_DENIED` overwrites—previously swallowed silently by `try/catch`.
   - **Firestore `undefined` Property Crashes:** `mergeByIdNewestWins` and `updateSubmission` could produce `undefined` object keys (`hasLocalBlob: undefined`, `fileSizeBytes: undefined`), which Firestore rejects on `setDoc` / `tx.set`.
   - **Attendee Edit Clobbering Review Metadata + Missing Rule Guards:** `updateSubmission` reset `status`/`decision` and dropped `score`/`hemsFitness` without resetting `committeeSelection`; `firestore.rules` lacked owner-update/create locks on `hemsFitness`, `committeeSelection`, and `selectionVersion`.
   - **Operations Role Listing & Cross-Device Graphic Resilience:** `hasOperationsRole` was missing from `canListAll` in `useAbstractSubmissions.ts`; when Firebase Storage is unavailable, figures only in IndexedDB vanish across devices (`embeddedDataUrl` compact preview fallback + `AbstractOnePagePreview` metadata fallback needed); Stage 1 needed stricter email format check and corporate vs. student travel award consistency.

---

## 2. Implementation Architecture
- **`src/frontend/src/utils/abstractSubmissionIntegrity.ts` (New Pure Module):**
  - Moves `INITIAL_SAMPLE_SUBMISSIONS` (renumbering seed #4 to `ABS-2027-S04`) and `INITIAL_SAMPLE_REVIEWS` (`ABS-2027-S04`) into a dependency-free module.
  - Exports `dedupeSubmissionsById`, `dedupeReviewsById`, `stripUndefinedDeep`, and collision-proof `generateSubmissionId` (`ABS-${year}-${6-char unambiguous token}`).
- **`src/frontend/src/types/abstractSubmission.ts` & `src/frontend/src/hooks/useAbstractSubmissions.ts`:**
  - Adds `GraphicMetadata.embeddedDataUrl?: string`, self-heals polluted `localStorage` on every read, applies `stripUndefinedDeep` on every Firestore write, checks existence via `runTransaction` during `createSubmission` (rethrowing Firestore failures when `!isMock`), preserves existing review/selection fields on `updateSubmission`, includes `hasOperationsRole` in `canListAll`, and builds bounded compact `embeddedDataUrl` previews.
- **`src/frontend/src/hooks/useAbstractDraft.ts`, `AbstractSubmissionClient.tsx`, `AbstractOnePagePreview.tsx`, & `firestore.rules`:**
  - Draft deduplication + `stripUndefinedDeep`; Stage 1 email regex validation, corporate vs. student travel award mutual consistency, null-safe email filtering, empty-draft save guard, `graphicMeta` figure placeholder when `graphicUrl` is absent, and hardened `firestore.rules`.

---

## 3. Verification Gates
1. `src\frontend\node_modules\.bin\tsc.cmd -p src\frontend\tsconfig.json --noEmit` (`exit 0`).
2. `node --test tests/unit/abstractSubmissionAudit.test.mjs` + all 6 existing unit suites (`exit 0`).
3. `npm --prefix src/frontend run build` (`54/54` static routes, `exit 0`).
4. Live Chromium verification via `browser` subagent reproducing & healing duplicate `ABS-2027-004` state and running Stages 1–7 submission + Edit/Preview with **0 Console Errors**.
