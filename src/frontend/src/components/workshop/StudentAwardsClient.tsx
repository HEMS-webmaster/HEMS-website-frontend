"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  Calendar,
  Mail,
  FileText,
  CheckCircle2,
  UserCheck,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
} from "lucide-react";
import masterWorkshopsData from "@/data/master_workshops.json";
import InlineMailingSignup from "@/components/mailing/InlineMailingSignup";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { recordTelemetryEvent } from "@/utils/telemetryClient";

interface GuidelineItem {
  number: string;
  title: string;
  description: string;
  printSummary: string;
}

interface RawStudentAwardRecord {
  name?: string;
  institute?: string;
}

interface RawWorkshopRecord {
  year: number | string;
  title?: string;
  student_awards?: RawStudentAwardRecord[];
}

interface AwardRecipientItem {
  name: string;
  institute: string;
}

interface AwardCycleGroup {
  year: string;
  workshopTitle: string;
  recipients: AwardRecipientItem[];
}

const APPLICATION_GUIDELINES: GuidelineItem[] = [
  {
    number: "01",
    title: "Letter from the Student",
    description:
      "A letter from the student describing his/her academic standing and interests, expected graduation date and degree, advisor's name, and, if available, a URL for a working Web page.",
    printSummary:
      "Student statement detailing academic standing, research interests, expected graduation date and degree (M.S., M.A., or Ph.D.), faculty advisor's name, and research webpage URL (if available).",
  },
  {
    number: "02",
    title: "Faculty Advisor Letter",
    description:
      "A detailed letter from the student's faculty advisor indicating why the student is deserving of receiving a travel award and any special circumstances.",
    printSummary:
      "Detailed supporting letter from the student's faculty advisor explaining why the student merits a travel award and noting any special circumstances.",
  },
  {
    number: "03",
    title: "Presentation Title, Abstract & Authors",
    description:
      "The title of the presentation to be presented by the student at the meeting, along with the abstract, and authors.",
    printSummary:
      "Full title, author list, and technical abstract of the oral or poster presentation to be delivered by the student at the HEMS Workshop.",
  },
  {
    number: "04",
    title: "Curriculum Vitae (Vita)",
    description:
      "A vita that includes the student's research interests, projects, and papers published.",
    printSummary:
      "Current academic Curriculum Vitae (Vita) summarizing the student's education, research projects, instrumentation focus, and published papers.",
  },
];

const EVALUATION_CRITERIA: string[] = [
  "Meets eligibility requirements",
  "Completes Guideline list",
  "Quality and intellectual merit of the abstract and research",
  "Potential for future publications from research focus",
];

function buildPastAwardCycles(records: readonly RawWorkshopRecord[]): AwardCycleGroup[] {
  return records
    .filter((w) => Array.isArray(w.student_awards) && w.student_awards.length > 0)
    .map((w) => {
      const yearStr = String(w.year).trim();
      const recipients: AwardRecipientItem[] = (w.student_awards ?? [])
        .filter((entry) => typeof entry.name === "string" && entry.name.trim().length > 0)
        .map((entry) => ({
          name: (entry.name ?? "").trim(),
          institute: (entry.institute ?? "").trim(),
        }));
      return {
        year: yearStr,
        workshopTitle: (w.title ?? `${yearStr} HEMS Workshop`).trim(),
        recipients,
      };
    })
    .filter((group) => group.recipients.length > 0)
    .sort((a, b) => Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10));
}

const PAST_AWARD_CYCLES: AwardCycleGroup[] = buildPastAwardCycles(
  masterWorkshopsData as unknown as readonly RawWorkshopRecord[]
);

const TOTAL_PAST_RECIPIENTS: number = PAST_AWARD_CYCLES.reduce(
  (sum, cycle) => sum + cycle.recipients.length,
  0
);

export default function StudentAwardsClient() {
  const { workshop } = useUpcomingWorkshop();
  const [isPrintView, setIsPrintView] = useState<boolean>(false);

  const awardEmailSubject = encodeURIComponent(
    `${workshop.workshop_ordinal} HEMS Workshop Student Travel Award Application`
  );
  const awardMailtoHref = `mailto:${workshop.student_award_email}?subject=${awardEmailSubject}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1" || params.get("view") === "print") {
      setIsPrintView(true);
    }
  }, []);

  const openPrintableView = () => {
    setIsPrintView(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const closePrintableView = () => {
    setIsPrintView(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrintDocument = () => {
    void recordTelemetryEvent({
      eventType: "pdf_download",
      path: "/student-awards",
      targetLabel: "Student Travel Awards Printable Flyer",
    });
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const printScheduleLine = workshop.venue_confirmed
    ? `${workshop.exact_dates} • ${workshop.hotel_name} (${workshop.venue_city_state})`
    : `${workshop.target_window} • ${workshop.venue_city_state}`;

  return (
    <div className="flex flex-col flex-grow max-w-6xl mx-auto w-full min-w-0 print:max-w-none print:mx-0">
      {/* =====================================================================
          MODE A: INTERACTIVE WEB VIEW (Hidden Automatically During Printing)
          ===================================================================== */}
      {!isPrintView && (
        <div className="print:hidden">
          {/* Page Header */}
          <header className="mb-7 sm:mb-14 pb-6 sm:pb-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium tabular-nums leading-snug mb-4 shadow-2xs">
                  <GraduationCap size={15} className="text-primary shrink-0" />
                  <span>
                    Graduate Student Research Support • {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window})
                  </span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4 leading-[1.12]">
                  Student Travel <span className="text-primary italic font-normal">Awards</span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl">
                  Encouraging interest in Harsh-Environment Mass Spectrometry and rewarding the scientific merit and quality of graduate student research.
                </p>
              </div>
              <div className="hidden md:flex flex-col items-center p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs self-start md:self-center shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="Harsh-Environment Mass Spectrometry Society Emblem"
                  width={3756}
                  height={2594}
                  decoding="async"
                  className="w-28 sm:w-32 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-1 block"
                />
                <span className="text-[11px] font-medium text-slate-500 mt-1.5">Emerging Investigators</span>
              </div>
            </div>
          </header>

          {/* Purpose, Award Amount & Printable Flyer Hero Card */}
          <section className="mb-12 sm:mb-14">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/95 p-6 sm:p-8 md:p-10 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-2 space-y-3.5">
                  <div className="flex items-start sm:items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                    <Award size={16} className="shrink-0 mt-0.5 sm:mt-0" /> Purpose of the HEMS Workshop Student Travel Award
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 leading-snug">
                    Rewarding Scientific Merit in Harsh-Environment MS
                  </h2>
                  <p className="text-base text-slate-600 leading-relaxed font-sans">
                    The workshop award is intended to encourage interest in the topics applicable to Harsh-Environment Mass Spectrometry (HEMS) and reward the scientific merit and quality of student research in the area of HEMS.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-1.5">
                    <a
                      href={awardMailtoHref}
                      className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-3 min-h-[44px] rounded-lg hover:bg-sky-800 transition-colors shadow-xs text-sm text-center"
                    >
                      <Mail size={15} className="shrink-0" /> Email Awards Committee
                    </a>
                    <button
                      type="button"
                      onClick={openPrintableView}
                      className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-800 font-semibold px-5 py-3 min-h-[44px] rounded-lg hover:border-primary hover:text-primary transition-colors shadow-2xs text-sm text-center cursor-pointer"
                    >
                      <Printer size={15} className="text-primary shrink-0" /> Printable Version
                    </button>
                  </div>
                </div>

                <div className="bg-[#FAFBFD] border border-slate-200 rounded-xl p-6 text-center lg:text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Proposed Award Amount
                  </span>
                  <div className="text-4xl font-serif tabular-nums font-semibold text-primary mb-2">
                    {workshop.student_award_amount}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed tabular-nums">
                    Proposed travel award per biennial workshop cycle ({workshop.workshop_ordinal} Workshop target: <strong className="text-slate-800">{workshop.target_window}</strong>).
                  </p>
                </div>
              </div>
            </div>

            {!workshop.cfp_open && (
              <div className="mt-5">
                <InlineMailingSignup
                  variant="card"
                  kicker="Student Travel Grant Alert"
                  heading={`Get Notified When ${workshop.workshop_year} Student Award Applications Open`}
                  description={`Faculty advisors and M.S./M.A./Ph.D. researchers: receive an alert when ${workshop.student_award_amount} travel grant applications and abstract submissions open.`}
                  buttonLabel="Notify Me"
                  interests={["student_awards", "workshop"]}
                  sourceLabel="Student Awards Alert"
                />
              </div>
            )}
          </section>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-start">
            {/* Left 2 Columns: Eligibility, Guidelines, and Criteria */}
            <div className="lg:col-span-2 space-y-10 sm:space-y-12">
              {/* Eligibility */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 md:p-8 shadow-2xs">
                <div className="flex items-center gap-3 mb-3.5">
                  <span className="p-2.5 rounded-xl bg-primary/8 text-primary border border-primary/15">
                    <UserCheck size={20} />
                  </span>
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                    Eligibility
                  </h2>
                </div>
                <p className="text-base text-slate-600 leading-relaxed font-sans">
                  The requirements include any full-time graduate student pursuing an <strong className="text-slate-900 font-semibold">M.S., M.A., or Ph.D.</strong> degree within a discipline applicable to the HEMS conference. Students must be in good standing with their university.
                </p>
              </section>

              {/* Application Guidelines */}
              <section>
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-2">
                    <FileText className="text-primary" size={20} />
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                      Application Guidelines
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    The application for a travel award must include the following four components:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {APPLICATION_GUIDELINES.map((item) => (
                    <div
                      key={item.number}
                      className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary/35 transition-colors shadow-2xs flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="tabular-nums text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary/8 text-primary">
                          Item {item.number}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Criteria */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 md:p-8 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-5">
                  <Sparkles className="text-secondary" size={20} />
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                    Selection Criteria
                  </h2>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {EVALUATION_CRITERIA.map((criterion) => (
                    <li
                      key={criterion}
                      className="flex items-start gap-3 bg-[#FAFBFD] border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium leading-snug"
                    >
                      <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={17} />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right Sidebar: Deadline, Submission & Past Award Recipients Honor Roll */}
            <aside className="space-y-6">
              {/* Application Deadline Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                    <Calendar size={15} /> Application Deadline
                  </span>
                  {workshop.student_award_extended && (
                    <span className="bg-secondary/12 text-secondary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Extended
                    </span>
                  )}
                </div>
                <p className="tabular-nums text-xs font-medium text-slate-500 mb-1">
                  {workshop.workshop_ordinal} Workshop ({workshop.target_window}):
                </p>
                <div className="font-serif text-xl tabular-nums font-semibold text-slate-900 leading-snug">
                  {workshop.student_award_deadline}
                </div>
                {workshop.cycle_stage === "save_the_date" && (
                  <p className="tabular-nums text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    Previous 15th Workshop deadline: Friday, August 8, 2025
                  </p>
                )}
              </div>

              {/* Submit Applications Card */}
              <div className="bg-primary text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 block mb-2">
                    Submit Applications
                  </span>
                  <h3 className="font-serif text-2xl font-semibold tracking-tight mb-3 leading-snug">
                    HEMS Student Awards Committee
                  </h3>
                  <p className="text-sm text-white/90 leading-relaxed mb-5">
                    Submit your complete application materials (student letter, faculty advisor letter, presentation title/abstract/authors, and vita) to the committee:
                  </p>

                  <div className="border-l-2 border-white/35 pl-4 py-1 mb-6 space-y-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-white/75 block">
                      Committee E-mail
                    </span>
                    <a
                      href={`mailto:${workshop.student_award_email}`}
                      className="text-xs font-semibold underline break-all block text-white hover:text-white/90"
                    >
                      {workshop.student_award_email}
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={awardMailtoHref}
                    className="w-full font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs bg-white text-primary hover:bg-slate-50 shadow-2xs"
                  >
                    <Mail size={15} /> Email Application
                  </a>
                </div>
              </div>

              {/* Past Student Travel Award Recipients Honor Roll Card */}
              <section
                aria-labelledby="past-student-awardees-heading"
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
                  <span className="inline-flex items-center gap-1.5 text-primary tabular-nums text-[10.5px] font-semibold uppercase tracking-wider">
                    <BookOpen size={14} /> Symposium Archive (2007–2022)
                  </span>
                  <span className="tabular-nums text-[11px] font-semibold text-slate-600 bg-[#FAFBFD] border border-slate-200 px-2 py-0.5 rounded-full">
                    {TOTAL_PAST_RECIPIENTS} Fellows
                  </span>
                </div>

                <h3
                  id="past-student-awardees-heading"
                  className="font-serif text-xl font-semibold tracking-tight text-slate-900 mb-1.5"
                >
                  Past Award Recipients
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Graduate researchers recognized across {PAST_AWARD_CYCLES.length} biennial workshops for emerging contributions to harsh-environment mass spectrometry:
                </p>

                <div className="max-h-64 overflow-y-auto pr-1.5 space-y-3.5 border-y border-slate-100 py-3">
                  {PAST_AWARD_CYCLES.map((cycle) => (
                    <div key={cycle.year} className="space-y-1.5">
                      <Link
                        href={`/archive/${cycle.year}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums text-primary hover:underline"
                      >
                        <span>
                          {cycle.year} • {cycle.workshopTitle}
                        </span>
                        <ArrowRight size={11} />
                      </Link>
                      <ul className="space-y-1 pl-2.5 border-l border-slate-200">
                        {cycle.recipients.map((recipient) => (
                          <li key={`${cycle.year}-${recipient.name}`} className="leading-snug">
                            <span className="text-xs font-semibold text-slate-800 block">
                              {recipient.name}
                            </span>
                            {recipient.institute && (
                              <span className="text-[11px] text-slate-500 block">
                                {recipient.institute}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="pt-3.5">
                  <Link
                    href="/archive"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Browse Prior Student Research <ArrowRight size={13} />
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE B: 1-PAGE PRINTABLE STUDENT TRAVEL AWARD FLYER & APPLICATION GUIDE
          Visible on screen when `isPrintView === true` AND always rendered on `@media print`
          ===================================================================== */}
      <div className={isPrintView ? "block" : "hidden print:block"}>
        {/* On-Screen Print Preview Action Bar (Never Printed) */}
        <div className="print:hidden max-w-[8.5in] mx-auto mb-5 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePrintableView}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-primary transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft size={15} /> Back to Student Travel Awards Page
          </button>

          <span className="hidden md:inline-block text-xs font-medium text-slate-500 tabular-nums">
            Departmental Flyer &amp; Application Guide • Formatted for US Letter &amp; PDF
          </span>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <a
              href={awardMailtoHref}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Mail size={14} /> Email Committee
            </a>
            <button
              type="button"
              onClick={handlePrintDocument}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-primary text-white hover:bg-sky-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable US-Letter Sheet */}
        <article
          aria-label="HEMS Workshop Student Travel Award Printable Flyer"
          className="max-w-[8.5in] mx-auto bg-white text-slate-900 border border-slate-200/95 rounded-2xl shadow-sm p-6 sm:p-9 print:max-w-none print:mx-0 print:border-0 print:rounded-none print:shadow-none print:p-0 space-y-4 print:space-y-3"
        >
          {/* 1. Official Society Letterhead */}
          <header className="flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-4 pb-3.5 print:pb-2.5 border-b-2 border-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="w-16 sm:w-[68px] print:w-[62px] rounded-lg bg-white border border-slate-200 p-1 shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Official Emblem"
                  width={3756}
                  height={2594}
                  decoding="sync"
                  className="w-full h-auto object-contain mix-blend-multiply block"
                />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl print:text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
                  Harsh-Environment Mass Spectrometry Society, Inc.
                </h2>
                <p className="text-[11px] print:text-[10px] font-medium text-slate-600 tabular-nums mt-0.5">
                  IRS-Recognized 501(c)(3) Scientific Public Charity • Incorporated in Florida (Est. 2008)
                </p>
              </div>
            </div>

            <div className="sm:text-right print:text-right shrink-0">
              <span className="block text-[10px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
                Graduate Student Travel Awards
              </span>
              <p className="font-serif text-sm sm:text-base print:text-[13.5px] font-semibold text-slate-900 mt-0.5 tabular-nums">
                {workshop.workshop_ordinal} Biennial HEMS Workshop
              </p>
              <p className="text-[11px] print:text-[10px] text-slate-600 tabular-nums">
                {printScheduleLine}
              </p>
            </div>
          </header>

          {/* 2. Purpose, Proposed Award Amount & Graduate Eligibility */}
          <section className="space-y-2.5 print:space-y-2 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              01 · Award Purpose &amp; Graduate Eligibility
            </h2>
            <p className="text-xs sm:text-[13px] print:text-[11px] text-slate-700 leading-relaxed print:leading-[1.45]">
              The <strong className="font-semibold text-slate-900">HEMS Workshop Student Travel Award</strong> encourages emerging investigators in Harsh-Environment Mass Spectrometry—spanning deep-ocean sensing, planetary exploration, atmospheric and volcanic plumes, field security, and industrial process monitoring—and rewards the scientific merit and quality of graduate research. Any <strong className="font-semibold text-slate-900">full-time graduate student pursuing an M.S., M.A., or Ph.D. degree</strong> in a discipline applicable to the HEMS Workshop and in good standing with their university is eligible to apply.
            </p>

            {/* 4-Column Quick Program Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 print:gap-2 pt-0.5">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Proposed Award
                </span>
                <span className="block text-xs print:text-[11px] font-bold text-primary mt-0.5 tabular-nums">
                  {workshop.student_award_amount} Travel Grant
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Eligible Degrees
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 mt-0.5">
                  Full-Time M.S. / M.A. / Ph.D.
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  {workshop.student_award_extended ? "Extended Deadline" : "Application Deadline"}
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-secondary mt-0.5 tabular-nums">
                  {workshop.student_award_deadline}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Symposium Format
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 mt-0.5">
                  Single-Track Oral &amp; Poster
                </span>
              </div>
            </div>
          </section>

          {/* 3. Required Application Package (4 Components — 2x2 Grid) */}
          <section className="space-y-2 print:space-y-1.5 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              02 · Required Application Package (Four Components)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 print:gap-2">
              {APPLICATION_GUIDELINES.map((item) => (
                <div
                  key={item.number}
                  className="border border-slate-200 rounded-lg p-3 print:p-2.5 bg-white"
                >
                  <div className="flex items-baseline gap-2 mb-1 print:mb-0.5">
                    <span className="tabular-nums text-[10px] print:text-[9.5px] font-bold text-primary">
                      ITEM {item.number}
                    </span>
                    <h3 className="text-xs print:text-[11px] font-bold text-slate-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[11.5px] print:text-[10px] text-slate-600 leading-snug print:leading-[1.38]">
                    {item.printSummary}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Selection Criteria & Evaluation Rubric */}
          <section className="space-y-2 print:space-y-1.5 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              03 · Committee Selection &amp; Evaluation Criteria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-1.5">
              {EVALUATION_CRITERIA.map((criterion, index) => (
                <div
                  key={criterion}
                  className="flex items-start gap-2.5 border border-slate-200 bg-slate-50/70 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5"
                >
                  <span className="tabular-nums text-[10px] print:text-[9.5px] font-bold text-secondary shrink-0 mt-0.5">
                    0{index + 1}
                  </span>
                  <span className="text-xs print:text-[10.5px] font-medium text-slate-800 leading-snug">
                    {criterion}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Symposium Mentorship & Alumni Track Record */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              04 · Single-Track Community &amp; Past Award Recipients (2007–2022)
            </h2>
            <p className="text-[11.5px] print:text-[10px] text-slate-600 leading-relaxed print:leading-[1.4]">
              Unlike multi-track mega-conferences, HEMS convenes every attendee in a single lecture room—giving Student Travel Award recipients direct visibility and discussion with principal investigators from NASA/JPL, national laboratories, oceanographic institutes, and leading instrumentation manufacturers. Across {PAST_AWARD_CYCLES.length} biennial workshops, HEMS has recognized {TOTAL_PAST_RECIPIENTS} graduate fellows from universities including Purdue University, Caltech, Duke University, UNC Chapel Hill, Boston University, University of North Texas, University of Liverpool, TU Hamburg-Harburg, Universität Giessen, and Universidad de Costa Rica.
            </p>
          </section>

          {/* 6. Actionable Submission & Committee Contact Box */}
          <footer className="border-2 border-slate-300 bg-slate-50/80 rounded-xl p-3.5 print:p-2.5 grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-3.5 print:gap-3 items-center break-inside-avoid">
            <div className="sm:col-span-7 print:col-span-7 space-y-1">
              <span className="block text-[10px] print:text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-900">
                How to Submit a Student Travel Award Application
              </span>
              <ol className="text-[11px] print:text-[9.8px] text-slate-700 space-y-0.5 leading-snug list-decimal list-inside">
                <li>
                  <strong className="font-semibold text-slate-900">Prepare Items 01–04:</strong>{" "}
                  Compile the student letter, presentation title/abstract/authors, and current CV.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Coordinate Faculty Letter:</strong>{" "}
                  Include the faculty advisor&apos;s supporting letter with the packet or have the advisor email it directly.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Submit Before Deadline:</strong>{" "}
                  Send the complete packet to the Awards Committee ({workshop.student_award_deadline}).
                </li>
              </ol>
            </div>

            <div className="sm:col-span-5 print:col-span-5 sm:border-l print:border-l border-slate-300 sm:pl-4 print:pl-3.5 space-y-0.5 text-[11px] print:text-[10px]">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.1em] text-primary">
                HEMS Student Awards Committee
              </span>
              <p className="font-bold text-slate-900 text-xs print:text-[11px]">
                {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window})
              </p>
              <p className="font-semibold text-primary break-all">{workshop.student_award_email}</p>
              <p className="text-slate-600 tabular-nums">www.hems-workshop.org/student-awards</p>
              <p className="text-[9.5px] print:text-[8.8px] text-slate-500 pt-0.5">
                All-volunteer IRS 501(c)(3) society • Open-access proceedings
              </p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
