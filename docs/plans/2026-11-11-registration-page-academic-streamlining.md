# Architectural & Editorial Plan: Registration Page Academic Language & Content Reduction

**Date:** 2026-11-11  
**Author:** `@arch` & `@prod`  
**Execution Team:** `@dev`, `@qa`, `@ops`  
**Status:** Approved for Immediate Execution (`@bo`)

---

## 1. Objective

Refactor `/registration` ([`RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx) and [`(portal)/registration/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/registration/page.tsx)) so that:
1. All commercial ticketing jargon (*"Workshop Access"*, *"Student Pass"*, *"Professional Pass"*, *"Discounted access pass"*, *"Online ticketing"*) is replaced with dignified scholarly meeting language.
2. When registration is not open (`!workshop.registration_open`, the current `save_the_date` state for the 16th HEMS Workshop), the page presents **very little content**: just the page header and a single, calm academic notice with relevant committee/award/sponsorship links—removing unconfirmed fee cards, `"TBA"` date timelines, refund boilerplate, and split-billing callouts.
3. Live Google Sheet activation (`workshop.registration_open === true`) remains intact so that when the Organizing Committee opens registration in 2027, clean academic registration categories and deadlines appear automatically without requiring a code change.

---

## 2. File Modifications (`@dev`)

1. **[`src/frontend/src/components/workshop/RegistrationClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/RegistrationClient.tsx)**
   - **Page Header:** Replace `<CreditCard>` `"Workshop Access"` pill with `<Calendar>` `"Symposium Registration • {workshop.workshop_ordinal} HEMS Workshop"`, crisp `Source Serif 4` heading, concise one-sentence academic subtitle, and the right-aligned `3:2` HEMS Society Emblem frame.
   - **Closed State (`!workshop.registration_open`):** Render a single clean white notice card (`max-w-3xl`) explaining that registration for the `{workshop.workshop_ordinal}` HEMS Workshop (`{workshop.target_window}`) has not yet opened, that registration dates and fee schedules (including reduced student rates) will be posted once the venue and program schedule are finalized, and that participation is open to academic, government, and industry colleagues with no society membership fee—paired with quiet links to `/contact` (or `workshop.interest_form_url` when configured), `/student-awards`, and `/corporate-sponsorship`.
   - **Open State (`workshop.registration_open`):** Streamlined scholarly registration schedule (*Student Registration*, *Regular Registration*, *Corporate Sponsor Registration*) + compact *Registration Dates & Cancellation Policy* summary using `Noto Sans` (`tabular-nums`) and `Source Serif 4`.
2. **[`src/frontend/src/app/(portal)/registration/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/registration/page.tsx)**
   - Refine `PAGE_DESCRIPTION` to scholarly symposium language.

---

## 3. Verification & Deployment (`@qa`, `@ops`)

- Run `npm --prefix src/frontend run build` (`40/40` static pages, `0` TypeScript/lint errors).
- Verify `0` modifications to `src/frontend/src/app/archive/**` or `docs/source-documents/pics/`.
- Commit on `main`, deploy to Firebase Hosting preview channel `preview-2027`, and restart local `next dev`.

