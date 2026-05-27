import Link from "next/link";
import { Calendar, FileText, Bell, Clock, ArrowRight, Download, Award, Building2 } from "lucide-react";

export default function LayoutPortal() {
  return (
    <div className="flex flex-col flex-grow bg-surface border-t border-foreground/5">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row flex-grow">
        
        {/* Left Sidebar Nav (Academic Portal Style) */}
        <aside className="w-full md:w-64 bg-background border-r border-foreground/10 flex-shrink-0 py-8 px-6 hidden md:block">
          <div className="space-y-8 sticky top-8">
            <div>
              <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Dashboard</h3>
              <nav className="space-y-2">
                <Link href="#" className="flex items-center justify-between text-sm text-primary font-bold bg-primary/5 px-3 py-2 rounded">
                  Overview
                </Link>
                <Link href="#" className="flex items-center justify-between text-sm text-foreground/70 hover:text-primary px-3 py-2 rounded transition-colors">
                  Technical Program
                </Link>
                <Link href="#" className="flex items-center justify-between text-sm text-foreground/70 hover:text-primary px-3 py-2 rounded transition-colors">
                  Registration
                </Link>
              </nav>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Resources</h3>
              <nav className="space-y-2">
                <Link href="/archive" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary px-3 py-2 rounded transition-colors">
                  <FileText size={16} /> Workshop Archive
                </Link>
                <Link href="/student-awards" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary px-3 py-2 rounded transition-colors">
                  <Award size={16} /> Student Awards
                </Link>
                <Link href="/corporate-sponsorship" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary px-3 py-2 rounded transition-colors">
                  <Building2 size={16} /> Corporate Sponsorship
                </Link>
                <Link href="#" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary px-3 py-2 rounded transition-colors">
                  <Download size={16} /> Formatting Guidelines
                </Link>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow p-6 md:p-12 bg-surface">
          <header className="mb-12 border-b border-foreground/10 pb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">15th HEMS Workshop Portal</h1>
            <p className="text-foreground/70">Welcome to the central hub for attendees, authors, and sponsors.</p>
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
                    <span className="text-xs font-mono text-foreground/50 block mb-1">2025-04-12</span>
                    <h4 className="font-bold text-foreground hover:text-primary cursor-pointer transition-colors">Call for Abstracts Now Open</h4>
                    <p className="text-sm text-foreground/70 mt-1">The portal is now accepting submissions for oral and poster presentations. Focus areas include miniaturization and autonomous sampling.</p>
                  </div>
                  <div className="border-l-2 border-foreground/20 pl-4 py-1">
                    <span className="text-xs font-mono text-foreground/50 block mb-1">2025-03-01</span>
                    <h4 className="font-bold text-foreground hover:text-primary cursor-pointer transition-colors">Venue Announced: Virginia Beach</h4>
                    <p className="text-sm text-foreground/70 mt-1">We have secured the waterfront conference center for the 15th iteration of the workshop.</p>
                  </div>
                </div>
              </section>

              <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Award className="text-primary" size={20} /> Opportunities & Funding
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-foreground/10 rounded-md p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base mb-1">Student Travel Awards</h3>
                      <p className="text-xs text-foreground/70 mb-4">
                        We offer $1,500.00 travel grants for M.S. and Ph.D. students presenting papers. Application deadline extended to August 8, 2025.
                      </p>
                    </div>
                    <Link href="/student-awards" className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1">
                      Learn More & Apply <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="border border-foreground/10 rounded-md p-4 hover:border-primary/50 transition-colors flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base mb-1">Corporate Sponsorships</h3>
                      <p className="text-xs text-foreground/70 mb-4">
                        Promote your brand through literature and hardware exhibition space, website listing, and banner credits. Rates start at $850.
                      </p>
                    </div>
                    <Link href="/corporate-sponsorship" className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1">
                      Explore Benefits & Rates <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </section>

              <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <FileText className="text-primary" size={20} /> Recently Added to Archive
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-foreground/50 uppercase bg-surface border-b border-foreground/10">
                      <tr>
                        <th className="px-4 py-3">Paper ID</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Author</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/10">
                      <tr className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-foreground/50">14-045</td>
                        <td className="px-4 py-3 font-medium">Ruggedizing Quadrupoles for Martian Regolith</td>
                        <td className="px-4 py-3 text-foreground/70">J. Smith</td>
                        <td className="px-4 py-3"><button className="text-primary hover:underline">PDF</button></td>
                      </tr>
                      <tr className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-foreground/50">14-046</td>
                        <td className="px-4 py-3 font-medium">Deep Sea Vent Sampling Strategies</td>
                        <td className="px-4 py-3 text-foreground/70">A. Johnson</td>
                        <td className="px-4 py-3"><button className="text-primary hover:underline">PDF</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right Column: Deadlines & Quick Actions */}
            <div className="space-y-6">
              <div className="bg-primary text-background rounded-lg p-6 shadow-md">
                <h3 className="font-bold uppercase tracking-wider text-sm mb-4 opacity-90">Registration Status</h3>
                <div className="text-3xl font-black mb-2">OPEN</div>
                <p className="text-sm opacity-80 mb-6">Early bird pricing ends in 45 days.</p>
                <button className="w-full bg-background text-primary font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors">
                  Register <ArrowRight size={16} />
                </button>
              </div>

              <div className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-foreground/10 pb-4">
                  <Clock size={18} className="text-secondary" /> Key Deadlines
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <div className="bg-surface rounded p-2 text-center min-w-[50px] border border-foreground/10">
                      <span className="block text-xs uppercase text-foreground/50 font-bold">Jul</span>
                      <span className="block text-lg font-black text-foreground">01</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Abstracts Due</p>
                      <p className="text-xs text-foreground/60">Final day for poster submissions.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="bg-surface rounded p-2 text-center min-w-[50px] border border-foreground/10">
                      <span className="block text-xs uppercase text-foreground/50 font-bold">Aug</span>
                      <span className="block text-lg font-black text-foreground">15</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Hotel Block Closes</p>
                      <p className="text-xs text-foreground/60">Group rate expires.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
