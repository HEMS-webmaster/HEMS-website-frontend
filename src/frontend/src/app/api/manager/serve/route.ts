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
    // Construct absolute path to the local file
    const proceedingsDir = path.join(process.cwd(), '..', '..', 'docs', 'archives_translation', 'proceedings');
    const safeRelativePath = file.replace(/\\/g, '/').replace(/^\//, ''); // Clean leading slash
    const filePath = path.join(proceedingsDir, safeRelativePath);
    
    // Serve the raw file
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    if (ext === '.ppt' || ext === '.pptx') contentType = 'application/vnd.ms-powerpoint';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    
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
