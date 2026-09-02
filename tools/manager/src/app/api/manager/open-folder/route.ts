// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path') || '';
    if (!filePath) {
      return NextResponse.json({ success: false, error: 'No path provided' }, { status: 400 });
    }

    // Resolve the parent directory path
    const parentDir = path.dirname(filePath);
    const winPath = parentDir.replace(/\//g, '\\');

    // On Windows, use "explorer.exe" to open the folder
    // Wrap directory path in quotes to handle potential spaces in folder name
    const cmd = `explorer.exe "${winPath}"`;
    exec(cmd);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error opening folder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
