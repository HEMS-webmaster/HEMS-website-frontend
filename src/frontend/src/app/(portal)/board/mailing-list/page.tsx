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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMailingAdmin } from "@/hooks/useMailingAdmin";
import {
  MailingInterest,
  MailingSubscriber,
  SubscriberStatus,
} from "@/types/mailing";
import { parseMailchimpCsvExport } from "@/utils/mailingTemplate";

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

export default function BoardMailingListPage() {
  const { user, loading } = useAuth();
  const isAuthorized = Boolean(
    user && (user.roles?.includes("board") || user.roles?.includes("admin"))
  );

  const {
    subscribers,
    pendingRequests,
    loadingData,
    errorMessage,
    upsertSubscriber,
    updateSubscriberStatus,
    removeSubscriber,
    importMailchimpRows,
    applyPendingPublicRequests,
  } = useMailingAdmin(isAuthorized);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriberStatus>("all");
  const [importMode, setImportMode] = useState<"auto" | SubscriberStatus>("auto");
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

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subscribers.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.email.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.affiliation.toLowerCase().includes(q)
      );
    });
  }, [subscribers, searchQuery, statusFilter]);

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

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedbackBanner("");
    setActionError("");
    setImporting(true);
    try {
      const csvText = await file.text();
      const rows = parseMailchimpCsvExport(csvText, importMode);
      if (rows.length === 0) {
        throw new Error(
          "No valid email rows found. Verify the CSV includes an 'Email Address' or 'Email' header column."
        );
      }
      const summary = await importMailchimpRows(rows);
      setFeedbackBanner(
        `Mailchimp CSV processed (${summary.totalParsed} rows): ${summary.importedActive} active, ${summary.importedSuppressed} suppressed (unsubscribed/bounced), ${summary.skippedProtected} protected opt-outs preserved.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CSV import failed.";
      setActionError(msg);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleExportCsv = () => {
    const header = [
      "Email Address",
      "First Name",
      "Last Name",
      "Affiliation",
      "Status",
      "Topics",
      "Source",
      "Updated At",
    ];
    const escapeCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...subscribers.map((s) =>
        [
          escapeCell(s.email),
          escapeCell(s.firstName),
          escapeCell(s.lastName),
          escapeCell(s.affiliation),
          escapeCell(s.status),
          escapeCell(s.interests.join(";")),
          escapeCell(s.source),
          escapeCell(s.updatedAt),
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hems-mailing-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        status: "active",
      });
      setFeedbackBanner(`Added/updated ${newEmail.trim().toLowerCase()} as Active.`);
      setNewEmail("");
      setNewFirst("");
      setNewLast("");
      setNewAffiliation("");
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
            Board Communications • Postmark Broadcast Hygiene
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-2.5">
            <Users className="text-primary shrink-0" size={26} /> Mailing List &amp; Subscriber Hygiene
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Migrate Mailchimp exports, suppress hard bounces to protect <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">hems-workshop.org</code> domain reputation, and manage subscriber preferences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/board/announcements"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Send size={14} /> Compose Announcement
          </Link>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Active Confirmed
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums mt-1 block">
            {counts.active}
          </span>
          <span className="text-[11px] text-slate-500">Eligible for Postmark Broadcast</span>
        </div>
        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Pending Opt-In
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums mt-1 block">
            {counts.pending}
          </span>
          <span className="text-[11px] text-slate-500">Awaiting inbox confirmation</span>
        </div>
        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Unsubscribed
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-700 tabular-nums mt-1 block">
            {counts.unsubscribed}
          </span>
          <span className="text-[11px] text-slate-500">Protected opt-out suppression</span>
        </div>
        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Bounced / Complained
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-red-700 tabular-nums mt-1 block">
            {counts.bounced}
          </span>
          <span className="text-[11px] text-slate-500">Auto-suppressed dead addresses</span>
        </div>
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

      {/* Mailchimp CSV Importer */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-primary shrink-0" /> Mailchimp Audience CSV Migration
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              <strong>Deliverability Best Practice:</strong> Import Mailchimp&apos;s{" "}
              <em>Unsubscribed</em> and <em>Cleaned (Bounced)</em> CSV files first (or alongside <em>Subscribed</em>). Suppressed records are permanently locked so dead <code className="text-[11px] bg-slate-100 px-1 rounded">.edu</code>/<code className="text-[11px] bg-slate-100 px-1 rounded">.gov</code> addresses and past opt-outs are never accidentally re-emailed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <select
              aria-label="Mailchimp CSV import status mapping"
              value={importMode}
              onChange={(e) =>
                setImportMode(e.target.value as "auto" | SubscriberStatus)
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
            >
              <option value="auto">Auto-detect status from CSV</option>
              <option value="active">Import file as Active (Subscribed CSV)</option>
              <option value="unsubscribed">Import file as Unsubscribed CSV</option>
              <option value="bounced">Import file as Bounced / Cleaned CSV</option>
            </select>

            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer">
              <Upload size={14} />
              <span>{importing ? "Importing..." : "Select Mailchimp CSV"}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={importing}
                onChange={(e) => void handleCsvUpload(e)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Directory Controls + Manual Add */}
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
                placeholder="Search email, name, or institution..."
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
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
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 cursor-pointer"
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
                  <th className="py-2.5 pr-4">Subscriber</th>
                  <th className="py-2.5 pr-4">Institution</th>
                  <th className="py-2.5 pr-4">Topics</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscribers.slice(0, 200).map((sub) => {
                  const badge = STATUS_BADGE[sub.status] || STATUS_BADGE.active;
                  const fullName = `${sub.firstName} ${sub.lastName}`.trim();
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-900 break-all">
                          {sub.email}
                        </div>
                        {fullName && (
                          <div className="text-[11px] text-slate-500">{fullName}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {sub.affiliation || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {sub.interests.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] font-medium"
                            >
                              {tag.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        {sub.bounceReason && (
                          <div className="text-[10px] text-red-600 mt-0.5 max-w-[200px] truncate" title={sub.bounceReason}>
                            {sub.bounceReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
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
            {filteredSubscribers.length > 200 && (
              <p className="text-[11px] text-slate-500 pt-3">
                Showing first 200 of {filteredSubscribers.length} matching records. Use search to narrow results.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

