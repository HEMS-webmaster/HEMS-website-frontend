"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Lock, KeyRound, Mail, User } from "lucide-react";

export default function DownloadGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login, register, loginWithGoogle, loginWithMicrosoft, isMock } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const trackDownload = async (url: string) => {
    if (!user) return;
    
    let fileName = "";
    if (url.includes("?file=")) {
      fileName = decodeURIComponent(url.split("?file=")[1].split("&")[0]);
    } else {
      fileName = decodeURIComponent(url.split("/").pop() || "");
    }
    if (!fileName) return;

    let category = "Other";
    let wsName = "Unknown";
    
    if (fileName.toLowerCase().includes("abstract")) {
      category = "Abstract";
    } else if (fileName.toLowerCase().includes("presentation")) {
      category = "Presentation";
    } else if (fileName.toLowerCase().includes("program")) {
      category = "Program";
    } else if (fileName.toLowerCase().includes("participant")) {
      category = "Participant List";
    }
    
    const parts = fileName.split("_");
    if (parts[0] && parts[0].match(/^\d+(st|nd|rd|th)$/i)) {
      wsName = parts[0];
    }

    try {
      if (isMock) {
        const storedUsers = localStorage.getItem("hems_mock_users");
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const updatedUsers = users.map((u: any) => {
            if (u.uid === user.uid) {
              return { 
                ...u, 
                downloadCount: (u.downloadCount || 0) + 1,
                lastDownloaded: new Date().toISOString()
              };
            }
            return u;
          });
          localStorage.setItem("hems_mock_users", JSON.stringify(updatedUsers));
        }
        
        const storedCurrentUser = localStorage.getItem("hems_mock_current_user");
        if (storedCurrentUser) {
          const u = JSON.parse(storedCurrentUser);
          const updated = { 
            ...u, 
            downloadCount: (u.downloadCount || 0) + 1,
            lastDownloaded: new Date().toISOString()
          };
          localStorage.setItem("hems_mock_current_user", JSON.stringify(updated));
        }

        const storedDownloads = localStorage.getItem("hems_mock_downloads") || "[]";
        const downloads = JSON.parse(storedDownloads);
        const existingFile = downloads.find((d: any) => d.fileName === fileName);
        if (existingFile) {
          existingFile.downloadCount += 1;
          existingFile.lastDownloaded = new Date().toISOString();
        } else {
          downloads.push({
            fileName,
            downloadCount: 1,
            lastDownloaded: new Date().toISOString(),
            category,
            workshopName: wsName
          });
        }
        localStorage.setItem("hems_mock_downloads", JSON.stringify(downloads));
      } else {
        const { db } = await import("../utils/firebase");
        const { doc, setDoc, updateDoc, increment } = await import("firebase/firestore");
        
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          downloadCount: increment(1),
          lastDownloaded: new Date().toISOString()
        }).catch(async () => {
          await setDoc(userDocRef, { 
            downloadCount: 1, 
            lastDownloaded: new Date().toISOString()
          }, { merge: true });
        });

        const fileId = fileName.replace(/[^a-zA-Z0-9_\-]/g, "_");
        const fileDocRef = doc(db, "downloads", fileId);
        
        await setDoc(fileDocRef, {
          fileName,
          downloadCount: increment(1),
          lastDownloaded: new Date().toISOString(),
          category,
          workshopName: wsName
        }, { merge: true });
      }
    } catch (err) {
      console.error("Failed to track download:", err);
    }
  };

  const handleIntercept = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    
    if (anchor) {
      const href = anchor.getAttribute("href");
      
      if (href && (href.toLowerCase().endsWith(".pdf") || href.includes("serve?file="))) {
        if (!user) {
          e.preventDefault();
          e.stopPropagation();
          setPendingUrl(href);
          setShowModal(true);
        } else {
          trackDownload(href);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (isRegistering) {
        if (!name || !email || !password) {
          setErrorMsg("All fields are required.");
          return;
        }
        await register(name, email, password);
        setSuccessMsg("Account created! Processing download...");
      } else {
        if (!email || !password) {
          setErrorMsg("Email and password are required.");
          return;
        }
        await login(email, password);
        setSuccessMsg("Signed in successfully! Processing download...");
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please try again.");
    }
  };

  return (
    <div onClickCapture={handleIntercept}>
      {children}

      {/* Auth Gate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all duration-300">
          <div className="bg-surface border border-primary/30 p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setShowModal(false);
                setPendingUrl(null);
                setErrorMsg("");
              }}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground hover:bg-foreground/5 p-2 rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
                <Lock size={24} className="text-primary" /> Sign in to download
              </h3>
            </div>

            {errorMsg && !isSuccess && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 text-center">
                {errorMsg}
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-xl mb-4 text-center flex flex-col gap-4">
                <span className="text-green-500 text-sm font-bold animate-pulse">{successMsg}</span>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    if (pendingUrl) {
                      trackDownload(pendingUrl);
                      window.open(pendingUrl, "_blank");
                      setPendingUrl(null);
                    }
                    setIsSuccess(false);
                    setSuccessMsg("");
                    setEmail("");
                    setName("");
                    setPassword("");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  Click to Proceed
                </button>
              </div>
            )}

            <div className={`transition-opacity duration-300 ${isSuccess ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
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
                      className="w-full bg-background border border-foreground/10 pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none transition-all placeholder:text-foreground/30"
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
                    className="w-full bg-background border border-foreground/10 pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none transition-all placeholder:text-foreground/30"
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
                    className="w-full bg-background border border-foreground/10 pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none transition-all placeholder:text-foreground/30"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/90 py-3 rounded-lg font-bold text-sm transition-all shadow-lg cursor-pointer"
              >
                {isRegistering ? "Create Account & Download" : "Sign In & Download"}
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
                    await loginWithGoogle();
                    setSuccessMsg("Signed in with Google! Ready for download.");
                    setIsSuccess(true);
                  } catch (err: any) {
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
                    await loginWithMicrosoft();
                    setSuccessMsg("Signed in with Microsoft! Ready for download.");
                    setIsSuccess(true);
                  } catch (err: any) {
                    setErrorMsg(err.message || "Microsoft sign in failed.");
                  }
                }} 
                className="w-full py-2.5 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-all text-sm font-bold flex justify-center items-center gap-3 cursor-pointer"
              >
                <svg viewBox="0 0 21 21" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z" fill="#f25022"/><path d="M11 0h10v10H11z" fill="#7fba00"/><path d="M0 11h10v10H0z" fill="#00a4ef"/><path d="M11 11h10v10H11z" fill="#ffb900"/></svg>
                Continue with Microsoft
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-foreground/50 border-t border-foreground/10 pt-4">
              {isRegistering ? (
                <span>
                  Already have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setErrorMsg("");
                    }}
                    className="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account yet?{" "}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setErrorMsg("");
                    }}
                    className="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Create Account
                  </button>
                </span>
              )}
            </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
