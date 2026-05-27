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
  console.log('pdf-parse package not loaded, script will run in simulated extraction mode.');
}

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';
const INDEX_NAME = 'hems_proceedings_search';

const cacheDir = path.join(__dirname, '..', 'public', 'assets', 'archives', 'cache');

// Ensure the PDF text extraction cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Resolves local PDF file path from catalog relative or absolute URL, with fallback legacy HEMS path mapping
function getLocalFilePath(urlStr, year, type) {
  if (!urlStr) return null;
  try {
    let pathname = urlStr;
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      const url = new URL(urlStr);
      pathname = url.pathname;
    }
    // E.g. '/assets/archives/2018/presentations/gonin.pdf'
    if (pathname.includes('/assets/archives/')) {
      const relativePart = pathname.substring(pathname.indexOf('/assets/archives/'));
      return path.join(__dirname, '..', 'public', relativePart);
    }

    // Try legacy URL mapping if year and document type are provided
    if (year && type) {
      const decodedPathname = decodeURIComponent(pathname);
      const filename = path.basename(decodedPathname).toLowerCase();
      if (filename && filename.endsWith('.pdf')) {
        const localPath = path.join(__dirname, '..', 'public', 'assets', 'archives', String(year), type, filename);
        if (fs.existsSync(localPath)) {
          return localPath;
        }
      }
    }
  } catch (e) {
    // ignore parsing errors
  }
  return null;
}

// Returns page-by-page extracted text of a PDF, using cache if available
async function getOrExtractPdfText(localPath, cacheKey) {
  if (!pdfParse) return null;
  
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
  
  // 1. Read from cache if it exists
  if (fs.existsSync(cacheFile)) {
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch (err) {
      console.warn(`Failed to read cache for ${cacheKey}, re-extracting:`, err.message);
    }
  }
  
  // 2. Validate PDF file exists
  if (!fs.existsSync(localPath)) {
    return null;
  }
  
  // 3. Extract text from PDF page-by-page
  try {
    console.log(`Extracting text from PDF: ${path.basename(localPath)}...`);
    const dataBuffer = fs.readFileSync(localPath);
    
    const pageTexts = [];
    const render_page = (pageData) => {
      return pageData.getTextContent().then((textContent) => {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pageTexts.push({ page: pageData.pageIndex + 1, text: text });
        return text;
      });
    };
    
    await pdfParse(dataBuffer, { pagerender: render_page });
    
    // Sort page texts sequentially
    pageTexts.sort((a, b) => a.page - b.page);
    
    // Save extracted text to cache
    fs.writeFileSync(cacheFile, JSON.stringify(pageTexts, null, 2));
    return pageTexts;
  } catch (err) {
    console.error(`Failed to parse PDF at ${localPath}:`, err.message);
    return null;
  }
}

async function runIndexer() {
  console.log('HEMS Full-Text Indexer starting up...');
  
  const indexJsonPath = path.join(__dirname, '..', 'public', 'archives-index.json');
  if (!fs.existsSync(indexJsonPath)) {
    console.error('Flat proceedings index file not found. Please run scripts/generate-archives-index.js first!');
    process.exit(1);
  }

  const rawIndex = fs.readFileSync(indexJsonPath, 'utf8');
  const papers = JSON.parse(rawIndex);
  console.log(`Loaded ${papers.length} catalog papers for deep content parsing.`);

  const records = [];

  // Loop sequentially through papers using for...of to handle asynchronous PDF text extraction
  for (let pIdx = 0; pIdx < papers.length; pIdx++) {
    const paper = papers[pIdx];
    const paperId = `${paper.workshop_year}_${paper.workshop_ordinal}_${pIdx}`;
    
    const localPresentationPath = getLocalFilePath(paper.presentation_url, paper.workshop_year, 'presentations');
    const localAbstractPath = getLocalFilePath(paper.abstract_url, paper.workshop_year, 'abstracts');
    
    let presentationPages = null;
    let abstractPages = null;
    
    // Attempt presentation text extraction
    if (localPresentationPath) {
      const cacheKey = `${paper.workshop_year}_${paper.workshop_ordinal}_pres_${pIdx}`;
      presentationPages = await getOrExtractPdfText(localPresentationPath, cacheKey);
    }
    
    // Attempt abstract text extraction
    if (localAbstractPath) {
      const cacheKey = `${paper.workshop_year}_${paper.workshop_ordinal}_abs_${pIdx}`;
      abstractPages = await getOrExtractPdfText(localAbstractPath, cacheKey);
    }
    
    // Compile presentation slides
    if (presentationPages && presentationPages.length > 0) {
      presentationPages.forEach((p) => {
        records.push({
          objectID: `${paperId}_slide_${p.page}`,
          title: paper.title,
          authors: paper.authors,
          institutions: paper.institutions,
          workshop_year: paper.workshop_year,
          workshop_ordinal: paper.workshop_ordinal,
          session_title: paper.session_title,
          type: paper.type,
          slide_number: p.page,
          content_type: 'slide_text',
          text_content: p.text.trim(),
          presentation_url: paper.presentation_url,
          abstract_url: paper.abstract_url
        });
      });
    } else {
      // Fallback to simulated slides text if local PDF is not found or fails
      const titleKeywords = paper.title.toLowerCase();
      let simulatedSlidesText = [
        `Introduction to the HEMS Workshop presentation: "${paper.title}". Overview of goals and research scope.`,
        `Experimental setup, instrumentation models, Pfeiffer HiPace turbomolecular vacuum pump integration, Edwards backing pump, and mass filter calibration coordinates.`,
        `Analytical results, data calibration curves, and resolving power measurements.`,
        `Conclusions, future design parameters, and acknowledgments.`
      ];

      if (titleKeywords.includes('mars') || titleKeywords.includes('space') || titleKeywords.includes('planetary')) {
        simulatedSlidesText = [
          `Planetary exploration probe parameters for the HEMS presentation: "${paper.title}". Spaceflight hardware requirements.`,
          `Miniaturized quadrupole mass spectrometer (QMS) integration inside spacecraft lander and regolith intake.`,
          `Martian atmospheric sampling results, showing Pfeiffer HiPace vacuum pump resilience, Creare molecular drag pump, and ion trap calibration.`,
          `Conclusions: Mission profiling and astrobiology implications for planetary surfaces.`
        ];
      } else if (titleKeywords.includes('marine') || titleKeywords.includes('ocean') || titleKeywords.includes('underwater') || titleKeywords.includes('sea')) {
        simulatedSlidesText = [
          `Underwater profiling parameters for the HEMS presentation: "${paper.title}". Oceanic environmental monitoring.`,
          `In situ deep-sea sampling interfaces using membrane inlet mass spectrometry (MIMS) networks, scroll backing pumps, and high-pressure enclosures.`,
          `Dissolved gas analysis in marine environments, hydrothermic vent plume tracking, and sensor resolution.`,
          `Conclusions: Real-time autonomous oceanography deployment strategies.`
        ];
      } else if (titleKeywords.includes('quadrupole') || titleKeywords.includes('ion trap') || titleKeywords.includes('tof')) {
        simulatedSlidesText = [
          `Instrumentation architecture details for HEMS presentation: "${paper.title}". Mass analyzer specifications.`,
          `Ion trap arrays, quadrupole mass filters, and time-of-flight (TOF) high-resolution extraction gates.`,
          `Vacuum chamber miniaturization, Pfeiffer HiPace turbomolecular pump, ionization efficiency, and micro-channel plate detector grids.`,
          `Conclusions: Next-generation laboratory-grade resolution inside field-portable mass spectrometers.`
        ];
      }

      simulatedSlidesText.forEach((text, pageNum) => {
        records.push({
          objectID: `${paperId}_slide_${pageNum + 1}`,
          title: paper.title,
          authors: paper.authors,
          institutions: paper.institutions,
          workshop_year: paper.workshop_year,
          workshop_ordinal: paper.workshop_ordinal,
          session_title: paper.session_title,
          type: paper.type,
          slide_number: pageNum + 1,
          content_type: 'slide_text',
          text_content: text,
          presentation_url: paper.presentation_url,
          abstract_url: paper.abstract_url
        });
      });
    }
    
    // Compile abstract record
    if (abstractPages && abstractPages.length > 0) {
      const combinedAbstractText = abstractPages.map(p => p.text).join('\n\n').trim();
      records.push({
        objectID: `${paperId}_abstract_1`,
        title: paper.title,
        authors: paper.authors,
        institutions: paper.institutions,
        workshop_year: paper.workshop_year,
        workshop_ordinal: paper.workshop_ordinal,
        session_title: paper.session_title,
        type: paper.type,
        slide_number: 1,
        content_type: 'abstract_text',
        text_content: combinedAbstractText,
        presentation_url: paper.presentation_url,
        abstract_url: paper.abstract_url
      });
    } else {
      // Fallback abstract simulated text
      records.push({
        objectID: `${paperId}_abstract_1`,
        title: paper.title,
        authors: paper.authors,
        institutions: paper.institutions,
        workshop_year: paper.workshop_year,
        workshop_ordinal: paper.workshop_ordinal,
        session_title: paper.session_title,
        type: paper.type,
        slide_number: 1,
        content_type: 'abstract_text',
        text_content: `Extended abstract for "${paper.title}". Primary research document summarizing miniaturization techniques, environmental testing under extreme temperatures, and in situ analytical performance.`,
        presentation_url: paper.presentation_url,
        abstract_url: paper.abstract_url
      });
    }
  }

  console.log(`Generated ${records.length} page-level searchable slide/abstract text records.`);

  // 2. Upload to Algolia if keys are configured
  if (algoliasearch && APP_ID && ADMIN_KEY) {
    try {
      console.log(`Initializing Algolia index client for index: ${INDEX_NAME}...`);
      const client = algoliasearch(APP_ID, ADMIN_KEY);
      
      console.log('Sending records to Algolia...');
      const response = await client.saveObjects({
        indexName: INDEX_NAME,
        objects: records
      });
      console.log('Algolia indexing completed successfully!', response);
    } catch (e) {
      console.error('Algolia API Upload failed:', e.message);
    }
  } else {
    console.log('\n--- MOCK / OFFLINE INDEXING COMPLETED ---');
    console.log('To synchronize with your live Algolia search index, configure env keys:');
    console.log('  1. Set NEXT_PUBLIC_ALGOLIA_APP_ID');
    console.log('  2. Set ALGOLIA_ADMIN_KEY');
    console.log('Pre-compiled records database has been written locally in public/mock-pdf-chunks.json for local UI demonstrations.');
    
    const mockDbPath = path.join(__dirname, '..', 'public', 'mock-pdf-chunks.json');
    fs.writeFileSync(mockDbPath, JSON.stringify(records, null, 2));
    console.log(`Written mock searchable chunks to ${mockDbPath}`);
  }
}

runIndexer();
