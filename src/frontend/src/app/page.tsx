import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Anchor,
  Cpu,
  GraduationCap,
  BookOpen,
  Building2,
  ShieldCheck,
} from "lucide-react";
import UpcomingHeroBadge from "@/components/workshop/UpcomingHeroBadge";
import UpcomingWorkshopSpotlight from "@/components/workshop/UpcomingWorkshopSpotlight";
import HeroMassSpectrum from "@/components/home/HeroMassSpectrum";
import { getStaticUpcomingWorkshop } from "@/utils/upcomingWorkshop";
import {
  buildPageMetadata,
  buildUpcomingWorkshopEventJsonLd,
} from "@/utils/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "HEMS Society | Harsh-Environment Mass Spectrometry",
  description:
    "Biennial symposium and 25+ year open-access proceedings archive advancing in-situ mass spectrometry across oceans, planetary bodies, and austere environments.",
  path: "/",
  keywords: [
    "Harsh-Environment Mass Spectrometry Society",
    "16th HEMS Workshop 2027",
    "field mass spectrometry proceedings",
    "miniature mass spectrometer",
  ],
});

const CHARTER_PILLARS = [
  {
    index: "01",
    title: "Planetary, Oceanic & Volcanic Frontiers",
    description:
      "Deploying mass spectrometers directly into extreme natural regimes—from deep-ocean hydrothermal vents and polar waters to volcanic plumes, stratospheric aircraft, and lunar or Martian landers.",
    tags: ["Deep-Sea MIMS", "Planetary Payloads", "Volcanic & Atmospheric"],
    image: "/images/gallery/fox-volcanic-fumarole-ms.jpg",
    imageWidth: 1400,
    imageHeight: 960,
    imageAlt: "Investigator operating a backpack-portable mass spectrometer inside an active volcanic sulfur fumarole",
    imageFit: "cover" as const,
    credit: "2012 Field Trial • Fox (INFICON), 15th WS",
  },
  {
    index: "02",
    title: "Miniature & Ruggedized Hardware",
    description:
      "Engineering compact ion sources, rectilinear and toroidal ion traps, portable time-of-flight and sector analyzers, harsh-environment membrane inlets, and low-SWaP vacuum systems.",
    tags: ["Low-SWaP Vacuum", "Portable Analyzers", "Harsh Inlets"],
    image: "/images/gallery/raith-spaceflight-orbitrap-cad.jpg",
    imageWidth: 1400,
    imageHeight: 694,
    imageAlt: "Cross-section engineering schematic of a spaceflight pulsed-UV laser desorption Orbitrap mass spectrometer",
    imageFit: "contain" as const,
    credit: "UMD / NASA GSFC • Raith et al., 15th WS",
  },
  {
    index: "03",
    title: "Autonomous Field Sensing & Rapid Response",
    description:
      "Advancing uncrewed underwater and aerial sensing, real-time onboard spectral deconvolution, environmental forensics, industrial process monitoring, and chemical defense readiness.",
    tags: ["AUV / UAV Sensing", "Onboard Deconvolution", "Environmental & Defense"],
    image: "/images/gallery/coppin-icefin-underice-rov.jpg",
    imageWidth: 1600,
    imageHeight: 899,
    imageAlt: "Icefin autonomous under-ice vehicle carrying an underwater mass spectrometer beneath polar sea ice",
    imageFit: "cover" as const,
    credit: "Cornell / Harvard SUIMS • 15th WS (2025)",
  },
];

const SYMPOSIUM_CULTURE = [
  {
    tag: "10th HEMS Workshop • Sept 15, 2015",
    title: "UMD School of Pharmacy • Baltimore, MD",
    caption:
      "Tuesday morning Technical Session IV during the 10th anniversary HEMS Workshop, chaired by Gottfried Kibelka and hosted by OI Analytical.",
    image: "/images/gallery/single-track-auditorium-smiles-2015.jpg",
    width: 1600,
    height: 1066,
    alt: "Full single-track lecture auditorium of HEMS Workshop scientists and engineers smiling toward the camera",
    position: "object-center",
  },
  {
    tag: "11th HEMS Workshop • Sept 19, 2017",
    title: "Mandalay Beach Resort • Oxnard, CA",
    caption:
      "Tuesday afternoon break outside the technical session ballroom at the Embassy Suites Mandalay Beach Resort during the 11th HEMS Workshop, hosted by UTC Aerospace Systems.",
    image: "/images/gallery/mandalay-beach-corridor-smiles-2017.jpg",
    width: 1600,
    height: 1106,
    alt: "Two HEMS Workshop investigators smiling in casual conversation between afternoon technical sessions in Oxnard, California",
    position: "object-top",
  },
  {
    tag: "15th HEMS Workshop • Sept 17, 2025",
    title: "Sheraton Oceanfront • Virginia Beach, VA",
    caption:
      "Wednesday evening gathering at the Sheraton Virginia Beach Oceanfront Hotel (3501 Atlantic Ave) ahead of the 15th HEMS Workshop Dinner.",
    image: "/images/gallery/virginia-beach-staircase-smiles-2025.jpg",
    width: 1600,
    height: 973,
    alt: "HEMS Workshop attendees conversing warmly along the atrium staircase at the Sheraton Virginia Beach Oceanfront Hotel",
    position: "object-center",
  },
];

export default function Home() {
  const upcomingJsonLd = buildUpcomingWorkshopEventJsonLd(getStaticUpcomingWorkshop());

  return (
    <div className="flex flex-col flex-grow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(upcomingJsonLd) }}
      />
      {/* SECTION 1: EDITORIAL SPLIT HERO */}
      <section className="relative border-b border-slate-200/85 bg-gradient-to-b from-white via-[#FAFBFD] to-[#F4F7FA] py-10 sm:py-18 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-12 lg:gap-10 items-center">
            {/* Left Editorial Narrative (7 Columns) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-24 sm:w-32 lg:w-36 rounded-xl bg-white border border-slate-200/95 p-1.5 sm:p-2 shadow-2xs shrink-0">
                    <img
                      src="/hemslogo.jpg"
                      alt="Harsh-Environment Mass Spectrometry Society Official Emblem"
                      width={3756}
                      height={2594}
                      decoding="async"
                      className="w-full h-auto object-contain mix-blend-multiply block"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-primary tracking-tight leading-snug">
                      Harsh-Environment Mass Spectrometry Society
                    </p>
                    <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5 tabular-nums">
                      All-Volunteer 501(c)(3) Scientific Forum • Est. 1999
                    </p>
                  </div>
                </div>
                <div className="hidden md:block pt-1">
                  <UpcomingHeroBadge />
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.35rem] font-semibold text-slate-900 tracking-tight leading-[1.12] sm:leading-[1.1]">
                Mass Spectrometry{" "}
                <span className="text-primary italic font-normal">Beyond</span> the Controlled Laboratory.
              </h1>

              <p className="text-[15px] sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Since 1999, the biennial HEMS Workshop has convened academic, government, and industrial investigators to solve the engineering and analytical challenges of operating mass spectrometers in the field.
              </p>

              <blockquote className="hidden md:block border-l-2 border-primary/50 pl-4 py-0.5 text-sm sm:text-[15px] font-serif italic text-slate-700 max-w-2xl">
                &ldquo;Providing an open, collaborative forum where instrument builders and field scientists share breakthroughs, setbacks, and real-world deployment lessons.&rdquo;
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <Link
                  href="/archive"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 min-h-[44px] rounded-lg text-sm font-semibold hover:bg-sky-800 transition-colors shadow-xs"
                >
                  <span>Explore Proceedings Archive</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/layout-portal"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-3 min-h-[44px] rounded-lg text-sm font-semibold hover:border-primary/50 hover:text-primary transition-colors shadow-2xs"
                >
                  <span>2027 Workshop Overview</span>
                </Link>
                <Link
                  href="/history"
                  className="hidden md:inline-flex items-center justify-start gap-1.5 px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                >
                  <span>Society History (1999–2025)</span>
                </Link>
              </div>
            </div>

            {/* Right Analytical Specimen & 2027 Dossier Card (5 Columns) */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/95 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <HeroMassSpectrum />

                {/* Live-Hydrated 16th Workshop Dossier */}
                <div className="pt-3.5 border-t border-slate-100 md:pt-0 md:border-t-0">
                  <UpcomingWorkshopSpotlight />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: TECHNICAL CHARTER PILLARS */}
      <section className="py-12 sm:py-18 lg:py-22 bg-[#FAFBFD] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.16em] text-primary block mb-2">
              01 — Technical Charter
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
              Core Domains of Harsh-Environment Inquiry
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-3">
              HEMS sessions follow a single-track format so hardware designers, analytical chemists, and field operators engage across every discipline together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {CHARTER_PILLARS.map((pillar) => (
              <article
                key={pillar.index}
                className="bg-white border border-slate-200/90 rounded-xl overflow-hidden hover:border-primary/40 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-white border-b border-slate-100 overflow-hidden">
                    <img
                      src={pillar.image}
                      alt={pillar.imageAlt}
                      width={pillar.imageWidth}
                      height={pillar.imageHeight}
                      decoding="async"
                      className={`w-full h-full ${
                        pillar.imageFit === "contain"
                          ? "object-contain p-3 bg-white"
                          : "object-cover"
                      }`}
                      loading="lazy"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/75 backdrop-blur-xs text-[10px] font-medium tracking-wide text-white">
                      {pillar.credit}
                    </span>
                  </div>
                  <div className="p-6 pb-0">
                    <span className="tabular-nums text-xs font-semibold text-secondary tracking-widest block mb-2.5">
                      {pillar.index} / DOMAIN
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-slate-900 leading-snug mb-2.5">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100">
                    {pillar.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10.5px] font-medium px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: SYMPOSIUM CULTURE — CASUAL, COASTAL & ACADEMIC */}
      <section className="py-12 sm:py-18 lg:py-22 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary block mb-2">
                02 — The Symposium Spirit
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Rigorous Field Science, Relaxed Coastal Camaraderie
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-3">
                Since 1999, HEMS has paired deep technical discourse with beachfront venues and informal attire—creating an open atmosphere where investigators freely exchange hard-won engineering lessons.
              </p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline shrink-0"
            >
              <span>Explore Our Beachfront Tradition</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {SYMPOSIUM_CULTURE.map((item) => (
              <figure
                key={item.title}
                className="bg-[#FAFBFD] border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      decoding="async"
                      className={`w-full aspect-[16/10] object-cover ${item.position}`}
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="pt-4 px-1.5 pb-1">
                    <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1">
                      {item.tag}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-[13.5px] text-slate-600 leading-relaxed">
                      {item.caption}
                    </p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: OPEN-ACCESS REPOSITORY & SOCIETY PARTICIPATION */}
      <section className="py-12 sm:py-18 lg:py-22 bg-[#FAFBFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left 7 Columns: Workshop Proceedings Spotlight */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="tabular-nums text-[11px] font-semibold uppercase tracking-[0.16em] text-primary block mb-2">
                  03 — Open-Access Digital Archive (1999–2025)
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                  Recent Highlights from the Proceedings
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2">
                  Every HEMS symposium preserves an open archival record of oral presentations, abstracts, and technical programs for the global research community.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 hover:border-primary/40 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-2xs">
                  <img
                    src="/images/gallery/danell-dragonfly-titan-ms-2019.jpg"
                    alt="NASA Dragonfly rotorcraft lander concept carrying the DraMS mass spectrometer on Saturn's moon Titan"
                    width={1400}
                    height={1195}
                    decoding="async"
                    className="w-full sm:w-32 h-36 sm:h-24 object-cover rounded-lg border border-slate-100 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Compass size={17} className="text-primary shrink-0" />
                        <h3 className="font-semibold text-base text-slate-900">
                          Planetary &amp; Spaceflight Mass Spectrometry
                        </h3>
                      </div>
                      <span className="tabular-nums text-[10.5px] font-medium text-slate-400 shrink-0">
                        13th–15th WS
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                      Next-generation analyzers for Titan rotorcraft missions, lunar volatiles, Europa/ocean-world plumes, and laser desorption spaceflight instrumentation.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Image: NASA Dragonfly / DraMS — R. M. Danell et al., 13th HEMS Workshop (Myrtle Beach, SC, Sept 17, 2019)
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 hover:border-primary/40 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-2xs">
                  <img
                    src="/images/gallery/bell-subsea-lander-ms-2025.jpg"
                    alt="Shipboard crane deploying a benthic subsea lander carrying an underwater mass spectrometer"
                    width={1400}
                    height={1083}
                    decoding="async"
                    className="w-full sm:w-32 h-36 sm:h-24 object-cover rounded-lg border border-slate-100 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Anchor size={17} className="text-secondary shrink-0" />
                        <h3 className="font-semibold text-base text-slate-900">
                          Underwater &amp; Marine Biogeochemistry
                        </h3>
                      </div>
                      <span className="tabular-nums text-[10.5px] font-medium text-slate-400 shrink-0">
                        14th–15th WS
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                      In-situ Membrane Introduction Mass Spectrometry (MIMS), benthic subsea landers, autonomous underwater vehicle (AUV) mapping, and deep-sea profiling.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Image: Cold-seep subsea MS lander — R. Bell (Beaver Creek Analytical) &amp; AWI-Bremerhaven, 15th HEMS Workshop (Sept 18, 2025)
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 hover:border-primary/40 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-2xs">
                  <img
                    src="/images/gallery/verbeck-uav-drone-ms-2025.jpg"
                    alt="Researchers outdoors preparing a heavy-lift UAV drone outfitted with a portable mass spectrometer"
                    width={1400}
                    height={948}
                    decoding="async"
                    className="w-full sm:w-32 h-36 sm:h-24 object-cover rounded-lg border border-slate-100 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Cpu size={17} className="text-primary shrink-0" />
                        <h3 className="font-semibold text-base text-slate-900">
                          Field-Portable &amp; Autonomous Instrumentation
                        </h3>
                      </div>
                      <span className="tabular-nums text-[10.5px] font-medium text-slate-400 shrink-0">
                        13th–15th WS
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                      UAV-borne and mobile-vehicle MS platforms, person-portable TOF and tandem MS/MS systems, and rapid-response chemical plume detection.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Image: Augusta University (Augusta, GA) UAV-MS testbed — G. F. Verbeck, 15th HEMS Workshop (Sept 16, 2025)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                <Link
                  href="/archive/2025"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <span>View 15th Workshop Proceedings (2025)</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/archive"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                >
                  <BookOpen size={15} />
                  <span>Browse All 15 Workshops (1999–2025)</span>
                </Link>
              </div>
            </div>

            {/* Right 5 Columns: Institutional Pathways (Student Grants + Sponsorship + Governance) */}
            <aside className="lg:col-span-5 space-y-5">
              {/* Student Travel Awards Card */}
              <div className="p-6 rounded-2xl bg-[#FAFBFD] border border-slate-200/95 space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
                  <GraduationCap size={16} /> Emerging Investigators
                </div>
                <h3 className="font-serif text-xl font-semibold text-slate-900">
                  Competitive Student Travel Awards
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To cultivate the next generation of harsh-environment mass spectrometrists, the HEMS Society awards competitive travel grants to full-time M.S., M.A., and Ph.D. graduate student presenters at each biennial workshop.
                </p>
                <Link
                  href="/student-awards"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
                >
                  <span>Eligibility, Selection Criteria &amp; Application Guidelines</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Industry Partnership & Non-Profit Charter Card */}
              <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sky-300">
                    <ShieldCheck size={14} className="shrink-0" /> All-Volunteer 501(c)(3) Society
                  </span>
                  <div className="w-16 sm:w-20 rounded-lg bg-white p-1 shadow-xs shrink-0">
                    <img
                      src="/hemslogo.jpg"
                      alt="HEMS Society Official Emblem"
                      width={3756}
                      height={2594}
                      decoding="async"
                      loading="lazy"
                      className="w-full h-auto object-contain mix-blend-multiply block"
                    />
                  </div>
                </div>
                <h3 className="font-serif text-xl font-semibold text-white">
                  Sustained by Community &amp; Industry Partners
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  HEMS charges no annual membership dues. Each biennial workshop and student travel award cycle is independently sustained by attendee registrations and corporate sponsors across the instrumentation community.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <Link
                    href="/corporate-sponsorship"
                    className="inline-flex items-center gap-1.5 font-semibold text-sky-300 hover:text-white transition-colors"
                  >
                    <Building2 size={14} />
                    <span>Corporate Sponsorship</span>
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    href="/about"
                    className="font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Board &amp; Bylaws →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
