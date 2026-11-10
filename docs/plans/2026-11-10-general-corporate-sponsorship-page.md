# Architectural Plan: Evergreen Corporate Sponsorship Page (`/corporate-sponsorship`)

**Date:** 2026-11-10  
**Owner:** @arch  
**Execution Team:** @dev, @brand, @qa, @ops  
**Reference Source:** Legacy `https://www.hems-workshop.org/15thWS/15thCorp_Sponsors.html` & [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json)

---

## 1. Objective & Scope Constraints

1. **Evergreen Public Corporate Sponsorship Page:** Establish a standalone, full-width public page at `/corporate-sponsorship` ([`src/frontend/src/app/corporate-sponsorship/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx)) that stands year after year across biennial workshop cycles without hardcoding `"15th workshop"`.
2. **Navigation & Access Rule:** Make Corporate Sponsorship prominently accessible through the **Contact** page ([`src/frontend/src/app/contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx)), and **NOT** through the top navigation bar ([`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx)).
3. **Strict Archive Lock:** Zero modifications to `src/frontend/src/app/archive/**` or any proceedings archive JSON files.

---

## 2. Content & Data Architecture

### A. Canonical Legacy Facts (Adapted for Year-Over-Year Longevity)
- **All-Volunteer Funding Model:** HEMS is an all-volunteer 501(c)(3) organization providing an open forum bridging academic, industrial, and government circles, with no formal membership or membership dues. Each biennial workshop is independently funded through donations, registration fees, and corporate sponsors.
- **Student Travel Award Impact:** Corporate sponsorship directly offsets workshop operational costs and is instrumental in funding competitive Student Travel Awards.
- **Four Core Sponsor Benefits:**
  1. **Hardware & Literature Exhibition:** Dedicated display space at the workshop for instruments, components, and technical literature.
  2. **Corporate Technical Poster:** Invitation to present a corporate poster at the symposium (with remote poster printing/posting arranged by organizers for non-attending sponsors).
  3. **Symposium Banner & Program Recognition:** Acknowledgment on the official HEMS Workshop banner and in symposium program materials.
  4. **Year-Round Website Logo & Link:** Prominent placement on the HEMS website featuring the sponsor's company logo and outbound link.
- **Evergreen Participation & Flexible Invoicing Tiers:**
  - **Full Corporate Sponsorship + Attendee (`$1,350` USD reference):** Full corporate sponsorship package including one (1) workshop attendee registration.
  - **Split Sponsorship & Registration Invoicing (`$850` + `$500` USD reference):** Separates the `$850` corporate sponsorship fee from the `$500` attendee registration fee via [`http://shop.hems-workshop.org`](http://shop.hems-workshop.org) to accommodate internal corporate purchasing and spending limits.
  - **Non-Attending Corporate Sponsor (`$850` USD reference):** For organizations supporting the workshop remotely without an on-site representative; includes website/program recognition and arranged display of the sponsor's corporate poster.
- **Prospectus & Coordinator:**
  - Downloadable Corporate Sponsorship Information PDF reference (`https://www.hems-workshop.org/15thWS/Corporate%20Sponsorship%20Information.pdf`).
  - Coordinator: **Tim Short** (`rtshort00@gmail.com`) + pre-filled `/contact?topic=sponsorship` workflow.

### B. Dynamic Sponsor Heritage Registry (`corporate_registry.json`)
- Bind the Past & Continuing Corporate Sponsors showcase directly to [`src/frontend/src/data/corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json) (52 corporate, national-lab, and university partners since 2001) so new sponsors added via the Workshop Manager automatically populate the page in future cycles.
- Normalize bare domains (`www.hamiltonsundstrand.com`, `pascaltechnologies.com`, `SpyglassWater.com`) with `https://` at render time and map `SAES_Getters.png` -> `Saes_Getters.png` to guarantee case-sensitive Linux/Firebase Hosting asset resolution without mutating registry JSON data.

---

## 3. File Operations

| Action | File Path | Purpose |
| :--- | :--- | :--- |
| **[NEW]** | [`src/frontend/src/app/corporate-sponsorship/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx) | Standalone full-width evergreen Corporate Sponsorship page |
| **[DELETE]** | `src/frontend/src/app/(portal)/corporate-sponsorship/page.tsx` | Remove portal-wrapped duplicate route so `/corporate-sponsorship` renders in clean public layout |
| **[MODIFY]** | [`src/frontend/src/app/contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx) | Add prominent Corporate Sponsorship feature card, Direct Channel link, contextual inquiry banner, and `?topic=sponsorship` support |
| **[MODIFY]** | [`src/frontend/src/app/sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts) | Register `/corporate-sponsorship` in static XML sitemap |
| **[MODIFY]** | [`src/frontend/content/pages/corporate-sponsorship.md`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/content/pages/corporate-sponsorship.md) | Synchronize Decap CMS markdown with evergreen sponsorship copy |
| **[VERIFY]** | [`src/frontend/src/components/layout/Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) | Confirm zero links to `/corporate-sponsorship` in top navigation bar |

---

## 4. Verification Gates

1. `git diff b6a0075 -- src/frontend/src/app/archive` outputs `0` lines (Archive Lock intact).
2. `npx tsc --noEmit` in `src/frontend` exits with code `0` (strict TypeScript, zero `any`).
3. Live dev server probes return `HTTP 200 OK` on `http://localhost:3000/corporate-sponsorship/` and `http://localhost:3000/contact/`.
