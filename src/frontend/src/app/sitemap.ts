import path from "path";
import { promises as fs } from "fs";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dataDir = path.join(process.cwd(), "src", "data", "archives");
  let files: string[] = [];
  try {
    files = await fs.readdir(dataDir);
  } catch {
    files = [];
  }

  const years = files
    .filter((f) => f.endsWith(".json") && f !== "template.json")
    .map((f) => f.replace(".json", ""))
    .sort((a, b) => Number(b) - Number(a));

  const buildDate = new Date().toISOString().split("T")[0];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/archive/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/layout-portal/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/call-for-papers/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/student-awards/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/registration/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/accommodations/`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: buildDate,
      changeFrequency: "yearly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/history/`,
      lastModified: buildDate,
      changeFrequency: "yearly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/corporate-sponsorship/`,
      lastModified: buildDate,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/formatting-guidelines/`,
      lastModified: buildDate,
      changeFrequency: "yearly",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/contact/`,
      lastModified: buildDate,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];

  const archiveRoutes: MetadataRoute.Sitemap = years.map((year) => ({
    url: `${SITE_URL}/archive/${year}/`,
    lastModified: buildDate,
    changeFrequency: "yearly" as const,
    priority: year === "2025" ? 0.88 : 0.8,
  }));

  return [...staticRoutes, ...archiveRoutes];
}
