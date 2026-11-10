import Link from "next/link";
import { 
  Users, 
  Cpu, 
  BookOpen, 
  Lightbulb, 
  GraduationCap, 
  Target, 
  History, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Waves
} from "lucide-react";

export const metadata = {
  title: "About the HEMS Society | Harsh-Environment Mass Spectrometry",
  description: "Learn about the mission, objectives, and history of the Harsh-Environment Mass Spectrometry Society, Inc., a 501(c)(3) nonprofit advancing in situ chemical measurement.",
};

const OBJECTIVES = [
  {
    title: "Facilitate Collaboration",
    icon: Users,
    color: "primary",
    description:
      "We strive to create an inclusive community that encourages cross-disciplinary collaboration among scientists and engineers working in the field of mass spectrometry.",
  },
  {
    title: "Promote Enabling Technologies",
    icon: Cpu,
    color: "secondary",
    description:
      "Engage with groups that focus on enabling technologies that enhance the capabilities of portable mass spectrometers. These include advancements in power management, sample introduction, signal processing, and miniaturization techniques to improve performance and expand application possibilities.",
  },
  {
    title: "Knowledge Exchange",
    icon: BookOpen,
    color: "primary",
    description:
      "Through the HEMS Workshop, focus groups at conferences, and publications, we promote the dissemination of cutting-edge research, innovative technologies, and practical experiences related to mass spectrometry deployment in challenging environments.",
  },
  {
    title: "Foster Innovation",
    icon: Lightbulb,
    color: "secondary",
    description:
      "The HEMS Society is committed to fostering innovation and development efforts that enhance the reliability, portability, efficiency, and performance of mass spectrometers in various harsh environments.",
  },
  {
    title: "Outreach and Education",
    icon: GraduationCap,
    color: "primary",
    description:
      "We engage with the public, researchers, and industry stakeholders to raise awareness about the importance and potential of portable mass spectrometry in field applications.",
  },
];

const TIMELINE_EVENTS = [
  {
    era: "Late 1990s",
    tag: "Genesis",
    title: "USF Center for Ocean Technology (COT) Origins",
    description:
      "Researchers at the USF COT were developing in situ underwater mass spectrometers for marine science and environmental monitoring. They realized diverse groups deploying portable MS in extreme settings—space, battlefield, ocean—shared fundamental engineering hurdles yet rarely communicated. The concept of a dedicated, recurring workshop was born to unite these disparate disciplines.",
  },
  {
    era: "Feb 1999",
    tag: "1st Workshop",
    title: "Inaugural Gathering at USF St. Petersburg",
    description:
      "The USF COT hosted the very first workshop on the St. Petersburg, FL campus. Approximately 20 researchers from across the United States convened for 1½ days of informal, intensive talks on portable MS and enabling components.",
  },
  {
    era: "Feb 2001",
    tag: "2nd Workshop",
    title: "Hawaiian Shirts & Vacuum Bottlenecks",
    description:
      "Attracting 65 participants, including international attendees, this downtown St. Petersburg meeting solidified the casual Hawaiian shirt and shorts workshop culture. Crucially, discussions isolated the primary technical roadblock for miniature MS: the critical need for rugged, portable miniature vacuum pumps.",
  },
  {
    era: "Mar 2002",
    tag: "3rd Workshop",
    title: "Pasadena Joint Session with NASA JPL",
    description:
      "Addressing the vacuum pain point directly, the 3rd HEMS Workshop merged with NASA's 2nd Miniature Vacuum Pumps Workshop, co-hosted by NASA's Jet Propulsion Laboratory (JPL) in Pasadena, California.",
  },
  {
    era: "Oct 2003",
    tag: "4th Workshop",
    title: "St. Petersburg Beach & Biennial Cadence",
    description:
      "Meeting at St. Petersburg Beach cemented the coastal venue tradition and facilitated strong academic-industry manufacturing ties. Recognizing the multi-year cycle required for instrument development, the community established a biennial (two-year) rhythm.",
  },
  {
    era: "Sept 2005",
    tag: "5th Workshop",
    title: "Lido Beach & Independent Governance",
    description:
      "At Lido Beach in Sarasota, FL, the community agreed that the workshop had outgrown university-only stewardship. Plans were laid to form an independent organizing committee with rotating chair leadership for future symposia.",
  },
  {
    era: "2008",
    tag: "Incorporation",
    title: "HEMS Society Formal 501(c)(3) Establishment",
    description:
      "The organizing committee formally incorporated the workshop in the State of Florida as the HEMS Society, Inc., securing tax-exempt 501(c)(3) Public Charity status. Each workshop is led by a rotating board member with comprehensive committee backing.",
  },
  {
    era: "2007 – Present",
    tag: "The Tour",
    title: "The National & International Circuit",
    description:
      "The workshop journeyed across renowned coastal and cultural hubs: Cocoa Beach (2007), Santa Barbara (2009), St. Pete Beach, Baltimore, Oxnard, Cologne (Germany), Myrtle Beach, back to Cocoa Beach, and Virginia Beach (2025).",
  },
];

export default function About() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="mb-14 pb-8 border-b border-foreground/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
              <ShieldCheck size={14} />
              501(c)(3) Nonprofit Public Charity • Established 1999
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              About the <span className="text-primary border-b-4 border-primary">HEMS</span> Society
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-sans">
              The Harsh-Environment Mass Spectrometry Society, Inc. is dedicated to advancing chemical measurement technologies outside controlled laboratory settings, accelerating the realization of compact, reliable, and energy-efficient instrumentation.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-surface/60 border border-foreground/10 rounded-2xl shadow-sm">
            <img 
              src="/hemslogo.jpg" 
              alt="HEMS Society Official Logo" 
              className="w-28 h-28 object-contain rounded-xl border border-foreground/10 mix-blend-multiply bg-white p-2" 
            />
            <span className="text-[11px] font-mono text-foreground/60 mt-2">Official Seal</span>
          </div>
        </div>
      </div>

      {/* Mission Statement Hero Card */}
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border-2 border-primary/30 p-8 md:p-12 shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Target size={240} className="text-primary" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Target size={26} />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                Official Charter &amp; Purpose
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-6">
              Our Mission
            </h2>
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-sans font-medium">
              &ldquo;Our mission is to provide a platform for scientists, engineers, and users to come together, exchange knowledge, and address common challenges related to deploying mass spectrometry technology outside a controlled laboratory environment. By facilitating interaction and cooperation, we aim to accelerate the realization of reliable, compact, and energy-efficient mass spectrometry solutions for demanding, and at times extremely harsh, environments.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Strategic Objectives Grid */}
      <section className="mb-20">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-secondary" size={22} />
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
              Core Strategic Objectives
            </h2>
          </div>
          <p className="text-foreground/70 font-sans max-w-3xl">
            The society channels its community and conference activities through five foundational pillars to accelerate field analytical chemistry.
          </p>
          <div className="w-20 h-1 bg-secondary mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OBJECTIVES.map((obj, idx) => {
            const Icon = obj.icon;
            const isEmerald = obj.color === "secondary";
            return (
              <div 
                key={idx} 
                className={`bg-surface/50 border border-foreground/10 rounded-xl p-7 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-sm ${
                  idx === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className={`p-3 rounded-xl ${isEmerald ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"} group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </span>
                    <span className="font-mono text-xs text-foreground/40 font-bold">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-wide text-foreground mb-3">
                    {obj.title}
                  </h3>
                  <p className="text-sm text-foreground/75 leading-relaxed font-sans">
                    {obj.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workshop & Society History Section */}
      <section className="mb-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <History className="text-primary" size={24} />
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
              Workshop &amp; Society History
            </h2>
          </div>
          <p className="text-foreground/70 font-sans max-w-3xl">
            From an informal gathering of twenty researchers in 1999 to an internationally recognized biennial scientific symposium.
          </p>
          <div className="w-20 h-1 bg-primary mt-4" />
        </div>

        {/* Narrative Eras */}
        <div className="space-y-12">
          {/* Era 1: Early Years */}
          <div className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 lg:p-10">
            <h3 className="text-xl font-black uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
              <Waves size={20} />
              The Early Years: USF COT &amp; The Genesis (1999–2005)
            </h3>
            <div className="space-y-4 text-foreground/85 leading-relaxed font-sans text-base">
              <p>
                The idea of starting a periodic workshop on harsh-environment mass spectrometry arose in the very late 1990s from researchers at the University of South Florida (USF) Center for Ocean Technology (COT). Recent advances in vacuum technology and reduction in size of benchtop mass spectrometers were beginning to motivate more research groups around the globe to explore the potential advantages of taking mass spectrometers out of the laboratory and into the field for in situ chemical measurements.
              </p>
              <p>
                At that time, researchers at the USF COT were in the early stages of a project aimed at putting mass spectrometers underwater for marine science and environmental monitoring applications. It occurred to them that applications for portable mass spectrometry technology are remarkably diverse, and groups exploring this approach might not normally communicate with—or even be aware of—activities in other fields facing identical challenges. Yet portable MS for in situ measurements in demanding environments could advance far more rapidly if a shared forum existed to exchange challenges and practical solutions.
              </p>
              <p>
                The concept became reality when the USF COT hosted the first workshop in February 1999 on the St. Petersburg campus of USF, inviting around 20 researchers from across the nation for 1½ days of informal talks. Enthusiasm led to a larger 2nd workshop in downtown St. Petersburg in February 2001 with 65 participants. This meeting solidified the casual, relaxed atmosphere where shorts and Hawaiian shirts became the unofficial attire, while also isolating a crucial development pain point: miniature vacuum pumps.
              </p>
              <p>
                Consequently, the 3rd Workshop in March 2002 was co-located with NASA’s 2nd Miniature Vacuum Pumps Workshop and hosted by NASA’s Jet Propulsion Laboratory (JPL) in Pasadena, California. Returning to Florida in October 2003 at St. Petersburg Beach for the 4th Workshop, the gathering cemented its beachfront identity, confirmed the importance of industry-academic partnerships, and established the biennial (two-year) recurrence required for hardware development.
              </p>
            </div>
          </div>

          {/* Era 2: Incorporation & Society Formation */}
          <div className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 lg:p-10">
            <h3 className="text-xl font-black uppercase tracking-wider text-secondary mb-6 flex items-center gap-2">
              <ShieldCheck size={20} />
              Independent Governance &amp; Incorporation (2005–2008)
            </h3>
            <div className="space-y-4 text-foreground/85 leading-relaxed font-sans text-base">
              <p>
                The proposal to create an independent HEMS Workshop Organizing Committee emerged during the 5th meeting at Lido Beach in Sarasota, Florida in September 2005. The momentum of the first five workshops demonstrated robust community demand and ready readiness to assume independent responsibility beyond the university framework.
              </p>
              <p>
                The organizing committee formally incorporated the workshop in the State of Florida as the <strong>HEMS Society, Inc.</strong> in 2008. Formal organization provided an enduring, independent identity, streamlined sponsorship and fund management, and established the organization as a 501(c)(3) nonprofit corporation exempt from federal income tax.
              </p>
              <p>
                The society was purposefully structured so that primary responsibility for each upcoming symposium rotates among committee members with full collective backing. Subsequent meetings have been organized under this collaborative governance model, maintaining continuity and passion across decades of scientific progress.
              </p>
            </div>
          </div>

          {/* Chronological Stepper */}
          <div className="border border-foreground/10 bg-background rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mb-8">
              Key Historical Milestones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {TIMELINE_EVENTS.map((item, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-primary/30 group hover:border-primary transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{item.era}</span>
                    <span className="px-2 py-0.5 rounded bg-surface text-[10px] font-mono font-semibold uppercase text-foreground/70">
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-foreground mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Philosophy Callout: Beachfront Ethos */}
          <div className="bg-gradient-to-r from-primary/10 via-surface to-secondary/10 border-l-4 border-primary p-8 rounded-r-2xl shadow-sm">
            <h3 className="text-xl font-bold uppercase tracking-wide text-foreground mb-3 flex items-center gap-2">
              <Waves className="text-primary" size={22} />
              The HEMS Philosophy
            </h3>
            <blockquote className="text-lg md:text-xl font-medium text-foreground/90 italic mb-4 font-sans">
              &ldquo;Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!&rdquo;
            </blockquote>
            <p className="text-sm text-foreground/80 leading-relaxed font-sans max-w-4xl">
              From the outset, workshops have prioritized venues offering a relaxed, pleasant, and casual setting—predominantly at beachfront hotels. Ample free time for informal networking encourages genuine collaboration. Because participants represent a wide spectrum of field applications and tap into distinct funding streams, mutual competition is minimized and deep, transparent technical interchange flourishes.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA to Proceedings Archive */}
      <section className="bg-surface border border-foreground/10 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
            Explore 25+ Years of Proceedings
          </h3>
          <p className="text-foreground/70 font-sans max-w-xl text-sm leading-relaxed">
            Delve into complete technical programs, keynote slides, poster sessions, and presentation manuscripts from 1999 to the 15th HEMS Workshop.
          </p>
        </div>
        <Link 
          href="/archive" 
          className="flex items-center gap-2 bg-primary text-background font-bold px-6 py-3.5 rounded-lg hover:bg-primary/90 transition-all shadow-md shrink-0 uppercase tracking-wide text-sm"
        >
          View Proceedings Archive
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
