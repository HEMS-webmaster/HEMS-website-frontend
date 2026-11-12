# Dual Online & Email Inquiry Submission Plan (`/contact` + Board Inbox)

**Date:** 2026-11-12  
**Owners:** `@arch`, `@ops`, `@dev`, `@qa`  
**Approved Override:** `@bo` (`locksrules.md` Rule #6 granted)

## 1. Problem Statement
On `/contact` (**Compose an Inquiry**), relying solely on `window.location.href = "mailto:..."` fails silently whenever a visitor uses browser-based webmail (Gmail / Google Workspace / Outlook Web) without an OS-level default mail app or Chrome `mailto:` protocol handler registered.

## 2. Solution Architecture
1. **Side-by-Side Dual Submission Controls (`src/frontend/src/components/workshop/ContactClient.tsx`):**
   - **Primary Button — `Submit Online`:** Submits the form directly over HTTPS with zero local email app required:
     1. Calls `POST /api/contact/inquiry` (`contactInquiry` Cloud Function in `functions/src/mailing.ts`).
     2. Automatically falls back to the write-only Firestore `mailing_public_requests` collection (`type: "contact_inquiry"`) on `localhost` or static preview channels (and local buffer if rules aren't redeployed yet).
   - **Secondary Button — `Open in Email App`:** Launches the pre-addressed `mailto:` draft to `president@hems-workshop.org`, `tim.short@hems-workshop.org`, or `webmaster@hems-workshop.org`, and surfaces instant **Open in Gmail Web** and **Copy Message** fallback actions if no desktop mail app opens.
2. **Postmark Officer Forwarding (`functions/src/mailing.ts`, `functions/src/index.ts`, `firebase.json`):**
   - `contactInquiry` stores the inquiry in `mailing_public_requests` and, when `POSTMARK_SERVER_TOKEN` is active, immediately dispatches a zero-tracking (`TrackOpens: false`, `TrackLinks: "None"`) transactional email to the target `@hems-workshop.org` officer with `ReplyTo` set to the sender's email address.
3. **Board Panel Website Inquiries Inbox (`src/frontend/src/app/(portal)/board/page.tsx`):**
   - Displays online inquiries from `mailing_public_requests` (`type == "contact_inquiry"`) so Board Members can read messages, click to reply via Email App or Gmail Web, and mark inquiries resolved.
4. **Firestore Security Rules (`firestore.rules`):**
   - Expands `mailing_public_requests` schema validation to allow `type == 'contact_inquiry'` with bounded `subject`, `message` (`<= 5000` chars), and `recipientEmail`, while keeping `mailing_public_requests` strictly unreadable to the public (`allow read, update, delete: if isBoardOrAdmin`).

