"use client";

import React, { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Download,
  Edit3,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
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
  PROTECTED_ADMIN_EMAIL,
  ROLE_DISPLAY_META,
  WhitelistCsvApplyPlan,
  WhitelistEntry,
} from "@/utils/whitelistCsv";
import WhitelistCsvFormatModal from "@/components/admin/WhitelistCsvFormatModal";
import WhitelistSheetsPasteModal from "@/components/admin/WhitelistSheetsPasteModal";
import { readUploadedTextFileSmart } from "@/utils/unicodeText";
import WhitelistExportModal from "@/components/admin/WhitelistExportModal";

type RoleFilterValue = "all" | "unassigned" | AssignableRole;
type SortField = "firstName" | "lastName" | "affiliation" | "email" | "roles";
type SortDirection = "asc" | "desc";

function compareOptionalTextAsc(
  rawA: string,
  rawB: string,
  dirMultiplier: number,
  fallbackEmailA: string,
  fallbackEmailB: string
): number {
  const a = rawA.trim().toLowerCase();
  const b = rawB.trim().toLowerCase();
  if (!a && b) return 1;
  if (a && !b) return -1;
  const cmp = a.localeCompare(b);
  return cmp !== 0 ? cmp * dirMultiplier : fallbackEmailA.localeCompare(fallbackEmailB);
}

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
    updateEntryProfile,
    toggleRole,
    bulkUpdateRole,
    deleteEntry,
    applyCsvPlan,
  } = useWhitelistAdmin(isAuthorized);

  // Manual user form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newAffiliation, setNewAffiliation] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AssignableRole[]>([]);
  const [formError, setFormError] = useState("");
  const [feedbackBanner, setFeedbackBanner] = useState("");

  // Roster & Role Import state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [uploadedCsv, setUploadedCsv] = useState<{
    fileName: string;
    rawText: string;
  } | null>(null);
  const [csvAssignRole, setCsvAssignRole] = useState<AssignableRole | "">("");
  const [csvMode, setCsvMode] = useState<CsvApplyMode>("append");
  const [selectedOverwriteRoles, setSelectedOverwriteRoles] = useState<AssignableRole[]>(
    []
  );
  const [csvError, setCsvError] = useState("");

  // Modals
  const [csvFormatModalOpen, setCsvFormatModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Filter, Sort & Selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
  const [sortField, setSortField] = useState<SortField>("email");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<AssignableRole>("attendee");

  // Inline profile edit state
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editFirstDraft, setEditFirstDraft] = useState("");
  const [editLastDraft, setEditLastDraft] = useState("");
  const [editAffiliationDraft, setEditAffiliationDraft] = useState("");

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
      operations: 0,
      treasurer: 0,
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
    return parseWhitelistCsv(uploadedCsv.rawText, csvAssignRole);
  }, [uploadedCsv, csvAssignRole]);

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
        if (entry.roles.filter(isAssignableRole).length > 0) return false;
      } else if (roleFilter !== "all") {
        if (!entry.roles.includes(roleFilter)) return false;
      }

      if (!q) return true;
      const roleLabels = entry.roles
        .map((r) => `${r} ${ROLE_DISPLAY_META[r]?.label || ""}`)
        .join(" ")
        .toLowerCase();

      return (
        entry.firstName.toLowerCase().includes(q) ||
        entry.lastName.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.affiliation.toLowerCase().includes(q) ||
        entry.email.toLowerCase().includes(q) ||
        roleLabels.includes(q)
      );
    });

    const dirMultiplier = sortDir === "asc" ? 1 : -1;
    return [...matched].sort((a, b) => {
      if (sortField === "firstName") {
        return compareOptionalTextAsc(
          a.firstName,
          b.firstName,
          dirMultiplier,
          a.email,
          b.email
        );
      }
      if (sortField === "lastName") {
        return compareOptionalTextAsc(
          a.lastName,
          b.lastName,
          dirMultiplier,
          a.email,
          b.email
        );
      }
      if (sortField === "affiliation") {
        return compareOptionalTextAsc(
          a.affiliation,
          b.affiliation,
          dirMultiplier,
          a.email,
          b.email
        );
      }
      if (sortField === "roles") {
        const cmp = (a.roles.length - b.roles.length) * dirMultiplier;
        return cmp !== 0 ? cmp : a.email.localeCompare(b.email);
      }
      return a.email.localeCompare(b.email) * dirMultiplier;
    });
  }, [whitelist, searchQuery, roleFilter, sortField, sortDir]);

  const allFilteredSelected =
    filteredAndSortedWhitelist.length > 0 &&
    filteredAndSortedWhitelist.every((entry) => selectedEmails.has(entry.email));

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
        <h2 className="text-2xl font-black text-foreground">Admin Access Required</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be signed in with the{" "}
          <strong className="font-semibold text-foreground">
            Administrator (&lsquo;admin&rsquo;)
          </strong>{" "}
          role to access the Admin Portal.
        </p>
        {!user ? (
          <Link
            href="/auth"
            className="mt-6 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Admin Sign In
          </Link>
        ) : (
          <Link
            href="/layout-portal"
            className="mt-6 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Return to Workshop Overview
          </Link>
        )}
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
      return <ArrowUpDown size={12} className="text-slate-400 shrink-0" />;
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

  const toggleSelectRow = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredAndSortedWhitelist.map((e) => e.email)));
    }
  };

  const handleBulkRoleAction = async (action: "add" | "remove") => {
    if (selectedEmails.size === 0) return;
    setFeedbackBanner("");
    try {
      const updatedCount = await bulkUpdateRole(
        Array.from(selectedEmails),
        bulkRole,
        action
      );
      const roleLabel = ROLE_DISPLAY_META[bulkRole]?.label || bulkRole;
      setFeedbackBanner(
        action === "add"
          ? `Granted "${roleLabel}" to ${updatedCount} selected user(s).`
          : `Removed "${roleLabel}" from ${updatedCount} selected user(s).`
      );
      setSelectedEmails(new Set());
    } catch {
      // errorMsg handled by hook
    }
  };

  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFeedbackBanner("");
    try {
      const res = await addOrUpdateManualUser({
        firstName: newFirst,
        lastName: newLast,
        affiliation: newAffiliation,
        email: newEmail,
        rolesToAdd: selectedRoles,
      });
      const fullName = `${newFirst.trim()} ${newLast.trim()}`.trim();
      setFeedbackBanner(
        res.isNew
          ? `Added ${res.email}${fullName ? ` (${fullName})` : ""} to whitelist.`
          : `Updated roles and profile details for existing user ${res.email}.`
      );
      setNewFirst("");
      setNewLast("");
      setNewAffiliation("");
      setNewEmail("");
      setSelectedRoles([]);
      setShowAddForm(false);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save whitelist entry."
      );
    }
  };

  const handleCsvFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    setFeedbackBanner("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readUploadedTextFileSmart(file);
      const preview = parseWhitelistCsv(text, csvAssignRole);
      if (preview.rows.length === 0) {
        setCsvError(
          `No valid email addresses found in "${file.name}". Ensure the CSV contains an Email Address column (and optional First Name, Last Name, Institution, and Assigned Roles columns).`
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
        `${roleSummary}: ${csvPlan.addedPeopleCount} new user(s) added, ${csvPlan.namesFilledCount} profile(s) filled, ${csvPlan.rolesGrantedPeopleCount} role assignment(s) applied${
          csvMode === "overwrite"
            ? `, ${csvPlan.overwriteRemovedPeopleCount} prior holder(s) removed from overwritten role(s)`
            : ""
        }.`
      );
      setUploadedCsv(null);
      setSelectedOverwriteRoles([]);
    } catch (err: unknown) {
      setCsvError(
        err instanceof Error ? err.message : "Failed to apply CSV roster."
      );
    }
  };

  const handleApplyPastePlan = async (
    plan: WhitelistCsvApplyPlan,
    meta: {
      mode: CsvApplyMode;
      validCount: number;
      assignedRoles: AssignableRole[];
    }
  ) => {
    setCsvError("");
    setFeedbackBanner("");
    await applyCsvPlan(plan);
    const rolesLabel =
      meta.assignedRoles.length > 0
        ? meta.assignedRoles
            .map((r) => ROLE_DISPLAY_META[r]?.label || r)
            .join(", ")
        : "General access";
    setFeedbackBanner(
      `${meta.mode === "overwrite" ? "Overwrote" : "Imported"} ${
        meta.validCount
      } pasted user(s) (${rolesLabel}): +${
        plan.addedPeopleCount
      } new user(s), ${plan.namesFilledCount} profile(s) updated, ${
        plan.rolesGrantedPeopleCount
      } role assignment(s)${
        meta.mode === "overwrite"
          ? `, ${plan.overwriteRemovedPeopleCount} prior holder(s) removed`
          : ""
      }.`
    );
  };

  const handleStartEditProfile = (entry: WhitelistEntry) => {
    setEditingEmail(entry.email);
    setEditFirstDraft(entry.firstName || "");
    setEditLastDraft(entry.lastName || "");
    setEditAffiliationDraft(entry.affiliation || "");
  };

  const handleCancelEditProfile = () => {
    setEditingEmail(null);
    setEditFirstDraft("");
    setEditLastDraft("");
    setEditAffiliationDraft("");
  };

  const handleSaveProfile = async (email: string) => {
    try {
      await updateEntryProfile(email, {
        firstName: editFirstDraft,
        lastName: editLastDraft,
        affiliation: editAffiliationDraft,
      });
      handleCancelEditProfile();
    } catch {
      // errorMsg handled by hook
    }
  };

  const handleDeleteEntryClick = async (entry: WhitelistEntry) => {
    const label = entry.name ? `${entry.name} (${entry.email})` : entry.email;
    if (!window.confirm(`Remove ${label} from the whitelist?`)) return;
    try {
      await deleteEntry(entry.email);
      setSelectedEmails((prev) => {
        if (!prev.has(entry.email)) return prev;
        const next = new Set(prev);
        next.delete(entry.email);
        return next;
      });
      setFeedbackBanner(`Removed ${entry.email} from the whitelist.`);
    } catch {
      // errorMsg handled by hook
    }
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || roleFilter !== "all");

  return (
    <div className="space-y-7 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
            Access Control &bull; Role &amp; Whitelist Governance
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="text-primary shrink-0" size={26} /> Whitelist Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Manage attendee, presenter, corporate sponsor, reviewer, operations, treasurer, board, and admin permissions.{" "}
            <span className="font-semibold text-slate-800">
              General member access is granted automatically to all signed-in users.
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold hover:border-primary/50 hover:text-primary transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} /> Export Roster
          </button>
          <button
            type="button"
            onClick={() => void loadWhitelist()}
            disabled={loadingList || savingBusy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold hover:border-primary/50 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw
              size={13}
              className={loadingList ? "animate-spin text-primary" : ""}
            />
            <span>Refresh Roster</span>
          </button>
        </div>
      </header>

      {/* Cross-nav banner to Workshop Control Center */}
      <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Looking to update conference dates, pricing, CFP status, or venue details?
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Manage all 44 upcoming workshop settings with live Draft staging, zero-login Board
              Preview links, visual diffs, and 1-click Rollback in the Workshop Control Center.
            </p>
          </div>
        </div>
        <Link
          href="/admin/workshop-settings"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-[#00487d] text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs"
        >
          <SlidersHorizontal size={14} /> Open Workshop Control Center &rarr;
        </Link>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm p-3.5 rounded-xl flex items-center gap-2.5"
        >
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {feedbackBanner && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
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

      {/* Section 1: Roster & Role Import (CSV + Google Sheets Paste) */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-primary shrink-0" /> Roster &amp; Role Import
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Upload a whitelist CSV or paste rows directly from Google Sheets (<code className="text-slate-800 font-semibold">First Name</code>,{" "}
              <code className="text-slate-800 font-semibold">Last Name</code>,{" "}
              <code className="text-slate-800 font-semibold">Institution</code> optional,{" "}
              <code className="text-slate-800 font-semibold">Email</code>). Assign roles in batch or via CSV column and choose <strong>Append</strong> or <strong>Overwrite</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCsvFormatModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary/5 border border-primary/25 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer shrink-0 self-start"
          >
            <Info size={14} /> CSV Format &amp; Example Heading
          </button>
        </div>

        <div className="bg-[#F3F6FA] border border-slate-200/95 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-4">
            <label htmlFor="csv-assign-role" className="hems-label">
              Assign Role{" "}
              <span className="hems-label-hint">(Optional batch role)</span>
            </label>
            <select
              id="csv-assign-role"
              value={csvAssignRole}
              onChange={(e) => {
                const val = e.target.value;
                setCsvAssignRole(isAssignableRole(val) ? val : "");
              }}
              className="hems-control w-full"
            >
              <option value="">Use CSV Role column (no extra role)</option>
              {ADMIN_ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_DISPLAY_META[r].label} ({r})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="csv-role-mode" className="hems-label">
              Role Update Mode
            </label>
            <select
              id="csv-role-mode"
              value={csvMode}
              onChange={(e) => setCsvMode(e.target.value as CsvApplyMode)}
              className="hems-control w-full"
            >
              <option value="append">Append to existing role holders</option>
              <option value="overwrite">
                Overwrite existing holders of imported role(s)
              </option>
            </select>
          </div>

          <div className="md:col-span-4 flex flex-wrap sm:flex-nowrap gap-2">
            <label className="inline-flex flex-1 items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-sky-800 transition-colors cursor-pointer whitespace-nowrap shadow-2xs">
              <Upload size={14} />
              <span>{savingBusy ? "Importing..." : "Upload CSV"}</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                disabled={savingBusy}
                onChange={(e) => void handleCsvFileChange(e)}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setPasteModalOpen(true)}
              disabled={savingBusy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-400/90 text-slate-800 text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <ClipboardPaste size={14} />
              <span>Paste from Sheets</span>
            </button>
          </div>
        </div>

        {csvError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
            <span>{csvError}</span>
          </div>
        )}

        {/* Post-Upload Staging & Append / Overwrite Decision Panel */}
        {parsedCsv && csvPlan && (
          <div className="border-2 border-primary/25 bg-sky-50/40 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                  Staged CSV Import &bull; {uploadedCsv?.fileName}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Review Changes &amp; Choose Role Update Behavior
                </h3>
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
                    {csvPlan.namesFilledCount} profiles filled
                  </span>
                )}
              </div>
            </div>

            {/* Parse Warnings */}
            {(parsedCsv.skippedInvalidEmailCount > 0 ||
              parsedCsv.unrecognizedRoleTokens.length > 0 ||
              (parsedCsv.rowsMissingRoleCount > 0 && !csvAssignRole)) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-3 text-xs space-y-1">
                {parsedCsv.skippedInvalidEmailCount > 0 && (
                  <p>
                    &bull; Skipped{" "}
                    <strong>{parsedCsv.skippedInvalidEmailCount}</strong> row(s)
                    without a valid email address.
                  </p>
                )}
                {parsedCsv.unrecognizedRoleTokens.length > 0 && (
                  <p>
                    &bull; Unrecognized role values ignored:{" "}
                    <strong>{parsedCsv.unrecognizedRoleTokens.join(", ")}</strong>.
                  </p>
                )}
                {parsedCsv.rowsMissingRoleCount > 0 && !csvAssignRole && (
                  <p>
                    &bull; <strong>{parsedCsv.rowsMissingRoleCount}</strong> row(s)
                    had no role column value (choose an{" "}
                    <strong>Assign Role</strong> above if intended).
                  </p>
                )}
              </div>
            )}

            {/* Overwrite vs Append Control */}
            <div className="space-y-3">
              <span className="hems-label mb-0">
                After-Upload Role List Action:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCsvMode("append")}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    csvMode === "append"
                      ? "bg-white border-primary shadow-2xs"
                      : "bg-white/70 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Append to Existing Role List
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        csvMode === "append"
                          ? "border-primary bg-primary"
                          : "border-slate-300"
                      }`}
                    >
                      {csvMode === "append" && (
                        <Check size={10} className="text-white" />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Adds new users and merges imported role(s). All existing holders retain these roles.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCsvMode("overwrite")}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    csvMode === "overwrite"
                      ? "bg-white border-amber-600 shadow-2xs"
                      : "bg-white/70 border-slate-200 hover:border-slate-300"
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
                      {csvMode === "overwrite" && (
                        <Check size={10} className="text-white" />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Removes target role(s) from anyone omitted in this CSV while preserving their email, profile, and other roles.
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
                      <strong>{csvPlan.overwriteRemovedPeopleCount}</strong>{" "}
                      existing user(s)
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

            {/* Staged CSV Row Preview (First Name | Last Name | Institution | Email | Assigned Roles | Status) */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/95 border-b border-slate-300/85 text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-700">
                      <th className="py-2.5 px-3">First Name</th>
                      <th className="py-2.5 px-3">Last Name</th>
                      <th className="py-2.5 px-3">Institution</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Assigned Roles</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedCsv.rows.slice(0, 8).map((row) => {
                      const existing = existingByEmail.get(row.email);
                      const resolvedFirst =
                        row.firstName || existing?.firstName || "";
                      const resolvedLast =
                        row.lastName || existing?.lastName || "";
                      const resolvedAffil =
                        row.affiliation || existing?.affiliation || "";
                      const willFillProfile = Boolean(
                        existing &&
                          ((!existing.firstName.trim() && row.firstName.trim()) ||
                            (!existing.lastName.trim() && row.lastName.trim()) ||
                            (!existing.affiliation.trim() &&
                              row.affiliation.trim()))
                      );

                      return (
                        <tr key={row.email}>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {resolvedFirst || (
                              <span className="text-slate-400">&mdash;</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {resolvedLast || (
                              <span className="text-slate-400">&mdash;</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {resolvedAffil || (
                              <span className="text-slate-400">&mdash;</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {row.email}
                          </td>
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
                                <span className="text-slate-500 italic">
                                  General (auto)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {!existing ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                New Entry
                              </span>
                            ) : willFillProfile ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-[10px] font-bold">
                                Existing + Profile Fill
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
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 text-center tabular-nums">
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

      {/* Section 2: Assigned Roles & Directory Filter */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary shrink-0" /> Assigned Roles &amp; Directory Filter
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Click any role pill below to filter the whitelist directory by portal permission, or toggle again to show all users.
            </p>
          </div>
        </div>

        <div className="bg-[#F3F6FA] border border-slate-200/95 rounded-xl p-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
              roleFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                : "bg-white text-slate-800 border-slate-300/90 hover:border-primary/50"
            }`}
          >
            All Whitelist ({whitelist.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setRoleFilter(roleFilter === "unassigned" ? "all" : "unassigned")
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
              roleFilter === "unassigned"
                ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                : "bg-white text-slate-800 border-slate-300/90 hover:border-slate-400"
            }`}
          >
            No Special Roles ({roleCounts.unassigned})
          </button>

          <span
            aria-hidden="true"
            className="hidden sm:inline-block h-5 w-px bg-slate-300 mx-1"
          />

          {ADMIN_ASSIGNABLE_ROLES.map((role) => {
            const active = roleFilter === role;
            const meta = ROLE_DISPLAY_META[role];
            return (
              <button
                type="button"
                key={role}
                onClick={() => setRoleFilter(active ? "all" : role)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                  active
                    ? meta.activePillClass
                    : "bg-white border-slate-300/90 text-slate-800 hover:border-primary/50"
                }`}
              >
                {meta.label} ({roleCounts.counts[role]})
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3: Whitelist Directory Controls, Bulk Role Bar, Collapsible Add Form & Table */}
      <section className="bg-white border border-slate-300/85 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Card Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-primary shrink-0" /> Whitelist Directory
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
              Showing {filteredAndSortedWhitelist.length} of {whitelist.length}
            </span>
            {hasActiveFilters && (
              <div className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-semibold text-sky-900">
                <span>
                  {[
                    roleFilter !== "all"
                      ? `Role: ${
                          roleFilter === "unassigned"
                            ? "No Special Roles"
                            : ROLE_DISPLAY_META[roleFilter]?.label || roleFilter
                        }`
                      : null,
                    searchQuery.trim() ? `Query: "${searchQuery.trim()}"` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                  }}
                  className="px-1.5 py-0.5 rounded-full bg-white border border-sky-300 text-sky-900 hover:bg-sky-100 text-[10px] font-bold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors cursor-pointer shrink-0"
          >
            <UserPlus size={14} /> {showAddForm ? "Close Form" : "Add User"}
          </button>
        </div>

        {/* Search, Filter & Sort Well */}
        <div className="bg-[#F3F6FA] border border-slate-200/90 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-6">
            <label htmlFor="whitelist-search-input" className="hems-label">
              Search Whitelist
            </label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                id="whitelist-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search first name, last name, institution, email, or role..."
                className="hems-control w-full pl-9 pr-9 py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear filter search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 p-0.5 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="whitelist-role-filter" className="hems-label">
              Filter by Role
            </label>
            <select
              id="whitelist-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilterValue)}
              className="hems-control w-full py-2 font-medium"
            >
              <option value="all">All Roles ({whitelist.length})</option>
              <option value="unassigned">
                No Special Roles ({roleCounts.unassigned})
              </option>
              {ADMIN_ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_DISPLAY_META[r].label} ({roleCounts.counts[r]})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="whitelist-sort-select" className="hems-label">
              Sort Order
            </label>
            <select
              id="whitelist-sort-select"
              value={`${sortField}:${sortDir}`}
              onChange={(e) => handleSortDropdownChange(e.target.value)}
              className="hems-control w-full py-2 font-medium"
            >
              <option value="firstName:asc">First Name (A &rarr; Z)</option>
              <option value="firstName:desc">First Name (Z &rarr; A)</option>
              <option value="lastName:asc">Last Name (A &rarr; Z)</option>
              <option value="lastName:desc">Last Name (Z &rarr; A)</option>
              <option value="affiliation:asc">Institution (A &rarr; Z)</option>
              <option value="affiliation:desc">Institution (Z &rarr; A)</option>
              <option value="email:asc">Email (A &rarr; Z)</option>
              <option value="email:desc">Email (Z &rarr; A)</option>
              <option value="roles:desc">Role Count (Most &rarr; Fewest)</option>
              <option value="roles:asc">Role Count (Fewest &rarr; Most)</option>
            </select>
          </div>
        </div>

        {/* Bulk Assign Roles Bar */}
        {selectedEmails.size > 0 && (
          <div className="p-3.5 rounded-xl bg-sky-50/75 border border-primary/35 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-primary tabular-nums">
                {selectedEmails.size} user(s) selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedEmails(new Set())}
                className="text-slate-700 hover:text-slate-950 font-medium underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="bulk-assign-role-select"
                className="hems-label mb-0 whitespace-nowrap"
              >
                Assign Role:
              </label>
              <select
                id="bulk-assign-role-select"
                value={bulkRole}
                onChange={(e) => {
                  if (isAssignableRole(e.target.value)) {
                    setBulkRole(e.target.value);
                  }
                }}
                className="hems-control py-1.5 w-52"
              >
                {ADMIN_ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_DISPLAY_META[r].label} ({r})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={savingBusy}
                onClick={() => void handleBulkRoleAction("add")}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 disabled:opacity-50 cursor-pointer"
              >
                + Grant Role
              </button>
              <button
                type="button"
                disabled={savingBusy}
                onClick={() => void handleBulkRoleAction("remove")}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                &minus; Remove Role
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Manual Add / Update Form (First Name | Last Name | Institution | Email) */}
        {showAddForm && (
          <form
            onSubmit={(e) => void handleAddUserSubmit(e)}
            className="p-4 sm:p-5 rounded-xl bg-[#F3F6FA] border border-slate-300/85 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/70 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#1E3A5F]">
                Add or Update Whitelist User
              </h3>
              <span className="text-[11px] font-medium text-slate-600">
                Merges roles onto existing records without clearing saved fields
              </span>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label htmlFor="admin-new-first" className="hems-label">
                  First Name
                </label>
                <input
                  id="admin-new-first"
                  type="text"
                  value={newFirst}
                  onChange={(e) => setNewFirst(e.target.value)}
                  placeholder="First name"
                  className="hems-control w-full py-2"
                />
              </div>
              <div>
                <label htmlFor="admin-new-last" className="hems-label">
                  Last Name
                </label>
                <input
                  id="admin-new-last"
                  type="text"
                  value={newLast}
                  onChange={(e) => setNewLast(e.target.value)}
                  placeholder="Last name"
                  className="hems-control w-full py-2"
                />
              </div>
              <div>
                <label htmlFor="admin-new-affiliation" className="hems-label">
                  Institution / Lab{" "}
                  <span className="hems-label-hint">(Optional)</span>
                </label>
                <input
                  id="admin-new-affiliation"
                  type="text"
                  value={newAffiliation}
                  onChange={(e) => setNewAffiliation(e.target.value)}
                  placeholder="University / Lab"
                  className="hems-control w-full py-2"
                />
              </div>
              <div>
                <label htmlFor="admin-new-email" className="hems-label">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="admin-new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="researcher@university.edu"
                  className="hems-control w-full py-2"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1 border-t border-slate-300/60">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="hems-label mb-0">
                    Assign Roles{" "}
                    <span className="hems-label-hint">
                      (Optional &mdash; leave unselected for automatic general access)
                    </span>
                  </span>
                  {selectedRoles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedRoles([])}
                      className="text-[11px] font-semibold text-slate-600 hover:text-primary cursor-pointer"
                    >
                      Clear selected ({selectedRoles.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
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
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? meta.activePillClass
                            : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {isSelected ? `✓ ${meta.label}` : meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start lg:self-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError("");
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {savingBusy && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Whitelist User</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Whitelist Directory Table (First Name | Last Name | Institution | Email | Assigned Roles | Actions) */}
        {loadingList ? (
          <div className="py-12 text-center text-slate-500 text-xs sm:text-sm">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading whitelist directory...
          </div>
        ) : filteredAndSortedWhitelist.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-medium space-y-2">
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
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/95 border-y border-slate-300/85 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                  <th className="py-3 px-3 w-9">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      aria-label={`Select all ${filteredAndSortedWhitelist.length} matching whitelist users`}
                      className="rounded border-slate-400 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  {(
                    [
                      { field: "firstName" as SortField, label: "First Name" },
                      { field: "lastName" as SortField, label: "Last Name" },
                      { field: "affiliation" as SortField, label: "Institution" },
                      { field: "email" as SortField, label: "Email" },
                      { field: "roles" as SortField, label: "Assigned Roles" },
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
                        className="py-3 pr-4 whitespace-nowrap select-none"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortHeader(field)}
                          className={`inline-flex items-center gap-1 uppercase tracking-[0.06em] transition-colors cursor-pointer ${
                            isActiveSort
                              ? "text-primary font-bold"
                              : "text-slate-700 hover:text-slate-950 font-bold"
                          }`}
                        >
                          <span>{label}</span>
                          {renderSortIcon(field)}
                        </button>
                      </th>
                    );
                  })}
                  <th className="py-3 pr-3 text-right whitespace-nowrap text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/85">
                {filteredAndSortedWhitelist.map((entry) => {
                  const isEditing = editingEmail === entry.email;
                  const isChecked = selectedEmails.has(entry.email);
                  const activeAssignableRoles = entry.roles.filter(isAssignableRole);
                  const unassignedRoles = ADMIN_ASSIGNABLE_ROLES.filter(
                    (role) => !activeAssignableRoles.includes(role)
                  );

                  const handleEditKeyDown = (
                    e: React.KeyboardEvent<HTMLInputElement>
                  ) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSaveProfile(entry.email);
                    } else if (e.key === "Escape") {
                      handleCancelEditProfile();
                    }
                  };

                  return (
                    <tr
                      key={entry.email}
                      className={
                        isChecked
                          ? "bg-primary/[0.06] align-top"
                          : "hover:bg-sky-50/35 transition-colors align-top"
                      }
                    >
                      <td className="py-3 px-3 align-top pt-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(entry.email)}
                          aria-label={`Select ${entry.email}`}
                          className="rounded border-slate-400 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>

                      {/* First Name */}
                      <td className="py-3 pr-4 align-top font-semibold text-slate-900 min-w-[115px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFirstDraft}
                            onChange={(e) => setEditFirstDraft(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            placeholder="First name"
                            aria-label={`Edit first name for ${entry.email}`}
                            autoFocus
                            className="hems-control w-full px-2.5 py-1 text-xs"
                          />
                        ) : entry.firstName ? (
                          <span>{entry.firstName}</span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      {/* Last Name */}
                      <td className="py-3 pr-4 align-top font-semibold text-slate-900 min-w-[115px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editLastDraft}
                            onChange={(e) => setEditLastDraft(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            placeholder="Last name"
                            aria-label={`Edit last name for ${entry.email}`}
                            className="hems-control w-full px-2.5 py-1 text-xs"
                          />
                        ) : entry.lastName ? (
                          <span>{entry.lastName}</span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      {/* Institution (Optional) */}
                      <td className="py-3 pr-4 align-top text-slate-800 min-w-[160px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editAffiliationDraft}
                            onChange={(e) =>
                              setEditAffiliationDraft(e.target.value)
                            }
                            onKeyDown={handleEditKeyDown}
                            placeholder="Institution / Lab (optional)"
                            aria-label={`Edit institution for ${entry.email}`}
                            className="hems-control w-full px-2.5 py-1 text-xs"
                          />
                        ) : entry.affiliation ? (
                          <span>{entry.affiliation}</span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 pr-4 align-top font-semibold text-slate-950 break-all">
                        {entry.email}
                      </td>

                      {/* Assigned Roles */}
                      <td className="py-3 pr-4 align-top">
                        <div className="flex flex-wrap items-center gap-1">
                          {activeAssignableRoles.length === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10.5px] font-medium">
                              General (auto)
                            </span>
                          ) : (
                            activeAssignableRoles.map((role) => {
                              const meta = ROLE_DISPLAY_META[role];
                              const isProtectedAdminBadge =
                                entry.email === PROTECTED_ADMIN_EMAIL &&
                                role === "admin";
                              return (
                                <span
                                  key={role}
                                  title={
                                    isProtectedAdminBadge
                                      ? "Protected system webmaster — permanently retains Administrator role"
                                      : meta.desc
                                  }
                                  className={`inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-md border text-[10.5px] font-semibold ${meta.badgeClass}`}
                                >
                                  <span>{meta.label}</span>
                                  {isProtectedAdminBadge ? (
                                    <Lock
                                      size={10}
                                      aria-label="Permanent webmaster Administrator lock"
                                      className="opacity-70 shrink-0"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void toggleRole(entry.email, role, entry.roles)
                                      }
                                      aria-label={`Remove ${meta.label} role from ${entry.email}`}
                                      title={`Remove ${meta.label}`}
                                      className="opacity-75 hover:opacity-100 hover:text-red-600 cursor-pointer"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </span>
                              );
                            })
                          )}

                          {unassignedRoles.length > 0 && (
                            <select
                              aria-label={`Assign role to ${entry.email}`}
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val && isAssignableRole(val)) {
                                  void toggleRole(entry.email, val, entry.roles);
                                }
                              }}
                              className="px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-[10.5px] font-medium text-slate-700 hover:border-primary hover:text-primary bg-white cursor-pointer focus:outline-none"
                            >
                              <option value="">+ Assign Role</option>
                              {unassignedRoles.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_DISPLAY_META[role].label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-3 text-right whitespace-nowrap align-top">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleSaveProfile(entry.email)}
                              aria-label={`Save profile for ${entry.email}`}
                              title="Save changes"
                              className="p-1.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditProfile}
                              aria-label="Cancel profile editing"
                              title="Cancel"
                              className="p-1.5 rounded bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditProfile(entry)}
                              aria-label={`Edit profile for ${entry.email}`}
                              title="Edit First Name, Last Name & Institution"
                              className="p-1.5 rounded text-slate-500 hover:text-primary hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={entry.email === PROTECTED_ADMIN_EMAIL}
                              onClick={() => void handleDeleteEntryClick(entry)}
                              className={`p-1.5 rounded transition-colors ${
                                entry.email === PROTECTED_ADMIN_EMAIL
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              }`}
                              title={
                                entry.email === PROTECTED_ADMIN_EMAIL
                                  ? "Protected system webmaster cannot be removed from whitelist"
                                  : "Remove from Whitelist"
                              }
                              aria-label={
                                entry.email === PROTECTED_ADMIN_EMAIL
                                  ? `${entry.email} is protected and cannot be removed`
                                  : `Remove ${entry.email} from whitelist`
                              }
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CSV Format & Multi-Role Guide Modal */}
      <WhitelistCsvFormatModal
        open={csvFormatModalOpen}
        onClose={() => setCsvFormatModalOpen(false)}
      />

      {/* Google Sheets Copy/Paste Roster Importer Modal */}
      <WhitelistSheetsPasteModal
        open={pasteModalOpen}
        onClose={() => setPasteModalOpen(false)}
        existingWhitelist={whitelist}
        initialAssignRole={csvAssignRole}
        initialMode={csvMode}
        onApplyPlan={handleApplyPastePlan}
      />

      {/* Whitelist Roster Export Modal */}
      <WhitelistExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        whitelist={whitelist}
        initialRoleFilter={roleFilter}
      />
    </div>
  );
}
