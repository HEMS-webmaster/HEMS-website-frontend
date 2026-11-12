"use client";

import Link from "next/link";
import {
  FileText,
  Calendar,
  ExternalLink,
  Cpu,
  Globe,
  Database,
  List,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

const ABSTRACT_REQUIREMENTS: string[] = [
  "Abstracts must be submitted in clear English and describe original research not previously published in major journals.",
  "Provide a descriptive title along with a complete listing of co-authors, academic affiliations, and email contacts.",
  "Structure the abstract text to clearly define the scientific problem, experimental setup, analytical precision, and environment conditions.",
  "Student submissions should highlight academic advisors and note eligibility for the Student Travel Award program.",
  "Format documents as a single-page PDF according to the official guidelines before uploading.",
];

export default function CallForPapersClient() {
  const { workshop } = useUpcomingWorkshop();
  const canSubmitNow = workshop.cfp_open && Boolean(workshop.cfp_submission_url);

  return (
    <>
      {/* Page Header */}
      <header className="mb-10 border-b border-slate-200 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium leading-snug mb-4 shadow-2xs">
            <FileText size={14} className="text-primary shrink-0" /> Technical Submissions • {workshop.workshop_ordinal} Workshop
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            Call for Papers
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Abstract submission guidelines and core research areas for oral presentations and poster sessions at the {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window}).
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

      {/* Representative Presentation Graphics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <figure className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center gap-3.5">
          <img
            src="/images/gallery/serpa-cycloidal-ion-trajectories.jpg"
            alt="Cycloidal mass analyzer spiral ion trajectory simulation from 15th HEMS Workshop proceedings"
            width={1245}
            height={1155}
            decoding="async"
            className="w-24 h-20 object-contain rounded-lg border border-slate-100 bg-white p-1 shrink-0"
            loading="lazy"
          />
          <figcaption className="text-xs text-slate-600 leading-relaxed">
            <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-wider text-primary block mb-0.5">
              15th HEMS Workshop • Sept 18, 2025
            </span>
            Coded-aperture underwater cycloidal analyzer study — R. B. Serpa &amp; J. J. Amsden et al. (Duke Univ. &amp; Univ. of Arizona), Virginia Beach, VA.
          </figcaption>
        </figure>

        <figure className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center gap-3.5">
          <img
            src="/images/gallery/kibelka-aerosol-ms-cad-2025.jpg"
            alt="Exploded 3D CAD assembly of a compact aerosol-inlet portable mass spectrometer from 15th HEMS Workshop proceedings"
            width={1200}
            height={803}
            decoding="async"
            className="w-24 h-20 object-contain rounded-lg border border-slate-100 bg-white p-1 shrink-0"
            loading="lazy"
          />
          <figcaption className="text-xs text-slate-600 leading-relaxed">
            <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-wider text-secondary block mb-0.5">
              15th HEMS Workshop • Sept 17, 2025
            </span>
            Portable aerosol threat detector subsystem — G. Kibelka et al. (Detect-ION, Tampa, FL), presented in Virginia Beach, VA.
          </figcaption>
        </figure>

        <figure className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center gap-3.5">
          <img
            src="/images/gallery/verbeck-urban-ms-heatmap-2019.jpg"
            alt="Real-time urban mobile mass spectrometry chemical plume map from 13th HEMS Workshop proceedings"
            width={1200}
            height={707}
            decoding="async"
            className="w-24 h-20 object-cover rounded-lg border border-slate-100 shrink-0"
            loading="lazy"
          />
          <figcaption className="text-xs text-slate-600 leading-relaxed">
            <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-wider text-primary block mb-0.5">
              13th HEMS Workshop • Sept 19, 2019
            </span>
            Mobile membrane-inlet MS survey across downtown Dallas, TX — G. F. Verbeck (Univ. of North Texas), presented in Myrtle Beach, SC.
          </figcaption>
        </figure>
      </div>

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
              {ABSTRACT_REQUIREMENTS.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start text-foreground/80">
                  <span className="tabular-nums text-xs text-primary font-bold shrink-0 mt-0.5">{`0${idx + 1}.`}</span>
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
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/50 block">
                  Abstracts Due
                </span>
                <span className="font-bold text-foreground text-sm block">
                  {workshop.cfp_abstract_deadline}
                </span>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 tabular-nums uppercase tracking-wider ${
                    workshop.cfp_open
                      ? "bg-secondary/15 text-secondary"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {workshop.cfp_open ? "Accepting Abstracts" : `${workshop.workshop_ordinal} Cycle`}
                </span>
              </div>
              <div className="border-t border-foreground/10 pt-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/50 block">
                  Author Notifications
                </span>
                <span className="font-bold text-foreground text-sm block">
                  {workshop.cfp_notification_date}
                </span>
              </div>
              <div className="border-t border-foreground/10 pt-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/50 block">
                  Workshop Schedule
                </span>
                <span className="font-bold text-foreground text-sm block">
                  {workshop.exact_dates}
                </span>
              </div>
            </div>
          </div>

          {/* Formatting Guidelines Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-4 border-b border-foreground/10 pb-2 flex items-center gap-2">
              <FileText size={16} className="text-secondary" /> Manuscript Formatting
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed mb-4">
              All submissions must comply with HEMS single-page PDF document guidelines, margins, and typography standards.
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
              <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">
                {canSubmitNow ? "Submission Portal Open" : "Submission Window Status"}
              </h3>
              <p className="text-xs opacity-90 mb-6 leading-relaxed">
                {canSubmitNow
                  ? `Online abstract submission is open for the ${workshop.workshop_ordinal} HEMS Workshop.`
                  : `Abstract submission for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}) has not opened yet. Check back here or reach out with program questions.`}
              </p>
            </div>

            {canSubmitNow ? (
              <a
                href={workshop.cfp_submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase"
              >
                Submit Abstract <ExternalLink size={14} />
              </a>
            ) : workshop.interest_form_url ? (
              <a
                href={workshop.interest_form_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase"
              >
                Join {workshop.workshop_year} Update List <ExternalLink size={14} />
              </a>
            ) : (
              <div className="w-full bg-background/15 border border-background/30 text-background tabular-nums font-bold py-2.5 rounded flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
                <Clock size={14} /> Opening in {workshop.workshop_year}
              </div>
            )}
          </div>

          {/* Interactive Poster Session Photo Card */}
          <figure className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
              <img
                src="/images/gallery/poster-session-smiles-oxnard-2017.jpg"
                alt="Two HEMS Workshop investigators smiling in conversation beside technical posters during an evening poster session"
                width={1600}
                height={1060}
                decoding="async"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
            <figcaption className="px-1 pb-0.5 text-xs text-slate-600 leading-relaxed">
              <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-wider text-secondary block mb-0.5">
                11th HEMS Workshop • Sept 20, 2017
              </span>
              Wednesday evening Poster Session at the Embassy Suites Mandalay Beach Resort in Oxnard, California, hosted by UTC Aerospace Systems.
            </figcaption>
          </figure>
        </div>
      </div>
    </>
  );
}

