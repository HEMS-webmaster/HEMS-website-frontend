import jsPDF from 'jspdf';

// ── helpers ───────────────────────────────────────────────────────────────────

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function parseToMinutes(t: string): number {
  if (!t) return Infinity;
  const clean = t.trim().toLowerCase().replace(/\./g, '');
  const ampm = clean.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    if (ampm[3] === 'pm' && h !== 12) h += 12;
    if (ampm[3] === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }
  const h24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1]) * 60 + parseInt(h24[2]);
  return Infinity;
}

function fmtTime(t: string): string {
  if (!t) return '';
  const min = parseToMinutes(t);
  if (min === Infinity) return t;
  let h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? 'p.m.' : 'a.m.';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function formatDateHeading(iso: string): string {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-').map(Number);
  const dt = new Date(y, mo - 1, d);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${d}, ${y}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface ScheduleItem {
  type: 'event' | 'session';
  time: string;
  sortMin: number;
  title: string;
  subtitle?: string;
  talks?: { time: string; title: string; authors: string }[];
}

interface DaySchedule {
  date: string;
  heading: string;
  items: ScheduleItem[];
}

// ── build unified schedule ────────────────────────────────────────────────────

function buildSchedule(ws: any): DaySchedule[] {
  const dayMap = new Map<string, ScheduleItem[]>();

  // Sessions from presentation_sessions
  if (ws.presentation_sessions) {
    for (const sg of ws.presentation_sessions) {
      const date = sg.date || '9999-12-31';
      if (!dayMap.has(date)) dayMap.set(date, []);
      const firstTime = sg.presentations?.[0]?.time || '';
      const talks = (sg.presentations || []).map((p: any) => {
        let authorStr = '';
        if (Array.isArray(p.authors) && p.authors.length > 0) {
          authorStr = p.authors.map((a: any) => {
            let name = a.name || '';
            if (a.institute) name += `, ${a.institute}`;
            return name;
          }).join('; ');
        }
        return { time: fmtTime(p.time), title: p.title || '', authors: authorStr };
      });
      dayMap.get(date)!.push({
        type: 'session',
        time: fmtTime(firstTime),
        sortMin: parseToMinutes(firstTime),
        title: sg.title || 'Session',
        talks,
      });
    }
  }

  // Events from events array
  if (ws.events) {
    for (const eg of ws.events) {
      const date = eg.date || '9999-12-31';
      if (!dayMap.has(date)) dayMap.set(date, []);
      if (eg.events) {
        for (const ev of eg.events) {
          const endStr = ev.end_time ? ` – ${fmtTime(ev.end_time)}` : '';
          dayMap.get(date)!.push({
            type: 'event',
            time: fmtTime(ev.time),
            sortMin: parseToMinutes(ev.time),
            title: ev.title || '',
            subtitle: [ev.subtitle, ev.location].filter(Boolean).join(' | ') + endStr,
          });
        }
      }
    }
  }

  // Sort days, then items within each day
  const days: DaySchedule[] = [];
  for (const [date, items] of Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    items.sort((a, b) => a.sortMin - b.sortMin);
    days.push({ date, heading: formatDateHeading(date), items });
  }
  return days;
}

export function exportProgramPdf(ws: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', putOnlyUsedFonts: true });
  const W = 612, H = 792;
  const M = 72; // 1-inch margin
  const CW = W - 2 * M; // content width
  const BOTTOM = H - 72; // 1-inch bottom margin
  let y = M;
  let pageNum = 1;

  const addFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(`Page ${pageNum}`, W / 2, H - 18, { align: 'center' });
    doc.setTextColor(0);
  };

  // ── PAGE 1: WORKSHOP OVERVIEW ─────────────────────────────────────────────

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const ordinal = getOrdinal(parseInt(String(ws.number)));
  doc.text(`${ordinal} HEMS Workshop`, W / 2, y, { align: 'center' });
  y += 22;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Workshop on Harsh-Environment Mass Spectrometry', W / 2, y, { align: 'center' });
  y += 18;

  // Dates
  if (ws.dates) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(ws.dates, W / 2, y, { align: 'center' });
    y += 14;
  }

  // Venue + Address
  const locParts = [ws.venue, ws.address || ws.city].filter(Boolean);
  if (locParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(locParts.join(' — '), W / 2, y, { align: 'center' });
    y += 14;
  }

  // Divider
  y += 2;
  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 12;

  // Host
  const hostSponsor = ws.sponsors?.find((s: any) => s.isHost);
  if (hostSponsor) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('OFFICIAL HOST', M, y);
    y += 13;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(hostSponsor.company, M, y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    if (hostSponsor.link) doc.text(hostSponsor.link, M, y + 10);
    y += 18;
    doc.setDrawColor(220);
    doc.line(M, y, W - M, y);
    y += 12;
    doc.setTextColor(0);
  }

  // Sponsors — two columns
  const sponsors = (ws.sponsors || []).filter((s: any) => s.company);
  if (sponsors.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('CORPORATE SPONSORS', M, y);
    y += 14;

    doc.setFontSize(8.5);
    doc.setTextColor(0);
    const col = CW / 2;
    for (let i = 0; i < sponsors.length; i += 2) {
      const s1 = sponsors[i];
      const s2 = sponsors[i + 1];
      const badge1 = s1.isHost ? ' ★' : '';
      const yr1 = s1.year ? ` (${s1.year})` : '';
      doc.setFont('helvetica', 'normal');
      doc.text(`•  ${s1.company}${yr1}${badge1}`, M + 4, y);
      if (s2) {
        const badge2 = s2.isHost ? ' ★' : '';
        const yr2 = s2.year ? ` (${s2.year})` : '';
        doc.text(`•  ${s2.company}${yr2}${badge2}`, M + col + 4, y);
      }
      y += 12;
    }
    y += 6;
  }

  // Student Awards
  if (ws.student_awards?.length > 0) {
    doc.setDrawColor(220);
    doc.line(M, y, W - M, y);
    y += 12;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('STUDENT AWARDS', M, y);
    y += 14;

    doc.setTextColor(0);
    for (const aw of ws.student_awards) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const awardName = aw.name + (aw.institute ? `, ${aw.institute}` : '');
      doc.text(awardName, M + 6, y);
      y += 12;
      if (aw.title) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        const tLines = doc.splitTextToSize(aw.title, CW - 12);
        doc.text(tLines, M + 6, y);
        y += tLines.length * 10;
      }
      y += 4;
    }
  }

  addFooter();

  // ── PAGES 2+: TECHNICAL PROGRAM ───────────────────────────────────────────

  doc.addPage();
  pageNum = 2;
  y = M;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Technical Program', W / 2, y, { align: 'center' });
  y += 20;

  const schedule = buildSchedule(ws);

  // Adaptive font size: estimate total content height at 8pt, scale down if needed
  const TALK_LINE_H = 8.5;  // height per talk line
  const SESSION_H = 14;    // session header height
  const EVENT_H = 10;      // event item height
  const DAY_H = 15;        // day header height
  let estHeight = 0;
  for (const day of schedule) {
    estHeight += DAY_H;
    for (const item of day.items) {
      if (item.type === 'event') estHeight += EVENT_H;
      else {
        estHeight += SESSION_H;
        estHeight += (item.talks?.length || 0) * (TALK_LINE_H * 2); // title + authors
      }
    }
  }
  const availableH = (BOTTOM - M - 22) * 2; // 2 pages of content (minus title space on page 2)
  const scaleFactor = estHeight > availableH ? availableH / estHeight : 1;
  const baseFontSize = Math.max(6.5, Math.min(8.5, 8.5 * scaleFactor));

  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = M;
    }
  };

  const TIME_COL_W = 68;
  const CONTENT_X = M + TIME_COL_W + 4;
  const CONTENT_W = CW - TIME_COL_W - 4;

  for (const day of schedule) {
    ensureSpace(DAY_H + 20);

    // Day heading — shaded bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(baseFontSize + 1.5);
    let dayLH = doc.getLineHeight();
    doc.setFillColor(230, 230, 235);
    doc.rect(M, y - dayLH + 2, CW, dayLH + 6, 'F');
    doc.setTextColor(40);
    doc.text(day.heading, M + 6, y);
    y += dayLH + 8;

    for (const item of day.items) {
      if (item.type === 'event') {
        ensureSpace(EVENT_H);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(80);
        doc.text(item.time, M, y, { align: 'left' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60);
        doc.text(item.title, CONTENT_X, y);
        let eventLH = doc.getLineHeight();
        const titleWidth = doc.getTextWidth(item.title + '  ');
        if (item.subtitle) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(baseFontSize - 1);
          doc.setTextColor(120);
          const subLines = doc.splitTextToSize(item.subtitle, Math.max(10, CONTENT_W - titleWidth));
          doc.text(subLines[0] || '', CONTENT_X + titleWidth, y);
        }
        y += eventLH + 2;
        doc.setTextColor(0);
      } else {
        // Session
        ensureSpace(SESSION_H + (item.talks?.length || 0) * (baseFontSize * 2));

        // Session header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(baseFontSize + 0.5);
        let sessionLH = doc.getLineHeight();
        doc.setFillColor(220, 230, 245);
        doc.rect(M, y - sessionLH + 2, CW, sessionLH + 6, 'F');
        doc.setTextColor(30, 60, 120);
        doc.text(item.time, M + 4, y);
        doc.text(item.title, CONTENT_X, y);
        y += sessionLH + 8;
        doc.setTextColor(0);

        // Talks
        if (item.talks) {
          for (const talk of item.talks) {
            ensureSpace(baseFontSize * 3);

            // Time
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(baseFontSize - 0.5);
            doc.setTextColor(120);
            doc.text(talk.time, M + 8, y);

            // Title (may wrap)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(baseFontSize);
            doc.setTextColor(0);
            const titleLines = doc.splitTextToSize(talk.title, CONTENT_W);
            doc.text(titleLines, CONTENT_X, y);
            y += titleLines.length * doc.getLineHeight();

            // Authors
            if (talk.authors) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(baseFontSize - 1);
              doc.setTextColor(80);
              const authLines = doc.splitTextToSize(talk.authors, CONTENT_W);
              doc.text(authLines, CONTENT_X, y);
              y += authLines.length * doc.getLineHeight();
            }
            y += 4;
          }
        }
        y += 2;
      }
    }
    y += 4; // gap between days
  }

  addFooter();

  // Report page count
  const totalPages = pageNum;
  if (totalPages > 3) {
    console.warn(`PDF generated with ${totalPages} pages (target was 3). Schedule was too large to fit in 2 pages.`);
  }

  // Save
  const fileName = `${ordinal}_HEMS_Workshop_Technical_Program.pdf`;
  doc.save(fileName);
  return totalPages;
}
