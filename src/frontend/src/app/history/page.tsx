import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Compass,
  ShieldCheck,
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
      <section className="bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FA] border-b border-slate-200/85 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={14} /> About the HEMS Society
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium tabular-nums leading-snug shadow-2xs">
                <Calendar size={13} className="text-primary shrink-0" />
                <span>Inaugural Workshop Feb 1999 • 501(c)(3) Incorporated 2008</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                Workshop &amp; Society{" "}
                <span className="text-primary italic font-normal">History</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
                From an informal gathering of twenty investigators in St. Petersburg, Florida to an internationally recognized biennial scientific symposium and nonprofit society.
              </p>
            </div>

            <div className="lg:col-span-4 lg:justify-self-end">
              <div className="inline-flex items-center gap-4 bg-white border border-slate-200/90 rounded-2xl px-4 py-3.5 shadow-2xs">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Official Emblem"
                  width={3756}
                  height={2594}
                  decoding="async"
                  className="w-24 sm:w-28 h-auto object-contain mix-blend-multiply shrink-0 block"
                />
                <div>
                  <div className="font-serif font-semibold text-slate-900 text-base">
                    25+ Years of Field MS
                  </div>
                  <div className="tabular-nums text-[11px] font-medium text-slate-500 mt-0.5">
                    15 Symposia • 1999–2025
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 01: EARLY YEARS + FIGURE 01 (AUV NOSECONE MS) */}
      <section className="py-14 sm:py-20 bg-[#FAFBFD] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Spread: Narrative + Archival Plate 01 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.16em] text-primary block mb-2">
                  01 — Genesis &amp; Formative Symposia (1999–2005)
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  HEMS Workshop Early Years
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15.5px] sm:text-base max-w-prose">
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
                  for details of this and all other HEMS Workshops).
                </p>
              </div>
            </div>

            {/* Archival Figure 01 */}
            <figure className="lg:col-span-5 bg-white border border-slate-200/95 rounded-2xl p-3.5 sm:p-4 shadow-xs lg:mt-8">
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                <img
                  src="/images/history/usf-cot-auv-nosecone-ms.jpg"
                  alt="Early underwater mass spectrometer and compact turbomolecular vacuum assembly packaged inside an autonomous underwater vehicle hull section"
                  width={1600}
                  height={1200}
                  decoding="async"
                  className="w-full h-auto aspect-[4/3] object-cover"
                  loading="eager"
                />
              </div>
              <figcaption className="pt-3.5 px-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                  <span>Fig. 01 • USF Center for Ocean Technology</span>
                  <span className="text-slate-400">St. Petersburg, FL • c. 1999–2001</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Laboratory payload integration at the University of South Florida Center for Ocean Technology in St. Petersburg, Florida, during the early subsea mass spectrometry program that sparked the inaugural February 1999 HEMS Workshop.
                </p>
              </figcaption>
            </figure>
          </div>

          {/* Sub-Spread: 2-Column Paced Continuation (2001–2005) */}
          <div className="pt-8 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-7 shadow-2xs space-y-3">
              <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-secondary block">
                2001 • Rapid Growth &amp; Unofficial Attire
              </span>
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                Expanding Beyond St. Petersburg
              </h3>
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                There was sufficient enthusiasm after this short initial meeting that the COT decided to host a more formal and longer 2nd HEMS WS in February 2001 with broad advertisement and registration fees. This took place in downtown St. Petersburg and attracted 65 participants, including several from outside the US. The casual and relaxed atmosphere was quickly embraced, and shorts and Hawaiian shirts became the unofficial attire of the workshop. The many positive responses and broad range of interests of the participants – from disaster management to environmental monitoring and space exploration, and pure science to cutting edge engineering – encouraged the organizers to make the HEMS WS an annual event.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-7 shadow-2xs space-y-3">
              <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary block">
                2002–2005 • NASA JPL &amp; Biennial Rhythm
              </span>
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                Miniature Vacuum Pumps &amp; Coastal Cadence
              </h3>
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                This 2nd workshop also made a crucial pain point for development of small mass spectrometers very clear – the need for vacuum and the small portable pumps required to produce it. The 3rd HEMS WS was thus combined with NASA’s 2nd Miniature Vacuum Pumps WS and hosted by the Jet Propulsion Lab (JPL) / NASA in Pasadena, CA (March 2002). The following year USF COT hosted the 4th HEMS WS and held it in St. Petersburg Beach, FL (October 2003). This further consolidated the “beachy” vibe of the workshop and demonstrated the necessity for it to be a focused workshop that facilitates collaborations and demonstrates a path toward instrumentation development for manufacturers. And due to the time-consuming nature of instrumental development required for many HEMS endeavors, it was decided to have two years in between WSs. So, USF COT subsequently hosted the 5th HEMS WS at Lido Beach in Sarasota, FL (September 2005) establishing its biennial recurrence in mid-September.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 02: FORMATION OF THE HEMS SOCIETY + FIGURE 02 (ST. PETE BEACH COMMUNITY) */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Archival Figure 02 (Left on Desktop to Alternate Visual Rhythm) */}
            <figure className="lg:col-span-5 order-2 lg:order-1 bg-[#FAFBFD] border border-slate-200/95 rounded-2xl p-3.5 sm:p-4 shadow-xs">
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
                <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-secondary">
                  <span>Fig. 02 • 9th HEMS Workshop</span>
                  <span className="text-slate-400">St. Pete Beach, FL • Sept 17, 2013</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  Tuesday evening Workshop Dinner on the Courtyard Terrace of The Don CeSar in St. Pete Beach, Florida, hosted by the University of North Texas during the 9th HEMS Workshop.
                </p>
              </figcaption>
            </figure>

            {/* Society Narrative (Right on Desktop) */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-5">
              <div>
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} /> 02 — Independent Governance (2005–Present)
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  Formation of the HEMS Society
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15.5px] sm:text-base max-w-prose">
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
        </div>
      </section>

      {/* CHAPTER 03: SUMMARY & THE HEMS PHILOSOPHY + DUAL NAVIGATION */}
      <section className="py-14 sm:py-20 bg-[#FAFBFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Editorial Pull-Quote & Coastal Philosophy Spread */}
          <div className="bg-white border border-slate-200/95 rounded-2xl p-7 sm:p-10 lg:p-12 shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.16em] text-primary flex items-center gap-1.5">
                  <Compass size={14} /> 03 — Summary &amp; The HEMS Philosophy
                </span>

                <blockquote className="font-serif text-2xl sm:text-3xl italic text-slate-900 leading-snug border-l-2 border-primary pl-5 py-1">
                  &ldquo;Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!&rdquo;
                </blockquote>

                <div className="space-y-4 pt-1 text-slate-700 text-[15px] sm:text-base leading-relaxed">
                  <p>
                    From the beginning, there has been an emphasis on holding HEMS Workshops in locations that provide a relaxing, pleasant and casual environment, with a majority of workshops being held at beachfront hotels. Ample free time for informal discussions and networking has always been provided.
                  </p>
                  <p>
                    It was hoped the gathering of researchers and engineers that design, build, and use field deployable mass spectrometers and their enabling components would facilitate collaborations and expedite progress. Corporate vendor and US Government agency participation has always been solicited and included. And it was also hoped that, due to the wide variety of applications of HEMS technology, the participants would likely be seeking funding from many different sources, thus reducing competition among each other and making it more likely for detailed information to be freely shared.
                  </p>
                </div>
              </div>

              <figure className="lg:col-span-5 bg-[#FAFBFD] border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
                <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                  <img
                    src="/images/history/myrtle-beach-pier-surf.jpg"
                    alt="Sunlit Atlantic Ocean surf, sandy shoreline, and pier viewed from the beachfront HEMS Workshop host hotel in Myrtle Beach"
                    width={1600}
                    height={1200}
                    decoding="async"
                    className="w-full h-auto aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="pt-3 px-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                    <span>Fig. 03 • 13th HEMS Workshop</span>
                    <span className="text-slate-400">Myrtle Beach, SC • Sept 16, 2019</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Looking north toward Apache Pier from Kingston Plantation in Myrtle Beach, South Carolina, on opening afternoon of the 13th HEMS Workshop—convened two weeks after Hurricane Dorian passed the Carolina coast.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>

          {/* Dual Navigation Footer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-7 flex flex-col justify-between gap-5 shadow-2xs">
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
                  Mission &amp; Core Objectives
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Read the official charter and five strategic pillars guiding the Harsh-Environment Mass Spectrometry Society, Inc.
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-[#FAFBFD] text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-lg hover:border-primary/50 hover:text-primary transition-colors w-fit text-sm shadow-2xs"
              >
                <span>About the Society</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-7 flex flex-col justify-between gap-5 shadow-2xs">
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
                  Explore 25+ Years of Proceedings
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Browse technical programs, keynote slides, poster sessions, and abstracts from all fifteen HEMS Workshops since February 1999.
                </p>
              </div>
              <Link
                href="/archive"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-sky-800 transition-colors shadow-xs w-fit text-sm"
              >
                <span>View Proceedings Archive</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
