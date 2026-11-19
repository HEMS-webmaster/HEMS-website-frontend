import { jsPDF } from "jspdf";
import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";
import { fixMojibakeAndNormalize, toPlainScientificText } from "@/utils/unicodeText";
import {
  buildScheduleExportFilename,
  collectExtendedProgramEntries,
  formatDisplayTrackName,
  formatHemsScheduleTime,
  formatHemsTimeRange,
  parseClockMinutes,
  resolveSubmissionAuthorsAndAffiliations,
  type ConferenceSchedulePlan,
  type ExtendedProgramAbstractItem,
  type ScheduleBlock,
} from "@/utils/conferenceScheduleBuilder";
import { classifySubmissionCohort } from "@/utils/abstractReviewMetrics";
import type {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
} from "@/types/abstractSubmission";

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

function renderExtendedAbstractPagesPdf(
  doc: jsPDF,
  entries: readonly ExtendedProgramAbstractItem[]
): void {
  const W = 612;
  const H = 792;
  const M = 56;
  const CW = W - 2 * M;
  const BOTTOM = H - 56;

  for (const item of entries) {
    doc.addPage();
    let y = M;

    const ensureAbsSpace = (needed: number) => {
      if (y + needed > BOTTOM) {
        doc.addPage();
        y = M;
      }
    };

    const sub = item.submission;
    const cohort = classifySubmissionCohort(sub);
    const cohortTag = cohort.isCorporate
      ? "Corporate"
      : cohort.isStudentAward
        ? "Student Travel Award Candidate"
        : cohort.isStudent
          ? "Student"
          : "";

    // Top placement + category banner
    doc.setFillColor(238, 242, 255);
    doc.rect(M, y - 10, CW, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(formatTextForJsPdf(item.placementBadge), M + 6, y + 3);

    const rightTagParts = [sub.id, item.displayTrack, cohortTag].filter(Boolean);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(formatTextForJsPdf(rightTagParts.join("  |  ")), W - M - 6, y + 3, {
      align: "right",
    });
    y += 24;

    // Full Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(12, 48, 86);
    const titleLines = doc.splitTextToSize(formatTextForJsPdf(sub.title || "Untitled Abstract"), CW);
    for (const line of titleLines) {
      ensureAbsSpace(17);
      doc.text(line, M, y);
      y += 16;
    }
    y += 4;

    // Authors & Institutions
    const { authors, affiliations } = resolveSubmissionAuthorsAndAffiliations(sub);
    const authorChunks: string[] =
      authors.length > 0
        ? authors.map((a) => {
            const suffix = [
              a.isPresenter ? "*" : "",
              a.affiliationNumber !== null ? `[${a.affiliationNumber}]` : "",
            ].join("");
            return `${a.name}${suffix}`;
          })
        : item.authorsLine
          ? [item.authorsLine]
          : [];

    if (authorChunks.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const authLines = doc.splitTextToSize(formatTextForJsPdf(authorChunks.join(", ")), CW);
      for (const line of authLines) {
        ensureAbsSpace(13);
        doc.text(line, M, y);
        y += 12;
      }
    }

    if (affiliations.length > 0) {
      y += 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      for (const aff of affiliations) {
        const instLines = doc.splitTextToSize(
          formatTextForJsPdf(`[${aff.number}] ${aff.label}`),
          CW
        );
        for (const line of instLines) {
          ensureAbsSpace(11);
          doc.text(line, M, y);
          y += 10.5;
        }
      }
    }

    if (sub.correspondingEmail?.trim()) {
      ensureAbsSpace(12);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      doc.text(
        formatTextForJsPdf(`*Presenting / Corresponding Email: ${sub.correspondingEmail.trim()}`),
        M,
        y
      );
      y += 12;
    }

    if (sub.keywords?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(51, 65, 85);
      const kwLines = doc.splitTextToSize(
        formatTextForJsPdf(`Keywords: ${sub.keywords.trim()}`),
        CW
      );
      for (const line of kwLines) {
        ensureAbsSpace(11);
        doc.text(line, M, y);
        y += 11;
      }
    }

    y += 4;
    ensureAbsSpace(8);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    y += 14;

    if (sub.summary?.trim()) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.2);
      doc.setTextColor(51, 65, 85);
      const synLines = doc.splitTextToSize(
        formatTextForJsPdf(`Synopsis: ${sub.summary.trim()}`),
        CW
      );
      for (const line of synLines) {
        ensureAbsSpace(13);
        doc.text(line, M, y);
        y += 12.5;
      }
      y += 6;
    }

    // Full Abstract Body (page-break safe across long texts)
    const rawBody = sub.abstractText?.trim() || sub.summary?.trim() || "";
    const cleanedBody = String(rawBody)
      .replace(/\[FIGURE\]/gi, "")
      .replace(/\r\n/g, "\n")
      .trim();
    const paragraphs = cleanedBody
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    for (const para of paragraphs) {
      const pLines = doc.splitTextToSize(formatTextForJsPdf(para), CW);
      for (const line of pLines) {
        ensureAbsSpace(14);
        doc.text(line, M, y);
        y += 13.5;
      }
      y += 6;
    }

    if (sub.graphic?.caption?.trim()) {
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const figLines = doc.splitTextToSize(
        formatTextForJsPdf(`Figure Caption: ${sub.graphic.caption.trim()}`),
        CW - 12
      );
      ensureAbsSpace(figLines.length * 11 + 14);
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y - 8, CW, figLines.length * 11 + 10, "F");
      for (const line of figLines) {
        doc.text(line, M + 6, y);
        y += 11;
      }
      y += 6;
    }

    if (sub.presenterBio?.trim()) {
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const bioLines = doc.splitTextToSize(
        formatTextForJsPdf(`Presenter Biography: ${sub.presenterBio.trim()}`),
        CW
      );
      for (const line of bioLines) {
        ensureAbsSpace(11.5);
        doc.text(line, M, y);
        y += 11;
      }
    }
  }
}

function renderSchedulePdfDocument(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig,
  extendedEntries?: readonly ExtendedProgramAbstractItem[]
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
          block.themeSubtitle
            ? formatTextForJsPdf(formatDisplayTrackName(block.themeSubtitle, plan))
            : "",
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
  if (plan.includePosterAppendix !== false && plan.posters.length > 0) {
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
      const trackNote =
        poster.researchTrack === "Miscellaneous"
          ? ` (${formatDisplayTrackName(poster.researchTrack, plan)})`
          : "";
      const titleLines = doc.splitTextToSize(
        formatTextForJsPdf(
          `${poster.title}${poster.isStudentAward ? " [Student Award Candidate]" : ""}${poster.isCorporate ? " [Corporate]" : ""}${trackNote}`
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

  if (extendedEntries && extendedEntries.length > 0) {
    renderExtendedAbstractPagesPdf(doc, extendedEntries);
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
 * Generates raw Extended Program PDF binary bytes (exact schedule followed by page-break-separated full abstracts).
 */
export function buildExtendedProgramPdfBytes(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig,
  submissions: readonly AbstractSubmissionRecord[],
  reviews: readonly AbstractReviewRecord[] = []
): Uint8Array {
  const extendedEntries = collectExtendedProgramEntries(plan, submissions, reviews);
  const doc = renderSchedulePdfDocument(plan, workshop, extendedEntries);
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

/**
 * Generates and downloads the Extended Program PDF (exact top schedule + full abstracts with page breaks).
 */
export function downloadExtendedProgramPdf(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig,
  submissions: readonly AbstractSubmissionRecord[],
  reviews: readonly AbstractReviewRecord[] = []
): string {
  const filename = buildScheduleExportFilename(plan, "pdf", "extended");
  const extendedEntries = collectExtendedProgramEntries(plan, submissions, reviews);
  const doc = renderSchedulePdfDocument(plan, workshop, extendedEntries);
  doc.save(filename);
  return filename;
}
