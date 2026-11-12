# Site-Wide Official `@hems-workshop.org` Contact Channels Plan (`2026-11-12`)

## 1. Objective (`@bo` Directive)
1. **Postmark Tracking Policy (`@ops`):** Keep both **Open tracking** and **Link tracking** `Disabled` (`TrackOpens: false`, `TrackLinks: "None"`).
2. **Site-Wide Contact Channel Alignment (`@prod`, `@dev`, `@ops`):**
   - **General Enquiries:** `president@hems-workshop.org` (replaces `info@hems-workshop.org`)
   - **Website & Technical Troubles:** `webmaster@hems-workshop.org`
   - **Corporate Sponsorship Coordinator (Tim Short):** `tim.short@hems-workshop.org` (replaces `rtshort00@gmail.com`)

## 2. Updated Components & Data Files
1. **[`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx) (`/contact` — Direct Channels & Inquiry Form):**
   - **Direct Channels:**
     1. *General & Symposium Inquiries* → `president@hems-workshop.org`
     2. *Corporate Sponsorship & Billing (Tim Short)* → `tim.short@hems-workshop.org`
     3. *Website & Archive Support* → `webmaster@hems-workshop.org`
     4. *Upcoming Workshop Venue*
   - **Compose an Inquiry Form:** Routes *General Society Inquiry*, *Biennial Workshop & Registration*, and *Proceedings Archive & Citations* to `president@hems-workshop.org`; *Sponsorship & Billing Inquiries* (`?topic=sponsorship`) to `tim.short@hems-workshop.org`; and *Website & Technical Support* (`?topic=webmaster`) to `webmaster@hems-workshop.org`.
2. **[`upcoming_workshop.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/upcoming_workshop.json) & [`upcomingWorkshop.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/upcomingWorkshop.ts):**
   - Sets `sponsor_coordinator_email` to `tim.short@hems-workshop.org` (propagating automatically across `/corporate-sponsorship` and `/contact`), with runtime normalization of legacy `rtshort00@gmail.com` if still present in the Google Sheet CSV.
3. **[`seo.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/seo.ts):** Updates Schema.org `Organization.contactPoint` entries (`president@hems-workshop.org`, `tim.short@hems-workshop.org`, `webmaster@hems-workshop.org`, and `hemsworkshop@hems-workshop.org`).
4. **[`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx), [`auth/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/auth/page.tsx), & [`UnsubscribeClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/UnsubscribeClient.tsx):** Adds accessible `webmaster@hems-workshop.org` support links for website, login, or subscription issues.
5. **[`postmark-dns-cutover.md`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/postmark-dns-cutover.md) & [`.env.postmark.example`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/.env.postmark.example):** Aligns Google Workspace mailbox list and sets `POSTMARK_REPLY_TO=president@hems-workshop.org`.

