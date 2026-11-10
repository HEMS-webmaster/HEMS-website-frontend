# Plan: Brand Guidelines v3.0.0 & Refined Academic Homepage Refresh

- **Date:** 2026-11-10
- **Author:** `@arch` (with `@brand`, `@dev`, `@qa`, `@ops`)
- **Status:** Approved by `@bo` — Executing

---

## 1. Objective
1. Archive the legacy v2.0.0 Brand Guide and establish **v3.0.0 ("Scholarly Precision & Editorial Symposium")** in [`.agents/config/design/brand-guidelines.md`](../../.agents/config/design/brand-guidelines.md) and [`docs/design/brand-guidelines.md`](../design/brand-guidelines.md).
2. Design and implement an elevated, modern academic homepage ([`src/frontend/src/app/page.tsx`](../../src/frontend/src/app/page.tsx)) and site shell (`globals.css`, `layout.tsx`, `Navbar.tsx`, `Footer.tsx`) for live preview, without touching protected archive pages (`src/frontend/src/app/archive/**`).

---

## 2. Design & Engineering Changes

1. **Brand Guide Archive & v3.0.0 Specification (`@brand`)**
   - Preserve exact v2.0.0 copy at `.agents/config/design/archive/brand-guidelines-v2.0.0.md` and `docs/design/archive/brand-guidelines-v2.0.0.md`.
   - Define the 3-tier typography hierarchy (`Source Serif 4` Title-Case display headings, `Noto Sans` body/UI, `IBM Plex Mono` technical metadata/kickers), refined Alabaster Paper (`#FAFBFD`) + Specimen White (`#FFFFFF`) + Oceanic Sapphire (`#0369A1`) + Instrumentation Teal (`#0F766E`) token system, authentic scientific visuals standard, and decluttered navigation chrome.

2. **Typography & Token Engine (`@dev`)**
   - Load `Source_Serif_4`, `Noto_Sans`, and `IBM_Plex_Mono` via `next/font/google` in `src/frontend/src/app/layout.tsx`, removing the render-blocking 6-family Google Fonts `@import` in `globals.css`.
   - Expose backward-compatible CSS variables (`--background`, `--surface`, `--card`, `--heading`, `--foreground`, `--muted`, `--primary`, `--secondary`, `--font-serif`, `--font-sans`, `--font-mono`).

3. **Navigation & Institutional Footer (`@dev`)**
   - `Navbar.tsx`: Remove background sine-wave SVG clutter; add `36px` `mix-blend-multiply` HEMS emblem lockup; rename `"Portal"` → `"2027 Workshop"`; add active-route indicator (`usePathname()`); implement a full mobile drawer menu; keep role popover visible when authenticated while moving unauthenticated `"Committee Sign In"` (`/auth`) to `Footer.tsx`.
   - `Footer.tsx`: Upgrade to a refined 3-column academic society footer with 501(c)(3) provenance, quick navigation, 2027 workshop links, and discrete Committee Sign In link.

4. **Editorial Homepage & Analytical Mass Spectrum Card (`@dev`)**
   - Create `src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx` (client component consuming `useUpcomingWorkshop()`).
   - Rebuild `src/frontend/src/app/page.tsx` around 5 cohesive scholarly sections:
     1. **Editorial Split Hero:** Title-Case `Source Serif 4` headline + mission pull-quote on left; **Calibrated In-Situ Mass Spectrum ($m/z\ 1\text{–}100$) + Live 16th Workshop Dossier Card** on right (retiring the spinning sci-fi radar rings).
     2. **Institutional Impact Ledger:** Hairline 4-metric strip (`1999` Founded • `15` Symposia • `1,590` Open-Access Files • `52` Industry & Lab Partners).
     3. **`01 — Technical Charter`:** Numbered research pillars (*Planetary, Oceanic & Volcanic Frontiers*, *Miniature & Ruggedized Hardware*, *Autonomous Field Sensing*).
     4. **`02 — Open-Access Proceedings`:** 15th Workshop (Virginia Beach, 2025) session highlights + direct archive discovery.
     5. **`03 — Society Governance & Participation`:** Student Travel Awards (`$1,500.00`), Society History, and Corporate Sponsorship pathways.

5. **Verification & Private Preview Update (`@qa` & `@ops`)**
   - Run `npx next typegen`, `npx tsc --noEmit`, and `node tests/unit/upcomingWorkshopCsv.test.mjs`.
   - Verify `0` diff lines on `src/frontend/src/app/archive/**`.
   - Build static export and update the `preview-2027` Firebase Hosting Preview Channel + local `localhost:3000` dev server.

