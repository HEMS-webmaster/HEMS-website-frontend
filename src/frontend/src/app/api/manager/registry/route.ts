import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), 'src', 'data', 'corporate_registry.json');

export async function GET() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
    const registry = JSON.parse(raw.replace(/^\uFEFF/, ''));
    const sorted = [...registry].sort((a: any, b: any) => a.company.localeCompare(b.company));
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, url, logo_file } = body;

    if (!company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company name required' }, { status: 400 });
    }

    const data = await fs.readFile(REGISTRY_PATH, 'utf8');
    const registry: any[] = JSON.parse(data.replace(/^\uFEFF/, ''));

    // Prevent exact-name duplicates (case-insensitive)
    const exists = registry.some(
      (r) => r.company.trim().toLowerCase() === company.trim().toLowerCase()
    );
    if (exists) {
      return NextResponse.json({ success: false, error: 'Company already exists in registry' }, { status: 409 });
    }

    const newEntry = { company: company.trim(), url: url?.trim() || '', logo_file: logo_file?.trim() || '' };
    registry.push(newEntry);
    registry.sort((a, b) => a.company.localeCompare(b.company));

    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
    return NextResponse.json({ success: true, entry: newEntry });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
