import Link from "next/link";
import { Calendar, FileText, Bell, Clock, ArrowRight, ExternalLink } from "lucide-react";

export const metadata = {
  title: "HEMS Workshop Portal",
  description: "Central hub for HEMS Workshop attendees, authors, and corporate sponsors.",
};

const RECENT_15TH_PAPERS = [
  {
    session: "Tech I",
    title: "Using Classes of Molecules to Identify Air Health",
    author: "G. Verbeck (Augusta University)",
    pdfUrl: "https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Technical_Session_I/15th_Verbeck_Using_Classes_of_Presentation.pdf",
  },
  {
    session: "Tech I",
    title: "ARAMMIS: Autonomous Robots for Area Mapping, Monitoring and In-situ Gas Sensing",
    author: "J. Fox (INFICON)",
    pdfUrl: "https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Technical_Session_I/15th_Fox_ARAMMIS_Autonomous_Robots_Presentation.pdf",
  },
  {
    session: "Tech I",
    title: "A Cart-Portable TOF-MS Coupled with a Thermal Desorber for CBRNE Threat Materials",
    author: "B. Kimutai (Canadian Nuclear Labs)",
    pdfUrl: "https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Technical_Session_I/15th_Kimutai_A_cartportable_TOFMS_Presentation.pdf",
  },
];

export default function LayoutPortal() {
  return (
    <>
      <header className="mb-12 border-b border-foreground/10 pb-8 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">HEMS Workshop Portal</h1>
          <p className="text-foreground/70">Central hub for symposium attendees, contributing authors, and corporate sponsors.</p>
        </div>
        <img 
          src="/hemslogo.jpg" 
          alt="HEMS Logo" 
          className="w-16 h-16 object-contain rounded-lg border border-foreground/10 mix-blend-multiply bg-white p-1 hidden sm:block" 
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Center Column: Latest Updates & Data */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="text-secondary" size={20} /> Official Announcements
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4 py-1">
                <span className="text-xs font-mono text-foreground/50 block mb-1">15th Workshop • Sept 2025</span>
                <Link href="/archive/2025" className="font-bold text-foreground hover:text-primary transition-colors block">
                  15th HEMS Workshop Proceedings Published
                </Link>
                <p className="text-sm text-foreground/70 mt-1">
                  Full technical presentations, extended abstracts, and program records from Virginia Beach, VA (September 15–18, 2025) are now online in the digital archive.
                </p>
              </div>
              <div className="border-l-2 border-foreground/20 pl-4 py-1">
                <span className="text-xs font-mono text-foreground/50 block mb-1">Biennial Cycle • 2027</span>
                <Link href="/about" className="font-bold text-foreground hover:text-primary transition-colors block">
                  16th HEMS Workshop Planning Underway
                </Link>
                <p className="text-sm text-foreground/70 mt-1">
                  Following our biennial tradition established in 2003, venue selection and Call for Papers dates for the 16th HEMS Workshop will be announced here.
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
                    $1,500.00 competitive travel grants supporting M.S. and Ph.D. students presenting harsh-environment MS research.
                  </p>
                </div>
                <Link href="/student-awards" className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1 mt-2">
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
                <Link href="/corporate-sponsorship" className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1 mt-2">
                  Benefits &amp; Packages <ArrowRight size={14} />
                </Link>
              </div>

              <div className="border border-foreground/10 rounded-md p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1">Venue &amp; Lodging</h3>
                  <p className="text-xs text-foreground/70 mb-4">
                    Reference venue details from the 15th Workshop at the Sheraton Virginia Beach Oceanfront Hotel.
                  </p>
                </div>
                <Link href="/accommodations" className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1 mt-2">
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
              <Link href="/archive/2025" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
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
                      <td className="px-4 py-3 font-mono text-xs text-foreground/60 whitespace-nowrap">{paper.session}</td>
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
          <div className="bg-primary text-background rounded-lg p-6 shadow-md">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-3 opacity-90 font-mono">15th Workshop Archive</h3>
            <div className="text-2xl font-black mb-2">PROCEEDINGS LIVE</div>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">
              The 15th HEMS Workshop concluded in Virginia Beach (Sept 15–18, 2025). Explore all slides, posters, and abstracts in the archive.
            </p>
            <Link href="/archive/2025" className="w-full bg-background text-primary font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors text-center text-xs shadow-sm uppercase tracking-wide">
              Open 2025 Proceedings <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-foreground/10 pb-4 text-sm">
              <Clock size={18} className="text-secondary" /> 15th Workshop Milestones
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start">
                <div className="bg-surface rounded p-2 text-center min-w-[54px] border border-foreground/10">
                  <span className="block text-[10px] uppercase text-foreground/50 font-bold font-mono">Jul</span>
                  <span className="block text-base font-black text-foreground font-mono">01</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Abstracts Submitted</p>
                  <p className="text-xs text-foreground/60">2025 oral &amp; poster technical program.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="bg-surface rounded p-2 text-center min-w-[54px] border border-foreground/10">
                  <span className="block text-[10px] uppercase text-foreground/50 font-bold font-mono">Sep</span>
                  <span className="block text-base font-black text-foreground font-mono">15–18</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">15th Symposium Held</p>
                  <p className="text-xs text-foreground/60">Sheraton Virginia Beach Oceanfront.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="bg-primary/10 rounded p-2 text-center min-w-[54px] border border-primary/20">
                  <span className="block text-[10px] uppercase text-primary font-bold font-mono">Next</span>
                  <span className="block text-base font-black text-primary font-mono">2027</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">16th Biennial Workshop</p>
                  <p className="text-xs text-foreground/60">Dates &amp; coastal venue TBA.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
