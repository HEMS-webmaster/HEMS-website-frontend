"use client";

import Link from "next/link";
import { FileText, Bell, Clock, ArrowRight, ExternalLink, History } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

interface FeaturedPaper {
  session: string;
  title: string;
  author: string;
  pdfUrl: string;
}

const RECENT_15TH_PAPERS: FeaturedPaper[] = [
  {
    session: "Tech I",
    title: "Using Classes of Molecules to Identify Air Health",
    author: "G. Verbeck (Augusta University)",
    pdfUrl:
      "https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Technical_Session_I/15th_Verbeck_Using_Classes_of_Presentation.pdf",
  },
  {
    session: "Tech I",
    title: "ARAMMIS: Autonomous Robots for Area Mapping, Monitoring and In-situ Gas Sensing",
    author: "J. Fox (INFICON)",
    pdfUrl:
      "https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Technical_Session_I/15th_Fox_ARAMMIS_Autonomous_Robots_Presentation.pdf",
  },
  {
    session: "Tech I",
    title: "A Cart-Portable TOF-MS Coupled with a Thermal Desorber for CBRNE Threat Materials",
    author: "B. Kimutai (Canadian Nuclear Labs)",
    pdfUrl:
      "https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Technical_Session_I/15th_Kimutai_A_cartportable_TOFMS_Presentation.pdf",
  },
];

export default function PortalOverviewClient() {
  const { workshop } = useUpcomingWorkshop();

  return (
    <>
      <header className="mb-10 border-b border-slate-200 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-primary block mb-1.5">
            Biennial Symposium Hub • {workshop.target_window}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            {workshop.workshop_ordinal} HEMS Workshop Overview
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Central hub for {workshop.workshop_ordinal} Workshop ({workshop.target_window}) planning, authors, attendees, and corporate sponsors.
          </p>
        </div>
        <div className="flex flex-col items-center p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-center shrink-0">
          <img
            src="/hemslogo.jpg"
            alt="Harsh-Environment Mass Spectrometry Society Emblem"
            width={3756}
            height={2594}
            decoding="async"
            className="w-24 sm:w-28 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-0.5 block"
          />
        </div>
      </header>

      {/* Upcoming Workshop Section (Primary Above-the-Fold Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Announcements & Upcoming Workshop Programs */}
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <section className="bg-background border border-foreground/10 rounded-lg p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="text-secondary" size={20} /> Official Announcements
              </h2>
            </div>

            <div className="space-y-5">
              <div className="border-l-2 border-primary pl-4 py-1">
                <span className="tabular-nums text-xs text-primary font-bold block mb-1">
                  Upcoming Biennial Cycle • {workshop.target_window}
                </span>
                <p className="font-bold text-foreground block">{workshop.announcement_headline}</p>
                <p className="text-sm text-foreground/75 mt-1 leading-relaxed">
                  {workshop.announcement_body}
                </p>
                {workshop.interest_form_url ? (
                  <a
                    href={workshop.interest_form_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-2"
                  >
                    Join {workshop.workshop_ordinal} Workshop Interest List <ExternalLink size={12} />
                  </a>
                ) : (
                  <Link
                    href="/contact#mailing-list"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-2"
                  >
                    Join Society Mailing List <ArrowRight size={12} />
                  </Link>
                )}
              </div>

              <div className="border-l-2 border-foreground/20 pl-4 py-1">
                <span className="tabular-nums text-xs font-semibold text-foreground/50 block mb-1">
                  Previous Cycle • 15th Workshop (Sept 2025)
                </span>
                <Link
                  href="/archive/2025"
                  className="font-bold text-foreground hover:text-primary transition-colors block"
                >
                  15th HEMS Workshop Proceedings Published
                </Link>
                <p className="text-sm text-foreground/70 mt-1">
                  Full technical presentations, extended abstracts, and program records from Virginia Beach, VA (September 15–18, 2025) are online in the digital archive.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="text-primary" size={20} /> {workshop.workshop_ordinal} Workshop Resources &amp; Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-foreground/10 rounded-md p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1">Student Travel Awards</h3>
                  <p className="text-xs text-foreground/70 mb-4">
                    {workshop.student_award_amount} competitive travel grants supporting M.S., M.A., and Ph.D. students presenting harsh-environment MS research.
                  </p>
                </div>
                <Link
                  href="/student-awards"
                  className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1 mt-2"
                >
                  Program Guidelines <ArrowRight size={14} />
                </Link>
              </div>

              <div className="border border-foreground/10 rounded-md p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1">Corporate Sponsorships</h3>
                  <p className="text-xs text-foreground/70 mb-4">
                    Partner with the HEMS community through hardware exhibition space, website recognition, and student grant funding.
                  </p>
                </div>
                <Link
                  href="/corporate-sponsorship"
                  className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1 mt-2"
                >
                  Benefits &amp; Packages <ArrowRight size={14} />
                </Link>
              </div>

              <div className="border border-foreground/10 rounded-md p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1">Venue &amp; Lodging</h3>
                  <p className="text-xs text-foreground/70 mb-4">
                    {workshop.venue_confirmed
                      ? `${workshop.hotel_name} (${workshop.venue_city_state}).`
                      : `${workshop.workshop_ordinal} Workshop (${workshop.target_window}): ${workshop.venue_city_state}.`}
                  </p>
                </div>
                <Link
                  href="/accommodations"
                  className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1 mt-2"
                >
                  Venue Information <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Upcoming Cycle Status & Reference Dates */}
        <div className="space-y-6">
          <div className="bg-background border-2 border-primary/30 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-foreground/10 pb-3 text-sm text-foreground">
              <Clock size={18} className="text-primary" /> {workshop.workshop_ordinal} Workshop Cycle ({workshop.workshop_year})
            </h3>
            <ul className="space-y-4 text-xs">
              <li className="flex justify-between items-start gap-3">
                <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10.5px]">Target Dates</span>
                <span className="font-bold text-foreground text-right">{workshop.exact_dates}</span>
              </li>
              <li className="flex justify-between items-start gap-3 border-t border-foreground/10 pt-3">
                <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10.5px]">Location</span>
                <span className="font-bold text-foreground text-right">{workshop.venue_city_state}</span>
              </li>
              <li className="flex justify-between items-start gap-3 border-t border-foreground/10 pt-3">
                <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10.5px]">Abstracts Due</span>
                <span className="font-bold text-foreground text-right">
                  {workshop.cfp_abstract_deadline}
                </span>
              </li>
              <li className="flex justify-between items-start gap-3 border-t border-foreground/10 pt-3">
                <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10.5px]">Registration</span>
                <span
                  className={`font-bold tabular-nums uppercase tracking-wide ${workshop.registration_open ? "text-secondary" : "text-foreground/70"
                    }`}
                >
                  {workshop.registration_open ? "Open" : "Opening 2027"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Archival Section: Clearly Separated Previous Workshops Material */}
      <section
        aria-labelledby="previous-workshops-overview-heading"
        className="mt-14 pt-10 border-t-2 border-slate-200/90 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5">
              <History size={13} className="text-slate-500 shrink-0" />
              <span>Previous Years • Historical Reference</span>
            </div>
            <h2
              id="previous-workshops-overview-heading"
              className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900"
            >
              Highlights from Previous HEMS Workshops
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Published proceedings and fellowship photographs from past biennial workshops (archival examples—distinct from the upcoming {workshop.workshop_ordinal} Workshop in {workshop.target_window}).
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Explore 25+ Year Workshop History <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-background border border-foreground/10 rounded-lg p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <FileText className="text-primary shrink-0" size={19} /> Sample Proceedings — 15th Workshop (2025)
              </h3>
              <Link
                href="/archive/2025"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Full 2025 Program <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[500px] text-sm text-left">
                <thead className="text-xs text-foreground/50 uppercase bg-surface border-b border-foreground/10">
                  <tr>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Presenter</th>
                    <th className="px-4 py-3">Slides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {RECENT_15TH_PAPERS.map((paper, idx) => (
                    <tr key={idx} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold text-foreground/60 whitespace-nowrap">
                        {paper.session}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{paper.title}</td>
                      <td className="px-4 py-3 text-xs text-foreground/70">{paper.author}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary font-bold text-xs hover:underline"
                        >
                          PDF <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800 text-white rounded-xl p-6 shadow-sm">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300 block mb-2 tabular-nums">
              Past Symposium • 15th Workshop (2025)
            </span>
            <div className="text-xl font-bold mb-2">2025 Proceedings Archive</div>
            <p className="text-xs text-slate-200 mb-5 leading-relaxed">
              The 15th HEMS Workshop concluded in Virginia Beach, VA (Sept 15–18, 2025). Browse all slides, posters, and extended abstracts in the open-access archive.
            </p>
            <Link
              href="/archive/2025"
              className="w-full bg-white text-slate-900 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-center text-xs shadow-2xs uppercase tracking-wide"
            >
              Open 2025 Proceedings <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Past Workshop Coastal Fellowship Photo Card */}
        <figure className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
            <img
              src="/images/gallery/golden-hour-harbor-reception-2015.jpg"
              alt="HEMS Workshop attendees conversing outdoors at sunset overlooking Baltimore's Inner Harbor during the 2015 symposium"
              width={1600}
              height={892}
              decoding="async"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
          <figcaption className="md:col-span-7 px-2 py-1 space-y-2">
            <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 block">
              Previous Workshop Example • 10th HEMS Workshop (Sept 15, 2015)
            </span>
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Baltimore&apos;s Inner Harbor, Maryland (2015)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tuesday evening gathering overlooking Baltimore&apos;s Inner Harbor ahead of the 10th HEMS Workshop Dinner at the Rusty Scupper—illustrating the Society&apos;s biennial tradition of pairing single-track technical sessions with relaxed waterfront fellowship.
            </p>
          </figcaption>
        </figure>
      </section>
    </>
  );
}
