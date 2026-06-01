const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting HEMS Push-to-Live Production Deploy...\n');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const frontendDir = path.resolve(__dirname, '..');

// 1. Google Cloud Storage Sync
try {
  console.log('📦 Syncing assets to Google Cloud Storage bucket...');
  const proceedingsPath = path.resolve(repoRoot, 'docs', 'archives_translation', 'proceedings');
  const gcloudCmd = `gsutil -m rsync -r "${proceedingsPath}" gs://hems-workshop-archives/proceedings`;
  execSync(gcloudCmd, { cwd: repoRoot, stdio: 'inherit' });
  console.log('✅ GCS Asset sync complete.\n');
} catch (e) {
  console.error('❌ GCS Asset sync failed:', e.message);
  process.exit(1);
}

// Deduce changed files for commit message
let commitMsg = 'feat(data): workshop manager content update';
try {
  const statusOut = execSync('git status -s', { cwd: repoRoot, encoding: 'utf8' });
  if (statusOut) {
    const lines = statusOut.trim().split('\n');
    const files = lines.map(line => line.substring(3).trim()).filter(f => f.length > 0);
    const fileNames = files.map(f => path.basename(f));
    const uniqueNames = Array.from(new Set(fileNames));
    if (uniqueNames.length > 0) {
      commitMsg = `feat(data): workshop manager update (modified: ${uniqueNames.slice(0, 5).join(', ')}${uniqueNames.length > 5 ? ' and more' : ''})`;
    }
  }
} catch (err) {}

// 2. Version Control (Git Sync)
try {
  console.log('💾 Committing and pushing database changes to Git...');
  execSync('git add .', { cwd: repoRoot, stdio: 'inherit' });
  
  // Safely commit
  try {
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: repoRoot, stdio: 'inherit' });
  } catch (cErr) {
    // Suppress if nothing to commit
  }
  
  console.log('🔄 Pulling latest changes from main branch...');
  execSync('git pull --rebase origin main', { cwd: repoRoot, stdio: 'inherit' });
  
  console.log('📤 Pushing commits to GitHub...');
  execSync('git push origin main', { cwd: repoRoot, stdio: 'inherit' });
  console.log('✅ Git sync complete.\n');
} catch (e) {
  console.error('❌ Git sync failed:', e.message);
  process.exit(1);
}

// 3. Build Production Bundle
try {
  console.log('🏗️  Building Next.js static production export...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log('✅ Production build successful.\n');
} catch (e) {
  console.error('❌ Production build failed:', e.message);
  process.exit(1);
}

// 4. Deploy to Firebase Hosting
try {
  console.log('🔥 Deploying static export to Firebase Hosting...');
  execSync('npx firebase deploy --only hosting', { cwd: repoRoot, stdio: 'inherit' });
  console.log('\n🎉 SUCCESS! HEMS website has been pushed to live and is globally accessible!');
} catch (e) {
  console.error('❌ Firebase deploy failed:', e.message);
  process.exit(1);
}
