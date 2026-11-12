"use client";

import { useState, useCallback, type PointerEvent as ReactPointerEvent } from "react";

type RegimesKey = "hydrothermal" | "volcanic" | "planetary";
type PeakAccent = "primary" | "secondary" | "neutral";

interface FormulaPart {
  text: string;
  pos?: "sub" | "sup";
}

interface CalloutSpec {
  mz: number;
  dx: number;
  labelY: number;
  accent: PeakAccent;
  parts: FormulaPart[];
}

interface ResolvedPeak {
  mz: number;
  abundance: number; // 0..100 normalized to base peak
  exactMass: string;
  formulaPlain: string;
  formulaParts: FormulaPart[];
  assignment: string;
  accent: PeakAccent;
}

interface PrecomputedRegime {
  key: RegimesKey;
  shortTab: string;
  title: string;
  inletSubtitle: string;
  pressureBadge: string;
  peaks: ResolvedPeak[];
  callouts: CalloutSpec[];
  profileLinePath: string;
  profileAreaPath: string;
  defaultFootnote: string;
}

// SVG Coordinate System (viewBox="0 0 460 218")
const PLOT_LEFT = 38;
const PLOT_RIGHT = 446;
const PLOT_TOP = 10;
const Y_100 = 34;
const Y_BASE = 172;
const PEAK_SPAN = Y_BASE - Y_100; // 138 px
const MZ_X0 = 44;
const MZ_SPAN = 396;

function mzToX(mz: number): number {
  return MZ_X0 + (mz / 100) * MZ_SPAN;
}

function abToY(ab: number): number {
  return Y_BASE - (ab / 100) * PEAK_SPAN;
}

// NIST Chemistry WebBook 70 eV Electron Ionization (EI) reference patterns
// (normalized to each pure compound's base peak = 100.0, including IUPAC natural isotopologues)
const PURE_EI_70EV: Record<string, Record<number, number>> = {
  H2: { 2: 100.0, 1: 2.1 },
  He: { 4: 100.0 },
  CH4: {
    16: 100.0,
    17: 1.1,
    15: 85.8,
    14: 15.6,
    13: 8.0,
    12: 2.6,
  },
  H2O: {
    18: 100.0,
    19: 0.08,
    20: 0.205,
    17: 21.2,
    16: 0.9,
  },
  N2: {
    28: 100.0,
    29: 0.73,
    14: 7.2,
  },
  O2: {
    32: 100.0,
    34: 0.41,
    16: 11.4,
  },
  H2S: {
    34: 100.0,
    36: 4.43,
    35: 2.5,
    33: 42.0,
    32: 44.4,
  },
  HCl: {
    36: 100.0,
    38: 31.96,
    35: 17.2,
    37: 5.5,
  },
  Ar: {
    40: 100.0,
    20: 12.6,
    36: 0.33,
    38: 0.06,
  },
  CO2: {
    44: 100.0,
    45: 1.19,
    46: 0.41,
    28: 9.8,
    22: 1.85,
    16: 9.6,
    12: 6.7,
  },
  OCS: {
    60: 100.0,
    62: 4.64,
    32: 52.0,
    28: 8.5,
  },
  SO2: {
    64: 100.0,
    66: 4.84,
    65: 0.87,
    48: 49.3,
    50: 2.32,
    32: 10.4,
    16: 5.2,
  },
  C6H6: {
    78: 100.0,
    79: 6.5,
    77: 23.8,
    52: 19.2,
    51: 18.6,
    50: 15.8,
    39: 13.2,
  },
  C7H8: {
    91: 100.0,
    92: 68.4,
    93: 5.2,
    65: 12.5,
    63: 5.8,
    51: 5.4,
    39: 14.8,
  },
  C2H2: { 26: 100.0, 27: 2.2, 25: 20.1, 24: 5.6, 13: 5.8 },
  HCN: { 27: 100.0, 26: 16.8, 28: 1.5, 12: 4.2 },
  C2H4: { 28: 100.0, 27: 62.3, 26: 55.4, 25: 10.2, 14: 4.1 },
  C2H6: { 28: 100.0, 27: 33.2, 30: 26.2, 29: 21.5, 26: 23.0, 15: 4.6 },
  CH3CN: { 41: 100.0, 40: 52.0, 39: 18.5, 38: 10.4, 14: 8.5 },
  C4H2: { 50: 100.0, 49: 39.0, 48: 9.5, 51: 4.4, 25: 11.0 },
  HC3N: { 51: 100.0, 52: 3.7, 50: 22.0, 25: 7.5 },
  C2N2: { 52: 100.0, 26: 19.0, 53: 2.9 },
  Kr: { 84: 100.0, 86: 30.3, 83: 20.2, 82: 20.3, 80: 4.0, 42: 11.5 },
};

// Token helpers for crisp <tspan> chemical formulas
const f = (
  ...tokens: Array<string | [string, "sub" | "sup"]>
): FormulaPart[] =>
  tokens.map((t) =>
    typeof t === "string" ? { text: t } : { text: t[0], pos: t[1] }
  );

interface IonCatalogEntry {
  exactMass: string;
  plain: string;
  parts: FormulaPart[];
  note: string;
  accent?: PeakAccent;
}

const DEFAULT_ION_CATALOG: Record<number, IonCatalogEntry> = {
  1: { exactMass: "1.0073", plain: "H⁺", parts: f("H", ["+", "sup"]), note: "Atomic hydrogen fragment ion" },
  2: { exactMass: "2.0151", plain: "H₂•⁺", parts: f("H", ["2", "sub"], ["•+", "sup"]), note: "Dissolved / serpentinization H₂ & UHV background", accent: "primary" },
  4: { exactMass: "4.0021", plain: "⁴He⁺", parts: f(["4", "sup"], "He", ["+", "sup"]), note: "Mantle / crustal helium-4 tracer" },
  12: { exactMass: "11.9995", plain: "C•⁺", parts: f("C", ["•+", "sup"]), note: "Atomic carbon EI fragment (CO₂ & CH₄ cracking)" },
  13: { exactMass: "13.0073", plain: "CH⁺", parts: f("CH", ["+", "sup"]), note: "Methylidyne 70 eV EI fragment of CH₄" },
  14: { exactMass: "14.0025", plain: "N⁺ / CH₂•⁺", parts: f("N", ["+", "sup"], " / CH", ["2", "sub"], ["•+", "sup"]), note: "Dissociative N₂ cracking (7.2%) + methylene fragment" },
  15: { exactMass: "15.0229", plain: "CH₃⁺", parts: f("CH", ["3", "sub"], ["+", "sup"]), note: "Methane fragment — interference-free MIMS quant channel", accent: "secondary" },
  16: { exactMass: "16.0308", plain: "CH₄•⁺ / O•⁺", parts: f("CH", ["4", "sub"], ["•+", "sup"]), note: "Methane radical cation + isobaric ¹⁶O•⁺ from CO₂/O₂/H₂O" },
  17: { exactMass: "17.0022", plain: "OH⁺", parts: f("OH", ["+", "sup"]), note: "Hydroxyl EI fragment of H₂O (21.2% of m/z 18) + ¹³CH₄•⁺" },
  18: { exactMass: "18.0100", plain: "H₂O•⁺", parts: f("H", ["2", "sub"], "O", ["•+", "sup"]), note: "Water vapor molecular radical cation", accent: "primary" },
  20: { exactMass: "19.9806", plain: "⁴⁰Ar²⁺", parts: f(["40", "sup"], "Ar", ["2+", "sup"]), note: "Doubly charged argon ion (z = 2, 12.6% of m/z 40 at 70 eV)" },
  22: { exactMass: "21.9944", plain: "CO₂²⁺", parts: f("CO", ["2", "sub"], ["2+", "sup"]), note: "Doubly charged carbon dioxide ion (z = 2, 1.85% of m/z 44)" },
  24: { exactMass: "23.9995", plain: "C₂•⁺", parts: f("C", ["2", "sub"], ["•+", "sup"]), note: "Dicarbon EI fragment of C₂ hydrocarbons" },
  25: { exactMass: "25.0073", plain: "C₂H⁺", parts: f("C", ["2", "sub"], "H", ["+", "sup"]), note: "Ethynyl EI fragment of acetylene & polyynes" },
  26: { exactMass: "26.0151", plain: "C₂H₂•⁺ / CN⁺", parts: f("C", ["2", "sub"], "H", ["2", "sub"], ["•+", "sup"]), note: "Acetylene molecular ion + nitrile fragment", accent: "secondary" },
  27: { exactMass: "27.0103", plain: "HCN•⁺ / C₂H₃⁺", parts: f("HCN", ["•+", "sup"]), note: "Hydrogen cyanide molecular ion + vinyl C₂H₃⁺ isobar", accent: "secondary" },
  28: { exactMass: "28.0056", plain: "N₂•⁺ / CO•⁺", parts: f("N", ["2", "sub"], ["•+", "sup"]), note: "Molecular nitrogen base peak + CO•⁺ cracking contribution", accent: "primary" },
  29: { exactMass: "29.0026", plain: "¹⁴N¹⁵N•⁺ / C₂H₅⁺", parts: f(["15", "sup"], "NN", ["•+", "sup"]), note: "Natural ¹⁵N isotopologue (0.73% of N₂) + ethyl fragment" },
  30: { exactMass: "30.0464", plain: "C₂H₆•⁺", parts: f("C", ["2", "sub"], "H", ["6", "sub"], ["•+", "sup"]), note: "Ethane molecular radical cation" },
  32: { exactMass: "31.9893", plain: "O₂•⁺ / S•⁺", parts: f("O", ["2", "sub"], ["•+", "sup"]), note: "Dissolved dioxygen + isobaric ³²S•⁺ fragment from H₂S & SO₂", accent: "primary" },
  33: { exactMass: "32.9793", plain: "HS⁺", parts: f("HS", ["+", "sup"]), note: "Bisulfide EI fragment of H₂S (NIST 42.0% of m/z 34)" },
  34: { exactMass: "33.9872", plain: "H₂S•⁺", parts: f("H", ["2", "sub"], "S", ["•+", "sup"]), note: "Hydrogen sulfide molecular ion — hydrothermal & fumarolic tracer", accent: "secondary" },
  35: { exactMass: "34.9683", plain: "³⁵Cl⁺", parts: f(["35", "sup"], "Cl", ["+", "sup"]), note: "Atomic chlorine-35 EI fragment of volcanic HCl" },
  36: { exactMass: "35.9761", plain: "H³⁵Cl•⁺ / H₂³⁴S•⁺", parts: f("H", ["35", "sup"], "Cl", ["•+", "sup"]), note: "Hydrogen chloride (³⁵Cl, 75.8% natural abundance) + H₂³⁴S•⁺", accent: "secondary" },
  37: { exactMass: "36.9654", plain: "³⁷Cl⁺", parts: f(["37", "sup"], "Cl", ["+", "sup"]), note: "Atomic chlorine-37 EI fragment (³⁷Cl/³⁵Cl = 0.320)" },
  38: { exactMass: "37.9732", plain: "H³⁷Cl•⁺", parts: f("H", ["37", "sup"], "Cl", ["•+", "sup"]), note: "Volcanic H³⁷Cl•⁺ isotopologue (exact 1:3 doublet with m/z 36)" },
  39: { exactMass: "39.0229", plain: "C₃H₃⁺", parts: f("C", ["3", "sub"], "H", ["3", "sub"], ["+", "sup"]), note: "Cyclopropenylium ring-cleavage fragment of aromatic VOCs" },
  40: { exactMass: "39.9618", plain: "⁴⁰Ar•⁺", parts: f("Ar", ["•+", "sup"]), note: "Argon-40 — conservative dissolved-gas MIMS internal standard", accent: "primary" },
  41: { exactMass: "41.0260", plain: "CH₃CN•⁺", parts: f("CH", ["3", "sub"], "CN", ["•+", "sup"]), note: "Acetonitrile photochemical nitrile molecular ion", accent: "secondary" },
  42: { exactMass: "41.9552", plain: "⁸⁴Kr²⁺", parts: f(["84", "sup"], "Kr", ["2+", "sup"]), note: "Doubly charged krypton-84 ion (z = 2)" },
  44: { exactMass: "43.9893", plain: "CO₂•⁺", parts: f("CO", ["2", "sub"], ["•+", "sup"]), note: "Carbon dioxide molecular radical cation", accent: "secondary" },
  45: { exactMass: "44.9926", plain: "¹³CO₂•⁺", parts: f(["13", "sup"], "CO", ["2", "sub"], ["•+", "sup"]), note: "Natural ¹³C + ¹⁷O carbon dioxide isotopologue (1.19% of m/z 44)" },
  46: { exactMass: "45.9935", plain: "C¹⁶O¹⁸O•⁺", parts: f("C", ["16", "sup"], "O", ["18", "sup"], "O", ["•+", "sup"]), note: "Natural ¹⁸O carbon dioxide isotopologue (0.41% of m/z 44)" },
  48: { exactMass: "47.9664", plain: "SO•⁺", parts: f("SO", ["•+", "sup"]), note: "Sulfur monoxide EI fragment of SO₂ (NIST 49.3% of m/z 64)", accent: "secondary" },
  49: { exactMass: "49.0073", plain: "C₄H⁺", parts: f("C", ["4", "sub"], "H", ["+", "sup"]), note: "Butadiynyl fragment of photochemical diacetylene (C₄H₂)" },
  50: { exactMass: "50.0151", plain: "C₄H₂•⁺", parts: f("C", ["4", "sub"], "H", ["2", "sub"], ["•+", "sup"]), note: "Diacetylene / aromatic C₄H₂•⁺ fragment ion" },
  51: { exactMass: "51.0103", plain: "HC₃N•⁺ / C₄H₃⁺", parts: f("HC", ["3", "sub"], "N", ["•+", "sup"]), note: "Cyanoacetylene nitrile / phenyl ring-cleavage ion", accent: "secondary" },
  52: { exactMass: "52.0056", plain: "C₂N₂•⁺ / C₄H₄•⁺", parts: f("C", ["4", "sub"], "H", ["4", "sub"], ["•+", "sup"]), note: "Benzene C₄H₄•⁺ ring fragment / cyanogen (C₂N₂•⁺)" },
  53: { exactMass: "53.0089", plain: "¹³CCNH₂⁺", parts: f(["13", "sup"], "CC", ["2", "sub"], "N", ["2", "sub"], ["•+", "sup"]), note: "Heavy cyanogen isotopologue" },
  60: { exactMass: "59.9664", plain: "OCS•⁺", parts: f("OCS", ["•+", "sup"]), note: "Carbonyl sulfide volcanic gas molecular ion", accent: "secondary" },
  62: { exactMass: "61.9622", plain: "OC³⁴S•⁺", parts: f("OC", ["34", "sup"], "S", ["•+", "sup"]), note: "Sulfur-34 carbonyl sulfide isotopologue" },
  63: { exactMass: "63.0229", plain: "C₅H₃⁺", parts: f("C", ["5", "sub"], "H", ["3", "sub"], ["+", "sup"]), note: "Aromatic hydrocarbon ring-contraction fragment" },
  64: { exactMass: "63.9614", plain: "SO₂•⁺", parts: f("SO", ["2", "sub"], ["•+", "sup"]), note: "Sulfur dioxide molecular radical cation", accent: "secondary" },
  65: { exactMass: "65.0386", plain: "C₅H₅⁺", parts: f("C", ["5", "sub"], "H", ["5", "sub"], ["+", "sup"]), note: "Cyclopentadienyl cation (loss of C₂H₂ from tropylium m/z 91)" },
  66: { exactMass: "65.9572", plain: "³⁴SO₂•⁺", parts: f(["34", "sup"], "SO", ["2", "sub"], ["•+", "sup"]), note: "Natural ³⁴S + ¹⁸O sulfur dioxide isotopologue (4.84% of m/z 64)" },
  77: { exactMass: "77.0386", plain: "C₆H₅⁺", parts: f("C", ["6", "sub"], "H", ["5", "sub"], ["+", "sup"]), note: "Phenyl cation (H• loss from benzene, 23.8% of m/z 78)" },
  78: { exactMass: "78.0464", plain: "C₆H₆•⁺", parts: f("C", ["6", "sub"], "H", ["6", "sub"], ["•+", "sup"]), note: "Benzene molecular ion — thermogenic seep / photochemical aromatic", accent: "secondary" },
  79: { exactMass: "79.0498", plain: "¹³CC₅H₆•⁺", parts: f(["13", "sup"], "CC", ["5", "sub"], "H", ["6", "sub"], ["•+", "sup"]), note: "Natural ¹³C benzene isotopologue (6 × 1.07% = 6.5% of m/z 78)" },
  80: { exactMass: "79.9158", plain: "⁸⁰Kr•⁺", parts: f(["80", "sup"], "Kr", ["•+", "sup"]), note: "Krypton-80 noble gas isotope (2.29% natural abundance)" },
  82: { exactMass: "81.9129", plain: "⁸²Kr•⁺", parts: f(["82", "sup"], "Kr", ["•+", "sup"]), note: "Krypton-82 noble gas isotope (11.59% natural abundance)" },
  83: { exactMass: "82.9136", plain: "⁸³Kr•⁺", parts: f(["83", "sup"], "Kr", ["•+", "sup"]), note: "Krypton-83 noble gas isotope (11.50% natural abundance)" },
  84: { exactMass: "83.9110", plain: "⁸⁴Kr•⁺", parts: f("Kr", ["•+", "sup"]), note: "Krypton-84 principal noble-gas isotope (56.99% natural abundance)", accent: "primary" },
  86: { exactMass: "85.9101", plain: "⁸⁶Kr•⁺", parts: f(["86", "sup"], "Kr", ["•+", "sup"]), note: "Krypton-86 noble gas isotope (17.28% natural abundance)" },
  91: { exactMass: "91.0542", plain: "C₇H₇⁺", parts: f("C", ["7", "sub"], "H", ["7", "sub"], ["+", "sup"]), note: "Tropylium cation — base-peak EI signature of toluene (BTEX)", accent: "secondary" },
  92: { exactMass: "92.0621", plain: "C₇H₈•⁺", parts: f("C", ["7", "sub"], "H", ["8", "sub"], ["•+", "sup"]), note: "Toluene molecular radical cation (NIST 68.4% of m/z 91)" },
  93: { exactMass: "93.0654", plain: "¹³CC₆H₈•⁺", parts: f(["13", "sup"], "CC", ["6", "sub"], "H", ["8", "sub"], ["•+", "sup"]), note: "Natural ¹³C toluene isotopologue" },
};

function buildPrecomputedRegime(config: {
  key: RegimesKey;
  shortTab: string;
  title: string;
  inletSubtitle: string;
  pressureBadge: string;
  mixture: Record<string, number>;
  callouts: CalloutSpec[];
  noteOverrides?: Record<number, { plain?: string; note?: string; accent?: PeakAccent }>;
  defaultFootnote: string;
}): PrecomputedRegime {
  const composite: Record<number, number> = {};
  for (const [species, weight] of Object.entries(config.mixture)) {
    const pattern = PURE_EI_70EV[species];
    if (!pattern) continue;
    for (const [mzStr, rel] of Object.entries(pattern)) {
      const mz = Number(mzStr);
      composite[mz] = (composite[mz] ?? 0) + weight * (rel / 100);
    }
  }

  const maxIntensity = Math.max(...Object.values(composite));
  const peaks: ResolvedPeak[] = Object.keys(composite)
    .map(Number)
    .sort((a, b) => a - b)
    .map((mz) => {
      const abundance = Number(((composite[mz] / maxIntensity) * 100).toFixed(2));
      const cat = DEFAULT_ION_CATALOG[mz] ?? {
        exactMass: `${mz}.0000`,
        plain: `m/z ${mz}`,
        parts: f(`${mz}`),
        note: "Resolved electron-ionization fragment ion",
      };
      const override = config.noteOverrides?.[mz];
      return {
        mz,
        abundance,
        exactMass: cat.exactMass,
        formulaPlain: override?.plain ?? cat.plain,
        formulaParts: cat.parts,
        assignment: override?.note ?? cat.note,
        accent: override?.accent ?? cat.accent ?? "neutral",
      };
    })
    .filter((p) => p.abundance >= 0.45);

  // Synthesize continuous quadrupole profile scan (FWHM = 0.42 Da -> sigma = 0.178 Da)
  // Deterministic electrometer baseline ripple (~0.16%) ensures 100% SSR/hydration parity.
  const sigma = 0.178;
  const twoSigmaSq = 2 * sigma * sigma;
  const coords: string[] = [];
  for (let i = -8; i <= 1008; i += 1) {
    const mz = i / 10;
    let signal =
      0.14 +
      0.06 * Math.sin(mz * 2.9 + 0.4) +
      0.04 * Math.cos(mz * 7.3 + 1.1);
    for (let k = 0; k < peaks.length; k += 1) {
      const dm = mz - peaks[k].mz;
      if (dm > -1.2 && dm < 1.2) {
        signal += peaks[k].abundance * Math.exp(-(dm * dm) / twoSigmaSq);
      }
    }
    const clamped = Math.min(101.5, Math.max(0, signal));
    const x = mzToX(mz);
    if (x >= PLOT_LEFT && x <= PLOT_RIGHT) {
      coords.push(`${x.toFixed(1)},${abToY(clamped).toFixed(1)}`);
    }
  }

  const firstPt = coords[0].split(",")[0];
  const lastPt = coords[coords.length - 1].split(",")[0];
  const profileLinePath = `M ${coords.join(" L ")}`;
  const profileAreaPath = `${profileLinePath} L ${lastPt},${Y_BASE} L ${firstPt},${Y_BASE} Z`;

  return {
    key: config.key,
    shortTab: config.shortTab,
    title: config.title,
    inletSubtitle: config.inletSubtitle,
    pressureBadge: config.pressureBadge,
    peaks,
    callouts: config.callouts,
    profileLinePath,
    profileAreaPath,
    defaultFootnote: config.defaultFootnote,
  };
}

const REGIMES: Record<RegimesKey, PrecomputedRegime> = {
  hydrothermal: buildPrecomputedRegime({
    key: "hydrothermal",
    shortTab: "Subsea Vent",
    title: "Hydrothermal & Cold-Seep MIMS Scan",
    inletSubtitle: "PDMS Membrane Inlet • 2,500 m Depth • EI 70 eV",
    pressureBadge: "1.2 × 10⁻⁶ Torr",
    mixture: {
      H2: 14.0,
      He: 5.5,
      CH4: 33.0,
      H2O: 52.0,
      N2: 92.5,
      O2: 22.0,
      H2S: 24.0,
      Ar: 26.0,
      CO2: 76.0,
      SO2: 14.0,
      C6H6: 19.5,
      C7H8: 13.5,
    },
    callouts: [
      { mz: 2, dx: 8, labelY: 136, accent: "primary", parts: f("2 H", ["2", "sub"], ["•+", "sup"]) },
      { mz: 15, dx: -22, labelY: 102, accent: "secondary", parts: f("15 CH", ["3", "sub"], ["+", "sup"]) },
      { mz: 18, dx: 4, labelY: 84, accent: "primary", parts: f("18 H", ["2", "sub"], "O", ["•+", "sup"]) },
      { mz: 28, dx: 0, labelY: 23, accent: "primary", parts: f("28 N", ["2", "sub"], ["•+", "sup"]) },
      { mz: 32, dx: 2, labelY: 108, accent: "primary", parts: f("32 O", ["2", "sub"], ["•+", "sup"]) },
      { mz: 34, dx: 14, labelY: 88, accent: "secondary", parts: f("34 H", ["2", "sub"], "S", ["•+", "sup"]) },
      { mz: 40, dx: -4, labelY: 125, accent: "primary", parts: f("40 Ar", ["•+", "sup"]) },
      { mz: 44, dx: 4, labelY: 55, accent: "secondary", parts: f("44 CO", ["2", "sub"], ["•+", "sup"]) },
      { mz: 64, dx: 0, labelY: 140, accent: "secondary", parts: f("64 SO", ["2", "sub"], ["•+", "sup"]) },
      { mz: 78, dx: 0, labelY: 133, accent: "secondary", parts: f("78 C", ["6", "sub"], "H", ["6", "sub"], ["•+", "sup"]) },
      { mz: 91, dx: 0, labelY: 141, accent: "secondary", parts: f("91 C", ["7", "sub"], "H", ["7", "sub"], ["+", "sup"]) },
    ],
    defaultFootnote:
      "Quadrupole scan (Δm = 0.42 Da FWHM, NIST 70 eV EI) — hover or tap any peak to inspect ion assignment.",
  }),

  volcanic: buildPrecomputedRegime({
    key: "volcanic",
    shortTab: "Volcanic Plume",
    title: "Volcanic Fumarole Gas QMS Scan",
    inletSubtitle: "Heated Fused-Silica Capillary • 1 atm → EI 70 eV",
    pressureBadge: "8.4 × 10⁻⁷ Torr",
    mixture: {
      H2: 8.0,
      He: 3.0,
      CH4: 8.5,
      H2O: 78.0,
      N2: 84.0,
      O2: 24.0,
      H2S: 29.0,
      HCl: 22.0,
      Ar: 16.0,
      CO2: 100.0,
      OCS: 9.5,
      SO2: 64.0,
    },
    callouts: [
      { mz: 2, dx: 8, labelY: 146, accent: "primary", parts: f("2 H", ["2", "sub"], ["•+", "sup"]) },
      { mz: 18, dx: -2, labelY: 52, accent: "primary", parts: f("18 H", ["2", "sub"], "O", ["•+", "sup"]) },
      { mz: 28, dx: -2, labelY: 29, accent: "primary", parts: f("28 N", ["2", "sub"], ["•+", "sup"]) },
      { mz: 32, dx: 2, labelY: 90, accent: "primary", parts: f("32 O", ["2", "sub"], ["•+", "sup"]) },
      { mz: 34, dx: 6, labelY: 72, accent: "secondary", parts: f("34 H", ["2", "sub"], "S", ["•+", "sup"]) },
      { mz: 36, dx: 8, labelY: 126, accent: "secondary", parts: f("36 H", ["35", "sup"], "Cl", ["•+", "sup"]) },
      { mz: 44, dx: 2, labelY: 23, accent: "secondary", parts: f("44 CO", ["2", "sub"], ["•+", "sup"]) },
      { mz: 48, dx: 10, labelY: 115, accent: "secondary", parts: f("48 SO", ["•+", "sup"]) },
      { mz: 60, dx: -8, labelY: 146, accent: "secondary", parts: f("60 OCS", ["•+", "sup"]) },
      { mz: 64, dx: 4, labelY: 71, accent: "secondary", parts: f("64 SO", ["2", "sub"], ["•+", "sup"]) },
    ],
    defaultFootnote:
      "Resolves volcanic SO₂/SO•⁺ (64/48), H₂S/HS⁺ (34/33), OCS (60), and the 3:1 H³⁵Cl/H³⁷Cl doublet (36/38).",
  }),

  planetary: buildPrecomputedRegime({
    key: "planetary",
    shortTab: "Planetary Probe",
    title: "Outer-Planet / Titan Volatiles EI-MS",
    inletSubtitle: "Spaceflight Atmospheric Inlet • Getter-Pumped EI 70 eV",
    pressureBadge: "4.0 × 10⁻⁷ Torr",
    mixture: {
      H2: 19.0,
      He: 4.0,
      CH4: 54.0,
      H2O: 6.5,
      C2H2: 24.0,
      HCN: 20.0,
      C2H4: 18.0,
      C2H6: 22.0,
      N2: 82.0,
      Ar: 22.0,
      CH3CN: 19.0,
      CO2: 9.0,
      C4H2: 16.5,
      HC3N: 23.0,
      C2N2: 12.0,
      C6H6: 21.0,
      Kr: 9.5,
      C7H8: 11.0,
    },
    noteOverrides: {
      28: {
        plain: "N₂•⁺ / C₂H₄•⁺",
        note: "Atmospheric N₂ base peak + C₂H₄•⁺ / C₂H₆ photochemical hydrocarbon contribution",
        accent: "primary",
      },
      52: {
        plain: "C₂N₂•⁺ / C₄H₄•⁺",
        note: "Cyanogen (C₂N₂•⁺) photochemical dinitrile + benzene C₄H₄•⁺ fragment",
      },
    },
    callouts: [
      { mz: 2, dx: 8, labelY: 138, accent: "primary", parts: f("2 H", ["2", "sub"], ["•+", "sup"]) },
      { mz: 15, dx: -20, labelY: 106, accent: "secondary", parts: f("15 CH", ["3", "sub"], ["+", "sup"]) },
      { mz: 16, dx: 4, labelY: 86, accent: "secondary", parts: f("16 CH", ["4", "sub"], ["•+", "sup"]) },
      { mz: 26, dx: -18, labelY: 108, accent: "secondary", parts: f("26 C", ["2", "sub"], "H", ["2", "sub"], ["•+", "sup"]) },
      { mz: 28, dx: 2, labelY: 23, accent: "primary", parts: f("28 N", ["2", "sub"], ["•+", "sup"]) },
      { mz: 40, dx: -8, labelY: 122, accent: "primary", parts: f("40 Ar", ["•+", "sup"]) },
      { mz: 41, dx: 16, labelY: 106, accent: "secondary", parts: f("41 CH", ["3", "sub"], "CN", ["•+", "sup"]) },
      { mz: 51, dx: 4, labelY: 125, accent: "secondary", parts: f("51 HC", ["3", "sub"], "N", ["•+", "sup"]) },
      { mz: 78, dx: -4, labelY: 136, accent: "secondary", parts: f("78 C", ["6", "sub"], "H", ["6", "sub"], ["•+", "sup"]) },
      { mz: 84, dx: 0, labelY: 149, accent: "primary", parts: f("84 Kr", ["•+", "sup"]) },
      { mz: 91, dx: 6, labelY: 136, accent: "secondary", parts: f("91 C", ["7", "sub"], "H", ["7", "sub"], ["+", "sup"]) },
    ],
    defaultFootnote:
      "N₂–CH₄ atmosphere with photochemical nitriles (HCN, CH₃CN, HC₃N), C₆H₆, and Kr isotopes (82–86).",
  }),
};

const REGIME_ORDER: RegimesKey[] = ["hydrothermal", "volcanic", "planetary"];

function renderFormulaSpans(parts: FormulaPart[], baseFontSize = 7.6) {
  let currentOffset = 0;
  return parts.map((part, idx) => {
    const targetOffset =
      part.pos === "sub" ? 1.8 : part.pos === "sup" ? -2.6 : 0;
    const dy = targetOffset - currentOffset;
    currentOffset = targetOffset;
    const fontSize = part.pos ? baseFontSize * 0.74 : baseFontSize;
    return (
      <tspan
        key={idx}
        dy={dy !== 0 ? dy.toFixed(2) : undefined}
        fontSize={fontSize.toFixed(2)}
      >
        {part.text}
      </tspan>
    );
  });
}

export default function HeroMassSpectrum() {
  const [regimeKey, setRegimeKey] = useState<RegimesKey>("hydrothermal");
  const [activeMz, setActiveMz] = useState<number | null>(null);

  const regime = REGIMES[regimeKey];
  const peakMap = new Map<number, ResolvedPeak>(
    regime.peaks.map((p) => [p.mz, p])
  );
  const activePeak = activeMz !== null ? peakMap.get(activeMz) ?? null : null;

  const handleSvgPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const svgX = ((e.clientX - rect.left) / rect.width) * 460;
      const mzCursor = ((svgX - MZ_X0) / MZ_SPAN) * 100;
      if (mzCursor < -2 || mzCursor > 103) {
        setActiveMz(null);
        return;
      }
      let bestPeak: ResolvedPeak | null = null;
      let bestDist = 3.2; // snap radius in Da
      for (const p of regime.peaks) {
        const d = Math.abs(p.mz - mzCursor);
        if (d < bestDist) {
          bestDist = d;
          bestPeak = p;
        }
      }
      setActiveMz(bestPeak ? bestPeak.mz : null);
    },
    [regime.peaks]
  );

  return (
    <div className="space-y-2.5">
      {/* Analytical Header & Field Regime Switcher */}
      <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">
              {regime.inletSubtitle}
            </span>
            <h2 className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug mt-0.5">
              {regime.title}{" "}
              <span className="text-slate-500 font-normal tabular-nums">
                (<em className="font-serif italic">m/z</em> 1–100)
              </span>
            </h2>
          </div>
          <span className="tabular-nums text-[10.5px] px-2 py-0.5 rounded-md bg-teal-50/90 text-secondary border border-teal-200/80 font-semibold shrink-0 whitespace-nowrap">
            {regime.pressureBadge}
          </span>
        </div>

        {/* 3 Harsh-Environment Preset Tabs */}
        <div
          role="tablist"
          aria-label="Field mass spectrometry deployment regimes"
          className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-100/90 border border-slate-200/75"
        >
          {REGIME_ORDER.map((key) => {
            const item = REGIMES[key];
            const isSelected = key === regimeKey;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setRegimeKey(key);
                  setActiveMz(null);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer truncate ${
                  isSelected
                    ? "bg-white text-primary shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 border border-transparent"
                }`}
              >
                {item.shortTab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calibrated Publication-Grade SVG Mass Spectrum */}
      <div className="bg-[#FAFBFD] border border-slate-200/85 rounded-xl px-2 pt-2 pb-1.5 shadow-2xs">
        <svg
          viewBox="0 0 460 218"
          className="w-full h-auto block select-none touch-pan-y cursor-crosshair"
          role="img"
          aria-label={`Calibrated 70 eV electron ionization mass spectrum from m/z 1 to 100: ${regime.title}`}
          onPointerMove={handleSvgPointerMove}
          onPointerLeave={() => setActiveMz(null)}
        >
          <defs>
            <linearGradient id="hemsSpectrumFill" x1="0" y1={Y_100} x2="0" y2={Y_BASE} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0369A1" stopOpacity="0.16" />
              <stop offset="65%" stopColor="#0F766E" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Analytical Plot Frame Background */}
          <rect
            x={PLOT_LEFT}
            y={PLOT_TOP}
            width={PLOT_RIGHT - PLOT_LEFT}
            height={Y_BASE - PLOT_TOP}
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="0.85"
          />

          {/* Horizontal Relative Abundance Reference Gridlines (25%, 50%, 75%, 100%) */}
          {[100, 75, 50, 25].map((pct) => {
            const y = abToY(pct);
            return (
              <line
                key={pct}
                x1={PLOT_LEFT}
                y1={y}
                x2={PLOT_RIGHT}
                y2={y}
                stroke={pct === 100 ? "#CBD5E1" : "#E2E8F0"}
                strokeWidth="0.7"
                strokeDasharray={pct === 100 ? "3 3" : "2 3"}
              />
            );
          })}

          {/* Subtle Vertical Major m/z Guide Hairlines (every 20 Da) */}
          {[20, 40, 60, 80].map((mzGrid) => {
            const x = mzToX(mzGrid);
            return (
              <line
                key={mzGrid}
                x1={x}
                y1={PLOT_TOP}
                x2={x}
                y2={Y_BASE}
                stroke="#F1F5F9"
                strokeWidth="0.75"
              />
            );
          })}

          {/* Y-Axis Spine, Ticks & Labels */}
          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP}
            x2={PLOT_LEFT}
            y2={Y_BASE}
            stroke="#94A3B8"
            strokeWidth="0.95"
          />
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = abToY(pct);
            return (
              <g key={pct}>
                <line
                  x1={PLOT_LEFT - 3.2}
                  y1={y}
                  x2={PLOT_LEFT}
                  y2={y}
                  stroke="#94A3B8"
                  strokeWidth="0.9"
                />
                <text
                  x={PLOT_LEFT - 5.5}
                  y={y + 2.6}
                  fill="#64748B"
                  fontSize="7.8"
                  fontFamily="var(--font-noto-sans), system-ui, sans-serif"
                  textAnchor="end"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {pct}
                </text>
              </g>
            );
          })}
          <text
            x="10.5"
            y={(PLOT_TOP + Y_BASE) / 2}
            transform={`rotate(-90 10.5 ${(PLOT_TOP + Y_BASE) / 2})`}
            fill="#475569"
            fontSize="8.3"
            fontWeight="500"
            fontFamily="var(--font-noto-sans), system-ui, sans-serif"
            textAnchor="middle"
          >
            Rel. Abundance (%)
          </text>

          {/* Continuous Quadrupole Profile Envelope (Area + Trace) */}
          <path d={regime.profileAreaPath} fill="url(#hemsSpectrumFill)" />
          <path
            d={regime.profileLinePath}
            fill="none"
            stroke="#0284C7"
            strokeOpacity="0.45"
            strokeWidth="0.85"
            strokeLinejoin="round"
          />

          {/* Active Peak Crosshair Guide */}
          {activePeak && (
            <line
              x1={mzToX(activePeak.mz)}
              y1={PLOT_TOP}
              x2={mzToX(activePeak.mz)}
              y2={Y_BASE}
              stroke="#0369A1"
              strokeOpacity="0.28"
              strokeWidth="0.85"
              strokeDasharray="2 2"
            />
          )}

          {/* Resolved Centroid Ion Sticks (Exact NIST 70 eV Superposition) */}
          {regime.peaks.map((peak) => {
            const x = mzToX(peak.mz);
            const yTop = abToY(peak.abundance);
            const isActive = activePeak?.mz === peak.mz;
            const strokeColor = isActive
              ? "#0F172A"
              : peak.accent === "primary"
              ? "#0369A1"
              : peak.accent === "secondary"
              ? "#0F766E"
              : "#64748B";

            const stemWidth = isActive
              ? 2.1
              : peak.abundance >= 40
              ? 1.55
              : peak.abundance >= 12
              ? 1.25
              : 0.95;

            return (
              <g key={peak.mz}>
                <line
                  x1={x}
                  y1={Y_BASE}
                  x2={x}
                  y2={yTop}
                  stroke={strokeColor}
                  strokeWidth={stemWidth}
                  strokeLinecap="butt"
                />
                {(peak.abundance >= 12 || isActive) && (
                  <circle
                    cx={x}
                    cy={yTop}
                    r={isActive ? 2.7 : 1.35}
                    fill={isActive ? "#FFFFFF" : strokeColor}
                    stroke={isActive ? "#0369A1" : "none"}
                    strokeWidth={isActive ? 1.5 : 0}
                  />
                )}
              </g>
            );
          })}

          {/* Baseline X-Axis & Calibrated 1-Da / 5-Da / 10-Da Analytical Ruler Ticks */}
          <line
            x1={PLOT_LEFT}
            y1={Y_BASE}
            x2={PLOT_RIGHT}
            y2={Y_BASE}
            stroke="#64748B"
            strokeWidth="1"
          />
          {Array.from({ length: 101 }, (_, mzTick) => {
            const x = mzToX(mzTick);
            const isMajor = mzTick % 10 === 0;
            const isMid = mzTick % 5 === 0 && !isMajor;
            const tickLen = isMajor ? 4.5 : isMid ? 3.0 : 1.65;
            return (
              <g key={mzTick}>
                <line
                  x1={x}
                  y1={Y_BASE}
                  x2={x}
                  y2={Y_BASE + tickLen}
                  stroke={isMajor ? "#475569" : isMid ? "#64748B" : "#CBD5E1"}
                  strokeWidth={isMajor ? "0.95" : isMid ? "0.75" : "0.55"}
                />
                {isMajor && (
                  <text
                    x={x}
                    y={Y_BASE + 14.5}
                    fill="#475569"
                    fontSize="8"
                    fontWeight="500"
                    fontFamily="var(--font-noto-sans), system-ui, sans-serif"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {mzTick}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-Axis Title */}
          <text
            x={(PLOT_LEFT + PLOT_RIGHT) / 2}
            y="208"
            fill="#475569"
            fontSize="8.6"
            fontWeight="500"
            fontFamily="var(--font-noto-sans), system-ui, sans-serif"
            textAnchor="middle"
          >
            Mass-to-Charge Ratio (
            <tspan
              fontFamily="var(--font-source-serif), Georgia, serif"
              fontStyle="italic"
              fontSize="9.2"
            >
              m/z
            </tspan>
            )
          </text>

          {/* Zero-Collision Chemical Formula Callouts & Leader Hairlines */}
          {regime.callouts.map((c) => {
            const peak = peakMap.get(c.mz);
            if (!peak) return null;
            const px = mzToX(c.mz);
            const py = abToY(peak.abundance);
            const lx = px + c.dx;
            const ly = c.labelY;
            const isActive = activePeak?.mz === c.mz;
            const needsLeader = Math.abs(c.dx) > 4 || py - (ly + 3) > 7;
            const textColor = isActive
              ? "#0F172A"
              : c.accent === "primary"
              ? "#0369A1"
              : c.accent === "secondary"
              ? "#0F766E"
              : "#334155";

            return (
              <g key={c.mz}>
                {needsLeader && (
                  <polyline
                    points={`${px.toFixed(1)},${(py - 2.2).toFixed(1)} ${(
                      px +
                      c.dx * 0.65
                    ).toFixed(1)},${(ly + 5.2).toFixed(1)} ${lx.toFixed(
                      1
                    )},${(ly + 3.0).toFixed(1)}`}
                    fill="none"
                    stroke={isActive ? "#0369A1" : "#94A3B8"}
                    strokeWidth={isActive ? "0.95" : "0.7"}
                    strokeOpacity={isActive ? "0.95" : "0.8"}
                  />
                )}
                <text
                  x={lx}
                  y={ly}
                  fill={textColor}
                  fontSize="7.6"
                  fontWeight={isActive ? "700" : "600"}
                  fontFamily="var(--font-noto-sans), system-ui, sans-serif"
                  textAnchor="middle"
                  paintOrder="stroke"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {renderFormulaSpans(c.parts, 7.6)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Constant-Height Specimen Readout Strip (Zero CLS on Hover/Tap) */}
        <div className="mt-1 pt-1.5 px-1.5 border-t border-slate-200/70 min-h-[34px] flex items-center justify-between gap-2 text-[11px] leading-tight">
          {activePeak ? (
            <>
              <div className="min-w-0 truncate text-slate-700">
                <span className="font-semibold text-primary tabular-nums">
                  <em className="font-serif italic font-normal">m/z</em>{" "}
                  {activePeak.exactMass}
                </span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span className="font-semibold text-slate-900">
                  {activePeak.formulaPlain}
                </span>
                <span className="mx-1.5 text-slate-300">—</span>
                <span className="text-slate-600">{activePeak.assignment}</span>
              </div>
              <span className="tabular-nums font-semibold text-secondary bg-teal-50 border border-teal-200/70 px-1.5 py-0.5 rounded shrink-0">
                {activePeak.abundance.toFixed(1)}%
              </span>
            </>
          ) : (
            <p className="text-slate-500 truncate w-full">
              {regime.defaultFootnote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
