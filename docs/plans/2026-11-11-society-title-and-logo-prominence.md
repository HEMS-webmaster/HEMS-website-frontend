# Architectural Plan: Mainpage Society Title Prominence & Site-Wide HEMS Emblem Rollout

- **Date:** 2026-11-11
- **Authors:** `@prod`, `@brand`, `@arch`
- **Implementer:** `@dev`
- **Status:** ACTIVE

---

## 1. Problem Statement

1. **Mainpage Society Name (`/`):** `'Harsh-Environment Mass Spectrometry Society'` in [`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx) was rendered as an `11px` muted gray kicker (`text-slate-500`) and hidden below `768px`, while `/hemslogo.jpg` had zero appearances on the homepage.
2. **Logo Proportion & Coverage (`hemslogo.jpg`):** Because `/hemslogo.jpg` (`3756×2594`, `~3:2` landscape) depicts Earth's oceans encircled by five mass analyzers and a spacecraft, placing it inside tiny `36×36px` (`w-9 h-9`) square containers in [`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) and [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx) compressed its inner width to `28px` (`~19px` tall). In addition, `/`, `/contact`, the Workshop Portal sidebar (`(portal)/layout.tsx`), `/call-for-papers`, `/registration`, `/accommodations`, and `/formatting-guidelines` lacked the HEMS emblem altogether.

---

## 2. Implementation Blueprint

1. **Homepage Hero Identity Lockup & 501(c)(3) Seal ([`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx)):**
   - Render a prominent **Society Identity Lockup** visible across mobile, tablet, and desktop: a crisp `w-24 sm:w-32 lg:w-36` (`96px–144px` wide) white-framed `/hemslogo.jpg` emblem alongside **`Harsh-Environment Mass Spectrometry Society`** scaled up to `font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-primary tracking-tight leading-snug` (`20px` → `30px`).
   - Keep `<UpcomingHeroBadge />` gated to `hidden md:block` so cell-phone hero clarity is preserved.
   - Add a `w-20` white-framed `/hemslogo.jpg` seal inside the bottom `501(c)(3)` Society card.
2. **Global Chrome ([`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) & [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx)):**
   - Upgrade `Navbar.tsx` emblem frame from `w-9 h-9` to `w-14 h-10 sm:w-[70px] sm:h-12` (`56×40px` mobile, `70×48px` `sm:`+) inside `h-16 sm:h-[72px]`.
   - Upgrade `Footer.tsx` emblem frame from `w-9 h-9` to `w-24 sm:w-28` (`96px–112px` wide, natural `3:2`).
3. **Subpages & Workshop Portal (`100%` Public Route Emblem Presence):**
   - Enlarge existing seals to natural `3:2` landscape proportions (`w-24 sm:w-28` / `w-28 sm:w-32`) in [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx), [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx), [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx), [`PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx) (also visible on mobile), and [`ArchiveHubClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/archive/ArchiveHubClient.tsx).
   - Add the official HEMS Emblem header seal to [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx), [`(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx) (desktop sidebar header + synced `sm:top-[72px]` mobile bar), [`CallForPapersClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CallForPapersClient.tsx), [`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx), [`AccommodationsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/AccommodationsClient.tsx), and [`formatting-guidelines/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/formatting-guidelines/page.tsx).
   - Update Section 4.2 & 5.1 of [`docs/design/brand-guidelines.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/design/brand-guidelines.md) (`@brand`).
   - Preserve `0` edits to `src/frontend/src/app/archive/[year]/**`.

