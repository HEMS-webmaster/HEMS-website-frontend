# Implementation Plan — Printable Student Travel Awards Flyer

- **Date:** 2026-11-12
- **Owners:** `@arch`, `@web` (`@sme1`), `@dev`
- **Target File:** `src/frontend/src/components/workshop/StudentAwardsClient.tsx`

## Objective
Create a dedicated **Printable Version** of the Student Travel Awards page (`/student-awards`) mirroring the dual-mode US-Letter 1-page printable architecture on Corporate Sponsorship (`/corporate-sponsorship`).

## Design & Technical Changes
1. **Interactive Mode (`MODE A`) Enhancements:**
   - Add a `Printable Version` button (`<Printer size={15} />`) alongside a quick `Email Application` CTA in the top Purpose & Award Amount hero card.
   - Support `?print=1` and `?view=print` query parameters on mount so direct links open straight into the printable preview.
   - Wrap Mode A in `print:hidden` so pressing `Ctrl+P` / `Cmd+P` from the standard web page also automatically renders the clean 1-page printable flyer.
2. **Executive 1-Page Printable Flyer (`MODE B`):**
   - **Preview Action Bar (`print:hidden`):** Mobile-friendly bar with `Back to Student Travel Awards Page`, format indicator (`Departmental Flyer & Application Guide • Formatted for US Letter & PDF`), `Email Committee`, and `Print / Save as PDF` (logging `pdf_download` via `recordTelemetryEvent` and invoking `window.print()`).
   - **US-Letter 1-Page Sheet (`max-w-[8.5in]`):**
     - **Official Society Letterhead:** HEMS Society emblem, 501(c)(3) status, workshop ordinal, and target schedule/venue.
     - **01 · Purpose, Award Amount & Graduate Eligibility:** Mission statement + 4-column summary strip (`Proposed Grant`, `Eligible Degrees`, `Application Deadline`, `Alumni Track Record`).
     - **02 · Required Application Package (4 Components):** Compact 2×2 grid of the four required submission items.
     - **03 · Selection Criteria:** Compact 2×2 rubric checklist.
     - **04 · Past Fellows & Represented Universities (2007–2022):** Verified institutional track record derived from `master_workshops.json` (`18` fellows across `8` cycles).
     - **Submission Footer Box:** Step-by-step instructions + HEMS Student Awards Committee contact block and URL (`www.hems-workshop.org/student-awards`).
