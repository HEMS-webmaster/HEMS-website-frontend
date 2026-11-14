# Implementation Plan: Workshop Portal Left-Sidebar Categories & Strict Per-Role Webpage Visibility

**Date:** 2026-11-14  
**Requested By:** `@bo` (`@web`, `@dev`)

## Goal & Architectural Summary
Restructure the Workshop Portal navigation (`src/frontend/src/app/(portal)/layout.tsx`), global Navbar quick-links (`src/frontend/src/components/layout/Navbar.tsx`), role helpers (`src/frontend/src/utils/telemetryClient.ts`), and portal webpage guards so each portal category and its contained webpage(s) are strictly visible and accessible only to signed-in members holding that specific role status:

1. **Workshop Portal** (public, `requiredRole: null`): `Overview` (`/layout-portal`), `Call for Papers` (`/call-for-papers`), `Registration` (`/registration`), `Accommodations` (`/accommodations`), `Corporate Sponsorship` (`/corporate-sponsorship`), `Student Travel Awards` (`/student-awards`).
2. **Attendee Portal** (renamed from `"Attendees"`, visible ONLY when `hasAttendeeRole(user.roles)`):
   - `Abstract Submission` (`/abstract-submission`)
3. **Reviewer Portal** (new category extracted from `Board Portal`, visible ONLY when `hasReviewerRole(user.roles)`):
   - `Reviewer Panel` (`/reviewer`)
4. **Board Portal** (visible ONLY when `hasBoardRole(user.roles)` — requires `board` role status; `admin` or `reviewer` alone does not grant Board Portal visibility):
   - `Mailing List` (`/board/mailing-list`)
   - `Announcements` (`/board/announcements`)
   - `Website Analytics` (`/admin/analytics`)
5. **Admin Portal** (new category extracted from `Board Portal`, visible ONLY when `hasAdminRole(user.roles)`):
   - `Admin` (`/admin`)

## Affected Files
- [telemetryClient.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/telemetryClient.ts)
- [layout.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx)
- [Navbar.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx)
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/mailing-list/page.tsx)
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/announcements/page.tsx)
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/analytics/page.tsx)
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/page.tsx)
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/reviewer/page.tsx)

## Verification Plan
1. Run `npx tsc --noEmit` in `src/frontend` (`EXIT_CODE=0`).
2. Verify HTTP `200` across `/layout-portal/`, `/abstract-submission/`, `/reviewer/`, `/board/mailing-list/`, `/board/announcements/`, `/admin/analytics/`, and `/admin/` plus compiled JS chunk markers on `http://localhost:3000`.
3. Run interactive browser role-isolation verification across logged-out, `General User`, `Attendee`, `Reviewer Only`, `Board Member`, `Admin Only`, and `All Portals`.
4. Commit only the 10 task files locally on `main` (do not push).

