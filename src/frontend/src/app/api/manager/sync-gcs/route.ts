import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    // Navigate from src/frontend up to the project root
    const projectRoot = path.join(process.cwd(), '..', '..');

    // GCloud Sync
    // Sync the proceedings directory to the expected GCS bucket
    const gcloudCmd = 'gsutil -m rsync -r docs/archives_translation/proceedings gs://hems-archive-assets/proceedings';
    let gcloudLog = '';
    try {
      const { stdout } = await execAsync(gcloudCmd, { cwd: projectRoot });
      gcloudLog = stdout;
    } catch (gcloudErr: any) {
      console.warn('GCloud Sync failed (gsutil may not be installed or authenticated):', gcloudErr.message);
      gcloudLog = 'GCloud Sync failed: ' + gcloudErr.message;
      return NextResponse.json({ success: false, error: gcloudLog }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      gcloudLog 
    });
  } catch (error: any) {
    console.error('GCS Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
