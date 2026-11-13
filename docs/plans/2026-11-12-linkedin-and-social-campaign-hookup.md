# Implementation Plan — Official HEMS LinkedIn Group Hookup, Archive 1-Click Share & Social/Ad UTM Kit

- **Date:** 2026-11-12
- **Owners:** `@web` (`@sme1`), `@arch`, `@dev`
- **Official Social Channel:** `https://www.linkedin.com/groups/4385091/`

## Objective
Integrate the official HEMS Society LinkedIn Group across sitewide navigation/footer, contact channels, Knowledge Graph structured data, archive talk sharing, and the Board Website Analytics campaign builder so minimal committee time yields maximum organic and paid outreach in the 2027 cycle.

## Scope of Changes
1. **Canonical SEO & AI Index (`src/frontend/src/utils/seo.ts`, `src/frontend/public/llms.txt`):**
   - Export `HEMS_LINKEDIN_GROUP_URL` and attach `sameAs: [HEMS_LINKEDIN_GROUP_URL]` to the `Organization` Knowledge Graph JSON-LD node.
   - Document the official LinkedIn Group in `llms.txt`.
2. **Sitewide Footer (`src/frontend/src/components/layout/Footer.tsx`):**
   - Add a `Join HEMS on LinkedIn` pill button in the Society Identity column and a `LinkedIn Community` link under Symposium & Contact.
3. **Contact Page Channel (`src/frontend/src/components/workshop/ContactClient.tsx`):**
   - Add an HEMS LinkedIn Community Group channel row with `outbound_click` telemetry recording.
4. **Archive 1-Click Share & Post Draft (`src/frontend/src/components/CitationButton.tsx`, `src/frontend/src/components/CitationModal.tsx`):**
   - Upgrade `Cite` button to `Cite / Share` (preserving prop compatibility with locked `archive/[year]/page.tsx`).
   - Add a ready-to-paste LinkedIn throwback post draft (`?src=linkedin-archive-share`), `Copy Post Draft`, `Share to LinkedIn Feed`, and `Open HEMS LinkedIn Group` actions inside `CitationModal`.
5. **Website Analytics Ad & Social UTM Kit (`src/frontend/src/app/(portal)/admin/analytics/page.tsx`):**
   - Add a 4th Quick-Launch card for the HEMS LinkedIn Group (`Group #4385091`).
   - Add printable flyers (`/student-awards/?print=1`, `/corporate-sponsorship/?print=1`) to link destinations, fix URL query normalization alongside `SITE_URL`, and add 5 1-click UTM/`?src=` campaign presets for LinkedIn posts, LinkedIn ads, Google Ad Grants, and sponsor/speaker promo kits.
