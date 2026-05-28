// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

function formatOrdinal(num: number): string {
  return `${num}${getOrdinalSuffix(num)}`;
}

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
    const wsOrdinal = formatOrdinal(parseInt(wsNum));

    if (category === 'Sponsor') {
      targetDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'sponsors');
    } else if (category === 'Presentation' || category === 'Abstract') {
      const cleanSession = session.replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
      targetDir = path.join(targetDir, wsOrdinal, cleanSession);
    } else if (category === 'Student_Award') {
      targetDir = path.join(targetDir, wsOrdinal, 'Student_Award');
    } else if (category === 'Poster') {
      targetDir = path.join(targetDir, wsOrdinal, 'Posters');
    } else {
      targetDir = path.join(targetDir, wsOrdinal, 'Administrative');
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
