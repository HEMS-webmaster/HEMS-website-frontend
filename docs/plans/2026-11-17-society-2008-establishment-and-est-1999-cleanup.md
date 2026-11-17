# Architectural Plan: HEMS Society 2008 Establishment Alignment & Removal of "Est. 1999" Society Badges

**Date:** 2026-11-17  
**Authors:** `@prod`, `@brand`, `@arch`, `@dev`  
**Status:** Completed & Verified (`53/53` static routes built, `0` remaining `Est. 1999` Society badges)

---

## 1. Historical Ground Truth & Editorial Policy

Per Board confirmation (`@bo`):
1. **Inaugural HEMS Workshop (1st Meeting):** **February 21–23, 1999** at the University of South Florida (USF) Center for Ocean Technology in St. Petersburg, Florida. All `1999–2025` spans referring to **HEMS Workshops** and the **Open-Access Proceedings Archive** (`15` workshops, `436` citable works) remain historically exact and unchanged.
2. **HEMS Society Establishment & 501(c)(3) Incorporation:** **2008** in the State of Florida as the **Harsh-Environment Mass Spectrometry Society, Inc.** (all-volunteer IRS 501(c)(3) public charity). The **7th HEMS Workshop** in Santa Barbara, California (**September 2009**) was the Society's first post-incorporation meeting.
3. **Compact Badge & Graphic Rule:** Remove `"Est. 1999"` from compact **HEMS Society / 501(c)(3)** badges and social share graphics so the Society's legal charter is never conflated with the 1999 workshop launch, while stating both milestones clearly in narrative copy, legal footers, Schema.org metadata, and reference documents.

---

## 2. File-by-File Modification Matrix

### 2.1 Social Share Graphics (`@dev` / `@brand`)
- [`opengraph-image.png`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/opengraph-image.png) & [`twitter-image.png`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/twitter-image.png): Remove `• Est. 1999` from the top lockup beneath `HARSH-ENVIRONMENT MASS SPECTROMETRY SOCIETY`, leaving `IRS 501(c)(3) Scientific Public Charity`.

### 2.2 Global Chrome, Public Pages & Printable Sheets (`@dev`)
- [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx): Change `Est. 1999 • 501(c)(3)` subtitle under `HEMS Society` to `501(c)(3) Scientific Society`.
- [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx): Change top Society subtitle to `All-Volunteer 501(c)(3) Scientific Society` and update the bottom legal copyright line to `(Est. 2008 • Workshops Since 1999)`.
- [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx): Remove `• Est. 1999` from the top Society Masthead and dark 501(c)(3) Charter card; clarify line 294 as *"Since the inaugural 1999 HEMS Workshop..."*.
- [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx): Remove `• Est. 1999` from the header pill and Society Seal card; update `INSTITUTIONAL_FACTS[0]`, Charter narrative, and History exploration card to distinguish the 1999 inaugural Workshop from the 2008 Society establishment and 2009 first post-incorporation meeting.
- [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx): Update header pill to `Workshops Since Feb 1999 • HEMS Society Est. 2008`, refine `PAGE_DESCRIPTION`, and explicitly note the 7th Workshop (Santa Barbara, 2009) as the Society's first post-incorporation meeting.
- [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx): Remove `• Est. 1999` from the Governance kicker, update prose to state 2008 Society establishment stewarding Workshops held since February 1999, and display both `Inaugural Workshop (Feb 1999)` and `Society Established (2008 • Florida 501(c)(3))`.
- [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx): Remove `• Est. 1999` from the web header pill and printable footer; update lead copy (`Established in 2008 to steward the biennial HEMS Workshops convened since 1999...`) and printable letterhead (`Incorporated in Florida (Est. 2008)`).
- [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx): Update printable letterhead to `Incorporated in Florida (Est. 2008)` and remove `• Est. 1999` from the printable footer.
- [`RegistrationReceiptSheet.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationReceiptSheet.tsx): Update letterhead from `Florida Non-Profit Corporation (Est. 1999, Inc. 2008)` to `Florida Non-Profit Corporation (Est. 2008)`.
- [`MarketingPlaybookContent.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/operations/MarketingPlaybookContent.tsx): Remove `• Est. 1999` from the `IRS 501(c)(3) Public Charity` pill.

### 2.3 Structured Data, AI Corpora & Reference Documents (`@dev`, `@brand`, `@arch`)
- [`seo.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/seo.ts): Set `Organization` `foundingDate` to `"2008"` and clarify `description` (*"established in 2008 to steward the biennial Workshops on Harsh-Environment Mass Spectrometry (held since 1999)"*).
- [`llms.txt`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/llms.txt) & [`generate-llms-catalog.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/generate-llms-catalog.js): Update legal entity founding metadata from `1999` to `established 2008; biennial workshops convened since 1999` (regenerating `llms-full.txt` on build).
- [`brand-guidelines.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/design/brand-guidelines.md), [`hems_2027_marketing_and_ads_playbook.html`](file:///c:/AntigravityP1_2/HEMS-website/docs/marketing/hems_2027_marketing_and_ads_playbook.html), [`system_design_architecture.html`](file:///c:/AntigravityP1_2/HEMS-website/docs/system_design_architecture.html), and [`historyV4.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV4.md): Align all reference documentation with the 1999 Workshop / 2008 Society / 2009 first post-incorporation meeting timeline.

---

## 3. Verification Gates (`@qa`)
1. Visual inspection of updated `opengraph-image.png` / `twitter-image.png`.
2. Automated grep assertion confirming zero remaining `Est. 1999` or `founded 1999` attributions on the HEMS Society entity across unlocked source and reference files.
3. `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` and `npm --prefix src/frontend run build` (`53/53` static routes + regenerated `llms-full.txt`).
