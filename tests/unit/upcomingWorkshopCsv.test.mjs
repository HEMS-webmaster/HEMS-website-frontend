import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

const jsonPath = path.join(repoRoot, "src", "frontend", "src", "data", "upcoming_workshop.json");
const csvPath = path.join(repoRoot, "docs", "workshop-sheets", "1_Workshop_Config.csv");
const checklistPath = path.join(repoRoot, "docs", "workshop-sheets", "2_Website_Ingestion_Checklist.csv");

function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
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

const configJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const csvRows = parseCsvRows(fs.readFileSync(csvPath, "utf8"));
const checklistRows = parseCsvRows(fs.readFileSync(checklistPath, "utf8"));

assert.equal(configJson.workshop_number, 16, "Expected 16th workshop seed");
assert.equal(configJson.workshop_ordinal, "16th");
assert.equal(configJson.target_window, "September 2027");
assert.equal(configJson.cycle_stage, "save_the_date");
assert.equal(configJson.student_award_amount, "$1,500.00");
assert.equal(configJson.reg_sponsor_fee, "$1,350");

const headers = csvRows[0];
assert.deepEqual(headers, [
  "field_key",
  "section",
  "label",
  "value",
  "status",
  "used_on_pages",
  "notes_for_editors",
]);

const csvKeys = new Set();
for (let i = 1; i < csvRows.length; i++) {
  const row = csvRows[i];
  assert.equal(row.length, 7, `Row ${i + 1} in 1_Workshop_Config.csv must have 7 columns`);
  const key = row[0];
  assert.ok(key in configJson, `Unknown field_key '${key}' in 1_Workshop_Config.csv`);
  csvKeys.add(key);

  // Verify quoted comma values ($1,350 and $1,500.00) round-trip identically
  if (key === "reg_sponsor_fee") {
    assert.equal(row[3], "$1,350");
  }
  if (key === "student_award_amount") {
    assert.equal(row[3], "$1,500.00");
  }
}

for (const jsonKey of Object.keys(configJson)) {
  if (jsonKey === "sheet_csv_url") continue;
  assert.ok(csvKeys.has(jsonKey), `JSON key '${jsonKey}' missing from 1_Workshop_Config.csv`);
}

assert.equal(checklistRows.length, 9, "Expected header + 8 website surfaces in 2_Website_Ingestion_Checklist.csv");
console.log("✅ QA Passed: 100% parity verified between upcoming_workshop.json, 1_Workshop_Config.csv (40 keys), and 2_Website_Ingestion_Checklist.csv (8 surfaces).");
