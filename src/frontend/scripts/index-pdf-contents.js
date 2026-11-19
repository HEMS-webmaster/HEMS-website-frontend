const fs = require('fs');
const path = require('path');

// Dynamically import algoliasearch if present
let algoliasearch;
try {
  ({ algoliasearch } = require('algoliasearch'));
} catch (e) {
  console.log('algoliasearch package not loaded, script will run in mock/extraction-only mode.');
}

// Dynamically import pdf-parse if present
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.log('pdf-parse package not loaded, script will run in cache/bibliographic mode.');
}

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';
const INDEX_NAME = 'hems_proceedings_search';

const cacheDir = path.join(__dirname, '..', '..', '..', 'local_data', 'cache');

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function formatOrdinalDirName(ordinal) {
  const num = Number(ordinal);
  if (!Number.isFinite(num) || num <= 0) return `${ordinal}th`;
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return `${num}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

// Recursively searches a directory for a file matching the filename (case-insensitive)
function findFileRecursively(dir, filename) {
  if (!fs.existsSync(dir)) return null;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const found = findFileRecursively(fullPath, filename);
        if (found) return found;
      } else if (item.toLowerCase() === filename.toLowerCase()) {
        return fullPath;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getProceedingsWsDir(ordinal) {
  const dirLabel = formatOrdinalDirName(ordinal);
  const localDir = path.join(__dirname, '..', '..', '..', 'local_data', 'proceedings', dirLabel);
  if (fs.existsSync(localDir)) return localDir;
  return path.join(__dirname, '..', '..', '..', 'docs', 'archives_translation', 'proceedings', dirLabel);
}

// Resolves local PDF file path from catalog relative or absolute URL
function getLocalFilePath(urlStr, year, type, ordinal, filename) {
  if (!urlStr && !filename) return null;

  // 1. Try URL-based path inside local_data/proceedings first (fastest O(1) lookup)
  if (urlStr) {
    try {
      let pathname = urlStr;
      if (pathname.startsWith('http')) {
        const parsed = new URL(pathname);
        pathname = decodeURIComponent(parsed.pathname);
      }
      pathname = pathname.replace(/^\//, '');

      if (pathname.startsWith('hems-workshop-archives/')) {
        pathname = pathname.replace(/^hems-workshop-archives\//, '');
      }
      const relWithoutProceedings = pathname.replace(/^proceedings\//, '');

      const localDataPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'local_data',
        'proceedings',
        relWithoutProceedings
      );
      if (fs.existsSync(localDataPath) && fs.statSync(localDataPath).isFile()) {
        return localDataPath;
      }

      const localAssetPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'docs',
        'archives_translation',
        pathname
      );
      if (fs.existsSync(localAssetPath) && fs.statSync(localAssetPath).isFile()) {
        return localAssetPath;
      }
    } catch (e) {
      // Ignore URL parse errors
    }
  }

  // 2. Try finding in proceedings workshop folder by filename
  if (ordinal && filename) {
    const proceedingsDir = getProceedingsWsDir(ordinal);
    const foundPath = findFileRecursively(proceedingsDir, filename);
    if (foundPath) return foundPath;
  }

  // 3. Fallback: try finding URL basename in workshop proceedings folder
  if (ordinal && urlStr) {
    try {
      const decodedPathname = decodeURIComponent(urlStr);
      const baseName = path.basename(decodedPathname);
      if (baseName && baseName.toLowerCase().endsWith('.pdf')) {
        const proceedingsDir = getProceedingsWsDir(ordinal);
        const foundPath = findFileRecursively(proceedingsDir, baseName);
        if (foundPath) return foundPath;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

function sanitizeExtractedPdfText(str) {
  return String(str || '')
    .replace(/[\uF0B7\uF0A7\uF076\uF0D8\uF0A8]/g, '•')
    .replace(/\u200B/g, '')
    .normalize('NFC')
    .trim();
}

// Returns page-by-page extracted text of a PDF, using cache if available
async function getOrExtractPdfText(localPath, cacheKey) {
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  // 1. Read from cache if it exists (works even on machines without raw PDFs)
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8').replace(/^\uFEFF/, ''));
      return Array.isArray(cached)
        ? cached.map((p) => ({ ...p, text: sanitizeExtractedPdfText(p.text) }))
        : cached;
    } catch (err) {
      console.warn(`Failed to read cache for ${cacheKey}, re-extracting:`, err.message);
    }
  }

  // 2. Validate PDF parser and file exist
  if (!pdfParse || !localPath || !fs.existsSync(localPath)) {
    return null;
  }

  // 3. Extract text from PDF page-by-page
  try {
    console.log(`Extracting text from PDF: ${path.basename(localPath)}...`);
    const dataBuffer = fs.readFileSync(localPath);

    const pageTexts = [];
    const render_page = (pageData) => {
      return pageData.getTextContent().then((textContent) => {
        let lastY;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pageTexts.push({ page: pageData.pageIndex + 1, text: sanitizeExtractedPdfText(text) });
        return text;
      });
    };

    await pdfParse(dataBuffer, { pagerender: render_page });
    pageTexts.sort((a, b) => a.page - b.page);

    fs.writeFileSync(cacheFile, JSON.stringify(pageTexts, null, 2), 'utf8');
    return pageTexts;
  } catch (err) {
    console.error(`Failed to parse PDF at ${localPath}:`, err.message);
    return null;
  }
}

async function runIndexer() {
  console.log('HEMS Full-Text Indexer starting up...');

  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    const mockDbPath = path.join(__dirname, '..', 'public', 'mock-pdf-chunks.json');
    if (fs.existsSync(mockDbPath)) {
      console.log('CI/CD environment detected. Preserving checked-in mock-pdf-chunks.json and skipping PDF re-indexing.');
      return;
    }
  }

  const indexJsonPath = path.join(__dirname, '..', 'public', 'archives-index.json');
  if (!fs.existsSync(indexJsonPath)) {
    console.error('Flat proceedings index file not found. Please run scripts/generate-archives-index.js first!');
    process.exit(1);
  }

  const papers = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'));
  console.log(`Loaded ${papers.length} catalog papers for deep content parsing.`);

  const records = [];
  let realSlidePages = 0;
  let realAbstractDocs = 0;
  let bibliographicFallbacks = 0;

  for (let pIdx = 0; pIdx < papers.length; pIdx++) {
    const paper = papers[pIdx];
    const paperId = `${paper.workshop_year}_${paper.workshop_ordinal}_${pIdx}`;

    const localPresentationPath = getLocalFilePath(
      paper.presentation_url,
      paper.workshop_year,
      'presentations',
      paper.workshop_ordinal,
      paper.presentation_file
    );
    const localAbstractPath = getLocalFilePath(
      paper.abstract_url,
      paper.workshop_year,
      'abstracts',
      paper.workshop_ordinal,
      paper.abstract_file
    );

    const presCacheKey = `${paper.workshop_year}_${paper.workshop_ordinal}_pres_${pIdx}`;
    const absCacheKey = `${paper.workshop_year}_${paper.workshop_ordinal}_abs_${pIdx}`;

    const presentationPages =
      paper.presentation_url || paper.presentation_file
        ? await getOrExtractPdfText(localPresentationPath, presCacheKey)
        : null;
    const abstractPages =
      paper.abstract_url || paper.abstract_file
        ? await getOrExtractPdfText(localAbstractPath, absCacheKey)
        : null;

    const sharedFields = {
      id: paper.id || '',
      canonical_url: paper.canonical_url || `https://www.hems-workshop.org/archive/${paper.workshop_year}/`,
      title: paper.title,
      authors: paper.authors,
      author_details: paper.author_details || [],
      institutions: paper.institutions,
      workshop_year: paper.workshop_year,
      workshop_ordinal: paper.workshop_ordinal,
      session_title: paper.session_title,
      type: paper.type,
      presentation_url: paper.presentation_url,
      abstract_url: paper.abstract_url,
      citation: paper.citation || '',
    };

    let emittedAnyRealContent = false;

    if (presentationPages && presentationPages.length > 0) {
      presentationPages.forEach((p) => {
        const trimmed = (p.text || '').trim();
        if (!trimmed) return;
        emittedAnyRealContent = true;
        realSlidePages++;
        records.push({
          objectID: `${paperId}_slide_${p.page}`,
          ...sharedFields,
          slide_number: p.page,
          content_type: 'slide_text',
          text_content: trimmed,
        });
      });
    }

    if (abstractPages && abstractPages.length > 0) {
      const combinedAbstractText = abstractPages
        .map((p) => p.text)
        .join('\n\n')
        .trim();
      if (combinedAbstractText) {
        emittedAnyRealContent = true;
        realAbstractDocs++;
        records.push({
          objectID: `${paperId}_abstract_1`,
          ...sharedFields,
          slide_number: 1,
          content_type: 'abstract_text',
          text_content: combinedAbstractText,
        });
      }
    }

    // Truthful bibliographic record ONLY when neither slide text nor abstract text exists
    if (!emittedAnyRealContent) {
      bibliographicFallbacks++;
      const ordinalLabel = paper.workshop_ordinal_label || formatOrdinalDirName(paper.workshop_ordinal);
      const authorsLabel =
        Array.isArray(paper.authors) && paper.authors.length > 0
          ? paper.authors.join(', ')
          : 'HEMS Workshop Contributors';
      const instLabel =
        Array.isArray(paper.institutions) && paper.institutions.length > 0
          ? ` (${paper.institutions.join('; ')})`
          : '';
      const locLabel = paper.workshop_location ? `, ${paper.workshop_location}` : '';

      records.push({
        objectID: `${paperId}_biblio_1`,
        ...sharedFields,
        slide_number: 1,
        content_type: 'bibliographic_summary',
        text_content: `"${paper.title}" — ${paper.type === 'poster' ? 'Poster presentation' : 'Oral presentation'} by ${authorsLabel}${instLabel} in ${paper.session_title} at the ${ordinalLabel} Workshop on Harsh-Environment Mass Spectrometry (${paper.workshop_year}${locLabel}).`,
      });
    }
  }

  console.log(
    `Generated ${records.length} searchable archive chunks (${realSlidePages} extracted slide pages, ${realAbstractDocs} extracted abstracts, ${bibliographicFallbacks} truthful bibliographic records).`
  );

  if (algoliasearch && APP_ID && ADMIN_KEY) {
    try {
      console.log(`Initializing Algolia index client for index: ${INDEX_NAME}...`);
      const client = algoliasearch(APP_ID, ADMIN_KEY);
      const response = await client.saveObjects({
        indexName: INDEX_NAME,
        objects: records,
      });
      console.log('Algolia indexing completed successfully!', response);
    } catch (e) {
      console.error('Algolia API Upload failed:', e.message);
    }
  } else {
    const mockDbPath = path.join(__dirname, '..', 'public', 'mock-pdf-chunks.json');
    if (realSlidePages === 0 && realAbstractDocs === 0 && fs.existsSync(mockDbPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        if (Array.isArray(existing) && existing.length > records.length) {
          console.log(
            `ℹ️ Skipping overwrite: preserving ${existing.length} committed PDF chunks in ${mockDbPath} (no local proceedings PDFs present in this build environment).`
          );
          return;
        }
      } catch {
        // Fall through and regenerate if existing JSON is unreadable
      }
    }
    fs.writeFileSync(mockDbPath, JSON.stringify(records, null, 2));
    console.log(`Written verified searchable chunks to ${mockDbPath}`);
  }
}

runIndexer();
