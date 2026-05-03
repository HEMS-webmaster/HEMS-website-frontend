import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Firebase Classic Hosting (free Spark tier).
  // Produces an `out/` directory of pure HTML/CSS/JS — no server required.
  // The Workshop Manager (/manager, /api/manager/*) runs in `next dev` only;
  // those API routes are annotated with `force-static` to exclude them from export.
  output: 'export',
  trailingSlash: true,
  images: {
    // Next.js Image Optimization requires a server; disabled for static export.
    unoptimized: true,
  },
};

export default nextConfig;
