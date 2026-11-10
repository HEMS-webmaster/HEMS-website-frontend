"use client";

import Link from "next/link";
import {
  CreditCard,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Building2,
  GraduationCap,
  UserCheck,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function RegistrationClient() {
  const { workshop } = useUpcomingWorkshop();
  const canRegisterNow = workshop.registration_open && Boolean(workshop.reg_portal_url);

  return (
    <>
      {/* Page Header */}
      <header className="mb-12 border-b border-foreground/10 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
          <CreditCard size={16} /> Workshop Access • {workshop.workshop_ordinal} Workshop
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Workshop Registration</h1>
        <p className="text-foreground/70">
          Attendee pricing tiers, milestone dates, and sponsorship options for the {workshop.workshop_ordinal} Harsh-Environment Mass Spectrometry Workshop ({workshop.target_window}).
        </p>
      </header>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Student Pass */}
        <div className="bg-background border border-foreground/10 rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="text-primary" size={20} />
              <span className="text-[10px] uppercase font-mono text-foreground/50">Academic Rate</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">
              Student Pass
            </h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-mono font-bold text-foreground">
                {workshop.reg_student_fee}
              </span>
              <span className="text-[10px] text-foreground/50">USD</span>
            </div>
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Discounted access pass for full-time undergraduate and graduate students presenting papers or posters.
            </p>
            <ul className="space-y-2 text-[10px] text-foreground/80 border-t border-foreground/10 pt-3">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Full workshop access
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Student travel award eligible
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Lunches &amp; social sessions
              </li>
            </ul>
          </div>
          {canRegisterNow ? (
            <a
              href={workshop.reg_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-background border border-foreground/20 text-foreground py-2.5 rounded font-bold uppercase hover:bg-foreground/5 transition-colors mt-6 text-xs"
            >
              Register Student
            </a>
          ) : (
            <div className="w-full text-center bg-surface border border-foreground/10 text-foreground/60 py-2.5 rounded font-mono font-bold uppercase mt-6 text-[11px]">
              Registration Opens {workshop.workshop_year}
            </div>
          )}
        </div>

        {/* Professional Pass */}
        <div className="bg-background border-2 border-primary rounded-xl p-6 relative flex flex-col justify-between shadow-lg shadow-primary/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-background px-3 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
            Standard
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="text-primary" size={20} />
              <span className="text-[10px] uppercase font-mono text-primary font-bold">
                Standard Rate
              </span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">
              Professional Pass
            </h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-mono font-bold text-primary">
                {workshop.reg_professional_fee}
              </span>
              <span className="text-[10px] text-foreground/50">USD</span>
            </div>
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Standard registration pass for academic faculty, industrial researchers, engineers, and government officials.
            </p>
            <ul className="space-y-2 text-[10px] text-foreground/80 border-t border-foreground/10 pt-3">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Full technical access
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Copy of workshop materials
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Banquet dinner included
              </li>
            </ul>
          </div>
          {canRegisterNow ? (
            <a
              href={workshop.reg_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-primary text-background py-2.5 rounded font-bold uppercase hover:bg-primary/90 transition-colors mt-6 text-xs shadow-sm"
            >
              Register Professional
            </a>
          ) : (
            <div className="w-full text-center bg-primary/10 border border-primary/25 text-primary py-2.5 rounded font-mono font-bold uppercase mt-6 text-[11px]">
              Registration Opens {workshop.workshop_year}
            </div>
          )}
        </div>

        {/* Corporate Sponsor */}
        <div className="bg-background border border-foreground/10 rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="text-primary" size={20} />
              <span className="text-[10px] uppercase font-mono text-foreground/50">
                Industrial Partner
              </span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">
              Sponsor Pass
            </h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-mono font-bold text-foreground">
                {workshop.reg_sponsor_fee}
              </span>
              <span className="text-[10px] text-foreground/50">USD</span>
            </div>
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Full corporate sponsorship benefits, exhibition display space, banner recognition, plus one (1) attendee registration.
            </p>
            <ul className="space-y-2 text-[10px] text-foreground/80 border-t border-foreground/10 pt-3">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Includes 1 Attendee Pass
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Banner logotype credit
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Display table &amp; poster space
              </li>
            </ul>
          </div>
          <Link
            href="/corporate-sponsorship"
            className="w-full text-center bg-background border border-foreground/20 text-foreground py-2.5 rounded font-bold uppercase hover:bg-foreground/5 transition-colors mt-6 text-xs"
          >
            Sponsorship Details
          </Link>
        </div>
      </div>

      {/* Info & Deadlines Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="text-primary" size={20} /> Key Registration Dates ({workshop.workshop_ordinal} Workshop)
            </h2>
            <div className="relative border-l-2 border-foreground/10 pl-6 space-y-6">
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                <span className="text-[10px] font-mono text-foreground/50 block">
                  {workshop.reg_early_bird_opens}
                </span>
                <span className="font-bold text-sm text-foreground">Early-Bird Window Opens</span>
                <p className="text-xs text-foreground/70 mt-1">
                  Early registration window opens for attendees and student presenters.
                </p>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-secondary border-4 border-background" />
                <span className="text-[10px] font-mono text-foreground/50 block">
                  {workshop.reg_early_bird_closes}
                </span>
                <span className="font-bold text-sm text-foreground">Early-Bird Window Closes</span>
                <p className="text-xs text-foreground/70 mt-1">
                  Standard registration rates apply following the early-bird deadline.
                </p>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-foreground/45 border-4 border-background" />
                <span className="text-[10px] font-mono text-foreground/50 block">
                  {workshop.reg_final_cutoff}
                </span>
                <span className="font-bold text-sm text-foreground">Registration Final Cutoff</span>
                <p className="text-xs text-foreground/70 mt-1">
                  All attendee lists, badge names, and payments settled prior to the symposium.
                </p>
              </div>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="text-primary" size={20} /> Cancellation &amp; Refund Policy
            </h2>
            <p className="text-xs text-foreground/75 leading-relaxed">
              Registration cancellations submitted in writing to the HEMS Organizing Committee on or before{" "}
              <strong>{workshop.reg_refund_cutoff}</strong> are eligible for a full refund, minus a $50 processing fee. Cancellations received after {workshop.reg_refund_cutoff} are non-refundable due to catering and facility commitments, though passes may be transferred to another attendee from your institution or organization upon request.
            </p>
          </section>
        </div>

        {/* Sidebar Panel Details */}
        <div className="space-y-6">
          {/* Corporate Splitting */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-xs border-b border-foreground/10 pb-2">
              Corporate Split Billing
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Need to separate corporate sponsor fees into distinct sponsorship ($850) and attendee registration ($500) invoices to meet purchasing limits?
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Review full details on our{" "}
              <Link
                href="/corporate-sponsorship"
                className="text-primary font-semibold hover:underline"
              >
                Corporate Sponsorship
              </Link>{" "}
              page or contact {workshop.sponsor_coordinator_name} at{" "}
              <a
                href={`mailto:${workshop.sponsor_coordinator_email}`}
                className="text-primary font-mono hover:underline"
              >
                {workshop.sponsor_coordinator_email}
              </a>
              .
            </p>
          </div>

          {/* Portal Callout */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">
              {canRegisterNow ? "Online Registration Open" : "Registration Window"}
            </h3>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">
              {canRegisterNow
                ? `Online ticketing and attendee badge registration are live for the ${workshop.workshop_ordinal} HEMS Workshop.`
                : `Online registration for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}) will open once venue and program dates are finalized.`}
            </p>
            {canRegisterNow ? (
              <a
                href={workshop.reg_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase"
              >
                Open Registration Portal <ExternalLink size={12} />
              </a>
            ) : workshop.interest_form_url ? (
              <a
                href={workshop.interest_form_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase"
              >
                Join {workshop.workshop_year} Mailing List <ExternalLink size={12} />
              </a>
            ) : (
              <div className="w-full bg-background/15 border border-background/30 text-background font-mono font-bold py-2.5 rounded flex items-center justify-center gap-2 text-xs uppercase">
                <Clock size={14} /> Opening in {workshop.workshop_year}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

