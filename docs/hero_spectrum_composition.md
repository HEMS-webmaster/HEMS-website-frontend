# Front-Page Hero Mass Spectrum — Sampled Gas Composition Worksheet (`@ms`)

- **Component Source:** `src/frontend/src/components/home/HeroMassSpectrum.tsx`
- **Instrument Basis:** Quadrupole Mass Spectrometer (`m/z 1–100`, `Δm = 0.42 Da FWHM`, 70 eV Electron Ionization, NIST EI fragmentation + natural IUPAC isotopologues)
- **Status:** Tab 1 (`Subsea Seep`) updated to **Air-Equilibrated Seawater + ~5% Fresh-from-Reservoir ("Live") Crude Oil** across a PDMS MIMS membrane (`H2S = 0`, `SO2 = 0`); Tabs 2 (`Volcanic Plume`) and 3 (`Planetary Probe`) retained as approved.

---

## 1. Observed Default Spectrum — Tab 1: `Subsea Seep` (`hydrothermal` key)

- **Sampled Matrix:** `95% Air-Equilibrated Seawater (pH ~8.1, S = 35 PSU) + ~5% Fresh-from-Reservoir Live Crude Oil`
- **Displayed Title:** `Subsea Crude-Oil Plume MIMS Scan`
- **Displayed Subtitle:** `PDMS Membrane • Air-Equil. Seawater + 5% Live Oil • EI 70 eV` | **Chamber Pressure:** `1.2 × 10⁻⁶ Torr`
- **Physical Forward Model (`Ion-Source Permeate mol% → 70 eV EI Ion Current`):**
  $$W_i = \frac{x_{i,\text{ionizer}} \cdot R_{\text{EI},i}}{\sum_{m/z} F_{i,\,m/z} / 100}, \qquad I(m/z) = \sum_{i} W_i \cdot \frac{F_{i,\,m/z}}{100}$$

| Component Class | Species | Formula | Ion-Source Permeate `mol%` *(editable)* | Physical `70 eV R_EI` (`N2 = 1.00`) | Derived Base-Peak Weight `W_i` | Base Peak (`m/z`) | NIST 70 eV Cracking & Isotopologues (`m/z: %`) | Observed Peak Height (`% Base`) |
| :--- | :--- | :--- | ---: | ---: | ---: | :---: | :--- | ---: |
| **Seawater Air** | Nitrogen | `N2` | **26.85%** | 1.00 | `24.88` | `28` | `28: 100`, `14: 7.2`, `29: 0.73` | **100.0%** *(+ C₂H₄/CO @ 28)* |
| **Seawater Matrix** | Water vapor | `H2O` | **18.80%** | 0.90 | `13.83` | `18` | `18: 100`, `17: 21.2`, `16: 0.9`, `20: 0.205`, `19: 0.08` | **43.2%** *(`m/z 17` = 9.5%)* |
| **Seawater Air** | Oxygen *(PDMS 2.1×)* | `O2` | **15.44%** | 0.86 | `11.88` | `32` | `32: 100`, `16: 11.4`, `34: 0.41` | **37.1%** *(zero S•⁺ isobar)* |
| **Live Oil (`n-C1`)** | Methane | `CH4` | **13.40%** | 1.60 | `10.06` | `16` | `16: 100`, `15: 85.8`, `14: 15.6`, `13: 8.0`, `12: 2.6`, `17: 1.1` | **39.3%** *(`m/z 15` = 28.8%)* |
| **Reservoir + DIC** | Carbon dioxide | `CO2` | **10.10%** | 1.40 | `10.91` | `44` | `44: 100`, `28: 9.8`, `16: 9.6`, `12: 6.7`, `22: 1.85`, `45: 1.19`, `46: 0.41` | **36.5%** *(+ C₃H₈•⁺ @ 44)* |
| **Live Oil (`n-C2`)** | Ethane | `C2H6` | **3.05%** | 2.60 | `3.75` | `28` | `28: 100`, `27: 33.2`, `30: 26.2`, `26: 23.0`, `29: 21.5`, `15: 4.6`, `14: 3.0` | *`m/z 30` = **3.3%*** |
| **Live Oil (`n-C3`)** | Propane | `C3H8` | **2.25%** | 3.50 | `2.57` | `29` | `29: 100`, `28: 58.8`, `27: 41.9`, `44: 27.5`, `43: 23.2`, `39: 18.6`, `41: 12.9`, `26: 9.1`, `15: 6.8`, `42: 5.8`, `30: 2.2` | *`m/z 29` = **20.2%*** |
| **Live Oil (`n-C4`)** | *n*-Butane | `nC4H10` | **1.65%** | 4.40 | `2.45` | `43` | `43: 100`, `29: 44.2`, `27: 37.1`, `28: 32.6`, `41: 27.8`, `39: 12.5`, `58: 12.3`, `42: 12.2`, `26: 6.2`, `15: 5.3`, `44: 3.3`, `57: 2.4` | *`m/z 43` = **23.6%**, `58` = **0.9%*** |
| **Aromatic (`BTEX`)** | Benzene | `C6H6` | **1.50%** | 5.90 | `4.49` | `78` | `78: 100`, `77: 23.8`, `52: 19.2`, `51: 18.6`, `50: 15.8`, `39: 13.2`, `79: 6.5` | **14.0%** *(`m/z 77` = 3.3%)* |
| **Aromatic (`BTEX`)** | Toluene | `C7H8` | **1.45%** | 6.80 | `4.65` | `91` | `91: 100`, `92: 68.4`, `39: 14.8`, `65: 12.5`, `63: 5.8`, `51: 5.4`, `93: 5.2` | **14.5%** *(`m/z 92` = 9.9%)* |
| **Live Oil (`n-C5`)** | *n*-Pentane | `nC5H12` | **1.15%** | 5.30 | `2.04` | `43` | `43: 100`, `42: 57.9`, `41: 39.5`, `27: 33.6`, `29: 24.4`, `39: 14.2`, `57: 12.6`, `72: 8.8`, `15: 4.8`, `56: 2.8` | *`m/z 72` = **0.6%*** |
| **Naphthene (`c-C6`)** | Cyclohexane | `cC6H12` | **1.12%** | 5.80 | `1.74` | `56` | `56: 100`, `84: 76.5`, `41: 58.6`, `69: 31.8`, `42: 26.4`, `55: 25.8`, `39: 20.5`, `27: 18.2`, `43: 11.5`, `85: 5.1` | **8.4%** @ `56`, **4.2%** @ `84` |
| **Live Oil (`n-C6`)** | *n*-Hexane | `nC6H14` | **0.95%** | 6.20 | `1.24` | `57` | `57: 100`, `43: 81.3`, `41: 70.3`, `29: 60.5`, `56: 45.4`, `27: 41.5`, `42: 37.0`, `39: 19.5`, `86: 14.8`, `71: 5.2`, `87: 1.0` | **6.8%** @ `57`, **0.6%** @ `86` |
| **Naphthene (`c-C5`)** | Cyclopentane | `cC5H10` | **0.85%** | 4.90 | `1.71` | `42` | `42: 100`, `70: 30.2`, `41: 29.5`, `55: 28.6`, `39: 21.8`, `27: 16.5`, `69: 9.8`, `40: 6.8` | **14.3%** @ `42`, **2.4%** @ `70` |
| **Live Oil (`n-C7`)** | *n*-Heptane | `nC7H16` | **0.75%** | 7.10 | `1.26` | `43` | `43: 100`, `41: 51.5`, `57: 48.2`, `29: 44.8`, `71: 44.5`, `27: 29.8`, `56: 26.8`, `42: 24.2`, `70: 19.2`, `39: 16.5`, `100: 13.8`, `85: 3.6` | **2.0%** @ `71`, **0.5%** @ `100` |
| **Seawater Air** | Argon *(PDMS 2.1×)* | `Ar` | **0.69%** | 1.20 | `0.73` | `40` | `40: 100`, `20: 12.6` (`Ar²⁺`), `36: 0.33`, `38: 0.06` | **2.6%** |
| **Seawater Buffered** | Hydrogen sulfide | `H2S` | **0.00%** | 2.20 | `0.00` | `34` | *Excluded — dissociated (`HS⁻`) & oxidized in oxygenated pH ~8.1 seawater* | **0.0%** *(not visible)* |
| **Seawater Buffered** | Sulfur dioxide | `SO2` | **0.00%** | 2.10 | `0.00` | `64` | *Excluded — quantitatively hydrolyzed (`HSO₃⁻/SO₃²⁻`) & impermeable in PDMS* | **0.0%** *(not visible)* |
| **Total** | | | **100.00%** | | | | | |

### `@ms` Physical & Geochemical Verification Notes (Tab 1)
1. **Exact PDMS Air-Equilibrated Seawater Selectivity (`N2 : O2 : Ar`):** Using Robb (1968) PDMS permeabilities ($P_{\text{N}_2} = 280$, $P_{\text{O}_2} = 600$, $P_{\text{Ar}} = 600\text{ Barrer}$) with 1 atm dry-air fugacities ($0.7808 : 0.2095 : 0.00934$), steady-state pervaporation yields $J_{\text{O}_2}/J_{\text{N}_2} = 0.575$ (`15.44% / 26.85%`) and $J_{\text{Ar}}/J_{\text{N}_2} = 0.0256$ (`0.69% / 26.85%`), producing the authentic MIMS `m/z 32` (`37.1%`) and `m/z 40` (`2.6%`) baseline.
2. **Why `H2S` and `SO2` Are Absent (`0.00%`):** In oxygenated, carbonate-buffered seawater (`pH ≈ 8.1`), any `SO2` quantitatively hydrolyzes ($\text{p}K_{a1} = 1.86, \text{p}K_{a2} = 7.2$) to ionic $\text{HSO}_3^-/\text{SO}_3^{2-}$ (completely rejected by hydrophobic PDMS and oxidized to $\text{SO}_4^{2-}$), and trace `H2S` ($\text{p}K_{a1} \approx 6.98$) is >92% dissociated to $\text{HS}^-$ and scavenged/oxidized.
3. **Diagnostic Petroleum Series Visible Across `m/z 1–100`:**
   - **Solution Gases (`CO2`, `C1–C3`):** `m/z 15` ($\text{CH}_3^+$, interference-free methane channel), `16` ($\text{CH}_4^{\bullet+}$), `29/30` ($\text{C}_2\text{H}_5^+ / \text{C}_2\text{H}_6^{\bullet+}$), and `44` ($\text{CO}_2^{\bullet+} + \text{C}_3\text{H}_8^{\bullet+}$).
   - **Paraffinic Picket Fence (`n-C4` to `n-C7`, $\text{C}_n\text{H}_{2n+1}^+$):** `m/z 43` (`23.6%`), `57` (`6.8%`), `71` (`2.0%`), plus molecular ions at `58` (`n-C4`), `72` (`n-C5`), `86` (`n-C6`), and `100` (`n-C7`).
   - **Naphthenic Ring Series (`cyclo-C5`, `cyclo-C6`):** Retro-cleavage alkenes `m/z 42` (`14.3%`) & `56` (`8.4%`), `55/69` ($\text{C}_n\text{H}_{2n-1}^+$), and intact molecular ions `70` (`c-C5H10•+`) & `84` (`c-C6H12•+`).
   - **PDMS-Enriched Aromatics (`BTEX`):** High water solubility + hydrophobic silicone partitioning produce prominent benzene (`m/z 78 = 14.0%`, `77 = 3.3%`) and toluene (`m/z 91 = 14.5%` tropylium, `92 = 9.9%`) signatures.

---

## 2. Secondary Tab — Tab 2: `Volcanic Plume` (`volcanic` — Unchanged)

- **Displayed Title:** `Volcanic Fumarole Gas QMS Scan`
- **Displayed Subtitle:** `Heated Fused-Silica Capillary • 1 atm → EI 70 eV` | **Chamber Pressure:** `8.4 × 10⁻⁷ Torr`

| Gas | Formula | Current Code Weight `W_i` | Implied Ion-Source `mol%` | Base Peak (`m/z`) | Observed Peak Height (`% Base`) |
| :--- | :--- | ---: | ---: | :---: | ---: |
| Water vapor | `H2O` | `78.0` | 21.54% | `18` | **78.0%** |
| Carbon dioxide | `CO2` | `100.0` | 18.80% | `44` | **100.0%** |
| Nitrogen | `N2` | `84.0` | 18.41% | `28` | **94.6%** |
| Sulfur dioxide | `SO2` | `64.0` | 10.70% | `64` | **64.0%** |
| Oxygen | `O2` | `24.0` | 6.34% | `32` | **48.5%** |
| Hydrogen sulfide | `H2S` | `29.0` | 5.18% | `34` | **29.1%** |
| Helium | `He` | `3.0` | 4.35% | `4` | **3.0%** |
| Hydrogen chloride | `HCl` | `22.0` | 4.32% | `36` | **23.3%** |
| Hydrogen | `H2` | `8.0` | 3.77% | `2` | **8.0%** |
| Argon | `Ar` | `16.0` | 3.06% | `40` | **16.0%** |
| Methane | `CH4` | `8.5` | 2.30% | `16` | **24.9%** |
| Carbonyl sulfide | `OCS` | `9.5` | 1.23% | `60` | **9.5%** |

---

## 3. Tertiary Tab — Tab 3: `Planetary Probe` (`planetary` — Unchanged)

- **Displayed Title:** `Outer-Planet / Titan Volatiles EI-MS`
- **Displayed Subtitle:** `Spaceflight Atmospheric Inlet • Getter-Pumped EI 70 eV` | **Chamber Pressure:** `4.0 × 10⁻⁷ Torr`

| Gas | Formula | Current Code Weight `W_i` | Implied Ion-Source `mol%` | Base Peak (`m/z`) | Observed Peak Height (`% Base`) |
| :--- | :--- | ---: | ---: | :---: | ---: |
| Nitrogen | `N2` | `82.0` | 22.27% | `28` | **100.0%** |
| Methane | `CH4` | `54.0` | 18.10% | `16` | **44.6%** |
| Hydrogen | `H2` | `19.0` | 11.10% | `2` | **15.4%** |
| Helium | `He` | `4.0` | 7.19% | `4` | **3.2%** |
| Argon | `Ar` | `22.0` | 5.21% | `40` | **25.9%** |
| Ethylene | `C2H4` | `18.0` | 4.67% | `28` | *isobaric @ `28`* |
| Ethane | `C2H6` | `22.0` | 4.44% | `28` | *`m/z 30` = 4.7%* |
| Hydrogen cyanide | `HCN` | `20.0` | 4.25% | `27` | **31.7%** |
| Acetylene | `C2H2` | `24.0` | 4.14% | `26` | **36.3%** |
| Acetonitrile | `CH3CN` | `19.0` | 3.29% | `41` | **15.4%** |
| Krypton | `Kr` | `9.5` | 2.62% | `84` | **7.7%** |
| Cyanoacetylene | `HC3N` | `23.0` | 2.27% | `51` | **22.9%** |
| Water vapor | `H2O` | `6.5` | 2.22% | `18` | **5.3%** |
| Carbon dioxide | `CO2` | `9.0` | 2.10% | `44` | **7.3%** |
| Diacetylene | `C4H2` | `16.5` | 1.89% | `50` | **20.2%** |
| Benzene | `C6H6` | `21.0` | 1.77% | `78` | **17.0%** |
| Cyanogen | `C2N2` | `12.0` | 1.60% | `52` | **13.7%** |
| Toluene | `C7H8` | `11.0` | 0.86% | `91` | **8.9%** |
