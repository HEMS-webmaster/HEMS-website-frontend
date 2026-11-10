"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, User, Menu, X, ChevronDown } from "lucide-react";
import workshopsData from "@/data/master_workshops.json";
import { useAuth } from "@/context/AuthContext";

interface WorkshopNavEntry {
  year: number | string;
  number: number;
}

const ROLE_DEFINITIONS: Record<string, { label: string; desc: string; badgeClass: string }> = {
  admin: {
    label: "Administrator",
    desc: "Full system control & configuration",
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  board: {
    label: "Executive Board",
    desc: "Governance, executive minutes & voting",
    badgeClass: "text-purple-700 bg-purple-50 border-purple-200",
  },
  reviewer: {
    label: "Abstract Reviewer",
    desc: "Blind scoring & submission rubric reviews",
    badgeClass: "text-amber-700 bg-amber-50 border-amber-200",
  },
  submitter: {
    label: "Author / Submitter",
    desc: "Paper & abstract submission privileges",
    badgeClass: "text-sky-700 bg-sky-50 border-sky-200",
  },
  attendee: {
    label: "Registered Attendee",
    desc: "Registered conference participant",
    badgeClass: "text-teal-700 bg-teal-50 border-teal-200",
  },
  general: {
    label: "General Member",
    desc: "Public proceeding access & downloads",
    badgeClass: "text-slate-700 bg-slate-100 border-slate-200",
  },
};

const SORTED_WORKSHOPS: WorkshopNavEntry[] = [...(workshopsData as WorkshopNavEntry[])].sort(
  (a, b) => Number(b.year) - Number(a.year)
);

function getOrdinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/layout-portal", label: "2027 Workshop" },
  { href: "/about", label: "About" },
  { href: "/history", label: "History" },
  { href: "/student-awards", label: "Student Travel Awards" },
];

export default function Navbar() {
  const pathname = usePathname() || "/";
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const userRoles = user?.roles && user.roles.length > 0 ? user.roles : ["general"];

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    if (href === "/layout-portal") {
      return (
        pathname.startsWith("/layout-portal") ||
        pathname.startsWith("/call-for-papers") ||
        pathname.startsWith("/registration") ||
        pathname.startsWith("/accommodations") ||
        pathname.startsWith("/formatting-guidelines")
      );
    }
    return pathname.startsWith(href);
  };

  const isArchiveActive = pathname.startsWith("/archive");

  return (
    <header className="sticky top-0 z-40 w-full bg-white/92 backdrop-blur-md border-b border-slate-200/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Lockup */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
              <img
                src="/hemslogo.jpg"
                alt="HEMS Society Emblem"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-semibold text-lg leading-none text-slate-900 tracking-tight group-hover:text-primary transition-colors">
                HEMS Society
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-slate-500 mt-0.5">
                Est. 1999 • 501(c)(3)
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm">
            {PRIMARY_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2.5 lg:px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? "text-primary font-semibold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2.5 -bottom-[13px] h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Archives Dropdown */}
            <div className="relative group">
              <Link
                href="/archive"
                className={`relative px-2.5 lg:px-3 py-2 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap ${
                  isArchiveActive
                    ? "text-primary font-semibold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                }`}
              >
                <span>Archives</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                {isArchiveActive && (
                  <span className="absolute inset-x-2.5 -bottom-[13px] h-[2px] bg-primary rounded-full" />
                )}
              </Link>

              <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
                <div className="py-1.5 max-h-[70vh] overflow-y-auto">
                  <Link
                    href="/archive"
                    className="block px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-primary border-b border-slate-100 hover:bg-slate-50"
                  >
                    All Proceedings (1999–2025) →
                  </Link>
                  {SORTED_WORKSHOPS.map((ws) => (
                    <Link
                      key={ws.number}
                      href={`/archive/${ws.year}`}
                      className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                    >
                      <span className="font-medium">{getOrdinal(ws.number)} Workshop</span>
                      <span className="font-mono text-[11px] text-slate-400">{ws.year}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className={`ml-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                pathname.startsWith("/contact") || pathname.startsWith("/corporate-sponsorship")
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-900 text-white hover:bg-primary shadow-xs"
              }`}
            >
              Contact
            </Link>

            {/* Authenticated Officer Badge (shown only when signed in; public login lives cleanly in Footer) */}
            {!loading && user && (
              <div className="flex items-center gap-2.5 ml-2 border-l border-slate-200 pl-3">
                <div className="relative group flex items-center">
                  <div className="flex items-center gap-1.5 cursor-pointer py-1 text-xs text-slate-700 hover:text-slate-900 transition-colors">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden xl:inline max-w-[130px] truncate font-medium border-b border-dotted border-slate-300">
                      {user.name || user.email}
                    </span>
                  </div>

                  <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Signed In As
                        </p>
                        <p className="text-xs font-semibold text-slate-900 truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {userRoles.map((role) => {
                        const meta = ROLE_DEFINITIONS[role] || {
                          label: role,
                          desc: "Administrative role",
                          badgeClass: "text-slate-700 bg-slate-100 border-slate-200",
                        };
                        return (
                          <div
                            key={role}
                            className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold font-mono border shrink-0 ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-slate-600 leading-snug">{meta.desc}</span>
                          </div>
                        );
                      })}
                    </div>

                    {user.roles?.includes("admin") && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <Link
                          href="/admin"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Open Admin Portal →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Drawer Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-lg">
          {PRIMARY_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm ${
                  active
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/archive"
            onClick={() => setMobileOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm ${
              isArchiveActive
                ? "bg-primary/8 text-primary font-semibold"
                : "text-slate-700 hover:bg-slate-50 font-medium"
            }`}
          >
            Proceedings Archives (1999–2025)
          </Link>
          <div className="pt-2">
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center bg-slate-900 text-white hover:bg-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Contact &amp; Inquiries
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
