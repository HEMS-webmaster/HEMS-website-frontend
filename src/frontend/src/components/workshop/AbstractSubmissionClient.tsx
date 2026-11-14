"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
  Calendar,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  Plus,
  UserPlus,
  Image as ImageIcon,
  FileUp,
  X,
  Printer,
  Bold,
  Italic,
  Underline,
  Subscript,
  Superscript,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Tag,
  User,
  Ruler,
  Cloud,
  Save,
  Copy,
  Edit3,
  FilePlus2,
  Lock,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import { HydratedDraftPayload, useAbstractDraft } from "@/hooks/useAbstractDraft";
import { evaluateAbstractDeadline } from "@/utils/upcomingWorkshop";
import {
  ABSTRACT_MAX_CHARS,
  AbstractDraftFormValues,
  AbstractDraftRecord,
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
  BIO_MAX_CHARS,
  CAPTION_MAX_CHARS,
  clampFigureWidthInches,
  DEFAULT_FIGURE_WIDTH_IN,
  FIGURE_MARKER_TOKEN,
  GraphicMetadata,
  isRightWrappedFigureWidth,
  KEYWORDS_MAX_CHARS,
  MAX_FIGURE_WIDTH_IN,
  MIN_FIGURE_WIDTH_IN,
  MIN_GRAPHIC_DPI,
  PRESENTATION_FORMAT_OPTIONS,
  PresentationFormat,
  PRINTABLE_TEXT_WIDTH_IN,
  RESEARCH_TRACK_OPTIONS,
  ResearchTrack,
  RIGHT_WRAP_THRESHOLD_IN,
  SYNOPSIS_MAX_CHARS,
} from "@/types/abstractSubmission";
import {
  hasAttendeeRole,
  hasReviewerRole,
} from "@/utils/telemetryClient";
import {
  applyWordPasteToField,
  countVisibleChars,
  slicePreservingTags,
} from "@/utils/wordPasteNormalizer";
import { validateImageDpi } from "@/utils/imageDpiValidator";
import { extractSuggestedKeywords } from "@/utils/keywordExtractor";
import AbstractOnePagePreview from "@/components/workshop/AbstractOnePagePreview";
import PrintableFormattingGuidelines from "@/components/workshop/PrintableFormattingGuidelines";
import ScientificText, { splitAtFigureMarker } from "@/components/workshop/ScientificText";

const WORKFLOW_STAGES: Array<{ id: number; shortLabel: string; title: string }> = [
  { id: 1, shortLabel: "Title & Contact", title: "1. Title, Contact Emails, Format & Student Award" },
  { id: 2, shortLabel: "Affiliations", title: "2. Institutional Affiliations & Locations" },
  { id: 3, shortLabel: "Authors", title: "3. Presenter & Co-Authors" },
  { id: 4, shortLabel: "Track & Synopsis", title: "4. Technical Research Track & Synopsis" },
  { id: 5, shortLabel: "Abstract & Figure", title: "5. Abstract, Figure Upload & Live Formatted Preview" },
  { id: 6, shortLabel: "Keywords & Bio", title: "6. Keywords & Presenter Biography" },
  { id: 7, shortLabel: "Preview & Submit", title: "7. Formatted Preview (8.5\" × 11\", 1\" Margins) & Submit" },
];

const QUICK_MATH_TOKENS: Array<{
  label: string;
  token: string;
  title: string;
  italic?: boolean;
}> = [
  {
    label: "m/z",
    token: "<i>m/z</i>",
    title: "Mass-to-charge ratio (italicized m/z)",
    italic: true,
  },
  { label: "μ", token: "μ", title: "Micro (mu)" },
  { label: "Δ", token: "Δ", title: "Delta" },
  { label: "±", token: "±", title: "Plus-minus" },
  { label: "×", token: "×", title: "Multiplication" },
  { label: "°C", token: "°C", title: "Degrees Celsius" },
  { label: "≤", token: "≤", title: "Less than or equal" },
  { label: "≥", token: "≥", title: "Greater than or equal" },
  { label: "≈", token: "≈", title: "Approximately equal" },
  { label: "→", token: "→", title: "Reaction arrow" },
  { label: "⇌", token: "⇌", title: "Equilibrium arrow" },
  { label: "CO₂", token: "CO<sub>2</sub>", title: "Carbon dioxide (formatted subscript)" },
  { label: "CH₄", token: "CH<sub>4</sub>", title: "Methane (formatted subscript)" },
  { label: "[M+H]⁺", token: "[M+H]<sup>+</sup>", title: "Protonated ion" },
  { label: "a/b", token: "$\\frac{a}{b}$", title: "Stacked fraction" },
  { label: "√x", token: "$\\sqrt{x}$", title: "Square root" },
];

const LABEL_CLASS = "hems-label";
const INPUT_CLASS = "hems-control w-full px-3.5 py-2.5 text-[15px] rounded-xl";

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatDraftTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTimestampBadge(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
    updateSubmission,
    withdrawSubmission,
    getGraphicPreviewUrl,
    getSubmissionGraphicAsset,
  } = useAbstractSubmissions();

  const abstractTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abstractTxtInputRef = useRef<HTMLInputElement | null>(null);
  const graphicInputRef = useRef<HTMLInputElement | null>(null);
  const guardPushedRef = useRef<boolean>(false);
  const bypassUnloadGuardRef = useRef<boolean>(false);

  const [viewMode, setViewMode] = useState<"overview" | "editor">("overview");
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [retainedSubmittedGraphic, setRetainedSubmittedGraphic] =
    useState<GraphicMetadata | null>(null);
  const [infoExpanded, setInfoExpanded] = useState<boolean>(false);
  const [showPrintableGuidelines, setShowPrintableGuidelines] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Stage 1
  const [title, setTitle] = useState("");
  const [correspondingEmail, setCorrespondingEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [presentationFormat, setPresentationFormat] =
    useState<PresentationFormat>("Oral Presentation");
  const [studentTravelAwardApplicant, setStudentTravelAwardApplicant] =
    useState(false);

  // Stage 2
  const [affiliations, setAffiliations] = useState<AffiliationEntry[]>([
    { id: "aff-1", institution: "", location: "" },
  ]);

  // Stage 3
  const [authors, setAuthors] = useState<AuthorEntry[]>([
    { id: "auth-1", name: "", affiliationId: "aff-1", isPresenter: true },
  ]);

  // Stage 4
  const [researchTrack, setResearchTrack] = useState<ResearchTrack>(
    "Miniature & Ruggedized Hardware / Vacuum"
  );
  const [summary, setSummary] = useState("");

  // Stage 5
  const [abstractText, setAbstractText] = useState("");

  // Stage 6
  const [graphicFile, setGraphicFile] = useState<File | null>(null);
  const [graphicMeta, setGraphicMeta] = useState<Omit<
    GraphicMetadata,
    "storageUrl" | "hasLocalBlob"
  > | null>(null);
  const [graphicPreviewUrl, setGraphicPreviewUrl] = useState<string>("");
  const [figureWidthInches, setFigureWidthInches] = useState<number>(
    DEFAULT_FIGURE_WIDTH_IN
  );
  const [figureWidthInput, setFigureWidthInput] = useState<string>(
    String(DEFAULT_FIGURE_WIDTH_IN)
  );
  const [graphicCaption, setGraphicCaption] = useState("");
  const [graphicError, setGraphicError] = useState<string | null>(null);
  const [checkingGraphic, setCheckingGraphic] = useState(false);
  const [figurePanelHidden, setFigurePanelHidden] = useState(false);

  // Stage 7
  const [keywords, setKeywords] = useState("");
  const [presenterBio, setPresenterBio] = useState("");

  // Feedback & saved preview state
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<{
    record: AbstractSubmissionRecord;
    isUpdate: boolean;
  } | null>(null);
  const [overviewNotice, setOverviewNotice] = useState<{
    tone: "emerald" | "sky" | "amber";
    message: string;
    actionDraftId?: string;
  } | null>(null);
  const [savedPreviewItem, setSavedPreviewItem] = useState<{
    sub: AbstractSubmissionRecord;
    graphicUrl: string | null;
  } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const deadlineInfo = useMemo(
    () => evaluateAbstractDeadline(workshop, nowMs),
    [workshop, nowMs]
  );

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

  const visibleAbstractChars = useMemo(
    () => countVisibleChars(abstractText),
    [abstractText]
  );

  const splitAbstractPreview = useMemo(
    () => splitAtFigureMarker(abstractText),
    [abstractText]
  );

  const suggestedKeywords = useMemo(
    () =>
      extractSuggestedKeywords(
        {
          title,
          synopsis: summary,
          abstractText,
          researchTrack,
        },
        8
      ),
    [title, summary, abstractText, researchTrack]
  );

  const parsedKeywordTags = useMemo(
    () =>
      keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    [keywords]
  );

  const draftValues = useMemo<AbstractDraftFormValues>(
    () => ({
      currentStage,
      title,
      correspondingEmail,
      secondaryEmail,
      presentationFormat,
      studentTravelAwardApplicant,
      affiliations,
      authors,
      researchTrack,
      summary,
      abstractText,
      figureWidthInches,
      graphicCaption,
      figurePanelHidden,
      graphicMeta,
      keywords,
      presenterBio,
    }),
    [
      currentStage,
      title,
      correspondingEmail,
      secondaryEmail,
      presentationFormat,
      studentTravelAwardApplicant,
      affiliations,
      authors,
      researchTrack,
      summary,
      abstractText,
      figureWidthInches,
      graphicCaption,
      figurePanelHidden,
      graphicMeta,
      keywords,
      presenterBio,
    ]
  );

  const applyHydratedDraft = useCallback((payload: HydratedDraftPayload) => {
    const r = payload.record;
    const clampedWidth = clampFigureWidthInches(r.figureWidthInches);
    setRetainedSubmittedGraphic(null);
    setCurrentStage(r.currentStage);
    setTitle(r.title);
    if (r.correspondingEmail) {
      setCorrespondingEmail(r.correspondingEmail);
    }
    setSecondaryEmail(r.secondaryEmail);
    setPresentationFormat(r.presentationFormat);
    setStudentTravelAwardApplicant(r.studentTravelAwardApplicant);
    setAffiliations(
      r.affiliations.length > 0
        ? r.affiliations
        : [{ id: "aff-1", institution: "", location: "" }]
    );
    setAuthors(
      r.authors.length > 0
        ? r.authors
        : [{ id: "auth-1", name: "", affiliationId: "aff-1", isPresenter: true }]
    );
    setResearchTrack(r.researchTrack);
    setSummary(r.summary);
    setAbstractText(r.abstractText);
    setFigureWidthInches(clampedWidth);
    setFigureWidthInput(String(clampedWidth));
    setGraphicCaption(r.graphicCaption);
    setFigurePanelHidden(r.figurePanelHidden);
    setKeywords(r.keywords);
    setPresenterBio(r.presenterBio);
    setGraphicFile(payload.restoredGraphicFile);
    setGraphicPreviewUrl(payload.restoredGraphicPreviewUrl);
    setGraphicMeta(
      payload.restoredGraphicFile ? r.graphicMeta : null
    );
    setGraphicError(null);
    setStageError(null);
    if (payload.missingCrossDeviceGraphicName) {
      setPasteNotice(
        `Restored cloud draft from another device. Re-attach "${payload.missingCrossDeviceGraphicName}" in Stage 5 if you want to include that figure.`
      );
    } else {
      setPasteNotice(null);
    }
  }, []);

  const {
    drafts,
    loadingDrafts,
    activeDraftId,
    hasDraftContent,
    draftStatus,
    startNewDraft,
    openDraft,
    duplicateDraft,
    createDraftFromSubmission,
    deleteDraftById,
    closeActiveDraft,
    saveDraftNow,
  } = useAbstractDraft({
    uid: user?.uid,
    userEmail: user?.email,
    workshopYear: Number(workshop.workshop_year) || 2027,
    enabled: Boolean(user && hasAttendeeRole(user.roles)),
    values: draftValues,
    graphicFile,
    suppressSaving:
      submitting || viewMode !== "editor" || editingSubmissionId !== null,
  });

  const isDirty = useMemo(() => {
    if (viewMode !== "editor" || submittedConfirmation) return false;
    if (editingSubmissionId) return true;
    const hasAffData = affiliations.some(
      (a) => a.institution.trim().length > 0 || (a.location || "").trim().length > 0
    );
    return Boolean(
      currentStage > 1 ||
        title.trim() ||
        secondaryEmail.trim() ||
        hasAffData ||
        summary.trim() ||
        abstractText.trim() ||
        graphicFile ||
        graphicCaption.trim() ||
        keywords.trim() ||
        presenterBio.trim() ||
        studentTravelAwardApplicant
    );
  }, [
    viewMode,
    editingSubmissionId,
    submittedConfirmation,
    currentStage,
    title,
    secondaryEmail,
    affiliations,
    summary,
    abstractText,
    graphicFile,
    graphicCaption,
    keywords,
    presenterBio,
    studentTravelAwardApplicant,
  ]);

  // Browser Back button, internal link & tab-close unsaved data warning guard
  useEffect(() => {
    if (typeof window === "undefined" || !isDirty) return;

    if (!guardPushedRef.current) {
      window.history.pushState(
        { hemsAbstractWizardGuard: true },
        "",
        window.location.href
      );
      guardPushedRef.current = true;
    }

    const warningMessage =
      "You have unsaved abstract submission data. Leaving this page may lose your progress. (Tip: Use the workflow 'Back' button to move between submission stages.) Leave anyway?";

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassUnloadGuardRef.current) return;
      e.preventDefault();
      e.returnValue = warningMessage;
    };

    const handlePopState = () => {
      if (bypassUnloadGuardRef.current) return;
      const confirmLeave = window.confirm(warningMessage);
      if (!confirmLeave) {
        window.history.pushState(
          { hemsAbstractWizardGuard: true },
          "",
          window.location.href
        );
      } else {
        bypassUnloadGuardRef.current = true;
        guardPushedRef.current = false;
        window.history.back();
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      if (bypassUnloadGuardRef.current) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      if (href.startsWith("/abstract-submission")) return;

      const confirmLeave = window.confirm(warningMessage);
      if (!confirmLeave) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        bypassUnloadGuardRef.current = true;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  const mySubmissions = useMemo(() => {
    if (!user) return [];
    const emailLower = user.email.toLowerCase();
    return submissions.filter(
      (s) =>
        s.submittedByUid === user.uid ||
        s.submittedByEmail.toLowerCase() === emailLower
    );
  }, [submissions, user]);

  const scrollToWorkspaceTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

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

  // Stage 2: Affiliation Handlers
  const handleAddAffiliation = () => {
    setAffiliations((prev) => [
      ...prev,
      { id: nextId("aff"), institution: "", location: "" },
    ]);
  };

  const handleUpdateAffiliation = (
    id: string,
    field: "institution" | "location",
    value: string
  ) => {
    setAffiliations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
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

  // Stage 3: Single-Presenter & Unlimited Co-Author Handlers
  const handleAddCoAuthor = () => {
    const defaultAffId = affiliations[0]?.id || "aff-1";
    setAuthors((prev) => [
      ...prev,
      {
        id: nextId("auth"),
        name: "",
        affiliationId: defaultAffId,
        isPresenter: prev.length === 0,
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

  const handleSelectSinglePresenter = (id: string) => {
    setStageError(null);
    setAuthors((prev) =>
      prev.map((a) => ({ ...a, isPresenter: a.id === id }))
    );
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

  // Stage 5: Generalized Rich Tag Wrapping & Symbol Insertion + Direct Text Enforcement
  const handleAbstractTextChange = (rawNext: string) => {
    setStageError(null);
    if (countVisibleChars(rawNext) > ABSTRACT_MAX_CHARS) {
      const sliced = slicePreservingTags(rawNext, ABSTRACT_MAX_CHARS);
      setAbstractText(sliced.text);
      setPasteNotice(
        `Abstract limited to ${ABSTRACT_MAX_CHARS.toLocaleString()} visible characters (with spaces); trimmed ${sliced.truncatedChars} extra characters.`
      );
      return;
    }
    setAbstractText(rawNext);
  };

  const wrapSelectionWithFormatTag = (tag: "b" | "i" | "u" | "sub" | "sup") => {
    const textarea = abstractTextareaRef.current;
    const start = textarea?.selectionStart ?? abstractText.length;
    const end = textarea?.selectionEnd ?? abstractText.length;
    const selected = abstractText.slice(start, end);
    const placeholder =
      tag === "sub"
        ? "2"
        : tag === "sup"
        ? "+"
        : tag === "b"
        ? "bold text"
        : tag === "i"
        ? "italic text"
        : "underlined text";
    const inner = selected || placeholder;
    const wrapped = `<${tag}>${inner}</${tag}>`;

    const candidate =
      abstractText.slice(0, start) + wrapped + abstractText.slice(end);
    if (countVisibleChars(candidate) > ABSTRACT_MAX_CHARS) {
      setPasteNotice(
        `Cannot insert formatted text: abstract reached ${ABSTRACT_MAX_CHARS.toLocaleString()} visible characters.`
      );
      return;
    }

    setPasteNotice(null);
    setAbstractText(candidate);

    const openTagLen = `<${tag}>`.length;
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        if (selected) {
          const caret = start + wrapped.length;
          textarea.setSelectionRange(caret, caret);
        } else {
          textarea.setSelectionRange(
            start + openTagLen,
            start + openTagLen + placeholder.length
          );
        }
      });
    }
  };

  const insertTokenIntoAbstract = (token: string) => {
    const textarea = abstractTextareaRef.current;
    const start = textarea?.selectionStart ?? abstractText.length;
    const end = textarea?.selectionEnd ?? abstractText.length;
    const candidate =
      abstractText.slice(0, start) + token + abstractText.slice(end);
    if (countVisibleChars(candidate) > ABSTRACT_MAX_CHARS) {
      setPasteNotice(
        `Cannot insert "${token}": abstract reached ${ABSTRACT_MAX_CHARS.toLocaleString()} visible characters.`
      );
      return;
    }
    setPasteNotice(null);
    setAbstractText(candidate);
    const nextCursor = start + token.length;
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      });
    }
  };

  const insertOrMoveFigureMarker = () => {
    const textarea = abstractTextareaRef.current;
    const rawStart = textarea?.selectionStart ?? abstractText.length;
    const rawEnd = textarea?.selectionEnd ?? abstractText.length;

    const existingMatch = /\[FIGURE\]/i.exec(abstractText);

    let baseText = abstractText;
    let start = rawStart;
    let end = rawEnd;

    if (existingMatch) {
      const mStart = existingMatch.index;
      const mEnd = mStart + existingMatch[0].length;
      const hasLeadingSpaces = mStart > 0 && /[ \t]/.test(abstractText[mStart - 1]);
      const hasTrailingSpaces = mEnd < abstractText.length && /[ \t]/.test(abstractText[mEnd]);
      const charBefore = mStart > 0 ? abstractText[mStart - 1] : "";
      const charAfter = mEnd < abstractText.length ? abstractText[mEnd] : "";
      let sliceFrom = mStart;
      let sliceTo = mEnd;
      if (hasLeadingSpaces && hasTrailingSpaces) {
        sliceTo += 1;
      } else if (hasLeadingSpaces && (mEnd === abstractText.length || charAfter === "\n")) {
        sliceFrom -= 1;
      } else if (hasTrailingSpaces && (mStart === 0 || charBefore === "\n")) {
        sliceTo += 1;
      }
      baseText = abstractText.slice(0, sliceFrom) + abstractText.slice(sliceTo);
      const removedLen = sliceTo - sliceFrom;
      if (rawStart > sliceFrom) {
        start = Math.max(sliceFrom, rawStart - Math.min(removedLen, rawStart - sliceFrom));
      }
      if (rawEnd > sliceFrom) {
        end = Math.max(start, rawEnd - Math.min(removedLen, rawEnd - sliceFrom));
      }
    }

    const before = baseText.slice(0, start);
    const after = baseText.slice(end);
    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
    const needsTrailingSpace = after.length > 0 && !/^\s/.test(after);
    const leading = needsLeadingSpace ? " " : "";
    const trailing = needsTrailingSpace ? " " : "";
    const nextText = `${before}${leading}${FIGURE_MARKER_TOKEN}${trailing}${after}`;

    setAbstractText(nextText);
    const isRightWrapped = isRightWrappedFigureWidth(figureWidthInches);
    setPasteNotice(
      existingMatch
        ? isRightWrapped
          ? "Moved [FIGURE] inline. Because width < 3.5\", this row is now the first row broken by the right-aligned figure."
          : "Moved the [FIGURE] placement marker to the new cursor position."
        : isRightWrapped
        ? "Inserted [FIGURE] inline. Because width < 3.5\", place it at the start of the row where right-aligned text wrapping should begin."
        : "Inserted [FIGURE] placement marker. Your figure will render at this position in the live & final previews."
    );

    const nextCursor = before.length + leading.length + FIGURE_MARKER_TOKEN.length;
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      });
    }
  };

  const removeFigureMarker = () => {
    const cleaned = abstractText
      .replace(/\n[ \t]*\[FIGURE\][ \t]*\n/gi, "\n\n")
      .replace(/[ \t]*\[FIGURE\][ \t]*/gi, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    setAbstractText(cleaned);
    setPasteNotice(null);
  };

  const handleSetFigureWidth = (nextWidth: number) => {
    const clamped = clampFigureWidthInches(nextWidth);
    setFigureWidthInches(clamped);
    setFigureWidthInput(String(clamped));
  };

  const handleFigureWidthInputChange = (rawVal: string) => {
    setFigureWidthInput(rawVal);
    const parsed = Number.parseFloat(rawVal);
    if (!Number.isNaN(parsed)) {
      if (parsed >= MIN_FIGURE_WIDTH_IN && parsed <= MAX_FIGURE_WIDTH_IN) {
        setFigureWidthInches(Math.round(parsed * 100) / 100);
      }
    }
  };

  const handleFigureWidthInputBlur = () => {
    const parsed = Number.parseFloat(figureWidthInput);
    const clamped = clampFigureWidthInches(
      Number.isNaN(parsed) ? figureWidthInches : parsed
    );
    setFigureWidthInches(clamped);
    setFigureWidthInput(String(clamped));
  };

  const handleToggleSuggestedKeyword = (phrase: string) => {
    const targetLower = phrase.trim().toLowerCase();
    const existing = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const existingIdx = existing.findIndex((k) => k.toLowerCase() === targetLower);

    if (existingIdx >= 0) {
      const updated = existing.filter((_, idx) => idx !== existingIdx).join(", ");
      setKeywords(updated);
      setPasteNotice(null);
      return;
    }

    const candidate =
      existing.length > 0 ? `${existing.join(", ")}, ${phrase}` : phrase;
    if (candidate.length > KEYWORDS_MAX_CHARS) {
      setPasteNotice(
        `Cannot add "${phrase}": keywords cannot exceed ${KEYWORDS_MAX_CHARS} characters.`
      );
      return;
    }
    setPasteNotice(null);
    setKeywords(candidate);
  };

  const handleLoadAbstractTxt = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const cleaned = raw.replace(/\r\n?/g, "\n").trim();
      if (countVisibleChars(cleaned) > ABSTRACT_MAX_CHARS) {
        const sliced = slicePreservingTags(cleaned, ABSTRACT_MAX_CHARS);
        setAbstractText(sliced.text);
        setPasteNotice(
          `Loaded "${file.name}" and trimmed ${sliced.truncatedChars} extra characters to fit ${ABSTRACT_MAX_CHARS.toLocaleString()} characters.`
        );
      } else {
        setAbstractText(cleaned);
        setPasteNotice(null);
      }
    } catch {
      setStageError("Unable to read text from the selected file.");
    } finally {
      if (abstractTxtInputRef.current) abstractTxtInputRef.current.value = "";
    }
  };

  // Stage 6: 300-DPI Figure Handler
  const handleGraphicChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGraphicError(null);
    setStageError(null);
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
      setRetainedSubmittedGraphic(null);
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
    setRetainedSubmittedGraphic(null);
    setGraphicMeta(null);
    setGraphicPreviewUrl("");
    setGraphicCaption("");
    setGraphicError(null);
    if (graphicInputRef.current) graphicInputRef.current.value = "";
  };

  const hasAttachedGraphic = Boolean(graphicFile || retainedSubmittedGraphic);
  const displayGraphicMeta = graphicMeta || retainedSubmittedGraphic;

  // Stage Validation & Navigation
  const validateStage = (stage: number): string | null => {
    if (stage === 1) {
      if (title.trim().length < 5) {
        return "Please enter the full presentation title (at least 5 characters).";
      }
      if (!correspondingEmail.trim() || !correspondingEmail.includes("@")) {
        return "Please enter a valid presenter corresponding email address.";
      }
      if (secondaryEmail.trim() && !secondaryEmail.includes("@")) {
        return "Secondary email must be a valid email address or left blank.";
      }
      return null;
    }

    if (stage === 2) {
      const validAffs = affiliations.filter((a) => a.institution.trim().length > 0);
      if (validAffs.length === 0) {
        return "Please enter at least one institution name.";
      }
      const missingLoc = validAffs.find((a) => !(a.location || "").trim());
      if (missingLoc) {
        return `Please enter the institute location (City, State/Country) for "${missingLoc.institution.trim()}".`;
      }
      return null;
    }

    if (stage === 3) {
      const validAuthors = authors.filter((a) => a.name.trim().length > 0);
      if (validAuthors.length === 0) {
        return "Please enter at least one presenter or co-author name.";
      }
      const selectedPresenters = validAuthors.filter((a) => a.isPresenter);
      if (selectedPresenters.length !== 1) {
        return "Exactly 1 author with a filled-in name must be selected as the Presenter.";
      }
      const validAffIds = new Set(
        affiliations
          .filter((a) => a.institution.trim().length > 0)
          .map((a) => a.id)
      );
      const unassigned = validAuthors.find((a) => !validAffIds.has(a.affiliationId));
      if (unassigned) {
        return `Please select an affiliation from the dropdown for "${unassigned.name.trim()}".`;
      }
      return null;
    }

    if (stage === 4) {
      if (summary.trim().length < 15) {
        return `Please enter a concise synopsis (at least 15 characters, max ${SYNOPSIS_MAX_CHARS}).`;
      }
      if (summary.length > SYNOPSIS_MAX_CHARS) {
        return `Synopsis cannot exceed ${SYNOPSIS_MAX_CHARS} characters.`;
      }
      return null;
    }

    if (stage === 5) {
      if (visibleAbstractChars < 50) {
        return "Please enter the abstract body (at least 50 visible characters, up to 3,000).";
      }
      if (visibleAbstractChars > ABSTRACT_MAX_CHARS) {
        return `Abstract body cannot exceed ${ABSTRACT_MAX_CHARS.toLocaleString()} visible characters.`;
      }
      if (
        figureWidthInches < MIN_FIGURE_WIDTH_IN ||
        figureWidthInches > MAX_FIGURE_WIDTH_IN
      ) {
        return `Desired figure width must be between ${MIN_FIGURE_WIDTH_IN} and ${MAX_FIGURE_WIDTH_IN} inches.`;
      }
      if (hasAttachedGraphic && !graphicCaption.trim()) {
        return "Figure caption is required (non-optional) whenever a graphic is attached.";
      }
      if (graphicCaption.length > CAPTION_MAX_CHARS) {
        return `Figure caption cannot exceed ${CAPTION_MAX_CHARS} characters.`;
      }
      return null;
    }

    if (stage === 6) {
      if (parsedKeywordTags.length === 0) {
        return "Please enter at least one keyword (comma-separated, up to 150 characters).";
      }
      if (keywords.length > KEYWORDS_MAX_CHARS) {
        return `Keywords must be under ${KEYWORDS_MAX_CHARS} characters.`;
      }
      if (presenterBio.trim().length < 20) {
        return "Please enter a presenter biography (at least 20 characters, max 500).";
      }
      if (presenterBio.length > BIO_MAX_CHARS) {
        return `Presenter biography must be under ${BIO_MAX_CHARS} characters.`;
      }
      return null;
    }

    return null;
  };

  const isStage5FigureValidationError = () =>
    figureWidthInches < MIN_FIGURE_WIDTH_IN ||
    figureWidthInches > MAX_FIGURE_WIDTH_IN ||
    Boolean(hasAttachedGraphic && !graphicCaption.trim()) ||
    graphicCaption.length > CAPTION_MAX_CHARS;

  const handleNextStage = () => {
    const err = validateStage(currentStage);
    if (err) {
      if (currentStage === 5 && isStage5FigureValidationError()) {
        setFigurePanelHidden(false);
      }
      setStageError(err);
      return;
    }
    setStageError(null);
    setCurrentStage((prev) => Math.min(7, prev + 1));
    scrollToWorkspaceTop();
  };

  const handlePrevStage = () => {
    setStageError(null);
    setCurrentStage((prev) => Math.max(1, prev - 1));
    scrollToWorkspaceTop();
  };

  const handleJumpToStage = (targetStage: number) => {
    if (targetStage <= currentStage) {
      setStageError(null);
      setCurrentStage(targetStage);
      scrollToWorkspaceTop();
      return;
    }
    for (let s = 1; s < targetStage; s++) {
      const err = validateStage(s);
      if (err) {
        if (s === 5 && isStage5FigureValidationError()) {
          setFigurePanelHidden(false);
        }
        setCurrentStage(s);
        setStageError(err);
        scrollToWorkspaceTop();
        return;
      }
    }
    setStageError(null);
    setCurrentStage(targetStage);
    scrollToWorkspaceTop();
  };

  const handleFinalSubmit = async () => {
    const freshDeadline = evaluateAbstractDeadline(workshop, Date.now());
    if (freshDeadline.isPastDeadline) {
      setStageError(
        `The abstract submission deadline (${freshDeadline.formattedDeadline}) has passed. New submissions and edits to submitted abstracts are now closed.`
      );
      scrollToWorkspaceTop();
      return;
    }

    for (let s = 1; s <= 6; s++) {
      const err = validateStage(s);
      if (err) {
        if (s === 5 && isStage5FigureValidationError()) {
          setFigurePanelHidden(false);
        }
        setCurrentStage(s);
        setStageError(err);
        scrollToWorkspaceTop();
        return;
      }
    }

    setStageError(null);
    setSubmitting(true);
    try {
      const validAffiliations = affiliations.filter(
        (a) => a.institution.trim().length > 0
      );
      const validAuthors = authors.filter((a) => a.name.trim().length > 0);
      const payload = {
        workshopYear: Number(workshop.workshop_year) || 2027,
        title,
        correspondingEmail,
        secondaryEmail: secondaryEmail.trim() || undefined,
        affiliations: validAffiliations,
        authors: validAuthors,
        presentationFormat,
        researchTrack,
        summary,
        abstractText,
        keywords,
        presenterBio,
        graphicCaption: hasAttachedGraphic ? graphicCaption : "",
        figureWidthInches: hasAttachedGraphic
          ? clampFigureWidthInches(figureWidthInches)
          : undefined,
        studentTravelAwardApplicant,
        deadline: freshDeadline.formattedDeadline,
        submittedByUid: user.uid,
        submittedByEmail: user.email,
      };
      const assetsPayload = {
        graphicFile,
        graphicMeta: graphicMeta
          ? {
              ...graphicMeta,
              widthInches: clampFigureWidthInches(figureWidthInches),
            }
          : null,
        keepExistingGraphic: !graphicFile && Boolean(retainedSubmittedGraphic),
      };

      if (editingSubmissionId) {
        const updated = await updateSubmission(
          editingSubmissionId,
          payload,
          assetsPayload
        );
        bypassUnloadGuardRef.current = true;
        guardPushedRef.current = false;
        setEditingSubmissionId(null);
        setRetainedSubmittedGraphic(null);
        setSubmittedConfirmation({ record: updated, isUpdate: true });
        setOverviewNotice(null);
        resetDraftFormFields();
        setViewMode("overview");
        scrollToWorkspaceTop();
      } else {
        const created = await createSubmission(payload, assetsPayload);
        if (activeDraftId) {
          await deleteDraftById(activeDraftId);
        }
        bypassUnloadGuardRef.current = true;
        guardPushedRef.current = false;
        setSubmittedConfirmation({ record: created, isUpdate: false });
        setOverviewNotice(null);
        resetDraftFormFields();
        setViewMode("overview");
        scrollToWorkspaceTop();
      }

      window.setTimeout(() => {
        bypassUnloadGuardRef.current = false;
      }, 300);
    } catch (err) {
      setStageError(
        err instanceof Error ? err.message : "Failed to save abstract submission."
      );
    } finally {
      setSubmitting(false);
    }
  };

  function resetDraftFormFields() {
    setCurrentStage(1);
    setTitle("");
    setCorrespondingEmail(user?.email || "");
    setSecondaryEmail("");
    setPresentationFormat("Oral Presentation");
    setAffiliations([{ id: "aff-1", institution: "", location: "" }]);
    setAuthors([
      {
        id: "auth-1",
        name: user?.name || "",
        affiliationId: "aff-1",
        isPresenter: true,
      },
    ]);
    setResearchTrack("Miniature & Ruggedized Hardware / Vacuum");
    setSummary("");
    setAbstractText("");
    setKeywords("");
    setPresenterBio("");
    setStudentTravelAwardApplicant(false);
    setFigurePanelHidden(false);
    setStageError(null);
    setPasteNotice(null);
    handleSetFigureWidth(DEFAULT_FIGURE_WIDTH_IN);
    handleRemoveGraphic();
  }

  const handleManualSaveDraft = async () => {
    await saveDraftNow();
    setPasteNotice("Draft saved locally and synced to your Presenter Overview.");
  };

  const handleDeleteActiveDraft = async () => {
    if (editingSubmissionId) return;
    if (
      !window.confirm(
        "Delete this abstract draft? This cannot be undone."
      )
    ) {
      return;
    }
    if (activeDraftId) {
      await deleteDraftById(activeDraftId);
    }
    bypassUnloadGuardRef.current = true;
    guardPushedRef.current = false;
    resetDraftFormFields();
    setViewMode("overview");
    scrollToWorkspaceTop();
    window.setTimeout(() => {
      bypassUnloadGuardRef.current = false;
    }, 300);
  };

  const handleReturnToOverview = async () => {
    if (editingSubmissionId) {
      if (
        !window.confirm(
          `Return to Presenter Overview without saving changes to ${editingSubmissionId}? Unsaved edits will be discarded.`
        )
      ) {
        return;
      }
      bypassUnloadGuardRef.current = true;
      guardPushedRef.current = false;
      setEditingSubmissionId(null);
      setRetainedSubmittedGraphic(null);
      resetDraftFormFields();
      setViewMode("overview");
      scrollToWorkspaceTop();
      window.setTimeout(() => {
        bypassUnloadGuardRef.current = false;
      }, 300);
      return;
    }

    await closeActiveDraft();
    bypassUnloadGuardRef.current = true;
    guardPushedRef.current = false;
    resetDraftFormFields();
    setViewMode("overview");
    scrollToWorkspaceTop();
    window.setTimeout(() => {
      bypassUnloadGuardRef.current = false;
    }, 300);
  };

  const handleCreateNewSubmission = () => {
    const fresh = evaluateAbstractDeadline(workshop, Date.now());
    if (fresh.isPastDeadline) {
      setOverviewNotice({
        tone: "amber",
        message: `Submission cutoff (${fresh.formattedDeadline}) has passed. Creating new submissions is closed.`,
      });
      return;
    }
    setOverviewNotice(null);
    setSubmittedConfirmation(null);
    setEditingSubmissionId(null);
    setRetainedSubmittedGraphic(null);
    resetDraftFormFields();
    startNewDraft();
    setViewMode("editor");
    scrollToWorkspaceTop();
  };

  const handleOpenDraftInEditor = async (draftId: string) => {
    if (graphicPreviewUrl && graphicPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(graphicPreviewUrl);
    }
    const hydrated = await openDraft(draftId);
    if (!hydrated) return;
    setOverviewNotice(null);
    setSubmittedConfirmation(null);
    setEditingSubmissionId(null);
    applyHydratedDraft(hydrated);
    setViewMode("editor");
    scrollToWorkspaceTop();
  };

  const handleCopyDraft = async (draftId: string) => {
    const cloned = await duplicateDraft(draftId);
    if (cloned) {
      setOverviewNotice({
        tone: "sky",
        message: `Created draft copy "${cloned.title}".`,
        actionDraftId: cloned.draftId,
      });
    }
  };

  const handleDeleteDraftFromOverview = async (draft: AbstractDraftRecord) => {
    const label = draft.title.trim() || "Untitled Abstract Draft";
    if (
      !window.confirm(
        `Delete draft "${label}"? This removes it permanently from your drafts list.`
      )
    ) {
      return;
    }
    await deleteDraftById(draft.draftId);
    setOverviewNotice({
      tone: "amber",
      message: `Deleted draft "${label}".`,
    });
  };

  const handleEditSubmission = async (sub: AbstractSubmissionRecord) => {
    const fresh = evaluateAbstractDeadline(workshop, Date.now());
    if (fresh.isPastDeadline) {
      setOverviewNotice({
        tone: "amber",
        message: `Editing submitted abstracts closed at ${fresh.formattedDeadline}.`,
      });
      return;
    }

    if (graphicPreviewUrl && graphicPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(graphicPreviewUrl);
    }
    await closeActiveDraft();
    const asset = await getSubmissionGraphicAsset(sub);

    const hydratedAffiliations: AffiliationEntry[] =
      sub.affiliations && sub.affiliations.length > 0
        ? sub.affiliations.map((a) => ({ ...a }))
        : [{ id: "aff-1", institution: sub.affiliation || "", location: "" }];

    const hydratedAuthors: AuthorEntry[] =
      sub.authors && sub.authors.length > 0
        ? sub.authors.map((a) => ({ ...a }))
        : [
            {
              id: "auth-1",
              name: sub.presentingAuthor || "",
              affiliationId: hydratedAffiliations[0]?.id || "aff-1",
              isPresenter: true,
            },
          ];

    const widthInches = clampFigureWidthInches(
      sub.graphic?.widthInches ?? DEFAULT_FIGURE_WIDTH_IN
    );

    setSubmittedConfirmation(null);
    setOverviewNotice(null);
    setEditingSubmissionId(sub.id);
    setCurrentStage(1);
    setTitle(sub.title || "");
    setCorrespondingEmail(sub.correspondingEmail || user.email || "");
    setSecondaryEmail(sub.secondaryEmail || "");
    setPresentationFormat(sub.presentationFormat || "Oral Presentation");
    setStudentTravelAwardApplicant(Boolean(sub.studentTravelAwardApplicant));
    setAffiliations(hydratedAffiliations);
    setAuthors(hydratedAuthors);
    setResearchTrack(
      sub.researchTrack || "Miniature & Ruggedized Hardware / Vacuum"
    );
    setSummary(sub.summary || "");
    setAbstractText(sub.abstractText || sub.summary || "");
    setFigureWidthInches(widthInches);
    setFigureWidthInput(String(widthInches));
    setGraphicCaption(sub.graphic?.caption || "");
    setFigurePanelHidden(false);
    setKeywords(sub.keywords || "");
    setPresenterBio(sub.presenterBio || "");
    setGraphicFile(asset.file);
    setGraphicPreviewUrl(asset.previewUrl);
    setRetainedSubmittedGraphic(asset.retainedMeta);
    setGraphicMeta(
      asset.retainedMeta
        ? {
            fileName: asset.retainedMeta.fileName,
            fileSizeBytes: asset.retainedMeta.fileSizeBytes,
            mimeType: asset.retainedMeta.mimeType,
            widthPx: asset.retainedMeta.widthPx,
            heightPx: asset.retainedMeta.heightPx,
            detectedDpi: asset.retainedMeta.detectedDpi,
            dpiSource: asset.retainedMeta.dpiSource,
          }
        : null
    );
    setGraphicError(null);
    setStageError(null);
    setPasteNotice(null);
    setViewMode("editor");
    scrollToWorkspaceTop();
  };

  const handleCopySubmissionToDraft = async (sub: AbstractSubmissionRecord) => {
    const fresh = evaluateAbstractDeadline(workshop, Date.now());
    if (fresh.isPastDeadline) {
      setOverviewNotice({
        tone: "amber",
        message: `Copying submitted abstracts closed at ${fresh.formattedDeadline}.`,
      });
      return;
    }

    const asset = await getSubmissionGraphicAsset(sub);
    const clonedDraft = await createDraftFromSubmission(sub, asset.file);
    if (asset.previewUrl && asset.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(asset.previewUrl);
    }
    if (clonedDraft) {
      setOverviewNotice({
        tone: "emerald",
        message: `Copied ${sub.id} into Submission Drafts as "${clonedDraft.title}".`,
        actionDraftId: clonedDraft.draftId,
      });
    }
  };

  const handleOpenSavedPreview = async (sub: AbstractSubmissionRecord) => {
    const graphicUrl = await getGraphicPreviewUrl(sub);
    setSavedPreviewItem({ sub, graphicUrl });
    scrollToWorkspaceTop();
  };

  const handleWithdraw = async (sub: AbstractSubmissionRecord) => {
    const fresh = evaluateAbstractDeadline(workshop, Date.now());
    if (fresh.isPastDeadline) {
      setOverviewNotice({
        tone: "amber",
        message: `Deleting submitted abstracts closed at ${fresh.formattedDeadline}.`,
      });
      return;
    }
    if (
      !window.confirm(
        `Delete submitted abstract ${sub.id} ("${sub.title}")? This will remove it permanently from your account and the Reviewer Panel.`
      )
    ) {
      return;
    }
    try {
      await withdrawSubmission(sub.id);
      if (savedPreviewItem?.sub.id === sub.id) {
        setSavedPreviewItem(null);
      }
      setOverviewNotice({
        tone: "amber",
        message: `Deleted submitted abstract ${sub.id}.`,
      });
    } catch (err) {
      setOverviewNotice({
        tone: "amber",
        message:
          err instanceof Error ? err.message : "Unable to delete submission.",
      });
    }
  };

  if (showPrintableGuidelines) {
    return (
      <PrintableFormattingGuidelines
        workshopOrdinal={workshop.workshop_ordinal}
        workshopWindow={workshop.target_window}
        workshopYear={Number(workshop.workshop_year) || 2027}
        deadline={deadlineInfo.formattedDeadline}
        studentAwardAmount={workshop.student_award_amount}
        onClose={() => {
          setShowPrintableGuidelines(false);
          scrollToWorkspaceTop();
        }}
      />
    );
  }

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
        secondaryEmail={sub.secondaryEmail}
        presentationFormat={sub.presentationFormat}
        researchTrack={sub.researchTrack}
        studentTravelAwardApplicant={sub.studentTravelAwardApplicant}
        synopsis={sub.summary}
        abstractText={sub.abstractText || sub.summary}
        keywords={sub.keywords}
        presenterBio={sub.presenterBio}
        graphicUrl={graphicUrl}
        graphicMeta={sub.graphic || null}
        graphicCaption={sub.graphic?.caption}
        figureWidthInches={sub.graphic?.widthInches}
        modeLabel={`Submitted Abstract ${sub.id} — Formatted Preview`}
        onClose={() => setSavedPreviewItem(null)}
      />
    );
  }

  const isRightWrappedWidth = isRightWrappedFigureWidth(figureWidthInches);
  const figurePctOfTextCol = Math.min(
    100,
    Math.max(46.15, (figureWidthInches / PRINTABLE_TEXT_WIDTH_IN) * 100)
  );
  const effectiveDpiAtWidth =
    graphicMeta && graphicMeta.dpiSource !== "vector" && figureWidthInches > 0
      ? Math.round(graphicMeta.widthPx / figureWidthInches)
      : null;

  const renderFigureWidthControl = (idPrefix: string) => (
    <div className="bg-white border border-slate-300/90 rounded-xl p-4 space-y-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`${idPrefix}-fig-width-number`}
          className="hems-label mb-0 flex items-center gap-1.5"
        >
          <Ruler size={14} className="text-primary" />
          Desired Figure Width ({MIN_FIGURE_WIDTH_IN}&ndash;{MAX_FIGURE_WIDTH_IN} inches)
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 tabular-nums">
          <span
            className={`px-2.5 py-0.5 rounded-full border ${
              isRightWrappedWidth
                ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                : "bg-slate-100 text-slate-800 border-slate-300"
            }`}
          >
            {isRightWrappedWidth
              ? `Right of Text • Squared Wrap (<${RIGHT_WRAP_THRESHOLD_IN}")`
              : `Centered Block (≥${RIGHT_WRAP_THRESHOLD_IN}")`}
          </span>
          <span className="bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded-full">
            {figureWidthInches.toFixed(2)}&quot; ({Math.round(figurePctOfTextCol)}% of 6.5&quot; margin width)
          </span>
          {effectiveDpiAtWidth !== null && (
            <span
              className={`px-2.5 py-0.5 rounded-full border ${
                effectiveDpiAtWidth >= MIN_GRAPHIC_DPI
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              Effective print res: ~{effectiveDpiAtWidth} DPI
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          id={`${idPrefix}-fig-width-range`}
          type="range"
          min={MIN_FIGURE_WIDTH_IN}
          max={MAX_FIGURE_WIDTH_IN}
          step={0.1}
          value={figureWidthInches}
          onChange={(e) => handleSetFigureWidth(Number.parseFloat(e.target.value))}
          aria-label="Desired figure width slider in inches"
          className="flex-1 accent-sky-700 cursor-pointer"
        />
        <div className="flex items-center gap-2 shrink-0">
          <input
            id={`${idPrefix}-fig-width-number`}
            type="number"
            min={MIN_FIGURE_WIDTH_IN}
            max={MAX_FIGURE_WIDTH_IN}
            step={0.1}
            value={figureWidthInput}
            onChange={(e) => handleFigureWidthInputChange(e.target.value)}
            onBlur={handleFigureWidthInputBlur}
            className="hems-control w-24 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-right"
          />
          <span className="text-xs font-bold text-slate-700">in</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-500 mr-1">
          Presets:
        </span>
        {[
          { label: '3.25" Right-Wrap (<3.5")', value: 3.25 },
          { label: '3.50" Centered Block', value: 3.5 },
          { label: '4.50" Standard', value: 4.5 },
          { label: '6.50" Full 1"-Margin Width', value: 6.5 },
        ].map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handleSetFigureWidth(preset.value)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
              Math.abs(figureWidthInches - preset.value) < 0.06
                ? "bg-primary text-white border-primary"
                : "bg-slate-50 text-slate-800 border-slate-300 hover:border-primary hover:text-primary"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-[1020px] mx-auto min-w-0 print:max-w-none">
      {/* Page Header */}
      <header className="print:hidden border-b border-slate-200 pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium mb-2.5 shadow-2xs">
            <Upload size={13} className="text-primary shrink-0" />
            <span>
              Attendees Portal • {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window})
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
            Abstract <span className="text-primary italic font-normal">Submission</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            {viewMode === "overview" ? (
              <>
                Presenter Overview: start a new submission, manage auto-saved drafts, or preview, edit, copy, and delete submitted abstracts before the submission deadline.
              </>
            ) : (
              <>
                Complete the 7-stage submission wizard below using <strong>Next</strong> / <strong>Back</strong> navigation. Word copy-paste (equations &amp; formatting) is supported in every field.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {viewMode === "editor" && (
            <>
              <button
                type="button"
                onClick={() => void handleReturnToOverview()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={13} />
                <span>Presenter Overview</span>
              </button>
              {draftStatus.state === "saving" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900">
                  <Loader2 size={12} className="animate-spin text-primary" />
                  Saving draft...
                </span>
              )}
              {draftStatus.state === "synced_cloud" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 tabular-nums">
                  <Cloud size={13} className="text-emerald-600" />
                  Draft saved &amp; synced
                  {draftStatus.savedAt ? ` • ${formatDraftTime(draftStatus.savedAt)}` : ""}
                </span>
              )}
              {draftStatus.state === "saved_local" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 tabular-nums">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Draft auto-saved
                  {draftStatus.savedAt ? ` • ${formatDraftTime(draftStatus.savedAt)}` : ""}
                </span>
              )}
              {!editingSubmissionId && (hasDraftContent || activeDraftId) && (
                <>
                  <button
                    type="button"
                    disabled={draftStatus.state === "saving" || submitting}
                    onClick={() => void handleManualSaveDraft()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary disabled:opacity-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Save size={13} className="text-primary" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleDeleteActiveDraft()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-red-400 hover:text-red-600 disabled:opacity-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Trash2 size={12} />
                    <span>Delete Draft</span>
                  </button>
                </>
              )}
              {isDirty && draftStatus.state === "idle" && (
                <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  Unsaved changes (Back-navigation guarded)
                </span>
              )}
            </>
          )}
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-semibold text-primary break-all">
            Attendee: {user.email}
          </div>
        </div>
      </header>

      {/* Top Full-Width Formatting & Submission Limits Info Box + Printable Version Button */}
      <section className="print:hidden bg-white border border-slate-200/95 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 leading-tight">
                  Formatting Rules, Input Parameters &amp; Submission Limits
                </h2>
                {deadlineInfo.isPastDeadline ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                    <Lock size={11} />
                    Submission Window Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <Clock size={11} />
                    Open Until Deadline
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                Deadline: <strong className="text-slate-800">{deadlineInfo.formattedDeadline}</strong> • Formatted to 8.5&quot; × 11&quot; with 1&quot; margins (6.5&quot; text width; 1–2 pages)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowPrintableGuidelines(true);
                scrollToWorkspaceTop();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer size={14} className="text-primary" />
              <span>Printable Version</span>
            </button>
            <button
              type="button"
              onClick={() => setInfoExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              {infoExpanded ? (
                <>
                  <span>Hide Specs</span>
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  <span>Show Specs</span>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {infoExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-xl p-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                Stages 1–3
              </span>
              <span className="block font-semibold text-slate-800 mt-0.5">
                1 Presenter &amp; Unlimited Authors
              </span>
              <span className="block text-[11px] text-slate-500">
                Unlimited institutes w/ locations &amp; single presenter selection
              </span>
            </div>
            <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-xl p-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                Stage 4 Synopsis
              </span>
              <span className="block font-semibold text-slate-800 mt-0.5 tabular-nums">
                Max {SYNOPSIS_MAX_CHARS} chars
              </span>
              <span className="block text-[11px] text-slate-500">
                Headline summary w/ spaces
              </span>
            </div>
            <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-xl p-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                Stage 5 Abstract &amp; Figure
              </span>
              <span className="block font-semibold text-slate-800 mt-0.5 tabular-nums">
                Max {ABSTRACT_MAX_CHARS.toLocaleString()} chars • {MIN_GRAPHIC_DPI} DPI
              </span>
              <span className="block text-[11px] text-slate-500">
                Italic <em>m/z</em>, [FIGURE] marker (&lt;3.5&quot; right-wrap / ≥3.5&quot; centered) &amp; caption (≤{CAPTION_MAX_CHARS}); figure may be used on website
              </span>
            </div>
            <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-xl p-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                Stages 6–7 Output
              </span>
              <span className="block font-semibold text-slate-800 mt-0.5 tabular-nums">
                Keywords &lt;{KEYWORDS_MAX_CHARS} • Bio &lt;{BIO_MAX_CHARS}
              </span>
              <span className="block text-[11px] text-slate-500">
                Suggested keywords + 8.5&quot;×11&quot; (1&quot; margin, 1–2 page) preview
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Submission Confirmation Banner */}
      {submittedConfirmation && (
        <div
          role="status"
          className="print:hidden bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded tabular-nums">
                  {submittedConfirmation.record.id}
                </span>
                <span className="text-sm font-bold text-emerald-950">
                  {submittedConfirmation.isUpdate
                    ? "Submitted Abstract Updated & Synced to Reviewer Panel"
                    : "Abstract Submitted & Routed to Reviewer Panel"}
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                <strong>
                  <ScientificText text={submittedConfirmation.record.title} />
                </strong>{" "}
                is now saved and ready for review.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => void handleOpenSavedPreview(submittedConfirmation.record)}
              className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-900 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Eye size={13} /> Show Formatted Preview
            </button>
            {hasReviewerRole(user.roles) && (
              <Link
                href="/reviewer"
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <ClipboardCheck size={14} /> Reviewer Panel <ArrowRight size={13} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSubmittedConfirmation(null)}
              aria-label="Dismiss submission confirmation"
              className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Presenter Overview / Draft Action Notice */}
      {overviewNotice && (
        <div
          role="status"
          className={`print:hidden rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs border ${
            overviewNotice.tone === "emerald"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : overviewNotice.tone === "amber"
              ? "bg-amber-50 border-amber-200 text-amber-950"
              : "bg-sky-50 border-sky-200 text-sky-950"
          }`}
        >
          <div className="flex items-start sm:items-center gap-2">
            <Cloud size={15} className="text-primary shrink-0 mt-0.5 sm:mt-0" />
            <span>{overviewNotice.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {overviewNotice.actionDraftId && viewMode === "overview" && (
              <button
                type="button"
                onClick={() => void handleOpenDraftInEditor(overviewNotice.actionDraftId!)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-[11px] font-semibold text-slate-800 transition-colors cursor-pointer"
              >
                <span>Open Draft in Editor</span>
                <ArrowRight size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOverviewNotice(null)}
              aria-label="Dismiss notice"
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-black/5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Full-Width Presenter Overview + 7-Stage Progress Stepper */}
      <nav aria-label="Abstract submission stages" className="print:hidden">
        <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <li>
            <button
              type="button"
              onClick={() => {
                if (viewMode === "editor") {
                  void handleReturnToOverview();
                }
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-2 ${
                viewMode === "overview"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0 ${
                  viewMode === "overview"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                0
              </span>
              <span className="text-xs font-semibold truncate">Overview</span>
            </button>
          </li>
          {WORKFLOW_STAGES.map((st) => {
            const isActive = viewMode === "editor" && st.id === currentStage;
            const isCompleted = viewMode === "editor" && st.id < currentStage;
            return (
              <li key={st.id}>
                <button
                  type="button"
                  disabled={viewMode === "overview"}
                  title={
                    viewMode === "overview"
                      ? "Click Create New Submission or open a draft to enter Stages 1–7"
                      : `Jump to Stage ${st.id}: ${st.title}`
                  }
                  onClick={() => handleJumpToStage(st.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors flex items-center gap-2 ${
                    viewMode === "overview"
                      ? "bg-slate-50 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-75"
                      : isActive
                      ? "bg-primary text-white border-primary shadow-xs cursor-pointer"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400 cursor-pointer"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary cursor-pointer"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white text-primary"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isCompleted ? "✓" : st.id}
                  </span>
                  <span className="text-xs font-semibold truncate">{st.shortLabel}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* STAGE 0: PRESENTER OVERVIEW HUB */}
      {viewMode === "overview" && (
        <div className="print:hidden space-y-6">
          {/* Submission Deadline & Create New Submission Hero */}
          <section className="bg-white border-2 border-slate-200/95 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Calendar size={13} />
                  Presenter Overview Hub • Stage 0
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
                  Manage Your Submissions &amp; Drafts
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Start a new submission, resume or duplicate saved drafts anytime, and edit, copy, or delete submitted abstracts up until the published submission cutoff.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  disabled={deadlineInfo.isPastDeadline}
                  onClick={handleCreateNewSubmission}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-sky-800 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  {deadlineInfo.isPastDeadline ? (
                    <>
                      <Lock size={16} />
                      <span>Submission Window Closed</span>
                    </>
                  ) : (
                    <>
                      <FilePlus2 size={17} />
                      <span>Create New Submission</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Structured Date, Time & Timezone Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
              <div className="rounded-xl bg-[#FAFBFD] border border-slate-200 px-4 py-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Submission Deadline Date
                </span>
                <span className="block text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                  {deadlineInfo.dateLabel}
                </span>
              </div>
              <div className="rounded-xl bg-[#FAFBFD] border border-slate-200 px-4 py-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Exact Cutoff Time
                </span>
                <span className="block text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                  {deadlineInfo.timeLabel}
                </span>
              </div>
              <div className="rounded-xl bg-[#FAFBFD] border border-slate-200 px-4 py-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Official Timezone
                </span>
                <span className="block text-sm font-bold text-slate-900 mt-0.5">
                  {deadlineInfo.timezoneLabel}
                </span>
              </div>
            </div>

            {deadlineInfo.isPastDeadline && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5"
              >
                <Lock size={16} className="text-red-700 shrink-0 mt-0.5" />
                <span>
                  The abstract submission cutoff (<strong>{deadlineInfo.formattedDeadline}</strong>) has passed. Formatted previews of your submitted abstracts remain available below, while creating, editing, copying, and deleting submissions are locked.
                </span>
              </div>
            )}
          </section>

          {/* Drafts Drawer */}
          <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Edit3 size={18} className="text-primary" />
                  <span>Submission Drafts</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  In-progress abstracts auto-saved locally and synced to your Firestore attendee account.
                </p>
              </div>
              <span className="tabular-nums text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900">
                {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
              </span>
            </div>

            {loadingDrafts ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Loading your saved drafts...</span>
              </div>
            ) : drafts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center space-y-2">
                <p className="text-xs sm:text-sm text-slate-600">
                  No saved drafts yet. Start a new abstract or copy an existing submission into a draft.
                </p>
                {!deadlineInfo.isPastDeadline && (
                  <button
                    type="button"
                    onClick={handleCreateNewSubmission}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <FilePlus2 size={13} />
                    <span>Create your first draft</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {drafts.map((draft) => {
                  const cleanTitle = draft.title?.trim() || "Untitled Draft Abstract";
                  const stageInfo = WORKFLOW_STAGES[Math.max(0, Math.min(WORKFLOW_STAGES.length - 1, (draft.currentStage || 1) - 1))];
                  return (
                    <div
                      key={draft.draftId}
                      className="p-4 rounded-xl bg-[#FAFBFD] border border-slate-200/95 flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200 tabular-nums">
                            Stage {draft.currentStage || 1} of {WORKFLOW_STAGES.length} • {stageInfo?.shortLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 tabular-nums">
                            <Clock size={11} />
                            {formatTimestampBadge(draft.updatedAt || draft.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          <ScientificText text={cleanTitle} />
                        </h4>

                        <p className="text-[11px] text-slate-500 truncate">
                          {draft.presentationFormat || "Format pending"}
                          {draft.graphicMeta ? ` • Graphic (${draft.graphicMeta.detectedDpi} DPI)` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => void handleOpenDraftInEditor(draft.draftId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white hover:bg-sky-800 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit Draft</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCopyDraft(draft.draftId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteDraftFromOverview(draft)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors cursor-pointer ml-auto"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Submitted Abstracts Drawer */}
          <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-emerald-700" />
                  <span>Submitted Abstracts</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live in the Reviewer Panel. Edit, copy, or delete submitted abstracts up until{" "}
                  <strong className="text-slate-700">{deadlineInfo.formattedDeadline}</strong>.
                </p>
              </div>
              <span className="tabular-nums text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {mySubmissions.length} submitted
              </span>
            </div>

            {listLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Loading your submitted abstracts...</span>
              </div>
            ) : mySubmissions.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed py-2">
                You have not submitted an abstract yet for the {workshop.workshop_ordinal} HEMS Workshop. Click{" "}
                <strong>Create New Submission</strong> above to begin Stage 1.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mySubmissions.map((sub) => {
                  const locked = deadlineInfo.isPastDeadline;
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-[#FAFBFD] border border-slate-200/95 flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-2">
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

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          <ScientificText text={sub.title} />
                        </h4>

                        <p className="text-[11px] text-slate-500 truncate">
                          {sub.presentationFormat}
                          {sub.graphic ? ` • Figure (${sub.graphic.detectedDpi} DPI)` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => void handleOpenSavedPreview(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          disabled={locked}
                          title={
                            locked
                              ? `Editing locked after ${deadlineInfo.formattedDeadline}`
                              : "Edit this submitted abstract"
                          }
                          onClick={() => void handleEditSubmission(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                        >
                          {locked ? <Lock size={11} /> : <Edit3 size={12} />}
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          disabled={locked}
                          title={
                            locked
                              ? `Copying locked after ${deadlineInfo.formattedDeadline}`
                              : "Copy into a new editable draft"
                          }
                          onClick={() => void handleCopySubmissionToDraft(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                        >
                          {locked ? <Lock size={11} /> : <Copy size={12} />}
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          disabled={locked}
                          title={
                            locked
                              ? `Deletion locked after ${deadlineInfo.formattedDeadline}`
                              : "Delete submitted abstract"
                          }
                          onClick={() => void handleWithdraw(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-red-600 transition-colors cursor-pointer ml-auto"
                        >
                          {locked ? <Lock size={11} /> : <Trash2 size={12} />}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* STAGES 1–7: 1-Inch Margin Calibrated Stage Sheet (1,020px outer = 8.5" @ 120 px/in; Stages 1-6 use 828px interior -> 780px = 6.5" text col; Stage 7 renders full 1,020px sheet directly) */}
      {viewMode === "editor" && (
      <section
        className={
          currentStage === 7
            ? "w-full space-y-6"
            : "w-full bg-[#F3F6FA] border border-slate-300 rounded-2xl px-4 sm:px-8 lg:px-[94px] py-6 sm:py-8 shadow-xs space-y-6 print:hidden"
        }
      >
        <div
          className={
            currentStage === 7
              ? "print:hidden bg-[#F3F6FA] border border-slate-300 rounded-2xl px-4 sm:px-8 py-6 shadow-xs space-y-4"
              : "print:hidden space-y-4"
          }
        >
          {/* Active Editor Mode & Deadline Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            {editingSubmissionId ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold">
                <Edit3 size={12} className="text-amber-700" />
                Editing Submitted Abstract ({editingSubmissionId})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold">
                <FilePlus2 size={12} className="text-primary" />
                New Draft Session
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 tabular-nums">
              <Clock size={12} className="text-primary" />
              Cutoff: <strong className="text-slate-800">{deadlineInfo.formattedDeadline}</strong>
            </span>
          </div>

          {deadlineInfo.isPastDeadline && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
            >
              <Lock size={14} className="shrink-0" />
              <span>
                The submission cutoff ({deadlineInfo.formattedDeadline}) has passed; final submission is locked.
              </span>
            </div>
          )}

          <div className="space-y-3 border-b border-slate-200 pb-4">
            {/* Pro-tip directly above Stage Titles */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] text-sky-950 flex items-center gap-2 shadow-2xs">
              <Sparkles size={15} className="text-primary shrink-0" />
              <span>
                <strong className="font-bold text-primary">Pro-tip:</strong> Copy paste from Word to include special characters, super/subscripts, and equations.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary tabular-nums">
                  Stage {currentStage} of {WORKFLOW_STAGES.length} • 1&quot;-Margin Sheet Calibration (1,020px Page / 780px Measure)
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5">
                  {WORKFLOW_STAGES[currentStage - 1]?.title}
                </h2>
              </div>
              {currentStage === 7 && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-slate-300 bg-white hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  <Printer size={14} className="text-primary" />
                  <span>Print / Save Formatted PDF</span>
                </button>
              )}
            </div>
          </div>

          {stageError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{stageError}</span>
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
        </div>

        {/* STAGE 1: Title, Emails, Format & Student Opt-In */}
        {currentStage === 1 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="abs-title" className={LABEL_CLASS}>
                Presentation Title <span className="text-red-600">*</span>
              </label>
              <input
                id="abs-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onPaste={(e) =>
                  applyWordPasteToField(e, title, setTitle, { multiline: false })
                }
                placeholder="e.g., Subsea Membrane-Inlet Mass Spectrometry of Dissolved CO₂ & C₁–C₇ Hydrocarbons"
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="abs-email" className={LABEL_CLASS}>
                  Presenter&apos;s Corresponding Email <span className="text-red-600">*</span>
                </label>
                <input
                  id="abs-email"
                  type="email"
                  value={correspondingEmail}
                  onChange={(e) => setCorrespondingEmail(e.target.value)}
                  onPaste={(e) =>
                    applyWordPasteToField(e, correspondingEmail, setCorrespondingEmail, {
                      multiline: false,
                    })
                  }
                  placeholder="presenter@institution.edu"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="abs-secondary-email" className={LABEL_CLASS}>
                  Secondary Email (Optional)
                </label>
                <input
                  id="abs-secondary-email"
                  type="email"
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  onPaste={(e) =>
                    applyWordPasteToField(e, secondaryEmail, setSecondaryEmail, {
                      multiline: false,
                    })
                  }
                  placeholder="backup.contact@institution.edu"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="abs-format" className={LABEL_CLASS}>
                  Preferred Format <span className="text-red-600">*</span>
                </label>
                <select
                  id="abs-format"
                  value={presentationFormat}
                  onChange={(e) =>
                    setPresentationFormat(e.target.value as PresentationFormat)
                  }
                  className={INPUT_CLASS}
                >
                  {PRESENTATION_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Student Opt-In Button */}
            <div className="pt-2">
              <span className={LABEL_CLASS}>
                Graduate Student Travel Award Consideration ({workshop.student_award_amount})
              </span>
              <button
                type="button"
                aria-pressed={studentTravelAwardApplicant}
                onClick={() => setStudentTravelAwardApplicant((prev) => !prev)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  studentTravelAwardApplicant
                    ? "bg-teal-50 border-secondary text-slate-900 shadow-2xs"
                    : "bg-white border-slate-300 hover:border-primary text-slate-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      studentTravelAwardApplicant
                        ? "bg-secondary text-white"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {studentTravelAwardApplicant
                        ? "Opted In: Applying for Student Travel Award"
                        : "Opt In for Graduate Student Travel Award (Click to Enable)"}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Full-time M.S., M.A., or Ph.D. students presenting in person are eligible. Supporting student &amp; faculty advisor letters follow{" "}
                      <Link
                        href="/student-awards"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary font-semibold hover:underline"
                      >
                        Student Award Guidelines
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <span
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 self-start sm:self-center ${
                    studentTravelAwardApplicant
                      ? "bg-secondary text-white"
                      : "bg-slate-100 border border-slate-300 text-slate-800"
                  }`}
                >
                  {studentTravelAwardApplicant ? "Opted In ✓" : "Opt In"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: Unlimited Affiliations & Locations */}
        {currentStage === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Add every participating institution along with its city/state/country location. You will assign authors to these affiliations in Stage 3.
              </p>
              <button
                type="button"
                onClick={handleAddAffiliation}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white hover:bg-sky-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={14} />
                <span>Add Affiliation</span>
              </button>
            </div>

            <div className="space-y-3">
              {affiliations.map((aff, index) => (
                <div
                  key={aff.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-[#FAFBFD] border border-slate-300/90 rounded-xl p-3.5 sm:p-4 shadow-2xs"
                >
                  <div className="md:col-span-1 flex items-center gap-2 pb-1.5">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center tabular-nums">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="md:col-span-6">
                    <label className={LABEL_CLASS}>
                      Institute / Organization <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={aff.institution}
                      onChange={(e) =>
                        handleUpdateAffiliation(aff.id, "institution", e.target.value)
                      }
                      onPaste={(e) =>
                        applyWordPasteToField(
                          e,
                          aff.institution,
                          (val) => handleUpdateAffiliation(aff.id, "institution", val),
                          { multiline: false }
                        )
                      }
                      placeholder={`Institution #${index + 1} (e.g., Woods Hole Oceanographic Institution)`}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className={LABEL_CLASS}>
                      Institute Location <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={aff.location || ""}
                      onChange={(e) =>
                        handleUpdateAffiliation(aff.id, "location", e.target.value)
                      }
                      onPaste={(e) =>
                        applyWordPasteToField(
                          e,
                          aff.location || "",
                          (val) => handleUpdateAffiliation(aff.id, "location", val),
                          { multiline: false }
                        )
                      }
                      placeholder="City, State/Province, Country"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end pb-1">
                    {affiliations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAffiliation(aff.id)}
                        aria-label={`Remove affiliation ${index + 1}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 3: Single Presenter & Unlimited Co-Authors with Affiliation Dropdown */}
        {currentStage === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Select <strong>1 Presenter</strong> using the radio selector and add any co-authors in presentation order. Only 1 presenter is permitted per abstract (underlined on the formatted sheet).
              </p>
              <button
                type="button"
                onClick={handleAddCoAuthor}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white hover:bg-sky-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <UserPlus size={14} />
                <span>Add Co-Author</span>
              </button>
            </div>

            <div className="space-y-3">
              {authors.map((author, index) => (
                <div
                  key={author.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl p-3.5 sm:p-4 border transition-colors ${
                    author.isPresenter
                      ? "bg-sky-50/75 border-primary/55 shadow-2xs"
                      : "bg-[#FAFBFD] border-slate-300/90 shadow-2xs"
                  }`}
                >
                  <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-6 text-center shrink-0 tabular-nums">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <label className="hems-label">
                        {author.isPresenter ? (
                          <>
                            Presenter Name <span className="text-red-600">*</span>
                          </>
                        ) : (
                          `Co-Author #${index + 1}`
                        )}
                      </label>
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
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5 min-w-0">
                    <label className="hems-label">
                      Institutional Affiliation
                    </label>
                    <select
                      value={author.affiliationId}
                      aria-label={`Affiliation for author ${index + 1}`}
                      onChange={(e) =>
                        handleUpdateAuthorAffiliation(author.id, e.target.value)
                      }
                      className={INPUT_CLASS}
                    >
                      {affiliations.map((aff, affIdx) => (
                        <option key={aff.id} value={aff.id}>
                          {affIdx + 1}.{" "}
                          {aff.institution.trim()
                            ? `${aff.institution.trim()}${
                                aff.location?.trim() ? ` — ${aff.location.trim()}` : ""
                              }`
                            : `Affiliation #${affIdx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-5">
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-950 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="hems-single-presenter"
                        checked={author.isPresenter}
                        onChange={() => handleSelectSinglePresenter(author.id)}
                        className="h-4 w-4 border-slate-400 text-primary focus:ring-primary"
                      />
                      <span>Presenter</span>
                    </label>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(author.id)}
                        aria-label={`Remove author ${index + 1}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 4: Technical Track & 300-Char Synopsis */}
        {currentStage === 4 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="abs-track" className={LABEL_CLASS}>
                Technical Research Track <span className="text-red-600">*</span>
              </label>
              <select
                id="abs-track"
                value={researchTrack}
                onChange={(e) => setResearchTrack(e.target.value as ResearchTrack)}
                className={INPUT_CLASS}
              >
                {RESEARCH_TRACK_OPTIONS.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="abs-summary"
                  className="hems-label mb-0"
                >
                  Short Synopsis{" "}
                  <span className="hems-label-hint">({SYNOPSIS_MAX_CHARS} chars max)</span>{" "}
                  <span className="text-red-600">*</span>
                </label>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    summary.length >= SYNOPSIS_MAX_CHARS
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}
                >
                  {summary.length} / {SYNOPSIS_MAX_CHARS} chars
                </span>
              </div>
              <textarea
                id="abs-summary"
                rows={4}
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
                          `Word paste normalized and trimmed ${trimmed} characters to fit the ${SYNOPSIS_MAX_CHARS}-character Synopsis limit.`
                        );
                      }
                    }
                  )
                }
                placeholder={`Write a concise headline synopsis (maximum ${SYNOPSIS_MAX_CHARS} characters including spaces)...`}
                className={`${INPUT_CLASS} leading-relaxed`}
              />
            </div>
          </div>
        )}

        {/* STAGE 5: Collapsible Figure Input (Top w/ Website Warning) + 3,000-Char Raw Input + Live Preview */}
        {currentStage === 5 && (
          <div className="space-y-5">
            {/* 1. Figure Upload & Width Interface Card (Above Raw Text Input + Hide Toggle + Website Warning) */}
            <div className="bg-white border-2 border-slate-300/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="hems-label mb-0 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-primary" />
                    Optional High-Resolution Figure ({MIN_GRAPHIC_DPI} DPI Min) &amp; Width Control
                  </h3>
                  {figurePanelHidden ? (
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {hasAttachedGraphic
                        ? `${graphicFile?.name || "Attached submission figure"} • ${figureWidthInches.toFixed(2)}" (${
                            isRightWrappedWidth ? "Right-wrap <3.5\"" : "Centered ≥3.5\""
                          }) • Note: Figure may be used on the HEMS website`
                        : `Hidden • Optional figure (${figureWidthInches.toFixed(2)}" ${
                            isRightWrappedWidth ? "right-wrap" : "centered"
                          }) • Note: Submitted figures may be used on the HEMS website`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Widths &lt; {RIGHT_WRAP_THRESHOLD_IN}&quot; float to the right of text with squared wrapping; ≥ {RIGHT_WRAP_THRESHOLD_IN}&quot; render centered.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setFigurePanelHidden((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  {figurePanelHidden ? (
                    <>
                      <Eye size={14} />
                      <span>Show Figure Input</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} />
                      <span>Hide</span>
                    </>
                  )}
                </button>
              </div>

              {!figurePanelHidden && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  {/* Website Usage Warning */}
                  <div
                    role="note"
                    className="bg-amber-50 border border-amber-300 text-amber-950 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2.5"
                  >
                    <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Website Usage Warning:</strong> Uploaded figures and captions may be used on the HEMS website (such as workshop highlights, technical program pages, or online proceedings). Please only upload graphics cleared for public web display.
                    </span>
                  </div>

                  {graphicError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{graphicError}</span>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-slate-300 hover:border-primary/70 rounded-2xl p-5 sm:p-6 bg-slate-50/40 transition-colors space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                          <ImageIcon size={22} />
                        </div>
                        <div className="min-w-0">
                          {checkingGraphic ? (
                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Loader2 size={15} className="animate-spin text-primary" />
                              Checking graphic resolution ({MIN_GRAPHIC_DPI} DPI minimum)...
                            </p>
                          ) : hasAttachedGraphic && displayGraphicMeta ? (
                            <>
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {graphicFile?.name || "Existing Submitted Figure (Retained)"}
                              </p>
                              <p className="text-xs text-emerald-700 font-semibold tabular-nums mt-0.5">
                                Verified {displayGraphicMeta.detectedDpi} DPI ({displayGraphicMeta.dpiSource}) •{" "}
                                {displayGraphicMeta.widthPx}×{displayGraphicMeta.heightPx} px
                                {graphicFile ? ` • ${formatFileSize(graphicFile.size)}` : " • Retained from submission"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-900">
                                Upload Scientific Figure ({MIN_GRAPHIC_DPI} DPI Minimum — Optional)
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Accepted: PNG, JPEG, WebP (≥{MIN_GRAPHIC_DPI} DPI metadata at ≥600×300 px, or ≥900 px wide) or clean vector SVG.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasAttachedGraphic && (
                          <button
                            type="button"
                            onClick={handleRemoveGraphic}
                            className="px-3.5 py-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            Remove Graphic
                          </button>
                        )}
                        <label
                          htmlFor="abs-graphic-upload"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Upload size={14} />
                          <span>{hasAttachedGraphic ? "Replace Graphic" : "Choose Graphic"}</span>
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

                    {graphicPreviewUrl && hasAttachedGraphic && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center">
                        <img
                          src={graphicPreviewUrl}
                          alt="Uploaded 300-DPI abstract figure preview"
                          style={{ width: `${figurePctOfTextCol.toFixed(2)}%` }}
                          className="max-h-72 object-contain rounded mx-auto transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Desired Figure Width Input (3.0 to 6.5 inches) */}
                  {renderFigureWidthControl("stage5")}

                  {/* Non-Optional Caption Input (<= 300 chars whenever figure is attached) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="abs-graphic-caption"
                        className="hems-label mb-0"
                      >
                        Figure Caption{" "}
                        {hasAttachedGraphic ? (
                          <span className="text-red-600">
                            * (Required whenever a graphic is attached)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">
                            (Required if uploading a figure above)
                          </span>
                        )}
                      </label>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          graphicCaption.length >= CAPTION_MAX_CHARS
                            ? "text-amber-600"
                            : "text-slate-600"
                        }`}
                      >
                        {graphicCaption.length} / {CAPTION_MAX_CHARS} chars
                      </span>
                    </div>
                    <textarea
                      id="abs-graphic-caption"
                      rows={3}
                      maxLength={CAPTION_MAX_CHARS}
                      value={graphicCaption}
                      onChange={(e) => setGraphicCaption(e.target.value)}
                      onPaste={(e) =>
                        applyWordPasteToField(
                          e,
                          graphicCaption,
                          setGraphicCaption,
                          { multiline: false, maxChars: CAPTION_MAX_CHARS },
                          (trimmed) => {
                            if (trimmed > 0) {
                              setPasteNotice(
                                `Word paste trimmed ${trimmed} characters to fit the ${CAPTION_MAX_CHARS}-character caption limit.`
                              );
                            }
                          }
                        )
                      }
                      placeholder="Describe your mass spectrum, instrument layout, or field calibration plot (300 characters max)..."
                      className={`${INPUT_CLASS} leading-relaxed`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Raw Abstract Input Text & Formatting / [FIGURE] Marker Toolbar */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label
                    htmlFor="abs-body"
                    className="hems-label mb-0"
                  >
                    Raw Abstract Input Text (Up to {ABSTRACT_MAX_CHARS.toLocaleString()} Chars With Spaces){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Inline tags (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;sub&gt;</code>, <code>&lt;sup&gt;</code>) and <code>[FIGURE]</code> do not count toward your 3,000-character budget.{" "}
                    {isRightWrappedWidth
                      ? `Because width is < ${RIGHT_WRAP_THRESHOLD_IN}", [FIGURE] marks the first row broken by the right-aligned figure (place at the start of that row).`
                      : `Because width is ≥ ${RIGHT_WRAP_THRESHOLD_IN}", [FIGURE] places a centered figure block.`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="abs-txt-loader"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <FileUp size={13} />
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
                    className={`text-xs font-bold tabular-nums px-2.5 py-1 rounded-full border ${
                      visibleAbstractChars >= ABSTRACT_MAX_CHARS
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-white border-slate-300 text-slate-800"
                    }`}
                  >
                    {visibleAbstractChars.toLocaleString()} / {ABSTRACT_MAX_CHARS.toLocaleString()} chars (with spaces)
                  </span>
                </div>
              </div>

              {/* Generalized Text Formatting, Scientific Symbol & Inline Figure Placement Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white border-2 border-slate-200 rounded-xl p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  Format:
                </span>
                <button
                  type="button"
                  title="Wrap selected text as Bold (<b>...</b>)"
                  onClick={() => wrapSelectionWithFormatTag("b")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <Bold size={13} /> Bold
                </button>
                <button
                  type="button"
                  title="Wrap selected text as Italic (<i>...</i>)"
                  onClick={() => wrapSelectionWithFormatTag("i")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold italic text-slate-800 cursor-pointer shadow-2xs"
                >
                  <Italic size={13} /> Italic
                </button>
                <button
                  type="button"
                  title="Wrap selected text as Underlined (<u>...</u>)"
                  onClick={() => wrapSelectionWithFormatTag("u")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold underline text-slate-800 cursor-pointer shadow-2xs"
                >
                  <Underline size={13} /> Underline
                </button>
                <button
                  type="button"
                  title="Wrap selected text as Subscript (<sub>...</sub>)"
                  onClick={() => wrapSelectionWithFormatTag("sub")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <Subscript size={13} /> Subscript
                </button>
                <button
                  type="button"
                  title="Wrap selected text as Superscript (<sup>...</sup>)"
                  onClick={() => wrapSelectionWithFormatTag("sup")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <Superscript size={13} /> Superscript
                </button>

                <span aria-hidden="true" className="h-5 w-px bg-slate-300 mx-1" />

                <button
                  type="button"
                  title={
                    isRightWrappedWidth
                      ? "Insert [FIGURE] marker inline to indicate the first row broken by the right-aligned figure"
                      : "Insert [FIGURE] marker at cursor (or move existing marker here) so the figure renders inline in previews"
                  }
                  onClick={insertOrMoveFigureMarker}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-primary/40 hover:bg-primary hover:text-white text-xs font-bold text-primary transition-colors cursor-pointer shadow-2xs"
                >
                  <ImageIcon size={13} />
                  <span>
                    {splitAbstractPreview.hasMarker ? "Move [FIGURE] Here" : "Insert Figure Here"}
                  </span>
                </button>
                {splitAbstractPreview.hasMarker && (
                  <button
                    type="button"
                    title="Remove the inline [FIGURE] marker"
                    onClick={removeFigureMarker}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-300 hover:border-red-400 hover:text-red-600 text-[11px] font-semibold text-slate-600 cursor-pointer"
                  >
                    <X size={12} /> Clear Marker
                  </button>
                )}

                <span aria-hidden="true" className="h-5 w-px bg-slate-300 mx-1" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  Symbols:
                </span>
                {QUICK_MATH_TOKENS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    title={item.title}
                    onClick={() => insertTokenIntoAbstract(item.token)}
                    className={`px-2 py-1 rounded bg-slate-50 border border-slate-200 hover:border-primary hover:text-primary text-[11px] font-medium text-slate-800 transition-colors cursor-pointer ${
                      item.italic ? "italic font-serif font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Raw Abstract Textarea (Calibrated to 780px = 6.5" printable column at 120 px/in & 16px serif -> 12-15 words/line) */}
              <textarea
                id="abs-body"
                ref={abstractTextareaRef}
                rows={10}
                wrap="soft"
                value={abstractText}
                onChange={(e) => handleAbstractTextChange(e.target.value)}
                onPaste={(e) =>
                  applyWordPasteToField(
                    e,
                    abstractText,
                    setAbstractText,
                    {
                      multiline: true,
                      maxChars: ABSTRACT_MAX_CHARS,
                      preserveInlineFormatting: true,
                      countVisibleOnly: true,
                    },
                    (trimmed) => {
                      if (trimmed > 0) {
                        setPasteNotice(
                          `Word paste converted formatting & equations and trimmed ${trimmed} visible characters to fit the ${ABSTRACT_MAX_CHARS.toLocaleString()}-character limit.`
                        );
                      }
                    }
                  )
                }
                placeholder="Paste directly from Microsoft Word or compose up to 3,000 characters (including spaces). Word line-wraps are unwrapped automatically so text fills the 6.5&quot; column width naturally (12-15 words/line)..."
                className="w-full bg-white border-2 border-[#94A3B8] hover:border-slate-500 rounded-xl px-3.5 sm:px-6 lg:px-[22px] py-3.5 font-serif text-[16px] text-slate-950 placeholder:text-[#7C8BA1] placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 leading-[1.45] shadow-inner"
              />
            </div>

            {/* 3. Real-Time Formatted Preview Text Box (Zero extra outer padding so text column stays exactly 780px) */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles size={13} /> Live Formatted Text Preview (780px = 6.5&quot; Measure @ 16px Serif)
                </span>
                <span className="text-[11px] font-medium text-slate-600">
                  {isRightWrappedWidth
                    ? `Right-aligned squared wrap (<${RIGHT_WRAP_THRESHOLD_IN}") • [FIGURE] marks first broken row`
                    : `Centered figure mode (≥${RIGHT_WRAP_THRESHOLD_IN}") • ~12–15 words/line density`}
                </span>
              </div>
              <div className="bg-white border-2 border-primary/35 rounded-xl px-3.5 sm:px-6 lg:px-[22px] py-4 sm:py-5 min-h-[140px] font-serif text-[16px] text-slate-950 leading-[1.45] text-justify shadow-2xs">
                {abstractText.trim() ? (
                  isRightWrappedWidth && (graphicPreviewUrl || splitAbstractPreview.hasMarker) ? (
                    <ScientificText
                      text={abstractText}
                      multiline
                      inlineRightFigure={
                        graphicPreviewUrl ? (
                          <span
                            role="figure"
                            aria-label={
                              graphicCaption.trim()
                                ? `Figure 1: ${graphicCaption.trim()}`
                                : "Uploaded figure preview"
                            }
                            style={{ width: `${figurePctOfTextCol.toFixed(2)}%` }}
                            className="float-right clear-right ml-[1em] mb-2.5 mt-0.5 border border-slate-200 rounded-lg p-2 bg-white block max-w-full text-center font-normal not-italic"
                          >
                            <img
                              src={graphicPreviewUrl}
                              alt={graphicCaption || "Uploaded figure preview"}
                              className="w-full h-auto object-contain mx-auto rounded block"
                            />
                            {graphicCaption.trim() && (
                              <span className="block mt-1.5 text-[13.5px] text-slate-700 leading-snug text-center font-serif">
                                <strong className="text-slate-900">Figure 1.</strong>{" "}
                                <ScientificText text={graphicCaption.trim()} />
                              </span>
                            )}
                          </span>
                        ) : (
                          <span
                            role="note"
                            style={{ width: `${figurePctOfTextCol.toFixed(2)}%` }}
                            className="float-right clear-right ml-[1em] mb-2.5 mt-0.5 border-2 border-dashed border-sky-300 bg-sky-50/70 rounded-xl p-3.5 text-center font-sans block max-w-full"
                          >
                            <ImageIcon size={18} className="text-primary mx-auto mb-1" />
                            <span className="block text-xs font-bold text-sky-950">
                              Right-Wrap Marker ([FIGURE])
                            </span>
                            <span className="block text-[11px] text-slate-600 mt-0.5">
                              {figureWidthInches.toFixed(2)}&quot; width • First broken row; upload above to preview graphic here.
                            </span>
                          </span>
                        )
                      }
                    />
                  ) : splitAbstractPreview.hasMarker ? (
                    <div className="space-y-3">
                      {splitAbstractPreview.beforeText && (
                        <ScientificText text={splitAbstractPreview.beforeText} multiline />
                      )}
                      {graphicPreviewUrl ? (
                        <figure
                          style={{ width: `${figurePctOfTextCol.toFixed(2)}%` }}
                          className="mx-auto my-3 border border-slate-200 rounded-lg p-2 bg-white space-y-1 max-w-full"
                        >
                          <img
                            src={graphicPreviewUrl}
                            alt={graphicCaption || "Uploaded figure preview"}
                            className="w-full h-auto object-contain mx-auto rounded"
                          />
                          {graphicCaption.trim() && (
                            <figcaption className="text-[13.5px] text-slate-700 leading-snug text-center font-serif">
                              <strong className="text-slate-900">Figure 1.</strong>{" "}
                              <ScientificText text={graphicCaption.trim()} />
                            </figcaption>
                          )}
                        </figure>
                      ) : (
                        <div
                          style={{ width: `${figurePctOfTextCol.toFixed(2)}%` }}
                          className="mx-auto my-3 border-2 border-dashed border-sky-300 bg-sky-50/70 rounded-xl p-4 text-center font-sans max-w-full"
                        >
                          <ImageIcon size={20} className="text-primary mx-auto mb-1" />
                          <p className="text-xs font-bold text-sky-950">
                            Figure 1 Placement Marker ([FIGURE]) — {figureWidthInches.toFixed(2)}&quot; Width
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Upload your 300-DPI figure above and it will appear right here.
                          </p>
                        </div>
                      )}
                      {splitAbstractPreview.afterText && (
                        <ScientificText text={splitAbstractPreview.afterText} multiline />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ScientificText text={abstractText} multiline />
                      {graphicPreviewUrl && (
                        <figure
                          style={{ width: `${figurePctOfTextCol.toFixed(2)}%` }}
                          className="mx-auto my-3 border border-slate-200 rounded-lg p-2 bg-white space-y-1 max-w-full"
                        >
                          <img
                            src={graphicPreviewUrl}
                            alt={graphicCaption || "Uploaded figure preview"}
                            className="w-full h-auto object-contain mx-auto rounded"
                          />
                          {graphicCaption.trim() && (
                            <figcaption className="text-[13.5px] text-slate-700 leading-snug text-center font-serif">
                              <strong className="text-slate-900">Figure 1.</strong>{" "}
                              <ScientificText text={graphicCaption.trim()} />
                            </figcaption>
                          )}
                        </figure>
                      )}
                    </div>
                  )
                ) : (
                  <p className="text-slate-400 italic font-sans text-xs">
                    Your formatted abstract text (with bold, italics, underlines, subscripts, superscripts, Greek symbols, Word equations, and inline [FIGURE] placement) will render live here...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 6: Keywords + 7–8 Extracted Suggestions & Presenter Bio */}
        {currentStage === 6 && (
          <div className="space-y-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="abs-keywords"
                  className="hems-label mb-0 flex items-center gap-1.5"
                >
                  <Tag size={13} className="text-primary" />
                  Keywords (Comma-Separated, Max {KEYWORDS_MAX_CHARS} Chars){" "}
                  <span className="text-red-600">*</span>
                </label>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    keywords.length >= KEYWORDS_MAX_CHARS
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}
                >
                  {keywords.length} / {KEYWORDS_MAX_CHARS} chars
                </span>
              </div>
              <input
                id="abs-keywords"
                type="text"
                maxLength={KEYWORDS_MAX_CHARS}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onPaste={(e) =>
                  applyWordPasteToField(
                    e,
                    keywords,
                    setKeywords,
                    { multiline: false, maxChars: KEYWORDS_MAX_CHARS },
                    (trimmed) => {
                      if (trimmed > 0) {
                        setPasteNotice(
                          `Word paste trimmed ${trimmed} characters to fit the ${KEYWORDS_MAX_CHARS}-character keywords limit.`
                        );
                      }
                    }
                  )
                }
                placeholder="e.g., membrane-inlet MS, subsea hydrothermal plume, AUV, quadrupole, C1-C7 hydrocarbons"
                className={INPUT_CLASS}
              />

              {/* Suggested 7–8 Keyword Phrases Extracted From Draft */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-950">
                    <Sparkles size={13} className="text-primary" />
                    Suggested Keyword Phrases (Click to Add)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Extracted from your title, synopsis, abstract &amp; track
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedKeywords.map((phrase) => {
                    const isAdded = parsedKeywordTags.some(
                      (k) => k.toLowerCase() === phrase.toLowerCase()
                    );
                    return (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => handleToggleSuggestedKeyword(phrase)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          isAdded
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                            : "bg-sky-50/70 border-sky-200 text-sky-900 hover:bg-primary hover:text-white hover:border-primary"
                        }`}
                      >
                        <span>{isAdded ? "✓" : "+"}</span>
                        <span>{phrase}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {parsedKeywordTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedKeywordTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="text-[11px] font-semibold bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="abs-bio"
                  className="hems-label mb-0 flex items-center gap-1.5"
                >
                  <User size={13} className="text-primary" />
                  Presenter Biography (Max {BIO_MAX_CHARS} Chars){" "}
                  <span className="text-red-600">*</span>
                </label>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    presenterBio.length >= BIO_MAX_CHARS
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}
                >
                  {presenterBio.length} / {BIO_MAX_CHARS} chars
                </span>
              </div>
              <textarea
                id="abs-bio"
                rows={4}
                maxLength={BIO_MAX_CHARS}
                value={presenterBio}
                onChange={(e) => setPresenterBio(e.target.value)}
                onPaste={(e) =>
                  applyWordPasteToField(
                    e,
                    presenterBio,
                    setPresenterBio,
                    { multiline: true, maxChars: BIO_MAX_CHARS },
                    (trimmed) => {
                      if (trimmed > 0) {
                        setPasteNotice(
                          `Word paste trimmed ${trimmed} characters to fit the ${BIO_MAX_CHARS}-character biography limit.`
                        );
                      }
                    }
                  )
                }
                placeholder="Brief biographical sketch for session chairs and program reviewers (up to 500 characters)..."
                className={`${INPUT_CLASS} leading-relaxed`}
              />
            </div>
          </div>
        )}

        {/* STAGE 7: 8.5" × 11" (1" Margin, 1–2 Page) Preview, Desired Figure Width & Submit */}
        {currentStage === 7 && (
          <div className="space-y-5">
            <div className="print:hidden bg-[#F3F6FA] border border-slate-300 rounded-2xl px-4 sm:px-8 py-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
                <span className="text-slate-700 font-semibold">
                  Jump back to edit any section before submitting:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {WORKFLOW_STAGES.slice(0, 6).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleJumpToStage(st.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-[11px] font-semibold text-slate-800 cursor-pointer"
                    >
                      {st.id}. {st.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desired Figure Width Control Also Available Directly on Stage 7 */}
              <div>{renderFigureWidthControl("stage7")}</div>
            </div>

            <AbstractOnePagePreview
              workshopOrdinal={workshop.workshop_ordinal}
              workshopWindow={workshop.target_window}
              workshopYear={Number(workshop.workshop_year) || 2027}
              title={title}
              authors={authors}
              affiliations={affiliations}
              correspondingEmail={correspondingEmail}
              secondaryEmail={secondaryEmail}
              presentationFormat={presentationFormat}
              researchTrack={researchTrack}
              studentTravelAwardApplicant={studentTravelAwardApplicant}
              synopsis={summary}
              abstractText={abstractText}
              keywords={keywords}
              presenterBio={presenterBio}
              graphicUrl={graphicPreviewUrl || null}
              graphicMeta={
                displayGraphicMeta
                  ? {
                      ...displayGraphicMeta,
                      widthInches: figureWidthInches,
                      caption: graphicCaption.trim() || undefined,
                    }
                  : null
              }
              graphicCaption={graphicCaption}
              figureWidthInches={figureWidthInches}
              hideTopToolbar
            />
          </div>
        )}

        {/* Stage Footer: Back / Next / Submit */}
        <div
          className={
            currentStage === 7
              ? "print:hidden bg-[#F3F6FA] border border-slate-300 rounded-2xl px-4 sm:px-8 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              : "print:hidden pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          }
        >
          <button
            type="button"
            disabled={currentStage === 1}
            onClick={handlePrevStage}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none text-sm font-semibold text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <span className="text-xs text-slate-500 text-center tabular-nums">
            Step {currentStage} of {WORKFLOW_STAGES.length} •{" "}
            {editingSubmissionId
              ? `Editing ${editingSubmissionId} (updates live upon save)`
              : "Auto-saved locally & synced to cloud on stage changes"}
          </span>

          {currentStage < 7 ? (
            <button
              type="button"
              onClick={handleNextStage}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-sky-800 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || deadlineInfo.isPastDeadline}
              onClick={() => void handleFinalSubmit()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{editingSubmissionId ? "Saving Updates..." : "Submitting Abstract..."}</span>
                </>
              ) : deadlineInfo.isPastDeadline ? (
                <>
                  <Lock size={16} />
                  <span>Submission Cutoff Passed</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>
                    {editingSubmissionId ? "Save Updated Submission" : "Submit Abstract for Review"}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </section>
      )}
    </div>
  );
}
