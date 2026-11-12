# Architectural Plan: Postmark High-Deliverability Mailing List & Board Communications Suite

**Date:** 2026-11-12  
**Authors:** `@arch`, `@ops`, `@prod`, `@legal`  
**Execution Team:** `@ops`, `@dev`, `@qa`  
**Status:** Blueprint Ready — Awaiting Lock Override Confirmation (`firestore.rules`, `firebase.json`, `functions/src/index.ts`)

---

## 1. Architectural Overview

To achieve top-tier inbox placement at `.gov` (NASA, NRL, DOE National Labs, NOAA, EPA), `.edu` universities, and aerospace/corporate security gateways (*Proofpoint, Mimecast, Defender*), HEMS replaces Mailchimp with a **Firebase + Postmark** architecture designed around zero URL rewriting and strict cryptographic alignment:

1. **Subdomain Reputation Isolation:** Bulk workshop announcements send from `announcements@mail.hems-workshop.org` (`Reply-To: info@hems-workshop.org`) via Postmark's **Broadcast Stream**, while Double Opt-In confirmations send via Postmark's **Transactional Stream**.
2. **Maximum URL Trust (`TrackLinks: "None"`, `TrackOpens: false`):** Zero link-shortening/tracking redirects and zero `1×1` open-tracking spy pixels. Every URL in every email points directly to `https://hems-workshop.org/...`.
3. **Mandatory Bulk-Sender & CAN-SPAM Compliance:**
   - Every broadcast includes `RFC 8058` one-click headers (`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`) pointing to `https://hems-workshop.org/api/mailing/one-click-unsubscribe?token=...`, plus a human zero-login preference page (`https://hems-workshop.org/unsubscribe/?token=...`).
   - Every email sends as `multipart/alternative` (clean scholarly HTML letterhead + complete `text/plain` body + 501(c)(3) physical mailing footer).
   - Postmark Bounce & Spam-Complaint webhooks automatically flip hard-bounced or complaining addresses to `bounced` / `complained` in Firestore so dead `.edu` addresses are never mailed twice.

---

## 2. Firestore Data Model & Security Rules ([`firestore.rules`](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules))

1. **`mailing_subscribers/{emailKey}`**
   - `email` (lowercase trimmed), `firstName`, `lastName`, `affiliation`, `interests` (`["workshop" | "student_awards" | "sponsorship"]`), `status` (`"pending_opt_in" | "active" | "unsubscribed" | "bounced" | "complained"`), `source` (`"website" | "mailchimp_import" | "board_manual"`), `unsubscribeToken` (random 256-bit hex), `optInToken`, `createdAt`, `updatedAt`, `confirmedAt`, `unsubscribedAt`, `bounceReason`.
   - **Access:** Read/write restricted to authenticated `board` and `admin` users (`firestore.rules`), plus Cloud Functions Admin SDK for public double-opt-in, one-click unsubscribe, and Postmark webhooks.
2. **`mailing_public_requests/{requestId}`** *(Sandbox/Preview Fallback Queue)*
   - Allows validated public signup/unsubscribe requests (`create` only, strict field/size validation in `firestore.rules`, unreadable publicly) so public forms work immediately on `preview-2027` even before Cloud Functions secrets (`POSTMARK_SERVER_TOKEN`) are provisioned, and can be reviewed/synced by Board members.
3. **`mailing_campaigns/{campaignId}`**
   - `subject`, `segment` (`"all" | "workshop" | "student_awards" | "sponsorship"`), `markdownBody`, `htmlBody`, `textBody`, `status` (`"draft" | "test_sent" | "sent" | "sandbox_logged"`), `recipientCount`, `deliveredCount`, `failedCount`, `createdByEmail`, `createdAt`, `sentAt`, `postmarkStream` (`"broadcast"`).
   - **Access:** Read/write restricted to `board` and `admin`.

---

## 3. Cloud Functions v2 & Hosting Rewrites ([`functions/src/index.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/index.ts), [`firebase.json`](file:///c:/AntigravityP1_2/HEMS-website/firebase.json))

1. **`mailingSubscribe` (`POST /api/mailing/subscribe`):** Validates email/honeypot, creates/updates `mailing_subscribers` with `status: "pending_opt_in"` (unless suppressed by `bounced`/`complained`), and dispatches a Double Opt-In confirmation email via Postmark Transactional Stream (`TrackOpens: false`, `TrackLinks: "None"`).
2. **`mailingConfirm` (`POST /api/mailing/confirm`):** Verifies `optInToken` and transitions `pending_opt_in` -> `active`.
3. **`mailingUnsubscribe` (`GET/POST /api/mailing/unsubscribe` & `POST /api/mailing/one-click-unsubscribe`):** Handles both `RFC 8058` automated mail-client `List-Unsubscribe=One-Click` POST requests and user-initiated unsubscribe / email-change requests on `/unsubscribe/`.
4. **`mailingWebhookPostmark` (`POST /api/mailing/webhooks/postmark`):** Authenticates webhook secret header and processes Postmark `Bounce` (`HardBounce`) and `SpamComplaint` events to suppress addresses automatically.
5. **`mailingSendCampaign` (`POST /api/mailing/send-campaign`):** Verifies Firebase Auth ID token (`board` or `admin` role), supports `mode: "test"` (sends `[TEST]` copy to the signed-in officer's email) and `mode: "broadcast"` (chunks up to 500 messages/batch to Postmark `/email/batch` on the `broadcast` stream with individualized `RFC 8058` unsubscribe tokens, `TrackOpens: false`, `TrackLinks: "None"`, and logs audit stats to `mailing_campaigns`). Gracefully reports `"sandbox"` mode when `POSTMARK_SERVER_TOKEN` is not yet set.

---

## 4. Website & Board Member UI (`@dev` — `src/frontend/src/`)

1. **Public Mailing List Signup & Unsubscribe:**
   - Reusable [`MailingListSignupCard.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/MailingListSignupCard.tsx) integrated into `/contact` ([`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx)), `/registration` ([`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx)), and [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx) link.
   - Zero-login `/unsubscribe` route ([`src/frontend/src/app/unsubscribe/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/unsubscribe/page.tsx) + `UnsubscribeClient.tsx`, marked `noindex, nofollow`) supporting 1-click confirmation (`?confirm=...`), 1-click unsubscribe (`?token=...`), and institutional email address updates.
2. **Signed-In Board Member Interfaces (Added to [`(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx) & linked from [`(portal)/board/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/page.tsx)):**
   - **`/board/mailing-list` (`Subscriber Directory & Mailchimp Importer`):**
     - Drag-and-drop / file-picker **Mailchimp CSV Importer** supporting standard Mailchimp exports (*Subscribed*, *Unsubscribed*, and *Cleaned/Bounced* CSVs) so historic unsubscribes and hard bounces remain suppressed (`@legal` CAN-SPAM safeguard).
     - Live search, segment/status filters (`Active`, `Pending Opt-In`, `Unsubscribed`, `Bounced`), manual subscriber add / status toggle, pending public signup sync, CSV backup export, and list-health metrics.
   - **`/board/announcements` (`Academic Announcement Composer & Audit Log`):**
     - Scholarly single-column announcement composer (Subject, Target Segment, Markdown-lite paragraph/link composer with live side-by-side **Academic Letterhead HTML Preview** + **Plain-Text Companion Preview**).
     - **URL Trust & Deliverability Pre-Flight Checker:** Automatically verifies all links use `https://`, checks for spam-trigger patterns (ALL-CAPS subjects, URL shorteners like `bit.ly` / `tinyurl`), and confirms unsubscribe footer presence.
     - **Two-Step Officer Safety Gate:** Requires clicking **"1. Send Test Copy"** before **"2. Dispatch to Active List (N)"** unlocks, followed by a confirmation dialog and a permanent campaign history log.

---

## 5. DNS & Postmark Cutover Runbook (`@ops`)

- Document exact Google Cloud DNS records (`SPF`, `2048-bit DKIM`, `Return-Path CNAME`, `DMARC`), Google Workspace for Nonprofits setup, Postmark Server/Stream settings (`TrackOpens: OFF`, `TrackLinks: None`), and Firebase Secret Manager commands in [`infrastructure/postmark-dns-cutover.md`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/postmark-dns-cutover.md) and environment templates in `infrastructure/.env.postmark.example`.

