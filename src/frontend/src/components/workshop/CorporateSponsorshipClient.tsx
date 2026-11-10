"use client";

import Link from "next/link";
import {
  Building2,
  Award,
  Download,
  Mail,
  ExternalLink,
  ShieldCheck,
  Presentation,
  Globe,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import corporateRegistry from "@/data/corporate_registry.json";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

interface CorporateSponsorEntry {
  company: string;
  url: string;
  logo_file: string;
  year_began: string;
}

interface SponsorBenefit {
  title: string;
  description: string;
  icon: typeof Building2;
  accent: "primary" | "secondary";
}

const SPONSOR_BENEFITS: SponsorBenefit[] = [
  {
    title: "Hardware & Literature Exhibition",
    description:
      "Dedicated display space at the biennial workshop to exhibit field-portable instruments, vacuum and detector hardware, and technical literature.",
    icon: Building2,
    accent: "primary",
  },
  {
    title: "Corporate Technical Poster",
    description:
      "Invitation to display a corporate poster alongside technical sessions—or have our organizing committee post it on your behalf if your team cannot attend.",
    icon: Presentation,
    accent: "secondary",
  },
  {
    title: "Banner & Program Recognition",
    description:
      "Prominent recognition at the symposium on the official HEMS Workshop banner and across printed and digital program materials.",
    icon: Award,
    accent: "primary",
  },
  {
    title: "Featured Website & Logo Link",
    description:
      "Year-round placement on the HEMS Society website featuring your company logo and a direct link back to your organization's homepage.",
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
  const coordinatorEmail = workshop.sponsor_coordinator_email;
  const coordinatorName = workshop.sponsor_coordinator_name;
  const prospectusPdfUrl = workshop.sponsor_prospectus_url;

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb Back to Contact */}
      <div className="mb-6">
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-foreground/60 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Contact &amp; Inquiries
        </Link>
      </div>

      {/* Page Header */}
      <header className="mb-14 pb-8 border-b border-foreground/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
              <ShieldCheck size={14} />
              All-Volunteer 501(c)(3) Scientific Forum • Biennial Workshop
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              Corporate <span className="text-primary border-b-4 border-primary">Sponsorship</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-sans">
              The HEMS Workshop is an all-volunteer organization that provides an open forum to bridge the gap between academic, industrial, and government circles. With no formal membership or membership fee, each biennial workshop is independently funded through donations, registration fees, and corporate sponsors.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-surface/60 border border-foreground/10 rounded-2xl shadow-sm self-start md:self-center">
            <img
              src="/hemslogo.jpg"
              alt="HEMS Society Official Logo"
              className="w-28 h-28 object-contain rounded-xl border border-foreground/10 mix-blend-multiply bg-white p-2"
            />
            <span className="text-[11px] font-mono text-foreground/60 mt-2">Industry Partnership</span>
          </div>
        </div>
      </header>

      {/* Mission Impact & Student Travel Support Banner */}
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border-2 border-primary/30 p-8 md:p-10 shadow-lg">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2.5 text-secondary font-mono text-xs font-bold uppercase tracking-widest mb-3">
                <GraduationCap size={18} /> Sustaining the Harsh-Environment MS Community
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-3">
                Offsetting Symposium Costs &amp; Funding Student Travel Awards
              </h2>
              <p className="text-base md:text-lg text-foreground/85 leading-relaxed font-sans">
                Your registration as a corporate sponsor directly offsets the operational costs of hosting the workshop and is instrumental in helping the HEMS Society provide competitive{" "}
                <Link href="/student-awards" className="text-primary font-semibold hover:underline">
                  Student Travel Awards
                </Link>{" "}
                to emerging graduate researchers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <a
                href={`mailto:${coordinatorEmail}?subject=HEMS%20Workshop%20Corporate%20Sponsorship%20Inquiry`}
                className="inline-flex items-center justify-center gap-2 bg-primary text-background font-bold px-6 py-3.5 rounded-lg hover:bg-primary/90 transition-all shadow-sm uppercase tracking-wide text-xs"
              >
                <Mail size={15} /> Contact Sponsorship Coordinator
              </a>
              <a
                href={prospectusPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-background border border-foreground/20 text-foreground font-bold px-6 py-3.5 rounded-lg hover:border-primary hover:text-primary transition-all shadow-sm uppercase tracking-wide text-xs"
              >
                <Download size={15} /> Download Sponsorship Info (PDF)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Benefits & Packages (Left) + Coordinator Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-12">
          {/* Sponsor Benefits */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                Sponsor Benefits
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                Every corporate sponsor receives on-site exhibition access, technical poster participation, and year-round digital recognition.
              </p>
              <div className="w-16 h-1 bg-primary mt-3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SPONSOR_BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                const isSecondary = benefit.accent === "secondary";
                return (
                  <div
                    key={benefit.title}
                    className="bg-surface/50 border border-foreground/10 rounded-xl p-6 hover:border-primary/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`p-2.5 rounded-xl ${
                          isSecondary
                            ? "bg-secondary/10 text-secondary"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <h3 className="font-bold text-base text-foreground">{benefit.title}</h3>
                    </div>
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Participation & Flexible Invoicing Options */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                Participation &amp; Invoicing Options
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                Structured to accommodate full on-site participation, corporate purchasing thresholds, and remote sponsorship.
              </p>
              <div className="w-16 h-1 bg-secondary mt-3" />
            </div>

            <div className="space-y-4">
              {/* Option 1 */}
              <div className="bg-background border border-foreground/15 rounded-xl p-6 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary block">
                      Standard Full Package
                    </span>
                    <h3 className="text-lg font-bold text-foreground">
                      Corporate Sponsorship + Attendee Registration
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="text-2xl font-mono font-black text-foreground">
                      {workshop.reg_sponsor_fee}
                    </span>
                    <span className="text-xs font-mono text-foreground/55">USD</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  Includes full corporate sponsorship benefits (hardware &amp; literature display space, corporate poster, workshop banner &amp; program recognition, and website logo link) together with <strong>one (1) full workshop attendee registration</strong>.
                </p>
              </div>

              {/* Option 2 */}
              <div className="bg-background border border-primary/25 rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-secondary block">
                      Corporate Spending-Limit Accommodation
                    </span>
                    <h3 className="text-lg font-bold text-foreground">
                      Split Sponsorship &amp; Registration Invoicing
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="text-2xl font-mono font-black text-foreground">$850 + $500</span>
                    <span className="text-xs font-mono text-foreground/55">USD</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The attendee registration can be separated from the corporate sponsorship—structured as an <strong>$850 corporate sponsorship fee</strong> and a separate <strong>$500 attendee registration fee</strong>—to better accommodate internal corporate card and purchasing limits.
                </p>
              </div>

              {/* Option 3 */}
              <div className="bg-background border border-foreground/15 rounded-xl p-6 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground/60 block">
                      Remote Support Option
                    </span>
                    <h3 className="text-lg font-bold text-foreground">
                      Corporate Sponsor Only (Non-Attending)
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="text-2xl font-mono font-black text-foreground">$850</span>
                    <span className="text-xs font-mono text-foreground/55">USD</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  If you would like to help sponsor the workshop when no one from your organization is available to attend that week, register as a <strong>corporate sponsor-only</strong> and note that you will be sponsoring without attending—we can arrange to have your corporate poster displayed for you alongside full banner, program, and website recognition.
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground/60 font-mono mt-4">
              * Standard biennial workshop reference rates shown above. Active workshop cycle sponsorship registrations and split-payment invoices are coordinated directly with our Sponsorship Coordinator (
              <a
                href={`mailto:${coordinatorEmail}`}
                className="text-primary hover:underline"
              >
                {coordinatorEmail}
              </a>
              ).
            </p>
          </section>
        </div>

        {/* Right Sidebar: Coordinator & Registration Steps */}
        <aside className="space-y-6">
          {/* Coordinator Card */}
          <div className="bg-primary text-background rounded-2xl p-7 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest opacity-85 block mb-2">
                Sponsorship Coordinator
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
                Questions &amp; Custom Invoicing
              </h3>
              <p className="text-sm opacity-95 leading-relaxed mb-6">
                For corporate sponsorship questions, split-billing requests, hardware display logistics, or logo submission, please contact our Sponsorship Coordinator directly:
              </p>

              <div className="border-l-2 border-background/40 pl-4 py-1 mb-6 space-y-1">
                <span className="text-[10px] uppercase opacity-80 font-mono block">
                  HEMS Sponsorship Coordinator
                </span>
                <span className="font-bold text-base block">{coordinatorName}</span>
                <a
                  href={`mailto:${coordinatorEmail}`}
                  className="font-mono text-xs underline opacity-95 hover:opacity-100 block"
                >
                  {coordinatorEmail}
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`mailto:${coordinatorEmail}?subject=HEMS%20Workshop%20Corporate%20Sponsorship%20Inquiry`}
                className="w-full bg-background text-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase tracking-wide"
              >
                <Mail size={15} /> Email {coordinatorName}
              </a>
              <Link
                href="/contact?topic=sponsorship"
                className="w-full bg-primary-foreground/10 border border-background/35 text-background font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-background/10 transition-colors text-xs uppercase tracking-wide"
              >
                Use Contact Form <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* How to Register Checklist Card */}
          <div className="bg-surface/60 border border-foreground/10 rounded-2xl p-7 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-foreground/10 pb-3">
              Sponsor Onboarding Checklist
            </h3>
            <ul className="space-y-4 text-xs text-foreground/80 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                <span>
                  <strong>1. Select Package &amp; Coordinate Billing:</strong> Contact {coordinatorName} (
                  <a
                    href={`mailto:${coordinatorEmail}`}
                    className="text-primary font-semibold hover:underline font-mono"
                  >
                    {coordinatorEmail}
                  </a>
                  ) to arrange standard sponsorship registration or split invoicing.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                <span>
                  <strong>2. Provide Company Logo &amp; Link:</strong> Email your vector or high-resolution PNG logo and target URL so we can feature your organization on the HEMS website and workshop banner.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                <span>
                  <strong>3. Coordinate Exhibit or Poster:</strong> Let us know your tabletop display needs or whether you would like us to post a corporate poster on your behalf.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Past & Continuing Corporate Sponsors Registry */}
      <section className="pt-12 border-t border-foreground/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 size={15} /> Recognized Partners Since 2001
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
              Past &amp; Continuing Corporate Sponsors
            </h2>
            <p className="text-sm text-foreground/70 mt-1 max-w-2xl">
              The HEMS Society gratefully acknowledges the instrumentation manufacturers, aerospace and defense organizations, national laboratories, and research institutions whose sponsorship has sustained the workshop across generations.
            </p>
          </div>
          <span className="text-xs font-mono text-foreground/55 shrink-0">
            {SORTED_SPONSORS.length} Recognized Organizations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {SORTED_SPONSORS.map((sponsor) => {
            const href = normalizeExternalUrl(sponsor.url);
            const logoSrc = `/images/sponsors/${resolveLogoFilename(sponsor.logo_file)}`;
            const cardInner = (
              <>
                <div className="w-full h-20 bg-white border border-foreground/10 rounded-lg p-3 flex items-center justify-center mb-3">
                  <img
                    src={logoSrc}
                    alt={`${sponsor.company} logo`}
                    loading="lazy"
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <p className="text-xs font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {sponsor.company}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-foreground/5 text-[10px] font-mono text-foreground/50">
                    <span>Since {sponsor.year_began}</span>
                    {href && (
                      <ExternalLink
                        size={11}
                        className="text-foreground/40 group-hover:text-primary transition-colors"
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
                  className="group bg-surface/40 border border-foreground/10 rounded-xl p-3.5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
                >
                  {cardInner}
                </a>
              );
            }

            return (
              <div
                key={`${sponsor.company}-${sponsor.logo_file}`}
                className="bg-surface/40 border border-foreground/10 rounded-xl p-3.5 flex flex-col"
              >
                {cardInner}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

