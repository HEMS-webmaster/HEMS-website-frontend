// This API route is for local development only (Workshop Manager).
// The static export build (Firebase) skips dynamic routes automatically.
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getCorporateRegistryPath } from '@/utils/assetPaths';

const REGISTRY_PATH = getCorporateRegistryPath();

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

    const newEntry = { company: company.trim(), url: url?.trim() || '', logo_file: logo_file?.trim() || '', year_began: body.year_began?.trim() || '' };
    registry.push(newEntry);
    registry.sort((a, b) => a.company.localeCompare(b.company));

    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
    return NextResponse.json({ success: true, entry: newEntry });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { company, logo_file, url } = body;

    if (!company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company name required' }, { status: 400 });
    }

    const data = await fs.readFile(REGISTRY_PATH, 'utf8');
    const registry: any[] = JSON.parse(data.replace(/^\uFEFF/, ''));

    const idx = registry.findIndex(
      (r) => r.company.trim().toLowerCase() === company.trim().toLowerCase()
    );
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (logo_file !== undefined) registry[idx].logo_file = logo_file;
    if (url !== undefined) registry[idx].url = url;
    if (body.year_began !== undefined) registry[idx].year_began = body.year_began;

    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
    return NextResponse.json({ success: true, entry: registry[idx] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');

    if (!company?.trim()) {
      return NextResponse.json({ success: false, error: 'Company name required' }, { status: 400 });
    }

    const data = await fs.readFile(REGISTRY_PATH, 'utf8');
    const registry: any[] = JSON.parse(data.replace(/^\uFEFF/, ''));

    const before = registry.length;
    const updated = registry.filter(
      (r) => r.company.trim().toLowerCase() !== company.trim().toLowerCase()
    );

    if (updated.length === before) {
      return NextResponse.json({ success: false, error: 'Company not found in registry' }, { status: 404 });
    }

    await fs.writeFile(REGISTRY_PATH, JSON.stringify(updated, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
