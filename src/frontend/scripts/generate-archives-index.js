const fs = require('fs');
const path = require('path');

try {
  const masterPath = path.join(__dirname, '..', 'src', 'data', 'master_workshops.json');
  const outputPath = path.join(__dirname, '..', 'public', 'archives-index.json');

  if (!fs.existsSync(masterPath)) {
    console.error('master_workshops.json not found at:', masterPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(masterPath, 'utf8');
  const workshops = JSON.parse(rawData);
  const flatIndex = [];

  const getAbsoluteUrl = (urlStr) => {
    if (!urlStr) return "";
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      return urlStr;
    }
    if (urlStr.startsWith("/")) {
      return `https://www.hems-workshop.org${urlStr}`;
    }
    return `https://www.hems-workshop.org/${urlStr}`;
  };

  workshops.forEach((ws) => {
    const wsYear = ws.year;
    const wsNumber = ws.number;

    // Process regular presentations
    if (ws.presentation_sessions && Array.isArray(ws.presentation_sessions)) {
      ws.presentation_sessions.forEach((session) => {
        const sessionTitle = session.session_title || session.title || "Oral Session";
        if (session.presentations && Array.isArray(session.presentations)) {
          session.presentations.forEach((talk) => {
            const authorsList = [];
            const institutesList = [];

            if (Array.isArray(talk.authors)) {
              talk.authors.forEach((a) => {
                if (a.name) authorsList.push(a.name);
                if (a.institute && !institutesList.includes(a.institute)) {
                  institutesList.push(a.institute);
                }
              });
            } else if (typeof talk.authors === 'string') {
              talk.authors.split(',').forEach((n) => authorsList.push(n.trim()));
            }

            if (Array.isArray(talk.institutes)) {
              talk.institutes.forEach((inst) => {
                if (!institutesList.includes(inst)) {
                  institutesList.push(inst);
                }
              });
            }

            flatIndex.push({
              title: talk.title || "",
              authors: authorsList,
              institutions: institutesList,
              workshop_year: wsYear,
              workshop_ordinal: wsNumber,
              session_title: sessionTitle,
              type: "presentation",
              presentation_url: getAbsoluteUrl(talk.public_website_url || talk.local_target_path || talk.legacy_url || talk.presentationUrl || talk.url || ""),
              abstract_url: getAbsoluteUrl(talk.public_abstract_url || talk.local_abstract_target_path || talk.legacy_abstract_url || talk.abstractUrl || talk.abstract_url || "")
            });
          });
        }
      });
    }

    // Process posters
    if (ws.posters && Array.isArray(ws.posters)) {
      ws.posters.forEach((poster) => {
        const authorsList = [];
        const institutesList = [];

        if (Array.isArray(poster.authors)) {
          poster.authors.forEach((a) => {
            if (a.name) authorsList.push(a.name);
            if (a.institute && !institutesList.includes(a.institute)) {
              institutesList.push(a.institute);
            }
          });
        } else if (typeof poster.authors === 'string') {
          poster.authors.split(',').forEach((n) => authorsList.push(n.trim()));
        }

        if (Array.isArray(poster.institutes)) {
          poster.institutes.forEach((inst) => {
            if (!institutesList.includes(inst)) {
              institutesList.push(inst);
            }
          });
        }

        flatIndex.push({
          title: poster.title || "",
          authors: authorsList,
          institutions: institutesList,
          workshop_year: wsYear,
          workshop_ordinal: wsNumber,
          session_title: "Poster Session",
          type: "poster",
          presentation_url: getAbsoluteUrl(poster.public_website_url || poster.local_target_path || poster.legacy_url || poster.presentationUrl || poster.url || ""),
          abstract_url: getAbsoluteUrl(poster.public_abstract_url || poster.local_abstract_target_path || poster.legacy_abstract_url || poster.abstractUrl || poster.abstract_url || "")
        });
      });
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(flatIndex, null, 2));
  console.log(`Successfully generated dynamic AI index database containing ${flatIndex.length} items at ${outputPath}`);
} catch (e) {
  console.error('Failed to generate index:', e.message);
}
