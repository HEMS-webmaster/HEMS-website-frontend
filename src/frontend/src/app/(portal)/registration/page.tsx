import { CreditCard, Calendar, ShieldAlert, DollarSign, CheckCircle2, Building2, GraduationCap, UserCheck, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Workshop Registration - HEMS Workshop",
  description: "Register for the 15th HEMS Workshop. View attendee pricing tiers, key deadlines, corporate packages, and payment methods.",
};

export default function Registration() {
  const exOrdoRegUrl = "https://hems-workshop2025.exordo.com/registration/new";
  const hemsShopUrl = "http://shop.hems-workshop.org";

  return (
    <>
      {/* Page Header */}
      <header className="mb-12 border-b border-foreground/10 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
          <CreditCard size={16} /> Workshop Access
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Workshop Registration</h1>
        <p className="text-foreground/70">Secure your pass for the 15th Harsh-Environment Mass Spectrometry Workshop in Virginia Beach.</p>
      </header>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Student Pass */}
        <div className="bg-background border border-foreground/10 rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="text-primary" size={20} />
              <span className="text-[10px] uppercase font-mono text-foreground/50">Academic Rate</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">Student Pass</h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-mono font-bold text-foreground">$250</span>
              <span className="text-[10px] text-foreground/50">USD</span>
            </div>
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Discounted access pass for full-time undergraduate and graduate students presenting papers or posters.
            </p>
            <ul className="space-y-2 text-[10px] text-foreground/80 border-t border-foreground/10 pt-3">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Full workshop access
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Student travel award eligible
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Lunches & social sessions
              </li>
            </ul>
          </div>
          <a 
            href={exOrdoRegUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center bg-background border border-foreground/20 text-foreground py-2.5 rounded font-bold uppercase hover:bg-foreground/5 transition-colors mt-6 text-xs"
          >
            Register Student
          </a>
        </div>

        {/* Professional Pass */}
        <div className="bg-background border-2 border-primary rounded-xl p-6 relative flex flex-col justify-between shadow-lg shadow-primary/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-background px-3 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
            Standard
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="text-primary" size={20} />
              <span className="text-[10px] uppercase font-mono text-primary font-bold">Standard Rate</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">Professional Pass</h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-mono font-bold text-primary">$500</span>
              <span className="text-[10px] text-foreground/50">USD</span>
            </div>
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Standard registration pass for academic faculty, industrial researchers, engineers, and government officials.
            </p>
            <ul className="space-y-2 text-[10px] text-foreground/80 border-t border-foreground/10 pt-3">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Full technical access
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Copy of workshop materials
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Banquet dinner included
              </li>
            </ul>
          </div>
          <a 
            href={exOrdoRegUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center bg-primary text-background py-2.5 rounded font-bold uppercase hover:bg-primary/90 transition-colors mt-6 text-xs shadow-sm"
          >
            Register Professional
          </a>
        </div>

        {/* Corporate Sponsor */}
        <div className="bg-background border border-foreground/10 rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="text-primary" size={20} />
              <span className="text-[10px] uppercase font-mono text-foreground/50">Industrial Partner</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">Sponsor Pass</h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-mono font-bold text-foreground">$1,350</span>
              <span className="text-[10px] text-foreground/50">USD</span>
            </div>
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Full corporate sponsorship benefits, exhibition display space, banner recognition, plus one (1) attendee registration.
            </p>
            <ul className="space-y-2 text-[10px] text-foreground/80 border-t border-foreground/10 pt-3">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Includes 1 Attendee Pass
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Banner logotype credit
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="text-primary" size={12} /> Display table & poster space
              </li>
            </ul>
          </div>
          <a 
            href={hemsShopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center bg-background border border-foreground/20 text-foreground py-2.5 rounded font-bold uppercase hover:bg-foreground/5 transition-colors mt-6 text-xs"
          >
            Register Sponsor
          </a>
        </div>
      </div>

      {/* Info & Deadlines Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="text-primary" size={20} /> Key Registration Dates
            </h2>
            <div className="relative border-l-2 border-foreground/10 pl-6 space-y-6">
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                <span className="text-[10px] font-mono text-foreground/50 block">June 1, 2025</span>
                <span className="font-bold text-sm text-foreground">Early-Bird Rate Opens</span>
                <p className="text-xs text-foreground/70 mt-1">Attendees registering during this window qualify for pricing specials.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-secondary border-4 border-background" />
                <span className="text-[10px] font-mono text-foreground/50 block">July 15, 2025</span>
                <span className="font-bold text-sm text-foreground">Early-Bird Rate Closes</span>
                <p className="text-xs text-foreground/70 mt-1">Standard registration rates apply starting July 16, 2025.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-foreground/45 border-4 border-background" />
                <span className="text-[10px] font-mono text-foreground/50 block">September 5, 2025</span>
                <span className="font-bold text-sm text-foreground">Registration Final Cutoff</span>
                <p className="text-xs text-foreground/70 mt-1">All attendee lists, names, and payments must be settled to guarantee access passes.</p>
              </div>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="text-primary" size={20} /> Cancellation & Refund Policy
            </h2>
            <p className="text-xs text-foreground/75 leading-relaxed">
              Registration cancellations submitted in writing to the HEMS Organizing Committee on or before **August 15, 2025** are eligible for a full refund, minus a $50 processing fee. Cancellations received after August 15, 2025 are non-refundable due to catering and facility commitments, but passes may be transferred to another attendee from your institution or organization upon request.
            </p>
          </section>
        </div>

        {/* Sidebar Panel Details */}
        <div className="space-y-6">
          {/* Inquiries */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-xs border-b border-foreground/10 pb-2">
              Corporate Splitting
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Need to split standard corporate sponsor fees into separate sponsorship ($850) and registration ($500) items to meet organizational guidelines? 
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Visit our online store portal at `shop.hems-workshop.org` or contact Tim Short at `rtshort00@gmail.com` to organize customized billing invoice details.
            </p>
          </div>

          {/* Verification Callout */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-95">Ex Ordo Payments</h3>
            <p className="text-xs opacity-90 mb-6 leading-relaxed">
              Ticketing transactions and attendee badge generation are processed through our secure Ex Ordo registration portal.
            </p>
            <a 
              href={exOrdoRegUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-background text-primary font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-xs"
            >
              Open ex ordo <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
