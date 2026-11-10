# Architectural Implementation Plan: Frontend Webpages Modernization

**Date:** 2026-10-27  
**Custodian:** `@arch`  
**Lead Implementer:** `@dev`  
**Brand Compliance:** `@brand`  
**Quality Assurance:** `@qa`  
**Status:** COMPLETED  

---

## 1. Executive Summary

This plan outlines the modernization and content overhaul of the public-facing HEMS front end webpages. As directed by **@bo**, this update incorporates the canonical text from [`docs/source-documents/mission-statementV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/mission-statementV1.md) and [`docs/source-documents/historyV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV1.md) while strictly honoring the constraint: **Zero modifications to archive pages or proceedings datasets**.

---

## 2. Ingested Canonical Content & Architecture

### A. Mission Statement & Core Objectives
*Source:* [`docs/source-documents/mission-statementV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/mission-statementV1.md)
* **Official Mission:** Facilitating interaction and cooperation among scientists, engineers, and users to accelerate reliable, compact, and energy-efficient mass spectrometry solutions for demanding and harsh environments outside controlled laboratory environments.
* **5 Core Objectives:**
  1. **Facilitate Collaboration:** Inclusive cross-disciplinary community for MS researchers and engineers.
  2. **Promote Enabling Technologies:** Power management, sample introduction, signal processing, and miniaturization.
  3. **Knowledge Exchange:** HEMS workshops, focus groups, and publications.
  4. **Foster Innovation:** Driving reliability, portability, efficiency, and performance.
  5. **Outreach and Education:** Public, research, and industry stakeholder engagement.

### B. Comprehensive Workshop & Society History
*Source:* [`docs/source-documents/historyV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV1.md)
* **Early Years (Late 1990s):** University of South Florida (USF) Center for Ocean Technology (COT) underwater MS project identified the need for an interdisciplinary forum.
* **1st Workshop (Feb 1999):** USF St. Petersburg, FL (20 researchers, 1.5 days).
* **2nd Workshop (Feb 2001):** Downtown St. Petersburg (65 participants, international reach, relaxed Hawaiian shirt / shorts culture, identified portable vacuum pump bottlenecks).
* **3rd Workshop (March 2002):** Pasadena, CA; co-hosted with NASA JPL Miniature Vacuum Pumps Workshop.
* **4th Workshop (Oct 2003):** St. Petersburg Beach, FL; consolidated the beachy vibe, established biennial (2-year) cadence.
* **5th Workshop (Sept 2005):** Lido Beach, Sarasota, FL; proposed independent organizing committee, fixed mid-September timing.
* **HEMS Society Incorporation (2008):** Formal Florida 501(c)(3) nonprofit corporation with rotating committee leadership.
* **National & International Workshop Circuit:** Cocoa Beach (6th, 2007), Santa Barbara (7th, 2009), St. Pete Beach, Baltimore, Oxnard, Cologne (Germany), Myrtle Beach, Cocoa Beach, Virginia Beach (15th, 2025).
* **Guiding Ethos:** *"Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!"*

---

## 3. Brand & Design System Alignment

All implementations must conform strictly to [`brand-guidelines.md`](file:///c:/AntigravityP1_2/HEMS-website/.agents/config/design/brand-guidelines.md) ("Global Symposium" Aesthetic):
* **Colors:**
  * Summit White: `#FFFFFF` / `var(--background)`
  * Slate Black: `#334155` / `var(--foreground)`
  * Protocol Gray: `#E2E8F0` / `var(--surface)`
  * Global Cerulean: `#0284C7` / `var(--color-primary)`
  * Diplomatic Emerald: `#059669` / `var(--color-secondary)`
* **Typography:** Clean Noto Sans for universal readability; IBM Plex Mono for technical tags, dates, and readouts.
* **Logo:** Primary logo rendered with `mix-blend-multiply` against clean light containers.
* **Tone:** Professional, objective, inclusive, and globally minded.

---

## 4. Work Breakdown Structure (WBS)

### Phase 1: Source Documents Ingestion & Reformatting [COMPLETED]
- [x] Reformat [`docs/source-documents/mission-statementV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/mission-statementV1.md) with clean GitHub-flavored markdown.
- [x] Reformat [`docs/source-documents/historyV1.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/historyV1.md) with clean semantic headers and paragraphs.
- [x] 100% preservation of all original text content.

### Phase 2: About Page Overhaul ([`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx)) [COMPLETED]
- [x] **Hero & Identity:** Elevate header with official 501(c)(3) designation, mission tagline, and blend-mode HEMS emblem.
- [x] **Mission Statement Section:** Featured executive statement block emphasizing non-laboratory deployment.
- [x] **5 Core Objectives Grid:** Visual cards with custom Lucide icons (Handshake, Cpu, BookOpen, Lightbulb, GraduationCap) and Emerald/Cerulean accents.
- [x] **Interactive Chronological History:**
  - Section 1: *The Early Years & USF COT Origins (1999–2005)*
  - Section 2: *Formation of the HEMS Society 501(c)(3) (2005–2008)*
  - Section 3: *The Global Circuit (2007–Present)*
  - Section 4: *Guiding Culture & Beachfront Philosophy*
- [x] Remove obsolete placeholders (e.g., stale "Upcoming 15th Workshop" and `[IMAGE: ROVER / SUBMERSIBLE]`).

### Phase 3: Home Page Harmony ([`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx)) [COMPLETED]
- [x] Update hero quote and mission overview to reflect the canonical mission statement.
- [x] Ensure seamless call-to-action buttons connecting to the redesigned About page and the proceedings archive.

### Phase 4: Strict Archive Protection
- [x] Enforce zero modifications to:
  - `src/frontend/src/app/archive/**`
  - `src/frontend/src/data/master_workshops.json`
  - `src/frontend/src/data/archives/**`
  - `local_data/proceedings/**`

---

## 5. Verification & Quality Gates

1. **Compilation & Type Check:**
   - Execute Next.js build validation: `npm --prefix src/frontend run build`.
2. **Visual & Routing Check:**
   - Verify `http://localhost:3000` (Home page) in browser.
   - Verify `http://localhost:3000/about` (About page) in browser.
   - Confirm `http://localhost:3000/archive` remains 100% operational and unmodified.
