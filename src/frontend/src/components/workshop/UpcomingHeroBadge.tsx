"use client";

import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function UpcomingHeroBadge() {
  const { workshop } = useUpcomingWorkshop();
  const venueSuffix = workshop.venue_confirmed
    ? ` • ${workshop.venue_city_state}`
    : "";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link
        href="/layout-portal"
        className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-800 text-xs font-mono leading-snug shadow-2xs hover:border-primary/50 hover:text-primary transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
        <span className="font-medium">
          {workshop.workshop_ordinal} Biennial Workshop • {workshop.target_window}
          {venueSuffix}
        </span>
        <ArrowUpRight size={13} className="text-slate-400 shrink-0" />
      </Link>

      {workshop.interest_form_url ? (
        <a
          href={workshop.interest_form_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-secondary font-semibold hover:underline"
        >
          Join {workshop.workshop_year} Mailing List <ExternalLink size={12} />
        </a>
      ) : (
        <Link
          href="/archive/2025"
          className="text-xs font-mono text-slate-500 hover:text-primary transition-colors"
        >
          15th Workshop Proceedings (2025) →
        </Link>
      )}
    </div>
  );
}
