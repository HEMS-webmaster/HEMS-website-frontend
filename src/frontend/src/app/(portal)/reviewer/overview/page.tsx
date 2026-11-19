"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Eye,
  GraduationCap,
  GripVertical,
  Layers,
  ListOrdered,
  Lock,
  Mail,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  TableProperties,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import {
  SelectionConflictInfo,
  useAbstractSubmissions,
} from "@/hooks/useAbstractSubmissions";
import {
  AbstractSubmissionRecord,
  CommitteeSelection,
  ReviewDecision,
} from "@/types/abstractSubmission";
import { hasReviewerRole } from "@/utils/telemetryClient";
import {
  AbstractOverviewRow,
  classifySubmissionCohort,
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
  resolveEffectiveTrack,
  resolveOfficialSelection,
  sortOverviewRows,
  summarizeSubmissionReviews,
} from "@/utils/abstractReviewMetrics";
import {
  buildHemsResponseEmail,
  formatCommitteeSelectionLabel,
} from "@/utils/hemsResponseEmail";
import ScientificText from "@/components/workshop/ScientificText";
import AbstractOnePagePreview from "@/components/workshop/AbstractOnePagePreview";

const MANUAL_ORDER_STORAGE_KEY = "hems_reviewer_abstract_manual_order_v1";

type OverviewFilterMode =
  | "all"
  | "accept_oral"
  | "accept_poster"
  | "decline"
  | "pending"
  | "corporate"
  | "student";

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

const SELECTION_CONTROL_CLASSES: Record<CommitteeSelection, string> = {
  pending: "bg-white border-slate-300 text-slate-700",
  accept_oral: "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold",
  accept_poster: "bg-sky-50 border-sky-400 text-sky-900 font-bold",
  decline: "bg-rose-50 border-rose-400 text-rose-900 font-bold",
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

function formatFormatShort(fmt: string): string {
  if (fmt.startsWith("Oral")) return "Oral";
  if (fmt.startsWith("Poster")) return "Poster";
  if (fmt.startsWith("Either")) return "Either";
  return fmt;
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

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall back to execCommand below
    }
  }
  if (typeof document !== "undefined") {
    try {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
  return false;
}

export default function ReviewerAbstractOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { workshop } = useUpcomingWorkshop();
  const {
    submissions,
    reviews,
    loading: listLoading,
    liveSyncActive,
    refresh,
    updateCommitteeSelection,
    getGraphicPreviewUrl,
    openSubmissionPdf,
  } = useAbstractSubmissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<OverviewFilterMode>("all");
  const [sortMode, setSortMode] = useState<OverviewSortMode>("combined_desc");
  const [groupByTrack, setGroupByTrack] = useState<boolean>(false);
  const [manualOrderIds, setManualOrderIds] = useState<string[]>(() =>
    readStoredManualOrder()
  );
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const [updatingSelectionId, setUpdatingSelectionId] = useState<string | null>(null);
  const [conflictModal, setConflictModal] = useState<SelectionConflictInfo | null>(
    null
  );
  const [resolvingConflict, setResolvingConflict] = useState(false);

  // HEMS Response Email Popup Modal State
  const [emailModalSubId, setEmailModalSubId] = useState<string | null>(null);
  const [emailModalSelection, setEmailModalSelection] =
    useState<CommitteeSelection>("pending");
  const [emailAddressText, setEmailAddressText] = useState<string>("");
  const [emailSubjectText, setEmailSubjectText] = useState<string>("");
  const [emailBodyText, setEmailBodyText] = useState<string>("");
  const [copiedField, setCopiedField] = useState<"address" | "body" | null>(null);

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
    return allRows.filter(({ submission, summary }) => {
      const sel = resolveOfficialSelection(submission);
      const cohort = classifySubmissionCohort(submission);

      if (filterMode === "accept_oral" && sel !== "accept_oral") return false;
      if (filterMode === "accept_poster" && sel !== "accept_poster") return false;
      if (filterMode === "decline" && sel !== "decline") return false;
      if (filterMode === "pending" && sel !== "pending") return false;
      if (filterMode === "corporate" && !cohort.isCorporate) return false;
      if (filterMode === "student" && !cohort.isStudent) return false;

      if (!q) return true;
      const effTrack = resolveEffectiveTrack(submission, summary);
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
        effTrack,
        submission.presentationFormat,
        cohort.isCorporate ? "corporate industry sponsor" : "",
        cohort.isStudent ? "student award" : "",
        submission.summary,
        submission.keywords || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allRows, searchQuery, filterMode]);

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
    let acceptOral = 0;
    let acceptPoster = 0;
    let decline = 0;
    let pendingSel = 0;
    let corporate = 0;
    let student = 0;

    for (const r of allRows) {
      const sel = resolveOfficialSelection(r.submission);
      if (sel === "accept_oral") acceptOral += 1;
      else if (sel === "accept_poster") acceptPoster += 1;
      else if (sel === "decline") decline += 1;
      else pendingSel += 1;

      const cohort = classifySubmissionCohort(r.submission);
      if (cohort.isCorporate) corporate += 1;
      if (cohort.isStudent) student += 1;
    }

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
      acceptOral,
      acceptPoster,
      decline,
      pendingSel,
      corporate,
      student,
      overallMedianScore,
      overallMedianFitness,
    };
  }, [allRows]);

  const emailModalSubmission = useMemo(
    () =>
      emailModalSubId
        ? submissions.find((s) => s.id === emailModalSubId) || null
        : null,
    [emailModalSubId, submissions]
  );

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 mt-4">Verifying credentials...</p>
      </div>
    );
  }

  if (!user || !hasReviewerRole(user.roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
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
        <ArrowDown size={11} className="text-primary shrink-0" />
      ) : (
        <ArrowUpDown size={11} className="text-slate-400 shrink-0" />
      );
    }
    if (sortMode === `${metric}_desc`) {
      return <ArrowDown size={11} className="text-primary shrink-0" />
    }
    if (sortMode === `${metric}_asc`) {
      return <ArrowUp size={11} className="text-primary shrink-0" />;
    }
    return <ArrowUpDown size={11} className="text-slate-400 shrink-0" />;
  };

  const handleSelectionChange = async (
    sub: AbstractSubmissionRecord,
    nextSelection: CommitteeSelection
  ) => {
    setPreviewNotice(null);
    setUpdatingSelectionId(sub.id);
    try {
      const result = await updateCommitteeSelection({
        id: sub.id,
        selection: nextSelection,
        expectedVersion: sub.selectionVersion ?? 0,
      });
      if (!result.ok) {
        setConflictModal(result.conflict);
      }
    } catch (err) {
      setPreviewNotice(
        err instanceof Error ? err.message : "Failed to save committee Selection."
      );
    } finally {
      setUpdatingSelectionId(null);
    }
  };

  const handleResolveConflictOverride = async () => {
    if (!conflictModal) return;
    setResolvingConflict(true);
    try {
      await updateCommitteeSelection({
        id: conflictModal.submissionId,
        selection: conflictModal.attemptedSelection,
        expectedVersion: conflictModal.remoteRecord.selectionVersion ?? 0,
        forceOverride: true,
      });
      setConflictModal(null);
    } catch (err) {
      setPreviewNotice(
        err instanceof Error ? err.message : "Failed to override selection."
      );
    } finally {
      setResolvingConflict(false);
    }
  };

  const handleOpenEmailModal = (
    sub: AbstractSubmissionRecord,
    effectiveTrack: string
  ) => {
    const sel = resolveOfficialSelection(sub);
    const prepared = buildHemsResponseEmail(sub, sel, workshop, effectiveTrack);
    setEmailModalSubId(sub.id);
    setEmailModalSelection(sel);
    setEmailAddressText(prepared.formattedRecipient);
    setEmailSubjectText(prepared.subject);
    setEmailBodyText(prepared.body);
    setCopiedField(null);
  };

  const handleChangeModalTemplateSelection = async (
    nextSelection: CommitteeSelection
  ) => {
    if (!emailModalSubmission) return;
    setEmailModalSelection(nextSelection);
    const rowSummary = allRows.find(
      (r) => r.submission.id === emailModalSubmission.id
    )?.summary;
    const effTrack = resolveEffectiveTrack(emailModalSubmission, rowSummary);
    const prepared = buildHemsResponseEmail(
      emailModalSubmission,
      nextSelection,
      workshop,
      effTrack
    );
    setEmailSubjectText(prepared.subject);
    setEmailBodyText(prepared.body);
    setCopiedField(null);

    if (resolveOfficialSelection(emailModalSubmission) !== nextSelection) {
      await handleSelectionChange(emailModalSubmission, nextSelection);
    }
  };

  const handleCopyField = async (kind: "address" | "body", value: string) => {
    const ok = await copyTextToClipboard(value);
    if (ok) {
      setCopiedField(kind);
      window.setTimeout(() => {
        setCopiedField((curr) => (curr === kind ? null : curr));
      }, 2000);
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
        presenterCategory={sub.presenterCategory}
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

  const colCount = groupByTrack ? 10 : 11;

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

    const cohort = classifySubmissionCohort(sub);
    const currentSelection = resolveOfficialSelection(sub);
    const effectiveTrack = resolveEffectiveTrack(sub, summary);
    const trackReassigned = effectiveTrack !== sub.researchTrack;
    const isSavingSelection = updatingSelectionId === sub.id;

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
          className={`group cursor-pointer transition-colors border-b border-slate-200/80 text-[11.5px] leading-tight focus:outline-none focus-visible:bg-sky-50/70 ${
            isDragging
              ? "opacity-50 bg-sky-50"
              : isDragOver
              ? "bg-primary/10 ring-2 ring-inset ring-primary/40"
              : isExpanded
              ? "bg-sky-50/55"
              : currentSelection === "decline"
              ? "bg-rose-50/20 hover:bg-rose-50/35"
              : currentSelection === "accept_oral"
              ? "bg-emerald-50/15 hover:bg-emerald-50/30"
              : "hover:bg-slate-50/95"
          }`}
        >
          {/* 1. Manual Order */}
          <td
            className="px-1.5 py-1.5 align-middle whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0.5">
              <span
                title="Drag row to reorder"
                className="text-slate-400 group-hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5"
              >
                <GripVertical size={12} />
              </span>
              <span className="tabular-nums text-[11px] font-bold text-slate-600 w-4 text-center">
                {displayIndex + 1}
              </span>
              <div className="flex flex-col leading-none">
                <button
                  type="button"
                  disabled={isFirstInScope}
                  onClick={() => handleNudgeRow(sub.id, "up", scopeRowIds)}
                  title="Move up"
                  aria-label={`Move ${sub.id} up`}
                  className="p-0 text-slate-500 hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  type="button"
                  disabled={isLastInScope}
                  onClick={() => handleNudgeRow(sub.id, "down", scopeRowIds)}
                  title="Move down"
                  aria-label={`Move ${sub.id} down`}
                  className="p-0 text-slate-500 hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronDown size={11} />
                </button>
              </div>
            </div>
          </td>

          {/* 2. ID, Cohort & Requested Format */}
          <td className="px-2 py-1.5 align-middle whitespace-nowrap">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="tabular-nums text-[11px] font-bold text-primary">
                  {sub.id}
                </span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                  {formatFormatShort(sub.presentationFormat)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {cohort.isCorporate && (
                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold bg-violet-100 text-violet-900 border border-violet-300 px-1 py-0.2 rounded">
                    <Building2 size={9} /> CORP
                  </span>
                )}
                {cohort.isStudent && (
                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold bg-teal-100 text-teal-900 border border-teal-300 px-1 py-0.2 rounded">
                    <GraduationCap size={9} /> {cohort.isStudentAward ? "AWARD" : "STUDENT"}
                  </span>
                )}
              </div>
            </div>
          </td>

          {/* 3. Title & Presenter (High-Density) */}
          <td className="px-2 py-1.5 align-middle min-w-[220px] max-w-[340px]">
            <div
              className="font-semibold text-xs text-slate-900 leading-snug line-clamp-2"
              title={sub.title}
            >
              <ScientificText text={sub.title} />
            </div>
            <div className="text-[11px] text-slate-600 truncate mt-0.5">
              <strong className="font-semibold text-slate-800">
                {sub.presentingAuthor}
              </strong>{" "}
              <span className="text-slate-500">• {sub.affiliation}</span>
            </div>
          </td>

          {/* 4. Track (when ungrouped) */}
          {!groupByTrack && (
            <td className="px-2 py-1.5 align-middle max-w-[165px]">
              <div className="flex flex-col gap-0.5">
                <span className="inline-block text-[10.5px] font-medium bg-sky-50 text-sky-900 border border-sky-200 px-1.5 py-0.5 rounded leading-tight truncate">
                  {effectiveTrack}
                </span>
                {trackReassigned && (
                  <span
                    className="text-[9.5px] font-semibold text-amber-800 truncate"
                    title={`Originally submitted under: ${sub.researchTrack}`}
                  >
                    Rec. (orig: {sub.researchTrack})
                  </span>
                )}
              </div>
            </td>
          )}

          {/* 5. Reviews Count */}
          <td className="px-1.5 py-1.5 align-middle text-center whitespace-nowrap">
            <span className="inline-flex items-center justify-center min-w-[1.5rem] tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {summary.reviewCount}
            </span>
          </td>

          {/* 6. Median Sci */}
          <td className="px-1.5 py-1.5 align-middle text-center whitespace-nowrap">
            <span
              className={`inline-block tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded border ${scoreToneClass(
                summary.medianScore
              )}`}
            >
              {formatMedianScore(summary.medianScore)}
            </span>
          </td>

          {/* 7. Median HEMS Fit */}
          <td className="px-1.5 py-1.5 align-middle text-center whitespace-nowrap">
            <span
              className={`inline-block tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded border ${scoreToneClass(
                summary.medianHemsFitness
              )}`}
            >
              {formatMedianScore(summary.medianHemsFitness)}
            </span>
          </td>

          {/* 8. Combined Median */}
          <td className="px-1.5 py-1.5 align-middle text-center whitespace-nowrap">
            <span
              className={`inline-block tabular-nums text-[11px] font-black px-1.5 py-0.5 rounded border ${scoreToneClass(
                summary.medianCombined
              )}`}
            >
              {formatMedianScore(summary.medianCombined)}
            </span>
          </td>

          {/* 9. Reviewer Vote Tally */}
          <td className="px-2 py-1.5 align-middle whitespace-nowrap">
            <div className="flex flex-wrap items-center gap-1 max-w-[135px]">
              {summary.reviewCount === 0 ? (
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                  Pending
                </span>
              ) : (
                RECOMMENDATION_PRIORITY.filter(
                  (key) => summary.recommendationCounts[key] > 0
                ).map((key) => (
                  <span
                    key={key}
                    className={`tabular-nums text-[10px] font-semibold border px-1.5 py-0.5 rounded ${DECISION_BADGE_CLASSES[key]}`}
                  >
                    {summary.recommendationCounts[key]}{" "}
                    {RECOMMENDATION_SHORT_LABEL[key]}
                  </span>
                ))
              )}
            </div>
          </td>

          {/* 10. Official Selection Dropdown */}
          <td
            className="px-2 py-1.5 align-middle whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-0.5">
              <select
                aria-label={`Official selection for ${sub.id}`}
                disabled={isSavingSelection}
                value={currentSelection}
                onChange={(e) =>
                  void handleSelectionChange(
                    sub,
                    e.target.value as CommitteeSelection
                  )
                }
                className={`text-[11px] rounded-lg border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 ${SELECTION_CONTROL_CLASSES[currentSelection]}`}
              >
                <option value="pending">— Select —</option>
                <option value="accept_oral">Accept to Oral</option>
                <option value="accept_poster">Accept to Poster</option>
                <option value="decline">Decline</option>
              </select>
              {sub.selectionUpdatedBy && (
                <span
                  className="text-[9.5px] text-slate-400 truncate max-w-[130px]"
                  title={`Last set by ${sub.selectionUpdatedBy}${sub.selectionUpdatedAt ? ` (${formatShortDate(sub.selectionUpdatedAt)})` : ""}`}
                >
                  by {sub.selectionUpdatedBy.split("@")[0]}
                </span>
              )}
            </div>
          </td>

          {/* 11. HEMS Response Column (Email Button + Expand Chevron) */}
          <td
            className="px-2 py-1.5 align-middle whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenEmailModal(sub, effectiveTrack)}
                title={`Open prepared HEMS email response popup for ${sub.id}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                  currentSelection === "accept_oral"
                    ? "bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white"
                    : currentSelection === "accept_poster"
                    ? "bg-sky-700 hover:bg-sky-800 border-sky-700 text-white"
                    : currentSelection === "decline"
                    ? "bg-rose-700 hover:bg-rose-800 border-rose-700 text-white"
                    : "bg-white hover:border-primary hover:text-primary border-slate-300 text-slate-700"
                }`}
              >
                <Mail size={11} />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleExpand(sub.id)}
                aria-label={isExpanded ? `Collapse ${sub.id}` : `Expand ${sub.id}`}
                className="p-1 text-slate-400 hover:text-primary cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            </div>
          </td>
        </tr>

        {/* Expanded Summary & Reviewer Scorecards Drawer */}
        {isExpanded && (
          <tr className="bg-[#F4F7FB] border-b border-slate-200">
            <td colSpan={colCount} className="p-3 sm:p-4">
              <div className="space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1 text-xs">
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Med. Sci. Score
                      </div>
                      <div className="text-base font-black tabular-nums text-slate-900">
                        {formatMedianScore(summary.medianScore)}
                        <span className="text-[10px] font-medium text-slate-400">
                          /10
                        </span>
                      </div>
                      {summary.minScore !== null && summary.maxScore !== null && (
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          {summary.minScore.toFixed(1)} – {summary.maxScore.toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Med. HEMS Fit
                      </div>
                      <div className="text-base font-black tabular-nums text-slate-900">
                        {formatMedianScore(summary.medianHemsFitness)}
                        <span className="text-[10px] font-medium text-slate-400">
                          /10
                        </span>
                      </div>
                      {summary.minHemsFitness !== null &&
                        summary.maxHemsFitness !== null && (
                          <div className="text-[10px] text-slate-500 tabular-nums">
                            {summary.minHemsFitness.toFixed(1)} –{" "}
                            {summary.maxHemsFitness.toFixed(1)}
                          </div>
                        )}
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Combined Med
                      </div>
                      <div className="text-base font-black tabular-nums text-primary">
                        {formatMedianScore(summary.medianCombined)}
                        <span className="text-[10px] font-medium text-slate-400">
                          /10
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {summary.reviewCount} scored
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Reviewer Tallies
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${decisionPillClass(
                            summary.consensusDecision
                          )}`}
                        >
                          {summary.recommendationSummaryText}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Official Selection
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {formatCommitteeSelectionLabel(currentSelection)}
                      </div>
                      {sub.selectionUpdatedBy && (
                        <div className="text-[10px] text-slate-500 truncate">
                          {sub.selectionUpdatedBy}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleInspectAbstract(sub);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:border-primary hover:text-primary cursor-pointer"
                    >
                      <Eye size={12} /> 1-Page Abstract
                    </button>
                    <Link
                      href={`/reviewer?abstract=${encodeURIComponent(sub.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-sky-800"
                    >
                      <ClipboardCheck size={12} /> Open in Reviewer Panel
                    </Link>
                  </div>
                </div>

                {sub.summary && (
                  <div className="text-xs text-slate-600 bg-white/95 border border-slate-200/80 rounded-lg px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
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

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users size={12} className="text-primary" />
                    Committee Scorecards &amp; Confidential Notes (
                    {summary.allReviewerRecords.length})
                  </h4>

                  {summary.allReviewerRecords.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-lg p-3 text-center text-xs text-slate-600">
                      No reviews submitted for <strong>{sub.id}</strong> yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {summary.allReviewerRecords.map((rev) => {
                        const isMine =
                          rev.reviewerEmail.toLowerCase() === normalizedUserEmail;
                        return (
                          <div
                            key={rev.reviewId}
                            className={`rounded-lg border p-3 space-y-1.5 bg-white text-xs ${
                              isMine
                                ? "border-primary/40 ring-1 ring-primary/15"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-900 truncate">
                                    {rev.reviewerName || rev.reviewerEmail}
                                  </span>
                                  {isMine && (
                                    <span className="text-[9.5px] font-bold uppercase px-1 py-0.2 rounded bg-primary/10 text-primary">
                                      You
                                    </span>
                                  )}
                                  {rev.isCompleted && (
                                    <span className="text-[9.5px] font-bold uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                      Done
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10.5px] text-slate-500 truncate">
                                  {rev.reviewerEmail} •{" "}
                                  {formatShortDate(rev.updatedAt)}
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${decisionPillClass(
                                  rev.decision
                                )}`}
                              >
                                {rev.decision}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="tabular-nums font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                Sci:{" "}
                                <strong>
                                  {typeof rev.score === "number"
                                    ? `${rev.score.toFixed(1)}/10`
                                    : "—"}
                                </strong>
                              </span>
                              <span className="tabular-nums font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
                                Fit:{" "}
                                <strong>
                                  {typeof rev.hemsFitness === "number"
                                    ? `${rev.hemsFitness.toFixed(1)}/10`
                                    : "—"}
                                </strong>
                              </span>
                              {rev.recommendedTrack && (
                                <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
                                  Track: <strong>{rev.recommendedTrack}</strong>
                                </span>
                              )}
                            </div>

                            {rev.reviewerComments && (
                              <p className="text-[11px] text-slate-700 leading-snug">
                                <strong className="text-slate-900">
                                  Comments:
                                </strong>{" "}
                                {rev.reviewerComments}
                              </p>
                            )}

                            {rev.privateNotes && (
                              <div className="flex items-start gap-1.5 rounded bg-amber-50/75 border border-amber-200 px-2 py-1 text-[11px] text-amber-950">
                                <Lock
                                  size={11}
                                  className="text-amber-700 shrink-0 mt-0.5"
                                />
                                <div>
                                  <strong>Notes:</strong> {rev.privateNotes}
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
    <div className="space-y-3 w-full min-w-0">
      {/* Compact Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Program Committee • High-Density Calibration &amp; Selection Triage
            </span>
            {liveSyncActive ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Radio size={10} className="animate-pulse" /> Real-Time Cloud Conflict Guard Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                <Radio size={10} /> Live Tab Sync Active
              </span>
            )}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <TableProperties className="text-primary shrink-0" size={20} /> Abstract Overview &amp; Committee Selection
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/reviewer"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          >
            <ClipboardCheck size={13} /> Reviewer Panel
          </Link>
          <Link
            href="/reviewer/schedule"
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <Calendar size={13} /> Build Schedule
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={listLoading}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={listLoading ? "animate-spin text-primary" : "text-primary"}
            />
            Refresh
          </button>
          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold text-primary truncate max-w-[220px]">
            {user.email}
          </div>
        </div>
      </div>

      {/* Compact Single-Line KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-slate-500">Abstracts</div>
          <div className="text-base font-black tabular-nums text-slate-900">
            {kpis.totalAbstracts}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-slate-500">Reviewed</div>
          <div className="text-base font-black tabular-nums text-slate-900">
            {kpis.reviewedAbstracts}{" "}
            <span className="text-[10px] font-medium text-slate-500">
              ({kpis.totalReviewsLogged})
            </span>
          </div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-emerald-800">
            Oral Selected
          </div>
          <div className="text-base font-black tabular-nums text-emerald-900">
            {kpis.acceptOral}
          </div>
        </div>
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-sky-800">
            Poster Selected
          </div>
          <div className="text-base font-black tabular-nums text-sky-900">
            {kpis.acceptPoster}
          </div>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-rose-800">Declined</div>
          <div className="text-base font-black tabular-nums text-rose-900">
            {kpis.decline}
          </div>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-amber-800">Unselected</div>
          <div className="text-base font-black tabular-nums text-amber-900">
            {kpis.pendingSel}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-slate-500">Cohort Med Sci</div>
          <div className="text-base font-black tabular-nums text-slate-900">
            {formatMedianScore(kpis.overallMedianScore)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-slate-500">Cohort Med Fit</div>
          <div className="text-base font-black tabular-nums text-slate-900">
            {formatMedianScore(kpis.overallMedianFitness)}
          </div>
        </div>
      </div>

      {/* Dense Filter, Sort & Grouping Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, presenter, ID, track..."
                aria-label="Search abstract overview"
                className="hems-control w-full rounded-lg pl-8 pr-2.5 py-1.5 text-xs"
              />
            </div>

            {(
              [
                { id: "all", label: `All (${kpis.totalAbstracts})` },
                { id: "accept_oral", label: `Oral (${kpis.acceptOral})` },
                { id: "accept_poster", label: `Poster (${kpis.acceptPoster})` },
                { id: "decline", label: `Declined (${kpis.decline})` },
                { id: "pending", label: `Unselected (${kpis.pendingSel})` },
                { id: "corporate", label: `Corp (${kpis.corporate})` },
                { id: "student", label: `Student (${kpis.student})` },
              ] as Array<{ id: OverviewFilterMode; label: string }>
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterMode(pill.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                  filterMode === pill.id
                    ? "bg-primary text-white border-primary"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSortMode("manual")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                sortMode === "manual"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary"
              }`}
            >
              <ListOrdered size={12} /> Manual
            </button>

            <select
              value={sortMode}
              onChange={(e) =>
                setSortMode(e.target.value as OverviewSortMode)
              }
              aria-label="Sort abstract overview rows"
              className="hems-control text-[11px] font-semibold py-1.5 px-2.5 rounded-lg"
            >
              <option value="combined_desc">Combined Med (High → Low)</option>
              <option value="combined_asc">Combined Med (Low → High)</option>
              <option value="score_desc">Med Sci. Score (High → Low)</option>
              <option value="score_asc">Med Sci. Score (Low → High)</option>
              <option value="fitness_desc">Med HEMS Fit (High → Low)</option>
              <option value="fitness_asc">Med HEMS Fit (Low → High)</option>
              <option value="reviews_desc">Reviews (High → Low)</option>
              <option value="manual">Manual Committee Order</option>
            </select>

            <button
              type="button"
              onClick={() => setGroupByTrack((prev) => !prev)}
              aria-pressed={groupByTrack}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                groupByTrack
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary"
              }`}
            >
              <Layers size={12} /> Group by Track
            </button>

            {sortedRows.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAllExpanded}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-primary cursor-pointer"
              >
                {anyExpanded ? "Collapse All" : "Expand All"}
              </button>
            )}

            {sortMode !== "manual" ? (
              <button
                type="button"
                onClick={handleSeedManualFromCombined}
                className="text-[11px] font-semibold text-primary hover:underline px-1.5 cursor-pointer"
              >
                Snapshot Ranking
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetManualOrder}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-primary px-1.5 cursor-pointer"
              >
                <RotateCcw size={11} /> Reset IDs
              </button>
            )}
          </div>
        </div>
      </div>

      {previewNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3.5 py-2 text-xs">
          {previewNotice}
        </div>
      )}

      {/* Ultra-Dense Abstract Overview Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-1.5 py-2 whitespace-nowrap">#</th>
                <th className="px-2 py-2 whitespace-nowrap">ID / Cohort</th>
                <th className="px-2 py-2">Abstract &amp; Presenter</th>
                {!groupByTrack && <th className="px-2 py-2 whitespace-nowrap">Track</th>}
                <th className="px-1.5 py-2 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("reviews")}
                    className="inline-flex items-center gap-0.5 hover:text-primary cursor-pointer uppercase font-bold"
                  >
                    <span>Rev</span>
                    {renderSortIcon("reviews")}
                  </button>
                </th>
                <th className="px-1.5 py-2 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("score")}
                    className="inline-flex items-center gap-0.5 hover:text-primary cursor-pointer uppercase font-bold"
                  >
                    <span>Sci</span>
                    {renderSortIcon("score")}
                  </button>
                </th>
                <th className="px-1.5 py-2 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("fitness")}
                    className="inline-flex items-center gap-0.5 hover:text-primary cursor-pointer uppercase font-bold"
                  >
                    <span>Fit</span>
                    {renderSortIcon("fitness")}
                  </button>
                </th>
                <th className="px-1.5 py-2 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleColumnSort("combined")}
                    className="inline-flex items-center gap-0.5 hover:text-primary cursor-pointer uppercase font-bold"
                  >
                    <span>Comb</span>
                    {renderSortIcon("combined")}
                  </button>
                </th>
                <th className="px-2 py-2 whitespace-nowrap">Votes</th>
                <th className="px-2 py-2 whitespace-nowrap">Selection</th>
                <th className="px-2 py-2 whitespace-nowrap">HEMS Response</th>
              </tr>
            </thead>

            <tbody>
              {listLoading && submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="p-8 text-center text-xs text-slate-500"
                  >
                    Loading submitted abstracts and committee reviews...
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="p-8 text-center text-xs text-slate-500"
                  >
                    No submitted abstracts match your current search or filter.
                  </td>
                </tr>
              ) : groupByTrack ? (
                trackGroups.map((group) => {
                  const groupIds = group.rows.map((r) => r.submission.id);
                  return (
                    <React.Fragment key={group.track}>
                      <tr className="bg-slate-100/95 border-b border-slate-200">
                        <td colSpan={colCount} className="px-3 py-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Layers size={13} className="text-primary shrink-0" />
                              <span className="font-bold text-xs text-slate-900">
                                {group.track}
                              </span>
                              <span className="tabular-nums text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.2 rounded-full">
                                {group.rows.length}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10.5px] text-slate-600 tabular-nums">
                              <span>
                                Sci: <strong>{formatMedianScore(group.medianScore)}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Fit: <strong>{formatMedianScore(group.medianHemsFitness)}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Comb: <strong className="text-primary">{formatMedianScore(group.medianCombined)}</strong>
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

      {/* HEMS Response Prepared Email Modal */}
      {emailModalSubmission && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hems-response-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setEmailModalSubId(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  HEMS Program Committee Notification Composer
                </span>
                <h3
                  id="hems-response-modal-title"
                  className="font-serif text-lg font-bold text-slate-900 truncate"
                >
                  HEMS Response — {emailModalSubmission.id}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Selection template in email composer"
                  value={emailModalSelection}
                  onChange={(e) =>
                    void handleChangeModalTemplateSelection(
                      e.target.value as CommitteeSelection
                    )
                  }
                  className={`text-xs rounded-lg border px-2.5 py-1.5 cursor-pointer ${SELECTION_CONTROL_CLASSES[emailModalSelection]}`}
                >
                  <option value="pending">— Select Decision —</option>
                  <option value="accept_oral">Accept to Oral</option>
                  <option value="accept_poster">Accept to Poster</option>
                  <option value="decline">Decline</option>
                </select>
                <button
                  type="button"
                  onClick={() => setEmailModalSubId(null)}
                  aria-label="Close email popup"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Box 1: Formatted Email Address + 1 Copy Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="hems-email-address-box"
                    className="font-bold uppercase tracking-wider text-[10.5px] text-slate-700"
                  >
                    Formatted Email Address
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyField("address", emailAddressText)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary hover:bg-sky-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedField === "address" ? (
                      <>
                        <Check size={12} /> Copied Email Address
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Email Address
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="hems-email-address-box"
                  type="text"
                  value={emailAddressText}
                  onChange={(e) => setEmailAddressText(e.target.value)}
                  className="hems-control w-full px-3 py-2 text-xs font-mono bg-slate-50 rounded-xl"
                />
                <p className="text-[11px] text-slate-500">
                  Subject reference:{" "}
                  <span className="font-semibold text-slate-700">
                    {emailSubjectText}
                  </span>
                </p>
              </div>

              {/* Box 2: Prepared Email Body + 1 Copy Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="hems-email-body-box"
                    className="font-bold uppercase tracking-wider text-[10.5px] text-slate-700"
                  >
                    Prepared HEMS Response Body (
                    {formatCommitteeSelectionLabel(emailModalSelection)})
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleCopyField("body", emailBodyText)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedField === "body" ? (
                      <>
                        <Check size={12} /> Copied Email Body
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Email Body
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="hems-email-body-box"
                  rows={14}
                  value={emailBodyText}
                  onChange={(e) => setEmailBodyText(e.target.value)}
                  className="hems-control w-full px-3 py-2.5 text-xs leading-relaxed bg-white rounded-xl"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Paste directly into your personal email client&apos;s To: and Body fields.
              </span>
              <button
                type="button"
                onClick={() => setEmailModalSubId(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Concurrent Selection Conflict Resolution Modal */}
      {conflictModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="selection-conflict-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-amber-400 rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3
                  id="selection-conflict-title"
                  className="font-serif text-lg font-bold text-slate-900"
                >
                  Concurrent Reviewer Update Detected
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Another committee reviewer updated{" "}
                  <strong>{conflictModal.submissionId}</strong> while your
                  change was in flight. Choose which Selection to keep:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Colleague&apos;s Latest Saved Selection
                </div>
                <div className="font-bold text-sm text-emerald-950">
                  {formatCommitteeSelectionLabel(
                    resolveOfficialSelection(conflictModal.remoteRecord)
                  )}
                </div>
                <div className="text-[11px] text-emerald-800">
                  By{" "}
                  {conflictModal.remoteRecord.selectionUpdatedBy ||
                    "fellow reviewer"}
                </div>
              </div>

              <div className="rounded-xl border border-sky-300 bg-sky-50/70 p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  Your Attempted Selection
                </div>
                <div className="font-bold text-sm text-sky-950">
                  {formatCommitteeSelectionLabel(
                    conflictModal.attemptedSelection
                  )}
                </div>
                <div className="text-[11px] text-sky-800">
                  By {user.email}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={resolvingConflict}
                onClick={() => setConflictModal(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <CheckCircle2 size={13} className="text-emerald-700" />
                Keep Colleague&apos;s Selection
              </button>
              <button
                type="button"
                disabled={resolvingConflict}
                onClick={() => void handleResolveConflictOverride()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-sky-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                Override with My Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
