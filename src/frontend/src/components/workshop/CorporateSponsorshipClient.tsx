"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Award,
  Printer,
  ArrowLeft,
  Mail,
  ExternalLink,
  ShieldCheck,
  Presentation,
  Globe,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import corporateRegistry from "@/data/corporate_registry.json";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { recordTelemetryEvent } from "@/utils/telemetryClient";

interface CorporateSponsorEntry {
  company: string;
  url: string;
  logo_file: string;
  year_began: string;
}

interface SponsorBenefit {
  number: string;
  title: string;
  description: string;
  printSummary: string;
  icon: typeof Building2;
  accent: "primary" | "secondary";
}

const SPONSOR_BENEFITS: SponsorBenefit[] = [
  {
    number: "01",
    title: "Hardware & Literature Exhibition",
    description:
      "Dedicated tabletop display space adjacent to single-track technical sessions and breaks to exhibit field-portable instruments, vacuum and detector hardware, and technical literature.",
    printSummary:
      "Dedicated tabletop space alongside single-track session breaks and receptions to exhibit portable analyzers, vacuum/detector subsystems, and technical literature.",
    icon: Building2,
    accent: "primary",
  },
  {
    number: "02",
    title: "Corporate Technical Poster",
    description:
      "Invitation to present a corporate engineering or application poster during the evening poster reception—or have our Organizing Committee mount it on your behalf if your team cannot travel.",
    printSummary:
      "Present a dedicated corporate engineering poster during the poster session—with Organizing Committee mounting available if your team cannot attend in person.",
    icon: Presentation,
    accent: "secondary",
  },
  {
    number: "03",
    title: "Banner & Program Recognition",
    description:
      "Prominent recognition at the symposium on the official HEMS Workshop auditorium banner and across printed and open-access digital program materials.",
    printSummary:
      "Prominent logo acknowledgment on the official HEMS Workshop auditorium banner and in printed and permanent open-access digital proceedings.",
    icon: Award,
    accent: "primary",
  },
  {
    number: "04",
    title: "Featured Website & Logo Link",
    description:
      "Year-round placement on the HEMS Society website featuring your company logo and a direct link back to your organization's homepage.",
    printSummary:
      "Continuous year-round placement of your company logo and direct homepage link on hems-workshop.org alongside leading instrumentation partners.",
    icon: Globe,
    accent: "secondary",
  },
];

function resolveLogoFilename(logoFile: string): string {
  if (logoFile === "SAES_Getters.png") {
    return "Saes_Getters.png";
  }
  return logoFile;
}

function normalizeExternalUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const SORTED_SPONSORS: CorporateSponsorEntry[] = [
  ...(corporateRegistry as CorporateSponsorEntry[]),
].sort((a, b) => a.company.localeCompare(b.company));

export default function CorporateSponsorshipClient() {
  const { workshop } = useUpcomingWorkshop();
  const [isPrintView, setIsPrintView] = useState<boolean>(false);

  const coordinatorEmail = workshop.sponsor_coordinator_email;
  const coordinatorName = workshop.sponsor_coordinator_name;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1" || params.get("view") === "print") {
      setIsPrintView(true);
    }
  }, []);

  const openPrintableView = () => {
    setIsPrintView(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const closePrintableView = () => {
    setIsPrintView(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrintDocument = () => {
    void recordTelemetryEvent({
      eventType: "pdf_download",
      path: "/corporate-sponsorship",
      targetLabel: "Corporate Sponsorship Printable Prospectus",
    });
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const printScheduleLine = workshop.venue_confirmed
    ? `${workshop.exact_dates} • ${workshop.hotel_name} (${workshop.venue_city_state})`
    : `${workshop.target_window} • ${workshop.venue_city_state}`;

  return (
    <div className="flex flex-col flex-grow max-w-6xl mx-auto w-full min-w-0 print:max-w-none print:mx-0">
      {/* =====================================================================
          MODE A: INTERACTIVE WEB VIEW (Hidden Automatically During Printing)
          ===================================================================== */}
      {!isPrintView && (
        <div className="print:hidden">
          {/* Page Header */}
          <header className="mb-10 sm:mb-14 pb-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium tabular-nums leading-snug mb-4 shadow-2xs">
                  <ShieldCheck size={14} className="text-primary shrink-0" />
                  <span>501(c)(3) Scientific Forum • Biennial Workshop</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4 leading-[1.12]">
                  Corporate <span className="text-primary italic font-normal">Sponsorship</span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl">
                  The HEMS Workshop is an international scientific society bridging academic, government, and industrial investigators. With no annual membership dues, each biennial symposium is independently sustained through attendee registrations, donations, and corporate sponsors.
                </p>
              </div>
              <div className="flex flex-col items-center p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs self-start md:self-center shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="Harsh-Environment Mass Spectrometry Society Emblem"
                  width={3756}
                  height={2594}
                  decoding="async"
                  className="w-28 sm:w-32 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-1 block"
                />
                <span className="text-[11px] font-medium text-slate-500 mt-1.5">Industry Partnership</span>
              </div>
            </div>
          </header>

          {/* Mission Impact, Student Travel Support & Printable Summary Banner */}
          <section className="mb-12 sm:mb-16">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/95 p-5 sm:p-8 md:p-10 shadow-2xs">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="flex items-start sm:items-center gap-2 text-secondary text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <GraduationCap size={16} className="shrink-0 mt-0.5 sm:mt-0" /> Sustaining the Harsh-Environment MS Community
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 leading-snug">
                    Offsetting Symposium Costs &amp; Funding Student Travel Awards
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                    Your organization&apos;s sponsorship directly supports single-track technical sessions and hardware exhibitions for the{" "}
                    <strong className="font-semibold text-slate-800">
                      {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window})
                    </strong>{" "}
                    and is instrumental in funding competitive{" "}
                    <Link href="/student-awards" className="text-primary font-semibold hover:underline tabular-nums">
                      {workshop.student_award_amount} Student Travel Awards
                    </Link>{" "}
                    for emerging graduate researchers.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2">
                    <a
                      href={`mailto:${coordinatorEmail}?subject=HEMS%20Workshop%20Corporate%20Sponsorship%20Inquiry`}
                      className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-3 min-h-[44px] rounded-lg hover:bg-sky-800 transition-colors shadow-xs text-sm text-center"
                    >
                      <Mail size={15} className="shrink-0" /> Contact Sponsorship Coordinator
                    </a>
                    <button
                      type="button"
                      onClick={openPrintableView}
                      className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-800 font-semibold px-5 py-3 min-h-[44px] rounded-lg hover:border-primary hover:text-primary transition-colors shadow-2xs text-sm text-center cursor-pointer"
                    >
                      <Printer size={15} className="text-primary shrink-0" /> Printable Version
                    </button>
                  </div>
                </div>

                <figure className="lg:col-span-5 bg-[#FAFBFD] border border-slate-200/90 rounded-xl p-3">
                  <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                    <img
                      src="/images/gallery/sponsor-exhibit-roundtable-2017.jpg"
                      alt="Workshop participants conversing at a roundtable directly in front of corporate sponsor instrumentation displays"
                      width={1600}
                      height={991}
                      decoding="async"
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="pt-2.5 px-1 text-xs text-slate-600 leading-relaxed">
                    <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 block mb-0.5">
                      Previous Workshop Example • 11th HEMS Workshop (Sept 20, 2017)
                    </span>
                    Wednesday evening Sponsor &amp; Poster Exhibition alongside the IPI InProcess Instruments and PerkinElmer displays at the Embassy Suites Mandalay Beach Resort in Oxnard, CA.
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* Main Content Grid: Benefits & Packages (Left) + Coordinator Sidebar (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-12">
              {/* Sponsor Benefits */}
              <section>
                <div className="mb-6 pb-4 border-b border-slate-200/90">
                  <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-primary block mb-1.5">
                    01 — Sponsor Deliverables
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                    Included Corporate Sponsor Benefits
                  </h2>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Every corporate sponsor receives on-site exhibition space, technical poster participation, and year-round institutional recognition.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {SPONSOR_BENEFITS.map((benefit) => {
                    const Icon = benefit.icon;
                    const isSecondary = benefit.accent === "secondary";
                    return (
                      <div
                        key={benefit.title}
                        className="bg-white border border-slate-200/95 rounded-xl p-6 hover:border-primary/40 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isSecondary
                                ? "bg-secondary/10 text-secondary"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <Icon size={19} />
                          </span>
                          <h3 className="font-semibold text-base text-slate-900 leading-snug">
                            {benefit.title}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Participation & Flexible Invoicing Options */}
              <section>
                <div className="mb-6 pb-4 border-b border-slate-200/90">
                  <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary block mb-1.5">
                    02 — Tiers &amp; Purchasing Options
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                    Participation &amp; Flexible Invoicing
                  </h2>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Structured to accommodate on-site hardware exhibitors, corporate credit-card transaction thresholds, and remote institutional support.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Option 1 */}
                  <div className="bg-white border border-slate-200/95 rounded-xl p-6 shadow-2xs hover:border-primary/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary block mb-0.5">
                          Option A • Standard Full Package
                        </span>
                        <h3 className="font-serif text-xl font-semibold text-slate-900">
                          Corporate Sponsorship + Attendee Registration
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-2xl tabular-nums font-bold text-slate-900">
                          {workshop.reg_sponsor_fee}
                        </span>
                        <span className="text-xs font-medium text-slate-500">USD</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Includes all four Corporate Sponsor deliverables (tabletop hardware &amp; literature display space, corporate poster, workshop banner &amp; program recognition, and year-round website logo link) together with <strong className="font-semibold text-slate-800">one (1) full workshop attendee registration</strong> (all technical sessions, receptions, proceedings, and the workshop dinner).
                    </p>
                  </div>

                  {/* Option 2 */}
                  <div className="bg-white border border-primary/30 rounded-xl p-6 shadow-2xs hover:border-primary/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-secondary block mb-0.5">
                          Option B • Corporate Purchasing-Card Accommodation
                        </span>
                        <h3 className="font-serif text-xl font-semibold text-slate-900">
                          Split Sponsorship &amp; Registration Invoicing
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-2xl tabular-nums font-bold text-slate-900">$850 + $500</span>
                        <span className="text-xs font-medium text-slate-500">USD</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Provides the identical deliverables and attendee pass as Option A, billed as two separate transactions—an <strong className="font-semibold text-slate-800">$850 corporate sponsorship invoice</strong> and a separate <strong className="font-semibold text-slate-800">$500 regular registration invoice</strong>—to accommodate single-transaction corporate card limits or separate marketing and travel budgets.
                    </p>
                  </div>

                  {/* Option 3 */}
                  <div className="bg-white border border-slate-200/95 rounded-xl p-6 shadow-2xs hover:border-primary/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 block mb-0.5">
                          Option C • Remote Institutional Support
                        </span>
                        <h3 className="font-serif text-xl font-semibold text-slate-900">
                          Corporate Sponsor Only (Non-Attending)
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-2xl tabular-nums font-bold text-slate-900">$850</span>
                        <span className="text-xs font-medium text-slate-500">USD</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Ideal when no representative from your organization is able to travel during workshop week. Includes full auditorium banner, program, and year-round website logo recognition—and our Organizing Committee will mount and display your shipped corporate poster on your behalf.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                  * Standard biennial workshop sponsorship rates shown above. Custom invoices, W-9 / 501(c)(3) documentation, and split-card payments are coordinated directly with{" "}
                  <a
                    href={`mailto:${coordinatorEmail}`}
                    className="text-primary font-semibold hover:underline break-all"
                  >
                    {coordinatorEmail}
                  </a>
                  .
                </p>
              </section>
            </div>

            {/* Right Sidebar: Coordinator, Printable Handout & Onboarding */}
            <aside className="space-y-6">
              {/* Coordinator Card */}
              <div className="bg-primary text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-100 block mb-2">
                    Sponsorship Coordinator
                  </span>
                  <h3 className="font-serif text-2xl font-semibold tracking-tight mb-3">
                    Inquiries &amp; Custom Invoicing
                  </h3>
                  <p className="text-sm text-sky-50/95 leading-relaxed mb-6">
                    For sponsorship commitments, split-billing invoices, tabletop display logistics, or logo submission, contact our Sponsorship Coordinator:
                  </p>

                  <div className="border-l-2 border-white/40 pl-4 py-1 mb-6 space-y-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-sky-100/85 block">
                      HEMS Sponsorship Coordinator
                    </span>
                    <span className="font-bold text-base block">{coordinatorName}</span>
                    <a
                      href={`mailto:${coordinatorEmail}`}
                      className="text-xs font-medium underline text-white/95 hover:text-white break-all block"
                    >
                      {coordinatorEmail}
                    </a>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <a
                    href={`mailto:${coordinatorEmail}?subject=HEMS%20Workshop%20Corporate%20Sponsorship%20Inquiry`}
                    className="w-full bg-white text-primary font-semibold py-2.5 px-4 min-h-[42px] rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-2xs text-xs uppercase tracking-wide text-center"
                  >
                    <Mail size={15} className="shrink-0" /> Email {coordinatorName}
                  </a>
                  <button
                    type="button"
                    onClick={openPrintableView}
                    className="w-full bg-white/12 border border-white/35 text-white font-semibold py-2.5 px-4 min-h-[42px] rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors text-xs uppercase tracking-wide text-center cursor-pointer"
                  >
                    <Printer size={15} className="shrink-0" /> Printable Version
                  </button>
                  <Link
                    href="/contact?topic=sponsorship"
                    className="w-full border border-white/25 text-sky-50 font-semibold py-2.5 px-4 min-h-[42px] rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-xs uppercase tracking-wide text-center"
                  >
                    Online Inquiry Form <ArrowRight size={14} className="shrink-0" />
                  </Link>
                </div>
              </div>

              {/* How to Register Checklist Card */}
              <div className="bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-900 border-b border-slate-100 pb-3">
                  Sponsor Onboarding Checklist
                </h3>
                <ul className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-slate-800">1. Select Tier &amp; Billing:</strong>{" "}
                      Contact {coordinatorName} (
                      <a
                        href={`mailto:${coordinatorEmail}`}
                        className="text-primary font-semibold hover:underline break-all"
                      >
                        {coordinatorEmail}
                      </a>
                      ) to arrange standard sponsorship or split invoicing.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-slate-800">2. Submit Logo &amp; Link:</strong>{" "}
                      Email your vector or high-resolution PNG logo and target URL for website and auditorium banner placement.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-slate-800">3. Coordinate Exhibit or Poster:</strong>{" "}
                      Confirm tabletop display requirements or shipping arrangements for a non-attending corporate poster.
                    </span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Past & Continuing Corporate Sponsors Registry */}
          <section className="pt-12 border-t border-slate-200">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-primary tabular-nums text-[11px] font-semibold uppercase tracking-[0.12em] mb-2">
                  <Building2 size={15} /> Recognized Partners Since 2001
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                  Past &amp; Continuing Corporate Sponsors
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  The HEMS Society gratefully acknowledges the instrumentation manufacturers, aerospace and defense organizations, national laboratories, and research institutions whose sponsorship has sustained the workshop across generations.
                </p>
              </div>
              <span className="tabular-nums text-xs font-medium text-slate-500 shrink-0">
                {SORTED_SPONSORS.length} Recognized Organizations
              </span>
            </div>

            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {SORTED_SPONSORS.map((sponsor) => {
                const href = normalizeExternalUrl(sponsor.url);
                const logoSrc = `/images/sponsors/${resolveLogoFilename(sponsor.logo_file)}`;
                const cardInner = (
                  <>
                    <div className="w-full h-20 bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-center mb-3">
                      <img
                        src={logoSrc}
                        alt={`${sponsor.company} logo`}
                        width={160}
                        height={48}
                        decoding="async"
                        loading="lazy"
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <p className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-primary transition-colors">
                        {sponsor.company}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 tabular-nums text-[10.5px] font-medium text-slate-500">
                        <span>Since {sponsor.year_began}</span>
                        {href && (
                          <ExternalLink
                            size={11}
                            className="text-slate-400 group-hover:text-primary transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  </>
                );

                if (href) {
                  return (
                    <a
                      key={`${sponsor.company}-${sponsor.logo_file}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white border border-slate-200/90 rounded-xl p-3.5 hover:border-primary/40 hover:shadow-xs transition-all flex flex-col"
                    >
                      {cardInner}
                    </a>
                  );
                }

                return (
                  <div
                    key={`${sponsor.company}-${sponsor.logo_file}`}
                    className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col"
                  >
                    {cardInner}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          MODE B: EXECUTIVE 1-PAGE PRINTABLE SPONSORSHIP PROSPECTUS
          Visible on screen when `isPrintView === true` AND always rendered on `@media print`
          ===================================================================== */}
      <div className={isPrintView ? "block" : "hidden print:block"}>
        {/* On-Screen Print Preview Action Bar (Never Printed) */}
        <div className="print:hidden max-w-[8.5in] mx-auto mb-5 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePrintableView}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-primary transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft size={15} /> Back to Corporate Sponsorship Page
          </button>

          <span className="hidden md:inline-block text-xs font-medium text-slate-500 tabular-nums">
            Executive 1-Page Summary • Formatted for US Letter &amp; PDF
          </span>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <a
              href={`mailto:${coordinatorEmail}?subject=HEMS%20Workshop%20Corporate%20Sponsorship%20Inquiry`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Mail size={14} /> Email Coordinator
            </a>
            <button
              type="button"
              onClick={handlePrintDocument}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-primary text-white hover:bg-sky-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable US-Letter Sheet */}
        <article
          aria-label="HEMS Workshop Corporate Sponsorship Printable Summary"
          className="max-w-[8.5in] mx-auto bg-white text-slate-900 border border-slate-200/95 rounded-2xl shadow-sm p-6 sm:p-9 print:max-w-none print:mx-0 print:border-0 print:rounded-none print:shadow-none print:p-0 space-y-4 print:space-y-3"
        >
          {/* 1. Official Society Letterhead */}
          <header className="flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-4 pb-3.5 print:pb-2.5 border-b-2 border-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="w-16 sm:w-[68px] print:w-[62px] rounded-lg bg-white border border-slate-200 p-1 shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Official Emblem"
                  width={3756}
                  height={2594}
                  decoding="sync"
                  className="w-full h-auto object-contain mix-blend-multiply block"
                />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl print:text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
                  Harsh-Environment Mass Spectrometry Society, Inc.
                </h2>
                <p className="text-[11px] print:text-[10px] font-medium text-slate-600 tabular-nums mt-0.5">
                  IRS-Recognized 501(c)(3) Scientific Public Charity • Incorporated in Florida • Est. 1999
                </p>
              </div>
            </div>

            <div className="sm:text-right print:text-right shrink-0">
              <span className="block text-[10px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
                Corporate Sponsorship Overview
              </span>
              <p className="font-serif text-sm sm:text-base print:text-[13.5px] font-semibold text-slate-900 mt-0.5 tabular-nums">
                {workshop.workshop_ordinal} Biennial HEMS Workshop
              </p>
              <p className="text-[11px] print:text-[10px] text-slate-600 tabular-nums">
                {printScheduleLine}
              </p>
            </div>
          </header>

          {/* 2. Executive Summary & Institutional Profile */}
          <section className="space-y-2.5 print:space-y-2 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              01 · Executive Summary &amp; Scientific Audience
            </h2>
            <p className="text-xs sm:text-[13px] print:text-[11px] text-slate-700 leading-relaxed print:leading-[1.45]">
              Since 1999, the biennial <strong className="font-semibold text-slate-900">Workshop on Harsh-Environment Mass Spectrometry (HEMS)</strong> has served as the dedicated international forum uniting academic principal investigators, government and defense laboratories, and instrumentation manufacturers deploying ruggedized mass spectrometers outside the laboratory—spanning deep-ocean vents, planetary missions, atmospheric and volcanic plumes, industrial monitoring, and field security. Conducted as an IRS-recognized <strong className="font-semibold text-slate-900">501(c)(3)</strong> organization with no society membership dues, corporate sponsorships directly underwrite symposium operations and fund competitive{" "}
              <strong className="font-semibold text-slate-900 tabular-nums">
                {workshop.student_award_amount} Student Travel Awards
              </strong>{" "}
              for graduate researchers.
            </p>

            {/* 4-Column Quick Institutional Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 print:gap-2 pt-0.5">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Tax-Exempt Entity
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 mt-0.5 tabular-nums">
                  IRS 501(c)(3) Charity
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Symposium Format
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 mt-0.5">
                  Single-Track &amp; Exhibit
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Graduate Grants
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-secondary mt-0.5 tabular-nums">
                  {workshop.student_award_amount} Travel Awards
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 print:px-2.5 print:py-1.5">
                <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Industry Track Record
                </span>
                <span className="block text-xs print:text-[10.5px] font-bold text-slate-900 mt-0.5 tabular-nums">
                  {SORTED_SPONSORS.length} Partner Organizations
                </span>
              </div>
            </div>
          </section>

          {/* 3. Included Sponsor Deliverables (2x2 Grid) */}
          <section className="space-y-2 print:space-y-1.5 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              02 · Included Corporate Sponsor Deliverables
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 print:gap-2">
              {SPONSOR_BENEFITS.map((benefit) => (
                <div
                  key={benefit.number}
                  className="border border-slate-200 rounded-lg p-3 print:p-2.5 bg-white"
                >
                  <div className="flex items-baseline gap-2 mb-1 print:mb-0.5">
                    <span className="tabular-nums text-[10px] print:text-[9.5px] font-bold text-primary">
                      {benefit.number}
                    </span>
                    <h3 className="text-xs print:text-[11px] font-bold text-slate-900">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-[11.5px] print:text-[10px] text-slate-600 leading-snug print:leading-[1.38]">
                    {benefit.printSummary}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Comparative Participation & Purchasing-Friendly Invoicing Table */}
          <section className="space-y-2 print:space-y-1.5 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              03 · Participation Tiers &amp; Purchasing-Friendly Invoicing
            </h2>
            <div className="border border-slate-300 rounded-lg overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[520px] sm:min-w-0 print:min-w-0 text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] print:text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-2 px-3 print:py-1.5 print:px-2.5 w-[28%]">Sponsorship Option</th>
                    <th className="py-2 px-3 print:py-1.5 print:px-2.5">Included Deliverables &amp; Purchasing Structure</th>
                    <th className="py-2 px-3 print:py-1.5 print:px-2.5 text-right w-[18%]">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs print:text-[10.5px]">
                  <tr className="align-top">
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5">
                      <span className="block font-bold text-slate-900">
                        Option A: Standard Full Package
                      </span>
                      <span className="block text-[10.5px] print:text-[9.5px] font-medium text-primary mt-0.5">
                        On-Site Exhibitor + 1 Attendee
                      </span>
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-slate-700 leading-snug print:leading-[1.38]">
                      Includes all four Corporate Sponsor deliverables (tabletop hardware/literature display, corporate poster, auditorium banner &amp; program recognition, and website logo link) plus <strong className="font-semibold text-slate-900">one (1) full Workshop Attendee Registration</strong> (sessions, receptions, proceedings, and workshop dinner).
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-right whitespace-nowrap">
                      <span className="font-bold text-sm print:text-xs text-slate-900 tabular-nums block">
                        {workshop.reg_sponsor_fee}
                      </span>
                      <span className="text-[10px] print:text-[9px] text-slate-500">Single invoice</span>
                    </td>
                  </tr>

                  <tr className="align-top bg-slate-50/60">
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5">
                      <span className="block font-bold text-slate-900">
                        Option B: Split Invoicing
                      </span>
                      <span className="block text-[10.5px] print:text-[9.5px] font-medium text-secondary mt-0.5">
                        Corporate Card Limit Accommodation
                      </span>
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-slate-700 leading-snug print:leading-[1.38]">
                      Identical benefits and full attendee registration as Option A, separated into an <strong className="font-semibold text-slate-900">$850 Corporate Sponsorship invoice</strong> and a <strong className="font-semibold text-slate-900">$500 Regular Registration invoice</strong> to accommodate corporate purchasing-card transaction limits or split marketing/travel budgets.
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-right whitespace-nowrap">
                      <span className="font-bold text-sm print:text-xs text-slate-900 tabular-nums block">
                        $850 + $500
                      </span>
                      <span className="text-[10px] print:text-[9px] text-slate-500">Two separate invoices</span>
                    </td>
                  </tr>

                  <tr className="align-top">
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5">
                      <span className="block font-bold text-slate-900">
                        Option C: Remote Sponsor
                      </span>
                      <span className="block text-[10.5px] print:text-[9.5px] font-medium text-slate-500 mt-0.5">
                        Non-Attending Institutional Support
                      </span>
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-slate-700 leading-snug print:leading-[1.38]">
                      For organizations unable to send personnel during workshop week: includes full auditorium banner, program, and year-round website logo recognition, plus Organizing Committee mounting of your shipped corporate poster.
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-right whitespace-nowrap">
                      <span className="font-bold text-sm print:text-xs text-slate-900 tabular-nums block">
                        $850
                      </span>
                      <span className="text-[10px] print:text-[9px] text-slate-500">Sponsor-only invoice</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Community Profile & Participating Organizations */}
          <section className="space-y-1 break-inside-avoid">
            <h2 className="text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
              04 · Participating Community &amp; Representative Industry Partners
            </h2>
            <p className="text-[11.5px] print:text-[10px] text-slate-600 leading-relaxed print:leading-[1.4]">
              HEMS convenes instrument designers, analytical chemists, and program leads across NASA/JPL, DoD &amp; DOE national laboratories, oceanographic institutes, research universities, and {SORTED_SPONSORS.length} corporate partners since 2001—including Pfeiffer Vacuum, INFICON, Agilent Technologies, Leybold, BaySpec, MassTech, MKS Instruments, Tofwerk, Teledyne FLIR, JEOL, Detector Technology, Brooks Instrument, Extrel CMS, and SRI International.
            </p>
          </section>

          {/* 6. Actionable Onboarding & Coordinator Purchasing Box */}
          <footer className="border-2 border-slate-300 bg-slate-50/80 rounded-xl p-3.5 print:p-2.5 grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-3.5 print:gap-3 items-center break-inside-avoid">
            <div className="sm:col-span-7 print:col-span-7 space-y-1">
              <span className="block text-[10px] print:text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-900">
                How to Initiate Sponsorship &amp; Invoicing
              </span>
              <ol className="text-[11px] print:text-[9.8px] text-slate-700 space-y-0.5 leading-snug list-decimal list-inside">
                <li>
                  <strong className="font-semibold text-slate-900">Select Option (A, B, or C):</strong>{" "}
                  Email our Sponsorship Coordinator for a formal invoice, split-card billing, or W-9 / 501(c)(3) letter.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Provide Logo &amp; Target URL:</strong>{" "}
                  Send a vector or high-resolution PNG logo for website and auditorium banner placement.
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">Confirm Display or Shipped Poster:</strong>{" "}
                  Coordinate tabletop space/power needs or shipping instructions for remote poster display.
                </li>
              </ol>
            </div>

            <div className="sm:col-span-5 print:col-span-5 sm:border-l print:border-l border-slate-300 sm:pl-4 print:pl-3.5 space-y-0.5 text-[11px] print:text-[10px]">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.1em] text-primary">
                Sponsorship &amp; Billing Coordinator
              </span>
              <p className="font-bold text-slate-900 text-xs print:text-[11px]">{coordinatorName}</p>
              <p className="font-semibold text-primary break-all">{coordinatorEmail}</p>
              <p className="text-slate-600 tabular-nums">www.hems-workshop.org/corporate-sponsorship</p>
              <p className="text-[9.5px] print:text-[8.8px] text-slate-500 pt-0.5">
                IRS 501(c)(3) scientific society • Zero membership dues
              </p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
