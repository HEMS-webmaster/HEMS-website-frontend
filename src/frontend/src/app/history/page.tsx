import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Compass,
  ShieldCheck,
  MapPin,
  BookOpen,
} from "lucide-react";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Workshop & Society History (1999–2025) | HEMS Society";
const PAGE_DESCRIPTION =
  "Trace the history of the Harsh-Environment Mass Spectrometry (HEMS) Workshop from its 1999 USF St. Petersburg debut to an international 501(c)(3) society.";

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
    date: "Feb 1999",
    location: "USF St. Petersburg, FL",
    note: "Inaugural 1.5-day forum (~20 US investigators)",
    year: 1999,
  },
  {
    ordinal: "2nd",
    date: "Feb 2001",
    location: "Downtown St. Petersburg, FL",
    note: "65 attendees, international reach & casual attire",
    year: 2001,
  },
  {
    ordinal: "3rd",
    date: "Mar 2002",
    location: "NASA JPL • Pasadena, CA",
    note: "Jointly held with NASA 2nd Miniature Vacuum Pumps WS",
    year: 2002,
  },
  {
    ordinal: "4th",
    date: "Oct 2003",
    location: "St. Pete Beach, FL",
    note: "Beachfront single-track collaborative format",
    year: 2003,
  },
  {
    ordinal: "5th",
    date: "Sept 2005",
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

  return (
    <div className="flex flex-col flex-grow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* EDITORIAL PAGE HEADER */}
      <section className="bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FA] border-b border-slate-200/85 py-10 sm:py-14">
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
                <span>Inaugural Workshop Feb 1999 • 501(c)(3) Incorporated 2008</span>
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
            <div className="inline-flex items-center gap-3.5 bg-white border border-slate-200/90 rounded-xl px-4 py-3 shadow-2xs self-start lg:self-end shrink-0">
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

      {/* CHAPTER 01: HEMS WS EARLY YEARS (UNINTERRUPTED NARRATIVE + ARCHIVAL PLATE & LEDGER) */}
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
                  HEMS WS Early Years
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px] sm:text-base max-w-2xl">
                <p>
                  The idea of starting a periodic workshop on harsh-environment mass spectrometry arose in the very late 1990’s from researchers at the University of South Florida (USF) Center for Ocean Technology (COT). Recent advances in vacuum technology and reduction in size of benchtop mass spectrometers were beginning to motivate more research groups around the globe to explore the potential advantages of taking mass spectrometers out of the laboratory and into the field for in situ chemical measurements.
                </p>
                <p>
                  At that time researchers at the USF COT were in the early stages of such a project that aimed at putting mass spectrometers underwater for marine science and environmental monitoring applications. It also occurred to them that the applications for portable mass spectrometry technology are quite diverse, and the various groups exploring this approach might not normally communicate with, or even be aware of, the activities of other groups that may be facing similar challenges for the different field environments and end-goal measurements. Yet the overall field of portable and transportable mass spectrometry for in situ chemical measurements – in sometimes extremely harsh environments – might advance more rapidly if there were a forum for these diverse groups to share their knowledge, experiences, challenges and solutions.
                </p>
                <p>
                  And so, the concept of hosting a recurring Harsh-Environment Mass Spectrometry Workshop (HEMS WS) became a reality, with the hope to foster communication and advancement among the various researchers involved in the development and deployment of portable mass spectrometer technology. The USF COT hosted the first workshop in February 1999 on the St. Petersburg, FL campus of USF and invited around 20 researchers from around the US working in various areas of HEMS and related enabling technologies to participate in 1 ½ days of talks and discussions in an informal atmosphere (see{" "}
                  <Link href="/archive" className="text-primary font-semibold hover:underline">
                    Archives
                  </Link>{" "}
                  for details of this and all other HEMS WSs).
                </p>
                <p>
                  There was sufficient enthusiasm after this short initial meeting that the COT decided to host a more formal and longer 2nd HEMS WS in February 2001 with broad advertisement and registration fees. This took place in downtown St. Petersburg and attracted 65 participants, including several from outside the US. The casual and relaxed atmosphere was quickly embraced, and shorts and Hawaiian shirts became the unofficial attire of the workshop. The many positive responses and broad range of interests of the participants – from disaster management to environmental monitoring and space exploration, and pure science to cutting edge engineering – encouraged the organizers to make the HEMS WS an annual event.
                </p>
                <p>
                  This 2nd workshop also made a crucial pain point for development of small mass spectrometers very clear – the need for vacuum and the small portable pumps required to produce it. The 3rd HEMS WS was thus combined with NASA’s 2nd Miniature Vacuum Pumps WS and hosted by the Jet Propulsion Lab (JPL) / NASA in Pasadena, CA (March 2002). The following year USF COT hosted the 4th HEMS WS and held it in St. Petersburg Beach, FL (October 2003). This further consolidated the “beachy” vibe of the workshop and demonstrated the necessity for it to be a focused workshop that facilitates collaborations and demonstrates a path toward instrumentation development for manufacturers. And due to the time-consuming nature of instrumental development required for many HEMS endeavors, it was decided to have two years in between WSs. So, USF COT subsequently hosted the 5th HEMS WS at Lido Beach in Sarasota, FL (September 2005) establishing its biennial recurrence in mid-September.
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
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
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
                              {item.ordinal} WS ({item.date})
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

      {/* CHAPTER 02: HEMS SOCIETY + COMPLETE 15-WORKSHOP CHRONOLOGY */}
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

            {/* Society Narrative (Right on Desktop) */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-5">
              <div>
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} /> 02 — Independent Governance (2005–Present)
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                  HEMS Society
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px] sm:text-base max-w-2xl">
                <p>
                  The idea of forming a HEMS WS Organizing Committee was proposed during the 5th meeting at Lido Beach in 2005. The success of the first five workshops showed that there was solid support for additional workshops and that the group was ready to take independent responsibility for future workshops rather than have it remain under the USF umbrella. The organizing committee was subsequently created, and it formally incorporated the workshop in the State of Florida as the <strong className="font-semibold text-slate-900">HEMS Society</strong> in 2008. The formal organization helped the HEMS workshop project a clear and independent identity and allowed the committee to more easily handle funds and plan future workshops. The workshop is now a nonprofit corporation exempt from federal income tax under Section 501(c)(3) of the Internal Revenue Code.
                </p>
                <p>
                  The organizing committee itself was structured to ensure that responsibility for each upcoming WS would be taken by a different member of the committee with support from the others. And indeed, each of the subsequent workshops has been organized by the HEMS Organizing Committee and hosted (either formally or informally) by the board member leading the workshop.
                </p>
                <p>
                  The newly incorporated HEMS Society held its 6th WS in Cocoa Beach, FL in 2007, and then moved back across the US in 2009 to Santa Barbara, CA, for the 7th workshop. Since then, the workshop has been held in St. Pete Beach, FL, Baltimore, MD, Oxnard, CA, Cologne, Germany, Myrtle Beach, SC, back to Cocoa Beach, FL, and finally, Virginia Beach, VA. In each case, the workshop committee has sought a venue that provides a relaxing atmosphere, often near an ocean or the Gulf of Mexico, where technical interchange of ideas can occur and relationships can be fostered.
                </p>
              </div>
            </div>
          </div>

          {/* Complete 15-Workshop Chronological Index (Clickable into Proceedings Archive) */}
          <div className="bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3.5 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-700">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>Complete Symposium Chronology (1999–2025)</span>
              </div>
              <span className="text-xs text-slate-500">
                Select any year to open its archived technical program &amp; proceedings
              </span>
            </div>

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
          </div>
        </div>
      </section>

      {/* CHAPTER 03: SUMMARY & DUAL NAVIGATION PATHWAYS */}
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
                    From the beginning, there has been an emphasis on holding HEMS WSs in locations that provide a relaxing, pleasant and casual environment, with a majority of WSs being held at beachfront hotels. Ample free time for informal discussions and networking has always been provided.
                  </p>
                  <p>
                    It was hoped the gathering of researchers and engineers that design, build, and use field deployable mass spectrometers and their enabling components would facilitate collaborations and expedite progress. Corporate vendor and US Government agency participation has always been solicited and included. And it was also hoped that, due to the wide variety of applications of HEMS technology, the participants would likely be seeking funding from many different sources, thus reducing competition among each other and making it more likely for detailed information to be freely shared.
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
