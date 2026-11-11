import type { Metadata } from "next";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "About the HEMS Society | Harsh-Environment Mass Spectrometry",
  description:
    "Learn about the official mission and strategic objectives of the Harsh-Environment Mass Spectrometry Society, Inc., a 501(c)(3) nonprofit advancing in situ chemical measurement.",
};

const OBJECTIVES = [
  {
    title: "Facilitate Collaboration",
    icon: Users,
    accent: "primary" as const,
    description:
      "We strive to create an inclusive community that encourages cross-disciplinary collaboration among scientists and engineers working in the field of mass spectrometry.",
  },
  {
    title: "Promote Enabling Technologies",
    icon: Cpu,
    accent: "secondary" as const,
    description:
      "Engage with groups that focus on enabling technologies that enhance the capabilities of portable mass spectrometers. These include advancements in power management, sample introduction, signal processing, and miniaturization techniques to improve performance and expand application possibilities.",
  },
  {
    title: "Knowledge Exchange",
    icon: BookOpen,
    accent: "primary" as const,
    description:
      "Through the HEMS Workshop, focus groups at conferences, and publications, we promote the dissemination of cutting-edge research, innovative technologies, and practical experiences related to mass spectrometry deployment in challenging environments.",
  },
  {
    title: "Foster Innovation",
    icon: Lightbulb,
    accent: "secondary" as const,
    description:
      "The HEMS Society is committed to fostering innovation and development efforts that enhance the reliability, portability, efficiency, and performance of mass spectrometers in various harsh environments.",
  },
  {
    title: "Outreach and Education",
    icon: GraduationCap,
    accent: "primary" as const,
    description:
      "We engage with the public, researchers, and industry stakeholders to raise awareness about the importance and potential of portable mass spectrometry in field applications.",
  },
];

export default function About() {
  return (
    <div className="flex flex-col flex-grow">
      {/* EDITORIAL PAGE HEADER */}
      <section className="bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FA] border-b border-slate-200/85 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono shadow-2xs">
                <ShieldCheck size={13} className="text-primary" />
                <span>501(c)(3) Scientific Public Charity • Est. 1999</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                About the{" "}
                <span className="text-primary italic font-normal">HEMS</span> Society
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
                The Harsh-Environment Mass Spectrometry Society, Inc. unites academic, government, and industrial investigators advancing chemical measurement outside controlled laboratory settings.
              </p>
            </div>

            <div className="lg:col-span-4 lg:justify-self-end">
              <div className="inline-flex items-center gap-4 bg-white border border-slate-200/90 rounded-xl px-5 py-4 shadow-2xs">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Official Seal"
                  className="w-14 h-14 object-contain mix-blend-multiply shrink-0"
                />
                <div>
                  <div className="font-serif font-semibold text-slate-900 text-base">
                    All-Volunteer Forum
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    Zero Annual Membership Dues
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION STATEMENT + 2025 COMMUNITY PORTRAIT */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <Target size={15} /> 01 — Official Charter &amp; Purpose
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Our Mission
              </h2>

              <blockquote className="font-serif text-lg sm:text-xl text-slate-800 leading-relaxed border-l-2 border-primary pl-5 py-1">
                &ldquo;Our mission is to provide a platform for scientists, engineers, and users to come together, exchange knowledge, and address common challenges related to deploying mass spectrometry technology outside a controlled laboratory environment. By facilitating interaction and cooperation, we aim to accelerate the realization of reliable, compact, and energy-efficient mass spectrometry solutions for demanding, and at times extremely harsh, environments.&rdquo;
              </blockquote>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Incorporated in Florida as a tax-exempt 501(c)(3) nonprofit corporation, the Society is governed by a rotating volunteer Organizing Committee drawn from universities, national laboratories, space agencies, and analytical instrumentation pioneers.
              </p>
            </div>

            {/* 2025 Community Group Portrait */}
            <figure className="lg:col-span-5 bg-[#FAFBFD] border border-slate-200/95 rounded-2xl p-3.5 sm:p-4 shadow-xs">
              <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100">
                <img
                  src="/images/gallery/group-photo-2025.jpg"
                  alt="Participants of the 15th Biennial Harsh-Environment Mass Spectrometry Workshop gathered in Virginia Beach, September 2025"
                  className="w-full h-auto block"
                  loading="eager"
                />
              </div>
              <figcaption className="pt-3.5 px-1 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  <span>15th Biennial Symposium</span>
                  <span className="text-slate-400">Virginia Beach • Sept 2025</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Investigators, engineers, corporate partners, and graduate students gathered at the 2025 HEMS Workshop—continuing over 25 years of informal, high-trust scientific fellowship.
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* CORE STRATEGIC OBJECTIVES + LIVE HARDWARE DEMO PLATE */}
      <section className="py-14 sm:py-20 bg-[#FAFBFD] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary block mb-2">
              02 — Strategic Pillars
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
              Core Strategic Objectives
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2">
              The Society channels its biennial workshops, student travel awards, and open proceedings archive through five foundational commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OBJECTIVES.map((obj, idx) => {
              const Icon = obj.icon;
              const isSecondary = obj.accent === "secondary";
              return (
                <article
                  key={obj.title}
                  className="bg-white border border-slate-200/90 rounded-xl p-7 hover:border-primary/40 transition-colors flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className={`p-2.5 rounded-lg border ${
                          isSecondary
                            ? "bg-teal-50/70 text-secondary border-teal-200/70"
                            : "bg-sky-50/80 text-primary border-sky-200/70"
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-semibold">
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2.5">
                      {obj.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{obj.description}</p>
                  </div>
                </article>
              );
            })}

            {/* 6th Card: Casual Coastal Camaraderie Photo */}
            <figure className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
              <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                <img
                  src="/images/gallery/don-cesar-hawaiian-smiles-2013.jpg"
                  alt="Smiling HEMS Workshop colleagues in Hawaiian and casual attire on the beachfront terrace at St. Pete Beach"
                  className="w-full aspect-[3/2] object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="pt-4 px-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary block mb-1">
                  Coastal Camaraderie
                </span>
                <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">
                  Informal Beachfront Fellowship
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unhurried conversations, Hawaiian shirts, and lasting cross-institution friendships forged between technical sessions.
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* DUAL NAVIGATION CARDS */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-7 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-mono text-[11px] font-semibold uppercase tracking-[0.14em] mb-2">
                <History size={15} /> Heritage Since 1999
              </div>
              <h3 className="font-serif text-2xl font-semibold text-slate-900 mb-2">
                Workshop &amp; Society History
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Trace the story of HEMS from its 1999 origins at the USF Center for Ocean Technology through its 2008 incorporation and coastal workshops across North America and Europe.
              </p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 font-semibold px-5 py-2.5 rounded-lg hover:border-primary/50 hover:text-primary transition-colors shadow-2xs w-fit text-sm"
            >
              <span>Read Full History</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-7 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-secondary font-mono text-[11px] font-semibold uppercase tracking-[0.14em] mb-2">
                <BookOpen size={15} /> 15 Symposia Cataloged
              </div>
              <h3 className="font-serif text-2xl font-semibold text-slate-900 mb-2">
                Explore 25+ Years of Proceedings
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Browse complete technical programs, keynote slide decks, poster sessions, and extended abstracts from 1999 through the 2025 Virginia Beach Workshop.
              </p>
            </div>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-sky-800 transition-colors shadow-xs w-fit text-sm"
            >
              <span>View Proceedings Archive</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
