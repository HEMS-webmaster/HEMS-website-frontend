"use client";

import Link from "next/link";
import {
  MapPin,
  Hotel,
  Calendar,
  ExternalLink,
  Clock,
  Info,
  History,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { galleryImageUrl } from "@/utils/galleryAssets";

export default function AccommodationsClient() {
  const { workshop } = useUpcomingWorkshop();
  const canBookNow = workshop.venue_confirmed && Boolean(workshop.hotel_booking_url);

  const previousVenuesCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <figure className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
        <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-100 aspect-[16/9]">
          <img
            src={galleryImageUrl("virginia-beach-oceanfront-sunny.jpg")}
            alt="Sunny oceanfront boardwalk, sandy beach, and Atlantic pier in Virginia Beach, Virginia (2025 host city)"
            width={1600}
            height={900}
            decoding="async"
            className="w-full h-full object-cover block"
            loading="lazy"
          />
        </div>
        <figcaption className="pt-2.5 px-1 text-xs text-slate-600 leading-relaxed">
          <strong className="tabular-nums text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
            Past Venue Example • 15th HEMS Workshop (2025)
          </strong>
          Virginia Beach Oceanfront and Atlantic boardwalk, site of the 15th HEMS Workshop hosted at the Sheraton Virginia Beach Oceanfront Hotel (Sept 15–18, 2025).{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:The_boardwalk_in_Virginia_Beach,_VA.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-slate-600 underline decoration-slate-300"
          >
            Photo: B. Emmerling (CC BY-SA 4.0)
          </a>
        </figcaption>
      </figure>

      <figure className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
        <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-100 aspect-[16/9]">
          <img
            src={galleryImageUrl("st-pete-beach-don-cesar-sunny.jpg")}
            alt="The historic pink Don CeSar resort overlooking coastal palms and blue water in St. Pete Beach, Florida (2011 and 2013 host property)"
            width={1600}
            height={900}
            decoding="async"
            className="w-full h-full object-cover block"
            loading="lazy"
          />
        </div>
        <figcaption className="pt-2.5 px-1 text-xs text-slate-600 leading-relaxed">
          <strong className="tabular-nums text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
            Past Venue Example • 8th &amp; 9th HEMS Workshops (2011 &amp; 2013)
          </strong>
          Historic Gulf Coast conference resort (The Don CeSar) in St. Pete Beach, Florida, which hosted consecutive biennial HEMS Workshops in 2011 and 2013.{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Don_CeSar,_St._Pete_Beach,_FL.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-slate-600 underline decoration-slate-300"
          >
            Photo: Elisa.rolle, cropped (CC BY-SA 4.0)
          </a>
        </figcaption>
      </figure>
    </div>
  );

  return (
    <>
      {/* Page Header */}
      <header className="mb-7 sm:mb-10 border-b border-slate-200 pb-6 sm:pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium leading-snug mb-4 shadow-2xs tabular-nums">
            <Hotel size={14} className="text-primary shrink-0" /> Symposium Lodging • {workshop.workshop_ordinal} HEMS Workshop
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            Venue &amp; Coastal Accommodations
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
            {workshop.venue_confirmed
              ? `Host hotel and group room-block details for the ${workshop.workshop_ordinal} HEMS Workshop at ${workshop.hotel_name} (${workshop.venue_city_state}).`
              : `Host venue and beachfront room-block information for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}).`}
          </p>
        </div>
        <div className="hidden md:flex flex-col items-center p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-center shrink-0">
          <img
            src="/hemslogo.jpg"
            alt="Harsh-Environment Mass Spectrometry Society Emblem"
            width={3756}
            height={2594}
            decoding="async"
            className="w-24 sm:w-28 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-0.5 block"
          />
        </div>
      </header>

      {/* Upcoming Workshop Venue & Room Block (Primary Above-the-Fold Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hotel Summary & Info */}
          <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs">
            <h2 className="font-serif text-xl font-semibold text-slate-900 mb-3">
              {workshop.workshop_ordinal} Workshop Host Venue ({workshop.workshop_year})
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              {workshop.venue_confirmed
                ? `The ${workshop.workshop_ordinal} HEMS Workshop is hosted at ${workshop.hotel_name} in ${workshop.venue_city_state}, providing direct access to all technical sessions, hardware exhibits, poster receptions, and informal coastal discussion.`
                : `In keeping with HEMS tradition since 1999, the Organizing Committee selects coastal and beachfront conference hotels conducive to open scientific exchange. Host hotel selection for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}) is currently underway and will be posted here once finalized.`}
            </p>

            <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <MapPin className="text-primary w-7 h-7 shrink-0" />
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                  {workshop.venue_confirmed ? "Confirmed Host Hotel" : `Upcoming ${workshop.workshop_year} Host Venue`}
                </span>
                <span className="font-semibold text-slate-900 text-sm block">
                  {workshop.hotel_name}
                </span>
                <p className="text-xs text-slate-600 mt-0.5">{workshop.hotel_address}</p>
                {workshop.venue_confirmed && workshop.hotel_maps_url && (
                  <a
                    href={workshop.hotel_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-semibold text-xs hover:underline mt-1.5"
                  >
                    Open in Google Maps <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Group Room Block */}
          <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Hotel className="text-primary" size={19} /> HEMS Group Room Block
            </h2>

            {workshop.venue_confirmed ? (
              <>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Each biennial HEMS Workshop secures a discounted group room block for symposium attendees and students.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div className="border border-slate-200/90 p-4 rounded-xl bg-slate-50/60">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                      HEMS Group Rate
                    </span>
                    <span className="text-2xl tabular-nums font-bold text-primary">
                      {workshop.hotel_group_rate}
                    </span>
                    {workshop.hotel_group_rate !== "TBA" && (
                      <span className="text-xs text-slate-500 ml-1">USD / night</span>
                    )}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Plus applicable state and local lodging taxes. Subject to group block availability.
                    </p>
                  </div>

                  <div className="border border-slate-200/90 p-4 rounded-xl bg-slate-50/60">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                      Availability Window
                    </span>
                    <span className="font-semibold text-slate-900 text-sm block mt-1 tabular-nums">
                      {workshop.hotel_discount_window}
                    </span>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Group rates traditionally extend several days before and after core workshop sessions.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                Each biennial HEMS Workshop negotiates a discounted group room block for symposium attendees and students, traditionally extending several days before and after core sessions. The negotiated nightly rate and reservation cutoff date will be published once the {workshop.workshop_year} room block opens (for budget planning reference, the previous 15th Workshop group rate in 2025 was <span className="font-medium text-slate-800 tabular-nums">$124/night</span>).
              </p>
            )}
          </section>

          {/* General Lodging Notes */}
          <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="font-serif text-xl font-semibold text-slate-900">
              General Lodging Format
            </h2>
            <div className="space-y-3.5">
              <div className="flex gap-3 items-start text-slate-600">
                <Info className="text-primary shrink-0 mt-0.5" size={16} />
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="font-semibold text-slate-800">All-Under-One-Roof Format:</strong> Technical sessions, hardware exhibits, and evening poster receptions are held inside the host conference hotel to encourage informal discussion across academic, government, and industry groups.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {workshop.venue_confirmed ? (
            <>
              <div className="bg-white border border-slate-200/95 p-6 rounded-2xl shadow-2xs">
                <h3 className="font-bold uppercase tracking-wider text-xs mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2 text-slate-900">
                  <Calendar size={16} className="text-primary" /> Key Dates
                </h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Workshop Schedule
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">{workshop.exact_dates}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Group Rate Window
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">{workshop.hotel_discount_window}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/95 p-6 rounded-2xl shadow-2xs">
                <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider mb-3 text-secondary border-b border-slate-100 pb-2.5">
                  <Clock size={16} /> Room Block Cutoff
                </h3>
                <div className="text-xl tabular-nums font-bold text-slate-900 mb-1.5">
                  {workshop.hotel_booking_cutoff}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Reservations must be completed prior to the group cutoff date to receive the negotiated HEMS conference rate.
                </p>
              </div>

              <div className="bg-primary text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">
                    Reserve Group Rate
                  </h3>
                  <p className="text-xs opacity-90 mb-5 leading-relaxed">
                    Use the direct reservation link below with the HEMS group rate pre-applied.
                  </p>
                </div>
                {canBookNow ? (
                  <a
                    href={workshop.hotel_booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white text-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-2xs text-xs uppercase"
                  >
                    Book Hotel Room <ExternalLink size={14} />
                  </a>
                ) : (
                  <div className="w-full bg-white/15 border border-white/30 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
                    <Clock size={14} /> Reservation Link Opening Soon
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200/95 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-primary tabular-nums">
                <Calendar size={15} className="shrink-0" /> {workshop.workshop_ordinal} Workshop Lodging
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Target Window
                </span>
                <span className="font-serif text-lg font-semibold text-slate-900 tabular-nums">
                  {workshop.target_window}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5">
                Exact symposium dates, room-block cutoff deadlines, and the direct hotel reservation link will appear here once the {workshop.workshop_year} host property is finalized.
              </p>
              <div className="pt-1">
                <Link
                  href="/contact"
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                >
                  Questions? Contact Organizing Committee →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Archival Section: Clearly Separated Previous Workshop Host Venues */}
      <section
        aria-labelledby="previous-venues-heading"
        className="hidden md:block mt-14 pt-10 border-t-2 border-slate-200/90 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5">
              <History size={13} className="text-slate-500 shrink-0" />
              <span>Previous Years • Past Host Venues</span>
            </div>
            <h2
              id="previous-venues-heading"
              className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900"
            >
              Previous Workshop Host Venues
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Examples of coastal conference properties from prior HEMS Workshops—shown for historical context only.{" "}
              {!workshop.venue_confirmed && (
                <strong className="font-medium text-slate-800">
                  The {workshop.workshop_year} host hotel has not yet been announced.
                </strong>
              )}
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            View All 15 Past Host Cities <ArrowRight size={13} />
          </Link>
        </div>

        {previousVenuesCards}
      </section>

      <details className="md:hidden group mt-10 pt-6 border-t border-slate-200/90">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer bg-white border border-slate-200/90 rounded-2xl px-4 py-3.5 shadow-2xs flex items-center justify-between gap-3 select-none">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <History size={14} className="text-slate-500 shrink-0" />
            <span>Previous Workshop Host Venue Examples</span>
          </span>
          <ChevronDown
            size={16}
            className="text-slate-500 transition-transform duration-200 group-open:rotate-180 shrink-0"
          />
        </summary>
        <div className="mt-4 space-y-5">
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Examples of coastal conference properties from prior HEMS Workshops—shown for historical context only.{" "}
              {!workshop.venue_confirmed && (
                <strong className="font-medium text-slate-800">
                  The {workshop.workshop_year} host hotel has not yet been announced.
                </strong>
              )}
            </p>
            <Link
              href="/history"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start"
            >
              View All 15 Past Host Cities <ArrowRight size={13} />
            </Link>
          </div>
          {previousVenuesCards}
        </div>
      </details>
    </>
  );
}
