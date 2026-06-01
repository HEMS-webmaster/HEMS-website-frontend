// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const wsNum = searchParams.get('wsNum') || '';
    const fileName = searchParams.get('fileName') || '';
    const session = searchParams.get('session') || 'General';

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'No filename provided' }, { status: 400 });
    }

    const wsOrdinal = getOrdinal(parseInt(wsNum));
    let targetDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'proceedings');

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

    const filePath = path.join(targetDir, fileName);
    let exists = false;
    let mtime = 0;

    try {
      const stat = await fs.stat(filePath);
      exists = stat.isFile();
      mtime = stat.mtimeMs;
    } catch (e) {
      exists = false;
    }

    // Replace backslashes with forward slashes for the file:// link to work nicely in browsers,
    // though Windows file:// absolute paths usually need forward slashes.
    const fileUri = `file:///${filePath.replace(/\\/g, '/')}`;

    // Generate GCloud and Website URLs
    let gcloudUrl = '';
    let websiteUrl = '';
    let devWebsiteUrl = '';
    let localWebsiteUrl = '';
    let gcloudConsoleUri = '';
    let subDir = '';
    
    if (category === 'Sponsor') {
      gcloudUrl = `https://storage.googleapis.com/hems-workshop-archives/sponsors/${fileName}`;
      websiteUrl = `https://www.hems-workshop.org/images/sponsors/${fileName}`;
      devWebsiteUrl = `https://hems-workshop.web.app/images/sponsors/${fileName}`;
      localWebsiteUrl = `http://localhost:3000/images/sponsors/${fileName}`;
      gcloudConsoleUri = 'https://console.cloud.google.com/storage/browser/hems-workshop-archives/sponsors';
    } else {
      if (category === 'Student_Award') {
        subDir = 'Student_Award';
      } else if (category === 'Poster') {
        subDir = 'Posters';
      } else if (category === 'Presentation' || category === 'Abstract') {
        const cleanSession = session.replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        subDir = cleanSession;
      } else {
        subDir = 'Administrative';
      }
      gcloudUrl = `https://storage.googleapis.com/hems-workshop-archives/proceedings/${wsOrdinal}/${subDir}/${fileName}`;
      websiteUrl = `https://www.hems-workshop.org/archive/proceedings/${wsOrdinal}/${subDir}/${fileName}`;
      devWebsiteUrl = `https://hems-workshop.web.app/archive/proceedings/${wsOrdinal}/${subDir}/${fileName}`;
      localWebsiteUrl = `http://localhost:3000/archive/proceedings/${wsOrdinal}/${subDir}/${fileName}`;
      gcloudConsoleUri = `https://console.cloud.google.com/storage/browser/hems-workshop-archives/proceedings/${wsOrdinal}/${subDir}`;
    }

    let gcloudExists = false;
    try {
      const gcloudHead = await fetch(gcloudUrl, { method: 'HEAD' });
      if (gcloudHead.ok) {
        gcloudExists = true;
      }
    } catch (e) {
      gcloudExists = false;
    }

    return NextResponse.json({ 
      success: true, 
      exists, 
      filePath,
      fileUri,
      gcloudUrl,
      gcloudConsoleUri,
      gcloudExists,
      websiteUrl,
      devWebsiteUrl,
      localWebsiteUrl,
      mtime
    });
  } catch (error: any) {
    console.error('Check File Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
