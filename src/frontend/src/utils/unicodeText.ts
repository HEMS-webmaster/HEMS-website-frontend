/**
 * Shared Unicode, Mojibake Repair, Smart CSV Decoding & Scientific Character Utilities.
 * Zero runtime dependencies: runs identically in Browser, Node.js scripts, and Next.js API routes.
 */

const CP1252_EXTRA_CHAR_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201e: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02c6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8a, // Š
  0x2039: 0x8b, // ‹
  0x0152: 0x8c, // Œ
  0x017d: 0x8e, // Ž
  0x2018: 0x91, // ‘
  0x2019: 0x92, // ’
  0x201c: 0x93, // “
  0x201d: 0x94, // ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02dc: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9a, // š
  0x203a: 0x9b, // ›
  0x0153: 0x9c, // œ
  0x017e: 0x9e, // ž
  0x0178: 0x9f, // Ÿ
};

function charToCp1252Byte(ch: string): number {
  if (!ch) return -1;
  const cp = ch.codePointAt(0);
  if (cp === undefined) return -1;
  if (cp >= 0x00 && cp <= 0xff) {
    // Bytes 0x81, 0x8D, 0x8F, 0x90, 0x9D are undefined in Windows-1252 but map 1:1 in Latin-1
    return cp;
  }
  return CP1252_EXTRA_CHAR_TO_BYTE[cp] ?? -1;
}

function isUtf8ContByte(byte: number): boolean {
  return byte >= 0x80 && byte <= 0xbf;
}

const utf8FatalDecoder = new TextDecoder("utf-8", { fatal: true });
const utf8LenientDecoder = new TextDecoder("utf-8", { fatal: false });
const win1252Decoder = new TextDecoder("windows-1252");

const SUPER_SUB_FOLD_MAP: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "₊": "+",
  "₋": "-",
};

const MATH_SPECIAL_OVERRIDES: Record<number, string> = {
  0x210e: "h",
  0x212c: "B",
  0x2130: "E",
  0x2131: "F",
  0x210b: "H",
  0x2110: "I",
  0x2112: "L",
  0x2133: "M",
  0x211b: "R",
  0x212f: "e",
  0x210a: "g",
  0x2134: "o",
  0x2102: "C",
  0x210d: "H",
  0x2115: "N",
  0x2119: "P",
  0x211a: "Q",
  0x211d: "R",
  0x2124: "Z",
  0x2126: "Ω",
  0x212b: "Å",
  0x00b5: "µ",
};

const GREEK_UPPER = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
const GREEK_LOWER = "αβγδεζηθικλμνξοπρςστυφχψω";
const GREEK_VARIANT_SYMBOLS = ["ε", "θ", "κ", "φ", "ρ", "π"];

function mapMathCodePoint(cp: number): string {
  const override = MATH_SPECIAL_OVERRIDES[cp];
  if (override) return override;

  const latinRanges: Array<[number, number, number]> = [
    [0x1d400, 0x1d419, 65],
    [0x1d41a, 0x1d433, 97],
    [0x1d434, 0x1d44d, 65],
    [0x1d44e, 0x1d467, 97],
    [0x1d468, 0x1d481, 65],
    [0x1d482, 0x1d49b, 97],
    [0x1d49c, 0x1d4b5, 65],
    [0x1d4b6, 0x1d4cf, 97],
    [0x1d4d0, 0x1d4e9, 65],
    [0x1d4ea, 0x1d503, 97],
    [0x1d504, 0x1d51d, 65],
    [0x1d51e, 0x1d537, 97],
    [0x1d538, 0x1d551, 65],
    [0x1d552, 0x1d56b, 97],
    [0x1d56c, 0x1d585, 65],
    [0x1d586, 0x1d59f, 97],
    [0x1d5a0, 0x1d5b9, 65],
    [0x1d5ba, 0x1d5d3, 97],
    [0x1d5d4, 0x1d5ed, 65],
    [0x1d5ee, 0x1d607, 97],
    [0x1d608, 0x1d621, 65],
    [0x1d622, 0x1d63b, 97],
    [0x1d63c, 0x1d655, 65],
    [0x1d656, 0x1d66f, 97],
    [0x1d670, 0x1d689, 65],
    [0x1d68a, 0x1d6a3, 97],
  ];

  for (const [start, end, baseCharCode] of latinRanges) {
    if (cp >= start && cp <= end) {
      return String.fromCharCode(baseCharCode + (cp - start));
    }
  }

  const greekStarts = [0x1d6a8, 0x1d6e2, 0x1d71c, 0x1d756, 0x1d790];
  for (const blockStart of greekStarts) {
    if (cp >= blockStart && cp < blockStart + 25) {
      const idx = cp - blockStart;
      if (idx === 17) return "Θ";
      const mappedIdx = idx > 17 ? idx - 1 : idx;
      if (mappedIdx >= 0 && mappedIdx < GREEK_UPPER.length) {
        return GREEK_UPPER[mappedIdx];
      }
    }
    if (cp === blockStart + 25) return "∇";
    const lowerStart = blockStart + 26;
    if (cp >= lowerStart && cp < lowerStart + 25) {
      const idx = cp - lowerStart;
      if (idx >= 0 && idx < GREEK_LOWER.length) {
        return GREEK_LOWER[idx];
      }
    }
    if (cp === blockStart + 51) return "∂";
    if (cp >= blockStart + 52 && cp <= blockStart + 57) {
      return GREEK_VARIANT_SYMBOLS[cp - (blockStart + 52)];
    }
  }

  const digitStarts = [0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6];
  for (const dStart of digitStarts) {
    if (cp >= dStart && cp <= dStart + 9) {
      return String(cp - dStart);
    }
  }

  return String.fromCodePoint(cp);
}

/**
 * Converts Unicode Mathematical Alphanumeric Symbols (U+1D400..U+1D7FF) and letter-like math
 * scalars into standard searchable/printable Latin, Greek, and digit characters.
 */
export function normalizeMathAlphanumerics(input: string): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if ((cp >= 0x1d400 && cp <= 0x1d7ff) || MATH_SPECIAL_OVERRIDES[cp]) {
      out += mapMathCodePoint(cp);
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Decodes exact UTF-8 byte sequences that were mistakenly interpreted as Windows-1252 / Latin-1
 * (e.g., "Î´" -> "δ", "FrÃ©dÃ©ric" -> "Frédéric", "FRÃœH" -> "FRÜH", "â€“" -> "–").
 * Guards against scientific trademark/unit combinations such as "Å²" or "É®".
 */
function repairUtf8MojibakeSinglePass(input: string): string {
  const chars = Array.from(input);
  let out = "";
  let changed = false;
  let i = 0;

  while (i < chars.length) {
    const b0 = charToCp1252Byte(chars[i]);

    // Guard against real scientific units like "Å²", "Å³", or uppercase brand marks like "É®" / "Ö™"
    const isScientificallySensitivePair = (leadByte: number, contByte: number): boolean => {
      if (leadByte === 0xc5 && (contByte === 0xb2 || contByte === 0xb3 || contByte === 0xb0)) {
        return true; // Å², Å³, Å°
      }
      if (
        (leadByte === 0xc9 || leadByte === 0xd6 || leadByte === 0xdc) &&
        (contByte === 0xae || contByte === 0x99 || contByte === 0xa9)
      ) {
        return true; // É®, É™, Ö®, Ö™, Ü®, Ü© brand marks
      }
      return false;
    };

    // 4-byte UTF-8 sequence (emojis, supplementary symbols): F0..F4 + 3 cont bytes
    if (b0 >= 0xf0 && b0 <= 0xf4 && i + 3 < chars.length) {
      const b1 = charToCp1252Byte(chars[i + 1]);
      const b2 = charToCp1252Byte(chars[i + 2]);
      const b3 = charToCp1252Byte(chars[i + 3]);
      if (isUtf8ContByte(b1) && isUtf8ContByte(b2) && isUtf8ContByte(b3)) {
        try {
          const decoded = utf8FatalDecoder.decode(new Uint8Array([b0, b1, b2, b3]));
          out += decoded;
          i += 4;
          changed = true;
          continue;
        } catch {
          // fall through
        }
      }
    }

    // 3-byte UTF-8 sequence (punctuation, arrows, super/subscripts, math operators): E0..EF + 2 cont bytes
    if (b0 >= 0xe0 && b0 <= 0xef && i + 2 < chars.length) {
      const b1 = charToCp1252Byte(chars[i + 1]);
      const b2 = charToCp1252Byte(chars[i + 2]);
      if (isUtf8ContByte(b1) && isUtf8ContByte(b2)) {
        try {
          const decoded = utf8FatalDecoder.decode(new Uint8Array([b0, b1, b2]));
          out += decoded;
          i += 3;
          changed = true;
          continue;
        } catch {
          // fall through
        }
      }
    }

    // 2-byte UTF-8 sequence (Latin-1, Latin-Ext, Greek, Cyrillic): C2..DF + 1 cont byte
    if (b0 >= 0xc2 && b0 <= 0xdf && i + 1 < chars.length) {
      const b1 = charToCp1252Byte(chars[i + 1]);
      if (isUtf8ContByte(b1) && !isScientificallySensitivePair(b0, b1)) {
        try {
          const decoded = utf8FatalDecoder.decode(new Uint8Array([b0, b1]));
          out += decoded;
          i += 2;
          changed = true;
          continue;
        } catch {
          // fall through
        }
      }
    }

    out += chars[i];
    i += 1;
  }

  return changed ? out : input;
}

/**
 * Repairs single-, double-, and triple-encoded UTF-8-as-Windows-1252 mojibake, replaces
 * Private Use Area Wingdings/Symbol bullets with standard Unicode bullets, normalizes
 * Mathematical Alphanumeric Scalars, and enforces Unicode NFC composition.
 */
export function fixMojibakeAndNormalize(input: string): string {
  if (!input) return "";

  let current = input.replace(/^\uFEFF/, "");

  // Up to 3 passes handle double/triple encoded strings such as "HÃƒÂ¶hn" -> "HÃ¶hn" -> "Höhn"
  for (let pass = 0; pass < 3; pass++) {
    const next = repairUtf8MojibakeSinglePass(current);
    if (next === current) break;
    current = next;
  }

  current = current
    .replace(/[\uF0B7\uF0A7\uF076\uF0D8\uF0A8]/g, "•")
    .replace(/\u200B/g, "");

  current = normalizeMathAlphanumerics(current);

  return typeof current.normalize === "function" ? current.normalize("NFC") : current;
}

/**
 * Recursively applies `fixMojibakeAndNormalize` to every string property in an array/object tree
 * without altering keys, booleans, numbers, or nulls.
 */
export function sanitizeDeepUnicode<T>(value: T): T {
  if (typeof value === "string") {
    return fixMojibakeAndNormalize(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeepUnicode(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeepUnicode(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Folds Unicode superscript and subscript numerals/signs to ASCII for tolerant archive search matching
 * (so searching "d13C" or "CO2" matches "δ¹³C" and "CO₂").
 */
export function foldSuperSubscriptsToAscii(input: string): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    out += SUPER_SUB_FOLD_MAP[ch] ?? ch;
  }
  return out;
}

/**
 * Decodes uploaded CSV or text bytes safely:
 * 1. Honors UTF-8 / UTF-16 BOMs if present,
 * 2. Attempts strict UTF-8 decoding (`fatal: true`),
 * 3. Falls back cleanly to Windows-1252 when users upload legacy Microsoft Excel CSV exports,
 * 4. Runs `fixMojibakeAndNormalize` so accents, Greek letters, and symbols survive intact.
 */
export function decodeTextBufferSmart(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length === 0) return "";

  // UTF-16LE BOM (FF FE)
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    const decoded = new TextDecoder("utf-16le").decode(bytes.subarray(2));
    return fixMojibakeAndNormalize(decoded);
  }
  // UTF-16BE BOM (FE FF)
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const decoded = new TextDecoder("utf-16be").decode(bytes.subarray(2));
    return fixMojibakeAndNormalize(decoded);
  }

  // Strip UTF-8 BOM (EF BB BF) if present
  const payload =
    bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
      ? bytes.subarray(3)
      : bytes;

  try {
    const strictUtf8 = utf8FatalDecoder.decode(payload);
    return fixMojibakeAndNormalize(strictUtf8);
  } catch {
    try {
      const cp1252 = win1252Decoder.decode(payload);
      return fixMojibakeAndNormalize(cp1252);
    } catch {
      return fixMojibakeAndNormalize(utf8LenientDecoder.decode(payload));
    }
  }
}

/**
 * Browser helper to read an uploaded File/Blob with automatic UTF-8 vs. Windows-1252 Excel CSV detection.
 */
export async function readUploadedTextFileSmart(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return decodeTextBufferSmart(buffer);
}

const PLAIN_SUP_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "−": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
};

const PLAIN_SUB_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "−": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
};

const PLAIN_TEX_SYMBOLS: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  micro: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "ϕ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
  ohm: "Ω",
  pm: "±",
  mp: "∓",
  times: "×",
  cdot: "·",
  bullet: "•",
  div: "÷",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  approx: "≈",
  sim: "∼",
  simeq: "≃",
  ll: "≪",
  gg: "≫",
  neq: "≠",
  ne: "≠",
  equiv: "≡",
  propto: "∝",
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  sum: "∑",
  int: "∫",
  rightarrow: "→",
  to: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  rightleftharpoons: "⇌",
  degree: "°",
  permil: "‰",
  perthousand: "‰",
  minus: "−",
  AA: "Å",
};

const BINARY_OP_TEX_CMDS = new Set([
  "pm", "mp", "times", "cdot", "div", "leq", "le", "geq", "ge",
  "approx", "sim", "simeq", "ll", "gg", "neq", "ne", "equiv", "propto",
  "rightarrow", "to", "leftarrow", "leftrightarrow", "rightleftharpoons", "minus",
]);

const LATIN_DIACRITIC_SPECIALS: Record<string, string> = {
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  ß: "ss",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  đ: "d",
  Đ: "D",
  ð: "d",
  Ð: "D",
  þ: "th",
  Þ: "TH",
  ı: "i",
};

function convertSupChars(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return "";
  let out = "";
  for (const ch of cleaned) {
    const mapped = PLAIN_SUP_MAP[ch];
    if (!mapped) return `^(${cleaned})`;
    out += mapped;
  }
  return out;
}

function convertSubChars(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return "";
  let out = "";
  for (const ch of cleaned) {
    const mapped = PLAIN_SUB_MAP[ch];
    if (!mapped) return cleaned.length === 1 ? `_${cleaned}` : `_(${cleaned})`;
    out += mapped;
  }
  return out;
}

function readBracedSpan(src: string, start: number): { content: string; end: number } | null {
  if (src[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) {
        return { content: src.slice(start + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function renderTexMathSegmentPlain(expr: string, insideMathDelimiter: boolean): string {
  let out = "";
  let i = 0;

  while (i < expr.length) {
    if (expr.startsWith("\\frac", i)) {
      const num = readBracedSpan(expr, i + 5);
      if (num) {
        const den = readBracedSpan(expr, num.end);
        if (den) {
          const nStr = renderTexMathSegmentPlain(num.content, true).trim();
          const dStr = renderTexMathSegmentPlain(den.content, true).trim();
          const wrapN = /[\s+\-*/=]/.test(nStr) ? `(${nStr})` : nStr;
          const wrapD = /[\s+\-*/=]/.test(dStr) ? `(${dStr})` : dStr;
          out += `${wrapN}/${wrapD}`;
          i = den.end;
          continue;
        }
      }
    }

    if (expr.startsWith("\\sqrt", i)) {
      const arg = readBracedSpan(expr, i + 5);
      if (arg) {
        const inner = renderTexMathSegmentPlain(arg.content, true).trim();
        out += /[\s+\-*/=]/.test(inner) ? `√(${inner})` : `√${inner}`;
        i = arg.end;
        continue;
      }
    }

    const wrapperCmd = expr
      .slice(i)
      .match(/^\\(text|mathrm|textit|mathbf|mathit|boldsymbol)\{/);
    if (wrapperCmd) {
      const arg = readBracedSpan(expr, i + 1 + wrapperCmd[1].length);
      if (arg) {
        out += renderTexMathSegmentPlain(arg.content, true);
        i = arg.end;
        continue;
      }
    }

    if (expr.startsWith("^{", i)) {
      const sup = readBracedSpan(expr, i + 1);
      if (sup) {
        out += convertSupChars(renderTexMathSegmentPlain(sup.content, insideMathDelimiter));
        i = sup.end;
        continue;
      }
    }

    if (expr.startsWith("_{", i)) {
      const sub = readBracedSpan(expr, i + 1);
      if (sub) {
        out += convertSubChars(renderTexMathSegmentPlain(sub.content, insideMathDelimiter));
        i = sub.end;
        continue;
      }
    }

    if (insideMathDelimiter && (expr[i] === "^" || expr[i] === "_") && i + 1 < expr.length) {
      const isSup = expr[i] === "^";
      if (expr[i + 1] === "\\") {
        const symMatch = expr.slice(i + 2).match(/^[A-Za-z]+/);
        if (symMatch) {
          const sym = PLAIN_TEX_SYMBOLS[symMatch[0]] ?? symMatch[0];
          out += isSup ? convertSupChars(sym) : convertSubChars(sym);
          i += 2 + symMatch[0].length;
          continue;
        }
      }
      if (/^[A-Za-z0-9+\-]$/.test(expr[i + 1])) {
        out += isSup ? convertSupChars(expr[i + 1]) : convertSubChars(expr[i + 1]);
        i += 2;
        continue;
      }
    }

    if (expr[i] === "\\") {
      const cmdMatch = expr.slice(i + 1).match(/^[A-Za-z]+/);
      if (cmdMatch) {
        const cmd = cmdMatch[0];
        const sym = PLAIN_TEX_SYMBOLS[cmd];
        if (sym) {
          if (BINARY_OP_TEX_CMDS.has(cmd) && out.length > 0 && !/\s$/.test(out)) {
            out += " ";
          }
          out += sym;
          i += 1 + cmd.length;
          if (expr[i] === " " && !BINARY_OP_TEX_CMDS.has(cmd)) i += 1;
          continue;
        }
      }
    }

    out += expr[i];
    i += 1;
  }

  return out;
}

/**
 * Returns true when a title, abstract, or caption contains inline scientific formatting tags
 * (`<b>`, `<i>`, `<u>`, `<sub>`, `<sup>`), TeX math (`$...$`, `\(...\)`, `\frac`, `\sqrt`), or `[FIGURE]`.
 */
export function hasRichScientificMarkup(input: string): boolean {
  if (!input) return false;
  return (
    /<\/?(?:b|i|u|sub|sup)>/i.test(input) ||
    /(?:^|[^0-9\\])\$[^\s$][^$\n]*?[^\s$\\]\$|\\\([^)\n]+?\\\)/.test(input) ||
    /\\(?:frac|sqrt|text|mathrm|textit|mathbf)\{/.test(input) ||
    /(?:\^|_)\{[^}]+\}/.test(input) ||
    /\[FIGURE\]/i.test(input)
  );
}

/**
 * Folds European/Scandinavian/Latin diacritics to base ASCII letters for cite keys,
 * search matching, and ASCII proceeding filenames (preserving character readability).
 */
export function foldLatinDiacriticsToAscii(input: string): string {
  if (!input) return "";
  let replaced = "";
  for (const ch of input) {
    replaced += LATIN_DIACRITIC_SPECIALS[ch] ?? ch;
  }
  return replaced.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Converts rich scientific strings containing HTML inline formatting (`<i>m/z</i>`, `CO<sub>2</sub>`,
 * `10<sup>-6</sup>`) and TeX/Word math (`$q_z = \frac{4eV}{m r_0^2 \Omega^2}$`) into clean,
 * readable Unicode plain text for APA citations, Schema.org JSON-LD, PDF exports, and metadata.
 */
export function toPlainScientificText(input: string): string {
  if (!input) return "";
  let text = fixMojibakeAndNormalize(input).replace(/\[FIGURE\]/gi, " ");

  text = text
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, (_m, inner: string) =>
      convertSubChars(toPlainScientificText(inner))
    )
    .replace(/<sup>([\s\S]*?)<\/sup>/gi, (_m, inner: string) =>
      convertSupChars(toPlainScientificText(inner))
    )
    .replace(/<\/?(?:b|i|u)>/gi, "");

  text = text.replace(/(\$[^$\n]+?\$|\\\([^)\n]+?\\\))/g, (_m, token: string) => {
    const inner = token.startsWith("$") ? token.slice(1, -1) : token.slice(2, -2);
    if (token.startsWith("$") && (inner.endsWith(" ") || (/^\d/.test(inner) && !/[\\^_{}=+\-*/]/.test(inner)))) {
      return token; // Preserve currency prose like "$500 and $250"
    }
    return renderTexMathSegmentPlain(inner, true);
  });

  text = renderTexMathSegmentPlain(text, false);

  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

/**
 * Formats rich HTML/Word scientific titles cleanly for BibTeX entries (`\textit{...}`, `$_{...}$`, `$^{...}$`),
 * keeping existing `$...$` LaTeX math blocks intact.
 */
export function toBibTeXScientificText(input: string): string {
  if (!input) return "";
  let text = fixMojibakeAndNormalize(input).replace(/\[FIGURE\]/gi, " ");
  text = text
    .replace(/<i>([\s\S]*?)<\/i>/gi, "\\textit{$1}")
    .replace(/<b>([\s\S]*?)<\/b>/gi, "\\textbf{$1}")
    .replace(/<u>([\s\S]*?)<\/u>/gi, "\\underline{$1}")
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, "$_{$1}$")
    .replace(/<sup>([\s\S]*?)<\/sup>/gi, "$^{$1}$");
  return text.replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * Generates an ASCII-safe presenter surname slug for archive filenames (`"Malte Höhn"` -> `"Hohn"`).
 */
export function buildSafePresenterLastNameSlug(
  rawAuthorName: string,
  fallback = "Author"
): string {
  const plain = toPlainScientificText(rawAuthorName || "");
  const namePart = plain.split(",")[0].trim();
  const words = namePart.split(/\s+/).filter(Boolean);
  const rawLast = words.length > 0 ? words[words.length - 1] : "";
  const asciiLast = foldLatinDiacriticsToAscii(rawLast).replace(/[^a-zA-Z0-9]/g, "");
  return asciiLast || fallback;
}

/**
 * Generates an ASCII-safe multi-word proceeding title slug (e.g. `"<i>In-situ</i> Measurements of δ<sup>13</sup>C..."`
 * -> `"Insitu_Measurements_of"`), matching legacy GCS/local proceeding naming without mangling HTML tags or accents.
 */
export function buildSafeProceedingSlugWords(
  rawTitle: string,
  maxWords = 3,
  fallback = "Talk"
): string {
  if (!rawTitle) return fallback;
  let cleaned = fixMojibakeAndNormalize(rawTitle)
    .replace(/\[FIGURE\]/gi, " ")
    .replace(/<\/?(?:b|i|u|sub|sup)>/gi, "")
    .replace(/\\(?:frac|sqrt|text|mathrm|textit|mathbf|mathit|boldsymbol)\b/g, " ")
    .replace(/\\[A-Za-z]+/g, " ")
    .replace(/[$^{}()]/g, " ");

  cleaned = foldLatinDiacriticsToAscii(foldSuperSubscriptsToAscii(cleaned));
  const words = cleaned
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length > 0 ? words.slice(0, maxWords).join("_") : fallback;
}

/**
 * Produces a normalized, accent-folded, super/subscript-folded, markup-free lowercase string
 * for tolerant scientific archive search (`CO₂` / `CO<sub>2</sub>` -> `co2`, `Malte Höhn` -> `malte hohn`).
 */
export function normalizeForArchiveSearch(input: string): string {
  if (!input) return "";
  const plain = toPlainScientificText(input);
  return foldLatinDiacriticsToAscii(foldSuperSubscriptsToAscii(plain))
    .replace(/[μµ]/g, "u")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

