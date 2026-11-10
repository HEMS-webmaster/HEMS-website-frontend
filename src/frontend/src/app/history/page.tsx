import Link from "next/link";
import {
  History,
  Waves,
  ShieldCheck,
  Globe,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Workshop & Society History | HEMS Society",
  description:
    "Explore the origins and evolution of the Harsh-Environment Mass Spectrometry (HEMS) Workshop and Society—from an informal 1999 gathering at USF St. Petersburg to an international 501(c)(3) scientific community.",
};

const TIMELINE_EVENTS = [
  {
    era: "Late 1990s",
    tag: "Genesis",
    title: "USF Center for Ocean Technology (COT) Origins",
    description:
      "Researchers at the USF COT developing underwater mass spectrometers for marine science recognized that diverse field MS groups shared fundamental engineering hurdles yet rarely communicated, sparking the vision for a recurring cross-disciplinary forum.",
  },
  {
    era: "Feb 1999",
    tag: "1st Workshop",
    title: "Inaugural Gathering at USF St. Petersburg",
    description:
      "USF COT hosted the first workshop on its St. Petersburg, FL campus, inviting roughly 20 researchers from across the U.S. for 1½ days of informal talks and discussions.",
  },
  {
    era: "Feb 2001",
    tag: "2nd Workshop",
    title: "Downtown St. Petersburg & Vacuum Bottlenecks",
    description:
      "Attracting 65 participants—including international attendees—this meeting embraced shorts and Hawaiian shirts as unofficial workshop attire and isolated portable miniature vacuum pumps as a primary development bottleneck.",
  },
  {
    era: "Mar 2002",
    tag: "3rd Workshop",
    title: "Pasadena Joint Workshop with NASA JPL",
    description:
      "Addressing the vacuum challenge directly, the 3rd HEMS Workshop combined with NASA’s 2nd Miniature Vacuum Pumps Workshop, hosted by the Jet Propulsion Laboratory (JPL) / NASA in Pasadena, CA.",
  },
  {
    era: "Oct 2003",
    tag: "4th Workshop",
    title: "St. Petersburg Beach & Biennial Cadence",
    description:
      "Hosted by USF COT at St. Petersburg Beach, FL, consolidating the beachfront atmosphere, strengthening manufacturer collaborations, and establishing a two-year interval between workshops.",
  },
  {
    era: "Sept 2005",
    tag: "5th Workshop",
    title: "Lido Beach & Organizing Committee Proposal",
    description:
      "Held at Lido Beach in Sarasota, FL, establishing the biennial mid-September schedule and proposing an independent HEMS Workshop Organizing Committee.",
  },
  {
    era: "2008",
    tag: "Incorporation",
    title: "HEMS Society 501(c)(3) Incorporation",
    description:
      "The organizing committee formally incorporated in the State of Florida as the HEMS Society, a tax-exempt 501(c)(3) nonprofit corporation with rotating chair leadership.",
  },
  {
    era: "2007 – Present",
    tag: "Coastal & Global Tour",
    title: "National & International Symposia",
    description:
      "Convening in Cocoa Beach (2007), Santa Barbara (2009), St. Pete Beach, Baltimore, Oxnard, Cologne (Germany), Myrtle Beach, Cocoa Beach, and Virginia Beach (2025).",
  },
];

export default function SocietyHistoryPage() {
  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb Back Link */}
      <Link
        href="/about"
        className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors mb-6 w-fit text-sm"
      >
        <ArrowLeft size={16} /> About the HEMS Society
      </Link>

      {/* Header Section */}
      <div className="mb-14 pb-8 border-b border-foreground/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4">
              <Calendar size={14} />
              Inaugural Workshop Feb 1999 • Incorporated 2008
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              Workshop &amp; Society{" "}
              <span className="text-primary border-b-4 border-primary">History</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-sans">
              From an informal gathering of twenty researchers in St. Petersburg, Florida to an internationally recognized biennial scientific symposium and 501(c)(3) society.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-surface/60 border border-foreground/10 rounded-2xl shadow-sm self-start md:self-center">
            <img
              src="/hemslogo.jpg"
              alt="HEMS Society Official Logo"
              className="w-28 h-28 object-contain rounded-xl border border-foreground/10 mix-blend-multiply bg-white p-2"
            />
            <span className="text-[11px] font-mono text-foreground/60 mt-2">Est. 1999</span>
          </div>
        </div>
      </div>

      {/* Main Narrative Sections */}
      <div className="space-y-12 mb-16">
        {/* Section 1: HEMS WS Early Years */}
        <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 lg:p-10 shadow-sm">
          <h2 className="text-2xl font-black uppercase tracking-wider text-primary mb-6 flex items-center gap-2.5">
            <Waves size={22} />
            HEMS Workshop Early Years (1999–2005)
          </h2>
          <div className="space-y-5 text-foreground/85 leading-relaxed font-sans text-base">
            <p>
              The idea of starting a periodic workshop on harsh-environment mass spectrometry arose in the very late 1990’s from researchers at the University of South Florida (USF) Center for Ocean Technology (COT). Recent advances in vacuum technology and reduction in size of benchtop mass spectrometers were beginning to motivate more research groups around the globe to explore the potential advantages of taking mass spectrometers out of the laboratory and into the field for in situ chemical measurements.
            </p>
            <p>
              At that time researchers at the USF COT were in the early stages of such a project that aimed at putting mass spectrometers underwater for marine science and environmental monitoring applications. It also occurred to them that the applications for portable mass spectrometry technology are quite diverse, and the various groups exploring this approach might not normally communicate with, or even be aware of, the activities of other groups that may be facing similar challenges for the different field environments and end-goal measurements. Yet the overall field of portable and transportable mass spectrometry for in situ chemical measurements – in sometimes extremely harsh environments – might advance more rapidly if there were a forum for these diverse groups to share their knowledge, experiences, challenges and solutions.
            </p>
            <p>
              And so, the concept of hosting a recurring Harsh-Environment Mass Spectrometry Workshop (HEMS WS) became a reality, with the hope to foster communication and advancement among the various researchers involved in the development and deployment of portable mass spectrometer technology. The USF COT hosted the first workshop in February 1999 on the St. Petersburg, FL campus of USF and invited around 20 researchers from around the US working in various areas of HEMS and related enabling technologies to participate in 1 ½ days of talks and discussions in an informal atmosphere (see{" "}
              <Link href="/archive" className="text-primary font-semibold hover:underline">
                Archives
              </Link>{" "}
              for details of this and all other HEMS Workshops).
            </p>
            <p>
              There was sufficient enthusiasm after this short initial meeting that the COT decided to host a more formal and longer 2nd HEMS WS in February 2001 with broad advertisement and registration fees. This took place in downtown St. Petersburg and attracted 65 participants, including several from outside the US. The casual and relaxed atmosphere was quickly embraced, and shorts and Hawaiian shirts became the unofficial attire of the workshop. The many positive responses and broad range of interests of the participants – from disaster management to environmental monitoring and space exploration, and pure science to cutting edge engineering – encouraged the organizers to make the HEMS WS an annual event.
            </p>
            <p>
              This 2nd workshop also made a crucial pain point for development of small mass spectrometers very clear – the need for vacuum and the small portable pumps required to produce it. The 3rd HEMS WS was thus combined with NASA’s 2nd Miniature Vacuum Pumps WS and hosted by the Jet Propulsion Lab (JPL) / NASA in Pasadena, CA (March 2002). The following year USF COT hosted the 4th HEMS WS and held it in St. Petersburg Beach, FL (October 2003). This further consolidated the “beachy” vibe of the workshop and demonstrated the necessity for it to be a focused workshop that facilitates collaborations and demonstrates a path toward instrumentation development for manufacturers. And due to the time-consuming nature of instrumental development required for many HEMS endeavors, it was decided to have two years in between WSs. So, USF COT subsequently hosted the 5th HEMS WS at Lido Beach in Sarasota, FL (September 2005) establishing its biennial recurrence in mid-September.
            </p>
          </div>
        </section>

        {/* Section 2: HEMS Society */}
        <section className="bg-surface/30 border border-foreground/10 rounded-2xl p-8 lg:p-10 shadow-sm">
          <h2 className="text-2xl font-black uppercase tracking-wider text-secondary mb-6 flex items-center gap-2.5">
            <ShieldCheck size={22} />
            Formation of the HEMS Society (2005–Present)
          </h2>
          <div className="space-y-5 text-foreground/85 leading-relaxed font-sans text-base">
            <p>
              The idea of forming a HEMS WS Organizing Committee was proposed during the 5th meeting at Lido Beach in 2005. The success of the first five workshops showed that there was solid support for additional workshops and that the group was ready to take independent responsibility for future workshops rather than have it remain under the USF umbrella. The organizing committee was subsequently created, and it formally incorporated the workshop in the State of Florida as the <strong>HEMS Society</strong> in 2008. The formal organization helped the HEMS workshop project a clear and independent identity and allowed the committee to more easily handle funds and plan future workshops. The workshop is now a nonprofit corporation exempt from federal income tax under Section 501(c)(3) of the Internal Revenue Code.
            </p>
            <p>
              The organizing committee itself was structured to ensure that responsibility for each upcoming WS would be taken by a different member of the committee with support from the others. And indeed, each of the subsequent workshops has been organized by the HEMS Organizing Committee and hosted (either formally or informally) by the board member leading the workshop.
            </p>
            <p>
              The newly incorporated HEMS Society held its 6th WS in Cocoa Beach, FL in 2007, and then moved back across the US in 2009 to Santa Barbara, CA, for the 7th workshop. Since then, the workshop has been held in St. Pete Beach, FL, Baltimore, MD, Oxnard, CA, Cologne, Germany, Myrtle Beach, SC, back to Cocoa Beach, FL, and finally, Virginia Beach, VA. In each case, the workshop committee has sought a venue that provides a relaxing atmosphere, often near an ocean or the Gulf of Mexico, where technical interchange of ideas can occur and relationships can be fostered.
            </p>
          </div>
        </section>

        {/* Section 3: Chronological Milestone Stepper */}
        <section className="border border-foreground/10 bg-background rounded-2xl p-8 lg:p-10 shadow-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <History className="text-primary" size={22} />
            <h2 className="text-xl font-black uppercase tracking-wide text-foreground">
              Key Historical Milestones
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TIMELINE_EVENTS.map((item, idx) => (
              <div
                key={idx}
                className="relative pl-6 border-l-2 border-primary/30 group hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-primary">{item.era}</span>
                  <span className="px-2 py-0.5 rounded bg-surface text-[10px] font-mono font-semibold uppercase text-foreground/70">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Summary & Beachfront Philosophy */}
        <section className="bg-gradient-to-r from-primary/10 via-surface/60 to-secondary/10 border-l-4 border-primary p-8 lg:p-10 rounded-r-2xl shadow-sm">
          <h2 className="text-2xl font-black uppercase tracking-wide text-foreground mb-4 flex items-center gap-2.5">
            <Globe className="text-primary" size={22} />
            Summary &amp; The HEMS Philosophy
          </h2>
          <blockquote className="text-xl md:text-2xl font-bold text-primary italic mb-5 font-sans">
            &ldquo;Just because we send our mass spectrometers into harsh environments doesn’t mean we have to meet in one!&rdquo;
          </blockquote>
          <div className="space-y-4 text-base text-foreground/85 leading-relaxed font-sans max-w-5xl">
            <p>
              From the beginning, there has been an emphasis on holding HEMS Workshops in locations that provide a relaxing, pleasant and casual environment, with a majority of workshops being held at beachfront hotels. Ample free time for informal discussions and networking has always been provided.
            </p>
            <p>
              It was hoped the gathering of researchers and engineers that design, build, and use field deployable mass spectrometers and their enabling components would facilitate collaborations and expedite progress. Corporate vendor and US Government agency participation has always been solicited and included. And it was also hoped that, due to the wide variety of applications of HEMS technology, the participants would likely be seeking funding from many different sources, thus reducing competition among each other and making it more likely for detailed information to be freely shared.
            </p>
          </div>
        </section>
      </div>

      {/* Dual Navigation Footer Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface/60 border border-foreground/10 rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-sm">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">
              Mission &amp; Core Objectives
            </h3>
            <p className="text-foreground/70 font-sans text-sm leading-relaxed">
              Read the official charter and five strategic pillars guiding the Harsh-Environment Mass Spectrometry Society, Inc.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 bg-background text-foreground border border-foreground/20 font-bold px-5 py-3 rounded-lg hover:border-primary/50 hover:text-primary transition-all w-fit uppercase tracking-wide text-xs"
          >
            About the Society
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="bg-surface border border-foreground/10 rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-sm">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">
              Explore 25+ Years of Proceedings
            </h3>
            <p className="text-foreground/70 font-sans text-sm leading-relaxed">
              Browse technical programs, keynote slides, poster sessions, and abstracts from all fifteen HEMS Workshops since February 1999.
            </p>
          </div>
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 bg-primary text-background font-bold px-5 py-3 rounded-lg hover:bg-primary/90 transition-all shadow-sm w-fit uppercase tracking-wide text-xs"
          >
            View Proceedings Archive
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
