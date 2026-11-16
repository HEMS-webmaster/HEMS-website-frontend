"use client";

import { useRef, useState, useCallback, useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { galleryImageUrl } from "@/utils/galleryAssets";

interface FieldDeploymentSlide {
  id: string;
  domainBadge: string;
  title: string;
  presenter: string;
  institution: string;
  workshopLabel: string;
  caption: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  objectPosition: string;
  archiveHref: string;
}

const FIELD_DEPLOYMENTS: FieldDeploymentSlide[] = [
  {
    id: "fox-arammis-robot-2025",
    domainBadge: "Volcanic & Lunar Robot",
    title: "Quadruped ARAMMIS Gas-Sensing Mass Spectrometer",
    presenter: "James Fox",
    institution: "INFICON / ETH Zurich RSL",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "ANYmal legged robot topped with an integrated INFICON quadrupole 3D-Gas Pod traversing rough volcanic and lunar-analog terrain prior to Mount Etna field trials.",
    image: galleryImageUrl("fox-arammis-robot-ms-2025.jpg"),
    width: 1280,
    height: 905,
    alt: "Red quadruped ANYmal walking robot carrying a black INFICON and RSL ARAMMIS quadrupole mass spectrometer gas pod across rocky field terrain",
    objectPosition: "object-center",
    archiveHref: "/archive/2025#2025-pres-fox-arammis-autonomous-robots-for",
  },
  {
    id: "danell-dragonfly-titan-2019",
    domainBadge: "Planetary Rotorcraft • Titan",
    title: "Dragonfly Titan Lander & DraMS Mass Spectrometer",
    presenter: "R. M. Danell",
    institution: "NASA New Frontiers Dragonfly Team",
    workshopLabel: "13th HEMS Workshop (2019)",
    caption:
      "NASA's nuclear-powered Dragonfly octocopter rotorcraft on Saturn's moon Titan carrying the DraMS laser-desorption and gas-chromatograph ion-trap mass spectrometer.",
    image: galleryImageUrl("danell-dragonfly-titan-ms-2019.jpg"),
    width: 1400,
    height: 1195,
    alt: "Artist depiction of NASA's eight-rotor Dragonfly planetary lander resting on dune terrain on Saturn's moon Titan with the DraMS mass spectrometer science bay",
    objectPosition: "object-[50%_58%]",
    archiveHref: "/archive/2019#2019-pres-unknown-the-dragonfly-mission-to",
  },
  {
    id: "short-triaxus-towsled-2017",
    domainBadge: "Shipboard Ocean Tow",
    title: "Triaxus Undulating Tow-Sled MIMS off R/V Endeavor",
    presenter: "Tim Short",
    institution: "SRI International",
    workshopLabel: "11th HEMS Workshop (2017)",
    caption:
      "Oceanographic crew launching the Triaxus tow sled equipped with SRI's membrane-inlet mass spectrometer and in-situ pressure-matched calibration bag from R/V Endeavor.",
    image: galleryImageUrl("short-triaxus-towsled-ms-2017.jpg"),
    width: 1450,
    height: 964,
    alt: "Oceanographic crew in safety vests and hard hats operating a hydraulic A-frame on the aft deck of R/V Endeavor to deploy the Triaxus underwater mass spectrometer tow sled",
    objectPosition: "object-[50%_55%]",
    archiveHref: "/archive/2017#2017-pres-unknown-recent-scientific-applications-of",
  },
  {
    id: "amerom-exomars-moma-flight-2022",
    domainBadge: "Mars Flight Hardware",
    title: "ExoMars Rover MOMA Flight Mass Spectrometer Unit",
    presenter: "Friso van Amerom",
    institution: "NASA GSFC / MOMA Integration Team",
    workshopLabel: "14th HEMS Workshop (2022)",
    caption:
      "Flight-model hardware of the Mars Organic Molecule Analyzer (MOMA) combining 266 nm laser desorption and electron-impact ion-trap mass spectrometry for subsurface Martian core samples.",
    image: galleryImageUrl("amerom-exomars-moma-flight-2022.jpg"),
    width: 1400,
    height: 950,
    alt: "Gold-anodized ExoMars MOMA flight mass spectrometer core module and laser pump unit wired on an aerospace integration test stand",
    objectPosition: "object-center",
    archiveHref: "/archive/2022#2022-pres-unknown-overview-and-testing-of",
  },
  {
    id: "grimes-simion-ion-funnel-2025",
    domainBadge: "SIMION Ion-Optics Model",
    title: "Multimodal Atmospheric-to-Vacuum SIMION Ion Funnel Simulation",
    presenter: "Nathan Grimes",
    institution: "BaySpec, Inc.",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "3D SIMION charged-particle trajectory modeling comparing unconfined radial ion scatter against focused transmission through stacked electrostatic ring electrodes into a portable linear ion trap.",
    image: galleryImageUrl("grimes-simion-ion-funnel-2025.jpg"),
    width: 1500,
    height: 938,
    alt: "Side-by-side 3D SIMION electrostatic ion-trajectory simulation panels showing diffuse gas-phase ion dispersion versus focused confinement down a conical ring-electrode ion funnel",
    objectPosition: "object-center",
    archiveHref: "/archive/2025#2025-pres-grimes-multimodal-ionization-strategies-for",
  },
  {
    id: "verbeck-uav-drone-2025",
    domainBadge: "Aerial UAV Platform",
    title: "Hexacopter-Mounted Atmospheric Trace Mass Spectrometer",
    presenter: "Guido Verbeck",
    institution: "Augusta University",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "Outdoor pre-flight checkout of a heavy-lift hexacopter drone fitted with a custom miniature mass spectrometer for airborne vapor and air-health profiling.",
    image: galleryImageUrl("verbeck-uav-drone-ms-2025.jpg"),
    width: 1252,
    height: 848,
    alt: "Two researchers inspecting a portable mass spectrometer mounted beneath the carbon-fiber frame of a large hexacopter drone outdoors",
    objectPosition: "object-[50%_38%]",
    archiveHref: "/archive/2025#2025-pres-verbeck-using-classes-of-molecules",
  },
  {
    id: "smith-military-cwa-gcms-2003",
    domainBadge: "Military CBRN Response",
    title: "Field-Portable GC-MS for Chemical Warfare Agent Reconnaissance",
    presenter: "Philip A. Smith",
    institution: "Uniformed Services Univ. / USMC CBIRF",
    workshopLabel: "4th HEMS Workshop (2003)",
    caption:
      "Uniformed chemical-response personnel deploying a tactical vehicle-mounted gas chromatograph–mass spectrometer and handheld SPME vapor sampler during warfare-agent field trials.",
    image: galleryImageUrl("smith-military-cwa-gcms-2003.jpg"),
    width: 1195,
    height: 896,
    alt: "Two uniformed military responders wearing camouflage fatigues and nitrile gloves beside a white tactical response van analyzing a bag specimen with a handheld portable GC-MS sampler",
    objectPosition: "object-[50%_24%]",
    archiveHref: "/archive/2003#2003-pres-unknown-detection-of-gas-phase",
  },
  {
    id: "li-lama-lunar-optics-2025",
    domainBadge: "Lunar Optics Assembly",
    title: "Precision Ion-Optics Assembly for Lunar LAMA TOF-MS",
    presenter: "Xiang Li",
    institution: "NASA Goddard Space Flight Center",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "Hand-assembly of miniaturized machined stainless-steel lens plates, insulating spacers, and slotted reflectron ion optics for NASA's Artemis-class standoff Laser Ablation Mass Analyzer.",
    image: galleryImageUrl("li-lama-lunar-optics-2025.jpg"),
    width: 1098,
    height: 720,
    alt: "Close-up of gloved engineers assembling precision-machined cylindrical electrode rings, insulating collars, and slotted TOF ion-optics stacks for the lunar LAMA mass spectrometer",
    objectPosition: "object-[50%_46%]",
    archiveHref: "/archive/2025#2025-pres-li-standoff-laser-ablation-mass",
  },
  {
    id: "loose-antarctic-swims-2025",
    domainBadge: "Polar Sea Ice",
    title: "Antarctic Polar-Night Expedition aboard RVIB N. B. Palmer",
    presenter: "Brice Loose",
    institution: "URI Graduate School of Oceanography",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "Research icebreaker RVIB Nathaniel B. Palmer illuminated during the Ross Sea polar night expedition deploying the SWIMS submersible inert-gas mass spectrometer.",
    image: galleryImageUrl("loose-antarctic-swims-2025.jpg"),
    width: 1600,
    height: 968,
    alt: "Orange research icebreaker RVIB Nathaniel B. Palmer floodlit on Antarctic pack ice during the polar night expedition",
    objectPosition: "object-[50%_58%]",
    archiveHref: "/archive/2025#2025-pres-loose-vertical-transport-of-biogenic",
  },
  {
    id: "newsome-smithsonian-bay-ms-2025",
    domainBadge: "Museum Collections Bay",
    title: "In-Situ Non-Proximate MS Probe Inside Collections Storage",
    presenter: "G. Asher Newsome",
    institution: "Smithsonian Museum Conservation Institute",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "Ambient desorption mass spectrometry deployed on an industrial scissor-lift gantry inside a museum collections storage hall to sample fragile three-dimensional artifacts on site.",
    image: galleryImageUrl("newsome-smithsonian-bay-ms-2025.jpg"),
    width: 1050,
    height: 930,
    alt: "Museum conservator in respirator and nitrile gloves guiding an articulated heated-gas desorption mass spectrometry inlet over a woven basket atop a blue Genie lift inside a collections facility",
    objectPosition: "object-[50%_44%]",
    archiveHref: "/archive/2025#2025-pres-newsome-non-proximate-handheld-probe-with",
  },
  {
    id: "gonin-aircraft-tofms-2018",
    domainBadge: "Airborne Cabin",
    title: "Atmospheric TOF-MS Racks Inside a Research Aircraft",
    presenter: "Marc Gonin",
    institution: "TOFWERK (photo credit: Jonathan Duplissy)",
    workshopLabel: "12th HEMS Workshop (2018)",
    caption:
      "Flight-certified time-of-flight mass spectrometer racks bolted down inside a multi-instrument atmospheric research aircraft for in-flight boundary-layer sampling.",
    image: galleryImageUrl("gonin-aircraft-tofms-2018.jpg"),
    width: 1400,
    height: 917,
    alt: "Interior aisle of a meteorological research aircraft lined with racked mass spectrometer analyzers, vacuum plumbing, and operator consoles",
    objectPosition: "object-center",
    archiveHref: "/archive/2018#2018-pres-unknown-field-deployable-mass-spectrometers",
  },
  {
    id: "bell-cold-seep-lander-2025",
    domainBadge: "Deep-Ocean Lander",
    title: "Cold-Seep Underwater Mass Spectrometer Lander",
    presenter: "Ryan Bell",
    institution: "Beaver Creek Analytical, LLC",
    workshopLabel: "15th HEMS Workshop (2025)",
    caption:
      "Stern A-frame offshore deployment of an autonomous underwater mass spectrometer frame engineered for real-time deep-sea cold-seep geochemistry.",
    image: galleryImageUrl("bell-subsea-lander-ms-2025.jpg"),
    width: 1400,
    height: 1083,
    alt: "Offshore deck crew deploying a yellow autonomous underwater mass spectrometer lander over the stern rail at sea",
    objectPosition: "object-[50%_42%]",
    archiveHref: "/archive/2025#2025-pres-bell-underwater-mass-spectrometry-advancements",
  },
];

export default function HeroFieldDeploymentsCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const filmstripRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const smoothStripSyncRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const total = FIELD_DEPLOYMENTS.length;
  const activeSlide = FIELD_DEPLOYMENTS[activeIndex];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * FIELD_DEPLOYMENTS.length);
    setActiveIndex(randomIndex);

    const alignToIndex = () => {
      const track = trackRef.current;
      if (track && track.clientWidth > 0) {
        track.scrollTo({
          left: randomIndex * track.clientWidth,
          behavior: "instant" as ScrollBehavior,
        });
      }
      const strip = filmstripRef.current;
      const thumb = thumbRefs.current[randomIndex];
      if (strip && thumb && strip.clientWidth > 0) {
        const targetLeft =
          thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
        strip.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: "instant" as ScrollBehavior,
        });
      }
    };

    alignToIndex();
    const raf = requestAnimationFrame(() => {
      alignToIndex();
      smoothStripSyncRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!smoothStripSyncRef.current) return;
    const strip = filmstripRef.current;
    const thumb = thumbRefs.current[activeIndex];
    if (!strip || !thumb || strip.clientWidth <= 0) return;
    const targetLeft =
      thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
    strip.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [activeIndex]);

  const scrollToIndex = useCallback(
    (nextIndex: number) => {
      const wrapped = ((nextIndex % total) + total) % total;
      setActiveIndex(wrapped);
      const track = trackRef.current;
      if (track) {
        track.scrollTo({
          left: wrapped * track.clientWidth,
          behavior: "smooth",
        });
      }
    },
    [total]
  );

  const handleTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0) return;
    const snapped = Math.round(track.scrollLeft / track.clientWidth);
    const bounded = Math.max(0, Math.min(total - 1, snapped));
    if (bounded !== activeIndex) {
      setActiveIndex(bounded);
    }
  }, [activeIndex, total]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    },
    [activeIndex, scrollToIndex]
  );

  return (
    <div
      className="bg-white border border-slate-200/95 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5"
      aria-roledescription="carousel"
      aria-label="Archive presentation mass spectrometry field deployment photographs"
    >
      {/* Top Specimen Header & Scroll Controls */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <span className="tabular-nums text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary truncate">
          Field Deployments • Archive Proceedings
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular-nums text-[11px] font-semibold text-slate-500">
            {activeIndex + 1} / {total}
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              aria-label="Previous field deployment photograph"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              aria-label="Next field deployment photograph"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll-Snap Photographic Viewport */}
      <div
        ref={trackRef}
        tabIndex={0}
        onScroll={handleTrackScroll}
        onKeyDown={handleKeyDown}
        aria-label="Scrollable gallery of field mass spectrometry deployments. Swipe or use Left and Right arrow keys."
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-xl border border-slate-200/85 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/35"
      >
        {FIELD_DEPLOYMENTS.map((slide, idx) => (
          <div
            key={slide.id}
            className="min-w-full w-full shrink-0 snap-center relative aspect-[16/10] overflow-hidden select-none"
          >
            <img
              src={galleryImageUrl(slide.image)}
              alt={slide.alt}
              width={slide.width}
              height={slide.height}
              decoding="async"
              loading={
                idx === activeIndex ||
                idx === (activeIndex + 1) % total ||
                idx === (activeIndex - 1 + total) % total
                  ? "eager"
                  : "lazy"
              }
              className={`w-full h-full object-cover ${slide.objectPosition} block`}
            />
            <span className="absolute top-2.5 left-2.5 bg-white/92 backdrop-blur-xs text-slate-800 border border-slate-200/85 px-2.5 py-1 rounded-md text-[10.5px] font-semibold uppercase tracking-[0.08em] tabular-nums shadow-2xs">
              {slide.domainBadge}
            </span>
          </div>
        ))}
      </div>

      {/* Interactive Single-Row Scrollable Filmstrip Selector */}
      <div
        ref={filmstripRef}
        role="tablist"
        aria-label="Select field deployment slide"
        className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5"
      >
        {FIELD_DEPLOYMENTS.map((slide, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={slide.id}
              ref={(el) => {
                thumbRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`View slide ${idx + 1}: ${slide.title}`}
              onClick={() => scrollToIndex(idx)}
              className={`w-[15.4%] min-w-[68px] shrink-0 relative aspect-[16/10] rounded-lg overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-1 opacity-100"
                  : "border border-slate-200/80 opacity-65 hover:opacity-95"
              }`}
            >
              <img
                src={galleryImageUrl(slide.image)}
                alt=""
                width={slide.width}
                height={slide.height}
                decoding="async"
                loading="lazy"
                className={`w-full h-full object-cover ${slide.objectPosition} block`}
              />
            </button>
          );
        })}
      </div>

      {/* Zero-CLS Provenance Caption Footer */}
      <div className="min-h-[86px] pt-2.5 border-t border-slate-100 flex flex-col justify-between gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-[15px] sm:text-base font-semibold text-slate-900 leading-snug">
            {activeSlide.title}
          </h3>
          <Link
            href={activeSlide.archiveHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-sky-800 transition-colors shrink-0 whitespace-nowrap pt-0.5"
          >
            <span>Archive Talk</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="tabular-nums text-[11px] font-medium text-secondary">
          {activeSlide.presenter} ({activeSlide.institution}) • {activeSlide.workshopLabel}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {activeSlide.caption}
        </p>
      </div>
    </div>
  );
}
