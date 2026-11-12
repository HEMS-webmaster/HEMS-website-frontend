import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";

export const dynamic = "force-static";

const PRIVATE_DISALLOW = [
  "/manager/",
  "/api/",
  "/admin/",
  "/board/",
  "/reviewer/",
  "/unsubscribe/",
];

const AI_SCHOLARLY_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "Amazonbot",
  "DuckAssistBot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: AI_SCHOLARLY_AGENTS,
        allow: [
          "/",
          "/archive/",
          "/llms.txt",
          "/llms-full.txt",
          "/archives-index.json",
          "/mock-pdf-chunks.json",
        ],
        disallow: PRIVATE_DISALLOW,
      },
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
