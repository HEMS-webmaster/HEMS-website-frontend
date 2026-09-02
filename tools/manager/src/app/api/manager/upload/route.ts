// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getWorkshopDir, getSponsorsDir, getProjectRoot, getFrontendSponsorsDir } from '@/utils/assetPaths';

function formatOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const wsNum = formData.get('wsNum') as string;
    const session = (formData.get('session') as string) || 'General';
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const wsOrdinal = formatOrdinal(parseInt(wsNum));
    let targetDir = '';

    if (category === 'Sponsor') {
      targetDir = getSponsorsDir();
    } else {
      const wsDir = getWorkshopDir(wsOrdinal);
      if (category === 'Presentation' || category === 'Abstract') {
        const cleanSession = session.replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        targetDir = path.join(wsDir, cleanSession);
      } else if (category === 'Student_Award') {
        targetDir = path.join(wsDir, 'Student_Award');
      } else if (category === 'Poster') {
        targetDir = path.join(wsDir, 'Posters');
      } else {
        targetDir = path.join(wsDir, 'Administrative');
      }
    }

    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, fileName || file.name);
    await fs.writeFile(filePath, buffer);

    try {
      if (category === 'Sponsor') {
        const publicSponsorDir = getFrontendSponsorsDir();
        await fs.mkdir(publicSponsorDir, { recursive: true });
        await fs.writeFile(path.join(publicSponsorDir, fileName || file.name), buffer);
      }
      
      if (filePath.endsWith('.pdf')) {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        const scriptPath = path.join(getProjectRoot(), 'scratch', 'preview_generator.py');
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
