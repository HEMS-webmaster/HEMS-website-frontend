"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function UpcomingHeroBadge() {
  const { workshop } = useUpcomingWorkshop();
  const venueSuffix = workshop.venue_confirmed
    ? ` • ${workshop.venue_city_state}`
    : "";

  return (
    <div className="flex flex-col gap-2 self-start sm:self-auto">
      <Link
        href="/layout-portal"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-mono hover:bg-primary/15 transition-colors w-fit"
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>
          Upcoming: {workshop.workshop_ordinal} HEMS Workshop • {workshop.target_window}
          {venueSuffix}
        </span>
      </Link>
      {workshop.interest_form_url ? (
        <a
          href={workshop.interest_form_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-secondary font-bold hover:underline pl-1"
        >
          Join {workshop.workshop_year} Mailing List <ExternalLink size={12} />
        </a>
      ) : (
        <Link
          href="/archive/2025"
          className="text-xs font-mono text-foreground/60 hover:text-primary transition-colors pl-1"
        >
          Latest Published Proceedings: 15th Workshop (Virginia Beach, 2025) →
        </Link>
      )}
    </div>
  );
}

