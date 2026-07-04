"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ClipboardCheck, ShieldAlert, Award, FileText, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function ReviewerPage() {
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
  if (!user || (!user.roles?.includes("reviewer") && !user.roles?.includes("admin"))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be logged in as an authenticated **Abstract Reviewer** to view this panel.
        </p>
        <Link href="/auth" className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  // Mock Abstract Submissions for Reviewer
  const submissions = [
    { id: "ABS-2026-001", title: "A Miniature Quadrupole Mass Filter for Ocean Plume Analysis", author: "Dr. Alice Vance", status: "Pending", deadline: "June 30, 2026" },
    { id: "ABS-2026-002", title: "Atmospheric Trapping of VOCs in Polar Regions Using Cylindrical Ion Arrays", author: "Prof. Robert Chen", status: "Reviewed", score: "8.5/10", deadline: "June 30, 2026" },
    { id: "ABS-2026-003", title: "Linearized Time-of-Flight Refinements for Lander Systems", author: "Elena Rostova", status: "Pending", deadline: "July 05, 2026" }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <ClipboardCheck className="text-primary" /> Reviewer Portal
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Grade, comment on, and manage abstract submissions for the upcoming HEMS workshop.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-mono font-bold text-primary self-start md:self-center">
          Reviewer: {user.email}
        </div>
      </div>

      {/* Reviewer statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border border-foreground/10 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl"><FileText size={24} /></div>
          <div>
            <div className="text-2xl font-black text-foreground">3</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Assigned Abstracts</div>
          </div>
        </div>
        <div className="bg-background border border-foreground/10 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-green-500/10 text-green-500 p-3 rounded-xl"><CheckCircle2 size={24} /></div>
          <div>
            <div className="text-2xl font-black text-foreground">1</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Completed Reviews</div>
          </div>
        </div>
        <div className="bg-background border border-foreground/10 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-yellow-500/10 text-yellow-500 p-3 rounded-xl"><Clock size={24} /></div>
          <div>
            <div className="text-2xl font-black text-foreground">2</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Pending Review</div>
          </div>
        </div>
      </div>

      {/* Abstract Table */}
      <div className="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-foreground/10 bg-surface">
          <h3 className="font-bold text-sm text-foreground">Assigned Abstracts Queue</h3>
        </div>
        <div className="divide-y divide-foreground/5">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface/30 transition-all duration-200">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{sub.id}</span>
                  <span className="text-xs font-bold text-foreground/50">Deadline: {sub.deadline}</span>
                </div>
                <h4 className="font-bold text-base text-foreground leading-snug">{sub.title}</h4>
                <p className="text-xs text-foreground/60">Submitted by: {sub.author}</p>
              </div>

              <div className="flex items-center gap-4">
                {sub.status === "Reviewed" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Reviewed</span>
                    <span className="text-sm font-mono font-bold text-foreground bg-foreground/5 px-2.5 py-1 rounded-full">{sub.score}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Pending</span>
                )}
                
                <button 
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    sub.status === "Reviewed" 
                      ? "bg-surface border border-foreground/15 text-foreground hover:bg-foreground/5" 
                      : "bg-primary text-primary-foreground hover:bg-primary/95"
                  }`}
                >
                  {sub.status === "Reviewed" ? "Edit Review" : "Start Evaluation"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
