// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    // Navigate from src/frontend up to the project root
    const projectRoot = path.join(process.cwd(), '..', '..');

    // 1. Git Add
    await execAsync('git add .', { cwd: projectRoot });
    
    // 2. Git Commit
    try {
      await execAsync('git commit -m "feat(data): workshop manager content update"', { cwd: projectRoot });
    } catch (commitErr: any) {
      const output = (commitErr.stdout || '') + (commitErr.stderr || '') + (commitErr.message || '');
      if (!output.includes('nothing to commit') && 
          !output.includes('working tree clean') && 
          !output.includes('nothing added to commit')) {
        throw commitErr;
      }
    }
    
    // 3. Git Pull (Rebase)
    await execAsync('git pull --rebase origin main', { cwd: projectRoot });

    // 4. Git Push
    await execAsync('git push origin main', { cwd: projectRoot });

    return NextResponse.json({ 
      success: true, 
      message: 'Git push completed successfully'
    });
  } catch (error: any) {
    console.error('Push Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
