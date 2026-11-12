# Google Cloud DNS + Google Workspace + Postmark Cutover Runbook (`@ops`)

This runbook documents the exact DNS records, Postmark stream settings, and Firebase Cloud Functions configuration to achieve maximum `.gov` / `.edu` inbox acceptance and `100%` `hems-workshop.org` URL trust when cutting over the domain.

---

## 1. Google Workspace for Nonprofits (`@hems-workshop.org` Officer Mailboxes)

1. Apply at `https://www.google.com/nonprofits/` using HEMS Society's IRS 501(c)(3) EIN (`$0/month` for eligible 501(c)(3) organizations).
2. Create officer mailboxes/aliases on `@hems-workshop.org` (e.g., `info@hems-workshop.org`, `awards@hems-workshop.org`).
3. Add the Google Workspace `MX` record (`SMTP.GOOGLE.COM`, priority `1`) and root `SPF` record on `hems-workshop.org`:
   ```txt
   Type: TXT
   Host: @
   Value: "v=spf1 include:_spf.google.com ~all"
   ```
4. Enable `2048-bit` Google Workspace DKIM in Google Admin Console (`Apps -> Google Workspace -> Gmail -> Authenticate email`) and publish the `google._domainkey` `TXT` record.

---

## 2. Postmark Subdomain Setup (`mail.hems-workshop.org`)

Sending bulk workshop announcements from `announcements@mail.hems-workshop.org` (`Reply-To: info@hems-workshop.org`) achieves strict organizational DMARC alignment with `hems-workshop.org` while isolating officer mailboxes from bulk-list reputation.

1. Create a Postmark Server (`HEMS Society`) with two standard streams:
   - **`outbound` (Transactional Stream):** Used for Double Opt-In confirmation emails.
   - **`broadcast` (Broadcast Stream):** Used for Workshop Announcements & Call for Papers blasts.
2. **CRITICAL — Disable Tracking in Both Streams (Maximizes `.gov` / `.edu` URL Trust):**
   - Open **Stream Settings** for both `outbound` and `broadcast`:
     - **Open Tracking:** `OFF` (`TrackOpens: false` is also enforced in code)
     - **Link Tracking:** `OFF / None` (`TrackLinks: "None"` is also enforced in code)
   - Every hyperlink inside your emails remains a direct `https://hems-workshop.org/...` link with zero redirect wrappers.
3. Add **`mail.hems-workshop.org`** under **Sender Signatures -> Add Domain** in Postmark and add the two DNS records Postmark provides into Google Cloud DNS:
   ```txt
   # 1. Postmark 2048-bit DKIM Signature
   Type: TXT
   Host: <selector>._domainkey.mail
   Value: "k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."

   # 2. Custom Return-Path (SPF Alignment on mail.hems-workshop.org)
   Type: CNAME
   Host: pm-bounces.mail
   Value: pm.mtasv.net.
   ```

---

## 3. Organizational DMARC Policy (`_dmarc.hems-workshop.org`)

Publish a DMARC record on `_dmarc.hems-workshop.org` (required by Gmail, Yahoo, Microsoft, and federal `.gov` gateways):

```txt
Type: TXT
Host: _dmarc
Value: "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@hems-workshop.org; adkim=r; aspf=r;"
```
*(Note: `adkim=r; aspf=r` allows subdomain `mail.hems-workshop.org` to align cleanly with `hems-workshop.org`; after 30 days of clean reports, you may tighten `p=quarantine` to `p=reject`.)*

---

## 4. Postmark Bounce & Spam-Complaint Webhook

In Postmark (`broadcast` and `outbound` streams -> **Webhooks -> Add Webhook**):
- **Webhook URL:** `https://hems-workshop.org/api/mailing/webhooks/postmark`
- **Custom HTTP Header:** `x-hems-webhook-secret: <YOUR_RANDOM_32_BYTE_SECRET>`
- **Triggers Checked:** `Bounce` and `Spam complaint`

This automatically suppresses hard-bounced `.edu`/`.gov` addresses and spam complaints in Firestore (`mailing_subscribers`).

---

## 5. Provision Secrets & Deploy Cloud Functions

Copy [`infrastructure/.env.postmark.example`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/.env.postmark.example) to `functions/.env` (git-ignored) or set via Firebase environment config, then deploy:

```powershell
firebase deploy --only firestore:rules,functions,hosting --project hems-workshop
```

