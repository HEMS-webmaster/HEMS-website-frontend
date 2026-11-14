"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  Download,
  FileText,
  Mail,
  Tags,
  Users,
  X,
} from "lucide-react";
import type { MailingSubscriber } from "@/types/mailing";
import { normalizeSublistTag } from "@/utils/mailingTemplate";
import {
  buildExportFilename,
  filterSubscribersForExport,
  formatSubscribersExport,
  getExportFormatMeta,
  MAILING_EXPORT_FORMATS,
  type CohortMatchMode,
  type MailingExportFormatId,
  type MailingExportStatusScope,
} from "@/utils/mailingExport";

interface MailingExportModalProps {
  open: boolean;
  onClose: () => void;
  subscribers: MailingSubscriber[];
  availableSublists: string[];
  initialCohortSegment: string;
}

const STATUS_SCOPE_OPTIONS: ReadonlyArray<{
  id: MailingExportStatusScope;
  label: string;
  helper: string;
}> = [
  {
    id: "active_only",
    label: "Active Subscribed Only",
    helper: "Default safe outreach list",
  },
  {
    id: "all_statuses",
    label: "All Statuses",
    helper: "Active, pending, unsubscribed, bounced",
  },
  {
    id: "suppressed_only",
    label: "Suppressed Only",
    helper: "Unsubscribed, bounced, or complained",
  },
];

function renderFormatIcon(formatId: MailingExportFormatId) {
  switch (formatId) {
    case "full_csv":
      return <FileText size={15} />;
    case "sheets_tsv":
      return <Users size={15} />;
    case "email_bcc":
      return <Mail size={15} />;
    case "emails_only":
      return <Tags size={15} />;
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

export default function MailingExportModal({
  open,
  onClose,
  subscribers,
  availableSublists,
  initialCohortSegment,
}: MailingExportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectAllCohorts, setSelectAllCohorts] = useState(true);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<CohortMatchMode>("any");
  const [statusScope, setStatusScope] =
    useState<MailingExportStatusScope>("active_only");
  const [format, setFormat] = useState<MailingExportFormatId>("full_csv");
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

    if (!justOpened) {
      return;
    }

    setStatusScope("active_only");
    setMatchMode("any");
    setFormat("full_csv");
    setIncludeHeader(true);
    setCopied(false);
    setCopyError(null);

    if (initialCohortSegment.startsWith("sublist:")) {
      const targetTag = normalizeSublistTag(
        initialCohortSegment.slice("sublist:".length)
      );
      if (targetTag) {
        const canonical =
          availableSublists.find(
            (item) =>
              normalizeSublistTag(item).toLowerCase() ===
              targetTag.toLowerCase()
          ) ?? targetTag;
        setSelectAllCohorts(false);
        setSelectedCohorts([canonical]);
        return;
      }
    }

    setSelectAllCohorts(true);
    setSelectedCohorts([]);
  }, [open, initialCohortSegment, availableSublists]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const allStatusScopedSubscribers = useMemo(
    () =>
      filterSubscribersForExport(subscribers, {
        statusScope,
        selectAllCohorts: true,
        selectedCohorts: [],
        matchMode: "any",
      }),
    [subscribers, statusScope]
  );

  const cohortCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tag of availableSublists) {
      const normalized = normalizeSublistTag(tag).toLowerCase();
      if (!normalized) {
        continue;
      }
      const count = allStatusScopedSubscribers.filter((sub) =>
        sub.sublists.some(
          (entry) => normalizeSublistTag(entry).toLowerCase() === normalized
        )
      ).length;
      counts.set(tag, count);
    }
    return counts;
  }, [availableSublists, allStatusScopedSubscribers]);

  const matchedSubscribers = useMemo(
    () =>
      filterSubscribersForExport(subscribers, {
        statusScope,
        selectAllCohorts,
        selectedCohorts,
        matchMode,
      }),
    [subscribers, statusScope, selectAllCohorts, selectedCohorts, matchMode]
  );

  const formatMeta = useMemo(() => getExportFormatMeta(format), [format]);

  const formattedOutput = useMemo(
    () =>
      formatSubscribersExport(matchedSubscribers, {
        format,
        includeHeader,
      }),
    [matchedSubscribers, format, includeHeader]
  );

  const exportFilename = useMemo(
    () =>
      buildExportFilename({
        format,
        statusScope,
        selectAllCohorts,
        selectedCohorts,
      }),
    [format, statusScope, selectAllCohorts, selectedCohorts]
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

    return {
      snippet,
      truncated,
      extraInfo,
    };
  }, [formattedOutput]);

  const isTagSelected = (tag: string): boolean => {
    const target = normalizeSublistTag(tag).toLowerCase();
    return selectedCohorts.some(
      (item) => normalizeSublistTag(item).toLowerCase() === target
    );
  };

  const handleToggleAllSubscribers = () => {
    setSelectAllCohorts(true);
    setSelectedCohorts([]);
    setCopied(false);
    setCopyError(null);
  };

  const handleSelectAllTags = () => {
    setSelectAllCohorts(false);
    setSelectedCohorts([...availableSublists]);
    setCopied(false);
    setCopyError(null);
  };

  const handleClearTags = () => {
    setSelectAllCohorts(false);
    setSelectedCohorts([]);
    setCopied(false);
    setCopyError(null);
  };

  const handleToggleCohortTag = (tag: string) => {
    setCopied(false);
    setCopyError(null);

    if (selectAllCohorts) {
      setSelectAllCohorts(false);
      setSelectedCohorts([tag]);
      return;
    }

    const normalized = normalizeSublistTag(tag).toLowerCase();
    if (isTagSelected(tag)) {
      setSelectedCohorts((prev) =>
        prev.filter(
          (item) => normalizeSublistTag(item).toLowerCase() !== normalized
        )
      );
    } else {
      setSelectedCohorts((prev) => [...prev, tag]);
    }
  };

  const handleCopyToClipboard = async () => {
    if (matchedSubscribers.length === 0 || !formattedOutput) {
      return;
    }

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
    } catch (clipboardError) {
      try {
        succeeded = copyTextWithFallbackElement(formattedOutput);
      } catch (fallbackError) {
        console.error(
          "Mailing export clipboard copy failed:",
          clipboardError,
          fallbackError
        );
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
    if (matchedSubscribers.length === 0 || !formattedOutput) {
      return;
    }

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
    } catch (downloadError) {
      console.error("Mailing export file download failed:", downloadError);
      setCopyError("Could not trigger browser download for this export.");
    }
  };

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mailing-export-modal-title"
      onClick={onClose}
    >
      <div
        className="mx-auto my-2 sm:my-6 w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div>
              <h2
                id="mailing-export-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900"
              >
                Export Mailing List
              </h2>
              <p className="text-[11px] text-slate-500">
                Select all subscribers or specific cohort tags, pick an export
                format, and download or copy to clipboard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{ maxHeight: "72vh" }}
          className="p-5 sm:p-6 space-y-5 overflow-y-auto text-sm text-slate-700"
        >
          {/* Section 1: Audience & Cohort Selection */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Audience &amp; Cohort Tags
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {availableSublists.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllTags}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Select All Tags ({availableSublists.length})
                  </button>
                )}
                {!selectAllCohorts && selectedCohorts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearTags}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleToggleAllSubscribers}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  selectAllCohorts
                    ? "bg-primary text-white border-primary shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-primary/40"
                }`}
              >
                <Users size={13} />
                All Subscribers
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectAllCohorts
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {allStatusScopedSubscribers.length}
                </span>
              </button>

              {availableSublists.map((tag) => {
                const active = !selectAllCohorts && isTagSelected(tag);
                const count = cohortCounts.get(tag) ?? 0;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleCohortTag(tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white border-slate-200 text-slate-700 hover:border-primary/40"
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
                    <span>{tag}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {!selectAllCohorts && selectedCohorts.length >= 2 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <span className="text-[11px] font-semibold text-slate-600">
                  Multi-tag filter:
                </span>
                <button
                  type="button"
                  onClick={() => setMatchMode("any")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    matchMode === "any"
                      ? "bg-primary text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Match ANY selected tag (Union)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    matchMode === "all"
                      ? "bg-primary text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Match ALL selected tags (Intersection)
                </button>
              </div>
            )}

            {/* Status Scope */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">
                Status Scope:
              </span>
              {STATUS_SCOPE_OPTIONS.map((option) => {
                const selected = statusScope === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setStatusScope(option.id);
                      setCopied(false);
                    }}
                    title={option.helper}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                      selected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Export Format */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Export Format
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {MAILING_EXPORT_FORMATS.map((item) => {
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
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                        <span
                          className={
                            selected ? "text-primary" : "text-slate-500"
                          }
                        >
                          {renderFormatIcon(item.id)}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wide ${
                          selected
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600"
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
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => {
                    setIncludeHeader(e.target.checked);
                    setCopied(false);
                  }}
                  className="rounded-xs border-slate-300 text-primary focus:ring-primary"
                />
                Include column header row in exported output
              </label>
            )}
          </div>

          {/* Section 3: Live Output Preview */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Live Output Preview
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-800">
                  {matchedSubscribers.length}{" "}
                  {matchedSubscribers.length === 1
                    ? "subscriber"
                    : "subscribers"}
                </span>
                <span>&middot;</span>
                <span>{formattedOutput.length.toLocaleString()} chars</span>
                <span>&middot;</span>
                <code className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-mono text-[10px]">
                  {exportFilename}
                </code>
              </div>
            </div>

            {matchedSubscribers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-800">
                No subscribers match the current cohort and status filter.
                Select <strong>All Subscribers</strong> or one or more cohort
                tags with matching records to export.
              </div>
            ) : (
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <pre className="p-3.5 text-[11px] leading-relaxed font-mono text-slate-100 overflow-x-auto whitespace-pre">
                  {previewSummary.snippet}
                </pre>
                {previewSummary.truncated && (
                  <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                    {previewSummary.extraInfo} &mdash; Copy or Download includes
                    all {matchedSubscribers.length} matched records.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            {copied && (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <Check size={14} /> Copied {matchedSubscribers.length}{" "}
                {matchedSubscribers.length === 1 ? "subscriber" : "subscribers"}{" "}
                to clipboard!
              </span>
            )}
            {copyError && (
              <span className="text-red-600 font-medium">{copyError}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={matchedSubscribers.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={matchedSubscribers.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-45 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            >
              <Download size={14} />
              Download .{formatMeta.extension}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
