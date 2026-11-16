# Implementation Plan — Addendum 36: Security & Abuse-Limits Hardening Pack (Public Scholar GCS Preserved)

**Date:** 2026-11-16  
**Leads:** `@ops` (Firestore rules, Cloud Functions hardening, rate limits) + `@dev` (`AuthContext.tsx` alignment) + `@arch` (governance) + `@qa` (verification)  
**Constraint:** Keep `gs://hems-workshop-archives` and public Google Scholar PDF URLs 100% public and untouched.

## Hardening Pillars

1. **Identity & Anti-Spoofing Role Gate (`Finding #1`)**
   - Enforce `hasVerifiedAuthEmail()` (`email_verified == true` OR trusted OAuth provider `google.com` / `microsoft.com`) before granting any privileged `whitelist/{email}` or `webmaster@hems-workshop.org` role in `firestore.rules`, `functions/src/index.ts`, `functions/src/mailing.ts`, `functions/src/registration.ts`, and `functions/src/telemetry.ts`.
   - Bind `users/{userId}` `create` strictly to `request.auth.token.email.lower()` and lock `users/{userId}` `update` so `email` cannot be reassigned after creation.
   - Align `src/frontend/src/context/AuthContext.tsx` so unverified Email+Password registrations write `roles: ['general']` and hold empty portal permissions until email verification (`reloadUser()` forces a fresh ID token with `email_verified: true`).

2. **Firestore Schema, Counter Integrity, & Read Protection**
   - Require `hasVerifiedAuthEmail()` on email-matched reads in `abstract_submissions` and `workshop_registrations`.
   - Lock `whitelist/{document}` `allow get` so unverified accounts cannot probe officer emails or role arrays.
   - Restrict `downloads/{document}` to exact keys (`fileName`, `downloadCount`, `lastDownloaded`, `category`, `workshopName`), bounded string lengths, `downloadCount == 1` on `create`, and exact `+1` increments on `update`.
   - Enforce bounded field lengths on all remaining optional/string fields in `mailing_public_requests` and `telemetry_events`.
   - Deny all client access (`allow read, write: if false`) on `rate_limits/{bucketId}`.

3. **Compute Ceilings (`maxInstances`) & Privacy-Preserving Rate Limiting**
   - Introduce `functions/src/rateLimit.ts` combining fast L1 per-instance memory buckets with atomic L2 Firestore `rate_limits/{bucketId}` counters.
   - Hash client IPs and target email identifiers with UTC-daily salts via SHA-256 (`28` hex chars) so **zero raw personal IP addresses or emails are stored**.
   - Apply `maxInstances` caps (`2`–`5`), `256MiB` memory ceilings, and `15s`–`300s` timeouts across all Cloud Functions (`mailing*`, `contactInquiry`, `telemetryEvent`, `registration*`, `sync*`), plus timing-safe secret comparisons (`crypto.timingSafeEqual`) for Postmark webhook secrets and registration receipt tokens.

4. **Google Scholar Preservation**
   - Leave `gs://hems-workshop-archives`, `infrastructure/storage.rules`, `src/frontend/public/archives-index.json`, `llms-full.txt`, `src/frontend/src/app/archive/**`, and `src/frontend/src/data/archives/**` completely untouched.
