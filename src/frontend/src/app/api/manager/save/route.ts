// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
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
    await fs.writeFile(masterPath, JSON.stringify(data, null, 2), 'utf8');

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
      if (ws.number !== undefined) {
        yearData.ordinal = getOrdinal(ws.number);
      }
      yearData.title = ws.title || "";
      yearData.tagline = ws.tagline || "";
      yearData.venue = ws.venue || "";
      yearData.address = ws.address || ws.city || "";
      yearData.venue_url = ws.venue_url || "";
      yearData.venue_address_url = ws.venue_address_url || "";
      if (ws.dates !== undefined) yearData.dates = ws.dates;

      const proceedingsDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'proceedings');

      const checkFileExists = (category: string, wsNum: number, session: string | null, fileName: string) => {
        if (!fileName) return false;
        let relativeDir = '';
        const wsOrdinal = getOrdinal(wsNum);
        if (category === 'Administrative') relativeDir = `${wsOrdinal}/Administrative`;
        else if (category === 'Student_Award') relativeDir = `${wsOrdinal}/Student_Award`;
        else if (category === 'Poster') relativeDir = `${wsOrdinal}/Posters`;
        else {
          const cleanSession = (session || 'General').replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          relativeDir = `${wsOrdinal}/${cleanSession}`;
        }
        const fullPath = path.join(proceedingsDir, relativeDir, fileName);
        return fsSync.existsSync(fullPath);
      };

      const buildCloudUrl = (category: string, wsNum: number, session: string | null, fileName: string) => {
        if (!checkFileExists(category, wsNum, session, fileName)) return "";
        const baseUrl = 'https://storage.googleapis.com/hems-workshop-archives/proceedings';
        const wsOrdinal = getOrdinal(wsNum);
        if (category === 'Administrative') return `${baseUrl}/${wsOrdinal}/Administrative/${fileName}`;
        if (category === 'Student_Award') return `${baseUrl}/${wsOrdinal}/Student_Award/${fileName}`;
        if (category === 'Poster') return `${baseUrl}/${wsOrdinal}/Posters/${fileName}`;
        
        const cleanSession = (session || 'General').replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        return `${baseUrl}/${wsOrdinal}/${cleanSession}/${fileName}`;
      };

      const buildLocalUrl = (category: string, wsNum: number, session: string | null, fileName: string) => {
        if (!checkFileExists(category, wsNum, session, fileName)) return "";
        const baseUrl = '/api/manager/serve?file=';
        const wsOrdinal = getOrdinal(wsNum);
        if (category === 'Administrative') return `${baseUrl}${wsOrdinal}/Administrative/${fileName}`;
        if (category === 'Student_Award') return `${baseUrl}${wsOrdinal}/Student_Award/${fileName}`;
        if (category === 'Poster') return `${baseUrl}${wsOrdinal}/Posters/${fileName}`;
        
        const cleanSession = (session || 'General').replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        return `${baseUrl}${wsOrdinal}/${cleanSession}/${fileName}`;
      };

      const buildGcloudUrl = (category: string, wsNum: number, session: string | null, fileName: string) => {
        if (!checkFileExists(category, wsNum, session, fileName)) return "";
        const baseUrl = 'gs://hems-workshop-archives/proceedings';
        const wsOrdinal = getOrdinal(wsNum);
        if (category === 'Administrative') return `${baseUrl}/${wsOrdinal}/Administrative/${fileName}`;
        if (category === 'Student_Award') return `${baseUrl}/${wsOrdinal}/Student_Award/${fileName}`;
        if (category === 'Poster') return `${baseUrl}/${wsOrdinal}/Posters/${fileName}`;
        
        const cleanSession = (session || 'General').replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        return `${baseUrl}/${wsOrdinal}/${cleanSession}/${fileName}`;
      };

      yearData.resources = [];
      // Hardcoded anchor link to the program section below
      yearData.resources.push({ label: "Workshop Program", icon: "FileText", url: "#technical-program" });
      
      if (ws.program_url || ws.program_file) {
        yearData.resources.push({ 
          label: "Program Download", 
          icon: "Download", 
          legacy_url: ws.program_url || "",
          local_target_path: ws.program_file ? buildLocalUrl('Administrative', ws.number, null, ws.program_file) : "",
          public_website_url: ws.program_file ? buildCloudUrl('Administrative', ws.number, null, ws.program_file) : "",
          gcloud_url: ws.program_file ? buildGcloudUrl('Administrative', ws.number, null, ws.program_file) : ""
        });
      }
      if (ws.participant_list_url || ws.participant_list_file) {
        yearData.resources.push({ 
          label: "Participant List", 
          icon: "Users", 
          legacy_url: ws.participant_list_url || "",
          local_target_path: ws.participant_list_file ? buildLocalUrl('Administrative', ws.number, null, ws.participant_list_file) : "",
          public_website_url: ws.participant_list_file ? buildCloudUrl('Administrative', ws.number, null, ws.participant_list_file) : "",
          gcloud_url: ws.participant_list_file ? buildGcloudUrl('Administrative', ws.number, null, ws.participant_list_file) : ""
        });
      }
      
      if (ws.sponsors && ws.sponsors.length > 0) {
        // Load registry for logo/year resolution
        let registryMap: Record<string, any> = {};
        try {
          const regRaw = await fs.readFile(path.join(process.cwd(), 'src', 'data', 'corporate_registry.json'), 'utf8');
          const reg: any[] = JSON.parse(regRaw.replace(/^\uFEFF/, ''));
          for (const r of reg) {
            registryMap[r.company.trim().toLowerCase()] = r;
          }
        } catch { /* registry may not exist */ }

        yearData.sponsors = ws.sponsors.map((s: any) => {
          const regEntry = registryMap[s.company?.trim().toLowerCase() || ''];
          const logoFile = s.logo_file || regEntry?.logo_file || '';
          const year = s.year || regEntry?.year_began || '';
          let imagePath = `/images/sponsors/${logoFile}`;
          // Append mtime as cache-buster so swapped logos are picked up immediately
          if (logoFile) {
            try {
              const logoOnDisk = path.join(process.cwd(), 'public', 'images', 'sponsors', logoFile);
              const stat = fsSync.statSync(logoOnDisk);
              imagePath += `?v=${Math.floor(stat.mtimeMs)}`;
            } catch { /* file may not exist yet */ }
          }
          return {
            name: s.company,
            url: s.link || regEntry?.url || "",
            image: imagePath,
            year: year
          };
        });
      } else {
        yearData.sponsors = [];
      }

      // Host corporation
      const hostSponsor = ws.host_corporation;
      if (hostSponsor && hostSponsor.name) {
        let hostLogoFile = hostSponsor.logo_file || '';
        if (!hostLogoFile) {
          try {
            const regRaw = await fs.readFile(path.join(process.cwd(), 'src', 'data', 'corporate_registry.json'), 'utf8');
            const reg: any[] = JSON.parse(regRaw.replace(/^\uFEFF/, ''));
            const regEntry = reg.find((r: any) => r.company.trim().toLowerCase() === hostSponsor.name.trim().toLowerCase());
            if (regEntry?.logo_file) hostLogoFile = regEntry.logo_file;
          } catch { /* registry may not exist */ }
        }
        const hc: any = {
          name: hostSponsor.name,
          url: hostSponsor.url || '',
          logo_file: hostLogoFile
        };
        if (hc.logo_file) {
          try {
            const hcLogoPath = path.join(process.cwd(), 'public', 'images', 'sponsors', hc.logo_file);
            const hcStat = fsSync.statSync(hcLogoPath);
            hc.logo_file_url = `/images/sponsors/${hc.logo_file}?v=${Math.floor(hcStat.mtimeMs)}`;
          } catch {
            hc.logo_file_url = `/images/sponsors/${hc.logo_file}`;
          }
        }
        yearData.host_corporation = hc;
      } else {
        yearData.host_corporation = null;
      }

      const daysMap = new Map<string, any[]>();

      if (ws.presentation_sessions) {
        for (const sessionGroup of ws.presentation_sessions) {
          if (!daysMap.has(sessionGroup.date)) daysMap.set(sessionGroup.date, []);
          
          let dayItems = daysMap.get(sessionGroup.date)!;
          let sessionItem = dayItems.find((i: any) => i.type === "session" && i.title === sessionGroup.title);
          
          if (!sessionItem) {
            // Find the time of the first presentation to use as the session time, or use TBD
            const firstTime = sessionGroup.presentations && sessionGroup.presentations.length > 0 
              ? sessionGroup.presentations[0].time 
              : "TBD";
              
            sessionItem = {
              type: "session",
              time: firstTime,
              title: sessionGroup.title,
              location: sessionGroup.location || "",
              talks: []
            };
            dayItems.push(sessionItem);
          } else {
            // Update location if it's not set
            if (!sessionItem.location && sessionGroup.location) {
              sessionItem.location = sessionGroup.location;
            }
          }

          if (sessionGroup.presentations) {
            for (const pres of sessionGroup.presentations) {
              sessionItem.talks.push({
                time: pres.time,
                title: pres.title,
                institutes: pres.institutes || [],
                authors: pres.authors,
                legacy_url: pres.url || "",
                legacy_abstract_url: pres.abstract_url || "",
                local_target_path: pres.presentation_file ? buildLocalUrl('Presentation', ws.number, sessionGroup.title, pres.presentation_file) : "",
                local_abstract_target_path: pres.abstract_file ? buildLocalUrl('Presentation', ws.number, sessionGroup.title, pres.abstract_file) : "",
                public_website_url: pres.presentation_file ? buildCloudUrl('Presentation', ws.number, sessionGroup.title, pres.presentation_file) : "",
                public_abstract_url: pres.abstract_file ? buildCloudUrl('Presentation', ws.number, sessionGroup.title, pres.abstract_file) : "",
                gcloud_url: pres.presentation_file ? buildGcloudUrl('Presentation', ws.number, sessionGroup.title, pres.presentation_file) : "",
                gcloud_abstract_url: pres.abstract_file ? buildGcloudUrl('Presentation', ws.number, sessionGroup.title, pres.abstract_file) : ""
              });
            }
          }
        }
      }

      if (ws.posters && ws.posters.length > 0) {
        for (const poster of ws.posters) {
          const posterDate = poster.date || daysMap.keys().next().value || "Posters";
          if (!daysMap.has(posterDate)) daysMap.set(posterDate, []);
          
          let dayItems = daysMap.get(posterDate)!;
          let posterSessionName = poster.session || "Poster Session";
          let posterSession = dayItems.find((i: any) => i.type === "session" && i.title === posterSessionName);
          
          if (!posterSession) {
            posterSession = {
              type: "session",
              time: poster.time || "TBD",
              title: posterSessionName,
              talks: []
            };
            dayItems.push(posterSession);
          }

          posterSession.talks.push({
            time: poster.time || "",
            title: poster.title,
            institutes: poster.institutes || [],
            authors: poster.authors || (poster.name ? poster.name + (poster.affiliation ? `, ${poster.affiliation}` : "") : ""),
            legacy_url: poster.url || "",
            legacy_abstract_url: poster.abstract_url || "",
            local_target_path: (poster.poster_file || poster.presentation_file) ? buildLocalUrl('Poster', ws.number, null, (poster.poster_file || poster.presentation_file)!) : "",
            local_abstract_target_path: poster.abstract_file ? buildLocalUrl('Poster', ws.number, null, poster.abstract_file) : "",
            public_website_url: (poster.poster_file || poster.presentation_file) ? buildCloudUrl('Poster', ws.number, null, (poster.poster_file || poster.presentation_file)!) : "",
            public_abstract_url: poster.abstract_file ? buildCloudUrl('Poster', ws.number, null, poster.abstract_file) : "",
            gcloud_url: (poster.poster_file || poster.presentation_file) ? buildGcloudUrl('Poster', ws.number, null, (poster.poster_file || poster.presentation_file)!) : "",
            gcloud_abstract_url: poster.abstract_file ? buildGcloudUrl('Poster', ws.number, null, poster.abstract_file) : ""
          });
        }
      }

      yearData.student_awards = [];
      if (ws.student_awards && ws.student_awards.length > 0) {
        for (const award of ws.student_awards) {
          yearData.student_awards.push({
            time: "",
            title: award.title || "Student Award",
            authors: award.name + (award.institute ? `, ${award.institute}` : ""),
            legacy_url: award.url || "",
            legacy_abstract_url: award.abstract_url || "",
            local_target_path: award.presentation_file ? buildLocalUrl('Student_Award', ws.number, null, award.presentation_file) : "",
            local_abstract_target_path: award.abstract_file ? buildLocalUrl('Student_Award', ws.number, null, award.abstract_file) : "",
            public_website_url: award.presentation_file ? buildCloudUrl('Student_Award', ws.number, null, award.presentation_file) : "",
            public_abstract_url: award.abstract_file ? buildCloudUrl('Student_Award', ws.number, null, award.abstract_file) : "",
            gcloud_url: award.presentation_file ? buildGcloudUrl('Student_Award', ws.number, null, award.presentation_file) : "",
            gcloud_abstract_url: award.abstract_file ? buildGcloudUrl('Student_Award', ws.number, null, award.abstract_file) : ""
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
      yearData.events = ws.events || [];

      await fs.writeFile(yearPath, JSON.stringify(yearData, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving workshops:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
