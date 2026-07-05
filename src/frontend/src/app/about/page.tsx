import { Users, Target, History } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
            About the <span className="text-primary border-b-4 border-primary">HEMS</span> Society
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl">
            The Harsh-Environment Mass Spectrometry Society, Inc. is a Public Charity under section 501(c)(3) dedicated to advancing MS technology in extreme conditions.
          </p>
        </div>
        <img 
          src="/hemslogo.jpg" 
          alt="HEMS Logo" 
          className="w-24 h-24 object-contain rounded-lg border border-foreground/10 mix-blend-multiply bg-white p-1 self-start md:self-auto" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
        <div className="space-y-8">
          <section className="bg-surface border border-foreground/10 p-8 rounded shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target size={120} />
            </div>
            <h2 className="text-2xl font-bold uppercase mb-4 flex items-center gap-3">
              <Target className="text-primary" /> Purpose
            </h2>
            <p className="text-foreground/80 leading-relaxed relative z-10">
              In situ mass spectrometry (MS) in a wide variety of harsh environments—from outer space to Earth's oceans to battlefield scenarios—is rapidly becoming a reality. There are many common features to MS deployment in these vastly different conditions, including high reliability, small size, and low power requirements. The Harsh-Environment MS Workshop encourages interaction among those interested in deployment of mass spectrometers in various harsh environments.
            </p>
          </section>

          <section className="bg-surface border border-foreground/10 p-8 rounded shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users size={120} />
            </div>
            <h2 className="text-2xl font-bold uppercase mb-4 flex items-center gap-3">
              <Users className="text-secondary" /> Technical Program
            </h2>
            <p className="text-foreground/80 leading-relaxed relative z-10">
              Talks and posters for the Harsh-Environment MS Technical Sessions are selected primarily for their focus on making mass spectrometer components and systems rugged and portable; interfacing mass spectrometers to the environment; autonomous sampling strategies; unattended operations; adaptive sampling; data processing and communications; enabling technologies; and miniaturization.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-background border-l-4 border-primary p-6 shadow-md">
            <h3 className="font-mono font-bold text-lg text-primary mb-2">Upcoming: 15th Workshop</h3>
            <p className="text-foreground/80 mb-2">September 15-18, 2025</p>
            <p className="text-foreground/80 font-bold">Virginia Beach, Virginia</p>
          </div>

          <div className="bg-background border-l-4 border-secondary p-6 shadow-md">
            <h3 className="font-mono font-bold text-lg text-secondary mb-2">History</h3>
            <p className="text-foreground/80 mb-4">
              Since 1999, the HEMS workshop has served as the premier gathering for scientists, engineers, and government officials dedicated to pushing the boundaries of analytical chemistry in the field.
            </p>
          </div>
          
          <div className="aspect-video bg-surface/50 border border-foreground/10 flex items-center justify-center relative group overflow-hidden">
             {/* Placeholder for a rugged environment image */}
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay"></div>
             <p className="font-mono text-sm text-foreground/50 z-10">[IMAGE: ROVER / SUBMERSIBLE]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
