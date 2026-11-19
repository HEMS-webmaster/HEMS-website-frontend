"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { auth } from "@/utils/firebase";
import { submitPublicMailingSignup } from "@/utils/mailingClient";
import { recordTelemetryEvent } from "@/utils/telemetryClient";
import {
  X,
  Lock,
  Mail,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

interface MockDownloadRecord {
  fileName: string;
  downloadCount: number;
  lastDownloaded: string;
  category: string;
  workshopName: string;
}

function extractReadableFileName(url: string): string {
  try {
    if (url.includes("?file=")) {
      return decodeURIComponent(url.split("?file=")[1].split("&")[0].split("#")[0]);
    }
    const cleanPath = url.split("#")[0].split("?")[0];
    return decodeURIComponent(cleanPath.split("/").pop() || "Proceedings Document.pdf");
  } catch {
    return "Proceedings Document.pdf";
  }
}

export default function DownloadGate({ children }: { children: React.ReactNode }) {
  const {
    user,
    loginWithGoogle,
    loginWithMicrosoft,
    sendMagicSignInLink,
    completeEmailLinkSignIn,
    isMock,
    emailVerified,
    sendVerificationEmail,
    reloadUser,
    completingEmailLink,
    pendingEmailLinkPrompt,
    emailLinkError,
    clearEmailLinkPrompt,
    readyDownloadUrl,
    clearReadyDownloadUrl,
  } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [unlockedPdfUrl, setUnlockedPdfUrl] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [confirmLinkEmail, setConfirmLinkEmail] = useState("");
  const [optInNewsletter, setOptInNewsletter] = useState(false);
  const [newsletterSubscribedNote, setNewsletterSubscribedNote] = useState("");
  const [readySubscribeBusy, setReadySubscribeBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<"google" | "microsoft" | "link" | "confirm" | null>(
    null
  );
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [verifBusy, setVerifBusy] = useState(false);
  const [verifSent, setVerifSent] = useState(false);
  const [verifError, setVerifError] = useState("");

  const activeReadyPdfUrl = unlockedPdfUrl || readyDownloadUrl;

  const isDailyLimitReached = (targetUser: UserProfile | null): boolean => {
    if (!targetUser) return false;
    const isExempt =
      Array.isArray(targetUser.roles) &&
      targetUser.roles.some((r) => ["admin", "board", "reviewer", "operations", "treasurer"].includes(r));
    if (isExempt) return false;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const lastDate = targetUser.lastDownloadDate || "";
    const currentDownloadsToday = lastDate === todayStr ? targetUser.downloadsToday || 0 : 0;
    return currentDownloadsToday >= 30;
  };

  const trackDownload = async (url: string) => {
    if (!user) return;

    const fileName = extractReadableFileName(url);
    if (!fileName) return;

    let category = "Other";
    let wsName = "Unknown";

    const lowerName = fileName.toLowerCase();
    if (lowerName.includes("abstract")) {
      category = "Abstract";
    } else if (lowerName.includes("presentation")) {
      category = "Presentation";
    } else if (lowerName.includes("program")) {
      category = "Program";
    } else if (lowerName.includes("participant")) {
      category = "Participant List";
    }

    const parts = fileName.split("_");
    if (parts[0] && /^\d+(st|nd|rd|th)$/i.test(parts[0])) {
      wsName = parts[0];
    }

    const todayStr = new Date().toLocaleDateString("en-CA");
    const lastDate = user.lastDownloadDate || "";
    const newDownloadsToday = lastDate === todayStr ? (user.downloadsToday || 0) + 1 : 1;

    try {
      if (isMock) {
        const storedUsers = localStorage.getItem("hems_mock_users");
        if (storedUsers) {
          const users = JSON.parse(storedUsers) as UserProfile[];
          const updatedUsers = users.map((u) => {
            if (u.uid === user.uid) {
              return {
                ...u,
                downloadCount: (u.downloadCount || 0) + 1,
                lastDownloaded: new Date().toISOString(),
                downloadsToday: newDownloadsToday,
                lastDownloadDate: todayStr,
              };
            }
            return u;
          });
          localStorage.setItem("hems_mock_users", JSON.stringify(updatedUsers));
        }

        const storedCurrentUser = localStorage.getItem("hems_mock_current_user");
        if (storedCurrentUser) {
          const u = JSON.parse(storedCurrentUser) as UserProfile;
          const updated = {
            ...u,
            downloadCount: (u.downloadCount || 0) + 1,
            lastDownloaded: new Date().toISOString(),
            downloadsToday: newDownloadsToday,
            lastDownloadDate: todayStr,
          };
          localStorage.setItem("hems_mock_current_user", JSON.stringify(updated));
        }

        const storedDownloads = localStorage.getItem("hems_mock_downloads") || "[]";
        const downloads = JSON.parse(storedDownloads) as MockDownloadRecord[];
        const existingFile = downloads.find((d) => d.fileName === fileName);
        if (existingFile) {
          existingFile.downloadCount += 1;
          existingFile.lastDownloaded = new Date().toISOString();
        } else {
          downloads.push({
            fileName,
            downloadCount: 1,
            lastDownloaded: new Date().toISOString(),
            category,
            workshopName: wsName,
          });
        }
        localStorage.setItem("hems_mock_downloads", JSON.stringify(downloads));
      } else {
        const { db } = await import("../utils/firebase");
        const { doc, setDoc, updateDoc, increment } = await import("firebase/firestore");

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          downloadCount: increment(1),
          lastDownloaded: new Date().toISOString(),
          downloadsToday: newDownloadsToday,
          lastDownloadDate: todayStr,
        }).catch(async () => {
          await setDoc(
            userDocRef,
            {
              downloadCount: 1,
              lastDownloaded: new Date().toISOString(),
              downloadsToday: newDownloadsToday,
              lastDownloadDate: todayStr,
            },
            { merge: true }
          );
        });

        const fileId = fileName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileDocRef = doc(db, "downloads", fileId);

        await setDoc(
          fileDocRef,
          {
            fileName,
            downloadCount: increment(1),
            lastDownloaded: new Date().toISOString(),
            category,
            workshopName: wsName,
          },
          { merge: true }
        );
      }

      void recordTelemetryEvent({
        eventType: "pdf_download",
        targetLabel: `${wsName !== "Unknown" ? `${wsName}: ` : ""}${fileName}`,
        user,
      });
    } catch (err) {
      console.error("Failed to track download:", err);
    } finally {
      void reloadUser();
    }
  };

  const handleIntercept = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");

    if (!anchor || anchor.getAttribute("data-skip-gate") === "true") {
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href || (!/\.pdf(?:$|[?#])/i.test(href) && !href.includes("serve?file="))) {
      return;
    }

    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      setPendingUrl(href);
      setErrorMsg("");
      setLinkSentTo(null);
      setShowModal(true);
      return;
    }

    const isEmailVerified = isMock || emailVerified;
    if (!isEmailVerified) {
      e.preventDefault();
      e.stopPropagation();
      setPendingUrl(href);
      setVerifError("");
      setVerifSent(false);
      setShowVerifyModal(true);
      return;
    }

    if (isDailyLimitReached(user)) {
      e.preventDefault();
      e.stopPropagation();
      setShowLimitModal(true);
      return;
    }

    void trackDownload(href);
  };

  const handleSendDownloadLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setBusyAction("link");
    try {
      const returnPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/archive/";
      await sendMagicSignInLink(trimmed, {
        returnPath,
        pendingDownloadUrl: pendingUrl || undefined,
      });

      if (optInNewsletter) {
        const res = await submitPublicMailingSignup({
          email: trimmed,
          interests: ["workshop", "student_awards"],
          sourceLabel: "DownloadGate Email Link",
        }).catch(() => null);
        if (res?.ok) {
          setNewsletterSubscribedNote(res.message);
        }
      }

      if (isMock) {
        // In mock mode, sendMagicSignInLink signs in immediately and sets readyDownloadUrl
        setShowModal(false);
        setPendingUrl(null);
      } else {
        setLinkSentTo(trimmed.toLowerCase());
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Could not send download link.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleOAuthAccess = async (provider: "google" | "microsoft") => {
    setErrorMsg("");
    setBusyAction(provider);
    try {
      if (provider === "google") {
        await loginWithGoogle();
      } else {
        await loginWithMicrosoft();
      }

      if (optInNewsletter) {
        const oauthEmail = isMock
          ? (() => {
              try {
                const raw = localStorage.getItem("hems_mock_current_user");
                return raw ? ((JSON.parse(raw) as UserProfile).email || "") : "";
              } catch {
                return "";
              }
            })()
          : auth.currentUser?.email || "";
        const displayParts = (auth.currentUser?.displayName || "").trim().split(/\s+/);
        const firstName = displayParts[0] || "";
        const lastName = displayParts.slice(1).join(" ");

        if (oauthEmail) {
          const res = await submitPublicMailingSignup({
            email: oauthEmail,
            firstName,
            lastName,
            interests: ["workshop", "student_awards"],
            sourceLabel: `DownloadGate ${provider === "google" ? "Google" : "Microsoft"}`,
          }).catch(() => null);
          if (res?.ok) {
            setNewsletterSubscribedNote(res.message);
          }
        }
      }

      const targetUrl = pendingUrl;
      setShowModal(false);
      setShowVerifyModal(false);
      setPendingUrl(null);
      if (targetUrl) {
        setUnlockedPdfUrl(targetUrl);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Sign-in could not be completed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCrossDeviceConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmLinkEmail.trim()) return;
    setBusyAction("confirm");
    try {
      await completeEmailLinkSignIn(confirmLinkEmail.trim());
    } finally {
      setBusyAction(null);
    }
  };

  const closeReadyPdfModal = () => {
    setUnlockedPdfUrl(null);
    clearReadyDownloadUrl();
  };

  return (
    <div onClickCapture={handleIntercept}>
      {children}

      {/* Tier 1: Zero-Password Instant Proceedings Access Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white border border-slate-200 p-5 sm:p-7 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setPendingUrl(null);
                setErrorMsg("");
                setLinkSentTo(null);
              }}
              aria-label="Close download dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Lock size={20} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                Instant Proceedings Access
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                No password required. Verify your email once to open HEMS archival slides &amp; abstracts and stay signed in on this browser.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {linkSentTo ? (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                <h4 className="font-serif text-lg font-bold text-slate-900">
                  Check Your Inbox
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  We sent a 1-click download &amp; sign-in link to{" "}
                  <span className="font-semibold text-slate-900 break-all">{linkSentTo}</span>.
                  Click that link to open{" "}
                  <span className="font-medium text-slate-900">
                    {pendingUrl ? extractReadableFileName(pendingUrl) : "your PDF"}
                  </span>{" "}
                  immediately.
                </p>
                {newsletterSubscribedNote && (
                  <p className="text-[11px] font-medium text-emerald-800 bg-white/80 border border-emerald-200 rounded-lg px-3 py-2">
                    {newsletterSubscribedNote}
                  </p>
                )}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busyAction === "link"}
                    onClick={(e) => {
                      void handleSendDownloadLink(e as unknown as React.FormEvent);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === "link" ? "Resending..." : "Resend Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkSentTo(null);
                      setErrorMsg("");
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-primary py-1 cursor-pointer"
                  >
                    Use a different email or Google / Microsoft
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => void handleOAuthAccess("google")}
                    className="w-full py-2.5 px-4 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold text-slate-800 flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {busyAction === "google" ? "Connecting to Google..." : "Continue with Google"}
                  </button>

                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => void handleOAuthAccess("microsoft")}
                    className="w-full py-2.5 px-4 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold text-slate-800 flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <svg viewBox="0 0 21 21" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0h10v10H0z" fill="#f25022" />
                      <path d="M11 0h10v10H11z" fill="#7fba00" />
                      <path d="M0 11h10v10H0z" fill="#00a4ef" />
                      <path d="M11 11h10v10H11z" fill="#ffb900" />
                    </svg>
                    {busyAction === "microsoft" ? "Connecting to Microsoft..." : "Continue with Microsoft"}
                  </button>
                </div>

                <div className="my-5 flex items-center gap-3">
                  <span className="flex-1 border-b border-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    or email a 1-click link
                  </span>
                  <span className="flex-1 border-b border-slate-200" />
                </div>

                <form onSubmit={handleSendDownloadLink} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="researcher@institution.edu"
                        className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:border-primary focus:outline-none transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busyAction !== null}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === "link" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending Link...
                      </>
                    ) : (
                      <>
                        Email Me an Instant Download Link <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                {/* Voluntary Double-Opt-In Newsletter Checkbox (Unchecked by Default) */}
                <label className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/85 cursor-pointer hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={optInNewsletter}
                    onChange={(e) => setOptInNewsletter(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0 cursor-pointer"
                  />
                  <span className="text-[11.5px] text-slate-600 leading-snug">
                    <strong className="font-semibold text-slate-800">
                      Also send me biennial HEMS Workshop updates
                    </strong>{" "}
                    — Call for Papers, venue opening &amp; Student Travel Awards (low-volume, 1-click unsubscribe).
                  </span>
                </label>

                <div className="mt-5 pt-3.5 border-t border-slate-100 text-center text-xs text-slate-500">
                  Already use a portal password?{" "}
                  <Link
                    href="/auth"
                    data-skip-gate="true"
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in via HEMS Portal
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Email-Link Callback Progress / Cross-Device Confirmation / Error Modal */}
      {(completingEmailLink || pendingEmailLinkPrompt || Boolean(emailLinkError)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl max-w-md w-full shadow-2xl relative">
            {!completingEmailLink && (
              <button
                type="button"
                onClick={clearEmailLinkPrompt}
                aria-label="Close verification prompt"
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}

            {completingEmailLink ? (
              <div className="text-center py-6 space-y-3">
                <Loader2 size={32} className="mx-auto text-primary animate-spin" />
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Verifying Your Download Link...
                </h3>
                <p className="text-xs text-slate-600">
                  One moment while we confirm your email and prepare your proceedings PDF.
                </p>
              </div>
            ) : pendingEmailLinkPrompt ? (
              <form onSubmit={handleCrossDeviceConfirm} className="space-y-4">
                <div className="text-center">
                  <Mail size={28} className="mx-auto text-primary mb-2" />
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    Confirm Your Email Address
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    You opened this link in a new browser or device. Re-enter the email address where you requested the link to finish signing in.
                  </p>
                </div>
                {emailLinkError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                    {emailLinkError}
                  </div>
                )}
                <input
                  type="email"
                  value={confirmLinkEmail}
                  onChange={(e) => setConfirmLinkEmail(e.target.value)}
                  placeholder="researcher@institution.edu"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:border-primary focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={busyAction === "confirm"}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busyAction === "confirm" ? "Verifying..." : "Confirm & Unlock PDF"}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Sign-In Link Expired
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{emailLinkError}</p>
                <button
                  type="button"
                  onClick={() => {
                    clearEmailLinkPrompt();
                    setShowModal(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Request a Fresh Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup-Safe Ready-to-Open PDF Modal (after OAuth or returning from 1-Click Email Link) */}
      {activeReadyPdfUrl && user && (isMock || emailVerified) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-emerald-200 p-6 sm:p-7 rounded-2xl max-w-md w-full shadow-2xl relative text-center space-y-4">
            <button
              type="button"
              onClick={closeReadyPdfModal}
              aria-label="Close ready dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <CheckCircle2 size={38} className="mx-auto text-emerald-600" />
            <div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Proceedings Ready
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Signed in as <span className="font-semibold text-slate-900">{user.email}</span>.
                 Future downloads on this browser will open in a single click.
              </p>
            </div>

            <a
              href={activeReadyPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Allow handleIntercept capture phase to log telemetry & enforce quota, then dismiss modal
                window.setTimeout(closeReadyPdfModal, 50);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-5 rounded-xl font-bold text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              Open {extractReadableFileName(activeReadyPdfUrl)} <ExternalLink size={15} />
            </a>

            {newsletterSubscribedNote ? (
              <p className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {newsletterSubscribedNote}
              </p>
            ) : (
              <button
                type="button"
                disabled={readySubscribeBusy}
                onClick={async () => {
                  setReadySubscribeBusy(true);
                  try {
                    const nameParts = (user.name || "").trim().split(/\s+/);
                    const res = await submitPublicMailingSignup({
                      email: user.email,
                      firstName: nameParts[0] || "",
                      lastName: nameParts.slice(1).join(" "),
                      interests: ["workshop", "student_awards"],
                      sourceLabel: "DownloadGate Ready Card",
                    });
                    setNewsletterSubscribedNote(res.message);
                  } catch (err: unknown) {
                    setNewsletterSubscribedNote(
                      err instanceof Error
                        ? err.message
                        : "Unable to send confirmation link right now."
                    );
                  } finally {
                    setReadySubscribeBusy(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                {readySubscribeBusy
                  ? "Sending confirmation..."
                  : "+ Also notify me about HEMS Call for Papers & Student Travel Awards"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Verification Required Modal (for users currently logged into an unverified manual password session) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white border border-amber-200 p-5 sm:p-7 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowVerifyModal(false);
                setPendingUrl(null);
                setVerifSent(false);
                setVerifError("");
              }}
              aria-label="Close verification dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <Mail size={22} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                Verify Your Email
              </h3>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Click the verification link sent to{" "}
                <span className="font-semibold text-slate-900 break-all">{user?.email}</span>{" "}
                to unlock proceedings downloads and any pre-assigned HEMS roles.
              </p>
            </div>

            {verifError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 text-center">
                {verifError}
              </div>
            )}

            {verifSent && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl mb-4 text-center font-medium">
                Verification email resent — please check your inbox (and Spam/Junk folder).
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={verifBusy}
                onClick={async () => {
                  setVerifError("");
                  setVerifBusy(true);
                  try {
                    const verifiedNow = isMock || (await reloadUser());
                    if (verifiedNow) {
                      const targetUrl = pendingUrl;
                      setShowVerifyModal(false);
                      setPendingUrl(null);
                      if (targetUrl) {
                        setUnlockedPdfUrl(targetUrl);
                      }
                    } else {
                      setVerifError(
                        "Your email is not marked verified yet. Please click the verification link in your inbox first, then try again."
                      );
                    }
                  } catch (err: unknown) {
                    setVerifError(
                      err instanceof Error
                        ? err.message
                        : "Failed to refresh verification status."
                    );
                  } finally {
                    setVerifBusy(false);
                  }
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {verifBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} /> I&apos;ve Clicked the Link — Unlock Download
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setVerifSent(false);
                  setVerifError("");
                  try {
                    await sendVerificationEmail();
                    setVerifSent(true);
                  } catch (err: unknown) {
                    setVerifError(
                      err instanceof Error ? err.message : "Failed to resend verification email."
                    );
                  }
                }}
                className="w-full py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold flex justify-center items-center gap-2 cursor-pointer text-slate-700"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Quota Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white border border-red-200 p-5 sm:p-7 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowLimitModal(false);
                setPendingUrl(null);
              }}
              aria-label="Close limit dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <Lock size={42} className="mx-auto mb-3 text-red-500" />
              <h3 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                Daily Limit Reached
              </h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                To protect archival bandwidth, general proceedings downloads are capped at{" "}
                <strong className="text-slate-900">30 files per day</strong>.
              </p>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Please return tomorrow or contact{" "}
                <a
                  href="mailto:webmaster@hems-workshop.org"
                  data-skip-gate="true"
                  className="text-primary font-semibold hover:underline"
                >
                  webmaster@hems-workshop.org
                </a>{" "}
                if you require bulk research access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLimitModal(false);
                setPendingUrl(null);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
