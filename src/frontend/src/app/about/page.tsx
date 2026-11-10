import Link from "next/link";
import {
  Users,
  Cpu,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Target,
  History,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "About the HEMS Society | Harsh-Environment Mass Spectrometry",
  description:
    "Learn about the official mission and strategic objectives of the Harsh-Environment Mass Spectrometry Society, Inc., a 501(c)(3) nonprofit advancing in situ chemical measurement.",
};

const OBJECTIVES = [
  {
    title: "Facilitate Collaboration",
    icon: Users,
    color: "primary",
    description:
      "We strive to create an inclusive community that encourages cross-disciplinary collaboration among scientists and engineers working in the field of mass spectrometry.",
  },
  {
    title: "Promote Enabling Technologies",
    icon: Cpu,
    color: "secondary",
    description:
      "Engage with groups that focus on enabling technologies that enhance the capabilities of portable mass spectrometers. These include advancements in power management, sample introduction, signal processing, and miniaturization techniques to improve performance and expand application possibilities.",
  },
  {
    title: "Knowledge Exchange",
    icon: BookOpen,
    color: "primary",
    description:
      "Through the HEMS Workshop, focus groups at conferences, and publications, we promote the dissemination of cutting-edge research, innovative technologies, and practical experiences related to mass spectrometry deployment in challenging environments.",
  },
  {
    title: "Foster Innovation",
    icon: Lightbulb,
    color: "secondary",
    description:
      "The HEMS Society is committed to fostering innovation and development efforts that enhance the reliability, portability, efficiency, and performance of mass spectrometers in various harsh environments.",
  },
  {
    title: "Outreach and Education",
    icon: GraduationCap,
    color: "primary",
    description:
      "We engage with the public, researchers, and industry stakeholders to raise awareness about the importance and potential of portable mass spectrometry in field applications.",
  },
];

export default function About() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="mb-14 pb-8 border-b border-foreground/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
              <ShieldCheck size={14} />
              501(c)(3) Nonprofit Public Charity • Established 1999
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              About the <span className="text-primary border-b-4 border-primary">HEMS</span> Society
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-sans">
              The Harsh-Environment Mass Spectrometry Society, Inc. is dedicated to advancing chemical measurement technologies outside controlled laboratory settings, accelerating the realization of compact, reliable, and energy-efficient instrumentation.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-surface/60 border border-foreground/10 rounded-2xl shadow-sm self-start md:self-center">
            <img
              src="/hemslogo.jpg"
              alt="HEMS Society Official Logo"
              className="w-28 h-28 object-contain rounded-xl border border-foreground/10 mix-blend-multiply bg-white p-2"
            />
            <span className="text-[11px] font-mono text-foreground/60 mt-2">Official Seal</span>
          </div>
        </div>
      </div>

      {/* Mission Statement Hero Card */}
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border-2 border-primary/30 p-8 md:p-12 shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Target size={240} className="text-primary" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Target size={26} />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                Official Charter &amp; Purpose
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-6">
              Our Mission
            </h2>
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-sans font-medium">
              &ldquo;Our mission is to provide a platform for scientists, engineers, and users to come together, exchange knowledge, and address common challenges related to deploying mass spectrometry technology outside a controlled laboratory environment. By facilitating interaction and cooperation, we aim to accelerate the realization of reliable, compact, and energy-efficient mass spectrometry solutions for demanding, and at times extremely harsh, environments.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Strategic Objectives Grid */}
      <section className="mb-20">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-secondary" size={22} />
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
              Core Strategic Objectives
            </h2>
          </div>
          <p className="text-foreground/70 font-sans max-w-3xl">
            The society channels its community and conference activities through five foundational pillars to accelerate field analytical chemistry.
          </p>
          <div className="w-20 h-1 bg-secondary mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OBJECTIVES.map((obj, idx) => {
            const Icon = obj.icon;
            const isEmerald = obj.color === "secondary";
            return (
              <div
                key={idx}
                className={`bg-surface/50 border border-foreground/10 rounded-xl p-7 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-sm ${
                  idx === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`p-3 rounded-xl ${
                        isEmerald ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                      } group-hover:scale-110 transition-transform`}
                    >
                      <Icon size={24} />
                    </span>
                    <span className="font-mono text-xs text-foreground/40 font-bold">0{idx + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-wide text-foreground mb-3">
                    {obj.title}
                  </h3>
                  <p className="text-sm text-foreground/75 leading-relaxed font-sans">
                    {obj.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual Call-to-Action Cards: History & Proceedings Archive */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary/10 via-surface/60 to-secondary/10 border border-primary/25 rounded-2xl p-8 md:p-10 flex flex-col justify-between gap-6 shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider mb-3">
              <History size={16} /> Heritage Since 1999
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
              Workshop &amp; Society History
            </h3>
            <p className="text-foreground/75 font-sans text-sm leading-relaxed">
              Trace the story of HEMS from its 1999 origins at the USF Center for Ocean Technology through its 2008 incorporation and international beachfront workshops.
            </p>
          </div>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 bg-foreground text-background font-bold px-6 py-3.5 rounded-lg hover:bg-foreground/90 transition-all shadow-sm w-fit uppercase tracking-wide text-xs"
          >
            Read Full History
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="bg-surface border border-foreground/10 rounded-2xl p-8 md:p-10 flex flex-col justify-between gap-6 shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 text-secondary font-mono text-xs font-bold uppercase tracking-wider mb-3">
              <BookOpen size={16} /> 15 Symposia Cataloged
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
              Explore 25+ Years of Proceedings
            </h3>
            <p className="text-foreground/75 font-sans text-sm leading-relaxed">
              Delve into complete technical programs, keynote slides, poster sessions, and presentation manuscripts from 1999 to the 15th HEMS Workshop.
            </p>
          </div>
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 bg-primary text-background font-bold px-6 py-3.5 rounded-lg hover:bg-primary/90 transition-all shadow-sm w-fit uppercase tracking-wide text-xs"
          >
            View Proceedings Archive
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
