"use client";

import React, { useState, useEffect, useId, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MailingInterest } from "@/types/mailing";
import { submitPublicMailingSignup } from "@/utils/mailingClient";

export interface InlineMailingSignupProps {
  variant?: "card" | "compact" | "footer";
  kicker?: string;
  heading?: string;
  description?: string;
  buttonLabel?: string;
  interests?: MailingInterest[];
  sourceLabel: string;
  className?: string;
}

export default function InlineMailingSignup({
  variant = "card",
  kicker = "Symposium Alerts",
  heading = "Receive Official Opening Notifications",
  description = "Low-volume academic announcements only (Call for Papers, registration, venue & Student Travel Awards).",
  buttonLabel = "Notify Me",
  interests = ["workshop"],
  sourceLabel,
  className = "",
}: InlineMailingSignupProps) {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const fieldId = useId();
  const honeypotId = useId();

  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Pre-fill signed-in user's email when input is still untouched
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  // Avoid duplicate mailing forms on /contact (full MailingListSignupCard) and /unsubscribe
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (
    variant === "footer" &&
    (normalizedPath === "/contact" || normalizedPath === "/unsubscribe")
  ) {
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setSubmitting(true);

    try {
      const nameParts =
        user?.email &&
        user.email.toLowerCase() === email.trim().toLowerCase() &&
        user.name
          ? user.name.trim().split(/\s+/)
          : [];
      const res = await submitPublicMailingSignup({
        email,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" "),
        interests,
        websiteUrl,
        sourceLabel,
      });
      setStatusMsg(res.message);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to record subscription right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === "compact") {
    return (
      <div className={`pt-2.5 border-t border-slate-200/80 print:hidden ${className}`}>
        {statusMsg ? (
          <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/90 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{statusMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="hidden" aria-hidden="true">
              <label htmlFor={honeypotId}>Leave blank</label>
              <input
                id={honeypotId}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <label
              htmlFor={fieldId}
              className="block text-[11px] font-semibold text-slate-700 leading-snug"
            >
              {heading}
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id={fieldId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@institution.edu"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-primary rounded-lg pl-8 pr-3 py-2 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-sky-800 text-white font-semibold px-3.5 py-2 min-h-[38px] rounded-lg text-xs whitespace-nowrap transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  buttonLabel
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-700 font-medium">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`max-w-md pt-1 print:hidden ${className}`}>
        {statusMsg ? (
          <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{statusMsg}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-2"
          >
            <div className="hidden" aria-hidden="true">
              <label htmlFor={honeypotId}>Leave blank</label>
              <input
                id={honeypotId}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <label
              htmlFor={fieldId}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"
            >
              <Mail size={13} className="text-primary shrink-0" />
              <span>{heading}</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id={fieldId}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@institution.edu"
                className="flex-1 min-w-0 bg-white border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-sky-800 text-white font-semibold px-3.5 py-2 min-h-[38px] rounded-lg text-xs whitespace-nowrap transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Sending...
                  </>
                ) : (
                  buttonLabel
                )}
              </button>
            </div>

            {errorMsg ? (
              <p className="text-[11px] text-red-700 font-medium">{errorMsg}</p>
            ) : (
              <p className="text-[11px] text-slate-500 leading-snug">
                Low-volume symposium notices •{" "}
                <Link href="/unsubscribe" className="text-primary hover:underline font-medium">
                  1-click unsubscribe
                </Link>
              </p>
            )}
          </form>
        )}
      </div>
    );
  }

  // Default: variant === "card"
  return (
    <div
      className={`bg-[#F8FAFD] border border-primary/20 rounded-xl p-4 sm:p-5 shadow-2xs print:hidden ${className}`}
    >
      {statusMsg ? (
        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-900 bg-emerald-50/95 border border-emerald-200 rounded-xl p-3.5">
          <CheckCircle2 size={17} className="text-emerald-700 shrink-0 mt-0.5" />
          <span>{statusMsg}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="hidden" aria-hidden="true">
            <label htmlFor={honeypotId}>Leave blank</label>
            <input
              id={honeypotId}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Mail size={16} />
            </div>
            <div className="min-w-0">
              {kicker && (
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.11em] text-primary">
                  {kicker}
                </span>
              )}
              <label
                htmlFor={fieldId}
                className="block font-serif text-base sm:text-lg font-semibold text-slate-900 leading-snug cursor-pointer"
              >
                {heading}
              </label>
              {description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id={fieldId}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="researcher@institution.edu"
              className="flex-1 min-w-0 bg-white border border-slate-200 focus:border-primary rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors shadow-2xs"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-sky-800 text-white font-semibold px-4 py-2.5 min-h-[42px] rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Submitting...
                </>
              ) : (
                buttonLabel
              )}
            </button>
          </div>

          {errorMsg ? (
            <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Double opt-in confirmation • Zero tracking pixels •{" "}
              <Link href="/unsubscribe" className="text-primary hover:underline font-medium">
                Unsubscribe anytime
              </Link>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
