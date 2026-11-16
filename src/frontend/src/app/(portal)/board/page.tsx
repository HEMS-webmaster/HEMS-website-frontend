"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  BarChart2,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Landmark,
  Lock,
  Megaphone,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBoardRepository } from "@/hooks/useBoardRepository";
import {
  BOARD_CYCLE_PRESETS,
  BOARD_DOCUMENT_CATEGORIES,
  BoardDocumentCategory,
  BoardDocumentRecord,
  BoardDocumentStatus,
  MAX_BOARD_NOTES_LENGTH,
  formatFileSize,
  validateBoardUploadFile,
} from "@/types/boardRepository";
import {
  hasBoardRole,
  hasOperationsRole,
  hasTreasurerRole,
} from "@/utils/telemetryClient";

type SortMode = "date_desc" | "updated_desc" | "title_asc" | "size_desc";

function suggestTitleFromFile(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  return withoutExt.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export default function BoardPage() {
  const { user, loading: authLoading } = useAuth();
  const canViewOperations = Boolean(user && hasOperationsRole(user.roles));
  const canViewTreasurer = Boolean(user && hasTreasurerRole(user.roles));

  const {
    activeDocuments,
    archivedDocuments,
    totalBytesUsed,
    loading: repoLoading,
    uploading,
    uploadProgress,
    error: repoError,
    clearError,
    refresh,
    uploadDocument,
    archiveDocument,
    restoreDocument,
    deleteDocument,
    downloadDocument,
  } = useBoardRepository();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Repository view state
  const [viewStatus, setViewStatus] = useState<BoardDocumentStatus>("active");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("date_desc");

  // Upload drawer state
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>("");
  const [docCategory, setDocCategory] = useState<BoardDocumentCategory>("Minutes");
  const [docDate, setDocDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [docCycle, setDocCycle] = useState<string>(BOARD_CYCLE_PRESETS[1]);
  const [docNotes, setDocNotes] = useState<string>("");

  // Per-row action state
  const [archivingDocId, setArchivingDocId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const visibleDocuments = useMemo(() => {
    const source = viewStatus === "active" ? activeDocuments : archivedDocuments;
    const queryLower = searchTerm.trim().toLowerCase();

    const filtered = source.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (!queryLower) return true;
      const haystack = [
        item.title,
        item.fileName,
        item.category,
        item.cycleTag,
        item.notes || "",
        item.uploadedByEmail,
        item.archiveReason || "",
        item.archivedByEmail || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(queryLower);
    });

    return [...filtered].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      if (sortMode === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortMode === "size_desc") {
        return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
      }
      if (sortMode === "updated_desc") {
        return (b.updatedAt || "").localeCompare(a.updatedAt || "");
      }
      return (b.documentDate || "").localeCompare(a.documentDate || "");
    });
  }, [activeDocuments, archivedDocuments, viewStatus, searchTerm, categoryFilter, sortMode]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 mt-4">Verifying credentials...</p>
      </div>
    );
  }

  // Strict Board Access Control check
  if (!user || !hasBoardRole(user.roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be logged in as an authenticated{" "}
          <strong className="text-foreground">HEMS Board Member</strong> to view this panel.
        </p>
        <Link
          href="/auth"
          className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const applyPickedFile = (candidate: File | null | undefined) => {
    clearError();
    setStatusNotice(null);

    if (!candidate) {
      setSelectedFile(null);
      setFileError(null);
      setFileWarning(null);
      return;
    }

    const result = validateBoardUploadFile(candidate);
    if (!result.valid) {
      setSelectedFile(null);
      setFileError(result.error || "Selected file does not meet repository requirements.");
      setFileWarning(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(candidate);
    setFileError(null);
    setFileWarning(result.warning || null);
    if (!docTitle.trim()) {
      setDocTitle(suggestTitleFromFile(candidate.name));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusNotice(null);
    setFileError(null);
    clearError();

    const validation = validateBoardUploadFile(selectedFile);
    if (!validation.valid || !selectedFile) {
      setFileError(validation.error || "Please choose a valid file (max 10 MB).");
      return;
    }

    if (!docTitle.trim()) {
      setFileError("Please enter a Document Title before uploading.");
      return;
    }

    try {
      const created = await uploadDocument({
        title: docTitle,
        category: docCategory,
        documentDate: docDate,
        cycleTag: docCycle,
        notes: docNotes,
        file: selectedFile,
      });

      setSelectedFile(null);
      setFileWarning(null);
      setDocTitle("");
      setDocNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadOpen(false);
      setViewStatus("active");
      setStatusNotice(
        `Uploaded "${created.title}" (${formatFileSize(created.fileSizeBytes)}) to Active Board Documents.`
      );
    } catch {
      // Hook state exposes exact error message
    }
  };

  const handleConfirmArchive = async (record: BoardDocumentRecord) => {
    setBusyDocId(record.id);
    setStatusNotice(null);
    clearError();
    try {
      await archiveDocument(record.id, archiveReason);
      setArchivingDocId(null);
      setArchiveReason("");
      setStatusNotice(
        `Moved "${record.title}" to Archived / Outdated. You can still download or restore it anytime.`
      );
    } finally {
      setBusyDocId(null);
    }
  };

  const handleRestore = async (record: BoardDocumentRecord) => {
    setBusyDocId(record.id);
    setStatusNotice(null);
    clearError();
    try {
      await restoreDocument(record.id);
      setStatusNotice(`Restored "${record.title}" to Active Board Documents.`);
    } finally {
      setBusyDocId(null);
    }
  };

  const handleConfirmDelete = async (record: BoardDocumentRecord) => {
    setBusyDocId(record.id);
    setStatusNotice(null);
    clearError();
    try {
      await deleteDocument(record.id);
      setDeletingDocId(null);
      setStatusNotice(`Permanently removed "${record.title}" from the Board Repository.`);
    } finally {
      setBusyDocId(null);
    }
  };

  const handleDownload = async (record: BoardDocumentRecord) => {
    setBusyDocId(record.id);
    clearError();
    try {
      await downloadDocument(record);
    } finally {
      setBusyDocId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <Building2 className="text-primary shrink-0" /> Board Member Panel
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Upload governance files, manage workshop budgets, and archive outdated materials.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold text-primary self-start md:self-center break-all">
          Board Member: {user.email}
        </div>
      </div>

      {/* Quick Officer Tools Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {canViewOperations && (
          <>
            <Link
              href="/operations/registrations"
              className="bg-white border border-slate-200/90 hover:border-primary/50 rounded-xl p-4 shadow-2xs transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <CreditCard size={15} /> Registrations Console
              </div>
              <p className="text-[11px] text-slate-500">Check-ins, transfers, badges &amp; roster</p>
            </Link>
            <Link
              href="/operations/mailing-list"
              className="bg-white border border-slate-200/90 hover:border-primary/50 rounded-xl p-4 shadow-2xs transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <Users size={15} /> Mailing List
              </div>
              <p className="text-[11px] text-slate-500">Subscribers &amp; cohort sublists</p>
            </Link>
            <Link
              href="/operations/announcements"
              className="bg-white border border-slate-200/90 hover:border-primary/50 rounded-xl p-4 shadow-2xs transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <Send size={15} /> Announcements
              </div>
              <p className="text-[11px] text-slate-500">Postmark society broadcasts</p>
            </Link>
            <Link
              href="/operations/marketing-playbook"
              className="bg-white border border-slate-200/90 hover:border-primary/50 rounded-xl p-4 shadow-2xs transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <Megaphone size={15} /> Marketing Playbook
              </div>
              <p className="text-[11px] text-slate-500">Ad Grants, LinkedIn bursts &amp; UTM kit</p>
            </Link>
          </>
        )}
        {canViewTreasurer && (
          <Link
            href="/treasurer"
            className="bg-white border border-slate-200/90 hover:border-primary/50 rounded-xl p-4 shadow-2xs transition-colors space-y-1"
          >
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
              <Landmark size={15} /> Treasurer &amp; Stripe
            </div>
            <p className="text-[11px] text-slate-500">Revenue, refunds, promos &amp; payouts</p>
          </Link>
        )}
        <Link
          href="/admin/analytics"
          className="bg-white border border-slate-200/90 hover:border-primary/50 rounded-xl p-4 shadow-2xs transition-colors space-y-1"
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <BarChart2 size={15} /> Analytics
          </div>
          <p className="text-[11px] text-slate-500">Traffic, email attribution &amp; PDFs</p>
        </Link>
      </div>

      {/* Secure Board Repository */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 md:p-8 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Lock className="text-primary shrink-0" size={20} />
              <h3 className="font-serif font-semibold text-xl text-slate-900">
                Secure Board Repository
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>{activeDocuments.length} Active</span>
              <span>&bull;</span>
              <span>{archivedDocuments.length} Archived</span>
              <span>&bull;</span>
              <span>Used: {formatFileSize(totalBytesUsed)}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 border border-sky-200 text-sky-900">
                Max 10 MB / file
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={repoLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={repoLoading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadOpen((prev) => !prev);
                setFileError(null);
                clearError();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              {uploadOpen ? <X size={14} /> : <Plus size={14} />}
              <span>{uploadOpen ? "Close Upload" : "Upload Material"}</span>
            </button>
          </div>
        </div>

        {/* Status & Error Banners */}
        {statusNotice && (
          <div className="flex items-start justify-between gap-3 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 text-xs sm:text-[13px] text-teal-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <span>{statusNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-teal-700 hover:text-teal-950 shrink-0 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {repoError && (
          <div className="flex items-start justify-between gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs sm:text-[13px] text-rose-900">
            <div className="flex items-start gap-2">
              <ShieldAlert size={16} className="text-rose-700 shrink-0 mt-0.5" />
              <span>{repoError}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-rose-700 hover:text-rose-950 shrink-0 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Collapsible Upload Drawer */}
        {uploadOpen && (
          <form
            onSubmit={handleUploadSubmit}
            className="bg-slate-50/85 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-sans text-sm font-bold text-slate-900">
                  Upload New Board Material
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  PDF, Word, Excel/CSV, PowerPoint, text/Markdown, images, or ZIP archives (up to 10 MB). Executables and scripts are blocked.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-field-label bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                Board-Only Storage
              </span>
            </div>

            {/* Drag-and-Drop Zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !uploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!uploading) setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (!uploading) {
                  applyPickedFile(e.dataTransfer.files?.[0]);
                }
              }}
              className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer ${
                dragActive
                  ? "border-primary bg-sky-50"
                  : selectedFile
                    ? "border-teal-400 bg-teal-50/50"
                    : "border-slate-300 bg-white hover:border-primary/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                disabled={uploading}
                onChange={(e) => applyPickedFile(e.target.files?.[0])}
                className="hidden"
                aria-label="Choose board document file"
              />
              <UploadCloud
                size={28}
                className={`mx-auto mb-2 ${
                  selectedFile ? "text-teal-700" : "text-primary/80"
                }`}
              />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 break-all">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Size: {formatFileSize(selectedFile.size)} &bull; Click or drop another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Click to choose a file or drag and drop here
                  </p>
                  <p className="text-xs text-slate-500">
                    Enforced limit: 10 MB per file (5 MB recommended for quick volunteer downloads)
                  </p>
                </div>
              )}
            </div>

            {fileError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-900 font-medium">
                {fileError}
              </div>
            )}

            {fileWarning && !fileError && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 font-medium">
                {fileWarning}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="hems-label" htmlFor="board-doc-title">
                  Document Title <span className="text-rose-600">*</span>
                </label>
                <input
                  id="board-doc-title"
                  type="text"
                  required
                  maxLength={240}
                  disabled={uploading}
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. HEMS Board Meeting Minutes - November 2026"
                  className="hems-control w-full text-base sm:text-sm"
                />
              </div>

              <div>
                <label className="hems-label" htmlFor="board-doc-category">
                  Category
                </label>
                <select
                  id="board-doc-category"
                  disabled={uploading}
                  value={docCategory}
                  onChange={(e) =>
                    setDocCategory(e.target.value as BoardDocumentCategory)
                  }
                  className="hems-control w-full text-base sm:text-sm"
                >
                  {BOARD_DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="hems-label" htmlFor="board-doc-date">
                  Document Date
                </label>
                <input
                  id="board-doc-date"
                  type="date"
                  disabled={uploading}
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="hems-control w-full text-base sm:text-sm"
                />
              </div>

              <div>
                <label className="hems-label" htmlFor="board-doc-cycle">
                  Cycle / Fiscal Year Tag
                </label>
                <select
                  id="board-doc-cycle"
                  disabled={uploading}
                  value={docCycle}
                  onChange={(e) => setDocCycle(e.target.value)}
                  className="hems-control w-full text-base sm:text-sm"
                >
                  {BOARD_CYCLE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="hems-label" htmlFor="board-doc-notes">
                  Version / Summary Note{" "}
                  <span className="hems-label-hint">(Optional, max 240 chars)</span>
                </label>
                <input
                  id="board-doc-notes"
                  type="text"
                  maxLength={MAX_BOARD_NOTES_LENGTH}
                  disabled={uploading}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Approved v2 with revised hotel attrition clause"
                  className="hems-control w-full text-base sm:text-sm"
                />
              </div>
            </div>

            {uploading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-field-label tabular-nums">
                  <span>Encrypting &amp; saving Board document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setUploadOpen(false);
                  setFileError(null);
                  setFileWarning(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <UploadCloud size={14} />
                <span>{uploading ? "Uploading..." : "Save to Repository"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Status Tabs + Search / Filter / Sort Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => {
                setViewStatus("active");
                setArchivingDocId(null);
                setDeletingDocId(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewStatus === "active"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active Documents ({activeDocuments.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setViewStatus("archived");
                setArchivingDocId(null);
                setDeletingDocId(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewStatus === "archived"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Archived / Outdated ({archivedDocuments.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl">
            <div className="relative flex-1 min-w-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, filename, uploader, or reason..."
                aria-label="Search Board repository documents"
                className="hems-control w-full pl-8 pr-3 py-1.5 text-base sm:text-xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="hems-control py-1.5 text-base sm:text-xs"
            >
              <option value="all">All Categories</option>
              {BOARD_DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sort Board repository documents"
              className="hems-control py-1.5 text-base sm:text-xs"
            >
              <option value="date_desc">Sort: Document Date</option>
              <option value="updated_desc">Sort: Recently Updated</option>
              <option value="title_asc">Sort: Title A–Z</option>
              <option value="size_desc">Sort: Largest Size</option>
            </select>
          </div>
        </div>

        {/* Document List */}
        {repoLoading && visibleDocuments.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading Board Repository...
          </div>
        ) : visibleDocuments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center space-y-2">
            <FileText size={28} className="mx-auto text-slate-400" />
            <p className="text-sm font-semibold text-slate-800">
              {viewStatus === "active"
                ? "No active Board documents match your filters."
                : "No archived or outdated Board documents match your filters."}
            </p>
            <p className="text-xs text-slate-500">
              {viewStatus === "active"
                ? "Use 'Upload Material' above to add new minutes, budgets, contracts, or agendas."
                : "Use the 'Archive' button on any outdated active file to move it here for record keeping."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {visibleDocuments.map((docItem) => {
              const isArchivingThis = archivingDocId === docItem.id;
              const isDeletingThis = deletingDocId === docItem.id;
              const isRowBusy = busyDocId === docItem.id;

              return (
                <div
                  key={docItem.id}
                  className={`border rounded-xl p-4 transition-colors space-y-3 ${
                    docItem.isPinned
                      ? "bg-sky-50/50 border-primary/35"
                      : docItem.status === "archived"
                        ? "bg-slate-50/75 border-slate-200"
                        : "bg-white border-slate-200/90 hover:border-primary/45"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {docItem.isPinned && docItem.staticAssetUrl ? (
                        <div className="w-16 h-11 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
                          <img
                            src={docItem.staticAssetUrl}
                            alt="Full-resolution HEMS Society emblem preview"
                            className="max-w-full max-h-full object-contain mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div
                          className={`p-2.5 rounded-lg shrink-0 ${
                            docItem.status === "archived"
                              ? "bg-amber-100/80 text-amber-800"
                              : "bg-sky-50 text-primary"
                          }`}
                        >
                          <FileText size={20} />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">
                            {docItem.title}
                          </h4>
                          {docItem.isPinned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 border border-sky-300 text-sky-900">
                              <Pin size={10} /> Pinned Master
                            </span>
                          )}
                          {docItem.isSampleSeed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-600">
                              Sample
                            </span>
                          )}
                          {docItem.status === "archived" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-800">
                              Archived / Outdated
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {docItem.documentDate}
                          </span>
                          <span>Size: {formatFileSize(docItem.fileSizeBytes)}</span>
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10.5px] font-semibold text-slate-700">
                            {docItem.category}
                          </span>
                          <span className="bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[10.5px] font-semibold text-sky-900">
                            {docItem.cycleTag}
                          </span>
                          <span className="truncate max-w-[240px]" title={docItem.fileName}>
                            File: {docItem.fileName}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-slate-500">
                          Uploaded by{" "}
                          <span className="font-medium text-slate-700">
                            {docItem.uploadedByEmail}
                          </span>
                          {docItem.notes ? ` — ${docItem.notes}` : ""}
                        </p>

                        {docItem.status === "archived" && docItem.archivedAt && (
                          <p className="text-[11.5px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 inline-block">
                            Archived {docItem.archivedAt.slice(0, 10)}
                            {docItem.archivedByEmail
                              ? ` by ${docItem.archivedByEmail}`
                              : ""}
                            {docItem.archiveReason
                              ? ` — Reason: ${docItem.archiveReason}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Row Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                      {docItem.isPinned && docItem.staticAssetUrl && (
                        <a
                          href={docItem.staticAssetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-primary hover:text-primary text-xs font-semibold transition-colors"
                        >
                          <ExternalLink size={14} />
                          <span>View Full-Res</span>
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={isRowBusy}
                        onClick={() => void handleDownload(docItem)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Download size={14} />
                        <span>{docItem.isPinned ? "Download Master" : "Download"}</span>
                      </button>

                      {docItem.status !== "archived" ? (
                        !docItem.isPinned && (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => {
                              setArchivingDocId(isArchivingThis ? null : docItem.id);
                              setArchiveReason("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Archive size={14} />
                            <span>Archive</span>
                          </button>
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => void handleRestore(docItem)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <ArchiveRestore size={14} />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() =>
                              setDeletingDocId(isDeletingThis ? null : docItem.id)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Archive Reason Confirmation Tray */}
                  {isArchivingThis && (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
                      <input
                        type="text"
                        maxLength={MAX_BOARD_NOTES_LENGTH}
                        value={archiveReason}
                        onChange={(e) => setArchiveReason(e.target.value)}
                        placeholder="Optional archival reason (e.g. Outdated — superseded by revised FY2027 budget)"
                        aria-label="Archival reason"
                        className="hems-control flex-1 text-base sm:text-xs"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => void handleConfirmArchive(docItem)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {isRowBusy ? "Archiving..." : "Confirm Archive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setArchivingDocId(null);
                            setArchiveReason("");
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline 2-Step Permanent Delete Tray */}
                  {isDeletingThis && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-900">
                      <span className="font-medium">
                        Permanently delete &ldquo;{docItem.title}&rdquo;? This cannot be undone.
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => void handleConfirmDelete(docItem)}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white hover:bg-rose-800 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {isRowBusy ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDocId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
