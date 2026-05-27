import { MapPin, Hotel, Calendar, DollarSign, ExternalLink, Clock, Info } from "lucide-react";

export const metadata = {
  title: "Venue & Accommodations - HEMS Workshop",
  description: "Get details on the HEMS Workshop venue, Sheraton Virginia Beach Oceanfront Hotel rates, and reservation deadlines.",
};

export default function Accommodations() {
  const marriottBookingUrl = "https://www.marriott.com/event-reservations/reservation-link.mi?id=1752772494174&key=GRP&app=resvlink";

  return (
    <>
      {/* Page Header */}
      <header className="mb-12 border-b border-foreground/10 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
          <Hotel size={16} /> Workshop Lodging
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Venue & Accommodations</h1>
        <p className="text-foreground/70">Plan your stay for the 15th HEMS Workshop at the Sheraton Virginia Beach Oceanfront Hotel.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details and Maps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hotel Summary & Info */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Official Workshop Venue</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              The 15th HEMS Workshop will be hosted at the stunning beachfront conference facilities of the Sheraton Virginia Beach Oceanfront Hotel. Situated directly on the boardwalk, the hotel offers excellent work environments and convenient access to workshop sessions, poster displays, and dining.
            </p>
            
            {/* Address box */}
            <div className="bg-surface/10 border border-foreground/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <MapPin className="text-primary w-8 h-8 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">Location Address</span>
                <span className="font-bold text-foreground text-sm block">Sheraton Virginia Beach Oceanfront Hotel</span>
                <p className="text-xs text-foreground/75">3501 Atlantic Ave, Virginia Beach, Virginia 23451</p>
              </div>
            </div>
          </section>

          {/* Room Rates Details */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <DollarSign className="text-primary" size={20} /> Exclusive HEMS Room Rates
            </h2>
            <p className="text-sm text-foreground/80">
              We have secured a preferred block of guest rooms at a discounted group rate for HEMS Workshop attendees.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block mb-1">HEMS Group Rate</span>
                <span className="text-2xl font-mono font-bold text-primary">$124.00</span>
                <span className="text-xs text-foreground/50 ml-1">USD / night</span>
                <p className="text-[10px] text-foreground/75 mt-3">
                  Plus standard state and local lodging taxes. Room block is subject to availability.
                </p>
              </div>

              <div className="border border-foreground/10 p-4 rounded-lg bg-surface/5">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block mb-1">Availability Window</span>
                <span className="font-bold text-foreground text-sm block mt-1">Sept 12, 2025 – Sept 21, 2025</span>
                <p className="text-[10px] text-foreground/75 mt-3">
                  Enjoy the special group discount rates for extended stays preceding or following the core workshop dates.
                </p>
              </div>
            </div>
          </section>

          {/* Stay policies & helpful tips */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Important Travel Details</h2>
            <div className="space-y-4">
              <div className="flex gap-3 items-start text-foreground/80">
                <Info className="text-primary shrink-0 mt-1" size={16} />
                <p className="text-xs">
                  <strong>Parking:</strong> On-site self-parking and valet options are available. Guests in the HEMS room block are eligible for standard parking rates.
                </p>
              </div>
              <div className="flex gap-3 items-start text-foreground/80">
                <Info className="text-primary shrink-0 mt-1" size={16} />
                <p className="text-xs">
                  <strong>Check-in/Check-out:</strong> Standard check-in is at 4:00 PM and check-out is at 11:00 AM. Inquire directly with the hotel front desk for early check-in requests.
                </p>
              </div>
              <div className="flex gap-3 items-start text-foreground/80">
                <Info className="text-primary shrink-0 mt-1" size={16} />
                <p className="text-xs">
                  <strong>High-Speed Internet:</strong> Standard guestroom Wi-Fi is included in the group rate package.
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
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">Workshop Schedule</span>
                <span className="font-bold text-foreground">Sept 15 – Sept 18, 2025</span>
              </div>
              <div className="border-t border-foreground/10 pt-3">
                <span className="text-[10px] uppercase font-mono text-foreground/50 block">Discount Window</span>
                <span className="font-bold text-foreground">Sept 12 – Sept 21, 2025</span>
              </div>
            </div>
          </div>

          {/* Booking Deadline Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider mb-4 text-secondary border-b border-foreground/10 pb-2">
              <Clock size={16} /> Booking Deadline
            </h3>
            <div className="text-xl font-mono font-bold text-foreground mb-1">SEPTEMBER 5, 2025</div>
            <p className="text-[11px] text-foreground/70 leading-relaxed">
              Discounted rooms must be reserved on or before the cutoff date to receive group rates.
            </p>
          </div>

          {/* Booking Action */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">Secure Your Room</h3>
              <p className="text-xs opacity-90 mb-6 leading-relaxed">
                Click the booking link below to access the Marriott portal with the HEMS event rates automatically applied.
              </p>
            </div>
            
            <a 
              href={marriottBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs"
            >
              Book Hotel Room <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
