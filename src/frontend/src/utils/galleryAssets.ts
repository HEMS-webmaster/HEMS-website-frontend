/**
 * Cache-busting version tokens keyed by disk mtime (`public/images/gallery/*`)
 * so user-edited gallery assets reload immediately in browsers and CDNs.
 */
export const GALLERY_ASSET_VERSIONS: Record<string, string> = {
  "amerom-exomars-moma-flight-2022.jpg": "1794829865",
  "bell-subsea-lander-ms-2025.jpg": "1794439163",
  "coppin-icefin-underice-rov.jpg": "1794439167",
  "danell-dragonfly-titan-ms-2019.jpg": "1794439163",
  "don-cesar-hawaiian-smiles-2013.jpg": "1794850932",
  "fox-arammis-robot-ms-2025.jpg": "1794782712",
  "fox-volcanic-fumarole-ms.jpg": "1794439161",
  "golden-hour-harbor-reception-2015.jpg": "1794439107",
  "gonin-aircraft-tofms-2018.jpg": "1794782680",
  "grimes-simion-ion-funnel-2025.jpg": "1794829800",
  "group-photo-2025.jpg": "1794439150",
  "kibelka-aerosol-ms-cad-2025.jpg": "1794439164",
  "li-lama-lunar-optics-2025.jpg": "1794829800",
  "loose-antarctic-swims-2025.jpg": "1794782680",
  "mandalay-beach-corridor-smiles-2017.jpg": "1794439097",
  "newsome-smithsonian-bay-ms-2025.jpg": "1794829800",
  "poster-session-smiles-oxnard-2017.jpg": "1794439127",
  "raith-spaceflight-orbitrap-cad.jpg": "1794439165",
  "serpa-cycloidal-ion-trajectories.jpg": "1794439166",
  "short-triaxus-towsled-ms-2017.jpg": "1794782680",
  "single-track-auditorium-smiles-2015.jpg": "1794439115",
  "smith-military-cwa-gcms-2003.jpg": "1794831914",
  "sponsor-exhibit-roundtable-2017.jpg": "1794439088",
  "st-pete-beach-don-cesar-sunny.jpg": "1794491596",
  "student-award-certificate-2015.jpg": "1794439081",
  "verbeck-uav-drone-ms-2025.jpg": "1794832254",
  "verbeck-urban-ms-heatmap-2019.jpg": "1794439164",
  "virginia-beach-oceanfront-sunny.jpg": "1794491501",
  "virginia-beach-staircase-smiles-2025.jpg": "1794439099",
};

const DEFAULT_GALLERY_VERSION = "20261116";

/**
 * Resolves a `/images/gallery/...` path or filename with a stable `?v=` cache-buster.
 */
export function galleryImageUrl(filenameOrPath: string): string {
  const clean = filenameOrPath
    .split("?")[0]
    .replace(/^\/+images\/gallery\//, "")
    .replace(/^images\/gallery\//, "");
  const version = GALLERY_ASSET_VERSIONS[clean] || DEFAULT_GALLERY_VERSION;
  return `/images/gallery/${clean}?v=${version}`;
}
