import jsPDF from "jspdf";
import { RegistrationTier, WorkshopRegistrationRecord } from "@/types/registration";

export interface ArchiveParticipantRow {
  lastName: string;
  firstName: string;
  affiliation: string;
  email: string;
  country: string;
  tier: RegistrationTier;
}

export interface BuildArchiveParticipantOptions {
  workshopYear?: number;
  excludeSampleRecords?: boolean;
}

export interface ExportParticipantsPdfParams {
  rows: ArchiveParticipantRow[];
  workshopOrdinal: string;
  workshopYear: string | number;
  exactDates?: string;
  venueName?: string;
  cityState?: string;
  includeEmail?: boolean;
}

interface TableColumnSpec {
  key: "lastName" | "firstName" | "affiliation" | "email" | "country";
  label: string;
  width: number;
}

/**
 * Normalizes a workshop ordinal string (e.g. "16th") into the exact
 * filename prefix expected by the Proceedings Archive manager.
 */
export function getParticipantsArchiveFilename(
  workshopOrdinal: string,
  ext: "pdf" | "csv" = "pdf"
): string {
  const cleanOrd = (workshopOrdinal || "16th").trim().replace(/[^0-9a-zA-Z]/g, "") || "16th";
  return `${cleanOrd}_Participant_List.${ext}`;
}

/**
 * Filters confirmed (`paid` / `comped`) registrations, deduplicates by email,
 * and sorts alphabetically by last name for archival publication.
 */
export function buildArchiveParticipantRows(
  registrations: WorkshopRegistrationRecord[],
  options: BuildArchiveParticipantOptions = {}
): ArchiveParticipantRow[] {
  const byEmail = new Map<string, WorkshopRegistrationRecord>();

  for (const reg of registrations) {
    if (reg.status !== "paid" && reg.status !== "comped") continue;
    if (
      typeof options.workshopYear === "number" &&
      !Number.isNaN(options.workshopYear) &&
      reg.workshopYear !== options.workshopYear
    ) {
      continue;
    }
    if (options.excludeSampleRecords && (reg.isSampleSeed || reg.sandboxSimulation)) {
      continue;
    }

    const emailKey = (reg.email || reg.id).trim().toLowerCase();
    const existing = byEmail.get(emailKey);
    if (!existing) {
      byEmail.set(emailKey, reg);
      continue;
    }

    const existingTs = Date.parse(existing.updatedAt || existing.createdAt || "") || 0;
    const candidateTs = Date.parse(reg.updatedAt || reg.createdAt || "") || 0;
    if (candidateTs >= existingTs) {
      byEmail.set(emailKey, reg);
    }
  }

  return Array.from(byEmail.values())
    .map((r) => ({
      lastName: (r.lastName || "").trim(),
      firstName: (r.firstName || "").trim(),
      affiliation: (r.affiliation || r.badgeAffiliation || "").trim(),
      email: (r.email || "").trim().toLowerCase(),
      country: (r.country || "").trim(),
      tier: r.tier,
    }))
    .sort((a, b) => {
      const byLast = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
      if (byLast !== 0) return byLast;
      const byFirst = a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
      if (byFirst !== 0) return byFirst;
      return a.affiliation.localeCompare(b.affiliation, undefined, { sensitivity: "base" });
    });
}

/**
 * Builds an archive-ready US Letter PDF matching the 4-column structure used by
 * prior HEMS Proceedings volumes (`13th_Participant_List.pdf` – `15th_Participant_List.pdf`).
 */
export function buildParticipantsArchivePdfDocument(
  params: ExportParticipantsPdfParams
): jsPDF {
  const includeEmail = params.includeEmail !== false;
  const cleanOrd = (params.workshopOrdinal || "16th").trim() || "16th";
  const yearStr = String(params.workshopYear || "2027").trim();

  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 44;
  const CONTENT_W = PAGE_W - MARGIN * 2; // 524 pt
  const BOTTOM_LIMIT = PAGE_H - 48;

  const columns: TableColumnSpec[] = includeEmail
    ? [
        { key: "lastName", label: "Last Name", width: 96 },
        { key: "firstName", label: "First Name", width: 82 },
        { key: "affiliation", label: "Affiliation", width: 186 },
        { key: "email", label: "Email", width: 160 },
      ]
    : [
        { key: "lastName", label: "Last Name", width: 115 },
        { key: "firstName", label: "First Name", width: 100 },
        { key: "affiliation", label: "Affiliation", width: 229 },
        { key: "country", label: "Country", width: 80 },
      ];

  let y = MARGIN;

  // Title Block (Page 1)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(3, 105, 161); // HEMS archival sky/navy accent
  doc.text("HARSH ENVIRONMENT MASS SPECTROMETRY SOCIETY  •  PROCEEDINGS ARCHIVE", MARGIN, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`${cleanOrd} Harsh-Environment Mass Spectrometry Workshop (${yearStr})`, MARGIN, y);
  y += 15;

  const metaParts = [params.exactDates, params.venueName, params.cityState].filter(
    (s): s is string => Boolean(s && s.trim())
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const subtitle =
    metaParts.length > 0
      ? `${metaParts.join("  •  ")}  •  Official Participant List (${params.rows.length})`
      : `Official Participant List (${params.rows.length} Confirmed Participants)`;
  const subLines: string[] = doc.splitTextToSize(subtitle, CONTENT_W);
  doc.text(subLines, MARGIN, y);
  y += subLines.length * 11 + 8;

  const drawTableHeader = () => {
    const headerH = 21;
    doc.setFillColor(15, 23, 42);
    doc.rect(MARGIN, y, CONTENT_W, headerH, "F");
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, y, CONTENT_W, headerH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let x = MARGIN;
    for (const col of columns) {
      doc.text(col.label, x + 6, y + 13.5);
      x += col.width;
    }
    y += headerH;
  };

  drawTableHeader();

  const BODY_FONT_PT = 8.5;
  const LINE_H = 10.5;
  const CELL_PAD_X = 6;

  doc.setFontSize(BODY_FONT_PT);

  params.rows.forEach((row, idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_PT);

    const wrappedCells: string[][] = columns.map((col) => {
      const val = row[col.key] || "—";
      return doc.splitTextToSize(val, col.width - CELL_PAD_X * 2) as string[];
    });

    const maxLines = Math.max(1, ...wrappedCells.map((lines) => lines.length));
    const rowH = Math.max(18.5, maxLines * LINE_H + 7);

    if (y + rowH > BOTTOM_LIMIT) {
      doc.addPage();
      y = MARGIN;
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, y, CONTENT_W, rowH, "F");
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.rect(MARGIN, y, CONTENT_W, rowH, "S");

    let x = MARGIN;
    columns.forEach((col, colIdx) => {
      if (colIdx > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.line(x, y, x, y + rowH);
      }
      doc.setFont("helvetica", col.key === "lastName" ? "bold" : "normal");
      doc.setTextColor(col.key === "email" ? 51 : 15, col.key === "email" ? 65 : 23, col.key === "email" ? 85 : 42);
      doc.text(wrappedCells[colIdx], x + CELL_PAD_X, y + 12.2);
      x += col.width;
    });

    y += rowH;
  });

  // Page numbering footers
  const totalPages = doc.getNumberOfPages();
  const generatedDate = new Date().toISOString().slice(0, 10);
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, PAGE_H - 36, PAGE_W - MARGIN, PAGE_H - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${cleanOrd} HEMS Workshop (${yearStr})  —  Proceedings Archive Participant List (Generated ${generatedDate})`,
      MARGIN,
      PAGE_H - 24
    );
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 24, {
      align: "right",
    });
  }

  return doc;
}

/**
 * Generates and downloads the archive-ready `${ordinal}_Participant_List.pdf`.
 */
export function exportParticipantsArchivePdf(params: ExportParticipantsPdfParams): string {
  const filename = getParticipantsArchiveFilename(params.workshopOrdinal, "pdf");
  const doc = buildParticipantsArchivePdfDocument(params);
  doc.save(filename);
  return filename;
}
