"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { MailingInterest } from "@/types/mailing";
import { submitPublicMailingSignup } from "@/utils/mailingClient";

const INTEREST_OPTIONS: Array<{ id: MailingInterest; label: string }> = [
  { id: "workshop", label: "Biennial Workshop & Call for Papers" },
  { id: "student_awards", label: "Student Travel Awards" },
  { id: "sponsorship", label: "Corporate Sponsorship" },
];

export default function MailingListSignupCard() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(""); // Bot honeypot
  const [interests, setInterests] = useState<MailingInterest[]>(["workshop"]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleInterest = (item: MailingInterest) => {
    setInterests((prev) =>
      prev.includes(item)
        ? prev.length > 1
          ? prev.filter((x) => x !== item)
          : prev
        : [...prev, item]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setSubmitting(true);

    try {
      const result = await submitPublicMailingSignup({
        email,
        firstName,
        lastName,
        affiliation,
        interests,
        websiteUrl,
        sourceLabel: "Contact Page Card",
      });
      setStatusMsg(result.message);
      setFirstName("");
      setLastName("");
      setEmail("");
      setAffiliation("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to record subscription at this time.";
      console.error("[MailingListSignupCard] Submission error:", err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="mailing-list"
      className="scroll-mt-24 bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-8 shadow-2xs"
    >
      <div className="flex items-start gap-3.5 mb-5">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Mail size={20} />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-0.5">
            Symposium Mailing List
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            Receive Official HEMS Announcements
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Low-volume academic announcements only (Call for Papers, venue &amp; registration opening, and Student Travel Awards). Zero tracking pixels; one-click{" "}
            <Link href="/unsubscribe" className="text-primary font-medium hover:underline">
              unsubscribe
            </Link>{" "}
            at any time.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 size={17} className="text-emerald-700 shrink-0 mt-0.5" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden Honeypot for automated bots */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="hems-website-hp">Leave blank</label>
          <input
            id="hems-website-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ml-first"
              className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 mb-1"
            >
              First Name
            </label>
            <input
              id="ml-first"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ada"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="ml-last"
              className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 mb-1"
            >
              Last Name
            </label>
            <input
              id="ml-last"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Lovelace"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ml-email"
              className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 mb-1"
            >
              Email Address <span className="text-primary">*</span>
            </label>
            <input
              id="ml-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@university.edu"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="ml-affiliation"
              className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 mb-1"
            >
              Institution / Lab <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="ml-affiliation"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="e.g., NASA JPL, USF, NRL"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 mb-2">
            Announcement Topics
          </span>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((opt) => {
              const active = interests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInterest(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 flex items-start sm:items-center gap-1.5 leading-relaxed">
            <ShieldCheck size={14} className="text-primary shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Never shared with third parties. Direct{" "}
              <code className="text-[10.5px] bg-slate-100 px-1 py-0.5 rounded">hems-workshop.org</code>{" "}
              delivery.
            </span>
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Submitting...
              </>
            ) : (
              "Join Mailing List"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

