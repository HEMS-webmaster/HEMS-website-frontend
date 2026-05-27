import { Download, FileText, Layout, Info, ExternalLink, Type, CheckCircle2, List } from "lucide-react";

export const metadata = {
  title: "Formatting Guidelines - HEMS Workshop",
  description: "View HEMS Workshop abstract formatting guidelines, manuscript structures, file naming rules, and template downloads.",
};

export default function FormattingGuidelines() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-6">
          <Layout size={16} /> Author Resources
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
          Formatting <span className="text-primary border-b-4 border-primary">Guidelines</span>
        </h1>
        <p className="text-xl text-foreground/70 leading-relaxed">
          Prepare your technical submission. Review abstract document specifications, margins, and download templates.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        {/* Left 2 Columns: Formatting Details */}
        <div className="lg:col-span-2 space-y-12">
          {/* Document Specifications */}
          <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-6">Technical Specifications</h2>
            <p className="text-foreground/80 leading-relaxed mb-6">
              All abstract submissions must fit on a single page and be exported to PDF format. Use the formatting metrics below to ensure that papers fit cleanly in the workshop program catalog:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-foreground/10 p-5 rounded-lg bg-background flex gap-3 items-start">
                <Type className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm uppercase text-foreground">Typography & Font</h4>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Standard **Times New Roman** or **Arial** font, 11pt or 12pt text size, with single line spacing. Keep text clean and consistent.
                  </p>
                </div>
              </div>

              <div className="border border-foreground/10 p-5 rounded-lg bg-background flex gap-3 items-start">
                <Layout className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm uppercase text-foreground">Page Margins</h4>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Set **1-inch (2.54 cm)** margins on all sides (top, bottom, left, right). Do not overlap margins or bleed graphics.
                  </p>
                </div>
              </div>

              <div className="border border-foreground/10 p-5 rounded-lg bg-background flex gap-3 items-start">
                <FileText className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm uppercase text-foreground">File Format</h4>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Export your finalized document as a single **PDF** file. Do not submit raw Word (.doc/.docx) or LaTeX source files.
                  </p>
                </div>
              </div>

              <div className="border border-foreground/10 p-5 rounded-lg bg-background flex gap-3 items-start">
                <Info className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm uppercase text-foreground">Naming Protocol</h4>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Save abstract files according to the format: `HEMS2025_Abstract_LastName_FirstName.pdf`.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Abstract Layout Structure */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
              <List className="text-primary" /> Abstract Structure
            </h2>
            <p className="text-foreground/80">
              Technical abstracts must include the following structural sections in order:
            </p>
            <div className="space-y-4">
              {[
                "**Title Block:** Bold, centered, 14pt text size, positioned at the top of the page.",
                "**Author List:** Centered below title, with full names. Use numerical superscripts to indicate institutional affiliations.",
                "**Institutions Panel:** Centered below author list, detailing organizations, city, state, country, and contact email.",
                "**Body Text:** Summarize the core scientific problem, experimental methods, miniaturization steps, analytical precision, and environment conditions.",
                "**Figures & Captions (Optional):** Centered visual drawings, charts, or diagrams with brief descriptive text captions.",
                "**References:** Numbered citation list at the bottom of the page in standard academic format."
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start text-foreground/80">
                  <span className="bg-primary/10 text-primary font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: item }} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Panel: Templates & Actions */}
        <div className="space-y-6">
          {/* Templates Download Box */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-xs border-b border-foreground/10 pb-2 flex items-center gap-2">
              <Download size={14} className="text-primary" /> Download Templates
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Use our pre-formatted templates to ensure compliance with HEMS abstract program structures.
            </p>
            
            {/* Word Download */}
            <button className="w-full flex items-center justify-between border border-foreground/10 p-3 rounded-lg hover:border-primary/50 transition-colors text-left text-xs bg-surface/10">
              <div className="flex gap-2 items-center">
                <FileText className="text-primary" size={16} />
                <div>
                  <strong className="block text-foreground">Word Template</strong>
                  <span className="text-[10px] text-foreground/50">HEMS_2025_Abstract.docx</span>
                </div>
              </div>
              <Download className="text-foreground/50" size={14} />
            </button>

            {/* LaTeX Download */}
            <button className="w-full flex items-center justify-between border border-foreground/10 p-3 rounded-lg hover:border-primary/50 transition-colors text-left text-xs bg-surface/10">
              <div className="flex gap-2 items-center">
                <FileText className="text-primary" size={16} />
                <div>
                  <strong className="block text-foreground">LaTeX Template</strong>
                  <span className="text-[10px] text-foreground/50">HEMS_2025_Abstract.zip</span>
                </div>
              </div>
              <Download className="text-foreground/50" size={14} />
            </button>
          </div>

          {/* Submission Reminder */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">Ex Ordo Portal</h3>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">
              Ready to submit your finalized single-page PDF abstract? Register an account on our submissions platform to complete the process.
            </p>
            
            <a 
              href="https://hems-workshop2025.exordo.com/submissions/new"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs"
            >
              Submit Abstract <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
