# Implementation Plan: Lively Student Awards Photo & Native Aspect-Ratio Framing Fix

**Date:** 2026-11-10  
**Lead Agents:** `@prod`, `@arch`, `@dev`, `@qa`, `@ops`  
**Scope:** Replace `/student-awards` with a high-energy banquet applause photograph (`IMG_20190918_191514.jpg`), update `/layout-portal` (`16th HEMS Workshop Overview`) to an open-air golden-hour marina reception scene (`10thHEMS_48.JPG`), and enforce native `aspect-[3/2]` / `aspect-[4/3]` framing across community photo cards so subjects are never clipped vertically or horizontally.

---

## 1. Unmodified Asset Updates (`Copy-Item` + SHA-256 Parity)

| Staged Path (`src/frontend/public/images/gallery/...`) | Unmodified Source (`docs/source-documents/pics/...`) | Native Ratio | Target Surface |
| :--- | :--- | :--- | :--- |
| `banquet-awards-applause-2019.jpg` | `FromGottfried/2019/IMG_20190918_191514.jpg` | `4:3` (`4032×3024`) | `/student-awards` |
| `golden-hour-harbor-reception-2015.jpg` | `Older Pics/10thHEMS_48.JPG` | `3:2` (`4928×3264`) | `/layout-portal` (`16th HEMS Workshop Overview`) |

*(Superseded staged files `roundtable-smiles-2025.jpg` and `harborfront-reception-smiles-2015.jpg` are removed from `public/images/gallery/`; original sources in `docs/source-documents/pics/` remain untouched.)*

---

## 2. Native Aspect-Ratio Framing Enhancements (`@dev`)
- [`StudentAwardsClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/StudentAwardsClient.tsx): Render `banquet-awards-applause-2019.jpg` with `w-full aspect-[4/3] object-cover` (`0%` crop).
- [`PortalOverviewClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/PortalOverviewClient.tsx): Render `golden-hour-harbor-reception-2015.jpg` with `w-full aspect-[3/2] object-cover` (`0%` crop).
- [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx), [`CorporateSponsorshipClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/CorporateSponsorshipClient.tsx), and [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx): Replace fixed `h-48`/`h-52` `object-top` crops on `3:2` DSLR community photos with native `aspect-[3/2]` (and `h-auto` on `group-photo-2025.jpg`) so no person is ever clipped across mobile, tablet, or desktop breakpoints.

