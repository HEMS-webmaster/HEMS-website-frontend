# Implementation Plan: Reviewer Panel `HEMS Fitness` + Confidential Notes & `Abstract Overview` Page

- **Date:** 2026-11-14
- **Roles:** `@arch`, `@dev`, `@web`
- **Target Scope:** Multi-reviewer evaluation model, Reviewer Panel updates, Abstract Overview portal page, and strict `Reviewer Portal` role navigation.

## Architecture & Security Decisions

1. **Multi-Reviewer Isolation (`reviews` collection + `hems_abstract_reviews_v1`):**
   - `firestore.rules` already gates `/reviews/{document}` exclusively to `isReviewerOrAdmin(request.auth.uid)` while `/abstract_submissions/{submissionId}` is readable by its submitting author.
   - Each reviewer evaluation (`AbstractReviewRecord`) is stored under deterministic ID `rev_${submissionId}_${sanitizedReviewerEmail}` containing `score` (`1.0–10.0`), `hemsFitness` (`1.0–10.0`), `decision`, `reviewerComments`, and confidential `privateNotes`.
   - `privateNotes` is **never** written to `abstract_submissions/{id}`.
   - `saveReview` upserts the current reviewer's record in `reviews` (preserving other reviewers' evaluations on the same abstract) and updates summary consensus metadata (`status`, consensus `decision`, `score`, `hemsFitness`, `reviewedBy`, `reviewedAt`, `updatedAt`) on `abstract_submissions/{id}`.

2. **Median Aggregation, Sorting & Track Grouping (`src/frontend/src/utils/abstractReviewMetrics.ts`):**
   - Exact statistical median helper (`computeMedian`) for `Scientific Score`, `HEMS Fitness`, and `Combined Median` (`(score + hemsFitness) / 2` per review).
   - Recommendation tallies across all reviews (`Accept (Oral)`, `Accept (Poster)`, `Revision Requested`, `Decline`).
   - Scope-aware manual ordering (`reorderWithinScope` / `nudgeWithinScope`), score-based sorting with unreviewed abstracts placed at the bottom, and `Group by Track` grouping aligned with `RESEARCH_TRACK_OPTIONS`.

3. **Strict Reviewer Role Visibility:**
   - `/reviewer` and `/reviewer/overview` inherit `noindex, nofollow` metadata from `src/frontend/src/app/(portal)/reviewer/layout.tsx` and enforce `if (!user || !hasReviewerRole(user.roles))` in client guards.
   - Navigation entries in `src/frontend/src/app/(portal)/layout.tsx` and `src/frontend/src/components/layout/Navbar.tsx` are strictly gated by `hasReviewerRole(user.roles)`.

## Files Modified / Created

1. `docs/logs/thought_trace.md` (append-only SCoT trace)
2. `docs/plans/2026-11-14-reviewer-hems-fitness-and-abstract-overview.md` (this permanent plan document)
3. `src/frontend/src/types/abstractSubmission.ts` — Add `AbstractReviewRecord`, optional `hemsFitness` on `AbstractSubmissionRecord`, and `hemsFitness` + `privateNotes` + `reviewerName` on `SaveAbstractReviewInput`.
4. `src/frontend/src/utils/abstractReviewMetrics.ts` — Pure median calculation, recommendation summaries, manual order & score sorting, and Track grouping helpers.
5. `src/frontend/src/hooks/useAbstractSubmissions.ts` — Multi-reviewer `reviews` state/sync (`reviews` Firestore collection + `hems_abstract_reviews_v1`), seeded sample committee reviews across sample abstracts, confidential `privateNotes` isolation, and cleanup on withdrawal.
6. `src/frontend/src/app/(portal)/reviewer/page.tsx` — `HEMS Fitness` (1–10) input, confidential `Reviewer-Only Notes` textarea, per-reviewer evaluation state, median/review count badges, `?abstract=` deep-link focus, and `Abstract Overview` quick link.
7. `src/frontend/src/app/(portal)/reviewer/overview/page.tsx` — New `Abstract Overview` page under `Reviewer Portal` with tabulated median scores, recommendation summaries, clickable row summary drawer showing all reviews & reviewer-only notes, manual drag/button sorting, score sorting, `Group by Track` toggle, and 1-page abstract inspection modal.
8. `src/frontend/src/app/(portal)/layout.tsx` — Add `Abstract Overview` (`/reviewer/overview`) under `Reviewer Portal`.
9. `src/frontend/src/components/layout/Navbar.tsx` — Add `Abstract Overview` quick-link under `hasReviewerRole(user.roles)` in desktop popover and mobile drawer.

## Verification Checklist
- Run `Set-Location src/frontend; npx tsc --noEmit` and confirm exit code `0`.
- Verify live Next.js routes `http://localhost:3000/reviewer/` and `http://localhost:3000/reviewer/overview/` return HTTP `200` and contain expected compiled client markers (`HEMS Fitness`, `Reviewer-Only Notes`, `Abstract Overview`, `Group by Track`).
- Stage only task files explicitly and commit locally on `main`.

