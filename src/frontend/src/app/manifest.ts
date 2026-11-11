import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HEMS Society — Harsh-Environment Mass Spectrometry",
    short_name: "HEMS Society",
    description:
      "Biennial scientific symposium and 25+ year open-access proceedings archive for field-deployable, subsea, and planetary mass spectrometry.",
    start_url: "/",
    display: "browser",
    background_color: "#FAFBFD",
    theme_color: "#0369A1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/hemslogo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}

