"use client";

import Link from "next/link";
import { Calendar, MapPin, GraduationCap, ArrowRight } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function UpcomingWorkshopSpotlight() {
  const { workshop } = useUpcomingWorkshop();

  return (
    <div className="pt-4 border-t border-slate-100 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          Upcoming Symposium Dossier
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {workshop.cycle_stage === "open" ? "Submissions Open" : "Save the Date"}
        </span>
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold text-slate-900 leading-snug">
          {workshop.workshop_ordinal} HEMS Workshop ({workshop.workshop_year})
        </h2>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50/90 border border-slate-100">
          <Calendar size={14} className="text-primary shrink-0 mt-0.5" />
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Schedule
            </dt>
            <dd className="font-medium text-slate-800 mt-0.5">{workshop.target_window}</dd>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50/90 border border-slate-100">
          <MapPin size={14} className="text-secondary shrink-0 mt-0.5" />
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Location
            </dt>
            <dd className="font-medium text-slate-800 mt-0.5">{workshop.venue_city_state}</dd>
          </div>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <Link
          href="/student-awards"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary transition-colors"
        >
          <GraduationCap size={14} className="text-secondary shrink-0" />
          <span>
            Student Travel Grants:{" "}
            <strong className="font-mono text-slate-900">{workshop.student_award_amount}</strong>
          </span>
        </Link>

        <Link
          href="/layout-portal"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <span>Workshop Hub</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

