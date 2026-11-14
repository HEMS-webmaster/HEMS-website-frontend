"use client";

import React from "react";
import { ArrowLeft, Printer } from "lucide-react";
import {
  ABSTRACT_MAX_CHARS,
  BIO_MAX_CHARS,
  CAPTION_MAX_CHARS,
  KEYWORDS_MAX_CHARS,
  MAX_FIGURE_WIDTH_IN,
  MIN_FIGURE_WIDTH_IN,
  MIN_GRAPHIC_DPI,
  SYNOPSIS_MAX_CHARS,
} from "@/types/abstractSubmission";

interface PrintableFormattingGuidelinesProps {
  workshopOrdinal: string;
  workshopWindow: string;
  workshopYear: number;
  deadline: string;
  studentAwardAmount: string;
  onClose: () => void;
}

const SUBMISSION_STAGES_GUIDE = [
  {
    stage: "00",
    title: "Presenter Overview Hub (Create, Drafts & Edits)",
    details:
      "Start new abstract submissions, edit/copy/delete multiple saved drafts across sessions, or edit/copy/delete submitted abstracts up to the published Date, Time & Timezone cutoff.",
  },
  {
    stage: "01",
    title: "Title, Contact Emails, Format & Student Award",
    details:
      "Enter the full presentation title, presenter's corresponding email, optional secondary email, preferred presentation format (Oral, Poster, or Either), and optional Student Travel Award opt-in.",
  },
  {
    stage: "02",
    title: "Institutional Affiliations & Locations",
    details:
      "Add unlimited participating institutions together with each institute's geographic location (City, State/Province, Country).",
  },
  {
    stage: "03",
    title: "Single Presenter & Co-Authors",
    details:
      "Designate 1 presenting author (underlined on the formatted page) and add unlimited co-authors, assigning each author's institution via the Affiliation dropdown.",
  },
  {
    stage: "04",
    title: "Technical Research Track & Synopsis",
    details: `Select the primary HEMS technical session track and compose a concise headline synopsis capped at ${SYNOPSIS_MAX_CHARS} characters (with spaces) for committee triage.`,
  },
  {
    stage: "05",
    title: "Figure Upload, Abstract Body & Live Preview",
    details: `Optionally upload a ${MIN_GRAPHIC_DPI}-DPI figure (may be used on the HEMS website) with Desired Width (${MIN_FIGURE_WIDTH_IN}–${MAX_FIGURE_WIDTH_IN} in) and mandatory caption (up to ${CAPTION_MAX_CHARS} chars). Widths < 3.5 in float right with squared text wrapping where [FIGURE] marks the first broken row; ≥ 3.5 in render centered. Compose or paste up to ${ABSTRACT_MAX_CHARS.toLocaleString()} visible characters (780px / 6.5" measure @ 16px serif, ~12–15 words/line).`,
  },
  {
    stage: "06",
    title: "Keywords (w/ Suggestions) & Presenter Biography",
    details: `Select from automatically extracted keyword phrase suggestions or type comma-separated keywords (< ${KEYWORDS_MAX_CHARS} characters) plus a brief presenter biography (< ${BIO_MAX_CHARS} characters).`,
  },
  {
    stage: "07",
    title: "8.5\" × 11\" Preview (1\" Margins, 1–2 Pages) & Submit",
    details:
      "Inspect the complete 8.5\" × 11\" US-Letter preview with 1-inch margins (extending naturally onto Page 2 if needed), fine-tune Desired Figure Width (3.0–6.5 in), print/save a formatted PDF copy, and submit to the Reviewer Panel.",
  },
];

export default function PrintableFormattingGuidelines({
  workshopOrdinal,
  workshopWindow,
  workshopYear,
  deadline,
  studentAwardAmount,
  onClose,
}: PrintableFormattingGuidelinesProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0 print:space-y-0">
      {/* Screen Control Bar */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs max-w-[1020px] mx-auto">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft size={14} />
          <span>Back to Abstract Submission (Draft Preserved)</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-sky-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <Printer size={15} />
          <span>Print / Save Guidelines PDF</span>
        </button>
      </div>

      {/* Printable 1-Page Guidelines Sheet */}
      <article
        aria-label="Printable HEMS Abstract Formatting & Submission Guidelines"
        className="max-w-[1020px] mx-auto bg-white text-slate-900 border border-slate-200/95 rounded-2xl shadow-sm p-6 sm:p-9 print:max-w-none print:mx-0 print:border-0 print:rounded-none print:shadow-none print:p-0 space-y-4 print:space-y-2.5"
      >
        <header className="flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-4 pb-3 print:pb-2 border-b-2 border-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-14 print:w-12 rounded-md bg-white border border-slate-200 p-1 shrink-0">
              <img
                src="/hemslogo.jpg"
                alt="HEMS Society Official Emblem"
                width={3756}
                height={2594}
                decoding="sync"
                className="w-full h-auto object-contain mix-blend-multiply block"
              />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-xl print:text-[15px] font-bold text-slate-900 leading-tight">
                HEMS Abstract Formatting &amp; Portal Submission Guidelines
              </h1>
              <p className="text-[11px] print:text-[9.5px] text-slate-600 tabular-nums mt-0.5">
                Harsh-Environment Mass Spectrometry Society • {workshopOrdinal} Workshop ({workshopWindow}, {workshopYear})
              </p>
            </div>
          </div>

          <div className="sm:text-right print:text-right shrink-0">
            <span className="block text-[10px] print:text-[8.5px] font-bold uppercase tracking-wider text-primary">
              Submission Deadline (Date, Time &amp; Timezone)
            </span>
            <p className="text-xs print:text-[10.5px] font-bold text-slate-900 tabular-nums">
              {deadline}
            </p>
            <p className="text-[10px] print:text-[8.5px] text-slate-500">
              Student Travel Award: {studentAwardAmount}
            </p>
          </div>
        </header>

        {/* Parameter Limits Matrix */}
        <section className="space-y-2 print:space-y-1.5 break-inside-avoid">
          <h2 className="text-[10.5px] print:text-[9pt] font-bold uppercase tracking-[0.1em] text-primary">
            Mandatory Portal Input Parameters &amp; Character Limits
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2">
              <span className="block text-[9.5px] font-semibold uppercase text-slate-500">
                Synopsis
              </span>
              <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 tabular-nums mt-0.5">
                Max {SYNOPSIS_MAX_CHARS} chars
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2">
              <span className="block text-[9.5px] font-semibold uppercase text-slate-500">
                Abstract Body
              </span>
              <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 tabular-nums mt-0.5">
                Max {ABSTRACT_MAX_CHARS.toLocaleString()} chars (w/ spaces)
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2">
              <span className="block text-[9.5px] font-semibold uppercase text-slate-500">
                Figure &amp; Caption
              </span>
              <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 tabular-nums mt-0.5">
                ≥{MIN_GRAPHIC_DPI} DPI • Cap ≤{CAPTION_MAX_CHARS}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2">
              <span className="block text-[9.5px] font-semibold uppercase text-slate-500">
                Keywords
              </span>
              <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 tabular-nums mt-0.5">
                &lt; {KEYWORDS_MAX_CHARS} chars (CSV)
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 print:p-2">
              <span className="block text-[9.5px] font-semibold uppercase text-slate-500">
                Presenter Bio
              </span>
              <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 tabular-nums mt-0.5">
                &lt; {BIO_MAX_CHARS} chars
              </span>
            </div>
          </div>
        </section>

        {/* Staged Workflow Breakdown (Presenter Overview + Stages 1-7) */}
        <section className="space-y-2 print:space-y-1.5 break-inside-avoid">
          <h2 className="text-[10.5px] print:text-[9pt] font-bold uppercase tracking-[0.1em] text-primary">
            Presenter Overview &amp; Seven-Stage Submission Workflow
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 print:gap-2">
            {SUBMISSION_STAGES_GUIDE.map((item) => (
              <div
                key={item.stage}
                className="border border-slate-200 rounded-lg p-2.5 print:p-2 bg-white space-y-0.5"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="tabular-nums text-[10px] print:text-[8.5pt] font-bold text-primary">
                    STAGE {item.stage}
                  </span>
                  <h3 className="text-xs print:text-[9.5pt] font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[11px] print:text-[8.5pt] text-slate-600 leading-snug">
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Formatting, Word Equations & Page Output Rules */}
        <footer className="border border-slate-300 bg-slate-50/90 rounded-xl p-3.5 print:p-2.5 space-y-1 text-[11px] print:text-[8.5pt] text-slate-700 break-inside-avoid">
          <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] print:text-[8pt]">
            Word Copy-Paste, Inline Styling &amp; 8.5&quot; × 11&quot; (1&quot; Margin) Output Rules
          </p>
          <ul className="list-disc list-inside space-y-0.5 leading-snug">
            <li>
              <strong>Microsoft Word Copy-Paste:</strong> Equations (OMML/MathML), Greek letters, superscripts, subscripts, bold, italics, and underlines paste cleanly and unwrap automatically across the full 6.5&quot; text width.
            </li>
            <li>
              <strong>Inline Formatting &amp; Figure Marker:</strong> Raw tags (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;sub&gt;</code>, <code>&lt;sup&gt;</code>) and <code>[FIGURE]</code> placement markers do not count against your {ABSTRACT_MAX_CHARS.toLocaleString()}-character abstract limit.
            </li>
            <li>
              <strong>High-Resolution Graphics ({MIN_FIGURE_WIDTH_IN}&ndash;{MAX_FIGURE_WIDTH_IN} in) &amp; Website Usage:</strong> Raster figures require embedded {MIN_GRAPHIC_DPI} DPI metadata (≥600×300 px) or ≥900 px width; clean vector SVGs are accepted automatically. Figures &lt; 3.5&quot; float right with squared justified text wrapping where <code>[FIGURE]</code> marks the first broken row (≥ 3.5&quot; render centered). Captions are mandatory when uploading a figure, outputs may flow onto Page 2 with 1&quot; margins, and submitted figures may be used on the HEMS website.
            </li>
          </ul>
        </footer>
      </article>
    </div>
  );
}

