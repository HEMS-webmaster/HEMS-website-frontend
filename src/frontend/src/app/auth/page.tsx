"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, User, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const { user, login, register, loginWithGoogle, loginWithMicrosoft, loading } = useAuth();
  const router = useRouter();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect them to the portal.
    // However, if we just authenticated and are showing a successMsg, wait for the user to click proceed.
    if (user && !loading && !successMsg) {
      router.push("/layout-portal");
    }
  }, [user, loading, router, successMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      if (isRegistering) {
        if (!name || !email || !password) {
          setErrorMsg("All fields are required.");
          setSubmitting(false);
          return;
        }
        await register(name, email, password);
        setSuccessMsg("Account created! You may now enter the portal.");
      } else {
        if (!email || !password) {
          setErrorMsg("Email and password are required.");
          setSubmitting(false);
          return;
        }
        await login(email, password);
        setSuccessMsg("Signed in successfully! You may now enter the portal.");
      }
      
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-grow items-center justify-center py-24 bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-foreground/50 mt-4 font-bold">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow py-16 px-4 bg-surface/50 relative overflow-hidden items-center justify-center">
      {/* Topographic Background Graphic */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,500 C200,200 400,100 500,500 C600,900 800,800 900,500" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <path d="M100,600 C250,300 450,200 550,600 C650,1000 850,900 900,600" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-secondary opacity-60" />
        </svg>
      </div>

      <div className="max-w-md w-full bg-surface border border-foreground/10 p-8 rounded-2xl shadow-xl relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary transition-all text-xs mb-8 font-bold">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-foreground tracking-tight">HEMS Portal</h2>
          <p className="text-xs text-foreground/60 mt-2 leading-relaxed">
            Access proceedings downloads, submit abstracts, and connect with HEMS.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-foreground/10 mb-6 font-bold text-sm">
          <button 
            onClick={() => {
              setIsRegistering(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 pb-3 text-center border-b-2 transition-all cursor-pointer ${
              !isRegistering 
                ? "border-primary text-primary" 
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button 
            onClick={() => {
              setIsRegistering(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 pb-3 text-center border-b-2 transition-all cursor-pointer ${
              isRegistering 
                ? "border-primary text-primary" 
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-xl mb-4 text-center flex flex-col gap-4">
            <span className="text-green-500 text-sm font-bold animate-pulse">{successMsg}</span>
            <button 
              onClick={() => router.push("/layout-portal")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md cursor-pointer"
            >
              Click to Proceed
            </button>
          </div>
        )}

        <div className={`transition-opacity duration-300 ${submitting && successMsg ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-background border border-foreground/10 pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none transition-all placeholder:text-foreground/30 font-medium"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-background border border-foreground/10 pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none transition-all placeholder:text-foreground/30 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1">Password</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-foreground/10 pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none transition-all placeholder:text-foreground/30 font-medium"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 py-3 rounded-lg font-bold text-sm transition-all shadow-lg cursor-pointer"
          >
            {submitting ? "Signing in..." : (isRegistering ? "Register Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-foreground/10 lg:w-1/4"></span>
          <span className="text-[10px] font-bold text-center text-foreground/50 uppercase tracking-wider">or continue with</span>
          <span className="w-1/5 border-b border-foreground/10 lg:w-1/4"></span>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button 
            onClick={async () => {
              try {
                setSubmitting(true);
                await loginWithGoogle();
                setSuccessMsg("Signed in with Google! You may now enter the portal.");
                setSubmitting(false);
              } catch (err: any) {
                setSubmitting(false);
                setErrorMsg(err.message || "Google sign in failed.");
              }
            }} 
            className="w-full py-2.5 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-all text-sm font-bold flex justify-center items-center gap-3 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <button 
            onClick={async () => {
              try {
                setSubmitting(true);
                await loginWithMicrosoft();
                setSuccessMsg("Signed in with Microsoft! You may now enter the portal.");
                setSubmitting(false);
              } catch (err: any) {
                setSubmitting(false);
                setErrorMsg(err.message || "Microsoft sign in failed.");
              }
            }} 
            className="w-full py-2.5 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-all text-sm font-bold flex justify-center items-center gap-3 cursor-pointer"
          >
            <svg viewBox="0 0 21 21" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z" fill="#f25022"/><path d="M11 0h10v10H11z" fill="#7fba00"/><path d="M0 11h10v10H0z" fill="#00a4ef"/><path d="M11 11h10v10H11z" fill="#ffb900"/></svg>
            Continue with Microsoft
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
