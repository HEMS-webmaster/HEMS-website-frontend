"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Building2, ShieldAlert, FileText, Download, Lock, Calendar } from "lucide-react";
import Link from "next/link";

export default function BoardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-foreground/50 mt-4">Verifying credentials...</p>
      </div>
    );
  }

  // Access Control check
  if (!user || (!user.roles?.includes("board") && !user.roles?.includes("admin"))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be logged in as an authenticated **HEMS Board Member** to view this panel.
        </p>
        <Link href="/auth" className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  const boardDocs = [
    { title: "HEMS Board Meeting Minutes - October 2025", date: "2025-10-18", size: "142 KB", type: "Minutes" },
    { title: "HEMS Annual Financial Report & Budget Review FY2025", date: "2025-12-10", size: "488 KB", type: "Financials" },
    { title: "Upcoming 16th HEMS Workshop Planning & Venue Agenda", date: "2026-03-05", size: "95 KB", type: "Agenda" }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Building2 className="text-primary" /> Board Member Panel
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Access secure board documents, review workshop budgets, and read meeting minutes.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-mono font-bold text-primary self-start md:self-center">
          Board Member: {user.email}
        </div>
      </div>

      <div className="bg-background border border-foreground/10 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-foreground/10 pb-4">
          <Lock className="text-primary" size={20} />
          <h3 className="font-bold text-lg text-foreground">Secure Board Repository</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {boardDocs.map((doc, idx) => (
            <div key={idx} className="bg-surface border border-foreground/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/45 transition-all">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-lg flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground leading-snug">{doc.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-foreground/50 mt-1 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {doc.date}</span>
                    <span>Size: {doc.size}</span>
                    <span className="bg-foreground/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono">{doc.type}</span>
                  </div>
                </div>
              </div>

              <button className="bg-foreground text-background hover:bg-foreground/80 p-2.5 rounded-lg transition-all shadow cursor-pointer">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
