# Implementation Plan - HEMS Page & Navigation Refactoring

This plan outlines the steps required to remove the "Join HEMS" page, update the navigation bar to highlight the "Contact" page as a prominent call-to-action button, create six new informational pages for "Student Awards", "Corporate Sponsorship", "Accommodations", "Call for Papers", "Registration", and "Formatting Guidelines" populated with legacy website content, and integrate links to these new pages within the Portal page.

## User Review Required

> [!IMPORTANT]
> The new "Student Awards" page will outline eligibility criteria and submission guidelines for the $1,500.00 travel grants. Applications are to be sent via email to `hemsworkshop@hems-workshop.org`.
> The new "Corporate Sponsorship" page will document the sponsorship benefits, rate packages ($1,350 full or $850/$500 split), past sponsors registry, and contact info (Tim Short at `rtshort00@gmail.com`). 
> The new "Accommodations" page will document the workshop venue (Sheraton Virginia Beach Oceanfront Hotel), room block pricing ($124.00/night), booking deadline (Friday, September 5, 2025), and direct reservation links.
> The new "Call for Papers" page will document technical submission scope, oral and poster presentations, formatting guidelines, deadline cutoff (Friday, July 1, 2025), and direct links to Ex Ordo portal for submissions (`https://hems-workshop2025.exordo.com/submissions/new`).
> The new "Registration" page templates ticket categories ($250 student, $500 professional, and $1,350 sponsor), billing details, key deadlines, cancellation terms, and links to Ex Ordo registration.
> The new "Formatting Guidelines" page templates abstract specifications, margin metrics (1-inch), typographies (Times New Roman/Arial, 11-12pt), naming protocols, structural sections, and document templates download links.

Please verify if the planned slugs `/student-awards`, `/corporate-sponsorship`, `/accommodations`, `/call-for-papers`, `/registration`, and `/formatting-guidelines` are correct.

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

### Portal Hub Shared Layout Route Group

#### [NEW] [(portal)/layout.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/layout.tsx)
- Shared Client Component layout wrapper rendering the left Portal Sidebar Navigation bar (Portal navbar) and yielding children inside a main panel container (`p-6 md:p-12 bg-surface`).
- Keeps the sidebar visible across all six dashboard sub-routes: `/layout-portal` (Overview), `/call-for-papers`, `/student-awards`, `/corporate-sponsorship`, `/accommodations`, and `/registration` to allow easy browsing.
- Removed the obsolete Resources section entirely from the sidebar.

#### [MODIFY] [(portal)/layout-portal/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/layout-portal/page.tsx)
- Move portal overview page to the shared route group directory and refactor to yield inner content dynamically inside the shared portal layout.

#### [MODIFY] [(portal)/call-for-papers/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/call-for-papers/page.tsx)
- Move technical papers page to the shared route group directory, and refactor to yield inner content.
- Integrate a new **Formatting Guidelines** resource sidebar card to prompt authors directly during technical submissions prep.

#### [MODIFY] [(portal)/student-awards/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/student-awards/page.tsx)
- Relocated inside the shared layout route group directory, refactored to leverage the shared layout and display the portal sidebar navbar dynamically.

#### [MODIFY] [(portal)/corporate-sponsorship/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/corporate-sponsorship/page.tsx)
- Relocated inside the shared layout route group directory, refactored to leverage the shared layout and display the portal sidebar navbar dynamically.

#### [MODIFY] [(portal)/accommodations/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/accommodations/page.tsx)
- Move lodging page to the shared route group directory, and refactor to yield inner content.

#### [MODIFY] [(portal)/registration/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/(portal)/registration/page.tsx)
- Move tickets page to the shared route group directory, and refactor to yield inner content.

---

### Other Informational Pages

#### [NEW] [formatting-guidelines/page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/formatting-guidelines/page.tsx)
- Create a dedicated manuscript styling specs catalog.

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
- Inspect all new templates on desktop and mobile viewports to ensure they are visually consistent, engaging, and match the site's styling system.
