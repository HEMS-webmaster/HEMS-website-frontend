"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hasBoardRole, hasOperationsRole } from "@/utils/telemetryClient";
import MarketingPlaybookContent from "@/components/operations/MarketingPlaybookContent";

export default function OperationsMarketingPlaybookPage() {
  const { user, loading } = useAuth();
  const isAuthorized = Boolean(user && hasOperationsRole(user.roles));
  const canViewBoardAnalytics = Boolean(user && hasBoardRole(user.roles));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-4">
          Verifying Operations Officer credentials...
        </p>
      </div>
    );
  }

  if (!isAuthorized || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-red-200 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={44} />
        <h2 className="font-serif text-2xl font-semibold text-slate-900">
          Operations Access Required
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Sign in with an authorized HEMS{" "}
          <strong className="font-semibold text-slate-900">
            Operations Officer (&lsquo;operations&rsquo;)
          </strong>{" "}
          account to access the 16th Workshop Marketing &amp; Advertising Playbook.
        </p>
        {!user ? (
          <Link
            href="/auth"
            className="mt-6 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Committee Sign In
          </Link>
        ) : (
          <Link
            href="/layout-portal"
            className="mt-6 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Return to Workshop Overview
          </Link>
        )}
      </div>
    );
  }

  return (
    <MarketingPlaybookContent canViewBoardAnalytics={canViewBoardAnalytics} />
  );
}
