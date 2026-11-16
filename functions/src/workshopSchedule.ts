import * as admin from "firebase-admin";

export type WorkshopCycleStage =
  | "save_the_date"
  | "open"
  | "program_published"
  | "concluded";

export type ServerRegistrationMode =
  | "auto_schedule"
  | "open_manual"
  | "paused_closed";

export interface ServerWorkshopScheduleConfig {
  workshop_number: number;
  workshop_ordinal: string;
  workshop_year: string;
  target_window: string;
  cycle_stage: WorkshopCycleStage;
  exact_dates: string;
  conference_start_date: string;
  conference_end_date: string;
  registration_mode: ServerRegistrationMode;
  reg_opening_date: string;
  reg_timezone: string;
  reg_early_bird_closes: string;
  reg_final_cutoff: string;
  reg_refund_cutoff: string;
  reg_student_early_fee: string;
  reg_professional_early_fee: string;
  reg_sponsor_early_fee: string;
  reg_student_fee: string;
  reg_professional_fee: string;
  reg_sponsor_fee: string;
  reg_guest_dinner_fee: string;
  reg_enable_student_fund_donation: boolean;
  hotel_name: string;
  venue_city_state: string;
}

export type RegistrationLifecyclePhase =
  | "unscheduled"
  | "before_opening"
  | "early_bird"
  | "regular"
  | "concluded_closed"
  | "force_closed";

export interface CalendarDateValue {
  year: number;
  month: number;
  day: number;
}

export interface ServerRegistrationScheduleEvaluation {
  phase: RegistrationLifecyclePhase;
  isOpen: boolean;
  isEarlyBirdActive: boolean;
  pricingWindow: "early_bird" | "regular";
  statusBadgeLabel: string;
  timezoneLabel: string;
  openingDateLabel: string;
  earlyBirdCloseDateLabel: string;
  conferenceEndDateLabel: string;
  studentEarlyCents: number;
  professionalEarlyCents: number;
  sponsorEarlyCents: number;
  studentRegularCents: number;
  professionalRegularCents: number;
  sponsorRegularCents: number;
  guestDinnerCents: number;
  activeStudentCents: number;
  activeProfessionalCents: number;
  activeSponsorCents: number;
}

const DEFAULT_SERVER_WORKSHOP_CONFIG: ServerWorkshopScheduleConfig = {
  workshop_number: 16,
  workshop_ordinal: "16th",
  workshop_year: "2027",
  target_window: "September 2027",
  cycle_stage: "save_the_date",
  exact_dates: "September 2027 (Exact Dates TBA)",
  conference_start_date: "September 2027 (TBA)",
  conference_end_date: "September 2027 (TBA)",
  registration_mode: "auto_schedule",
  reg_opening_date: "Spring 2027 (TBA)",
  reg_timezone: "EDT (UTC-04:00)",
  reg_early_bird_closes: "Summer 2027 (TBA)",
  reg_final_cutoff: "September 2027 (TBA)",
  reg_refund_cutoff: "August 2027 (TBA)",
  reg_student_early_fee: "$200",
  reg_professional_early_fee: "$425",
  reg_sponsor_early_fee: "$1,350",
  reg_student_fee: "$250",
  reg_professional_fee: "$500",
  reg_sponsor_fee: "$1,350",
  reg_guest_dinner_fee: "$75",
  reg_enable_student_fund_donation: true,
  hotel_name: "Official Beachfront Venue To Be Announced",
  venue_city_state: "Coastal Venue TBA",
};

const MONTH_INDEX_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const TZ_ABBREV_OFFSET_MINUTES: Record<string, number> = {
  AOE: -720,
  HST: -600,
  AKST: -540,
  AKDT: -480,
  PST: -480,
  PDT: -420,
  MST: -420,
  MDT: -360,
  CST: -360,
  CDT: -300,
  EST: -300,
  EDT: -240,
  AST: -240,
  ADT: -180,
  UTC: 0,
  GMT: 0,
  BST: 60,
  CET: 60,
  CEST: 120,
  JST: 540,
};

const GENERIC_US_IANA_MAP: Record<string, string> = {
  ET: "America/New_York",
  CT: "America/Chicago",
  MT: "America/Denver",
  PT: "America/Los_Angeles",
};

let cachedSheetConfig: { config: ServerWorkshopScheduleConfig; fetchedAtMs: number } | null =
  null;

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  const text = csvText.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (ch === "\r" && next === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += ch;
    }
  }
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  return rows;
}

function parseBool(raw: string, fallback: boolean): boolean {
  const norm = raw.trim().toLowerCase();
  if (!norm) return fallback;
  if (["true", "yes", "1", "open", "y", "confirmed"].includes(norm)) return true;
  if (["false", "no", "0", "closed", "n", "tba"].includes(norm)) return false;
  return fallback;
}

function parseCurrencyToCents(raw: string, fallbackCents: number): number {
  const cleaned = String(raw || "").replace(/[^0-9.]/g, "");
  if (!cleaned) return fallbackCents;
  const val = Number.parseFloat(cleaned);
  if (!Number.isFinite(val) || val < 0) return fallbackCents;
  return Math.round(val * 100);
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

function parseCalendarDate(rawDate: string): CalendarDateValue | null {
  const cleaned = rawDate.trim();
  if (!cleaned || /\b(tba|tbd|to be announced|to be determined)\b/i.test(cleaned)) {
    return null;
  }

  const isoMatch = /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/.exec(cleaned);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) return { year, month, day };
  }

  const slashMatch = /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/.exec(cleaned);
  if (slashMatch) {
    const month = Number.parseInt(slashMatch[1], 10);
    const day = Number.parseInt(slashMatch[2], 10);
    const year = Number.parseInt(slashMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) return { year, month, day };
  }

  const monthFirstMatch =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (monthFirstMatch) {
    const month = MONTH_INDEX_MAP[monthFirstMatch[1].toLowerCase()];
    const day = Number.parseInt(monthFirstMatch[2], 10);
    const year = Number.parseInt(monthFirstMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) return { year, month, day };
  }

  const dayFirstMatch =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (dayFirstMatch) {
    const day = Number.parseInt(dayFirstMatch[1], 10);
    const month = MONTH_INDEX_MAP[dayFirstMatch[2].toLowerCase()];
    const year = Number.parseInt(dayFirstMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) return { year, month, day };
  }

  return null;
}

function parseConferenceEndDate(raw: string): CalendarDateValue | null {
  const cleaned = String(raw || "")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || /\b(tba|tbd|to be announced|to be determined)\b/i.test(cleaned)) {
    return null;
  }

  const sameMonthMatch =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?\s*-\s*(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (sameMonthMatch) {
    const month = MONTH_INDEX_MAP[sameMonthMatch[1].toLowerCase()];
    const endDay = Number.parseInt(sameMonthMatch[2], 10);
    const year = Number.parseInt(sameMonthMatch[3], 10);
    if (month && isValidCalendarDate(year, month, endDay)) {
      return { year, month, day: endDay };
    }
  }

  const crossMonthMatch =
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?\s*-\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (crossMonthMatch) {
    const month = MONTH_INDEX_MAP[crossMonthMatch[1].toLowerCase()];
    const endDay = Number.parseInt(crossMonthMatch[2], 10);
    const year = Number.parseInt(crossMonthMatch[3], 10);
    if (month && isValidCalendarDate(year, month, endDay)) {
      return { year, month, day: endDay };
    }
  }

  const splitParts = cleaned.split(/\s+(?:to|-)\s+/i);
  if (splitParts.length === 2) {
    const end = parseCalendarDate(splitParts[1]);
    if (end) return end;
  }

  return parseCalendarDate(cleaned);
}

function parseClockTime(rawTime: string): {
  hour: number;
  minute: number;
  second: number;
  ms: number;
} {
  const cleaned = rawTime.trim().toLowerCase();
  if (cleaned === "noon") return { hour: 12, minute: 0, second: 59, ms: 999 };
  const match = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(cleaned);
  if (!match) return { hour: 23, minute: 59, second: 59, ms: 999 };

  let hour = Number.parseInt(match[1], 10);
  const minute = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
  const second = match[3] ? Math.min(59, Math.max(0, Number.parseInt(match[3], 10))) : 59;
  const meridiem = match[4]?.toLowerCase();
  if (meridiem === "am" && hour === 12) hour = 0;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (hour < 0 || hour > 23) return { hour: 23, minute: 59, second: 59, ms: 999 };
  return { hour, minute, second, ms: 999 };
}

function resolveIanaOffsetMinutes(ianaZone: string, refUtcMs: number): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date(refUtcMs));
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
    if (tzPart === "GMT" || tzPart === "UTC") return 0;
    const m = /(?:GMT|UTC)\s*([+-])\s*(\d{1,2})(?::(\d{2}))?/i.exec(tzPart);
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    return sign * (Number.parseInt(m[2], 10) * 60 + (m[3] ? Number.parseInt(m[3], 10) : 0));
  } catch {
    return null;
  }
}

function parseTimezoneOffsetMinutes(rawTz: string, refUtcMs: number): number {
  const cleaned = rawTz.trim();
  if (!cleaned) return 0;

  const explicitUtcMatch =
    /(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?|\(([+-])(\d{2}):?(\d{2})\)|([+-])(\d{2}):(\d{2})$/i.exec(
      cleaned
    );
  if (explicitUtcMatch) {
    const signChar = explicitUtcMatch[1] || explicitUtcMatch[4] || explicitUtcMatch[7];
    const hourStr = explicitUtcMatch[2] || explicitUtcMatch[5] || explicitUtcMatch[8];
    const minStr = explicitUtcMatch[3] || explicitUtcMatch[6] || explicitUtcMatch[9];
    const sign = signChar === "-" ? -1 : 1;
    return sign * (Number.parseInt(hourStr, 10) * 60 + (minStr ? Number.parseInt(minStr, 10) : 0));
  }

  const tokens = cleaned.toUpperCase().split(/[\s,()[\]/]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok in TZ_ABBREV_OFFSET_MINUTES) return TZ_ABBREV_OFFSET_MINUTES[tok];
    if (tok in GENERIC_US_IANA_MAP) {
      const ianaOffset = resolveIanaOffsetMinutes(GENERIC_US_IANA_MAP[tok], refUtcMs);
      if (ianaOffset !== null) return ianaOffset;
    }
  }

  const directIana = /[A-Za-z_]+\/[A-Za-z0-9_+-]+/.exec(cleaned);
  if (directIana) {
    const ianaOffset = resolveIanaOffsetMinutes(directIana[0], refUtcMs);
    if (ianaOffset !== null) return ianaOffset;
  }

  return 0;
}

function computeZonedWallClockEpochMs(
  cal: CalendarDateValue,
  time: { hour: number; minute: number; second: number; ms: number },
  timezoneLabel: string
): number {
  const wallClockUtcMs = Date.UTC(
    cal.year,
    cal.month - 1,
    cal.day,
    time.hour,
    time.minute,
    time.second,
    time.ms
  );
  const offsetMinutes = parseTimezoneOffsetMinutes(timezoneLabel, wallClockUtcMs);
  return wallClockUtcMs - offsetMinutes * 60_000;
}

export function parseServerWorkshopSheetCsv(csvText: string): ServerWorkshopScheduleConfig {
  const base = { ...DEFAULT_SERVER_WORKSHOP_CONFIG };
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return base;

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const keyIdx = headers.indexOf("field_key");
  const valIdx = headers.indexOf("value");
  if (keyIdx === -1 || valIdx === -1) return base;

  const aliases: Record<string, keyof ServerWorkshopScheduleConfig> = {
    registration_opening_date: "reg_opening_date",
    reg_open_date: "reg_opening_date",
    early_registration_date: "reg_early_bird_closes",
    reg_early_registration_date: "reg_early_bird_closes",
    reg_early_bird_deadline: "reg_early_bird_closes",
    conference_last_date: "conference_end_date",
    workshop_end_date: "conference_end_date",
    workshop_start_date: "conference_start_date",
  };

  const kv = new Map<string, string>();
  const primarySeen = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= keyIdx) continue;
    const rawKey = (row[keyIdx] || "").trim();
    if (!rawKey || rawKey.startsWith("#")) continue;
    const val = row.length > valIdx ? (row[valIdx] ?? "").trim() : "";
    if (rawKey in base) {
      primarySeen.add(rawKey);
      kv.set(rawKey, val);
    } else if (rawKey in aliases) {
      const canonical = aliases[rawKey];
      if (!primarySeen.has(canonical)) kv.set(canonical, val);
    }
  }

  const getStr = (k: keyof ServerWorkshopScheduleConfig): string => {
    const v = kv.get(k);
    return v === undefined || v === "" ? String(base[k] ?? "") : v;
  };

  const parsedNum = Number.parseInt(getStr("workshop_number"), 10);

  let registrationMode: ServerRegistrationMode = base.registration_mode;
  if (kv.has("reg_force_closed") && parseBool(kv.get("reg_force_closed") || "", false)) {
    registrationMode = "paused_closed";
  } else if (kv.has("registration_open") && parseBool(kv.get("registration_open") || "", false)) {
    registrationMode = "open_manual";
  }

  return {
    ...base,
    workshop_number: Number.isFinite(parsedNum) ? parsedNum : base.workshop_number,
    workshop_ordinal: getStr("workshop_ordinal"),
    workshop_year: getStr("workshop_year"),
    target_window: getStr("target_window"),
    exact_dates: getStr("exact_dates"),
    conference_start_date: getStr("conference_start_date"),
    conference_end_date: getStr("conference_end_date"),
    registration_mode: registrationMode,
    reg_opening_date: getStr("reg_opening_date"),
    reg_timezone: getStr("reg_timezone"),
    reg_early_bird_closes: getStr("reg_early_bird_closes"),
    reg_final_cutoff: getStr("reg_final_cutoff"),
    reg_refund_cutoff: getStr("reg_refund_cutoff"),
    reg_student_early_fee: getStr("reg_student_early_fee"),
    reg_professional_early_fee: getStr("reg_professional_early_fee"),
    reg_sponsor_early_fee: getStr("reg_sponsor_early_fee"),
    reg_student_fee: getStr("reg_student_fee"),
    reg_professional_fee: getStr("reg_professional_fee"),
    reg_sponsor_fee: getStr("reg_sponsor_fee"),
    reg_guest_dinner_fee: getStr("reg_guest_dinner_fee"),
    reg_enable_student_fund_donation: kv.has("reg_enable_student_fund_donation")
      ? parseBool(
          kv.get("reg_enable_student_fund_donation") || "",
          base.reg_enable_student_fund_donation
        )
      : base.reg_enable_student_fund_donation,
    hotel_name: getStr("hotel_name"),
    venue_city_state: getStr("venue_city_state"),
  };
}

export function normalizeServerWorkshopConfig(
  raw: unknown
): ServerWorkshopScheduleConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SERVER_WORKSHOP_CONFIG };
  }
  const src = raw as Record<string, unknown>;
  const base = DEFAULT_SERVER_WORKSHOP_CONFIG;

  const getStr = (k: keyof ServerWorkshopScheduleConfig): string => {
    const val = src[k];
    if (typeof val === "string" && val.trim()) return val.trim();
    return String(base[k] ?? "");
  };

  let registrationMode: ServerRegistrationMode = base.registration_mode;
  const rawMode = String(src.registration_mode ?? "").trim().toLowerCase();
  if (rawMode === "auto_schedule" || rawMode === "open_manual" || rawMode === "paused_closed") {
    registrationMode = rawMode;
  } else if (parseBool(String(src.reg_force_closed ?? ""), false)) {
    registrationMode = "paused_closed";
  } else if (parseBool(String(src.registration_open ?? ""), false)) {
    registrationMode = "open_manual";
  }

  const parsedNum = Number.parseInt(String(src.workshop_number ?? base.workshop_number), 10);
  const openingDate =
    (typeof src.reg_opening_date === "string" && src.reg_opening_date.trim()) ||
    (typeof src.reg_early_bird_opens === "string" && src.reg_early_bird_opens.trim()) ||
    base.reg_opening_date;

  return {
    ...base,
    workshop_number: Number.isFinite(parsedNum) && parsedNum > 0 ? parsedNum : base.workshop_number,
    workshop_ordinal: getStr("workshop_ordinal"),
    workshop_year: getStr("workshop_year"),
    target_window: getStr("target_window"),
    cycle_stage:
      src.cycle_stage === "open" ||
      src.cycle_stage === "program_published" ||
      src.cycle_stage === "concluded"
        ? src.cycle_stage
        : "save_the_date",
    exact_dates: getStr("exact_dates"),
    conference_start_date: getStr("conference_start_date"),
    conference_end_date: getStr("conference_end_date"),
    registration_mode: registrationMode,
    reg_opening_date: openingDate,
    reg_timezone: getStr("reg_timezone"),
    reg_early_bird_closes: getStr("reg_early_bird_closes"),
    reg_final_cutoff: getStr("reg_final_cutoff"),
    reg_refund_cutoff: getStr("reg_refund_cutoff"),
    reg_student_early_fee: getStr("reg_student_early_fee"),
    reg_professional_early_fee: getStr("reg_professional_early_fee"),
    reg_sponsor_early_fee: getStr("reg_sponsor_early_fee"),
    reg_student_fee: getStr("reg_student_fee"),
    reg_professional_fee: getStr("reg_professional_fee"),
    reg_sponsor_fee: getStr("reg_sponsor_fee"),
    reg_guest_dinner_fee: getStr("reg_guest_dinner_fee"),
    reg_enable_student_fund_donation: parseBool(
      String(src.reg_enable_student_fund_donation ?? base.reg_enable_student_fund_donation),
      base.reg_enable_student_fund_donation
    ),
    hotel_name: getStr("hotel_name"),
    venue_city_state: getStr("venue_city_state"),
  };
}

/**
 * Fetches authoritative live workshop schedule directly from Firestore (`site_config/workshop_live`)
 * with a 30s in-memory instance cache, falling back to DEFAULT_SERVER_WORKSHOP_CONFIG.
 */
export async function fetchServerWorkshopConfig(): Promise<ServerWorkshopScheduleConfig> {
  const now = Date.now();
  if (cachedSheetConfig && now - cachedSheetConfig.fetchedAtMs < 30_000) {
    return cachedSheetConfig.config;
  }

  try {
    const snap = await admin.firestore().collection("site_config").doc("workshop_live").get();
    if (snap.exists) {
      const data = snap.data() as { config?: unknown } | undefined;
      const parsed = normalizeServerWorkshopConfig(data?.config || data);
      cachedSheetConfig = { config: parsed, fetchedAtMs: now };
      return parsed;
    }
  } catch (err) {
    console.warn("[workshopSchedule] Firestore site_config read skipped, using defaults:", err);
  }

  return cachedSheetConfig?.config || DEFAULT_SERVER_WORKSHOP_CONFIG;
}

export function evaluateServerRegistrationSchedule(
  workshop: ServerWorkshopScheduleConfig,
  nowMs: number = Date.now()
): ServerRegistrationScheduleEvaluation {
  const timezoneLabel = (workshop.reg_timezone || "").trim() || "EDT (UTC-04:00)";
  const openingDateLabel = (workshop.reg_opening_date || "").trim() || "Spring 2027 (TBA)";
  const earlyBirdCloseDateLabel =
    (workshop.reg_early_bird_closes || "").trim() || "Summer 2027 (TBA)";
  const conferenceEndDateLabel =
    (workshop.conference_end_date &&
    !/\b(tba|tbd|to be announced)\b/i.test(workshop.conference_end_date)
      ? workshop.conference_end_date.trim()
      : "") ||
    (workshop.exact_dates && !/\b(tba|tbd|to be announced)\b/i.test(workshop.exact_dates)
      ? workshop.exact_dates.trim()
      : "") ||
    workshop.reg_final_cutoff ||
    "September 2027 (TBA)";

  const openingCal = parseCalendarDate(workshop.reg_opening_date);
  let openEpochMs: number | null = null;
  if (openingCal) {
    const inlineTime = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(openingDateLabel);
    const openTime = inlineTime
      ? parseClockTime(inlineTime[0])
      : { hour: 0, minute: 0, second: 0, ms: 0 };
    openEpochMs = computeZonedWallClockEpochMs(openingCal, openTime, timezoneLabel);
  }

  const earlyCloseCal = parseCalendarDate(earlyBirdCloseDateLabel);
  let earlyBirdCloseEpochMs: number | null = null;
  if (earlyCloseCal) {
    const inlineTime = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(
      earlyBirdCloseDateLabel
    );
    const closeTime = inlineTime
      ? parseClockTime(inlineTime[0])
      : { hour: 23, minute: 59, second: 59, ms: 999 };
    earlyBirdCloseEpochMs = computeZonedWallClockEpochMs(
      earlyCloseCal,
      closeTime,
      timezoneLabel
    );
  }

  const conferenceEndCal =
    parseCalendarDate(workshop.conference_end_date) ||
    parseConferenceEndDate(workshop.exact_dates) ||
    parseCalendarDate(workshop.reg_final_cutoff);
  let conferenceEndEpochMs: number | null = null;
  if (conferenceEndCal) {
    conferenceEndEpochMs = computeZonedWallClockEpochMs(
      conferenceEndCal,
      { hour: 23, minute: 59, second: 59, ms: 999 },
      timezoneLabel
    );
  }

  let phase: RegistrationLifecyclePhase = "unscheduled";
  let isOpen = false;
  let pricingWindow: "early_bird" | "regular" = "regular";
  let statusBadgeLabel = `Opening ${workshop.workshop_year || "2027"}`;

  if (workshop.registration_mode === "paused_closed") {
    phase = "force_closed";
    isOpen = false;
    statusBadgeLabel = "Registration Paused";
  } else if (conferenceEndEpochMs !== null && nowMs > conferenceEndEpochMs) {
    phase = "concluded_closed";
    isOpen = false;
    statusBadgeLabel = "Closed (Workshop Ended)";
  } else if (workshop.registration_mode === "open_manual") {
    isOpen = true;
    if (earlyBirdCloseEpochMs !== null && nowMs <= earlyBirdCloseEpochMs) {
      phase = "early_bird";
      pricingWindow = "early_bird";
      statusBadgeLabel = "Early Registration Open";
    } else {
      phase = "regular";
      pricingWindow = "regular";
      statusBadgeLabel = "Registration Open";
    }
  } else if (openEpochMs !== null) {
    if (nowMs < openEpochMs) {
      phase = "before_opening";
      isOpen = false;
      statusBadgeLabel = `Opens ${openingDateLabel}`;
    } else if (earlyBirdCloseEpochMs !== null && nowMs <= earlyBirdCloseEpochMs) {
      phase = "early_bird";
      isOpen = true;
      pricingWindow = "early_bird";
      statusBadgeLabel = "Early Registration Open";
    } else {
      phase = "regular";
      isOpen = true;
      pricingWindow = "regular";
      statusBadgeLabel = "Registration Open";
    }
  }

  const studentRegularCents = parseCurrencyToCents(workshop.reg_student_fee, 25000);
  const professionalRegularCents = parseCurrencyToCents(
    workshop.reg_professional_fee,
    50000
  );
  const sponsorRegularCents = parseCurrencyToCents(workshop.reg_sponsor_fee, 135000);

  const studentEarlyCents = parseCurrencyToCents(
    workshop.reg_student_early_fee,
    studentRegularCents
  );
  const professionalEarlyCents = parseCurrencyToCents(
    workshop.reg_professional_early_fee,
    professionalRegularCents
  );
  const sponsorEarlyCents = parseCurrencyToCents(
    workshop.reg_sponsor_early_fee,
    sponsorRegularCents
  );
  const guestDinnerCents = parseCurrencyToCents(workshop.reg_guest_dinner_fee, 7500);

  const isEarlyBirdActive =
    pricingWindow === "early_bird" &&
    (studentEarlyCents < studentRegularCents ||
      professionalEarlyCents < professionalRegularCents ||
      sponsorEarlyCents < sponsorRegularCents);

  return {
    phase,
    isOpen,
    isEarlyBirdActive,
    pricingWindow,
    statusBadgeLabel,
    timezoneLabel,
    openingDateLabel,
    earlyBirdCloseDateLabel,
    conferenceEndDateLabel,
    studentEarlyCents,
    professionalEarlyCents,
    sponsorEarlyCents,
    studentRegularCents,
    professionalRegularCents,
    sponsorRegularCents,
    guestDinnerCents,
    activeStudentCents:
      pricingWindow === "early_bird" ? studentEarlyCents : studentRegularCents,
    activeProfessionalCents:
      pricingWindow === "early_bird" ? professionalEarlyCents : professionalRegularCents,
    activeSponsorCents:
      pricingWindow === "early_bird" ? sponsorEarlyCents : sponsorRegularCents,
  };
}
