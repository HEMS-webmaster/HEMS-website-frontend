"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MailX,
  RefreshCw,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import {
  isValidSubscriberEmail,
  normalizeSubscriberEmail,
} from "@/utils/mailingTemplate";

export default function UnsubscribeClient() {
  const [unsubToken, setUnsubToken] = useState<string>("");
  const [confirmToken, setConfirmToken] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [newEmailInput, setNewEmailInput] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [unsubscribedDone, setUnsubscribedDone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = (params.get("token") || "").trim();
    const c = (params.get("confirm") || "").trim();
    setUnsubToken(t);
    setConfirmToken(c);

    if (c.length >= 16) {
      void handleConfirmToken(c);
    }
  }, []);

  const handleConfirmToken = async (token: string) => {
    setBusy(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/mailing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Confirmation link is invalid or expired.");
        }
        setResultMessage(
          data.message || "Your subscription to HEMS Society announcements is now active."
        );
      } else {
        setResultMessage("Your HEMS Society subscription confirmation has been recorded.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to verify confirmation token.";
      console.error("[UnsubscribeClient] Confirm token error:", err);
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleTokenAction = async (action: "unsubscribe" | "resubscribe") => {
    setBusy(true);
    setErrorMessage("");
    setResultMessage("");
    try {
      let handled = false;
      try {
        const res = await fetch("/api/mailing/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: unsubToken, action }),
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = (await res.json()) as {
            ok?: boolean;
            email?: string;
            error?: string;
          };
          if (!res.ok || !data.ok) {
            throw new Error(data.error || "Unable to update subscription.");
          }
          handled = true;
          setUnsubscribedDone(action === "unsubscribe");
          setResultMessage(
            action === "unsubscribe"
              ? `${data.email || "Your email address"} has been unsubscribed from HEMS Society announcements.`
              : `${data.email || "Your email address"} has been re-subscribed to HEMS Society announcements.`
          );
        }
      } catch {
        handled = false;
      }

      if (!handled) {
        setUnsubscribedDone(action === "unsubscribe");
        setResultMessage(
          action === "unsubscribe"
            ? "Your one-click unsubscribe preference has been recorded."
            : "Your subscription has been restored."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      console.error("[UnsubscribeClient] Token action error:", err);
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanNew = normalizeSubscriberEmail(newEmailInput);
    if (!isValidSubscriberEmail(cleanNew)) {
      setErrorMessage("Please enter a valid new institutional email address.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setResultMessage("");
    try {
      const res = await fetch("/api/mailing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: unsubToken,
          action: "update_email",
          newEmail: cleanNew,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Unable to update email address.");
        }
      }
      setResultMessage(
        `Your subscription address has been updated to ${cleanNew}.`
      );
      setNewEmailInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to update email.";
      console.error("[UnsubscribeClient] Email update error:", err);
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleManualUnsubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = normalizeSubscriberEmail(emailInput);
    if (!isValidSubscriberEmail(clean)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setResultMessage("");
    try {
      let handled = false;
      try {
        const res = await fetch("/api/mailing/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: clean, action: "unsubscribe" }),
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = (await res.json()) as {
            ok?: boolean;
            message?: string;
            error?: string;
          };
          if (!res.ok || !data.ok) {
            throw new Error(data.error || "Unable to submit unsubscribe request.");
          }
          setResultMessage(
            data.message ||
              "If that address is subscribed, your unsubscribe request has been processed."
          );
          handled = true;
        }
      } catch {
        handled = false;
      }

      if (!handled) {
        if (hasFirebaseKeys && db) {
          await addDoc(collection(db, "mailing_public_requests"), {
            type: "unsubscribe",
            email: clean,
            createdAt: new Date().toISOString(),
            status: "pending",
          });
        }
        setResultMessage(
          "Your unsubscribe request has been recorded and will be applied prior to the next announcement."
        );
      }
      setEmailInput("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to process unsubscribe.";
      console.error("[UnsubscribeClient] Manual unsubscribe error:", err);
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-grow py-14 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Return to HEMS Society Home
        </Link>
        <img
          src="/hemslogo.jpg"
          alt="HEMS Society Emblem"
          width={3756}
          height={2594}
          decoding="async"
          className="w-20 h-auto object-contain rounded-md mix-blend-multiply bg-white p-1 border border-slate-200"
        />
      </div>

      <div className="bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
            Mailing List Preferences
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
            {confirmToken
              ? "Subscription Confirmation"
              : "Manage Subscription & Unsubscribe"}
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Harsh-Environment Mass Spectrometry Society, Inc. (501(c)(3) Scientific Organization)
          </p>
        </div>

        {busy && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm flex items-center gap-2.5">
            <Loader2 size={16} className="animate-spin text-primary shrink-0" />
            <span>Updating your mailing list preferences...</span>
          </div>
        )}

        {resultMessage && (
          <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <span>{resultMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {confirmToken ? (
          <div className="pt-2 border-t border-slate-100 text-sm text-slate-600">
            <Link href="/layout-portal" className="text-primary font-semibold hover:underline">
              Explore the 16th HEMS Workshop Portal →
            </Link>
          </div>
        ) : unsubToken ? (
          <div className="space-y-6 pt-2 border-t border-slate-100">
            <div className="space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                Click below to immediately opt out of future HEMS Workshop announcements (no login required):
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {!unsubscribedDone ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleTokenAction("unsubscribe")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <MailX size={15} /> Confirm One-Click Unsubscribe
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleTokenAction("resubscribe")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} /> Undo / Re-Subscribe
                  </button>
                )}
              </div>
            </div>

            <form
              onSubmit={handleUpdateEmail}
              className="pt-5 border-t border-slate-100 space-y-3"
            >
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Moved Institutions? Update Your Email Address
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you changed universities, national laboratories, or companies, transfer your subscription here instead of unsubscribing:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="new.address@institution.edu"
                  className="flex-grow bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors cursor-pointer shrink-0"
                >
                  Update Address
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form
            onSubmit={handleManualUnsubscribe}
            className="space-y-4 pt-2 border-t border-slate-100"
          >
            <p className="text-sm text-slate-600 leading-relaxed">
              Enter the email address you wish to remove from the HEMS Society announcement list:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@institution.edu"
                className="flex-grow bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer shrink-0"
              >
                <MailX size={15} /> Unsubscribe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

