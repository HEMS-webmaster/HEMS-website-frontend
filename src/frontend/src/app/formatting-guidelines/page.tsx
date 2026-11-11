import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Layout, Info, ExternalLink, Type, List, ArrowRight } from "lucide-react";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Abstract Formatting Guidelines | HEMS Workshop";
const PAGE_DESCRIPTION =
  "Review HEMS Workshop single-page PDF abstract formatting rules, typography, margin specifications, file naming conventions, and published examples.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/formatting-guidelines",
  keywords: [
    "HEMS abstract formatting guidelines",
    "HEMS Workshop template",
    "mass spectrometry abstract specifications",
  ],
});

const STRUCTURE_SECTIONS = [
  {
    label: "Title Block:",
    body: "Bold, centered, 14pt text size, positioned at the top of the page.",
  },
  {
    label: "Author List:",
    body: "Centered below title, with full names. Use numerical superscripts to indicate institutional affiliations.",
  },
  {
    label: "Institutions Panel:",
    body: "Centered below author list, detailing organizations, city, state, country, and contact email.",
  },
  {
    label: "Body Text:",
    body: "Summarize the core scientific problem, experimental methods, miniaturization steps, analytical precision, and environmental conditions.",
  },
  {
    label: "Figures & Captions (Optional):",
    body: "Centered visual drawings, charts, or diagrams with brief descriptive text captions.",
  },
  {
    label: "References:",
    body: "Numbered citation list at the bottom of the page in standard academic format.",
  },
];

export default function FormattingGuidelines() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/formatting-guidelines",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Call for Papers", path: "/call-for-papers" },
      { name: "Formatting Guidelines", path: "/formatting-guidelines" },
    ],
  });

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page Header */}
      <header className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-6">
          <Layout size={16} /> Author Resources
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
          Formatting <span className="text-primary border-b-4 border-primary">Guidelines</span>
        </h1>
        <p className="text-xl text-foreground/70 leading-relaxed">
          Prepare your technical submission. Review abstract document specifications, margins, and published layout examples.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        {/* Left 2 Columns: Formatting Details */}
        <div className="lg:col-span-2 space-y-12 min-w-0">
          {/* Document Specifications */}
          <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-5 sm:p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-6">
              Technical Specifications
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-6">
              All abstract submissions must fit on a single page and be exported to PDF format. Use the formatting metrics below to ensure that papers fit cleanly in the workshop program catalog:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-foreground/10 p-4 sm:p-5 rounded-lg bg-background flex gap-3 items-start">
                <Type className="text-primary shrink-0 mt-0.5" size={20} />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm uppercase text-foreground">Typography &amp; Font</h3>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Standard <strong>Times New Roman</strong> or <strong>Arial</strong> font, 11pt or 12pt text size, with single line spacing. Keep text clean and consistent.
                  </p>
                </div>
              </div>

              <div className="border border-foreground/10 p-4 sm:p-5 rounded-lg bg-background flex gap-3 items-start">
                <Layout className="text-primary shrink-0 mt-0.5" size={20} />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm uppercase text-foreground">Page Margins</h3>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Set <strong>1-inch (2.54 cm)</strong> margins on all sides (top, bottom, left, right). Do not overlap margins or bleed graphics.
                  </p>
                </div>
              </div>

              <div className="border border-foreground/10 p-4 sm:p-5 rounded-lg bg-background flex gap-3 items-start">
                <FileText className="text-primary shrink-0 mt-0.5" size={20} />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm uppercase text-foreground">File Format</h3>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Export your finalized document as a single <strong>PDF</strong> file. Do not submit raw Word (.doc/.docx) or LaTeX source files.
                  </p>
                </div>
              </div>

              <div className="border border-foreground/10 p-4 sm:p-5 rounded-lg bg-background flex gap-3 items-start">
                <Info className="text-primary shrink-0 mt-0.5" size={20} />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm uppercase text-foreground">Naming Protocol</h3>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    Save abstract files according to the format:{" "}
                    <code className="font-mono text-[11px] bg-surface px-1 py-0.5 rounded break-all">
                      HEMS_Abstract_LastName_FirstName.pdf
                    </code>
                    .
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
              {STRUCTURE_SECTIONS.map((item, idx) => (
                <div key={item.label} className="flex gap-3 items-start text-foreground/80">
                  <span className="bg-primary/10 text-primary font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm mt-0.5">
                    <strong className="font-semibold text-foreground">{item.label}</strong>{" "}
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Panel: Templates & Actions */}
        <div className="space-y-6">
          {/* Reference Examples Box */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-xs border-b border-foreground/10 pb-2 flex items-center gap-2">
              <Download size={14} className="text-primary" /> Reference Proceedings
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Review the official 15th HEMS Workshop program and published single-page extended abstracts to model layout, figure sizing, and citation style.
            </p>

            {/* 15th Program PDF */}
            <a
              href="https://storage.googleapis.com/hems-workshop-archives/proceedings/15th/Administrative/15th_Program.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between border border-foreground/10 p-3 rounded-lg hover:border-primary/50 transition-colors text-left text-xs bg-surface/10"
            >
              <div className="flex gap-2 items-center">
                <FileText className="text-primary" size={16} />
                <div>
                  <strong className="block text-foreground">15th Workshop Program</strong>
                  <span className="text-[10px] text-foreground/50">15th_Program.pdf (Official Layout)</span>
                </div>
              </div>
              <ExternalLink className="text-foreground/50" size={14} />
            </a>

            {/* Sample Abstracts in Archive */}
            <Link
              href="/archive/2025"
              className="w-full flex items-center justify-between border border-foreground/10 p-3 rounded-lg hover:border-primary/50 transition-colors text-left text-xs bg-surface/10"
            >
              <div className="flex gap-2 items-center">
                <FileText className="text-secondary" size={16} />
                <div>
                  <strong className="block text-foreground">Published Abstract Examples</strong>
                  <span className="text-[10px] text-foreground/50">Browse 2025 Technical Sessions</span>
                </div>
              </div>
              <ArrowRight className="text-foreground/50" size={14} />
            </Link>
          </div>

          {/* Submission Reminder */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">Call for Papers</h3>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">
              Check abstract submission dates, portal availability, and session topics on our Call for Papers page.
            </p>

            <Link
              href="/call-for-papers"
              className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs"
            >
              View Call for Papers <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
