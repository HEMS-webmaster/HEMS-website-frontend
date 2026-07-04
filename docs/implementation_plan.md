# HEMS Gated PDF Access & Role-Based Access Control Infrastructure Plan

This plan details the implementation of a user registration and login system for the HEMS website. It enforces email/name collection before users can download archived presentations (using Option 2: Google-approved Paywall Structured Data for search engines and LLM indexing). It also establishes client-side and backend Role-Based Access Control (RBAC) using Firebase Authentication (including OAuth providers) and Cloud Firestore.

---

## User Review Required

> [!IMPORTANT]
> **Firebase Project Activation**:
> This infrastructure relies on **Firebase Authentication** (Email/Password and OAuth sign-in providers) and **Cloud Firestore**. You will need to enable these services in the [Firebase Console](https://console.firebase.google.com/) for the `hems-workshop` project.

> [!WARNING]
> **Role Assignment & Whitelist**:
> Upon registration, users default to the `['general']` role array unless their email matches a backend whitelist. Board members, reviewers, and website admins must be upgraded in the Firestore database console, via an admin utility, or matched against the pre-defined whitelist. Users can hold multiple roles simultaneously (e.g. `['board', 'reviewer']`).

---

## Open Questions

> [!IMPORTANT]
> **Design Decisions & Key Inquiries**:
> 1. **OAuth Providers**: Firebase supports many free OAuth providers (Google, Microsoft, GitHub, Apple). I propose we enable **Google** and **Microsoft**, as they cover the vast majority of professional and academic users. Does this selection work for you?
> 2. **OAuth Whitelist Integration**: When a user signs in via OAuth (e.g. Google), we get their email instantly. If their email is on the backend whitelist, we grant them their assigned roles. If it's not, they get `['general']` access. Do you agree with this flow?
> 3. **Mock Authentication**: For local development without Firebase connectivity, should we default to a local state auth system using `localStorage`? *(We suggest implementing this fallback to keep local dev fully functional).*
> 4. **Whitelist Synchronization**: When an admin updates the whitelist via the new Admin UI, do we want to implement a Firebase Cloud Function to automatically update the corresponding user's profile in the `/users` collection, or simply apply the whitelist roles client-side the next time they log in? *(Client-side on-login checks are simpler and keep us on the free Spark plan. Cloud Functions require a paid Blaze plan).*

---

## Proposed Changes

### Core Authentication & Database Setup

#### [NEW] [firebase.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/firebase.ts)
- Initializes the Firebase App, Firebase Authentication, and Cloud Firestore.
- Configures `GoogleAuthProvider` and `OAuthProvider` (for Microsoft).
- Reads configuration from standard environment variables (e.g. `NEXT_PUBLIC_FIREBASE_API_KEY`).
- Implements a local fallback mode if environment variables are missing, utilizing local state / `localStorage` to simulate authentication and role switching.

#### [NEW] [AuthContext.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/context/AuthContext.tsx)
- Provides global React context (`AuthContext`) and hook (`useAuth`).
- Manages registration, login (Email/Password, Google, Microsoft), logout, and password resets.
- Persists user profiles (name, email, registration date, and `roles` array) inside a Firestore `/users/{uid}` collection.
- Exposes roles: `general`, `submitter`, `attendee`, `reviewer`, `board`, `admin`. Users can have multiple roles stored as an array of strings.

#### [MODIFY] [layout.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx)
- Wraps the root layout in the global `AuthProvider` to make session state accessible across the entire application.

---

### Gated Archive Downloads (Option 2 Paywall Schema)

#### [MODIFY] [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx)
- Intercepts presentation and abstract PDF download clicks.
- If the user is logged in, downloads proceed normally.
- If not logged in, opens a clean, modern auth portal modal prompting them to sign in (via Email, Google, or Microsoft).
- Inject a JSON-LD paywall schema (`isAccessibleForFree: "False"`) to let Googlebot and LLMs index the full presentation slide text (compiled via `mock-pdf-chunks.json`), while hiding it from non-signed-in human users behind a blurred overlay.

#### [NEW] [auth/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/auth/page.tsx)
- A dedicated authentication page with clean, aesthetic tabs for "Sign In" and "Create Account".
- Includes "Sign in with Google" and "Sign in with Microsoft" social login buttons.
- Displays form errors clearly.

---

### Role-Based Access Control (RBAC) Panels

#### [MODIFY] [layout.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx)
- Adjusts sidebar links dynamically based on the logged-in user's roles array (e.g. showing "Reviewer Portal" to any user with `reviewer` or `admin` in their `roles` array).

#### [NEW] [board/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/page.tsx)
- Gated landing page for HEMS Board Members.
- Restricts access to users containing the `board` or `admin` role.

#### [NEW] [reviewer/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/reviewer/page.tsx)
- Gated landing page for Abstract Reviewers.
- Restricts access to users containing the `reviewer` or `admin` role.

---

### Admin UI & Whitelist Management

#### [MODIFY] [Navbar.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx)
- Conditionally render an "Admin" dropdown menu for users whose `roles` array includes `admin`.
- Include a link to the new "Whitelist Management" panel.

#### [NEW] [admin/whitelist/page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/whitelist/page.tsx)
- Create a secure UI for Website Admins to view and manage the system whitelist.
- Connects to a new `whitelist` collection in Firestore.
- Allows admins to add an email and assign an array of roles, edit existing entries, and delete entries.
- Implements a mock-mode for local development.

#### [MODIFY] [firestore.rules](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules)
- Add read/write security rules for the `/whitelist` collection, ensuring only authenticated users with the `admin` role can access or modify it.

---

## Verification Plan

### Automated Tests
- Verify compilation: `npm run build` to confirm static export excludes Auth dynamically while preserving fallback UI.

### Manual Verification
1. **OAuth Sign-in**: Click "Sign in with Google" on the auth page and verify a user document is created with the Google account's email and name, and a `roles` array.
2. **Whitelist Admin UI**: Log in as an admin and navigate to `/layout-portal/admin/whitelist`. Add a new test email to the whitelist with a specific role.
3. **Whitelist Application**: Sign in with the newly whitelisted email and verify the roles are automatically applied from the whitelist collection instead of defaulting to `general`.
4. **Gated PDFs**: Open `/archive/2002/` as an unauthenticated visitor, verify that clicking "Download PDF" opens the sign-in modal.
5. **Multiple Roles Check**: Verify that users with multiple roles in their array can see and access multiple portals (e.g. Reviewer and Board).
