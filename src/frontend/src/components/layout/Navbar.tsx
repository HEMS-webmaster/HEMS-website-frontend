"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, User, Menu, X, ChevronDown } from "lucide-react";
import workshopsData from "@/data/master_workshops.json";
import { useAuth } from "@/context/AuthContext";
import {
  hasAdminRole,
  hasBoardOrAdminRole,
  hasReviewerRole,
} from "@/utils/telemetryClient";

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
];

const WORKSHOP_PORTAL_SUBLINKS = [
  { href: "/layout-portal", label: "Overview" },
  { href: "/call-for-papers", label: "Call for Papers" },
  { href: "/registration", label: "Registration" },
  { href: "/accommodations", label: "Accommodations" },
  { href: "/corporate-sponsorship", label: "Corporate Sponsorship" },
  { href: "/student-awards", label: "Student Travel Awards" },
];

function supportsHoverPointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export default function Navbar() {
  const pathname = usePathname() || "/";
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [mobileWorkshopOpen, setMobileWorkshopOpen] = useState<boolean>(false);
  const [mobileArchivesOpen, setMobileArchivesOpen] = useState<boolean>(false);
  const [archivesOpen, setArchivesOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  const archivesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const userRoles = user?.roles && user.roles.length > 0 ? user.roles : ["general"];

  const normalizePath = (p: string) => p.replace(/\/+$/, "") || "/";
  const cleanPathname = normalizePath(pathname);

  const isWorkshopRoute =
    cleanPathname.startsWith("/layout-portal") ||
    cleanPathname.startsWith("/call-for-papers") ||
    cleanPathname.startsWith("/registration") ||
    cleanPathname.startsWith("/accommodations") ||
    cleanPathname.startsWith("/corporate-sponsorship") ||
    cleanPathname.startsWith("/student-awards") ||
    cleanPathname.startsWith("/formatting-guidelines");

  const isActive = (href: string): boolean => {
    if (href === "/") return cleanPathname === "/";
    if (href === "/layout-portal") return isWorkshopRoute;
    return cleanPathname.startsWith(href);
  };

  const isArchiveActive = cleanPathname.startsWith("/archive");

  // Close menus automatically on route change
  useEffect(() => {
    setMobileOpen(false);
    setArchivesOpen(false);
    setProfileOpen(false);
    setMobileWorkshopOpen(isWorkshopRoute);
    setMobileArchivesOpen(isArchiveActive);
  }, [cleanPathname, isWorkshopRoute, isArchiveActive]);

  // Dismiss desktop/tablet popovers on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (archivesRef.current && !archivesRef.current.contains(target)) {
        setArchivesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setArchivesOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/92 backdrop-blur-md border-b border-slate-200/85 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-2">
          {/* Brand Lockup (Logo box hidden on `/` where the full Society Masthead sits directly below) */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
            {cleanPathname !== "/" && (
              <div className="w-14 h-10 sm:w-[70px] sm:h-12 rounded-lg bg-white border border-slate-200 px-1 py-0.5 flex items-center justify-center shadow-2xs shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Emblem"
                  width={3756}
                  height={2594}
                  decoding="async"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-semibold text-base sm:text-lg leading-none text-slate-900 tracking-tight group-hover:text-primary transition-colors truncate">
                HEMS Society
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 truncate tabular-nums">
                Est. 1999 • 501(c)(3)
              </span>
            </div>
          </Link>

          {/* Desktop & Landscape-Tablet Navigation (1024px+) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 text-sm">
            {PRIMARY_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? "text-primary font-semibold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[17px] h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Archives Dropdown (Hover + Touch/Click Accessible) */}
            <div
              ref={archivesRef}
              className="relative flex items-center"
              onMouseEnter={() => {
                if (supportsHoverPointer()) setArchivesOpen(true);
              }}
              onMouseLeave={() => {
                if (supportsHoverPointer()) setArchivesOpen(false);
              }}
            >
              <div
                className={`relative flex items-center rounded-md transition-colors ${
                  isArchiveActive
                    ? "text-primary font-semibold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                }`}
              >
                <Link href="/archive" className="pl-2 xl:pl-3 pr-1 py-2 whitespace-nowrap">
                  Archives
                </Link>
                <button
                  type="button"
                  onClick={() => setArchivesOpen((prev) => !prev)}
                  aria-label="Toggle workshop archive years menu"
                  aria-expanded={archivesOpen}
                  className="pr-2 xl:pr-2.5 pl-0.5 py-2 cursor-pointer flex items-center justify-center rounded-r-md"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                      archivesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isArchiveActive && (
                  <span className="absolute inset-x-2 -bottom-[17px] h-[2px] bg-primary rounded-full" />
                )}
              </div>

              <div
                className={`absolute top-full right-0 pt-2 w-60 z-50 transition-all duration-150 ${
                  archivesOpen
                    ? "opacity-100 visible pointer-events-auto"
                    : "opacity-0 invisible pointer-events-none"
                }`}
              >
                <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="py-1.5 max-h-[70vh] overflow-y-auto">
                    <Link
                      href="/archive"
                      onClick={() => setArchivesOpen(false)}
                      className="block px-4 py-2.5 text-xs font-semibold tracking-wide text-primary border-b border-slate-100 hover:bg-slate-50 tabular-nums"
                    >
                      All Proceedings (1999–2025) →
                    </Link>
                    {SORTED_WORKSHOPS.map((ws) => (
                      <Link
                        key={ws.number}
                        href={`/archive/${ws.year}`}
                        onClick={() => setArchivesOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                      >
                        <span className="font-medium">{getOrdinal(ws.number)} Workshop</span>
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">{ws.year}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className={`ml-1.5 xl:ml-2 px-3.5 xl:px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                cleanPathname.startsWith("/contact")
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-900 text-white hover:bg-primary shadow-xs"
              }`}
            >
              Contact
            </Link>

            {/* Persistent Authentication Controls (Sign In when logged out; Role Popover + Sign Out when logged in) */}
            <div className="flex items-center gap-2 ml-1.5 xl:ml-2 border-l border-slate-200 pl-2.5 xl:pl-3">
              {user ? (
                <>
                  <div
                    ref={profileRef}
                    className="relative flex items-center"
                    onMouseEnter={() => {
                      if (supportsHoverPointer()) setProfileOpen(true);
                    }}
                    onMouseLeave={() => {
                      if (supportsHoverPointer()) setProfileOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setProfileOpen((prev) => !prev)}
                      aria-expanded={profileOpen}
                      aria-label="Account roles and officer controls"
                      className="flex items-center gap-1.5 cursor-pointer py-1.5 px-1.5 rounded-md text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="hidden xl:inline max-w-[120px] truncate font-medium border-b border-dotted border-slate-300">
                        {user.name || user.email}
                      </span>
                    </button>

                    <div
                      className={`absolute right-0 top-full pt-2 w-72 z-50 transition-all duration-150 ${
                        profileOpen
                          ? "opacity-100 visible pointer-events-auto"
                          : "opacity-0 invisible pointer-events-none"
                      }`}
                    >
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                          <div className="min-w-0 pr-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
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
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${meta.badgeClass}`}
                                >
                                  {meta.label}
                                </span>
                                <span className="text-[11px] text-slate-600 leading-snug">{meta.desc}</span>
                              </div>
                            );
                          })}
                        </div>

                        {(hasBoardOrAdminRole(user.roles) ||
                          hasReviewerRole(user.roles) ||
                          hasAdminRole(user.roles)) && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5">
                            {hasBoardOrAdminRole(user.roles) && (
                              <>
                                <Link
                                  href="/board/mailing-list"
                                  onClick={() => setProfileOpen(false)}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  Mailing List →
                                </Link>
                                <Link
                                  href="/board/announcements"
                                  onClick={() => setProfileOpen(false)}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  Announcements →
                                </Link>
                                <Link
                                  href="/admin/analytics"
                                  onClick={() => setProfileOpen(false)}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  Analytics →
                                </Link>
                              </>
                            )}
                            {hasReviewerRole(user.roles) && (
                              <Link
                                href="/reviewer"
                                onClick={() => setProfileOpen(false)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Reviewer Panel →
                              </Link>
                            )}
                            {hasAdminRole(user.roles) && (
                              <Link
                                href="/admin"
                                onClick={() => setProfileOpen(false)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Admin →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                    cleanPathname.startsWith("/auth")
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-slate-700 hover:text-primary border-slate-200 hover:border-primary/40 bg-white hover:bg-slate-50"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile & Portrait-Tablet Drawer Button (< 1024px) */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Portrait-Tablet Navigation Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 sm:px-6 pt-3 pb-6 space-y-1.5 shadow-xl max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-4.5rem)] overflow-y-auto">
          {PRIMARY_LINKS.map((item) => {
            const active = isActive(item.href);

            if (item.href === "/layout-portal") {
              return (
                <div key={item.href} className="space-y-1">
                  <div
                    className={`flex items-center justify-between rounded-lg text-sm ${
                      active
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex-grow px-3 py-2.5 min-h-[44px] flex items-center"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileWorkshopOpen((prev) => !prev)}
                      aria-label="Toggle 2027 Workshop sub-pages"
                      aria-expanded={mobileWorkshopOpen}
                      className="px-3 min-h-[44px] flex items-center justify-center text-slate-500 hover:text-primary cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          mobileWorkshopOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {mobileWorkshopOpen && (
                    <div className="ml-3 pl-3 border-l-2 border-slate-200 space-y-1 py-1">
                      {WORKSHOP_PORTAL_SUBLINKS.map((sub) => {
                        const subActive = cleanPathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-xs min-h-[40px] flex items-center ${
                              subActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm min-h-[44px] flex items-center ${
                  active
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Expandable Proceedings Archives Section */}
          <div className="space-y-1">
            <div
              className={`flex items-center justify-between rounded-lg text-sm ${
                isArchiveActive
                  ? "bg-primary/8 text-primary font-semibold"
                  : "text-slate-700 hover:bg-slate-50 font-medium"
              }`}
            >
              <Link
                href="/archive"
                onClick={() => setMobileOpen(false)}
                className="flex-grow px-3 py-2.5 min-h-[44px] flex items-center"
              >
                Proceedings Archives (1999–2025)
              </Link>
              <button
                type="button"
                onClick={() => setMobileArchivesOpen((prev) => !prev)}
                aria-label="Toggle workshop archive years"
                aria-expanded={mobileArchivesOpen}
                className="px-3 min-h-[44px] flex items-center justify-center text-slate-500 hover:text-primary cursor-pointer"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileArchivesOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
            </div>

            {mobileArchivesOpen && (
              <div className="ml-3 pl-3 border-l-2 border-slate-200 py-2 space-y-2">
                <Link
                  href="/archive"
                  onClick={() => setMobileOpen(false)}
                  className="block px-2.5 py-1.5 text-xs font-semibold tracking-wide text-primary hover:underline tabular-nums"
                >
                  Search Full Archive (1999–2025) →
                </Link>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pr-1">
                  {SORTED_WORKSHOPS.map((ws) => {
                    const yearHref = `/archive/${ws.year}`;
                    const yearActive = cleanPathname === yearHref;
                    return (
                      <Link
                        key={ws.number}
                        href={yearHref}
                        onClick={() => setMobileOpen(false)}
                        className={`px-2 py-2 rounded-md border text-center transition-colors ${
                          yearActive
                            ? "bg-primary text-white border-primary font-semibold"
                            : "bg-slate-50/80 border-slate-200 text-slate-700 hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        <span className="block text-xs font-semibold leading-tight tabular-nums">
                          {ws.year}
                        </span>
                        <span
                          className={`block text-[10px] leading-tight mt-0.5 ${
                            yearActive ? "text-white/85" : "text-slate-400"
                          }`}
                        >
                          {getOrdinal(ws.number)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center bg-slate-900 text-white hover:bg-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Contact &amp; Inquiries
            </Link>
          </div>

          {/* Persistent Authentication Controls inside Mobile/Tablet Drawer */}
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
            {user ? (
              <>
                <div className="flex items-center justify-between gap-3 px-2">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Signed In
                    </span>
                    <span className="block text-xs font-semibold text-slate-900 truncate">
                      {user.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="px-3 py-2 min-h-[38px] rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                {(hasBoardOrAdminRole(user.roles) ||
                  hasReviewerRole(user.roles) ||
                  hasAdminRole(user.roles)) && (
                  <div className="flex flex-wrap gap-2 px-2">
                    {hasBoardOrAdminRole(user.roles) && (
                      <>
                        <Link
                          href="/board/mailing-list"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          Mailing List
                        </Link>
                        <Link
                          href="/board/announcements"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          Announcements
                        </Link>
                        <Link
                          href="/admin/analytics"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                        >
                          Website Analytics
                        </Link>
                      </>
                    )}
                    {hasReviewerRole(user.roles) && (
                      <Link
                        href="/reviewer"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        Reviewer Panel
                      </Link>
                    )}
                    {hasAdminRole(user.roles) && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                      >
                        Admin
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 hover:border-primary/40 hover:text-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <User className="w-4 h-4 text-primary shrink-0" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
