# Subsea PDMS MIMS Spectrum Update Plan (Air-Equilibrated Seawater + ~5% Live Crude Oil)

**Date:** 2026-11-12  
**Agents:** `@ms` (`@sme2`), `@arch`, `@dev`, `@qa`  
**Scope:** Update the `@ms` gas composition worksheet (`docs/hero_spectrum_composition.md`) and the front-page interactive spectrum (`src/frontend/src/components/home/HeroMassSpectrum.tsx`) so Tab 1 represents air-equilibrated seawater mixed with ~5% fresh-from-reservoir crude oil sampled across a PDMS MIMS membrane (`H2S = 0`, `SO2 = 0`), while preserving Tabs 2 (`Volcanic Plume`) and 3 (`Planetary Probe`) unchanged.

## 1. Scientific & Analytical Specification (`@ms`)
- **Matrix Gases (Air-Equilibrated Seawater across PDMS):**
  - `N2` (`26.85 mol%`), `H2O` (`18.80 mol%`), `O2` (`15.44 mol%`), and `Ar` (`0.69 mol%`) obeying Robb (1968) PDMS silicone pervaporation selectivity ($J_{\text{O}_2}/J_{\text{N}_2} = 0.575$, $J_{\text{Ar}}/J_{\text{N}_2} = 0.0256$).
  - `H2S` (`0.00%`) and `SO2` (`0.00%`) excluded due to seawater pH (~8.1) carbonate buffering, hydrolysis/dissociation to impermeable anions ($\text{HS}^-, \text{HSO}_3^-, \text{SO}_3^{2-}$), and dissolved-$\text{O}_2$ oxidation.
- **~5% Fresh-from-Reservoir Live Crude Oil Light Ends (PDMS Permeate):**
  - Reservoir gas & $n$-alkanes (`n-C1` to `n-C7`): `CO2` (`10.10%`), `CH4` (`13.40%`), `C2H6` (`3.05%`), `C3H8` (`2.25%`), `n-C4H10` (`1.65%`), `n-C5H12` (`1.15%`), `n-C6H14` (`0.95%`), `n-C7H16` (`0.75%`).
  - Naphthenes (`cyclo-C5`, `cyclo-C6`): cyclopentane `c-C5H10` (`0.85%`), cyclohexane `c-C6H12` (`1.12%`).
  - Light Aromatics (`BTEX`): benzene `C6H6` (`1.50%`), toluene `C7H8` (`1.45%`).
- **Physical Forward Model:**
  - $W_i = \dfrac{x_i \cdot R_{\text{EI},i}}{\sum_{m/z} F_{i,m/z} / 100}$ using NIST Chemistry WebBook 70 eV EI cracking patterns.

## 2. Implementation Tasks (`@dev` & `@qa`)
1. Update [hero_spectrum_composition.md](file:///c:/AntigravityP1_2/HEMS-website/docs/hero_spectrum_composition.md) with the exact 16-species composition, NIST 70 eV fragment tables, and seawater sulfur chemistry notes.
2. Update [HeroMassSpectrum.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/home/HeroMassSpectrum.tsx) with NIST 70 eV EI patterns for `C3H8`, `nC4H10`, `nC5H12`, `nC6H14`, `nC7H16`, `cC5H10`, and `cC6H12`, physical `ionSourceMolPct` + `R_EI_70EV` calculation, exact monoisotopic hydrocarbon overrides for `m/z 26, 27, 29, 32, 41, 42, 43, 44, 51, 52, 55–58, 69–72, 84, 86, 100`, and 12 collision-free SVG callouts.
3. Verify TypeScript & static production build (`npm --prefix src/frontend run build`) and restart local dev server (`http://localhost:3000`).

