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
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  Plus,
  Building2,
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import {
  ABSTRACT_MAX_CHARS,
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
  BIO_MAX_CHARS,
  CAPTION_MAX_CHARS,
  clampFigureWidthInches,
  DEFAULT_FIGURE_WIDTH_IN,
  FIGURE_MARKER_TOKEN,
  GraphicMetadata,
  KEYWORDS_MAX_CHARS,
  MAX_FIGURE_WIDTH_IN,
  MIN_FIGURE_WIDTH_IN,
  MIN_GRAPHIC_DPI,
  PRESENTATION_FORMAT_OPTIONS,
  PresentationFormat,
  PRINTABLE_TEXT_WIDTH_IN,
  RESEARCH_TRACK_OPTIONS,
  ResearchTrack,
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

const LABEL_CLASS =
  "block text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950 mb-1.5";
const INPUT_CLASS =
  "w-full bg-white border-2 border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 text-[15px] font-normal text-slate-950 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 transition-colors";

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
  const guardPushedRef = useRef<boolean>(false);
  const bypassUnloadGuardRef = useRef<boolean>(false);

  const [currentStage, setCurrentStage] = useState<number>(1);
  const [infoExpanded, setInfoExpanded] = useState<boolean>(true);
  const [showPrintableGuidelines, setShowPrintableGuidelines] = useState<boolean>(false);

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

  // Stage 7
  const [keywords, setKeywords] = useState("");
  const [presenterBio, setPresenterBio] = useState("");

  // Feedback & saved preview state
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] =
    useState<AbstractSubmissionRecord | null>(null);
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

  const isDirty = useMemo(() => {
    if (submittedConfirmation) return false;
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

    const markerRegex = /[ \t]*\[FIGURE\][ \t]*/gi;
    const existingMatch = markerRegex.exec(abstractText);

    let baseText = abstractText;
    let start = rawStart;
    let end = rawEnd;

    if (existingMatch) {
      const matchStart = existingMatch.index;
      const matchLen = existingMatch[0].length;
      baseText =
        abstractText.slice(0, matchStart) +
        abstractText.slice(matchStart + matchLen);
      baseText = baseText.replace(/\n{3,}/g, "\n\n");
      if (rawStart > matchStart) {
        start = Math.max(0, rawStart - matchLen);
      }
      if (rawEnd > matchStart) {
        end = Math.max(start, rawEnd - matchLen);
      }
    }

    const before = baseText.slice(0, start).replace(/\n+$/g, "");
    const after = baseText.slice(end).replace(/^\n+/g, "");
    const prefix = before ? `${before}\n\n` : "";
    const suffix = after ? `\n\n${after}` : "";
    const nextText = `${prefix}${FIGURE_MARKER_TOKEN}${suffix}`;

    setAbstractText(nextText);
    setPasteNotice(
      existingMatch
        ? "Moved the [FIGURE] placement marker to the new cursor position."
        : "Inserted [FIGURE] placement marker. Your figure will render at this position in the live & final previews."
    );

    const nextCursor = prefix.length + FIGURE_MARKER_TOKEN.length;
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
      .replace(/[ \t]*\n*\[FIGURE\]\n*[ \t]*/gi, "\n\n")
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
      if (graphicFile && !graphicCaption.trim()) {
        return "Figure caption is required (non-optional) whenever a graphic is uploaded.";
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

  const handleNextStage = () => {
    const err = validateStage(currentStage);
    if (err) {
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
    for (let s = 1; s <= 6; s++) {
      const err = validateStage(s);
      if (err) {
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

      const created = await createSubmission(
        {
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
          graphicCaption: graphicFile ? graphicCaption : "",
          figureWidthInches: graphicFile ? clampFigureWidthInches(figureWidthInches) : undefined,
          studentTravelAwardApplicant,
          deadline: workshop.cfp_abstract_deadline,
          submittedByUid: user.uid,
          submittedByEmail: user.email,
        },
        {
          graphicFile,
          graphicMeta: graphicMeta
            ? {
                ...graphicMeta,
                widthInches: clampFigureWidthInches(figureWidthInches),
              }
            : null,
        }
      );

      bypassUnloadGuardRef.current = true;
      guardPushedRef.current = false;
      setSubmittedConfirmation(created);
      setCurrentStage(1);
      setTitle("");
      setSecondaryEmail("");
      setAffiliations([{ id: "aff-1", institution: "", location: "" }]);
      setAuthors([
        {
          id: "auth-1",
          name: user.name || "",
          affiliationId: "aff-1",
          isPresenter: true,
        },
      ]);
      setSummary("");
      setAbstractText("");
      setKeywords("");
      setPresenterBio("");
      setStudentTravelAwardApplicant(false);
      setPasteNotice(null);
      handleSetFigureWidth(DEFAULT_FIGURE_WIDTH_IN);
      handleRemoveGraphic();
      scrollToWorkspaceTop();

      window.setTimeout(() => {
        bypassUnloadGuardRef.current = false;
      }, 300);
    } catch (err) {
      setStageError(
        err instanceof Error ? err.message : "Failed to submit abstract."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSavedPreview = async (sub: AbstractSubmissionRecord) => {
    const graphicUrl = await getGraphicPreviewUrl(sub);
    setSavedPreviewItem({ sub, graphicUrl });
    scrollToWorkspaceTop();
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
      setStageError(
        err instanceof Error ? err.message : "Unable to withdraw submission."
      );
    }
  };

  if (showPrintableGuidelines) {
    return (
      <PrintableFormattingGuidelines
        workshopOrdinal={workshop.workshop_ordinal}
        workshopWindow={workshop.target_window}
        workshopYear={Number(workshop.workshop_year) || 2027}
        deadline={workshop.cfp_abstract_deadline}
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

  const figurePctOfTextCol = Math.min(
    100,
    Math.max(46.15, (figureWidthInches / PRINTABLE_TEXT_WIDTH_IN) * 100)
  );
  const effectiveDpiAtWidth =
    graphicMeta && graphicMeta.dpiSource !== "vector" && figureWidthInches > 0
      ? Math.round(graphicMeta.widthPx / figureWidthInches)
      : null;

  const renderFigureWidthControl = (idPrefix: string) => (
    <div className="bg-white border-2 border-slate-300 rounded-xl p-4 space-y-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`${idPrefix}-fig-width-number`}
          className="text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950 flex items-center gap-1.5"
        >
          <Ruler size={14} className="text-primary" />
          Desired Figure Width ({MIN_FIGURE_WIDTH_IN}&ndash;{MAX_FIGURE_WIDTH_IN} inches)
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 tabular-nums">
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
            className="w-24 bg-white border-2 border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-950 tabular-nums text-right focus:outline-none focus:border-primary"
          />
          <span className="text-xs font-bold text-slate-700">in</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-500 mr-1">
          Presets:
        </span>
        {[
          { label: '3.25" Half-Column', value: 3.25 },
          { label: '4.50" Standard', value: 4.5 },
          { label: '5.50" Wide', value: 5.5 },
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
            Complete the 7-stage submission wizard below using <strong>Next</strong> / <strong>Back</strong> navigation. Word copy-paste (equations &amp; formatting) is supported in every field.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isDirty && (
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
              Unsaved draft in progress (Back-navigation guarded)
            </span>
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
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 leading-tight">
                Formatting Rules, Input Parameters &amp; Submission Limits
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                Deadline: <strong className="text-slate-700">{workshop.cfp_abstract_deadline}</strong> • Formatted to 8.5&quot; × 11&quot; with 1&quot; margins (6.5&quot; text width; 1–2 pages)
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
                Italic <em>m/z</em>, [FIGURE] marker, {MIN_FIGURE_WIDTH_IN}&ndash;{MAX_FIGURE_WIDTH_IN}&quot; width &amp; caption (≤{CAPTION_MAX_CHARS})
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
                  {submittedConfirmation.id}
                </span>
                <span className="text-sm font-bold text-emerald-950">
                  Abstract Submitted &amp; Routed to Reviewer Panel
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                <strong>{submittedConfirmation.title}</strong> is now saved and ready for review.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => void handleOpenSavedPreview(submittedConfirmation)}
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
          </div>
        </div>
      )}

      {/* Full-Width 7-Stage Progress Stepper */}
      <nav aria-label="Abstract submission stages" className="print:hidden">
        <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WORKFLOW_STAGES.map((st) => {
            const isActive = st.id === currentStage;
            const isCompleted = st.id < currentStage;
            return (
              <li key={st.id}>
                <button
                  type="button"
                  onClick={() => handleJumpToStage(st.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-xs"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white text-primary"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600"
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

      {/* Main 1-Inch Margin Calibrated Stage Sheet (1,020px outer = 8.5" @ 120 px/in; Stages 1-6 use 828px interior -> 780px = 6.5" text col; Stage 7 renders full 1,020px sheet directly) */}
      <section
        className={
          currentStage === 7
            ? "w-full space-y-6"
            : "w-full bg-[#F8FAFC] border-2 border-slate-300/90 rounded-2xl px-4 sm:px-8 lg:px-[94px] py-6 sm:py-8 shadow-xs space-y-6 print:hidden"
        }
      >
        <div
          className={
            currentStage === 7
              ? "print:hidden bg-[#F8FAFC] border-2 border-slate-300/90 rounded-2xl px-4 sm:px-8 py-6 shadow-xs space-y-4"
              : "print:hidden space-y-4"
          }
        >
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
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white border-2 border-slate-200 rounded-xl p-3.5 sm:p-4"
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
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl p-3.5 sm:p-4 border-2 transition-colors ${
                    author.isPresenter
                      ? "bg-sky-50/70 border-primary/50"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-6 text-center shrink-0 tabular-nums">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-sky-950 mb-1">
                        {author.isPresenter ? "Presenter Name *" : `Co-Author #${index + 1}`}
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
                    <label className="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-sky-950 mb-1">
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
                  className="block text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950"
                >
                  Short Synopsis ({SYNOPSIS_MAX_CHARS} Chars Max){" "}
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

        {/* STAGE 5: 3,000-Char Abstract Body + Formatting & [FIGURE] Toolbar + 6.5"-Calibrated Live Preview */}
        {currentStage === 5 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label
                  htmlFor="abs-body"
                  className="block text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950"
                >
                  Raw Abstract Input Text (Up to {ABSTRACT_MAX_CHARS.toLocaleString()} Chars With Spaces){" "}
                  <span className="text-red-600">*</span>
                </label>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Inline tags (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;sub&gt;</code>, <code>&lt;sup&gt;</code>) and <code>[FIGURE]</code> do not count toward your 3,000-character budget.
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
                title="Insert [FIGURE] marker at cursor (or move existing marker here) so the figure renders inline in previews"
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
              className="w-full bg-white border-2 border-slate-300 hover:border-slate-400 rounded-xl px-3.5 sm:px-6 lg:px-[22px] py-3.5 font-serif text-[16px] text-slate-950 placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 leading-[1.45] shadow-2xs"
            />

            {/* Integrated Stage 5 Figure Upload (300 DPI Min) + Desired Width (3-6.5 in) + Non-Optional Caption */}
            <div className="pt-2 border-t border-slate-200/90 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-primary" />
                  Optional High-Resolution Figure ({MIN_GRAPHIC_DPI} DPI Min) &amp; Width Control
                </h3>
                <span className="text-[11px] text-slate-600 font-medium">
                  Use <strong className="font-mono text-primary">[FIGURE]</strong> above to position inline, or leave omitted to append below text
                </span>
              </div>

              {graphicError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{graphicError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 hover:border-primary/70 rounded-2xl p-5 sm:p-6 bg-white transition-colors space-y-4">
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
                      ) : graphicFile && graphicMeta ? (
                        <>
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {graphicFile.name}
                          </p>
                          <p className="text-xs text-emerald-700 font-semibold tabular-nums mt-0.5">
                            Verified {graphicMeta.detectedDpi} DPI ({graphicMeta.dpiSource}) •{" "}
                            {graphicMeta.widthPx}×{graphicMeta.heightPx} px •{" "}
                            {formatFileSize(graphicFile.size)}
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
                    {graphicFile && (
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
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 cursor-pointer transition-colors shadow-2xs"
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
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
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
                    className="block text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950"
                  >
                    Figure Caption{" "}
                    {graphicFile ? (
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

            {/* Real-Time Formatted Preview Text Box (Zero extra outer padding so text column stays exactly 780px) */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles size={13} /> Live Formatted Text Preview (780px = 6.5&quot; Measure @ 16px Serif)
                </span>
                <span className="text-[11px] font-medium text-slate-600">
                  Matches ~12–15 words/line sheet density &amp; inline [FIGURE] placement
                </span>
              </div>
              <div className="bg-white border-2 border-primary/35 rounded-xl px-3.5 sm:px-6 lg:px-[22px] py-4 sm:py-5 min-h-[140px] font-serif text-[16px] text-slate-950 leading-[1.45] text-justify shadow-2xs">
                {abstractText.trim() ? (
                  splitAbstractPreview.hasMarker ? (
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
                  className="text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950 flex items-center gap-1.5"
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
                  className="text-xs font-extrabold uppercase tracking-[0.08em] text-sky-950 flex items-center gap-1.5"
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
            <div className="print:hidden bg-[#F8FAFC] border-2 border-slate-300/90 rounded-2xl px-4 sm:px-8 py-5 shadow-xs space-y-4">
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
                graphicMeta
                  ? {
                      ...graphicMeta,
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
              ? "print:hidden bg-[#F8FAFC] border-2 border-slate-300/90 rounded-2xl px-4 sm:px-8 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
            Step {currentStage} of {WORKFLOW_STAGES.length} • Progress stays saved in your browser while advancing stages
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
              disabled={submitting}
              onClick={() => void handleFinalSubmit()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
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
          )}
        </div>
      </section>

      {/* Full-Width Submitted Abstracts Drawer Below Builder */}
      <section className="print:hidden bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
              My Submitted Abstracts
            </h3>
            <p className="text-xs text-slate-500">
              Submissions shown below are live in the Reviewer Panel.
            </p>
          </div>
          <span className="tabular-nums text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {mySubmissions.length} submitted
          </span>
        </div>

        {listLoading ? (
          <p className="text-xs text-slate-500">Loading your submissions...</p>
        ) : mySubmissions.length === 0 ? (
          <p className="text-xs text-slate-500 leading-relaxed">
            You have not submitted an abstract yet for the {workshop.workshop_ordinal} HEMS Workshop. Advance through Stages 1–7 above to preview and submit.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-[#FAFBFD] border border-slate-200/90 flex flex-col justify-between gap-3"
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

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    <ScientificText text={sub.title} />
                  </h4>

                  <p className="text-[11px] text-slate-500 truncate">
                    {sub.presentationFormat}
                    {sub.graphic ? ` • Figure (${sub.graphic.detectedDpi} DPI)` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => void handleOpenSavedPreview(sub)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Eye size={13} /> Show Formatted Preview
                  </button>
                  {sub.status === "Pending" && (
                    <button
                      type="button"
                      onClick={() => void handleWithdraw(sub)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer ml-auto"
                    >
                      <Trash2 size={13} /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
