# Plan: Touch Up "Military CBRN Response" Photo (`smith-military-cwa-gcms-2003.jpg`)

**Date:** 2026-11-16  
**Owners:** `@arch`, `@dev`, `@qa`  
**Target Asset:** [smith-military-cwa-gcms-2003.jpg](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/images/gallery/smith-military-cwa-gcms-2003.jpg)  
**Carousel Component:** [HeroFieldDeploymentsCarousel.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/home/HeroFieldDeploymentsCarousel.tsx)

## Objectives
1. Remaster `smith-military-cwa-gcms-2003.jpg` (`1024×768`) to modern full-frame camera quality (`1600×1200`) with:
   - **No-Flash HDR Lighting:** Neutralize harsh on-camera flash glare/blown highlights on the white van doors, specular skin shine, plastic bag, and metallic duct while gently lifting van interior shadow detail.
   - **Wide-Aperture Low-Noise Look:** Eliminate early-2000s CCD grain and JPEG block artifacts while adding natural optical shallow depth-of-field (`f/2.0`) softening background stucco/window planes without softening the two responders or GC-MS instrumentation.
   - **100% Documentary Fidelity:** Visually compare candidates against original backup via `read_file` to guarantee faces, uniforms, purple nitrile gloves, yellow probe, specimen bag, and yellow keypad GC-MS remain completely faithful.
2. Sync exact saved pixel `width` and `height` in `HeroFieldDeploymentsCarousel.tsx`.

## Verification Gates
- Side-by-side visual review of Before / After plate and final JPEG via `read_file`.
- `npx --prefix src/frontend tsc -p src/frontend/tsconfig.json --noEmit` exit `0`.
- Python dimension & HTTP `200` check on `http://localhost:3000/`.
- **Addendum 31** written to `docs/session_history.md`.
