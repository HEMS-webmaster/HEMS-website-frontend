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

const WorkshopArchiveSchema = z.object({
  year: z.union([z.number(), z.string()]),
  ordinal: z.string(),
  title: z.string().optional(),
  tagline: z.string().optional(),
  dates: z.string().optional(),
  resources: z.array(z.any()).default([]),
  host_corporation: z.any().optional(),
  sponsors: z.array(z.any()).default([]),
  student_awards: z.array(z.any()).default([]),
  posters: z.array(PosterSchema).default([]),
  sessions: z.array(SessionSchema).default([]),
});

function validateAllArchives() {
  const archivesDir = path.resolve(__dirname, '..', 'src', 'data', 'archives');
  if (!fs.existsSync(archivesDir)) {
    console.warn('⚠️ Archives directory not found:', archivesDir);
    return true;
  }

  const files = fs.readdirSync(archivesDir).filter(f => f.endsWith('.json') && f !== 'template.json');
  console.log(`🔍 Validating ${files.length} workshop archive catalogs with Zod schemas...`);

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
    } catch (e) {
      console.error(`❌ JSON syntax error in ${file}:`, e.message);
      errorCount++;
    }
  }

  if (errorCount === 0) {
    console.log(`✅ All ${files.length} workshop archive catalogs passed Zod schema validation.\n`);
    return true;
  } else {
    console.error(`\n❌ ZOD VALIDATION FAILED: ${errorCount} catalogs contain schema errors.\n`);
    process.exit(1);
  }
}

validateAllArchives();
