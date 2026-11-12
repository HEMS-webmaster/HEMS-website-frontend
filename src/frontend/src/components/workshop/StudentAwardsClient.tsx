"use client";

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
  ExternalLink,
} from "lucide-react";
import masterWorkshopsData from "@/data/master_workshops.json";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

interface GuidelineItem {
  number: string;
  title: string;
  description: string;
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
  },
  {
    number: "02",
    title: "Faculty Advisor Letter",
    description:
      "A detailed letter from the student's faculty advisor indicating why the student is deserving of receiving a travel award and any special circumstances.",
  },
  {
    number: "03",
    title: "Presentation Title, Abstract & Authors",
    description:
      "The title of the presentation to be presented by the student at the meeting, along with the abstract, and authors.",
  },
  {
    number: "04",
    title: "Curriculum Vitae (Vita)",
    description:
      "A vita that includes the student's research interests, projects, and papers published.",
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

  return (
    <div className="flex flex-col flex-grow max-w-6xl mx-auto w-full min-w-0">
      {/* Page Header */}
      <header className="mb-10 sm:mb-14 pb-8 border-b border-slate-200">
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
          <div className="flex flex-col items-center p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs self-start md:self-center shrink-0">
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

      {/* Purpose & Award Amount Hero Card */}
      <section className="mb-12 sm:mb-14">
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/95 p-6 sm:p-8 md:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-start sm:items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                <Award size={16} className="shrink-0 mt-0.5 sm:mt-0" /> Purpose of the HEMS Workshop Student Travel Award
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-3.5 leading-snug">
                Rewarding Scientific Merit in Harsh-Environment MS
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-sans">
                The workshop award is intended to encourage interest in the topics applicable to Harsh-Environment Mass Spectrometry (HEMS) and reward the scientific merit and quality of student research in the area of HEMS.
              </p>
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
              {workshop.student_award_form_url && (
                <a
                  href={workshop.student_award_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white text-primary font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-2xs text-xs"
                >
                  Submit via Online Form <ExternalLink size={14} />
                </a>
              )}
              <a
                href={`mailto:${workshop.student_award_email}?subject=${encodeURIComponent(
                  `${workshop.workshop_ordinal} HEMS Workshop Student Travel Award Application`
                )}`}
                className={`w-full font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs ${
                  workshop.student_award_form_url
                    ? "border border-white/40 text-white hover:bg-white/10"
                    : "bg-white text-primary hover:bg-slate-50 shadow-2xs"
                }`}
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
  );
}
