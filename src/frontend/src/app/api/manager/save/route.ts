import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function parseTime(tStr: string) {
  if (!tStr) return 0;
  let t = tStr.toLowerCase().replace(/\./g, '').trim();
  const isPM = t.includes("pm") || t.includes("p");
  t = t.replace(/[a-z]/g, '').trim();
  const parts = t.split(':');
  let h = parseInt(parts[0]) || 0;
  let m = parseInt(parts[1]) || 0;
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h * 60 + m;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const masterPath = path.join(process.cwd(), 'src', 'data', 'master_workshops.json');
    await fs.writeFile(masterPath, JSON.stringify(data, null, 2));

    const archivesDir = path.join(process.cwd(), 'src', 'data', 'archives');

    for (const ws of data) {
      if (!ws.year) continue;
      
      const yearPath = path.join(archivesDir, `${ws.year}.json`);
      let yearData: any = {};
      
      try {
        const raw = await fs.readFile(yearPath, 'utf8');
        yearData = JSON.parse(raw);
      } catch (e) {
        yearData = {
          year: ws.year,
          ordinal: getOrdinal(ws.number),
          dates: "TBD",
          resources: []
        };
      }

      yearData.venue = ws.venue || "";
      yearData.address = ws.address || ws.city || "";
      yearData.venue_url = ws.venue_url || "";

      const buildCloudUrl = (category: string, wsNum: number, session: string | null, fileName: string) => {
        const baseUrl = 'https://storage.googleapis.com/hems-archive-assets/proceedings';
        if (category === 'Administrative') return `${baseUrl}/${wsNum}th/Administrative/${fileName}`;
        if (category === 'Student_Award') return `${baseUrl}/${wsNum}th/Student_Award/${fileName}`;
        if (category === 'Poster') return `${baseUrl}/${wsNum}th/Posters/${fileName}`;
        
        const cleanSession = (session || 'General').replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        return `${baseUrl}/${wsNum}th/${cleanSession}/${fileName}`;
      };

      yearData.resources = [];
      // Hardcoded anchor link to the program section below
      yearData.resources.push({ label: "Workshop Program", icon: "FileText", url: "#technical-program" });
      
      const pUrl = ws.program_file ? buildCloudUrl('Administrative', ws.number, null, ws.program_file) : ws.program_url;
      if (pUrl) {
        yearData.resources.push({ label: "Program Download", icon: "Download", url: pUrl });
      }
      const plUrl = ws.participant_list_file ? buildCloudUrl('Administrative', ws.number, null, ws.participant_list_file) : ws.participant_list_url;
      if (plUrl) {
        yearData.resources.push({ label: "Participant List", icon: "Users", url: plUrl });
      }
      
      if (ws.sponsors && ws.sponsors.length > 0) {
        yearData.sponsors = ws.sponsors.map((s: any) => ({
          name: s.company,
          url: s.link || "",
          image: `/images/sponsors/${s.logo_file}`,
          year: s.year || ""
        }));
      } else {
        yearData.sponsors = [];
      }

      const daysMap = new Map<string, any[]>();

      if (ws.events) {
        for (const ev of ws.events) {
          if (!daysMap.has(ev.date)) daysMap.set(ev.date, []);
          daysMap.get(ev.date)!.push({
            type: "event",
            time: ev.time,
            title: ev.title,
            subtitle: ev.subtitle
          });
        }
      }

      if (ws.presentations) {
        for (const pres of ws.presentations) {
          if (!daysMap.has(pres.date)) daysMap.set(pres.date, []);
          
          let dayItems = daysMap.get(pres.date)!;
          let sessionItem = dayItems.find((i: any) => i.type === "session" && i.title === pres.session);
          
          if (!sessionItem) {
            sessionItem = {
              type: "session",
              time: pres.time,
              title: pres.session,
              talks: []
            };
            dayItems.push(sessionItem);
          }

          sessionItem.talks.push({
            time: pres.time,
            title: pres.title,
            authors: pres.authors,
            presentationUrl: pres.presentation_file ? buildCloudUrl('Presentation', ws.number, pres.session, pres.presentation_file) : (pres.url || ""),
            abstractUrl: pres.abstract_file ? buildCloudUrl('Presentation', ws.number, pres.session, pres.abstract_file) : (pres.abstract_url || "")
          });
        }
      }

      if (ws.posters && ws.posters.length > 0) {
        const defaultDate = daysMap.keys().next().value || "Posters";
        if (!daysMap.has(defaultDate)) daysMap.set(defaultDate, []);
        
        let dayItems = daysMap.get(defaultDate)!;
        let posterSession = dayItems.find((i: any) => i.type === "session" && i.title.toLowerCase().includes("poster"));
        
        if (!posterSession) {
          posterSession = {
            type: "session",
            time: "TBD",
            title: "Poster Session",
            talks: []
          };
          dayItems.push(posterSession);
        }

        for (const poster of ws.posters) {
          posterSession.talks.push({
            time: "",
            title: poster.title,
            authors: poster.name + (poster.affiliation ? `, ${poster.affiliation}` : ""),
            presentationUrl: poster.presentation_file ? buildCloudUrl('Poster', ws.number, null, poster.presentation_file) : (poster.url || ""),
            abstractUrl: poster.abstract_file ? buildCloudUrl('Poster', ws.number, null, poster.abstract_file) : (poster.abstract_url || "")
          });
        }
      }

      if (ws.student_awards && ws.student_awards.length > 0) {
        const defaultDate = daysMap.keys().next().value || "Student Awards";
        if (!daysMap.has(defaultDate)) daysMap.set(defaultDate, []);
        
        let dayItems = daysMap.get(defaultDate)!;
        let awardSession = dayItems.find((i: any) => i.type === "session" && i.title.toLowerCase().includes("award"));
        
        if (!awardSession) {
          awardSession = {
            type: "session",
            time: "TBD",
            title: "Student Awards",
            talks: []
          };
          dayItems.push(awardSession);
        }

        for (const award of ws.student_awards) {
          awardSession.talks.push({
            time: "",
            title: award.title || "Student Award",
            authors: award.name + (award.affiliation ? `, ${award.affiliation}` : ""),
            presentationUrl: award.presentation_file ? buildCloudUrl('Student_Award', ws.number, null, award.presentation_file) : (award.url || ""),
            abstractUrl: award.abstract_file ? buildCloudUrl('Student_Award', ws.number, null, award.abstract_file) : (award.abstract_url || "")
          });
        }
      }

      const schedule = [];
      for (const [dateTitle, items] of Array.from(daysMap.entries())) {
        items.sort((a: any, b: any) => parseTime(a.time) - parseTime(b.time));
        
        for (const item of items) {
          if (item.type === "session" && item.talks) {
            item.talks.sort((a: any, b: any) => parseTime(a.time) - parseTime(b.time));
          }
        }
        
        schedule.push({
          title: dateTitle,
          items: items
        });
      }

      schedule.sort((a: any, b: any) => {
        const parseDateStr = (str: string) => {
          const cleanStr = str.split('|')[0].trim();
          return new Date(cleanStr).getTime() || 0;
        };
        return parseDateStr(a.title) - parseDateStr(b.title);
      });
      
      yearData.schedule = schedule;

      await fs.writeFile(yearPath, JSON.stringify(yearData, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving workshops:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
