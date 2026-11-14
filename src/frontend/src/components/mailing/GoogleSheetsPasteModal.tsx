"use client";

import React, { ClipboardEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ClipboardPaste,
  Plus,
  Trash2,
  Tags,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { MailchimpParsedRow } from "@/types/mailing";
import { normalizeSublistTag, normalizeSubscriberEmail, isValidSubscriberEmail } from "@/utils/mailingTemplate";
import {
  applyClipboardPasteToRows,
  buildParsedRowsFromPasteTable,
  createEmptyPastedRow,
  createInitialPastedRows,
  PASTE_COLUMN_ORDER,
  PasteColumnField,
  PastedSubscriberRow,
} from "@/utils/spreadsheetPaste";

interface GoogleSheetsPasteModalProps {
  open: boolean;
  onClose: () => void;
  availableSublists: string[];
  initialSublistTag: string;
  onImportRows: (rows: MailchimpParsedRow[], assignedTag: string) => Promise<void>;
}

const NEW_TAG_SENTINEL = "__new__";

export default function GoogleSheetsPasteModal({
  open,
  onClose,
  availableSublists,
  initialSublistTag,
  onImportRows,
}: GoogleSheetsPasteModalProps) {
  const [rows, setRows] = useState<PastedSubscriberRow[]>(() =>
    createInitialPastedRows(8)
  );
  const [tagSelection, setTagSelection] = useState<string>("");
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [pasteNotice, setPasteNotice] = useState<string>("");
  const [modalError, setModalError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync tag dropdown default whenever modal opens
  useEffect(() => {
    if (!open) return;
    setModalError("");
    setPasteNotice("");
    const cleanInit = normalizeSublistTag(initialSublistTag);
    if (!cleanInit) {
      setTagSelection("");
      setCustomTagInput("");
      return;
    }
    const matched = availableSublists.find(
      (t) => t.toLowerCase() === cleanInit.toLowerCase()
    );
    if (matched) {
      setTagSelection(matched);
      setCustomTagInput("");
    } else {
      setTagSelection(NEW_TAG_SENTINEL);
      setCustomTagInput(cleanInit);
    }
  }, [open, initialSublistTag, availableSublists]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  const resolvedSublistTag = useMemo(() => {
    if (tagSelection === NEW_TAG_SENTINEL) {
      return normalizeSublistTag(customTagInput);
    }
    return normalizeSublistTag(tagSelection);
  }, [tagSelection, customTagInput]);

  const parsedSummary = useMemo(
    () => buildParsedRowsFromPasteTable(rows, resolvedSublistTag),
    [rows, resolvedSublistTag]
  );

  if (!open || typeof document === "undefined") return null;

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
      // Single plain text cell — let native browser paste handle it
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

  const handleImportSubmit = async () => {
    if (parsedSummary.validRows.length === 0) {
      setModalError(
        "Enter or paste at least one row containing a valid email address before importing."
      );
      return;
    }

    setModalError("");
    setSubmitting(true);
    try {
      await onImportRows(parsedSummary.validRows, resolvedSublistTag);
      setRows(createInitialPastedRows(8));
      onClose();
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "Failed to import pasted list."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={() => {
        if (!submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheets-paste-dialog-title"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-0.5">
                Direct Spreadsheet Import
              </span>
              <h2
                id="sheets-paste-dialog-title"
                className="font-serif text-xl sm:text-2xl font-semibold text-slate-900"
              >
                Paste Subscribers from Google Sheets
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
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{ maxHeight: "72vh" }}
            className="block overflow-y-auto p-6 space-y-4 text-xs sm:text-sm text-slate-700 bg-white"
          >
            {/* Tag Selector & Action Toolbar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <label
                  htmlFor="paste-sublist-tag-select"
                  className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                >
                  <Tags size={14} className="text-primary shrink-0" />
                  <span>Tag Pasted List with Sublist (Optional)</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="paste-sublist-tag-select"
                    aria-label="Select sublist tag for pasted list"
                    value={tagSelection}
                    onChange={(e) => setTagSelection(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary sm:min-w-[230px]"
                  >
                    <option value="">No sublist tag (Directory only)</option>
                    {availableSublists.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                    <option value={NEW_TAG_SENTINEL}>
                      + Create new sublist tag...
                    </option>
                  </select>

                  {tagSelection === NEW_TAG_SENTINEL && (
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      placeholder="Enter new tag name (e.g. 2027 Attendees)"
                      aria-label="New sublist tag name"
                      className="bg-white border border-primary/50 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary flex-1"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handlePasteFromClipboardButton()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <ClipboardPaste size={14} /> Paste from Clipboard
                </button>
                <button
                  type="button"
                  onClick={handleAddRows}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Rows
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-medium hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} /> Clear
                </button>
              </div>
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
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                    <th className="py-2.5 px-2.5 min-w-[130px]">First Name</th>
                    <th className="py-2.5 px-2.5 min-w-[130px]">Last Name</th>
                    <th className="py-2.5 px-2.5 min-w-[180px]">
                      Institution{" "}
                      <span className="normal-case font-normal text-slate-400">
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
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, rowIdx) => {
                    const hasAnyValue = Boolean(
                      row.firstName.trim() ||
                        row.lastName.trim() ||
                        row.affiliation.trim() ||
                        row.email.trim()
                    );
                    const normalizedEmail = normalizeSubscriberEmail(row.email);
                    const emailValid =
                      Boolean(normalizedEmail) &&
                      isValidSubscriberEmail(normalizedEmail);
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
                            ? "bg-amber-50/70"
                            : "hover:bg-slate-50/60"
                        }
                      >
                        <td className="py-1.5 px-2 text-center text-[11px] text-slate-400 tabular-nums font-medium">
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
                              className={`w-full px-2.5 py-1.5 rounded-md border text-xs text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white ${
                                rowHasInvalidEmail && col.field === "email"
                                  ? "bg-white border-amber-400 focus:border-red-500"
                                  : "bg-slate-50/50 border-slate-200 focus:border-primary"
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
                            className="p-1.5 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

            {parsedSummary.invalidRowNumbers.length > 0 && (
              <p className="text-[11px] text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                <span>
                  Row(s) {parsedSummary.invalidRowNumbers.join(", ")} are
                  missing a valid email address and will be skipped unless
                  corrected.
                </span>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900 tabular-nums">
                {parsedSummary.validRows.length} valid subscriber(s) ready
              </span>
              {parsedSummary.duplicateCount > 0 && (
                <span className="text-[11px] text-slate-500">
                  ({parsedSummary.duplicateCount} duplicate email merged)
                </span>
              )}
              {resolvedSublistTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                  Tag: {resolvedSublistTag}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || parsedSummary.validRows.length === 0}
                onClick={() => void handleImportSubmit()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>
                    Import {parsedSummary.validRows.length} Subscriber
                    {parsedSummary.validRows.length === 1 ? "" : "s"}
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
