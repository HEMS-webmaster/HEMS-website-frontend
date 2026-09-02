const fs = require('fs');
const path = require('path');
const https = require('https');

const GCS_BASE = 'https://storage.googleapis.com/hems-workshop-archives';

function checkUrlStatus(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = https.request(parsedUrl, { method: 'HEAD', timeout: 6000 }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(500));
      req.on('timeout', () => {
        req.destroy();
        resolve(408);
      });
      req.end();
    } catch {
      resolve(400);
    }
  });
}

async function auditProceedingsAssets() {
  console.log('🔍 Starting HEMS Proceedings Asset Link Auditor...\n');

  const repoRoot = path.resolve(__dirname, '..');
  const archivesDir = path.join(repoRoot, 'src', 'frontend', 'src', 'data', 'archives');
  const localDataDir = path.join(repoRoot, 'local_data', 'proceedings');

  if (!fs.existsSync(archivesDir)) {
    console.error('❌ Archives directory not found:', archivesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(archivesDir).filter(f => f.endsWith('.json') && f !== 'template.json');
  console.log(`📁 Scanning ${files.length} workshop archive catalogs...`);

  let totalLinks = 0;
  let localFound = 0;
  let localMissing = 0;
  const missingList = [];

  function verifyPath(rawUrl, context, year) {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    if (!rawUrl.includes('/proceedings/') && !rawUrl.includes('hems-workshop-archives') && !rawUrl.includes('/api/manager/serve?file=')) return;

    totalLinks++;
    let rel = rawUrl.replace(/\\/g, '/');
    if (rel.includes('/proceedings/')) {
      rel = rel.substring(rel.indexOf('/proceedings/') + 13);
    } else if (rel.includes('hems-workshop-archives/proceedings/')) {
      rel = rel.substring(rel.indexOf('hems-workshop-archives/proceedings/') + 35);
    } else if (rel.includes('/api/manager/serve?file=')) {
      rel = rel.substring(rel.indexOf('/api/manager/serve?file=') + 24);
    }

    if (rel.includes('?')) rel = rel.split('?')[0];

    // Decode URI components in case filenames have %20
    try {
      rel = decodeURIComponent(rel);
    } catch {}

    const localDiskPath = path.join(localDataDir, rel);
    if (fs.existsSync(localDiskPath)) {
      localFound++;
    } else {
      localMissing++;
      if (missingList.length < 10) {
        missingList.push({ year, context, rel });
      }
    }
  }

  function checkObject(obj, year, context) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check known file URL properties
    ['url', 'public_url', 'public_website_url', 'public_abstract_url', 'local_target_path', 'local_abstract_target_path', 'file', 'file_url'].forEach(prop => {
      if (obj[prop]) verifyPath(obj[prop], `${context} (${prop})`, year);
    });

    if (obj.files && typeof obj.files === 'object') {
      Object.entries(obj.files).forEach(([type, u]) => {
        verifyPath(u, `${context} (files.${type})`, year);
      });
    }

    // Recursively check children
    if (Array.isArray(obj.items)) obj.items.forEach(item => checkObject(item, year, context));
    if (Array.isArray(obj.talks)) obj.talks.forEach(talk => checkObject(talk, year, `Talk: ${talk.title?.substring(0, 20)}`));
    if (Array.isArray(obj.posters)) obj.posters.forEach(poster => checkObject(poster, year, `Poster: ${poster.title?.substring(0, 20)}`));
  }

  for (const file of files) {
    const filePath = path.join(archivesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    const year = data.year;

    // 1. Resources
    if (Array.isArray(data.resources)) {
      data.resources.forEach(r => checkObject(r, year, `Resource: ${r.title}`));
    }

    // 2. Schedule
    if (Array.isArray(data.schedule)) {
      data.schedule.forEach(day => checkObject(day, year, `Day: ${day.title}`));
    }

    // 3. Student Awards
    if (Array.isArray(data.student_awards)) {
      data.student_awards.forEach(s => checkObject(s, year, `Student Award: ${s.name}`));
    }
  }

  console.log('\n📊 Asset Audit Results:');
  console.log('────────────────────────────────────────');
  console.log(`Total Proceedings Links:          ${totalLinks}`);
  console.log(`Local Disks Matched:              ${localFound} (${Math.round((localFound / (totalLinks || 1)) * 100)}%)`);
  console.log(`Missing from Local Proceedings:   ${localMissing}`);

  if (missingList.length > 0) {
    console.log('\n⚠️ Missing Files Sample:');
    missingList.forEach(m => {
      console.log(`  • [${m.year}] ${m.context} -> ${m.rel}`);
    });
  } else {
    console.log('\n✅ 100% of catalog proceeding links match verified disk assets!');
  }

  // Sample probe 5 live GCS URLs to verify live HTTP reachability
  console.log('\n🌐 Probing live GCS endpoint availability...');
  const sampleUrls = [
    `${GCS_BASE}/proceedings/13th/Administrative/13th_Program.pdf`,
    `${GCS_BASE}/proceedings/14th/Administrative/14th_Program.pdf`,
    `${GCS_BASE}/proceedings/15th/Administrative/15th_Program.pdf`,
    `${GCS_BASE}/proceedings/1st/Administrative/1st_Program.pdf`,
    `${GCS_BASE}/proceedings/8th/Administrative/8th_Program.pdf`
  ];

  for (const url of sampleUrls) {
    const code = await checkUrlStatus(url);
    const statusIcon = code === 200 ? '✅ 200 OK' : `⚠️ HTTP ${code}`;
    const name = path.basename(url);
    console.log(`  • ${statusIcon} -> ${name}`);
  }

  console.log('\n✅ Asset Link Integrity Audit Complete.\n');
}

auditProceedingsAssets();
