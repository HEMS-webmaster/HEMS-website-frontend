"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Award, CreditCard, Hotel, Building2 } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: "Overview", path: "/layout-portal", icon: LayoutDashboard },
    { name: "Call for Papers", path: "/call-for-papers", icon: FileText },
    { name: "Student Awards", path: "/student-awards", icon: Award },
    { name: "Registration", path: "/registration", icon: CreditCard },
    { name: "Accommodations", path: "/accommodations", icon: Hotel },
    { name: "Corporate Sponsorship", path: "/corporate-sponsorship", icon: Building2 },
  ];

  return (
    <div className="flex flex-col flex-grow bg-surface border-t border-foreground/5">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row flex-grow">
        
        {/* Left Sidebar Nav (Academic Portal Style) */}
        <aside className="w-full md:w-64 bg-background border-r border-foreground/10 flex-shrink-0 py-8 px-6 hidden md:block">
          <div className="space-y-8 sticky top-8">
            <div>
              <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Workshop Portal</h3>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.path;
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
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow p-6 md:p-12 bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
