"use client";

import React, { useState, useMemo, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  Upload,
  Download,
  UserPlus,
  Search,
  CheckCircle2,
  MailX,
  AlertTriangle,
  RefreshCw,
  Send,
  Trash2,
  Info,
  Tags,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Inbox,
  ExternalLink,
  ClipboardPaste,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMailingAdmin } from "@/hooks/useMailingAdmin";
import {
  MailchimpParsedRow,
  MailingInterest,
  MailingSubscriber,
  SubscriberStatus,
} from "@/types/mailing";
import {
  normalizeSublistTag,
  parseMailchimpCsvExport,
} from "@/utils/mailingTemplate";
import { hasBoardOrAdminRole } from "@/utils/telemetryClient";
import MailingSystemInfoModal from "@/components/mailing/MailingSystemInfoModal";
import CsvImportFormatModal from "@/components/mailing/CsvImportFormatModal";
import GoogleSheetsPasteModal from "@/components/mailing/GoogleSheetsPasteModal";
import MailingExportModal from "@/components/mailing/MailingExportModal";

const STATUS_BADGE: Record<
  SubscriberStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  pending_opt_in: {
    label: "Pending Opt-In",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  unsubscribed: {
    label: "Unsubscribed",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  bounced: {
    label: "Hard Bounced",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  complained: {
    label: "Complained",
    className: "bg-red-100 text-red-900 border-red-300",
  },
};

type CohortViewFilter = "all_records" | "all_active" | `sublist:${string}`;

type SortField =
  | "subscriber"
  | "institution"
  | "tags"
  | "status"
  | "date_added";

type SortDirection = "asc" | "desc";

const STATUS_SORT_ORDER: Record<SubscriberStatus, number> = {
  active: 1,
  pending_opt_in: 2,
  unsubscribed: 3,
  bounced: 4,
  complained: 5,
};

const SOURCE_LABEL: Record<MailingSubscriber["source"], string> = {
  mailchimp_import: "CSV Import",
  website: "Website Opt-In",
  board_manual: "Board Manual Entry",
};

function formatDateAdded(iso: string | undefined): {
  short: string;
  tooltip: string;
  timestampMs: number;
} {
  if (!iso) {
    return { short: "—", tooltip: "Date not recorded", timestampMs: 0 };
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return { short: iso.slice(0, 10) || "—", tooltip: iso, timestampMs: 0 };
  }
  const short = new Date(ms).toISOString().slice(0, 10);
  const tooltip = new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { short, tooltip, timestampMs: ms };
}

export default function BoardMailingListPage() {
  const { user, loading } = useAuth();
  const isAuthorized = Boolean(user && hasBoardOrAdminRole(user.roles));

  const {
    subscribers,
    availableSublists,
    isLiveFirestore,
    pendingRequests,
    contactInquiries,
    loadingData,
    errorMessage,
    createSublist,
    deleteSublist,
    updateSubscriberSublists,
    bulkModifySublists,
    upsertSubscriber,
    updateSubscriberStatus,
    removeSubscriber,
    importMailchimpRows,
    applyPendingPublicRequests,
    resolveContactInquiry,
  } = useMailingAdmin(isAuthorized);

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [csvFormatModalOpen, setCsvFormatModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriberStatus>("all");
  const [cohortFilter, setCohortFilter] = useState<CohortViewFilter>("all_records");
  const [sortField, setSortField] = useState<SortField>("subscriber");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const handleSortColumn = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Date Added is most naturally inspected newest-first on initial click
      setSortDir(field === "date_added" ? "desc" : "asc");
    }
  };

  // Sublist creation & bulk tagging state
  const [newSublistInput, setNewSublistInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // CSV importer state
  const [importMode, setImportMode] = useState<"auto" | SubscriberStatus>("auto");
  const [importSublistTag, setImportSublistTag] = useState("");
  const [importing, setImporting] = useState(false);

  const [feedbackBanner, setFeedbackBanner] = useState("");
  const [actionError, setActionError] = useState("");

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newAffiliation, setNewAffiliation] = useState("");
  const [newInterests, setNewInterests] = useState<MailingInterest[]>(["workshop"]);
  const [newSublists, setNewSublists] = useState<string[]>([]);

  const counts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let unsubscribed = 0;
    let bounced = 0;
    for (const s of subscribers) {
      if (s.status === "active") active += 1;
      else if (s.status === "pending_opt_in") pending += 1;
      else if (s.status === "unsubscribed") unsubscribed += 1;
      else bounced += 1;
    }
    return { active, pending, unsubscribed, bounced, total: subscribers.length };
  }, [subscribers]);

  const sublistStats = useMemo(() => {
    const stats = new Map<string, { total: number; active: number }>();
    for (const tag of availableSublists) {
      stats.set(tag, { total: 0, active: 0 });
    }
    for (const sub of subscribers) {
      for (const rawTag of sub.sublists) {
        const canonical =
          availableSublists.find((t) => t.toLowerCase() === rawTag.toLowerCase()) ||
          rawTag;
        const curr = stats.get(canonical) || { total: 0, active: 0 };
        curr.total += 1;
        if (sub.status === "active") curr.active += 1;
        stats.set(canonical, curr);
      }
    }
    return stats;
  }, [availableSublists, subscribers]);

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = subscribers.filter((s) => {
      if (cohortFilter === "all_active" && s.status !== "active") return false;
      if (cohortFilter.startsWith("sublist:")) {
        const target = cohortFilter.slice("sublist:".length).toLowerCase();
        if (!s.sublists.some((t) => t.toLowerCase() === target)) return false;
      }
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.email.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.affiliation.toLowerCase().includes(q) ||
        s.sublists.some((t) => t.toLowerCase().includes(q))
      );
    });

    const dirMultiplier = sortDir === "asc" ? 1 : -1;

    return [...matched].sort((a, b) => {
      if (sortField === "subscriber") {
        const cmp = a.email.localeCompare(b.email);
        if (cmp !== 0) return cmp * dirMultiplier;
      } else if (sortField === "institution") {
        const instA = a.affiliation.trim();
        const instB = b.affiliation.trim();
        // Keep blank institutions at the bottom regardless of sort direction
        if (!instA && instB) return 1;
        if (instA && !instB) return -1;
        const cmp = instA.localeCompare(instB, undefined, { sensitivity: "base" });
        if (cmp !== 0) return cmp * dirMultiplier;
      } else if (sortField === "tags") {
        const tagsA = [...a.sublists, ...a.interests].join(", ");
        const tagsB = [...b.sublists, ...b.interests].join(", ");
        // Prioritize records with custom sublists over untagged records when sorting ascending
        if (a.sublists.length === 0 && b.sublists.length > 0) return dirMultiplier;
        if (a.sublists.length > 0 && b.sublists.length === 0) return -dirMultiplier;
        const cmp = tagsA.localeCompare(tagsB, undefined, { sensitivity: "base" });
        if (cmp !== 0) return cmp * dirMultiplier;
      } else if (sortField === "status") {
        const rankA = STATUS_SORT_ORDER[a.status] ?? 99;
        const rankB = STATUS_SORT_ORDER[b.status] ?? 99;
        if (rankA !== rankB) return (rankA - rankB) * dirMultiplier;
      } else if (sortField === "date_added") {
        const msA = Date.parse(a.createdAt || "") || 0;
        const msB = Date.parse(b.createdAt || "") || 0;
        if (msA !== msB) return (msA - msB) * dirMultiplier;
      }

      return a.email.localeCompare(b.email);
    });
  }, [subscribers, searchQuery, statusFilter, cohortFilter, sortField, sortDir]);

  const visibleRows = useMemo(
    () => filteredSubscribers.slice(0, 250),
    [filteredSubscribers]
  );

  const allFilteredSelected =
    filteredSubscribers.length > 0 &&
    filteredSubscribers.every((s) => selectedIds.has(s.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-4">Verifying Board credentials...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-red-200 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={44} />
        <h2 className="font-serif text-2xl font-semibold text-slate-900">
          Board Access Required
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Sign in with an authorized HEMS Board Member or Admin account to manage the society mailing list.
        </p>
        <Link
          href="/auth"
          className="mt-6 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Committee Sign In
        </Link>
      </div>
    );
  }

  const handleCreateSublist = async (rawName: string) => {
    setActionError("");
    setFeedbackBanner("");
    try {
      const created = await createSublist(rawName);
      setNewSublistInput("");
      setBulkTagInput(created);
      setFeedbackBanner(`Sublist "${created}" is ready. Assign it via table checkboxes, inline "+ Tag", or CSV upload.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Could not create sublist.");
    }
  };

  const handleDeleteSublist = async (tag: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Remove sublist tag "${tag}" from the catalog and unassign it from subscribers? (Subscriber records themselves will NOT be deleted.)`
      )
    ) {
      return;
    }
    setActionError("");
    setFeedbackBanner("");
    try {
      await deleteSublist(tag);
      if (cohortFilter === `sublist:${tag}`) {
        setCohortFilter("all_records");
      }
      setFeedbackBanner(`Removed sublist tag "${tag}".`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to remove sublist.");
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubscribers.map((s) => s.id)));
    }
  };

  const handleBulkTagAction = async (mode: "add" | "remove") => {
    const cleanTag = normalizeSublistTag(bulkTagInput);
    if (!cleanTag) {
      setActionError("Select or type a sublist/tag name first.");
      return;
    }
    if (selectedIds.size === 0) return;

    setActionError("");
    setFeedbackBanner("");
    setBulkBusy(true);
    try {
      const changed = await bulkModifySublists(
        Array.from(selectedIds),
        cleanTag,
        mode
      );
      setFeedbackBanner(
        mode === "add"
          ? `Added sublist "${cleanTag}" to ${changed} subscriber(s) (${selectedIds.size} selected).`
          : `Removed sublist "${cleanTag}" from ${changed} subscriber(s).`
      );
      setSelectedIds(new Set());
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Bulk tag update failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleInlineAddTag = async (sub: MailingSubscriber, tag: string) => {
    if (!tag) return;
    setActionError("");
    try {
      await updateSubscriberSublists(sub, [...sub.sublists, tag]);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to add tag.");
    }
  };

  const handleInlineRemoveTag = async (sub: MailingSubscriber, tag: string) => {
    setActionError("");
    try {
      await updateSubscriberSublists(
        sub,
        sub.sublists.filter((t) => t.toLowerCase() !== tag.toLowerCase())
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to remove tag.");
    }
  };

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedbackBanner("");
    setActionError("");
    setImporting(true);
    try {
      const csvText = await file.text();
      const rows = parseMailchimpCsvExport(csvText, importMode, importSublistTag);
      if (rows.length === 0) {
        throw new Error(
          "No valid email rows found. Verify the CSV includes an 'Email Address' or 'Email' header column."
        );
      }
      const summary = await importMailchimpRows(rows);
      const tagNote = normalizeSublistTag(importSublistTag)
        ? ` Assigned sublist "${normalizeSublistTag(importSublistTag)}".`
        : "";
      setFeedbackBanner(
        `CSV processed (${summary.totalParsed} rows): ${summary.importedActive} active, ${summary.importedSuppressed} suppressed (unsubscribed/bounced), ${summary.skippedProtected} protected opt-outs preserved.${tagNote}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CSV import failed.";
      setActionError(msg);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleImportPastedRows = async (
    rows: MailchimpParsedRow[],
    assignedTag: string
  ) => {
    setFeedbackBanner("");
    setActionError("");
    setImporting(true);
    try {
      const summary = await importMailchimpRows(rows);
      const cleanTag = normalizeSublistTag(assignedTag);
      const tagNote = cleanTag ? ` Assigned sublist "${cleanTag}".` : "";
      setFeedbackBanner(
        `Pasted list imported (${summary.totalParsed} rows): ${summary.importedActive} active, ${summary.skippedProtected} protected opt-outs preserved.${tagNote}`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to import pasted list.";
      setActionError(msg);
      throw err;
    } finally {
      setImporting(false);
    }
  };

  const handleManualAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError("");
    setFeedbackBanner("");
    try {
      await upsertSubscriber({
        email: newEmail,
        firstName: newFirst,
        lastName: newLast,
        affiliation: newAffiliation,
        interests: newInterests,
        sublists: newSublists,
        status: "active",
      });
      setFeedbackBanner(`Added/updated ${newEmail.trim().toLowerCase()} as Active.`);
      setNewEmail("");
      setNewFirst("");
      setNewLast("");
      setNewAffiliation("");
      setNewSublists([]);
      setShowAddForm(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to add subscriber.");
    }
  };

  const handleSyncRequests = async () => {
    setActionError("");
    try {
      const count = await applyPendingPublicRequests();
      setFeedbackBanner(`Applied ${count} pending public signup/unsubscribe request(s).`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to sync requests.");
    }
  };

  const toggleNewInterest = (id: MailingInterest) => {
    setNewInterests((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((x) => x !== id)
          : prev
        : [...prev, id]
    );
  };

  const toggleNewSublistChoice = (tag: string) => {
    setNewSublists((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  };

  const handleStatusChange = async (
    sub: MailingSubscriber,
    next: SubscriberStatus
  ) => {
    setActionError("");
    try {
      await updateSubscriberStatus(sub, next);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Status update failed.");
    }
  };

  const composeHref = cohortFilter.startsWith("sublist:")
    ? `/board/announcements?segment=${encodeURIComponent(cohortFilter)}`
    : "/board/announcements";

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
            Board Communications • Postmark Broadcast Hygiene
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-2.5">
            <Users className="text-primary shrink-0" size={26} /> Mailing List &amp; Sublists
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage master subscribers in Google Cloud Firestore (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">hems-workshop</code>), organize cohort sublists, and protect <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">hems-workshop.org</code> sender reputation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setInfoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-primary/5 border border-primary/25 text-primary text-xs sm:text-sm font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Info size={15} /> How Mailing &amp; Postmark Work
          </button>
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
          >
            <Download size={14} /> Export List
          </button>
          <Link
            href={composeHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Send size={14} /> Compose Announcement
          </Link>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setCohortFilter("all_active");
            setStatusFilter("all");
          }}
          className={`text-left bg-white border rounded-xl p-4 shadow-2xs transition-colors cursor-pointer ${
            cohortFilter === "all_active"
              ? "border-emerald-500 ring-2 ring-emerald-500/15"
              : "border-slate-200/95 hover:border-emerald-300"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            All Active Subscribed
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums mt-1 block">
            {counts.active}
          </span>
          <span className="text-[11px] text-slate-500">Eligible for Postmark Broadcast</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCohortFilter("all_records");
            setStatusFilter("pending_opt_in");
          }}
          className="text-left bg-white border border-slate-200/95 hover:border-amber-300 rounded-xl p-4 shadow-2xs transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Pending Opt-In
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums mt-1 block">
            {counts.pending}
          </span>
          <span className="text-[11px] text-slate-500">Awaiting inbox confirmation</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCohortFilter("all_records");
            setStatusFilter("unsubscribed");
          }}
          className="text-left bg-white border border-slate-200/95 hover:border-slate-300 rounded-xl p-4 shadow-2xs transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Unsubscribed
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-700 tabular-nums mt-1 block">
            {counts.unsubscribed}
          </span>
          <span className="text-[11px] text-slate-500">Protected opt-out suppression</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCohortFilter("all_records");
            setStatusFilter("bounced");
          }}
          className="text-left bg-white border border-slate-200/95 hover:border-red-300 rounded-xl p-4 shadow-2xs transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Bounced / Complained
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-red-700 tabular-nums mt-1 block">
            {counts.bounced}
          </span>
          <span className="text-[11px] text-slate-500">Auto-suppressed dead addresses</span>
        </button>
      </div>

      {/* Pending Web Requests Notice (Preview / Static Fallback Sync) */}
      {pendingRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-amber-900">
            <strong>{pendingRequests.length} pending web form request(s)</strong> submitted via static preview queue.
          </div>
          <button
            type="button"
            onClick={() => void handleSyncRequests()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw size={13} /> Sync {pendingRequests.length} Request(s) Now
          </button>
        </div>
      )}

      {/* Conditional Online Contact Inquiries Banner (Shown only when open inquiries exist) */}
      {contactInquiries.length > 0 && (
        <section className="bg-white border border-primary/25 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Inbox size={17} className="text-primary shrink-0" />
              <span>Website Contact Inquiries ({contactInquiries.length} Open)</span>
            </h2>
            <span className="text-[11px] text-slate-500">Submitted via /contact</span>
          </div>
          <div className="space-y-2.5">
            {contactInquiries.slice(0, 10).map((inq) => {
              const senderName = `${inq.firstName || ""} ${inq.lastName || ""}`.trim() || inq.email;
              const replySubj = `Re: [HEMS Website] ${inq.subject || "Inquiry"}`;
              const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                inq.email
              )}&su=${encodeURIComponent(replySubj)}`;
              return (
                <div
                  key={inq.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs">
                      <strong className="text-slate-900">{inq.subject || "General Society Inquiry"}</strong>{" "}
                      <span className="text-slate-500">
                        • From {senderName} ({inq.email}) → {inq.recipientEmail || "president@hems-workshop.org"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <a
                        href={gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-primary hover:text-primary"
                      >
                        Reply in Gmail <ExternalLink size={11} />
                      </a>
                      <button
                        type="button"
                        onClick={() => void resolveContactInquiry(inq.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold cursor-pointer"
                      >
                        <CheckCircle2 size={11} /> Mark Resolved
                      </button>
                    </div>
                  </div>
                  {inq.message && (
                    <p className="text-xs text-slate-700 whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-200/80">
                      {inq.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {feedbackBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 size={17} className="text-emerald-700 shrink-0 mt-0.5" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {(errorMessage || actionError) && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertTriangle size={17} className="text-red-600 shrink-0 mt-0.5" />
          <span>{actionError || errorMessage}</span>
        </div>
      )}

      {/* CSV Import & Sublist Tagging */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Upload size={18} className="text-primary shrink-0" /> CSV Import &amp; Sublist Tagging
              </h2>
              <button
                type="button"
                onClick={() => setCsvFormatModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 border border-primary/25 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Info size={13} /> CSV Format &amp; Example Heading
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload subscriber CSV rosters (e.g., 2025 Attendees, Presenters, Sponsors) or suppression exports (<em>Unsubscribed</em>, <em>Bounced</em>), or <strong>paste directly from Google Sheets</strong>. Re-uploading an existing email merges your chosen sublist tags while <strong>permanently protecting</strong> unsubscribes and bounces.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
            <input
              type="text"
              list="hems-sublist-suggestions"
              value={importSublistTag}
              onChange={(e) => setImportSublistTag(e.target.value)}
              placeholder="Tag uploaded rows (optional)"
              aria-label="Optional sublist tag to assign to all rows in uploaded CSV"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-xs font-medium text-slate-800 focus:outline-none focus:border-primary sm:w-52"
            />
            <datalist id="hems-sublist-suggestions">
              {availableSublists.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>

            <select
              aria-label="CSV import status mapping"
              value={importMode}
              onChange={(e) =>
                setImportMode(e.target.value as "auto" | SubscriberStatus)
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="auto">Auto-detect status from CSV</option>
              <option value="active">Import file as Active (Subscribed)</option>
              <option value="unsubscribed">Import file as Unsubscribed</option>
              <option value="bounced">Import file as Bounced / Cleaned</option>
            </select>

            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer">
              <Upload size={14} />
              <span>{importing ? "Importing..." : "Upload CSV"}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={importing}
                onChange={(e) => void handleCsvUpload(e)}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setPasteModalOpen(true)}
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ClipboardPaste size={14} />
              <span>Paste from Google Sheets</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sublists & Cohort Tags Manager */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Tags size={18} className="text-primary shrink-0" /> Sublists &amp; Cohort Tags
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Click any sublist below to view its members, or create new cohorts (e.g., <em>Board Members</em>, <em>2025 Attendees</em>, <em>2025 Presenters</em>, <em>2025 Corporate Sponsors</em>) for targeted announcements.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreateSublist(newSublistInput);
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={newSublistInput}
              onChange={(e) => setNewSublistInput(e.target.value)}
              placeholder="New sublist (e.g. 2025 Presenters)"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-primary w-56 sm:w-60"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Plus size={14} /> Create Sublist
            </button>
          </form>
        </div>

        {/* Active Sublist Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCohortFilter("all_records")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
              cohortFilter === "all_records"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/40"
            }`}
          >
            All Directory ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setCohortFilter("all_active")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
              cohortFilter === "all_active"
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:border-emerald-400"
            }`}
          >
            All Active Subscribed ({counts.active})
          </button>

          {availableSublists.map((tag) => {
            const stat = sublistStats.get(tag) || { total: 0, active: 0 };
            const key: CohortViewFilter = `sublist:${tag}`;
            const isSelected = cohortFilter === key;
            return (
              <div
                key={tag}
                className={`inline-flex items-center rounded-full border text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-700 border-slate-200 hover:border-primary/45"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCohortFilter(isSelected ? "all_records" : key)}
                  className="pl-3 pr-2 py-1.5 cursor-pointer tabular-nums"
                  title={`${stat.active} active / ${stat.total} total in "${tag}"`}
                >
                  {tag}{" "}
                  <span className={isSelected ? "text-white/85" : "text-slate-400"}>
                    ({stat.active})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteSublist(tag)}
                  aria-label={`Delete sublist ${tag}`}
                  title={`Remove sublist "${tag}"`}
                  className={`pr-2.5 pl-1 py-1.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "text-white/75 hover:text-white"
                      : "text-slate-300 hover:text-red-600"
                  }`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Directory Controls + Bulk Tagging + Table */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-grow">
            <div className="relative flex-grow max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search email, name, institution, or sublist..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-base sm:text-xs text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>

            <select
              aria-label="Filter subscribers by status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | SubscriberStatus)
              }
              className="bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-medium text-slate-700 focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses ({counts.total})</option>
              <option value="active">Active ({counts.active})</option>
              <option value="pending_opt_in">Pending Opt-In ({counts.pending})</option>
              <option value="unsubscribed">Unsubscribed ({counts.unsubscribed})</option>
              <option value="bounced">Hard Bounced ({counts.bounced})</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/35 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors cursor-pointer shrink-0"
          >
            <UserPlus size={14} /> {showAddForm ? "Close Form" : "Add Subscriber"}
          </button>
        </div>

        {/* Bulk Sublist Assignment Action Bar (Appears when >= 1 rows selected) */}
        {selectedIds.size > 0 && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/25 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-primary tabular-nums">
                {selectedIds.size} subscriber(s) selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                list="hems-sublist-suggestions"
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                placeholder="Choose or type sublist..."
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-primary w-52"
              />
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => void handleBulkTagAction("add")}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                + Add Sublist
              </button>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => void handleBulkTagAction("remove")}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                &minus; Remove Sublist
              </button>
            </div>
          </div>
        )}

        {showAddForm && (
          <form
            onSubmit={(e) => void handleManualAdd(e)}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email address *"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
              />
              <input
                type="text"
                value={newFirst}
                onChange={(e) => setNewFirst(e.target.value)}
                placeholder="First name"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
              />
              <input
                type="text"
                value={newLast}
                onChange={(e) => setNewLast(e.target.value)}
                placeholder="Last name"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
              />
              <input
                type="text"
                value={newAffiliation}
                onChange={(e) => setNewAffiliation(e.target.value)}
                placeholder="Institution / Lab"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">
                    Topics:
                  </span>
                  {(
                    [
                      ["workshop", "Workshop"],
                      ["student_awards", "Student Awards"],
                      ["sponsorship", "Sponsorship"],
                    ] as Array<[MailingInterest, string]>
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleNewInterest(id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                        newInterests.includes(id)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {availableSublists.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">
                      Sublists:
                    </span>
                    {availableSublists.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleNewSublistChoice(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                          newSublists.includes(tag)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 cursor-pointer self-start sm:self-end shrink-0"
              >
                Save Active Subscriber
              </button>
            </div>
          </form>
        )}

        {/* Subscriber Table */}
        {loadingData ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading subscriber directory...
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No subscribers match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pr-3 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      aria-label={`Select all ${filteredSubscribers.length} matching subscribers`}
                      className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  {(
                    [
                      { field: "subscriber" as SortField, label: "Subscriber" },
                      { field: "institution" as SortField, label: "Institution" },
                      { field: "tags" as SortField, label: "Sublists & Topics" },
                      { field: "status" as SortField, label: "Status" },
                      { field: "date_added" as SortField, label: "Date Added" },
                    ]
                  ).map(({ field, label }) => {
                    const isActiveSort = sortField === field;
                    return (
                      <th
                        key={field}
                        aria-sort={
                          isActiveSort
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        className="py-2.5 pr-4 whitespace-nowrap select-none"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortColumn(field)}
                          className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors cursor-pointer ${
                            isActiveSort
                              ? "text-primary font-bold"
                              : "text-slate-500 hover:text-slate-800 font-semibold"
                          }`}
                        >
                          <span>{label}</span>
                          {isActiveSort ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={12} className="text-primary shrink-0" />
                            ) : (
                              <ArrowDown size={12} className="text-primary shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown
                              size={12}
                              className="text-slate-300 shrink-0"
                            />
                          )}
                        </button>
                      </th>
                    );
                  })}
                  <th className="py-2.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((sub) => {
                  const badge = STATUS_BADGE[sub.status] || STATUS_BADGE.active;
                  const fullName = `${sub.firstName} ${sub.lastName}`.trim();
                  const isChecked = selectedIds.has(sub.id);
                  const unassignedSublists = availableSublists.filter(
                    (t) =>
                      !sub.sublists.some((st) => st.toLowerCase() === t.toLowerCase())
                  );

                  return (
                    <tr
                      key={sub.id}
                      className={
                        isChecked ? "bg-primary/[0.04]" : "hover:bg-slate-50/70"
                      }
                    >
                      <td className="py-3 pr-3 align-top pt-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(sub.id)}
                          aria-label={`Select ${sub.email}`}
                          className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="font-semibold text-slate-900 break-all">
                          {sub.email}
                        </div>
                        {fullName && (
                          <div className="text-[11px] text-slate-500">{fullName}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 align-top">
                        {sub.affiliation || <span className="text-slate-400">&mdash;</span>}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="flex flex-wrap items-center gap-1">
                          {sub.sublists.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10.5px] font-semibold"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => void handleInlineRemoveTag(sub, tag)}
                                aria-label={`Remove ${tag} from ${sub.email}`}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}

                          {sub.interests.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] font-medium"
                            >
                              {topic.replace("_", " ")}
                            </span>
                          ))}

                          {unassignedSublists.length > 0 && (
                            <select
                              aria-label={`Add sublist to ${sub.email}`}
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) void handleInlineAddTag(sub, val);
                              }}
                              className="px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-[10.5px] text-slate-500 hover:border-primary hover:text-primary bg-white cursor-pointer focus:outline-none"
                            >
                              <option value="">+ Sublist</option>
                              {unassignedSublists.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        {sub.bounceReason && (
                          <div
                            className="text-[10px] text-red-600 mt-0.5 max-w-[200px] truncate"
                            title={sub.bounceReason}
                          >
                            {sub.bounceReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-top whitespace-nowrap tabular-nums text-slate-600">
                        {(() => {
                          const dateInfo = formatDateAdded(sub.createdAt);
                          const srcLabel =
                            SOURCE_LABEL[sub.source] || sub.source;
                          return (
                            <div title={`Added: ${dateInfo.tooltip} • Source: ${srcLabel}`}>
                              <span className="font-medium text-slate-700 block">
                                {dateInfo.short}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {sub.source === "mailchimp_import"
                                  ? "CSV import"
                                  : sub.source === "board_manual"
                                  ? "Manual"
                                  : "Web opt-in"}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap align-top">
                        <div className="inline-flex items-center gap-1.5">
                          {sub.status !== "active" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusChange(sub, "active")}
                              className="px-2.5 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold cursor-pointer"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                void handleStatusChange(sub, "unsubscribed")
                              }
                              title="Suppress / Unsubscribe"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium cursor-pointer"
                            >
                              <MailX size={12} /> Suppress
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void removeSubscriber(sub)}
                            aria-label={`Remove ${sub.email}`}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSubscribers.length > 250 && (
              <p className="text-[11px] text-slate-500 pt-3">
                Showing first 250 of {filteredSubscribers.length} matching records (top-left checkbox selects all {filteredSubscribers.length} matching records for bulk sublist tagging).
              </p>
            )}
          </div>
        )}
      </section>

      {/* Architecture & Postmark Reference Modal */}
      <MailingSystemInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        isLiveFirestore={isLiveFirestore}
      />

      {/* CSV Importer Format & Heading Guide Modal */}
      <CsvImportFormatModal
        open={csvFormatModalOpen}
        onClose={() => setCsvFormatModalOpen(false)}
      />

      {/* Google Sheets Copy/Paste Importer Modal */}
      <GoogleSheetsPasteModal
        open={pasteModalOpen}
        onClose={() => setPasteModalOpen(false)}
        availableSublists={availableSublists}
        initialSublistTag={importSublistTag}
        onImportRows={handleImportPastedRows}
      />

      {/* Flexible Mailing List Exporter Modal */}
      <MailingExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        subscribers={subscribers}
        availableSublists={availableSublists}
        initialCohortSegment={cohortFilter}
      />
    </div>
  );
}
