"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import {
  AbstractSubmissionRecord,
  ReviewDecision,
} from "@/types/abstractSubmission";
import { hasAttendeeRole, hasReviewerRole } from "@/utils/telemetryClient";
import ScientificText from "@/components/workshop/ScientificText";
import AbstractOnePagePreview from "@/components/workshop/AbstractOnePagePreview";

type ReviewerFilter = "all" | "pending" | "reviewed" | "student_award";

const REVIEW_DECISION_OPTIONS: readonly ReviewDecision[] = [
  "Accept (Oral)",
  "Accept (Poster)",
  "Revision Requested",
  "Decline",
];

function formatShortDate(iso: string): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderAuthorLine(sub: AbstractSubmissionRecord): React.ReactNode {
  if (sub.authors && sub.authors.length > 0 && sub.affiliations && sub.affiliations.length > 0) {
    const affIndexMap = new Map<string, number>();
    sub.affiliations.forEach((a, idx) => affIndexMap.set(a.id, idx + 1));
    return (
      <span className="text-xs text-foreground/75">
        {sub.authors.map((a, idx) => {
          const num = affIndexMap.get(a.affiliationId);
          return (
            <React.Fragment key={a.id || idx}>
              {idx > 0 && ", "}
              <span className={a.isPresenter ? "font-semibold underline underline-offset-2 text-foreground" : undefined}>
                <ScientificText text={a.name} />
              </span>
              {num && (
                <sup className="text-[10px] text-primary font-semibold ml-0.5">
                  {num}
                  {a.isPresenter ? "*" : ""}
                </sup>
              )}
            </React.Fragment>
          );
        })}
        {" • "}
        <span className="text-slate-500">
          {sub.affiliations.map((aff, idx) => `${idx + 1}: ${aff.institution}`).join(" ; ")}
        </span>
        {" • "}
        <span className="text-primary">{sub.correspondingEmail}</span>
      </span>
    );
  }

  return (
    <span className="text-xs text-foreground/70">
      <strong className="font-semibold text-foreground/85">{sub.presentingAuthor}</strong>{" "}
      ({sub.affiliation})
      {sub.coAuthors ? ` • Co-authors: ${sub.coAuthors}` : ""} •{" "}
      <span className="text-primary">{sub.correspondingEmail}</span>
    </span>
  );
}

export default function ReviewerPage() {
  const { user, loading: authLoading } = useAuth();
  const { workshop } = useUpcomingWorkshop();
  const {
    submissions,
    loading: listLoading,
    refresh,
    saveReview,
    getGraphicPreviewUrl,
    openSubmissionPdf,
  } = useAbstractSubmissions();

  const [activeFilter, setActiveFilter] = useState<ReviewerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("8.5");
  const [decisionInput, setDecisionInput] =
    useState<ReviewDecision>("Accept (Oral)");
  const [commentsInput, setCommentsInput] = useState<string>("");
  const [savingReview, setSavingReview] = useState<boolean>(false);
  const [previewNotice, setPreviewNotice] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<{
    sub: AbstractSubmissionRecord;
    graphicUrl: string | null;
  } | null>(null);

  useEffect(() => {
    const url = activePreview?.graphicUrl;
    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [activePreview]);

  const reviewedCount = useMemo(
    () => submissions.filter((s) => s.status === "Reviewed").length,
    [submissions]
  );
  const pendingCount = submissions.length - reviewedCount;
  const studentAwardCount = useMemo(
    () => submissions.filter((s) => s.studentTravelAwardApplicant).length,
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((sub) => {
      if (activeFilter === "pending" && sub.status !== "Pending") return false;
      if (activeFilter === "reviewed" && sub.status !== "Reviewed") return false;
      if (activeFilter === "student_award" && !sub.studentTravelAwardApplicant) {
        return false;
      }
      if (!q) return true;
      const authorNames = (sub.authors || []).map((a) => a.name).join(" ");
      const affNames = (sub.affiliations || []).map((a) => a.institution).join(" ");
      const haystack = [
        sub.id,
        sub.title,
        sub.presentingAuthor,
        sub.affiliation,
        sub.coAuthors,
        authorNames,
        affNames,
        sub.researchTrack,
        sub.summary,
        sub.abstractText || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [submissions, activeFilter, searchQuery]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 mt-4">Verifying credentials...</p>
      </div>
    );
  }

  if (!user || !hasReviewerRole(user.roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be logged in as an authenticated{" "}
          <strong className="font-semibold text-foreground">Abstract Reviewer</strong>{" "}
          to view this panel.
        </p>
        <Link
          href="/auth"
          className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleOpenEvaluation = (sub: AbstractSubmissionRecord) => {
    setReviewError(null);
    setEditingId(sub.id);
    setScoreInput(
      typeof sub.score === "number" ? sub.score.toFixed(1) : "8.5"
    );
    setDecisionInput(
      sub.decision && sub.decision !== "Pending" ? sub.decision : "Accept (Oral)"
    );
    setCommentsInput(sub.reviewerComments || "");
  };

  const handleSaveEvaluation = async (
    e: React.FormEvent<HTMLFormElement>,
    subId: string
  ) => {
    e.preventDefault();
    setReviewError(null);
    const parsedScore = Number.parseFloat(scoreInput);
    if (Number.isNaN(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      setReviewError("Score must be between 1.0 and 10.0.");
      return;
    }

    setSavingReview(true);
    try {
      await saveReview({
        id: subId,
        score: Number(parsedScore.toFixed(1)),
        decision: decisionInput,
        reviewerComments: commentsInput,
        reviewedBy: user.email,
      });
      setEditingId(null);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to save evaluation."
      );
    } finally {
      setSavingReview(false);
    }
  };

  const handleInspectAbstract = async (sub: AbstractSubmissionRecord) => {
    setPreviewNotice(null);
    if (sub.abstractText || (sub.authors && sub.authors.length > 0)) {
      const graphicUrl = await getGraphicPreviewUrl(sub);
      setActivePreview({ sub, graphicUrl });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const res = await openSubmissionPdf(sub);
    if (!res.ok && res.reason) {
      setPreviewNotice({ id: sub.id, text: res.reason });
    }
  };

  if (activePreview) {
    const { sub, graphicUrl } = activePreview;
    return (
      <AbstractOnePagePreview
        submissionId={sub.id}
        workshopOrdinal={workshop.workshop_ordinal}
        workshopWindow={workshop.target_window}
        workshopYear={sub.workshopYear}
        title={sub.title}
        authors={sub.authors || []}
        affiliations={sub.affiliations || []}
        presentingAuthorFallback={sub.presentingAuthor}
        affiliationFallback={sub.affiliation}
        coAuthorsFallback={sub.coAuthors}
        correspondingEmail={sub.correspondingEmail}
        presentationFormat={sub.presentationFormat}
        researchTrack={sub.researchTrack}
        studentTravelAwardApplicant={sub.studentTravelAwardApplicant}
        synopsis={sub.summary}
        abstractText={sub.abstractText || sub.summary}
        graphicUrl={graphicUrl}
        graphicMeta={sub.graphic || null}
        graphicCaption={sub.graphic?.caption}
        modeLabel={`Reviewer Inspection — ${sub.id}`}
        onClose={() => setActivePreview(null)}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <ClipboardCheck className="text-primary shrink-0" /> Reviewer Portal
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Inspect full 1-page attendee abstracts, equations, 300-DPI figures, and assign format recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {hasAttendeeRole(user.roles) && (
            <Link
              href="/abstract-submission"
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              <Upload size={13} /> Submit Abstract
            </Link>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={listLoading}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={listLoading ? "animate-spin text-primary" : "text-primary"}
            />
            Refresh
          </button>
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold text-primary break-all">
            Reviewer: {user.email}
          </div>
        </div>
      </div>

      {/* Reviewer statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-background border border-foreground/10 p-5 sm:p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {submissions.length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Submitted Abstracts
            </div>
          </div>
        </div>
        <div className="bg-background border border-foreground/10 p-5 sm:p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-green-500/10 text-green-600 p-3 rounded-xl shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {reviewedCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Completed Reviews
            </div>
          </div>
        </div>
        <div className="bg-background border border-foreground/10 p-5 sm:p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-500/10 text-amber-600 p-3 rounded-xl shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {pendingCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Pending Review
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: `All (${submissions.length})` },
              { id: "pending", label: `Pending (${pendingCount})` },
              { id: "reviewed", label: `Reviewed (${reviewedCount})` },
              {
                id: "student_award",
                label: `Student Award Applicants (${studentAwardCount})`,
              },
            ] as Array<{ id: ReviewerFilter; label: string }>
          ).map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-white border-primary shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, author, track, ID..."
            aria-label="Filter abstract queue"
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Abstract Table */}
      <div className="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-foreground/10 bg-surface flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-foreground">
            Abstracts Evaluation Queue ({filteredSubmissions.length})
          </h3>
          <span className="text-[11px] text-foreground/55">
            Synced live with Attendees → Abstract Submission
          </span>
        </div>

        <div className="divide-y divide-foreground/5">
          {listLoading && submissions.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Loading abstract submissions...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No abstract submissions match your current filter.
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const isEditing = editingId === sub.id;
              return (
                <div
                  key={sub.id}
                  className="p-4 sm:p-6 hover:bg-surface/30 transition-all duration-200 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {sub.id}
                        </span>
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                          {sub.presentationFormat}
                        </span>
                        <span className="text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded">
                          {sub.researchTrack}
                        </span>
                        {sub.graphic && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded tabular-nums">
                            <ImageIcon size={11} /> Figure ({sub.graphic.detectedDpi} DPI)
                          </span>
                        )}
                        {sub.studentTravelAwardApplicant && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                            <GraduationCap size={12} /> Student Award Applicant
                          </span>
                        )}
                        <span className="tabular-nums text-[11px] font-medium text-foreground/50">
                          Submitted {formatShortDate(sub.submittedAt)} • Deadline: {sub.deadline}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-foreground leading-snug">
                        <ScientificText text={sub.title} />
                      </h4>

                      <p>{renderAuthorLine(sub)}</p>

                      {sub.summary && (
                        <div className="text-xs text-slate-600 leading-relaxed bg-white/80 border border-slate-200/80 rounded-lg p-3 mt-1 space-y-1">
                          <div>
                            <strong className="text-slate-800">Synopsis:</strong>{" "}
                            <ScientificText text={sub.summary} />
                          </div>
                          {sub.abstractText && (
                            <p className="text-[11px] text-slate-400 tabular-nums">
                              Full abstract body: {sub.abstractText.length.toLocaleString()} characters
                            </p>
                          )}
                        </div>
                      )}

                      {sub.status === "Reviewed" && sub.reviewerComments && !isEditing && (
                        <p className="text-xs text-emerald-900 bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-3 py-2">
                          <strong>Reviewer Note ({sub.decision}):</strong>{" "}
                          {sub.reviewerComments}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {sub.status === "Reviewed" ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {sub.decision}
                          </span>
                          {typeof sub.score === "number" && (
                            <span className="tabular-nums text-xs font-bold text-foreground bg-foreground/5 border border-foreground/10 px-2.5 py-1 rounded-full">
                              {sub.score.toFixed(1)}/10
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Pending
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleInspectAbstract(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View 1-Page Abstract</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          isEditing ? setEditingId(null) : handleOpenEvaluation(sub)
                        }
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                          isEditing
                            ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                            : sub.status === "Reviewed"
                            ? "bg-surface border border-foreground/15 text-foreground hover:bg-foreground/5"
                            : "bg-primary text-primary-foreground hover:bg-primary/95"
                        }`}
                      >
                        {isEditing
                          ? "Close Form"
                          : sub.status === "Reviewed"
                          ? "Edit Review"
                          : "Start Evaluation"}
                      </button>
                    </div>
                  </div>

                  {previewNotice && previewNotice.id === sub.id && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{previewNotice.text}</span>
                    </div>
                  )}

                  {isEditing && (
                    <form
                      onSubmit={(e) => void handleSaveEvaluation(e, sub.id)}
                      className="bg-white border border-primary/25 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Evaluate {sub.id} — {sub.presentingAuthor}
                        </span>
                      </div>

                      {reviewError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                          {reviewError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor={`score-${sub.id}`}
                            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                          >
                            Scientific Score (1.0 – 10.0)
                          </label>
                          <input
                            id={`score-${sub.id}`}
                            type="number"
                            min="1"
                            max="10"
                            step="0.5"
                            required
                            value={scoreInput}
                            onChange={(e) => setScoreInput(e.target.value)}
                            className="w-full bg-[#FAFBFD] border border-slate-200 rounded-lg px-3 py-2 text-sm tabular-nums text-slate-900 focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`decision-${sub.id}`}
                            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                          >
                            Program Recommendation
                          </label>
                          <select
                            id={`decision-${sub.id}`}
                            value={decisionInput}
                            onChange={(e) =>
                              setDecisionInput(e.target.value as ReviewDecision)
                            }
                            className="w-full bg-[#FAFBFD] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary"
                          >
                            {REVIEW_DECISION_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`notes-${sub.id}`}
                          className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                        >
                          Reviewer Notes / Committee Comments
                        </label>
                        <textarea
                          id={`notes-${sub.id}`}
                          rows={3}
                          value={commentsInput}
                          onChange={(e) => setCommentsInput(e.target.value)}
                          placeholder="Technical merit, novelty, suitability for single-track oral vs. poster session..."
                          className="w-full bg-[#FAFBFD] border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingReview}
                          className="inline-flex items-center gap-1.5 bg-primary hover:bg-sky-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {savingReview ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Evaluation"
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
