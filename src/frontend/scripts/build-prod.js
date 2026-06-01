const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiManagerPath = path.join('src', 'app', 'api', 'manager');
const apiTempManagerPath = path.join('src', 'app', 'api', '_manager');
const managerPath = path.join('src', 'app', 'manager');
const tempManagerPath = path.join('src', 'app', '_manager');
const nextPath = '.next';

// Generate flat proceedings index for AI search engine visibility and crawler indexing
try {
  console.log('Pre-compiling HEMS proceedings index database...');
  execSync('node scripts/generate-archives-index.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to generate proceedings search database:', e.message);
}

// Compile dynamic page-level PDF slide/abstract index chunks for deep full-text queries
try {
  console.log('Compiling page-level HEMS PDF contents database...');
  execSync('node scripts/index-pdf-contents.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to compile HEMS PDF contents database:', e.message);
}

try {
  if (fs.existsSync(apiManagerPath)) {
    fs.renameSync(apiManagerPath, apiTempManagerPath);
  }
  if (fs.existsSync(managerPath)) {
    fs.renameSync(managerPath, tempManagerPath);
  }
  console.log('Manager routes temporarily excluded from production build.');
} catch (e) {
  console.error('\n❌ CRITICAL BUILD ERROR: Failed to temporarily exclude manager routes.');
  console.error('Error Details:', e.message);
  console.error('\n👉 This is usually caused by Windows file locks.');
  console.error('👉 Please make sure to STOP your running development server (npm run dev) before building!\n');
  process.exit(1);
}

try {
  if (fs.existsSync(nextPath)) {
    fs.rmSync(nextPath, { recursive: true, force: true });
  }
  execSync('npx next build', { stdio: 'inherit' });
} catch (e) {
  console.error('Next build failed.');
  process.exitCode = 1;
} finally {
  try {
    if (fs.existsSync(apiTempManagerPath)) {
      fs.renameSync(apiTempManagerPath, apiManagerPath);
    }
    if (fs.existsSync(tempManagerPath)) {
      fs.renameSync(tempManagerPath, managerPath);
    }
    console.log('Manager routes restored.');
  } catch (e) {
    console.error('Failed to restore manager routes:', e.message);
  }
}
