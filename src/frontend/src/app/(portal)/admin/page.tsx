"use client";

import React, { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWhitelistAdmin } from "@/hooks/useWhitelistAdmin";
import { hasAdminRole } from "@/utils/telemetryClient";
import {
  ADMIN_ASSIGNABLE_ROLES,
  AssignableRole,
  computeWhitelistCsvPlan,
  CsvApplyMode,
  isAssignableRole,
  parseWhitelistCsv,
  ROLE_DISPLAY_META,
  SAMPLE_WHITELIST_CSV,
  WhitelistEntry,
} from "@/utils/whitelistCsv";

type RoleFilterValue = "all" | "unassigned" | AssignableRole;
type SortField = "name" | "email" | "roles";
type SortDirection = "asc" | "desc";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const isAuthorized = Boolean(user && hasAdminRole(user.roles));

  const {
    whitelist,
    loadingList,
    savingBusy,
    errorMsg,
    loadWhitelist,
    addOrUpdateManualUser,
    updateEntryName,
    toggleRole,
    deleteEntry,
    applyCsvPlan,
  } = useWhitelistAdmin(isAuthorized);

  // Manual user form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AssignableRole[]>([]);
  const [formError, setFormError] = useState("");
  const [feedbackBanner, setFeedbackBanner] = useState("");

  // CSV staging state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [uploadedCsv, setUploadedCsv] = useState<{ fileName: string; rawText: string } | null>(
    null
  );
  const [csvFallbackRole, setCsvFallbackRole] = useState<AssignableRole | "">("");
  const [csvMode, setCsvMode] = useState<CsvApplyMode>("append");
  const [selectedOverwriteRoles, setSelectedOverwriteRoles] = useState<AssignableRole[]>([]);
  const [csvError, setCsvError] = useState("");

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
  const [sortField, setSortField] = useState<SortField>("email");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Inline name edit state
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editingNameDraft, setEditingNameDraft] = useState("");

  const existingByEmail = useMemo(() => {
    const map = new Map<string, WhitelistEntry>();
    for (const entry of whitelist) {
      map.set(entry.email.toLowerCase(), entry);
    }
    return map;
  }, [whitelist]);

  const roleCounts = useMemo(() => {
    const counts: Record<AssignableRole, number> = {
      attendee: 0,
      submitter: 0,
      "oral presenter": 0,
      "poster presenter": 0,
      "corporate sponsor": 0,
      reviewer: 0,
      board: 0,
      admin: 0,
    };
    let unassigned = 0;

    for (const entry of whitelist) {
      const assigned = entry.roles.filter(isAssignableRole);
      if (assigned.length === 0) {
        unassigned += 1;
      } else {
        for (const r of assigned) {
          counts[r] += 1;
        }
      }
    }

    return { counts, unassigned };
  }, [whitelist]);

  const parsedCsv = useMemo(() => {
    if (!uploadedCsv) return null;
    return parseWhitelistCsv(uploadedCsv.rawText, csvFallbackRole);
  }, [uploadedCsv, csvFallbackRole]);

  const effectiveOverwriteSelection = useMemo(() => {
    if (!parsedCsv) return [] as AssignableRole[];
    const validDetected = selectedOverwriteRoles.filter((r) =>
      parsedCsv.detectedRoles.includes(r)
    );
    return validDetected.length > 0 ? validDetected : parsedCsv.detectedRoles;
  }, [parsedCsv, selectedOverwriteRoles]);

  const csvPlan = useMemo(() => {
    if (!parsedCsv) return null;
    return computeWhitelistCsvPlan(
      whitelist,
      parsedCsv,
      csvMode,
      csvMode === "overwrite" ? effectiveOverwriteSelection : undefined
    );
  }, [whitelist, parsedCsv, csvMode, effectiveOverwriteSelection]);

  const filteredAndSortedWhitelist = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = whitelist.filter((entry) => {
      if (roleFilter === "unassigned") {
        if (entry.roles.length > 0) return false;
      } else if (roleFilter !== "all") {
        if (!entry.roles.includes(roleFilter)) return false;
      }

      if (!q) return true;
      const roleLabels = entry.roles
        .map((r) => `${r} ${ROLE_DISPLAY_META[r]?.label || ""}`)
        .join(" ")
        .toLowerCase();

      return (
        entry.email.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        roleLabels.includes(q)
      );
    });

    const dirMultiplier = sortDir === "asc" ? 1 : -1;
    return [...matched].sort((a, b) => {
      if (sortField === "name") {
        const aName = a.name.trim().toLowerCase();
        const bName = b.name.trim().toLowerCase();
        const aHas = Boolean(aName);
        const bHas = Boolean(bName);
        if (aHas !== bHas) {
          // Keep entries with populated names grouped ahead of blank legacy entries
          return aHas ? -1 : 1;
        }
        const cmp = aName.localeCompare(bName);
        return cmp !== 0 ? cmp * dirMultiplier : a.email.localeCompare(b.email);
      }
      if (sortField === "roles") {
        const cmp = (a.roles.length - b.roles.length) * dirMultiplier;
        return cmp !== 0 ? cmp : a.email.localeCompare(b.email);
      }
      return a.email.localeCompare(b.email) * dirMultiplier;
    });
  }, [whitelist, searchQuery, roleFilter, sortField, sortDir]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !hasAdminRole(user.roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be an <strong>Admin</strong> to access this control panel.
        </p>
      </div>
    );
  }

  const handleSortHeader = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "roles" ? "desc" : "asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-foreground/35 shrink-0" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-primary shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-primary shrink-0" />
    );
  };

  const handleSortDropdownChange = (val: string) => {
    const [field, dir] = val.split(":") as [SortField, SortDirection];
    if (field && dir) {
      setSortField(field);
      setSortDir(dir);
    }
  };

  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFeedbackBanner("");
    try {
      const res = await addOrUpdateManualUser(newEmail, newName, selectedRoles);
      setFeedbackBanner(
        res.isNew
          ? `Added ${res.email}${newName.trim() ? ` (${newName.trim()})` : ""} to whitelist.`
          : `Updated roles${newName.trim() ? " and name" : ""} for existing user ${res.email}.`
      );
      setNewEmail("");
      setNewName("");
      setSelectedRoles([]);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add whitelist entry.");
    }
  };

  const handleCsvFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    setFeedbackBanner("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const preview = parseWhitelistCsv(text, csvFallbackRole);
      if (preview.rows.length === 0) {
        setCsvError(
          `No valid email addresses found in "${file.name}". Ensure the CSV contains an Email column (and optional Name and Role columns).`
        );
        setUploadedCsv(null);
        setSelectedOverwriteRoles([]);
      } else {
        setUploadedCsv({ fileName: file.name, rawText: text });
        setSelectedOverwriteRoles(preview.detectedRoles);
      }
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : "Could not read CSV file.");
    } finally {
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_WHITELIST_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hems-whitelist-sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyCsv = async () => {
    if (!csvPlan || !parsedCsv || parsedCsv.rows.length === 0) return;
    setCsvError("");
    setFeedbackBanner("");
    try {
      await applyCsvPlan(csvPlan);
      const roleSummary =
        csvMode === "overwrite"
          ? `Overwrote ${csvPlan.effectiveOverwriteRoles.join(", ") || "CSV role(s)"}`
          : "Appended CSV roles";
      setFeedbackBanner(
        `${roleSummary}: ${csvPlan.addedPeopleCount} new user(s) added, ${csvPlan.namesFilledCount} missing name(s) filled, ${csvPlan.rolesGrantedPeopleCount} role assignment(s) applied${
          csvMode === "overwrite"
            ? `, ${csvPlan.overwriteRemovedPeopleCount} prior holder(s) removed from overwritten role(s)`
            : ""
        }.`
      );
      setUploadedCsv(null);
      setSelectedOverwriteRoles([]);
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : "Failed to apply CSV roster.");
    }
  };

  const handleStartEditName = (entry: WhitelistEntry) => {
    setEditingEmail(entry.email);
    setEditingNameDraft(entry.name || "");
  };

  const handleSaveName = async (email: string) => {
    try {
      await updateEntryName(email, editingNameDraft);
      setEditingEmail(null);
      setEditingNameDraft("");
    } catch {
      // errorMsg is handled by hook
    }
  };

  const handleDeleteEntryClick = async (entry: WhitelistEntry) => {
    const label = entry.name ? `${entry.name} (${entry.email})` : entry.email;
    if (!window.confirm(`Remove ${label} from the whitelist?`)) return;
    try {
      await deleteEntry(entry.email);
      setFeedbackBanner(`Removed ${entry.email} from the whitelist.`);
    } catch {
      // errorMsg is handled by hook
    }
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || roleFilter !== "all");

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="text-primary shrink-0" /> Whitelist Manager
          </h2>
          <p className="text-xs text-foreground/65 mt-1 leading-relaxed">
            Manage attendee, presenter, corporate sponsor, reviewer, board, and admin permissions.{" "}
            <span className="font-semibold text-foreground/80">
              General member access is granted automatically to all signed-in users.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadWhitelist()}
          disabled={loadingList || savingBusy}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw size={13} className={loadingList ? "animate-spin text-primary" : ""} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="bg-red-500/10 border border-red-500/25 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {feedbackBanner && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner("")}
            aria-label="Dismiss notification"
            className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Manual Add User Card */}
      <form
        onSubmit={(e) => void handleAddUserSubmit(e)}
        className="space-y-4 bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus size={16} className="text-primary" />
              <span>Add or Update Individual User</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adds a new email &amp; name entry, or merges selected roles onto an existing person while preserving existing names.
            </p>
          </div>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
            {formError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address (e.g. researcher@university.edu)..."
            aria-label="New user email address"
            className="flex-1 bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
            required
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name (added if not already present)"
            aria-label="New user full name"
            className="flex-1 bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={savingBusy}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {savingBusy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            <span>Add / Merge User</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Assign Roles (Optional — leave unselected for automatic general access):
            </span>
            {selectedRoles.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedRoles([])}
                className="text-[11px] font-semibold text-slate-500 hover:text-primary cursor-pointer"
              >
                Clear selected ({selectedRoles.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ADMIN_ASSIGNABLE_ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role);
              const meta = ROLE_DISPLAY_META[role];
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRoles(selectedRoles.filter((r) => r !== role));
                    } else {
                      setSelectedRoles([...selectedRoles, role]);
                    }
                  }}
                  title={meta.desc}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? meta.activePillClass
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {isSelected ? `✓ ${meta.label}` : meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* CSV Roster & Role Import Card */}
      <section className="bg-white p-4 sm:p-6 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span>CSV Roster &amp; Role Import</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Upload a CSV containing <code className="text-slate-700 font-semibold">email</code>,{" "}
              <code className="text-slate-700 font-semibold">name</code> (or{" "}
              <code className="text-slate-700 font-semibold">first name</code> +{" "}
              <code className="text-slate-700 font-semibold">last name</code>), and{" "}
              <code className="text-slate-700 font-semibold">role</code>. New email/name pairs are added automatically, missing names are filled, and after upload you choose whether to{" "}
              <strong>Append</strong> or <strong>Overwrite</strong> existing holders of the CSV role(s).
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0 self-start"
          >
            <Download size={13} />
            <span>Sample CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label
              htmlFor="whitelist-csv-upload"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-dashed border-slate-300 hover:border-primary/70 rounded-xl px-4 py-3.5 bg-slate-50/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Upload size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {uploadedCsv ? uploadedCsv.fileName : "Choose CSV file to upload & preview..."}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Supports comma/semicolon role lists (e.g. oral presenter, poster presenter, corporate sponsor, attendee)
                  </span>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 shrink-0 text-center">
                Browse CSV
              </span>
            </label>
            <input
              id="whitelist-csv-upload"
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleCsvFileChange(e)}
              className="sr-only"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="csv-fallback-role"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
            >
              Fallback Role (If CSV omits role column)
            </label>
            <select
              id="csv-fallback-role"
              value={csvFallbackRole}
              onChange={(e) => {
                const val = e.target.value;
                setCsvFallbackRole(isAssignableRole(val) ? val : "");
              }}
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white"
            >
              <option value="">Use CSV Role column only</option>
              {ADMIN_ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_DISPLAY_META[r].label} ({r})
                </option>
              ))}
            </select>
          </div>
        </div>

        {csvError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{csvError}</span>
          </div>
        )}

        {/* Post-Upload Staging & Append / Overwrite Decision Panel */}
        {parsedCsv && csvPlan && (
          <div className="border-2 border-primary/25 bg-sky-50/40 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                  Staged CSV Import • {uploadedCsv?.fileName}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  Review Changes &amp; Choose Role Update Behavior
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 text-xs tabular-nums">
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 font-semibold text-slate-800">
                  {parsedCsv.rows.length} valid people
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-semibold text-emerald-800">
                  +{csvPlan.addedPeopleCount} new users
                </span>
                {csvPlan.namesFilledCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 font-semibold text-sky-900">
                    {csvPlan.namesFilledCount} names filled
                  </span>
                )}
              </div>
            </div>

            {/* Parse Warnings */}
            {(parsedCsv.skippedInvalidEmailCount > 0 ||
              parsedCsv.unrecognizedRoleTokens.length > 0 ||
              (parsedCsv.rowsMissingRoleCount > 0 && !csvFallbackRole)) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-3 text-xs space-y-1">
                {parsedCsv.skippedInvalidEmailCount > 0 && (
                  <p>
                    • Skipped <strong>{parsedCsv.skippedInvalidEmailCount}</strong> row(s) without a valid email address.
                  </p>
                )}
                {parsedCsv.unrecognizedRoleTokens.length > 0 && (
                  <p>
                    • Unrecognized role values ignored:{" "}
                    <strong>{parsedCsv.unrecognizedRoleTokens.join(", ")}</strong>.
                  </p>
                )}
                {parsedCsv.rowsMissingRoleCount > 0 && !csvFallbackRole && (
                  <p>
                    • <strong>{parsedCsv.rowsMissingRoleCount}</strong> row(s) have no recognized role in the CSV (choose a Fallback Role above if intended).
                  </p>
                )}
              </div>
            )}

            {/* Overwrite vs Append Control */}
            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                After-Upload Role List Action:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCsvMode("append")}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    csvMode === "append"
                      ? "bg-white border-primary shadow-2xs"
                      : "bg-white/60 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Append to Existing Role List
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        csvMode === "append" ? "border-primary bg-primary" : "border-slate-300"
                      }`}
                    >
                      {csvMode === "append" && <Check size={10} className="text-white" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Adds new email &amp; name entries and adds the CSV-specified role(s). All existing holders retain these roles.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCsvMode("overwrite")}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    csvMode === "overwrite"
                      ? "bg-white border-amber-600 shadow-2xs"
                      : "bg-white/60 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Overwrite Existing Holders of CSV Role(s)
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        csvMode === "overwrite"
                          ? "border-amber-600 bg-amber-600"
                          : "border-slate-300"
                      }`}
                    >
                      {csvMode === "overwrite" && <Check size={10} className="text-white" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Removes the target role(s) from anyone omitted in this CSV while preserving their email, name, and other roles (such as admin or reviewer).
                  </p>
                </button>
              </div>

              {csvMode === "overwrite" && parsedCsv.detectedRoles.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-950">
                      Target role list(s) to overwrite:
                    </span>
                    <span className="text-xs font-semibold text-amber-900 tabular-nums">
                      Will remove overwritten role(s) from{" "}
                      <strong>{csvPlan.overwriteRemovedPeopleCount}</strong> existing user(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedCsv.detectedRoles.map((role) => {
                      const checked = effectiveOverwriteSelection.includes(role);
                      return (
                        <label
                          key={role}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                            checked
                              ? "bg-white border-amber-500 text-amber-950"
                              : "bg-amber-100/50 border-amber-200 text-amber-800/70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const current = effectiveOverwriteSelection;
                              if (checked && current.length === 1) return;
                              const next = checked
                                ? current.filter((r) => r !== role)
                                : [...current, role];
                              setSelectedOverwriteRoles(next);
                            }}
                            className="accent-amber-600"
                          />
                          <span>{ROLE_DISPLAY_META[role].label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Staged CSV Row Preview */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">CSV Role(s)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedCsv.rows.slice(0, 8).map((row) => {
                      const existing = existingByEmail.get(row.email);
                      const willFillName = Boolean(existing && !existing.name.trim() && row.name.trim());
                      return (
                        <tr key={row.email}>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {row.name || (existing?.name ? existing.name : <span className="text-slate-400 italic">—</span>)}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{row.email}</td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              {row.roles.length > 0 ? (
                                row.roles.map((r) => (
                                  <span
                                    key={r}
                                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${ROLE_DISPLAY_META[r].badgeClass}`}
                                  >
                                    {ROLE_DISPLAY_META[r].label}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">No role specified</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {!existing ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                New Entry
                              </span>
                            ) : willFillName ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-[10px] font-bold">
                                Existing + Name Fill
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                                Existing
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedCsv.rows.length > 8 && (
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center tabular-nums">
                  ...and {parsedCsv.rows.length - 8} more row(s)
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={savingBusy}
                onClick={() => {
                  setUploadedCsv(null);
                  setSelectedOverwriteRoles([]);
                  setCsvError("");
                }}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel / Clear
              </button>
              <button
                type="button"
                disabled={savingBusy || parsedCsv.rows.length === 0}
                onClick={() => void handleApplyCsv()}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer disabled:opacity-50 ${
                  csvMode === "overwrite"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-primary hover:bg-sky-800"
                }`}
              >
                {savingBusy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Applying Changes...</span>
                  </>
                ) : csvMode === "overwrite" ? (
                  <>
                    <Upload size={15} />
                    <span>Apply CSV (Overwrite Role List)</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Apply CSV (Append to Role List)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Whitelist Filter, Sort & Table Section */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-primary" /> Whitelist Directory
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                Showing {filteredAndSortedWhitelist.length} of {whitelist.length} entries
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, email, or assigned role..."
                aria-label="Filter whitelist entries"
                className="w-full bg-white border border-slate-300 pl-9 pr-9 py-2 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear filter search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="whitelist-sort-select"
                className="text-xs font-semibold text-slate-600 whitespace-nowrap"
              >
                Sort by:
              </label>
              <select
                id="whitelist-sort-select"
                value={`${sortField}:${sortDir}`}
                onChange={(e) => handleSortDropdownChange(e.target.value)}
                className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-primary"
              >
                <option value="email:asc">Email (A → Z)</option>
                <option value="email:desc">Email (Z → A)</option>
                <option value="name:asc">Name (A → Z)</option>
                <option value="name:desc">Name (Z → A)</option>
                <option value="roles:desc">Role Count (Most → Fewest)</option>
                <option value="roles:asc">Role Count (Fewest → Most)</option>
              </select>
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer tabular-nums ${
                roleFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              All ({whitelist.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("unassigned")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer tabular-nums ${
                roleFilter === "unassigned"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              No Special Roles ({roleCounts.unassigned})
            </button>
            {ADMIN_ASSIGNABLE_ROLES.map((role) => {
              const active = roleFilter === role;
              const meta = ROLE_DISPLAY_META[role];
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer tabular-nums ${
                    active
                      ? meta.activePillClass
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {meta.label} ({roleCounts.counts[role]})
                </button>
              );
            })}
          </div>
        </div>

        {loadingList ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading whitelist...
          </div>
        ) : filteredAndSortedWhitelist.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-medium space-y-2">
            <p>
              {whitelist.length === 0
                ? "Whitelist is empty."
                : "No whitelist entries match the active filters."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Show all entries
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider text-slate-500">
                  <th className="p-3.5 pl-6 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortHeader("name")}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer uppercase"
                    >
                      <span>Name</span>
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortHeader("email")}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer uppercase"
                    >
                      <span>Email</span>
                      {renderSortIcon("email")}
                    </button>
                  </th>
                  <th className="p-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortHeader("roles")}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer uppercase"
                    >
                      <span>Assigned Roles</span>
                      {renderSortIcon("roles")}
                    </button>
                  </th>
                  <th className="p-3.5 pr-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAndSortedWhitelist.map((entry) => {
                  const isEditingName = editingEmail === entry.email;
                  return (
                    <tr key={entry.email} className="hover:bg-slate-50/70 transition-colors align-top">
                      <td className="p-3.5 pl-6 min-w-[180px]">
                        {isEditingName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingNameDraft}
                              onChange={(e) => setEditingNameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleSaveName(entry.email);
                                } else if (e.key === "Escape") {
                                  setEditingEmail(null);
                                  setEditingNameDraft("");
                                }
                              }}
                              autoFocus
                              placeholder="Full name..."
                              aria-label={`Edit name for ${entry.email}`}
                              className="w-full min-w-[130px] bg-white border border-primary px-2.5 py-1 rounded-md text-xs text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSaveName(entry.email)}
                              aria-label="Save name"
                              className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmail(null);
                                setEditingNameDraft("");
                              }}
                              aria-label="Cancel editing name"
                              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            {entry.name ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                {entry.name}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditName(entry)}
                                className="text-xs text-slate-400 italic hover:text-primary cursor-pointer"
                              >
                                Add name...
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditName(entry)}
                              title={`Edit name for ${entry.email}`}
                              aria-label={`Edit name for ${entry.email}`}
                              className="p-1 rounded text-slate-400 opacity-70 group-hover:opacity-100 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-700 text-xs sm:text-sm whitespace-nowrap">
                        {entry.email}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {ADMIN_ASSIGNABLE_ROLES.map((role) => {
                            const hasRole = entry.roles.includes(role);
                            const meta = ROLE_DISPLAY_META[role];
                            return (
                              <button
                                type="button"
                                key={role}
                                onClick={() =>
                                  void toggleRole(entry.email, role, entry.roles)
                                }
                                title={`${hasRole ? "Remove" : "Grant"} ${meta.label}`}
                                className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                  hasRole
                                    ? meta.badgeClass
                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="p-3.5 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDeleteEntryClick(entry)}
                          className="text-red-500 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove from Whitelist"
                          aria-label={`Remove ${entry.email} from whitelist`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
