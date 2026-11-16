"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  Download,
  FileText,
  Mail,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  ADMIN_ASSIGNABLE_ROLES,
  AssignableRole,
  isAssignableRole,
  ROLE_DISPLAY_META,
  WhitelistEntry,
} from "@/utils/whitelistCsv";
import {
  buildWhitelistExportFilename,
  filterWhitelistForExport,
  formatWhitelistExport,
  getWhitelistExportFormatMeta,
  type RoleMatchMode,
  WHITELIST_EXPORT_FORMATS,
  type WhitelistExportFormatId,
  type WhitelistRoleScope,
} from "@/utils/whitelistExport";

interface WhitelistExportModalProps {
  open: boolean;
  onClose: () => void;
  whitelist: WhitelistEntry[];
  initialRoleFilter: "all" | "unassigned" | AssignableRole;
}

function renderFormatIcon(formatId: WhitelistExportFormatId) {
  switch (formatId) {
    case "full_csv":
      return <FileText size={15} />;
    case "sheets_tsv":
      return <Users size={15} />;
    case "email_bcc":
      return <Mail size={15} />;
    case "emails_only":
      return <ShieldCheck size={15} />;
  }
}

function copyTextWithFallbackElement(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function WhitelistExportModal({
  open,
  onClose,
  whitelist,
  initialRoleFilter,
}: WhitelistExportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectAllUsers, setSelectAllUsers] = useState(true);
  const [selectedRoleScopes, setSelectedRoleScopes] = useState<WhitelistRoleScope[]>([]);
  const [matchMode, setMatchMode] = useState<RoleMatchMode>("any");
  const [format, setFormat] = useState<WhitelistExportFormatId>("full_csv");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const prevOpenRef = useRef(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const justOpened = !prevOpenRef.current && open;
    prevOpenRef.current = open;
    if (!justOpened) return;

    setMatchMode("any");
    setFormat("full_csv");
    setIncludeHeader(true);
    setCopied(false);
    setCopyError(null);

    if (initialRoleFilter === "all") {
      setSelectAllUsers(true);
      setSelectedRoleScopes([]);
    } else {
      setSelectAllUsers(false);
      setSelectedRoleScopes([initialRoleFilter]);
    }
  }, [open, initialRoleFilter]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const roleScopeCounts = useMemo(() => {
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

  const matchedEntries = useMemo(
    () =>
      filterWhitelistForExport(whitelist, {
        selectAllUsers,
        selectedRoleScopes,
        matchMode,
      }),
    [whitelist, selectAllUsers, selectedRoleScopes, matchMode]
  );

  const formatMeta = useMemo(() => getWhitelistExportFormatMeta(format), [format]);

  const formattedOutput = useMemo(
    () =>
      formatWhitelistExport(matchedEntries, {
        format,
        includeHeader,
      }),
    [matchedEntries, format, includeHeader]
  );

  const exportFilename = useMemo(
    () =>
      buildWhitelistExportFilename({
        format,
        selectAllUsers,
        selectedRoleScopes,
      }),
    [format, selectAllUsers, selectedRoleScopes]
  );

  const previewSummary = useMemo(() => {
    if (!formattedOutput) {
      return {
        snippet: "",
        truncated: false,
        extraInfo: "",
      };
    }

    const maxLines = 10;
    const maxChars = 1100;
    const lines = formattedOutput.split(/\r?\n/);
    let snippet = lines.slice(0, maxLines).join("\n");
    let truncated = lines.length > maxLines;

    if (snippet.length > maxChars) {
      snippet = snippet.slice(0, maxChars);
      truncated = true;
    }

    const extraInfo =
      lines.length > maxLines
        ? `Showing first ${maxLines} of ${lines.length} lines`
        : truncated
          ? `Showing first ${maxChars.toLocaleString()} of ${formattedOutput.length.toLocaleString()} characters`
          : "";

    return { snippet, truncated, extraInfo };
  }, [formattedOutput]);

  const handleToggleAllUsers = () => {
    setSelectAllUsers(true);
    setSelectedRoleScopes([]);
    setCopied(false);
    setCopyError(null);
  };

  const handleSelectAllRoles = () => {
    setSelectAllUsers(false);
    setSelectedRoleScopes([...ADMIN_ASSIGNABLE_ROLES]);
    setCopied(false);
    setCopyError(null);
  };

  const handleClearScopes = () => {
    setSelectAllUsers(false);
    setSelectedRoleScopes([]);
    setCopied(false);
    setCopyError(null);
  };

  const handleToggleScope = (scope: WhitelistRoleScope) => {
    setCopied(false);
    setCopyError(null);

    if (selectAllUsers) {
      setSelectAllUsers(false);
      setSelectedRoleScopes([scope]);
      return;
    }

    if (selectedRoleScopes.includes(scope)) {
      setSelectedRoleScopes((prev) => prev.filter((item) => item !== scope));
    } else {
      setSelectedRoleScopes((prev) => [...prev, scope]);
    }
  };

  const handleCopyToClipboard = async () => {
    if (matchedEntries.length === 0 || !formattedOutput) return;

    setCopyError(null);
    let succeeded = false;
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(formattedOutput);
        succeeded = true;
      } else {
        succeeded = copyTextWithFallbackElement(formattedOutput);
      }
    } catch {
      try {
        succeeded = copyTextWithFallbackElement(formattedOutput);
      } catch {
        succeeded = false;
      }
    }

    if (!succeeded) {
      setCopyError(
        "Browser blocked direct clipboard access. Try downloading the file instead."
      );
      return;
    }

    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleDownload = () => {
    if (matchedEntries.length === 0 || !formattedOutput) return;

    try {
      const payload =
        formatMeta.extension === "csv"
          ? `\uFEFF${formattedOutput}`
          : formattedOutput;
      const blob = new Blob([payload], { type: formatMeta.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exportFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      setCopyError("Could not trigger browser download for this export.");
    }
  };

  if (!open || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whitelist-export-modal-title"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F3F6FA]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Download size={16} />
              </div>
              <div>
                <h2
                  id="whitelist-export-modal-title"
                  className="text-sm sm:text-base font-bold text-slate-900"
                >
                  Export Whitelist Roster
                </h2>
                <p className="text-[11px] text-slate-600">
                  Select all whitelist entries or specific assigned roles, pick an export format, and download or copy to clipboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close whitelist export modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{ maxHeight: "72vh" }}
            className="block p-5 sm:p-6 space-y-5 overflow-y-auto text-sm text-slate-700 bg-white"
          >
            {/* Section 1: Audience & Assigned Roles */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="hems-label mb-0">
                  1. Audience &amp; Assigned Roles
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllRoles}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Select All Roles ({ADMIN_ASSIGNABLE_ROLES.length})
                  </button>
                  {!selectAllUsers && selectedRoleScopes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearScopes}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F3F6FA] border border-slate-200/95 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleAllUsers}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    selectAllUsers
                      ? "bg-primary text-white border-primary shadow-2xs"
                      : "bg-white text-slate-800 border-slate-300 hover:border-primary/50"
                  }`}
                >
                  <Users size={13} />
                  <span>All Whitelist Users</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectAllUsers
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {whitelist.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleScope("unassigned")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    !selectAllUsers && selectedRoleScopes.includes("unassigned")
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-800 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span>No Special Roles</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      !selectAllUsers && selectedRoleScopes.includes("unassigned")
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {roleScopeCounts.unassigned}
                  </span>
                </button>

                {ADMIN_ASSIGNABLE_ROLES.map((role) => {
                  const active =
                    !selectAllUsers && selectedRoleScopes.includes(role);
                  const meta = ROLE_DISPLAY_META[role];
                  const count = roleScopeCounts.counts[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleScope(role)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? meta.activePillClass
                          : "bg-white border-slate-300 text-slate-800 hover:border-primary/50"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${
                          active
                            ? "bg-primary border-primary text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {active && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span>{meta.label}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!selectAllUsers && selectedRoleScopes.length >= 2 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F3F6FA] border border-slate-200 px-3 py-2">
                  <span className="text-[11px] font-semibold text-slate-700">
                    Multi-role filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMatchMode("any")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      matchMode === "any"
                        ? "bg-primary text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Match ANY selected role (Union)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMode("all")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      matchMode === "all"
                        ? "bg-primary text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Match ALL selected roles (Intersection)
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Export Format */}
            <div className="space-y-2.5">
              <span className="hems-label mb-0">2. Export Format</span>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {WHITELIST_EXPORT_FORMATS.map((item) => {
                  const selected = format === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFormat(item.id);
                        setCopied(false);
                        setCopyError(null);
                      }}
                      className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-slate-300/90 bg-white hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                          <span
                            className={selected ? "text-primary" : "text-slate-600"}
                          >
                            {renderFormatIcon(item.id)}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wide ${
                            selected
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {formatMeta.supportsHeaderToggle && (
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => {
                      setIncludeHeader(e.target.checked);
                      setCopied(false);
                    }}
                    className="rounded-xs border-slate-400 text-primary focus:ring-primary"
                  />
                  Include column header row in exported output
                </label>
              )}
            </div>

            {/* Section 3: Live Output Preview */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="hems-label mb-0">3. Live Output Preview</span>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-900">
                    {matchedEntries.length}{" "}
                    {matchedEntries.length === 1 ? "user" : "users"}
                  </span>
                  <span>&middot;</span>
                  <span>{formattedOutput.length.toLocaleString()} chars</span>
                  <span>&middot;</span>
                  <code className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-800 font-mono text-[10px]">
                    {exportFilename}
                  </code>
                </div>
              </div>

              {matchedEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/75 p-4 text-xs text-amber-900">
                  No whitelist entries match the selected role scope. Select{" "}
                  <strong>All Whitelist Users</strong> or one or more role scopes with matching records to export.
                </div>
              ) : (
                <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                  <pre className="p-3.5 text-[11px] leading-relaxed font-mono text-slate-100 overflow-x-auto whitespace-pre">
                    {previewSummary.snippet}
                  </pre>
                  {previewSummary.truncated && (
                    <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                      {previewSummary.extraInfo} &mdash; Copy or Download includes all{" "}
                      {matchedEntries.length} matched users.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-[#F3F6FA] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              {copied && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Check size={14} /> Copied {matchedEntries.length}{" "}
                  {matchedEntries.length === 1 ? "user" : "users"} to clipboard!
                </span>
              )}
              {copyError && (
                <span className="text-red-700 font-medium">{copyError}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCopyToClipboard()}
                disabled={matchedEntries.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/35 bg-white text-primary text-xs font-semibold hover:bg-primary/5 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={matchedEntries.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                Download .{formatMeta.extension}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

