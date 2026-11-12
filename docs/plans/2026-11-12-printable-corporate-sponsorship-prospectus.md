# Implementation Plan: Printable Corporate Sponsorship Prospectus (`2026-11-12`)

**Owners:** `@prod`, `@brand`, `@arch`, `@dev`, `@ops`  
**Route:** `/corporate-sponsorship` ([`CorporateSponsorshipClient.tsx`](../../src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx))

---

## 1. Objectives

1. **Retire External Prospectus PDF Link:** Remove the legacy `Download Sponsorship Info (PDF)` (`sponsor_prospectus_url`) button and clear its URL in [`upcoming_workshop.json`](../../src/frontend/src/data/upcoming_workshop.json) and the live Google Sheet (`HEMS Upcoming Workshop Control Center`).
2. **Add On-Demand "Printable Version" + Direct `Ctrl+P` Support:**
   - Provide a **Printable Version** button on `/corporate-sponsorship` (hero banner + coordinator sidebar, plus `?print=1` URL support) that opens an on-screen **US-Letter (`8.5" × 11"`) Executive Prospectus** preview with **Print / Save as PDF** (`window.print()`) and **← Back to Web Page** controls.
   - Configure `@media print` across [`globals.css`](../../src/frontend/src/app/globals.css), [`Navbar.tsx`](../../src/frontend/src/components/layout/Navbar.tsx), [`Footer.tsx`](../../src/frontend/src/components/layout/Footer.tsx), and [`(portal)/layout.tsx`](../../src/frontend/src/app/(portal)/layout.tsx) so printing from either view outputs a crisp, single-page executive handout with zero site navigation chrome.
3. **Executive Handout Structure & `@brand` v3.1.0 Alignment:**
   - Format the printable handout specifically for an engineer or scientist presenting a sponsorship request to management or purchasing: Society `501(c)(3)` letterhead, concise mission & audience brief, 4-metric credibility strip, `2×2` deliverables grid, comparative 3-tier invoicing table (`$1,350` Full Package, `$850 + $500` Split Corporate-Card Option, `$850` Non-Attending Sponsor), representative community partners, and 3-step onboarding with **Tim Short (`tim.short@hems-workshop.org`)** contact details—all dynamically hydrated from `useUpcomingWorkshop()`.
   - Refine the web view typography in [`CorporateSponsorshipClient.tsx`](../../src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx) to match `@brand` v3.1.0 (`Source Serif 4` Title-Case headers + `Noto Sans` `tabular-nums`).
