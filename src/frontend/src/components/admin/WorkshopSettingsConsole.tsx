"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Globe,
  History,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  WORKSHOP_FIELD_CATALOG,
  WORKSHOP_SECTIONS,
  computeWorkshopConfigDiff,
  evaluateRegistrationSchedule,
  formatDateInputIso,
  formatDateRangeDisplay,
  formatHumanDateFromIso,
  type RegistrationMode,
  type UpcomingWorkshopConfig,
  type WorkshopCycleStage,
} from "@/utils/upcomingWorkshop";
import {
  isPreviewRecordActive,
  useWorkshopConfigAdmin,
  type WorkshopDiffEntry,
  type WorkshopHistoryEntry,
  type WorkshopPreviewRecord,
} from "@/hooks/useWorkshopConfigAdmin";

type ConsoleTab = "editor" | "previews" | "history";

const REGISTRATION_MODE_OPTIONS: {
  value: RegistrationMode;
  title: string;
  badge: string;
  description: string;
}[] = [
  {
    value: "auto_schedule",
    title: "Automatic Schedule (Recommended)",
    badge: "Auto-Advance",
    description:
      "Automatically opens registration, switches from Early Bird to Regular pricing, and closes on the configured ISO dates below.",
  },
  {
    value: "open_manual",
    title: "Open Registration Manually",
    badge: "Force Open",
    description:
      "Keeps public registration open right now regardless of opening or closing dates (pricing tier still follows the Early Bird cutoff).",
  },
  {
    value: "paused_closed",
    title: "Pause / Close Registration",
    badge: "Force Closed",
    description:
      "Immediately switches all registration forms to Notice-Me / Waitlist mode without deleting any saved dates or fees.",
  },
];

const CYCLE_STAGE_OPTIONS: { value: WorkshopCycleStage; label: string }[] = [
  { value: "save_the_date", label: "Save the Date (Planning / Venue Announcements)" },
  { value: "open", label: "Open Cycle (Active CFP & Registration)" },
  { value: "program_published", label: "Program Published (Schedule Finalized)" },
  { value: "concluded", label: "Concluded (Post-Workshop Archive Transition)" },
];

function formatTimestamp(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValueForDisplay(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Enabled (Yes)" : "Disabled (No)";
  }
  if (value === null || value === undefined || String(value).trim() === "") {
    return "(empty)";
  }
  return String(value);
}

export default function WorkshopSettingsConsole() {
  const {
    user,
    authLoading,
    isAdmin,
    isCloudBacked,
    loading,
    busyAction,
    feedbackMsg,
    errorMsg,
    clearMessages,
    reloadAll,
    liveConfig,
    liveVersion,
    liveUpdatedAt,
    liveUpdatedBy,
    draftConfig,
    draftUpdatedAt,
    dirtyDiffs,
    diffsVsLive,
    hasUnsavedChanges,
    hasUnpublishedChanges,
    validationIssues,
    hasBlockingErrors,
    allPreviews,
    activePreviews,
    historyEntries,
    updateDraftField,
    updateDraftFields,
    saveDraft,
    resetDraftToLive,
    publishDraftToLive,
    createPreviewLink,
    revokePreviewLink,
    loadHistoryIntoDraft,
    rollbackToVersion,
    prepareNextCycleInDraft,
    downloadJsonBackup,
    downloadCsvBackup,
    importJsonBackup,
  } = useWorkshopConfigAdmin();

  const [activeTab, setActiveTab] = useState<ConsoleTab>("editor");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("all");

  // Quick Share Preview modal
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareLabelInput, setShareLabelInput] = useState<string>(
    `Board Draft Review (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
  );
  const [shareDaysValid, setShareDaysValid] = useState<number>(14);
  const [justCreatedPreviewUrl, setJustCreatedPreviewUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Publish Diff modal
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  const [publishSummaryInput, setPublishSummaryInput] = useState<string>("");

  // Reset Draft confirmation
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  // Next Cycle confirmation
  const [nextCycleConfirmOpen, setNextCycleConfirmOpen] = useState<boolean>(false);

  // Rollback modal & expanded history diffs
  const [rollbackTarget, setRollbackTarget] = useState<WorkshopHistoryEntry | null>(null);
  const [rollbackReasonInput, setRollbackReasonInput] = useState<string>("");
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});
  const [showInactivePreviews, setShowInactivePreviews] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const schedulePreview = useMemo(
    () => evaluateRegistrationSchedule(draftConfig),
    [draftConfig]
  );

  const dirtyKeySet = useMemo(
    () => new Set(dirtyDiffs.map((d) => String(d.key))),
    [dirtyDiffs]
  );

  const liveDiffKeySet = useMemo(
    () => new Set(diffsVsLive.map((d) => String(d.key))),
    [diffsVsLive]
  );

  const issuesByField = useMemo(() => {
    const map = new Map<string, typeof validationIssues>();
    for (const issue of validationIssues) {
      const k = String(issue.fieldKey ?? "global");
      const list = map.get(k) || [];
      list.push(issue);
      map.set(k, list);
    }
    return map;
  }, [validationIssues]);

  const rollbackDiffs: WorkshopDiffEntry[] = useMemo(() => {
    if (!rollbackTarget) return [];
    return computeWorkshopConfigDiff(liveConfig, rollbackTarget.config);
  }, [liveConfig, rollbackTarget]);

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return WORKSHOP_SECTIONS.filter(
      (sec) => activeSectionFilter === "all" || sec.id === activeSectionFilter
    )
      .map((sec) => {
        const fields = WORKSHOP_FIELD_CATALOG.filter((field) => {
          if (field.section !== sec.id) return false;
          if (!q) return true;
          const haystack = [
            field.label,
            String(field.key),
            field.helpText,
            ...field.usedOnPages.map((p) => `${p.label} ${p.href}`),
            String(draftConfig[field.key] ?? ""),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });
        return { section: sec, fields };
      })
      .filter((group) => group.fields.length > 0);
  }, [activeSectionFilter, draftConfig, searchTerm]);

  const inactivePreviews = useMemo(
    () => allPreviews.filter((p) => !isPreviewRecordActive(p)),
    [allPreviews]
  );

  const handleCopyText = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      window.setTimeout(() => setCopiedUrl((curr) => (curr === url ? null : curr)), 2200);
    } catch {
      // Fallback ignored
    }
  };

  const handleOpenPublishModal = () => {
    const labels = diffsVsLive.slice(0, 3).map((d) => d.label);
    const suffix = diffsVsLive.length > 3 ? ` (+${diffsVsLive.length - 3} more)` : "";
    setPublishSummaryInput(
      labels.length > 0
        ? `Updated ${labels.join(", ")}${suffix}`
        : `Published Version #${liveVersion + 1} review`
    );
    setPublishModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    const ok = await publishDraftToLive(publishSummaryInput);
    if (ok) {
      setPublishModalOpen(false);
    }
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createPreviewLink(shareLabelInput, shareDaysValid);
    if (res?.url) {
      setJustCreatedPreviewUrl(res.url);
    }
  };

  const handleConfirmRollback = async () => {
    if (!rollbackTarget) return;
    const ok = await rollbackToVersion(rollbackTarget, rollbackReasonInput);
    if (ok) {
      setRollbackTarget(null);
      setRollbackReasonInput("");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importJsonBackup(file);
    e.target.value = "";
    setActiveTab("editor");
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white border border-slate-200/95 rounded-2xl p-10 text-center shadow-sm">
        <Loader2 className="animate-spin text-primary mx-auto mb-3" size={28} />
        <p className="text-sm font-semibold text-slate-700">
          Loading HEMS Workshop Control Center...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Verifying administrator authorization and syncing live/draft state.
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 md:p-10 shadow-sm max-w-2xl mx-auto my-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-900">
          Administrator Access Required
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Only users explicitly assigned the <strong>Admin</strong> role can edit staged workshop
          settings, generate Board preview links, publish changes to the live website, or execute a
          version rollback.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <ShieldCheck size={14} /> Return to Admin Overview
          </Link>
        </div>
      </div>
    );
  }

  const startHuman = formatHumanDateFromIso(draftConfig.conference_start_date);
  const autoComputedDateRange = formatDateRangeDisplay(
    draftConfig.conference_start_date,
    draftConfig.conference_end_date
  );
  const needsDateRangeSync =
    Boolean(autoComputedDateRange) &&
    autoComputedDateRange !== draftConfig.exact_dates;

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="bg-white border border-slate-200/95 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Globe size={12} /> LIVE VERSION #{liveVersion} ({liveConfig.workshop_ordinal}{" "}
                &bull; {liveConfig.workshop_year})
              </span>
              {hasUnpublishedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                  <Sparkles size={12} /> {diffsVsLive.length} Staged Difference
                  {diffsVsLive.length === 1 ? "" : "s"} vs. Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <CheckCircle2 size={12} className="text-emerald-600" /> Draft Matches Live
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
                {isCloudBacked ? "Firestore Live Sync" : "Local Sandbox (localStorage)"}
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Workshop Control Center
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Edit upcoming conference dates, pricing, CFP status, and venue details safely in{" "}
              <strong>Draft</strong>—nothing changes for visitors until you review diffs and publish.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
              <span>
                <strong>Live published:</strong> {formatTimestamp(liveUpdatedAt)} by {liveUpdatedBy}
              </span>
              {draftUpdatedAt && (
                <span>
                  <strong>Last draft save:</strong> {formatTimestamp(draftUpdatedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ShieldCheck size={14} /> Role Whitelist
            </Link>
            <button
              type="button"
              onClick={() => void reloadAll()}
              disabled={Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Sticky Primary Action Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {dirtyDiffs.length} unsaved edit{dirtyDiffs.length === 1 ? "" : "s"} in form
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 px-1">
                <CheckCircle2 size={14} className="text-emerald-600" /> All editor edits saved to staging
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setJustCreatedPreviewUrl(null);
                setShareModalOpen(true);
              }}
              disabled={Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Share2 size={14} /> Share Board Review Link
            </button>

            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              disabled={!hasUnpublishedChanges || Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} /> Discard Draft Changes
            </button>

            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={!hasUnsavedChanges || Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busyAction === "saveDraft" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Draft
            </button>

            <button
              type="button"
              onClick={handleOpenPublishModal}
              disabled={hasBlockingErrors || !hasUnpublishedChanges || Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Rocket size={14} /> Review &amp; Publish to Live...
            </button>
          </div>
        </div>
      </div>

      {/* Feedback / Error / Validation Alerts */}
      {feedbackMsg && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 text-red-900 rounded-xl px-4 py-3 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-red-700 hover:text-red-950 p-0.5 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {validationIssues.length > 0 && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            hasBlockingErrors
              ? "bg-red-50/90 border-red-200 text-red-900"
              : "bg-amber-50/90 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold mb-1.5">
            <AlertTriangle
              size={16}
              className={hasBlockingErrors ? "text-red-600" : "text-amber-600"}
            />
            <span>
              {hasBlockingErrors
                ? "Fix Blocking Issues Before Publishing to Live"
                : "Configuration Warnings (Review Recommended Before Publishing)"}
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            {validationIssues.map((issue, idx) => (
              <li key={`${String(issue.fieldKey ?? "global")}-${idx}`}>
                <strong className="uppercase text-[10px] mr-1.5">
                  [{issue.severity === "error" ? "Required Fix" : "Warning"}]
                </strong>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main 3-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("editor")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === "editor"
              ? "bg-white border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          Edit Workshop Settings ({WORKSHOP_FIELD_CATALOG.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("previews")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === "previews"
              ? "bg-white border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <Eye size={14} /> Board Review Links
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-900">
            {activePreviews.length} active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === "history"
              ? "bg-white border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <History size={14} /> Audit Trail &amp; Rollback
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {historyEntries.length}
          </span>
        </button>
      </div>

      {/* TAB 1: WORKSHOP SETTINGS EDITOR */}
      {activeTab === "editor" && (
        <div className="space-y-6">
          {/* Live Auto-Advance Schedule Preview Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300 mb-1">
                  <Clock size={13} /> Live Auto-Advance Calculator (Using Your Current Draft Dates)
                </div>
                <p className="text-sm text-slate-200">
                  Right now under this Draft configuration, visitors see:
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    schedulePreview.isOpen
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/50"
                      : "bg-amber-500/20 text-amber-200 border-amber-400/50"
                  }`}
                >
                  Registration: {schedulePreview.isOpen ? "OPEN" : "CLOSED / NOTICE-ME"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-100 border border-sky-400/40">
                  Phase: {schedulePreview.statusBadgeLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
                  Pricing Tier: {schedulePreview.isEarlyBirdActive ? "Early Bird Rates" : "Regular Rates"}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Section Filter Bar */}
          <div className="bg-white border border-slate-200/95 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any setting, value, or website page (e.g. Early Bird, venue, sponsors)..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSectionFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSectionFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Sections
              </button>
              {WORKSHOP_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionFilter(sec.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeSectionFilter === sec.id
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </div>
          </div>

          {filteredSections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              No workshop settings matched &ldquo;{searchTerm}&rdquo;.
            </div>
          ) : (
            filteredSections.map(({ section, fields }) => (
              <section
                key={section.id}
                className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-slate-900">
                      {section.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">{section.subtitle}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-center">
                    {fields.length} setting{fields.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {fields.map((field) => {
                    const key = field.key;
                    const value = draftConfig[key];
                    const liveValue = liveConfig[key];
                    const isDirty = dirtyKeySet.has(String(key));
                    const differsFromLive = liveDiffKeySet.has(String(key));
                    const fieldIssues = issuesByField.get(String(key)) || [];
                    const isIsoConferenceDate =
                      key === "conference_start_date" || key === "conference_end_date";
                    const isoDatePreview =
                      field.controlType === "date"
                        ? formatHumanDateFromIso(String(value || ""))
                        : "";

                    return (
                      <div
                        key={String(key)}
                        className={`p-5 transition-colors ${
                          differsFromLive ? "bg-amber-50/35" : ""
                        }`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Field Description & Page Impact Pills */}
                          <div className="lg:col-span-5 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <label
                                htmlFor={`field-${String(key)}`}
                                className="text-sm font-bold text-slate-900"
                              >
                                {field.label}
                              </label>
                              {isDirty && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold border border-amber-300">
                                  Unsaved
                                </span>
                              )}
                              {!isDirty && differsFromLive && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 text-[10px] font-semibold border border-sky-200">
                                  Staged vs. Live
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {field.helpText}
                            </p>

                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                                Appears on:
                              </span>
                              {field.usedOnPages.map((pageRef, pageIdx) => (
                                <a
                                  key={`${String(key)}-${pageRef.label}-${pageRef.href}-${pageIdx}`}
                                  href={pageRef.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-primary text-slate-700 border border-slate-200 text-[10px] font-medium transition-colors"
                                >
                                  {pageRef.label}
                                  <ExternalLink size={9} />
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Control Input */}
                          <div className="lg:col-span-7 space-y-2">
                            {key === "registration_mode" ? (
                              <div className="grid grid-cols-1 gap-2.5">
                                {REGISTRATION_MODE_OPTIONS.map((opt) => {
                                  const selected = value === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => updateDraftField("registration_mode", opt.value)}
                                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                                        selected
                                          ? "border-primary bg-sky-50/70 ring-2 ring-primary/20"
                                          : "border-slate-200 hover:border-slate-300 bg-white"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-slate-900">
                                          {opt.title}
                                        </span>
                                        <span
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            selected
                                              ? "bg-primary text-white"
                                              : "bg-slate-100 text-slate-600"
                                          }`}
                                        >
                                          {opt.badge}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1">
                                        {opt.description}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : key === "cycle_stage" ? (
                              <select
                                id={`field-${String(key)}`}
                                value={String(value ?? "save_the_date")}
                                onChange={(e) =>
                                  updateDraftField(
                                    "cycle_stage",
                                    e.target.value as WorkshopCycleStage
                                  )
                                }
                                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              >
                                {CYCLE_STAGE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : field.controlType === "boolean" ? (
                              <div className="flex items-center gap-3 pt-1">
                                <button
                                  id={`field-${String(key)}`}
                                  type="button"
                                  role="switch"
                                  aria-checked={Boolean(value)}
                                  onClick={() =>
                                    updateDraftField(
                                      key,
                                      !Boolean(value) as UpcomingWorkshopConfig[typeof key]
                                    )
                                  }
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                    Boolean(value) ? "bg-emerald-600" : "bg-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                      Boolean(value) ? "translate-x-5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                                <span className="text-sm font-semibold text-slate-800">
                                  {Boolean(value) ? "Enabled (Active)" : "Disabled (Off)"}
                                </span>
                              </div>
                            ) : field.controlType === "date" ? (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="relative">
                                    <Calendar
                                      size={14}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                    <input
                                      id={`field-${String(key)}`}
                                      type="date"
                                      value={formatDateInputIso(String(value || ""))}
                                      onChange={(e) => {
                                        const iso = e.target.value;
                                        const formatted = isIsoConferenceDate
                                          ? iso
                                          : formatHumanDateFromIso(iso) || iso;
                                        updateDraftField(
                                          key,
                                          formatted as UpcomingWorkshopConfig[typeof key]
                                        );
                                      }}
                                      className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary tabular-nums"
                                    />
                                  </div>
                                  {!isIsoConferenceDate && (
                                    <input
                                      type="text"
                                      aria-label={`${field.label} display text`}
                                      value={String(value ?? "")}
                                      onChange={(e) =>
                                        updateDraftField(
                                          key,
                                          e.target.value as UpcomingWorkshopConfig[typeof key]
                                        )
                                      }
                                      className="flex-1 min-w-[180px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                  )}
                                  {isIsoConferenceDate && isoDatePreview && (
                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                      Reads as: <strong>{isoDatePreview}</strong>
                                    </span>
                                  )}
                                </div>
                                {key === "conference_end_date" && needsDateRangeSync && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraftField("exact_dates", autoComputedDateRange)
                                    }
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                                  >
                                    <Sparkles size={12} /> Sync Headline Dates (exact_dates) to
                                    &ldquo;{autoComputedDateRange}&rdquo; (currently{" "}
                                    {startHuman ? `"${draftConfig.exact_dates}"` : "empty"})
                                  </button>
                                )}
                              </div>
                            ) : field.controlType === "textarea" ? (
                              <textarea
                                id={`field-${String(key)}`}
                                rows={3}
                                value={String(value ?? "")}
                                onChange={(e) =>
                                  updateDraftField(
                                    key,
                                    e.target.value as UpcomingWorkshopConfig[typeof key]
                                  )
                                }
                                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary leading-relaxed"
                              />
                            ) : field.controlType === "number" ? (
                              <input
                                id={`field-${String(key)}`}
                                type="number"
                                min={1}
                                value={Number(value ?? 1)}
                                onChange={(e) => {
                                  const parsed = Number.parseInt(e.target.value, 10);
                                  updateDraftField(
                                    key,
                                    (Number.isFinite(parsed) ? parsed : 16) as UpcomingWorkshopConfig[typeof key]
                                  );
                                }}
                                className="w-40 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary tabular-nums"
                              />
                            ) : (
                              <input
                                id={`field-${String(key)}`}
                                type={
                                  field.controlType === "url"
                                    ? "url"
                                    : field.controlType === "email"
                                    ? "email"
                                    : "text"
                                }
                                value={String(value ?? "")}
                                onChange={(e) =>
                                  updateDraftField(
                                    key,
                                    e.target.value as UpcomingWorkshopConfig[typeof key]
                                  )
                                }
                                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            )}

                            {/* Show Live value when staged differs */}
                            {differsFromLive && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5">
                                <span>
                                  <strong>Current Live:</strong>{" "}
                                  <span className="font-mono">
                                    {formatValueForDisplay(liveValue)}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateDraftFields({ [key]: liveValue })}
                                  className="text-amber-900 font-semibold underline hover:text-amber-950 cursor-pointer"
                                >
                                  Revert field to Live
                                </button>
                              </div>
                            )}

                            {fieldIssues.map((iss, idx) => (
                              <p
                                key={idx}
                                className={`text-xs font-medium flex items-center gap-1.5 ${
                                  iss.severity === "error" ? "text-red-700" : "text-amber-800"
                                }`}
                              >
                                <AlertTriangle size={12} /> {iss.message}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* TAB 2: BOARD REVIEW LINKS */}
      {activeTab === "previews" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Zero-Login Shareable Board Preview Links
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                  Send any link below to Board members or committee reviewers. They see your{" "}
                  <strong>staged Draft</strong> right inside the live website UI with a persistent{" "}
                  <strong>[Draft | Switch to Live]</strong> comparison toggle—no login required, and
                  Google Analytics &amp; search indexing stay paused during preview sessions.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateShareLink}
              className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Link Label (visible in banner to Board reviewers)
                </label>
                <input
                  type="text"
                  value={shareLabelInput}
                  onChange={(e) => setShareLabelInput(e.target.value)}
                  placeholder="e.g., Nov 16 Executive Committee Date & Fee Review"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Expiration Window
                </label>
                <select
                  value={shareDaysValid}
                  onChange={(e) => setShareDaysValid(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days (Recommended)</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={Boolean(busyAction)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busyAction === "createPreview" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Link2 size={14} />
                  )}
                  Generate Preview Link
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Active Review Links ({activePreviews.length})
              </h3>
              {inactivePreviews.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowInactivePreviews((v) => !v)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {showInactivePreviews
                    ? "Hide Expired/Revoked"
                    : `Show ${inactivePreviews.length} Expired/Revoked`}
                </button>
              )}
            </div>

            {activePreviews.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No active Board Review links right now. Generate one above whenever you want
                trustees to review staged changes before publishing Live.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activePreviews.map((rec: WorkshopPreviewRecord) => {
                  const origin =
                    typeof window !== "undefined"
                      ? window.location.origin
                      : "https://hems-workshop.org";
                  const fullUrl = `${origin}/?preview=${rec.token}`;

                  return (
                    <div
                      key={rec.token}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {rec.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active until {formatShortDate(rec.expiresAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Created {formatTimestamp(rec.createdAt)} by {rec.createdByEmail}
                        </p>
                        <p className="text-xs font-mono text-slate-600 truncate bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1">
                          {fullUrl}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleCopyText(fullUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <Copy size={13} />
                          {copiedUrl === fullUrl ? "Copied!" : "Copy Link"}
                        </button>
                        <a
                          href={`/?preview=${rec.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-900"
                        >
                          <ExternalLink size={13} /> Open Preview
                        </a>
                        <button
                          type="button"
                          onClick={() => void revokePreviewLink(rec.token)}
                          disabled={busyAction === `revoke_${rec.token}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Revoke
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showInactivePreviews && inactivePreviews.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50/70 divide-y divide-slate-200/70">
                {inactivePreviews.map((rec) => (
                  <div
                    key={rec.token}
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"
                  >
                    <div>
                      <span className="font-semibold text-slate-700">{rec.label}</span>{" "}
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {rec.revoked ? "Revoked" : "Expired"}
                      </span>
                    </div>
                    <span>
                      Created {formatShortDate(rec.createdAt)} by {rec.createdByEmail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL, ROLLBACK & BIENNIAL CYCLE BACKUPS */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Immutable Audit Trail */}
          <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Immutable Version Audit Trail &amp; 1-Click Rollback
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Every published update and rollback creates a permanent, append-only version record.
                Rolling back immediately restores any past snapshot cleanly without overwriting history.
              </p>
            </div>

            {historyEntries.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No historical versions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {historyEntries.map((entry) => {
                  const isCurrentLive = entry.versionNumber === liveVersion;
                  const isExpanded = Boolean(expandedHistoryIds[entry.versionId]);

                  return (
                    <div key={entry.versionId} className="p-5 space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Version #{entry.versionNumber}
                            </span>

                            {isCurrentLive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                LIVE NOW
                              </span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                entry.actionType === "rollback"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : entry.actionType === "seed"
                                  ? "bg-slate-100 text-slate-700 border-slate-200"
                                  : "bg-sky-50 text-sky-800 border-sky-200"
                              }`}
                            >
                              {entry.actionType === "rollback"
                                ? `Rollback to #${entry.rolledBackFromVersion ?? "?"}`
                                : entry.actionType === "seed"
                                ? "Initial Baseline"
                                : "Published Update"}
                            </span>

                            <span className="text-xs text-slate-500">
                              {formatTimestamp(entry.createdAt)} ·{" "}
                              <strong>{entry.createdByName || entry.createdByEmail}</strong>
                            </span>
                          </div>

                          <p className="text-sm text-slate-800 font-medium">
                            {entry.changeSummary || "Configuration snapshot recorded."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {entry.diffsFromPrevious.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedHistoryIds((prev) => ({
                                  ...prev,
                                  [entry.versionId]: !prev[entry.versionId],
                                }))
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              {entry.diffsFromPrevious.length} field change
                              {entry.diffsFromPrevious.length === 1 ? "" : "s"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              loadHistoryIntoDraft(entry);
                              setActiveTab("editor");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            Copy into Draft
                          </button>

                          {!isCurrentLive && (
                            <button
                              type="button"
                              onClick={() => {
                                setRollbackTarget(entry);
                                setRollbackReasonInput(
                                  `Restored Version #${entry.versionNumber} snapshot.`
                                );
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-semibold text-amber-900 cursor-pointer"
                            >
                              <RotateCcw size={13} /> Roll Back Live...
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && entry.diffsFromPrevious.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Setting</th>
                                <th className="px-3 py-2 font-semibold">Previous</th>
                                <th className="px-3 py-2 font-semibold">New Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80">
                              {entry.diffsFromPrevious.map((d) => (
                                <tr key={`${entry.versionId}-${String(d.key)}`}>
                                  <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">
                                    {d.label}
                                  </td>
                                  <td className="px-3 py-2 text-slate-500 font-mono break-all">
                                    {formatValueForDisplay(d.beforeValue)}
                                  </td>
                                  <td className="px-3 py-2 text-slate-900 font-mono break-all">
                                    {formatValueForDisplay(d.afterValue)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Offline Backups & Biennial Rollover */}
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Offline Backups &amp; 2-Year Biennial Rollover Tools
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Export your current Draft settings for archival, restore from a JSON backup into Draft,
              or initialize the next biennial workshop cycle (+2 years template) for staging review.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => downloadJsonBackup()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Download size={14} /> Download JSON Backup
              </button>

              <button
                type="button"
                onClick={() => downloadCsvBackup()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Download size={14} /> Export CSV Snapshot
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Upload size={14} /> Restore JSON Backup into Draft
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setNextCycleConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-900 cursor-pointer"
              >
                <Sparkles size={14} /> Start Next Biennial Cycle in Draft...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SHARE BOARD REVIEW LINK */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Share Board Review Link
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Saves your latest edits into Draft and generates an unlisted zero-login review URL
                  with an interactive <strong>[Draft | Switch to Live]</strong> toggle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {justCreatedPreviewUrl ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Ready to Send to Board
                  </div>
                  <p className="text-xs font-mono text-slate-800 bg-white border border-emerald-200 rounded-lg p-2.5 break-all">
                    {justCreatedPreviewUrl}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyText(justCreatedPreviewUrl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    <Copy size={14} />
                    {copiedUrl === justCreatedPreviewUrl ? "Copied to Clipboard!" : "Copy Share URL"}
                  </button>
                  <a
                    href={justCreatedPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold"
                  >
                    <ExternalLink size={14} /> Open Preview Now
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateShareLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Session Name
                  </label>
                  <input
                    type="text"
                    value={shareLabelInput}
                    onChange={(e) => setShareLabelInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expires Automatically After
                  </label>
                  <select
                    value={shareDaysValid}
                    onChange={(e) => setShareDaysValid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days (Recommended)</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(busyAction)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === "createPreview" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Share2 size={14} />
                    )}
                    Save Draft &amp; Generate Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: PRE-PUBLISH VISUAL DIFF CONFIRMATION */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Review Changes Before Publishing Live
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Publishing replaces <strong>Live Version #{liveVersion}</strong> with{" "}
                  <strong>Version #{liveVersion + 1}</strong> across the entire public website
                  immediately. Past versions stay saved for 1-click rollback.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto border border-slate-200 rounded-xl flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Setting</th>
                    <th className="px-3 py-2 font-semibold">Current Live (#{liveVersion})</th>
                    <th className="px-3 py-2 font-semibold">Proposed Live (#{liveVersion + 1})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {diffsVsLive.map((diff) => (
                    <tr key={String(diff.key)}>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{diff.label}</td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono break-all">
                        {formatValueForDisplay(diff.beforeValue)}
                      </td>
                      <td className="px-3 py-2.5 text-emerald-800 font-semibold font-mono break-all bg-emerald-50/40">
                        {formatValueForDisplay(diff.afterValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Log Change Note (saved permanently with Version #{liveVersion + 1})
              </label>
              <input
                type="text"
                value={publishSummaryInput}
                onChange={(e) => setPublishSummaryInput(e.target.value)}
                placeholder="e.g., Board approved Tampa dates and Early Bird fee schedule"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmPublish()}
                disabled={busyAction === "publish"}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {busyAction === "publish" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Rocket size={14} />
                )}
                Confirm &amp; Publish Live Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ROLLBACK VISUAL DIFF CONFIRMATION */}
      {rollbackTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Roll Back Live Website to Version #{rollbackTarget.versionNumber}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  This creates a brand-new <strong>Live Version #{liveVersion + 1}</strong> restoring
                  the exact settings from Version #{rollbackTarget.versionNumber} (
                  {formatShortDate(rollbackTarget.createdAt)}). All history remains preserved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {rollbackDiffs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Version #{rollbackTarget.versionNumber} already has identical values to current Live
                Version #{liveVersion}.
              </div>
            ) : (
              <div className="overflow-y-auto border border-slate-200 rounded-xl flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Setting</th>
                      <th className="px-3 py-2 font-semibold">Current Live (#{liveVersion})</th>
                      <th className="px-3 py-2 font-semibold">
                        Will Restore From (#{rollbackTarget.versionNumber})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rollbackDiffs.map((diff) => (
                      <tr key={String(diff.key)}>
                        <td className="px-3 py-2 font-semibold text-slate-900">{diff.label}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono break-all">
                          {formatValueForDisplay(diff.beforeValue)}
                        </td>
                        <td className="px-3 py-2 text-amber-900 font-semibold font-mono break-all bg-amber-50/50">
                          {formatValueForDisplay(diff.afterValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rollback Audit Reason
              </label>
              <input
                type="text"
                value={rollbackReasonInput}
                onChange={(e) => setRollbackReasonInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRollback()}
                disabled={busyAction === "rollback"}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {busyAction === "rollback" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowLeftRight size={14} />
                )}
                Confirm Instant Rollback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DISCARD DRAFT CONFIRMATION */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Discard All Staged Draft Changes?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This resets your Draft editor back to match <strong>Live Version #{liveVersion}</strong>.
              Any unpublished changes in Draft will be erased, while the public website and Version
              Audit Trail remain untouched.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Keep Editing Draft
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await resetDraftToLive();
                  if (ok) setResetConfirmOpen(false);
                }}
                disabled={busyAction === "resetDraft"}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Yes, Reset Draft to Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: NEXT BIENNIAL CYCLE CONFIRMATION */}
      {nextCycleConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Load Next Biennial Cycle Template (+2 Years) into Draft?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This populates your <strong>Draft editor only</strong> with incremented ordinal/year
              placeholders and paused registration for safe preparation. The Live website does not
              change until you review and publish.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNextCycleConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  prepareNextCycleInDraft();
                  setNextCycleConfirmOpen(false);
                  setActiveTab("editor");
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold cursor-pointer"
              >
                Load Cycle Template into Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
