import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/manager/", "/api/", "/admin/", "/board/", "/reviewer/", "/unsubscribe/"],
      },
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
