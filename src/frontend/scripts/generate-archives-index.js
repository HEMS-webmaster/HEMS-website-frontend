const fs = require('fs');
const path = require('path');

function formatOrdinal(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return String(n || '');
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return `${num}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

function normalizeTitle(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function summarizeLocation(venue, address) {
  const cleanVenue = venue ? String(venue).replace(/,\s*$/, '').trim() : '';
  const cleanAddress = address ? String(address).replace(/,\s*$/, '').trim() : '';
  if (cleanAddress) {
    const parts = cleanAddress.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const tail = parts
        .slice(1)
        .join(', ')
        .replace(/\s+\d{5}(?:-\d{4})?$/, '')
        .replace(/,\s*$/, '')
        .trim();
      const compactTail = tail.replace(/^\d{4,6}\s+/, '');
      if (compactTail) return compactTail;
    }
    return cleanAddress;
  }
  return cleanVenue;
}

function getLiveHttpsUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (trimmed.startsWith('https://storage.googleapis.com/')) {
    return trimmed;
  }
  return '';
}

function extractAuthorsAndInstitutes(item, matchedArchiveTalk) {
  const sourceAuthors =
    matchedArchiveTalk && Array.isArray(matchedArchiveTalk.authors) && matchedArchiveTalk.authors.length > 0
      ? matchedArchiveTalk.authors
      : item.authors;
  const sourceInstitutes =
    matchedArchiveTalk && Array.isArray(matchedArchiveTalk.institutes) && matchedArchiveTalk.institutes.length > 0
      ? matchedArchiveTalk.institutes
      : item.institutes;

  const authorsList = [];
  const authorDetails = [];
  const institutesList = [];

  if (Array.isArray(sourceInstitutes)) {
    sourceInstitutes.forEach((inst) => {
      if (typeof inst === 'string' && inst.trim() && !institutesList.includes(inst.trim())) {
        institutesList.push(inst.trim());
      }
    });
  }

  if (Array.isArray(sourceAuthors)) {
    sourceAuthors.forEach((a, idx) => {
      if (typeof a === 'string' && a.trim()) {
        const name = a.trim();
        authorsList.push(name);
        authorDetails.push({ name, institute: '', isPresenter: idx === 0 });
        return;
      }
      if (a && a.name && String(a.name).trim()) {
        const name = String(a.name).trim();
        let inst = '';
        if (typeof a.affiliation === 'string' && a.affiliation.trim()) {
          inst = a.affiliation.trim();
        } else if (typeof a.institute === 'string' && a.institute.trim()) {
          inst = a.institute.trim();
        } else if (
          typeof a.institute === 'number' &&
          Array.isArray(sourceInstitutes) &&
          sourceInstitutes[a.institute - 1]
        ) {
          inst = String(sourceInstitutes[a.institute - 1]).trim();
        }
        authorsList.push(name);
        if (inst && !institutesList.includes(inst)) {
          institutesList.push(inst);
        }
        authorDetails.push({
          name,
          institute: inst,
          isPresenter: Boolean(a.isPresenter || idx === 0),
        });
      }
    });
  } else if (typeof sourceAuthors === 'string' && sourceAuthors.trim()) {
    sourceAuthors.split(',').forEach((n, idx) => {
      const name = n.trim();
      if (name) {
        authorsList.push(name);
        authorDetails.push({ name, institute: '', isPresenter: idx === 0 });
      }
    });
  }

  return { authorsList, authorDetails, institutesList };
}

try {
  const masterPath = path.join(__dirname, '..', 'src', 'data', 'master_workshops.json');
  const archivesDir = path.join(__dirname, '..', 'src', 'data', 'archives');
  const outputPath = path.join(__dirname, '..', 'public', 'archives-index.json');

  if (!fs.existsSync(masterPath)) {
    console.error('master_workshops.json not found at:', masterPath);
    process.exit(1);
  }

  const workshops = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const flatIndex = [];

  workshops.forEach((ws) => {
    const wsYearStr = String(ws.year);
    const wsYearNum = Number(wsYearStr);
    const wsNumber = Number(ws.number);
    const archivePath = path.join(archivesDir, `${wsYearStr}.json`);

    let archiveData = null;
    const archiveTalkPool = [];

    if (fs.existsSync(archivePath)) {
      archiveData = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      if (Array.isArray(archiveData.schedule)) {
        archiveData.schedule.forEach((day) => {
          if (Array.isArray(day.items)) {
            day.items.forEach((schedItem) => {
              if (Array.isArray(schedItem.talks)) {
                schedItem.talks.forEach((t) => {
                  if (t && t.title && t.type !== 'event') {
                    archiveTalkPool.push({
                      ...t,
                      _sessionTitle: schedItem.title || '',
                      _used: false,
                    });
                  }
                });
              }
            });
          }
        });
      }
    }

    const ordinalLabel = (archiveData && archiveData.ordinal) || formatOrdinal(wsNumber);
    const wsDates = (archiveData && archiveData.dates) || '';
    const wsLocation = archiveData ? summarizeLocation(archiveData.venue, archiveData.address) : '';

    const matchArchiveTalk = (title) => {
      const nt = normalizeTitle(title);
      let found = archiveTalkPool.find((x) => !x._used && normalizeTitle(x.title) === nt);
      if (!found) {
        found = archiveTalkPool.find(
          (x) =>
            !x._used &&
            (normalizeTitle(x.title).includes(nt) || nt.includes(normalizeTitle(x.title)))
        );
      }
      if (found) found._used = true;
      return found || null;
    };

    const buildRecord = (rawItem, defaultSessionTitle, recordType) => {
      const matched = matchArchiveTalk(rawItem.title);
      const title = (matched && matched.title) || rawItem.title || '';
      const { authorsList, authorDetails, institutesList } = extractAuthorsAndInstitutes(
        rawItem,
        matched
      );

      const anchorId = (matched && matched.id) || '';
      const canonicalUrl = anchorId
        ? `https://www.hems-workshop.org/archive/${wsYearStr}/#${anchorId}`
        : `https://www.hems-workshop.org/archive/${wsYearStr}/`;

      const presentationUrl = getLiveHttpsUrl(
        (matched && matched.public_website_url) || rawItem.public_website_url || ''
      );
      const abstractUrl = getLiveHttpsUrl(
        (matched && matched.public_abstract_url) || rawItem.public_abstract_url || ''
      );

      const slidePreviewPngUrl = presentationUrl
        ? presentationUrl.replace(/\.pdf$/i, '_preview.png')
        : '';
      const abstractPreviewTxtUrl =
        abstractUrl && abstractUrl.includes('_Abstract')
          ? abstractUrl.replace(/\.pdf$/i, '_preview.txt')
          : '';

      const presFile =
        rawItem.presentation_file ||
        (presentationUrl ? decodeURIComponent(path.basename(presentationUrl)) : '');
      const absFile =
        rawItem.abstract_file ||
        (abstractUrl ? decodeURIComponent(path.basename(abstractUrl)) : '');

      const authorsCite = authorsList.length > 0 ? authorsList.join(', ') : 'HEMS Workshop Contributors';
      const locationClause = wsLocation ? `, ${wsLocation}` : '';
      const citation = `${authorsCite} (${wsYearStr}). "${title}." Proceedings of the ${ordinalLabel} Workshop on Harsh-Environment Mass Spectrometry${locationClause}. ${canonicalUrl}`;

      return {
        id: anchorId,
        canonical_url: canonicalUrl,
        title,
        authors: authorsList,
        author_details: authorDetails,
        institutions: institutesList,
        workshop_year: Number.isFinite(wsYearNum) ? wsYearNum : wsYearStr,
        workshop_ordinal: wsNumber,
        workshop_ordinal_label: ordinalLabel,
        workshop_dates: wsDates,
        workshop_location: wsLocation,
        session_title:
          (matched && matched._sessionTitle) || defaultSessionTitle,
        type: recordType,
        presentation_url: presentationUrl,
        abstract_url: abstractUrl,
        slide_preview_png_url: slidePreviewPngUrl,
        abstract_preview_txt_url: abstractPreviewTxtUrl,
        presentation_file: presFile,
        abstract_file: absFile,
        citation,
      };
    };

    if (Array.isArray(ws.presentation_sessions)) {
      ws.presentation_sessions.forEach((session) => {
        const sessionTitle = session.session_title || session.title || 'Oral Session';
        if (Array.isArray(session.presentations)) {
          session.presentations.forEach((talk) => {
            flatIndex.push(buildRecord(talk, sessionTitle, 'presentation'));
          });
        }
      });
    }

    if (Array.isArray(ws.posters)) {
      ws.posters.forEach((poster) => {
        flatIndex.push(buildRecord(poster, 'Poster Session', 'poster'));
      });
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(flatIndex, null, 2));
  const gcsSlides = flatIndex.filter((x) => x.presentation_url).length;
  const gcsAbstracts = flatIndex.filter((x) => x.abstract_url).length;
  console.log(
    `Successfully generated AI & scholarly proceedings index (${flatIndex.length} items, ${gcsSlides} live slide PDFs, ${gcsAbstracts} live abstract PDFs) at ${outputPath}`
  );
} catch (e) {
  console.error('Failed to generate index:', e.message);
  process.exit(1);
}
