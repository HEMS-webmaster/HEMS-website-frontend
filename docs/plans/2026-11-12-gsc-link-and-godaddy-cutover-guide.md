# Google Search Console Link & GoDaddy Domain Porting Guide Plan

**Date:** 2026-11-12  
**Authors:** `@arch`, `@ops`, `@dev`  
**Scope:** Add Google Search Console quick-launch card to `/admin/analytics` and author a standalone, interactive HTML cutover runbook (`docs/domain_porting_guide.html`) tailored to `hems-workshop.org`'s live GoDaddy DNS state.

---

## 1. Live GoDaddy DNS Audit Findings (`hems-workshop.org`)
- **Nameservers:** `ns33.domaincontrol.com` / `ns34.domaincontrol.com` (stay on GoDaddy DNS; do not change nameservers).
- **Apex `A` (`@`):** `192.124.249.10` (`TTL: 30s`) — GoDaddy Website Security / Sucuri WAF IP. Must disable Sucuri WAF proxy and remove `192.124.249.10` so Firebase Hosting Let's Encrypt ACME SSL provisioning succeeds.
- **`www` `CNAME`:** Currently `www.hems-workshop.org -> hems-workshop.org`. Because `SITE_URL` across all Next.js canonicals, `sitemap.xml`, `robots.txt`, and JSON-LD is `https://www.hems-workshop.org`, `www.hems-workshop.org` must be added in Firebase Hosting as the **Primary** domain and `hems-workshop.org` added as a **301 Redirect to `www.hems-workshop.org`**.
- **Email & Verification Records (`MUST KEEP`):**
  - `MX`: `smtp.google.com` (Priority `1`) — active Google Workspace officer email.
  - `TXT`: `google-site-verification=FsDtU72CA50Yr3tK7g1ZbNYwSiGKqXng0LU3MIijH5Y` — active Google Search Console verification token.
- **Email SPF Mismatch Uncovered:** Current `TXT` is `v=spf1 include:secureserver.net -all` (legacy GoDaddy hard-fail without `_spf.google.com`). Guide includes instructions to edit this record in-place to `v=spf1 include:_spf.google.com ~all` without creating duplicate `v=spf1` records.

---

## 2. Full GoDaddy Exit & Live `.org` Registry (PIR RDAP) Findings
- **Google Registrar Reality Check:** Retail Google Domains (`domains.google`) transitioned to **Squarespace Domains**, and Google Cloud permanently removed inbound domain transfers (`registrations:transfer`) from **Google Cloud Domains** (verified via `gcloud domains registrations --help`).
- **How to Achieve 100% Google DNS Operations + Zero GoDaddy Logins Forever:**
  1. **Authoritative DNS -> Google Cloud DNS (`hems-workshop` GCP Project):** Host the entire `hems-workshop.org` zone inside Google Cloud Console (`console.cloud.google.com/net-services/dns/zones?project=hems-workshop`, ~\$0.20/mo) on `ns-cloud-*1..4.googledomains.com` so 100% of DNS, Firebase Hosting, Storage, and Cloud Functions live in one Google Cloud project.
  2. **ICANN `.org` Registrar -> Google-SSO Set-and-Forget Registrar:** Transfer the `.org` domain registration out of GoDaddy (using Google Workspace SSO + Auto-Renew or multi-year registration) to **Squarespace Domains** (official `domains.google` successor) or **Porkbun** (up to 10-year pre-paid `.org` registration), keeping custom nameservers pointed at Google Cloud DNS. *(Explicitly avoid Cloudflare Registrar if using Google Cloud DNS, as Cloudflare locks nameservers to `*.ns.cloudflare.com`.)*
- **Urgent PIR RDAP Timing (`hems-workshop.org`):**
  - **Expires:** `2026-12-11T19:26:46Z` (**Dec 11, 2026** — <30 days away!). Transferring out *before* GoDaddy runs pre-expiration auto-renewal avoids GoDaddy renewal fees and the ICANN 45-day auto-renew clawback rule while extending registration to `2027-12-11+`.
  - **Locks & DNSSEC:** Last changed `2026-08-12` (>90 days -> no 60-day ICANN lock); `clientTransferProhibited` currently ON (toggle Domain Lock OFF in GoDaddy); `delegationSigned: false` (DNSSEC OFF -> clean nameserver delegation).
- **Mandatory Zero-Downtime Sequence:** Pre-populate Google Cloud DNS zone -> switch GoDaddy Nameservers to `ns-cloud-*.googledomains.com` FIRST -> THEN unlock & submit EPP transfer code (because ICANN freezes nameserver changes while `pendingTransfer` is active!) -> click **Approve Transfer** in GoDaddy `Transfers Out` to finish in ~15–30 minutes and close GoDaddy permanently.

---

## 3. Deliverables
1. **`src/frontend/src/app/(portal)/admin/analytics/page.tsx` (`@dev`):** Expand the external console bar into a 3-column grid featuring **Google Analytics 4** (`G-F06RZ8L5CR`), **Google Search Console** (`https://search.google.com/search-console`), and **Website Authority Checker** (`https://ahrefs.com/website-authority-checker/?input=www.hems-workshop.org`).
2. **`docs/domain_porting_guide.html` (`@ops` / `@arch`):** Self-contained, printable HTML cutover & full GoDaddy exit runbook with interactive Path switcher (**Path A: Complete GoDaddy Exit -> Google Cloud DNS + Registrar Transfer** default; **Path B: Temporary DNS-Only Cutover on GoDaddy**), `gcloud dns` automation commands, Cloud DNS RRset/trailing-dot rules, PIR RDAP expiration alert (`Dec 11, 2026`), and GoDaddy fast-release transfer steps.

