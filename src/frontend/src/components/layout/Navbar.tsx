"use client";

import Link from "next/link";
import { Activity, Shield, User } from "lucide-react";
import workshopsData from "@/data/master_workshops.json";
import { useAuth } from "@/context/AuthContext";

const ROLE_DEFINITIONS: Record<string, { label: string; desc: string; badgeClass: string }> = {
  admin: {
    label: "Administrator",
    desc: "Full system control & configuration",
    badgeClass: "text-emerald-400 bg-emerald-950/70 border-emerald-800/60"
  },
  board: {
    label: "Executive Board",
    desc: "Governance, executive minutes & voting",
    badgeClass: "text-purple-400 bg-purple-950/70 border-purple-800/60"
  },
  reviewer: {
    label: "Abstract Reviewer",
    desc: "Blind scoring & submission rubric reviews",
    badgeClass: "text-amber-400 bg-amber-950/70 border-amber-800/60"
  },
  submitter: {
    label: "Author / Submitter",
    desc: "Paper & abstract submission privileges",
    badgeClass: "text-sky-400 bg-sky-950/70 border-sky-800/60"
  },
  attendee: {
    label: "Registered Attendee",
    desc: "Registered conference participant",
    badgeClass: "text-teal-400 bg-teal-950/70 border-teal-800/60"
  },
  general: {
    label: "General Member",
    desc: "Public proceeding access & downloads",
    badgeClass: "text-slate-300 bg-slate-800/80 border-slate-700/60"
  }
};

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const userRoles = user?.roles && user.roles.length > 0 ? user.roles : ["general"];

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-primary/30 relative">
      {/* Topographic SVG Graphic - Constrained to prevent bleeding */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 overflow-hidden">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,50 Q250,-20 500,50 T1000,50" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <path d="M0,60 Q250,0 500,60 T1000,60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary opacity-70" />
          <path d="M0,70 Q250,20 500,70 T1000,70" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-secondary opacity-50" />
          <path d="M0,80 Q250,40 500,80 T1000,80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground opacity-30" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-2xl text-foreground tracking-wider flex items-center gap-2">
              HEMS Society
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8 text-sm font-medium">
              <Link href="/" className="text-foreground/90 hover:text-primary transition-colors font-medium bg-transparent px-2 py-1 rounded-md">Home</Link>
              <Link href="/layout-portal" className="text-foreground/90 hover:text-primary transition-colors font-medium bg-transparent px-2 py-1 rounded-md">Portal</Link>
              <Link href="/about" className="text-foreground/90 hover:text-primary transition-colors font-medium bg-transparent px-2 py-1 rounded-md">About Us</Link>
              <div className="relative group">
                <Link href="/archive" className="text-foreground/90 hover:text-primary transition-colors flex items-center gap-1 font-medium bg-transparent px-2 py-1 rounded-md">
                  Archives
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </Link>
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-foreground/10 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-[70vh] overflow-y-auto">
                    <Link href="/archive" className="block px-4 py-2 text-sm font-bold text-primary border-b border-foreground/10 hover:bg-primary/10">Archives Home</Link>
                    {[...workshopsData].sort((a, b) => Number(b.year) - Number(a.year)).map((ws: any, idx: number) => {
                      const getOrdinal = (n: number) => {
                        if (n === 1) return "1st";
                        if (n === 2) return "2nd";
                        if (n === 3) return "3rd";
                        return `${n}th`;
                      };
                      return (
                      <Link 
                        key={idx} 
                        href={`/archive/${ws.year}`} 
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary"
                      >
                        {getOrdinal(ws.number)} Workshop ({ws.year})
                      </Link>
                    )})}
                  </div>
                </div>
              </div>
              <Link href="/contact" className="bg-foreground text-background hover:bg-foreground/80 px-4 py-2 rounded-md font-bold transition-all shadow-md">
                Contact
              </Link>
              
              {!loading && (
                user ? (
                  <div className="flex items-center gap-3 ml-2 border-l border-foreground/10 pl-4">
                    {/* Username with Administrative Levels Hover Popover */}
                    <div className="relative group flex items-center">
                      <div 
                        className="flex items-center gap-1.5 cursor-pointer py-1 text-xs text-foreground/80 hover:text-foreground transition-colors"
                        title={`User: ${user.email}\nAdministrative Levels:\n${userRoles.map(r => `• ${ROLE_DEFINITIONS[r]?.label || r}`).join('\n')}`}
                      >
                        <User className="w-3.5 h-3.5 text-primary/70" />
                        <span className="hidden lg:inline max-w-[150px] truncate font-medium border-b border-dotted border-foreground/30 hover:border-primary transition-colors">
                          {user.name || user.email}
                        </span>
                      </div>

                      {/* Rich Hover Card / Popover */}
                      <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-surface/95 backdrop-blur-xl border border-foreground/15 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-auto">
                        <div className="flex items-center justify-between border-b border-foreground/10 pb-2 mb-2.5">
                          <div className="min-w-0 pr-2">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-foreground/50">Signed In As</p>
                            <p className="text-xs font-bold text-foreground truncate" title={user.email}>
                              {user.email}
                            </p>
                          </div>
                          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold mb-2 flex items-center gap-1">
                            Administrative Levels ({userRoles.length})
                          </p>
                          <div className="space-y-1.5">
                            {userRoles.map((role) => {
                              const meta = ROLE_DEFINITIONS[role] || {
                                label: role,
                                desc: "Custom administrative role",
                                badgeClass: "text-slate-300 bg-slate-800 border-slate-700"
                              };
                              return (
                                <div key={role} className="flex items-start gap-2 p-1.5 rounded-lg bg-foreground/[0.03] border border-foreground/5">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border flex-shrink-0 ${meta.badgeClass}`}>
                                    {meta.label}
                                  </span>
                                  <span className="text-[10px] text-foreground/60 leading-snug">
                                    {meta.desc}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {user.roles?.includes("admin") && (
                          <div className="mt-3 pt-2.5 border-t border-foreground/10 flex items-center justify-between">
                            <Link 
                              href="/admin" 
                              className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1"
                            >
                              Open Admin Portal ↗
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={logout} 
                      className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/auth" 
                    className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ml-2"
                  >
                    Log In
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
