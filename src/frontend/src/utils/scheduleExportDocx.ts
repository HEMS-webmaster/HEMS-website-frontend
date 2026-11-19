import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";
import { fixMojibakeAndNormalize, toPlainScientificText } from "@/utils/unicodeText";
import {
  buildScheduleExportFilename,
  type ConferenceSchedulePlan,
  type ScheduleBlock,
  formatHemsScheduleTime,
  formatHemsTimeRange,
  parseClockMinutes,
} from "@/utils/conferenceScheduleBuilder";

// Precomputed IEEE 802.3 CRC-32 lookup table for genuine OOXML ZIP packaging
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * Packages OOXML entries into a valid uncompressed PKZIP (.docx) byte buffer.
 */
function buildZipArchive(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.data;
    const sum = crc32(dataBytes);

    // Local File Header (30 bytes + filename)
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // STORE (no compression)
    lv.setUint16(10, 0, true); // Mod time
    lv.setUint16(12, 0x5421, true); // Mod date
    lv.setUint32(14, sum, true); // CRC-32
    lv.setUint32(18, dataBytes.length, true); // Compressed size
    lv.setUint32(22, dataBytes.length, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // Filename length
    lv.setUint16(28, 0, true); // Extra field length
    lh.set(nameBytes, 30);

    localParts.push(lh, dataBytes);

    // Central Directory Header (46 bytes + filename)
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 filename flag
    cv.setUint16(10, 0, true); // STORE
    cv.setUint16(12, 0, true); // Mod time
    cv.setUint16(14, 0x5421, true); // Mod date
    cv.setUint32(16, sum, true); // CRC-32
    cv.setUint32(20, dataBytes.length, true); // Compressed size
    cv.setUint32(24, dataBytes.length, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // Filename length
    cv.setUint16(30, 0, true); // Extra length
    cv.setUint16(32, 0, true); // Comment length
    cv.setUint16(34, 0, true); // Disk number
    cv.setUint16(36, 0, true); // Internal attributes
    cv.setUint32(38, 0, true); // External attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    ch.set(nameBytes, 46);

    centralParts.push(ch);
    offset += lh.length + dataBytes.length;
  }

  let cdSize = 0;
  for (const ch of centralParts) cdSize += ch.length;

  // End of Central Directory (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + cdSize + eocd.length;
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of localParts) {
    out.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    out.set(part, pos);
    pos += part.length;
  }
  out.set(eocd, pos);
  return out;
}

const UNICODE_SUPER_TO_BASE: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "−",
};

const UNICODE_SUB_TO_BASE: Record<string, string> = {
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
  "₋": "−",
};

function stripInvalidXmlControlChars(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function escapeXml(raw: string): string {
  return stripInvalidXmlControlChars(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface WordRunStyle {
  bold?: boolean;
  italic?: boolean;
  colorHex?: string;
  sizeHalfPt?: number;
  vertAlign?: "superscript" | "subscript";
}

function emitWordRun(text: string, style: WordRunStyle): string {
  if (!text) return "";
  const rPrParts: string[] = [];
  if (style.bold) rPrParts.push("<w:b/>");
  if (style.italic) rPrParts.push("<w:i/>");
  if (style.colorHex) rPrParts.push(`<w:color w:val="${style.colorHex}"/>`);
  if (style.sizeHalfPt) {
    rPrParts.push(
      `<w:sz w:val="${style.sizeHalfPt}"/><w:szCs w:val="${style.sizeHalfPt}"/>`
    );
  }
  if (style.vertAlign) {
    rPrParts.push(`<w:vertAlign w:val="${style.vertAlign}"/>`);
  }
  const rPr = rPrParts.length > 0 ? `<w:rPr>${rPrParts.join("")}</w:rPr>` : "";
  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function emitTextWithUnicodeScripts(text: string, baseStyle: WordRunStyle): string {
  if (!text) return "";
  let out = "";
  let buf = "";
  let mode: "normal" | "sup" | "sub" = "normal";

  const flush = () => {
    if (!buf) return;
    if (mode === "sup") {
      out += emitWordRun(buf, { ...baseStyle, vertAlign: "superscript" });
    } else if (mode === "sub") {
      out += emitWordRun(buf, { ...baseStyle, vertAlign: "subscript" });
    } else {
      out += emitWordRun(buf, baseStyle);
    }
    buf = "";
  };

  for (const ch of text) {
    const sup = UNICODE_SUPER_TO_BASE[ch];
    if (sup !== undefined) {
      if (mode !== "sup") flush();
      mode = "sup";
      buf += sup;
      continue;
    }
    const sub = UNICODE_SUB_TO_BASE[ch];
    if (sub !== undefined) {
      if (mode !== "sub") flush();
      mode = "sub";
      buf += sub;
      continue;
    }
    if (mode !== "normal") flush();
    mode = "normal";
    buf += ch;
  }
  flush();
  return out;
}

/**
 * Converts UTF-8 scientific strings (with optional HTML `<b>/<i>/<sup>/<sub>`, `$...$` TeX,
 * and Unicode superscripts/subscripts) into native OpenXML `<w:r>` runs so Microsoft Word
 * displays clean editable formatting (`δ¹³C`, `CO₂`, *m/z*, `10⁻⁶`).
 */
export function buildWordScientificRunsXml(
  input: string,
  baseStyle: WordRunStyle = {}
): string {
  const normalized = fixMojibakeAndNormalize(String(input || ""));
  if (!normalized) return "";

  // Expand `$...$` TeX equations while preserving explicit HTML tags around scientific prose
  const withExpandedMath = normalized.replace(
    /(\$[^$\n]+?\$|\\\([^)\n]+?\\\))/g,
    (match) => {
      const inner = match.startsWith("$") ? match.slice(1, -1) : match.slice(2, -2);
      if (
        match.startsWith("$") &&
        (inner.endsWith(" ") || (/^\d/.test(inner) && !/[\\^_{}=+\-*/]/.test(inner)))
      ) {
        return match;
      }
      return toPlainScientificText(match);
    }
  );

  const tokenRe = /(<\/?(?:b|strong|i|em|sup|sub)>)/gi;
  const parts = withExpandedMath.split(tokenRe);
  let bold = Boolean(baseStyle.bold);
  let italic = Boolean(baseStyle.italic);
  let supDepth = 0;
  let subDepth = 0;
  let xml = "";

  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    if (lower === "<b>" || lower === "<strong>") {
      bold = true;
      continue;
    }
    if (lower === "</b>" || lower === "</strong>") {
      bold = Boolean(baseStyle.bold);
      continue;
    }
    if (lower === "<i>" || lower === "<em>") {
      italic = true;
      continue;
    }
    if (lower === "</i>" || lower === "</em>") {
      italic = Boolean(baseStyle.italic);
      continue;
    }
    if (lower === "<sup>") {
      supDepth++;
      continue;
    }
    if (lower === "</sup>") {
      supDepth = Math.max(0, supDepth - 1);
      continue;
    }
    if (lower === "<sub>") {
      subDepth++;
      continue;
    }
    if (lower === "</sub>") {
      subDepth = Math.max(0, subDepth - 1);
      continue;
    }

    const vertAlign: WordRunStyle["vertAlign"] =
      supDepth > 0 ? "superscript" : subDepth > 0 ? "subscript" : baseStyle.vertAlign;

    xml += emitTextWithUnicodeScripts(part, {
      ...baseStyle,
      bold,
      italic,
      vertAlign,
    });
  }

  return xml;
}

function pXml(
  runsXml: string,
  opts: {
    spaceBefore?: number;
    spaceAfter?: number;
    align?: "left" | "center" | "right";
    styleId?: string;
    shadingHex?: string;
  } = {}
): string {
  const pPr: string[] = [];
  if (opts.styleId) pPr.push(`<w:pStyle w:val="${opts.styleId}"/>`);
  if (opts.shadingHex) {
    pPr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shadingHex}"/>`);
  }
  if (opts.spaceBefore !== undefined || opts.spaceAfter !== undefined) {
    pPr.push(
      `<w:spacing w:before="${opts.spaceBefore ?? 0}" w:after="${opts.spaceAfter ?? 80}"/>`
    );
  }
  if (opts.align && opts.align !== "left") {
    pPr.push(`<w:jc w:val="${opts.align}"/>`);
  }
  const pPrXml = pPr.length > 0 ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${pPrXml}${runsXml}</w:p>`;
}

function tcXml(
  innerParagraphsXml: string,
  widthDxa: number,
  opts: { shadingHex?: string; colSpan?: number } = {}
): string {
  const tcPr: string[] = [`<w:tcW w:w="${widthDxa}" w:type="dxa"/>`];
  if (opts.colSpan && opts.colSpan > 1) {
    tcPr.push(`<w:gridSpan w:val="${opts.colSpan}"/>`);
  }
  if (opts.shadingHex) {
    tcPr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shadingHex}"/>`);
  }
  tcPr.push("<w:vAlign w:val=\"top\"/>");
  return `<w:tc><w:tcPr>${tcPr.join("")}</w:tcPr>${innerParagraphsXml}</w:tc>`;
}

function twoColTableXml(rowsXml: string): string {
  return [
    "<w:tbl>",
    "<w:tblPr>",
    '<w:tblW w:w="9360" w:type="dxa"/>',
    "<w:tblBorders>",
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>',
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>',
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>',
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>',
    '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>',
    '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>',
    "</w:tblBorders>",
    "<w:tblCellMar>",
    '<w:top w:w="80" w:type="dxa"/>',
    '<w:left w:w="120" w:type="dxa"/>',
    '<w:bottom w:w="80" w:type="dxa"/>',
    '<w:right w:w="120" w:type="dxa"/>',
    "</w:tblCellMar>",
    "</w:tblPr>",
    '<w:tblGrid><w:gridCol w:w="2360"/><w:gridCol w:w="7000"/></w:tblGrid>',
    rowsXml,
    "</w:tbl>",
  ].join("");
}

function buildContentTypesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    "</Types>",
  ].join("");
}

function buildRootRelsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
    "</Relationships>",
  ].join("");
}

function buildDocumentRelsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    "</Relationships>",
  ].join("");
}

function buildStylesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    "<w:docDefaults><w:rPrDefault><w:rPr>",
    '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>',
    '<w:sz w:val="21"/><w:szCs w:val="21"/>',
    '<w:color w:val="0F172A"/>',
    "</w:rPr></w:rPrDefault></w:docDefaults>",
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>',
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="28"/><w:color w:val="0C3056"/></w:rPr></w:style>',
    '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="24"/><w:color w:val="0F3D6B"/></w:rPr></w:style>',
    "</w:styles>",
  ].join("");
}

function buildDocumentXml(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): string {
  const ordinal = plan.workshopOrdinal || workshop.workshop_ordinal || "16th";
  const year = plan.workshopYear || workshop.workshop_year || "2027";
  const bodyParts: string[] = [];

  // Title Banner
  bodyParts.push(
    pXml(
      buildWordScientificRunsXml(`${ordinal} HEMS Workshop (${year}) — Technical Program`, {
        bold: true,
        colorHex: "0C3056",
        sizeHalfPt: 34,
      }),
      { align: "center", spaceBefore: 0, spaceAfter: 60 }
    )
  );
  bodyParts.push(
    pXml(
      buildWordScientificRunsXml("Workshop on Harsh-Environment Mass Spectrometry", {
        colorHex: "475569",
        sizeHalfPt: 21,
      }),
      { align: "center", spaceAfter: 40 }
    )
  );
  const dateVenueSummary = [
    workshop.exact_dates || workshop.target_window,
    workshop.hotel_name,
    workshop.hotel_address,
    workshop.venue_city_state,
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join("  •  ");
  if (dateVenueSummary) {
    bodyParts.push(
      pXml(
        buildWordScientificRunsXml(dateVenueSummary, {
          bold: true,
          colorHex: "1E293B",
          sizeHalfPt: 20,
        }),
        { align: "center", spaceAfter: 160 }
      )
    );
  }

  // Venue, Receptions & Dinner Logistics Table
  bodyParts.push(
    pXml(
      buildWordScientificRunsXml("Venue, Reception & Workshop Dinner Logistics", {
        bold: true,
        colorHex: "0F3D6B",
        sizeHalfPt: 24,
      }),
      { styleId: "Heading2", spaceBefore: 60, spaceAfter: 80 }
    )
  );

  const logisticsPairs: Array<[string, string]> = [
    ["Plenary Session Room", workshop.venue_session_room || "TBA"],
    ["Foyer & Poster Area", workshop.venue_foyer_room || "TBA"],
    [
      "Day 1 Welcome Reception",
      `${workshop.welcome_reception_time || "Evening"} — ${workshop.welcome_reception_venue || "TBA"}`,
    ],
    [
      "Official Workshop Dinner",
      `${workshop.dinner_day_time || "TBA"} — ${workshop.dinner_venue_name || "TBA"}${
        workshop.dinner_venue_address ? ` (${workshop.dinner_venue_address})` : ""
      }`,
    ],
    ...(workshop.dinner_plan_notes?.trim()
      ? ([["Dinner Notes & Guest Tickets", workshop.dinner_plan_notes]] as Array<[string, string]>)
      : []),
  ];

  const logisticsRows = logisticsPairs
    .map(([label, val]) => {
      const left = tcXml(
        pXml(
          buildWordScientificRunsXml(label, {
            bold: true,
            colorHex: "1E293B",
            sizeHalfPt: 19,
          }),
          { spaceAfter: 0 }
        ),
        2360,
        { shadingHex: "F8FAFC" }
      );
      const right = tcXml(
        pXml(buildWordScientificRunsXml(val, { sizeHalfPt: 19 }), {
          spaceAfter: 0,
        }),
        7000
      );
      return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${left}${right}</w:tr>`;
    })
    .join("");
  bodyParts.push(twoColTableXml(logisticsRows));

  if (plan.programNotes?.trim()) {
    bodyParts.push(
      pXml(
        buildWordScientificRunsXml(`Program Note: ${plan.programNotes}`, {
          italic: true,
          colorHex: "475569",
          sizeHalfPt: 19,
        }),
        { spaceBefore: 100, spaceAfter: 80 }
      )
    );
  }

  // Chronological Days
  for (const day of plan.days) {
    const dayTitle = day.dayTagline
      ? `${day.headingLabel}  (${day.dayTagline})`
      : day.headingLabel;
    bodyParts.push(
      pXml(
        buildWordScientificRunsXml(dayTitle, {
          bold: true,
          colorHex: "0C3056",
          sizeHalfPt: 25,
        }),
        { styleId: "Heading1", spaceBefore: 220, spaceAfter: 80, shadingHex: "E2E8F0" }
      )
    );

    const sortedBlocks: ScheduleBlock[] = [...day.blocks].sort((a, b) => {
      const mA = parseClockMinutes(a.startTime) ?? 9999;
      const mB = parseClockMinutes(b.startTime) ?? 9999;
      return mA - mB;
    });

    const trs: string[] = [];

    for (const block of sortedBlocks) {
      if (block.kind === "event") {
        const isDinner = block.eventCategory === "dinner" && block.syncSource === "workshop_dinner";
        const rowShd = isDinner ? "FEF3C7" : undefined;
        const timeRange = formatHemsTimeRange(block.startTime, block.endTime);

        const contentParagraphs: string[] = [
          pXml(
            buildWordScientificRunsXml(block.title, {
              bold: true,
              colorHex: isDinner ? "78350F" : "0F172A",
              sizeHalfPt: 20,
            }),
            { spaceAfter: block.location || block.subtitle ? 20 : 0 }
          ),
        ];

        const metaText = [block.location, block.subtitle]
          .map((s) => (s || "").trim())
          .filter(Boolean)
          .join("  •  ");
        if (metaText) {
          contentParagraphs.push(
            pXml(
              buildWordScientificRunsXml(metaText, {
                colorHex: "475569",
                sizeHalfPt: 18,
              }),
              { spaceAfter: 0 }
            )
          );
        }

        const timeCell = tcXml(
          pXml(
            buildWordScientificRunsXml(timeRange, {
              bold: isDinner,
              colorHex: "334155",
              sizeHalfPt: 19,
            }),
            { spaceAfter: 0 }
          ),
          2360,
          { shadingHex: rowShd }
        );
        const infoCell = tcXml(contentParagraphs.join(""), 7000, { shadingHex: rowShd });
        trs.push(`<w:tr><w:trPr><w:cantSplit/></w:trPr>${timeCell}${infoCell}</w:tr>`);
      } else {
        // Technical Session header row (navy tint)
        const sessionRange = formatHemsTimeRange(block.startTime, block.endTime);
        const sessionSub = [
          block.themeSubtitle,
          block.sessionChair ? `Session Chair: ${block.sessionChair}` : "",
          block.location,
        ]
          .filter(Boolean)
          .join("  |  ");

        const sessionTitleParas: string[] = [
          pXml(
            buildWordScientificRunsXml(block.title, {
              bold: true,
              colorHex: "1E3A8A",
              sizeHalfPt: 21,
            }),
            { spaceAfter: sessionSub ? 20 : 0 }
          ),
        ];
        if (sessionSub) {
          sessionTitleParas.push(
            pXml(
              buildWordScientificRunsXml(sessionSub, {
                italic: true,
                colorHex: "1E40AF",
                sizeHalfPt: 18,
              }),
              { spaceAfter: 0 }
            )
          );
        }

        trs.push(
          `<w:tr><w:trPr><w:cantSplit/></w:trPr>${tcXml(
            pXml(
              buildWordScientificRunsXml(sessionRange, {
                bold: true,
                colorHex: "1E3A8A",
                sizeHalfPt: 19,
              }),
              { spaceAfter: 0 }
            ),
            2360,
            { shadingHex: "DCE6F5" }
          )}${tcXml(sessionTitleParas.join(""), 7000, { shadingHex: "DCE6F5" })}</w:tr>`
        );

        if (block.talks.length === 0) {
          trs.push(
            `<w:tr><w:trPr><w:cantSplit/></w:trPr>${tcXml(
              pXml(buildWordScientificRunsXml("TBD", { colorHex: "64748B", sizeHalfPt: 18 }), {
                spaceAfter: 0,
              }),
              2360
            )}${tcXml(
              pXml(
                buildWordScientificRunsXml("Open session slot — talks to be assigned.", {
                  italic: true,
                  colorHex: "64748B",
                  sizeHalfPt: 18,
                }),
                { spaceAfter: 0 }
              ),
              7000
            )}</w:tr>`
          );
        } else {
          for (const talk of block.talks) {
            const talkRange = `${formatHemsScheduleTime(talk.startTime)}${
              talk.endTime ? ` – ${formatHemsScheduleTime(talk.endTime)}` : ""
            }`;
            const talkParas: string[] = [
              pXml(
                buildWordScientificRunsXml(
                  `${talk.title}${talk.isStudentAward ? "  [Student Travel Award Candidate]" : ""}`,
                  {
                    bold: true,
                    colorHex: "0F172A",
                    sizeHalfPt: 20,
                  }
                ),
                { spaceAfter: talk.authorsLine ? 25 : 0 }
              ),
            ];
            if (talk.authorsLine) {
              talkParas.push(
                pXml(
                  buildWordScientificRunsXml(talk.authorsLine, {
                    colorHex: "334155",
                    sizeHalfPt: 18,
                  }),
                  { spaceAfter: 0 }
                )
              );
            }
            trs.push(
              `<w:tr><w:trPr><w:cantSplit/></w:trPr>${tcXml(
                pXml(
                  buildWordScientificRunsXml(talkRange, {
                    colorHex: "475569",
                    sizeHalfPt: 19,
                  }),
                  { spaceAfter: 0 }
                ),
                2360
              )}${tcXml(talkParas.join(""), 7000)}</w:tr>`
            );
          }
        }
      }
    }

    if (trs.length > 0) {
      bodyParts.push(twoColTableXml(trs.join("")));
    }
  }

  // Accepted Poster Presentations Appendix
  if (plan.includePosterAppendix && plan.posters.length > 0) {
    bodyParts.push(
      pXml(
        buildWordScientificRunsXml(`Accepted Poster Presentations (${plan.posters.length})`, {
          bold: true,
          colorHex: "0C3056",
          sizeHalfPt: 25,
        }),
        { styleId: "Heading1", spaceBefore: 240, spaceAfter: 80, shadingHex: "E2E8F0" }
      )
    );
    const posterRows = plan.posters
      .map((poster) => {
        const rightParas = [
          pXml(
            buildWordScientificRunsXml(
              `${poster.title}${poster.isStudentAward ? "  [Student Travel Award Candidate]" : ""}`,
              { bold: true, colorHex: "0F172A", sizeHalfPt: 20 }
            ),
            { spaceAfter: poster.authorsLine ? 20 : 0 }
          ),
        ];
        if (poster.authorsLine) {
          rightParas.push(
            pXml(
              buildWordScientificRunsXml(poster.authorsLine, {
                colorHex: "334155",
                sizeHalfPt: 18,
              }),
              { spaceAfter: 0 }
            )
          );
        }
        return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${tcXml(
          pXml(
            buildWordScientificRunsXml(poster.posterNumber, {
              bold: true,
              colorHex: "1E3A8A",
              sizeHalfPt: 20,
            }),
            { spaceAfter: 0 }
          ),
          2360
        )}${tcXml(rightParas.join(""), 7000)}</w:tr>`;
      })
      .join("");
    bodyParts.push(twoColTableXml(posterRows));
  }

  // trailing normal paragraph + Letter 1" margins section properties
  bodyParts.push(
    "<w:sectPr>" +
      '<w:pgSz w:w="12240" w:h="15840"/>' +
      '<w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>' +
      "</w:sectPr>"
  );

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    `<w:body>${bodyParts.join("")}</w:body>`,
    "</w:document>",
  ].join("");
}

/**
 * Generates raw OpenXML (.docx) ZIP archive bytes for client download and automated testing.
 */
export function buildConferenceScheduleDocxBytes(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): Uint8Array {
  const enc = new TextEncoder();
  const entries: ZipEntry[] = [
    { name: "[Content_Types].xml", data: enc.encode(buildContentTypesXml()) },
    { name: "_rels/.rels", data: enc.encode(buildRootRelsXml()) },
    { name: "word/_rels/document.xml.rels", data: enc.encode(buildDocumentRelsXml()) },
    { name: "word/styles.xml", data: enc.encode(buildStylesXml()) },
    { name: "word/document.xml", data: enc.encode(buildDocumentXml(plan, workshop)) },
  ];
  return buildZipArchive(entries);
}

/**
 * Generates and downloads an editable Microsoft Word `.docx` Conference Schedule.
 */
export function downloadConferenceScheduleDocx(
  plan: ConferenceSchedulePlan,
  workshop: UpcomingWorkshopConfig
): string {
  const filename = buildScheduleExportFilename(plan, "docx");
  const bytes = buildConferenceScheduleDocxBytes(plan, workshop);
  const buffer = bytes.slice().buffer;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}
