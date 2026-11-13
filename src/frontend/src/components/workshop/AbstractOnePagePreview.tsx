"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Printer,
  Upload,
  GraduationCap,
  Image as ImageIcon,
  User,
} from "lucide-react";
import {
  AffiliationEntry,
  AuthorEntry,
  clampFigureWidthInches,
  GraphicMetadata,
  PresentationFormat,
  PRINTABLE_TEXT_WIDTH_IN,
  ResearchTrack,
} from "@/types/abstractSubmission";
import ScientificText, { splitAtFigureMarker } from "@/components/workshop/ScientificText";

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
  secondaryEmail?: string;
  presentationFormat: PresentationFormat;
  researchTrack: ResearchTrack;
  studentTravelAwardApplicant: boolean;
  synopsis: string;
  abstractText: string;
  keywords?: string;
  presenterBio?: string;
  graphicUrl?: string | null;
  graphicMeta?: GraphicMetadata | null;
  graphicCaption?: string;
  figureWidthInches?: number;
  onClose?: () => void;
  onSubmitDraft?: () => void;
  submittingDraft?: boolean;
  modeLabel?: string;
  hideTopToolbar?: boolean;
}

interface ResolvedAffiliation {
  number: number;
  id: string;
  institution: string;
  location: string;
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
  secondaryEmail,
  presentationFormat,
  researchTrack,
  studentTravelAwardApplicant,
  synopsis,
  abstractText,
  keywords,
  presenterBio,
  graphicUrl,
  graphicMeta,
  graphicCaption,
  figureWidthInches,
  onClose,
  onSubmitDraft,
  submittingDraft = false,
  modeLabel = "Formatted Abstract Preview (8.5\" × 11\" • 1\" Margins)",
  hideTopToolbar = false,
}: AbstractOnePagePreviewProps) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const [isTwoPages, setIsTwoPages] = useState(false);

  const { numberedAffiliations, affiliationIndexMap, normalizedAuthors } = useMemo(() => {
    const cleanAffs = affiliations.filter((a) => a.institution.trim().length > 0);
    const list: ResolvedAffiliation[] =
      cleanAffs.length > 0
        ? cleanAffs.map((a, idx) => ({
            number: idx + 1,
            id: a.id,
            institution: a.institution.trim(),
            location: (a.location || "").trim(),
          }))
        : affiliationFallback?.trim()
        ? [
            {
              number: 1,
              id: "fallback-aff-1",
              institution: affiliationFallback.trim(),
              location: "",
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

  const resolvedWidthInches = clampFigureWidthInches(
    figureWidthInches ?? graphicMeta?.widthInches
  );
  const figureWidthPct = Math.min(
    100,
    Math.max(46.15, (resolvedWidthInches / PRINTABLE_TEXT_WIDTH_IN) * 100)
  );

  const splitAbstract = useMemo(
    () => splitAtFigureMarker(abstractText),
    [abstractText]
  );

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof window === "undefined") return;

    const measure = () => {
      // 11in at 96 DPI = 1056px; allow slight subpixel buffer before flagging Page 2
      setIsTwoPages(el.scrollHeight > 1080);
    };
    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, [abstractText, title, synopsis, graphicUrl, resolvedWidthInches, graphicCaption]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const resolvedCaption = graphicCaption?.trim() || graphicMeta?.caption?.trim() || "";

  const renderFigureBlock = () => {
    if (!graphicUrl) return null;
    return (
      <figure
        style={{ width: `${figureWidthPct.toFixed(2)}%` }}
        className="mx-auto my-4 border border-slate-200 rounded-lg p-2 bg-white space-y-1.5 break-inside-avoid max-w-full"
      >
        <img
          src={graphicUrl}
          alt={resolvedCaption || "Submitted scientific figure"}
          className="w-full h-auto object-contain mx-auto rounded"
        />
        {resolvedCaption && (
          <figcaption className="text-[10pt] print:text-[9.5pt] text-slate-700 leading-snug text-center font-serif">
            <strong className="text-slate-900">Figure 1.</strong>{" "}
            <ScientificText text={resolvedCaption} />
          </figcaption>
        )}
      </figure>
    );
  };

  return (
    <div className="space-y-4 w-full min-w-0 print:space-y-0">
      {/* Screen Toolbar (Hidden When Printing or Embedded in Stage 8) */}
      {!hideTopToolbar && (
        <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs max-w-[8.5in] mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate">
                {modeLabel}
              </span>
              <span className="block text-[11px] text-slate-500 truncate">
                8.5&quot; × 11&quot; US-Letter • 1&quot; margins (6.5&quot; text width) • Est.{" "}
                {isTwoPages ? "2 pages" : "1 page"}
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
              <span>Print / Save Formatted PDF</span>
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
      )}

      {/* 8.5" × 11" US-Letter Sheet With 1-Inch Margins (6.5" Printable Text Width; Flows up to 2 Pages) */}
      <article
        ref={sheetRef}
        aria-label="HEMS Formatted Abstract Sheet"
        className="hems-abstract-print-sheet relative w-full max-w-[8.5in] min-h-[11in] mx-auto bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm p-6 sm:p-[1in] print:max-w-none print:min-h-0 print:mx-0 print:border-0 print:rounded-none print:shadow-none print:p-0 flex flex-col justify-between gap-4"
      >
        {/* Subtle Screen-Only Page 1 -> Page 2 Boundary Indicator at 11in */}
        {isTwoPages && (
          <div
            aria-hidden="true"
            className="print:hidden pointer-events-none absolute left-0 right-0 top-[11in] border-t-2 border-dashed border-sky-400/70 flex justify-end pr-3 z-10"
          >
            <span className="-translate-y-1/2 bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
              Page 2 Boundary (8.5&quot; × 11&quot; • 1&quot; margins)
            </span>
          </div>
        )}

        <div className="space-y-3.5 print:space-y-3">
          {/* 1. Society Letterhead */}
          <header className="flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-3 pb-2.5 border-b-2 border-slate-900 break-inside-avoid">
            <div className="flex items-center gap-3">
              <div className="w-11 print:w-10 rounded-md bg-white border border-slate-200 p-0.5 shrink-0">
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
                <p className="font-serif text-sm print:text-[11pt] font-bold text-slate-900 leading-tight">
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

          {/* 2. Title, Authors (Single Presenter Underlined) & Numbered Affiliations */}
          <section className="text-center space-y-1.5 pt-0.5 break-inside-avoid">
            <h1 className="font-serif text-[14pt] print:text-[14pt] font-bold text-slate-950 leading-snug">
              <ScientificText text={title.trim() || "Untitled HEMS Workshop Abstract"} />
            </h1>

            {normalizedAuthors.length > 0 && (
              <p className="font-serif text-[11pt] print:text-[11pt] text-slate-900 leading-snug">
                {normalizedAuthors.map((author, idx) => {
                  const affNum = affiliationIndexMap.get(author.affiliationId);
                  return (
                    <React.Fragment key={author.id || idx}>
                      {idx > 0 && ", "}
                      <span
                        className={
                          author.isPresenter
                            ? "underline decoration-1 underline-offset-2 font-semibold"
                            : undefined
                        }
                      >
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
              <div className="font-serif italic text-[9.5pt] print:text-[9.5pt] text-slate-600 leading-snug">
                <p>
                  {numberedAffiliations.map((aff, idx) => (
                    <React.Fragment key={aff.id}>
                      {idx > 0 && "  •  "}
                      <sup className="not-italic font-sans font-semibold text-slate-700 mr-0.5">
                        {aff.number}
                      </sup>
                      <ScientificText
                        text={
                          aff.location
                            ? `${aff.institution}, ${aff.location}`
                            : aff.institution
                        }
                      />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            )}

            <p className="text-[9pt] print:text-[8.5pt] text-slate-500">
              *Presenting / Corresponding Author:{" "}
              <span className="font-medium text-slate-700">
                {correspondingEmail.trim() || "author@institution.edu"}
              </span>
              {secondaryEmail?.trim() ? (
                <>
                  {" "}
                  • Secondary:{" "}
                  <span className="font-medium text-slate-700">
                    {secondaryEmail.trim()}
                  </span>
                </>
              ) : null}
            </p>
          </section>

          {/* 3. Synopsis Callout + Keywords */}
          {(synopsis.trim() || keywords?.trim()) && (
            <section className="border-l-3 border-primary bg-slate-50/90 px-3 py-2 rounded-r-lg space-y-1 break-inside-avoid">
              {synopsis.trim() && (
                <p className="text-[9.5pt] print:text-[9.5pt] text-slate-800 leading-snug">
                  <span className="font-bold uppercase tracking-wider text-[8.5pt] text-primary mr-1.5">
                    Synopsis:
                  </span>
                  <ScientificText text={synopsis.trim()} />
                </p>
              )}
              {keywords?.trim() && (
                <p className="text-[9pt] print:text-[9pt] text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-700 mr-1">Keywords:</span>
                  <ScientificText text={keywords.trim()} />
                </p>
              )}
            </section>
          )}

          {/* 4. Abstract Body (11pt serif on 6.5in text column) + Inline or Trailing Figure */}
          <section className="pt-1 font-serif text-[11pt] print:text-[11pt] text-slate-900 leading-[1.45] text-justify">
            {splitAbstract.hasMarker ? (
              <div className="space-y-3">
                {splitAbstract.beforeText && (
                  <ScientificText text={splitAbstract.beforeText} multiline />
                )}
                {renderFigureBlock()}
                {splitAbstract.afterText && (
                  <ScientificText text={splitAbstract.afterText} multiline />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <ScientificText
                  text={abstractText.trim() || "Abstract body text not yet entered."}
                  multiline
                />
                {renderFigureBlock()}
              </div>
            )}
          </section>
        </div>

        {/* 5. Sheet Footer Strip */}
        <footer className="border-t border-slate-200 pt-2 flex flex-wrap items-center justify-between gap-2 text-[8.5pt] text-slate-500 tabular-nums break-inside-avoid">
          <span>
            HEMS Society • www.hems-workshop.org • {workshopOrdinal} Workshop ({workshopYear})
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {graphicMeta && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <ImageIcon size={11} />
                Figure: {graphicMeta.detectedDpi} DPI ({graphicMeta.widthPx}×{graphicMeta.heightPx} px •{" "}
                {resolvedWidthInches.toFixed(2)}&quot; width)
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

      {/* Non-Print Companion Card: Presenter Biography (For Session Chairs & Reviewers) */}
      {presenterBio?.trim() && (
        <div className="print:hidden max-w-[8.5in] mx-auto bg-white border border-slate-200/95 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <User size={13} />
            <span>Presenter Biography (Session Chair &amp; Reviewer Metadata)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <ScientificText text={presenterBio.trim()} />
          </p>
        </div>
      )}
    </div>
  );
}
