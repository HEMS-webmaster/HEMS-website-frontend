"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  GripVertical,
  Layers,
  ListOrdered,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  TableProperties,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import {
  AbstractSubmissionRecord,
  ReviewDecision,
} from "@/types/abstractSubmission";
import { hasReviewerRole } from "@/utils/telemetryClient";
import {
  AbstractOverviewRow,
  computeMedian,
  formatMedianScore,
  groupOverviewRowsByTrack,
  normalizeManualOrder,
  nudgeWithinScope,
  OverviewSortMode,
  RECOMMENDATION_PRIORITY,
  RecommendationDecisionKey,
  RECOMMENDATION_SHORT_LABEL,
  reorderWithinScope,
  sortOverviewRows,
  summarizeSubmissionReviews,
} from "@/utils/abstractReviewMetrics";
import ScientificText from "@/components/workshop/ScientificText";
import AbstractOnePagePreview from "@/components/workshop/AbstractOnePagePreview";

const MANUAL_ORDER_STORAGE_KEY = "hems_reviewer_abstract_manual_order_v1";

const DECISION_BADGE_CLASSES: Record<RecommendationDecisionKey, string> = {
  "Accept (Oral)":
    "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Accept (Poster)":
    "bg-sky-50 text-sky-800 border-sky-200",
  "Revision Requested":
    "bg-amber-50 text-amber-800 border-amber-200",
  Decline:
    "bg-rose-50 text-rose-800 border-rose-200",
};

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

function decisionPillClass(decision: ReviewDecision): string {
  if (decision === "Pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return DECISION_BADGE_CLASSES[decision];
}

function scoreToneClass(score: number | null): string {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return "bg-slate-100 text-slate-500 border-slate-200";
  }
  if (score >= 8.5) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (score >= 7.0) {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }
  return "bg-amber-50 text-amber-800 border-amber-200";
}

function readStoredManualOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MANUAL_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStoredManualOrder(ids: readonly string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MANUAL_ORDER_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore quota or storage restriction
  }
}

export default function ReviewerAbstractOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { workshop } = useUpcomingWorkshop();
  const {
    submissions,
    reviews,
    loading: listLoading,
    refresh,
    getGraphicPreviewUrl,
    openSubmissionPdf,
  } = useAbstractSubmissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<OverviewSortMode>("combined_desc");
  const [groupByTrack, setGroupByTrack] = useState<boolean>(false);
  const [manualOrderIds, setManualOrderIds] = useState<string[]>(() =>
    readStoredManualOrder()
  );
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
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

  const effectiveManualOrderIds = useMemo(
    () => normalizeManualOrder(manualOrderIds, submissions),
    [manualOrderIds, submissions]
  );

  const normalizedUserEmail = (user?.email || "").trim().toLowerCase();

  const allRows: AbstractOverviewRow[] = useMemo(() => {
    return submissions.map((submission) => ({
      submission,
      summary: summarizeSubmissionReviews(submission, reviews),
    }));
  }, [submissions, reviews]);

  const filteredRows: AbstractOverviewRow[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(({ submission }) => {
      const authorNames = (submission.authors || []).map((a) => a.name).join(" ");
      const affNames = (submission.affiliations || [])
        .map((a) => `${a.institution} ${a.location || ""}`)
        .join(" ");
      const haystack = [
        submission.id,
        submission.title,
        submission.presentingAuthor,
        submission.affiliation,
        submission.coAuthors,
        authorNames,
        affNames,
        submission.researchTrack,
        submission.presentationFormat,
        submission.summary,
        submission.keywords || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allRows, searchQuery]);

  const sortedRows = useMemo(
    () => sortOverviewRows(filteredRows, sortMode, effectiveManualOrderIds),
    [filteredRows, sortMode, effectiveManualOrderIds]
  );

  const trackGroups = useMemo(
    () => (groupByTrack ? groupOverviewRowsByTrack(sortedRows) : []),
    [groupByTrack, sortedRows]
  );

  const kpis = useMemo(() => {
    const reviewedRows = allRows.filter((r) => r.summary.reviewCount > 0);
    const totalReviewsLogged = allRows.reduce(
      (acc, r) => acc + r.summary.reviewCount,
      0
    );
    const overallMedianScore = computeMedian(
      reviewedRows
        .map((r) => r.summary.medianScore)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    );
    const overallMedianFitness = computeMedian(
      reviewedRows
        .map((r) => r.summary.medianHemsFitness)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    );
    return {
      totalAbstracts: allRows.length,
      reviewedAbstracts: reviewedRows.length,
      totalReviewsLogged,
      overallMedianScore,
      overallMedianFitness,
    };
  }, [allRows]);

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
          to view the Abstract Overview.
        </p>
        {!user ? (
          <Link
            href="/auth"
            className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
          >
            Sign In
          </Link>
        ) : (
          <Link
            href="/layout-portal"
            className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
          >
            Return to Workshop Overview
          </Link>
        )}
      </div>
    );
  }

  const handleToggleExpand = (submissionId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const anyExpanded = sortedRows.some(
    (r) => Boolean(expandedIds[r.submission.id])
  );

  const handleToggleAllExpanded = () => {
    if (anyExpanded) {
      setExpandedIds({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const row of sortedRows) {
      next[row.submission.id] = true;
    }
    setExpandedIds(next);
  };

  const resolveCurrentGlobalOrderSnapshot = (): string[] => {
    if (sortMode === "manual") {
      return effectiveManualOrderIds;
    }
    return sortOverviewRows(allRows, sortMode, effectiveManualOrderIds).map(
      (r) => r.submission.id
    );
  };

  const handleReorderDrop = (
    targetId: string,
    scopeRowIds: readonly string[]
  ) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const baseGlobalOrder = resolveCurrentGlobalOrderSnapshot();
    const updatedOrder = reorderWithinScope(
      baseGlobalOrder,
      scopeRowIds,
      draggedId,
      targetId
    );
    setManualOrderIds(updatedOrder);
    writeStoredManualOrder(updatedOrder);
    setSortMode("manual");
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleNudgeRow = (
    movingId: string,
    direction: "up" | "down",
    scopeRowIds: readonly string[]
  ) => {
    const baseGlobalOrder = resolveCurrentGlobalOrderSnapshot();
    const updatedOrder = nudgeWithinScope(
      baseGlobalOrder,
      scopeRowIds,
      movingId,
      direction
    );
    setManualOrderIds(updatedOrder);
    writeStoredManualOrder(updatedOrder);
    setSortMode("manual");
  };

  const handleResetManualOrder = () => {
    const defaultOrder = [...submissions]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => s.id);
    setManualOrderIds(defaultOrder);
    writeStoredManualOrder(defaultOrder);
    setSortMode("manual");
  };

  const handleSeedManualFromCombined = () => {
    const byScoreOrder = sortOverviewRows(
      allRows,
      "combined_desc",
      manualOrderIds
    ).map((r) => r.submission.id);
    setManualOrderIds(byScoreOrder);
    writeStoredManualOrder(byScoreOrder);
    setSortMode("manual");
  };

  const toggleColumnSort = (
    metric: "combined" | "score" | "fitness" | "reviews"
  ) => {
    if (metric === "reviews") {
      setSortMode("reviews_desc");
      return;
    }
    const descMode: OverviewSortMode = `${metric}_desc`;
    const ascMode: OverviewSortMode = `${metric}_asc`;
    setSortMode((prev) => (prev === descMode ? ascMode : descMode));
  };

  const renderSortIcon = (metric: "combined" | "score" | "fitness" | "reviews") => {
    if (metric === "reviews") {
      return sortMode === "reviews_desc" ? (
        <ArrowDown size={13} className="text-primary shrink-0" />
      ) : (
        <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
      );
    }
    if (sortMode === `${metric}_desc`) {
      return <ArrowDown size={13} className="text-primary shrink-0" />;
    }
    if (sortMode === `${metric}_asc`) {
      return <ArrowUp size={13} className="text-primary shrink-0" />;
    }
    return <ArrowUpDown size={13} className="text-slate-400 shrink-0" />;
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
      setPreviewNotice(res.reason);
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
        secondaryEmail={sub.secondaryEmail}
        presentationFormat={sub.presentationFormat}
        researchTrack={sub.researchTrack}
        studentTravelAwardApplicant={sub.studentTravelAwardApplicant}
        synopsis={sub.summary}
        abstractText={sub.abstractText || sub.summary}
        keywords={sub.keywords}
        presenterBio={sub.presenterBio}
        graphicUrl={graphicUrl}
        graphicMeta={sub.graphic || null}
        graphicCaption={sub.graphic?.caption}
        figureWidthInches={sub.graphic?.widthInches}
        modeLabel={`Reviewer Inspection — ${sub.id}`}
        onClose={() => setActivePreview(null)}
      />
    );
  }

  const colCount = groupByTrack ? 7 : 8;

  const renderAbstractRowAndDrawer = (
    row: AbstractOverviewRow,
    displayIndex: number,
    scopeRowIds: readonly string[]
  ) => {
    const { submission: sub, summary } = row;
    const isExpanded = Boolean(expandedIds[sub.id]);
    const scopeIdx = scopeRowIds.indexOf(sub.id);
    const isFirstInScope = scopeIdx <= 0;
    const isLastInScope =
      scopeIdx === -1 || scopeIdx >= scopeRowIds.length - 1;
    const isDragging = draggedId === sub.id;
    const isDragOver = dragOverId === sub.id && draggedId !== sub.id;

    return (
      <React.Fragment key={sub.id}>
        <tr
          draggable
          onDragStart={(e) => {
            setDraggedId(sub.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", sub.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== sub.id) {
              setDragOverId(sub.id);
            }
          }}
          onDragLeave={() => {
            if (dragOverId === sub.id) {
              setDragOverId(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleReorderDrop(sub.id, scopeRowIds);
          }}
          onDragEnd={() => {
            setDraggedId(null);
            setDragOverId(null);
          }}
          onClick={() => handleToggleExpand(sub.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggleExpand(sub.id);
            }
          }}
          tabIndex={0}
          aria-expanded={isExpanded}
          className={`group cursor-pointer transition-colors border-b border-slate-200/80 focus:outline-none focus-visible:bg-sky-50/70 ${
            isDragging
              ? "opacity-50 bg-sky-50"
              : isDragOver
              ? "bg-primary/10 ring-2 ring-inset ring-primary/40"
              : isExpanded
              ? "bg-sky-50/50"
              : "hover:bg-slate-50/90"
          }`}
        >
          {/* Manual Order / Rank Column */}
          <td
            className="px-3 py-3.5 align-top whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              <span
                title="Drag row to manually reorder"
                className="text-slate-400 group-hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5 rounded"
              >
                <GripVertical size={14} />
              </span>
              <span className="tabular-nums text-xs font-bold text-slate-600 w-5 text-center">
                {displayIndex + 1}
              </span>
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={isFirstInScope}
                  onClick={() => handleNudgeRow(sub.id, "up", scopeRowIds)}
                  title="Move up in manual order"
                  aria-label={`Move ${sub.id} up`}
                  className="p-0.5 rounded text-slate-500 hover:text-primary hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={isLastInScope}
                  onClick={() => handleNudgeRow(sub.id, "down", scopeRowIds)}
                  title="Move down in manual order"
                  aria-label={`Move ${sub.id} down`}
                  className="p-0.5 rounded text-slate-500 hover:text-primary hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>
          </td>

          {/* Abstract Metadata & Title */}
          <td className="px-3 py-3.5 align-top min-w-[260px] max-w-md">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="tabular-nums text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {sub.id}
              </span>
              <span className="text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                {sub.presentationFormat}
              </span>
              {sub.studentTravelAwardApplicant && (
                <span
                  title="Student Travel Award Applicant"
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded"
                >
                  <GraduationCap size={11} /> Award
                </span>
              )}
            </div>
            <div className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
              <ScientificText text={sub.title} />
            </div>
            <div className="text-xs text-slate-600 mt-0.5 truncate">
              <strong className="font-semibold text-slate-800">
                {sub.presentingAuthor}
              </strong>{" "}
              <span className="text-slate-500">• {sub.affiliation}</span>
            </div>
          </td>

          {/* Track (shown when ungrouped) */}
          {!groupByTrack && (
            <td className="px-3 py-3.5 align-top min-w-[160px] max-w-[210px]">
              <span className="inline-block text-[11px] font-medium bg-sky-50 text-sky-900 border border-sky-200 px-2 py-1 rounded-md leading-tight">
                {sub.researchTrack}
              </span>
            </td>
          )}

          {/* Review Count */}
          <td className="px-3 py-3.5 align-top text-center whitespace-nowrap">
            <span className="inline-flex items-center justify-center min-w-[2rem] tabular-nums text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {summary.reviewCount}
            </span>
          </td>

          {/* Median Scientific Score */}
          <td className="px-3 py-3.5 align-top text-center whitespace-nowrap">
            <span
              className={`inline-block tabular-nums text-xs font-bold px-2.5 py-1 rounded-full border ${scoreToneClass(
                summary.medianScore
              )}`}
            >
              {formatMedianScore(summary.medianScore)}
            </span>
          </td>

          {/* Median HEMS Fitness */}
          <td className="px-3 py-3.5 align-top text-center whitespace-nowrap">
            <span
              className={`inline-block tabular-nums text-xs font-bold px-2.5 py-1 rounded-full border ${scoreToneClass(
                summary.medianHemsFitness
              )}`}
            >
              {formatMedianScore(summary.medianHemsFitness)}
            </span>
          </td>

          {/* Combined Median */}
          <td className="px-3 py-3.5 align-top text-center whitespace-nowrap">
            <span
              className={`inline-block tabular-nums text-xs font-black px-2.5 py-1 rounded-full border ${scoreToneClass(
                summary.medianCombined
              )}`}
            >
              {formatMedianScore(summary.medianCombined)}
            </span>
          </td>

          {/* Recommendations Summary & Expand Chevron */}
          <td className="px-3 py-3.5 align-top min-w-[190px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {summary.reviewCount === 0 ? (
                  <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    Pending Review
                  </span>
                ) : (
                  RECOMMENDATION_PRIORITY.filter(
                    (key) => summary.recommendationCounts[key] > 0
                  ).map((key) => (
                    <span
                      key={key}
                      className={`tabular-nums text-[11px] font-semibold border px-2 py-0.5 rounded-full ${DECISION_BADGE_CLASSES[key]}`}
                    >
                      {summary.recommendationCounts[key]}{" "}
                      {RECOMMENDATION_SHORT_LABEL[key]}
                    </span>
                  ))
                )}
              </div>
              <span className="text-slate-400 group-hover:text-primary shrink-0">
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
            </div>
          </td>
        </tr>

        {/* Expanded Summary of Scores & Reviews */}
        {isExpanded && (
          <tr className="bg-[#F4F7FB] border-b border-slate-200">
            <td colSpan={colCount} className="p-4 sm:p-6">
              <div className="space-y-5">
                {/* Summary Strip & Quick Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Median Sci. Score
                      </div>
                      <div className="text-lg font-black tabular-nums text-slate-900">
                        {formatMedianScore(summary.medianScore)}
                        <span className="text-xs font-medium text-slate-400">
                          /10
                        </span>
                      </div>
                      {summary.minScore !== null && summary.maxScore !== null && (
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Range: {summary.minScore.toFixed(1)} –{" "}
                          {summary.maxScore.toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Median HEMS Fitness
                      </div>
                      <div className="text-lg font-black tabular-nums text-slate-900">
                        {formatMedianScore(summary.medianHemsFitness)}
                        <span className="text-xs font-medium text-slate-400">
                          /10
                        </span>
                      </div>
                      {summary.minHemsFitness !== null &&
                        summary.maxHemsFitness !== null && (
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            Range: {summary.minHemsFitness.toFixed(1)} –{" "}
                            {summary.maxHemsFitness.toFixed(1)}
                          </div>
                        )}
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Combined Median
                      </div>
                      <div className="text-lg font-black tabular-nums text-primary">
                        {formatMedianScore(summary.medianCombined)}
                        <span className="text-xs font-medium text-slate-400">
                          /10
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {summary.reviewCount}{" "}
                        {summary.reviewCount === 1 ? "review" : "reviews"} logged
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Consensus Standing
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${decisionPillClass(
                            summary.consensusDecision
                          )}`}
                        >
                          {summary.consensusDecision}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {summary.recommendationSummaryText}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleInspectAbstract(sub);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>View 1-Page Abstract</span>
                    </button>
                    <Link
                      href={`/reviewer?abstract=${encodeURIComponent(sub.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-sky-800 transition-colors"
                    >
                      <ClipboardCheck size={13} />
                      <span>Evaluate in Reviewer Panel</span>
                    </Link>
                  </div>
                </div>

                {/* Synopsis Context */}
                {sub.summary && (
                  <div className="text-xs text-slate-600 bg-white/90 border border-slate-200/80 rounded-xl px-4 py-3 space-y-1">
                    <div>
                      <strong className="text-slate-800">Synopsis:</strong>{" "}
                      <ScientificText text={sub.summary} />
                    </div>
                    {sub.keywords && (
                      <div className="text-[11px] text-slate-500">
                        <strong className="text-slate-700">Keywords:</strong>{" "}
                        {sub.keywords}
                      </div>
                    )}
                  </div>
                )}

                {/* Individual Reviewer Evaluations */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users size={13} className="text-primary" />
                      Committee Scorecards &amp; Confidential Notes (
                      {summary.reviews.length})
                    </h4>
                  </div>

                  {summary.reviews.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-5 text-center space-y-2">
                      <p className="text-xs text-slate-600">
                        No reviews have been submitted for{" "}
                        <strong className="text-slate-900">{sub.id}</strong> yet.
                      </p>
                      <Link
                        href={`/reviewer?abstract=${encodeURIComponent(sub.id)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        Be the first to evaluate this abstract →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {summary.reviews.map((rev) => {
                        const isMine =
                          rev.reviewerEmail.toLowerCase() === normalizedUserEmail;
                        return (
                          <div
                            key={rev.reviewId}
                            className={`rounded-xl border p-4 space-y-2.5 bg-white shadow-2xs ${
                              isMine
                                ? "border-primary/35 ring-1 ring-primary/15"
                                : "border-slate-200/90"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {rev.reviewerName || rev.reviewerEmail}
                                  </span>
                                  {isMine && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {rev.reviewerEmail} • Updated{" "}
                                  {formatShortDate(rev.updatedAt)}
                                </div>
                              </div>

                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${decisionPillClass(
                                  rev.decision
                                )}`}
                              >
                                {rev.decision}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="tabular-nums font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                Sci. Score:{" "}
                                <strong>{rev.score.toFixed(1)}/10</strong>
                              </span>
                              <span className="tabular-nums font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">
                                HEMS Fitness:{" "}
                                <strong>{rev.hemsFitness.toFixed(1)}/10</strong>
                              </span>
                            </div>

                            {rev.reviewerComments ? (
                              <p className="text-xs text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">
                                  Committee Comments:
                                </strong>{" "}
                                {rev.reviewerComments}
                              </p>
                            ) : (
                              <p className="text-[11px] italic text-slate-400">
                                No committee comments recorded.
                              </p>
                            )}

                            {rev.privateNotes && (
                              <div className="flex items-start gap-2 rounded-lg bg-amber-50/70 border border-amber-200/90 px-3 py-2 text-xs text-amber-950">
                                <Lock
                                  size={13}
                                  className="text-amber-700 shrink-0 mt-0.5"
                                />
                                <div>
                                  <strong className="text-amber-900">
                                    Reviewer-Only Notes:
                                  </strong>{" "}
                                  {rev.privateNotes}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
            Program Committee • Calibration &amp; Triage
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-3">
            <TableProperties className="text-primary shrink-0" /> Abstract
            Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tabulated abstract medians across all committee evaluations. Click any
            abstract row to inspect full scores, recommendations, and
            confidential reviewer notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <Link
            href="/reviewer"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <ClipboardCheck size={13} /> Reviewer Panel
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={listLoading}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={
                listLoading ? "animate-spin text-primary" : "text-primary"
              }
            />
            Refresh
          </button>
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold text-primary break-all">
            Reviewer: {user.email}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-foreground/10 p-5 rounded-2xl flex items-center gap-3.5">
          <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {kpis.totalAbstracts}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Submitted Abstracts
            </div>
          </div>
        </div>

        <div className="bg-background border border-foreground/10 p-5 rounded-2xl flex items-center gap-3.5">
          <div className="bg-emerald-500/10 text-emerald-700 p-3 rounded-xl shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {kpis.reviewedAbstracts}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Reviewed ({kpis.totalReviewsLogged} total reviews)
            </div>
          </div>
        </div>

        <div className="bg-background border border-foreground/10 p-5 rounded-2xl flex items-center gap-3.5">
          <div className="bg-sky-500/10 text-sky-700 p-3 rounded-xl shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {formatMedianScore(kpis.overallMedianScore)}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Cohort Med. Sci. Score
            </div>
          </div>
        </div>

        <div className="bg-background border border-foreground/10 p-5 rounded-2xl flex items-center gap-3.5">
          <div className="bg-teal-500/10 text-teal-700 p-3 rounded-xl shrink-0">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <div className="text-2xl tabular-nums font-black text-foreground">
              {formatMedianScore(kpis.overallMedianFitness)}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
              Cohort Med. HEMS Fitness
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Sort Mode (Score vs Manual), Group by Track */}
      <div className="bg-white border border-slate-200/95 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-80">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, presenter, keyword, ID..."
              aria-label="Search abstract overview"
              className="hems-control w-full rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Sort Mode Buttons */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() =>
                  setSortMode((prev) =>
                    prev === "manual" ? "combined_desc" : prev
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  sortMode !== "manual"
                    ? "bg-white text-primary shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpDown size={13} />
                <span>Sort by Score</span>
              </button>
              <button
                type="button"
                onClick={() => setSortMode("manual")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  sortMode === "manual"
                    ? "bg-white text-primary shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListOrdered size={13} />
                <span>Manual Order</span>
              </button>
            </div>

            {/* Granular Score Sort Metric Selector */}
            <select
              value={sortMode}
              onChange={(e) =>
                setSortMode(e.target.value as OverviewSortMode)
              }
              aria-label="Sort abstract overview rows"
              className="hems-control text-xs font-semibold py-2 px-3 rounded-xl"
            >
              <option value="combined_desc">
                Combined Median (High → Low)
              </option>
              <option value="combined_asc">
                Combined Median (Low → High)
              </option>
              <option value="score_desc">
                Median Sci. Score (High → Low)
              </option>
              <option value="score_asc">
                Median Sci. Score (Low → High)
              </option>
              <option value="fitness_desc">
                Median HEMS Fitness (High → Low)
              </option>
              <option value="fitness_asc">
                Median HEMS Fitness (Low → High)
              </option>
              <option value="reviews_desc">Review Count (High → Low)</option>
              <option value="manual">Manual Committee Order</option>
            </select>

            {/* Group by Track Toggle */}
            <button
              type="button"
              onClick={() => setGroupByTrack((prev) => !prev)}
              aria-pressed={groupByTrack}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                groupByTrack
                  ? "bg-primary text-white border-primary shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary"
              }`}
            >
              <Layers size={13} />
              <span>Group by Track</span>
            </button>

            {sortedRows.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAllExpanded}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {anyExpanded ? "Collapse All" : "Expand All"}
              </button>
            )}
          </div>
        </div>

        {/* Manual Reorder Utility Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11.5px] text-slate-600">
          <span>
            {sortMode === "manual"
              ? "Manual Order active: drag any row handle or click ↑ / ↓ arrows to reorder priorities."
              : "Tip: Click any row to expand review details, or drag / nudge a row with ↑ ↓ to switch into custom Manual Order."}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {sortMode !== "manual" ? (
              <button
                type="button"
                onClick={handleSeedManualFromCombined}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Snapshot current score ranking into Manual Order
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetManualOrder}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Default ID Order
              </button>
            )}
          </div>
        </div>
      </div>

      {previewNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-xs">
          {previewNotice}
        </div>
      )}

      {/* Main Abstract Overview Table */}
      <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-3 whitespace-nowrap">Order</th>
                <th className="px-3 py-3">Abstract</th>
                {!groupByTrack && <th className="px-3 py-3">Research Track</th>}
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("reviews")}
                    className="inline-flex items-center gap-1 hover:text-primary cursor-pointer uppercase tracking-wider font-bold"
                  >
                    <span>Reviews</span>
                    {renderSortIcon("reviews")}
                  </button>
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("score")}
                    className="inline-flex items-center gap-1 hover:text-primary cursor-pointer uppercase tracking-wider font-bold"
                  >
                    <span>Median Sci.</span>
                    {renderSortIcon("score")}
                  </button>
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("fitness")}
                    className="inline-flex items-center gap-1 hover:text-primary cursor-pointer uppercase tracking-wider font-bold"
                  >
                    <span>Median HEMS Fit.</span>
                    {renderSortIcon("fitness")}
                  </button>
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("combined")}
                    className="inline-flex items-center gap-1 hover:text-primary cursor-pointer uppercase tracking-wider font-bold"
                  >
                    <span>Combined Med.</span>
                    {renderSortIcon("combined")}
                  </button>
                </th>
                <th className="px-3 py-3">Recommendations Summary</th>
              </tr>
            </thead>

            <tbody>
              {listLoading && submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="p-10 text-center text-xs text-slate-500"
                  >
                    Loading submitted abstracts and committee reviews...
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="p-10 text-center text-xs text-slate-500"
                  >
                    No submitted abstracts match your current search filter.
                  </td>
                </tr>
              ) : groupByTrack ? (
                trackGroups.map((group) => {
                  const groupIds = group.rows.map((r) => r.submission.id);
                  return (
                    <React.Fragment key={group.track}>
                      <tr className="bg-slate-100/90 border-b border-slate-200">
                        <td colSpan={colCount} className="px-4 py-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Layers size={14} className="text-primary shrink-0" />
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {group.track}
                              </span>
                              <span className="tabular-nums text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                {group.rows.length}{" "}
                                {group.rows.length === 1
                                  ? "abstract"
                                  : "abstracts"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 tabular-nums">
                              <span>
                                Track Med. Sci:{" "}
                                <strong className="text-slate-900">
                                  {formatMedianScore(group.medianScore)}
                                </strong>
                              </span>
                              <span>•</span>
                              <span>
                                Track Med. HEMS:{" "}
                                <strong className="text-slate-900">
                                  {formatMedianScore(group.medianHemsFitness)}
                                </strong>
                              </span>
                              <span>•</span>
                              <span>
                                Combined:{" "}
                                <strong className="text-primary">
                                  {formatMedianScore(group.medianCombined)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {group.rows.map((row, idx) =>
                        renderAbstractRowAndDrawer(row, idx, groupIds)
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                sortedRows.map((row, idx) =>
                  renderAbstractRowAndDrawer(
                    row,
                    idx,
                    sortedRows.map((r) => r.submission.id)
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

