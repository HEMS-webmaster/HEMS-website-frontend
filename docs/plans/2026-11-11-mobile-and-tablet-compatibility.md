# Mobile & Tablet Compatibility Audit and Implementation Plan

**Date:** 2026-11-11  
**Author:** `@arch` (System Architect) — Auto-Advance Execution with `@dev`, `@qa`, `@ops`  
**Status:** Active Implementation (Phase 10)  
**Target Viewports:**
- **Cell Phones:** `320×568` (compact Android / SE 1st Gen), `375×667` / `375×812` (iPhone SE / Mini), `390×844` (iPhone 14/15/16), `430×932` (Pro Max / Pixel Pro)
- **Tablets (Portrait & Landscape):** `768×1024` (iPad Mini / Portrait), `820×1180` (iPad Air Portrait), `834×1194` (iPad Pro 11" Portrait), `1024×768` (iPad Landscape / Touch Ultrabook)

---

## 1. Architectural Audit Findings

A full route-by-route and component-by-component audit across all 27 public pages, 4 authenticated officer panels (`/auth`, `/admin`, `/admin/analytics`, `/board`, `/reviewer`), and shared modals/navigation uncovered **7 structural compatibility gaps**:

| # | Severity | Surface | Root Cause | Affected Viewports |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Critical** | [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) | Desktop horizontal bar activates at `md:flex` (`768px`), but Brand Lockup (`~205px`) + 5 primary links + `Archives` + `Contact` CTA requires `~925px` (`~1,030px` signed in), overflowing horizontally on every portrait tablet. Desktop `Archives` and officer role popovers also rely solely on CSS `group-hover:`, failing on touch-screen landscape tablets (`1024px+`), while `< 1024px` drawer omits `2027 Workshop` sub-links and authenticated `Sign Out` / `Admin` controls. | Portrait & Landscape Tablets (`768px–1024px`), Mobile (`< 768px`) |
| **2** | **Critical** | [`(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx) | Sidebar uses `hidden md:flex md:w-64`, leaving **zero sub-navigation on cell phones (`< 768px`)** across `/layout-portal`, `/call-for-papers`, `/registration`, `/accommodations`, `/corporate-sponsorship`, `/reviewer`, `/board`, `/admin`, and `/admin/analytics`. At `768px–1023px`, `256px` sidebar + `96px` `md:p-12` padding crushes content to `416px` (`~125px` per card in `md:grid-cols-3`). Trailing slashes also break exact `pathname === link.path` active highlights, and inner `<main>` lacks `min-w-0`. | Cell Phones (`320px–767px`) & Portrait Tablets (`768px–1023px`) |
| **3** | **High** | [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`UpcomingHeroBadge.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingHeroBadge.tsx), [`UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx) | Institutional Impact Ledger (`grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x` + `first:pl-0`) misaligns column-1 padding (`pl-0` on `1999` vs `pl-4` on `1,590`) on phones and drops horizontal dividers on `640px–1023px` tablets. Hero CTAs and spotlight footer links wrap unevenly on `320px–375px` screens. | Cell Phones (`320px–639px`) & Portrait Tablets (`640px–1023px`) |
| **4** | **High** | [`FrontendPreviewHover.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/FrontendPreviewHover.tsx) | Hardcoded `w-[400px]` floating preview card exceeds `320px–390px` phone viewports if triggered by synthetic touch `mouseenter`. | Cell Phones (`320px–390px`) |
| **5** | **High** | [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx), [`CitationModal.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/CitationModal.tsx) | `DownloadGate` modals lack `max-h-[90dvh] overflow-y-auto`, clipping OAuth and account toggle buttons on `375×667` or landscape phones when the virtual keyboard opens; long permalink/APA URLs in `CitationModal` need `break-all` wrapping. | Compact & Landscape Phones |
| **6** | **Medium** | [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx), [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx), [`auth/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/auth/page.tsx), [`admin/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/page.tsx), [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx), [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css) | `<input>`, `<select>`, and `<textarea>` elements use `text-sm` (`14px`), triggering forced iOS Safari / iPadOS viewport auto-zoom on focus (`< 16px`). `layout.tsx` also lacks an explicit `Viewport` export and `globals.css` lacks `overflow-x: clip`. | iOS Safari / Android Chrome |
| **7** | **Medium** | Subpages & Portal Clients (`formatting-guidelines`, `StudentAwardsClient`, `CorporateSponsorshipClient`, `PortalOverviewClient`, `ArchiveHubClient`, `admin/analytics`, `board`, `reviewer`, `Footer`) | Unbroken inline code/email strings (`HEMS_Abstract_LastName_FirstName.pdf`, long mailto addresses), `p-8` card padding squeezing `320px` screens, non-wrapping flex button rows in `/archive` search hits and `/admin/analytics` tabs, `rounded-full` multi-line header badges, and tight `2`-column sponsor logos at `320px`. | Cell Phones (`320px–390px`) |

---

## 2. File-Lock Compliance

- **Archive Lock (`docs/project_charter.md` Section 3.1):** `0` modifications to `src/frontend/src/app/archive/**`, `src/frontend/src/data/master_workshops.json`, `src/frontend/src/data/archives/*.json`, or `tools/manager/**`. All archive-adjacent touch/overflow improvements (`Navbar.tsx`, `FrontendPreviewHover.tsx`, `DownloadGate.tsx`, `CitationModal.tsx`, `ArchiveHubClient.tsx`) live in shared component directories outside `src/app/archive/`.
- **Source Locks (`locksrules.md`):** `/source-material` remains read-only; `docs/source-documents/pics/` remains untracked and untouched.

---

## 3. Execution Blueprint (`@dev`)

### Step 1: Viewport Metadata & Global Overflow/Scrollbar Hygiene
- [`src/frontend/src/app/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx): Export `viewport: Viewport` (`width: "device-width"`, `initialScale: 1`, `viewportFit: "cover"`, `themeColor: "#FAFBFD"`).
- [`src/frontend/src/app/globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css): Add `overflow-x: clip` on `html, body` (prevents horizontal page scrollbars while keeping `sticky` headers intact) and `.no-scrollbar` for touch-scrollable pill bars.

### Step 2: Tablet-Safe & Touch-First Site Navigation (`Navbar.tsx` & `Footer.tsx`)
- [`src/frontend/src/components/layout/Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx):
  - Shift horizontal desktop bar to `hidden lg:flex` (`1024px+`) with tuned `lg` spacing (`gap-0.5 xl:gap-1.5`, `px-2 xl:px-3`) so `1024px` landscape tablets never clip even when signed in.
  - Display the `44×44px` menu toggle button (`lg:hidden`) across all cell phones and portrait tablets (`< 1024px`).
  - Add click/tap state (`archivesOpen`, `profileOpen`) with outside-click, `Escape`, and `pathname`-change dismissal alongside desktop hover on `Archives` and signed-in `User` popovers so `1024px+` touch tablets can open/close dropdowns by tapping.
  - Upgrade the `< 1024px` drawer (`max-h-[calc(100dvh-4rem)] overflow-y-auto`) with `min-h-[44px]` touch targets, expandable `2027 Workshop` portal links, expandable `Proceedings Archives (1999–2025)` year shortcuts, and authenticated role/Admin/Sign-Out controls.
- [`src/frontend/src/components/layout/Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx): Increase vertical link tap padding (`py-1 inline-block`) and center-align copyright text on narrow phones (`text-center sm:text-left`).

### Step 3: Mobile & Portrait-Tablet Workshop Portal Sub-Navigation (`(portal)/layout.tsx`)
- [`src/frontend/src/app/(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx):
  - Promote fixed left `<aside>` from `md:flex` to `lg:flex lg:w-64` (`1024px+`), restoring full viewport width on `768px–1023px` portrait tablets.
  - Add a sticky horizontal touch-scrollable pill bar (`lg:hidden`, `sticky top-16 z-30`) surfacing all authorized `Workshop Portal` and `Administration` routes (plus compact Dev Role Switcher when `isMock && user`).
  - Normalize trailing slashes in active-link matching and convert inner `<main>` to `<div className="flex-grow min-w-0 p-4 sm:p-6 lg:p-10 xl:p-12 bg-surface">`.

### Step 4: Homepage Ledger, Hero CTAs & Responsive Subpages
- [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`UpcomingHeroBadge.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingHeroBadge.tsx), [`UpcomingWorkshopSpotlight.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx): Fix 2×2 -> 1×4 Impact Ledger cell borders & padding alignment, stack hero CTA buttons cleanly (`w-full sm:w-auto justify-center`) on `< 640px`, and allow clean pill/spotlight wrapping on `320px`.
- [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx), [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), [`formatting-guidelines/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/formatting-guidelines/page.tsx): Responsive `p-5 sm:p-8` card padding, multi-line `rounded-2xl sm:rounded-full` header badges, and `break-all` + `min-w-0` on `HEMS_Abstract_LastName_FirstName.pdf`.
- [`PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx), [`CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx), [`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx), [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx), [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx), [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx), [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx), [`ArchiveHubClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/archive/ArchiveHubClient.tsx):
  - `16px` mobile inputs (`text-base sm:text-sm`) in `ContactClient.tsx`.
  - Responsive `p-5 sm:p-8` cards, `break-all` on long mailto addresses, `min-w-[500px]` inside `overflow-x-auto` proceedings preview table, `flex-wrap` on `/archive` search result action buttons, and `grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` on sponsor logos.

### Step 5: Modals, Hover Guards & Officer Panels
- [`FrontendPreviewHover.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/FrontendPreviewHover.tsx): `hidden md:block` + `w-[min(400px,calc(100vw-2rem))]`.
- [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx) & [`CitationModal.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/CitationModal.tsx): `max-h-[90dvh] overflow-y-auto`, `text-base sm:text-sm` auth inputs, and `break-all` citation URLs.
- [`auth/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/auth/page.tsx), [`admin/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/page.tsx), [`admin/analytics/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/admin/analytics/page.tsx), [`board/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/board/page.tsx), [`reviewer/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/reviewer/page.tsx): `16px` mobile inputs, responsive `p-5 sm:p-8` containers, `flex-wrap` tabs/badges, and `break-all` officer email pills.

---

## 4. Verification Matrix (`@qa`)

1. **Static Export Build:** `npm --prefix src/frontend run build` (`40/40` static routes, `0` TypeScript/Next.js errors).
2. **Headless Multi-Viewport Overflow & Touch Audit:** Automated Playwright/Chromium verification across `320×568`, `375×812`, `390×844`, `768×1024`, `820×1180`, and `1024×768` asserting `document.documentElement.scrollWidth <= window.innerWidth` across all key routes, visible mobile/tablet portal sub-navigation, tap-accessible `Navbar` dropdowns/drawer, and `>= 16px` mobile form input font sizes.
3. **SEO Non-Regression:** Re-run `verify_seo_post.py` (`40/40` HTML exports, `Errors: 0`) and confirm `git diff src/frontend/src/app/archive` is `0` bytes.

