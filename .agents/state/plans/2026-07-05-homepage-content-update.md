# HEMS Homepage Content & Mission Update Plan

This plan outlines the updates to the homepage of the HEMS Website to incorporate the official mission statement, purpose, and technical sessions topics from the legacy HEMS index page and the proceedings of the 15th Workshop.

---

## Proposed Changes

### Frontend Components

#### [MODIFY] [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx)
- **Title & Heading**: Update the Hero title or major heading to explicitly include **"Workshop on Harsh-Environment Mass Spectrometry"**.
- **Mission Statement & Purpose**: Replace the generic subtitle with the official mission statement:
  > *In situ mass spectrometry (MS) in a wide variety of harsh environments—from outer space to Earth's oceans to battlefield scenarios—is rapidly becoming a reality. There are many common features to MS deployment in these vastly different conditions, including high reliability, small size, and low power requirements. The Harsh-Environment MS Workshop encourages interaction among those interested in deployment of mass spectrometers in various harsh environments.*
- **Technical Program Focus**: Incorporate the technical focus areas directly on the homepage, highlighting:
  - Rugged & Portable Mass Spectrometers
  - Environmental Interfaces & Inlet Systems
  - Autonomous & Adaptive Sampling Strategies
  - Unattended Operations & Telemetry
  - Enabling Technologies & Miniaturization
- **Latest Workshop Highlights**: Add a section displaying key scientific topics presented at the latest (15th) HEMS Workshop in Virginia Beach:
  - **Planetary Exploration**: Spaceflight Laser Desorption and ARAMMIS (Autonomous Robots for Area Mapping and Gas Sensing).
  - **Aquatic & Marine Research**: Underwater Mass Spectrometry and Membrane Introduction Mass Spectrometry (MIMS).
  - **Field Deployability**: Rugged, cart-portable Time-of-Flight (TOF) instruments and nonproximate handheld probes.

---

## Verification Plan

### Automated Tests
- Run Next.js compilation build to verify no layout/build regressions:
  ```powershell
  npm run build
  ```

### Manual Verification
- Review the local development site at `http://localhost:3000` to verify:
  1. Header includes the required major heading.
  2. Mission statement reads clearly and uses professional spacing.
  3. Technical highlights match the official HEMS program focus.
  4. Design maintains the dark-themed "Global Symposium" brand guidelines.
