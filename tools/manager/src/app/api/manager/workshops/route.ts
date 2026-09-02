// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getMasterWorkshopsPath } from '@/utils/assetPaths';

export async function GET(request: Request) {
  try {
    const filePath = getMasterWorkshopsPath();
    const raw = await fs.readFile(filePath, 'utf8');
    const data = raw.replace(/^\uFEFF/, ''); // strip BOM if PowerShell wrote it
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.error('Error loading workshops:', error);
    // If the file doesn't exist, just return an empty array
    return NextResponse.json([]);
  }
}
