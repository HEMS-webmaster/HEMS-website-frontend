import { MailchimpParsedRow, MailingInterest } from "@/types/mailing";
import {
  isValidSubscriberEmail,
  normalizeSublistTag,
  normalizeSubscriberEmail,
} from "@/utils/mailingTemplate";
import { parseCsvRows } from "@/utils/upcomingWorkshop";

export type PasteColumnField =
  | "firstName"
  | "lastName"
  | "affiliation"
  | "email";

export interface PastedSubscriberRow {
  id: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  email: string;
}

export const PASTE_COLUMN_ORDER: readonly PasteColumnField[] = [
  "firstName",
  "lastName",
  "affiliation",
  "email",
];

let rowIdCounter = 0;

/**
 * Allocates a stable keyable row object for the spreadsheet paste modal table.
 */
export function createEmptyPastedRow(seed?: number): PastedSubscriberRow {
  rowIdCounter += 1;
  const suffix = seed !== undefined ? `${seed}-${rowIdCounter}` : `${Date.now()}-${rowIdCounter}`;
  return {
    id: `paste-row-${suffix}`,
    firstName: "",
    lastName: "",
    affiliation: "",
    email: "",
  };
}

/**
 * Creates a starter batch of empty editable rows for pasting or typing.
 */
export function createInitialPastedRows(count = 8): PastedSubscriberRow[] {
  const safeCount = Math.max(1, count);
  return Array.from({ length: safeCount }, (_, idx) => createEmptyPastedRow(idx));
}

function parseTsvRows(tsvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const text = tsvText.replace(/^\uFEFF/, "");

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
      if (ch === '"' && currentCell.length === 0) {
        inQuotes = true;
      } else if (ch === "\t") {
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

/**
 * Tokenizes pasted spreadsheet text from Google Sheets (TSV), CSV, or newline lists
 * while preserving commas inside quoted or single-column cells.
 */
export function tokenizeClipboardGrid(rawText: string): string[][] {
  const clean = rawText.replace(/^\uFEFF/, "");
  if (!clean.trim()) return [];

  let parsed: string[][];
  if (clean.includes("\t")) {
    parsed = parseTsvRows(clean);
  } else if (
    clean.includes(",") &&
    (/\r|\n/.test(clean) || clean.includes("@") || clean.split(",").length >= 3)
  ) {
    parsed = parseCsvRows(clean);
  } else {
    parsed = clean.split(/\r\n|\r|\n/).map((line) => [line]);
  }

  const trimmed = parsed.map((row) => row.map((cell) => cell.trim()));
  while (
    trimmed.length > 0 &&
    trimmed[trimmed.length - 1].every((cell) => cell === "")
  ) {
    trimmed.pop();
  }

  return trimmed;
}

type HeaderMappingToken =
  | "firstName"
  | "lastName"
  | "fullName"
  | "affiliation"
  | "email";

function matchHeaderField(cell: string): HeaderMappingToken | null {
  const norm = cell
    .trim()
    .toLowerCase()
    .replace(/[*_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return null;

  if (
    norm === "email" ||
    norm === "email address" ||
    norm === "e-mail" ||
    norm === "e mail" ||
    norm === "mail"
  ) {
    return "email";
  }
  if (
    norm === "first name" ||
    norm === "first" ||
    norm === "fname" ||
    norm === "given name" ||
    norm === "given"
  ) {
    return "firstName";
  }
  if (
    norm === "last name" ||
    norm === "last" ||
    norm === "lname" ||
    norm === "surname" ||
    norm === "family name" ||
    norm === "family"
  ) {
    return "lastName";
  }
  if (
    norm === "name" ||
    norm === "full name" ||
    norm === "attendee" ||
    norm === "attendee name" ||
    norm === "presenter" ||
    norm === "presenter name" ||
    norm === "subscriber"
  ) {
    return "fullName";
  }
  if (
    norm === "institution" ||
    norm === "affiliation" ||
    norm === "organization" ||
    norm === "org" ||
    norm === "company" ||
    norm === "university" ||
    norm === "institute" ||
    norm === "lab" ||
    norm === "laboratory"
  ) {
    return "affiliation";
  }
  return null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "", lastName: "" };
  const spaceIdx = cleaned.indexOf(" ");
  if (spaceIdx === -1) {
    return { firstName: cleaned, lastName: "" };
  }
  return {
    firstName: cleaned.slice(0, spaceIdx).trim(),
    lastName: cleaned.slice(spaceIdx + 1).trim(),
  };
}

function looksLikeEmailColumn(rows: string[][], colIndex: number): boolean {
  let nonEmpty = 0;
  let hasAt = 0;
  for (const row of rows) {
    const val = (row[colIndex] || "").trim();
    if (!val) continue;
    nonEmpty += 1;
    if (val.includes("@")) hasAt += 1;
  }
  return nonEmpty > 0 && hasAt / nonEmpty >= 0.5;
}

/**
 * Merges pasted spreadsheet clipboard data into the modal's editable table rows.
 * Returns `null` when a single plain value is pasted directly into an individual cell
 * so normal native input paste behavior is preserved.
 */
export function applyClipboardPasteToRows(
  currentRows: PastedSubscriberRow[],
  rawClipboardText: string,
  targetRowIndex: number,
  targetColIndex: number | null
): PastedSubscriberRow[] | null {
  const grid = tokenizeClipboardGrid(rawClipboardText);
  if (grid.length === 0) return null;

  const isSingleCell = grid.length === 1 && grid[0].length === 1;
  if (targetColIndex !== null && isSingleCell) {
    return null;
  }

  const maxCols = Math.max(...grid.map((r) => r.length));
  const firstRow = grid[0];
  const firstRowHasEmail = firstRow.some((cell) => cell.includes("@"));
  const headerMatches = firstRow.map((cell) => matchHeaderField(cell));
  const recognizedHeaderCount = headerMatches.filter(Boolean).length;

  const isHeaderRow =
    grid.length >= 2 &&
    !firstRowHasEmail &&
    ((maxCols === 1 && recognizedHeaderCount >= 1) ||
      (maxCols >= 2 && recognizedHeaderCount >= 2));

  const dataRows = isHeaderRow ? grid.slice(1) : grid;
  if (dataRows.length === 0) return null;

  const safeStartRow = Math.max(0, targetRowIndex);
  const minTotalRows = Math.max(8, safeStartRow + dataRows.length + 2);
  const nextRows: PastedSubscriberRow[] = [];
  for (let i = 0; i < Math.max(currentRows.length, minTotalRows); i++) {
    nextRows.push(
      currentRows[i] ? { ...currentRows[i] } : createEmptyPastedRow(i)
    );
  }

  if (isHeaderRow) {
    const firstIdx = headerMatches.indexOf("firstName");
    const lastIdx = headerMatches.indexOf("lastName");
    const fullNameIdx = headerMatches.indexOf("fullName");
    const affilIdx = headerMatches.indexOf("affiliation");
    const emailIdx = headerMatches.indexOf("email");

    dataRows.forEach((rawRow, offset) => {
      const dest = nextRows[safeStartRow + offset];
      if (firstIdx >= 0) dest.firstName = (rawRow[firstIdx] || "").trim();
      if (lastIdx >= 0) dest.lastName = (rawRow[lastIdx] || "").trim();
      if (fullNameIdx >= 0 && firstIdx === -1 && lastIdx === -1) {
        const split = splitFullName(rawRow[fullNameIdx] || "");
        dest.firstName = split.firstName;
        dest.lastName = split.lastName;
      }
      if (affilIdx >= 0) dest.affiliation = (rawRow[affilIdx] || "").trim();
      if (emailIdx >= 0) dest.email = (rawRow[emailIdx] || "").trim();
    });

    return nextRows;
  }

  // Single-column vertical list paste (e.g., copying just a First Name or Email column)
  if (maxCols === 1) {
    const resolvedCol =
      targetColIndex !== null
        ? Math.min(Math.max(0, targetColIndex), PASTE_COLUMN_ORDER.length - 1)
        : looksLikeEmailColumn(dataRows, 0)
        ? 3
        : 0;
    const field = PASTE_COLUMN_ORDER[resolvedCol];

    dataRows.forEach((rawRow, offset) => {
      nextRows[safeStartRow + offset][field] = (rawRow[0] || "").trim();
    });
    return nextRows;
  }

  // Multi-column paste starting at a specific non-first column
  if (targetColIndex !== null && targetColIndex > 0) {
    dataRows.forEach((rawRow, offset) => {
      const dest = nextRows[safeStartRow + offset];
      for (
        let c = 0;
        c < rawRow.length && targetColIndex + c < PASTE_COLUMN_ORDER.length;
        c++
      ) {
        const field = PASTE_COLUMN_ORDER[targetColIndex + c];
        dest[field] = (rawRow[c] || "").trim();
      }
    });
    return nextRows;
  }

  // Multi-column positional paste starting from column 0 or via Paste button
  if (maxCols >= 4) {
    let detectedEmailCol = -1;
    if (!looksLikeEmailColumn(dataRows, 3)) {
      const candidateCols = [0, 1, 2].filter((idx) =>
        looksLikeEmailColumn(dataRows, idx)
      );
      if (candidateCols.length === 1) {
        detectedEmailCol = candidateCols[0];
      }
    }

    dataRows.forEach((rawRow, offset) => {
      const dest = nextRows[safeStartRow + offset];
      if (detectedEmailCol >= 0) {
        const remainingCols = [0, 1, 2, 3]
          .filter((idx) => idx !== detectedEmailCol)
          .slice(0, 3);
        dest.firstName = (rawRow[remainingCols[0]] || "").trim();
        dest.lastName = (rawRow[remainingCols[1]] || "").trim();
        dest.affiliation = (rawRow[remainingCols[2]] || "").trim();
        dest.email = (rawRow[detectedEmailCol] || "").trim();
      } else {
        dest.firstName = (rawRow[0] || "").trim();
        dest.lastName = (rawRow[1] || "").trim();
        dest.affiliation = (rawRow[2] || "").trim();
        dest.email = (rawRow[3] || "").trim();
      }
    });
    return nextRows;
  }

  if (maxCols === 3) {
    const col2IsEmail = looksLikeEmailColumn(dataRows, 2);
    const col0IsEmail = looksLikeEmailColumn(dataRows, 0);

    dataRows.forEach((rawRow, offset) => {
      const dest = nextRows[safeStartRow + offset];
      if (col2IsEmail) {
        // First Name | Last Name | Email (Institution optional/omitted)
        dest.firstName = (rawRow[0] || "").trim();
        dest.lastName = (rawRow[1] || "").trim();
        dest.affiliation = "";
        dest.email = (rawRow[2] || "").trim();
      } else if (col0IsEmail) {
        dest.email = (rawRow[0] || "").trim();
        dest.firstName = (rawRow[1] || "").trim();
        dest.lastName = (rawRow[2] || "").trim();
      } else {
        dest.firstName = (rawRow[0] || "").trim();
        dest.lastName = (rawRow[1] || "").trim();
        dest.affiliation = (rawRow[2] || "").trim();
      }
    });
    return nextRows;
  }

  // 2 columns
  const col1IsEmail = looksLikeEmailColumn(dataRows, 1);
  const col0IsEmail = looksLikeEmailColumn(dataRows, 0);

  dataRows.forEach((rawRow, offset) => {
    const dest = nextRows[safeStartRow + offset];
    if (col1IsEmail) {
      const split = splitFullName(rawRow[0] || "");
      dest.firstName = split.firstName;
      dest.lastName = split.lastName;
      dest.email = (rawRow[1] || "").trim();
    } else if (col0IsEmail) {
      dest.email = (rawRow[0] || "").trim();
      const split = splitFullName(rawRow[1] || "");
      dest.firstName = split.firstName;
      dest.lastName = split.lastName;
    } else {
      dest.firstName = (rawRow[0] || "").trim();
      dest.lastName = (rawRow[1] || "").trim();
    }
  });
  return nextRows;
}

/**
 * Validates pasted rows, deduplicates emails within the batch, and builds
 * normalized `MailchimpParsedRow` entries ready for `importMailchimpRows`.
 */
export function buildParsedRowsFromPasteTable(
  rows: PastedSubscriberRow[],
  sublistTag: string
): {
  validRows: MailchimpParsedRow[];
  invalidRowNumbers: number[];
  duplicateCount: number;
} {
  const cleanTag = normalizeSublistTag(sublistTag);
  const lowerTag = cleanTag.toLowerCase();

  const interests: MailingInterest[] = ["workshop"];
  if (lowerTag.includes("student") || lowerTag.includes("award")) {
    interests.push("student_awards");
  }
  if (
    lowerTag.includes("sponsor") ||
    lowerTag.includes("exhibitor") ||
    lowerTag.includes("corporate")
  ) {
    interests.push("sponsorship");
  }

  const invalidRowNumbers: number[] = [];
  const deduped = new Map<string, MailchimpParsedRow>();
  let duplicateCount = 0;

  rows.forEach((row, idx) => {
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const affiliation = row.affiliation.trim();
    const email = normalizeSubscriberEmail(row.email);

    const hasAnyContent = Boolean(firstName || lastName || affiliation || email);
    if (!hasAnyContent) return;

    if (!isValidSubscriberEmail(email)) {
      invalidRowNumbers.push(idx + 1);
      return;
    }

    const existing = deduped.get(email);
    if (existing) {
      duplicateCount += 1;
      deduped.set(email, {
        ...existing,
        firstName: existing.firstName || firstName,
        lastName: existing.lastName || lastName,
        affiliation: existing.affiliation || affiliation,
      });
      return;
    }

    deduped.set(email, {
      email,
      firstName,
      lastName,
      affiliation,
      interests: [...interests],
      sublists: cleanTag ? [cleanTag] : [],
      status: "active",
    });
  });

  return {
    validRows: Array.from(deduped.values()),
    invalidRowNumbers,
    duplicateCount,
  };
}

