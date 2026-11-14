"use client";

import React, { ClipboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  applyClipboardPasteToRows,
  createEmptyPastedRow,
  createInitialPastedRows,
  PASTE_COLUMN_ORDER,
  PasteColumnField,
  PastedSubscriberRow,
} from "@/utils/spreadsheetPaste";
import {
  ADMIN_ASSIGNABLE_ROLES,
  AssignableRole,
  buildWhitelistParseResultFromPasteRows,
  computeWhitelistCsvPlan,
  CsvApplyMode,
  isAssignableRole,
  isValidWhitelistEmail,
  ROLE_DISPLAY_META,
  WhitelistCsvApplyPlan,
  WhitelistEntry,
} from "@/utils/whitelistCsv";

interface WhitelistSheetsPasteModalProps {
  open: boolean;
  onClose: () => void;
  existingWhitelist: WhitelistEntry[];
  initialAssignRole: AssignableRole | "";
  initialMode: CsvApplyMode;
  onApplyPlan: (
    plan: WhitelistCsvApplyPlan,
    meta: {
      mode: CsvApplyMode;
      validCount: number;
      assignedRoles: AssignableRole[];
    }
  ) => Promise<void>;
}

export default function WhitelistSheetsPasteModal({
  open,
  onClose,
  existingWhitelist,
  initialAssignRole,
  initialMode,
  onApplyPlan,
}: WhitelistSheetsPasteModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<PastedSubscriberRow[]>(() =>
    createInitialPastedRows(8)
  );
  const [assignedRoles, setAssignedRoles] = useState<AssignableRole[]>([]);
  const [mode, setMode] = useState<CsvApplyMode>("append");
  const [pasteNotice, setPasteNotice] = useState<string>("");
  const [modalError, setModalError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const prevOpenRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const justOpened = !prevOpenRef.current && open;
    prevOpenRef.current = open;
    if (!justOpened) return;

    setModalError("");
    setPasteNotice("");
    setMode(initialMode);
    if (initialAssignRole && isAssignableRole(initialAssignRole)) {
      setAssignedRoles([initialAssignRole]);
    } else {
      setAssignedRoles([]);
    }
  }, [open, initialAssignRole, initialMode]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  const pasteResult = useMemo(
    () => buildWhitelistParseResultFromPasteRows(rows, assignedRoles),
    [rows, assignedRoles]
  );

  const effectiveMode: CsvApplyMode =
    assignedRoles.length > 0 ? mode : "append";

  const previewPlan = useMemo(
    () =>
      computeWhitelistCsvPlan(
        existingWhitelist,
        pasteResult.parsed,
        effectiveMode,
        effectiveMode === "overwrite" ? assignedRoles : undefined
      ),
    [existingWhitelist, pasteResult.parsed, effectiveMode, assignedRoles]
  );

  if (!open || !mounted || typeof document === "undefined") return null;

  const updateCell = (
    rowIndex: number,
    field: PasteColumnField,
    value: string
  ) => {
    setModalError("");
    setRows((prev) =>
      prev.map((row, idx) => (idx === rowIndex ? { ...row, [field]: value } : row))
    );
  };

  const handleCellPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const text = e.clipboardData?.getData("text/plain") ?? "";
    if (!text) return;

    const updated = applyClipboardPasteToRows(rows, text, rowIndex, colIndex);
    if (!updated) {
      return;
    }

    e.preventDefault();
    setModalError("");
    setPasteNotice("Pasted spreadsheet selection into table.");
    setRows(updated);
  };

  const handlePasteFromClipboardButton = async () => {
    setModalError("");
    setPasteNotice("");
    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        typeof navigator.clipboard.readText !== "function"
      ) {
        setModalError(
          "Clipboard read button is unavailable in this browser. Click any cell in Row 1 and press Ctrl+V / Cmd+V directly."
        );
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setModalError(
          "Your clipboard appears empty. Copy cells from Google Sheets first, then paste."
        );
        return;
      }

      const firstNonEmptyIdx = rows.findIndex(
        (r) =>
          !r.firstName.trim() &&
          !r.lastName.trim() &&
          !r.affiliation.trim() &&
          !r.email.trim()
      );
      const startRow = firstNonEmptyIdx >= 0 ? firstNonEmptyIdx : rows.length;
      const updated = applyClipboardPasteToRows(rows, clipText, startRow, null);
      if (!updated) {
        setModalError(
          "Could not detect rows from clipboard text. Click Row 1 and press Ctrl+V / Cmd+V directly."
        );
        return;
      }
      setRows(updated);
      setPasteNotice("Clipboard rows loaded into table below.");
    } catch {
      setModalError(
        "Browser blocked automatic clipboard read. Click inside the first cell of Row 1 and press Ctrl+V / Cmd+V to paste directly."
      );
    }
  };

  const handleAddRows = () => {
    setRows((prev) => [
      ...prev,
      createEmptyPastedRow(),
      createEmptyPastedRow(),
      createEmptyPastedRow(),
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    setRows((prev) => {
      const remaining = prev.filter((r) => r.id !== rowId);
      return remaining.length >= 1 ? remaining : createInitialPastedRows(4);
    });
  };

  const handleClearAll = () => {
    setModalError("");
    setPasteNotice("");
    setRows(createInitialPastedRows(8));
  };

  const toggleRolePill = (role: AssignableRole) => {
    setAssignedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleImportSubmit = async () => {
    if (pasteResult.parsed.rows.length === 0) {
      setModalError(
        "Enter or paste at least one row containing a valid email address before importing."
      );
      return;
    }

    setModalError("");
    setSubmitting(true);
    try {
      await onApplyPlan(previewPlan, {
        mode: effectiveMode,
        validCount: pasteResult.parsed.rows.length,
        assignedRoles,
      });
      setRows(createInitialPastedRows(8));
      onClose();
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "Failed to import pasted roster."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const primaryDropdownValue =
    assignedRoles.length === 1 ? assignedRoles[0] : assignedRoles[0] || "";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={() => {
        if (!submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whitelist-sheets-paste-dialog-title"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-[#F3F6FA]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-0.5">
                Direct Spreadsheet Import &bull; Admin Whitelist
              </span>
              <h2
                id="whitelist-sheets-paste-dialog-title"
                className="font-serif text-xl sm:text-2xl font-semibold text-slate-900"
              >
                Paste Roster from Google Sheets
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Select cells in Google Sheets or Excel and paste directly into any cell below (
                <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded font-mono">
                  Ctrl+V
                </kbd>{" "}
                /{" "}
                <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded font-mono">
                  Cmd+V
                </kbd>
                ). Columns are automatically mapped for{" "}
                <strong>First Name</strong>, <strong>Last Name</strong>,{" "}
                <strong>Institution</strong> (optional), and{" "}
                <strong>Email</strong>.
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              aria-label="Close Google Sheets paste importer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{ maxHeight: "72vh" }}
            className="block overflow-y-auto p-6 space-y-4 text-xs sm:text-sm text-slate-700 bg-white"
          >
            {/* Assign Roles & Toolbar Well */}
            <div className="p-4 rounded-xl bg-[#F3F6FA] border border-slate-300/80 space-y-3.5">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <label htmlFor="paste-assign-role-select" className="hems-label">
                    Assign Role{" "}
                    <span className="hems-label-hint">
                      (Applies to all pasted rows; general access is automatic)
                    </span>
                  </label>
                  <select
                    id="paste-assign-role-select"
                    aria-label="Assign role to pasted whitelist rows"
                    value={primaryDropdownValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setAssignedRoles([]);
                      } else if (isAssignableRole(val)) {
                        setAssignedRoles([val]);
                      }
                    }}
                    className="hems-control w-full sm:min-w-[260px]"
                  >
                    <option value="">No role (general access only)</option>
                    {ADMIN_ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_DISPLAY_META[role].label} ({role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handlePasteFromClipboardButton()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 transition-colors cursor-pointer"
                  >
                    <ClipboardPaste size={14} /> Paste from Clipboard
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRows}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add Rows
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-600 text-xs font-medium hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} /> Clear
                  </button>
                </div>
              </div>

              {/* Multi-Role Toggle Pills */}
              <div className="pt-2 border-t border-slate-300/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="hems-label mb-0 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-primary shrink-0" />
                    <span>Or Toggle Multiple Assigned Roles:</span>
                  </span>
                  {assignedRoles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssignedRoles([])}
                      className="text-[11px] font-semibold text-slate-600 hover:text-primary cursor-pointer"
                    >
                      Clear roles ({assignedRoles.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ADMIN_ASSIGNABLE_ROLES.map((role) => {
                    const selected = assignedRoles.includes(role);
                    const meta = ROLE_DISPLAY_META[role];
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRolePill(role)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          selected
                            ? meta.activePillClass
                            : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {selected ? `✓ ${meta.label}` : meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Update Mode (Append vs Overwrite) */}
              {assignedRoles.length > 0 && (
                <div className="pt-2 border-t border-slate-300/60 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="hems-label mb-0">Role List Behavior:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMode("append")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          effectiveMode === "append"
                            ? "bg-primary text-white border-primary"
                            : "bg-white border-slate-300 text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {effectiveMode === "append" && <Check size={12} />}
                        Append to Existing Role Holders
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("overwrite")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          effectiveMode === "overwrite"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white border-slate-300 text-slate-700 hover:border-amber-400"
                        }`}
                      >
                        {effectiveMode === "overwrite" && <Check size={12} />}
                        Overwrite Existing Holders of Selected Role(s)
                      </button>
                    </div>
                  </div>
                  {effectiveMode === "overwrite" && (
                    <p className="text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Overwrite mode removes{" "}
                      <strong>
                        {assignedRoles.map((r) => ROLE_DISPLAY_META[r].label).join(", ")}
                      </strong>{" "}
                      from{" "}
                      <strong>{previewPlan.overwriteRemovedPeopleCount}</strong>{" "}
                      existing user(s) not present in this pasted batch, while preserving their emails, names, institutions, and other roles.
                    </p>
                  )}
                </div>
              )}
            </div>

            {pasteNotice && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{pasteNotice}</span>
              </div>
            )}

            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Editable 4-Column Spreadsheet Table */}
            <div className="border border-slate-300/85 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/95 border-b border-slate-300/85 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                    <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                    <th className="py-2.5 px-2.5 min-w-[130px]">First Name</th>
                    <th className="py-2.5 px-2.5 min-w-[130px]">Last Name</th>
                    <th className="py-2.5 px-2.5 min-w-[180px]">
                      Institution{" "}
                      <span className="normal-case font-medium text-slate-500">
                        (optional)
                      </span>
                    </th>
                    <th className="py-2.5 px-2.5 min-w-[210px]">
                      Email <span className="text-red-600">*</span>
                    </th>
                    <th className="py-2.5 px-2 w-10 text-center">
                      <span className="sr-only">Remove row</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {rows.map((row, rowIdx) => {
                    const hasAnyValue = Boolean(
                      row.firstName.trim() ||
                        row.lastName.trim() ||
                        row.affiliation.trim() ||
                        row.email.trim()
                    );
                    const normalizedEmail = row.email.trim().toLowerCase();
                    const emailValid =
                      Boolean(normalizedEmail) &&
                      isValidWhitelistEmail(normalizedEmail);
                    const rowHasInvalidEmail = hasAnyValue && !emailValid;

                    const fields: ReadonlyArray<{
                      field: PasteColumnField;
                      colIdx: number;
                      placeholder: string;
                      value: string;
                      type: string;
                    }> = [
                      {
                        field: PASTE_COLUMN_ORDER[0],
                        colIdx: 0,
                        placeholder: rowIdx === 0 ? "Paste or type..." : "First name",
                        value: row.firstName,
                        type: "text",
                      },
                      {
                        field: PASTE_COLUMN_ORDER[1],
                        colIdx: 1,
                        placeholder: "Last name",
                        value: row.lastName,
                        type: "text",
                      },
                      {
                        field: PASTE_COLUMN_ORDER[2],
                        colIdx: 2,
                        placeholder: "University / Lab (optional)",
                        value: row.affiliation,
                        type: "text",
                      },
                      {
                        field: PASTE_COLUMN_ORDER[3],
                        colIdx: 3,
                        placeholder: "name@institution.edu",
                        value: row.email,
                        type: "email",
                      },
                    ];

                    return (
                      <tr
                        key={row.id}
                        className={
                          rowHasInvalidEmail
                            ? "bg-amber-50/75"
                            : "hover:bg-sky-50/35"
                        }
                      >
                        <td className="py-1.5 px-2 text-center text-[11px] text-slate-500 tabular-nums font-semibold">
                          {rowIdx + 1}
                        </td>
                        {fields.map((col) => (
                          <td key={col.field} className="py-1.5 px-1.5">
                            <input
                              type={col.type}
                              value={col.value}
                              onChange={(e) =>
                                updateCell(rowIdx, col.field, e.target.value)
                              }
                              onPaste={(e) =>
                                handleCellPaste(e, rowIdx, col.colIdx)
                              }
                              placeholder={col.placeholder}
                              aria-label={`Row ${rowIdx + 1} ${col.field}`}
                              className={`w-full px-2.5 py-1.5 rounded-md border text-xs text-slate-900 placeholder:text-[#7C8BA1] focus:outline-none focus:bg-white ${
                                rowHasInvalidEmail && col.field === "email"
                                  ? "bg-white border-amber-500 focus:border-red-500"
                                  : "bg-white border-slate-300 focus:border-primary"
                              }`}
                            />
                          </td>
                        ))}
                        <td className="py-1.5 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            aria-label={`Remove row ${rowIdx + 1}`}
                            title="Remove row"
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pasteResult.invalidRowNumbers.length > 0 && (
              <p className="text-[11px] text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                <span>
                  Row(s) {pasteResult.invalidRowNumbers.join(", ")} are missing a valid email address and will be skipped unless corrected.
                </span>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-[#F3F6FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 tabular-nums">
              <span className="font-bold text-slate-900">
                {pasteResult.parsed.rows.length} valid user(s)
              </span>
              {pasteResult.parsed.rows.length > 0 && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-700 font-semibold">
                    +{previewPlan.addedPeopleCount} new
                  </span>
                </>
              )}
              {previewPlan.namesFilledCount > 0 && (
                <>
                  <span>&bull;</span>
                  <span className="text-sky-800 font-semibold">
                    {previewPlan.namesFilledCount} profile(s) updated
                  </span>
                </>
              )}
              {pasteResult.duplicateCount > 0 && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-600">
                    {pasteResult.duplicateCount} duplicate(s) merged
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || pasteResult.parsed.rows.length === 0}
                onClick={() => void handleImportSubmit()}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-2xs ${
                  effectiveMode === "overwrite"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-primary hover:bg-sky-800"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : effectiveMode === "overwrite" ? (
                  <span>
                    Apply &amp; Overwrite Role List ({pasteResult.parsed.rows.length}{" "}
                    {pasteResult.parsed.rows.length === 1 ? "User" : "Users"})
                  </span>
                ) : (
                  <span>
                    Import {pasteResult.parsed.rows.length}{" "}
                    {pasteResult.parsed.rows.length === 1 ? "User" : "Users"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

