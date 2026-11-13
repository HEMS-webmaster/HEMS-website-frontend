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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import {
  PRESENTATION_FORMAT_OPTIONS,
  RESEARCH_TRACK_OPTIONS,
  PresentationFormat,
  ResearchTrack,
  AbstractSubmissionRecord,
} from "@/types/abstractSubmission";
import {
  hasAttendeeRole,
  hasReviewerRole,
} from "@/utils/telemetryClient";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB limit for single-page PDF

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "PDF attached";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function buildRecommendedFilename(presentingAuthor: string): string {
  const parts = presentingAuthor
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "HEMS_Abstract_LastName_FirstName.pdf";
  if (parts.length === 1) return `HEMS_Abstract_${parts[0]}.pdf`;
  const last = parts[parts.length - 1];
  const first = parts[0];
  return `HEMS_Abstract_${last}_${first}.pdf`;
}

export default function AbstractSubmissionClient() {
  const { user, loading: authLoading, isMock, setMockRoles } = useAuth();
  const { workshop } = useUpcomingWorkshop();
  const {
    submissions,
    loading: listLoading,
    createSubmission,
    withdrawSubmission,
    openSubmissionPdf,
  } = useAbstractSubmissions();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [presentingAuthor, setPresentingAuthor] = useState("");
  const [correspondingEmail, setCorrespondingEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [coAuthors, setCoAuthors] = useState("");
  const [presentationFormat, setPresentationFormat] =
    useState<PresentationFormat>("Oral Presentation");
  const [researchTrack, setResearchTrack] = useState<ResearchTrack>(
    "Miniature & Ruggedized Hardware / Vacuum"
  );
  const [summary, setSummary] = useState("");
  const [studentTravelAwardApplicant, setStudentTravelAwardApplicant] =
    useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] =
    useState<AbstractSubmissionRecord | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setPresentingAuthor((prev) => prev || user.name || "");
    setCorrespondingEmail((prev) => prev || user.email || "");
  }, [user]);

  const mySubmissions = useMemo(() => {
    if (!user) return [];
    const emailLower = user.email.toLowerCase();
    return submissions.filter(
      (s) =>
        s.submittedByUid === user.uid ||
        s.submittedByEmail.toLowerCase() === emailLower
    );
  }, [submissions, user]);

  const recommendedFilename = useMemo(
    () => buildRecommendedFilename(presentingAuthor),
    [presentingAuthor]
  );

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
          Uploading a workshop abstract and metadata requires a signed-in account with the{" "}
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFormError("Please upload a finalized PDF file (.pdf) matching the Formatting Guidelines.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setFormError("PDF file exceeds the 10 MB maximum upload size.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSubmittedConfirmation(null);

    if (title.trim().length < 5) {
      setFormError("Please enter the full presentation title (at least 5 characters).");
      return;
    }
    if (!presentingAuthor.trim()) {
      setFormError("Please enter the presenting author's full name.");
      return;
    }
    if (!correspondingEmail.includes("@")) {
      setFormError("Please enter a valid corresponding email address.");
      return;
    }
    if (!affiliation.trim()) {
      setFormError("Please enter the primary institution or company affiliation.");
      return;
    }
    if (summary.trim().length < 20) {
      setFormError(
        "Please provide a brief abstract synopsis (at least 20 characters) so reviewers can triage your topic."
      );
      return;
    }
    if (!selectedFile) {
      setFormError("Please attach your single-page PDF abstract before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSubmission(
        {
          workshopYear: Number(workshop.workshop_year) || 2027,
          title,
          presentingAuthor,
          correspondingEmail,
          affiliation,
          coAuthors,
          presentationFormat,
          researchTrack,
          summary,
          studentTravelAwardApplicant,
          deadline: workshop.cfp_abstract_deadline,
          submittedByUid: user.uid,
          submittedByEmail: user.email,
        },
        selectedFile
      );

      setSubmittedConfirmation(created);
      setTitle("");
      setCoAuthors("");
      setSummary("");
      setStudentTravelAwardApplicant(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit abstract.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewPdf = async (sub: AbstractSubmissionRecord) => {
    setPreviewNotice(null);
    const res = await openSubmissionPdf(sub);
    if (!res.ok && res.reason) {
      setPreviewNotice(res.reason);
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
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to withdraw submission."
      );
    }
  };

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
            Upload your single-page PDF abstract and metadata. Submitted abstracts are routed immediately to the{" "}
            <strong className="font-semibold text-slate-800">HEMS Reviewer Panel</strong> for evaluation.
          </p>
        </div>

        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-semibold text-primary self-start md:self-auto break-all shrink-0">
          Attendee: {user.email}
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
                  Abstract Uploaded &amp; Queued for Review
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                <strong>{submittedConfirmation.title}</strong> ({submittedConfirmation.fileName}) is now listed in the Reviewer Panel.
              </p>
            </div>
          </div>

          {hasReviewerRole(user.roles) && (
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 self-start sm:self-center"
            >
              <ClipboardCheck size={14} /> View in Reviewer Panel <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Upload & Metadata Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-8 shadow-2xs space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
              1. Abstract Metadata &amp; Document Upload
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Fields marked with <span className="text-red-500 font-semibold">*</span> appear in the Reviewer Panel queue and draft symposium program.
            </p>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
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
              placeholder="e.g., Subsea Membrane-Inlet Mass Spectrometry of Dissolved Crude Volatiles"
              className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Presenting Author + Corresponding Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="abs-author"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Presenting Author <span className="text-red-500">*</span>
              </label>
              <input
                id="abs-author"
                type="text"
                required
                value={presentingAuthor}
                onChange={(e) => setPresentingAuthor(e.target.value)}
                placeholder="Dr. Jane Doe"
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
                placeholder="jdoe@institution.edu"
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Primary Affiliation + Co-Authors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="abs-affiliation"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Primary Affiliation <span className="text-red-500">*</span>
              </label>
              <input
                id="abs-affiliation"
                type="text"
                required
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="University / National Lab / Company"
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="abs-coauthors"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Co-Authors &amp; Affiliations
              </label>
              <input
                id="abs-coauthors"
                type="text"
                value={coAuthors}
                onChange={(e) => setCoAuthors(e.target.value)}
                placeholder="Optional (e.g., A. Smith, B. Patel)"
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

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

          {/* Abstract Summary */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="abs-summary"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Abstract Synopsis (For Reviewer Queue) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {summary.length} / 2,500 chars
              </span>
            </div>
            <textarea
              id="abs-summary"
              required
              rows={4}
              maxLength={2500}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Briefly summarize the harsh-environment challenge, mass spectrometer configuration, key analytical results, and field metrics..."
              className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary leading-relaxed"
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

          {/* Single-Page PDF File Drop / Picker */}
          <div className="space-y-2">
            <label
              htmlFor="abs-pdf-upload"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Single-Page Abstract PDF <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-primary/60 rounded-2xl p-5 bg-[#FAFBFD] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-emerald-700 font-medium tabular-nums">
                          Ready for upload • {formatFileSize(selectedFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800">
                          Select finalized 1-page PDF (max 10 MB)
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 break-all">
                          Recommended filename:{" "}
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700">
                            {recommendedFilename}
                          </code>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <label
                  htmlFor="abs-pdf-upload"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-primary hover:text-primary text-xs font-semibold text-slate-800 cursor-pointer transition-colors shrink-0 shadow-2xs"
                >
                  <Upload size={14} />
                  <span>{selectedFile ? "Replace PDF" : "Choose PDF"}</span>
                </label>
                <input
                  id="abs-pdf-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 tabular-nums">
              Submission Deadline: <strong className="text-slate-700">{workshop.cfp_abstract_deadline}</strong>
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-sky-800 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading Abstract...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload Abstract &amp; Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Sidebar: Guidelines & Attendee Submission History */}
        <aside className="space-y-6">
          {/* Formatting Checklist */}
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar size={14} /> Formatting Checklist
            </div>
            <h3 className="font-serif text-lg font-semibold text-slate-900">
              Single-Page PDF Specifications
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed list-disc list-inside">
              <li>Exactly <strong>1 page</strong> in finalized PDF format</li>
              <li><strong>1-inch (2.54 cm)</strong> margins on all four sides</li>
              <li>Times New Roman or Arial, <strong>11pt–12pt</strong> body text</li>
              <li>Include bold 14pt title, full author names, affiliations, and contact email</li>
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

          {/* My Submitted Abstracts */}
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                My Submitted Abstracts
              </h3>
              <span className="tabular-nums text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {mySubmissions.length}
              </span>
            </div>

            {previewNotice && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-3">
                {previewNotice}
              </div>
            )}

            {listLoading ? (
              <p className="text-xs text-slate-500">Loading your submissions...</p>
            ) : mySubmissions.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                You have not uploaded an abstract yet for the {workshop.workshop_ordinal} HEMS Workshop. Complete the form on the left to submit.
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
                      {sub.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 truncate">
                      {sub.presentationFormat} • {sub.fileName}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void handlePreviewPdf(sub)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Eye size={12} /> Preview PDF
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
