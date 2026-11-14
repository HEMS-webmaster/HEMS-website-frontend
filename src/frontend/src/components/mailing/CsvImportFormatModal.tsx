"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Tags,
  Table2,
  ShieldCheck,
} from "lucide-react";

interface CsvImportFormatModalProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLE_HEADING_ROW =
  "Email Address,First Name,Last Name,Affiliation,Sublists,Status,Date Added";

const EXAMPLE_CSV_PREVIEW = `${EXAMPLE_HEADING_ROW}
jane.doe@usf.edu,Jane,Doe,"Dept. of Chemistry, USF",2025 Attendees; 2025 Presenters,active,2025-09-18
john.smith@nasa.gov,John,Smith,NASA Goddard,"2025 Attendees, Board Members",active,2025-09-18
retired@old-lab.edu,Alex,Rivera,Former Lab,,unsubscribed,2024-05-10`;

const COLUMN_GUIDE: ReadonlyArray<{
  column: string;
  aliases: string;
  requirement: string;
  notes: string;
}> = [
  {
    column: "Email Address",
    aliases: "Email",
    requirement: "Required",
    notes: "Primary unique identifier (trimmed and lowercased automatically).",
  },
  {
    column: "First Name",
    aliases: "fname, first_name",
    requirement: "Optional",
    notes: "Preserves existing value if blank during re-import.",
  },
  {
    column: "Last Name",
    aliases: "lname, last_name",
    requirement: "Optional",
    notes: "Preserves existing value if blank during re-import.",
  },
  {
    column: "Affiliation",
    aliases: "Organization, Company, Institution, Institute, University",
    requirement: "Optional",
    notes:
      'Wrap in double quotes if the institution contains a comma (e.g. "Dept. of Chemistry, USF").',
  },
  {
    column: "Sublists",
    aliases: "Sublist, Tags, Groups, Interests",
    requirement: "Optional",
    notes:
      'Use semicolons (Tag A; Tag B) or quoted commas ("Tag A, Tag B") for multiple tags.',
  },
  {
    column: "Status",
    aliases: "Member Status, unsub_time, clean_time, unsub_reason",
    requirement: "Optional",
    notes:
      "active (default), unsubscribed, bounced / cleaned, or complained.",
  },
  {
    column: "Date Added",
    aliases: "Added At, Created At, created_at, optin_time, confirm_time, timestamp",
    requirement: "Optional",
    notes: "ISO date (YYYY-MM-DD) or standard spreadsheet timestamp.",
  },
];

export default function CsvImportFormatModal({
  open,
  onClose,
}: CsvImportFormatModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!open || typeof document === "undefined") return null;

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
        await navigator.clipboard.writeText(EXAMPLE_HEADING_ROW);
        markCopied();
        return;
      }
    } catch {
      // Fall through to legacy textarea selection copy
    }

    try {
      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = EXAMPLE_HEADING_ROW;
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
      aria-labelledby="csv-format-dialog-title"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-0.5">
                Subscriber Roster Upload Specification
              </span>
              <h2
                id="csv-format-dialog-title"
                className="font-serif text-xl sm:text-2xl font-semibold text-slate-900"
              >
                CSV Format, Delimitation &amp; Multi-Tag Guide
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close CSV format guide"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{ maxHeight: "70vh" }}
            className="block overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white"
          >
          {/* Example Heading Row & Copy Action */}
          <section className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet size={17} className="text-primary shrink-0" />
                  1. Example CSV Heading Row
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Paste this exact header row into row 1 of a spreadsheet or UTF-8{" "}
                  <code className="bg-white px-1 py-0.5 rounded border border-slate-200">
                    .csv
                  </code>{" "}
                  file.
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

            <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 font-mono text-[11px] sm:text-xs text-slate-900 select-all overflow-x-auto whitespace-nowrap">
              {EXAMPLE_HEADING_ROW}
            </div>

            {copyFailed && (
              <p className="text-[11px] text-amber-800 font-medium">
                Clipboard access was blocked by the browser. Select the header
                text above and press Ctrl+C / Cmd+C to copy.
              </p>
            )}

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Multi-Row Example (.csv)
              </span>
              <pre className="bg-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto">
                {EXAMPLE_CSV_PREVIEW}
              </pre>
            </div>
          </section>

          {/* Column Delimitation Rules */}
          <section className="space-y-2 pt-1">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Table2 size={17} className="text-primary shrink-0" />
              2. How Columns Are Delimited
            </h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Comma-delimited columns (<code>,</code>):</strong> Save
                your spreadsheet as standard UTF-8 Comma-Separated Values (
                <code className="text-xs bg-slate-100 px-1 rounded">.csv</code>
                ) with one subscriber per row and column headers in row 1.
              </li>
              <li>
                <strong>Only Email is required; column order is flexible:</strong>{" "}
                Rows must include{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  Email Address
                </code>{" "}
                (or <code className="text-xs bg-slate-100 px-1 rounded">Email</code>
                ). All other columns are optional and can be arranged in any
                order.
              </li>
              <li>
                <strong>Cells containing literal commas:</strong> Wrap any cell
                value that includes a comma (such as{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  &quot;Dept. of Chemistry, USF&quot;
                </code>
                ) in double quotes (<code className="text-xs bg-slate-100 px-1 rounded">&quot;...&quot;</code>)
                so it is not split across columns. Excel and Google Sheets add
                these quotes automatically on CSV export; double quotes inside
                a quoted value are escaped as{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">&quot;&quot;</code>.
              </li>
            </ul>
          </section>

          {/* Multiple Tags Formatting */}
          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Tags size={17} className="text-primary shrink-0" />
              3. How Cells With Multiple Tags Are Formatted
            </h3>
            <p>
              To assign more than one sublist or topic inside a single{" "}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                Sublists
              </code>{" "}
              (or <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">Tags</code>)
              cell, use either format below:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-xs font-semibold text-emerald-900 block">
                  Semicolon-separated (Recommended)
                </span>
                <code className="block bg-white border border-emerald-200 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-900">
                  2025 Attendees; 2025 Presenters
                </code>
                <p className="text-[11px] text-emerald-800">
                  Safe in both spreadsheets and plain text editors because
                  semicolons never split CSV columns.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-900 block">
                  Comma-separated inside double quotes
                </span>
                <code className="block bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-900">
                  &quot;2025 Attendees, Board Members&quot;
                </code>
                <p className="text-[11px] text-slate-600">
                  Must be wrapped in <code className="bg-white px-1 rounded">&quot;...&quot;</code>{" "}
                  in raw CSV files (Excel/Sheets quotes commas automatically
                  when exported).
                </p>
              </div>
            </div>
            <ul className="space-y-1.5 list-disc pl-5 pt-1 text-xs text-slate-600">
              <li>
                <strong>Auto-catalog &amp; non-destructive merging:</strong>{" "}
                Custom tag names populate <strong>Sublists</strong> and are
                merged onto existing records without removing earlier tags.
                Built-in topic tokens (
                <code className="bg-slate-100 px-1 rounded">workshop</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">student_awards</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">sponsorship</code>)
                map to topic interests.
              </li>
              <li>
                <strong>Optional batch tag input:</strong> Entering a tag in{" "}
                <em>Tag uploaded rows (optional)</em> applies that sublist tag
                to every row in the file even if the CSV has no{" "}
                <code className="bg-slate-100 px-1 rounded">Sublists</code>{" "}
                column.
              </li>
            </ul>
          </section>

          {/* Column Reference & Suppression Guard */}
          <section className="space-y-2.5 pt-4 border-t border-slate-100">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={17} className="text-primary shrink-0" />
              4. Recognized Columns &amp; Suppression Safety
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
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
                      <td className="py-2 px-3 text-slate-500">
                        {item.aliases}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                            item.requirement === "Required"
                              ? "bg-primary/10 text-primary"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.requirement}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Permanent Opt-Out &amp; Bounce Protection:</strong> When
              re-uploading an email already marked <em>Unsubscribed</em>,{" "}
              <em>Hard Bounced</em>, or <em>Complained</em> with status{" "}
              <code className="bg-slate-100 px-1 rounded">active</code>, its
              suppressed delivery status stays locked while new cohort sublist
              tags are still merged safely.
            </p>
          </section>
        </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

