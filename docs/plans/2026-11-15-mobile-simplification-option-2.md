# Plan: Option 2 Mobile Simplification ("Balanced Hybrid" — `< md` / `< sm` Only, Desktop 100% Untouched)

**Date:** 2026-11-15  
**Requested by:** `@bo` (`@arch go on option 2 please.`)  
**Authors:** `@arch`, `@prod`, `@brand`, `@dev`, `@qa`

## Objective
Reduce mobile (`375×812 px`, `< 640px` / `< 768px`) vertical scroll bloat by ~45–55%, eliminate repeated header/footer emblem cards and desktop-only counterbalance blocks on phones, and convert multi-card towers into native swipe rails, `2×2`/`2×3` compact grids, and collapsible `<details>` disclosures—while keeping the desktop PC experience (`>= 768px` / `>= 1024px`) **100% visually identical** and preserving 100% verbatim `mission-statementV4.md` and `historyV4.md` content.

## Guardrails
- **Archive Lock:** Zero edits to `src/frontend/src/app/archive/**`, `src/frontend/src/components/archive/ArchiveHubClient.tsx`, or `src/frontend/src/data/archives/*.json`.
- **Verbatim Copy Preservation:** Zero edits to V4 Charter, Objectives, Governance text (`/about`) or History V4 Chapters 01–03 (`/history`).
- **Printable Flyers Untouched:** Zero edits to Mode B Printable Flyers in `CorporateSponsorshipClient.tsx` and `StudentAwardsClient.tsx`.
- **Zero Duplicate DOM IDs:** Keep `id="..."` anchors solely on desktop `hidden md:block` `<section>` blocks when sharing extracted JSX with `<details className="md:hidden">`.

## Target Files & Breakpoint Changes

| File | Mobile (`< sm` / `< md` / `< lg`) Change | Desktop State |
| :--- | :--- | :--- |
| [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx) | `py-9 sm:py-14`; side-by-side `grid-cols-2` link columns (`col-span-2` identity); hide 3rd emblem `< sm` (`hidden sm:flex`) | Identical (`sm:` / `lg:`) |
| [`HeroFieldDeploymentsCarousel.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/home/HeroFieldDeploymentsCarousel.tsx) | Hide 6-thumbnail filmstrip `< sm` (`hidden sm:grid`) | Identical (`sm:grid`) |
| [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) | Hide duplicate Masthead logo `< sm`; convert `CHARTER_PILLARS` to swipe rail (`md:hidden` cue, `overflow-x-auto snap-x` `< md`); hide `SYMPOSIUM_CULTURE` `< md` (`hidden md:block`); renumber mobile Section `02` eyebrow (`md:hidden` `02` / `hidden md:inline` `03`); make `ARCHIVE_QUICK_VOLUMES` compact `grid-cols-2` `< sm` | Identical (`md:` / `sm:`) |
| [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) | `py-7 sm:py-14`; hide duplicate seal `< lg` (`hidden lg:inline-flex`); compact `2×2` `INSTITUTIONAL_FACTS` `< sm`; keep 2025 group portrait uncropped at `max-w-[275px] sm:max-w-[390px]`; hide Don CeSar photo `< md`; hide Section 04 `<HeroMassSpectrum />` `< md` | Identical (`md:` / `lg:`) |
| [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx) | `py-7 sm:py-14`; hide duplicate seal `< lg`; hide redundant `Formative Symposia (1999–2005)` card `< lg`; wrap `Complete Symposium Chronology (1999–2025)` in `<details className="md:hidden">` drawer on phones while keeping `hidden md:block` open on PC | Identical (`md:` / `lg:`) |
| [`PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx) | Hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing; collapse `"Previous Years • Historical Reference"` into `<details className="md:hidden">` | Identical (`md:`) |
| [`CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx) | Hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing; collapse `"Previous Years • Archival Examples"` into `<details className="md:hidden">` | Identical (`md:`) |
| [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx) | Hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing; collapse `"Previous Workshop Host Venues"` into `<details className="md:hidden">` | Identical (`md:`) |
| [`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx) | Hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing | Identical (`md:`) |
| [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx) | Mode A web header only: hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing | Identical (`md:`) |
| [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx) | Mode A web header only: hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing | Identical (`md:`) |
| [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx) | Hide duplicate seal `< md` (`hidden md:flex`); tighten mobile header spacing (`mb-7 sm:mb-12 pb-6 sm:pb-8`) | Identical (`md:`) |

## Verification Criteria
1. `npx --prefix src/frontend tsc --noEmit` exits `0`.
2. Automated Python check confirms 100% verbatim parity with `mission-statementV4.md` & `historyV4.md`, zero duplicate `id=` attributes in edited `.tsx` files, zero edits under archive paths, and HTTP `200` on all 10 routes at `http://localhost:3000`.
3. `browser` subagent visual & DOM check at `375×812` mobile (`scrollWidth <= innerWidth`, reduced `scrollHeight`, swipe rail, hidden vanity/duplicate emblems, working `<details>` drawers) and `1280×900` desktop (full parity).
