# Implementation Plan: Site-Wide Unmodified Photography & "Casual, Beach, Academic" Rollout

**Date:** 2026-11-10  
**Lead Agents:** `@prod`, `@brand`, `@arch`, `@dev`, `@qa`, `@ops`  
**Scope:** Integrate curated, **100% unmodified** photographs and presentation graphics from `docs/source-documents/pics/` across all public HEMS Society & Workshop pages—pairing Brand v3.0.0 editorial typography with the Society's authentic **casual, beachfront, and academically rigorous** identity (`0` modifications to `/archive/**`).

---

## 1. Zero-Modification Asset Copy Manifest (`Copy-Item` Byte-Exact)

Every selected `.jpg` file is copied verbatim without resizing, cropping, or re-encoding:

| Destination (`src/frontend/public/images/...`) | Unmodified Source (`docs/source-documents/pics/...`) | Theme |
| :--- | :--- | :--- |
| `history/usf-cot-auv-nosecone-ms.jpg` | `FromTimShort/ms in nosecone.jpg` | Academic / Genesis |
| `history/offshore-ms-deployment.jpg` | `FromTimShort/CIMG0561.JPG` | Academic / Field At-Sea |
| `history/myrtle-beach-pier-surf.jpg` | `FromGottfried/2019/IMG_20190916_163202.jpg` | Beach Venue |
| `gallery/group-photo-2025.jpg` | `Group photo2025.JPG` | Casual + Academic Community |
| `gallery/oceanfront-reception-2025.jpg` | `FromGottfried/2025/PXL_20250917_222056496.jpg` | Casual + Beach + Academic |
| `gallery/virginia-beach-boardwalk-2025.jpg` | `FromGottfried/2025/PXL_20250918_161038061.jpg` | Beach Venue |
| `gallery/single-track-session-2019.jpg` | `FromGottfried/2019/IMG_20190918_143654.jpg` | Academic Single-Track |
| `gallery/hardware-demo-hawaiian-shirts-2025.jpg` | `FromGottfried/2025/PXL_20250917_185053584.jpg` | Casual + Hardware Exhibit |
| `gallery/roundtable-fellowship-2025.jpg` | `FromGottfried/2025/PXL_20250917_222133302.LONG_EXPOSURE-01.COVER.jpg` | Casual Mentorship & Fellowship |
| `gallery/fox-volcanic-fumarole-ms.jpg` | `PresentionExtracted/Raw/01_15th_Fox_Volcanic_Fumarole_Backpack_MS.jpg` | Volcanic Field MS |
| `gallery/raith-spaceflight-orbitrap-cad.jpg` | `PresentionExtracted/Raw/07_15th_Raith_Spaceflight_Laser_Desorption_Orbitrap_CAD.jpg` | Spaceflight MS Hardware |
| `gallery/coppin-icefin-underice-rov.jpg` | `PresentionExtracted/Raw/03_15th_CoppinMassanet_Icefin_SUIMS_UnderIce_ROV.jpg` | Polar Autonomous ROV MS |
| `gallery/serpa-cycloidal-ion-trajectories.jpg` | `PresentionExtracted/Raw/06_15th_Serpa_Cycloidal_Analyzer_Ion_Trajectories.jpg` | Ion-Optics Physics |
| `gallery/amerom-moma-mars-ms-cad.jpg` | `PresentionExtracted/Raw/10_14th_Amerom_MOMA_Mars_Mass_Spectrometer_CAD.jpg` | Planetary Rover MS CAD |

---

## 2. Public Surface Updates (`@dev` & `@brand`)

1. **Homepage ([`src/frontend/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx)):**
   - Pair the 3 Technical Charter cards with `fox-volcanic-fumarole-ms.jpg`, `raith-spaceflight-orbitrap-cad.jpg`, and `coppin-icefin-underice-rov.jpg`.
   - Introduce a dedicated **"Symposium Culture — Casual, Coastal & Single-Track"** 3-photo showcase (`virginia-beach-boardwalk-2025.jpg`, `single-track-session-2019.jpg`, `oceanfront-reception-2025.jpg`).
2. **About ([`src/frontend/src/app/about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx)):**
   - Upgrade to Brand v3.0.0 (`Source Serif 4` Title-Case headings), pair the Official Mission with `group-photo-2025.jpg`, and complete the 5-Objective grid with a 6th live hardware-exchange photo card (`hardware-demo-hawaiian-shirts-2025.jpg`).
3. **History ([`src/frontend/src/app/history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx)):**
   - Serve byte-exact unmodified `FromTimShort` photos and add `myrtle-beach-pier-surf.jpg` beside the signature beachfront philosophy quote.
4. **Workshop Portal (`(portal)/layout.tsx`, `PortalOverviewClient.tsx`, `AccommodationsClient.tsx`, `CallForPapersClient.tsx`, `RegistrationClient.tsx`):**
   - Harmonize typography to Brand v3.0.0; showcase `oceanfront-reception-2025.jpg` on `/layout-portal`, `myrtle-beach-pier-surf.jpg` + `virginia-beach-boardwalk-2025.jpg` on `/accommodations`, and `serpa-cycloidal-ion-trajectories.jpg` + `amerom-moma-mars-ms-cad.jpg` on `/call-for-papers`.
5. **Student Travel Awards, Corporate Sponsorship & Contact (`StudentAwardsClient.tsx`, `CorporateSponsorshipClient.tsx`, `contact/page.tsx`):**
   - Harmonize headers to Brand v3.0.0; feature `roundtable-fellowship-2025.jpg` on `/student-awards` and `hardware-demo-hawaiian-shirts-2025.jpg` on `/corporate-sponsorship`.

---

## 3. Verification Gates (`@qa` & `@ops`)
- Verify SHA-256 byte-for-byte equality between every staged file in `src/frontend/public/images/{history,gallery}/` and its source in `docs/source-documents/pics/`.
- Verify `0` lines modified in `src/frontend/src/app/archive/**` and archive JSON datasets.
- Run `npx next typegen`, `npx tsc --noEmit`, `npm --prefix src/frontend run build`, commit locally, and redeploy `preview-2027`.
