# Implementation Plan: Legacy 301 Redirects, `hems-workshop.org` Pre-Authorization (`@ops`), & Archive Host Showcase Lock Review (`@arch` / `@prod`)

- **Date:** 2026-11-15
- **Custodians:** `@ops`, `@arch` (advisory input from `@prod`)
- **Project:** `hems-workshop` (`https://www.hems-workshop.org`)

---

## 1. Objectives & Pre-Cutover Priorities

1. **Permanent `301` Legacy URL Preservation ([`firebase.json`](../../firebase.json)):**
   - Prevent broken `404` citations across `.edu`, `.gov`, and Google Scholar links referencing legacy HEMS folders (`/1stWS/...` through `/15thWS/...`, `/12thWS_EUROHEMS/...`), legacy HTML pages (`/15thWS/15thCorp_Sponsors.html`, `/15thWS/15thstudenttravel.html`, `/aboutus.html`, etc.), and `/Logos/HEMSLogo3.jpg`.
   - Avoid `/index.html` redirect rules so Firebase Hosting's static directory index resolution never enters a redirect loop, and preserve trailing slashes matching `trailingSlash: true` in [`next.config.ts`](../../src/frontend/next.config.ts).
2. **Idempotent Pre-Authorization Script ([`preauth-domain.ps1`](../../infrastructure/preauth-domain.ps1)):**
   - Both `gcloud` and `firebase-tools` on this workstation are configured for `webmaster@hems-workshop.org`, but cached OAuth refresh tokens require an interactive browser re-login (`gcloud auth login` / `firebase login --reauth`).
   - Provide an idempotent PowerShell automation script supporting `-DryRun` and `-SkipCloudDns` to:
     1. Ensure `"www.hems-workshop.org"` and `"hems-workshop.org"` are included in Firebase Auth `authorizedDomains` (`identitytoolkit.googleapis.com`).
     2. Pre-register `www.hems-workshop.org` (Primary) and `hems-workshop.org` (301 redirect to `www`) in Firebase Hosting (`firebasehosting.googleapis.com/v1beta1`) and inspect exact `TXT` verification and Anycast `A` IP values.
     3. Stage public zone `hems-workshop-org` (`hems-workshop.org.`) in Google Cloud DNS with exact trailing dots (`@ A 199.36.158.100`, `www CNAME hems-workshop.web.app.`, `@ MX 1 smtp.google.com.`, combined `@ TXT` holding Google Site Verification + Firebase verification + fixed `v=spf1 include:_spf.google.com ~all`, `pm-bounces.mail CNAME pm.mtasv.net.`, and `_dmarc TXT`) — leaving GoDaddy live DNS untouched until Board review completes.
3. **Archive `host_corporation` Patronage Showcase Upgrade (Blocked Pending Explicit `@bo` Unlock for `@dev`):**
   - [`src/frontend/src/app/archive/[year]/page.tsx`](../../src/frontend/src/app/archive/[year]/page.tsx) and `src/frontend/src/data/archives/*.json` fall under the strict Archive Page & Dataset Lock (`docs/project_charter.md` Guardrail #1) and `@dev` domain isolation (`locksrules.md` Rule 3). Zero files under `src/` are modified until `@bo` explicitly grants permission.
