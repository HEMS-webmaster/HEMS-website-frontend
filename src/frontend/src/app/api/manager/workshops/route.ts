import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'master_workshops.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const data = raw.replace(/^\uFEFF/, ''); // strip BOM if PowerShell wrote it
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.error('Error loading workshops:', error);
    // If the file doesn't exist, just return an empty array
    return NextResponse.json([]);
  }
}
