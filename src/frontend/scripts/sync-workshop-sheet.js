/**
 * Optional CLI / pre-build snapshot script:
 * Fetches the published-to-web Google Sheet CSV URL (from NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL,
 * CLI arg `--url=...`, or `sheet_csv_url` in `src/data/upcoming_workshop.json`)
 * and writes the merged snapshot back to `src/data/upcoming_workshop.json`.
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'upcoming_workshop.json');

function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  const text = csvText.replace(/^\uFEFF/, '');

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
    } else if (ch === ',') {
      currentRow.push(currentCell);
      currentCell = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
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

function parseBool(raw, fallback) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return fallback;
  if (['true', 'yes', '1', 'open', 'y', 'confirmed'].includes(s)) return true;
  if (['false', 'no', '0', 'closed', 'n', 'tba'].includes(s)) return false;
  return fallback;
}

async function main() {
  try {
    const base = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const cliArg = process.argv.find((a) => a.startsWith('--url='));
    const cliUrl = cliArg ? cliArg.slice('--url='.length) : '';
    const csvUrl = (
      cliUrl ||
      process.env.NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL ||
      base.sheet_csv_url ||
      ''
    ).trim();

    if (!csvUrl) {
      console.log('ℹ️ No Google Sheet CSV URL configured yet in upcoming_workshop.json or NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL. Retaining local JSON snapshot.');
      return;
    }

    console.log(`📡 Fetching upcoming workshop config from Google Sheet CSV...`);
    const res = await fetch(csvUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (${res.statusText})`);
    }
    const csvText = await res.text();
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      throw new Error('CSV contained fewer than 2 rows.');
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const keyIdx = headers.indexOf('field_key');
    const valIdx = headers.indexOf('value');
    if (keyIdx === -1 || valIdx === -1) {
      throw new Error('CSV must include "field_key" and "value" header columns.');
    }

    const boolKeys = new Set([
      'dates_confirmed',
      'venue_confirmed',
      'cfp_open',
      'registration_open',
      'student_award_extended',
    ]);
    const nullableUrlKeys = new Set([
      'interest_form_url',
      'hotel_maps_url',
      'hotel_booking_url',
      'cfp_submission_url',
      'reg_portal_url',
      'student_award_form_url',
    ]);

    const updated = { ...base, sheet_csv_url: cliUrl ? cliUrl : base.sheet_csv_url };
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length <= keyIdx) continue;
      const key = (row[keyIdx] || '').trim();
      if (!key || key.startsWith('#') || !(key in updated)) continue;
      const val = row.length > valIdx ? String(row[valIdx] ?? '').trim() : '';

      if (key === 'workshop_number') {
        const n = Number.parseInt(val, 10);
        if (Number.isFinite(n)) updated.workshop_number = n;
      } else if (boolKeys.has(key)) {
        updated[key] = parseBool(val, base[key]);
      } else if (nullableUrlKeys.has(key)) {
        updated[key] = val;
      } else if (key === 'sponsor_coordinator_email' && val !== '') {
        updated[key] =
          val.toLowerCase() === 'rtshort00@gmail.com'
            ? 'tim.short@hems-workshop.org'
            : val;
      } else if (val !== '') {
        updated[key] = val;
      }
    }

    fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
    console.log(`✅ Synchronized upcoming_workshop.json (${updated.workshop_ordinal} Workshop • ${updated.target_window}).`);
  } catch (error) {
    console.error('❌ Failed to synchronize Google Sheet workshop config:', error);
    process.exitCode = 1;
  }
}

main();

