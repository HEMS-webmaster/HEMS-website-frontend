import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string; // 'Presentation', 'Sponsor', 'Poster', etc.
    const wsNum = formData.get('wsNum') as string;
    const fileName = formData.get('fileName') as string;
    const session = formData.get('session') as string || 'General';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let targetDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'proceedings');

    if (category === 'Sponsor') {
      targetDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'sponsors');
    } else if (category === 'Presentation' || category === 'Abstract') {
      const cleanSession = session.replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
      targetDir = path.join(targetDir, `${wsNum}th`, cleanSession);
    } else if (category === 'Student_Award') {
      targetDir = path.join(targetDir, `${wsNum}th`, 'Student_Award');
    } else if (category === 'Poster') {
      targetDir = path.join(targetDir, `${wsNum}th`, 'Posters');
    } else {
      targetDir = path.join(targetDir, `${wsNum}th`, 'Administrative');
    }

    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, fileName || file.name);
    await fs.writeFile(filePath, buffer);

    try {
      if (category === 'Sponsor') {
        const publicSponsorDir = path.join(process.cwd(), 'public', 'images', 'sponsors');
        await fs.mkdir(publicSponsorDir, { recursive: true });
        await fs.writeFile(path.join(publicSponsorDir, fileName || file.name), buffer);
      }
      
      if (filePath.endsWith('.pdf')) {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        const scriptPath = path.join(process.cwd(), '..', '..', 'scratch', 'preview_generator.py');
        await execPromise(`python "${scriptPath}" "${filePath}"`);
      }
    } catch (e) {
      console.error('Failed to generate preview:', e);
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
