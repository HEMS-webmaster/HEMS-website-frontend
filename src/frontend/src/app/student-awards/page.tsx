import { GraduationCap, Award, Calendar, Mail, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Student Travel Awards - HEMS Workshop",
  description: "Learn about the HEMS Workshop Student Travel Awards, offering travel grants for M.S. and Ph.D. students to present their research.",
};

export default function StudentAwards() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-6">
          <Award size={16} /> Travel Grant Program
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
          Student Travel <span className="text-primary border-b-4 border-primary">Awards</span>
        </h1>
        <p className="text-xl text-foreground/70 leading-relaxed">
          Supporting the next generation of researchers building analytical instrumentation for extreme and harsh environments.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        {/* Main Details and Guidelines */}
        <div className="lg:col-span-2 space-y-12">
          {/* Introduction & Award Details */}
          <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-4">Program Overview</h2>
            <p className="text-foreground/80 leading-relaxed mb-6">
              The Harsh-Environment Mass Spectrometry (HEMS) Society is proud to support student participation in our biennial workshop. These grants are intended to offset travel and registration costs, enabling full-time graduate students to present their research, connect with leading domain experts, and participate in technical discussions.
            </p>
            <div className="bg-background border border-foreground/10 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs uppercase font-mono text-foreground/50 block">Award Amount</span>
                <span className="text-3xl font-mono font-bold text-primary">$1,500.00</span>
              </div>
              <div className="text-right sm:text-left border-t sm:border-t-0 sm:border-l border-foreground/10 pt-4 sm:pt-0 sm:pl-6 flex-grow">
                <span className="text-xs uppercase font-mono text-foreground/50 block">Usage</span>
                <p className="text-sm text-foreground/70">Covers lodging, transportation, and workshop registration fees.</p>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
              <FileText className="text-primary" /> Application Guidelines
            </h2>
            <p className="text-foreground/80">
              To apply for a travel award, candidates must assemble and submit a single package containing:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-background border border-foreground/10 p-6 rounded-lg hover:border-primary/30 transition-colors">
                <span className="text-primary font-mono text-lg font-bold block mb-2">01. Student Letter</span>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  A personal statement detailing your academic standing, research focus, expected graduation date, degree, faculty advisor name, and your website URL (if available).
                </p>
              </div>
              <div className="bg-background border border-foreground/10 p-6 rounded-lg hover:border-primary/30 transition-colors">
                <span className="text-primary font-mono text-lg font-bold block mb-2">02. Recommendation Letter</span>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  A detailed letter from your faculty advisor indicating why you deserve the travel award and outlining any special circumstances or merits.
                </p>
              </div>
              <div className="bg-background border border-foreground/10 p-6 rounded-lg hover:border-primary/30 transition-colors">
                <span className="text-primary font-mono text-lg font-bold block mb-2">03. Abstract & Title</span>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  The title of the presentation to be presented at the meeting, along with the full abstract, co-authors list, and scheduled session.
                </p>
              </div>
              <div className="bg-background border border-foreground/10 p-6 rounded-lg hover:border-primary/30 transition-colors">
                <span className="text-primary font-mono text-lg font-bold block mb-2">04. Curriculum Vitae</span>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  A comprehensive CV/resume including your research interests, academic projects, and list of published articles or presentations.
                </p>
              </div>
            </div>
          </section>

          {/* Criteria */}
          <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-6">Selection Criteria</h2>
            <ul className="space-y-4">
              {[
                "Full compliance with eligibility guidelines and submission requirements.",
                "Quality, scientific contribution, and intellectual merit of the submitted abstract.",
                "Potential of the research to yield future scientific publications and technological advances.",
                "Student is in good academic standing at an accredited institution."
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start text-foreground/80">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar Info & Submission details */}
        <div className="space-y-6">
          {/* Eligibility Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold uppercase tracking-wider text-sm mb-4 border-b border-foreground/10 pb-2">
              Eligibility
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Open to any full-time graduate student pursuing an M.S., M.A., or Ph.D. degree in a technical discipline applicable to harsh-environment mass spectrometry. Students must be in good standing with their university.
            </p>
          </div>

          {/* Deadline Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider mb-4 text-secondary border-b border-foreground/10 pb-2">
              <Calendar size={18} /> Application Deadline
            </h3>
            <div className="text-2xl font-mono font-bold text-foreground mb-1">AUGUST 8, 2025</div>
            <span className="inline-block bg-secondary/15 text-secondary text-xs font-bold px-2 py-0.5 rounded">
              EXTENDED DEADLINE
            </span>
          </div>

          {/* Submission Action */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-sm mb-2 opacity-95">How to Submit</h3>
              <p className="text-sm opacity-90 mb-6 leading-relaxed">
                Please assemble your application guidelines list into a single PDF file and email it directly to our selection committee.
              </p>
            </div>
            
            <a 
              href="mailto:hemsworkshop@hems-workshop.org"
              className="w-full bg-background text-primary font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-sm"
            >
              <Mail size={16} /> Email Application
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
