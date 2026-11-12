# Workshop Portal & Board Portal Sidebar Navigation Plan

**Date:** 2026-11-12  
**Owners:** `@prod` (UX Spec), `@arch` (Blueprint), `@dev` (Implementation in `src/`), `@qa` (Build Verification)

## 1. Navigation Architecture (`src/frontend/src/app/(portal)/layout.tsx`)

### Subsection 1: `Workshop Portal` (Visible to all visitors, logged out or signed in)
1. **Overview** (`/layout-portal`)
2. **Call for Papers** (`/call-for-papers`)
3. **Registration** (`/registration`)
4. **Accommodations** (`/accommodations`)
5. **Corporate Sponsorship** (`/corporate-sponsorship` — moved into `(portal)` route group so sidebar persists; canonical URL unchanged)
6. **Student Travel Awards** (`/student-awards` — moved into `(portal)` route group so sidebar persists; canonical URL unchanged)

### Subsection 2: `Board Portal` (Visible when signed in with Board, Reviewer, or Admin role)
1. **Mailing List** (`/board/mailing-list`) — Active for Board Members & Admins
2. **Announcements** (`/board/announcements`) — Active for Board Members & Admins
3. **Website Analytics** (`/admin/analytics`) — Active for Board Members & Admins
4. **Reviewer Panel** (`/reviewer`) — Greyed out (`cursor-not-allowed`) unless `'reviewer'` is assigned in `whitelist/{email}` / user roles
5. **Admin** (`/admin`) — Greyed out (`cursor-not-allowed`) unless `'admin'` is assigned in `whitelist/{email}` / user roles

## 2. Route Cleanup & Continuity
- **Delete Obsolete `Board Panel` (`/board`):** Delete `src/frontend/src/app/(portal)/board/page.tsx` while keeping `src/frontend/src/app/(portal)/board/layout.tsx` (`noindex` wrapper for `/board/mailing-list` and `/board/announcements`).
- **Update Top Navigation (`Navbar.tsx`):** Replace `/board` mobile/profile links with direct `Board Portal` links (`/board/mailing-list`, `/board/announcements`, `/admin/analytics`) and sync `WORKSHOP_PORTAL_SUBLINKS`.
- **Preserve Online Contact Inquiries:** Surface any open `contact_inquiry` submissions conditionally at the top of `/board/mailing-list` via `useMailingAdmin.ts` so zero online `/contact` inquiries are orphaned after deleting `/board`.

