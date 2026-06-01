const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiManagerPath = path.join('src', 'app', 'api', 'manager');
const apiTempManagerPath = path.join('src', 'app', 'api', '_manager');
const managerPath = path.join('src', 'app', 'manager');
const tempManagerPath = path.join('src', 'app', '_manager');
const nextPath = '.next';

// Helper to rename a file/folder with retry and backoff on Windows
function renameWithRetry(src, dest, retries = 15, delay = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
      return;
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      console.warn(`⚠️  Windows file lock encountered on ${src}. Retrying in ${delay}ms... (${i + 1}/${retries})`);
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait
      }
    }
  }
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
            // Wait 500ms for OS to fully release the handles after process termination
            const start = Date.now();
            while (Date.now() - start < 500) {}
            console.log(`✅ Process terminated and port ${port} is clear.\n`);
            return;
          }
        }
      }
    }
  } catch (err) {
    // Port not in use, which is the expected case
  }
}

// Pre-terminate active dev server to clear persistent directory locks
killDevServerOnPort(3000);
killDevServerOnPort(3001);

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
  renameWithRetry(apiManagerPath, apiTempManagerPath);
  renameWithRetry(managerPath, tempManagerPath);
  console.log('Manager routes temporarily excluded from production build.');
} catch (e) {
  console.error('\n❌ CRITICAL BUILD ERROR: Failed to temporarily exclude manager routes.');
  console.error('Error Details:', e.message);
  console.error('\n👉 This is usually caused by Windows file locks.');
  console.error('👉 Please make sure to STOP your running development server (npm run dev) before building!');
  console.error('👉 Also make sure no active terminals or file explorer windows are open inside `src/app/manager`!\n');
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
    renameWithRetry(apiTempManagerPath, apiManagerPath);
    renameWithRetry(tempManagerPath, managerPath);
    console.log('Manager routes restored.');
  } catch (e) {
    console.error('Failed to restore manager routes:', e.message);
  }
}
