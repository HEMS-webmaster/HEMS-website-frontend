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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { url, category, wsNum, fileName, session = 'General' } = data;

    if (!url || !fileName) {
      return NextResponse.json({ success: false, error: 'URL and fileName are required' }, { status: 400 });
    }

    // Download the file from the legacy URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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

    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, fileName);
    await fs.writeFile(filePath, buffer);

    try {
      if (filePath.toLowerCase().endsWith('.pdf')) {
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
    console.error('Download Legacy Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
