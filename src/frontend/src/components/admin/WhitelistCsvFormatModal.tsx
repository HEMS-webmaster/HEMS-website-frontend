"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  FileSpreadsheet,
  ShieldCheck,
  Table2,
  Tags,
  X,
} from "lucide-react";
import {
  ADMIN_ASSIGNABLE_ROLES,
  ROLE_DISPLAY_META,
  SAMPLE_WHITELIST_CSV,
  WHITELIST_EXAMPLE_HEADING_ROW,
} from "@/utils/whitelistCsv";

interface WhitelistCsvFormatModalProps {
  open: boolean;
  onClose: () => void;
}

const COLUMN_GUIDE: ReadonlyArray<{
  column: string;
  aliases: string;
  requirement: string;
  notes: string;
}> = [
  {
    column: "First Name",
    aliases: "first, fname, given name",
    requirement: "Optional",
    notes: "Fills missing first name on existing whitelist entries without overwriting populated values.",
  },
  {
    column: "Last Name",
    aliases: "last, lname, surname, family name",
    requirement: "Optional",
    notes: "Combined with First Name to preserve display names across auth & review screens.",
  },
  {
    column: "Institution",
    aliases: "Affiliation, Organization, Company, University, Institute, Lab",
    requirement: "Optional",
    notes:
      'Wrap in double quotes if the institution includes a comma (e.g. "Dept. of Chemistry, USF").',
  },
  {
    column: "Email Address",
    aliases: "Email, E-mail, Mail, User Email",
    requirement: "Required",
    notes: "Primary unique identifier in the whitelist (trimmed and lowercased automatically).",
  },
  {
    column: "Assigned Roles",
    aliases: "Roles, Role, Presentation Type, Registration Type, Category",
    requirement: "Optional",
    notes:
      'Use semicolons (attendee; oral presenter) or quoted commas ("attendee, reviewer") for multiple roles.',
  },
];

export default function WhitelistCsvFormatModal({
  open,
  onClose,
}: WhitelistCsvFormatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !mounted || typeof document === "undefined") return null;

  const markCopied = () => {
    setCopyFailed(false);
    setCopied(true);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleCopyHeadingRow = async () => {
    setCopyFailed(false);
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(WHITELIST_EXAMPLE_HEADING_ROW);
        markCopied();
        return;
      }
    } catch {
      // Fall through to hidden textarea selection fallback
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = WHITELIST_EXAMPLE_HEADING_ROW;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        markCopied();
        return;
      }
    } catch {
      // Handled below
    }

    setCopyFailed(true);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whitelist-csv-format-dialog-title"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-[#F3F6FA]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-0.5">
                Whitelist Roster Upload Specification
              </span>
              <h2
                id="whitelist-csv-format-dialog-title"
                className="font-serif text-xl sm:text-2xl font-semibold text-slate-900"
              >
                CSV Format, Delimitation &amp; Multi-Role Guide
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close CSV format guide"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{ maxHeight: "72vh" }}
            className="block overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white"
          >
            {/* 1. Example Heading Row & Copy Action */}
            <section className="p-4 rounded-xl bg-[#F3F6FA] border border-slate-300/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet size={17} className="text-primary shrink-0" />
                    1. Example CSV Heading Row
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Paste this header row into row 1 of Google Sheets or Excel before exporting as UTF-8{" "}
                    <code className="bg-white px-1 py-0.5 rounded border border-slate-200">
                      .csv
                    </code>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopyHeadingRow()}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
                    copied
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied Heading Row!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Example Heading Row
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 font-mono text-[11px] sm:text-xs text-slate-900 select-all overflow-x-auto whitespace-nowrap">
                {WHITELIST_EXAMPLE_HEADING_ROW}
              </div>

              {copyFailed && (
                <p className="text-[11px] text-amber-800 font-medium">
                  Clipboard access was blocked by the browser. Select the header text above and press Ctrl+C / Cmd+C to copy.
                </p>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F] block">
                  Multi-Row Example (.csv)
                </span>
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  {SAMPLE_WHITELIST_CSV}
                </pre>
              </div>
            </section>

            {/* 2. Column Delimitation Rules */}
            <section className="space-y-2 pt-1">
              <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Table2 size={17} className="text-primary shrink-0" />
                2. How Columns Are Delimited
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong>Comma-delimited columns (<code>,</code>):</strong> Save
                  your roster as standard UTF-8 Comma-Separated Values (
                  <code className="text-xs bg-slate-100 px-1 rounded">.csv</code>
                  ) with one user per row and headers in row 1.
                </li>
                <li>
                  <strong>Only Email is required; column order is flexible:</strong>{" "}
                  Rows must include{" "}
                  <code className="text-xs bg-slate-100 px-1 rounded">
                    Email Address
                  </code>{" "}
                  (or <code className="text-xs bg-slate-100 px-1 rounded">Email</code>
                  ). Existing single <code className="text-xs bg-slate-100 px-1 rounded">Name</code>{" "}
                  columns are also split automatically if separate First/Last columns are absent.
                </li>
                <li>
                  <strong>Cells containing literal commas:</strong> Wrap values
                  with commas (such as{" "}
                  <code className="text-xs bg-slate-100 px-1 rounded">
                    &quot;Dept. of Chemistry, USF&quot;
                  </code>
                  ) in double quotes (<code className="text-xs bg-slate-100 px-1 rounded">&quot;...&quot;</code>)
                  so they stay inside a single cell.
                </li>
              </ul>
            </section>

            {/* 3. Multi-Role Cell Formatting */}
            <section className="space-y-2.5 pt-4 border-t border-slate-100">
              <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Tags size={17} className="text-primary shrink-0" />
                3. How Cells With Multiple Assigned Roles Are Formatted
              </h3>
              <p>
                To grant multiple portal permissions in a single{" "}
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  Assigned Roles
                </code>{" "}
                cell, use either format below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-xs font-semibold text-emerald-900 block">
                    Semicolon-separated (Recommended)
                  </span>
                  <code className="block bg-white border border-emerald-200 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-900">
                    attendee; oral presenter
                  </code>
                  <p className="text-[11px] text-emerald-800">
                    Safe across spreadsheets and plain text editors without escaping commas.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-900 block">
                    Comma-separated inside double quotes
                  </span>
                  <code className="block bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-900">
                    &quot;attendee, reviewer&quot;
                  </code>
                  <p className="text-[11px] text-slate-600">
                    Excel and Google Sheets wrap comma lists in quotes automatically during CSV export.
                  </p>
                </div>
              </div>

              <div className="pt-1 space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  Recognized Portal Roles (General member access is automatic for all signed-in users; whitelist roles stay strictly separate from Mailing List Cohort Tags):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ADMIN_ASSIGNABLE_ROLES.map((role) => (
                    <span
                      key={role}
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${ROLE_DISPLAY_META[role].badgeClass}`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Column Reference & Append / Overwrite Safety */}
            <section className="space-y-2.5 pt-4 border-t border-slate-100">
              <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={17} className="text-primary shrink-0" />
                4. Recognized Columns &amp; Append / Overwrite Behavior
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      <th className="py-2 px-3">Column Header</th>
                      <th className="py-2 px-3">Accepted Aliases</th>
                      <th className="py-2 px-3">Required</th>
                      <th className="py-2 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {COLUMN_GUIDE.map((item) => (
                      <tr key={item.column} className="align-top">
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {item.column}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{item.aliases}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                              item.requirement === "Required"
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.requirement}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Append mode</strong> adds new email/name/institution entries and grants imported roles while keeping existing role holders untouched.{" "}
                <strong>Overwrite mode</strong> strips only the selected target role(s) from anyone omitted in the CSV while keeping their email, profile details, and unrelated roles intact.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-[#F3F6FA] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

