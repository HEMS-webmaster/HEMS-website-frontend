# Implementation Plan - HEMS Page & Navigation Refactoring

This plan outlines the steps required to remove the "Join HEMS" page, update the navigation bar to highlight the "Contact" page as a prominent call-to-action button, create two new informational pages for "Student Awards" and "Corporate Sponsorship" populated with legacy website content, and integrate links to these new pages within the Portal page.

## User Review Required

> [!IMPORTANT]
> The new "Student Awards" page will outline eligibility criteria and submission guidelines for the $1,500.00 travel grants. Applications are to be sent via email to `hemsworkshop@hems-workshop.org`.
> The new "Corporate Sponsorship" page will document the sponsorship benefits, rate packages ($1,350 full or $850/$500 split), past sponsors registry, and contact info (Tim Short at `rtshort00@gmail.com`). 

Please verify if the planned slugs `/student-awards` and `/corporate-sponsorship` are correct.

## Proposed Changes

### Navigation & Layout refactoring

#### [MODIFY] [Navbar.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/components/layout/Navbar.tsx)
- Remove the link pointing to `/join` ("Join HEMS").
- Transition the `Contact` page navigation element into a highlighted call-to-action style, adopting the exact visual treatment previously used by the "Join HEMS" button (e.g., `bg-foreground text-background hover:bg-foreground/80 px-4 py-2 rounded-md font-bold transition-all shadow-md`).

#### [MODIFY] [Footer.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/components/layout/Footer.tsx)
- Remove the link pointing to `/join` ("Join") from the footer links panel.

#### [DELETE] [join/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/join/page.tsx)
- Remove the obsolete page folder and file.

---

### Portal Hub Integration

#### [MODIFY] [layout-portal/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/layout-portal/page.tsx)
- Add direct navigation links to `/student-awards` and `/corporate-sponsorship` under the "Resources" category in the left sidebar.
- Build a new dashboard grid section in the main portal layout containing card representations for both "Student Travel Awards" and "Corporate Sponsorship opportunities". Each card will show a concise summary and a clear call-to-action link.

---

### New Informational Pages

#### [NEW] [student-awards/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/student-awards/page.tsx)
- Create a dedicated informational page.
- Layout:
  - Header: Clean academic page banner, with title and deadline.
  - Section 1: Introduction and Award Amount ($1,500.00).
  - Section 2: Eligibility Requirements (full-time graduate students).
  - Section 3: Step-by-step Application Guidelines (cover letter, advisor letter, abstract info, CV).
  - Section 4: Award Criteria (academic merit, abstract quality, publication potential).
  - Section 5: Callout box for Email Submission with a link to `hemsworkshop@hems-workshop.org`.

#### [NEW] [corporate-sponsorship/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/corporate-sponsorship/page.tsx)
- Create a dedicated corporate sponsorship guide.
- Layout:
  - Header: Clean sponsor page banner with options download action.
  - Section 1: Overview and Value (supporting the workshop and student awards).
  - Section 2: Sponsorship Benefits (display tables, banner credits, website logotype link, poster space).
  - Section 3: Pricing Table & Rates ($1,350 full or $850/$500 split options for corporate spending guidelines).
  - Section 4: Contact card pointing to Tim Short at `rtshort00@gmail.com` for queries.
  - Section 5: Past Sponsors Registry (visual typographic grid highlighting loyal corporate contributors).

---

## Verification Plan

### Automated Tests
- Validate that the application builds successfully with no TypeScript compilation or styling defects.
  ```bash
  npm run build
  ```

### Manual Verification
- Verify the navigation header layout: confirm the "Join HEMS" link is removed and the "Contact" link is styled as a highlighted button.
- Verify the footer layout: confirm "Join" is removed.
- Verify the Portal Hub links in both the sidebar and the main content cards.
- Inspect `/student-awards` and `/corporate-sponsorship` on desktop and mobile viewports to ensure they are visually consistent, engaging, and match the site's styling system.
