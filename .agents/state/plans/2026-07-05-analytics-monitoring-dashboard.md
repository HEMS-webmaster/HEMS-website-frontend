# Implementation Plan: HEMS Free-Tier Analytics & Monitoring Dashboard

This plan details the implementation of a free-tier website analytics system using Cloud Firestore and Firebase Auth. It tracks user logins and document downloads, aggregating this data in a secure, administrative monitoring dashboard.

---

## User Review Required

> [!IMPORTANT]
> **Data Privacy & Security**:
> All tracked logins and downloads are bound to users who have registered and authenticated. The data displays in a secure dashboard accessible **only** to users holding the `admin` role. General users will not be able to read this collection or view other users' download statistics.

---

## Proposed Changes

### Event Tracking Infrastructure

#### [MODIFY] [AuthContext.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/context/AuthContext.tsx)
- Increment `loginCount` and set `lastLogin` (timestamp) inside the user's Firestore document (`/users/{uid}`) upon successful email/password or OAuth login.
- Add helper methods to handle mock authentication increments for local development fallback.

#### [MODIFY] [DownloadGate.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx)
- Intercept successful downloads:
  - Increment the active user's document `downloadCount` in Firestore.
  - Increment the file's record in a new `/downloads/{fileId}` collection (using Firestore's `fieldValue.increment(1)`).
  - Store file metadata: `fileName`, `workshopYear`, `category`, and `lastDownloaded` timestamp.

---

### Administrative Analytics Panel

#### [NEW] [admin/analytics/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/admin/analytics/page.tsx)
- Create a data-rich monitoring dashboard gated strictly to users with the `admin` role.
- **Top Metric Cards**:
  - Total Registered Users
  - Total Logins (Sum of all user login counts)
  - Total Downloads (Sum of all file download counts)
- **User Activity Table**: Lists displayName, email, loginCount, downloadCount, and lastLogin timestamp.
- **File Downloads Leaderboard**: Lists filename, downloadCount, lastDownloaded timestamp, category, and workshop year.
- **Mock Fallback**: Implements fake metrics and data if Firestore environment variables are not configured locally.

#### [MODIFY] [Navbar.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) (or similar navigation files)
- Add a direct link to "Website Analytics" under the Admin navigation menu options.

---

### Database Security Rules

#### [MODIFY] [firestore.rules](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules)
- Add read/write rules for `/downloads`:
  - Writes: Authenticated users can increment download counts.
  - Reads: Gated strictly to authenticated users with `admin` role.
- Add read rules for `/users`:
  - Allow read-all query access strictly to users with `admin` role (needed to compile the user activity table).

---

## Verification Plan

### Automated Tests
- Verify successful static production builds:
  ```powershell
  npm run build
  ```

### Manual Verification
1. **Login Increment**: Sign in as a test user, and verify that the user's `loginCount` increments by 1 in the `/users/{uid}` collection.
2. **Download Increment**: Click download on a presentation, and verify that `/users/{uid}/downloadCount` is incremented, and a `/downloads/{fileId}` document is created or updated.
3. **Admin Gates**: Log in as a non-admin, try to navigate to `/layout-portal/admin/analytics`, and verify that the page shows an Access Denied message.
4. **Analytics Visuals**: Log in as an admin, navigate to the analytics dashboard, and verify that total counters, user tables, and download leaderboards load and display accurately.
