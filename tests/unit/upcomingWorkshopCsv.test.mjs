import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const require = createRequire(import.meta.url);

const jsonPath = path.join(repoRoot, "src", "frontend", "src", "data", "upcoming_workshop.json");
const archiveDir = path.join(repoRoot, "docs", "workshop-sheets", "archive");
const legacyCsvRoot = path.join(repoRoot, "docs", "workshop-sheets");
const rulesPath = path.join(repoRoot, "firestore.rules");
const workshopScheduleModulePath = path.join(repoRoot, "functions", "lib", "workshopSchedule.js");

const CANONICAL_53_KEYS = [
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

const DROPPED_KEYS = [
  "sheet_csv_url",
  "sponsor_prospectus_url",
  "cfp_submission_url",
  "reg_portal_url",
  "interest_form_url",
  "student_award_form_url",
  "dates_confirmed",
  "reg_early_bird_opens",
  "registration_open",
  "reg_force_closed",
];

// 1. Canonical 53-key baseline JSON schema & deprecated-key exclusion
const jsonConfig = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const actualKeys = Object.keys(jsonConfig);
assert.equal(
  actualKeys.length,
  53,
  `Expected exactly 53 keys in upcoming_workshop.json, found ${actualKeys.length}`
);
assert.deepEqual(
  [...actualKeys].sort(),
  [...CANONICAL_53_KEYS].sort(),
  "Canonical 53-key schema mismatch in upcoming_workshop.json"
);
assert.equal(jsonConfig.registration_mode, "auto_schedule");
for (const droppedKey of DROPPED_KEYS) {
  assert.ok(
    !(droppedKey in jsonConfig),
    `Deprecated/dropped key '${droppedKey}' must not exist in upcoming_workshop.json`
  );
}

// 2. Legacy Google Sheet CSVs retired & moved to docs/workshop-sheets/archive/
assert.ok(
  fs.existsSync(path.join(archiveDir, "1_Workshop_Config.csv")),
  "Expected 1_Workshop_Config.csv inside docs/workshop-sheets/archive/"
);
assert.ok(
  fs.existsSync(path.join(archiveDir, "2_Website_Ingestion_Checklist.csv")),
  "Expected 2_Website_Ingestion_Checklist.csv inside docs/workshop-sheets/archive/"
);
assert.equal(
  fs.existsSync(path.join(legacyCsvRoot, "1_Workshop_Config.csv")),
  false,
  "Retired 1_Workshop_Config.csv must not remain at docs/workshop-sheets/ root"
);
assert.equal(
  fs.existsSync(path.join(legacyCsvRoot, "2_Website_Ingestion_Checklist.csv")),
  false,
  "Retired 2_Website_Ingestion_Checklist.csv must not remain at docs/workshop-sheets/ root"
);

// 3. Firestore Rules Verification for Admin Control Center & Reviewer Schedule Collections
const rulesText = fs.readFileSync(rulesPath, "utf8");
for (const requiredRuleSnippet of [
  "match /site_config/{docId}",
  "match /site_config_previews/{previewToken}",
  "match /site_config_history/{versionId}",
  "match /workshop_schedules/{scheduleId}",
  "request.resource.data.createdByEmail is string",
  "request.resource.data.config is map",
  "allow update, delete: if false;",
]) {
  assert.ok(
    rulesText.includes(requiredRuleSnippet),
    `Missing expected Firestore rule assertion: ${requiredRuleSnippet}`
  );
}

// 4. Compiled Cloud Functions Schedule Engine & Quote/Comma Currency Verification
const {
  normalizeServerWorkshopConfig,
  evaluateServerRegistrationSchedule,
  parseServerWorkshopSheetCsv,
} = require(workshopScheduleModulePath);

const scheduled = normalizeServerWorkshopConfig({
  ...jsonConfig,
  registration_mode: "auto_schedule",
  reg_opening_date: "May 1, 2027",
  reg_early_bird_closes: "July 15, 2027",
  conference_start_date: "2027-09-13",
  conference_end_date: "2027-09-17",
  reg_sponsor_early_fee: "$1,350",
  reg_sponsor_fee: "$1,500.00",
});

const beforeOpen = evaluateServerRegistrationSchedule(scheduled, Date.UTC(2027, 3, 1, 12, 0));
assert.equal(beforeOpen.phase, "before_opening");
assert.equal(beforeOpen.isOpen, false);
assert.equal(beforeOpen.isEarlyBirdActive, false);

const earlyBird = evaluateServerRegistrationSchedule(scheduled, Date.UTC(2027, 5, 1, 12, 0));
assert.equal(earlyBird.phase, "early_bird");
assert.equal(earlyBird.isOpen, true);
assert.equal(earlyBird.isEarlyBirdActive, true);
assert.equal(earlyBird.sponsorEarlyCents, 135000);
assert.equal(earlyBird.sponsorRegularCents, 150000);
assert.equal(earlyBird.activeSponsorCents, 135000);

const regularWindow = evaluateServerRegistrationSchedule(scheduled, Date.UTC(2027, 7, 1, 12, 0));
assert.equal(regularWindow.phase, "regular");
assert.equal(regularWindow.isOpen, true);
assert.equal(regularWindow.isEarlyBirdActive, false);
assert.equal(regularWindow.activeSponsorCents, 150000);

const concluded = evaluateServerRegistrationSchedule(scheduled, Date.UTC(2027, 9, 1, 12, 0));
assert.equal(concluded.phase, "concluded_closed");
assert.equal(concluded.isOpen, false);

const manualOpen = evaluateServerRegistrationSchedule(
  { ...scheduled, registration_mode: "open_manual" },
  Date.UTC(2027, 3, 1, 12, 0)
);
assert.equal(manualOpen.isOpen, true);

const manualPaused = evaluateServerRegistrationSchedule(
  { ...scheduled, registration_mode: "paused_closed" },
  Date.UTC(2027, 5, 1, 12, 0)
);
assert.equal(manualPaused.isOpen, false);

// CSV legacy quote/comma parser parity check ($1,350 and $1,500.00)
const csvSample = [
  "field_key,value",
  'reg_sponsor_early_fee,"$1,350"',
  'reg_sponsor_fee,"$1,500.00"',
].join("\n");
const parsedCsv = parseServerWorkshopSheetCsv(csvSample);
assert.equal(parsedCsv.reg_sponsor_early_fee, "$1,350");
assert.equal(parsedCsv.reg_sponsor_fee, "$1,500.00");

console.log(
  "✅ All 53-key schema, archive hygiene, firestore.rules, currency parsing, and 3-way registration_mode schedule tests passed."
);
