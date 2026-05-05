import type { NextConfig } from "next";

// `next build` sets NODE_ENV=production. Gate static-export settings here
// so `next dev` runs as a full server — API routes, Manager, everything works.
const isBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export for Firebase Classic Hosting (Spark tier, free).
  // Only active on `next build`. `next dev` runs as a normal Next.js server
  // so the Workshop Manager and its API routes function without restrictions.
  ...(isBuild ? { output: "export" } : {}),
  trailingSlash: true,
  images: {
    // Image Optimisation is server-only. Disabled for the static export;
    // in dev mode Next.js serves images normally via the built-in server.
    unoptimized: isBuild,
  },
};

export default nextConfig;


