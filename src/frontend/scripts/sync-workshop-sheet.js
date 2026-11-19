#!/usr/bin/env node
/**
 * Local snapshot validator & importer for `src/frontend/src/data/upcoming_workshop.json`.
 * External Google Sheets CSV syncing is retired (Addendum 40); live updates are
 * managed in `/admin/workshop-settings`.
 *
 * Usage:
 *   node src/frontend/scripts/sync-workshop-sheet.js
 *   node src/frontend/scripts/sync-workshop-sheet.js --from-json=path/to/backup.json
 */

const fs = require("fs");
const path = require("path");

const CANONICAL_KEYS = [
  "workshop_number",
  "workshop_ordinal",
  "workshop_year",
  "target_window",
  "cycle_stage",
  "exact_dates",
  "conference_start_date",
  "conference_end_date",
  "announcement_headline",
  "announcement_body",
  "venue_confirmed",
  "venue_city_state",
  "hotel_name",
  "hotel_address",
  "hotel_maps_url",
  "hotel_group_rate",
  "hotel_discount_window",
  "hotel_booking_cutoff",
  "hotel_booking_url",
  "venue_session_room",
  "venue_foyer_room",
  "welcome_reception_time",
  "welcome_reception_venue",
  "dinner_day_time",
  "dinner_venue_name",
  "dinner_venue_address",
  "dinner_venue_url",
  "dinner_plan_notes",
  "cfp_open",
  "cfp_abstract_deadline",
  "cfp_abstract_deadline_time",
  "cfp_abstract_deadline_timezone",
  "cfp_notification_date",
  "registration_mode",
  "reg_opening_date",
  "reg_timezone",
  "reg_early_bird_closes",
  "reg_final_cutoff",
  "reg_refund_cutoff",
  "reg_student_early_fee",
  "reg_professional_early_fee",
  "reg_sponsor_early_fee",
  "reg_student_fee",
  "reg_professional_fee",
  "reg_sponsor_fee",
  "reg_guest_dinner_fee",
  "reg_enable_student_fund_donation",
  "student_award_amount",
  "student_award_deadline",
  "student_award_extended",
  "student_award_email",
  "sponsor_coordinator_name",
  "sponsor_coordinator_email",
];

const BOOLEAN_KEYS = new Set([
  "venue_confirmed",
  "cfp_open",
  "reg_enable_student_fund_donation",
  "student_award_extended",
]);

function parseBool(raw, fallback) {
  if (typeof raw === "boolean") return raw;
  const norm = String(raw ?? "").trim().toLowerCase();
  if (!norm) return fallback;
  if (["true", "yes", "1", "open", "y", "confirmed"].includes(norm)) return true;
  if (["false", "no", "0", "closed", "n", "tba"].includes(norm)) return false;
  return fallback;
}

function main() {
  const jsonPath = path.resolve(__dirname, "..", "src", "data", "upcoming_workshop.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Missing bundled baseline file: ${jsonPath}`);
    process.exitCode = 1;
    return;
  }

  const base = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let incoming = base;

  const fromArg = process.argv.find((arg) => arg.startsWith("--from-json="));
  if (fromArg) {
    const sourcePath = path.resolve(process.cwd(), fromArg.slice("--from-json=".length));
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Backup JSON file not found: ${sourcePath}`);
      process.exitCode = 1;
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    incoming = parsed && typeof parsed === "object" && parsed.config ? parsed.config : parsed;
  }

  const normalized = {};
  for (const key of CANONICAL_KEYS) {
    const fallbackVal = base[key];
    const candidate = incoming[key];
    if (key === "workshop_number") {
      const n = Number.parseInt(String(candidate ?? fallbackVal), 10);
      normalized[key] = Number.isFinite(n) && n > 0 ? n : Number(fallbackVal) || 16;
    } else if (BOOLEAN_KEYS.has(key)) {
      normalized[key] = parseBool(candidate, Boolean(fallbackVal));
    } else if (key === "registration_mode") {
      const mode = String(candidate ?? fallbackVal ?? "auto_schedule").trim();
      normalized[key] = ["auto_schedule", "open_manual", "paused_closed"].includes(mode)
        ? mode
        : "auto_schedule";
    } else if (key === "cycle_stage") {
      const stage = String(candidate ?? fallbackVal ?? "save_the_date").trim();
      normalized[key] = ["save_the_date", "open", "program_published", "concluded"].includes(stage)
        ? stage
        : "save_the_date";
    } else {
      normalized[key] = candidate !== undefined && candidate !== null ? String(candidate) : String(fallbackVal ?? "");
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  console.log(
    `✅ Validated 53-key upcoming_workshop.json (${normalized.workshop_ordinal} Workshop · ${normalized.workshop_year} · mode=${normalized.registration_mode}).`
  );
}

main();
