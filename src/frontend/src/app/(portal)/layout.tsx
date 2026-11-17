"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Hotel,
  Building2,
  GraduationCap,
  ShieldCheck,
  SlidersHorizontal,
  ClipboardCheck,
  BarChart2,
  Users,
  Send,
  Upload,
  TableProperties,
  ClipboardList,
  Landmark,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Mail,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  hasAdminRole,
  hasAttendeeRole,
  hasBoardRole,
  hasOperationsRole,
  hasReviewerRole,
  hasTreasurerRole,
} from "@/utils/telemetryClient";

type PortalRequiredRole =
  | "attendee"
  | "reviewer"
  | "operations"
  | "treasurer"
  | "board"
  | "admin"
  | null;

type CollapsiblePortalKey = "operations" | "treasurer" | "board" | "admin";

const PORTAL_COLLAPSE_STORAGE_KEY = "hems_portal_sidebar_collapsed_v1";

const DEFAULT_COLLAPSED_PORTALS: Record<CollapsiblePortalKey, boolean> = {
  operations: false,
  treasurer: false,
  board: false,
  admin: false,
};

const MOCK_ROLE_PRESETS: readonly { value: string; label: string; shortLabel?: string }[] = [
  { value: "", label: "General User (Automatic)" },
  { value: "attendee", label: "Attendee" },
  { value: "attendee,oral presenter", label: "Attendee + Oral Presenter" },
  { value: "attendee,poster presenter", label: "Attendee + Poster Presenter" },
  { value: "corporate sponsor", label: "Corporate Sponsor" },
  { value: "reviewer", label: "Reviewer Only" },
  { value: "attendee,reviewer", label: "Attendee + Reviewer" },
  { value: "operations", label: "Operations Officer" },
  { value: "treasurer", label: "Society Treasurer" },
  { value: "operations,treasurer", label: "Operations + Treasurer" },
  { value: "board", label: "Board Member" },
  { value: "admin", label: "Admin Only" },
  { value: "board,reviewer", label: "Board + Reviewer" },
  { value: "board,admin", label: "Board + Admin" },
  { value: "board,reviewer,admin", label: "Board + Reviewer + Admin" },
  {
    value: "attendee,reviewer,operations,treasurer,board,admin",
    label: "All Portals (Attendee + Reviewer + Operations + Treasurer + Board + Admin)",
    shortLabel: "All Portals",
  },
];

interface PortalLinkItem {
  name: string;
  shortName?: string;
  path: string;
  aliases?: string[];
  icon: typeof LayoutDashboard;
  requiredRole: PortalRequiredRole;
}

function normalizePath(p: string | null | undefined): string {
  return (p || "/").replace(/\/+$/, "") || "/";
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);
  const { user, isMock, setMockRoles, emailVerified, reloadUser, sendVerificationEmail } = useAuth();
  const [collapsedPortals, setCollapsedPortals] = useState<
    Record<CollapsiblePortalKey, boolean>
  >(DEFAULT_COLLAPSED_PORTALS);
  const [verifRefreshing, setVerifRefreshing] = useState(false);
  const [verifResending, setVerifResending] = useState(false);
  const [verifBannerNote, setVerifBannerNote] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PORTAL_COLLAPSE_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<
        Record<CollapsiblePortalKey, unknown>
      >;
      if (!parsed || typeof parsed !== "object") return;
      setCollapsedPortals({
        operations: parsed.operations === true,
        treasurer: parsed.treasurer === true,
        board: parsed.board === true,
        admin: parsed.admin === true,
      });
    } catch {
      // Ignore malformed localStorage state or restricted storage
    }
  }, []);

  const togglePortalSection = (key: CollapsiblePortalKey) => {
    setCollapsedPortals((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(
          PORTAL_COLLAPSE_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // Ignore storage write failures
      }
      return next;
    });
  };

  const workshopPortalLinks: PortalLinkItem[] = [
    { name: "Overview", path: "/layout-portal", icon: LayoutDashboard, requiredRole: null },
    { name: "Call for Papers", path: "/call-for-papers", icon: FileText, requiredRole: null },
    { name: "Registration", path: "/registration", icon: CreditCard, requiredRole: null },
    { name: "Accommodations", path: "/accommodations", icon: Hotel, requiredRole: null },
    {
      name: "Corporate Sponsorship",
      shortName: "Sponsorship",
      path: "/corporate-sponsorship",
      icon: Building2,
      requiredRole: null,
    },
    {
      name: "Student Travel Awards",
      shortName: "Student Awards",
      path: "/student-awards",
      icon: GraduationCap,
      requiredRole: null,
    },
  ];

  const attendeePortalLinks: PortalLinkItem[] = [
    {
      name: "Abstract Submission",
      shortName: "Submit Abstract",
      path: "/abstract-submission",
      icon: Upload,
      requiredRole: "attendee",
    },
  ];

  const reviewerPortalLinks: PortalLinkItem[] = [
    {
      name: "Reviewer Panel",
      shortName: "Reviewer Panel",
      path: "/reviewer",
      icon: ClipboardCheck,
      requiredRole: "reviewer",
    },
    {
      name: "Abstract Overview",
      shortName: "Abstract Overview",
      path: "/reviewer/overview",
      icon: TableProperties,
      requiredRole: "reviewer",
    },
  ];

  const operationsPortalLinks: PortalLinkItem[] = [
    {
      name: "Registrations Console",
      shortName: "Registrations",
      path: "/operations/registrations",
      aliases: ["/board/registrations"],
      icon: ClipboardList,
      requiredRole: "operations",
    },
    {
      name: "Mailing List",
      shortName: "Mailing List",
      path: "/operations/mailing-list",
      aliases: ["/board/mailing-list"],
      icon: Users,
      requiredRole: "operations",
    },
    {
      name: "Announcements",
      shortName: "Announcements",
      path: "/operations/announcements",
      aliases: ["/board/announcements"],
      icon: Send,
      requiredRole: "operations",
    },
    {
      name: "Marketing Playbook",
      shortName: "Playbook",
      path: "/operations/marketing-playbook",
      icon: Megaphone,
      requiredRole: "operations",
    },
  ];

  const treasurerPortalLinks: PortalLinkItem[] = [
    {
      name: "Finances & Stripe",
      shortName: "Treasurer",
      path: "/treasurer",
      icon: Landmark,
      requiredRole: "treasurer",
    },
  ];

  const boardPortalLinks: PortalLinkItem[] = [
    {
      name: "Board Repository",
      shortName: "Board Docs",
      path: "/board",
      icon: Building2,
      requiredRole: "board",
    },
    {
      name: "Website Analytics",
      shortName: "Analytics",
      path: "/admin/analytics",
      icon: BarChart2,
      requiredRole: "board",
    },
  ];

  const adminPortalLinks: PortalLinkItem[] = [
    {
      name: "Role Whitelist",
      shortName: "Whitelist",
      path: "/admin",
      icon: ShieldCheck,
      requiredRole: "admin",
    },
    {
      name: "Workshop Settings",
      shortName: "Settings",
      path: "/admin/workshop-settings",
      icon: SlidersHorizontal,
      requiredRole: "admin",
    },
  ];

  const hasRole = (role: PortalRequiredRole): boolean => {
    if (!role) return true;
    if (!user) return false;
    if (role === "attendee") return hasAttendeeRole(user.roles);
    if (role === "reviewer") return hasReviewerRole(user.roles);
    if (role === "operations") return hasOperationsRole(user.roles);
    if (role === "treasurer") return hasTreasurerRole(user.roles);
    if (role === "board") return hasBoardRole(user.roles);
    if (role === "admin") return hasAdminRole(user.roles);
    return false;
  };

  const isLinkActive = (link: PortalLinkItem): boolean =>
    currentPath === normalizePath(link.path) ||
    Boolean(link.aliases?.some((alias) => currentPath === normalizePath(alias)));

  const showAttendeePortal = Boolean(user && hasAttendeeRole(user.roles));
  const showReviewerPortal = Boolean(user && hasReviewerRole(user.roles));
  const showOperationsPortal = Boolean(user && hasOperationsRole(user.roles));
  const showTreasurerPortal = Boolean(user && hasTreasurerRole(user.roles));
  const showBoardPortal = Boolean(user && hasBoardRole(user.roles));
  const showAdminPortal = Boolean(user && hasAdminRole(user.roles));

  const nonGeneralRoles = (user?.roles || [])
    .map((r) => String(r || "").trim().toLowerCase())
    .filter((r) => Boolean(r) && r !== "general");
  const normalizedUserSignature = Array.from(new Set(nonGeneralRoles))
    .sort()
    .join(",");
  const matchedPreset = MOCK_ROLE_PRESETS.find((preset) => {
    const presetSignature = Array.from(
      new Set(
        preset.value
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      )
    )
      .sort()
      .join(",");
    return presetSignature === normalizedUserSignature;
  });
  const mockRoleValue = matchedPreset ? matchedPreset.value : nonGeneralRoles.join(",");
  const handleMockRoleSelect = (val: string) => {
    setMockRoles(val.split(",").filter(Boolean));
  };

  const renderNavSection = (
    title: string,
    links: PortalLinkItem[],
    collapsibleKey?: CollapsiblePortalKey
  ) => {
    const visibleLinks = links.filter((link) => hasRole(link.requiredRole));
    if (visibleLinks.length === 0) return null;

    const isCollapsed = collapsibleKey
      ? Boolean(collapsedPortals[collapsibleKey])
      : false;
    const hasActiveChild = visibleLinks.some((link) => isLinkActive(link));

    const navLinksElement = (
      <nav
        id={collapsibleKey ? `portal-nav-${collapsibleKey}` : undefined}
        aria-label={title}
        className="space-y-1"
      >
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link);
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "text-primary font-bold bg-primary/10 border-l-4 border-primary pl-[9px]"
                  : "text-foreground/75 hover:text-primary hover:bg-foreground/5"
              }`}
            >
              <Icon
                size={16}
                className={`shrink-0 ${isActive ? "text-primary" : "text-foreground/50"}`}
              />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    );

    if (!collapsibleKey) {
      return (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3.5 px-3">
            {title}
          </h3>
          {navLinksElement}
        </div>
      );
    }

    return (
      <div className={isCollapsed ? "mb-4" : "mb-8"}>
        <button
          type="button"
          onClick={() => togglePortalSection(collapsibleKey)}
          aria-expanded={!isCollapsed}
          aria-controls={`portal-nav-${collapsibleKey}`}
          aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${title}`}
          className={`w-full flex items-center justify-between gap-2 text-xs font-bold text-foreground/55 hover:text-primary uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer group ${
            isCollapsed ? "mb-0" : "mb-2.5"
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="truncate">{title}</span>
            {isCollapsed && hasActiveChild && (
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
              />
            )}
          </span>
          <span className="w-5 h-5 inline-flex items-center justify-center rounded border border-foreground/15 bg-white/80 text-foreground/60 group-hover:border-primary/40 group-hover:text-primary shrink-0">
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        </button>
        {!isCollapsed && navLinksElement}
      </div>
    );
  };

  const renderMobilePortalGroup = (links: PortalLinkItem[]) => {
    const visibleLinks = links.filter((link) => hasRole(link.requiredRole));
    if (visibleLinks.length === 0) return null;

    return (
      <>
        <span
          aria-hidden="true"
          className="h-5 w-px bg-slate-200 mx-1 shrink-0"
        />
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link);
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border ${
                isActive
                  ? "bg-primary text-white border-primary shadow-2xs"
                  : "bg-slate-50/90 text-slate-700 border-slate-200/90 hover:border-primary/40 hover:text-primary"
              }`}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-primary/80"} />
              <span>{link.shortName || link.name}</span>
            </Link>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col flex-grow bg-surface border-t border-foreground/5 print:bg-white print:border-0 print:block">
      {/* Mobile & Portrait-Tablet Horizontal Portal Sub-Navigation (< 1024px) */}
      <div className="lg:hidden sticky top-16 sm:top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 print:hidden">
        <nav
          aria-label="Workshop portal navigation"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-2.5"
        >
          {workshopPortalLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === normalizePath(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border ${
                  isActive
                    ? "bg-primary text-white border-primary shadow-2xs"
                    : "bg-slate-50/90 text-slate-700 border-slate-200/90 hover:border-primary/40 hover:text-primary"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-primary/80"} />
                <span>{link.shortName || link.name}</span>
              </Link>
            );
          })}

          {showAttendeePortal && renderMobilePortalGroup(attendeePortalLinks)}
          {showReviewerPortal && renderMobilePortalGroup(reviewerPortalLinks)}
          {showOperationsPortal && renderMobilePortalGroup(operationsPortalLinks)}
          {showTreasurerPortal && renderMobilePortalGroup(treasurerPortalLinks)}
          {showBoardPortal && renderMobilePortalGroup(boardPortalLinks)}
          {showAdminPortal && renderMobilePortalGroup(adminPortalLinks)}
        </nav>

        {isMock && user && (
          <div className="px-4 sm:px-6 py-2 bg-primary/5 border-t border-slate-200/70 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Dev Role Switcher
            </span>
            <select
              value={mockRoleValue}
              onChange={(e) => handleMockRoleSelect(e.target.value)}
              aria-label="Dev mode role switcher"
              className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-base sm:text-xs text-slate-800 focus:outline-none focus:border-primary font-medium"
            >
              {MOCK_ROLE_PRESETS.map((preset) => (
                <option key={preset.value || "general"} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div
        className={`${
          currentPath === "/abstract-submission"
            ? "w-full"
            : "max-w-[1400px] mx-auto w-full"
        } flex flex-col lg:flex-row flex-grow min-w-0 print:block print:max-w-none`}
      >
        {/* Desktop & Landscape-Tablet Left Sidebar Nav (1024px+) */}
        <aside className="w-full lg:w-64 bg-background border-r border-foreground/10 flex-shrink-0 py-8 px-4 hidden lg:flex flex-col justify-between print:hidden">
          <div className="sticky top-24">
            <Link
              href="/layout-portal"
              className="flex items-center gap-3 p-3 mb-6 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-primary/40 transition-colors group"
            >
              <img
                src="/hemslogo.jpg"
                alt="HEMS Society Emblem"
                width={3756}
                height={2594}
                decoding="async"
                className="w-16 h-auto object-contain rounded-md mix-blend-multiply shrink-0 block"
              />
              <div className="min-w-0">
                <span className="block font-serif text-sm font-semibold text-primary leading-tight group-hover:underline">
                  HEMS Society
                </span>
                <span className="block text-[11px] font-medium text-slate-500 leading-snug">
                  Workshop Portal
                </span>
              </div>
            </Link>

            {renderNavSection("Workshop Portal", workshopPortalLinks)}
            {showAttendeePortal && renderNavSection("Attendee Portal", attendeePortalLinks)}
            {showReviewerPortal && renderNavSection("Reviewer Portal", reviewerPortalLinks)}
            {showOperationsPortal &&
              renderNavSection("Operations Portal", operationsPortalLinks, "operations")}
            {showTreasurerPortal &&
              renderNavSection("Treasurer Portal", treasurerPortalLinks, "treasurer")}
            {showBoardPortal &&
              renderNavSection("Board Portal", boardPortalLinks, "board")}
            {showAdminPortal &&
              renderNavSection("Admin Portal", adminPortalLinks, "admin")}
          </div>

          {/* Dev Mode Role Switcher */}
          {isMock && user && (
            <div className="mt-8 pt-6 border-t border-foreground/10 bg-primary/5 p-4 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                Dev Role Switcher
              </p>
              <select
                value={mockRoleValue}
                onChange={(e) => handleMockRoleSelect(e.target.value)}
                aria-label="Dev mode role switcher"
                className="w-full bg-background border border-foreground/10 px-2.5 py-1.5 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              >
                {MOCK_ROLE_PRESETS.map((preset) => (
                  <option key={preset.value || "general"} value={preset.value}>
                    {preset.shortLabel || preset.label}
                  </option>
                ))}
              </select>
              <p className="text-[8px] text-foreground/40 mt-1.5 leading-tight">
                Simulate whitelist role combinations locally.
              </p>
            </div>
          )}
        </aside>

        {/* Main Content Area (min-w-0 prevents flex children/tables from blowing out viewport width) */}
        <div
          className={`flex-grow min-w-0 ${
            currentPath === "/abstract-submission"
              ? "p-4 sm:p-6 lg:p-8"
              : "p-4 sm:p-6 lg:p-10 xl:p-12"
          } bg-surface print:p-0 print:bg-white`}
        >
          {user && !emailVerified && !isMock && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5 text-amber-950 shadow-2xs print:hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      Verify your email (<span className="break-all">{user.email}</span>) to unlock assigned HEMS roles
                    </p>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Any roles already assigned to your email address (Attendee, Abstract Reviewer, Operations, Treasurer, Board, or Admin) and proceedings downloads activate automatically once you click the verification link in your inbox.
                    </p>
                    {verifBannerNote && (
                      <p className="text-xs font-semibold text-amber-900 mt-2">
                        {verifBannerNote}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={verifRefreshing}
                    onClick={async () => {
                      setVerifBannerNote("");
                      setVerifRefreshing(true);
                      try {
                        const verifiedNow = await reloadUser();
                        if (!verifiedNow) {
                          setVerifBannerNote(
                            "Still waiting on verification — click the link sent to your inbox (check Spam/Junk), then try again."
                          );
                        }
                      } catch (err: unknown) {
                        setVerifBannerNote(
                          err instanceof Error ? err.message : "Could not refresh verification status."
                        );
                      } finally {
                        setVerifRefreshing(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {verifRefreshing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} /> I&apos;ve Verified — Unlock My Roles
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={verifResending}
                    onClick={async () => {
                      setVerifBannerNote("");
                      setVerifResending(true);
                      try {
                        await sendVerificationEmail();
                        setVerifBannerNote(`Verification email resent to ${user.email}.`);
                      } catch (err: unknown) {
                        setVerifBannerNote(
                          err instanceof Error ? err.message : "Could not resend verification email."
                        );
                      } finally {
                        setVerifResending(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {verifResending ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
