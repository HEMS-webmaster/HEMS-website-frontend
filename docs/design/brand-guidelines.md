# Official HEMS Brand & Editorial Design Guide

- **Custodian:** `@brand`
- **Status:** ACTIVE
- **Version:** `3.2.0` (*Scholarly Precision & Editorial Symposium — User-Data-Interface Readability Refinement*)
- **Previous Archives:** [`archive/brand-guidelines-v3.1.0.md`](./archive/brand-guidelines-v3.1.0.md) · [`archive/brand-guidelines-v3.0.0.md`](./archive/brand-guidelines-v3.0.0.md) · [`archive/brand-guidelines-v2.0.0.md`](./archive/brand-guidelines-v2.0.0.md)

This document is the single source of truth for the visual, typographic, structural, and editorial identity of the **Harsh-Environment Mass Spectrometry (HEMS) Society & Biennial Workshop** (`hems-workshop.org`).

---

## 1. Core Aesthetic Philosophy

- **Concept:** **"Scholarly Precision & Editorial Symposium"** — inspired by premier international scientific forums and journals (*Gordon Research Conferences*, *Woods Hole Oceanographic Institution*, *ACS*, *Nature*).
- **Character:** Quiet authority, warm human-centered typography, generous breathing room, `1px` architectural hairlines, and authentic analytical instrumentation graphics.
- **Anti-Patterns (Strictly Retired):**
  - Do **not** use monospace / "computer-readout" fonts (`IBM Plex Mono`, `font-mono`, or fixed-width terminal/typewriter faces) for UI labels, photo credit overlays, section kickers, dates, badges, captions, or metadata.
  - Do **not** set primary or section headlines in `font-black uppercase` ("shouting" industrial catalog headings) or stack thick `border-b-4` text underlines.
  - Do **not** use decorative sci-fi radar rings, HUD widgets, or background sine-wave SVG overlays behind navigation text.
  - Do **not** reference non-existent storefronts (`HEMS Store`) or leave expired prior-year registration/booking buttons active.

---

## 2. Color & Surface System ("Alabaster Paper & Oceanic Sapphire")

Rather than placing heavy `slate-200` gray cards onto a pure white background, v3.2.0 uses a warm-cool **Alabaster Paper** canvas so pure **Specimen White** cards float naturally with `1px` hairline borders and whisper-soft elevation, while dedicated **User-Data-Interface** surface, label, and border tokens separate structural form labels from user-entered values.

| Token Name | Hex | CSS / Tailwind Variable | Role & Usage |
| :--- | :--- | :--- | :--- |
| **Alabaster Paper** | `#FAFBFD` | `var(--background)` / `bg-background` | Primary page canvas; reduces glare while letting `#FFFFFF` cards stand out cleanly. |
| **Specimen White** | `#FFFFFF` | `var(--card)` / `bg-white` | Primary elevated cards, specimen frames, translucent sticky navigation, and active data-entry input wells. |
| **Porcelain Mist** | `#F1F5F9` | `var(--surface)` / `bg-surface` | Soft secondary section bands and ledger table headers (`slate-100`). |
| **Form Grouping Well** | `#F3F6FA` | `var(--surface-well)` / `bg-surface-well` | Cool-tinted inset container behind grouped form controls and repeating field rows so `#FFFFFF` input boxes never sit white-on-white. |
| **Hairline Rule** | `#E2E8F0` | `var(--border-subtle)` / `border-slate-200` | Crisp `1px` structural dividers, card borders, and ledger grids. |
| **Oxford Ink** | `#0F172A` | `var(--heading)` / `text-slate-900` | Display titles (`h1`–`h3`), primary table numerals, and user-entered text-box values (`17.8:1` on `#FFFFFF`). |
| **Field Label Navy** | `#1E3A5F` | `var(--field-label)` / `text-field-label` | Deep slate-navy (`~11.4:1` contrast) reserved for form field labels (`.hems-label`) so structural UI prompts are visually distinct from neutral `#0F172A` entered data. |
| **Control Hairline** | `#94A3B8` | `var(--field-border)` | Authoritative `1px` input/select/textarea border (hover `#64748B`, focus `#0369A1` + `3px` halo) paired with subtle top inset depth. |
| **Placeholder Slate** | `#7C8BA1` | `var(--field-placeholder)` | Muted normal-weight placeholder hint (`~3.5:1` on `#FFFFFF`), clearly lighter than entered `#0F172A` content. |
| **Editorial Slate** | `#334155` | `var(--foreground)` / `text-foreground` | Long-form body prose (`4.5:1+` effortless reading contrast without pure-black harshness). |
| **Caption Slate** | `#64748B` | `var(--muted)` / `text-slate-500` | Provenance notes, archival captions, `.hems-label-hint` qualifiers, and secondary metadata. |
| **Oceanic Sapphire** | `#0369A1` | `var(--primary)` / `text-primary` | Primary brand action color (`sky-700`); high WCAG AA contrast for buttons, links, and active indicators. |
| **Instrumentation Teal** | `#0F766E` | `var(--secondary)` / `text-secondary` | Secondary scientific accent (`teal-700`) for active highlights, grants, and verified milestones. |

---

## 3. Dual-Font Editorial Typography Hierarchy

All fonts MUST be self-hosted/optimized via Next.js `next/font/google` in `src/app/layout.tsx` (never via render-blocking `@import` in CSS) to guarantee zero layout shift (`CLS = 0`). Monospace fonts (`IBM Plex Mono` / `font-mono`) are retired from the brand palette so the site reads like a refined scientific society and coastal symposium rather than a terminal readout.

### 3.1 Editorial Display Serif — `Source Serif 4` (`--font-serif` / `font-serif`)
- **Usage:** Hero `h1` display titles, primary narrative `h2` section headers, and institutional mission pull-quotes.
- **Styling Rule:** Always **Title Case** (or sentence case for quotes), `font-semibold` (`600`), tight tracking (`tracking-tight` / `-0.02em`), and `leading-[1.12]`.

### 3.2 Universal Interface, Metadata & Body Sans — `Noto Sans` (`--font-sans` / `font-sans`)
- **Usage:** Global navigation, card titles (`h3`/`h4`), buttons, tables, portal dashboards, all body paragraphs, **and** all editorial metadata (section eyebrows, workshop ordinals/dates, photo credit badges, captions, $m/z$ plot labels, and grant figures such as `\$1,500.00`).
- **Body Styling Rule:** `font-normal` (`400`) to `font-semibold` (`600`), `leading-relaxed` (`1.65`) on prose, constrained to `65ch–72ch` (`max-w-2xl`) for optimal eye tracking.
- **Eyebrow, Badge & Caption Styling Rule:** Set compact labels, photo credits, and section kickers in clean `Noto Sans` (`text-[11px]`–`text-xs`, `font-medium` or `font-semibold`). Reserve `UPPERCASE` strictly for short `11px` section kickers or status pills with restrained tracking (`tracking-[0.08em]`–`tracking-[0.12em]`), and keep photo credit overlays and provenance notes in natural Title/Sentence Case (`tabular-nums` when aligning dates or figures).

---

## 4. Authentic Scientific Visuals & Logo Discipline

1. **Analytical Graphics Over Sci-Fi Tropes:**
   - Visual centerpieces must reflect real mass spectrometry and field science: calibrated $m/z$ spectral plots (labeled molecular/fragment peaks such as $\text{H}_2\text{O}^+$, $\text{N}_2^+$, $\text{O}_2^+$, $\text{Ar}^+$, $\text{CO}_2^+$, $\text{SO}_2^+$ set in clean `Noto Sans` `tabular-nums`), authentic deployment photography, and structured archival ledgers.
2. **Official Emblem (`hemslogo.jpg`):**
   - Because `hemslogo.jpg` (`3756×2594`) is a detailed `~3:2` landscape scientific emblem (depicting Earth's oceans encircled by five mass analyzers and a spacecraft), always frame it in its natural `~3:2` landscape proportion (`mix-blend-multiply` inside a clean `bg-white` card) rather than cramping it into tiny square boxes:
     - **Global Navbar (`Navbar.tsx`):** `56px–70px` wide (`w-14 h-10 sm:w-[70px] sm:h-12`).
     - **Homepage Hero Lockup, Footer & Subpage Headers:** `88px–144px` wide (`w-24` to `w-36`, `h-auto`), giving the HEMS emblem consistent, recognizable institutional presence across every public route and portal view.

---

## 5. Navigation, Chrome & Layout Architecture

1. **Global Header (`Navbar.tsx`):**
   - Clean translucent bar (`bg-white/92 backdrop-blur-md border-b border-slate-200/85`) with zero decorative background SVG waves.
   - Left lockup: `56px–70px` wide `3:2` HEMS emblem + **HEMS Society** (`font-serif font-semibold`) + subtle `501(c)(3) Scientific Society` sans-serif subtitle (`Noto Sans`, `text-[11px] font-medium text-slate-500` — never attach `Est. 1999` to the Society entity).
   - Clear visitor-first navigation labels (**Home**, **2027 Workshop**, **About**, **History**, **Student Travel Awards**, **Archives** dropdown, and **Contact** CTA) with active-route underline indicators and a full **Mobile/Tablet Navigation Drawer** (`< 1024px`).
   - Internal **Committee Sign In** (`/auth`) lives discreetly in `Footer.tsx` when signed out; authenticated officers/reviewers still see their role badge & Admin Portal popover in `Navbar.tsx`.
2. **Two Complementary Page Modes:**
   - **Editorial Narrative Pages (`/`, `/about`, `/history`, `/student-awards`, `/contact`, `/corporate-sponsorship`):** Clean `Noto Sans` eyebrow kicker → Title-Case `Source Serif 4` headline → `max-w-2xl` lead summary → `1px` slate rule → Specimen White card grids.
   - **Workshop Cycle & Archive Portals (`/layout-portal`, `/archive`):** High-clarity utility layouts with persistent navigation and instant scannability. *(Note: `/archive/[year]` pages are governed by an explicit `@bo` immutability lock.)*
3. **User-Data-Interface Ergonomics (Forms, Inputs, Labels & Data Ledgers — `/abstract-submission`, `/board/mailing-list`, `/admin`, `/board/announcements`, `/reviewer`):**
   - **Mandatory Visible Field Labels:** Every form input, select, and textarea pairs with a visible `<label>` (single-field search inputs may rely on a leading search icon + `aria-label`, though labeled search toolbars are preferred in multi-control admin bars). Never leave bare placeholder-only controls inside multi-field forms or import toolbars.
   - **Label vs. Text-Box Content Hierarchy:** Set form field labels (`.hems-label`) in **Title/Sentence Case** `Noto Sans` `13px` (`0.8125rem`) `font-semibold` (`600`) in **Field Label Navy** (`#1E3A5F`), placing secondary qualifiers such as `(Optional)` or `(Max 300 chars)` in `.hems-label-hint` (`12px font-normal text-slate-500`). Reserve all-caps micro-tracking solely for page eyebrows and badge pills. Set text-box values (`.hems-control`) inside pure `#FFFFFF` wells with `#94A3B8` borders, a subtle top inset shadow (`inset 0 1px 2px rgba(15, 23, 42, 0.06)`), `#0F172A` `font-normal` (`400`) input text (`14px–15px`), and `#7C8BA1` placeholders so entered data stands sharply apart from both placeholders and labels.
   - **Figure-Ground Grouping:** Multi-field control toolbars, inline add forms, and repeating author/affiliation cards sit inside a cool **Form Grouping Well** (`#F3F6FA` / `--surface-well`) so `#FFFFFF` input boxes read immediately as interactive wells.
   - **Ledger Table Readability:** Directory and whitelist tables use `bg-slate-100/95` headers with `border-y border-slate-300/85` and `11px` `font-bold uppercase tracking-[0.06em] text-slate-700`, `divide-slate-200/85` body rows, `text-slate-900 font-semibold` primary identifiers, and `text-slate-600` secondary metadata (`text-slate-400` reserved strictly for blank `—` cells).

---

## 6. Copywriting & Tone of Voice

- **Voice:** Scholarly, welcoming, precise, and internationally inclusive—representing an all-volunteer 501(c)(3) community uniting academic, government, and industrial investigators.
- **Historical Milestones (1999 Workshop vs. 2008 Society):** The inaugural **HEMS Workshop** convened in **February 1999** (USF St. Petersburg, FL; `1999–2025` proceedings archive), whereas the **Harsh-Environment Mass Spectrometry Society, Inc.** was formally established/incorporated as a Florida **501(c)(3)** nonprofit in **2008** (holding its first post-incorporation meeting—the 7th Workshop—in Santa Barbara, CA in **2009**). Omit `Est. 1999` from compact Society badges and social share graphics.
- **Provenance-First Captions:** Photo captions must never state what is already visually obvious in the image; instead, record unseen archival context (exact date, host venue, city, scheduled workshop occasion, or research presenter/institution).
- **Temporal Hygiene:** Dynamic biennial cycle dates, fees, and submission links must flow from `useUpcomingWorkshop()` (backed by the HEMS Nonprofit Google Sheet + `upcoming_workshop.json`), displaying calm, dignified `TBA` / `Opening in 2027` states during inter-workshop planning rather than dead links.
