import type { Metadata } from "next";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Student Travel Awards | HEMS Workshop",
  description:
    "HEMS Workshop Student Travel Award guidelines, $1,500.00 proposed award details, M.S./M.A./Ph.D. eligibility, selection criteria, and application instructions.",
};

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

export default function StudentTravelAwardsPage() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="mb-14 pb-8 border-b border-foreground/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
              <GraduationCap size={15} />
              Graduate Student Research Support • HEMS Workshop
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              Student Travel <span className="text-primary border-b-4 border-primary">Awards</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-sans">
              Encouraging interest in Harsh-Environment Mass Spectrometry and rewarding the scientific merit and quality of graduate student research.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-surface/60 border border-foreground/10 rounded-2xl shadow-sm self-start md:self-center">
            <img
              src="/hemslogo.jpg"
              alt="HEMS Society Official Logo"
              className="w-28 h-28 object-contain rounded-xl border border-foreground/10 mix-blend-multiply bg-white p-2"
            />
            <span className="text-[11px] font-mono text-foreground/60 mt-2">Student Awards</span>
          </div>
        </div>
      </header>

      {/* Purpose & Award Amount Hero Card */}
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border-2 border-primary/30 p-8 md:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 text-primary font-mono text-xs font-bold uppercase tracking-widest mb-3">
                <Award size={18} /> Purpose of the HEMS Workshop Student Travel Award
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-4">
                Rewarding Scientific Merit in Harsh-Environment MS
              </h2>
              <p className="text-base md:text-lg text-foreground/85 leading-relaxed font-sans">
                The workshop award is intended to encourage interest in the topics applicable to Harsh-Environment Mass Spectrometry (HEMS) and reward the scientific merit and quality of student research in the area of HEMS.
              </p>
            </div>

            <div className="bg-background border border-primary/25 rounded-xl p-6 shadow-sm text-center lg:text-left">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground/55 block mb-1">
                Proposed Award Amount
              </span>
              <div className="text-4xl font-mono font-black text-primary mb-2">$1,500.00</div>
              <p className="text-xs text-foreground/75 leading-relaxed">
                For the 2025 HEMS Workshop, the proposed award is <strong>$1,500.00</strong>.
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
          <section className="bg-surface/50 border border-foreground/10 rounded-2xl p-7 md:p-8 shadow-sm">
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
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-primary/10 text-primary">
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
          <section className="bg-surface/50 border border-foreground/10 rounded-2xl p-7 md:p-8 shadow-sm">
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

        {/* Right Sidebar: Deadline & Email Submission */}
        <aside className="space-y-6">
          {/* Application Deadline Card */}
          <div className="bg-background border-2 border-secondary/35 rounded-2xl p-7 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-foreground/10 pb-3 mb-4">
              <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                <Calendar size={16} /> Application Deadline
              </span>
              <span className="bg-secondary/15 text-secondary text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded">
                Extended
              </span>
            </div>
            <p className="text-xs font-mono uppercase text-foreground/55 mb-1">
              Student Travel Award Application Deadline Extended To:
            </p>
            <div className="text-2xl font-mono font-black text-foreground">
              Friday, August 8, 2025
            </div>
          </div>

          {/* Submit Applications Card */}
          <div className="bg-primary text-background rounded-2xl p-7 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest opacity-85 block mb-2">
                Submit Applications by E-mail
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
                HEMS Student Awards Committee
              </h3>
              <p className="text-sm opacity-95 leading-relaxed mb-6">
                Submit your complete application materials (student letter, faculty advisor letter, presentation title/abstract/authors, and vita) by e-mail to the committee:
              </p>

              <div className="border-l-2 border-background/40 pl-4 py-1 mb-6 space-y-1">
                <span className="text-[10px] uppercase opacity-80 font-mono block">
                  Committee E-mail
                </span>
                <a
                  href="mailto:hemsworkshop@hems-workshop.org"
                  className="font-mono text-xs font-bold underline break-all block"
                >
                  hemsworkshop@hems-workshop.org
                </a>
              </div>
            </div>

            <a
              href="mailto:hemsworkshop@hems-workshop.org?subject=HEMS%20Workshop%20Student%20Travel%20Award%20Application"
              className="w-full bg-background text-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase tracking-wide"
            >
              <Mail size={15} /> Email Application
            </a>
          </div>

          {/* Archive Reference Card */}
          <div className="bg-surface/60 border border-foreground/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen size={15} /> Prior Student Research
            </div>
            <p className="text-xs text-foreground/75 leading-relaxed mb-4">
              Explore oral presentations, posters, and abstracts from past Student Travel Award recipients across 15 HEMS Workshops in our open proceedings archive.
            </p>
            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline uppercase tracking-wide"
            >
              Browse Proceedings Archive <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
