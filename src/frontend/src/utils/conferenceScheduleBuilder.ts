import type {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
} from "@/types/abstractSubmission";
import { RESEARCH_TRACK_OPTIONS } from "@/types/abstractSubmission";
import type { SubmissionReviewSummary } from "@/utils/abstractReviewMetrics";
import {
  normalizeManualOrder,
  summarizeSubmissionReviews,
} from "@/utils/abstractReviewMetrics";
import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";
import { parseDeadlineCalendarDate } from "@/utils/upcomingWorkshop";
import { fixMojibakeAndNormalize } from "@/utils/unicodeText";

export type ScheduleEventCategory =
  | "reception"
  | "registration"
  | "breakfast"
  | "break"
  | "lunch"
  | "sponsor"
  | "poster"
  | "dinner"
  | "closing"
  | "other";

export type ScheduleSyncSource =
  | "manual"
  | "session_room"
  | "foyer_room"
  | "welcome_reception"
  | "workshop_dinner";

export interface ScheduledTalkSlot {
  slotId: string;
  submissionId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  manualTimeLocked: boolean;
  title: string;
  presentingAuthor: string;
  affiliation: string;
  authorsLine: string;
  researchTrack: string;
  isStudentAward: boolean;
  medianCombinedScore: number | null;
}

export interface ScheduleEventBlock {
  id: string;
  kind: "event";
  eventCategory: ScheduleEventCategory;
  startTime: string;
  endTime: string;
  title: string;
  subtitle: string;
  location: string;
  locationUrl: string;
  syncSource: ScheduleSyncSource;
}

export interface ScheduleSessionBlock {
  id: string;
  kind: "session";
  startTime: string;
  endTime: string;
  title: string;
  themeSubtitle: string;
  sessionChair: string;
  location: string;
  syncSource: ScheduleSyncSource;
  talks: ScheduledTalkSlot[];
}

export type ScheduleBlock = ScheduleEventBlock | ScheduleSessionBlock;

export interface SchedulePosterEntry {
  submissionId: string;
  posterNumber: string;
  title: string;
  presentingAuthor: string;
  affiliation: string;
  authorsLine: string;
  researchTrack: string;
  isStudentAward: boolean;
}

export interface ScheduleDayPlan {
  id: string;
  dayNumber: number;
  dateIso: string;
  headingLabel: string;
  dayTagline: string;
  blocks: ScheduleBlock[];
}

export interface ConferenceSchedulePlan {
  version: 1;
  workshopNumber: number;
  workshopOrdinal: string;
  workshopYear: string;
  defaultTalkDurationMinutes: number;
  includePosterAppendix: boolean;
  programNotes: string;
  days: ScheduleDayPlan[];
  posters: SchedulePosterEntry[];
  updatedAt: string;
  updatedBy: string;
}

export type ScheduleCandidatePool =
  | "oral_accepted"
  | "oral_pending"
  | "poster_accepted";

export interface ScheduleCandidateEntry {
  submission: AbstractSubmissionRecord;
  summary: SubmissionReviewSummary;
  authorsLine: string;
  primaryAffiliation: string;
  candidatePool: ScheduleCandidatePool;
}

export interface ScheduleConflictWarning {
  id: string;
  dayId: string;
  dayLabel: string;
  blockId: string;
  slotId?: string;
  severity: "warning" | "error";
  message: string;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export function toRomanNumeral(n: number): string {
  if (n >= 1 && n <= ROMAN_NUMERALS.length) {
    return ROMAN_NUMERALS[n - 1];
  }
  return String(n);
}

/**
 * Parses common time formats ("08:30", "8:30 a.m.", "2:15 PM", "18:30") into minutes since midnight.
 */
export function parseClockMinutes(raw: string): number | null {
  const cleaned = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "");
  if (!cleaned) return null;
  if (cleaned === "noon") return 12 * 60;
  if (cleaned === "midnight") return 0;

  const ampmMatch = /(\d{1,2}):(\d{2})\s*(am|pm)\b/i.exec(cleaned);
  if (ampmMatch) {
    let hour = Number.parseInt(ampmMatch[1], 10);
    const minute = Number.parseInt(ampmMatch[2], 10);
    if (minute < 0 || minute > 59 || hour < 1 || hour > 12) return null;
    const mer = ampmMatch[3].toLowerCase();
    if (mer === "am" && hour === 12) hour = 0;
    if (mer === "pm" && hour < 12) hour += 12;
    return hour * 60 + minute;
  }

  const h24Match = /^(\d{1,2}):(\d{2})$/.exec(cleaned);
  if (h24Match) {
    const hour = Number.parseInt(h24Match[1], 10);
    const minute = Number.parseInt(h24Match[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  }

  return null;
}

/**
 * Converts minutes since midnight (clamped 0..1439) to canonical "HH:MM" 24-hour string.
 */
export function minutesTo24Hour(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Normalizes any recognized clock string into canonical "HH:MM" for `<input type="time">` and math.
 */
export function normalizeTo24Hour(raw: string, fallback = "08:30"): string {
  const mins = parseClockMinutes(raw);
  return mins === null ? fallback : minutesTo24Hour(mins);
}

/**
 * Formats canonical time ("08:30" or "14:00") in traditional HEMS Workshop style ("8:30 a.m.", "2:00 p.m.").
 */
export function formatHemsScheduleTime(raw: string): string {
  const mins = parseClockMinutes(raw);
  if (mins === null) return raw.trim();
  const h24 = Math.floor(mins / 60);
  const mm = mins % 60;
  if (h24 === 12 && mm === 0) return "12:00 p.m.";
  const suffix = h24 >= 12 ? "p.m." : "a.m.";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

export function formatHemsTimeRange(startTime: string, endTime?: string): string {
  const s = formatHemsScheduleTime(startTime);
  if (!endTime || !endTime.trim()) return s;
  const e = formatHemsScheduleTime(endTime);
  if (!e || e === s) return s;
  return `${s} – ${e}`;
}

export function buildScheduleExportFilename(
  plan: Pick<ConferenceSchedulePlan, "workshopOrdinal" | "workshopYear">,
  ext: "pdf" | "docx"
): string {
  const ordinal = (plan.workshopOrdinal || "16th").replace(/[^a-zA-Z0-9_-]/g, "");
  const year = (plan.workshopYear || "2027").replace(/[^a-zA-Z0-9_-]/g, "");
  return `${ordinal}_HEMS_Workshop_${year}_Program_Schedule.${ext}`;
}

/**
 * Extracts start/end "HH:MM" values from free-form text like "Wednesday • 6:30 p.m. – 9:30 p.m."
 */
export function parseTimeWindowFromText(
  rawText: string,
  fallbackStart: string,
  fallbackEnd = ""
): { startTime: string; endTime: string } {
  const cleaned = String(rawText || "").replace(/\./g, "");
  const matches = Array.from(
    cleaned.matchAll(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi)
  ).map((m) => parseClockMinutes(m[1]));
  const valid = matches.filter((v): v is number => v !== null);
  if (valid.length >= 2) {
    return {
      startTime: minutesTo24Hour(valid[0]),
      endTime: minutesTo24Hour(valid[1]),
    };
  }
  if (valid.length === 1) {
    return {
      startTime: minutesTo24Hour(valid[0]),
      endTime: fallbackEnd,
    };
  }
  return {
    startTime: normalizeTo24Hour(fallbackStart, "18:00"),
    endTime: fallbackEnd ? normalizeTo24Hour(fallbackEnd, "") : "",
  };
}

function addDaysUtc(
  cal: { year: number; month: number; day: number },
  deltaDays: number
): { dateIso: string; headingLabel: string } {
  const dt = new Date(Date.UTC(cal.year, cal.month - 1, cal.day + deltaDays));
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;
  const d = dt.getUTCDate();
  const weekday = WEEKDAYS[dt.getUTCDay()];
  const monthName = MONTHS[m - 1];
  return {
    dateIso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    headingLabel: `${weekday}, ${monthName} ${d}, ${y}`,
  };
}

export function formatDayHeadingFromIso(dateIso: string, fallbackLabel: string): string {
  const cal = parseDeadlineCalendarDate(dateIso);
  if (!cal) return fallbackLabel;
  return addDaysUtc(cal, 0).headingLabel;
}

/**
 * Derives 4 sequential Monday-Thursday conference day headings from Workshop Settings,
 * falling back cleanly to structured TBA day titles when dates are unconfirmed.
 */
export function deriveWorkshopFourDayDates(
  workshop: UpcomingWorkshopConfig
): Array<{
  dayNumber: number;
  dateIso: string;
  headingLabel: string;
  dayTagline: string;
}> {
  const startCal = parseDeadlineCalendarDate(workshop.conference_start_date);
  const taglines = [
    "Travel Day & Arrival",
    "HEMS Workshop — Day 1",
    "HEMS Workshop — Day 2",
    "HEMS Workshop — Day 3",
  ];
  const fallbackHeadings = [
    "Day 1 (Monday) — Arrival & Welcome Reception",
    "Day 2 (Tuesday) — Workshop Technical Program Day 1",
    "Day 3 (Wednesday) — Workshop Technical Program Day 2",
    "Day 4 (Thursday) — Workshop Technical Program Day 3",
  ];

  if (!startCal) {
    return [0, 1, 2, 3].map((idx) => ({
      dayNumber: idx + 1,
      dateIso: "",
      headingLabel: fallbackHeadings[idx],
      dayTagline: taglines[idx],
    }));
  }

  return [0, 1, 2, 3].map((idx) => {
    const { dateIso, headingLabel } = addDaysUtc(startCal, idx);
    return {
      dayNumber: idx + 1,
      dateIso,
      headingLabel,
      dayTagline: taglines[idx],
    };
  });
}

function resolveAffiliationMap(
  affiliations?: readonly AffiliationEntry[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const aff of affiliations || []) {
    const inst = fixMojibakeAndNormalize(aff.institution || "").trim();
    const loc = fixMojibakeAndNormalize(aff.location || "").trim();
    if (!aff.id) continue;
    map.set(aff.id, loc ? `${inst} (${loc})` : inst);
  }
  return map;
}

/**
 * Formats an author list with institutional affiliations identically to archived HEMS programs.
 */
export function formatSubmissionAuthorsLine(
  sub: AbstractSubmissionRecord
): { authorsLine: string; primaryAffiliation: string; presenterName: string } {
  const presenterFallback = fixMojibakeAndNormalize(
    sub.presentingAuthor || "Presenting Author"
  ).trim();
  const affFallback = fixMojibakeAndNormalize(sub.affiliation || "").trim();
  const affMap = resolveAffiliationMap(sub.affiliations);

  const structuredAuthors: AuthorEntry[] = (sub.authors || []).filter(
    (a) => Boolean(a?.name?.trim())
  );

  if (structuredAuthors.length > 0) {
    const parts = structuredAuthors.map((author) => {
      const cleanName = fixMojibakeAndNormalize(author.name).trim();
      const inst = affMap.get(author.affiliationId) || affFallback;
      return inst ? `${cleanName}, ${inst}` : cleanName;
    });
    const presenter =
      structuredAuthors.find((a) => a.isPresenter) || structuredAuthors[0];
    const primaryInst =
      affMap.get(presenter.affiliationId) ||
      affFallback ||
      Array.from(affMap.values())[0] ||
      "";
    return {
      authorsLine: parts.join("; "),
      primaryAffiliation: primaryInst,
      presenterName: fixMojibakeAndNormalize(presenter.name).trim() || presenterFallback,
    };
  }

  const coAuthors = fixMojibakeAndNormalize(sub.coAuthors || "").trim();
  const presenterDisplay = affFallback
    ? `${presenterFallback}, ${affFallback}`
    : presenterFallback;
  const fullLine = coAuthors ? `${presenterDisplay}; ${coAuthors}` : presenterDisplay;
  return {
    authorsLine: fullLine,
    primaryAffiliation: affFallback,
    presenterName: presenterFallback,
  };
}

/**
 * Extracts and ranks accepted oral, pending oral, and accepted poster abstracts using committee consensus metrics.
 */
export function extractAcceptedSubmissionsForSchedule(
  submissions: readonly AbstractSubmissionRecord[],
  reviews: readonly AbstractReviewRecord[],
  options: {
    includePendingOral?: boolean;
    manualOrderIds?: readonly string[];
  } = {}
): {
  oralCandidates: ScheduleCandidateEntry[];
  posterCandidates: ScheduleCandidateEntry[];
  summaryById: Map<string, SubmissionReviewSummary>;
} {
  const summaryById = new Map<string, SubmissionReviewSummary>();
  const rankMap = new Map<string, number>();
  if (options.manualOrderIds && options.manualOrderIds.length > 0) {
    const norm = normalizeManualOrder(options.manualOrderIds, submissions);
    norm.forEach((id, idx) => rankMap.set(id, idx));
  }

  const oralCandidates: ScheduleCandidateEntry[] = [];
  const posterCandidates: ScheduleCandidateEntry[] = [];

  for (const submission of submissions) {
    const summary = summarizeSubmissionReviews(submission, reviews);
    summaryById.set(submission.id, summary);

    const decision =
      summary.consensusDecision !== "Pending"
        ? summary.consensusDecision
        : submission.decision;

    const { authorsLine, primaryAffiliation } =
      formatSubmissionAuthorsLine(submission);

    if (decision === "Accept (Oral)") {
      oralCandidates.push({
        submission,
        summary,
        authorsLine,
        primaryAffiliation,
        candidatePool: "oral_accepted",
      });
    } else if (
      options.includePendingOral &&
      decision === "Pending" &&
      (submission.presentationFormat === "Oral Presentation" ||
        submission.presentationFormat === "Either (Oral Preferred)")
    ) {
      oralCandidates.push({
        submission,
        summary,
        authorsLine,
        primaryAffiliation,
        candidatePool: "oral_pending",
      });
    } else if (decision === "Accept (Poster)") {
      posterCandidates.push({
        submission,
        summary,
        authorsLine,
        primaryAffiliation,
        candidatePool: "poster_accepted",
      });
    }
  }

  const sortCandidates = (
    a: ScheduleCandidateEntry,
    b: ScheduleCandidateEntry
  ): number => {
    // Accepted oral always comes before pending fallback
    if (a.candidatePool !== b.candidatePool) {
      return a.candidatePool === "oral_accepted" ? -1 : 1;
    }
    const trackIdxA = RESEARCH_TRACK_OPTIONS.indexOf(a.submission.researchTrack);
    const trackIdxB = RESEARCH_TRACK_OPTIONS.indexOf(b.submission.researchTrack);
    const normTrackA = trackIdxA === -1 ? 999 : trackIdxA;
    const normTrackB = trackIdxB === -1 ? 999 : trackIdxB;
    if (normTrackA !== normTrackB) return normTrackA - normTrackB;

    const scoreA = a.summary.medianCombined ?? -1;
    const scoreB = b.summary.medianCombined ?? -1;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const rankA = rankMap.get(a.submission.id) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rankMap.get(b.submission.id) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;

    return a.submission.id.localeCompare(b.submission.id);
  };

  oralCandidates.sort(sortCandidates);
  posterCandidates.sort(sortCandidates);

  return { oralCandidates, posterCandidates, summaryById };
}

export function buildTalkSlotFromCandidate(
  candidate: ScheduleCandidateEntry,
  durationMinutes = 30,
  startTime = "08:30"
): ScheduledTalkSlot {
  const { authorsLine, primaryAffiliation, presenterName } =
    formatSubmissionAuthorsLine(candidate.submission);
  const startMins = parseClockMinutes(startTime) ?? 8 * 60 + 30;
  return {
    slotId: `slot_${candidate.submission.id}_${Math.random().toString(36).slice(2, 7)}`,
    submissionId: candidate.submission.id,
    startTime: minutesTo24Hour(startMins),
    endTime: minutesTo24Hour(startMins + durationMinutes),
    durationMinutes,
    manualTimeLocked: false,
    title: fixMojibakeAndNormalize(candidate.submission.title || "Untitled Talk").trim(),
    presentingAuthor: presenterName,
    affiliation: primaryAffiliation,
    authorsLine,
    researchTrack: candidate.submission.researchTrack,
    isStudentAward: Boolean(candidate.submission.studentTravelAwardApplicant),
    medianCombinedScore: candidate.summary.medianCombined,
  };
}

/**
 * Recalculates sequential talk times starting from `session.startTime`.
 * Unlocked talks advance chronologically; locked talks keep their manual time and advance the cursor past them.
 */
export function recalculateSessionTalkTimes(
  session: ScheduleSessionBlock,
  forceUnlockAll = false
): ScheduleSessionBlock {
  const baseStart = parseClockMinutes(session.startTime) ?? 8 * 60 + 30;
  let cursor = baseStart;
  let latestEnd = baseStart;

  const updatedTalks = session.talks.map((talk) => {
    const dur = Math.max(5, Math.min(180, talk.durationMinutes || 30));
    const useManual = !forceUnlockAll && talk.manualTimeLocked;
    if (useManual) {
      const mStart = parseClockMinutes(talk.startTime);
      const mEnd = parseClockMinutes(talk.endTime);
      const resolvedStart = mStart ?? cursor;
      const resolvedEnd =
        mEnd !== null && mEnd > resolvedStart ? mEnd : resolvedStart + dur;
      cursor = resolvedEnd;
      if (resolvedEnd > latestEnd) latestEnd = resolvedEnd;
      return {
        ...talk,
        startTime: minutesTo24Hour(resolvedStart),
        endTime: minutesTo24Hour(resolvedEnd),
        durationMinutes: resolvedEnd - resolvedStart,
      };
    }

    const slotStart = cursor;
    const slotEnd = slotStart + dur;
    cursor = slotEnd;
    if (slotEnd > latestEnd) latestEnd = slotEnd;
    return {
      ...talk,
      manualTimeLocked: false,
      startTime: minutesTo24Hour(slotStart),
      endTime: minutesTo24Hour(slotEnd),
    };
  });

  const resolvedSessionEnd =
    updatedTalks.length > 0
      ? minutesTo24Hour(latestEnd)
      : session.endTime || minutesTo24Hour(baseStart + 90);

  return {
    ...session,
    endTime: resolvedSessionEnd,
    talks: updatedTalks,
  };
}

interface SessionBlueprint {
  dayIndex: number;
  id: string;
  romanIndex: number;
  startTime: string;
  nominalEndTime: string;
  capacitySlots: number;
}

const ARCHIVE_SESSION_BLUEPRINTS: readonly SessionBlueprint[] = [
  { dayIndex: 1, id: "session-1", romanIndex: 1, startTime: "10:00", nominalEndTime: "12:00", capacitySlots: 4 },
  { dayIndex: 1, id: "session-2", romanIndex: 2, startTime: "14:00", nominalEndTime: "15:00", capacitySlots: 2 },
  { dayIndex: 1, id: "session-3", romanIndex: 3, startTime: "15:30", nominalEndTime: "17:00", capacitySlots: 3 },
  { dayIndex: 2, id: "session-4", romanIndex: 4, startTime: "08:30", nominalEndTime: "10:00", capacitySlots: 3 },
  { dayIndex: 2, id: "session-5", romanIndex: 5, startTime: "10:30", nominalEndTime: "12:00", capacitySlots: 3 },
  { dayIndex: 2, id: "session-6", romanIndex: 6, startTime: "13:30", nominalEndTime: "15:00", capacitySlots: 3 },
  { dayIndex: 2, id: "session-7", romanIndex: 7, startTime: "15:30", nominalEndTime: "17:00", capacitySlots: 3 },
  { dayIndex: 3, id: "session-8", romanIndex: 8, startTime: "08:30", nominalEndTime: "10:00", capacitySlots: 3 },
  { dayIndex: 3, id: "session-9", romanIndex: 9, startTime: "10:30", nominalEndTime: "12:00", capacitySlots: 3 },
];

function buildSessionThemeSubtitle(talks: readonly ScheduledTalkSlot[]): string {
  const uniqueTracks: string[] = [];
  for (const talk of talks) {
    if (talk.researchTrack && !uniqueTracks.includes(talk.researchTrack)) {
      uniqueTracks.push(talk.researchTrack);
    }
  }
  if (uniqueTracks.length === 0) return "";
  if (uniqueTracks.length <= 2) return uniqueTracks.join(" & ");
  return `${uniqueTracks[0]} & Cross-Disciplinary MS`;
}

function buildReceptionDetailsFromWorkshop(workshop: UpcomingWorkshopConfig) {
  const parsed = parseTimeWindowFromText(
    workshop.welcome_reception_time,
    "18:00",
    "20:00"
  );
  const hotelAndVenue = [workshop.welcome_reception_venue, workshop.hotel_name]
    .map((s) => (s || "").trim())
    .filter((s) => Boolean(s) && !/^TBA$/i.test(s));
  const loc = workshop.welcome_reception_venue?.trim()
    ? workshop.welcome_reception_venue.trim()
    : hotelAndVenue[0] || "Host Hotel Foyer (TBA)";
  return {
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    location: loc,
    locationUrl: workshop.hotel_maps_url || "",
  };
}

function buildDinnerDetailsFromWorkshop(workshop: UpcomingWorkshopConfig) {
  const rawDayTime = (workshop.dinner_day_time || "").toLowerCase();
  let dinnerDayIndex = 2; // Day 3 (Wednesday) default matching 2025.json
  if (/\btuesday\b|\btue\b|\bday\s*2\b/i.test(rawDayTime)) {
    dinnerDayIndex = 1; // Day 2 (Tuesday) like 2022.json
  } else if (/\bthursday\b|\bthu\b|\bday\s*4\b/i.test(rawDayTime)) {
    dinnerDayIndex = 3;
  }

  const parsed = parseTimeWindowFromText(
    workshop.dinner_day_time,
    "18:30",
    "21:30"
  );
  const venueParts = [
    workshop.dinner_venue_name?.trim(),
    workshop.dinner_venue_address?.trim(),
  ].filter(Boolean);

  return {
    dinnerDayIndex,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    title: "Official Workshop Dinner",
    subtitle: (workshop.dinner_plan_notes || "").trim(),
    location: venueParts.join(" — ") || "Coastal Banquet Venue (TBA)",
    locationUrl: (workshop.dinner_venue_url || "").trim(),
  };
}

/**
 * Generates an archive-grounded 4-day HEMS Workshop suggested schedule populated
 * with Workshop Settings venue/reception/dinner details and track-grouped accepted oral talks.
 */
export function buildSuggestedHemsSchedule(
  workshop: UpcomingWorkshopConfig,
  oralCandidates: readonly ScheduleCandidateEntry[],
  posterCandidates: readonly ScheduleCandidateEntry[] = [],
  options: {
    defaultTalkDurationMinutes?: number;
    updatedBy?: string;
  } = {}
): ConferenceSchedulePlan {
  const talkDuration = Math.max(
    10,
    Math.min(60, options.defaultTalkDurationMinutes || 30)
  );
  const fourDays = deriveWorkshopFourDayDates(workshop);
  const sessionRoom =
    (workshop.venue_session_room || "").trim() || "Main Plenary Ballroom (TBA)";
  const foyerRoom =
    (workshop.venue_foyer_room || "").trim() || "Ballroom Foyer (TBA)";
  const receptionInfo = buildReceptionDetailsFromWorkshop(workshop);
  const dinnerInfo = buildDinnerDetailsFromWorkshop(workshop);

  // Distribute oral candidates cohesively by track across Sessions I..IX
  const sessionBuckets: ScheduledTalkSlot[][] = ARCHIVE_SESSION_BLUEPRINTS.map(
    () => []
  );

  // Scale nominal slot capacity based on chosen talk duration (e.g., 90m / 20m = 4 talks)
  const capacities = ARCHIVE_SESSION_BLUEPRINTS.map((bp) => {
    const startM = parseClockMinutes(bp.startTime) ?? 540;
    const endM = parseClockMinutes(bp.nominalEndTime) ?? startM + 90;
    return Math.max(bp.capacitySlots, Math.floor((endM - startM) / talkDuration));
  });

  // Pack candidates sequentially into sessions, keeping track cohorts aligned when feasible
  let currentSessionIdx = 0;
  for (let i = 0; i < oralCandidates.length; i++) {
    const candidate = oralCandidates[i];
    const prevCandidate = i > 0 ? oralCandidates[i - 1] : null;
    const currentCount = sessionBuckets[currentSessionIdx].length;
    const currentCap = capacities[currentSessionIdx];

    const trackChanged =
      prevCandidate !== null &&
      prevCandidate.submission.researchTrack !== candidate.submission.researchTrack;

    // Advance early to the next session if a track cohort transitions cleanly after >=2 talks
    if (
      (currentCount >= currentCap ||
        (trackChanged && currentCount >= 2 && oralCandidates.length <= 22)) &&
      currentSessionIdx < sessionBuckets.length - 1
    ) {
      currentSessionIdx += 1;
    }

    // If all 9 sessions hit nominal cap, distribute overflow round-robin so every accepted talk appears
    if (
      currentSessionIdx === sessionBuckets.length - 1 &&
      sessionBuckets[currentSessionIdx].length >= capacities[currentSessionIdx]
    ) {
      let minIdx = 0;
      for (let j = 1; j < sessionBuckets.length; j++) {
        if (sessionBuckets[j].length < sessionBuckets[minIdx].length) {
          minIdx = j;
        }
      }
      sessionBuckets[minIdx].push(
        buildTalkSlotFromCandidate(candidate, talkDuration)
      );
    } else {
      sessionBuckets[currentSessionIdx].push(
        buildTalkSlotFromCandidate(candidate, talkDuration)
      );
    }
  }

  const builtSessions: ScheduleSessionBlock[] = ARCHIVE_SESSION_BLUEPRINTS.map(
    (bp, idx) => {
      const talks = sessionBuckets[idx];
      const rawSession: ScheduleSessionBlock = {
        id: bp.id,
        kind: "session",
        startTime: bp.startTime,
        endTime: bp.nominalEndTime,
        title: `Technical Session ${toRomanNumeral(bp.romanIndex)}`,
        themeSubtitle: buildSessionThemeSubtitle(talks),
        sessionChair: "",
        location: sessionRoom,
        syncSource: "session_room",
        talks,
      };
      return talks.length > 0
        ? recalculateSessionTalkTimes(rawSession, true)
        : rawSession;
    }
  );

  const sessionsForDay = (dayIdx: number) =>
    ARCHIVE_SESSION_BLUEPRINTS.map((bp, i) => ({ bp, session: builtSessions[i] }))
      .filter((entry) => entry.bp.dayIndex === dayIdx)
      .map((entry) => entry.session);

  const day2Sessions = sessionsForDay(1);
  const day3Sessions = sessionsForDay(2);
  const day4Sessions = sessionsForDay(3);

  const makeEveningDinnerBlock = (dayIndex: number): ScheduleEventBlock => {
    if (dinnerInfo.dinnerDayIndex === dayIndex) {
      return {
        id: `ev-day${dayIndex + 1}-dinner`,
        kind: "event",
        eventCategory: "dinner",
        startTime: dinnerInfo.startTime,
        endTime: dinnerInfo.endTime,
        title: dinnerInfo.title,
        subtitle: dinnerInfo.subtitle,
        location: dinnerInfo.location,
        locationUrl: dinnerInfo.locationUrl,
        syncSource: "workshop_dinner",
      };
    }
    return {
      id: `ev-day${dayIndex + 1}-dinner`,
      kind: "event",
      eventCategory: "dinner",
      startTime: "18:00",
      endTime: "",
      title: "Dinner (On Your Own)",
      subtitle: "Explore local coastal restaurants with colleagues",
      location: workshop.venue_city_state || "",
      locationUrl: "",
      syncSource: "manual",
    };
  };

  const day2Blocks: ScheduleBlock[] = [
    {
      id: "ev-day2-reg",
      kind: "event",
      eventCategory: "registration",
      startTime: "07:30",
      endTime: "08:00",
      title: "Registration Check-In & Corporate Sponsor Setup",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    {
      id: "ev-day2-breakfast",
      kind: "event",
      eventCategory: "breakfast",
      startTime: "08:00",
      endTime: "09:45",
      title: "Continental Breakfast",
      subtitle: "Coffee, pastries & corporate exhibit tables",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    {
      id: "ev-day2-welcome",
      kind: "event",
      eventCategory: "other",
      startTime: "09:45",
      endTime: "10:00",
      title: "Opening & Welcome Remarks",
      subtitle: `${workshop.workshop_ordinal} HEMS Organizing Committee`,
      location: sessionRoom,
      locationUrl: "",
      syncSource: "session_room",
    },
    day2Sessions[0],
    {
      id: "ev-day2-lunch",
      kind: "event",
      eventCategory: "lunch",
      startTime: "12:00",
      endTime: "13:30",
      title: "Lunch",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    {
      id: "ev-day2-sponsors",
      kind: "event",
      eventCategory: "sponsor",
      startTime: "13:30",
      endTime: "14:00",
      title: "Corporate Sponsor Introductions",
      subtitle: "2027 Corporate Patrons & Exhibitor Briefings",
      location: sessionRoom,
      locationUrl: "",
      syncSource: "session_room",
    },
    day2Sessions[1],
    {
      id: "ev-day2-break",
      kind: "event",
      eventCategory: "break",
      startTime: "15:00",
      endTime: "15:30",
      title: "Afternoon Break",
      subtitle: "Refreshments & vendor booths",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    day2Sessions[2],
    ...(posterCandidates.length > 0
      ? [
          {
            id: "ev-day2-posters",
            kind: "event",
            eventCategory: "poster",
            startTime: "17:00",
            endTime: "18:15",
            title: `Poster Session (${posterCandidates.length} Accepted Poster${posterCandidates.length === 1 ? "" : "s"})`,
            subtitle: "Dedicated poster viewing, sponsor tables & networking",
            location: foyerRoom,
            locationUrl: "",
            syncSource: "foyer_room",
          } satisfies ScheduleEventBlock,
        ]
      : []),
    makeEveningDinnerBlock(1),
  ];

  const day3Blocks: ScheduleBlock[] = [
    {
      id: "ev-day3-breakfast",
      kind: "event",
      eventCategory: "breakfast",
      startTime: "07:30",
      endTime: "08:30",
      title: "Continental Breakfast",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    day3Sessions[0],
    {
      id: "ev-day3-am-break",
      kind: "event",
      eventCategory: "break",
      startTime: "10:00",
      endTime: "10:30",
      title: "Mid-Morning Break",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    day3Sessions[1],
    {
      id: "ev-day3-lunch",
      kind: "event",
      eventCategory: "lunch",
      startTime: "12:00",
      endTime: "13:30",
      title: "Lunch (On Your Own)",
      subtitle: "",
      location: "",
      locationUrl: "",
      syncSource: "manual",
    },
    day3Sessions[2],
    {
      id: "ev-day3-pm-break",
      kind: "event",
      eventCategory: "break",
      startTime: "15:00",
      endTime: "15:30",
      title: "Afternoon Break",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    day3Sessions[3],
    makeEveningDinnerBlock(2),
  ];

  const day4Blocks: ScheduleBlock[] = [
    {
      id: "ev-day4-breakfast",
      kind: "event",
      eventCategory: "breakfast",
      startTime: "07:30",
      endTime: "08:30",
      title: "Continental Breakfast",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    day4Sessions[0],
    {
      id: "ev-day4-am-break",
      kind: "event",
      eventCategory: "break",
      startTime: "10:00",
      endTime: "10:30",
      title: "Mid-Morning Break",
      subtitle: "",
      location: foyerRoom,
      locationUrl: "",
      syncSource: "foyer_room",
    },
    day4Sessions[1],
    {
      id: "ev-day4-closing",
      kind: "event",
      eventCategory: "closing",
      startTime: "12:00",
      endTime: "12:30",
      title: "Program Survey, Student Awards Recognition & Closing",
      subtitle: "Safe travels — Adjourn",
      location: sessionRoom,
      locationUrl: "",
      syncSource: "session_room",
    },
  ];

  const days: ScheduleDayPlan[] = [
    {
      id: "day-1",
      dayNumber: 1,
      dateIso: fourDays[0].dateIso,
      headingLabel: fourDays[0].headingLabel,
      dayTagline: fourDays[0].dayTagline,
      blocks: [
        {
          id: "ev-day1-reception",
          kind: "event",
          eventCategory: "reception",
          startTime: receptionInfo.startTime,
          endTime: receptionInfo.endTime,
          title: "Registration — Meet & Greet Welcome Reception",
          subtitle: "Badge pickup & informal waterfront welcome gathering",
          location: receptionInfo.location,
          locationUrl: receptionInfo.locationUrl,
          syncSource: "welcome_reception",
        },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      dateIso: fourDays[1].dateIso,
      headingLabel: fourDays[1].headingLabel,
      dayTagline: fourDays[1].dayTagline,
      blocks: day2Blocks,
    },
    {
      id: "day-3",
      dayNumber: 3,
      dateIso: fourDays[2].dateIso,
      headingLabel: fourDays[2].headingLabel,
      dayTagline: fourDays[2].dayTagline,
      blocks: day3Blocks,
    },
    {
      id: "day-4",
      dayNumber: 4,
      dateIso: fourDays[3].dateIso,
      headingLabel: fourDays[3].headingLabel,
      dayTagline: fourDays[3].dayTagline,
      blocks: day4Blocks,
    },
  ];

  const posters: SchedulePosterEntry[] = posterCandidates.map((cand, idx) => {
    const { authorsLine, primaryAffiliation, presenterName } =
      formatSubmissionAuthorsLine(cand.submission);
    return {
      submissionId: cand.submission.id,
      posterNumber: `P-${String(idx + 1).padStart(2, "0")}`,
      title: fixMojibakeAndNormalize(cand.submission.title || "Untitled Poster").trim(),
      presentingAuthor: presenterName,
      affiliation: primaryAffiliation,
      authorsLine,
      researchTrack: cand.submission.researchTrack,
      isStudentAward: Boolean(cand.submission.studentTravelAwardApplicant),
    };
  });

  return {
    version: 1,
    workshopNumber: workshop.workshop_number || 16,
    workshopOrdinal: workshop.workshop_ordinal || "16th",
    workshopYear: workshop.workshop_year || "2027",
    defaultTalkDurationMinutes: talkDuration,
    includePosterAppendix: true,
    programNotes: "",
    days,
    posters,
    updatedAt: new Date().toISOString(),
    updatedBy: options.updatedBy || "system-auto-suggest",
  };
}

/**
 * Synchronizes room names, reception times, dinner plans, and calendar dates
 * from Workshop Settings into an existing schedule draft without losing assigned talks.
 */
export function syncScheduleLocationsFromWorkshopSettings(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): ConferenceSchedulePlan {
  const fourDays = deriveWorkshopFourDayDates(workshop);
  const sessionRoom =
    (workshop.venue_session_room || "").trim() || "Main Plenary Ballroom (TBA)";
  const foyerRoom =
    (workshop.venue_foyer_room || "").trim() || "Ballroom Foyer (TBA)";
  const receptionInfo = buildReceptionDetailsFromWorkshop(workshop);
  const dinnerInfo = buildDinnerDetailsFromWorkshop(workshop);

  const days = plan.days.map((day, idx) => {
    const mappedDate = fourDays[idx];
    const nextDateIso = mappedDate?.dateIso || day.dateIso;
    const nextHeading =
      mappedDate && mappedDate.dateIso
        ? mappedDate.headingLabel
        : day.headingLabel;

    const blocks = day.blocks.map((block): ScheduleBlock => {
      if (block.syncSource === "session_room") {
        return { ...block, location: sessionRoom };
      }
      if (block.syncSource === "foyer_room") {
        return { ...block, location: foyerRoom };
      }
      if (block.kind === "event" && block.syncSource === "welcome_reception") {
        return {
          ...block,
          startTime: receptionInfo.startTime,
          endTime: receptionInfo.endTime,
          location: receptionInfo.location,
          locationUrl: receptionInfo.locationUrl,
        };
      }
      if (block.kind === "event" && block.syncSource === "workshop_dinner") {
        return {
          ...block,
          startTime: dinnerInfo.startTime,
          endTime: dinnerInfo.endTime,
          title: dinnerInfo.title,
          subtitle: dinnerInfo.subtitle,
          location: dinnerInfo.location,
          locationUrl: dinnerInfo.locationUrl,
        };
      }
      return block;
    });

    return {
      ...day,
      dateIso: nextDateIso,
      headingLabel: nextHeading,
      blocks,
    };
  });

  return {
    ...plan,
    workshopNumber: workshop.workshop_number || plan.workshopNumber,
    workshopOrdinal: workshop.workshop_ordinal || plan.workshopOrdinal,
    workshopYear: workshop.workshop_year || plan.workshopYear,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns every submission ID currently scheduled in any technical session.
 */
export function collectScheduledSubmissionIds(
  plan: ConferenceSchedulePlan
): Set<string> {
  const ids = new Set<string>();
  for (const day of plan.days) {
    for (const block of day.blocks) {
      if (block.kind === "session") {
        for (const talk of block.talks) {
          if (talk.submissionId) ids.add(talk.submissionId);
        }
      }
    }
  }
  return ids;
}

/**
 * Moves a scheduled talk slot from its current session into `targetSessionId` at optional `targetIndex`,
 * recalculating talk times in affected sessions.
 */
export function moveTalkBetweenSessions(
  plan: ConferenceSchedulePlan,
  slotId: string,
  targetSessionId: string,
  targetIndex?: number
): ConferenceSchedulePlan {
  let extractedTalk: ScheduledTalkSlot | null = null;
  let sourceSessionId: string | null = null;

  for (const day of plan.days) {
    for (const block of day.blocks) {
      if (block.kind === "session") {
        const found = block.talks.find((t) => t.slotId === slotId);
        if (found) {
          extractedTalk = found;
          sourceSessionId = block.id;
          break;
        }
      }
    }
    if (extractedTalk) break;
  }

  if (!extractedTalk || !sourceSessionId) return plan;

  const movingSameSession = sourceSessionId === targetSessionId;
  const days = plan.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block): ScheduleBlock => {
      if (block.kind !== "session") return block;

      const isSource = block.id === sourceSessionId;
      const isTarget = block.id === targetSessionId;
      if (!isSource && !isTarget) return block;

      let nextTalks = [...block.talks];
      if (isSource) {
        nextTalks = nextTalks.filter((t) => t.slotId !== slotId);
      }

      if (isTarget) {
        const cleanMoved: ScheduledTalkSlot = {
          ...extractedTalk!,
          // Reset manual time lock when placed into a different position so slot time ripples smoothly
          manualTimeLocked: false,
        };
        if (typeof targetIndex === "number" && targetIndex >= 0) {
          const clampedIdx = Math.min(nextTalks.length, targetIndex);
          nextTalks.splice(clampedIdx, 0, cleanMoved);
        } else {
          nextTalks.push(cleanMoved);
        }
      }

      return recalculateSessionTalkTimes(
        { ...block, talks: nextTalks },
        movingSameSession || isTarget
      );
    }),
  }));

  return {
    ...plan,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Assigns an unscheduled abstract candidate (or custom talk) into a target session and recalculates talk times.
 */
export function assignCandidateToSession(
  plan: ConferenceSchedulePlan,
  talkSlot: ScheduledTalkSlot,
  targetSessionId: string
): ConferenceSchedulePlan {
  const days = plan.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block): ScheduleBlock => {
      if (block.kind !== "session" || block.id !== targetSessionId) return block;
      const nextTalks = [...block.talks, { ...talkSlot, manualTimeLocked: false }];
      return recalculateSessionTalkTimes({ ...block, talks: nextTalks }, false);
    }),
  }));

  return {
    ...plan,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes a talk from its session (returning its abstract to the unassigned pool) and reflows remaining talks.
 */
export function removeTalkFromSession(
  plan: ConferenceSchedulePlan,
  slotId: string
): ConferenceSchedulePlan {
  const days = plan.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block): ScheduleBlock => {
      if (block.kind !== "session") return block;
      if (!block.talks.some((t) => t.slotId === slotId)) return block;
      const remaining = block.talks.filter((t) => t.slotId !== slotId);
      return recalculateSessionTalkTimes({ ...block, talks: remaining }, false);
    }),
  }));

  return {
    ...plan,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Manually adjusts start time, end time, or duration on a specific talk slot,
 * optionally rippling subsequent talks in that session.
 */
export function updateTalkTiming(
  plan: ConferenceSchedulePlan,
  sessionId: string,
  slotId: string,
  updates: {
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    manualTimeLocked?: boolean;
    rippleSubsequent?: boolean;
  }
): ConferenceSchedulePlan {
  const days = plan.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block): ScheduleBlock => {
      if (block.kind !== "session" || block.id !== sessionId) return block;
      const targetIdx = block.talks.findIndex((t) => t.slotId === slotId);
      if (targetIdx === -1) return block;

      const updatedTalks = block.talks.map((talk) => ({ ...talk }));
      const target = updatedTalks[targetIdx];

      const curStart = parseClockMinutes(target.startTime) ?? 8 * 60 + 30;
      const curEnd = parseClockMinutes(target.endTime) ?? curStart + (target.durationMinutes || 30);

      let nextStartMins =
        updates.startTime !== undefined
          ? parseClockMinutes(updates.startTime) ?? curStart
          : curStart;
      let nextDuration =
        updates.durationMinutes !== undefined
          ? Math.max(5, Math.min(240, Math.round(updates.durationMinutes)))
          : target.durationMinutes || 30;
      let nextEndMins =
        updates.endTime !== undefined
          ? parseClockMinutes(updates.endTime) ?? curEnd
          : nextStartMins + nextDuration;

      if (updates.endTime !== undefined && updates.durationMinutes === undefined) {
        if (nextEndMins > nextStartMins) {
          nextDuration = nextEndMins - nextStartMins;
        } else {
          nextEndMins = nextStartMins + nextDuration;
        }
      } else if (updates.durationMinutes !== undefined) {
        nextEndMins = nextStartMins + nextDuration;
      }

      target.startTime = minutesTo24Hour(nextStartMins);
      target.endTime = minutesTo24Hour(nextEndMins);
      target.durationMinutes = nextDuration;
      target.manualTimeLocked =
        updates.manualTimeLocked !== undefined ? updates.manualTimeLocked : true;

      if (updates.rippleSubsequent) {
        let cursor = nextEndMins;
        for (let i = targetIdx + 1; i < updatedTalks.length; i++) {
          const subsequent = updatedTalks[i];
          const dur = Math.max(5, Math.min(240, subsequent.durationMinutes || 30));
          subsequent.manualTimeLocked = false;
          subsequent.startTime = minutesTo24Hour(cursor);
          subsequent.endTime = minutesTo24Hour(cursor + dur);
          cursor += dur;
        }
      }

      let maxEnd = parseClockMinutes(block.startTime) ?? 0;
      for (const t of updatedTalks) {
        const te = parseClockMinutes(t.endTime);
        if (te !== null && te > maxEnd) maxEnd = te;
      }

      return {
        ...block,
        endTime: updatedTalks.length > 0 ? minutesTo24Hour(maxEnd) : block.endTime,
        talks: updatedTalks,
      };
    }),
  }));

  return {
    ...plan,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Checks a single conference day for talk overlaps, negative durations,
 * or session end times spilling past the next scheduled break/event.
 */
export function detectScheduleTimeConflicts(
  day: ScheduleDayPlan
): ScheduleConflictWarning[] {
  const warnings: ScheduleConflictWarning[] = [];
  const sortedBlocks = [...day.blocks].sort((a, b) => {
    const mA = parseClockMinutes(a.startTime) ?? 9999;
    const mB = parseClockMinutes(b.startTime) ?? 9999;
    return mA - mB;
  });

  for (let i = 0; i < sortedBlocks.length; i++) {
    const blk = sortedBlocks[i];
    const blkStart = parseClockMinutes(blk.startTime);
    const blkEnd = parseClockMinutes(blk.endTime);

    if (blkStart !== null && blkEnd !== null && blkEnd < blkStart) {
      warnings.push({
        id: `conflict-rev-${blk.id}`,
        dayId: day.id,
        dayLabel: day.headingLabel,
        blockId: blk.id,
        severity: "error",
        message: `"${blk.title}" ends (${formatHemsScheduleTime(blk.endTime)}) before it starts (${formatHemsScheduleTime(blk.startTime)}).`,
      });
    }

    if (blk.kind === "session") {
      let prevEnd: number | null = null;
      let prevTitle = "";
      for (const talk of blk.talks) {
        const tStart = parseClockMinutes(talk.startTime);
        const tEnd = parseClockMinutes(talk.endTime);
        if (tStart !== null && tEnd !== null && tEnd <= tStart) {
          warnings.push({
            id: `conflict-talk-dur-${talk.slotId}`,
            dayId: day.id,
            dayLabel: day.headingLabel,
            blockId: blk.id,
            slotId: talk.slotId,
            severity: "error",
            message: `In ${blk.title}, talk "${talk.title.slice(0, 48)}" has an invalid time range (${formatHemsTimeRange(talk.startTime, talk.endTime)}).`,
          });
        }
        if (prevEnd !== null && tStart !== null && tStart < prevEnd) {
          warnings.push({
            id: `conflict-talk-overlap-${talk.slotId}`,
            dayId: day.id,
            dayLabel: day.headingLabel,
            blockId: blk.id,
            slotId: talk.slotId,
            severity: "error",
            message: `Overlap inside ${blk.title}: "${talk.title.slice(0, 40)}" (${formatHemsScheduleTime(talk.startTime)}) starts before "${prevTitle.slice(0, 32)}" ends.`,
          });
        }
        prevEnd = tEnd ?? tStart;
        prevTitle = talk.title;
      }

      const nextBlk = sortedBlocks[i + 1];
      const nextStart = nextBlk ? parseClockMinutes(nextBlk.startTime) : null;
      const effectiveSessionEnd = prevEnd ?? blkEnd;
      if (
        effectiveSessionEnd !== null &&
        nextStart !== null &&
        effectiveSessionEnd > nextStart
      ) {
        warnings.push({
          id: `conflict-overrun-${blk.id}`,
          dayId: day.id,
          dayLabel: day.headingLabel,
          blockId: blk.id,
          severity: "warning",
          message: `${blk.title} finishes at ${formatHemsScheduleTime(minutesTo24Hour(effectiveSessionEnd))}, overlapping "${nextBlk.title}" (${formatHemsScheduleTime(nextBlk.startTime)}).`,
        });
      }
    }
  }

  return warnings;
}

/**
 * Refreshes titles, presenter names, and affiliations on already-scheduled talks
 * from live abstract submissions while preserving slot timing and session assignments.
 */
export function refreshPlanMetadataFromSubmissions(
  plan: ConferenceSchedulePlan,
  submissions: readonly AbstractSubmissionRecord[],
  reviews: readonly AbstractReviewRecord[]
): ConferenceSchedulePlan {
  const subById = new Map(submissions.map((s) => [s.id, s]));
  const days = plan.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block): ScheduleBlock => {
      if (block.kind !== "session") return block;
      const talks = block.talks.map((talk): ScheduledTalkSlot => {
        const sub = talk.submissionId ? subById.get(talk.submissionId) : undefined;
        if (!sub) return talk;
        const summary = summarizeSubmissionReviews(sub, reviews);
        const { authorsLine, primaryAffiliation, presenterName } =
          formatSubmissionAuthorsLine(sub);
        return {
          ...talk,
          title: fixMojibakeAndNormalize(sub.title || talk.title).trim(),
          presentingAuthor: presenterName,
          affiliation: primaryAffiliation,
          authorsLine,
          researchTrack: sub.researchTrack,
          isStudentAward: Boolean(sub.studentTravelAwardApplicant),
          medianCombinedScore: summary.medianCombined,
        };
      });
      return {
        ...block,
        talks,
      };
    }),
  }));

  const { posterCandidates } = extractAcceptedSubmissionsForSchedule(
    submissions,
    reviews
  );
  const posters: SchedulePosterEntry[] = posterCandidates.map((cand, idx) => {
    const { authorsLine, primaryAffiliation, presenterName } =
      formatSubmissionAuthorsLine(cand.submission);
    return {
      submissionId: cand.submission.id,
      posterNumber: `P-${String(idx + 1).padStart(2, "0")}`,
      title: fixMojibakeAndNormalize(cand.submission.title || "Untitled Poster").trim(),
      presentingAuthor: presenterName,
      affiliation: primaryAffiliation,
      authorsLine,
      researchTrack: cand.submission.researchTrack,
      isStudentAward: Boolean(cand.submission.studentTravelAwardApplicant),
    };
  });

  return {
    ...plan,
    days,
    posters,
  };
}
