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
    const isAbstract = file.includes('_Abstract.pdf');
    const safeRelativePath = file.replace(/\\/g, '/').replace(/^\//, ''); // Clean leading slash
    const parts = safeRelativePath.split('/');
    const wsOrdinal = parts[0];
    const previewFileName = isAbstract
      ? parts.slice(1).join('/').replace('.pdf', '_preview.txt')
      : parts.slice(1).join('/').replace('.pdf', '_preview.png');

    // Check workshop-specific directory first
    let previewPath = path.join(getWorkshopDir(wsOrdinal), previewFileName);
    if (!fsSync.existsSync(previewPath)) {
      previewPath = path.join(
        getProceedingsDir(),
        isAbstract ? safeRelativePath.replace('.pdf', '_preview.txt') : safeRelativePath.replace('.pdf', '_preview.png')
      );
    }
    
    if (isAbstract) {
      // Serve text
      const text = await fs.readFile(previewPath, 'utf8');
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      
    } else {
      // Serve image
      const imageBuffer = await fs.readFile(previewPath);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        },
      });
    }
  } catch (error) {
    console.error('Preview not found or error loading:', error);
    return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
  }
}
