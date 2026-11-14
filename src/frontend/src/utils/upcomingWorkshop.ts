import rawUpcomingWorkshop from "@/data/upcoming_workshop.json";

export type WorkshopCycleStage =
  | "save_the_date"
  | "open"
  | "program_published"
  | "concluded";

export interface UpcomingWorkshopConfig {
  sheet_csv_url: string;
  workshop_number: number;
  workshop_ordinal: string;
  workshop_year: string;
  target_window: string;
  cycle_stage: WorkshopCycleStage;
  exact_dates: string;
  dates_confirmed: boolean;
  announcement_headline: string;
  announcement_body: string;
  interest_form_url: string;
  venue_confirmed: boolean;
  venue_city_state: string;
  hotel_name: string;
  hotel_address: string;
  hotel_maps_url: string;
  hotel_group_rate: string;
  hotel_discount_window: string;
  hotel_booking_cutoff: string;
  hotel_booking_url: string;
  cfp_open: boolean;
  cfp_abstract_deadline: string;
  cfp_abstract_deadline_time: string;
  cfp_abstract_deadline_timezone: string;
  cfp_notification_date: string;
  cfp_submission_url: string;
  registration_open: boolean;
  reg_early_bird_opens: string;
  reg_early_bird_closes: string;
  reg_final_cutoff: string;
  reg_refund_cutoff: string;
  reg_student_fee: string;
  reg_professional_fee: string;
  reg_sponsor_fee: string;
  reg_portal_url: string;
  student_award_amount: string;
  student_award_deadline: string;
  student_award_extended: boolean;
  student_award_email: string;
  student_award_form_url: string;
  sponsor_prospectus_url: string;
  sponsor_coordinator_name: string;
  sponsor_coordinator_email: string;
}

const VALID_STAGES: readonly WorkshopCycleStage[] = [
  "save_the_date",
  "open",
  "program_published",
  "concluded",
];

function isValidCycleStage(val: string): val is WorkshopCycleStage {
  return (VALID_STAGES as readonly string[]).includes(val);
}

function parseBooleanCell(raw: string, fallback: boolean): boolean {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "yes", "1", "open", "y", "confirmed"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "0", "closed", "n", "tba"].includes(normalized)) {
    return false;
  }
  return fallback;
}

/**
 * RFC-4180 compliant CSV tokenizer supporting quoted commas (e.g. "$1,500.00"),
 * escaped double quotes (""), and multi-line quoted cells.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, ""); // Strip UTF-8 BOM if present

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
    } else {
      if (ch === '"') {
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
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

export const DEFAULT_UPCOMING_WORKSHOP: UpcomingWorkshopConfig = {
  ...(rawUpcomingWorkshop as UpcomingWorkshopConfig),
};

/**
 * Merges a published Google Sheet CSV (`field_key`, `value` columns) onto a base
 * `UpcomingWorkshopConfig` without requiring external dependencies.
 */
export function parseWorkshopSheetCsv(
  csvText: string,
  baseConfig: UpcomingWorkshopConfig = DEFAULT_UPCOMING_WORKSHOP
): UpcomingWorkshopConfig {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { ...baseConfig };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const keyIdx = headers.indexOf("field_key");
  const valIdx = headers.indexOf("value");

  if (keyIdx === -1 || valIdx === -1) {
    return { ...baseConfig };
  }

  const kv = new Map<string, string>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= keyIdx) continue;
    const key = (row[keyIdx] || "").trim();
    if (!key || key.startsWith("#")) continue;
    const val = row.length > valIdx ? (row[valIdx] ?? "").trim() : "";
    kv.set(key, val);
  }

  const getStr = (key: keyof UpcomingWorkshopConfig): string => {
    if (!kv.has(key)) return String(baseConfig[key] ?? "");
    return kv.get(key) ?? "";
  };

  const getNonEmptyStr = (key: keyof UpcomingWorkshopConfig): string => {
    const candidate = kv.get(key);
    if (candidate === undefined || candidate === "") {
      return String(baseConfig[key] ?? "");
    }
    return candidate;
  };

  const rawStage = getNonEmptyStr("cycle_stage").toLowerCase();
  const parsedNum = Number.parseInt(getNonEmptyStr("workshop_number"), 10);

  return {
    sheet_csv_url: baseConfig.sheet_csv_url,
    workshop_number: Number.isFinite(parsedNum) ? parsedNum : baseConfig.workshop_number,
    workshop_ordinal: getNonEmptyStr("workshop_ordinal"),
    workshop_year: getNonEmptyStr("workshop_year"),
    target_window: getNonEmptyStr("target_window"),
    cycle_stage: isValidCycleStage(rawStage) ? rawStage : baseConfig.cycle_stage,
    exact_dates: getNonEmptyStr("exact_dates"),
    dates_confirmed: kv.has("dates_confirmed")
      ? parseBooleanCell(kv.get("dates_confirmed") ?? "", baseConfig.dates_confirmed)
      : baseConfig.dates_confirmed,
    announcement_headline: getNonEmptyStr("announcement_headline"),
    announcement_body: getNonEmptyStr("announcement_body"),
    interest_form_url: getStr("interest_form_url"),
    venue_confirmed: kv.has("venue_confirmed")
      ? parseBooleanCell(kv.get("venue_confirmed") ?? "", baseConfig.venue_confirmed)
      : baseConfig.venue_confirmed,
    venue_city_state: getNonEmptyStr("venue_city_state"),
    hotel_name: getNonEmptyStr("hotel_name"),
    hotel_address: getNonEmptyStr("hotel_address"),
    hotel_maps_url: getStr("hotel_maps_url"),
    hotel_group_rate: getNonEmptyStr("hotel_group_rate"),
    hotel_discount_window: getNonEmptyStr("hotel_discount_window"),
    hotel_booking_cutoff: getNonEmptyStr("hotel_booking_cutoff"),
    hotel_booking_url: getStr("hotel_booking_url"),
    cfp_open: kv.has("cfp_open")
      ? parseBooleanCell(kv.get("cfp_open") ?? "", baseConfig.cfp_open)
      : baseConfig.cfp_open,
    cfp_abstract_deadline: getNonEmptyStr("cfp_abstract_deadline"),
    cfp_abstract_deadline_time: getNonEmptyStr("cfp_abstract_deadline_time"),
    cfp_abstract_deadline_timezone: getNonEmptyStr("cfp_abstract_deadline_timezone"),
    cfp_notification_date: getNonEmptyStr("cfp_notification_date"),
    cfp_submission_url: getStr("cfp_submission_url"),
    registration_open: kv.has("registration_open")
      ? parseBooleanCell(kv.get("registration_open") ?? "", baseConfig.registration_open)
      : baseConfig.registration_open,
    reg_early_bird_opens: getNonEmptyStr("reg_early_bird_opens"),
    reg_early_bird_closes: getNonEmptyStr("reg_early_bird_closes"),
    reg_final_cutoff: getNonEmptyStr("reg_final_cutoff"),
    reg_refund_cutoff: getNonEmptyStr("reg_refund_cutoff"),
    reg_student_fee: getNonEmptyStr("reg_student_fee"),
    reg_professional_fee: getNonEmptyStr("reg_professional_fee"),
    reg_sponsor_fee: getNonEmptyStr("reg_sponsor_fee"),
    reg_portal_url: getStr("reg_portal_url"),
    student_award_amount: getNonEmptyStr("student_award_amount"),
    student_award_deadline: getNonEmptyStr("student_award_deadline"),
    student_award_extended: kv.has("student_award_extended")
      ? parseBooleanCell(
          kv.get("student_award_extended") ?? "",
          baseConfig.student_award_extended
        )
      : baseConfig.student_award_extended,
    student_award_email: getNonEmptyStr("student_award_email"),
    student_award_form_url: getStr("student_award_form_url"),
    sponsor_prospectus_url: getStr("sponsor_prospectus_url"),
    sponsor_coordinator_name: getNonEmptyStr("sponsor_coordinator_name"),
    sponsor_coordinator_email: (() => {
      const email = getNonEmptyStr("sponsor_coordinator_email");
      return email.toLowerCase() === "rtshort00@gmail.com"
        ? "tim.short@hems-workshop.org"
        : email;
    })(),
  };
}

export function getStaticUpcomingWorkshop(): UpcomingWorkshopConfig {
  return DEFAULT_UPCOMING_WORKSHOP;
}

export interface AbstractDeadlineEvaluation {
  dateLabel: string;
  timeLabel: string;
  timezoneLabel: string;
  formattedDeadline: string;
  deadlineEpochMs: number | null;
  deadlineIsoUtc: string | null;
  hasConcreteDate: boolean;
  isPastDeadline: boolean;
}

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

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

function parseDeadlineCalendarDate(
  rawDate: string
): { year: number; month: number; day: number } | null {
  const cleaned = rawDate.trim();
  if (!cleaned || /\b(tba|tbd|to be announced|to be determined)\b/i.test(cleaned)) {
    return null;
  }

  const isoMatch = /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/.exec(cleaned);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  const slashMatch = /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/.exec(cleaned);
  if (slashMatch) {
    const month = Number.parseInt(slashMatch[1], 10);
    const day = Number.parseInt(slashMatch[2], 10);
    const year = Number.parseInt(slashMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  const monthFirstMatch =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (monthFirstMatch) {
    const month = MONTH_INDEX_MAP[monthFirstMatch[1].toLowerCase()];
    const day = Number.parseInt(monthFirstMatch[2], 10);
    const year = Number.parseInt(monthFirstMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  const dayFirstMatch =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (dayFirstMatch) {
    const day = Number.parseInt(dayFirstMatch[1], 10);
    const month = MONTH_INDEX_MAP[dayFirstMatch[2].toLowerCase()];
    const year = Number.parseInt(dayFirstMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  return null;
}

function parseDeadlineClockTime(rawTime: string): {
  hour: number;
  minute: number;
  second: number;
  ms: number;
} {
  const cleaned = rawTime.trim().toLowerCase();
  if (cleaned === "noon") {
    return { hour: 12, minute: 0, second: 59, ms: 999 };
  }
  if (cleaned === "midnight") {
    return { hour: 23, minute: 59, second: 59, ms: 999 };
  }

  const match = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(rawTime);
  if (!match) {
    return { hour: 23, minute: 59, second: 59, ms: 999 };
  }

  let hour = Number.parseInt(match[1], 10);
  const minute = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
  const hasExplicitSeconds = Boolean(match[3]);
  const second = hasExplicitSeconds
    ? Math.min(59, Math.max(0, Number.parseInt(match[3], 10)))
    : 59;
  const meridiem = match[4]?.toLowerCase();

  if (meridiem === "am") {
    if (hour === 12) hour = 0;
  } else if (meridiem === "pm") {
    if (hour < 12) hour += 12;
  }

  if (hour < 0 || hour > 23) {
    return { hour: 23, minute: 59, second: 59, ms: 999 };
  }

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
    const hrs = Number.parseInt(m[2], 10);
    const mins = m[3] ? Number.parseInt(m[3], 10) : 0;
    return sign * (hrs * 60 + mins);
  } catch {
    return null;
  }
}

function parseTimezoneOffsetMinutes(
  rawTz: string,
  refUtcMs: number
): number {
  const cleaned = rawTz.trim();
  if (!cleaned) return 0;

  const explicitUtcMatch =
    /(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?|\(([+-])(\d{2}):?(\d{2})\)|([+-])(\d{2}):(\d{2})$/i.exec(
      cleaned
    );
  if (explicitUtcMatch) {
    const signChar =
      explicitUtcMatch[1] || explicitUtcMatch[4] || explicitUtcMatch[7];
    const hourStr =
      explicitUtcMatch[2] || explicitUtcMatch[5] || explicitUtcMatch[8];
    const minStr =
      explicitUtcMatch[3] || explicitUtcMatch[6] || explicitUtcMatch[9];
    const sign = signChar === "-" ? -1 : 1;
    const hrs = Number.parseInt(hourStr, 10);
    const mins = minStr ? Number.parseInt(minStr, 10) : 0;
    return sign * (hrs * 60 + mins);
  }

  const tokens = cleaned.toUpperCase().split(/[\s,()[\]/]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok in TZ_ABBREV_OFFSET_MINUTES) {
      return TZ_ABBREV_OFFSET_MINUTES[tok];
    }
    if (tok in GENERIC_US_IANA_MAP) {
      const ianaOffset = resolveIanaOffsetMinutes(GENERIC_US_IANA_MAP[tok], refUtcMs);
      if (ianaOffset !== null) return ianaOffset;
    }
  }

  const directIanaMatch = /[A-Za-z_]+\/[A-Za-z0-9_+-]+/.exec(cleaned);
  if (directIanaMatch) {
    const ianaOffset = resolveIanaOffsetMinutes(directIanaMatch[0], refUtcMs);
    if (ianaOffset !== null) return ianaOffset;
  }

  return 0;
}

export function formatAbstractDeadlineDisplay(
  workshop: Pick<
    UpcomingWorkshopConfig,
    | "cfp_abstract_deadline"
    | "cfp_abstract_deadline_time"
    | "cfp_abstract_deadline_timezone"
  >
): string {
  const dateLabel = (workshop.cfp_abstract_deadline || "").trim() || "Summer 2027 (TBA)";
  const timeLabel = (workshop.cfp_abstract_deadline_time || "").trim() || "11:59 PM";
  const timezoneLabel =
    (workshop.cfp_abstract_deadline_timezone || "").trim() || "EDT (UTC-04:00)";

  const alreadyHasClock = /\b\d{1,2}:\d{2}\b/.test(dateLabel);
  if (alreadyHasClock) {
    const hasTz =
      /\b(UTC|GMT|EDT|EST|CDT|CST|MDT|MST|PDT|PST|AOE|ET|CT|MT|PT)\b/i.test(
        dateLabel
      ) || /[A-Za-z_]+\/[A-Za-z_]+/.test(dateLabel);
    return hasTz ? dateLabel : `${dateLabel} ${timezoneLabel}`;
  }

  const hasConcreteDate = parseDeadlineCalendarDate(dateLabel) !== null;
  return hasConcreteDate
    ? `${dateLabel} at ${timeLabel} ${timezoneLabel}`
    : `${dateLabel} • ${timeLabel} ${timezoneLabel}`;
}

export function evaluateAbstractDeadline(
  workshop: Pick<
    UpcomingWorkshopConfig,
    | "cfp_abstract_deadline"
    | "cfp_abstract_deadline_time"
    | "cfp_abstract_deadline_timezone"
  >,
  nowMs: number = Date.now()
): AbstractDeadlineEvaluation {
  const dateLabel = (workshop.cfp_abstract_deadline || "").trim() || "Summer 2027 (TBA)";
  const timeLabel = (workshop.cfp_abstract_deadline_time || "").trim() || "11:59 PM";
  const timezoneLabel =
    (workshop.cfp_abstract_deadline_timezone || "").trim() || "EDT (UTC-04:00)";
  const formattedDeadline = formatAbstractDeadlineDisplay({
    cfp_abstract_deadline: dateLabel,
    cfp_abstract_deadline_time: timeLabel,
    cfp_abstract_deadline_timezone: timezoneLabel,
  });

  const parsedDate = parseDeadlineCalendarDate(dateLabel);
  if (!parsedDate) {
    return {
      dateLabel,
      timeLabel,
      timezoneLabel,
      formattedDeadline,
      deadlineEpochMs: null,
      deadlineIsoUtc: null,
      hasConcreteDate: false,
      isPastDeadline: false,
    };
  }

  const inlineTimeMatch = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(dateLabel);
  const parsedTime = parseDeadlineClockTime(
    inlineTimeMatch ? inlineTimeMatch[0] : timeLabel
  );

  const wallClockUtcMs = Date.UTC(
    parsedDate.year,
    parsedDate.month - 1,
    parsedDate.day,
    parsedTime.hour,
    parsedTime.minute,
    parsedTime.second,
    parsedTime.ms
  );

  const offsetMinutes = parseTimezoneOffsetMinutes(timezoneLabel, wallClockUtcMs);
  const deadlineEpochMs = wallClockUtcMs - offsetMinutes * 60_000;

  return {
    dateLabel,
    timeLabel,
    timezoneLabel,
    formattedDeadline,
    deadlineEpochMs,
    deadlineIsoUtc: new Date(deadlineEpochMs).toISOString(),
    hasConcreteDate: true,
    isPastDeadline: nowMs > deadlineEpochMs,
  };
}

