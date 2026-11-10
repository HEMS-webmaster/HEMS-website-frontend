"use client";

import {
  MapPin,
  Hotel,
  Calendar,
  DollarSign,
  ExternalLink,
  Clock,
  Info,
} from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function AccommodationsClient() {
  const { workshop } = useUpcomingWorkshop();
  const canBookNow = workshop.venue_confirmed && Boolean(workshop.hotel_booking_url);

  return (
    <>
      {/* Page Header */}
      <header className="mb-12 border-b border-foreground/10 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
          <Hotel size={16} /> Workshop Lodging • {workshop.workshop_ordinal} Workshop
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Venue &amp; Accommodations</h1>
        <p className="text-foreground/70">
          {workshop.venue_confirmed
            ? `Plan your stay for the ${workshop.workshop_ordinal} HEMS Workshop at ${workshop.hotel_name} (${workshop.venue_city_state}).`
            : `Venue and beachfront room-block information for the upcoming ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}).`}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details and Maps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hotel Summary & Info */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Official Workshop Venue</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              {workshop.venue_confirmed
                ? `The ${workshop.workshop_ordinal} HEMS Workshop is hosted at ${workshop.hotel_name} in ${workshop.venue_city_state}, providing convenient access to all technical sessions, hardware exhibits, poster displays, and informal coastal networking.`
                : `In keeping with HEMS tradition since 1999, the Organizing Committee selects relaxing coastal and beachfront venues conducive to open scientific exchange. Host hotel selection for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}) is currently underway and will be posted here once finalized.`}
            </p>

            {/* Address box */}
            <div className="bg-surface/10 border border-foreground/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <MapPin className="text-primary w-8 h-8 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                  {workshop.venue_confirmed ? "Confirmed Venue" : "Upcoming Venue Status"}
                </span>
                <span className="font-bold text-foreground text-sm block">{workshop.hotel_name}</span>
                <p className="text-xs text-foreground/75 mt-0.5">{workshop.hotel_address}</p>
                {workshop.venue_confirmed && workshop.hotel_maps_url && (
                  <a
                    href={workshop.hotel_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-mono text-xs hover:underline mt-1.5"
                  >
                    Open in Google Maps <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Room Rates Details */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <DollarSign className="text-primary" size={20} /> HEMS Group Room Block
            </h2>
            <p className="text-sm text-foreground/80">
              Each biennial HEMS Workshop secures a discounted group room block for symposium attendees and students.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block mb-1">
                  HEMS Group Rate
                </span>
                <span className="text-2xl font-mono font-bold text-primary">
                  {workshop.hotel_group_rate}
                </span>
                {workshop.hotel_group_rate !== "TBA" && (
                  <span className="text-xs text-foreground/50 ml-1">USD / night</span>
                )}
                <p className="text-[10px] text-foreground/75 mt-3">
                  {workshop.venue_confirmed
                    ? "Plus applicable state and local lodging taxes. Subject to group block availability."
                    : "Negotiated group nightly rate will be published when the room block opens (for reference, the 15th Workshop rate was $124/night)."}
                </p>
              </div>

              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block mb-1">
                  Availability Window
                </span>
                <span className="font-bold text-foreground text-sm block mt-1">
                  {workshop.hotel_discount_window}
                </span>
                <p className="text-[10px] text-foreground/75 mt-3">
                  Group discount rates traditionally extend several days before and after core workshop sessions.
                </p>
              </div>
            </div>
          </section>

          {/* Stay policies & helpful tips */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4">General Lodging Notes</h2>
            <div className="space-y-4">
              <div className="flex gap-3 items-start text-foreground/80">
                <Info className="text-primary shrink-0 mt-1" size={16} />
                <p className="text-xs">
                  <strong>All-Under-One-Roof Format:</strong> Technical sessions, hardware exhibits, and poster receptions are held inside the host conference hotel to maximize informal collaboration.
                </p>
              </div>
              <div className="flex gap-3 items-start text-foreground/80">
                <Info className="text-primary shrink-0 mt-1" size={16} />
                <p className="text-xs">
                  <strong>Previous Symposium Reference (15th Workshop, Sept 2025):</strong> Hosted at the Sheraton Virginia Beach Oceanfront Hotel (3501 Atlantic Ave, Virginia Beach, VA 23451).
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: Deadline, Actions, Quick Dates */}
        <div className="space-y-6">
          {/* Core Dates Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-4 border-b border-foreground/10 pb-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Key Dates
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                  Workshop Schedule
                </span>
                <span className="font-bold text-foreground">{workshop.exact_dates}</span>
              </div>
              <div className="border-t border-foreground/10 pt-3">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                  Discount Window
                </span>
                <span className="font-bold text-foreground">{workshop.hotel_discount_window}</span>
              </div>
            </div>
          </div>

          {/* Booking Deadline Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider mb-4 text-secondary border-b border-foreground/10 pb-2">
              <Clock size={16} /> Room Block Cutoff
            </h3>
            <div className="text-xl font-mono font-bold text-foreground mb-1">
              {workshop.hotel_booking_cutoff}
            </div>
            <p className="text-[11px] text-foreground/70 leading-relaxed">
              Reservations must be completed prior to the group cutoff date once the room block opens to receive the HEMS conference rate.
            </p>
          </div>

          {/* Booking Action */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">
                {canBookNow ? "Reserve Group Rate" : "Room Block Status"}
              </h3>
              <p className="text-xs opacity-90 mb-6 leading-relaxed">
                {canBookNow
                  ? "Use the direct reservation portal below with the HEMS group rate pre-applied."
                  : `Direct hotel reservation links for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}) will be activated here once venue selection is complete.`}
              </p>
            </div>

            {canBookNow ? (
              <a
                href={workshop.hotel_booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs uppercase"
              >
                Book Hotel Room <ExternalLink size={14} />
              </a>
            ) : (
              <div className="w-full bg-background/15 border border-background/30 text-background font-mono font-bold py-2.5 rounded flex items-center justify-center gap-2 text-xs uppercase">
                <Clock size={14} /> Room Block TBA
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

