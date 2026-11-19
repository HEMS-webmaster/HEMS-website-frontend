import type {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
} from "@/types/abstractSubmission";
import { buildReviewId } from "@/utils/abstractReviewMetrics";

const SUBMISSION_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const INITIAL_SAMPLE_SUBMISSIONS: AbstractSubmissionRecord[] = [
  {
    id: "ABS-2027-001",
    workshopYear: 2027,
    title:
      "A Miniature Quadrupole Mass Filter for Deep-Ocean Hydrocarbon & Hydrothermal Plume Mapping",
    presentingAuthor: "Dr. Alice Vance",
    correspondingEmail: "avance@whoi.example.org",
    affiliation: "Woods Hole Oceanographic Institution",
    coAuthors: "M. Alvarez, K. Sato",
    affiliations: [
      {
        id: "aff-1",
        institution: "Woods Hole Oceanographic Institution",
        location: "Woods Hole, MA, USA",
      },
      {
        id: "aff-2",
        institution: "Monterey Bay Aquarium Research Institute",
        location: "Moss Landing, CA, USA",
      },
    ],
    authors: [
      { id: "auth-1", name: "Dr. Alice Vance", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "M. Alvarez", affiliationId: "aff-1", isPresenter: false },
      { id: "auth-3", name: "K. Sato", affiliationId: "aff-2", isPresenter: false },
    ],
    presentationFormat: "Oral Presentation",
    presenterCategory: "academic",
    researchTrack: "Underwater & Marine Biogeochemistry",
    recommendedTrack: "Underwater & Marine Biogeochemistry",
    summary:
      "AUV-integrated membrane-inlet quadrupole calibrated for real-time C₁–C₇ alkane, BTEX, and dissolved CO₂ profiling to 4,000 m depth.",
    abstractText:
      "In-situ geochemical mapping of hydrothermal vents and subseafloor hydrocarbon seeps requires compact mass analyzers capable of continuous dissolved-gas quantification at 40 MPa hydrostatic head. We present a <b>14 W triple-filter hyperbolic quadrupole</b> (<i>m/z</i> 2–200, Δm = 0.6 Da at FWHM) coupled behind a reinforced 25 μm polydimethylsiloxane (PDMS) capillary membrane inlet heated to 45 °C.\n\nBy stabilizing source electron emission at 70 eV and regulating foreline pressure to 1.4 × 10<sup>-6</sup> Torr via a Ti-housing turbomolecular drag stage, permeation response times (τ<sub>90</sub>) dropped below 18 s for CH<sub>4</sub>, C<sub>2</sub>H<sub>6</sub>, benzene, and toluene. Across 42 hours of autonomous seabed deployment in the Guaymas Basin, calibrated sensitivity reached 1.2 nmol·L<sup>-1</sup> for dissolved CO<sub>2</sub> and H<sub>2</sub>S while resolving δ<sup>13</sup>C-CH<sub>4</sub> within ±1.8‰.",
    keywords: "subsea mass spectrometry, MIMS, AUV, hydrothermal plumes, C1-C7 hydrocarbons",
    presenterBio:
      "Dr. Alice Vance is an Associate Scientist in the Department of Applied Ocean Physics & Engineering at WHOI, leading in-situ chemical sensor integration on deep-submergence autonomous underwater vehicles.",
    studentTravelAwardApplicant: false,
    submittedByUid: "sample-001",
    submittedByEmail: "avance@whoi.example.org",
    submittedAt: "2026-10-14T16:20:00.000Z",
    updatedAt: "2026-10-20T15:30:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Reviewed",
    decision: "Accept (Oral)",
    committeeSelection: "accept_oral",
    selectionVersion: 1,
    selectionUpdatedAt: "2026-10-25T16:00:00.000Z",
    selectionUpdatedBy: "ksato@hems-workshop.org",
    score: 8.8,
    hemsFitness: 9.3,
    reviewedBy: "ksato@hems-workshop.org",
    reviewedAt: "2026-10-20T15:30:00.000Z",
    isSampleSeed: true,
  },
  {
    id: "ABS-2027-002",
    workshopYear: 2027,
    title:
      "Atmospheric Pre-Concentration of Trace VOCs in Polar Firn Air Using Cylindrical Ion Trap Arrays",
    presentingAuthor: "Prof. Robert Chen",
    correspondingEmail: "rchen@ucsd.example.edu",
    affiliation: "Scripps Institution of Oceanography, UC San Diego",
    coAuthors: "J. Nguyen, L. Park",
    affiliations: [
      {
        id: "aff-1",
        institution: "Scripps Institution of Oceanography, UC San Diego",
        location: "La Jolla, CA, USA",
      },
      {
        id: "aff-2",
        institution: "University of Colorado Boulder, INSTAAR",
        location: "Boulder, CO, USA",
      },
    ],
    authors: [
      { id: "auth-1", name: "Prof. Robert Chen", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "J. Nguyen", affiliationId: "aff-1", isPresenter: false },
      { id: "auth-3", name: "L. Park", affiliationId: "aff-2", isPresenter: false },
    ],
    presentationFormat: "Oral Presentation",
    presenterCategory: "academic",
    researchTrack: "Atmospheric, Volcanic & Environmental",
    recommendedTrack: "Atmospheric, Volcanic & Environmental",
    summary:
      "Cold-tolerant PDMS membrane pre-concentrators coupled with a 12 W cylindrical ion trap MS during polar firn air field campaigns.",
    abstractText:
      "Quantifying volatile organic halocarbons and biogenic sulfur species in polar firn air at -35 °C demands sub-pptv detection limits without liquid cryogens or bulky cylinder banks. We fabricated a 4-channel micro-machined cylindrical ion trap array (r<sub>0</sub> = 2.5 mm) integrated with a dual-bed Carboxen/PDMS thermal desorption trap consuming ≤12 W average power.\n\nFollowing the Mathieu stability criterion $q_z = \\frac{4eV}{m r_0^2 \\Omega^2}$ at Ω/2π = 1.45 MHz, resonance ejection scans achieved unit mass resolution through <i>m/z</i> 310 with duty cycles exceeding 65%. Field deployment at Summit Station demonstrated linear calibration (R<sup>2</sup> = 0.998) across 5–500 pptv for DMS, CH<sub>3</sub>Br, and trichlorofluoromethane.",
    keywords: "cylindrical ion trap, polar firn air, trace VOCs, thermal desorption, cryogen-free",
    presenterBio:
      "Prof. Robert Chen directs the Field Analytical Atmospheric Chemistry Laboratory at Scripps Institution of Oceanography, focusing on autonomous polar and alpine trace-gas instrumentation.",
    studentTravelAwardApplicant: false,
    submittedByUid: "sample-002",
    submittedByEmail: "rchen@ucsd.example.edu",
    submittedAt: "2026-10-19T11:05:00.000Z",
    updatedAt: "2026-10-22T14:40:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Reviewed",
    decision: "Accept (Oral)",
    committeeSelection: "accept_oral",
    selectionVersion: 1,
    selectionUpdatedAt: "2026-10-25T16:05:00.000Z",
    selectionUpdatedBy: "ksato@hems-workshop.org",
    score: 8.5,
    hemsFitness: 9.0,
    reviewerComments: "Strong field validation dataset under sub-zero operating conditions.",
    reviewedBy: "reviewer@hems-workshop.org",
    reviewedAt: "2026-10-22T14:40:00.000Z",
    isSampleSeed: true,
  },
  {
    id: "ABS-2027-003",
    workshopYear: 2027,
    title:
      "Linearized Time-of-Flight Ion Optics Refinements for Ocean-World Plume Flyby Landers",
    presentingAuthor: "Elena Rostova",
    correspondingEmail: "erostova@jpl.example.gov",
    affiliation: "NASA Jet Propulsion Laboratory / Caltech",
    coAuthors: "D. Patel",
    affiliations: [
      {
        id: "aff-1",
        institution: "NASA Jet Propulsion Laboratory / Caltech",
        location: "Pasadena, CA, USA",
      },
    ],
    authors: [
      { id: "auth-1", name: "Elena Rostova", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "D. Patel", affiliationId: "aff-1", isPresenter: false },
    ],
    presentationFormat: "Poster Presentation",
    presenterCategory: "student",
    researchTrack: "Planetary & Spaceflight MS",
    recommendedTrack: "Planetary & Spaceflight MS",
    summary:
      "Dual-stage reflectron mass resolution vs. cryogenic gas load constraints for hypervelocity ice-grain sampling on Enceladus.",
    abstractText:
      "Hypervelocity flybys (3–6 km·s<sup>-1</sup>) through icy moon plumes generate transient impact ionization bursts characterized by wide axial energy spreads (ΔE ≥ 35 eV) alongside high H<sub>2</sub>O vapor densities. Using SIMION 8.2 Monte Carlo ray tracing and laboratory laser-desorption analogs, we optimized a compact dual-stage gridless reflectron ToF analyzer with a total flight path <i>L</i> = 240 mm.\n\nUnder the kinetic time-focusing relation $\\frac{m}{z} = \\frac{2Vt^2}{L^2}$, second-order energy compensation preserved mass resolving power m/Δm > 2,400 across <i>m/z</i> 18–500 (including protonated amino-acid clusters [M+H]<sup>+</sup>) even during transient 2.1 × 10<sup>-5</sup> Torr gas loads.",
    keywords: "time-of-flight, reflectron, Enceladus, impact ionization, planetary mass spectrometry",
    presenterBio:
      "Elena Rostova is a Ph.D. candidate in Planetary Instrumentation at Caltech and NASA JPL researching miniaturized reflectron optics for ocean-world biosignature detection.",
    studentTravelAwardApplicant: true,
    submittedByUid: "sample-003",
    submittedByEmail: "erostova@jpl.example.gov",
    submittedAt: "2026-10-28T09:15:00.000Z",
    updatedAt: "2026-10-28T09:15:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Pending",
    decision: "Pending",
    committeeSelection: "pending",
    selectionVersion: 0,
    isSampleSeed: true,
  },
  {
    id: "ABS-2027-S04",
    workshopYear: 2027,
    title:
      "Autonomous Aerosol-Inlet Ion Trap Analyzer for Field Industrial Emissions & Hazard Screening",
    presentingAuthor: "Dr. Gregor Kibelka",
    correspondingEmail: "gkibelka@detect-ion.example.com",
    affiliation: "Detect-ION, Inc.",
    coAuthors: "H. Lindqvist",
    affiliations: [
      {
        id: "aff-1",
        institution: "Detect-ION, Inc.",
        location: "Tampa, FL, USA",
      },
    ],
    authors: [
      { id: "auth-1", name: "Dr. Gregor Kibelka", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "H. Lindqvist", affiliationId: "aff-1", isPresenter: false },
    ],
    presentationFormat: "Poster Presentation",
    presenterCategory: "corporate",
    researchTrack: "Miscellaneous",
    recommendedTrack: "Miscellaneous",
    summary:
      "Ruggedized corporate hardware platform integrating direct aerodynamic aerosol focusing with dual-polarity ion trap MS/MS.",
    abstractText:
      "Rapid emergency response around petrochemical facilities requires direct particulate and semi-volatile vapor analysis without sample preparation. We demonstrate a man-portable 14 kg instrument pairing an aerodynamic lens aerosol concentrator with a linear ion trap capable of rapid MS<sup>2</sup> confirmation from <i>m/z</i> 40 to 650.\n\nAcross 180 unattended perimeter air cycles, false-alarm rates remained under 0.4% at sub-ppbv limits of detection for organophosphates and polycyclic aromatics.",
    keywords: "aerosol inlet, portable mass spectrometer, corporate R&D, perimeter monitoring, MS/MS",
    presenterBio:
      "Dr. Gregor Kibelka is Principal Scientist at Detect-ION, Inc., developing ruggedized aerosol and vapor mass spectrometry instruments for emergency responders.",
    studentTravelAwardApplicant: false,
    submittedByUid: "sample-004",
    submittedByEmail: "gkibelka@detect-ion.example.com",
    submittedAt: "2026-10-29T14:10:00.000Z",
    updatedAt: "2026-11-01T10:15:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Reviewed",
    decision: "Accept (Poster)",
    committeeSelection: "accept_poster",
    selectionVersion: 1,
    selectionUpdatedAt: "2026-11-01T10:15:00.000Z",
    selectionUpdatedBy: "ksato@hems-workshop.org",
    score: 8.4,
    hemsFitness: 8.9,
    reviewedBy: "ksato@hems-workshop.org",
    reviewedAt: "2026-11-01T10:15:00.000Z",
    isSampleSeed: true,
  },
];

export const INITIAL_SAMPLE_REVIEWS: AbstractReviewRecord[] = [
  {
    reviewId: buildReviewId("ABS-2027-001", "ksato@hems-workshop.org"),
    submissionId: "ABS-2027-001",
    reviewerEmail: "ksato@hems-workshop.org",
    reviewerName: "Dr. Kenji Sato",
    score: 9.0,
    hemsFitness: 9.5,
    decision: "Accept (Oral)",
    recommendedTrack: "Underwater & Marine Biogeochemistry",
    isCompleted: true,
    completedAt: "2026-10-20T15:30:00.000Z",
    reviewerComments:
      "14 W triple-filter quadrupole behind a reinforced 25 μm PDMS membrane directly addresses subsea 4,000 m endurance and δ13C precision goals.",
    privateNotes:
      "Strong opening-day marine MS anchor candidate; confirm whether AUV dive telemetry video is cleared for release.",
    createdAt: "2026-10-20T15:30:00.000Z",
    updatedAt: "2026-10-20T15:30:00.000Z",
    isSampleSeed: true,
  },
  {
    reviewId: buildReviewId("ABS-2027-001", "emorales@hems-workshop.org"),
    submissionId: "ABS-2027-001",
    reviewerEmail: "emorales@hems-workshop.org",
    reviewerName: "Dr. Elena Morales",
    score: 8.5,
    hemsFitness: 9.0,
    decision: "Accept (Oral)",
    recommendedTrack: "Underwater & Marine Biogeochemistry",
    isCompleted: true,
    completedAt: "2026-10-21T09:15:00.000Z",
    reviewerComments:
      "Compelling 42-hour seabed validation in the Guaymas Basin with < 18 s permeation lag.",
    privateNotes:
      "Pairs cleanly alongside subsea lander instrumentation talks in the marine session.",
    createdAt: "2026-10-21T09:15:00.000Z",
    updatedAt: "2026-10-21T09:15:00.000Z",
    isSampleSeed: true,
  },
  {
    reviewId: buildReviewId("ABS-2027-002", "reviewer@hems-workshop.org"),
    submissionId: "ABS-2027-002",
    reviewerEmail: "reviewer@hems-workshop.org",
    reviewerName: "Program Committee Reviewer",
    score: 8.5,
    hemsFitness: 9.0,
    decision: "Accept (Oral)",
    recommendedTrack: "Atmospheric, Volcanic & Environmental",
    isCompleted: false,
    reviewerComments:
      "Strong field validation dataset under sub-zero operating conditions.",
    privateNotes:
      "Strong anchor talk for the Atmospheric & Cryospheric session.",
    createdAt: "2026-10-22T14:40:00.000Z",
    updatedAt: "2026-10-22T14:40:00.000Z",
    isSampleSeed: true,
  },
  {
    reviewId: buildReviewId("ABS-2027-002", "ksato@hems-workshop.org"),
    submissionId: "ABS-2027-002",
    reviewerEmail: "ksato@hems-workshop.org",
    reviewerName: "Dr. Kenji Sato",
    score: 9.0,
    hemsFitness: 9.5,
    decision: "Accept (Oral)",
    recommendedTrack: "Atmospheric, Volcanic & Environmental",
    isCompleted: true,
    completedAt: "2026-10-23T11:20:00.000Z",
    reviewerComments:
      "Cryogen-free 12 W thermal desorption + CIT array directly targets polar deployment constraints.",
    privateNotes:
      "Ask authors if cold-soak startup telemetry can be included in slides.",
    createdAt: "2026-10-23T11:20:00.000Z",
    updatedAt: "2026-10-23T11:20:00.000Z",
    isSampleSeed: true,
  },
  {
    reviewId: buildReviewId("ABS-2027-002", "emorales@hems-workshop.org"),
    submissionId: "ABS-2027-002",
    reviewerEmail: "emorales@hems-workshop.org",
    reviewerName: "Dr. Elena Morales",
    score: 8.0,
    hemsFitness: 8.5,
    decision: "Accept (Poster)",
    recommendedTrack: "Atmospheric, Volcanic & Environmental",
    isCompleted: true,
    completedAt: "2026-10-24T17:05:00.000Z",
    reviewerComments:
      "Well-calibrated Mathieu stability curves; blank carryover plots would strengthen oral presentation.",
    privateNotes:
      "Backup headline poster if oral session exceeds 18 slots.",
    createdAt: "2026-10-24T17:05:00.000Z",
    updatedAt: "2026-10-24T17:05:00.000Z",
    isSampleSeed: true,
  },
  {
    reviewId: buildReviewId("ABS-2027-S04", "ksato@hems-workshop.org"),
    submissionId: "ABS-2027-S04",
    reviewerEmail: "ksato@hems-workshop.org",
    reviewerName: "Dr. Kenji Sato",
    score: 8.4,
    hemsFitness: 8.9,
    decision: "Accept (Poster)",
    recommendedTrack: "Miscellaneous",
    isCompleted: true,
    completedAt: "2026-11-01T10:15:00.000Z",
    reviewerComments:
      "Strong industry R&D demonstration of aerodynamic lens aerosol focusing with ruggedized MS/MS.",
    privateNotes:
      "Corporate instrumentation contribution; well suited for featured evening poster & exhibitor showcase.",
    createdAt: "2026-11-01T10:15:00.000Z",
    updatedAt: "2026-11-01T10:15:00.000Z",
    isSampleSeed: true,
  },
];

export function sortSubmissionsNewestFirst(
  items: readonly AbstractSubmissionRecord[]
): AbstractSubmissionRecord[] {
  return [...items].sort((a, b) => {
    const tA = Date.parse(a.submittedAt || "") || 0;
    const tB = Date.parse(b.submittedAt || "") || 0;
    return tB - tA;
  });
}

export function sortReviewsNewestFirst(
  items: readonly AbstractReviewRecord[]
): AbstractReviewRecord[] {
  return [...items].sort((a, b) => {
    const tA = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    const tB = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    return tB - tA;
  });
}

function shouldCandidateReplaceSubmission(
  candidate: AbstractSubmissionRecord,
  existing: AbstractSubmissionRecord
): boolean {
  const candidateIsUser = !candidate.isSampleSeed;
  const existingIsUser = !existing.isSampleSeed;
  if (candidateIsUser !== existingIsUser) {
    return candidateIsUser;
  }

  const candSelVer = candidate.selectionVersion ?? 0;
  const existSelVer = existing.selectionVersion ?? 0;
  const candTs = Date.parse(candidate.updatedAt || candidate.submittedAt || "") || 0;
  const existTs = Date.parse(existing.updatedAt || existing.submittedAt || "") || 0;
  if (candTs !== existTs) return candTs > existTs;
  return candSelVer > existSelVer;
}

/**
 * Deduplicates abstract submissions by `id`, removes any legacy `ABS-2027-004` sample seed
 * collision (replacing it with `ABS-2027-S04` when absent while preserving real user `ABS-2027-004`),
 * and always favors real user records over sample seeds when resolving duplicates.
 */
export function dedupeSubmissionsById(
  items: readonly AbstractSubmissionRecord[],
  seedSubmissions: readonly AbstractSubmissionRecord[] = INITIAL_SAMPLE_SUBMISSIONS
): { records: AbstractSubmissionRecord[]; changed: boolean } {
  const byId = new Map<string, AbstractSubmissionRecord>();
  let changed = false;

  for (const raw of items) {
    if (!raw?.id) {
      changed = true;
      continue;
    }
    const cleanId = raw.id.trim();
    if (!cleanId) {
      changed = true;
      continue;
    }

    // Legacy v4 sample seed used ABS-2027-004; drop that sample copy while keeping any real user ABS-2027-004
    if (cleanId === "ABS-2027-004" && raw.isSampleSeed === true) {
      changed = true;
      continue;
    }

    const normalized = cleanId === raw.id ? raw : { ...raw, id: cleanId };
    if (cleanId !== raw.id) changed = true;

    const existing = byId.get(cleanId);
    if (!existing) {
      byId.set(cleanId, normalized);
      continue;
    }

    changed = true;
    if (shouldCandidateReplaceSubmission(normalized, existing)) {
      byId.set(cleanId, normalized);
    }
  }

  // Ensure the corporate sample seed is available under its collision-free ID ABS-2027-S04
  const corporateSeed = seedSubmissions.find((s) => s.id === "ABS-2027-S04");
  if (corporateSeed && !byId.has("ABS-2027-S04")) {
    byId.set("ABS-2027-S04", corporateSeed);
    changed = true;
  }

  return {
    records: sortSubmissionsNewestFirst(Array.from(byId.values())),
    changed,
  };
}

const STALE_SAMPLE_REVIEW_ID = buildReviewId(
  "ABS-2027-004",
  "ksato@hems-workshop.org"
);

/**
 * Deduplicates review records by `reviewId` and migrates any legacy `ABS-2027-004` sample seed
 * review to `ABS-2027-S04` while keeping any non-seed user review on `ABS-2027-004`.
 */
export function dedupeReviewsById(
  items: readonly AbstractReviewRecord[],
  seedReviews: readonly AbstractReviewRecord[] = INITIAL_SAMPLE_REVIEWS
): { records: AbstractReviewRecord[]; changed: boolean } {
  const byId = new Map<string, AbstractReviewRecord>();
  let changed = false;

  for (const raw of items) {
    if (!raw?.reviewId) {
      changed = true;
      continue;
    }
    if (
      raw.isSampleSeed === true &&
      (raw.submissionId === "ABS-2027-004" ||
        raw.reviewId === STALE_SAMPLE_REVIEW_ID)
    ) {
      changed = true;
      continue;
    }

    const existing = byId.get(raw.reviewId);
    if (!existing) {
      byId.set(raw.reviewId, raw);
      continue;
    }

    changed = true;
    const rawIsUser = !raw.isSampleSeed;
    const existIsUser = !existing.isSampleSeed;
    if (rawIsUser !== existIsUser) {
      if (rawIsUser) byId.set(raw.reviewId, raw);
      continue;
    }
    const tRaw = Date.parse(raw.updatedAt || raw.createdAt || "") || 0;
    const tExist = Date.parse(existing.updatedAt || existing.createdAt || "") || 0;
    if (tRaw >= tExist) {
      byId.set(raw.reviewId, raw);
    }
  }

  const s04SeedReview = seedReviews.find((r) => r.submissionId === "ABS-2027-S04");
  if (s04SeedReview && !byId.has(s04SeedReview.reviewId)) {
    byId.set(s04SeedReview.reviewId, s04SeedReview);
    changed = true;
  }

  return {
    records: sortReviewsNewestFirst(Array.from(byId.values())),
    changed,
  };
}

/**
 * Recursively strips `undefined` properties from plain objects so Firestore `setDoc` / `tx.set`
 * never throws `Unsupported field value: undefined`. Preserves `null`, primitives, and arrays.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => stripUndefinedDeep(entry)) as unknown as T;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue;
    out[k] = stripUndefinedDeep(v);
  }
  return out as T;
}

function randomToken(length = 6): string {
  const alphabetLen = SUBMISSION_ID_ALPHABET.length;
  const cryptoObj =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < length; i++) {
      out += SUBMISSION_ID_ALPHABET[bytes[i] % alphabetLen];
    }
    return out;
  }

  let out = "";
  for (let i = 0; i < length; i++) {
    out += SUBMISSION_ID_ALPHABET[Math.floor(Math.random() * alphabetLen)];
  }
  return out;
}

/**
 * Generates a collision-proof submission identifier (`ABS-${year}-XXXXXX`) so separate attendees
 * only querying their own submissions can never collide on Firestore document IDs.
 */
export function generateSubmissionId(
  workshopYear: number,
  existing: readonly Pick<AbstractSubmissionRecord, "id">[] = []
): string {
  const safeYear =
    Number.isFinite(workshopYear) && workshopYear > 1900 ? Math.trunc(workshopYear) : 2027;
  const existingSet = new Set(existing.map((e) => e.id));
  for (let attempt = 0; attempt < 24; attempt++) {
    const candidate = `ABS-${safeYear}-${randomToken(6)}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  return `ABS-${safeYear}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
