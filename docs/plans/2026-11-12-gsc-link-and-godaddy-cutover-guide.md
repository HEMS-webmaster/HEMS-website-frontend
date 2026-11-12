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

## 2. Deliverables
1. **`src/frontend/src/app/(portal)/admin/analytics/page.tsx` (`@dev`):** Expand the external console bar into a 3-column grid featuring **Google Analytics 4** (`G-F06RZ8L5CR`), **Google Search Console** (`https://search.google.com/search-console`), and **Website Authority Checker** (`https://ahrefs.com/website-authority-checker/?input=www.hems-workshop.org`).
2. **`docs/domain_porting_guide.html` (`@ops` / `@arch`):** Self-contained, printable HTML cutover checklist with one-click copy buttons, live GoDaddy DNS before/after comparison table, 8 pitfall warnings (Sucuri WAF, canonical redirect direction, Firebase Auth Authorized Domains, SSL minting window, GoDaddy Forwarding tab, MX/GSC preservation, SPF fix, and legacy `*WS/` academic links), and post-cutover verification steps.

