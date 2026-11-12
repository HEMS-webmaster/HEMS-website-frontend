"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Hotel,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  BarChart2,
  Users,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PortalLinkItem {
  name: string;
  shortName?: string;
  path: string;
  icon: typeof LayoutDashboard;
  requiredRole: string | null;
}

function normalizePath(p: string | null | undefined): string {
  return (p || "/").replace(/\/+$/, "") || "/";
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);
  const { user, isMock, setMockRoles } = useAuth();

  const portalLinks: PortalLinkItem[] = [
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
    { name: "Reviewer Panel", shortName: "Reviewer", path: "/reviewer", icon: ClipboardCheck, requiredRole: "reviewer" },
  ];

  const adminLinks: PortalLinkItem[] = [
    { name: "Board Panel", shortName: "Board", path: "/board", icon: Building2, requiredRole: "board" },
    { name: "Mailing List", shortName: "Mailing List", path: "/board/mailing-list", icon: Users, requiredRole: "board" },
    { name: "Announcements", shortName: "Announce", path: "/board/announcements", icon: Send, requiredRole: "board" },
    {
      name: "Website Analytics",
      shortName: "Analytics",
      path: "/admin/analytics",
      icon: BarChart2,
      requiredRole: "board",
    },
    { name: "Admin Panel", shortName: "Admin", path: "/admin", icon: ShieldCheck, requiredRole: "admin" },
  ];

  const hasRole = (role: string | null) => {
    if (!role) return true;
    if (!user) return false;
    // Admins have access to everything that requires a role
    if (user.roles?.includes("admin")) return true;
    return Boolean(user.roles?.includes(role));
  };

  const mobileAuthorizedLinks = [
    ...portalLinks.filter((link) => hasRole(link.requiredRole)),
    ...(hasRole("admin") || hasRole("board")
      ? adminLinks.filter((link) => hasRole(link.requiredRole))
      : []),
  ];

  const renderNavSection = (title: string, links: PortalLinkItem[]) => (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4 px-3">{title}</h3>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === normalizePath(link.path);
          const authorized = hasRole(link.requiredRole);

          if (authorized) {
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "text-primary font-bold bg-primary/10 border-l-4 border-primary pl-[9px]"
                    : "text-foreground/70 hover:text-primary hover:bg-foreground/5"
                }`}
              >
                <Icon size={16} className={isActive ? "text-primary" : "text-foreground/50"} />
                <span>{link.name}</span>
              </Link>
            );
          }

          return (
            <div
              key={link.path}
              className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg text-foreground/30 cursor-not-allowed"
              title={`Requires ${link.requiredRole} role`}
            >
              <Icon size={16} className="text-foreground/20" />
              <span>{link.name}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex flex-col flex-grow bg-surface border-t border-foreground/5">
      {/* Mobile & Portrait-Tablet Horizontal Portal Sub-Navigation (< 1024px) */}
      <div className="lg:hidden sticky top-16 sm:top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <nav
          aria-label="Workshop portal navigation"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-2.5"
        >
          {mobileAuthorizedLinks.map((link) => {
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
        </nav>

        {isMock && user && (
          <div className="px-4 sm:px-6 py-2 bg-primary/5 border-t border-slate-200/70 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Dev Role Switcher
            </span>
            <select
              value={user.roles?.[0] || "general"}
              onChange={(e) => setMockRoles([e.target.value])}
              aria-label="Dev mode role switcher"
              className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-base sm:text-xs text-slate-800 focus:outline-none focus:border-primary font-medium"
            >
              <option value="general">General User</option>
              <option value="submitter">Submitter</option>
              <option value="attendee">Attendee</option>
              <option value="reviewer">Reviewer</option>
              <option value="board">Board Member</option>
              <option value="admin">Website Admin</option>
            </select>
          </div>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row flex-grow min-w-0">
        {/* Desktop & Landscape-Tablet Left Sidebar Nav (1024px+) */}
        <aside className="w-full lg:w-64 bg-background border-r border-foreground/10 flex-shrink-0 py-8 px-4 hidden lg:flex flex-col justify-between">
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
            {renderNavSection("Workshop Portal", portalLinks)}
            {(hasRole("admin") || hasRole("board")) && renderNavSection("Administration", adminLinks)}
          </div>

          {/* Dev Mode Role Switcher */}
          {isMock && user && (
            <div className="mt-8 pt-6 border-t border-foreground/10 bg-primary/5 p-4 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                Dev Role Switcher
              </p>
              <select
                value={user.roles?.[0] || "general"}
                onChange={(e) => setMockRoles([e.target.value])}
                aria-label="Dev mode role switcher"
                className="w-full bg-background border border-foreground/10 px-2.5 py-1.5 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary font-medium"
              >
                <option value="general">General User</option>
                <option value="submitter">Submitter</option>
                <option value="attendee">Attendee</option>
                <option value="reviewer">Reviewer</option>
                <option value="board">Board Member</option>
                <option value="admin">Website Admin</option>
              </select>
              <p className="text-[8px] text-foreground/40 mt-1.5 leading-tight">
                Simulate role-based authorization rules locally.
              </p>
            </div>
          )}
        </aside>

        {/* Main Content Area (min-w-0 prevents flex children/tables from blowing out viewport width) */}
        <div className="flex-grow min-w-0 p-4 sm:p-6 lg:p-10 xl:p-12 bg-surface">
          {children}
        </div>
      </div>
    </div>
  );
}
