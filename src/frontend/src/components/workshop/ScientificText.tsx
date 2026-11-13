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
    // Fraction: \frac{num}{den}
    if (expr.startsWith("\\frac", i)) {
      const afterCmd = i + 5;
      const numGroup = readBracedGroup(expr, afterCmd);
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

    // Square root: \sqrt{arg}
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

    // Superscript: ^{...}
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

    // Subscript: _{...}
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

    // TeX command symbol: \alpha, \mu, \rightarrow, etc.
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

function renderMixedLine(line: string, lineKey: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match $...$ or \(...\) inline math delimiters without greedy cross-match
  const delimiterRegex = /(\$[^$\n]+?\$|\\\([^)\n]+?\\\))/g;
  let lastIdx = 0;
  let segIdx = 0;
  let match: RegExpExecArray | null = delimiterRegex.exec(line);

  while (match !== null) {
    if (match.index > lastIdx) {
      const plainSeg = line.slice(lastIdx, match.index);
      parts.push(
        <React.Fragment key={`${lineKey}-p-${segIdx++}`}>
          {renderInlineMathTokens(plainSeg, `${lineKey}-pt-${segIdx}`)}
        </React.Fragment>
      );
    }

    const token = match[0];
    const inner = token.startsWith("$")
      ? token.slice(1, -1)
      : token.slice(2, -2);
    parts.push(
      <span key={`${lineKey}-m-${segIdx++}`} className="sci-math">
        {renderInlineMathTokens(inner, `${lineKey}-mt-${segIdx}`)}
      </span>
    );

    lastIdx = delimiterRegex.lastIndex;
    match = delimiterRegex.exec(line);
  }

  if (lastIdx < line.length) {
    parts.push(
      <React.Fragment key={`${lineKey}-tail-${segIdx++}`}>
        {renderInlineMathTokens(line.slice(lastIdx), `${lineKey}-tt-${segIdx}`)}
      </React.Fragment>
    );
  }

  return parts;
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
        {renderMixedLine(text, "inline")}
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
                {renderMixedLine(line, `p${pIdx}-l${lIdx}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
