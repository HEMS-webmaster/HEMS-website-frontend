# Implementation Plan: Publication-Grade Calibrated 70 eV EI Mass Spectrum (`HeroMassSpectrum`)

- **Date:** 2026-11-12
- **Author:** `@arch` (with `@ms` / `@sme2` scientific specification & `@brand` editorial audit)
- **Scope:** `src/frontend/src/components/home/HeroMassSpectrum.tsx`, `src/frontend/src/app/page.tsx`

---

## 1. Scientific Audit Findings (`@ms` / `@sme2`)

Review of the previous inline stick chart in `src/frontend/src/app/page.tsx` identified multiple violations of 70 eV Electron Ionization (EI) physics and NIST reference standards:
1. **Isotopologue & Cracking Anomalies:** $m/z\ 29$ (`8%`) and $m/z\ 45$ (`9%`) exceeded natural $^{14}\text{N}^{15}\text{N}^{\bullet +}$ (`0.73%`) and $^{13}\text{CO}_2^{\bullet +}$ (`1.19%`) abundances by ~10×.
2. **Missing Diagnostic 70 eV Ions:** Omitted $m/z\ 2$ ($\text{H}_2^{\bullet +}$), $m/z\ 12$ ($\text{C}^{\bullet +}$), $m/z\ 14$ ($\text{N}^+ / \text{CH}_2^{\bullet +}$), $m/z\ 20$ ($^{40}\text{Ar}^{2+}$ doubly-charged argon signature), and $m/z\ 22$ ($\text{CO}_2^{2+}$).
3. **Incomplete $\text{H}_2\text{S}$ & BTEX Envelopes:** $m/z\ 34$ ($\text{H}_2\text{S}^{\bullet +}$) lacked its mandatory $m/z\ 33$ ($\text{HS}^+$, `42%`) fragment; $m/z\ 91$ ($\text{C}_7\text{H}_7^+$) lacked its $m/z\ 92$ ($\text{C}_7\text{H}_8^{\bullet +}$, `68.4%`) molecular ion; and $m/z\ 78$ ($\text{C}_6\text{H}_6^{\bullet +}$) lacked $m/z\ 77, 52, 51, 50, 39$ ring-cleavage ions.
4. **Stick Geometry & Collision Defects:** Thick rounded-cap bars (`strokeLinecap="round"`) protruded below the `0%` baseline, and `"16 CH₄⁺"` collided directly with the $m/z\ 17$ and $m/z\ 18$ stems.

---

## 2. Scientific & Editorial Architecture

1. **Forward-Modeled NIST 70 eV EI Superposition Engine (`HeroMassSpectrum.tsx`):**
   - Computes composite mass spectra $I(m/z) = \sum_k c_k S_k^{\text{NIST}}(m/z)$ at module initialization (100% deterministic for static SSR export) from NIST Chemistry WebBook 70 eV EI fragmentation tables and IUPAC natural isotopic ratios across three canonical HEMS field regimes:
     - **Subsea Vent (MIMS):** PDMS membrane-inlet quadrupole spectrum (`2,500 m`, `1.2 × 10⁻⁶ Torr`) resolving $\text{H}_2, \text{He}, \text{CH}_4$ ($m/z\ 15\ \text{CH}_3^+$ quant channel vs. $m/z\ 16$ isobar), $\text{H}_2\text{O}, \text{N}_2, \text{O}_2, \text{H}_2\text{S}$ ($32/33/34$), $^{40}\text{Ar}$ ($40/20$), $\text{CO}_2$, $\text{SO}_2$, and seep BTEX ($\text{C}_6\text{H}_6, \text{C}_7\text{H}_8$).
     - **Volcanic Plume (QMS):** Capillary-inlet fumarole gas spectrum (`8.4 × 10⁻⁷ Torr`) highlighting $\text{CO}_2$ base peak, $\text{H}_2\text{O}$, $\text{SO}_2$ ($m/z\ 64, 48\ \text{SO}^{\bullet +}, 66\ ^{34}\text{SO}_2^{\bullet +}$), $\text{H}_2\text{S}$, $\text{OCS}$ ($m/z\ 60$), and the $3:1$ $\text{H}^{35}\text{Cl}^{\bullet +} / \text{H}^{37}\text{Cl}^{\bullet +}$ chlorine isotope doublet ($m/z\ 36/38$).
     - **Planetary Probe (EI-MS):** Outer-planet / Titan organic-nitrile spectrum (`4.0 × 10⁻⁷ Torr`) resolving $\text{N}_2\text{–}\text{CH}_4$, $\text{C}_2\text{H}_2/\text{HCN}/\text{C}_2\text{H}_4/\text{C}_2\text{H}_6$, $\text{CH}_3\text{CN}$, $\text{C}_4\text{H}_2/\text{HC}_3\text{N}/\text{C}_2\text{N}_2$, $\text{C}_6\text{H}_6$, and the $\text{Kr}$ noble-gas isotope quartet ($m/z\ 82, 83, 84, 86$).
2. **Publication-Grade Editorial Rendering (`@brand` — Brand Guide v3.1.0):**
   - Continuous quadrupole unit-resolution profile envelope ($\Delta m_{\text{FWHM}} = 0.42\text{ Da}$) with subtle Oceanic Sapphire gradient fill paired with `butt`-capped centroid stems.
   - Calibrated analytical plot frame (`viewBox="0 0 460 218"`, `118%` headroom) with `10 Da` major ticks, `5 Da` medium ticks, and `2 Da` minor ticks in `Noto Sans` `tabular-nums` (zero `font-mono`).
   - Deterministic `<IonFormula>` `<tspan>` chemical subscript/superscript renderer with `paintOrder="stroke"` Alabaster haloing and pre-verified zero-collision leader lines.
   - Responsive visibility across mobile, tablet, and desktop with a constant-height (`CLS = 0`) interactive peak readout bar on pointer hover or touch tap.

