"use client";

import React from "react";

interface ScientificTextProps {
  text: string;
  multiline?: boolean;
  className?: string;
}

const TEX_SYMBOLS: Record<string, string> = {
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
  pm: "±",
  mp: "∓",
  times: "×",
  cdot: "·",
  div: "÷",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  approx: "≈",
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
  AA: "Å",
};

function readBracedGroup(
  src: string,
  startIndex: number
): { content: string; endIndex: number } | null {
  if (src[startIndex] !== "{") return null;
  let depth = 0;
  for (let i = startIndex; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return {
          content: src.slice(startIndex + 1, i),
          endIndex: i + 1,
        };
      }
    }
  }
  return null;
}

function renderInlineMathTokens(expr: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let textBuf = "";
  let tokenIdx = 0;

  const flushBuf = () => {
    if (textBuf) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-t-${tokenIdx++}`}>
          {textBuf}
        </React.Fragment>
      );
      textBuf = "";
    }
  };

  while (i < expr.length) {
    if (expr.startsWith("\\frac", i)) {
      const numGroup = readBracedGroup(expr, i + 5);
      if (numGroup) {
        const denGroup = readBracedGroup(expr, numGroup.endIndex);
        if (denGroup) {
          flushBuf();
          nodes.push(
            <span key={`${keyPrefix}-f-${tokenIdx++}`} className="sci-frac">
              <span className="sci-frac-num">
                {renderInlineMathTokens(numGroup.content, `${keyPrefix}-fn-${tokenIdx}`)}
              </span>
              <span className="sci-frac-den">
                {renderInlineMathTokens(denGroup.content, `${keyPrefix}-fd-${tokenIdx}`)}
              </span>
            </span>
          );
          i = denGroup.endIndex;
          continue;
        }
      }
    }

    if (expr.startsWith("\\sqrt", i)) {
      const argGroup = readBracedGroup(expr, i + 5);
      if (argGroup) {
        flushBuf();
        nodes.push(
          <span key={`${keyPrefix}-r-${tokenIdx++}`} className="sci-sqrt">
            <span aria-hidden="true">√</span>
            <span className="sci-sqrt-body">
              {renderInlineMathTokens(argGroup.content, `${keyPrefix}-rb-${tokenIdx}`)}
            </span>
          </span>
        );
        i = argGroup.endIndex;
        continue;
      }
    }

    if (expr.startsWith("^{", i)) {
      const supGroup = readBracedGroup(expr, i + 1);
      if (supGroup) {
        flushBuf();
        nodes.push(
          <sup key={`${keyPrefix}-sup-${tokenIdx++}`} className="text-[0.75em] leading-none">
            {renderInlineMathTokens(supGroup.content, `${keyPrefix}-sp-${tokenIdx}`)}
          </sup>
        );
        i = supGroup.endIndex;
        continue;
      }
    }

    if (expr.startsWith("_{", i)) {
      const subGroup = readBracedGroup(expr, i + 1);
      if (subGroup) {
        flushBuf();
        nodes.push(
          <sub key={`${keyPrefix}-sub-${tokenIdx++}`} className="text-[0.75em] leading-none">
            {renderInlineMathTokens(subGroup.content, `${keyPrefix}-sb-${tokenIdx}`)}
          </sub>
        );
        i = subGroup.endIndex;
        continue;
      }
    }

    if (expr[i] === "\\") {
      const match = expr.slice(i + 1).match(/^[A-Za-z]+/);
      if (match) {
        const cmd = match[0];
        const sym = TEX_SYMBOLS[cmd];
        if (sym) {
          textBuf += sym;
          i += 1 + cmd.length;
          if (expr[i] === " ") i += 1;
          continue;
        }
      }
    }

    textBuf += expr[i];
    i += 1;
  }

  flushBuf();
  return nodes;
}

function renderMixedMathSegment(segment: string, segKey: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const delimiterRegex = /(\$[^$\n]+?\$|\\\([^)\n]+?\\\))/g;
  let lastIdx = 0;
  let segIdx = 0;
  let match: RegExpExecArray | null = delimiterRegex.exec(segment);

  while (match !== null) {
    if (match.index > lastIdx) {
      const plainSeg = segment.slice(lastIdx, match.index);
      parts.push(
        <React.Fragment key={`${segKey}-p-${segIdx++}`}>
          {renderInlineMathTokens(plainSeg, `${segKey}-pt-${segIdx}`)}
        </React.Fragment>
      );
    }

    const token = match[0];
    const inner = token.startsWith("$")
      ? token.slice(1, -1)
      : token.slice(2, -2);
    parts.push(
      <span key={`${segKey}-m-${segIdx++}`} className="sci-math">
        {renderInlineMathTokens(inner, `${segKey}-mt-${segIdx}`)}
      </span>
    );

    lastIdx = delimiterRegex.lastIndex;
    match = delimiterRegex.exec(segment);
  }

  if (lastIdx < segment.length) {
    parts.push(
      <React.Fragment key={`${segKey}-tail-${segIdx++}`}>
        {renderInlineMathTokens(segment.slice(lastIdx), `${segKey}-tt-${segIdx}`)}
      </React.Fragment>
    );
  }

  return parts;
}

type FormatTag = "b" | "i" | "u" | "sub" | "sup";

function findMatchingClosingTag(
  src: string,
  searchFrom: number,
  tagName: FormatTag
): { innerEnd: number; afterClose: number } | null {
  const openToken = `<${tagName}>`;
  const closeToken = `</${tagName}>`;
  const lower = src.toLowerCase();
  let depth = 1;
  let cursor = searchFrom;

  while (cursor < lower.length) {
    const nextOpen = lower.indexOf(openToken, cursor);
    const nextClose = lower.indexOf(closeToken, cursor);
    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + openToken.length;
    } else {
      depth -= 1;
      if (depth === 0) {
        return {
          innerEnd: nextClose,
          afterClose: nextClose + closeToken.length,
        };
      }
      cursor = nextClose + closeToken.length;
    }
  }
  return null;
}

function renderFormattedAndMath(line: string, lineKey: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let plainBuf = "";
  let chunkIdx = 0;

  const flushPlain = () => {
    if (plainBuf) {
      nodes.push(
        <React.Fragment key={`${lineKey}-s-${chunkIdx++}`}>
          {renderMixedMathSegment(plainBuf, `${lineKey}-sm-${chunkIdx}`)}
        </React.Fragment>
      );
      plainBuf = "";
    }
  };

  while (i < line.length) {
    if (line[i] === "<") {
      const openMatch = line.slice(i).match(/^<(b|i|u|sub|sup)>/i);
      if (openMatch) {
        const tag = openMatch[1].toLowerCase() as FormatTag;
        const innerStart = i + openMatch[0].length;
        const closeInfo = findMatchingClosingTag(line, innerStart, tag);
        if (closeInfo) {
          flushPlain();
          const innerContent = line.slice(innerStart, closeInfo.innerEnd);
          const children = renderFormattedAndMath(
            innerContent,
            `${lineKey}-${tag}-${chunkIdx++}`
          );
          if (tag === "b") {
            nodes.push(
              <strong key={`${lineKey}-el-${chunkIdx}`} className="font-bold">
                {children}
              </strong>
            );
          } else if (tag === "i") {
            nodes.push(
              <em key={`${lineKey}-el-${chunkIdx}`} className="italic">
                {children}
              </em>
            );
          } else if (tag === "u") {
            nodes.push(
              <u key={`${lineKey}-el-${chunkIdx}`} className="underline underline-offset-2">
                {children}
              </u>
            );
          } else if (tag === "sub") {
            nodes.push(
              <sub key={`${lineKey}-el-${chunkIdx}`} className="text-[0.75em] leading-none">
                {children}
              </sub>
            );
          } else {
            nodes.push(
              <sup key={`${lineKey}-el-${chunkIdx}`} className="text-[0.75em] leading-none">
                {children}
              </sup>
            );
          }
          i = closeInfo.afterClose;
          continue;
        }
      }
    }

    plainBuf += line[i];
    i += 1;
  }

  flushPlain();
  return nodes;
}

export default function ScientificText({
  text,
  multiline = false,
  className = "",
}: ScientificTextProps) {
  if (!text) return null;

  if (!multiline) {
    return (
      <span className={className}>
        {renderFormattedAndMath(text, "inline")}
      </span>
    );
  }

  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");
        return (
          <p key={`para-${pIdx}`} className={pIdx > 0 ? "mt-2 print:mt-1.5" : undefined}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={`line-${pIdx}-${lIdx}`}>
                {lIdx > 0 && <br />}
                {renderFormattedAndMath(line, `p${pIdx}-l${lIdx}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
