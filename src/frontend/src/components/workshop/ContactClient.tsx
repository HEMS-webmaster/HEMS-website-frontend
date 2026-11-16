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
  Wrench,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import MailingListSignupCard from "@/components/mailing/MailingListSignupCard";
import { recordTelemetryEvent } from "@/utils/telemetryClient";
import { HEMS_LINKEDIN_GROUP_URL } from "@/utils/seo";
import {
  isValidSubscriberEmail,
  normalizeSubscriberEmail,
} from "@/utils/mailingTemplate";

interface InquiryFormState {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export const MOCK_CONTACT_INQUIRIES_KEY = "hems_mock_contact_inquiries_v1";

interface PreparedEmailDraft {
  recipient: string;
  subjectLine: string;
  bodyText: string;
  mailtoUrl: string;
  gmailComposeUrl: string;
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
  const [websiteUrl, setWebsiteUrl] = useState(""); // Bot honeypot
  const [submittingOnline, setSubmittingOnline] = useState(false);
  const [onlineSuccess, setOnlineSuccess] = useState<{
    message: string;
    recipient: string;
  } | null>(null);
  const [emailDraft, setEmailDraft] = useState<PreparedEmailDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    if (topic === "sponsorship") {
      setForm((prev) => ({ ...prev, subject: "Sponsorship & Billing Inquiries" }));
    } else if (topic === "webmaster" || topic === "support") {
      setForm((prev) => ({ ...prev, subject: "Website & Technical Support" }));
    }
  }, []);

  const resolveRecipientEmail = (subject: string): string => {
    if (subject === "Sponsorship & Billing Inquiries") {
      return coordinatorEmail;
    }
    if (subject === "Website & Technical Support") {
      return "webmaster@hems-workshop.org";
    }
    return "president@hems-workshop.org";
  };

  const buildEmailDraft = (): PreparedEmailDraft => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const cleanEmail = normalizeSubscriberEmail(form.email);
    const recipient = resolveRecipientEmail(form.subject);
    const subjectLine = `[HEMS Website] ${form.subject}`;

    const bodyLines = [
      fullName ? `Name: ${fullName}` : "",
      cleanEmail ? `Reply-To: ${cleanEmail}` : "",
      "",
      form.message.trim(),
    ].filter((line, idx) => line !== "" || idx === 2);

    const bodyText = bodyLines.join("\n");
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(bodyText)}`;
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipient
    )}&su=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`;

    return {
      recipient,
      subjectLine,
      bodyText,
      mailtoUrl,
      gmailComposeUrl,
    };
  };

  const validateFormFields = (): string | null => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "Please enter your first and last name.";
    }
    const cleanEmail = normalizeSubscriberEmail(form.email);
    if (!isValidSubscriberEmail(cleanEmail)) {
      return "Please enter a valid email address so we can reply to your inquiry.";
    }
    if (form.message.trim().length < 2) {
      return "Please enter a message before submitting.";
    }
    return null;
  };

  const handleOnlineSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setOnlineSuccess(null);
    setEmailDraft(null);

    const recipient = resolveRecipientEmail(form.subject);

    if (websiteUrl.trim() !== "") {
      setOnlineSuccess({
        message: `Thank you. Your inquiry has been sent online to ${recipient}.`,
        recipient,
      });
      return;
    }

    const validationErr = validateFormFields();
    if (validationErr) {
      setErrorMsg(validationErr);
      return;
    }

    const cleanEmail = normalizeSubscriberEmail(form.email);
    setSubmittingOnline(true);

    try {
      // 1. Try primary Cloud Functions endpoint (/api/contact/inquiry)
      let handledByFunction = false;
      try {
        const res = await fetch("/api/contact/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: cleanEmail,
            subject: form.subject,
            message: form.message.trim(),
            websiteUrl,
          }),
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = (await res.json()) as {
            ok?: boolean;
            message?: string;
            recipientEmail?: string;
            error?: string;
          };
          if (!res.ok || !data.ok) {
            throw new Error(data.error || "Unable to submit inquiry.");
          }
          setOnlineSuccess({
            message:
              data.message ||
              `Thank you. Your inquiry has been delivered online to ${data.recipientEmail || recipient}.`,
            recipient: data.recipientEmail || recipient,
          });
          handledByFunction = true;
        }
      } catch {
        handledByFunction = false;
      }

      // 2. Fallback to write-only Firestore public queue (and local Board buffer if rules await deploy)
      if (!handledByFunction) {
        const now = new Date().toISOString();
        const payload = {
          type: "contact_inquiry" as const,
          email: cleanEmail,
          firstName: form.firstName.trim().slice(0, 80),
          lastName: form.lastName.trim().slice(0, 80),
          subject: form.subject.slice(0, 200),
          message: form.message.trim().slice(0, 5000),
          recipientEmail: recipient,
          createdAt: now,
          status: "pending" as const,
        };

        let wroteToFirestore = false;
        if (hasFirebaseKeys && db) {
          try {
            await addDoc(collection(db, "mailing_public_requests"), payload);
            wroteToFirestore = true;
          } catch {
            wroteToFirestore = false;
          }
        }

        if (!wroteToFirestore && typeof window !== "undefined") {
          const existing = JSON.parse(
            window.localStorage.getItem(MOCK_CONTACT_INQUIRIES_KEY) || "[]"
          ) as Array<Record<string, unknown>>;
          existing.unshift({ id: `inq-${Date.now()}`, ...payload });
          window.localStorage.setItem(
            MOCK_CONTACT_INQUIRIES_KEY,
            JSON.stringify(existing.slice(0, 200))
          );
        }

        setOnlineSuccess({
          message: `Thank you. Your inquiry has been submitted online for ${recipient} and the HEMS Organizing Committee.`,
          recipient,
        });
      }

      void recordTelemetryEvent({
        eventType: "contact_inquiry",
        path: "/contact",
        targetLabel: `${form.subject} (${recipient})`,
      });

      setForm((prev) => ({ ...prev, message: "" }));
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to submit inquiry online right now. Please use the Email App button or email us directly."
      );
    } finally {
      setSubmittingOnline(false);
    }
  };

  const handleOpenEmailClient = () => {
    setErrorMsg("");
    setOnlineSuccess(null);

    const validationErr = validateFormFields();
    if (validationErr) {
      setErrorMsg(validationErr);
      return;
    }

    const draft = buildEmailDraft();
    setEmailDraft(draft);

    void recordTelemetryEvent({
      eventType: "mailto_click",
      path: "/contact",
      targetLabel: draft.recipient,
    });

    // Trigger OS mail handler via anchor click so single-page state remains intact
    const link = document.createElement("a");
    link.href = draft.mailtoUrl;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyDraft = async () => {
    if (!emailDraft || typeof navigator === "undefined") return;
    const text = `To: ${emailDraft.recipient}\nSubject: ${emailDraft.subjectLine}\n\n${emailDraft.bodyText}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDraft(true);
      window.setTimeout(() => setCopiedDraft(false), 2200);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="flex flex-col flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-7 sm:mb-12 pb-6 sm:pb-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium leading-snug mb-4 shadow-2xs">
            <Mail size={14} className="text-primary shrink-0" /> Official Society Communications
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

        <div className="hidden md:flex flex-col items-center p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs self-start md:self-center shrink-0">
          <img
            src="/hemslogo.jpg"
            alt="HEMS Society Official Emblem"
            width={3756}
            height={2594}
            decoding="async"
            className="w-28 sm:w-32 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-1 block"
          />
          <span className="text-[11px] font-medium text-slate-500 mt-1.5">Organizing Committee</span>
        </div>
      </div>

      <div className="mb-10 sm:mb-12">
        <MailingListSignupCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Contact Form */}
        <div className="bg-surface/50 border border-foreground/10 rounded-2xl p-5 sm:p-8 shadow-sm h-fit">
          <h2 className="text-2xl font-bold uppercase mb-2 text-foreground">Compose an Inquiry</h2>
          <p className="text-xs text-foreground/65 mb-6 leading-relaxed">
            Submit directly online (no local mail app required) or open a pre-addressed message in your email client—routed to{" "}
            <span className="font-semibold text-primary">
              {resolveRecipientEmail(form.subject)}
            </span>
            .
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {onlineSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold">Inquiry submitted online.</p>
                <p className="text-emerald-800/90 mt-1 leading-relaxed">
                  {onlineSuccess.message}
                </p>
              </div>
            </div>
          )}

          {emailDraft && (
            <div className="mb-6 p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold">Email draft prepared for {emailDraft.recipient}.</p>
                  <p className="text-foreground/75 mt-1 leading-relaxed">
                    Didn&apos;t see a mail window open? You can click <strong>Submit Online</strong> below, open the draft directly in Gmail Web, or copy the formatted message:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-6">
                <a
                  href={emailDraft.gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:border-primary hover:text-primary font-semibold transition-colors"
                >
                  Open in Gmail Web <ExternalLink size={12} />
                </a>
                <button
                  type="button"
                  onClick={() => void handleCopyDraft()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:border-primary hover:text-primary font-semibold transition-colors cursor-pointer"
                >
                  {copiedDraft ? (
                    <>
                      <Check size={12} className="text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy To &amp; Message
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => void handleOnlineSubmit(e)} className="space-y-5">
            {/* Hidden honeypot field for bots */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-website-url">Website</label>
              <input
                id="contact-website-url"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-[11px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-[11px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[11px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-[11px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
                Topic
              </label>
              <select
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
              >
                <option value="General Society Inquiry">General Society Inquiry</option>
                <option value="Biennial Workshop & Registration">Biennial Workshop &amp; Registration</option>
                <option value="Sponsorship & Billing Inquiries">Sponsorship &amp; Billing Inquiries</option>
                <option value="Proceedings Archive & Citations">Proceedings Archive &amp; Citations</option>
                <option value="Website & Technical Support">Website &amp; Technical Support</option>
              </select>

              {form.subject === "Sponsorship & Billing Inquiries" && (
                <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
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
              <label htmlFor="message" className="text-[11px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
              />
            </div>

            {/* Side-by-Side Online Submission + Email Client Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="submit"
                disabled={submittingOnline}
                className="w-full bg-primary text-background font-bold uppercase py-3.5 px-4 min-h-[46px] rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
              >
                {submittingOnline ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>Sending Online...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className="shrink-0" />
                    <span>Submit Online</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submittingOnline}
                onClick={handleOpenEmailClient}
                className="w-full bg-background border-2 border-primary/35 text-primary hover:bg-primary/5 hover:border-primary font-bold uppercase py-3.5 px-4 min-h-[46px] rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Mail size={16} className="shrink-0" />
                <span>Open in Email App</span>
              </button>
            </div>
          </form>
        </div>

        {/* Direct Channels, Corporate Sponsorship & Governance Info */}
        <div className="space-y-8 min-w-0">
          <div className="bg-surface/50 border border-foreground/10 rounded-2xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold uppercase mb-6 text-foreground">Direct Channels</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <Mail size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground">General &amp; Symposium Enquiries</h3>
                  <p className="text-xs text-foreground/70 mb-1">Society President &amp; Organizing Committee</p>
                  <a href="mailto:president@hems-workshop.org" className="text-primary font-medium text-sm hover:underline break-all">
                    president@hems-workshop.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 p-3 rounded-xl text-secondary shrink-0">
                  <Building2 size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground">Corporate Sponsorship &amp; Billing</h3>
                  <p className="text-xs text-foreground/70 mb-1">
                    Coordinator: {coordinatorName} (custom invoices &amp; split billing)
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <a
                      href={`mailto:${coordinatorEmail}`}
                      className="text-primary font-medium text-sm hover:underline break-all"
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
                <div className="bg-slate-200/70 p-3 rounded-xl text-slate-700 shrink-0">
                  <Wrench size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground">Website &amp; Technical Support</h3>
                  <p className="text-xs text-foreground/70 mb-1">
                    Website troubles, proceedings archive access, mailing list, or portal sign-in support
                  </p>
                  <a
                    href="mailto:webmaster@hems-workshop.org"
                    className="text-primary font-medium text-sm hover:underline break-all"
                  >
                    webmaster@hems-workshop.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#0A66C2]/10 p-3 rounded-xl text-[#0A66C2] shrink-0">
                  <svg
                    width={22}
                    height={22}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground">HEMS LinkedIn Community Group</h3>
                  <p className="text-xs text-foreground/70 mb-1">
                    Follow biennial workshop announcements, archived talk spotlights, student travel grant alerts, and community discussions.
                  </p>
                  <a
                    href={HEMS_LINKEDIN_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      void recordTelemetryEvent({
                        eventType: "outbound_click",
                        path: "/contact",
                        targetLabel: "HEMS LinkedIn Group",
                      })
                    }
                    className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline"
                  >
                    linkedin.com/groups/4385091 <ExternalLink size={13} className="shrink-0" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <MapPin size={22} />
                </div>
                <div className="min-w-0">
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
                          className="inline-flex items-center gap-1 text-primary font-medium text-xs hover:underline"
                        >
                          {workshop.hotel_address} <ExternalLink size={12} className="shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-foreground/75">
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
                        className="inline-flex items-center gap-1 text-foreground/55 text-[11px] hover:text-primary hover:underline"
                      >
                        <span>Previous 15th Venue (2025): Sheraton Virginia Beach Oceanfront</span>
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Corporate Sponsorship Portal Card */}
          <div className="bg-surface border-2 border-secondary/30 rounded-2xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-secondary text-[11px] font-semibold uppercase tracking-[0.1em] mb-3">
              <Award size={17} className="shrink-0" /> Industry &amp; Institutional Partnerships
            </div>
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              Corporate Sponsorship
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-5">
              Each biennial HEMS Workshop is independently funded through registrations, donations, and corporate sponsors—helping offset symposium costs and fund competitive Student Travel Awards while providing hardware exhibition space, corporate poster display, and website recognition.
            </p>
            <Link
              href="/corporate-sponsorship"
              className="inline-flex items-center justify-center gap-2 bg-secondary text-background font-bold px-5 py-3 min-h-[44px] w-full sm:w-auto rounded-lg hover:bg-secondary/90 transition-all shadow-sm text-xs uppercase tracking-wide text-center"
            >
              View Corporate Sponsorship Page <ArrowRight size={14} className="shrink-0" />
            </Link>
          </div>

          {/* Society Governance Card */}
          <div className="bg-gradient-to-br from-primary/10 via-surface/40 to-secondary/10 border border-primary/20 rounded-2xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 text-primary text-[11px] font-semibold uppercase tracking-[0.1em] mb-3">
              <ShieldCheck size={18} className="shrink-0" /> All-Volunteer 501(c)(3) • Est. 1999
            </div>
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 mb-3">
              HEMS Society, Inc.
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              Formed in 1999 and incorporated in the State of Florida in 2008 as an all-volunteer, tax-exempt <strong>501(c)(3) Public Charity</strong>, the Harsh-Environment Mass Spectrometry Society is governed by a rotating Board of Directors and Organizing Committee of academic, government, and industry scientists.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-foreground/10 text-xs text-foreground/70">
              <div>
                <span className="block text-[10px] uppercase text-foreground/50">Workshop Cadence</span>
                <strong className="text-foreground">Biennial (Every 2 Years)</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-foreground/50">Formed / Inaugural Workshop</span>
                <strong className="text-foreground">Feb 1999 • St. Petersburg, FL</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
