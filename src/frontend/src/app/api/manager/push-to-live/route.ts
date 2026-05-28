// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const customMessage = data.message?.trim();
    
    // Navigate from src/frontend up to the project root
    const projectRoot = path.join(process.cwd(), '..', '..');

    // 1. GCloud Sync
    const gcloudCmd = 'gsutil -m rsync -r docs/archives_translation/proceedings gs://hems-workshop-archives/proceedings';
    let gcloudLog = '';
    try {
      const { stdout } = await execAsync(gcloudCmd, { cwd: projectRoot });
      gcloudLog = stdout;
    } catch (gcloudErr: any) {
      console.warn('GCloud Sync failed (gsutil may not be installed or authenticated):', gcloudErr.message);
      gcloudLog = 'GCloud Sync failed: ' + gcloudErr.message;
      return NextResponse.json({ success: false, error: gcloudLog }, { status: 500 });
    }

    // 2. Git Status to determine changed files
    let changedFilesStr = '';
    try {
      const { stdout } = await execAsync('git status -s', { cwd: projectRoot });
      if (stdout) {
        // Parse the status output. E.g., ' M src/data/2015.json\n?? new_file.txt'
        const lines = stdout.trim().split('\n');
        const files = lines.map(line => line.substring(3).trim()).filter(f => f.length > 0);
        
        // Just extract the filenames to keep the commit message clean
        const fileNames = files.map(f => path.basename(f));
        // Deduplicate and limit to 5
        const uniqueNames = Array.from(new Set(fileNames));
        
        if (uniqueNames.length > 0) {
           const topFiles = uniqueNames.slice(0, 5).join(', ');
           changedFilesStr = topFiles + (uniqueNames.length > 5 ? ` and ${uniqueNames.length - 5} more` : '');
        }
      }
    } catch (statusErr: any) {
      console.warn('Could not determine git status:', statusErr);
    }

    // 3. Git Add
    await execAsync('git add .', { cwd: projectRoot });
    
    // 4. Git Commit
    let commitMessage = customMessage;
    if (!commitMessage) {
       if (changedFilesStr) {
          commitMessage = `feat(data): workshop manager update (modified: ${changedFilesStr})`;
       } else {
          commitMessage = `feat(data): workshop manager content update`;
       }
    }

    try {
      // Escape quotes in commit message
      const safeMessage = commitMessage.replace(/"/g, '\\"');
      await execAsync(`git commit -m "${safeMessage}"`, { cwd: projectRoot });
    } catch (commitErr: any) {
      const output = (commitErr.stdout || '') + (commitErr.stderr || '') + (commitErr.message || '');
      if (!output.includes('nothing to commit') && 
          !output.includes('working tree clean') && 
          !output.includes('nothing added to commit')) {
        throw commitErr;
      }
    }
    
    // 5. Git Pull (Rebase)
    await execAsync('git pull --rebase origin main', { cwd: projectRoot });

    // 6. Git Push
    await execAsync('git push origin main', { cwd: projectRoot });

    // 7. Build Static Export
    let buildLog = '';
    try {
      const frontendDir = path.join(projectRoot, 'src', 'frontend');
      const { stdout } = await execAsync('npm run build', { cwd: frontendDir });
      buildLog = stdout;
    } catch (buildErr: any) {
      console.warn('Local build failed:', buildErr.message);
      return NextResponse.json({ success: false, error: 'Local build failed: ' + buildErr.message }, { status: 500 });
    }

    // 8. Deploy to Firebase Hosting
    let firebaseLog = '';
    try {
      const { stdout } = await execAsync('npx firebase deploy --only hosting', { cwd: projectRoot });
      firebaseLog = stdout;
    } catch (firebaseErr: any) {
      console.warn('Firebase Deploy failed (you may need to run npx firebase login --reauth):', firebaseErr.message);
      firebaseLog = 'Firebase Deploy failed: ' + firebaseErr.message;
      return NextResponse.json({ success: false, error: firebaseLog }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assets synced to GCS, frontend pushed to Git, and site deployed to Firebase successfully!',
      gcloudLog,
      buildLog,
      firebaseLog,
      commitMessage
    });
  } catch (error: any) {
    console.error('Push to Live Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
