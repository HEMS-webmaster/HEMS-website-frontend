export interface PlaybookNavPill {
  id: string;
  label: string;
}

export interface PlaybookKpiCard {
  label: string;
  value: string;
  sub: string;
  accent?: "teal" | "blue" | "default";
}

export interface PlaybookCopyCampaign {
  id: string;
  tabLabel: string;
  keywordsTitle: string;
  keywordsBody: string;
  adTitle: string;
  adBody: string;
}

export interface LinkedInBurstCard {
  id: string;
  badgeText: string;
  badgeTone: "blue" | "teal" | "amber";
  title: string;
  description: string;
  copyTitle: string;
  copyBody: string;
}

export interface SocietyCalendarRow {
  society: string;
  channel: string;
  segment: string;
  triggerMoment: string;
}

export interface ArchiveMonthlySpotlight {
  id: string;
  tabLabel: string;
  boxTitle: string;
  body: string;
}

export interface GradClusterRow {
  discipline: string;
  count: string;
  institutions: string;
}

export interface OnsiteEvalRow {
  method: string;
  pros: string;
  cons: string;
  estAnnualNet: string;
  estAnnualSub?: string;
  adGrantSafe: string;
  adGrantNote: string;
  verdict: string;
  verdictTone: "yes" | "cond" | "no";
}

export interface HostPrototypeMock {
  id: string;
  tabLabel: string;
  logoSrc: string;
  logoAlt: string;
  fallbackText: string;
  kicker: string;
  title: string;
  description: string;
  tags: string[];
  ctaText: string;
  tone: "blue" | "teal";
}

export interface WhitelistUnderwriterSlot {
  eyebrow: string;
  logoSrc?: string;
  logoAlt?: string;
  fallbackText?: string;
  openBoxLine1?: string;
  openBoxLine2?: string;
  brandName: string;
  copy: string;
  footerLeft: string;
  footerRight: string;
  isOpen?: boolean;
}

export interface RoadmapPhaseRow {
  phase: string;
  window: string;
  siteState: string;
  paidActions: string;
  organicActions: string;
  owner: string;
  time: string;
}

export interface UtmPresetRow {
  id: string;
  channel: string;
  destination: string;
  url: string;
}

export interface ChecklistTaskItem {
  id: string;
  title: string;
  description: string;
}

export const PLAYBOOK_STORAGE_KEY = "hems_2027_marketing_checklist_v1";

export const PLAYBOOK_NAV_PILLS: PlaybookNavPill[] = [
  { id: "roi-simulator", label: "ROI & Budget Simulator" },
  { id: "section-1-ads", label: "1. Ad Grants, LinkedIn & Calendars" },
  { id: "section-2-multipliers", label: "2. Zero-Budget Multipliers" },
  { id: "section-3-extended", label: "3. Extended Growth Playbook" },
  { id: "section-4-onsite-ads", label: "4. On-Site Ads & Host Spots" },
  { id: "section-4-timeline", label: "5. 12-Month Calendar" },
  { id: "section-5-utm", label: "6. UTM & Analytics" },
  { id: "section-6-checklist", label: "Execution Checklist" },
];

export const PLAYBOOK_KPI_CARDS: PlaybookKpiCard[] = [
  {
    label: "Free Google Ad Grants",
    value: "$10,000 / mo",
    sub: "Up to $120,000/yr in free Google Search ads via Google for Nonprofits (~2–3 hr one-time setup).",
    accent: "teal",
  },
  {
    label: "Focused LinkedIn Ad Bursts",
    value: "$900 – $2,250",
    sub: "Three concentrated 21-day windows ($300–$750 each) instead of expensive year-round feeds.",
    accent: "blue",
  },
  {
    label: "Cash Break-Even Threshold",
    value: "1 – 2 Sponsors",
    sub: "At $1,350 Sponsor / $500 Professional / $250 Student registration rates, one new corporate table pays for an entire year of LinkedIn ads.",
    accent: "default",
  },
  {
    label: "Committee Time Footprint",
    value: "< 3 hrs / qtr",
    sub: "Batch-schedule 6 months of archive posts in 45 min; reuse ready emails, UTMs, and printable PDF flyers.",
    accent: "default",
  },
];

export const NEGATIVE_KEYWORD_SHIELD = `-helicopter
-air ambulance
-paramedic
-flight nurse
-medical transport
-trauma
-home energy management
-smart meter
-solar battery
-body mass
-salary
-job
-jobs
-career
-used ebay
-repair manual`;

export const GOOGLE_AD_GRANT_CAMPAIGNS: PlaybookCopyCampaign[] = [
  {
    id: "gag-cfp",
    tabLabel: "Campaign A: CFP & Symposium",
    keywordsTitle: "Keywords (Phrase & Exact Match) • Route: /call-for-papers",
    keywordsBody: `"portable mass spectrometry conference"
"field deployable mass spectrometer"
"harsh environment mass spectrometry"
"in situ mass spectrometry workshop"
"ruggedized mass spectrometer meeting"
"mass spectrometry symposium 2027"
"miniature mass analyzer conference"`,
    adTitle: "Responsive Search Ad Copy (Headlines ≤ 30 chars, Desc ≤ 90 chars)",
    adBody: `H1: 16th HEMS Workshop (Sep 2027)
H2: Field-Portable Mass Spec Forum
H3: Submit Your 1-Page Abstract
H4: Single-Track Instrumentation
D1: Join deep-ocean, planetary & tactical MS scientists. Explore the Call for Papers today.
D2: Academic, government & OEM researchers. Browse 436+ open talks & submit in 2027.
Final URL: https://www.hems-workshop.org/call-for-papers/?utm_source=google&utm_medium=cpc&utm_campaign=google-ad-grant-cfp-2027`,
  },
  {
    id: "gag-archive",
    tabLabel: "Campaign B: Archive Evergreen Engine",
    keywordsTitle: "Keywords • Route: /archive (Captures Daily Technical Search Volume Year-Round)",
    keywordsBody: `"underwater mass spectrometry MIMS"
"membrane inlet mass spectrometry"
"planetary mass spectrometer talks"
"miniature ion trap mass spectrometry"
"volcanic fumarole gas mass spectrometry"
"ROV AUV mass spectrometer payload"
"field deployable mass spectrometer papers"
"high pressure ionization mass spectrometry"`,
    adTitle: "Responsive Search Ad Copy • 1999–2025 Open-Access Archive",
    adBody: `H1: 436+ Field Mass Spec Talks
H2: Underwater & Space MS Archive
H3: 1999–2025 Open-Access PDFs
H4: Search HEMS Society Proceedings
D1: Free slides & technical abstracts on MIMS, AUVs, DraMS, UAV plumes & miniature vacuum MS.
D2: Full-text search across 25+ years of Harsh-Environment Mass Spectrometry research.
Final URL: https://www.hems-workshop.org/archive/?utm_source=google&utm_medium=cpc&utm_campaign=google-ad-grant-2027`,
  },
  {
    id: "gag-grants",
    tabLabel: "Campaign C: $1,500 Student Awards",
    keywordsTitle: "Keywords • Route: /student-awards ($1,500.00 Student Travel Grants)",
    keywordsBody: `"mass spectrometry student travel award"
"analytical chemistry travel grant 2027"
"oceanography graduate student travel award"
"planetary science instrumentation grant"
"chemistry conference student fellowship"`,
    adTitle: "Responsive Search Ad Copy • Student Travel Grant",
    adBody: `H1: $1,500 Student Travel Awards
H2: 16th HEMS Workshop (Sep 2027)
H3: For PhD & MS Researchers
H4: Only $250 Student Registration
D1: Present harsh-environment MS research. $1,500 travel support + direct OEM & NASA mentors.
D2: Analytical chemistry, marine & planetary grad students invited to apply for 2027 funding.
Final URL: https://www.hems-workshop.org/student-awards/?utm_source=google&utm_medium=cpc&utm_campaign=google-ad-grant-students-2027`,
  },
  {
    id: "gag-sponsor",
    tabLabel: "Campaign D: Corporate Exhibitors",
    keywordsTitle: "Keywords • Route: /corporate-sponsorship ($1,350 Exhibitor Tier)",
    keywordsBody: `"mass spectrometry conference sponsor"
"analytical instrumentation exhibitor event"
"field mass spectrometer vendor booth"
"compact vacuum pump conference sponsor"`,
    adTitle: "Responsive Search Ad Copy • Single-Track Sponsor Access",
    adBody: `H1: Sponsor the 16th HEMS Forum
H2: Reach Field MS Buyers Directly
H3: Single-Track Tabletop Access
H4: $1,350 Full Sponsor Package
D1: Put compact pumps, detectors & field analyzers in front of NASA, NOAA, DOD & WHOI buyers.
D2: Zero parallel-track dilution. Direct meals & tabletop networking for 52+ alumni OEMs.
Final URL: https://www.hems-workshop.org/corporate-sponsorship/?utm_source=google&utm_medium=cpc&utm_campaign=google-ad-grant-sponsors-2027`,
  },
];

export const LINKEDIN_AD_BURSTS: LinkedInBurstCard[] = [
  {
    id: "li-burst-1",
    badgeText: "Burst 1 • Spring 2027 (21 Days)",
    badgeTone: "blue",
    title: "Call for Papers Launch",
    description: "Target PIs, R&D engineers, national labs, and defense/space payload leads.",
    copyTitle: "Ad Text + UTM",
    copyBody: `Intro: Deploying mass spectrometers outside the lab? Call for Papers is now open for the 16th Biennial HEMS Workshop (Sep 2027). Single-track technical program covering subsea MIMS, planetary flyby optics, volcanic UAV plumes & miniature vacuum hardware. Submit a 1-page abstract or explore 25+ years of open talks:
Headline: 16th HEMS Workshop — Submit Your 1-Page Abstract
Image: Subsea ROV / UAV Plume Deployment Photo (1200x1200)
URL: https://www.hems-workshop.org/call-for-papers/?utm_source=linkedin&utm_medium=paid-social&utm_campaign=li-ad-cfp-2027`,
  },
  {
    id: "li-burst-2",
    badgeText: "Burst 2 • Late Spring 2027 (21 Days)",
    badgeTone: "teal",
    title: "$1,500 Student Travel Awards",
    description: "Target PhD/M.S. candidates & advisors in Analytical Chemistry, Oceanography & Planetary Science.",
    copyTitle: "Ad Text + UTM",
    copyBody: `Intro: Grad students in Analytical Chemistry, Oceanography, Earth & Planetary Science, or MS Instrumentation: apply for a $1,500.00 Student Travel Award to present at the 16th HEMS Workshop (Sep 2027). Student registration is just $250 with direct single-track mentorship from NASA, WHOI & OEM leaders.
Headline: Apply for a $1,500 HEMS Student Travel Award
Image: Student / Researcher Field MS Hardware Card (1200x1200)
URL: https://www.hems-workshop.org/student-awards/?print=1&utm_source=linkedin&utm_medium=paid-social&utm_campaign=li-ad-student-grants-2027`,
  },
  {
    id: "li-burst-3",
    badgeText: "Burst 3 • Summer 2027 (21 Days)",
    badgeTone: "amber",
    title: "Early-Bird & Sponsor Push",
    description: "Retarget site visitors + sponsor followers; promote $500 Early-Bird & $1,350 Exhibitor tables.",
    copyTitle: "Ad Text + UTM",
    copyBody: `Intro: Join 52+ corporate sponsors and leading harsh-environment MS groups at the 16th HEMS Workshop (Sep 2027). Every break, poster session, and meal puts your team face-to-face with hands-on instrumentation decision-makers. Reserve a $1,350 tabletop or lock in Early-Bird registration today.
Headline: Exhibit & Register — 16th HEMS Workshop (Sep 2027)
Image: Single-Track Symposium Networking + Hardware (1200x1200)
URL: https://www.hems-workshop.org/corporate-sponsorship/?utm_source=linkedin&utm_medium=paid-social&utm_campaign=li-ad-sponsors-reg-2027`,
  },
];

export const SOCIETY_CALENDARS: SocietyCalendarRow[] = [
  {
    society: "ASMS (American Society for Mass Spectrometry)",
    channel: "ASMS Upcoming Meetings Calendar + Field-Portable & Harsh-Environment MS Interest Group forum/session",
    segment: "Portable MS, miniature ion traps, ToF, ambient & field ionization engineers",
    triggerMoment: "Date lock + ASMS June annual meeting announcement",
  },
  {
    society: "AGU (American Geophysical Union)",
    channel: "Section Newsletters: Ocean Sciences (OS), Volcanology/Geochemistry (VGP), Planetary Sciences (P), Atmospheric (A)",
    segment: "Seafloor plumes, volcano gas monitoring, planetary flybys, atmospheric VOCs",
    triggerMoment: "CFP Open + Student Award Open",
  },
  {
    society: "MTS / IEEE OCEANS & OCB",
    channel: "MTS Marine Technology Calendar, IEEE OES Event Board, Ocean Carbon & Biogeochemistry (OCB) digest",
    segment: "AUV/ROV chemical sensor teams, subsea biogeochemistry labs",
    triggerMoment: "Save the Date + CFP Open",
  },
  {
    society: "Spectroscopy Online / The Analytical Scientist / LCGC",
    channel: "Free online \"Upcoming Events / Conferences\" editorial directories",
    segment: "Industrial R&D, pharmaceutical process MS, analytical instrumentation OEMs",
    triggerMoment: "Immediately after venue & dates confirmed",
  },
  {
    society: "Planetary Exploration Newsletter (PEN) & LPI",
    channel: "Weekly PEN email bulletin & Lunar and Planetary Institute Meeting Calendar",
    segment: "NASA JPL, GSFC, SwRI, APL flight instrument & biosignature teams",
    triggerMoment: "CFP Open + 3-week reminder before Abstract Deadline",
  },
  {
    society: "ACS Division of Analytical Chemistry (ANYL)",
    channel: "ANYL Member Newsletter & Instrumentation Subdivision announcements",
    segment: "Analytical Chemistry PhD students ($1,500 Student Award applicants) & faculty",
    triggerMoment: "Student Travel Award Launch",
  },
];

export const CALENDAR_SHORT_COPY = `16th Workshop on Harsh-Environment Mass Spectrometry (HEMS) — September 2027 ([Coastal Venue]). Sponsored by the 501(c)(3) HEMS Society, this intimate single-track symposium unites academic, government, and industrial engineers deploying mass spectrometers in deep-sea, spaceflight, volcanic, polar, and tactical environments. Call for 1-page abstracts and $1,500 Student Travel Awards open in 2027. Program details & open-access 1999–2025 archive: https://www.hems-workshop.org/layout-portal/?utm_source=society-calendar&utm_medium=referral&utm_campaign=hems-2027-listings`;

export const CALENDAR_LONG_COPY = `Call for Abstracts & $1,500 Student Travel Awards: 16th Biennial HEMS Workshop (September 2027)

The Harsh-Environment Mass Spectrometry (HEMS) Society invites abstract submissions for its 16th Workshop (September 2027). Operating since 1999 as a collaborative single-track forum without parallel sessions, HEMS focuses on ruggedized, low-power, field-deployable mass spectrometry across:
- Planetary & Spaceflight MS (ocean worlds, landers, dust & volatiles)
- Underwater & Marine Biogeochemistry (MIMS, AUV/ROV payloads)
- Atmospheric, Volcanic & Polar Plumes
- Miniature Analyzers, Vacuum Hardware & Onboard Deconvolution

Multiple $1,500.00 Student Travel Awards (with $250 student registration) are available to graduate and postdoctoral presenters. Submit abstracts, apply for travel support, or browse 436+ open-access proceedings talks (1999–2025) at https://www.hems-workshop.org/call-for-papers/?utm_source=society-newsletter&utm_medium=referral&utm_campaign=hems-2027-listings`;

export const ARCHIVE_MONTHLY_SPOTLIGHTS: ArchiveMonthlySpotlight[] = [
  {
    id: "arch-m1",
    tabLabel: "Month 1: Dragonfly / DraMS",
    boxTitle: "Month 1 Spotlight — Planetary Exploration (Dragonfly / DraMS on Titan)",
    body: `From the HEMS Proceedings Archive: Before an ion trap ever samples organic haze on Saturn's moon Titan aboard @NASA's Dragonfly rotorcraft, flight mass analyzer prototypes and gas-handling trade studies are stress-tested among peers at the Harsh-Environment Mass Spectrometry (HEMS) Workshop.

Read the open-access Dragonfly Mass Spectrometer (DraMS) slides from the 2019 HEMS Proceedings (free download, no login required):
https://www.hems-workshop.org/archive/2019/?src=linkedin-archive-share

@RyanDanell @NASA_Goddard @JHUAPL — Planning underway now for the 16th HEMS Workshop (Sep 2027). Join our community: https://www.linkedin.com/groups/4385091/
#MassSpectrometry #PlanetaryScience #SpaceInstrumentation #DragonflyMission #HEMSWorkshop`,
  },
  {
    id: "arch-m2",
    tabLabel: "Month 2: Icefin Under-Ice ROV",
    boxTitle: "Month 2 Spotlight — Cryosphere & Subsea Robotics (Icefin Under-Ice ROV)",
    body: `From the HEMS Proceedings Archive: How do you deploy chemical sensing through boreholes beneath hundreds of meters of Antarctic shelf ice?

Explore our open-access talks on Icefin under-ice ROV deployments and miniature subsea analyzers inside the HEMS Digital Archive (1999–2025):
https://www.hems-workshop.org/archive/?src=linkedin-archive-share

Tagging researchers pushing ocean-world analogs at @GeorgiaTech @CornellUniversity @WHOI — if your lab builds compact vacuum, inlet, or autonomous chemical payloads, save the date for the 16th HEMS Workshop in September 2027!
#Oceanography #UnderIceROV #MarineBiogeochemistry #MassSpectrometry #FieldInstrumentation`,
  },
  {
    id: "arch-m3",
    tabLabel: "Month 3: Volcanic Fumarole MS",
    boxTitle: "Month 3 Spotlight — Volcanic Fumarole & Extreme Corrosive Gas MS",
    body: `From the HEMS Proceedings Archive: Hot SO2, H2S, HF, and steam condensation will destroy standard benchtop filaments in minutes—yet real-time mass spectrometry at active volcanic fumaroles unlocks eruption forecasting.

See how HEMS investigators engineered rugged field inlets and corrosive-gas vacuum stages in our free digital proceedings archive:
https://www.hems-workshop.org/archive/?src=linkedin-archive-share

Tagging colleagues in volcanology & environmental analytical chemistry (@USGS @UniversityOfSouthFlorida). Join the 16th HEMS Workshop mailing list & LinkedIn group ahead of our 2027 Call for Papers!
#Volcanology #EnvironmentalChemistry #MassSpectrometry #FieldScience #HEMS`,
  },
  {
    id: "arch-m4",
    tabLabel: "Month 4: Deep-Sea MIMS",
    boxTitle: "Month 4 Spotlight — Deep-Sea Hydrothermal Plume & Subsea Lander MIMS",
    body: `From the HEMS Proceedings Archive: Operating a quadruple or ion trap mass spectrometer behind a PDMS membrane at 4,000 meters hydrostatic depth remains one of analytical chemistry's ultimate engineering challenges.

Browse the latest 2025 HEMS subsea lander & membrane-inlet mass spectrometry (MIMS) talks—including work by @WHOI @MBARI @SRIInternational:
https://www.hems-workshop.org/archive/2025/?src=linkedin-archive-share

Building dissolved-gas AUV or lander sensors? Watch hems-workshop.org/call-for-papers for our September 2027 abstract window.
#MIMS #DeepSeaScience #SubseaRobotics #AUV #MassSpectrometry`,
  },
  {
    id: "arch-m5",
    tabLabel: "Month 5: UAV Drone Plume MS",
    boxTitle: "Month 5 Spotlight — UAV Drone Plume & Tactical Mobile MS",
    body: `From the HEMS Proceedings Archive: Putting low-SWaP (size, weight & power) mass spectrometers onto multi-rotor UAVs and tactical vehicles turns atmospheric plumes into live 3D chemical heatmaps.

Explore UAV-mounted and mobile emergency-response MS proceedings across our 1999–2025 archive:
https://www.hems-workshop.org/archive/?src=linkedin-archive-share

Shoutout to instrument teams & vacuum OEMs making sub-15 W field MS possible (@UNT @Inficon @PfeifferVacuum @EdwardsVacuum). Student Travel Awards ($1,500) will open for the 16th HEMS Workshop in 2027!
#UAV #DroneSensors #PortableMS #TacticalMS #AnalyticalChemistry`,
  },
  {
    id: "arch-m6",
    tabLabel: "Month 6: 25-Yr Orbitrap & Archive",
    boxTitle: "Month 6 Spotlight — Spaceflight Orbitrap, Cycloidal MS & 25+ Years Open Access",
    body: `From 1999 to 2025, 15 workshops and 436+ open-access technical talks & abstracts are now full-text searchable on the new HEMS Society portal—from spaceflight Orbitrap & cycloidal trajectories to miniature turbopump vacuum engineering.

Search every slide deck and PDF by m/z, instrument type, or deployment domain:
https://www.hems-workshop.org/archive/?src=linkedin-archive-share

Grad students & postdocs: check out our $1,500 Student Travel Awards program for September 2027 → https://www.hems-workshop.org/student-awards/
#MassSpectrometry #Orbitrap #AnalyticalChemistry #GraduateResearch #HEMSSociety`,
  },
];

export const SPONSOR_KIT_EMAIL = `Subject: Thank you for sponsoring the 16th HEMS Workshop — Quick 1-click social kit

Hi [Marketing Contact / Technical Rep],

Thank you again for partnering with the HEMS Society for the 16th Workshop on Harsh-Environment Mass Spectrometry (September 2027)! We've attached your "We're Exhibiting at HEMS 2027" social badge graphic.

If your marketing team would like to share your participation on LinkedIn, here is ready-to-paste copy:

---
We're proud to sponsor and exhibit at the 16th Biennial Workshop on Harsh-Environment Mass Spectrometry (HEMS, September 2027)! Visit our tabletop in the single-track instrumentation hall to discuss rugged vacuum hardware, compact mass analyzers, and autonomous field deployments with scientists from NASA, NOAA, WHOI, and industry.

Learn more & join us: https://www.hems-workshop.org/corporate-sponsorship/?utm_source=sponsor&utm_medium=partner-referral&utm_campaign=sponsor-partner-kit-2027
#HEMSWorkshop #MassSpectrometry #FieldInstrumentation #AnalyticalChemistry
---

Warm regards,
Tim Short
Corporate Sponsorship Coordinator, HEMS Society (501(c)(3))`;

export const SPEAKER_KIT_EMAIL = `Share Your Accepted Presentation (Ready-to-Post on LinkedIn / X / Lab Group Page):

---
Thrilled to share that our abstract "[Insert Talk Title]" has been accepted for the 16th Workshop on Harsh-Environment Mass Spectrometry (HEMS, September 2027)! Looking forward to discussing real-world field mass spectrometry without parallel session tracks—alongside colleagues from academia, NASA, oceanography, and industry.

Program & Registration: https://www.hems-workshop.org/layout-portal/?utm_source=speaker&utm_medium=organic-social&utm_campaign=speaker-card-2027
#HEMSWorkshop #MassSpectrometry #FieldScience
---`;

export const GRAD_COORDINATOR_CLUSTERS: GradClusterRow[] = [
  {
    discipline: "Analytical Chemistry & MS Instrumentation",
    count: "14 Depts",
    institutions:
      "Purdue (Aston), Indiana, UNC, Florida, Ohio State, Texas A&M, Wisconsin, Colorado, Utah, Georgia Tech, Johns Hopkins, Washington, Michigan, NC State",
  },
  {
    discipline: "Chemical Oceanography & Subsea Eng.",
    count: "10 Depts",
    institutions:
      "WHOI / MIT Joint Program, Scripps (UCSD), USF Marine Science, MBARI/Moss Landing, UW Oceanography, Oregon State, URI GSO, Texas A&M Oceanography, Hawaii (UH Manoa), Rosenstiel (Miami)",
  },
  {
    discipline: "Planetary Science & Space Hardware",
    count: "10 Depts",
    institutions:
      "Caltech, MIT EAPS, Arizona (LPL), CU Boulder (LASP), Maryland, Johns Hopkins, ASU (SESE), Stanford, Cornell, SwRI/UTSA",
  },
  {
    discipline: "Atmospheric, Volcanology & Polar",
    count: "6 Depts",
    institutions:
      "UC Irvine, Harvard EPS, Alaska Fairbanks, Penn State, UNM Earth & Planetary, Montana State / Michigan Tech",
  },
];

export const GRAD_FLYER_EMAIL = `Subject: Please share with graduate students: $1,500 Mass Spectrometry Travel Awards (HEMS 2027)

Dear Graduate Program Coordinator,

Could you please forward the attached 1-page announcement to graduate students and faculty working in analytical chemistry, mass spectrometry, chemical instrumentation, oceanography, planetary science, or atmospheric/environmental field sensing?

The 501(c)(3) Harsh-Environment Mass Spectrometry (HEMS) Society is awarding multiple $1,500.00 Student Travel Awards (plus a discounted $250 student registration rate) for graduate and postdoctoral presenters at the 16th Biennial HEMS Workshop in September 2027.

Why students love HEMS:
- Single-track format (~100–140 attendees) with direct one-on-one mentoring from NASA, WHOI, national lab, and instrumentation industry leaders
- Full 1-page printable details & application info: https://www.hems-workshop.org/student-awards/?print=1&utm_source=grad-coord&utm_medium=email&utm_campaign=student-flyer-blitz-2027
- Open-access library of 436+ past talks: https://www.hems-workshop.org/archive/

Thank you for helping us reach new research groups!

Sincerely,
[President / Student Award Committee]
HEMS Society, Inc. (501(c)(3)) | president@hems-workshop.org`;

export const ONSITE_EVAL_ROWS: OnsiteEvalRow[] = [
  {
    method: "1. Permanent Free Host Showcase on /archive/[year]",
    pros: "Directly rewards institutions/companies that spend real money & staff time hosting a workshop; permanent visibility next to downloaded PDFs; powerful pitch when recruiting 2027/2029 hosts; builds .edu/.gov authority.",
    cons: "Requires keeping card height compact so schedules stay prominent, periodic link/merger maintenance, and explicit @bo archive-page unlock before @dev edits /archive/[year].",
    estAnnualNet: "$0 Cash Cost",
    estAnnualSub: "(Offsets Host Burden)",
    adGrantSafe: "Yes (100%)",
    adGrantNote: "IRC § 513(i) Exempt",
    verdict: "Approve & Roll Out",
    verdictTone: "yes",
  },
  {
    method: "2. First-Party HEMS Curated Whitelist (1–3 Native Slots)",
    pros: "Zero third-party scripts (CLS = 0); 0% ad-blocker loss; full Brand v3.2.0 typography; managed via HEMS Google Sheet / JSON + first-party click telemetry in /admin/analytics; keeps 100% of sponsor dollars.",
    cons: "Requires direct outreach by Corporate Sponsorship Coordinator (tim.short@hems-workshop.org) rather than passive plug-and-play ad inventory—easily bundled into annual sponsor tiers.",
    estAnnualNet: "$2,250 – $4,500 / yr",
    estAnnualSub: "(3 × $750–$1,500)",
    adGrantSafe: "Yes (100%)",
    adGrantNote: "IRC § 513(i) Exempt",
    verdict: "Recommended Winner",
    verdictTone: "yes",
  },
  {
    method: "3. Google Ad Manager (GAM Free Tier — Direct Whitelist Only, Backfill OFF)",
    pros: "Free up to 90M+ monthly impressions; provides flight dates, creative rotation, and native impression/CTR reports for whitelisted OEMs if HEMS ever rotates 5+ sponsor banners per slot.",
    cons: "Loads googletag / doubleclick.net scripts—blocked by ~35–45% of academic/engineer browsers via EasyList; steep UI overhead for volunteers; AdSense backfill must stay strictly OFF.",
    estAnnualNet: "$1,500 – $3,000 / yr",
    estAnnualSub: "(Reduced by Ad-Block)",
    adGrantSafe: "Conditional",
    adGrantNote: "Backfill Must Be OFF",
    verdict: "Overkill for 1–3 Spots",
    verdictTone: "cond",
  },
  {
    method: "4. Curated Ad Networks (EthicalAds / BuySellAds)",
    pros: "Tasteful small developer/tech card units; EthicalAds avoids invasive cookie tracking; BSA manages invoicing & advertiser billing automatically.",
    cons: "EthicalAds requires 50,000+ monthly pageviews and targets software developers, not analytical chemists. BSA rarely approves low-traffic scholarly sites, takes a 25% fee, injects external ad scripts risking Ad Grants, and yields ~$12–$25/mo on niche conference traffic.",
    estAnnualNet: "$150 – $350 / yr",
    estAnnualSub: "(Even if Approved)",
    adGrantSafe: "High Risk",
    adGrantNote: "3rd-Party Ad Scripts",
    verdict: "Not Recommended",
    verdictTone: "no",
  },
  {
    method: "5. Open Programmatic Display (Google AdSense / RTB)",
    pros: "Minimal setup time; fills 100% of unsold pageviews automatically across global visitors.",
    cons: "Directly prohibited alongside Google Ad Grants; exposes researchers to unrelated consumer retargeting (shoes, insurance), breaks scholarly credibility, degrades page speed, and triggers UBIT.",
    estAnnualNet: "< $200 / yr",
    estAnnualSub: "(Risks $120k Grant)",
    adGrantSafe: "No (Prohibited)",
    adGrantNote: "Policy Suspension",
    verdict: "Do Not Use",
    verdictTone: "no",
  },
];

export const HOST_PROTOTYPE_MOCKS: HostPrototypeMock[] = [
  {
    id: "host-mock-corporate",
    tabLabel: "Preview A: Corporate Host (/archive/2025)",
    logoSrc: "/images/sponsors/Pfeiffer_Vacuum.png",
    logoAlt: "Pfeiffer Vacuum official host emblem",
    fallbackText: "Pfeiffer Vacuum",
    kicker: "Permanent Workshop Host & Institutional Patron • 15th HEMS (2025)",
    title: "Hosted by Pfeiffer Vacuum",
    description:
      "Underwrote local organization and technical forum hospitality in Virginia Beach, Virginia • Supporting compact turbomolecular pumping, leak detection, and ruggedized vacuum subsystems for field mass spectrometry.",
    tags: ["Free Host Reward Tier", "Virginia Beach, VA", "IRC § 513(i) Exempt Attribution"],
    ctaText: "Visit Host Website →",
    tone: "blue",
  },
  {
    id: "host-mock-academic",
    tabLabel: "Preview B: Institutional Lab Host (/archive/2002)",
    logoSrc: "/images/sponsors/Jet_Propulsion_Laboratory_NASA.png",
    logoAlt: "NASA Jet Propulsion Laboratory emblem",
    fallbackText: "NASA JPL",
    kicker: "Permanent Workshop Host & Research Patron • 4th HEMS (2002)",
    title: "Hosted by Jet Propulsion Laboratory / NASA",
    description:
      "Hosted the 2002 technical sessions and flight-instrumentation discussions in Pasadena, California • Advancing planetary mass analyzers, low-power sample inlets, and ocean-world volatile sensing.",
    tags: ["Permanent .gov Showcase", "Pasadena, CA", "Archives Co-Citation Hub"],
    ctaText: "Visit Host Lab →",
    tone: "teal",
  },
];

export const ONSITE_PITCH_COPY = `Two New Digital Recognition Options for 2027 Partners & Hosts:

1. Permanent Workshop Host Showcase ($0 Fee for Hosting Institutions/Firms):
As appreciation for underwriting local venue and hospitality commitments, the 2027 Workshop Host receives a permanent institutional recognition card on its official /archive/2027/ proceedings page alongside workshop talks and PDFs—permanently accessible to global researchers.

2. Annual "Digital Archive Underwriter" Whitelist Spot ($1,000/yr, Limited to 3 OEMs):
Support year-round open access for HEMS's 436+ technical papers (1999–2025) with a tasteful, ad-blocker-proof Specimen White recognition card on our Archive & Workshop portals (logo, neutral technical focus, and tracked outbound link + annual engagement summary inside HEMS Analytics).`;

export const WHITELIST_UNDERWRITER_SLOTS: WhitelistUnderwriterSlot[] = [
  {
    eyebrow: "Spot 1 • /archive Rail • Underwriter",
    logoSrc: "/images/sponsors/Inficon.png",
    logoAlt: "INFICON logo example",
    fallbackText: "INFICON",
    brandName: "INFICON — Portable GC/MS Systems",
    copy: "Digital Archive Underwriter supporting open-access field mass spectrometry proceedings. Compact field-portable GC/MS hardware & vacuum gauging.",
    footerLeft: "Partner since 1999 • IRC § 513(i) Neutral",
    footerRight: "Visit Site →",
  },
  {
    eyebrow: "Spot 2 • Workshop & CFP Portal • Underwriter",
    logoSrc: "/images/sponsors/BaySpec.png",
    logoAlt: "BaySpec logo example",
    fallbackText: "BaySpec",
    brandName: "BaySpec — Portable Linear Ion Traps",
    copy: "Instrumentation Underwriter for the 16th Workshop cycle. Miniature field-portable mass spectrometers & ambient ionization modules.",
    footerLeft: "Partner since 2015 • Tracked via /analytics",
    footerRight: "Visit Site →",
  },
  {
    eyebrow: "Spot 3 • /student-awards & Portal • Open",
    openBoxLine1: "Your OEM Crest",
    openBoxLine2: "264 × 104 px PNG",
    brandName: "2027 Digital Archive & Fellowship Slot (Open)",
    copy: "12-month curated placement alongside $1,500 Student Travel Awards & 436+ open-access proceedings talks. Recommended tier: $750–$1,500/yr or bundled with Exhibitor Tier.",
    footerLeft: "Strictly 3 Whitelisted OEMs Max",
    footerRight: "Inquire via Tim Short →",
    isOpen: true,
  },
];

export const TWELVE_MONTH_ROADMAP: RoadmapPhaseRow[] = [
  {
    phase: "Phase 1: Foundation & Evergreen Engine",
    window: "Nov 2026 – Feb 2027",
    siteState: "save_the_date",
    paidActions:
      "Complete Google for Nonprofits 501(c)(3) verification; launch Archive Evergreen + Student Awards Google Ad Grant campaigns ($0 cash); link GA4 conversions.",
    organicActions:
      "First 45-min batch schedule of 6 Monthly Archive LinkedIn Posts; verify Search Console XML sitemap indexing & Knowledge Graph.",
    owner: "Webmaster + Board",
    time: "~3 hrs once",
  },
  {
    phase: "Phase 2: Dates/Venue Lock & Calendars",
    window: "Spring 2027",
    siteState: "save_the_date (Dates Confirmed)",
    paidActions:
      "Update Google Ads sitelinks with confirmed Coastal Venue & Sep 2027 dates; upload latest /operations/mailing-list CSV into LinkedIn Matched Audiences.",
    organicActions:
      "Submit event listing to ASMS, AGU, MTS/IEEE OCEANS, PEN, Spectroscopy Online & Analytical Scientist calendars; send sponsor early prospectus.",
    owner: "Board + Tim Short",
    time: "~2 hrs total",
  },
  {
    phase: "Phase 3: CFP & Student Grant Blitz",
    window: "Late Spring 2027",
    siteState: "cfp_open",
    paidActions:
      "Launch LinkedIn Burst 1 (CFP Launch, $300–$750, 21 days) + LinkedIn Burst 2 ($1,500 Student Awards, $300–$750, 21 days) + activate Google Ad Grant CFP campaign.",
    organicActions:
      "Send /student-awards/?print=1 PDF flyer to 40 Graduate Coordinators; deploy ASMS final-slide QR cards; send Alumni reactivation blast via /operations/announcements.",
    owner: "President + Board",
    time: "~2.5 hrs total",
  },
  {
    phase: "Phase 4: Early-Bird & Exhibitor Close",
    window: "Summer 2027",
    siteState: "registration_open",
    paidActions:
      "Launch LinkedIn Burst 3 (Early-Bird $500 & $1,350 Exhibitor Push, $300–$750, 21 days) retargeting warm site visitors & co-authors; enable Exhibitor Google Ads.",
    organicActions:
      "Distribute 1-Click LinkedIn Promo Kits to all confirmed sponsors & accepted oral/poster speakers; batch-schedule second 6-month LinkedIn archive queue.",
    owner: "Tim Short + Reviewer Chair",
    time: "~1.5 hrs total",
  },
  {
    phase: "Phase 5: Final Countdown & Post-Event",
    window: "Aug – Oct 2027",
    siteState: "Active Workshop & Proceedings",
    paidActions:
      "Pause LinkedIn Burst 3 at room-block/reg cutoff; keep evergreen Google Ad Grant focused on Proceedings & Archive year-round.",
    organicActions:
      "Publish \"Hardware Floor Preview\" post; run post-workshop thank-you tagging Student Awardees & 2027 Sponsors within 48 hrs of closing.",
    owner: "Board",
    time: "~1 hr total",
  },
];

export const PREBUILT_UTM_LINKS: UtmPresetRow[] = [
  {
    id: "utm-gag",
    channel: "Google Ad Grant (501c3 Evergreen)",
    destination: "Proceedings Archive",
    url: "https://www.hems-workshop.org/archive/?utm_source=google&utm_medium=cpc&utm_campaign=google-ad-grant-2027",
  },
  {
    id: "utm-li-cfp",
    channel: "LinkedIn Burst 1: Call for Papers",
    destination: "Call for Papers",
    url: "https://www.hems-workshop.org/call-for-papers/?utm_source=linkedin&utm_medium=paid-social&utm_campaign=li-ad-cfp-2027",
  },
  {
    id: "utm-li-grants",
    channel: "LinkedIn Burst 2: Student Travel Grants",
    destination: "Printable Award Flyer",
    url: "https://www.hems-workshop.org/student-awards/?print=1&utm_source=linkedin&utm_medium=paid-social&utm_campaign=li-ad-student-grants-2027",
  },
  {
    id: "utm-sponsor",
    channel: "LinkedIn Burst 3 / Sponsor Promo Kit",
    destination: "Corporate Sponsorship",
    url: "https://www.hems-workshop.org/corporate-sponsorship/?utm_source=sponsor&utm_medium=partner-referral&utm_campaign=sponsor-partner-kit-2027",
  },
  {
    id: "utm-grad",
    channel: "40 Grad Coordinator Flyer Blitz",
    destination: "Printable Award Flyer",
    url: "https://www.hems-workshop.org/student-awards/?print=1&utm_source=grad-coord&utm_medium=email&utm_campaign=student-flyer-blitz-2027",
  },
  {
    id: "utm-li-group",
    channel: "HEMS LinkedIn Group Organic Post",
    destination: "16th Workshop Hub",
    url: "https://www.hems-workshop.org/layout-portal/?utm_source=linkedin&utm_medium=organic-social&utm_campaign=linkedin-group-post",
  },
  {
    id: "utm-cal",
    channel: "ASMS / AGU Society Calendars",
    destination: "16th Workshop Hub",
    url: "https://www.hems-workshop.org/layout-portal/?utm_source=society-calendar&utm_medium=referral&utm_campaign=hems-2027-listings",
  },
  {
    id: "utm-whitelist",
    channel: "Archive Host Showcase / Whitelist Underwriter Slot",
    destination: "Corporate Sponsorship",
    url: "https://www.hems-workshop.org/corporate-sponsorship/?utm_source=hems-archive&utm_medium=whitelist-slot&utm_campaign=archive-underwriter-2027",
  },
];

export const EXECUTION_CHECKLIST_TRACK_A: ChecklistTaskItem[] = [
  {
    id: "t1",
    title: "Verify 501(c)(3) status on Google for Nonprofits",
    description: "Enroll HEMS Society EIN & request Google Ad Grants ($10,000/mo free account).",
  },
  {
    id: "t2",
    title: "Link GA4 Conversions to Google Ad Grants",
    description: "Enable mailing_signup, outbound_click & mailto_click conversions + Maximize Conversions bidding.",
  },
  {
    id: "t3",
    title: "Apply Account-Level HEMS Medical Negative Shield",
    description: "Block helicopter, paramedic, EMS & home-energy terms so CTR stays above 5%.",
  },
  {
    id: "t4",
    title: "Launch Evergreen Archive + Student Award Search Campaigns",
    description: "Capture technical search traffic to /archive & /student-awards immediately.",
  },
  {
    id: "t5",
    title: "Export Mailing List CSV & Upload LinkedIn Matched Audience",
    description: "Build retargeting + 1% Lookalike audience; disable Audience Network & Expansion.",
  },
  {
    id: "t6",
    title: "Schedule LinkedIn Burst 1 (CFP Launch — Spring 2027)",
    description: "21 days, $300–$750 budget, Manual CPC $4.50–$6.00 routing to /call-for-papers.",
  },
  {
    id: "t7",
    title: "Schedule LinkedIn Burst 2 ($1,500 Student Travel Grants)",
    description: "21 days targeting Analytical Chem, Oceanography & Planetary Science grad/faculty roles.",
  },
  {
    id: "t8",
    title: "Schedule LinkedIn Burst 3 (Early-Bird Reg & Sponsors)",
    description: "21 days retargeting warm site visitors & followers of HEMS's 52 corporate sponsors.",
  },
  {
    id: "t9",
    title: "Verify Google Search Console Sitemap & Campaign UTMs",
    description: "Audit top performing UTMs monthly inside Board Portal → Website Analytics (/admin/analytics).",
  },
  {
    id: "t20",
    title: "Offer 1–3 Annual IRC § 513(i) Underwriter Whitelist Slots ($750–$1,500/yr)",
    description: "Keep AdSense/3rd-party ad-network scripts off domain so the $10k/mo Ad Grant stays 100% protected.",
  },
];

export const EXECUTION_CHECKLIST_TRACK_B: ChecklistTaskItem[] = [
  {
    id: "t10",
    title: "Submit 16th Workshop to ASMS & Field-Portable Interest Group",
    description: "Post confirmed 2027 dates + link to /layout-portal in ASMS Upcoming Meetings Calendar.",
  },
  {
    id: "t11",
    title: "Submit Free Listings to AGU, MTS/IEEE OCEANS, PEN & Trade Portals",
    description: "Send 65-word / 140-word copy to AGU OS/VGP/P, Spectroscopy Online & Analytical Scientist.",
  },
  {
    id: "t12",
    title: "Batch-Schedule 6 Months of Archive LinkedIn Posts (45 Mins)",
    description: "Use /archive Cite/Share drafts for DraMS, Icefin, Volcanic MS, Deep-Sea MIMS & tag OEMs.",
  },
  {
    id: "t13",
    title: "Generate 1-Click LinkedIn Promo Cards (Sponsor + Speaker Editions)",
    description: "Prepare PNG graphic badges paired with ?utm_source=sponsor & ?utm_source=speaker.",
  },
  {
    id: "t14",
    title: "Send Promo Kit to Confirmed Sponsors & Accepted Speakers",
    description: "Tim Short sends to sponsors; Reviewer Chair inserts snippet into speaker acceptance letters.",
  },
  {
    id: "t15",
    title: "Export /student-awards/?print=1 1-Page Flyer PDF",
    description: "Verify $1,500.00 award & $250 student registration rate render cleanly onto 1 letter page.",
  },
  {
    id: "t16",
    title: "Email Student Flyer to 40 Graduate Program Coordinators",
    description: "Dispatch across Analytical Chem (14), Oceanography (10), Planetary (10) & Polar/Volcano (6).",
  },
  {
    id: "t17",
    title: "Circulate Standard HEMS QR Conclusion Slide to Board",
    description: "Include QR + CFP link on every committee member's ASMS, AGU & university seminar deck.",
  },
  {
    id: "t18",
    title: "Send Cohort-Segmented Reactivation via /operations/announcements",
    description: "Target lapsed 1999–2023 alumni, past sponsors & past student awardees separately.",
  },
  {
    id: "t19",
    title: "Approve Permanent Host Showcase Spec for 2027 Host Prospectus",
    description: "Grant @dev explicit @bo archive unlock when ready to upgrade /archive/[year] host_corporation cards.",
  },
];
