import { Building2, Award, Download, Mail, DollarSign, Users, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Corporate Sponsorship - HEMS Workshop",
  description: "Explore HEMS Workshop corporate sponsorship opportunities, packages, benefits, and past sponsor registries.",
};

export default function CorporateSponsorship() {
  const previousSponsors = [
    "Alcatel Vacuum", "Ardara Technologies", "ASRC Aerospace Corporation", "BaySpec, Inc.", 
    "Brooks Automation", "Bruker Daltonics", "BURLE Electro-Optics", "Detector Technologies Inc.", 
    "ENG Concepts", "Edwards", "Extrel", "1st Detect", "Hamilton Sundstrand", 
    "ICX Griffin Analytical Technologies (Flir)", "Inficon", "Ionicon Analytik", "Ionwerks, Inc.", 
    "MassTech", "Microsaic Systems", "Monitor Instruments", "OI Analytical", "Pascal Technologies", 
    "Perkin Elmer", "Pfeiffer Vacuum", "SAES Getters", "Siemens", "Smiths Detection", 
    "Spyglass Technologies", "SRI International", "Stanford Research Systems", 
    "Syagen (Safran Morpho)", "Torion", "University of North Texas", "Varian Inc. (Agilent Technologies)"
  ];

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-6">
          <Building2 size={16} /> Partner with Us
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
          Corporate <span className="text-primary border-b-4 border-primary">Sponsorship</span>
        </h1>
        <p className="text-xl text-foreground/70 leading-relaxed">
          Support analytical science at the extremes and position your brand in front of industry-leading researchers.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        {/* Left 2 Columns: Overview and Benefits */}
        <div className="lg:col-span-2 space-y-12">
          {/* Overview Section */}
          <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-4">Sponsorship Value</h2>
            <p className="text-foreground/80 leading-relaxed mb-6">
              Your registration as a corporate sponsor directly offsets the costs of organizing the workshop and plays a vital role in funding student travel awards. By sponsoring the HEMS Workshop, you directly invest in the growth of the harsh-environment mass spectrometry community while gaining prominent visibility.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="https://www.hems-workshop.org/15thWS/Corporate%20Sponsorship%20Information.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-background px-5 py-3 rounded font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
              >
                <Download size={16} /> Download Info PDF
              </a>
            </div>
          </section>

          {/* Benefits Grid */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground">Sponsor Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-foreground/10 p-6 rounded-lg bg-background hover:border-primary/30 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={20} /> Exhibition Space
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Dedicated display table at the workshop to exhibit your hardware, demonstrate products, and distribute promotional literature.
                </p>
              </div>

              <div className="border border-foreground/10 p-6 rounded-lg bg-background hover:border-primary/30 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <Users className="text-primary" size={20} /> Professional Network
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Opportunities to display a technical corporate poster in the main hall and engage in active discussions with academic and industry experts.
                </p>
              </div>

              <div className="border border-foreground/10 p-6 rounded-lg bg-background hover:border-primary/30 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <Award className="text-primary" size={20} /> Brand Recognition
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Featured placement on the official HEMS Workshop banner, program catalogs, and introductory slides during technical sessions.
                </p>
              </div>

              <div className="border border-foreground/10 p-6 rounded-lg bg-background hover:border-primary/30 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <Building2 className="text-primary" size={20} /> Digital Exposure
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Prominent listing on the HEMS Society website, including your corporate logotype linking back to your business homepage.
                </p>
              </div>
            </div>
          </section>

          {/* Previous Sponsors registry */}
          <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-6">Past Corporate Sponsors</h2>
            <p className="text-sm text-foreground/75 mb-6">
              We are grateful for the support of our distinguished previous workshop sponsors:
            </p>
            <div className="flex flex-wrap gap-2">
              {previousSponsors.map((sponsor, idx) => (
                <span 
                  key={idx} 
                  className="bg-background border border-foreground/10 text-foreground/80 px-3 py-1.5 rounded-full text-xs font-medium hover:border-primary/35 transition-colors"
                >
                  {sponsor}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Rates & Contact Info */}
        <div className="space-y-6">
          {/* Rate Packages Card */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm space-y-6">
            <h3 className="font-bold uppercase tracking-wider text-sm border-b border-foreground/10 pb-2">
              Sponsorship Rates
            </h3>

            {/* Option 1 */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-mono text-foreground/50 block">Standard Package</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-foreground">$1,350</span>
                <span className="text-xs text-foreground/50">USD</span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Includes full corporate sponsorship benefits plus one (1) workshop attendee registration.
              </p>
            </div>

            {/* Option 2 */}
            <div className="border-t border-foreground/10 pt-4 space-y-2">
              <span className="text-xs uppercase font-mono text-primary block font-bold">Split-Payment Options</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold text-foreground">$850 + $500</span>
                <span className="text-xs text-foreground/50">USD</span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Structured as an $850 sponsorship fee and a separate $500 attendee registration fee to align with internal corporate spending limits.
              </p>
            </div>

            {/* Option 3 */}
            <div className="border-t border-foreground/10 pt-4 space-y-2">
              <span className="text-xs uppercase font-mono text-foreground/50 block">Sponsor Only (Non-Attending)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold text-foreground">$850</span>
                <span className="text-xs text-foreground/50">USD</span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Support the workshop remotely. We can display your corporate poster for you.
              </p>
            </div>
          </div>

          {/* Quick Registry Action Link */}
          <div className="bg-background border border-foreground/10 p-6 rounded-xl shadow-sm text-center">
            <p className="text-xs text-foreground/70 mb-4">
              Ready to submit your registration? Access our secure shop portal:
            </p>
            <a 
              href="http://shop.hems-workshop.org"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-background font-bold py-3 rounded text-sm hover:bg-secondary/90 transition-colors"
            >
              <DollarSign size={16} /> Workshop Store
            </a>
          </div>

          {/* Contact Details Card */}
          <div className="bg-primary text-background rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-sm mb-2 opacity-95">Questions & Inquiries</h3>
              <p className="text-sm opacity-90 mb-6 leading-relaxed">
                For custom arrangements, display preferences, or payment inquiries, please reach out to our coordinator.
              </p>
              
              <div className="space-y-1 mb-6 border-l-2 border-background/30 pl-4 py-1">
                <span className="text-xs uppercase opacity-75 font-mono block">Coordinator</span>
                <span className="font-bold text-sm block">Tim Short</span>
              </div>
            </div>
            
            <a 
              href="mailto:rtshort00@gmail.com"
              className="w-full bg-background text-primary font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-background/90 transition-colors shadow-sm text-sm"
            >
              <Mail size={16} /> Email Tim Short
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
