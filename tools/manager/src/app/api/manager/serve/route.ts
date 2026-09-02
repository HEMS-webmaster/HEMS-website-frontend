// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { getProceedingsDir, getWorkshopDir } from '@/utils/assetPaths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file'); // e.g. "14th/Session/filename.pdf"
  
  if (!file) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  try {
    const safeRelativePath = file.replace(/\\/g, '/').replace(/^\//, ''); // Clean leading slash
    const parts = safeRelativePath.split('/');
    const wsOrdinal = parts[0];

    // Check workshop-specific directory first (supports incremental migration)
    let filePath = path.join(getWorkshopDir(wsOrdinal), ...parts.slice(1));
    if (!fsSync.existsSync(filePath)) {
      filePath = path.join(getProceedingsDir(), safeRelativePath);
    }
    
    // Serve the raw file
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    if (ext === '.ppt' || ext === '.pptx') contentType = 'application/vnd.ms-powerpoint';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.txt') contentType = 'text/plain';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      },
    });
  } catch (error) {
    console.error('File not found or error loading:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
