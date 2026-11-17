"use client";

import React, { useState, useEffect } from "react";
import { useAuth, getFirebaseAuthErrorCode } from "@/context/AuthContext";
import { ROLE_DISPLAY_META } from "@/utils/whitelistCsv";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AuthMethodTab = "magic_link" | "password";
type PasswordSubMode = "signin" | "register" | "reset";

export default function AuthPage() {
  const {
    user,
    isMock,
    emailVerified,
    login,
    register,
    loginWithGoogle,
    loginWithMicrosoft,
    sendMagicSignInLink,
    completeEmailLinkSignIn,
    sendPasswordReset,
    sendVerificationEmail,
    reloadUser,
    logout,
    loading,
    completingEmailLink,
    pendingEmailLinkPrompt,
    emailLinkError,
    clearEmailLinkPrompt,
    postSignInReturnPath,
    clearPostSignInReturnPath,
  } = useAuth();
  const router = useRouter();

  const [methodTab, setMethodTab] = useState<AuthMethodTab>("magic_link");
  const [passwordMode, setPasswordMode] = useState<PasswordSubMode>("signin");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [infoBanner, setInfoBanner] = useState("");
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Unverified-account screen state
  const [checkingVerif, setCheckingVerif] = useState(false);
  const [verifResent, setVerifResent] = useState(false);
  const [verifFeedback, setVerifFeedback] = useState("");

  const isVerifiedSession = Boolean(user && (isMock || emailVerified));
  const isUnverifiedPasswordSession = Boolean(user && !isMock && !emailVerified);

  // Automatically route verified users into the portal (or their stored return path)
  useEffect(() => {
    if (!loading && isVerifiedSession && !completingEmailLink) {
      const target =
        postSignInReturnPath &&
        postSignInReturnPath.startsWith("/") &&
        !postSignInReturnPath.startsWith("/auth")
          ? postSignInReturnPath
          : "/layout-portal";
      clearPostSignInReturnPath();
      router.push(target);
    }
  }, [
    clearPostSignInReturnPath,
    completingEmailLink,
    isVerifiedSession,
    loading,
    postSignInReturnPath,
    router,
  ]);

  const clearFeedback = () => {
    setErrorMsg("");
    setErrorCode("");
    setInfoBanner("");
  };

  const handleOAuth = async (provider: "google" | "microsoft") => {
    clearFeedback();
    setSubmitting(true);
    try {
      if (provider === "google") {
        await loginWithGoogle();
      } else {
        await loginWithMicrosoft();
      }
    } catch (err: unknown) {
      setErrorCode(getFirebaseAuthErrorCode(err));
      setErrorMsg(err instanceof Error ? err.message : "OAuth sign-in failed.");
      setSubmitting(false);
    }
  };

  const handleMagicLinkSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearFeedback();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await sendMagicSignInLink(trimmedEmail, { returnPath: "/auth/" });
      if (!isMock) {
        setLinkSentTo(trimmedEmail);
      }
    } catch (err: unknown) {
      setErrorCode(getFirebaseAuthErrorCode(err));
      setErrorMsg(err instanceof Error ? err.message : "Could not send sign-in link.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearFeedback();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg("Enter your email address above so we can send a password setup link.");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(trimmedEmail);
      setResetSentTo(trimmedEmail);
      setInfoBanner(
        `Password setup / reset email sent to ${trimmedEmail}. Click the link in your inbox to choose a password, then sign in below.`
      );
      setPasswordMode("signin");
    } catch (err: unknown) {
      setErrorCode(getFirebaseAuthErrorCode(err));
      setErrorMsg(err instanceof Error ? err.message : "Could not send password reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (passwordMode === "reset") {
      await handlePasswordResetSubmit();
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg("Email address and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (passwordMode === "register") {
        await register(name, trimmedEmail, password);
        setPassword("");
      } else {
        await login(trimmedEmail, password);
      }
    } catch (err: unknown) {
      setErrorCode(getFirebaseAuthErrorCode(err));
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrossDeviceConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await completeEmailLinkSignIn(email.trim());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || completingEmailLink) {
    return (
      <div className="flex flex-col flex-grow items-center justify-center py-24 bg-surface">
        <Loader2 size={32} className="text-primary animate-spin" />
        <p className="text-sm text-slate-600 mt-4 font-semibold">
          {completingEmailLink
            ? "Verifying your HEMS sign-in link & loading assigned roles..."
            : "Loading account details..."}
        </p>
      </div>
    );
  }

  // Cross-device email link confirmation view
  if (pendingEmailLinkPrompt) {
    return (
      <div className="flex flex-col flex-grow py-12 sm:py-16 px-4 bg-surface items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-lg space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Mail size={22} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900">
              Confirm Your Email Address
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              You opened this sign-in link on a different device or browser. Enter the email address where you requested the link to verify ownership and activate your HEMS roles.
            </p>
          </div>

          {emailLinkError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              {emailLinkError}
            </div>
          )}

          <form onSubmit={handleCrossDeviceConfirm} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institution.edu"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:border-primary focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Verifying..." : "Complete Sign-In"}
            </button>

            <button
              type="button"
              onClick={clearEmailLinkPrompt}
              className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 cursor-pointer"
            >
              Cancel &amp; choose another sign-in method
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dedicated Verification & Role-Activation View (shown immediately after manual password signup)
  if (isUnverifiedPasswordSession && user) {
    return (
      <div className="flex flex-col flex-grow py-10 sm:py-16 px-4 bg-surface items-center justify-center">
        <div className="max-w-md w-full bg-white border border-amber-200 p-6 sm:p-8 rounded-2xl shadow-lg space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
              Verify Your Email to Activate Roles
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We sent a verification link to{" "}
              <span className="font-semibold text-slate-900 break-all">{user.email}</span>.
              For security, any pre-assigned HEMS roles (Attendee, Abstract Reviewer, Operations, Treasurer, Board, or Admin) and PDF downloads unlock as soon as you click that link.
            </p>
          </div>

          {verifFeedback && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl leading-relaxed text-center">
              {verifFeedback}
            </div>
          )}

          {verifResent && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl text-center font-medium">
              Verification email resent to {user.email}. Please check Inbox and Spam/Junk.
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={checkingVerif}
              onClick={async () => {
                setVerifFeedback("");
                setCheckingVerif(true);
                try {
                  const ok = await reloadUser();
                  if (!ok) {
                    setVerifFeedback(
                      "Your email isn't marked verified yet. Click the verification link in your inbox first, then press this button again."
                    );
                  }
                } catch (err: unknown) {
                  setVerifFeedback(
                    err instanceof Error
                      ? err.message
                      : "Could not check verification status."
                  );
                } finally {
                  setCheckingVerif(false);
                }
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {checkingVerif ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Checking Verification...
                </>
              ) : (
                <>
                  <RefreshCw size={15} /> I&apos;ve Clicked the Link — Unlock My Roles
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                setVerifResent(false);
                setVerifFeedback("");
                try {
                  await sendVerificationEmail();
                  setVerifResent(true);
                } catch (err: unknown) {
                  setVerifFeedback(
                    err instanceof Error ? err.message : "Could not resend verification email."
                  );
                }
              }}
              className="w-full py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Resend Verification Email
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-center">
            <Link
              href="/layout-portal"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center justify-center gap-1"
            >
              Continue to General Portal while unverified <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Sign out or use Google / Microsoft instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Brief transitional card if verified session hasn't finished pushing route yet
  if (isVerifiedSession && user) {
    const activeRoles = (user.roles || []).filter((r) => r !== "general");
    return (
      <div className="flex flex-col flex-grow py-16 px-4 bg-surface items-center justify-center">
        <div className="max-w-md w-full bg-white border border-emerald-200 p-6 sm:p-8 rounded-2xl shadow-lg text-center space-y-4">
          <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Signed In as {user.name || user.email}
          </h1>
          {activeRoles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {activeRoles.map((role) => {
                const meta = ROLE_DISPLAY_META[role];
                return (
                  <span
                    key={role}
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      meta?.badgeClass || "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {meta?.label || role}
                  </span>
                );
              })}
            </div>
          )}
          <Link
            href="/layout-portal"
            className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            Enter HEMS Portal <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const showCredentialRecovery =
    errorCode === "auth/invalid-credential" ||
    errorCode === "auth/wrong-password" ||
    errorCode === "auth/user-not-found" ||
    errorCode === "auth/email-already-in-use";

  return (
    <div className="flex flex-col flex-grow py-10 sm:py-14 px-4 bg-surface relative overflow-hidden items-center justify-center">
      {/* Subtle Topographic Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-15 z-0">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M100,500 C200,200 400,100 500,500 C600,900 800,800 900,500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-primary"
          />
          <path
            d="M100,600 C250,300 450,200 550,600 C650,1000 850,900 900,600"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-secondary opacity-60"
          />
        </svg>
      </div>

      <div className="max-w-md w-full bg-white border border-slate-200/90 p-5 sm:p-8 rounded-2xl shadow-xl relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors text-xs mb-6 font-semibold"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            HEMS Portal
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Sign in with your institutional or registered email. Any pre-assigned workshop roles load automatically once your email is verified.
          </p>
        </div>

        {(errorMsg || emailLinkError) && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl mb-4 space-y-2.5 leading-relaxed">
            <p>{errorMsg || emailLinkError}</p>
            {showCredentialRecovery && email.trim() && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setMethodTab("magic_link");
                    void handleMagicLinkSubmit();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100/60 text-red-900 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Send 1-Click Link to {email.trim()}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handlePasswordResetSubmit()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-100/60 text-red-900 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Set / Reset Password via Email
                </button>
              </div>
            )}
          </div>
        )}

        {infoBanner && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 leading-relaxed">
            {infoBanner}
          </div>
        )}

        {/* Primary 1-Click OAuth Providers */}
        <div className="flex flex-col gap-2.5 mb-5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleOAuth("google")}
            className="w-full py-2.5 px-4 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold text-slate-800 flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleOAuth("microsoft")}
            className="w-full py-2.5 px-4 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold text-slate-800 flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <svg viewBox="0 0 21 21" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h10v10H0z" fill="#f25022" />
              <path d="M11 0h10v10H11z" fill="#7fba00" />
              <path d="M0 11h10v10H0z" fill="#00a4ef" />
              <path d="M11 11h10v10H11z" fill="#ffb900" />
            </svg>
            Continue with Microsoft
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="flex-1 border-b border-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            or sign in via email
          </span>
          <span className="flex-1 border-b border-slate-200" />
        </div>

        {/* Email Method Switcher: 1-Click Link (Default) vs Password */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMethodTab("magic_link");
              clearFeedback();
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              methodTab === "magic_link"
                ? "bg-white text-primary shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={13} /> 1-Click Email Link
          </button>
          <button
            type="button"
            onClick={() => {
              setMethodTab("password");
              setLinkSentTo(null);
              clearFeedback();
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              methodTab === "password"
                ? "bg-white text-primary shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound size={13} /> Password
          </button>
        </div>

        {methodTab === "magic_link" ? (
          linkSentTo ? (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Check Your Inbox
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed">
                We emailed a 1-click sign-in link to{" "}
                <span className="font-semibold text-slate-900 break-all">{linkSentTo}</span>.
                Click that link to verify your email and automatically load your HEMS roles.
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleMagicLinkSubmit()}
                  className="w-full py-2 px-4 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Resending..." : "Resend 1-Click Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkSentTo(null);
                    clearFeedback();
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-primary py-1 cursor-pointer"
                >
                  Use a different email or password instead
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleMagicLinkSubmit(e)} className="space-y-4">
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
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  No password required — ideal if your email was pre-assigned a workshop role or you only need proceedings access.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending Sign-In Link...
                  </>
                ) : (
                  <>
                    Send 1-Click Sign-In Link <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordFormSubmit} className="space-y-4">
            {/* Password Sub-Mode Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode("signin");
                    clearFeedback();
                  }}
                  className={`font-bold cursor-pointer transition-colors ${
                    passwordMode === "signin"
                      ? "text-primary underline underline-offset-8 decoration-2"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode("register");
                    clearFeedback();
                  }}
                  className={`font-bold cursor-pointer transition-colors ${
                    passwordMode === "register"
                      ? "text-primary underline underline-offset-8 decoration-2"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create / Set Password
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPasswordMode("reset");
                  clearFeedback();
                }}
                className={`font-semibold cursor-pointer transition-colors ${
                  passwordMode === "reset"
                    ? "text-primary underline underline-offset-8 decoration-2"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                Forgot / Reset?
              </button>
            </div>

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

            {passwordMode !== "reset" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {passwordMode === "register" ? "Choose Password (6+ characters)" : "Password"}
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={passwordMode === "register" ? 6 : undefined}
                    className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:border-primary focus:outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            {passwordMode === "register" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Display Name
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">Optional</span>
                </div>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Loaded automatically if pre-registered"
                    className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:border-primary focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  Leave blank if your email already has an assigned HEMS role — your official name &amp; roles load once you verify your email.
                </p>
              </div>
            )}

            {passwordMode === "reset" && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl p-3 leading-relaxed">
                We&apos;ll send a password setup / reset link to{" "}
                <strong className="text-slate-800">{email.trim() || "your email"}</strong>. This also works if you previously signed in with Google, Microsoft, or a 1-Click Link and want to add a password.
                {resetSentTo ? ` (Last sent to ${resetSentTo})` : ""}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : passwordMode === "register" ? (
                "Create Password & Send Verification Email"
              ) : passwordMode === "reset" ? (
                "Email Password Setup / Reset Link"
              ) : (
                "Sign In with Password"
              )}
            </button>
          </form>
        )}

        <p className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Trouble signing in? Contact{" "}
          <a
            href="mailto:webmaster@hems-workshop.org"
            className="text-primary font-semibold hover:underline"
          >
            webmaster@hems-workshop.org
          </a>
        </p>
      </div>
    </div>
  );
}
