# Mobile Viewport Audit & Polish Plan (`360px`–`430px`)

**Date:** 2026-11-12  
**Agents:** `@arch`, `@brand`, `@dev`, `@qa`  
**Scope:** Comprehensive cell-phone usability/layout review across all public routes and surgical mobile polish in mutable `src/frontend/src/components/` files.

## 1. Audit Summary across Public Pages
- **Global & Navigation Chrome (`globals.css`, `Navbar.tsx`, `Footer.tsx`, `(portal)/layout.tsx`):**
  - `overflow-x: clip` prevents horizontal viewport drift while keeping `sticky` headers functional.
  - Mobile drawer uses `max-h-[calc(100dvh-4rem)]`, `44×44px` tap targets, collapsible Workshop sub-navigation, and a 3-column archive year selector.
  - Workshop portal pages feature a sticky horizontal pill bar (`overflow-x-auto no-scrollbar`) on `< 1024px`.
- **Interactive & Form UX (`HeroMassSpectrum.tsx`, `FrontendPreviewHover.tsx`, `DownloadGate.tsx`, `ContactClient.tsx`):**
  - SVG mass spectrum uses `touch-pan-y` so vertical thumb scrolling never gets trapped.
  - Hover preview cards check `(hover: hover) and (pointer: fine)` + `hidden md:block` so mobile taps open PDFs cleanly on first tap.
  - Inputs use `16px` (`text-base`) on mobile viewports to prevent iOS Safari focus zoom.

## 2. Surgical Mobile Fixes (Mutable `src/`)
1. **[CorporateSponsorshipClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx)**
   - Stack the Printable Version preview bar buttons cleanly on `360px`–`390px` viewports.
   - Change the 3-column Participation Tiers table wrapper from `overflow-hidden` to `overflow-x-auto print:overflow-visible` with `min-w-[520px] sm:min-w-0 print:min-w-0` so narrow phone screens can horizontally swipe the table while `@media print` / Save-as-PDF stays 100% unchanged.
2. **[ArchiveHubClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/archive/ArchiveHubClient.tsx)**
   - Add `justify-center` to the stacked mobile `Filters` button so its alignment matches the `Reset` button below the search input.
3. **[MailingListSignupCard.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/mailing/MailingListSignupCard.tsx)**
   - Wrap the privacy notice text and inline `<code>hems-workshop.org</code>` inside a single `<span>` so CSS `flex` does not split text nodes around `<code>` into squished columns on small phones.

## 3. Read-Only Boundary Note
- `src/frontend/src/app/archive/[year]/page.tsx` is read-only per project locks and is not modified. Report the minor `w-[245px]` host logo badge observation on `375px` phones to `@bo` in case an override is desired.

