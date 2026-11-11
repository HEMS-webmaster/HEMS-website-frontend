"use client";

import Link from "next/link";
import { FileText, Bell, Clock, ArrowRight, ExternalLink } from "lucide-react";
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
      <header className="mb-10 border-b border-slate-200 pb-8 flex items-center justify-between gap-6">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary block mb-1.5">
            Biennial Symposium Hub • {workshop.target_window}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            {workshop.workshop_ordinal} HEMS Workshop Overview
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Central hub for {workshop.workshop_ordinal} Workshop ({workshop.target_window}) planning, authors, attendees, and corporate sponsors.
          </p>
        </div>
        <img
          src="/hemslogo.jpg"
          alt="HEMS Logo"
          width={64}
          height={64}
          decoding="async"
          className="w-16 h-16 object-contain rounded-lg border border-slate-200 mix-blend-multiply bg-white p-1 hidden sm:block"
        />
      </header>

      {/* Coastal Symposium Visual Banner */}
      <figure className="mb-8 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-5 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
          <img
            src="/images/gallery/golden-hour-harbor-reception-2015.jpg"
            alt="HEMS Workshop attendees conversing outdoors at sunset on a waterfront marina reception deck"
            width={4928}
            height={3264}
            decoding="async"
            className="w-full aspect-[3/2] object-cover"
            loading="eager"
          />
        </div>
        <figcaption className="md:col-span-7 px-2 py-1 space-y-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary block">
            Casual • Waterfront • Single-Track
          </span>
          <h2 className="font-serif text-xl font-semibold text-slate-900">
            An Informal Coastal Forum for Field Mass Spectrometrists
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every two years, HEMS gathers instrument designers, field chemists, students, and industry partners in a relaxed coastal setting—combining single-track oral sessions and hardware demonstrations with unhurried waterfront networking.
          </p>
        </figcaption>
      </figure>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Center Column: Latest Updates & Data */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="text-secondary" size={20} /> Official Announcements
              </h2>
            </div>

            <div className="space-y-5">
              <div className="border-l-2 border-primary pl-4 py-1">
                <span className="text-xs font-mono text-primary font-bold block mb-1">
                  Upcoming Biennial Cycle • {workshop.target_window}
                </span>
                <p className="font-bold text-foreground block">{workshop.announcement_headline}</p>
                <p className="text-sm text-foreground/75 mt-1 leading-relaxed">
                  {workshop.announcement_body}
                </p>
                {workshop.interest_form_url && (
                  <a
                    href={workshop.interest_form_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-2"
                  >
                    Join {workshop.workshop_ordinal} Workshop Interest List <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="border-l-2 border-foreground/20 pl-4 py-1">
                <span className="text-xs font-mono text-foreground/50 block mb-1">
                  15th Workshop • Sept 2025
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
              <FileText className="text-primary" size={20} /> Workshop Resources &amp; Programs
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

          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="text-primary" size={20} /> Featured 15th Workshop Proceedings (2025)
              </h2>
              <Link
                href="/archive/2025"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Full 2025 Program <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
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
                      <td className="px-4 py-3 font-mono text-xs text-foreground/60 whitespace-nowrap">
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
          </section>
        </div>

        {/* Right Column: Cycle Status & Reference Dates */}
        <div className="space-y-6">
          <div className="bg-background border-2 border-primary/30 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-foreground/10 pb-3 text-sm text-foreground">
              <Clock size={18} className="text-primary" /> {workshop.workshop_ordinal} Workshop Cycle ({workshop.workshop_year})
            </h3>
            <ul className="space-y-4 text-xs">
              <li className="flex justify-between items-start gap-3">
                <span className="text-foreground/60 font-mono uppercase">Target Dates</span>
                <span className="font-bold text-foreground text-right">{workshop.exact_dates}</span>
              </li>
              <li className="flex justify-between items-start gap-3 border-t border-foreground/10 pt-3">
                <span className="text-foreground/60 font-mono uppercase">Location</span>
                <span className="font-bold text-foreground text-right">{workshop.venue_city_state}</span>
              </li>
              <li className="flex justify-between items-start gap-3 border-t border-foreground/10 pt-3">
                <span className="text-foreground/60 font-mono uppercase">Abstracts Due</span>
                <span className="font-bold text-foreground text-right">
                  {workshop.cfp_abstract_deadline}
                </span>
              </li>
              <li className="flex justify-between items-start gap-3 border-t border-foreground/10 pt-3">
                <span className="text-foreground/60 font-mono uppercase">Registration</span>
                <span
                  className={`font-bold font-mono uppercase ${
                    workshop.registration_open ? "text-secondary" : "text-foreground/70"
                  }`}
                >
                  {workshop.registration_open ? "Open" : "Opening 2027"}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-primary text-background rounded-lg p-6 shadow-md">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-3 opacity-90 font-mono">
              15th Workshop Archive
            </h3>
            <div className="text-2xl font-black mb-2">PROCEEDINGS LIVE</div>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">
              The 15th HEMS Workshop concluded in Virginia Beach (Sept 15–18, 2025). Explore all slides, posters, and abstracts in the archive.
            </p>
            <Link
              href="/archive/2025"
              className="w-full bg-background text-primary font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors text-center text-xs shadow-sm uppercase tracking-wide"
            >
              Open 2025 Proceedings <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

