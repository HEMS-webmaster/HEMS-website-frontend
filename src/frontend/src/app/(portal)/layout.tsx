"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Award, CreditCard, Hotel, Building2, ShieldCheck, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isMock, setMockRoles } = useAuth();

  const portalLinks = [
    { name: "Overview", path: "/layout-portal", icon: LayoutDashboard, requiredRole: null },
    { name: "Call for Papers", path: "/call-for-papers", icon: FileText, requiredRole: null },
    { name: "Student Awards", path: "/student-awards", icon: Award, requiredRole: null },
    { name: "Registration", path: "/registration", icon: CreditCard, requiredRole: null },
    { name: "Accommodations", path: "/accommodations", icon: Hotel, requiredRole: null },
    { name: "Corporate Sponsorship", path: "/corporate-sponsorship", icon: Building2, requiredRole: null },
    { name: "Reviewer Panel", path: "/reviewer", icon: ClipboardCheck, requiredRole: "reviewer" },
  ];

  const adminLinks = [
    { name: "Board Panel", path: "/board", icon: Building2, requiredRole: "board" },
    { name: "Admin Panel", path: "/admin", icon: ShieldCheck, requiredRole: "admin" },
  ];

  const hasRole = (role: string | null) => {
    if (!role) return true;
    if (!user) return false;
    // Admins have access to everything that requires a role
    if (user.roles?.includes("admin")) return true;
    return user.roles?.includes(role);
  };

  const renderNavSection = (title: string, links: any[]) => (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4 px-3">{title}</h3>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
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
          } else {
            // Unauthorized (greyed out and unclickable)
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
          }
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex flex-col flex-grow bg-surface border-t border-foreground/5">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row flex-grow">
        
        {/* Left Sidebar Nav */}
        <aside className="w-full md:w-64 bg-background border-r border-foreground/10 flex-shrink-0 py-8 px-4 hidden md:flex flex-col justify-between">
          <div className="sticky top-8">
            {renderNavSection("Workshop Portal", portalLinks)}
            {(hasRole("admin") || hasRole("board")) && renderNavSection("Administration", adminLinks)}
          </div>

          {/* Dev Mode Role Switcher */}
          {isMock && user && (
            <div className="mt-8 pt-6 border-t border-foreground/10 bg-primary/5 p-4 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">Dev Role Switcher</p>
              <select 
                value={user.roles?.[0] || 'general'}
                onChange={(e) => setMockRoles([e.target.value])}
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

        {/* Main Content Area */}
        <main className="flex-grow p-6 md:p-12 bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
