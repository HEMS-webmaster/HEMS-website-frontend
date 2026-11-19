const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// Schema definitions in CommonJS for pre-build CLI validation
const AuthorSchema = z.object({
  name: z.string(),
  isPresenter: z.boolean().optional(),
  institute: z.string().nullable().optional(),
});

const PresentationSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  authors: z.array(z.union([z.string(), AuthorSchema])).default([]),
  type: z.string().optional(),
  session: z.string().optional(),
  time: z.string().optional(),
  files: z.record(z.string()).optional(),
  award: z.string().optional(),
  isKeynote: z.boolean().optional(),
});

const PosterSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  authors: z.array(z.union([z.string(), AuthorSchema])).default([]),
  files: z.record(z.string()).optional(),
  abstract: z.string().optional(),
  session: z.string().optional(),
});

const SessionSchema = z.object({
  title: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
  chair: z.string().optional(),
  presentations: z.array(PresentationSchema).default([]),
});

const HostCorporationSchema = z.object({
  name: z.string(),
  url: z
    .string()
    .refine((v) => v === '' || /^https?:\/\//i.test(v), {
      message: 'Host URL must be empty or begin with http:// or https://',
    })
    .optional(),
  logo_file: z.string().optional(),
  logo_file_url: z.string().optional(),
  host_category: z.enum(['corporate', 'academic']).optional(),
  kicker_label: z.string().optional(),
  patronage_summary: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  historical_note: z.string().optional(),
  cta_label: z.string().optional(),
});

const WorkshopArchiveSchema = z.object({
  year: z.union([z.number(), z.string()]),
  ordinal: z.string(),
  title: z.string().optional(),
  tagline: z.string().optional(),
  dates: z.string().optional(),
  resources: z.array(z.any()).default([]),
  host_corporation: HostCorporationSchema.optional(),
  sponsors: z.array(z.any()).default([]),
  student_awards: z.array(z.any()).default([]),
  posters: z.array(PosterSchema).default([]),
  sessions: z.array(SessionSchema).default([]),
});

const MOJIBAKE_RE =
  /(?:\u00C3[\u0080-\u00BF\u0152-\u017E\u2018-\u2026\u20AC]|\u00C2[\u0080-\u00BF]|\u00CE[\u0091-\u00BF]|\u00E2\u20AC[\u0098-\u00BF\u2013-\u203A\u2122]|\uFFFD|[\uF0B7\uF0A7\uF076\uF0D8\uF0A8])/;

function checkFileForMojibake(filePath, displayName) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (MOJIBAKE_RE.test(lines[i])) {
      hits.push(`line ${i + 1}: ${lines[i].trim().slice(0, 110)}`);
    }
  }
  if (hits.length > 0) {
    console.error(`❌ Character encoding / mojibake detected in ${displayName}:`);
    hits.slice(0, 5).forEach((h) => console.error(`   • ${h}`));
    return hits.length;
  }
  return 0;
}

function validateAllArchives() {
  const dataDir = path.resolve(__dirname, '..', 'src', 'data');
  const archivesDir = path.join(dataDir, 'archives');
  if (!fs.existsSync(archivesDir)) {
    console.warn('⚠️ Archives directory not found:', archivesDir);
    return true;
  }

  const files = fs.readdirSync(archivesDir).filter(f => f.endsWith('.json') && f !== 'template.json');
  console.log(`🔍 Validating ${files.length} workshop archive catalogs with Zod schemas & UTF-8 mojibake checks...`);

  let errorCount = 0;
  for (const file of files) {
    const filePath = path.join(archivesDir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw);
      const result = WorkshopArchiveSchema.safeParse(parsed);
      if (!result.success) {
        console.error(`❌ Validation failed for ${file}:`);
        result.error.errors.slice(0, 3).forEach(err => {
          console.error(`   • ${err.path.join('.')}: ${err.message}`);
        });
        errorCount++;
      }
      if (checkFileForMojibake(filePath, `archives/${file}`) > 0) {
        errorCount++;
      }
    } catch (e) {
      console.error(`❌ JSON syntax error in ${file}:`, e.message);
      errorCount++;
    }
  }

  for (const extraFile of ['master_workshops.json', 'corporate_registry.json']) {
    const extraPath = path.join(dataDir, extraFile);
    if (fs.existsSync(extraPath)) {
      try {
        JSON.parse(fs.readFileSync(extraPath, 'utf8').replace(/^\uFEFF/, ''));
        if (checkFileForMojibake(extraPath, extraFile) > 0) {
          errorCount++;
        }
      } catch (e) {
        console.error(`❌ JSON syntax error in ${extraFile}:`, e.message);
        errorCount++;
      }
    }
  }

  if (errorCount === 0) {
    console.log(`✅ All ${files.length} workshop archive catalogs + master catalogs passed Zod & UTF-8 mojibake validation.\n`);
    return true;
  } else {
    console.error(`\n❌ VALIDATION FAILED: ${errorCount} catalog file(s) contain schema or encoding errors.\n`);
    process.exit(1);
  }
}

validateAllArchives();
