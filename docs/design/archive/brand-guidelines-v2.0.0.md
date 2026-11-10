# 🌐 Official HEMS Brand & Identity Guide

**Custodian:** `@brand`
**Status:** ACTIVE
**Version:** 2.0.0 (Global Symposium Consolidation)

This document serves as the single source of truth for the visual, structural, and tonal identity of the Harsh-Environment Mass Spectrometry (HEMS) Website. It reflects the actively deployed "Global Symposium" aesthetic and the established structural layouts for both public-facing marketing and the attendee portal.

---

## 1. The Core Aesthetic
- **Concept:** "Global Symposium". Inspired by major international scientific cooperatives (like IMSC), the aesthetic positions HEMS as a borderless, professional hub for global scientific cooperation.
- **Vibe:** Cosmopolitan, sleek, highly legible, and expansive.
- **Imagery:** Clean lines, generous whitespace, and a focus on high-fidelity data presentation over cluttered legacy visuals.

---

## 2. Visual Identity & Color System

The color palette relies on muted, professional "global" tones that exude quiet competence and guarantee extreme readability across all devices.

| Name | Hex Code | Tailwind Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Summit White (Background)** | `#FFFFFF` | `var(--background)` | Primary background color. |
| **Slate Black (Foreground)** | `#334155` | `var(--foreground)` | Primary body text. Softer than pure black to reduce eye strain during heavy reading. |
| **Protocol Gray (Surfaces)** | `#E2E8F0` | `var(--surface)` | Cards, secondary backgrounds, table headers, and structural containers. |
| **Global Cerulean (Accent)** | `#0284C7` | `var(--color-primary)` | Primary accent. A professional, internationally recognized "trust" blue used for primary actions, links, and highlights. |
| **Diplomatic Emerald (Secondary)**| `#059669` | `var(--color-secondary)` | Secondary accent. Used sparingly for successful actions, active states, and call-out boxes. |

---

## 3. Typography

Fonts are chosen for maximum legibility across multiple languages, screen sizes, and automated translation engines.

### Sans-Serif (Universal Body & Headings)
- **Font Family:** `Noto Sans` (Google Font)
- **Usage:** Used universally across the site for all standard text. `Noto Sans` was developed by Google specifically to achieve perfect typographic rendering across all global languages and character sets.

### Monospace (Technical Data & Accents)
- **Font Family:** `IBM Plex Mono` (Google Font)
- **Usage:** Used for technical readouts, dates, paper IDs, and structural data points. It provides an international, industrial feel.

---

## 4. Logo & Asset Usage

- **Primary Logo:** `https://www.hems-workshop.org/Logos/HEMSLogo3.jpg`
- **Implementation Rule:** Because the legacy logo is a raster image (JPG) with a solid white background, it must be implemented using the CSS property `mix-blend-multiply` when placed over `Summit White` or `Protocol Gray` surfaces. This seamlessly strips the white bounding box, allowing the logo to blend naturally into the modern layout without requiring asset recreation.

---

## 5. UI Layout Architecture

The HEMS website is structurally divided into two distinct interaction models:

### 1. Public-Facing & Narrative (e.g., Home, About)
*   **Structure:** Utilizes large, sweeping "Hero" sections (like the *Split Hero* or *Editorial* layouts), generous whitespace, and centered, narrative-driven typography.
*   **Goal:** Tell the story of HEMS, inspire new researchers to join, and drive conversions (ticket sales, abstract submissions).

### 2. The Attendee Portal (e.g., /layout-portal)
*   **Structure:** A data-dense, dashboard-style interface. Features a persistent left-hand "Quick Links" navigation sidebar and grid-based data cards.
*   **Goal:** Pure utility. Returning attendees and active authors need immediate, frictionless access to technical programs, official announcements, deadlines, and the 5GB+ paper archive without scrolling through marketing copy.

---

## 6. Copywriting & Tone of Voice

- **The Persona:** You are the central node for an international network of the world's top scientific minds dedicated to mass spectrometry in extreme environments.
- **Tone:** Professional, inclusive, objective, and globally aware.
- **Key Rules:**
  - Use International English. Avoid regional idioms, slang, or overly aggressive commercial phrasing.
  - Focus on words like "Global", "Collaborate", "Precision", and "Archive".
