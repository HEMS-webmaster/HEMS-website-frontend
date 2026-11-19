"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Coffee,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  GripVertical,
  Hotel,
  Lock,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  TableProperties,
  Trash2,
  Utensils,
  Wand2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import { useConferenceSchedule } from "@/hooks/useConferenceSchedule";
import type { AbstractSubmissionRecord } from "@/types/abstractSubmission";
import { RESEARCH_TRACK_OPTIONS } from "@/types/abstractSubmission";
import { hasAdminRole, hasReviewerRole } from "@/utils/telemetryClient";
import { formatMedianScore } from "@/utils/abstractReviewMetrics";
import ScientificText from "@/components/workshop/ScientificText";
import AbstractOnePagePreview from "@/components/workshop/AbstractOnePagePreview";
import {
  assignCandidateToSession,
  buildTalkSlotFromCandidate,
  collectScheduledSubmissionIds,
  detectScheduleTimeConflicts,
  extractAcceptedSubmissionsForSchedule,
  formatDayHeadingFromIso,
  formatHemsTimeRange,
  moveTalkBetweenSessions,
  parseClockMinutes,
  recalculateSessionTalkTimes,
  refreshPlanMetadataFromSubmissions,
  removeTalkFromSession,
  toRomanNumeral,
  updateTalkTiming,
  type ConferenceSchedulePlan,
  type ScheduleBlock,
  type ScheduleCandidateEntry,
  type ScheduleDayPlan,
  type ScheduleEventBlock,
  type ScheduleEventCategory,
  type ScheduleSessionBlock,
  type ScheduledTalkSlot,
} from "@/utils/conferenceScheduleBuilder";
import { downloadConferenceSchedulePdf } from "@/utils/scheduleExportPdf";
import { downloadConferenceScheduleDocx } from "@/utils/scheduleExportDocx";

type CandidateFilterMode = "unscheduled_oral" | "all_oral" | "posters";

const EVENT_CATEGORY_OPTIONS: readonly {
  value: ScheduleEventCategory;
  label: string;
}[] = [
  { value: "break", label: "Coffee Break" },
  { value: "breakfast", label: "Continental Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "reception", label: "Welcome Reception" },
  { value: "sponsor", label: "Sponsor Introductions" },
  { value: "poster", label: "Poster Session" },
  { value: "dinner", label: "Dinner / Banquet" },
  { value: "registration", label: "Registration" },
  { value: "closing", label: "Closing Remarks" },
  { value: "other", label: "Other Event" },
];

function createUniqueId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatSavedTimestamp(iso: string): string {
  if (!iso) return "Not saved yet";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReviewerScheduleBuilderPage() {
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

  const {
    plan,
    syncState,
    lastSavedAt,
    saveError,
    isCloudCapable,
    updatePlan,
    saveScheduleNow,
    resetToSuggestedSchedule,
    syncLocationsFromWorkshop,
  } = useConferenceSchedule({
    workshop,
    submissions,
    reviews,
    submissionsLoading: listLoading,
  });

  const [includePendingOral, setIncludePendingOral] = useState(false);
  const [defaultDurationMin, setDefaultDurationMin] = useState<number>(30);
  const [confirmAutoSuggest, setConfirmAutoSuggest] = useState(false);
  const [activeDayFilter, setActiveDayFilter] = useState<string>("all");
  const [candidateFilter, setCandidateFilter] =
    useState<CandidateFilterMode>("unscheduled_oral");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [rippleOnTimeEdit, setRippleOnTimeEdit] = useState(true);
  const [editingTalkId, setEditingTalkId] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{
    tone: "success" | "info" | "warn";
    text: string;
  } | null>(null);

  // Drag & Drop state (either existing slotId or unassigned candidate submissionId)
  const [dragPayload, setDragPayload] = useState<
    | { kind: "slot"; slotId: string }
    | { kind: "candidate"; submissionId: string }
    | null
  >(null);
  const [dragOverSessionId, setDragOverSessionId] = useState<string | null>(null);

  // Add Invited / Custom Talk Modal state
  const [showCustomTalkForm, setShowCustomTalkForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customPresenter, setCustomPresenter] = useState("");
  const [customAffiliation, setCustomAffiliation] = useState("");
  const [customTrack, setCustomTrack] = useState<string>(RESEARCH_TRACK_OPTIONS[0]);
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [customTargetSessionId, setCustomTargetSessionId] = useState<string>("");

  // Abstract 1-page preview modal state
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

  const isReviewer = Boolean(user && hasReviewerRole(user.roles));
  const isAdmin = Boolean(user && hasAdminRole(user.roles));

  const submissionById = useMemo(
    () => new Map(submissions.map((s) => [s.id, s])),
    [submissions]
  );

  const { oralCandidates, posterCandidates } = useMemo(
    () =>
      extractAcceptedSubmissionsForSchedule(submissions, reviews, {
        includePendingOral,
      }),
    [submissions, reviews, includePendingOral]
  );

  const scheduledSubmissionIds = useMemo(
    () => (plan ? collectScheduledSubmissionIds(plan) : new Set<string>()),
    [plan]
  );

  // Flat list of every Technical Session across all days for 1-click "Move to..." dropdowns
  const allSessions = useMemo(() => {
    if (!plan) return [];
    const list: Array<{
      dayId: string;
      dayLabel: string;
      session: ScheduleSessionBlock;
    }> = [];
    for (const day of plan.days) {
      for (const blk of day.blocks) {
        if (blk.kind === "session") {
          list.push({ dayId: day.id, dayLabel: day.headingLabel, session: blk });
        }
      }
    }
    return list;
  }, [plan]);

  useEffect(() => {
    if (allSessions.length > 0 && !customTargetSessionId) {
      setCustomTargetSessionId(allSessions[0].session.id);
    }
  }, [allSessions, customTargetSessionId]);

  const filteredCandidates: ScheduleCandidateEntry[] = useMemo(() => {
    let source: ScheduleCandidateEntry[];
    if (candidateFilter === "unscheduled_oral") {
      source = oralCandidates.filter(
        (c) => !scheduledSubmissionIds.has(c.submission.id)
      );
    } else if (candidateFilter === "all_oral") {
      source = oralCandidates;
    } else {
      source = posterCandidates;
    }

    const q = candidateSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter((c) => {
      const hay = [
        c.submission.id,
        c.submission.title,
        c.submission.presentingAuthor,
        c.authorsLine,
        c.submission.researchTrack,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    candidateFilter,
    candidateSearch,
    oralCandidates,
    posterCandidates,
    scheduledSubmissionIds,
  ]);

  const conflictsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof detectScheduleTimeConflicts>>();
    if (!plan) return map;
    for (const day of plan.days) {
      const warnings = detectScheduleTimeConflicts(day);
      if (warnings.length > 0) map.set(day.id, warnings);
    }
    return map;
  }, [plan]);

  const totalConflicts = useMemo(() => {
    let count = 0;
    for (const list of conflictsByDay.values()) count += list.length;
    return count;
  }, [conflictsByDay]);

  const totalScheduledTalks = useMemo(() => {
    return allSessions.reduce((acc, s) => acc + s.session.talks.length, 0);
  }, [allSessions]);

  // ── Auth Gates ────────────────────────────────────────────────────────────────

  if (authLoading || (isReviewer && !plan)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-xs font-medium">
          Loading HEMS Reviewer Schedule Builder...
        </p>
      </div>
    );
  }

  if (!user || !isReviewer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert size={48} className="text-destructive mb-4" />
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
          Restricted Program Committee Area
        </h2>
        <p className="text-foreground/60 max-w-md text-sm">
          Reviewer authorization is required to organize the conference schedule
          and export program drafts.
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

  if (!plan) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleInspectAbstract = async (subId: string) => {
    const sub = submissionById.get(subId);
    if (!sub) return;
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
      setBannerMsg({ tone: "warn", text: res.reason });
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
        modeLabel={`Schedule Abstract Preview — ${sub.id}`}
        onClose={() => setActivePreview(null)}
      />
    );
  }

  const handleExportPdf = () => {
    try {
      const file = downloadConferenceSchedulePdf(plan, workshop);
      setBannerMsg({
        tone: "success",
        text: `Downloaded PDF schedule: ${file}`,
      });
    } catch (err) {
      setBannerMsg({
        tone: "warn",
        text: err instanceof Error ? err.message : "Failed to export PDF.",
      });
    }
  };

  const handleExportDocx = () => {
    try {
      const file = downloadConferenceScheduleDocx(plan, workshop);
      setBannerMsg({
        tone: "success",
        text: `Downloaded editable Word (.docx) schedule: ${file}`,
      });
    } catch (err) {
      setBannerMsg({
        tone: "warn",
        text: err instanceof Error ? err.message : "Failed to export DOCX.",
      });
    }
  };

  const handleRunAutoSuggest = () => {
    const rebuilt = resetToSuggestedSchedule({
      includePendingOral,
      defaultTalkDurationMinutes: defaultDurationMin,
    });
    setConfirmAutoSuggest(false);
    const placedCount = rebuilt.days.reduce(
      (sum, d) =>
        sum +
        d.blocks.reduce(
          (bSum, b) => bSum + (b.kind === "session" ? b.talks.length : 0),
          0
        ),
      0
    );
    setBannerMsg({
      tone: "success",
      text: `Built suggested 4-day HEMS program with ${placedCount} talk${placedCount === 1 ? "" : "s"} (${defaultDurationMin}-min slots) and ${rebuilt.posters.length} accepted poster${rebuilt.posters.length === 1 ? "" : "s"}, hydrated from Workshop Settings.`,
    });
  };

  const handleSyncFromSettings = () => {
    syncLocationsFromWorkshop();
    setBannerMsg({
      tone: "info",
      text: "Synchronized Plenary Room, Foyer, Welcome Reception, Workshop Dinner venue/plans, and dates from Workshop Settings.",
    });
  };

  const handleRefreshTalkMetadata = () => {
    updatePlan((prev) =>
      refreshPlanMetadataFromSubmissions(prev, submissions, reviews)
    );
    setBannerMsg({
      tone: "info",
      text: "Refreshed talk titles, presenters, and affiliations from live abstract submissions.",
    });
  };

  const handleAssignCandidateToSession = (
    candidate: ScheduleCandidateEntry,
    targetSessionId: string
  ) => {
    if (!targetSessionId) return;
    const slot = buildTalkSlotFromCandidate(
      candidate,
      plan.defaultTalkDurationMinutes || defaultDurationMin
    );
    updatePlan((prev) => assignCandidateToSession(prev, slot, targetSessionId));
  };

  const handleAddCustomTalk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customTargetSessionId) return;
    const slot: ScheduledTalkSlot = {
      slotId: createUniqueId("custom"),
      submissionId: "",
      startTime: "08:30",
      endTime: "09:00",
      durationMinutes: Math.max(5, Math.min(180, customDuration || 30)),
      manualTimeLocked: false,
      title: customTitle.trim(),
      presentingAuthor: customPresenter.trim() || "Invited Speaker",
      affiliation: customAffiliation.trim(),
      authorsLine: [customPresenter.trim(), customAffiliation.trim()]
        .filter(Boolean)
        .join(", "),
      researchTrack: customTrack,
      isStudentAward: false,
      medianCombinedScore: null,
    };
    updatePlan((prev) =>
      assignCandidateToSession(prev, slot, customTargetSessionId)
    );
    setCustomTitle("");
    setCustomPresenter("");
    setCustomAffiliation("");
    setShowCustomTalkForm(false);
    setBannerMsg({
      tone: "success",
      text: `Added "${slot.title}" to the selected session.`,
    });
  };

  const handleSessionDrop = (
    targetSessionId: string,
    targetIndex?: number
  ) => {
    if (!dragPayload) return;
    if (dragPayload.kind === "slot") {
      updatePlan((prev) =>
        moveTalkBetweenSessions(
          prev,
          dragPayload.slotId,
          targetSessionId,
          targetIndex
        )
      );
    } else {
      const candidate =
        oralCandidates.find(
          (c) => c.submission.id === dragPayload.submissionId
        ) ||
        posterCandidates.find(
          (c) => c.submission.id === dragPayload.submissionId
        );
      if (candidate) {
        handleAssignCandidateToSession(candidate, targetSessionId);
      }
    }
    setDragPayload(null);
    setDragOverSessionId(null);
  };

  const handleNudgeTalk = (
    session: ScheduleSessionBlock,
    talkIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIdx = direction === "up" ? talkIndex - 1 : talkIndex + 1;
    if (targetIdx < 0 || targetIdx >= session.talks.length) return;
    const movingSlot = session.talks[talkIndex];
    updatePlan((prev) =>
      moveTalkBetweenSessions(prev, movingSlot.slotId, session.id, targetIdx)
    );
  };

  const handleUpdateSessionField = (
    dayId: string,
    sessionId: string,
    patch: Partial<ScheduleSessionBlock>,
    recalcTimes = false
  ) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          blocks: d.blocks.map((blk): ScheduleBlock => {
            if (blk.kind !== "session" || blk.id !== sessionId) return blk;
            const merged = { ...blk, ...patch };
            return recalcTimes ? recalculateSessionTalkTimes(merged, true) : merged;
          }),
        };
      }),
    }));
  };

  const handleUpdateEventField = (
    dayId: string,
    eventId: string,
    patch: Partial<ScheduleEventBlock>
  ) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          blocks: d.blocks.map((blk): ScheduleBlock => {
            if (blk.kind !== "event" || blk.id !== eventId) return blk;
            return { ...blk, ...patch };
          }),
        };
      }),
    }));
  };

  const handleUpdateTalkContent = (
    sessionId: string,
    slotId: string,
    patch: Partial<ScheduledTalkSlot>
  ) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        blocks: d.blocks.map((blk): ScheduleBlock => {
          if (blk.kind !== "session" || blk.id !== sessionId) return blk;
          return {
            ...blk,
            talks: blk.talks.map((t) =>
              t.slotId === slotId ? { ...t, ...patch } : t
            ),
          };
        }),
      })),
    }));
  };

  const handleNudgeBlock = (
    dayId: string,
    blockIdx: number,
    direction: "up" | "down"
  ) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        const target = direction === "up" ? blockIdx - 1 : blockIdx + 1;
        if (target < 0 || target >= d.blocks.length) return d;
        const nextBlocks = [...d.blocks];
        const [moved] = nextBlocks.splice(blockIdx, 1);
        nextBlocks.splice(target, 0, moved);
        return { ...d, blocks: nextBlocks };
      }),
    }));
  };

  const handleDeleteBlock = (dayId: string, blockId: string) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        return { ...d, blocks: d.blocks.filter((b) => b.id !== blockId) };
      }),
    }));
  };

  const handleSortDayBlocksByTime = (dayId: string) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        const sorted = [...d.blocks].sort((a, b) => {
          const mA = parseClockMinutes(a.startTime) ?? 9999;
          const mB = parseClockMinutes(b.startTime) ?? 9999;
          return mA - mB;
        });
        return { ...d, blocks: sorted };
      }),
    }));
  };

  const handleFixDayConflicts = (dayId: string) => {
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        const fixedBlocks = d.blocks
          .map((blk) =>
            blk.kind === "session"
              ? recalculateSessionTalkTimes(blk, true)
              : blk
          )
          .sort((a, b) => {
            const mA = parseClockMinutes(a.startTime) ?? 9999;
            const mB = parseClockMinutes(b.startTime) ?? 9999;
            return mA - mB;
          });
        return { ...d, blocks: fixedBlocks };
      }),
    }));
  };

  const handleAddSessionToDay = (dayId: string) => {
    const nextNum = allSessions.length + 1;
    const newSession: ScheduleSessionBlock = {
      id: createUniqueId("session"),
      kind: "session",
      startTime: "13:30",
      endTime: "15:00",
      title: `Technical Session ${toRomanNumeral(nextNum)}`,
      themeSubtitle: "",
      sessionChair: "",
      location: workshop.venue_session_room || "Main Plenary Ballroom (TBA)",
      syncSource: "session_room",
      talks: [],
    };
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id === dayId ? { ...d, blocks: [...d.blocks, newSession] } : d
      ),
    }));
  };

  const handleAddEventToDay = (dayId: string) => {
    const newEvent: ScheduleEventBlock = {
      id: createUniqueId("ev"),
      kind: "event",
      eventCategory: "break",
      startTime: "15:00",
      endTime: "15:30",
      title: "Afternoon Break",
      subtitle: "",
      location: workshop.venue_foyer_room || "Ballroom Foyer (TBA)",
      locationUrl: "",
      syncSource: "foyer_room",
    };
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id === dayId ? { ...d, blocks: [...d.blocks, newEvent] } : d
      ),
    }));
  };

  const handleAddDay = () => {
    const nextNum = plan.days.length + 1;
    const newDay: ScheduleDayPlan = {
      id: createUniqueId("day"),
      dayNumber: nextNum,
      dateIso: "",
      headingLabel: `Day ${nextNum} — Custom Workshop Day`,
      dayTagline: "Additional Program Day",
      blocks: [],
    };
    updatePlan((prev) => ({
      ...prev,
      days: [...prev.days, newDay],
    }));
    setActiveDayFilter(newDay.id);
  };

  const visibleDays =
    activeDayFilter === "all"
      ? plan.days
      : plan.days.filter((d) => d.id === activeDayFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header & Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
            Program Committee • Single-Track Program Composer
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-3">
            <Calendar className="text-primary shrink-0" />
            <span>Conference Schedule Builder</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Arrange accepted oral talks into sessions modeled on historical HEMS
            workshops, fine-tune talk timings, sync hotel/dinner plans from Workshop
            Settings, and export to PDF or editable Word (.docx).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <Link
            href="/reviewer"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <ClipboardCheck size={13} /> Reviewer Panel
          </Link>
          <Link
            href="/reviewer/overview"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <TableProperties size={13} /> Abstract Overview
          </Link>
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
            Refresh Abstracts
          </button>
          <button
            type="button"
            onClick={() => void saveScheduleNow()}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Save size={13} /> Save Draft
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-[#00487d] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download size={13} /> Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportDocx}
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileText size={13} /> Export DOCX
          </button>
        </div>
      </div>

      {/* Feedback / Status / Sync Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${
              syncState === "cloud"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : syncState === "saving"
                ? "bg-sky-50 text-sky-800 border-sky-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <CheckCircle2 size={12} />
            {syncState === "cloud"
              ? "Cloud Synced (Firestore)"
              : syncState === "saving"
              ? "Saving..."
              : isCloudCapable
              ? "Draft Ready (Auto-Saves to Cloud)"
              : "Local Draft (browser storage)"}
          </span>
          <span className="text-slate-600 tabular-nums">
            <strong>{totalScheduledTalks}</strong> scheduled talk
            {totalScheduledTalks === 1 ? "" : "s"} across{" "}
            <strong>{allSessions.length}</strong> technical session
            {allSessions.length === 1 ? "" : "s"} •{" "}
            <strong>{plan.posters.length}</strong> accepted poster
            {plan.posters.length === 1 ? "" : "s"}
          </span>
          {lastSavedAt && (
            <span className="text-slate-400">
              Last saved {formatSavedTimestamp(lastSavedAt)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalConflicts > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              <AlertTriangle size={12} /> {totalConflicts} timing conflict
              {totalConflicts === 1 ? "" : "s"} detected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              <CheckCircle2 size={12} /> Zero time overlaps
            </span>
          )}
        </div>
      </div>

      {bannerMsg && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm ${
            bannerMsg.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : bannerMsg.tone === "warn"
              ? "bg-amber-50 border-amber-200 text-amber-950"
              : "bg-sky-50 border-sky-200 text-sky-950"
          }`}
        >
          <span>{bannerMsg.text}</span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {saveError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 text-xs">
          {saveError}
        </div>
      )}

      {/* Centralized Venue, Reception & Workshop Dinner Card (Sourced from Workshop Settings) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Hotel size={12} /> Live from Workshop Settings
            </span>
            <h3 className="font-serif text-lg font-bold text-slate-900 mt-0.5">
              {workshop.workshop_ordinal} HEMS Workshop ({workshop.workshop_year}) — Venue &amp; Dinner Plans
            </h3>
            <p className="text-xs text-slate-600">
              All conference hotel, session room, welcome reception, and workshop
              dinner logistics are configured centrally in Workshop Settings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncFromSettings}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Sync Venue &amp; Dinner into Schedule
            </button>
            {isAdmin ? (
              <Link
                href="/admin/workshop-settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Edit in Workshop Settings <ExternalLink size={12} />
              </Link>
            ) : (
              <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                Admins update these in Workshop Settings
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin size={13} className="text-primary shrink-0" />
              <span>Hotel &amp; Dates</span>
            </div>
            <p className="text-slate-700 font-semibold">{workshop.hotel_name}</p>
            <p className="text-slate-500">
              {workshop.venue_city_state} • {workshop.exact_dates}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <TableProperties size={13} className="text-primary shrink-0" />
              <span>Technical &amp; Foyer Rooms</span>
            </div>
            <p className="text-slate-700">
              <strong>Talks:</strong> {workshop.venue_session_room}
            </p>
            <p className="text-slate-600">
              <strong>Breaks / Posters:</strong> {workshop.venue_foyer_room}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Coffee size={13} className="text-primary shrink-0" />
              <span>Day 1 Welcome Reception</span>
            </div>
            <p className="text-slate-700 font-semibold">
              {workshop.welcome_reception_time}
            </p>
            <p className="text-slate-600">{workshop.welcome_reception_venue}</p>
          </div>

          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 space-y-1">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <Utensils size={13} className="text-amber-700 shrink-0" />
              <span>Official Workshop Dinner</span>
            </div>
            <p className="text-amber-900 font-semibold">{workshop.dinner_day_time}</p>
            <p className="text-amber-900">{workshop.dinner_venue_name}</p>
            {workshop.dinner_venue_address && (
              <p className="text-[11px] text-amber-800/90">
                {workshop.dinner_venue_address}
              </p>
            )}
            {workshop.dinner_plan_notes && (
              <p className="text-[11px] text-amber-800/80 line-clamp-2 pt-0.5">
                {workshop.dinner_plan_notes}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Auto-Suggest Generator & Global Settings Toolbar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label
              htmlFor="default-talk-duration"
              className="font-semibold text-slate-700"
            >
              Default Oral Slot:
            </label>
            <select
              id="default-talk-duration"
              value={defaultDurationMin}
              onChange={(e) => {
                const dur = Number.parseInt(e.target.value, 10) || 30;
                setDefaultDurationMin(dur);
                updatePlan((prev) => ({
                  ...prev,
                  defaultTalkDurationMinutes: dur,
                }));
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold"
            >
              <option value={20}>20 min</option>
              <option value={25}>25 min</option>
              <option value={30}>30 min (HEMS Standard)</option>
              <option value={40}>40 min (Extended)</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includePendingOral}
              onChange={(e) => setIncludePendingOral(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>Include Pending Oral submissions in pool</span>
          </label>

          <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.includePosterAppendix}
              onChange={(e) =>
                updatePlan((prev) => ({
                  ...prev,
                  includePosterAppendix: e.target.checked,
                }))
              }
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>Include Posters Appendix in PDF/DOCX</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshTalkMetadata}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Sync Talk Titles/Authors
          </button>

          {!confirmAutoSuggest ? (
            <button
              type="button"
              onClick={() => setConfirmAutoSuggest(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Wand2 size={13} /> Auto-Suggest HEMS Schedule from Accepted Abstracts
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-semibold text-amber-950">
                Rebuild 4-day format from abstracts?
              </span>
              <button
                type="button"
                onClick={handleRunAutoSuggest}
                className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer"
              >
                Rebuild Schedule
              </button>
              <button
                type="button"
                onClick={() => setConfirmAutoSuggest(false)}
                className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main 2-Column Interactive Schedule Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Accepted Talks Tray & Posters Pool */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Accepted Talks &amp; Pool
                </h3>
                <p className="text-[11px] text-slate-500">
                  Drag cards into any session or use the Assign menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomTalkForm((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Plus size={12} /> Invited / Custom
              </button>
            </div>

            {showCustomTalkForm && (
              <form
                onSubmit={handleAddCustomTalk}
                className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs"
              >
                <div className="font-bold text-slate-800">
                  Add Keynote, Invited, or Custom Talk
                </div>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Talk title..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customPresenter}
                    onChange={(e) => setCustomPresenter(e.target.value)}
                    placeholder="Speaker name"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={customAffiliation}
                    onChange={(e) => setCustomAffiliation(e.target.value)}
                    placeholder="Institution"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={customTrack}
                    onChange={(e) => setCustomTrack(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {RESEARCH_TRACK_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={customDuration}
                    onChange={(e) =>
                      setCustomDuration(Number.parseInt(e.target.value, 10) || 30)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    title="Duration (minutes)"
                  />
                </div>
                <select
                  value={customTargetSessionId}
                  onChange={(e) => setCustomTargetSessionId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  {allSessions.map((item) => (
                    <option key={item.session.id} value={item.session.id}>
                      {item.dayLabel.split(",")[0]} — {item.session.title}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomTalkForm(false)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-primary text-white font-semibold cursor-pointer"
                  >
                    Insert Talk
                  </button>
                </div>
              </form>
            )}

            {/* Pool Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCandidateFilter("unscheduled_oral")}
                className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  candidateFilter === "unscheduled_oral"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unscheduled ({oralCandidates.filter((c) => !scheduledSubmissionIds.has(c.submission.id)).length})
              </button>
              <button
                type="button"
                onClick={() => setCandidateFilter("all_oral")}
                className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  candidateFilter === "all_oral"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Oral ({oralCandidates.length})
              </button>
              <button
                type="button"
                onClick={() => setCandidateFilter("posters")}
                className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  candidateFilter === "posters"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Posters ({posterCandidates.length})
              </button>
            </div>

            <input
              type="text"
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Filter talks by title, author, track..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />

            {/* Candidate Cards */}
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-6 px-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  {candidateFilter === "unscheduled_oral"
                    ? oralCandidates.length === 0
                      ? "No abstracts have reached 'Accept (Oral)' consensus yet. Mark oral acceptances in Reviewer Panel or enable 'Include Pending Oral submissions'."
                      : "All accepted oral talks are currently placed into sessions!"
                    : "No matching abstracts in this pool."}
                </div>
              ) : (
                filteredCandidates.map((cand) => {
                  const isPlaced = scheduledSubmissionIds.has(cand.submission.id);
                  return (
                    <div
                      key={cand.submission.id}
                      draggable
                      onDragStart={() =>
                        setDragPayload({
                          kind: "candidate",
                          submissionId: cand.submission.id,
                        })
                      }
                      onDragEnd={() => {
                        setDragPayload(null);
                        setDragOverSessionId(null);
                      }}
                      className={`rounded-xl border p-3 space-y-2 transition-colors ${
                        isPlaced
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-white border-slate-200 hover:border-primary/40 cursor-grab"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <GripVertical
                            size={13}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary tabular-nums">
                            {cand.submission.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              cand.candidatePool === "oral_accepted"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : cand.candidatePool === "poster_accepted"
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {cand.candidatePool === "oral_accepted"
                              ? "Accept (Oral)"
                              : cand.candidatePool === "poster_accepted"
                              ? "Accept (Poster)"
                              : "Pending Oral"}
                          </span>
                          {cand.submission.studentTravelAwardApplicant && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                              <GraduationCap size={10} /> Award
                            </span>
                          )}
                        </div>
                        <span className="text-[10.5px] font-bold tabular-nums text-slate-600 shrink-0">
                          {formatMedianScore(cand.summary.medianCombined)}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 leading-snug">
                        <ScientificText text={cand.submission.title} />
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug">
                        <strong>{cand.submission.presentingAuthor}</strong> •{" "}
                        {cand.primaryAffiliation}
                      </div>
                      <div className="text-[10.5px] text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded inline-block">
                        {cand.submission.researchTrack}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => void handleInspectAbstract(cand.submission.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-primary cursor-pointer"
                        >
                          <Eye size={12} /> View Abstract
                        </button>

                        {allSessions.length > 0 && (
                          <select
                            aria-label={`Assign ${cand.submission.id} to session`}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignCandidateToSession(cand, e.target.value);
                              }
                            }}
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:border-primary text-slate-800 cursor-pointer max-w-[165px]"
                          >
                            <option value="">
                              {isPlaced ? "+ Place another copy..." : "Assign to Session ▾"}
                            </option>
                            {allSessions.map((item) => (
                              <option key={item.session.id} value={item.session.id}>
                                Day {plan.days.find((d) => d.id === item.dayId)?.dayNumber}:{" "}
                                {item.session.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Program Committee Notes Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
            <label
              htmlFor="program-notes"
              className="text-xs font-bold text-slate-800 block"
            >
              Printed Program Header Note (Optional)
            </label>
            <textarea
              id="program-notes"
              rows={2}
              value={plan.programNotes}
              onChange={(e) =>
                updatePlan((prev) => ({
                  ...prev,
                  programNotes: e.target.value,
                }))
              }
              placeholder="e.g., Speaker presentation slides should be uploaded 30 minutes prior to each session..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: Interactive Multi-Day Conference Schedule Canvas */}
        <div className="lg:col-span-8 space-y-5">
          {/* Day Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveDayFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeDayFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Days ({plan.days.length})
              </button>
              {plan.days.map((day) => {
                const dayConflicts = conflictsByDay.get(day.id)?.length || 0;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayFilter(day.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      activeDayFilter === day.id
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>Day {day.dayNumber}</span>
                    {dayConflicts > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                        {dayConflicts}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleAddDay}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-primary hover:text-primary text-xs font-semibold cursor-pointer"
              >
                <Plus size={12} /> Add Day
              </button>
            </div>

            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rippleOnTimeEdit}
                onChange={(e) => setRippleOnTimeEdit(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>Auto-ripple subsequent talk times</span>
            </label>
          </div>

          {/* Day Timeline Cards */}
          {visibleDays.map((day) => {
            const dayWarnings = conflictsByDay.get(day.id) || [];

            return (
              <section
                key={day.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Editable Day Header */}
                <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0">
                      Day {day.dayNumber}
                    </span>
                    <input
                      type="date"
                      value={day.dateIso}
                      aria-label={`Day ${day.dayNumber} calendar date`}
                      onChange={(e) => {
                        const iso = e.target.value;
                        updatePlan((prev) => ({
                          ...prev,
                          days: prev.days.map((d) =>
                            d.id === day.id
                              ? {
                                  ...d,
                                  dateIso: iso,
                                  headingLabel: formatDayHeadingFromIso(
                                    iso,
                                    d.headingLabel
                                  ),
                                }
                              : d
                          ),
                        }));
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 tabular-nums"
                    />
                    <input
                      type="text"
                      value={day.headingLabel}
                      aria-label={`Day ${day.dayNumber} heading label`}
                      onChange={(e) =>
                        updatePlan((prev) => ({
                          ...prev,
                          days: prev.days.map((d) =>
                            d.id === day.id
                              ? { ...d, headingLabel: e.target.value }
                              : d
                          ),
                        }))
                      }
                      className="flex-1 min-w-[210px] px-2.5 py-1 text-sm font-serif font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSortDayBlocksByTime(day.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      Sort by Time
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddEventToDay(day.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <Plus size={11} /> Break / Event
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSessionToDay(day.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white hover:bg-sky-800 text-[11px] font-semibold cursor-pointer"
                    >
                      <Plus size={11} /> Tech Session
                    </button>
                  </div>
                </div>

                {/* Day Conflict Warning Banner */}
                {dayWarnings.length > 0 && (
                  <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-900">
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-600" />
                        Timing Conflict{dayWarnings.length === 1 ? "" : "s"} on{" "}
                        {day.headingLabel}
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {dayWarnings.map((w) => (
                          <li key={w.id}>{w.message}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFixDayConflicts(day.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Fix Session Times
                    </button>
                  </div>
                )}

                {/* Blocks inside Day */}
                <div className="p-4 space-y-3.5">
                  {day.blocks.length === 0 ? (
                    <div className="text-center py-6 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      No sessions or events on this day yet. Add a Technical Session
                      or Break/Event above.
                    </div>
                  ) : (
                    day.blocks.map((block, blockIdx) => {
                      if (block.kind === "event") {
                        const isDinner =
                          block.eventCategory === "dinner" &&
                          block.syncSource === "workshop_dinner";
                        return (
                          <div
                            key={block.id}
                            className={`rounded-xl border p-3.5 space-y-2.5 ${
                              isDinner
                                ? "bg-amber-50/75 border-amber-300"
                                : "bg-slate-50/80 border-slate-200"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    isDinner
                                      ? "bg-amber-100 text-amber-900 border-amber-300"
                                      : "bg-white text-slate-600 border-slate-200"
                                  }`}
                                >
                                  Event
                                </span>
                                {block.syncSource !== "manual" && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                                    Synced: {block.syncSource.replace(/_/g, " ")}
                                  </span>
                                )}
                                <select
                                  value={block.eventCategory}
                                  aria-label="Event category"
                                  onChange={(e) =>
                                    handleUpdateEventField(day.id, block.id, {
                                      eventCategory: e.target
                                        .value as ScheduleEventCategory,
                                    })
                                  }
                                  className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
                                >
                                  {EVENT_CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={blockIdx === 0}
                                  onClick={() =>
                                    handleNudgeBlock(day.id, blockIdx, "up")
                                  }
                                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-primary disabled:opacity-35 cursor-pointer"
                                  title="Move block earlier"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={blockIdx >= day.blocks.length - 1}
                                  onClick={() =>
                                    handleNudgeBlock(day.id, blockIdx, "down")
                                  }
                                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-primary disabled:opacity-35 cursor-pointer"
                                  title="Move block later"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlock(day.id, block.id)}
                                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-rose-600 cursor-pointer"
                                  title="Remove event"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                              <div className="sm:col-span-4 flex items-center gap-1.5">
                                <input
                                  type="time"
                                  value={block.startTime}
                                  aria-label="Event start time"
                                  onChange={(e) =>
                                    handleUpdateEventField(day.id, block.id, {
                                      startTime: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white tabular-nums w-full"
                                />
                                <span className="text-slate-400">–</span>
                                <input
                                  type="time"
                                  value={block.endTime}
                                  aria-label="Event end time"
                                  onChange={(e) =>
                                    handleUpdateEventField(day.id, block.id, {
                                      endTime: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white tabular-nums w-full"
                                />
                              </div>

                              <input
                                type="text"
                                value={block.title}
                                aria-label="Event title"
                                onChange={(e) =>
                                  handleUpdateEventField(day.id, block.id, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Event Title"
                                className="sm:col-span-4 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                              />

                              <input
                                type="text"
                                value={block.location}
                                aria-label="Event location"
                                onChange={(e) =>
                                  handleUpdateEventField(day.id, block.id, {
                                    location: e.target.value,
                                    syncSource: "manual",
                                  })
                                }
                                placeholder="Room / Location"
                                className="sm:col-span-4 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
                              />
                            </div>

                            <input
                              type="text"
                              value={block.subtitle}
                              aria-label="Event notes"
                              onChange={(e) =>
                                handleUpdateEventField(day.id, block.id, {
                                  subtitle: e.target.value,
                                })
                              }
                              placeholder="Optional notes, sponsor acknowledgement, or directions..."
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white/90 text-slate-600"
                            />
                          </div>
                        );
                      }

                      // Technical Session Block
                      const session = block;
                      const isDropHighlight = dragOverSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverSessionId !== session.id) {
                              setDragOverSessionId(session.id);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverSessionId === session.id) {
                              setDragOverSessionId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleSessionDrop(session.id);
                          }}
                          className={`rounded-2xl border overflow-hidden transition-all ${
                            isDropHighlight
                              ? "border-primary ring-2 ring-primary/25"
                              : "border-sky-200"
                          }`}
                        >
                          {/* Session Header Bar */}
                          <div className="bg-sky-50/90 border-b border-sky-200 px-3.5 py-3 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                                  Session
                                </span>
                                <span className="font-semibold text-sky-900 tabular-nums">
                                  {formatHemsTimeRange(
                                    session.startTime,
                                    session.endTime
                                  )}
                                </span>
                                <span className="text-[11px] text-sky-800/80">
                                  ({session.talks.length} talk
                                  {session.talks.length === 1 ? "" : "s"})
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSessionField(
                                      day.id,
                                      session.id,
                                      {},
                                      true
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-sky-200 hover:border-primary text-[11px] font-semibold text-sky-900 cursor-pointer"
                                  title="Recalculate sequential talk times from session start"
                                >
                                  <Clock size={11} /> Recalc Times
                                </button>
                                <button
                                  type="button"
                                  disabled={blockIdx === 0}
                                  onClick={() =>
                                    handleNudgeBlock(day.id, blockIdx, "up")
                                  }
                                  className="p-1 rounded-md border border-sky-200 bg-white text-slate-600 hover:text-primary disabled:opacity-35 cursor-pointer"
                                  title="Move session up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={blockIdx >= day.blocks.length - 1}
                                  onClick={() =>
                                    handleNudgeBlock(day.id, blockIdx, "down")
                                  }
                                  className="p-1 rounded-md border border-sky-200 bg-white text-slate-600 hover:text-primary disabled:opacity-35 cursor-pointer"
                                  title="Move session down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlock(day.id, session.id)}
                                  className="p-1 rounded-md border border-sky-200 bg-white text-slate-500 hover:text-rose-600 cursor-pointer"
                                  title="Delete session (talks return to unscheduled)"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                              <div className="sm:col-span-3 flex items-center gap-1">
                                <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                                  Start:
                                </span>
                                <input
                                  type="time"
                                  value={session.startTime}
                                  aria-label={`${session.title} start time`}
                                  onChange={(e) =>
                                    handleUpdateSessionField(
                                      day.id,
                                      session.id,
                                      { startTime: e.target.value },
                                      true
                                    )
                                  }
                                  className="w-full px-2 py-1 rounded-lg border border-sky-200 bg-white tabular-nums font-semibold"
                                />
                              </div>

                              <input
                                type="text"
                                value={session.title}
                                aria-label="Session title"
                                onChange={(e) =>
                                  handleUpdateSessionField(day.id, session.id, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Technical Session I"
                                className="sm:col-span-4 px-2.5 py-1 rounded-lg border border-sky-200 bg-white font-bold text-slate-900"
                              />

                              <input
                                type="text"
                                value={session.location}
                                aria-label="Session room"
                                onChange={(e) =>
                                  handleUpdateSessionField(day.id, session.id, {
                                    location: e.target.value,
                                    syncSource: "manual",
                                  })
                                }
                                placeholder="Session Room"
                                className="sm:col-span-5 px-2.5 py-1 rounded-lg border border-sky-200 bg-white text-slate-700"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <input
                                type="text"
                                value={session.themeSubtitle}
                                aria-label="Session theme"
                                onChange={(e) =>
                                  handleUpdateSessionField(day.id, session.id, {
                                    themeSubtitle: e.target.value,
                                  })
                                }
                                placeholder="Topic / Track Subtitle (optional)"
                                className="px-2.5 py-1 rounded-lg border border-sky-200/80 bg-white/90 text-slate-700"
                              />
                              <input
                                type="text"
                                value={session.sessionChair}
                                aria-label="Session chair"
                                onChange={(e) =>
                                  handleUpdateSessionField(day.id, session.id, {
                                    sessionChair: e.target.value,
                                  })
                                }
                                placeholder="Session Chair (optional)"
                                className="px-2.5 py-1 rounded-lg border border-sky-200/80 bg-white/90 text-slate-700"
                              />
                            </div>
                          </div>

                          {/* Talk Slots Inside Session */}
                          <div className="p-3 bg-white space-y-2.5">
                            {session.talks.length === 0 ? (
                              <div className="text-center py-5 px-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                                Drop any accepted oral talk here or select this session
                                from a talk&apos;s dropdown.
                              </div>
                            ) : (
                              session.talks.map((talk, talkIdx) => {
                                const isEditingDetails =
                                  editingTalkId === talk.slotId;

                                return (
                                  <div
                                    key={talk.slotId}
                                    draggable
                                    onDragStart={() =>
                                      setDragPayload({
                                        kind: "slot",
                                        slotId: talk.slotId,
                                      })
                                    }
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleSessionDrop(session.id, talkIdx);
                                    }}
                                    onDragEnd={() => {
                                      setDragPayload(null);
                                      setDragOverSessionId(null);
                                    }}
                                    className="rounded-xl border border-slate-200 hover:border-primary/40 bg-slate-50/50 p-3 space-y-2 transition-colors"
                                  >
                                    {/* Top Strip: Drag, Manual Times, Move & Remove */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                        <span
                                          className="text-slate-400 cursor-grab p-0.5"
                                          title="Drag to reorder or move session"
                                        >
                                          <GripVertical size={14} />
                                        </span>

                                        <input
                                          type="time"
                                          value={talk.startTime}
                                          aria-label={`Start time for ${talk.title}`}
                                          onChange={(e) =>
                                            updatePlan((prev) =>
                                              updateTalkTiming(
                                                prev,
                                                session.id,
                                                talk.slotId,
                                                {
                                                  startTime: e.target.value,
                                                  rippleSubsequent: rippleOnTimeEdit,
                                                }
                                              )
                                            )
                                          }
                                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white tabular-nums font-semibold text-slate-900"
                                        />
                                        <span className="text-slate-400">–</span>
                                        <input
                                          type="time"
                                          value={talk.endTime}
                                          aria-label={`End time for ${talk.title}`}
                                          onChange={(e) =>
                                            updatePlan((prev) =>
                                              updateTalkTiming(
                                                prev,
                                                session.id,
                                                talk.slotId,
                                                {
                                                  endTime: e.target.value,
                                                  rippleSubsequent: rippleOnTimeEdit,
                                                }
                                              )
                                            )
                                          }
                                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white tabular-nums text-slate-700"
                                        />

                                        <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1">
                                          <input
                                            type="number"
                                            min={5}
                                            max={180}
                                            step={5}
                                            value={talk.durationMinutes}
                                            aria-label={`Duration in minutes for ${talk.title}`}
                                            onChange={(e) =>
                                              updatePlan((prev) =>
                                                updateTalkTiming(
                                                  prev,
                                                  session.id,
                                                  talk.slotId,
                                                  {
                                                    durationMinutes:
                                                      Number.parseInt(
                                                        e.target.value,
                                                        10
                                                      ) || 30,
                                                    rippleSubsequent: rippleOnTimeEdit,
                                                  }
                                                )
                                              )
                                            }
                                            className="w-11 text-right tabular-nums font-semibold text-slate-800 focus:outline-none"
                                          />
                                          <span className="text-[10.5px] text-slate-500">
                                            min
                                          </span>
                                        </div>

                                        {talk.manualTimeLocked && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updatePlan((prev) =>
                                                updateTalkTiming(
                                                  prev,
                                                  session.id,
                                                  talk.slotId,
                                                  { manualTimeLocked: false }
                                                )
                                              )
                                            }
                                            title="Manual time locked (click to allow auto-recalculation)"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold cursor-pointer"
                                          >
                                            <Lock size={10} /> Manual
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={talkIdx === 0}
                                          onClick={() =>
                                            handleNudgeTalk(session, talkIdx, "up")
                                          }
                                          className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-primary disabled:opacity-35 cursor-pointer"
                                          title="Move talk earlier in session"
                                        >
                                          <ArrowUp size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={
                                            talkIdx >= session.talks.length - 1
                                          }
                                          onClick={() =>
                                            handleNudgeTalk(session, talkIdx, "down")
                                          }
                                          className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-primary disabled:opacity-35 cursor-pointer"
                                          title="Move talk later in session"
                                        >
                                          <ArrowDown size={12} />
                                        </button>

                                        <select
                                          aria-label={`Move "${talk.title}" to another session`}
                                          value={session.id}
                                          onChange={(e) => {
                                            if (
                                              e.target.value &&
                                              e.target.value !== session.id
                                            ) {
                                              updatePlan((prev) =>
                                                moveTalkBetweenSessions(
                                                  prev,
                                                  talk.slotId,
                                                  e.target.value
                                                )
                                              );
                                            }
                                          }}
                                          className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 max-w-[140px] cursor-pointer"
                                        >
                                          {allSessions.map((item) => (
                                            <option
                                              key={item.session.id}
                                              value={item.session.id}
                                            >
                                              Day{" "}
                                              {
                                                plan.days.find(
                                                  (d) => d.id === item.dayId
                                                )?.dayNumber
                                              }
                                              : {item.session.title}
                                            </option>
                                          ))}
                                        </select>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingTalkId((curr) =>
                                              curr === talk.slotId
                                                ? null
                                                : talk.slotId
                                            )
                                          }
                                          className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-primary cursor-pointer"
                                          title="Edit talk title or speaker override"
                                        >
                                          <Pencil size={12} />
                                        </button>

                                        {talk.submissionId && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void handleInspectAbstract(
                                                talk.submissionId
                                              )
                                            }
                                            className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-primary cursor-pointer"
                                            title="View 1-page abstract"
                                          >
                                            <Eye size={12} />
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            updatePlan((prev) =>
                                              removeTalkFromSession(prev, talk.slotId)
                                            )
                                          }
                                          className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-rose-600 cursor-pointer"
                                          title="Remove from session"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Talk Metadata */}
                                    <div className="pl-5 space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {talk.submissionId ? (
                                          <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary tabular-nums">
                                            {talk.submissionId}
                                          </span>
                                        ) : (
                                          <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">
                                            Invited / Custom
                                          </span>
                                        )}
                                        <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
                                          {talk.researchTrack}
                                        </span>
                                        {talk.isStudentAward && (
                                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                                            <GraduationCap size={10} /> Student Award
                                          </span>
                                        )}
                                        {talk.medianCombinedScore !== null && (
                                          <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                                            Score {formatMedianScore(talk.medianCombinedScore)}
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-sm font-semibold text-slate-900 leading-snug">
                                        <ScientificText text={talk.title} />
                                      </div>
                                      {talk.authorsLine && (
                                        <div className="text-xs text-slate-600">
                                          <ScientificText text={talk.authorsLine} />
                                        </div>
                                      )}

                                      {isEditingDetails && (
                                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-2 text-xs">
                                          <input
                                            type="text"
                                            value={talk.title}
                                            onChange={(e) =>
                                              handleUpdateTalkContent(
                                                session.id,
                                                talk.slotId,
                                                { title: e.target.value }
                                              )
                                            }
                                            placeholder="Program display title"
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                                          />
                                          <input
                                            type="text"
                                            value={talk.authorsLine}
                                            onChange={(e) =>
                                              handleUpdateTalkContent(
                                                session.id,
                                                talk.slotId,
                                                { authorsLine: e.target.value }
                                              )
                                            }
                                            placeholder="Program author & affiliation line"
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                                          />
                                          <div className="flex justify-between items-center text-[11px] text-slate-500">
                                            <span>
                                              Supports HTML tags (&lt;i&gt;, &lt;sub&gt;, &lt;sup&gt;)
                                              and $...$ equations in DOCX/PDF exports.
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setEditingTalkId(null)}
                                              className="font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                              Done
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}

          {/* Accepted Poster Appendix Preview Card */}
          {plan.posters.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    Accepted Poster Presentations ({plan.posters.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {plan.includePosterAppendix
                      ? "Included as a poster directory table at the end of PDF and DOCX exports."
                      : "Excluded from PDF/DOCX exports (enable above to include)."}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {plan.posters.map((poster) => (
                  <div
                    key={poster.submissionId}
                    className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {poster.posterNumber}
                        </span>
                        <span className="font-semibold text-slate-900">
                          <ScientificText text={poster.title} />
                        </span>
                      </div>
                      <div className="text-slate-600">{poster.authorsLine}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleInspectAbstract(poster.submissionId)
                      }
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-primary font-semibold shrink-0 cursor-pointer"
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
