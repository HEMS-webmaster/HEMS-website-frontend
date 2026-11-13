"use client";

import Link from "next/link";
import { Calendar, MapPin, GraduationCap, ArrowRight } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function UpcomingWorkshopSpotlight() {
  const { workshop } = useUpcomingWorkshop();

  return (
    <div className="pt-3.5 border-t border-slate-100 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
          <h3 className="font-serif text-base sm:text-[17px] font-semibold text-slate-900 leading-snug">
            {workshop.workshop_ordinal} HEMS Workshop ({workshop.workshop_year})
          </h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
          {workshop.cycle_stage === "open" ? "Submissions Open" : "Save the Date"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={13} className="text-primary shrink-0" />
          <span>{workshop.target_window}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} className="text-secondary shrink-0" />
          <span>{workshop.venue_city_state}</span>
        </span>
        <Link
          href="/student-awards"
          className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
        >
          <GraduationCap size={13} className="text-secondary shrink-0" />
          <span className="tabular-nums">{workshop.student_award_amount} Student Grants</span>
        </Link>
        <Link
          href="/layout-portal"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline sm:ml-auto"
        >
          <span>Workshop Hub</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

