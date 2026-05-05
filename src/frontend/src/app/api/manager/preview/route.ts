// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file'); // e.g. "14th/Session/filename.pdf"
  
  if (!file) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  try {
    const isAbstract = file.includes('_Abstract.pdf');
    
    // Construct absolute path to the preview file
    const proceedingsDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'proceedings');
    const safeRelativePath = file.replace(/\\/g, '/').replace(/^\//, ''); // Clean leading slash
    
    let previewPath = '';
    if (isAbstract) {
      previewPath = path.join(proceedingsDir, safeRelativePath.replace('.pdf', '_preview.txt'));
      
      // Serve text
      const text = await fs.readFile(previewPath, 'utf8');
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      
    } else {
      previewPath = path.join(proceedingsDir, safeRelativePath.replace('.pdf', '_preview.png'));
      
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
