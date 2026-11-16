# Plan: Collapsible Left-Sidebar Sections for Officer Portals

- **Date:** 2026-11-16 (Addendum 41)
- **Owner:** `@dev` / `@arch`
- **Target File:** [`src/frontend/src/app/(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/layout.tsx)

## Scope
Add a visible, accessible collapse/expand button to the left-side navigation bar (`<aside>`) for each officer/admin portal section whenever visible to the signed-in user:
- **Operations Portal** (`operations`)
- **Treasurer Portal** (`treasurer`)
- **Board Portal** (`board`)
- **Admin Portal** (`admin`)

Keep **Workshop Portal**, **Attendee Portal**, and **Reviewer Portal** non-collapsible and unchanged.

## Design
1. Define `CollapsiblePortalKey = "operations" | "treasurer" | "board" | "admin"`, `PORTAL_COLLAPSE_STORAGE_KEY = "hems_portal_sidebar_collapsed_v1"`, and `DEFAULT_COLLAPSED_PORTALS` (all `false` by default for deterministic SSR hydration).
2. Hydrate persisted collapse preferences from `window.localStorage` inside `useEffect` (`try/catch`) and persist toggle updates in `togglePortalSection(key)`.
3. Extend `renderNavSection(title, links, collapsibleKey?)` to render a bordered collapse/expand chevron button (`ChevronDown` / `ChevronRight`) with `aria-expanded`, `aria-controls`, `aria-label`, and an active-route dot indicator when collapsed while a child route is active.
4. Verify with `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` and HTTP `200` checks against `/operations/registrations/`, `/treasurer/`, `/board/`, and `/admin/`.
