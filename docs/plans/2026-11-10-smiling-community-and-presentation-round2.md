# Implementation Plan: Smiling Community Photography, History Photo Swap & Round-2 Presentation Extractions

**Date:** 2026-11-10  
**Lead Agents:** `@prod`, `@brand`, `@arch`, `@dev`, `@qa`, `@ops`  
**Scope:**
1. Extract **10 additional unmodified raw graphics** (`11_...` through `20_...`) from recent archived HEMS presentations (`15th` [2025], `14th` [2022], and `13th` [2019]) into `docs/source-documents/pics/PresentionExtracted/Raw/`.
2. Upgrade public-page community imagery across `/`, `/about`, `/layout-portal`, `/student-awards`, and `/corporate-sponsorship` to feature **warm, genuine smiles** in coastal, auditorium, poster-session, and Hawaiian-shirt settings from `@bo`'s newly added `Older Pics` (`HEMS2013_*`, `10thHEMS_*`, `GPK_*`) and `2025` albums.
3. **Change one History page (`/history`) photo:** Replace `Fig. 02` (`offshore-ms-deployment.jpg`, crew with backs turned) with `st-pete-beach-don-cesar-2013.jpg` (`Older Pics/HEMS2013_55.JPG` — smiling HEMS Society community gathered under palm trees at The Don CeSar in St. Pete Beach, FL) while retaining `Fig. 01` (`usf-cot-auv-nosecone-ms.jpg`) and `Fig. 03` (`myrtle-beach-pier-surf.jpg`).

---

## 1. Round-2 Raw Presentation Extractions (`docs/source-documents/pics/PresentionExtracted/Raw/`)

All 10 images are extracted byte-for-byte via `doc.extract_image(xref)["image"]` with zero resizing, cropping, or re-encoding:

| Filename | Source Proceedings PDF | Dimensions | Subject |
| :--- | :--- | :--- | :--- |
| `11_15th_Verbeck_UAV_Drone_Field_MS_Setup.jpg` | `15th_Verbeck_Using_Classes_of_Presentation.pdf` (p.1) | `793×537` | Investigators outdoors with heavy-lift UAV octocopter MS |
| `12_15th_Bell_Subsea_Lander_Underwater_MS.jpg` | `15th_Bell_Underwater_Mass_Spectrometry_Presentation.pdf` (p.2) | `940×727` | Crane deployment of benthic subsea lander underwater MS |
| `13_15th_Loose_DeepSea_MIMS_Internal_Assembly.jpg` | `15th_Loose_Vertical_transport_of_Presentation.pdf` (p.3) | `1361×827` | Open-chassis underwater MIMS analyzer & pressure bulkhead |
| `14_15th_Kibelka_Aerosol_Portable_MS_Exploded_CAD.jpg` | `15th_Kibelka_A_New_Aerosol_Presentation.pdf` (p.7) | `1103×738` | Exploded 3D CAD of compact aerosol-inlet portable MS |
| `15_14th_Gentz_Offshore_Subsea_Methane_Plume_MIMS.jpg` | `14th_Gentz_An_optimized_membrane_Presentation.pdf` (p.3) | `2001×1212` | Offshore subsea methane blowout plume surveyed by MIMS |
| `16_13th_Danell_Dragonfly_Titan_Rotorcraft_Lander.jpg` | `13th_Danell_The_Dragonfly_Mission_Presentation.pdf` (p.5) | `941×803` | NASA Dragonfly rotorcraft lander (DraMS) on Titan |
| `17_13th_Short_Europa_Icy_Moon_Lander_Concept.jpg` | `13th_Short_Membrane_Inlet_Mass_Presentation.pdf` (p.25) | `1188×1130` | Europa Lander concept on icy terrain beneath Jupiter |
| `18_13th_Sheridan_Lunar_Volatile_MS_Lander_CAD.jpg` | `13th_Sheridan_LUVMI_Rover_to_Presentation.pdf` (p.11) | `1280×720` | Lunar volatile mass spectrometer lander CAD assembly |
| `19_13th_Taghioskoui_LowPressure_ICP_Plasma_Source.jpg` | `13th_Taghioskoui_LowPressure_ICPMS_for_Presentation.pdf` (p.15) | `1213×687` | Glowing low-pressure ICP plasma chamber & RF probe |
| `20_13th_Verbeck_Urban_Mobile_MS_Chemical_Heatmap.jpg` | `13th_Verbek_Smart_City_Initiatives_Presentation.pdf` (p.13) | `1143×673` | Mobile vehicle MS real-time urban chemical plume heatmap |

---

## 2. Smiling Community & Presentation Asset Staging (`src/frontend/public/images/`)

| Staged Path (`src/frontend/public/images/...`) | Unmodified Source (`docs/source-documents/pics/...`) | Target Surface |
| :--- | :--- | :--- |
| `history/st-pete-beach-don-cesar-2013.jpg` | `Older Pics/HEMS2013_55.JPG` | `/history` (`Fig. 02` swap) |
| `gallery/don-cesar-terrace-smiles-2013.jpg` | `Older Pics/HEMS2013_31.JPG` | `/` (Coastal Tradition card) |
| `gallery/single-track-auditorium-smiles-2015.jpg` | `Older Pics/10thHEMS_29.JPG` | `/` (Single-Track Technical Candor card) |
| `gallery/poster-session-smiles-oxnard-2017.jpg` | `Older Pics/GPK_4550.JPG` | `/` (Hawaiian Shirts & Open Collaboration card) |
| `gallery/don-cesar-hawaiian-smiles-2013.jpg` | `Older Pics/HEMS2013_38.JPG` | `/about` (6th Objective fellowship card) |
| `gallery/harborfront-reception-smiles-2015.jpg` | `Older Pics/10thHEMS_44.JPG` | `/layout-portal` (Symposium overview banner) |
| `gallery/roundtable-smiles-2025.jpg` | `FromGottfried/2025/PXL_20250917_222141843.PORTRAIT.ORIGINAL.jpg` | `/student-awards` (Mentorship card) |
| `gallery/sponsor-exhibit-smiles-2015.jpg` | `Older Pics/10thHEMS_21.JPG` | `/corporate-sponsorship` (Tabletop exhibit banner) |
| `gallery/verbeck-uav-drone-ms-2025.jpg` | `PresentionExtracted/Raw/11_15th_Verbeck_UAV_Drone_Field_MS_Setup.jpg` | `/` (Proceedings Archive highlight) |
| `gallery/bell-subsea-lander-ms-2025.jpg` | `PresentionExtracted/Raw/12_15th_Bell_Subsea_Lander_Underwater_MS.jpg` | `/` (Proceedings Archive highlight) |
| `gallery/danell-dragonfly-titan-ms-2019.jpg` | `PresentionExtracted/Raw/16_13th_Danell_Dragonfly_Titan_Rotorcraft_Lander.jpg` | `/` (Proceedings Archive highlight) |
| `gallery/kibelka-aerosol-ms-cad-2025.jpg` | `PresentionExtracted/Raw/14_15th_Kibelka_Aerosol_Portable_MS_Exploded_CAD.jpg` | `/call-for-papers` (Proceedings strip) |
| `gallery/verbeck-urban-ms-heatmap-2019.jpg` | `PresentionExtracted/Raw/20_13th_Verbeck_Urban_Mobile_MS_Chemical_Heatmap.jpg` | `/call-for-papers` (Proceedings strip) |

---

## 3. Verification Gates (`@qa` & `@ops`)
- Verify SHA-256 byte-for-byte parity across all staged files in `src/frontend/public/images/{history,gallery}/`.
- Verify `0` modifications to `/source-material` and `src/frontend/src/app/archive/**`.
- Pass `npx next typegen`, `npx tsc --noEmit`, `node tests/unit/upcomingWorkshopCsv.test.mjs`, and `npm --prefix src/frontend run build`.
- Commit locally on `main` (without pushing to `origin/main` or tracking `docs/source-documents/pics/`) and deploy to `preview-2027`.
