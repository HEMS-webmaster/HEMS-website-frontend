import type { NextConfig } from "next";

// `next build` sets NODE_ENV=production. Gate static-export settings here
// so `next dev` runs as a full server — API routes, Manager, everything works.
const isBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export for Firebase Classic Hosting (Spark tier, free).
  // Only active on `next build`. In `next dev`, proxy `/api/manager/*` to the
  // standalone Workshop Manager on port 4000 when local file streaming is used.
  ...(isBuild
    ? { output: "export" }
    : {
        async rewrites() {
          const serveFromGcs = {
            has: [
              {
                type: "query" as const,
                key: "file",
                value: "(?<filepath>.+)",
              },
            ],
            destination:
              "https://storage.googleapis.com/hems-workshop-archives/proceedings/:filepath",
          };
          return {
            beforeFiles: [
              { source: "/api/manager/serve", ...serveFromGcs },
              { source: "/api/manager/serve/", ...serveFromGcs },
            ],
            afterFiles: [
              {
                source: "/api/manager/:path*",
                destination: "http://localhost:4000/api/manager/:path*",
              },
            ],
            fallback: [],
          };
        },
      }),
  trailingSlash: true,
  images: {
    // Image Optimisation is server-only. Disabled for the static export;
    // in dev mode Next.js serves images normally via the built-in server.
    unoptimized: isBuild,
  },
};

export default nextConfig;


