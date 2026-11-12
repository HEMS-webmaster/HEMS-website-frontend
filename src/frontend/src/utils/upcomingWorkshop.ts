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
    sponsor_prospectus_url: getNonEmptyStr("sponsor_prospectus_url"),
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

