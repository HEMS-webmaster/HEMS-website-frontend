import Link from "next/link";
import { ArrowRight, Globe, Database, Cpu, FileText, Anchor, Compass, Info } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-grow">
      {/* Hero Section */}
      <section className="relative overflow-hidden flex-grow flex items-center py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/50 to-background pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 max-w-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
                <img 
                  src="/hemslogo.jpg" 
                  alt="HEMS Logo" 
                  className="w-32 h-32 object-contain rounded-xl border border-foreground/15 mix-blend-multiply bg-white p-2 shadow-md hover:scale-105 transition-transform" 
                />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Latest Proceedings: 15th HEMS Workshop • Virginia Beach
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight mb-6 uppercase leading-tight">
                Workshop on <br />
                <span className="text-primary border-b-4 border-primary pb-1">Harsh-Environment</span> <br />
                Mass Spectrometry
              </h1>
              
              <div className="bg-surface/30 border border-foreground/10 p-6 rounded-xl backdrop-blur-sm mb-8">
                <p className="text-lg text-foreground/90 leading-relaxed font-sans italic">
                  &ldquo;In situ mass spectrometry (MS) in a wide variety of harsh environments—from outer space to Earth&apos;s oceans to battlefield scenarios—is rapidly becoming a reality. There are many common features to MS deployment in these vastly different conditions, including high reliability, small size, and low power requirements. The Harsh-Environment MS Workshop encourages interaction among those interested in deployment of mass spectrometers in various harsh environments.&rdquo;
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/archive" className="flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-md font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Explore Proceedings Archive
                  <ArrowRight size={18} />
                </Link>
                <Link href="/about" className="flex items-center gap-2 bg-surface text-foreground border border-foreground/20 px-6 py-3 rounded-md font-medium hover:border-primary/50 transition-colors">
                  HEMS Society Overview
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:col-span-4 lg:flex justify-end">
              <div className="relative w-full aspect-square max-w-sm">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-4 border border-secondary/30 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute inset-8 border-2 border-dashed border-primary/40 rounded-full animate-[spin_20s_linear_infinite]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-surface/80 backdrop-blur-md p-6 border border-primary/30 rounded-2xl shadow-2xl w-64">
                    <div className="font-mono text-[10px] text-primary mb-3 flex justify-between">
                      <span>MS.SYS: DEPLOYED</span>
                      <span>ENV: HARSH</span>
                    </div>
                    <div className="space-y-2.5 font-mono text-[11px]">
                      <div className="flex justify-between text-foreground/60 border-b border-foreground/5 pb-1">
                        <span>Mass Range:</span>
                        <span className="text-foreground font-bold">1-200 amu</span>
                      </div>
                      <div className="flex justify-between text-foreground/60 border-b border-foreground/5 pb-1">
                        <span>Pressure:</span>
                        <span className="text-foreground font-bold">1e-5 Torr</span>
                      </div>
                      <div className="flex justify-between text-foreground/60 border-b border-foreground/5 pb-1">
                        <span>Power Draw:</span>
                        <span className="text-foreground font-bold">&lt; 35 W</span>
                      </div>
                      <div className="flex justify-between text-foreground/60">
                        <span>Telemetry:</span>
                        <span className="text-secondary font-bold">LINK ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="py-20 bg-surface/30 border-t border-foreground/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl font-bold uppercase tracking-tight">Technical Program Focus</h2>
            <p className="text-foreground/60 mt-2 font-mono text-sm">Key areas of research and engineering featured in HEMS sessions</p>
            <div className="w-20 h-1 bg-primary mt-4 mx-auto md:mx-0" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border border-foreground/10 p-8 hover:border-primary/50 transition-colors group rounded-xl">
              <Globe className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Extreme Environments</h3>
              <p className="text-foreground/70 text-sm leading-relaxed font-sans">
                Interfacing instruments directly with punishing environments, including planetary atmospheres, deep oceanic boundaries, volcanic plumes, and tactical battlefield scenarios.
              </p>
            </div>
            
            <div className="bg-background border border-foreground/10 p-8 hover:border-primary/50 transition-colors group rounded-xl">
              <Cpu className="w-12 h-12 text-secondary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Hardware Miniaturization</h3>
              <p className="text-foreground/70 text-sm leading-relaxed font-sans">
                R&amp;D focused on making mass spectrometer components (ion sources, mass analyzers, vacuum pumps, and detectors) rugged, portable, and energy-efficient.
              </p>
            </div>
            
            <div className="bg-background border border-foreground/10 p-8 hover:border-primary/50 transition-colors group rounded-xl">
              <Database className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Autonomous Telemetry</h3>
              <p className="text-foreground/70 text-sm leading-relaxed font-sans">
                Autonomous sampling protocols, intelligent target selection, real-time data processing, and compressed spectral communication networks for remote operation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Highlights */}
      <section className="py-20 border-t border-foreground/5 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left side: Highlights */}
            <div className="lg:col-span-8 space-y-8">
              <div>
                <h2 className="text-3xl font-bold uppercase tracking-tight">Latest Workshop Proceedings</h2>
                <p className="text-foreground/60 mt-2 font-mono text-sm">Key scientific sessions and topics from the 15th HEMS Workshop</p>
                <div className="w-20 h-1 bg-primary mt-4" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-surface/20 border border-foreground/10 p-6 rounded-lg hover:border-foreground/20 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-primary/10 text-primary rounded-md">
                      <Compass size={20} />
                    </span>
                    <h4 className="font-bold uppercase tracking-wide">Planetary Exploration</h4>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                    Research on next-generation mass spectrometers for planetary bodies, featuring systems like ARAMMIS for Lunar gas sensing and spaceflight laser desorption mass spectrometry.
                  </p>
                  <span className="text-xs font-mono text-foreground/50">Sessions: Technical I, II, VIII</span>
                </div>

                <div className="bg-surface/20 border border-foreground/10 p-6 rounded-lg hover:border-foreground/20 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-secondary/10 text-secondary rounded-md">
                      <Anchor size={20} />
                    </span>
                    <h4 className="font-bold uppercase tracking-wide">Underwater & Marine MS</h4>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                    Advances in oceanic chemistry monitoring using Membrane Introduction Mass Spectrometry (MIMS) and deep-sea autonomous profiling platforms.
                  </p>
                  <span className="text-xs font-mono text-foreground/50">Sessions: Technical IV, V, VI</span>
                </div>

                <div className="bg-surface/20 border border-foreground/10 p-6 rounded-lg hover:border-foreground/20 transition-all col-span-1 sm:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-primary/10 text-primary rounded-md">
                      <Cpu size={20} />
                    </span>
                    <h4 className="font-bold uppercase tracking-wide">Field-Deployable Instruments</h4>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                    Presentations on portable Time-of-Flight (TOF) instruments, nonproximate handheld chemical probes, and 2D MS/MS hardware designed for military, battlefield, and rapid response deployment.
                  </p>
                  <span className="text-xs font-mono text-foreground/50">Sessions: Technical III, VII, IX</span>
                </div>
              </div>
            </div>

            {/* Right side: Quick Info and Society */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-surface/40 border border-foreground/10 p-6 rounded-xl">
                <h3 className="font-bold uppercase tracking-wider text-sm mb-4 border-b border-foreground/10 pb-2">HEMS Society, Inc.</h3>
                <p className="text-xs text-foreground/80 leading-relaxed mb-4">
                  The Harsh-Environment Mass Spectrometry Society, Inc. is an official 501(c)(3) Public Charity organized exclusively for scientific, educational, and charitable purposes.
                </p>
                <div className="bg-background/50 border border-foreground/5 p-3.5 rounded font-mono text-[10px] text-foreground/70 space-y-1">
                  <div>• 501(c)(3) IRS Certified</div>
                  <div>• Focus: Academic & Industry R&amp;D</div>
                  <div>• Scope: Portable & Rugged MS</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-6 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText size={80} />
                </div>
                <h3 className="font-bold uppercase tracking-wide mb-2 text-primary">Technical Proceedings</h3>
                <p className="text-xs text-foreground/80 leading-relaxed mb-4">
                  Access 25+ years of archived programs, abstracts, presentations, and participant details from all HEMS workshops since 1999.
                </p>
                <Link href="/archive" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  Browse the Archives
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
