"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function UpcomingHeroBadge(): React.JSX.Element {
  const { workshop } = useUpcomingWorkshop();
  const venueSuffix = workshop.venue_confirmed
    ? ` • ${workshop.venue_city_state}`
    : "";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link
        href="/layout-portal"
        className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium leading-snug shadow-2xs hover:border-primary/50 hover:text-primary transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
        <span className="font-medium">
          {workshop.workshop_ordinal} Biennial Workshop • {workshop.target_window}
          {venueSuffix}
        </span>
        <ArrowUpRight size={13} className="text-slate-400 shrink-0" />
      </Link>

      <Link
        href="/archive/2025"
        className="text-xs font-medium text-slate-500 hover:text-primary transition-colors tabular-nums"
      >
        15th Workshop Proceedings (2025) →
      </Link>
    </div>
  );
}
