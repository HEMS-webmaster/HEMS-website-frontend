# Implementation Plan: HEMS 2027 Marketing & Online Advertising HTML Playbook

- **Date:** 2026-11-14
- **Roles:** `@brand`, `@arch`
- **Deliverable:** `docs/marketing/hems_2027_marketing_and_ads_playbook.html`
- **Design Standard:** `docs/design/brand-guidelines.md` (v3.2.0 — *Scholarly Precision & Editorial Symposium*)

## Objective
Create an extensive, interactive, brand-aligned HTML marketing strategy and ad-execution runbook inside `docs/marketing/` so HEMS Society officers (`@bo`, Board Members, Sponsorship Coordinator `tim.short@hems-workshop.org`, and Student Award Chair `president@hems-workshop.org`) can unlock the `$10,000/month` 501(c)(3) Google Ad Grant, execute three targeted 3-week LinkedIn ad bursts, distribute zero-budget multi-channel announcements, and monitor campaign ROI directly inside `/admin/analytics`.

## Brand & Platform Grounding
- Zero codebase modifications (`src/` remains untouched per `@brand` role lock).
- Integrates live site workflows already built into `hems-workshop.org`:
  - **Board → Website Analytics (`/admin/analytics`)** UTM builder & matching `SOCIAL_AD_PRESETS` (`li-group`, `li-cfp`, `li-grants`, `google-grant`, `sponsor-kit`).
  - **Board → Mailing List (`/board/mailing-list`)** CSV cohort exports for LinkedIn Matched Audiences and segmented re-engagement via `/board/announcements`.
  - **Proceedings Archive (`/archive`)** `Cite / Share` modal (`?src=linkedin-archive-share`) spanning 436+ talks & 1,590 archival files (1999–2025).
  - **Printable Flyers (`/student-awards/?print=1` and `/corporate-sponsorship/?print=1`)** and the official HEMS LinkedIn Group (`https://www.linkedin.com/groups/4385091/`).

## Playbook Architecture
1. **Masthead, Sticky Progress Navigation & Print/Save PDF Controls** (`localStorage` key `hems_2027_marketing_checklist_v1`).
2. **Interactive Budget, Traffic & Break-Even Simulator** (501(c)(3) Google Ad Grant utilization + 3 LinkedIn burst sliders with live `$1,350` sponsor / `$500` professional / `$250` student fee break-even math).
3. **Section 1 — Online Ads:** `$10k/mo` Google Ad Grants setup, GA4 conversion unlock, 4 RSA campaign blueprints, mandatory HEMS medical negative-keyword shield, 3 × 3-week LinkedIn burst schedules + ad copy + cost guards, and Free Scientific Society Calendars directory + copyable announcements.
4. **Section 2 — Zero-Budget Multipliers:** 45-min / 6-mo LinkedIn Archive post scheduler (6 complete ready-to-paste spotlights), Sponsor & Speaker 1-click social badge mockups + outreach templates, and 40-department Graduate Coordinator Student Award flyer blitz (`/student-awards/?print=1`).
5. **Section 3 — Extended High-Leverage Playbook:** Segmented mailing-list reactivation cohorts, ASMS/AGU zero-booth QR slide protocol, `llms.txt`/AI search citation authority, and co-author lab-group registration multipliers.
6. **Section 4 — Master 12-Month Biennial Campaign Calendar (`Nov 2026 – Oct 2027`)**.
7. **Section 5 — Canonical UTM Directory & Closed-Loop Analytics Attribution**.
8. **Section 6 — Interactive Committee Execution Checklist**.
