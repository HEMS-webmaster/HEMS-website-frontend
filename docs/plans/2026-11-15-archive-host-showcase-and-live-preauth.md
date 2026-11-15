# Implementation Plan: Live `hems-workshop.org` Pre-Authorization (`@ops`) & Permanent Workshop Host Showcase Across All 15 Archives (`@dev`, `@web`, `@arch`)

**Date:** 2026-11-15  
**Requested By:** `@bo` (`"@dev @web and @ops I've re-auth'ed firebase CLI, and you have permission to go ahead on the host upgrade now."`)  
**Lock Overrides:** Explicit `@bo` authorization to modify `src/frontend/src/data/archives/*.json`, `src/frontend/src/app/archive/[year]/page.tsx`, and `src/frontend/src/utils/generateArchiveJsonLd.ts`. Zero modifications to talk schedules, abstracts, posters, student awards, or corporate sponsor lists.

---

## Workstream 1 — `@ops`: Live Domain Pre-Authorization (`infrastructure/preauth-domain.ps1`)
1. Update `Get-ValidAccessToken` to refresh and read the authenticated `firebase-tools` OAuth session (`~/.config/configstore/firebase-tools.json`) via `firebase hosting:sites:list --project hems-workshop` before falling back to `gcloud`.
2. Add PowerShell 5.1 stream-based `Get-ApiErrorBody` inspection helper.
3. Update `Ensure-HostingCustomDomain` to follow `POST /customDomains` LRO response with an immediate `GET` to read full `CustomDomain` state and parse `requiredDnsUpdates.desired[].records[]` cleanly.
4. Replace `gcloud services enable dns.googleapis.com` with `serviceusage.googleapis.com` REST API check + `:enable`, wrapping Cloud DNS `managedZones` / `rrsets` with a non-fatal notice if `dns.googleapis.com` is still propagating.
5. Execute live pre-authorization for Firebase Auth `authorizedDomains`, Firebase Hosting `customDomains` (`www.hems-workshop.org` Primary + `hems-workshop.org` 301 redirect), and Google Cloud DNS public zone `hems-workshop-org`.

## Workstream 2 — `@dev` & `@web`: 15-Year Permanent Workshop Host & Institutional Patron Showcase
1. Enrich `host_corporation` across `src/frontend/src/data/archives/1999.json` through `2025.json` plus `template.json` with canonical `https://` URLs (fixing bare `"www.hamiltonsundstrand.com"` in `2009.json` and `2011.json`), `host_category` (`"academic"` | `"corporate"`), `kicker_label`, factual `IRC § 513(i)` `patronage_summary`, `highlights`, optional `historical_note` (M&A continuity), and `cta_label`.
2. Enforce `HostCorporationSchema` URL protocol checks and typed fields in `src/frontend/scripts/validate-archives.js`.
3. Upgrade `src/frontend/src/app/archive/[year]/page.tsx` Workshop Host & Corporate Sponsors section to Brand v3.2.0 (`Source Serif 4` + `Noto Sans`, zero `font-mono`, Specimen White card with sapphire/teal left accent bar, `mix-blend-multiply` logo well, normalized external URLs, and tracked CTA button).
4. Add `host_corporation` (`funder` + `sponsor`) support in `src/frontend/src/utils/generateArchiveJsonLd.ts` and `- **Official Workshop Host:**` indexing in `src/frontend/scripts/generate-llms-catalog.js`.

## Workstream 3 — Build, Deploy Preview, Verify & Commit
1. Validate all 15 archives (`validate-archives.js`), run TypeScript check (`tsc --noEmit`), and run full static export build (`npm --prefix src/frontend run build`).
2. Verify generated `out/archive/{2025,2009,2002}/index.html` output and `301` redirects/preview site on `https://hems-workshop.web.app` via `firebase deploy --only hosting --project hems-workshop`.
3. Restart background Next.js local dev server on port `3000`, append Addendum 24 to `docs/session_history.md`, and stage/commit strictly task-modified files on `main` (without `git push`).
