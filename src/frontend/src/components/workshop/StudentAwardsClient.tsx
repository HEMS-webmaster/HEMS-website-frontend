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
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

interface GuidelineItem {
  number: string;
  title: string;
  description: string;
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

export default function StudentAwardsClient() {
  const { workshop } = useUpcomingWorkshop();

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="mb-14 pb-8 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium tabular-nums leading-snug mb-4 shadow-2xs">
              <GraduationCap size={15} className="text-primary shrink-0" />
              <span>
                Graduate Student Research Support • {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window})
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4">
              Student Travel <span className="text-primary italic font-normal">Awards</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed font-sans">
              Encouraging interest in Harsh-Environment Mass Spectrometry and rewarding the scientific merit and quality of graduate student research.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs self-start md:self-center">
            <img
              src="/hemslogo.jpg"
              alt="HEMS Society Official Logo"
              width={96}
              height={96}
              decoding="async"
              className="w-24 h-24 object-contain rounded-xl mix-blend-multiply bg-white p-1.5"
            />
            <span className="text-[11px] font-medium text-slate-500 mt-1.5">Emerging Investigators</span>
          </div>
        </div>
      </header>

      {/* Purpose & Award Amount Hero Card */}
      <section className="mb-12 sm:mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/95 p-5 sm:p-8 md:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-start sm:items-center gap-2.5 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
                <Award size={17} className="shrink-0 mt-0.5 sm:mt-0" /> Purpose of the HEMS Workshop Student Travel Award
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-4">
                Rewarding Scientific Merit in Harsh-Environment MS
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed font-sans">
                The workshop award is intended to encourage interest in the topics applicable to Harsh-Environment Mass Spectrometry (HEMS) and reward the scientific merit and quality of student research in the area of HEMS.
              </p>
            </div>

            <div className="bg-[#FAFBFD] border border-slate-200 rounded-xl p-6 text-center lg:text-left">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">
                Proposed Award Amount
              </span>
              <div className="text-4xl font-serif tabular-nums font-semibold text-primary mb-2">
                {workshop.student_award_amount}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proposed travel award per biennial workshop cycle ({workshop.workshop_ordinal} Workshop target: <strong>{workshop.target_window}</strong>).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Eligibility, Guidelines, and Criteria */}
        <div className="lg:col-span-2 space-y-12">
          {/* Eligibility */}
          <section className="bg-surface/50 border border-foreground/10 rounded-2xl p-5 sm:p-7 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <UserCheck size={22} />
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Eligibility
              </h2>
            </div>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              The requirements include any full-time graduate student pursuing an <strong>M.S., M.A., or Ph.D.</strong> degree within a discipline applicable to the HEMS conference. Students must be in good standing with their university.
            </p>
          </section>

          {/* Application Guidelines */}
          <section>
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <FileText className="text-primary" size={22} />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                  Application Guidelines
                </h2>
              </div>
              <p className="text-sm text-foreground/70">
                The application for a travel award must include the following four components:
              </p>
              <div className="w-16 h-1 bg-primary mt-3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {APPLICATION_GUIDELINES.map((item) => (
                <div
                  key={item.number}
                  className="bg-background border border-foreground/15 rounded-xl p-6 hover:border-primary/40 transition-all shadow-sm flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="tabular-nums text-[11px] font-bold tracking-wider px-2.5 py-1 rounded bg-primary/10 text-primary">
                      ITEM {item.number}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground/75 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Criteria */}
          <section className="bg-surface/50 border border-foreground/10 rounded-2xl p-5 sm:p-7 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <Sparkles className="text-secondary" size={22} />
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Selection Criteria
              </h2>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EVALUATION_CRITERIA.map((criterion) => (
                <li
                  key={criterion}
                  className="flex items-start gap-3 bg-background border border-foreground/10 rounded-xl p-4 text-sm text-foreground/85 font-medium"
                >
                  <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={18} />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Sidebar: Deadline & Submission */}
        <aside className="space-y-6">
          {/* Application Deadline Card */}
          <div className="bg-background border-2 border-secondary/35 rounded-2xl p-7 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-foreground/10 pb-3 mb-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
                <Calendar size={16} /> Application Deadline
              </span>
              {workshop.student_award_extended && (
                <span className="bg-secondary/15 text-secondary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Extended
                </span>
              )}
            </div>
            <p className="tabular-nums text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-1">
              {workshop.workshop_ordinal} Workshop ({workshop.target_window}):
            </p>
            <div className="text-xl tabular-nums font-black text-foreground">
              {workshop.student_award_deadline}
            </div>
            {workshop.cycle_stage === "save_the_date" && (
              <p className="tabular-nums text-[11px] text-foreground/55 mt-3 pt-3 border-t border-foreground/10">
                Previous 15th Workshop deadline: Friday, August 8, 2025
              </p>
            )}
          </div>

          {/* Submit Applications Card */}
          <div className="bg-primary text-background rounded-2xl p-7 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest opacity-85 block mb-2">
                Submit Applications
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
                HEMS Student Awards Committee
              </h3>
              <p className="text-sm opacity-95 leading-relaxed mb-6">
                Submit your complete application materials (student letter, faculty advisor letter, presentation title/abstract/authors, and vita) to the committee:
              </p>

              <div className="border-l-2 border-background/40 pl-4 py-1 mb-6 space-y-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80 block">
                  Committee E-mail
                </span>
                <a
                  href={`mailto:${workshop.student_award_email}`}
                  className="text-xs font-bold underline break-all block"
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
                  className="w-full bg-background text-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase tracking-wide"
                >
                  Submit via Online Form <ExternalLink size={14} />
                </a>
              )}
              <a
                href={`mailto:${workshop.student_award_email}?subject=${encodeURIComponent(
                  `${workshop.workshop_ordinal} HEMS Workshop Student Travel Award Application`
                )}`}
                className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wide ${
                  workshop.student_award_form_url
                    ? "border border-background/40 text-background hover:bg-background/10"
                    : "bg-background text-primary hover:bg-background/90 shadow-sm"
                }`}
              >
                <Mail size={15} /> Email Application
              </a>
            </div>
          </div>

          {/* Archive Reference & Celebration Photo Card */}
          <figure className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
              <img
                src="/images/gallery/student-award-certificate-2015.jpg"
                alt="2015 HEMS Workshop Student Travel Award recipient holding his official Award Certificate alongside the Student Awards Committee Chair"
                width={1600}
                height={1082}
                decoding="async"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
            <figcaption className="px-1.5 pb-1">
              <div className="flex items-center gap-2 text-primary tabular-nums text-[10.5px] font-semibold uppercase tracking-wider mb-1.5">
                <BookOpen size={14} /> 10th HEMS Workshop • Sept 15, 2015
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                2015 Student Travel Award recipient Andrew Hampton (University of North Carolina at Chapel Hill) with Student Awards Committee Chair Torben Gentz (Alfred Wegener Institute) at the Rusty Scupper on Baltimore&apos;s Inner Harbor.
              </p>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Browse Prior Student Research <ArrowRight size={13} />
              </Link>
            </figcaption>
          </figure>
        </aside>
      </div>
    </div>
  );
}

