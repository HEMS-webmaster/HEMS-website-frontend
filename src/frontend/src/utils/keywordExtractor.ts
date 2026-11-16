import { ResearchTrack } from "@/types/abstractSubmission";

export interface KeywordExtractionInput {
  title: string;
  synopsis: string;
  abstractText: string;
  researchTrack: ResearchTrack;
}

const STOPWORDS = new Set([
  "a",
  "about",
  "above",
  "achieved",
  "across",
  "after",
  "against",
  "all",
  "along",
  "also",
  "although",
  "among",
  "an",
  "and",
  "another",
  "any",
  "are",
  "around",
  "as",
  "at",
  "based",
  "be",
  "because",
  "been",
  "before",
  "behind",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "could",
  "data",
  "demonstrate",
  "demonstrated",
  "described",
  "developed",
  "during",
  "each",
  "either",
  "enable",
  "enabled",
  "enables",
  "evaluated",
  "example",
  "figure",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "here",
  "high",
  "however",
  "in",
  "include",
  "including",
  "into",
  "is",
  "it",
  "its",
  "low",
  "may",
  "measured",
  "method",
  "methods",
  "more",
  "most",
  "new",
  "no",
  "not",
  "novel",
  "of",
  "on",
  "one",
  "only",
  "or",
  "other",
  "our",
  "over",
  "paper",
  "per",
  "present",
  "presented",
  "provide",
  "reached",
  "reported",
  "required",
  "results",
  "same",
  "several",
  "show",
  "showed",
  "shown",
  "shows",
  "since",
  "some",
  "study",
  "such",
  "system",
  "systems",
  "table",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "throughout",
  "to",
  "toward",
  "towards",
  "two",
  "under",
  "unit",
  "up",
  "use",
  "used",
  "using",
  "various",
  "very",
  "via",
  "was",
  "we",
  "well",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "will",
  "with",
  "within",
  "without",
  "work",
  "workshop",
  "would",
  // Common bare measurement units
  "torr",
  "mpa",
  "kpa",
  "pa",
  "mhz",
  "khz",
  "hz",
  "min",
  "sec",
  "hrs",
  "hr",
  "ppm",
  "ppb",
  "pptv",
  "ev",
  "kev",
  "mm",
  "cm",
  "km",
  "nm",
  "da",
  "fwhm",
]);

const CURATED_HEMS_PHRASES: Array<{ phrase: string; patterns: RegExp[] }> = [
  {
    phrase: "membrane-inlet mass spectrometry",
    patterns: [/membrane[- ]inlet/i, /\bmims\b/i],
  },
  {
    phrase: "quadrupole mass spectrometry",
    patterns: [/quadrupole/i],
  },
  {
    phrase: "cylindrical ion trap",
    patterns: [/cylindrical ion trap/i, /\bcit\b/i],
  },
  {
    phrase: "time-of-flight mass spectrometry",
    patterns: [/time[- ]of[- ]flight/i, /\btof\b/i],
  },
  {
    phrase: "orbitrap mass analyzer",
    patterns: [/orbitrap/i],
  },
  {
    phrase: "hydrothermal plume mapping",
    patterns: [/hydrothermal/i],
  },
  {
    phrase: "dissolved gas profiling",
    patterns: [/dissolved[- ]gas/i, /dissolved gases/i, /dissolved co2/i],
  },
  {
    phrase: "volatile organic compounds",
    patterns: [/volatile organic/i, /\bvocs?\b/i],
  },
  {
    phrase: "autonomous underwater vehicle",
    patterns: [/autonomous underwater/i, /\bauv\b/i],
  },
  {
    phrase: "remotely operated vehicle",
    patterns: [/remotely operated/i, /\brov\b/i],
  },
  {
    phrase: "unmanned aerial vehicle",
    patterns: [/unmanned aerial/i, /\buav\b/i, /\bdrone\b/i],
  },
  {
    phrase: "planetary mass spectrometry",
    patterns: [/planetary/i, /spaceflight/i, /enceladus/i, /europa/i, /titan/i, /mars/i],
  },
  {
    phrase: "thermal desorption",
    patterns: [/thermal desorption/i],
  },
  {
    phrase: "electron ionization",
    patterns: [/electron ionization/i, /electron impact/i],
  },
  {
    phrase: "chemical ionization",
    patterns: [/chemical ionization/i, /proton transfer/i],
  },
  {
    phrase: "impact ionization",
    patterns: [/impact ionization/i, /hypervelocity/i],
  },
  {
    phrase: "turbomolecular vacuum",
    patterns: [/turbomolecular/i, /foreline pressure/i],
  },
  {
    phrase: "miniature mass spectrometer",
    patterns: [/miniature/i, /miniaturized/i, /compact mass/i],
  },
  {
    phrase: "isotope ratio analysis",
    patterns: [/isotope/i, /13c/i, /18o/i],
  },
  {
    phrase: "in-situ geochemistry",
    patterns: [/in[- ]situ/i, /geochem/i, /seafloor/i, /subseafloor/i],
  },
  {
    phrase: "volcanic plume sampling",
    patterns: [/volcanic/i, /fumarole/i],
  },
  {
    phrase: "polar firn air",
    patterns: [/polar firn/i, /cryogen/i, /alpine/i],
  },
  {
    phrase: "reflectron ion optics",
    patterns: [/reflectron/i, /ion optics/i],
  },
  {
    phrase: "spectral deconvolution",
    patterns: [/deconvolution/i, /chemometric/i],
  },
  {
    phrase: "PDMS membrane",
    patterns: [/pdms/i, /polydimethylsiloxane/i],
  },
  {
    phrase: "hydrocarbon monitoring",
    patterns: [/hydrocarbon/i, /alkane/i, /\bbtex\b/i, /\bch4\b/i],
  },
  {
    phrase: "trace gas detection",
    patterns: [/trace[- ]gas/i, /halocarbon/i, /detection limit/i],
  },
  {
    phrase: "high-pressure sampling",
    patterns: [/hydrostatic/i, /high[- ]pressure/i, /deep[- ]ocean/i, /deep[- ]sea/i],
  },
  {
    phrase: "linear ion trap",
    patterns: [/linear ion trap/i, /\blit\b/i],
  },
  {
    phrase: "laser desorption",
    patterns: [/laser[- ]desorption/i, /\bmaldi\b/i, /\bldms\b/i],
  },
];

const TRACK_DEFAULT_KEYWORDS: Record<ResearchTrack, string[]> = {
  "Planetary & Spaceflight MS": [
    "planetary mass spectrometry",
    "spaceflight instrumentation",
    "in-situ biosignature detection",
    "ocean world plumes",
    "reflectron ion optics",
    "impact ionization",
    "vacuum-tolerant analyzer",
    "astrobiology",
  ],
  "Underwater & Marine Biogeochemistry": [
    "subsea mass spectrometry",
    "membrane-inlet mass spectrometry",
    "dissolved gas profiling",
    "hydrothermal plume mapping",
    "deep-ocean sensor",
    "autonomous underwater vehicle",
    "marine biogeochemistry",
    "PDMS membrane",
  ],
  "Atmospheric, Volcanic & Environmental": [
    "trace gas detection",
    "volatile organic compounds",
    "field mass spectrometry",
    "volcanic plume sampling",
    "environmental monitoring",
    "thermal desorption",
    "isotope ratio analysis",
    "portable mass spectrometer",
  ],
  "Miniature & Ruggedized Hardware / Vacuum": [
    "miniature mass spectrometer",
    "ruggedized instrumentation",
    "low-power vacuum system",
    "quadrupole mass filter",
    "ion trap analyzer",
    "harsh-environment sensing",
    "turbomolecular vacuum",
    "field-deployable MS",
  ],
  "Autonomous Platforms (UAV / AUV / ROV) & Security": [
    "autonomous platform integration",
    "unmanned aerial vehicle",
    "autonomous underwater vehicle",
    "real-time plume tracking",
    "hazardous chemical detection",
    "low-SWaP mass spectrometry",
    "remote field sensing",
    "edge telemetry",
  ],
  "Onboard Data Processing & Deconvolution": [
    "spectral deconvolution",
    "onboard data processing",
    "real-time chemometrics",
    "embedded peak fitting",
    "autonomous calibration",
    "mass spectral library matching",
    "noise reduction",
    "edge inference",
  ],
};

function cleanDraftForKeywords(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\[FIGURE\]/gi, " ")
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, "$1")
    .replace(/<sup>([\s\S]*?)<\/sup>/gi, "")
    .replace(/<\/?(?:b|i|u)>/gi, "")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 $2")
    .replace(/\\sqrt\{([^}]*)\}/g, "$1")
    .replace(/\\[A-Za-z]+/g, " ")
    .replace(/\$+/g, " ")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (m) => String("₀₁₂₃₄₅₆₇₈₉".indexOf(m)))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, "")
    .replace(/\u2013|\u2014/g, "-");
}

function normalizePhraseKey(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

function isUsefulWord(word: string): boolean {
  const lower = word.toLowerCase();
  if (lower.length < 3 && !/^[a-z]\d/i.test(lower)) return false;
  if (STOPWORDS.has(lower)) return false;
  if (/^\d+(?:\.\d+)?$/.test(lower)) return false;
  return true;
}

export function extractSuggestedKeywords(
  input: KeywordExtractionInput,
  limit = 8
): string[] {
  const cleanTitle = cleanDraftForKeywords(input.title || "");
  const cleanSynopsis = cleanDraftForKeywords(input.synopsis || "");
  const cleanAbstract = cleanDraftForKeywords(input.abstractText || "");

  const scores = new Map<string, { display: string; score: number }>();

  const addScore = (phrase: string, delta: number) => {
    const trimmed = phrase.trim().replace(/^[-–—]+|[-–—]+$/g, "");
    if (!trimmed || trimmed.length < 3 || trimmed.length > 42) return;
    const key = normalizePhraseKey(trimmed);
    const prev = scores.get(key);
    if (prev) {
      prev.score += delta;
    } else {
      scores.set(key, { display: trimmed, score: delta });
    }
  };

  // 1. Score curated HEMS domain phrases across weighted fields
  const weightedFields: Array<{ text: string; weight: number }> = [
    { text: cleanTitle, weight: 6 },
    { text: cleanSynopsis, weight: 4 },
    { text: cleanAbstract, weight: 2 },
  ];

  for (const entry of CURATED_HEMS_PHRASES) {
    let totalWeight = 0;
    for (const field of weightedFields) {
      if (!field.text) continue;
      if (entry.patterns.some((re) => re.test(field.text))) {
        totalWeight += field.weight;
      }
    }
    if (totalWeight > 0) {
      addScore(entry.phrase, totalWeight + 4);
    }
  }

  // 2. Extract dynamic 2-word & 3-word technical phrases + domain acronyms from clauses
  for (const field of weightedFields) {
    if (!field.text) continue;
    const clauses = field.text.split(/[,.;:!?()[\]{}"'/\n]+/);
    for (const clause of clauses) {
      const tokens = clause
        .trim()
        .split(/\s+/)
        .map((t) => t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9-]+$/g, ""))
        .filter(Boolean);

      for (let i = 0; i < tokens.length; i++) {
        const w1 = tokens[i];
        // Uppercase acronyms or chemical formulas (e.g., BTEX, PDMS, AUV, MIMS, CH4, CO2, H2S)
        if (
          /^(?:[A-Z]{3,6}(?:-[A-Z]{2,4})?|(?:[A-Z][a-z]?\d+){1,3})$/.test(w1) &&
          !STOPWORDS.has(w1.toLowerCase())
        ) {
          addScore(w1, field.weight + 2);
        }

        if (!isUsefulWord(w1)) continue;

        const w2 = tokens[i + 1];
        if (w2 && isUsefulWord(w2)) {
          const phrase2 = `${w1.toLowerCase()} ${w2.toLowerCase()}`;
          addScore(phrase2, field.weight * 1.5);

          const w3 = tokens[i + 2];
          if (w3 && isUsefulWord(w3)) {
            const phrase3 = `${phrase2} ${w3.toLowerCase()}`;
            addScore(phrase3, field.weight * 1.25);
          }
        }
      }
    }
  }

  // Rank candidates and prune redundant shorter substrings if higher-scoring phrase exists
  const ranked = Array.from(scores.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.display.length - a.display.length;
  });

  const selected: string[] = [];
  for (const item of ranked) {
    if (selected.length >= limit) break;
    const key = normalizePhraseKey(item.display);
    const alreadyCovered = selected.some((existing) => {
      const exKey = normalizePhraseKey(existing);
      return exKey === key || exKey.includes(key) || key.includes(exKey);
    });
    if (!alreadyCovered) {
      selected.push(item.display);
    }
  }

  // 3. Backfill to 8 with track-specific suggestions when user text is brief
  const trackFallbacks = TRACK_DEFAULT_KEYWORDS[input.researchTrack] || [];
  for (const fallback of trackFallbacks) {
    if (selected.length >= limit) break;
    const key = normalizePhraseKey(fallback);
    if (!selected.some((s) => normalizePhraseKey(s) === key)) {
      selected.push(fallback);
    }
  }

  return selected.slice(0, limit);
}

