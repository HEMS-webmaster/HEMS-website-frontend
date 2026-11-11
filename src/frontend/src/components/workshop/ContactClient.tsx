"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import {
  Mail,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Send,
  CheckCircle2,
  Building2,
  ArrowRight,
  Award,
} from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

interface InquiryFormState {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactClient() {
  const { workshop } = useUpcomingWorkshop();
  const coordinatorEmail = workshop.sponsor_coordinator_email;
  const coordinatorName = workshop.sponsor_coordinator_name;

  const [form, setForm] = useState<InquiryFormState>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "General Society Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("topic") === "sponsorship") {
      setForm((prev) => ({ ...prev, subject: "Sponsorship & Billing Inquiries" }));
    }
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const recipient =
      form.subject === "Sponsorship & Billing Inquiries"
        ? coordinatorEmail
        : "info@hems-workshop.org";

    const bodyLines = [
      fullName ? `Name: ${fullName}` : "",
      form.email ? `Reply-To: ${form.email}` : "",
      "",
      form.message,
    ].filter((line, idx) => line !== "" || idx === 2);

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
      `[HEMS Website] ${form.subject}`
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono mb-4 shadow-2xs">
          <Mail size={14} className="text-primary" /> Official Society Communications
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-slate-900">
          Contact the <span className="text-primary italic font-normal">HEMS</span> Society
        </h1>
        <p className="text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Get in touch with the HEMS Society organizing committee regarding the {workshop.workshop_ordinal} Workshop ({workshop.target_window}), proceedings,{" "}
          <Link href="/corporate-sponsorship" className="text-primary font-semibold hover:underline">
            corporate sponsorships
          </Link>
          , or general inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-surface/50 border border-foreground/10 rounded-2xl p-8 shadow-sm h-fit">
          <h2 className="text-2xl font-bold uppercase mb-2 text-foreground">Compose an Inquiry</h2>
          <p className="text-xs text-foreground/65 mb-6">
            Submitting opens your default email client pre-addressed to the appropriate HEMS Society coordinator.
          </p>

          {submitted && (
            <div className="mb-6 p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Email draft prepared in your mail client.</p>
                <p className="text-foreground/75 mt-1">
                  If your mail client did not open automatically, please email{" "}
                  <a
                    href={
                      form.subject === "Sponsorship & Billing Inquiries"
                        ? `mailto:${coordinatorEmail}`
                        : "mailto:info@hems-workshop.org"
                    }
                    className="underline font-mono font-semibold text-primary"
                  >
                    {form.subject === "Sponsorship & Billing Inquiries"
                      ? coordinatorEmail
                      : "info@hems-workshop.org"}
                  </a>{" "}
                  directly.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-xs font-bold text-foreground/80 uppercase font-mono">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-xs font-bold text-foreground/80 uppercase font-mono">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-foreground/80 uppercase font-mono">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-xs font-bold text-foreground/80 uppercase font-mono">
                Topic
              </label>
              <select
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
              >
                <option value="General Society Inquiry">General Society Inquiry</option>
                <option value="Biennial Workshop & Registration">Biennial Workshop &amp; Registration</option>
                <option value="Sponsorship & Billing Inquiries">Sponsorship &amp; Billing Inquiries</option>
                <option value="Proceedings Archive & Citations">Proceedings Archive &amp; Citations</option>
              </select>

              {form.subject === "Sponsorship & Billing Inquiries" && (
                <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground/80 flex items-center justify-between gap-3">
                  <span>
                    Review sponsor benefits, exhibition space, and split-billing options on our dedicated page.
                  </span>
                  <Link
                    href="/corporate-sponsorship"
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline whitespace-nowrap shrink-0"
                  >
                    Corporate Sponsorship <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-xs font-bold text-foreground/80 uppercase font-mono">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-background font-bold uppercase py-3.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
            >
              <Send size={16} /> Prepare Email Inquiry
            </button>
          </form>
        </div>

        {/* Direct Channels, Corporate Sponsorship & Governance Info */}
        <div className="space-y-8">
          <div className="bg-surface/50 border border-foreground/10 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold uppercase mb-6 text-foreground">Direct Channels</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">General &amp; Program Inquiries</h3>
                  <p className="text-xs text-foreground/70 mb-1">Organizing committee &amp; technical program desk</p>
                  <a href="mailto:info@hems-workshop.org" className="text-primary font-mono text-sm hover:underline">
                    info@hems-workshop.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 p-3 rounded-xl text-secondary shrink-0">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Corporate Sponsorship &amp; Billing</h3>
                  <p className="text-xs text-foreground/70 mb-1">
                    Coordinator: {coordinatorName} (custom invoices &amp; split billing)
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <a
                      href={`mailto:${coordinatorEmail}`}
                      className="text-primary font-mono text-sm hover:underline"
                    >
                      {coordinatorEmail}
                    </a>
                    <Link
                      href="/corporate-sponsorship"
                      className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                    >
                      Sponsorship Details &amp; Packages <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  {workshop.venue_confirmed ? (
                    <>
                      <h3 className="font-bold text-foreground">
                        Upcoming Symposium Venue ({workshop.workshop_ordinal} Workshop)
                      </h3>
                      <p className="text-xs text-foreground/70 mb-1">
                        {workshop.hotel_name} • {workshop.exact_dates}
                      </p>
                      {workshop.hotel_maps_url ? (
                        <a
                          href={workshop.hotel_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary font-mono text-xs hover:underline"
                        >
                          {workshop.hotel_address} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-foreground/75">
                          {workshop.hotel_address}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-foreground">
                        Upcoming {workshop.workshop_ordinal} Workshop ({workshop.target_window})
                      </h3>
                      <p className="text-xs text-foreground/70 mb-1.5">
                        {workshop.venue_city_state} — Host beachfront hotel announcement forthcoming
                      </p>
                      <a
                        href="https://maps.app.goo.gl/iryzq94Cg5gTFS2J7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-foreground/55 font-mono text-[11px] hover:text-primary hover:underline"
                      >
                        Previous 15th Venue (2025): Sheraton Virginia Beach Oceanfront <ExternalLink size={11} />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Corporate Sponsorship Portal Card */}
          <div className="bg-surface border-2 border-secondary/30 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 text-secondary font-mono text-xs font-bold uppercase tracking-wider mb-3">
              <Award size={17} /> Industry &amp; Institutional Partnerships
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">
              Corporate Sponsorship
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-5">
              Each biennial HEMS Workshop is independently funded through registrations, donations, and corporate sponsors—helping offset symposium costs and fund competitive Student Travel Awards while providing hardware exhibition space, corporate poster display, and website recognition.
            </p>
            <Link
              href="/corporate-sponsorship"
              className="inline-flex items-center gap-2 bg-secondary text-background font-bold px-5 py-3 rounded-lg hover:bg-secondary/90 transition-all shadow-sm text-xs uppercase tracking-wide"
            >
              View Corporate Sponsorship Page <ArrowRight size={14} />
            </Link>
          </div>

          {/* Society Governance Card */}
          <div className="bg-gradient-to-br from-primary/10 via-surface/40 to-secondary/10 border border-primary/20 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2.5 text-primary font-mono text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck size={18} /> Nonprofit Incorporation
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-foreground mb-3">
              HEMS Society, Inc.
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              Incorporated in the State of Florida since 2008 as a tax-exempt <strong>501(c)(3) Public Charity</strong>, the Harsh-Environment Mass Spectrometry Society is governed by a rotating volunteer committee of academic, government, and industry scientists.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-foreground/10 font-mono text-xs text-foreground/70">
              <div>
                <span className="block text-[10px] uppercase text-foreground/50">Workshop Cadence</span>
                <strong className="text-foreground">Biennial (Every 2 Years)</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-foreground/50">Inaugural Meeting</span>
                <strong className="text-foreground">Feb 1999 • St. Petersburg, FL</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
