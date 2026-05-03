import path from 'path';
import { promises as fs } from 'fs';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'archives');
  let files: string[] = [];
  try {
    files = await fs.readdir(dataDir);
  } catch {
    files = [];
  }
  const years = files
    .filter(f => f.endsWith('.json') && f !== 'template.json')
    .map(f => f.replace('.json', ''));

  const baseUrl = 'https://www.hems-workshop.org';

  return [
    { url: `${baseUrl}/`, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/archive`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    ...years.map(year => ({
      url: `${baseUrl}/archive/${year}`,
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),
  ];
}
