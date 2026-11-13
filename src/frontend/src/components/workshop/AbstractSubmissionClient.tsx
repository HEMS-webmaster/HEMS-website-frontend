"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
  Calendar,
  ExternalLink,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  ArrowRight,
  ClipboardCheck,
  Plus,
  Building2,
  UserPlus,
  Image as ImageIcon,
  FileUp,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import {
  ABSTRACT_MAX_CHARS,
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
  GraphicMetadata,
  MIN_GRAPHIC_DPI,
  PRESENTATION_FORMAT_OPTIONS,
  PresentationFormat,
  RESEARCH_TRACK_OPTIONS,
  ResearchTrack,
  SYNOPSIS_MAX_CHARS,
} from "@/types/abstractSubmission";
import {
  hasAttendeeRole,
  hasReviewerRole,
} from "@/utils/telemetryClient";
import { applyWordPasteToField } from "@/utils/wordPasteNormalizer";
import { validateImageDpi } from "@/utils/imageDpiValidator";
import AbstractOnePagePreview from "@/components/workshop/AbstractOnePagePreview";
import ScientificText from "@/components/workshop/ScientificText";

const QUICK_MATH_TOKENS: Array<{ label: string; token: string; title: string }> = [
  { label: "m/z", token: "m/z", title: "Mass-to-charge ratio" },
  { label: "μ", token: "μ", title: "Micro (mu)" },
  { label: "Δ", token: "Δ", title: "Delta" },
  { label: "±", token: "±", title: "Plus-minus" },
  { label: "×", token: "×", title: "Multiplication" },
  { label: "°C", token: "°C", title: "Degrees Celsius" },
  { label: "≤", token: "≤", title: "Less than or equal" },
  { label: "≥", token: "≥", title: "Greater than or equal" },
  { label: "≈", token: "≈", title: "Approximately equal" },
  { label: "→", token: "→", title: "Reaction / transition arrow" },
  { label: "⇌", token: "⇌", title: "Equilibrium arrow" },
  { label: "CO₂", token: "CO₂", title: "Carbon dioxide" },
  { label: "CH₄", token: "CH₄", title: "Methane" },
  { label: "[M+H]⁺", token: "[M+H]⁺", title: "Protonated molecule" },
  { label: "10⁻⁶", token: "10⁻⁶", title: "Scientific exponent" },
  { label: "a/b", token: "$\\frac{a}{b}$", title: "Stacked fraction" },
  { label: "√x", token: "$\\sqrt{x}$", title: "Square root" },
];

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function AbstractSubmissionClient() {
  const { user, loading: authLoading, isMock, setMockRoles } = useAuth();
  const { workshop } = useUpcomingWorkshop();
  const {
    submissions,
    loading: listLoading,
    createSubmission,
    withdrawSubmission,
    getGraphicPreviewUrl,
  } = useAbstractSubmissions();

  const abstractTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abstractTxtInputRef = useRef<HTMLInputElement | null>(null);
  const graphicInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [correspondingEmail, setCorrespondingEmail] = useState("");

  const [affiliations, setAffiliations] = useState<AffiliationEntry[]>([
    { id: "aff-1", institution: "" },
  ]);
  const [authors, setAuthors] = useState<AuthorEntry[]>([
    { id: "auth-1", name: "", affiliationId: "aff-1", isPresenter: true },
  ]);

  const [presentationFormat, setPresentationFormat] =
    useState<PresentationFormat>("Oral Presentation");
  const [researchTrack, setResearchTrack] = useState<ResearchTrack>(
    "Miniature & Ruggedized Hardware / Vacuum"
  );
  const [summary, setSummary] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [studentTravelAwardApplicant, setStudentTravelAwardApplicant] =
    useState(false);

  const [graphicFile, setGraphicFile] = useState<File | null>(null);
  const [graphicMeta, setGraphicMeta] = useState<Omit<
    GraphicMetadata,
    "storageUrl" | "hasLocalBlob"
  > | null>(null);
  const [graphicPreviewUrl, setGraphicPreviewUrl] = useState<string>("");
  const [graphicCaption, setGraphicCaption] = useState("");
  const [graphicError, setGraphicError] = useState<string | null>(null);
  const [checkingGraphic, setCheckingGraphic] = useState(false);

  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] =
    useState<AbstractSubmissionRecord | null>(null);

  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);
  const [savedPreviewItem, setSavedPreviewItem] = useState<{
    sub: AbstractSubmissionRecord;
    graphicUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    setCorrespondingEmail((prev) => prev || user.email || "");
    setAuthors((prev) => {
      if (prev.length === 1 && !prev[0].name.trim() && user.name) {
        return [{ ...prev[0], name: user.name }];
      }
      return prev;
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (graphicPreviewUrl && graphicPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(graphicPreviewUrl);
      }
    };
  }, [graphicPreviewUrl]);

  useEffect(() => {
    const url = savedPreviewItem?.graphicUrl;
    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [savedPreviewItem]);

  const mySubmissions = useMemo(() => {
    if (!user) return [];
    const emailLower = user.email.toLowerCase();
    return submissions.filter(
      (s) =>
        s.submittedByUid === user.uid ||
        s.submittedByEmail.toLowerCase() === emailLower
    );
  }, [submissions, user]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 mt-4">
          Verifying attendee credentials...
        </p>
      </div>
    );
  }

  if (!user || !hasAttendeeRole(user.roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-xl mx-auto shadow-2xs space-y-4">
        <div className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100">
          <ShieldAlert size={36} />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
          Attendee Access Required
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md">
          Building and submitting a workshop abstract requires a signed-in account with the{" "}
          <strong className="font-semibold text-slate-900">Attendee</strong> role.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!user ? (
            <Link
              href="/auth"
              className="bg-primary text-white hover:bg-sky-800 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              Sign In to Submit
            </Link>
          ) : isMock ? (
            <button
              type="button"
              onClick={() =>
                setMockRoles(Array.from(new Set([...(user.roles || []), "attendee"])))
              }
              className="bg-primary text-white hover:bg-sky-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Enable Attendee Role (Dev Mode)
            </button>
          ) : (
            <Link
              href="/contact"
              className="bg-primary text-white hover:bg-sky-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              Request Attendee Role
            </Link>
          )}
          <Link
            href="/call-for-papers"
            className="bg-white border border-slate-300 text-slate-700 hover:border-primary hover:text-primary px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            View Call for Papers
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic Affiliations Handlers
  const handleAddAffiliation = () => {
    setAffiliations((prev) => [...prev, { id: nextId("aff"), institution: "" }]);
  };

  const handleUpdateAffiliation = (id: string, institution: string) => {
    setAffiliations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, institution } : a))
    );
  };

  const handleRemoveAffiliation = (id: string) => {
    if (affiliations.length <= 1) return;
    const remaining = affiliations.filter((a) => a.id !== id);
    const fallbackId = remaining[0]?.id || "aff-1";
    setAffiliations(remaining);
    setAuthors((prev) =>
      prev.map((author) =>
        author.affiliationId === id
          ? { ...author, affiliationId: fallbackId }
          : author
      )
    );
  };

  // Dynamic Presenters & Co-Authors Handlers
  const handleAddAuthor = (isPresenter: boolean) => {
    const defaultAffId = affiliations[0]?.id || "aff-1";
    setAuthors((prev) => [
      ...prev,
      {
        id: nextId("auth"),
        name: "",
        affiliationId: defaultAffId,
        isPresenter,
      },
    ]);
  };

  const handleUpdateAuthorName = (id: string, name: string) => {
    setAuthors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name } : a))
    );
  };

  const handleUpdateAuthorAffiliation = (id: string, affiliationId: string) => {
    setAuthors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, affiliationId } : a))
    );
  };

  const handleToggleAuthorPresenter = (id: string) => {
    setAuthors((prev) => {
      const target = prev.find((a) => a.id === id);
      if (!target) return prev;
      const presenterCount = prev.filter((a) => a.isPresenter).length;
      if (target.isPresenter && presenterCount <= 1) {
        setFormError("At least one author must be designated as Presenter.");
        return prev;
      }
      setFormError(null);
      return prev.map((a) =>
        a.id === id ? { ...a, isPresenter: !a.isPresenter } : a
      );
    });
  };

  const handleRemoveAuthor = (id: string) => {
    if (authors.length <= 1) return;
    setAuthors((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length > 0 && !next.some((a) => a.isPresenter)) {
        next[0] = { ...next[0], isPresenter: true };
      }
      return next;
    });
  };

  // Abstract Text Helper: Insert Equation / Symbol & Load .txt File
  const insertSymbolIntoAbstract = (token: string) => {
    const textarea = abstractTextareaRef.current;
    const start = textarea?.selectionStart ?? abstractText.length;
    const end = textarea?.selectionEnd ?? abstractText.length;
    const combined =
      abstractText.slice(0, start) + token + abstractText.slice(end);
    if (combined.length > ABSTRACT_MAX_CHARS) {
      setPasteNotice(
        `Cannot insert "${token}": abstract reached the ${ABSTRACT_MAX_CHARS}-character limit.`
      );
      return;
    }
    setPasteNotice(null);
    setAbstractText(combined);
    const nextCursor = start + token.length;
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      });
    }
  };

  const handleLoadAbstractTxt = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const cleaned = raw.replace(/\r\n?/g, "\n").trim();
      if (cleaned.length > ABSTRACT_MAX_CHARS) {
        setAbstractText(cleaned.slice(0, ABSTRACT_MAX_CHARS));
        setPasteNotice(
          `Loaded "${file.name}" and trimmed ${cleaned.length - ABSTRACT_MAX_CHARS} extra characters to fit the ${ABSTRACT_MAX_CHARS}-character abstract limit.`
        );
      } else {
        setAbstractText(cleaned);
        setPasteNotice(null);
      }
    } catch {
      setFormError("Unable to read text from the selected file.");
    } finally {
      if (abstractTxtInputRef.current) abstractTxtInputRef.current.value = "";
    }
  };

  // 300-DPI Minimum Graphic Upload
  const handleGraphicChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGraphicError(null);
    setFormError(null);
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setCheckingGraphic(true);
    try {
      const result = await validateImageDpi(file, MIN_GRAPHIC_DPI);
      if (!result.ok) {
        setGraphicError(
          result.error || "Uploaded graphic does not meet the 300 DPI minimum."
        );
        if (graphicInputRef.current) graphicInputRef.current.value = "";
        return;
      }

      if (graphicPreviewUrl && graphicPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(graphicPreviewUrl);
      }

      setGraphicFile(file);
      setGraphicPreviewUrl(result.previewUrl);
      setGraphicMeta({
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "image/png",
        widthPx: result.widthPx,
        heightPx: result.heightPx,
        detectedDpi: result.detectedDpi,
        dpiSource: result.dpiSource,
      });
    } finally {
      setCheckingGraphic(false);
    }
  };

  const handleRemoveGraphic = () => {
    if (graphicPreviewUrl && graphicPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(graphicPreviewUrl);
    }
    setGraphicFile(null);
    setGraphicMeta(null);
    setGraphicPreviewUrl("");
    setGraphicCaption("");
    setGraphicError(null);
    if (graphicInputRef.current) graphicInputRef.current.value = "";
  };

  const validateAndSubmit = async () => {
    setFormError(null);
    setSubmittedConfirmation(null);

    if (title.trim().length < 5) {
      setFormError("Please enter the full presentation title (at least 5 characters).");
      return;
    }

    const validAffiliations = affiliations.filter(
      (a) => a.institution.trim().length > 0
    );
    if (validAffiliations.length === 0) {
      setFormError("Please enter at least one institutional affiliation.");
      return;
    }

    const validAuthors = authors.filter((a) => a.name.trim().length > 0);
    if (validAuthors.length === 0) {
      setFormError("Please enter at least one presenting author.");
      return;
    }

    if (!validAuthors.some((a) => a.isPresenter)) {
      setFormError("Please mark at least one author as Presenter.");
      return;
    }

    const validAffIds = new Set(validAffiliations.map((a) => a.id));
    const missingAffAuthor = validAuthors.find(
      (a) => !validAffIds.has(a.affiliationId)
    );
    if (missingAffAuthor) {
      setFormError(
        `Please select a non-empty affiliation for "${missingAffAuthor.name}".`
      );
      return;
    }

    if (!correspondingEmail.includes("@")) {
      setFormError("Please enter a valid corresponding email address.");
      return;
    }

    const trimmedSynopsis = summary.trim();
    if (trimmedSynopsis.length < 15) {
      setFormError(
        "Please provide a brief synopsis (15–200 characters) for quick reviewer triage."
      );
      return;
    }
    if (summary.length > SYNOPSIS_MAX_CHARS) {
      setFormError(`Synopsis must not exceed ${SYNOPSIS_MAX_CHARS} characters.`);
      return;
    }

    const trimmedAbstract = abstractText.trim();
    if (trimmedAbstract.length < 50) {
      setFormError(
        "Please enter your full abstract text (at least 50 characters, up to 1,500 characters)."
      );
      return;
    }
    if (abstractText.length > ABSTRACT_MAX_CHARS) {
      setFormError(`Abstract body must not exceed ${ABSTRACT_MAX_CHARS} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSubmission(
        {
          workshopYear: Number(workshop.workshop_year) || 2027,
          title,
          correspondingEmail,
          affiliations: validAffiliations,
          authors: validAuthors,
          presentationFormat,
          researchTrack,
          summary,
          abstractText,
          graphicCaption,
          studentTravelAwardApplicant,
          deadline: workshop.cfp_abstract_deadline,
          submittedByUid: user.uid,
          submittedByEmail: user.email,
        },
        {
          graphicFile,
          graphicMeta,
        }
      );

      setSubmittedConfirmation(created);
      setIsDraftPreviewOpen(false);
      setTitle("");
      setSummary("");
      setAbstractText("");
      setStudentTravelAwardApplicant(false);
      setPasteNotice(null);
      handleRemoveGraphic();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit abstract.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await validateAndSubmit();
  };

  const handleOpenSavedPreview = async (sub: AbstractSubmissionRecord) => {
    const graphicUrl = await getGraphicPreviewUrl(sub);
    setSavedPreviewItem({ sub, graphicUrl });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleWithdraw = async (sub: AbstractSubmissionRecord) => {
    if (
      !window.confirm(
        `Withdraw abstract ${sub.id} ("${sub.title}")? This will remove it from the Reviewer Panel.`
      )
    ) {
      return;
    }
    try {
      await withdrawSubmission(sub.id);
      if (savedPreviewItem?.sub.id === sub.id) {
        setSavedPreviewItem(null);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to withdraw submission."
      );
    }
  };

  if (savedPreviewItem) {
    const { sub, graphicUrl } = savedPreviewItem;
    return (
      <AbstractOnePagePreview
        submissionId={sub.id}
        workshopOrdinal={workshop.workshop_ordinal}
        workshopWindow={workshop.target_window}
        workshopYear={sub.workshopYear}
        title={sub.title}
        authors={sub.authors || []}
        affiliations={sub.affiliations || []}
        presentingAuthorFallback={sub.presentingAuthor}
        affiliationFallback={sub.affiliation}
        coAuthorsFallback={sub.coAuthors}
        correspondingEmail={sub.correspondingEmail}
        presentationFormat={sub.presentationFormat}
        researchTrack={sub.researchTrack}
        studentTravelAwardApplicant={sub.studentTravelAwardApplicant}
        synopsis={sub.summary}
        abstractText={sub.abstractText || sub.summary}
        graphicUrl={graphicUrl}
        graphicMeta={sub.graphic || null}
        graphicCaption={sub.graphic?.caption}
        modeLabel={`Submitted Abstract ${sub.id} — 1-Page Preview`}
        onClose={() => setSavedPreviewItem(null)}
      />
    );
  }

  if (isDraftPreviewOpen) {
    return (
      <AbstractOnePagePreview
        workshopOrdinal={workshop.workshop_ordinal}
        workshopWindow={workshop.target_window}
        workshopYear={Number(workshop.workshop_year) || 2027}
        title={title}
        authors={authors}
        affiliations={affiliations}
        correspondingEmail={correspondingEmail}
        presentationFormat={presentationFormat}
        researchTrack={researchTrack}
        studentTravelAwardApplicant={studentTravelAwardApplicant}
        synopsis={summary}
        abstractText={abstractText}
        graphicUrl={graphicPreviewUrl || null}
        graphicMeta={
          graphicMeta
            ? {
                ...graphicMeta,
                caption: graphicCaption.trim() || undefined,
              }
            : null
        }
        graphicCaption={graphicCaption}
        modeLabel="Draft 1-Page Formatted Abstract Preview"
        onClose={() => setIsDraftPreviewOpen(false)}
        onSubmitDraft={() => void validateAndSubmit()}
        submittingDraft={submitting}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium mb-3 shadow-2xs">
            <Upload size={13} className="text-primary shrink-0" />
            <span>
              Attendees Portal • {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window})
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
            Abstract <span className="text-primary italic font-normal">Submission</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
            Build your single-page structured abstract with presenters, co-authors, linked affiliations, synopsis, equations (Word copy-paste supported), and a 300+ DPI graphic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsDraftPreviewOpen(true);
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-primary hover:text-primary px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Eye size={14} className="text-primary" />
            <span>Show Preview</span>
          </button>
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-semibold text-primary break-all">
            Attendee: {user.email}
          </div>
        </div>
      </header>

      {/* Submission Confirmation Banner */}
      {submittedConfirmation && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded tabular-nums">
                  {submittedConfirmation.id}
                </span>
                <span className="text-sm font-bold text-emerald-950">
                  Abstract Submitted &amp; Queued for Review
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                <strong>{submittedConfirmation.title}</strong> is now live in the Reviewer Panel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => void handleOpenSavedPreview(submittedConfirmation)}
              className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-900 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Eye size={13} /> Show 1-Page Preview
            </button>
            {hasReviewerRole(user.roles) && (
              <Link
                href="/reviewer"
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <ClipboardCheck size={14} /> Reviewer Panel <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Structured Abstract Builder */}
        <form
          onSubmit={handleFormSubmit}
          className="lg:col-span-2 bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-8 shadow-2xs space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
                1. Abstract Builder &amp; Formatting
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                All text fields normalize direct copy-paste from Microsoft Word, preserving equations and scientific symbols.
              </p>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {pasteNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
              <span>{pasteNotice}</span>
              <button
                type="button"
                onClick={() => setPasteNotice(null)}
                className="text-amber-700 hover:text-amber-950 font-semibold cursor-pointer"
                aria-label="Dismiss paste notice"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Title + Corresponding Email */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="abs-title"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Presentation Title <span className="text-red-500">*</span>
              </label>
              <input
                id="abs-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onPaste={(e) =>
                  applyWordPasteToField(e, title, setTitle, { multiline: false })
                }
                placeholder="e.g., Subsea Membrane-Inlet Mass Spectrometry of Dissolved CO₂ & C₁–C₇ Hydrocarbons"
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="abs-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Corresponding Email <span className="text-red-500">*</span>
              </label>
              <input
                id="abs-email"
                type="email"
                required
                value={correspondingEmail}
                onChange={(e) => setCorrespondingEmail(e.target.value)}
                onPaste={(e) =>
                  applyWordPasteToField(e, correspondingEmail, setCorrespondingEmail, {
                    multiline: false,
                  })
                }
                placeholder="presenter@institution.edu"
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 2. Dynamic Affiliations */}
          <section className="space-y-3 bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 size={14} className="text-primary" />
                  Affiliations <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add every participating institution below, then assign each author&apos;s affiliation from the dropdown.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAffiliation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={13} className="text-primary" />
                <span>Add Affiliation</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {affiliations.map((aff, index) => (
                <div key={aff.id} className="flex items-center gap-2.5">
                  <span className="w-7 h-9 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={aff.institution}
                    aria-label={`Affiliation ${index + 1}`}
                    onChange={(e) => handleUpdateAffiliation(aff.id, e.target.value)}
                    onPaste={(e) =>
                      applyWordPasteToField(
                        e,
                        aff.institution,
                        (val) => handleUpdateAffiliation(aff.id, val),
                        { multiline: false }
                      )
                    }
                    placeholder={`Institution, Laboratory, or Company #${index + 1}`}
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary"
                  />
                  {affiliations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAffiliation(aff.id)}
                      aria-label={`Remove affiliation ${index + 1}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. Dynamic Presenters & Co-Authors with Affiliation Select */}
          <section className="space-y-3 bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserPlus size={14} className="text-primary" />
                  Presenters &amp; Co-Authors <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add presenters or co-authors and select each author&apos;s affiliation from the drop box. Presenters are underlined on the abstract page.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddAuthor(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-sky-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add Presenter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAuthor(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} className="text-primary" />
                  <span>Add Co-Author</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {authors.map((author, index) => (
                <div
                  key={author.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-white border border-slate-200/90 rounded-xl p-2.5"
                >
                  <div className="md:col-span-5 flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 w-5 text-center shrink-0 tabular-nums">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={author.name}
                      aria-label={`Author ${index + 1} name`}
                      onChange={(e) => handleUpdateAuthorName(author.id, e.target.value)}
                      onPaste={(e) =>
                        applyWordPasteToField(
                          e,
                          author.name,
                          (val) => handleUpdateAuthorName(author.id, val),
                          { multiline: false }
                        )
                      }
                      placeholder={
                        author.isPresenter ? "Presenter Full Name" : "Co-Author Full Name"
                      }
                      className="flex-1 min-w-0 bg-[#FAFBFD] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="md:col-span-5 min-w-0">
                    <select
                      value={author.affiliationId}
                      aria-label={`Affiliation for author ${index + 1}`}
                      onChange={(e) =>
                        handleUpdateAuthorAffiliation(author.id, e.target.value)
                      }
                      className="w-full bg-[#FAFBFD] border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-primary"
                    >
                      {affiliations.map((aff, affIdx) => (
                        <option key={aff.id} value={aff.id}>
                          {affIdx + 1}.{" "}
                          {aff.institution.trim()
                            ? aff.institution.trim()
                            : `Affiliation #${affIdx + 1} (enter above)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={author.isPresenter}
                        onChange={() => handleToggleAuthorPresenter(author.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>Presenter</span>
                    </label>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(author.id)}
                        aria-label={`Remove author ${index + 1}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Format & Research Track */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="abs-format"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Preferred Format <span className="text-red-500">*</span>
              </label>
              <select
                id="abs-format"
                value={presentationFormat}
                onChange={(e) =>
                  setPresentationFormat(e.target.value as PresentationFormat)
                }
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              >
                {PRESENTATION_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="abs-track"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Technical Research Track <span className="text-red-500">*</span>
              </label>
              <select
                id="abs-track"
                value={researchTrack}
                onChange={(e) =>
                  setResearchTrack(e.target.value as ResearchTrack)
                }
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              >
                {RESEARCH_TRACK_OPTIONS.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Synopsis (Strictly Limited to 200 Chars) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="abs-summary"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Short Synopsis <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  summary.length >= SYNOPSIS_MAX_CHARS
                    ? "text-amber-600"
                    : "text-slate-500"
                }`}
              >
                {summary.length} / {SYNOPSIS_MAX_CHARS} chars
              </span>
            </div>
            <textarea
              id="abs-summary"
              required
              rows={2}
              maxLength={SYNOPSIS_MAX_CHARS}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onPaste={(e) =>
                applyWordPasteToField(
                  e,
                  summary,
                  setSummary,
                  { multiline: false, maxChars: SYNOPSIS_MAX_CHARS },
                  (trimmed) => {
                    if (trimmed > 0) {
                      setPasteNotice(
                        `Word paste normalized for Synopsis and trimmed ${trimmed} characters to fit the ${SYNOPSIS_MAX_CHARS}-character limit.`
                      );
                    }
                  }
                )
              }
              placeholder="Concise 1-sentence headline summary (up to 200 characters) for program & reviewer triage..."
              className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>

          {/* Full Abstract Text (Up to 1,500 Chars + Word Paste + Load .txt) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="abs-body"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Abstract Text <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="abs-txt-loader"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <FileUp size={12} />
                  <span>Load .txt file</span>
                </label>
                <input
                  id="abs-txt-loader"
                  ref={abstractTxtInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => void handleLoadAbstractTxt(e)}
                  className="sr-only"
                />
                <span
                  className={`text-[11px] font-semibold tabular-nums ${
                    abstractText.length >= ABSTRACT_MAX_CHARS
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                >
                  {abstractText.length} / {ABSTRACT_MAX_CHARS.toLocaleString()} chars
                </span>
              </div>
            </div>

            {/* Quick Equation & Symbol Insert Toolbar */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5">
                Insert:
              </span>
              {QUICK_MATH_TOKENS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  title={item.title}
                  onClick={() => insertSymbolIntoAbstract(item.token)}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <textarea
              id="abs-body"
              ref={abstractTextareaRef}
              required
              rows={8}
              maxLength={ABSTRACT_MAX_CHARS}
              value={abstractText}
              onChange={(e) => setAbstractText(e.target.value)}
              onPaste={(e) =>
                applyWordPasteToField(
                  e,
                  abstractText,
                  setAbstractText,
                  { multiline: true, maxChars: ABSTRACT_MAX_CHARS },
                  (trimmed) => {
                    if (trimmed > 0) {
                      setPasteNotice(
                        `Word paste converted equations/symbols and trimmed ${trimmed} characters to fit the ${ABSTRACT_MAX_CHARS.toLocaleString()}-character limit.`
                      );
                    }
                  }
                )
              }
              placeholder="Paste directly from Microsoft Word or compose up to 1,500 characters covering background, instrument architecture, field/laboratory validation metrics, and equations..."
              className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>

          {/* Student Travel Award Opt-In */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-[#FAFBFD] border border-slate-200 cursor-pointer hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={studentTravelAwardApplicant}
              onChange={(e) => setStudentTravelAwardApplicant(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              <strong className="font-semibold text-slate-900 inline-flex items-center gap-1.5">
                <GraduationCap size={14} className="text-secondary shrink-0" />
                Presenter is a full-time M.S., M.A., or Ph.D. graduate student applying for a {workshop.student_award_amount} Student Travel Award.
              </strong>{" "}
              <span className="block text-slate-500 mt-0.5">
                Note: Student Travel Award packets also require student &amp; faculty advisor letters submitted per{" "}
                <Link href="/student-awards" className="text-primary font-semibold hover:underline">
                  Student Award guidelines
                </Link>
                .
              </span>
            </span>
          </label>

          {/* 300-DPI Minimum Graphic Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="abs-graphic-upload"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Abstract Graphic / Figure (Optional, {MIN_GRAPHIC_DPI} DPI Min)
              </label>
              <span className="text-[11px] text-slate-500">
                PNG, JPEG, WebP (≥300 DPI or ≥900 px wide) or SVG
              </span>
            </div>

            {graphicError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{graphicError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 hover:border-primary/60 rounded-2xl p-4 sm:p-5 bg-[#FAFBFD] transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <ImageIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    {checkingGraphic ? (
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        Verifying graphic resolution (300 DPI check)...
                      </p>
                    ) : graphicFile && graphicMeta ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {graphicFile.name}
                        </p>
                        <p className="text-xs text-emerald-700 font-semibold tabular-nums">
                          Verified {graphicMeta.detectedDpi} DPI ({graphicMeta.dpiSource}) •{" "}
                          {graphicMeta.widthPx}×{graphicMeta.heightPx} px •{" "}
                          {formatFileSize(graphicFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800">
                          Upload high-resolution figure ({MIN_GRAPHIC_DPI} DPI minimum)
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Include mass spectra, instrument schematics, or field plots sized to display cleanly alongside your 1-page abstract.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {graphicFile && (
                    <button
                      type="button"
                      onClick={handleRemoveGraphic}
                      className="px-3 py-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <label
                    htmlFor="abs-graphic-upload"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload size={14} />
                    <span>{graphicFile ? "Replace Graphic" : "Choose Graphic"}</span>
                  </label>
                  <input
                    id="abs-graphic-upload"
                    ref={graphicInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => void handleGraphicChange(e)}
                    className="sr-only"
                  />
                </div>
              </div>

              {graphicPreviewUrl && graphicFile && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80 items-center">
                  <div className="sm:col-span-4 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                    <img
                      src={graphicPreviewUrl}
                      alt="Uploaded graphic preview"
                      className="max-h-32 w-auto object-contain rounded"
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <label
                      htmlFor="abs-graphic-caption"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                    >
                      Figure Caption (Optional)
                    </label>
                    <input
                      id="abs-graphic-caption"
                      type="text"
                      value={graphicCaption}
                      onChange={(e) => setGraphicCaption(e.target.value)}
                      onPaste={(e) =>
                        applyWordPasteToField(e, graphicCaption, setGraphicCaption, {
                          multiline: false,
                        })
                      }
                      placeholder="e.g., Mass spectrum of dissolved C₁–C₇ hydrocarbons at 3,800 m depth (Δm/m = 1,800)."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions: Show Preview + Submit */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 tabular-nums">
              Submission Deadline:{" "}
              <strong className="text-slate-700">{workshop.cfp_abstract_deadline}</strong>
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDraftPreviewOpen(true);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-primary hover:text-primary text-slate-800 px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <Eye size={16} className="text-primary" />
                <span>Show Preview</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-sky-800 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Abstract...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Submit Abstract for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right Sidebar: Guidelines & Attendee Submission History */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar size={14} /> Formatting &amp; Limits
            </div>
            <h3 className="font-serif text-lg font-semibold text-slate-900">
              1-Page Abstract Builder Specs
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed list-disc list-inside">
              <li>
                Unlimited <strong>Affiliations</strong> &amp; <strong>Presenters / Co-Authors</strong> mapped by dropdown
              </li>
              <li>
                Short Synopsis capped at <strong>200 characters</strong>
              </li>
              <li>
                Abstract Body up to <strong>1,500 characters</strong> (Word copy-paste &amp; equations supported)
              </li>
              <li>
                Optional figure at <strong>{MIN_GRAPHIC_DPI} DPI minimum</strong> (PNG, JPEG, WebP ≥900 px wide, or SVG)
              </li>
              <li>
                Click <strong>Show Preview</strong> anytime to verify your 1-page layout &amp; print PDF
              </li>
            </ul>
            <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
              <Link
                href="/formatting-guidelines"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Formatting Guidelines <ExternalLink size={12} />
              </Link>
              <Link
                href="/call-for-papers"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-primary hover:underline"
              >
                Call for Papers
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                My Submitted Abstracts
              </h3>
              <span className="tabular-nums text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {mySubmissions.length}
              </span>
            </div>

            {listLoading ? (
              <p className="text-xs text-slate-500">Loading your submissions...</p>
            ) : mySubmissions.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                You have not submitted an abstract yet for the {workshop.workshop_ordinal} HEMS Workshop. Complete the builder on the left to preview and submit.
              </p>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-[#FAFBFD] border border-slate-200/90 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="tabular-nums text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {sub.id}
                      </span>
                      <span
                        className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          sub.status === "Reviewed"
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        }`}
                      >
                        {sub.status === "Reviewed" ? sub.decision : "Pending Review"}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      <ScientificText text={sub.title} />
                    </h4>

                    <p className="text-[11px] text-slate-500 truncate">
                      {sub.presentationFormat}
                      {sub.graphic ? ` • Figure (${sub.graphic.detectedDpi} DPI)` : ""}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleOpenSavedPreview(sub)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Eye size={12} /> Show Preview
                      </button>
                      {sub.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => void handleWithdraw(sub)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline cursor-pointer ml-auto"
                        >
                          <Trash2 size={12} /> Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
