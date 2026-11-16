# Plan: Reorder Hero Field-Deployment Lead Slide & Format/Review Board Mission Statement V3

**Date:** 2026-11-15  
**Leads:** `@web`, `@dev`, `@arch`  
**Status:** Executing

## Scope
1. Reorder `FIELD_DEPLOYMENTS` in [`HeroFieldDeploymentsCarousel.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/home/HeroFieldDeploymentsCarousel.tsx) so `fox-arammis-robot-2025` (`Quadruped ARAMMIS Gas-Sensing Mass Spectrometer`, James Fox, INFICON / ETH Zurich RSL) leads at `1 / 6` ahead of `short-triaxus-towsled-2017`, `verbeck-uav-drone-2025`, `loose-antarctic-swims-2025`, `gonin-aircraft-tofms-2018`, and `bell-cold-seep-lander-2025`.
2. Reformat [`mission-statementV3.md`](file:///c:/AntigravityP1_2/HEMS-website/docs/source-documents/mission-statementV3.md) into clean Markdown (`# Mission Statement`, `## Objectives`, bolded list titles) matching V1/V2 formatting conventions with zero content changes.
3. Verify TypeScript (`tsc --noEmit`), Markdown token-parity check, and live dev HTML on `http://localhost:3000/`, then present a comparative review against what is currently posted on the website without altering `/about` before approval.
