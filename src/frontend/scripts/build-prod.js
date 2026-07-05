const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiManagerPath = path.join('src', 'app', 'api', 'manager');
const apiTempManagerPath = path.join('src', 'app', 'api', '_manager');
const managerPath = path.join('src', 'app', 'manager');
const tempManagerPath = path.join('src', 'app', '_manager');
const nextPath = '.next';

// Helper to recursively find and rename files to bypass Windows directory watch locks
function toggleManagerFiles(dir, disable = true) {
  const targetDir = path.join(__dirname, '..', dir);
  if (!fs.existsSync(targetDir)) return;

  function scan(currentPath) {
    const list = fs.readdirSync(currentPath);
    for (const item of list) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else {
        const name = item.toLowerCase();
        if (disable) {
          // Disable page.tsx/page.ts/route.ts/route.tsx
          if (name === 'page.tsx' || name === 'page.ts' || name === 'route.ts' || name === 'route.tsx') {
            const newPath = fullPath + '.disabled';
            fs.renameSync(fullPath, newPath);
          }
        } else {
          // Restore page.tsx.disabled/page.ts.disabled/route.ts.disabled/route.tsx.disabled
          if (name.endsWith('.disabled')) {
            const originalPath = fullPath.substring(0, fullPath.length - 9);
            fs.renameSync(fullPath, originalPath);
          }
        }
      }
    }
  }

  scan(targetDir);
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
  toggleManagerFiles(apiManagerPath, true);
  toggleManagerFiles(managerPath, true);
  console.log('Manager routes temporarily excluded from production build.');
} catch (e) {
  console.error('\n❌ CRITICAL BUILD ERROR: Failed to temporarily exclude manager routes.');
  console.error('Error Details:', e.message);
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
    toggleManagerFiles(apiManagerPath, false);
    toggleManagerFiles(managerPath, false);
    console.log('Manager routes restored.');
  } catch (e) {
    console.error('Failed to restore manager routes:', e.message);
  }
}
