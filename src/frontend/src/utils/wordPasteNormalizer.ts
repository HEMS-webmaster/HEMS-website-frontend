import type React from "react";
import { fixMojibakeAndNormalize } from "@/utils/unicodeText";

export interface WordPasteOptions {
  multiline?: boolean;
  maxChars?: number;
  preserveInlineFormatting?: boolean;
  countVisibleOnly?: boolean;
}

export interface WordPasteResult {
  text: string;
  truncatedChars: number;
}

const INLINE_FORMAT_TAG_REGEX = /<\/?(?:b|i|u|sub|sup)>/gi;
const FIGURE_TOKEN_REGEX = /\[FIGURE\]/gi;

export function stripFormattingTags(input: string): string {
  if (!input) return "";
  return input.replace(INLINE_FORMAT_TAG_REGEX, "").replace(FIGURE_TOKEN_REGEX, "");
}

export function countVisibleChars(input: string): number {
  return stripFormattingTags(input).length;
}

export function slicePreservingTags(
  input: string,
  maxVisibleChars: number
): { text: string; truncatedChars: number } {
  if (maxVisibleChars <= 0) {
    return { text: "", truncatedChars: countVisibleChars(input) };
  }

  const totalVisible = countVisibleChars(input);
  if (totalVisible <= maxVisibleChars) {
    return { text: input, truncatedChars: 0 };
  }

  let out = "";
  let visibleCount = 0;
  let i = 0;
  const openStack: string[] = [];

  while (i < input.length && visibleCount < maxVisibleChars) {
    if (input[i] === "[") {
      const figMatch = input.slice(i).match(/^\[FIGURE\]/i);
      if (figMatch) {
        out += "[FIGURE]";
        i += figMatch[0].length;
        continue;
      }
    }

    if (input[i] === "<") {
      const rest = input.slice(i);
      const tagMatch = rest.match(/^<(\/?)(b|i|u|sub|sup)>/i);
      if (tagMatch) {
        const isClosing = tagMatch[1] === "/";
        const tagName = tagMatch[2].toLowerCase();
        out += `<${isClosing ? "/" : ""}${tagName}>`;
        if (!isClosing) {
          openStack.push(tagName);
        } else {
          const lastIdx = openStack.lastIndexOf(tagName);
          if (lastIdx >= 0) openStack.splice(lastIdx, 1);
        }
        i += tagMatch[0].length;
        continue;
      }
    }

    out += input[i];
    visibleCount += 1;
    i += 1;
  }

  while (openStack.length > 0) {
    const tag = openStack.pop();
    if (tag) out += `</${tag}>`;
  }

  return {
    text: out,
    truncatedChars: Math.max(0, totalVisible - maxVisibleChars),
  };
}

const SUPERSCRIPT_MAP: Record<string, string> = {
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

const SUBSCRIPT_MAP: Record<string, string> = {
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

const SYMBOL_FONT_MAP: Record<string, string> = {
  a: "α",
  b: "β",
  c: "χ",
  d: "δ",
  e: "ε",
  f: "φ",
  g: "γ",
  h: "η",
  i: "ι",
  j: "ϕ",
  k: "κ",
  l: "λ",
  m: "μ",
  n: "ν",
  o: "ο",
  p: "π",
  q: "θ",
  r: "ρ",
  s: "σ",
  t: "τ",
  u: "υ",
  v: "ϖ",
  w: "ω",
  x: "ξ",
  y: "ψ",
  z: "ζ",
  A: "Α",
  B: "Β",
  C: "Χ",
  D: "Δ",
  E: "Ε",
  F: "Φ",
  G: "Γ",
  H: "Η",
  I: "Ι",
  J: "ϑ",
  K: "Κ",
  L: "Λ",
  M: "Μ",
  N: "Ν",
  O: "Ο",
  P: "Π",
  Q: "Θ",
  R: "Ρ",
  S: "Σ",
  T: "Τ",
  U: "Υ",
  W: "Ω",
  X: "Ξ",
  Y: "Ψ",
  Z: "Ζ",
  "+": "+",
  "-": "−",
  "*": "∗",
  "=": "=",
  "±": "±",
  "\u00B4": "×",
  "\u00B8": "÷",
  "\u00B0": "°",
  "\u00A3": "≤",
  "\u00B3": "≥",
  "\u00BB": "≈",
  "\u00B9": "≠",
  "\u00A5": "∞",
  "\u00AE": "→",
  "\u00AC": "←",
  "\u00AB": "↔",
  "\u00B6": "∂",
  "\u00D1": "∇",
  "\u00E5": "∑",
  "\u00F2": "∫",
  "\u00D6": "√",
  "\u00B5": "∝",
  "\u00C5": "Å",
  "\u00BC": "…",
};

const MATH_SPECIAL_OVERRIDES: Record<number, string> = {
  0x210e: "h",
  0x1d455: "h",
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
};

const GREEK_UPPER = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
const GREEK_LOWER = "αβγδεζηθικλμνξοπρςστυφχψω";

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
    const lowerStart = blockStart + 26;
    if (cp >= lowerStart && cp < lowerStart + 25) {
      const idx = cp - lowerStart;
      if (idx >= 0 && idx < GREEK_LOWER.length) {
        return GREEK_LOWER[idx];
      }
    }
    if (cp === blockStart + 25) return "∇";
    if (cp === blockStart + 51) return "∂";
  }

  const digitStarts = [0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6];
  for (const dStart of digitStarts) {
    if (cp >= dStart && cp <= dStart + 9) {
      return String(cp - dStart);
    }
  }

  return String.fromCodePoint(cp);
}

export function normalizeMathAlphanumerics(input: string): string {
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

export function toUnicodeSuperscript(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return "";
  let converted = "";
  for (const ch of cleaned) {
    const mapped = SUPERSCRIPT_MAP[ch];
    if (!mapped) {
      return `^{${cleaned}}`;
    }
    converted += mapped;
  }
  return converted;
}

export function toUnicodeSubscript(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return "";
  let converted = "";
  for (const ch of cleaned) {
    const mapped = SUBSCRIPT_MAP[ch];
    if (!mapped) {
      return `_{${cleaned}}`;
    }
    converted += mapped;
  }
  return converted;
}

function mapSymbolFontText(input: string): string {
  let out = "";
  for (const ch of input) {
    out += SYMBOL_FONT_MAP[ch] ?? ch;
  }
  return out;
}

function getLocalTagName(el: Element): string {
  const raw = (el.localName || el.tagName || "").toLowerCase();
  const colonIdx = raw.indexOf(":");
  return colonIdx >= 0 ? raw.slice(colonIdx + 1) : raw;
}

function firstDirectChildByLocalName(el: Element, localName: string): Element | null {
  for (const child of Array.from(el.children)) {
    if (getLocalTagName(child) === localName) return child;
  }
  return null;
}

function directChildrenByLocalName(el: Element, localName: string): Element[] {
  return Array.from(el.children).filter((child) => getLocalTagName(child) === localName);
}

function ommlNodeToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeMathAlphanumerics(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const tag = getLocalTagName(el);

  if (tag === "f") {
    const numEl = firstDirectChildByLocalName(el, "num");
    const denEl = firstDirectChildByLocalName(el, "den");
    const num = numEl ? ommlChildrenToText(numEl).trim() : "";
    const den = denEl ? ommlChildrenToText(denEl).trim() : "";
    return `\\frac{${num}}{${den}}`;
  }

  if (tag === "rad") {
    const degEl = firstDirectChildByLocalName(el, "deg");
    const baseEl = firstDirectChildByLocalName(el, "e");
    const deg = degEl ? ommlChildrenToText(degEl).trim() : "";
    const base = baseEl ? ommlChildrenToText(baseEl).trim() : "";
    return deg ? `^{${deg}}\\sqrt{${base}}` : `\\sqrt{${base}}`;
  }

  if (tag === "ssup") {
    const baseEl = firstDirectChildByLocalName(el, "e");
    const supEl = firstDirectChildByLocalName(el, "sup");
    const base = baseEl ? ommlChildrenToText(baseEl).trim() : "";
    const sup = supEl ? ommlChildrenToText(supEl).trim() : "";
    return `${base}${toUnicodeSuperscript(sup)}`;
  }

  if (tag === "ssub") {
    const baseEl = firstDirectChildByLocalName(el, "e");
    const subEl = firstDirectChildByLocalName(el, "sub");
    const base = baseEl ? ommlChildrenToText(baseEl).trim() : "";
    const sub = subEl ? ommlChildrenToText(subEl).trim() : "";
    return `${base}${toUnicodeSubscript(sub)}`;
  }

  if (tag === "ssubsup") {
    const baseEl = firstDirectChildByLocalName(el, "e");
    const subEl = firstDirectChildByLocalName(el, "sub");
    const supEl = firstDirectChildByLocalName(el, "sup");
    const base = baseEl ? ommlChildrenToText(baseEl).trim() : "";
    const sub = subEl ? ommlChildrenToText(subEl).trim() : "";
    const sup = supEl ? ommlChildrenToText(supEl).trim() : "";
    return `${base}${toUnicodeSubscript(sub)}${toUnicodeSuperscript(sup)}`;
  }

  if (tag === "d") {
    const dPr = firstDirectChildByLocalName(el, "dpr");
    const begChr =
      firstDirectChildByLocalName(dPr || el, "begchr")?.getAttribute("m:val") ||
      firstDirectChildByLocalName(dPr || el, "begchr")?.getAttribute("val") ||
      "(";
    const endChr =
      firstDirectChildByLocalName(dPr || el, "endchr")?.getAttribute("m:val") ||
      firstDirectChildByLocalName(dPr || el, "endchr")?.getAttribute("val") ||
      ")";
    const bases = directChildrenByLocalName(el, "e").map((child) =>
      ommlChildrenToText(child).trim()
    );
    return `${begChr}${bases.join(", ")}${endChr}`;
  }

  if (tag === "nary") {
    const naryPr = firstDirectChildByLocalName(el, "narypr");
    const chrEl = naryPr ? firstDirectChildByLocalName(naryPr, "chr") : null;
    const op =
      chrEl?.getAttribute("m:val") || chrEl?.getAttribute("val") || "∑";
    const subEl = firstDirectChildByLocalName(el, "sub");
    const supEl = firstDirectChildByLocalName(el, "sup");
    const baseEl = firstDirectChildByLocalName(el, "e");
    const sub = subEl ? ommlChildrenToText(subEl).trim() : "";
    const sup = supEl ? ommlChildrenToText(supEl).trim() : "";
    const base = baseEl ? ommlChildrenToText(baseEl).trim() : "";
    return `${op}${sub ? toUnicodeSubscript(sub) : ""}${sup ? toUnicodeSuperscript(sup) : ""
      }${base}`;
  }

  if (tag === "omathpr" || tag === "rpr" || tag === "ctrlpr" || tag === "npr") {
    return "";
  }

  return ommlChildrenToText(el);
}

function ommlChildrenToText(el: Element): string {
  return Array.from(el.childNodes).map(ommlNodeToText).join("");
}

function extractOmmlExpression(fragmentHtml: string): string {
  if (typeof DOMParser === "undefined") return "";
  try {
    const stripped = fragmentHtml
      .replace(/<!\[if\s+!msEquation\]>[\s\S]*?<!\[endif\]>/gi, "")
      .trim();
    if (!stripped) return "";
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      `<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${stripped}</root>`,
      "text/xml"
    );
    const parseError = xmlDoc.querySelector("parsererror");
    if (!parseError && xmlDoc.documentElement) {
      const expr = ommlChildrenToText(xmlDoc.documentElement)
        .replace(/\s+/g, " ")
        .trim();
      if (expr) {
        return expr.includes("\\frac") ||
          expr.includes("\\sqrt") ||
          expr.includes("_{") ||
          expr.includes("^{")
          ? `$${expr}$`
          : expr;
      }
    }
    const htmlDoc = parser.parseFromString(stripped, "text/html");
    return normalizeMathAlphanumerics(htmlDoc.body?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function mathmlNodeToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeMathAlphanumerics(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const tag = getLocalTagName(el);
  const children = Array.from(el.children);

  if (tag === "mfrac" && children.length >= 2) {
    return `\\frac{${mathmlNodeToText(children[0]).trim()}}{${mathmlNodeToText(
      children[1]
    ).trim()}}`;
  }
  if (tag === "msqrt") {
    const inner = Array.from(el.childNodes).map(mathmlNodeToText).join("").trim();
    return `\\sqrt{${inner}}`;
  }
  if (tag === "mroot" && children.length >= 2) {
    return `^{${mathmlNodeToText(children[1]).trim()}}\\sqrt{${mathmlNodeToText(
      children[0]
    ).trim()}}`;
  }
  if (tag === "msup" && children.length >= 2) {
    return `${mathmlNodeToText(children[0]).trim()}${toUnicodeSuperscript(
      mathmlNodeToText(children[1])
    )}`;
  }
  if ((tag === "msub" || tag === "munder") && children.length >= 2) {
    return `${mathmlNodeToText(children[0]).trim()}${toUnicodeSubscript(
      mathmlNodeToText(children[1])
    )}`;
  }
  if ((tag === "msubsup" || tag === "munderover") && children.length >= 3) {
    return `${mathmlNodeToText(children[0]).trim()}${toUnicodeSubscript(
      mathmlNodeToText(children[1])
    )}${toUnicodeSuperscript(mathmlNodeToText(children[2]))}`;
  }

  return Array.from(el.childNodes).map(mathmlNodeToText).join("");
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function preprocessWordHtml(rawHtml: string): { html: string; hadWordEquation: boolean } {
  let hadWordEquation = /msEquation|oMath|clip_image\d+/i.test(rawHtml);

  let processed = rawHtml.replace(
    /<!--\[if\s+gte\s+msEquation[^\]]*\]>([\s\S]*?)<!\[endif\]-->(?:\s*<!\[if\s+!msEquation\]>[\s\S]*?<!\[endif\]>)?/gi,
    (_match, inner: string) => {
      hadWordEquation = true;
      const expr = extractOmmlExpression(inner);
      if (!expr) return "";
      return `<span data-hems-math="1">${escapeHtmlText(expr)}</span>`;
    }
  );

  processed = processed.replace(/<!\[if\s+!msEquation\]>[\s\S]*?<!\[endif\]>/gi, "");

  return { html: processed, hadWordEquation };
}

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "tr",
  "blockquote",
  "section",
  "article",
]);

function wrapInlineTag(text: string, tag: "b" | "i" | "u" | "sub" | "sup"): string {
  if (!text || !text.trim()) return text;
  if (tag === "sub" || tag === "sup") {
    return `<${tag}>${text.trim()}</${tag}>`;
  }
  return `<${tag}>${text}</${tag}>`;
}

function collapseAdjacentFormatTags(text: string): string {
  let prev = "";
  let current = text;
  while (current !== prev) {
    prev = current;
    current = current
      .replace(/<\/b>(\s*)<b>/gi, "$1")
      .replace(/<\/i>(\s*)<i>/gi, "$1")
      .replace(/<\/u>(\s*)<u>/gi, "$1")
      .replace(/<\/sub><sub>/gi, "")
      .replace(/<\/sup><sup>/gi, "");
  }
  return current;
}

function walkHtmlNode(
  node: Node,
  symbolMode = false,
  preserveInlineFormatting = false
): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = (node.textContent || "").replace(/[\r\n\t]+/g, " ");
    const normalized = normalizeMathAlphanumerics(raw);
    return symbolMode ? mapSymbolFontText(normalized) : normalized;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = getLocalTagName(el);

  if (
    tag === "style" ||
    tag === "script" ||
    tag === "meta" ||
    tag === "link" ||
    tag === "title" ||
    tag === "head" ||
    tag === "xml"
  ) {
    return "";
  }

  if (el.getAttribute("data-hems-math") === "1") {
    return normalizeMathAlphanumerics(el.textContent || "");
  }

  if (tag === "math") {
    const mathExpr = mathmlNodeToText(el).replace(/\s+/g, " ").trim();
    if (!mathExpr) return "";
    return mathExpr.includes("\\frac") ||
      mathExpr.includes("\\sqrt") ||
      mathExpr.includes("_{") ||
      mathExpr.includes("^{")
      ? `$${mathExpr}$`
      : mathExpr;
  }

  if (tag === "br") {
    return "\n";
  }

  const styleAttr = (el.getAttribute("style") || "").toLowerCase();
  const isSymbolFont =
    symbolMode || /font-family\s*:[^;]*\b(symbol|wingdings|webdings)\b/i.test(styleAttr);

  let innerText = Array.from(el.childNodes)
    .map((child) => walkHtmlNode(child, isSymbolFont, preserveInlineFormatting))
    .join("");

  if (tag === "sub" || /vertical-align\s*:\s*sub\b/.test(styleAttr)) {
    return preserveInlineFormatting
      ? wrapInlineTag(innerText, "sub")
      : toUnicodeSubscript(innerText);
  }
  if (tag === "sup" || /vertical-align\s*:\s*super\b/.test(styleAttr)) {
    return preserveInlineFormatting
      ? wrapInlineTag(innerText, "sup")
      : toUnicodeSuperscript(innerText);
  }

  const msoRaiseMatch = styleAttr.match(/mso-text-raise\s*:\s*([-+]?[\d.]+)/);
  if (msoRaiseMatch) {
    const val = Number.parseFloat(msoRaiseMatch[1]);
    if (!Number.isNaN(val)) {
      if (val > 0.5) {
        return preserveInlineFormatting
          ? wrapInlineTag(innerText, "sup")
          : toUnicodeSuperscript(innerText);
      }
      if (val < -0.5) {
        return preserveInlineFormatting
          ? wrapInlineTag(innerText, "sub")
          : toUnicodeSubscript(innerText);
      }
    }
  }

  if (preserveInlineFormatting && !BLOCK_TAGS.has(tag)) {
    const isBold =
      tag === "b" ||
      tag === "strong" ||
      /font-weight\s*:\s*(?:bold|[7-9]00)\b/.test(styleAttr);
    const isItalic =
      tag === "i" || tag === "em" || /font-style\s*:\s*italic\b/.test(styleAttr);
    const isUnderline =
      tag === "u" || /text-decoration(?:-line)?\s*:[^;]*\bunderline\b/.test(styleAttr);

    if (isUnderline) innerText = wrapInlineTag(innerText, "u");
    if (isItalic) innerText = wrapInlineTag(innerText, "i");
    if (isBold) innerText = wrapInlineTag(innerText, "b");
  }

  if (tag === "li") {
    const trimmed = innerText.trim();
    return trimmed ? `\n• ${trimmed}\n` : "";
  }

  if (BLOCK_TAGS.has(tag)) {
    const trimmed = innerText.trim();
    return trimmed ? `${trimmed}\n\n` : "";
  }

  return innerText;
}

function unwrapPlainTextParagraphs(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/);
  const unwrapped = paragraphs
    .map((para) => {
      const lines = para
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length <= 1) return lines.join("");

      const mergedLines: string[] = [];
      for (const line of lines) {
        const isListItem = /^(?:•|-|\*|\d+[.)])\s+/.test(line);
        const isFigureMarker = /^\[FIGURE\]$/i.test(line);
        if (
          mergedLines.length === 0 ||
          isListItem ||
          isFigureMarker ||
          /^\[FIGURE\]$/i.test(mergedLines[mergedLines.length - 1])
        ) {
          mergedLines.push(line);
        } else {
          const prev = mergedLines[mergedLines.length - 1];
          if (prev.endsWith("-") && !prev.endsWith(" -") && /^[a-z]/.test(line)) {
            mergedLines[mergedLines.length - 1] = `${prev.slice(0, -1)}${line}`;
          } else {
            mergedLines[mergedLines.length - 1] = `${prev} ${line}`;
          }
        }
      }
      return mergedLines.join("\n");
    })
    .filter(Boolean);

  return unwrapped.join("\n\n");
}

function cleanTypography(raw: string, multiline: boolean, unwrapLines = false): string {
  let cleaned = normalizeMathAlphanumerics(fixMojibakeAndNormalize(raw))
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[\u200B\uFEFF\u00AD]/g, "")
    .replace(/[\uF0B7\uF0A7\uF076\uF0D8]/g, "•");

  if (!multiline) {
    return collapseAdjacentFormatTags(cleaned.replace(/\s+/g, " ").trim());
  }

  if (unwrapLines) {
    cleaned = unwrapPlainTextParagraphs(cleaned);
  }

  cleaned = cleaned
    .replace(/\s*(\[FIGURE\])\s*/gi, "\n\n[FIGURE]\n\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return collapseAdjacentFormatTags(cleaned);
}

export function normalizeWordClipboard(
  plainText: string,
  htmlText: string,
  options: WordPasteOptions = {}
): WordPasteResult {
  const multiline = options.multiline ?? true;
  const preserveInlineFormatting = options.preserveInlineFormatting ?? false;
  const countVisibleOnly = options.countVisibleOnly ?? false;
  const normalizedPlain = cleanTypography(plainText || "", multiline, multiline);

  let chosen = normalizedPlain;
  if (htmlText && htmlText.trim() && typeof DOMParser !== "undefined") {
    try {
      const { html, hadWordEquation } = preprocessWordHtml(htmlText);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const rawWalked = doc.body
        ? walkHtmlNode(doc.body, false, preserveInlineFormatting)
        : "";
      const cleanedHtml = cleanTypography(rawWalked, multiline);

      if (cleanedHtml) {
        if (
          hadWordEquation &&
          normalizedPlain.length > countVisibleChars(cleanedHtml) + 12 &&
          !cleanedHtml.includes("\\frac") &&
          !cleanedHtml.includes("\\sqrt")
        ) {
          chosen = normalizedPlain;
        } else {
          chosen = cleanedHtml;
        }
      }
    } catch {
      chosen = normalizedPlain;
    }
  }

  if (typeof options.maxChars === "number") {
    if (countVisibleOnly) {
      return slicePreservingTags(chosen, options.maxChars);
    }
    if (chosen.length > options.maxChars) {
      return {
        text: chosen.slice(0, options.maxChars),
        truncatedChars: chosen.length - options.maxChars,
      };
    }
  }

  return { text: chosen, truncatedChars: 0 };
}

export function applyWordPasteToField(
  e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  currentValue: string,
  setValue: (nextValue: string) => void,
  options: WordPasteOptions = {},
  onTruncated?: (truncatedChars: number) => void
): void {
  const clipboard = e.clipboardData;
  if (!clipboard) return;

  const plainText = clipboard.getData("text/plain") || "";
  const htmlText = clipboard.getData("text/html") || "";
  if (!plainText && !htmlText) return;

  e.preventDefault();

  const normalized = normalizeWordClipboard(plainText, htmlText, {
    multiline: options.multiline ?? false,
    preserveInlineFormatting: options.preserveInlineFormatting ?? false,
  });

  const target = e.currentTarget;
  const start = target.selectionStart ?? currentValue.length;
  const end = target.selectionEnd ?? currentValue.length;

  const combined =
    currentValue.slice(0, start) + normalized.text + currentValue.slice(end);

  let finalValue = combined;
  let truncatedChars = 0;

  if (typeof options.maxChars === "number") {
    if (options.countVisibleOnly) {
      const sliced = slicePreservingTags(combined, options.maxChars);
      finalValue = sliced.text;
      truncatedChars = sliced.truncatedChars;
    } else if (combined.length > options.maxChars) {
      finalValue = combined.slice(0, options.maxChars);
      truncatedChars = combined.length - options.maxChars;
    }
  }

  setValue(finalValue);
  onTruncated?.(truncatedChars);

  const nextCursor = Math.min(start + normalized.text.length, finalValue.length);
  if (typeof window !== "undefined") {
    window.requestAnimationFrame(() => {
      try {
        target.setSelectionRange(nextCursor, nextCursor);
      } catch {
        // Input types such as email may disallow setSelectionRange
      }
    });
  }
}
