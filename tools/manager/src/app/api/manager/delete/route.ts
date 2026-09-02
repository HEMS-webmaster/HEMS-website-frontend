// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { getWorkshopDir, getSponsorsDir, getFrontendSponsorsDir } from '@/utils/assetPaths';

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function POST(request: Request) {
  try {
    const { category, wsNum, fileName, session } = await request.json();

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'No fileName provided' }, { status: 400 });
    }

    const wsOrdinal = getOrdinal(parseInt(wsNum));
    let targetDir = '';

    if (category === 'Sponsor') {
      targetDir = getSponsorsDir();
    } else {
      const wsDir = getWorkshopDir(wsOrdinal);
      if (category === 'Presentation' || category === 'Abstract') {
        const cleanSession = (session || 'General').replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        targetDir = path.join(wsDir, cleanSession);
      } else if (category === 'Student_Award') {
        targetDir = path.join(wsDir, 'Student_Award');
      } else if (category === 'Poster') {
        targetDir = path.join(wsDir, 'Posters');
      } else {
        targetDir = path.join(wsDir, 'Administrative');
      }
    }

    const filePath = path.join(targetDir, fileName);

    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
    }

    // Attempt to clean up previews
    if (fileName.endsWith('.pdf')) {
      const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
      const pngPreview = path.join(targetDir, `${baseName}_preview.png`);
      const txtPreview = path.join(targetDir, `${baseName}_preview.txt`);

      if (fsSync.existsSync(pngPreview)) await fs.unlink(pngPreview);
      if (fsSync.existsSync(txtPreview)) await fs.unlink(txtPreview);
    }
    
    if (category === 'Sponsor') {
      const publicSponsorPath = path.join(getFrontendSponsorsDir(), fileName);
      if (fsSync.existsSync(publicSponsorPath)) await fs.unlink(publicSponsorPath);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
