"use client";

import React, { useMemo } from "react";
import { ArrowLeft, Printer, Upload, GraduationCap, Image as ImageIcon } from "lucide-react";
import {
  AffiliationEntry,
  AuthorEntry,
  GraphicMetadata,
  PresentationFormat,
  ResearchTrack,
} from "@/types/abstractSubmission";
import ScientificText from "@/components/workshop/ScientificText";

export interface AbstractOnePagePreviewProps {
  submissionId?: string;
  workshopOrdinal: string;
  workshopWindow: string;
  workshopYear: number;
  title: string;
  authors: AuthorEntry[];
  affiliations: AffiliationEntry[];
  presentingAuthorFallback?: string;
  affiliationFallback?: string;
  coAuthorsFallback?: string;
  correspondingEmail: string;
  presentationFormat: PresentationFormat;
  researchTrack: ResearchTrack;
  studentTravelAwardApplicant: boolean;
  synopsis: string;
  abstractText: string;
  graphicUrl?: string | null;
  graphicMeta?: GraphicMetadata | null;
  graphicCaption?: string;
  onClose: () => void;
  onSubmitDraft?: () => void;
  submittingDraft?: boolean;
  modeLabel?: string;
}

interface ResolvedAffiliation {
  number: number;
  id: string;
  institution: string;
}

export default function AbstractOnePagePreview({
  submissionId,
  workshopOrdinal,
  workshopWindow,
  workshopYear,
  title,
  authors,
  affiliations,
  presentingAuthorFallback,
  affiliationFallback,
  coAuthorsFallback,
  correspondingEmail,
  presentationFormat,
  researchTrack,
  studentTravelAwardApplicant,
  synopsis,
  abstractText,
  graphicUrl,
  graphicMeta,
  graphicCaption,
  onClose,
  onSubmitDraft,
  submittingDraft = false,
  modeLabel = "1-Page Formatted Abstract Preview",
}: AbstractOnePagePreviewProps) {
  const { numberedAffiliations, affiliationIndexMap, normalizedAuthors } = useMemo(() => {
    const cleanAffs = affiliations.filter((a) => a.institution.trim().length > 0);
    const list: ResolvedAffiliation[] =
      cleanAffs.length > 0
        ? cleanAffs.map((a, idx) => ({
            number: idx + 1,
            id: a.id,
            institution: a.institution.trim(),
          }))
        : affiliationFallback?.trim()
        ? [
            {
              number: 1,
              id: "fallback-aff-1",
              institution: affiliationFallback.trim(),
            },
          ]
        : [];

    const idxMap = new Map<string, number>();
    list.forEach((item) => idxMap.set(item.id, item.number));

    const cleanAuthors = authors.filter((a) => a.name.trim().length > 0);
    let resolvedAuthors: AuthorEntry[] = cleanAuthors;
    if (resolvedAuthors.length === 0 && presentingAuthorFallback?.trim()) {
      const legacyList: AuthorEntry[] = [
        {
          id: "legacy-presenter",
          name: presentingAuthorFallback.trim(),
          affiliationId: list[0]?.id || "fallback-aff-1",
          isPresenter: true,
        },
      ];
      if (coAuthorsFallback?.trim()) {
        coAuthorsFallback
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((name, idx) => {
            legacyList.push({
              id: `legacy-co-${idx}`,
              name,
              affiliationId: list[0]?.id || "fallback-aff-1",
              isPresenter: false,
            });
          });
      }
      resolvedAuthors = legacyList;
    }

    return {
      numberedAffiliations: list,
      affiliationIndexMap: idxMap,
      normalizedAuthors: resolvedAuthors,
    };
  }, [affiliations, authors, presentingAuthorFallback, affiliationFallback, coAuthorsFallback]);

  const isPortraitOrSquare =
    Boolean(graphicUrl) &&
    graphicMeta &&
    graphicMeta.widthPx > 0 &&
    graphicMeta.heightPx > 0
      ? graphicMeta.widthPx / graphicMeta.heightPx <= 1.25
      : false;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const resolvedCaption = graphicCaption?.trim() || graphicMeta?.caption?.trim() || "";

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 print:max-w-none print:mx-0 print:space-y-0">
      {/* Screen Toolbar (Hidden When Printing) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-900 truncate">
              {modeLabel}
            </span>
            <span className="block text-[11px] text-slate-500 truncate">
              Single US-Letter sheet • Styled with HEMS formatting &amp; inline equations
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
          >
            <Printer size={14} className="text-primary" />
            <span>Print / Save 1-Page PDF</span>
          </button>
          {onSubmitDraft && (
            <button
              type="button"
              disabled={submittingDraft}
              onClick={onSubmitDraft}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-sky-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Upload size={14} />
              <span>{submittingDraft ? "Submitting..." : "Submit Abstract"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Single US-Letter Formatted Sheet */}
      <article
        aria-label="HEMS Formatted One-Page Abstract"
        className="max-w-[8.5in] min-h-[10.1in] print:min-h-[9.95in] mx-auto bg-white text-slate-900 border border-slate-200/95 rounded-2xl shadow-sm p-6 sm:p-9 print:max-w-none print:mx-0 print:border-0 print:rounded-none print:shadow-none print:p-0 flex flex-col justify-between gap-4 print:gap-2.5 break-inside-avoid"
      >
        <div className="space-y-3.5 print:space-y-2.5">
          {/* 1. Society Letterhead */}
          <header className="flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-3 pb-2.5 print:pb-2 border-b-2 border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 print:w-11 rounded-md bg-white border border-slate-200 p-0.5 shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Emblem"
                  width={3756}
                  height={2594}
                  decoding="sync"
                  className="w-full h-auto object-contain mix-blend-multiply block"
                />
              </div>
              <div>
                <p className="font-serif text-sm print:text-[11.5pt] font-bold text-slate-900 leading-tight">
                  Harsh-Environment Mass Spectrometry Society
                </p>
                <p className="text-[10.5px] print:text-[8.5pt] text-slate-600 tabular-nums">
                  {workshopOrdinal} Biennial HEMS Workshop • {workshopWindow} ({workshopYear})
                </p>
              </div>
            </div>

            <div className="sm:text-right print:text-right space-y-0.5 shrink-0">
              <div className="flex flex-wrap sm:justify-end print:justify-end items-center gap-1.5">
                <span className="tabular-nums text-[10px] print:text-[8pt] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {submissionId || "DRAFT PREVIEW"}
                </span>
                <span className="text-[10px] print:text-[8pt] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                  {presentationFormat}
                </span>
              </div>
              <p className="text-[10px] print:text-[8pt] font-medium text-slate-600">
                Track: {researchTrack}
              </p>
            </div>
          </header>

          {/* 2. Title, Authors (Presenters Underlined) & Numbered Affiliations */}
          <section className="text-center space-y-2 print:space-y-1.5 pt-0.5">
            <h1 className="font-serif text-lg sm:text-[19px] print:text-[14pt] font-bold text-slate-950 leading-snug">
              <ScientificText text={title.trim() || "Untitled HEMS Workshop Abstract"} />
            </h1>

            {normalizedAuthors.length > 0 && (
              <p className="font-serif text-[13px] print:text-[10.5pt] text-slate-900 leading-snug">
                {normalizedAuthors.map((author, idx) => {
                  const affNum = affiliationIndexMap.get(author.affiliationId);
                  return (
                    <React.Fragment key={author.id || idx}>
                      {idx > 0 && ", "}
                      <span className={author.isPresenter ? "underline decoration-1 underline-offset-2 font-semibold" : undefined}>
                        <ScientificText text={author.name.trim()} />
                      </span>
                      {(affNum || author.isPresenter) && (
                        <sup className="text-[0.72em] ml-0.5 font-sans font-semibold text-primary">
                          {affNum ?? ""}
                          {author.isPresenter ? "*" : ""}
                        </sup>
                      )}
                    </React.Fragment>
                  );
                })}
              </p>
            )}

            {numberedAffiliations.length > 0 && (
              <div className="font-serif italic text-[11.5px] print:text-[9pt] text-slate-600 leading-snug space-y-0.5">
                <p>
                  {numberedAffiliations.map((aff, idx) => (
                    <React.Fragment key={aff.id}>
                      {idx > 0 && "  •  "}
                      <sup className="not-italic font-sans font-semibold text-slate-700 mr-0.5">
                        {aff.number}
                      </sup>
                      <ScientificText text={aff.institution} />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            )}

            <p className="text-[10.5px] print:text-[8.5pt] text-slate-500">
              *Presenting / Corresponding Author:{" "}
              <span className="font-medium text-slate-700">
                {correspondingEmail.trim() || "author@institution.edu"}
              </span>
            </p>
          </section>

          {/* 3. Synopsis Callout (<= 200 chars) */}
          {synopsis.trim() && (
            <section className="border-l-3 border-primary bg-slate-50/90 px-3.5 py-2 print:px-3 print:py-1.5 rounded-r-lg">
              <p className="text-[11.5px] print:text-[9pt] text-slate-800 leading-snug">
                <span className="font-bold uppercase tracking-wider text-[10px] print:text-[8pt] text-primary mr-1.5">
                  Synopsis:
                </span>
                <ScientificText text={synopsis.trim()} />
              </p>
            </section>
          )}

          {/* 4. Abstract Body (<= 1,500 chars) + 300-DPI Graphic */}
          {graphicUrl && isPortraitOrSquare ? (
            <section className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-4 print:gap-3 items-start pt-0.5">
              <div className="sm:col-span-7 print:col-span-7 font-serif text-[12.5px] print:text-[9.6pt] text-slate-900 leading-[1.46] print:leading-[1.38] text-justify">
                <ScientificText
                  text={abstractText.trim() || "Abstract body text not yet entered."}
                  multiline
                />
              </div>
              <figure className="sm:col-span-5 print:col-span-5 border border-slate-200 rounded-lg p-2 bg-white space-y-1.5 break-inside-avoid">
                <img
                  src={graphicUrl}
                  alt={resolvedCaption || "Submitted scientific figure"}
                  className="w-full max-h-[3.9in] print:max-h-[3.7in] object-contain mx-auto rounded"
                />
                {resolvedCaption && (
                  <figcaption className="text-[10px] print:text-[8pt] text-slate-600 leading-snug text-center">
                    <strong className="text-slate-800">Figure 1.</strong>{" "}
                    <ScientificText text={resolvedCaption} />
                  </figcaption>
                )}
              </figure>
            </section>
          ) : (
            <section className="space-y-3 print:space-y-2 pt-0.5">
              <div
                className={`font-serif text-slate-900 text-justify ${
                  graphicUrl
                    ? "text-[12.5px] print:text-[9.6pt] leading-[1.44] print:leading-[1.36]"
                    : "text-[13.5px] print:text-[10.4pt] leading-relaxed"
                }`}
              >
                <ScientificText
                  text={abstractText.trim() || "Abstract body text not yet entered."}
                  multiline
                />
              </div>

              {graphicUrl && (
                <figure className="border border-slate-200 rounded-lg p-2.5 print:p-2 bg-white space-y-1.5 break-inside-avoid">
                  <img
                    src={graphicUrl}
                    alt={resolvedCaption || "Submitted scientific figure"}
                    className="max-h-[3.05in] print:max-h-[2.85in] max-w-full w-auto object-contain mx-auto rounded"
                  />
                  {resolvedCaption && (
                    <figcaption className="text-[10.5px] print:text-[8.2pt] text-slate-600 leading-snug text-center max-w-2xl mx-auto">
                      <strong className="text-slate-800">Figure 1.</strong>{" "}
                      <ScientificText text={resolvedCaption} />
                    </figcaption>
                  )}
                </figure>
              )}
            </section>
          )}
        </div>

        {/* 5. Single-Page Footer Strip */}
        <footer className="border-t border-slate-200 pt-2 print:pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] print:text-[8pt] text-slate-500 tabular-nums">
          <span>
            HEMS Society • www.hems-workshop.org • {workshopOrdinal} Workshop ({workshopYear})
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {graphicMeta && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <ImageIcon size={11} />
                Figure: {graphicMeta.detectedDpi} DPI ({graphicMeta.widthPx}×{graphicMeta.heightPx} px)
              </span>
            )}
            {studentTravelAwardApplicant && (
              <span className="inline-flex items-center gap-1 text-secondary font-semibold">
                <GraduationCap size={11} />
                Student Travel Award Applicant
              </span>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
