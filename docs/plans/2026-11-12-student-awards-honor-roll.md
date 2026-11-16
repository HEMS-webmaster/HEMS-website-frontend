# Implementation Plan: Student Travel Awards Photo Removal & Past Recipients Honor Roll

**Date:** 2026-11-12  
**Owner:** `@arch`, `@dev`, `@brand`  
**Approved Option:** Option 1 (`@bo`)

## Objective
1. Remove the unflattering 2015 evening-restaurant flash photo (`/images/gallery/student-award-certificate-2015.jpg`) from `/student-awards`.
2. Replace the bottom-right sidebar photo card in [StudentAwardsClient.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx) with a Specimen-White **Past Award Recipients** Honor Roll card dynamically derived (read-only) from [master_workshops.json](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/master_workshops.json) (`18` named Student Travel Awardees across `8` workshop cycles from `2007` to `2022`), with direct links to each workshop's proceedings archive (`/archive/[year]`) and `/archive`.
3. Align the remaining legacy `font-black uppercase` section headings and card borders on `/student-awards` (`Eligibility`, `Application Guidelines`, `Selection Criteria`, `Application Deadline`, `HEMS Student Awards Committee`) with `@brand` v3.1.0 (`Source Serif 4` Title Case + `Noto Sans` `tabular-nums`, Specimen White `#FFFFFF` surfaces).

## Verification
- Static production build (`npx next build` in `src/frontend`) passes with `0` TypeScript errors across all `42/42` routes.
- Restart local dev server (`http://localhost:3000/student-awards`) and verify clean column balance and zero broken links.

