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
  Calendar,
  Award,
  Activity,
} from "lucide-react";
import HeroMassSpectrum from "@/components/home/HeroMassSpectrum";
import { galleryImageUrl } from "@/utils/galleryAssets";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "About the HEMS Society | Harsh-Environment Mass Spectrometry";
const PAGE_DESCRIPTION =
  "Official mission statement and five core objectives of the Harsh-Environment Mass Spectrometry Society, Inc., an IRS 501(c)(3) nonprofit advancing field chemical sensing.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/about",
  keywords: [
    "About HEMS Society",
    "Harsh-Environment Mass Spectrometry Society mission",
    "501(c)(3) mass spectrometry society",
  ],
});

// Verbatim core objectives from docs/source-documents/mission-statementV4.md
const OBJECTIVES = [
  {
    title: "Build an Inclusive Community",
    icon: Users,
    accent: "primary" as const,
    description:
      "We bring together instrument developers, analytical scientists, and end-users from academia, government laboratories, and industry in an open, welcoming forum for collaboration.",
  },
  {
    title: "Advance Enabling Technologies",
    icon: Cpu,
    accent: "secondary" as const,
    description:
      "We champion progress in the subsystems that make field mass spectrometry possible, including miniaturization, compact vacuum systems, sample introduction, power management, and onboard signal processing.",
  },
  {
    title: "Share Practical Knowledge",
    icon: BookOpen,
    accent: "primary" as const,
    description:
      "Through the HEMS Workshop, conference focus groups, and our open-access proceedings, we share cutting-edge research alongside candid lessons from real-world deployments.",
  },
  {
    title: "Bridge the Lab and the Field",
    icon: Lightbulb,
    accent: "secondary" as const,
    description:
      "We help move promising concepts from the laboratory into operational use, improving the ruggedness, autonomy, and analytical performance of in-situ instruments.",
  },
  {
    title: "Educate and Mentor",
    icon: GraduationCap,
    accent: "primary" as const,
    description:
      "Through Student Travel Awards, mentorship, and public outreach, we support the next generation of field mass spectrometrists and raise awareness of what in-situ chemical analysis can do.",
  },
];

const INSTITUTIONAL_FACTS = [
  {
    icon: Calendar,
    label: "Biennial Continuum",
    value: "Est. 1999 • 15 Workshops",
    detail: "Formed in St. Petersburg, FL in 1999; incorporated as a Florida 501(c)(3) nonprofit in 2008.",
  },
  {
    icon: Users,
    label: "Symposium Format",
    value: "Single-Track Discourse",
    detail: "Every attendee shares the same room—uniting hardware builders, chemists, and field operators.",
  },
  {
    icon: BookOpen,
    label: "Open Knowledge",
    value: "Zero Dues • Open Archive",
    detail: "No annual membership fees and unrestricted access to 25+ years of workshop proceedings.",
  },
  {
    icon: Award,
    label: "Emerging Scientists",
    value: "Student Travel Grants",
    detail: "Competitive stipends supporting graduate and student investigators presenting field research.",
  },
];

export default function About() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/about",
    pageType: "AboutPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ],
  });

  return (
    <div className="flex flex-col flex-grow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* EDITORIAL PAGE HEADER */}
      <section className="bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FA] border-b border-slate-200/85 py-7 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium tabular-nums leading-snug shadow-2xs">
                <ShieldCheck size={13} className="text-primary shrink-0" />
                <span>501(c)(3) Scientific Public Charity • Est. 1999</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                About the{" "}
                <span className="text-primary italic font-normal">HEMS</span> Society
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed">
                The Harsh-Environment Mass Spectrometry Society, Inc. unites academic, government, and industrial investigators advancing chemical measurement outside controlled laboratory settings.
              </p>
            </div>

            {/* Restrained Society Seal Card (56–64px emblem per Brand Guide v3.1.0 §4.2) */}
            <div className="hidden lg:inline-flex items-center gap-3.5 bg-white border border-slate-200/90 rounded-xl px-4 py-3 shadow-2xs self-start lg:self-end shrink-0">
              <img
                src="/hemslogo.jpg"
                alt="HEMS Society Official Seal"
                width={3756}
                height={2594}
                decoding="async"
                className="w-14 sm:w-16 h-auto object-contain mix-blend-multiply bg-white shrink-0 block"
              />
              <div>
                <div className="font-serif font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                  All-Volunteer 501(c)(3) Society
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Est. 1999 • Zero Membership Dues
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 01: MISSION STATEMENT + INSTITUTIONAL SNAPSHOT + UNCROPPED 2025 PORTRAIT */}
      <section className="py-12 sm:py-18 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left 7 Columns: Official Mission Statement + 2x2 Institutional Profile */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  <Target size={14} /> 01 — Official Charter
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                  Mission Statement
                </h2>
              </div>

              <div className="bg-[#FAFBFD] border border-slate-200/90 border-l-4 border-l-primary rounded-r-xl p-6 sm:p-7 shadow-2xs">
                <p className="font-serif text-lg sm:text-[19.5px] text-slate-800 leading-relaxed">
                  Our mission is to bring together scientists, engineers, and field operators to exchange knowledge and solve the shared challenges of deploying mass spectrometry outside the laboratory. Through open, cross-disciplinary cooperation, we accelerate the realization of reliable, compact, and energy-efficient instruments for demanding, and at times extremely harsh, environments—for example, the deep ocean, upper atmosphere, planetary surfaces, industrial sites, and defense and security operations.
                </p>
              </div>

              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                Formed in 1999 and incorporated in Florida in 2008 as a tax-exempt 501(c)(3) public charity, the Society is stewarded by an all-volunteer Board of Directors and biennial Workshop Organizing Committee drawn from universities, government laboratories, space agencies, and instrumentation developers.
              </p>

              {/* 2x2 Institutional Profile Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-2">
                {INSTITUTIONAL_FACTS.map((fact) => {
                  const FactIcon = fact.icon;
                  return (
                    <div
                      key={fact.label}
                      className="bg-[#FAFBFD] border border-slate-200/85 rounded-xl p-3 sm:p-4 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <FactIcon size={14} className="text-primary shrink-0" />
                        <span>{fact.label}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 tabular-nums">
                        {fact.value}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                        {fact.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Columns: Proportional, Uncropped 2025 Community Staircase Portrait */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <figure className="w-full max-w-[275px] sm:max-w-[390px] bg-[#FAFBFD] border border-slate-200/95 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100">
                  <img
                    src={galleryImageUrl("group-photo-2025.jpg")}
                    alt="Participants of the 15th Biennial Harsh-Environment Mass Spectrometry Workshop gathered on the atrium staircase in Virginia Beach, September 2025"
                    width={1029}
                    height={1600}
                    decoding="async"
                    className="w-full h-auto block"
                    loading="eager"
                  />
                </div>
                <figcaption className="pt-3 px-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                    <span>15th HEMS Workshop</span>
                    <span className="text-slate-500">Sept 17, 2025 • Virginia Beach, VA</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Attendees gathered in the atrium of the Sheraton Virginia Beach Oceanfront Hotel ahead of the Wednesday evening Workshop Dinner.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02: FIVE CORE OBJECTIVES (SYMMETRICAL 6-COLUMN BENTO GRID) */}
      <section className="py-12 sm:py-18 bg-[#FAFBFD] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary block mb-2">
              02 — Core Objectives
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
              Objectives of the Society
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2.5">
              Five foundational commitments guide our biennial workshops, technical collaborations, student travel grants, and open-access archival stewardship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6">
            {OBJECTIVES.map((obj, idx) => {
              const Icon = obj.icon;
              const isSecondary = obj.accent === "secondary";
              const colSpanClass = idx < 3 ? "lg:col-span-2" : "lg:col-span-3";
              return (
                <article
                  key={obj.title}
                  className={`${colSpanClass} bg-white border border-slate-200/90 rounded-xl p-6 sm:p-7 hover:border-primary/40 transition-colors flex flex-col justify-between shadow-2xs`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`p-2.5 rounded-lg border ${
                          isSecondary
                            ? "bg-teal-50/70 text-secondary border-teal-200/70"
                            : "bg-sky-50/80 text-primary border-sky-200/70"
                        }`}
                      >
                        <Icon size={19} />
                      </span>
                      <span className="tabular-nums text-xs text-slate-400 font-semibold">
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
                      {obj.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {obj.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 03: COMMUNITY HERITAGE & ARCHIVE PATHWAYS */}
      <section className="py-12 sm:py-18 bg-white md:border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Relocated 2013 Don CeSar Symposium Fellowship Card */}
            <figure className="hidden md:flex lg:col-span-5 bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-4 flex-col justify-between shadow-2xs">
              <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100">
                <img
                  src={galleryImageUrl("don-cesar-hawaiian-smiles-2013.jpg")}
                  alt="Smiling HEMS Workshop colleagues in casual coastal attire on the Courtyard Terrace at St. Pete Beach"
                  width={1600}
                  height={1059}
                  decoding="async"
                  className="w-full aspect-[16/10] object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="pt-3.5 px-1">
                <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-secondary block mb-1">
                  9th HEMS Workshop • Sept 17, 2013
                </span>
                <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">
                  The Don CeSar • St. Pete Beach, FL
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Award presentation during the Tuesday evening Workshop Dinner on the Courtyard Terrace of The Don CeSar, hosted by the University of North Texas.
                </p>
              </figcaption>
            </figure>

            {/* Right 7 Columns: Stacked Society Exploration Cards */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div className="bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 flex-1">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-2 text-primary tabular-nums text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <History size={14} /> Heritage Since 1999
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-slate-900">
                    Workshop &amp; Society History
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Trace HEMS from its 1999 founding at the USF Center for Ocean Technology through its 2008 incorporation and coastal workshops across North America and Europe.
                  </p>
                </div>
                <Link
                  href="/history"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-lg hover:border-primary/50 hover:text-primary transition-colors shadow-2xs shrink-0 text-sm"
                >
                  <span>Read History</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 flex-1">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-2 text-secondary tabular-nums text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <BookOpen size={14} /> 15 Symposia Cataloged
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-slate-900">
                    Explore 25+ Years of Proceedings
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Search complete technical programs, oral presentation decks, poster sessions, and extended abstracts from 1999 through the 2025 Virginia Beach Workshop.
                  </p>
                </div>
                <Link
                  href="/archive"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-sky-800 transition-colors shadow-xs shrink-0 text-sm"
                >
                  <span>Browse Archive</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: ANALYTICAL SIGNATURES IN THE FIELD */}
      <section className="hidden md:block py-12 sm:py-18 bg-[#FAFBFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                <Activity size={14} /> 04 — Analytical Signatures in the Field
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                Resolving Chemical Signatures Outside the Lab
              </h2>

              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                Whether sampling dissolved hydrocarbons across deep ocean gradients, corrosive sulfur compounds inside volcanic fumaroles, or trace volatiles in planetary atmospheres, field-deployable instruments must deliver quantitative{" "}
                <em className="font-serif italic text-slate-800">m/z</em> 1–100 spectra under tight size, weight, and power envelopes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 pt-1">
                <div className="bg-white border border-slate-200/85 rounded-xl px-3.5 py-2.5 shadow-2xs">
                  <div className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                    Subsea Seep • 25 MPa MIMS
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Silicone membrane inlets separate methane, dissolved gases, and light hydrocarbons down to abyssal pressures.
                  </p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-xl px-3.5 py-2.5 shadow-2xs">
                  <div className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">
                    Volcanic Plume • 145 °C Capillary
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Heated inert capillary transfer lines resolve <span className="tabular-nums">SO₂</span>, <span className="tabular-nums">H₂S</span>, and <span className="tabular-nums">HCl</span> ratios above active craters without condensation.
                  </p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-xl px-3.5 py-2.5 shadow-2xs">
                  <div className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                    Planetary Probe • 6.1 mbar Sniffer
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Flight-hardened quadrupole and ion-trap analyzers quantify isotope ratios across low-pressure extraterrestrial atmospheres.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/95 rounded-2xl p-4 sm:p-6 shadow-sm">
                <HeroMassSpectrum />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
