# Official HEMS Brand & Editorial Design Guide

- **Custodian:** `@brand`
- **Status:** ARCHIVED (Superseded by `v3.1.0`)
- **Version:** `3.0.0` (*Scholarly Precision & Editorial Symposium*)
- **Previous Archive:** [`brand-guidelines-v2.0.0.md`](./brand-guidelines-v2.0.0.md)

This document is the single source of truth for the visual, typographic, structural, and editorial identity of the **Harsh-Environment Mass Spectrometry (HEMS) Society & Biennial Workshop** (`hems-workshop.org`).

---

## 1. Core Aesthetic Philosophy

- **Concept:** **"Scholarly Precision & Editorial Symposium"** — inspired by premier international scientific forums and journals (*Gordon Research Conferences*, *Woods Hole Oceanographic Institution*, *ACS*, *Nature*).
- **Character:** Quiet authority, crisp editorial typography, generous breathing room, `1px` architectural hairlines, and authentic analytical instrumentation graphics.
- **Anti-Patterns (Strictly Retired):**
  - Do **not** set primary or section headlines in `font-black uppercase` ("shouting" industrial catalog headings) or stack thick `border-b-4` text underlines.
  - Do **not** use decorative sci-fi radar rings, HUD widgets, or background sine-wave SVG overlays behind navigation text.
  - Do **not** reference non-existent storefronts (`HEMS Store`) or leave expired prior-year registration/booking buttons active.

---

## 2. Color & Surface System ("Alabaster Paper & Oceanic Sapphire")

Rather than placing heavy `slate-200` gray cards onto a pure white background, v3.0.0 uses a warm-cool **Alabaster Paper** canvas so pure **Specimen White** cards float naturally with `1px` hairline borders and whisper-soft elevation.

| Token Name | Hex | CSS / Tailwind Variable | Role & Usage |
| :--- | :--- | :--- | :--- |
| **Alabaster Paper** | `#FAFBFD` | `var(--background)` / `bg-background` | Primary page canvas; reduces glare while letting `#FFFFFF` cards stand out cleanly. |
| **Specimen White** | `#FFFFFF` | `var(--card)` / `bg-white` | Primary elevated cards, specimen frames, and translucent (`bg-white/90`) sticky navigation. |
| **Porcelain Mist** | `#F1F5F9` | `var(--surface)` / `bg-surface` | Soft secondary section bands, subtle inset wells, and table headers (`slate-100`). |
| **Hairline Rule** | `#E2E8F0` | `var(--border-subtle)` / `border-slate-200` | Crisp `1px` structural dividers, card borders, and ledger grids. |
| **Oxford Ink** | `#0F172A` | `var(--heading)` / `text-slate-900` | Display titles (`h1`–`h3`) and primary numerals for crisp scholarly contrast. |
| **Editorial Slate** | `#334155` | `var(--foreground)` / `text-foreground` | Long-form body prose (`4.5:1+` effortless reading contrast without pure-black harshness). |
| **Caption Slate** | `#64748B` | `var(--muted)` / `text-slate-500` | Provenance notes, archival captions, and secondary metadata. |
| **Oceanic Sapphire** | `#0369A1` | `var(--primary)` / `text-primary` | Primary brand action color (`sky-700`); high WCAG AA contrast for buttons, links, and active indicators. |
| **Instrumentation Teal** | `#0F766E` | `var(--secondary)` / `text-secondary` | Secondary scientific accent (`teal-700`) for active telemetry, grants, and verified milestones. |

---

## 3. Tri-Font Editorial Typography Hierarchy

All fonts MUST be self-hosted/optimized via Next.js `next/font/google` in `src/app/layout.tsx` (never via render-blocking `@import` in CSS) to guarantee zero layout shift (`CLS = 0`).

### 3.1 Editorial Display Serif — `Source Serif 4` (`--font-serif` / `font-serif`)
- **Usage:** Hero `h1` display titles, primary narrative `h2` section headers, and institutional mission pull-quotes.
- **Styling Rule:** Always **Title Case** (or sentence case for quotes), `font-semibold` (`600`), tight tracking (`tracking-tight` / `-0.02em`), and `leading-[1.12]`.

### 3.2 Universal Interface & Body Sans — `Noto Sans` (`--font-sans` / `font-sans`)
- **Usage:** Global navigation, card titles (`h3`/`h4`), buttons, tables, portal dashboards, and all body paragraphs.
- **Styling Rule:** `font-normal` (`400`) to `font-semibold` (`600`), `leading-relaxed` (`1.65`) on prose, constrained to `65ch–72ch` (`max-w-2xl`) for optimal eye tracking.

### 3.3 Technical & Archival Monospace — `IBM Plex Mono` (`--font-mono` / `font-mono`)
- **Usage:** Small uppercase section eyebrows (`01 — TECHNICAL CHARTER`), $m/z$ mass-to-charge callouts, workshop ordinals/dates, grant amounts (`\$1,500.00`), and proceedings file metadata.
- **Styling Rule:** `UPPERCASE` is permitted **only** on compact `10px–12px` (`text-[11px] tracking-[0.14em]`) monospace labels, pills, and table headers.

---

## 4. Authentic Scientific Visuals & Logo Discipline

1. **Analytical Graphics Over Sci-Fi Tropes:**
   - Visual centerpieces must reflect real mass spectrometry and field science: calibrated $m/z$ spectral plots (labeled molecular/fragment peaks such as $\text{H}_2\text{O}^+$, $\text{N}_2^+$, $\text{O}_2^+$, $\text{Ar}^+$, $\text{CO}_2^+$, $\text{SO}_2^+$), authentic deployment photography, and structured archival ledgers.
2. **Official Emblem (`hemslogo.jpg`):**
   - Render with `mix-blend-multiply` inside a clean white frame (`bg-white`) at restrained architectural scales (`32px–40px` in the navbar brand lockup; `56px–72px` in formal society seals)—avoiding oversized `128px+` heavy-bordered boxes on every page.

---

## 5. Navigation, Chrome & Layout Architecture

1. **Global Header (`Navbar.tsx`):**
   - Clean translucent bar (`bg-white/90 backdrop-blur-md border-b border-slate-200/80`) with zero decorative background SVG waves.
   - Left lockup: `36px` HEMS emblem + **HEMS Society** (`font-serif font-semibold`) + subtle `EST. 1999` mono tag.
   - Clear visitor-first navigation labels (**Home**, **2027 Workshop**, **About**, **History**, **Student Travel Awards**, **Archives** dropdown, and **Contact** CTA) with active-route underline indicators and a full **Mobile Navigation Drawer** (`< 768px`).
   - Internal **Committee Sign In** (`/auth`) lives discreetly in `Footer.tsx` when signed out; authenticated officers/reviewers still see their role badge & Admin Portal popover in `Navbar.tsx`.
2. **Two Complementary Page Modes:**
   - **Editorial Narrative Pages (`/`, `/about`, `/history`, `/student-awards`, `/contact`, `/corporate-sponsorship`):** Eyebrow kicker → Title-Case `Source Serif 4` headline → `max-w-2xl` lead summary → `1px` slate rule → clean Specimen White card grids.
   - **Workshop Cycle & Archive Portals (`/layout-portal`, `/archive`):** High-clarity utility layouts with persistent navigation and instant scannability. *(Note: `/archive/[year]` pages are governed by an explicit `@bo` immutability lock.)*

---

## 6. Copywriting & Tone of Voice

- **Voice:** Scholarly, welcoming, precise, and internationally inclusive—representing an all-volunteer 501(c)(3) community uniting academic, government, and industrial investigators.
- **Temporal Hygiene:** Dynamic biennial cycle dates, fees, and submission links must flow from `useUpcomingWorkshop()` (backed by the HEMS Nonprofit Google Sheet + `upcoming_workshop.json`), displaying calm, dignified `TBA` / `Opening in 2027` states during inter-workshop planning rather than dead links.
