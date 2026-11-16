import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Compass,
  ShieldCheck,
  MapPin,
  BookOpen,
} from "lucide-react";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Workshop & Society History (1999–2025) | HEMS Society";
const PAGE_DESCRIPTION =
  "Trace the history of the Harsh-Environment Mass Spectrometry (HEMS) Society and Workshop from its 1999 formation at USF St. Petersburg to an all-volunteer international 501(c)(3) society.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/history",
  ogType: "article",
  keywords: [
    "HEMS Workshop history",
    "USF Center for Ocean Technology mass spectrometry",
    "miniature vacuum pumps workshop NASA JPL",
    "Harsh-Environment Mass Spectrometry Society history",
  ],
});

interface FormativeMilestone {
  ordinal: string;
  date: string;
  location: string;
  note: string;
  year: number;
}

const FORMATIVE_MILESTONES: FormativeMilestone[] = [
  {
    ordinal: "1st",
    date: "Feb 21–23, 1999",
    location: "USF St. Petersburg, FL",
    note: "Inaugural 1.5-day forum (~20 US investigators)",
    year: 1999,
  },
  {
    ordinal: "2nd",
    date: "Mar 18–21, 2001",
    location: "Downtown St. Petersburg, FL",
    note: "65 attendees, international reach & casual attire",
    year: 2001,
  },
  {
    ordinal: "3rd",
    date: "Mar 25–28, 2002",
    location: "NASA JPL • Pasadena, CA",
    note: "Jointly held with NASA 2nd Miniature Vacuum Pumps Workshop",
    year: 2002,
  },
  {
    ordinal: "4th",
    date: "Oct 7–10, 2003",
    location: "St. Pete Beach, FL",
    note: "Beachfront single-track collaborative format",
    year: 2003,
  },
  {
    ordinal: "5th",
    date: "Sept 20–23, 2005",
    location: "Lido Beach • Sarasota, FL",
    note: "Established mid-September biennial cadence & Committee",
    year: 2005,
  },
];

interface WorkshopChronologyItem {
  number: number;
  year: number;
  location: string;
}

const ALL_WORKSHOPS: WorkshopChronologyItem[] = [
  { number: 1, year: 1999, location: "St. Petersburg, FL" },
  { number: 2, year: 2001, location: "St. Petersburg, FL" },
  { number: 3, year: 2002, location: "Pasadena, CA" },
  { number: 4, year: 2003, location: "St. Pete Beach, FL" },
  { number: 5, year: 2005, location: "Sarasota, FL" },
  { number: 6, year: 2007, location: "Cocoa Beach, FL" },
  { number: 7, year: 2009, location: "Santa Barbara, CA" },
  { number: 8, year: 2011, location: "St. Pete Beach, FL" },
  { number: 9, year: 2013, location: "St. Pete Beach, FL" },
  { number: 10, year: 2015, location: "Baltimore, MD" },
  { number: 11, year: 2017, location: "Oxnard, CA" },
  { number: 12, year: 2018, location: "Cologne, Germany" },
  { number: 13, year: 2019, location: "Myrtle Beach, SC" },
  { number: 14, year: 2022, location: "Cocoa Beach, FL" },
  { number: 15, year: 2025, location: "Virginia Beach, VA" },
];

export default function SocietyHistoryPage() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/history",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "History (1999–2025)", path: "/history" },
    ],
  });

  const chronologyGrid = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {ALL_WORKSHOPS.map((ws) => (
        <Link
          key={ws.year}
          href={`/archive/${ws.year}`}
          className="group bg-white border border-slate-200/85 hover:border-primary/50 rounded-xl px-3 py-2.5 transition-colors shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 tabular-nums text-[11px] font-semibold">
            <span className="text-primary">#{String(ws.number).padStart(2, "0")}</span>
            <span className="text-slate-900 group-hover:text-primary transition-colors">
              {ws.year}
            </span>
          </div>
          <div className="text-xs text-slate-600 truncate mt-1">
            {ws.location}
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col flex-grow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* EDITORIAL PAGE HEADER */}
      <section className="bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FA] border-b border-slate-200/85 py-7 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 hover:text-primary transition-colors mb-5"
          >
            <ArrowLeft size={14} /> About the HEMS Society
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium tabular-nums leading-snug shadow-2xs">
                <Calendar size={13} className="text-primary shrink-0" />
                <span>Est. Feb 1999 • All-Volunteer 501(c)(3) Incorporated 2008</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                HEMS Workshop &amp; Society{" "}
                <span className="text-primary italic font-normal">History</span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed">
                From an informal gathering of twenty investigators in St. Petersburg, Florida to an internationally recognized biennial scientific symposium and nonprofit society.
              </p>
            </div>

            {/* Restrained Society Seal Card (56–64px emblem matching /about & Brand Guide v3.1.0 §4.2) */}
            <div className="hidden lg:inline-flex items-center gap-3.5 bg-white border border-slate-200/90 rounded-xl px-4 py-3 shadow-2xs self-start lg:self-end shrink-0">
              <img
                src="/hemslogo.jpg"
                alt="HEMS Society Official Emblem"
                width={3756}
                height={2594}
                decoding="async"
                className="w-14 sm:w-16 h-auto object-contain mix-blend-multiply bg-white shrink-0 block"
              />
              <div>
                <div className="font-serif font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                  25+ Years of Field MS
                </div>
                <div className="tabular-nums text-[11px] font-medium text-slate-500 mt-0.5">
                  15 Symposia • 1999–2025
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 01: HEMS WORKSHOP EARLY YEARS (MATCHES historyV4.md VERBATIM) */}
      <section className="py-12 sm:py-18 bg-[#FAFBFD] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left 7 Columns: Continuous 5-Paragraph Narrative (1999–2005) */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-primary block mb-2">
                  01 — Genesis &amp; Formative Symposia (1999–2005)
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                  HEMS Workshop Early Years
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px] sm:text-base max-w-2xl">
                <p>
                  The idea of convening a recurring workshop on harsh-environment mass spectrometry arose in the late 1990s among researchers at the University of South Florida (USF) Center for Ocean Technology (COT). Rapid advances in vacuum technology and the miniaturization of benchtop instruments were motivating research groups worldwide to carry mass spectrometers out of controlled laboratories and directly into the field for <em className="italic">in-situ</em> chemical measurements.
                </p>
                <p>
                  At the time, USF COT investigators were developing underwater mass spectrometers for marine science and environmental monitoring. They recognized that while field applications spanned vastly different regimes—from deep oceans to planetary surfaces and industrial plumes—the groups pioneering these deployments rarely crossed paths at traditional conferences, despite confronting remarkably similar engineering bottlenecks. Advancing field-deployable and <em className="italic">in-situ</em> mass spectrometry for demanding, and at times extreme, environments clearly called for a dedicated forum where dispersed teams could openly share experiences, setbacks, and solutions.
                </p>
                <p>
                  That vision became reality in February 1999, when USF COT hosted the inaugural Harsh-Environment Mass Spectrometry (HEMS) Workshop on the USF St. Petersburg, Florida campus. Roughly twenty researchers from across the United States gathered for one and a half days of single-track talks and candid technical discussions in an informal setting (see the{" "}
                  <Link href="/archive" className="text-primary font-semibold hover:underline">
                    Archives
                  </Link>{" "}
                  for programs and proceedings from this and all subsequent HEMS Workshops).
                </p>
                <p>
                  Enthusiasm from that initial meeting prompted USF COT to organize a longer, broadly advertised 2nd HEMS Workshop in downtown St. Petersburg on March 18–21, 2001, introducing formal registration and drawing 65 participants—including the Workshop’s first international attendees. Its relaxed, collegial spirit took hold immediately, establishing shorts and Hawaiian shirts as the unofficial symposium attire. Energized by the breadth of applications represented—spanning disaster response, environmental monitoring, marine biogeochemistry, space exploration, fundamental analytical science, and frontier hardware engineering—the organizers initially set out on an annual schedule.
                </p>
                <p>
                  Discussions at the 2001 meeting also spotlighted a defining hardware bottleneck for compact mass spectrometers: achieving and sustaining high vacuum with low-power, miniature pumps. Consequently, the 3rd HEMS Workshop was held jointly with NASA’s 2nd Miniature Vacuum Pumps Workshop and hosted by the NASA Jet Propulsion Laboratory (JPL) in Pasadena, California in March 2002. USF COT returned the 4th HEMS Workshop to the Florida Gulf Coast at St. Pete Beach in October 2003, cementing both the symposium’s coastal character and its role in connecting academic and government innovators with instrument manufacturers. Recognizing the multi-year engineering cycles required to design, ruggedize, and field-test harsh-environment hardware, the community elected to shift to a two-year interval—a rhythm inaugurated when USF COT hosted the 5th HEMS Workshop at Lido Beach in Sarasota, Florida in September 2005, establishing the Workshop’s signature mid-September biennial cadence.
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Fig. 01 + Formative Symposia (1999–2005) Reference Ledger */}
            <aside className="lg:col-span-5 space-y-5">
              <figure className="bg-white border border-slate-200/95 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                  <img
                    src="/images/history/usf-cot-auv-nosecone-ms.jpg"
                    alt="Early underwater mass spectrometer and compact turbomolecular vacuum assembly packaged inside an autonomous underwater vehicle hull section"
                    width={1600}
                    height={1200}
                    decoding="async"
                    className="w-full h-auto aspect-[4/3] object-cover block"
                    loading="eager"
                  />
                </div>
                <figcaption className="pt-3.5 px-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                    <span>Fig. 01 • USF Center for Ocean Technology</span>
                    <span className="text-slate-500">c. 1999–2001</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    Subsea mass spectrometer payload integration at the USF Center for Ocean Technology in St. Petersburg, Florida—the research effort that sparked the inaugural February 1999 HEMS Workshop.
                  </p>
                </figcaption>
              </figure>

              {/* Formative Symposia Quick-Reference Card */}
              <div className="hidden lg:block bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-secondary">
                    Formative Symposia (1999–2005)
                  </span>
                  <span className="tabular-nums text-[11px] text-slate-400 font-medium">
                    USF &amp; NASA JPL Era
                  </span>
                </div>
                <ol className="space-y-2.5">
                  {FORMATIVE_MILESTONES.map((item) => (
                    <li key={item.year}>
                      <Link
                        href={`/archive/${item.year}`}
                        className="group flex items-start justify-between gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-primary transition-colors">
                            <span className="tabular-nums text-primary mr-1.5">
                              {item.ordinal} Workshop ({item.date})
                            </span>
                            · {item.location}
                          </div>
                          <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5">
                            {item.note}
                          </p>
                        </div>
                        <ArrowRight
                          size={13}
                          className="text-slate-300 group-hover:text-primary shrink-0 mt-1 transition-colors"
                        />
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CHAPTER 02: THE HEMS SOCIETY + COMPLETE 15-WORKSHOP CHRONOLOGY */}
      <section className="py-12 sm:py-18 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Archival Figure 02 (Left on Desktop to Alternate Visual Rhythm) */}
            <figure className="lg:col-span-5 order-2 lg:order-1 bg-[#FAFBFD] border border-slate-200/95 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
              <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-100">
                <img
                  src="/images/history/st-pete-beach-don-cesar-2013.jpg"
                  alt="Smiling HEMS Society investigators, organizers, and students gathered under palm trees on the beachfront terrace of The Don CeSar at St. Pete Beach, Florida"
                  width={1600}
                  height={1086}
                  decoding="async"
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </div>
              <figcaption className="pt-3.5 px-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-secondary">
                  <span>Fig. 02 • 9th HEMS Workshop</span>
                  <span className="text-slate-500">Sept 17, 2013 • St. Pete Beach, FL</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Tuesday evening Workshop Dinner on the Courtyard Terrace of The Don CeSar in St. Pete Beach, Florida, hosted by the University of North Texas.
                </p>
              </figcaption>
            </figure>

            {/* Society Narrative (Right on Desktop — Matches historyV4.md Verbatim) */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-5">
              <div>
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} /> 02 — Society Governance &amp; 501(c)(3) Incorporation
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                  The HEMS Society
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px] sm:text-base max-w-2xl">
                <p>
                  During the 5th HEMS Workshop at Lido Beach in 2005, attendees proposed forming a dedicated Organizing Committee so the growing community could steward future symposia independently rather than relying indefinitely on USF sponsorship. That newly established Organizing Committee convened the 6th HEMS Workshop in Cocoa Beach, Florida in September 2007 and, in 2008, formally incorporated the organization in the State of Florida as the <strong className="font-semibold text-slate-900">Harsh-Environment Mass Spectrometry Society, Inc.</strong> Today the HEMS Society operates as an all-volunteer nonprofit corporation exempt from federal income tax under Section 501(c)(3) of the Internal Revenue Code—providing an independent institutional identity to manage symposium finances, plan future meetings, fund competitive Student Travel Awards, and preserve an open-access proceedings archive without charging annual membership dues.
                </p>
                <p>
                  From the outset, governance was structured around shared leadership: responsibility for chairing and hosting each biennial workshop rotates among members of the Board of Directors and Organizing Committee, backed by the full committee’s operational continuity.
                </p>
                <p>
                  Following formal incorporation, the Society convened its 7th HEMS Workshop on the Pacific coast in Santa Barbara, California (2009), returned to the Gulf of Mexico for consecutive meetings at St. Pete Beach, Florida (2011 and 2013), and continued to Baltimore, Maryland (2015) and Oxnard, California (2017). In 2018, the Society marked an off-cycle international milestone with its first European symposium in Cologne, Germany (12th Workshop), before returning to Myrtle Beach, South Carolina in 2019. Following pandemic-era scheduling adjustments, the community reconvened in Cocoa Beach, Florida (2022) and most recently in Virginia Beach, Virginia (2025) for its 15th symposium, ahead of resuming its two-year September cadence in 2027. Across every venue, the committee has prioritized welcoming waterfront or coastal settings where candid technical exchange and lasting professional friendships flourish side by side.
                </p>
              </div>
            </div>
          </div>

          {/* Complete 15-Workshop Chronological Index (Clickable into Proceedings Archive) */}
          <div className="hidden md:block bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3.5 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-700">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>Complete Symposium Chronology (1999–2025)</span>
              </div>
              <span className="text-xs text-slate-500">
                Select any year to open its archived technical program &amp; proceedings
              </span>
            </div>

            {chronologyGrid}
          </div>

          <details className="md:hidden group bg-[#FAFBFD] border border-slate-200/90 rounded-2xl shadow-2xs">
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-4 py-3.5 flex items-center justify-between gap-3 select-none">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>View All 15 Biennial Workshops (1999–2025)</span>
              </span>
              <ChevronDown
                size={16}
                className="text-slate-500 transition-transform duration-200 group-open:rotate-180 shrink-0"
              />
            </summary>
            <div className="px-4 pb-4 pt-2 border-t border-slate-200/80">
              {chronologyGrid}
            </div>
          </details>
        </div>
      </section>

      {/* CHAPTER 03: SUMMARY (MATCHES historyV4.md VERBATIM) & DUAL NAVIGATION PATHWAYS */}
      <section className="py-12 sm:py-18 bg-[#FAFBFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-9 lg:p-10 shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-primary flex items-center gap-1.5 mb-2">
                    <Compass size={14} /> 03 — Enduring Symposium Spirit
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                    Summary
                  </h2>
                </div>

                <blockquote className="font-serif text-xl sm:text-2xl italic text-slate-900 leading-snug border-l-4 border-primary pl-4 py-1 bg-[#FAFBFD] rounded-r-lg pr-4">
                  &ldquo;Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!&rdquo;
                </blockquote>

                <div className="space-y-4 pt-1 text-slate-700 text-[15px] sm:text-base leading-relaxed max-w-2xl">
                  <p>
                    From the very first gathering in 1999, HEMS Workshops have paired rigorous single-track science with relaxed, predominantly beachfront venues and generous unscheduled time for informal conversation.
                  </p>
                  <p>
                    Over more than a quarter-century, uniting the scientists, engineers, and operators who design, build, and deploy field mass spectrometers—alongside corporate instrument manufacturers and government agencies—has forged enduring cross-sector collaborations and accelerated field-ready instrumentation. Because HEMS participants apply chemical sensing across widely varied ocean, space, atmospheric, industrial, and defense and security missions—often supported by distinct funding programs—competitive barriers remain low, encouraging investigators to share detailed engineering lessons openly and advance the entire discipline together.
                  </p>
                </div>
              </div>

              <figure className="lg:col-span-5 bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                  <img
                    src="/images/history/myrtle-beach-pier-surf.jpg"
                    alt="Sunlit Atlantic Ocean surf, sandy shoreline, and pier viewed from the beachfront HEMS Workshop host hotel in Myrtle Beach"
                    width={1600}
                    height={1200}
                    decoding="async"
                    className="w-full h-auto aspect-[4/3] object-cover block"
                    loading="lazy"
                  />
                </div>
                <figcaption className="pt-3.5 px-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                    <span>Fig. 03 • 13th HEMS Workshop</span>
                    <span className="text-slate-500">Sept 16, 2019 • Myrtle Beach, SC</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    Looking north toward Apache Pier from Kingston Plantation in Myrtle Beach, South Carolina, on opening afternoon of the 13th HEMS Workshop.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>

          {/* Dual Navigation Footer Cards (Aligned with /about) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs">
              <div className="space-y-1.5 max-w-md">
                <div className="inline-flex items-center gap-2 text-primary tabular-nums text-[11px] font-semibold uppercase tracking-[0.12em]">
                  <ShieldCheck size={14} /> Official Charter
                </div>
                <h3 className="font-serif text-2xl font-semibold text-slate-900">
                  Mission &amp; Core Objectives
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Read the ratified Mission Statement and five core commitments guiding the HEMS Society.
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 bg-[#FAFBFD] text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-lg hover:border-primary/50 hover:text-primary transition-colors shrink-0 text-sm shadow-2xs"
              >
                <span>About HEMS</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs">
              <div className="space-y-1.5 max-w-md">
                <div className="inline-flex items-center gap-2 text-secondary tabular-nums text-[11px] font-semibold uppercase tracking-[0.12em]">
                  <BookOpen size={14} /> 15 Symposia Cataloged
                </div>
                <h3 className="font-serif text-2xl font-semibold text-slate-900">
                  Explore 25+ Years of Proceedings
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Browse technical programs, oral slide decks, poster sessions, and abstracts since February 1999.
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
      </section>
    </div>
  );
}
