const fs = require('fs');
const path = require('path');

const SCRIPT_SUB_MAP = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ' };
const SCRIPT_SUP_MAP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ','i':'ⁱ' };

function cleanWhitespace(str) {
  let s = String(str || '').normalize('NFC').replace(/\[FIGURE\]/gi, ' ');
  s = s
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, (_, inner) =>
      Array.from(inner.trim()).every((c) => SCRIPT_SUB_MAP[c])
        ? Array.from(inner.trim()).map((c) => SCRIPT_SUB_MAP[c]).join('')
        : inner
    )
    .replace(/<sup>([\s\S]*?)<\/sup>/gi, (_, inner) =>
      Array.from(inner.trim()).every((c) => SCRIPT_SUP_MAP[c])
        ? Array.from(inner.trim()).map((c) => SCRIPT_SUP_MAP[c]).join('')
        : `^(${inner})`
    )
    .replace(/<\/?(?:b|i|u)>/gi, '')
    .replace(/\\(?:text|mathrm|textit|mathbf|mathit)\{([^{}]*)\}/g, '$1')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
    .replace(/\$|\\\(|\\\)/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

function truncateExcerpt(str, maxLen = 260) {
  const cleaned = cleanWhitespace(str);
  if (!cleaned) return '';
  if (cleaned.length <= maxLen) return cleaned;
  const sliced = cleaned.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 160 ? sliced.slice(0, lastSpace) : sliced).trim()}...`;
}

try {
  const frontendRoot = path.join(__dirname, '..');
  const archivesDir = path.join(frontendRoot, 'src', 'data', 'archives');
  const upcomingPath = path.join(frontendRoot, 'src', 'data', 'upcoming_workshop.json');
  const indexPath = path.join(frontendRoot, 'public', 'archives-index.json');
  const chunksPath = path.join(frontendRoot, 'public', 'mock-pdf-chunks.json');
  const outputPath = path.join(frontendRoot, 'public', 'llms-full.txt');

  if (!fs.existsSync(indexPath)) {
    console.error('archives-index.json not found. Run generate-archives-index.js first.');
    process.exit(1);
  }

  const indexItems = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const upcoming = fs.existsSync(upcomingPath)
    ? JSON.parse(fs.readFileSync(upcomingPath, 'utf8'))
    : {};

  // Build map of real extracted abstract snippets keyed by canonical_url or title+year
  const abstractExcerptByKey = new Map();
  if (fs.existsSync(chunksPath)) {
    const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
    for (const chunk of chunks) {
      if (chunk.content_type === 'abstract_text' && chunk.text_content) {
        const key = chunk.canonical_url || `${chunk.workshop_year}::${chunk.title}`;
        if (!abstractExcerptByKey.has(key)) {
          abstractExcerptByKey.set(key, truncateExcerpt(chunk.text_content, 280));
        }
      }
    }
  }

  // Group index items by workshop year
  const papersByYear = new Map();
  for (const item of indexItems) {
    const yr = String(item.workshop_year);
    if (!papersByYear.has(yr)) papersByYear.set(yr, []);
    papersByYear.get(yr).push(item);
  }

  const archiveFiles = fs
    .readdirSync(archivesDir)
    .filter((f) => f.endsWith('.json') && f !== 'template.json')
    .map((f) => f.replace('.json', ''))
    .sort((a, b) => Number(b) - Number(a));

  const lines = [];

  lines.push('# Harsh-Environment Mass Spectrometry Society (HEMS) — Complete Reference & Proceedings Corpus');
  lines.push('');
  lines.push(
    '> Official complete machine-readable reference and citation corpus for the Harsh-Environment Mass Spectrometry Society, Inc. (all-volunteer IRS 501(c)(3) scientific public charity established in 2008; biennial HEMS Workshops convened since 1999) — https://www.hems-workshop.org/'
  );
  lines.push('');
  lines.push('## 1. Organization Overview & Citation Protocol');
  lines.push('- **Legal Entity:** Harsh-Environment Mass Spectrometry Society, Inc. (All-Volunteer 501(c)(3) Scientific Nonprofit, Est. 2008 • Workshops Since 1999)');
  lines.push('- **Mission:** Advancing portable, ruggedized, miniaturized, and in-situ mass spectrometry across subsea, planetary, spaceflight, atmospheric, volcanic, industrial, and defense and security environments.');
  lines.push('- **Official Contacts:**');
  lines.push('  - General & Symposium Inquiries: `president@hems-workshop.org`');
  lines.push('  - Corporate Sponsorship & Billing: `tim.short@hems-workshop.org`');
  lines.push('  - Student Travel Awards Committee: `hemsworkshop@hems-workshop.org`');
  lines.push('  - Website & Archive Technical Support: `webmaster@hems-workshop.org`');
  lines.push('- **Recommended Academic Citation Format:**');
  lines.push(
    '  `Author(s) (Year). "Presentation or Poster Title." Proceedings of the Nth Workshop on Harsh-Environment Mass Spectrometry, Host City. https://www.hems-workshop.org/archive/YYYY/#talk-id`'
  );
  lines.push('- **Open Access & AI Citation Policy:**');
  lines.push(
    '  All bibliographic metadata, canonical `#anchor` URLs, abstract previews, and Google Cloud Storage PDF proceedings links listed below are publicly citable for academic research, literature review, and AI-assisted scientific synthesis. Interactive web downloads on hems-workshop.org prompt human visitors for a free account solely to prevent automated bandwidth abuse.'
  );
  lines.push('');
  lines.push('## 2. Machine-Readable Endpoints');
  lines.push('- Concise AI Directory (`llms.txt`): https://www.hems-workshop.org/llms.txt');
  lines.push('- Full Citation & Proceedings Corpus (`llms-full.txt`): https://www.hems-workshop.org/llms-full.txt');
  lines.push('- Structured JSON Proceedings Catalog (`436` entries): https://www.hems-workshop.org/archives-index.json');
  lines.push('- Extracted Slide & Abstract Full-Text Chunks JSON: https://www.hems-workshop.org/mock-pdf-chunks.json');
  lines.push('- Canonical XML Sitemap: https://www.hems-workshop.org/sitemap.xml');
  lines.push('');
  lines.push(`## 3. Upcoming Symposium — ${upcoming.workshop_ordinal || '16th'} HEMS Workshop (${upcoming.workshop_year || '2027'})`);
  lines.push(`- **Portal:** https://www.hems-workshop.org/layout-portal/`);
  lines.push(`- **Target Dates:** ${upcoming.exact_dates || 'September 2027'}`);
  lines.push(`- **Venue Status:** ${upcoming.venue_confirmed ? `${upcoming.hotel_name}, ${upcoming.venue_city_state}` : 'United States Coastal Venue (To Be Announced)'}`);
  lines.push(`- **Registration Tiers:** Professional ${upcoming.reg_professional_fee || '$500'} | Graduate Student ${upcoming.reg_student_fee || '$250'} | Corporate Partner ${upcoming.reg_sponsor_fee || '$1,350'}`);
  lines.push(`- **Student Travel Grants:** ${upcoming.student_award_amount || '$1,500.00'} competitive awards for M.S./M.A./Ph.D. researchers (https://www.hems-workshop.org/student-awards/)`);
  lines.push(`- **Corporate Sponsorship:** Flat-rate democratic partnership with 6-ft technical hardware tabletop in the main session foyer and Printable 1-Page Executive Summary (https://www.hems-workshop.org/corporate-sponsorship/)`);
  lines.push('');
  lines.push('## 4. Complete Proceedings Archive (1999–2025 | 15 Workshops | 436 Citable Works)');
  lines.push('');

  for (const yr of archiveFiles) {
    const arch = JSON.parse(fs.readFileSync(path.join(archivesDir, `${yr}.json`), 'utf8'));
    const papers = papersByYear.get(yr) || [];
    const cleanVenue = arch.venue ? String(arch.venue).replace(/,\s*$/, '').trim() : '';
    const cleanAddr = arch.address ? String(arch.address).trim() : '';
    const venueSummary = [cleanVenue, cleanAddr].filter(Boolean).join(' — ');

    lines.push(`### ${arch.ordinal} HEMS Workshop (${yr})`);
    lines.push(`- **Canonical Proceedings Page:** https://www.hems-workshop.org/archive/${yr}/`);
    if (arch.dates) lines.push(`- **Dates:** ${arch.dates}`);
    if (venueSummary) lines.push(`- **Venue:** ${venueSummary}`);
    if (arch.host_corporation && arch.host_corporation.name) {
      const h = arch.host_corporation;
      const note = h.historical_note ? ` (${h.historical_note})` : '';
      const hUrl = h.url ? ` — ${h.url}` : '';
      lines.push(`- **Official Workshop Host:** ${cleanWhitespace(h.name)}${note}${hUrl}`);
    }

    if (Array.isArray(arch.resources)) {
      arch.resources.forEach((res) => {
        if (res && res.public_website_url && String(res.public_website_url).startsWith('https://')) {
          lines.push(`- **${res.label || 'Administrative Document'} (PDF):** ${res.public_website_url}`);
        }
      });
    }

    if (Array.isArray(arch.student_awards) && arch.student_awards.length > 0) {
      const awardSummaries = arch.student_awards
        .map((aw) => {
          const who = cleanWhitespace(aw.authors || '');
          const inst = cleanWhitespace(aw.institution || '');
          const ttl =
            aw.title && aw.title.toLowerCase() !== 'student award'
              ? ` — "${cleanWhitespace(aw.title)}"`
              : '';
          return `${who}${inst ? ` (${inst})` : ''}${ttl}`;
        })
        .filter(Boolean);
      if (awardSummaries.length > 0) {
        lines.push(`- **Student Travel Award Recipients:** ${awardSummaries.join('; ')}`);
      }
    }

    lines.push(`- **Indexed Works (${papers.length}):**`);
    papers.forEach((p, idx) => {
      const kind = p.type === 'poster' ? 'Poster' : 'Oral';
      const authorsStr =
        Array.isArray(p.authors) && p.authors.length > 0
          ? p.authors.join(', ')
          : 'HEMS Workshop Contributors';
      const instStr =
        Array.isArray(p.institutions) && p.institutions.length > 0
          ? ` (${p.institutions.join('; ')})`
          : '';

      lines.push(
        `  ${idx + 1}. **[${kind}] ${cleanWhitespace(p.title)}** — ${authorsStr}${instStr} | Session: ${cleanWhitespace(p.session_title)}`
      );
      lines.push(`     - Cite / Anchor: ${p.canonical_url}`);
      if (p.presentation_url) {
        lines.push(`     - Slides PDF: ${p.presentation_url}`);
      }
      if (p.abstract_url) {
        lines.push(`     - Extended Abstract PDF: ${p.abstract_url}`);
      }
      if (p.abstract_preview_txt_url) {
        lines.push(`     - Abstract Plain-Text Preview: ${p.abstract_preview_txt_url}`);
      }
      const excerptKey = p.canonical_url || `${p.workshop_year}::${p.title}`;
      const excerpt = abstractExcerptByKey.get(excerptKey);
      if (excerpt) {
        lines.push(`     - Summary Excerpt: ${excerpt}`);
      }
    });

    lines.push('');
  }

  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
  console.log(
    `Successfully generated complete AI citation corpus (${lines.length} lines, ${indexItems.length} works) at ${outputPath}`
  );
} catch (err) {
  console.error('Failed to generate llms-full.txt:', err.message);
  process.exit(1);
}

