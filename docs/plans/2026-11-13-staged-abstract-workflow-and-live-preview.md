# Full-Width 8-Stage Abstract Submission Workflow, Live Preview & Printable Guidelines

**Date:** 2026-11-13  
**Routes:** `/abstract-submission`, `/reviewer`

## Summary of Architecture
1. **Full-Width Portal Container (`src/frontend/src/app/(portal)/layout.tsx`)**:
   - Removes `max-w-[1400px]` constraint on `/abstract-submission` so the submission workspace fills 100% of available width to the right of the left portal navigation sidebar.
2. **8-Stage `Next` / `Back` Workflow (`src/frontend/src/components/workshop/AbstractSubmissionClient.tsx`)**:
   - **Stage 1:** Presentation Title, Presenter's Corresponding Email, Secondary Email (optional), Preferred Format, Student Travel Award Opt-In toggle button.
   - **Stage 2:** Unlimited Institutional Affiliations & Institute Locations (`City, State/Province, Country`).
   - **Stage 3:** Unlimited Presenters & Co-Authors paired with Affiliation `<select>` dropdowns and Presenter checkboxes.
   - **Stage 4:** Technical Research Track & Short Synopsis (`<= 200` chars).
   - **Stage 5:** Abstract Text (`<= 3,000` visible chars with spaces), generalized `Bold` (`<b>`), `Italic` (`<i>`), `Underline` (`<u>`), `Subscript` (`<sub>`), `Superscript` (`<sup>`) insert buttons + scientific symbols/equations, Microsoft Word paste preserving inline styles/equations, and a real-time formatted preview box directly beneath the raw `<textarea>`.
   - **Stage 6:** High-Resolution Figure Upload (`>= 300 DPI`) + non-optional Figure Caption (`<= 300` chars when graphic uploaded).
   - **Stage 7:** Comma-Separated Keywords (`<= 150` chars) & Presenter Biography (`<= 500` chars).
   - **Stage 8:** Final 1-Page Formatted Abstract Preview & Submission.
3. **Top Formatting & Limits Box + `Printable Version`**:
   - Placed prominently at the top of `/abstract-submission` with a `Printable Version` button opening `PrintableFormattingGuidelines.tsx` (in-state, preserving wizard data).
4. **Browser Back & Unsaved Data Guard**:
   - `beforeunload`, `popstate` sentinel guard, and link-navigation capture guard prompt a warning before discarding unsaved form inputs.

