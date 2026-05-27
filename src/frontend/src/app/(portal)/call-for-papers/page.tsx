import { FileText, Calendar, Send, ExternalLink, Cpu, Globe, Database, List, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Call for Papers - HEMS Workshop",
  description: "Submit your abstracts for the 15th HEMS Workshop. Learn about submission guidelines, key dates, and core focus areas.",
};

export default function CallForPapers() {
  const submissionUrl = "https://hems-workshop2025.exordo.com/submissions/new";

  return (
    <>
      {/* Page Header */}
      <header className="mb-12 border-b border-foreground/10 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
          <FileText size={16} /> Technical Submissions
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Call for Papers</h1>
        <p className="text-foreground/70">Submit your abstracts for oral presentations and poster sessions at the 15th HEMS Workshop.</p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Guidelines and Topics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Submission Overview */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Submission Scope</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              The Harsh-Environment Mass Spectrometry (HEMS) Workshop offers a unique forum for scientists, engineers, and researchers to discuss challenges and innovations in in situ mass spectrometry. We invite high-quality technical submissions detailing novel research, instrumentation advances, field deployment results, and experimental methodologies.
            </p>
            <div className="border border-foreground/10 rounded-md p-4 bg-surface/10">
              <h3 className="font-bold text-sm uppercase text-primary mb-3">Presentation Formats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-foreground/75">
                <div className="border-l-2 border-foreground/10 pl-4">
                  <strong>Oral Presentations:</strong> Traditional technical talks scheduled throughout technical sessions. Requires abstract submission.
                </div>
                <div className="border-l-2 border-foreground/10 pl-4">
                  <strong>Poster Presentations:</strong> Interactive session for direct discussion and detailed hardware schematics. Highly recommended for students.
                </div>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <List className="text-primary" size={20} /> Abstract Guidelines
            </h2>
            <p className="text-sm text-foreground/80">
              Please adhere to the following abstract structural requirements to ensure proper evaluation by our technical committee:
            </p>
            <div className="space-y-4">
              {[
                "Abstracts must be submitted in clear English and describe original research not previously published in major journals.",
                "Provide a descriptive title along with a complete listing of co-authors, academic affiliations, and email contacts.",
                "Structure the abstract text to clearly define the scientific problem, experimental setup, analytical precision, and environment conditions.",
                "Student submissions should highlight academic advisors and note eligibility for the student travel award program.",
                "Format documents as a single-page PDF according to the official guidelines before uploading."
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start text-foreground/80">
                  <span className="font-mono text-primary font-bold shrink-0 mt-0.5">{`[0${idx + 1}]`}</span>
                  <p className="text-xs">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Topics of Interest */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground">Core Research Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5 hover:border-primary/30 transition-colors">
                <Globe className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold text-sm mb-2 uppercase">Field Deployments</h3>
                <p className="text-[11px] text-foreground/70 leading-relaxed">
                  Deep-sea vent exploration, planetary probes, battlefield scenarios, and environmental monitoring in highly isolated zones.
                </p>
              </div>

              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5 hover:border-primary/30 transition-colors">
                <Cpu className="w-8 h-8 text-secondary mb-3" />
                <h3 className="font-bold text-sm mb-2 uppercase">Miniaturization</h3>
                <p className="text-[11px] text-foreground/70 leading-relaxed">
                  Low-power analyzer components, vacuum systems development, micro-machined ion sources, and portable electronics.
                </p>
              </div>

              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5 hover:border-primary/30 transition-colors">
                <Database className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold text-sm mb-2 uppercase">Data Processing</h3>
                <p className="text-[11px] text-foreground/70 leading-relaxed">
                  Onboard spectral matching libraries, compression algorithms, low-bandwidth communications, and automation routines.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Deadlines & Actions */}
        <div className="space-y-6">
          {/* Key Dates Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-4 border-b border-foreground/10 pb-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Key Submission Dates
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">Abstracts Due</span>
                <span className="font-bold text-foreground text-sm block">Friday, July 1, 2025</span>
                <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded mt-1">
                  CORE DEADLINE
                </span>
              </div>
              <div className="border-t border-foreground/10 pt-4">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">Author Notifications</span>
                <span className="font-bold text-foreground text-sm block">Thursday, July 31, 2025</span>
              </div>
              <div className="border-t border-foreground/10 pt-4">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">Workshop Commences</span>
                <span className="font-bold text-foreground text-sm block">Sept 15 – Sept 18, 2025</span>
              </div>
            </div>
          </div>

          {/* Formatting Guidelines Card (Requested Integration) */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-4 border-b border-foreground/10 pb-2 flex items-center gap-2">
              <FileText size={16} className="text-secondary" /> Manuscript Formatting
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed mb-4">
              All submissions must strictly comply with HEMS single-page PDF document guidelines, margins, and typographies.
            </p>
            <Link 
              href="/formatting-guidelines"
              className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-background font-bold py-2.5 rounded text-xs hover:bg-secondary/90 transition-colors shadow-sm"
            >
              View Formatting Rules <ArrowRight size={14} />
            </Link>
          </div>

          {/* Submissions Action Link */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">Ex Ordo Portal</h3>
              <p className="text-xs opacity-90 mb-6 leading-relaxed">
                Abstract submissions are handled through the Ex Ordo conference management platform. Please register an account to submit your text.
              </p>
            </div>
            
            <a 
              href={submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs"
            >
              Submit Abstract <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
