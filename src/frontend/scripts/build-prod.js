const fs = require('fs');
const { execSync } = require('child_process');

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
  if (fs.existsSync('src/app/api/manager')) {
    fs.renameSync('src/app/api/manager', 'src/app/api/_manager');
  }
  if (fs.existsSync('src/app/manager')) {
    fs.renameSync('src/app/manager', 'src/app/_manager');
  }
  console.log('Manager routes temporarily excluded from production build.');
} catch (e) {
  console.error('Failed to rename:', e.message);
}

try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  execSync('npx next build', { stdio: 'inherit' });
} catch (e) {
  console.error('Next build failed.');
  process.exitCode = 1;
} finally {
  try {
    if (fs.existsSync('src/app/api/_manager')) {
      fs.renameSync('src/app/api/_manager', 'src/app/api/manager');
    }
    if (fs.existsSync('src/app/_manager')) {
      fs.renameSync('src/app/_manager', 'src/app/manager');
    }
    console.log('Manager routes restored.');
  } catch (e) {
    console.error('Failed to restore:', e.message);
  }
}
