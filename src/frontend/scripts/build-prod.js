const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const nextPath = '.next';

// Helper to automatically find and terminate a running Next.js dev server on Windows to clear file locks
function killDevServerOnPort(port = 3000) {
  if (process.platform !== 'win32') return;
  try {
    const netstatOut = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { encoding: 'utf8' });
    if (netstatOut) {
      const lines = netstatOut.trim().split('\n');
      for (const line of lines) {
        if (line.includes(`:${port}`)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            console.log(`📡 Detected running development server on port ${port} (PID: ${pid}).`);
            console.log(`📡 Terminating process ${pid} to release Windows directory locks...`);
            execSync(`taskkill /F /PID ${pid}`);
            const start = Date.now();
            while (Date.now() - start < 500) {}
            console.log(`✅ Process terminated and port ${port} is clear.\n`);
            return;
          }
        }
      }
    }
  } catch (err) {
    // Port not in use, which is expected
  }
}

// Pre-terminate active dev server on port 3000 to clear persistent directory locks
killDevServerOnPort(3000);

// Validate archive catalogs with Zod runtime schemas
try {
  execSync('node scripts/validate-archives.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Catalog validation failed. Aborting build.');
  process.exit(1);
}

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

// Execute clean static production build
try {
  if (fs.existsSync(nextPath)) {
    fs.rmSync(nextPath, { recursive: true, force: true });
  }
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Public website production build succeeded.');
} catch (e) {
  console.error('Next build failed.');
  process.exit(1);
}
