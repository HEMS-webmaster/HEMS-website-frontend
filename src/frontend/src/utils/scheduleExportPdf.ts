import { jsPDF } from "jspdf";
import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";
import { fixMojibakeAndNormalize, toPlainScientificText } from "@/utils/unicodeText";
import {
  buildScheduleExportFilename,
  formatHemsScheduleTime,
  formatHemsTimeRange,
  parseClockMinutes,
  type ConferenceSchedulePlan,
  type ScheduleBlock,
} from "@/utils/conferenceScheduleBuilder";

const WINANSI_CP1252_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
  0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

const JSPDF_SYMBOL_MAP: Record<string, string> = {
  "−": "-",
  "‐": "-",
  "‑": "-",
  "–": "–",
  "—": "—",
  "⋅": "·",
  "×": "x",
  "≈": "~",
  "∼": "~",
  "≤": "<=",
  "≥": ">=",
  "≠": "!=",
  "→": "->",
  "←": "<-",
  "↔": "<->",
  "⇌": "<=>",
  "∞": "inf",
  "μ": "µ",
  "α": "alpha",
  "β": "beta",
  "γ": "gamma",
  "Δ": "Delta",
  "ε": "eps",
  "θ": "theta",
  "λ": "lambda",
  "π": "pi",
  "ρ": "rho",
  "σ": "sigma",
  "τ": "tau",
  "φ": "phi",
  "ϕ": "phi",
  "ω": "omega",
  "Ω": "Ohm",
  "⁰": "0",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "₊": "+",
  "₋": "-",
  "ł": "l",
  "Ł": "L",
  "đ": "d",
  "Đ": "D",
  "ø": "ø",
  "Ø": "Ø",
  "ı": "i",
};

/**
 * Normalizes UTF-8 scientific text and transliterates non-WinAnsi glyphs
 * cleanly for jsPDF's built-in Helvetica font metrics.
 */
export function formatTextForJsPdf(input: string): string {
  const clean = toPlainScientificText(String(input || ""));
  if (!clean) return "";

  const prepped = clean
    .replace(/δ([⁰¹²³⁴⁵⁶⁷⁸⁹\d])/g, "d$1")
    .replace(/δ/g, "delta")
    .replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]{2,})/g, (seq) =>
      seq.replace(
        /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g,
        (c) => ({ "¹": "1", "²": "2", "³": "3" }[c] ?? JSPDF_SYMBOL_MAP[c] ?? c)
      )
    );

  let out = "";
  for (const ch of prepped) {
    const mapped = JSPDF_SYMBOL_MAP[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (
      (cp >= 0x20 && cp <= 0x7e) ||
      (cp >= 0xa0 && cp <= 0xff) ||
      WINANSI_CP1252_EXTRA.has(cp) ||
      cp === 0x0a ||
      cp === 0x09
    ) {
      out += ch;
      continue;
    }
    const asciiFallback = ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    out += asciiFallback || "";
  }
  return out;
}

function renderSchedulePdfDocument(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter", putOnlyUsedFonts: true });
  const W = 612;
  const H = 792;
  const M = 56;
  const CW = W - 2 * M;
  const BOTTOM = H - 56;
  const TIME_COL_W = 84;
  const CONTENT_X = M + TIME_COL_W + 8;
  const CONTENT_W = CW - TIME_COL_W - 8;
  let y = M;

  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };

  // Header
  const ordinal = plan.workshopOrdinal || workshop.workshop_ordinal || "16th";
  const year = plan.workshopYear || workshop.workshop_year || "2027";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(12, 48, 86);
  doc.text(formatTextForJsPdf(`${ordinal} HEMS Workshop (${year}) — Program Schedule`), W / 2, y, {
    align: "center",
  });
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70);
  doc.text("Workshop on Harsh-Environment Mass Spectrometry", W / 2, y, {
    align: "center",
  });
  y += 14;

  const datesDisplay = formatTextForJsPdf(workshop.exact_dates || workshop.target_window || "");
  if (datesDisplay) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(25);
    doc.text(datesDisplay, W / 2, y, { align: "center" });
    y += 13;
  }

  const venueParts = [
    workshop.hotel_name,
    workshop.hotel_address,
    workshop.venue_city_state,
  ]
    .map((s) => formatTextForJsPdf((s || "").trim()))
    .filter(Boolean);
  if (venueParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80);
    const venueLines = doc.splitTextToSize(venueParts.join(" • "), CW);
    doc.text(venueLines, W / 2, y, { align: "center" });
    y += venueLines.length * 11;
  }

  y += 4;
  doc.setDrawColor(180);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 12;

  // Venue, Reception & Dinner Logistics Box
  const logisticsRows: Array<[string, string]> = [
    ["Plenary Room:", formatTextForJsPdf(workshop.venue_session_room || "TBA")],
    ["Foyer & Exhibits:", formatTextForJsPdf(workshop.venue_foyer_room || "TBA")],
    [
      "Welcome Reception:",
      formatTextForJsPdf(
        `${workshop.welcome_reception_time || "Evening"} — ${workshop.welcome_reception_venue || "TBA"}`
      ),
    ],
    [
      "Workshop Dinner:",
      formatTextForJsPdf(
        `${workshop.dinner_day_time || "TBA"} | ${workshop.dinner_venue_name || "TBA"}${
          workshop.dinner_venue_address ? `, ${workshop.dinner_venue_address}` : ""
        }`
      ),
    ],
  ];
  if (workshop.dinner_plan_notes?.trim()) {
    logisticsRows.push(["Dinner Plan:", formatTextForJsPdf(workshop.dinner_plan_notes)]);
  }

  const boxInnerTop = y;
  let estLogisticsH = 18;
  const wrappedLogistics = logisticsRows.map(([k, v]) => {
    const vLines = doc.splitTextToSize(v, CW - 115);
    const h = Math.max(1, vLines.length) * 10 + 3;
    estLogisticsH += h;
    return { k, vLines, h };
  });

  doc.setFillColor(244, 247, 251);
  doc.setDrawColor(205, 217, 230);
  doc.roundedRect(M, boxInnerTop, CW, estLogisticsH + 6, 4, 4, "FD");
  y += 13;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 61, 107);
  doc.text("VENUE, RECEPTIONS & WORKSHOP DINNER LOGISTICS", M + 8, y);
  y += 12;

  for (const row of wrappedLogistics) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(40);
    doc.text(row.k, M + 8, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55);
    doc.text(row.vLines, M + 106, y);
    y += row.h;
  }
  y += 14;

  // Optional committee notes
  if (plan.programNotes?.trim()) {
    const noteLines = doc.splitTextToSize(
      `Program Note: ${formatTextForJsPdf(plan.programNotes)}`,
      CW
    );
    ensureSpace(noteLines.length * 10 + 8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(noteLines, M, y);
    y += noteLines.length * 10 + 8;
  }

  // Chronological Days
  for (const day of plan.days) {
    ensureSpace(44);

    doc.setFillColor(226, 232, 240);
    doc.rect(M, y - 10, CW, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(formatTextForJsPdf(day.headingLabel), M + 6, y + 2);
    if (day.dayTagline) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(formatTextForJsPdf(day.dayTagline), W - M - 6, y + 2, {
        align: "right",
      });
    }
    y += 18;

    const sortedBlocks: ScheduleBlock[] = [...day.blocks].sort((a, b) => {
      const mA = parseClockMinutes(a.startTime) ?? 9999;
      const mB = parseClockMinutes(b.startTime) ?? 9999;
      return mA - mB;
    });

    for (const block of sortedBlocks) {
      if (block.kind === "event") {
        const timeStr = formatTextForJsPdf(
          formatHemsTimeRange(block.startTime, block.endTime)
        );
        const detailStr = [block.location, block.subtitle]
          .map((s) => formatTextForJsPdf((s || "").trim()))
          .filter(Boolean)
          .join(" • ");
        const titleLines = doc.splitTextToSize(formatTextForJsPdf(block.title), CONTENT_W);
        const detailLines = detailStr
          ? doc.splitTextToSize(detailStr, CONTENT_W)
          : [];
        const needed = titleLines.length * 10.5 + detailLines.length * 9 + 6;
        ensureSpace(needed);

        const isDinner = block.eventCategory === "dinner" && block.syncSource === "workshop_dinner";
        if (isDinner) {
          doc.setFillColor(254, 243, 199);
          doc.rect(M, y - 9, CW, needed + 1, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(90);
        doc.text(timeStr, M + 4, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(isDinner ? 120 : 35, isDinner ? 53 : 41, isDinner ? 15 : 59);
        doc.text(titleLines, CONTENT_X, y);
        y += titleLines.length * 10.5;

        if (detailLines.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.8);
          doc.setTextColor(90);
          doc.text(detailLines, CONTENT_X, y);
          y += detailLines.length * 9;
        }
        y += 5;
      } else {
        // Technical Session block
        const headerTime = formatTextForJsPdf(
          formatHemsTimeRange(block.startTime, block.endTime)
        );
        const sessionMetaParts = [
          block.themeSubtitle ? formatTextForJsPdf(block.themeSubtitle) : "",
          block.sessionChair ? `Chair: ${formatTextForJsPdf(block.sessionChair)}` : "",
          block.location ? formatTextForJsPdf(block.location) : "",
        ].filter(Boolean);
        const metaLine = sessionMetaParts.join(" | ");

        ensureSpace(34);
        const headerH = metaLine ? 24 : 15;
        doc.setFillColor(220, 230, 245);
        doc.rect(M, y - 9, CW, headerH, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(25, 60, 115);
        doc.text(headerTime, M + 4, y);
        doc.text(formatTextForJsPdf(block.title), CONTENT_X, y);
        y += 10.5;

        if (metaLine) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(55, 80, 120);
          const mLines = doc.splitTextToSize(metaLine, CONTENT_W);
          doc.text(mLines[0] || "", CONTENT_X, y);
          y += 10;
        } else {
          y += 3;
        }

        if (block.talks.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.8);
          doc.setTextColor(120);
          doc.text("No talks assigned to this session yet.", CONTENT_X, y);
          y += 12;
        } else {
          for (const talk of block.talks) {
            const talkTitle = formatTextForJsPdf(
              `${talk.title}${talk.isStudentAward ? " [Student Award Candidate]" : ""}`
            );
            const talkAuthors = formatTextForJsPdf(talk.authorsLine);
            const tLines = doc.splitTextToSize(talkTitle, CONTENT_W);
            const aLines = talkAuthors
              ? doc.splitTextToSize(talkAuthors, CONTENT_W)
              : [];
            const needed = tLines.length * 10 + aLines.length * 9 + 6;
            ensureSpace(needed);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.8);
            doc.setTextColor(95);
            const slotRange = `${formatHemsScheduleTime(talk.startTime)}${
              talk.endTime ? ` – ${formatHemsScheduleTime(talk.endTime)}` : ""
            }`;
            doc.text(formatTextForJsPdf(slotRange), M + 4, y);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(15);
            doc.text(tLines, CONTENT_X, y);
            y += tLines.length * 10;

            if (aLines.length > 0) {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(7.8);
              doc.setTextColor(75);
              doc.text(aLines, CONTENT_X, y);
              y += aLines.length * 9;
            }
            y += 5;
          }
        }
        y += 4;
      }
    }
    y += 6;
  }

  // Accepted Poster Presentations Appendix
  if (plan.includePosterAppendix && plan.posters.length > 0) {
    ensureSpace(40);
    doc.setFillColor(226, 232, 240);
    doc.rect(M, y - 10, CW, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Accepted Poster Presentations (${plan.posters.length})`,
      M + 6,
      y + 2
    );
    y += 18;

    for (const poster of plan.posters) {
      const titleLines = doc.splitTextToSize(
        formatTextForJsPdf(
          `${poster.title}${poster.isStudentAward ? " [Student Award Candidate]" : ""}`
        ),
        CONTENT_W
      );
      const authLines = poster.authorsLine
        ? doc.splitTextToSize(formatTextForJsPdf(poster.authorsLine), CONTENT_W)
        : [];
      const needed = titleLines.length * 10 + authLines.length * 9 + 6;
      ensureSpace(needed);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175);
      doc.text(poster.posterNumber, M + 4, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15);
      doc.text(titleLines, CONTENT_X, y);
      y += titleLines.length * 10;

      if (authLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.8);
        doc.setTextColor(75);
        doc.text(authLines, CONTENT_X, y);
        y += authLines.length * 9;
      }
      y += 5;
    }
  }

  // Add Page X of Y footers cleanly across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(135);
    doc.text(
      fixMojibakeAndNormalize(
        `${ordinal} HEMS Workshop • ${workshop.venue_city_state || "Draft Program"} — Page ${p} of ${totalPages}`
      ),
      W / 2,
      H - 22,
      { align: "center" }
    );
  }

  return doc;
}

/**
 * Generates raw PDF binary bytes for client download and automated verification.
 */
export function buildConferenceSchedulePdfBytes(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): Uint8Array {
  const doc = renderSchedulePdfDocument(plan, workshop);
  return new Uint8Array(doc.output("arraybuffer"));
}

/**
 * Generates and downloads a publication-ready Conference Program PDF.
 */
export function downloadConferenceSchedulePdf(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): string {
  const filename = buildScheduleExportFilename(plan, "pdf");
  const doc = renderSchedulePdfDocument(plan, workshop);
  doc.save(filename);
  return filename;
}
