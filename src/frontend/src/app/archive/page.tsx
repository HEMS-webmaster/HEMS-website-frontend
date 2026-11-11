import type { Metadata } from "next";
import ArchiveHubClient from "@/components/archive/ArchiveHubClient";
import workshopsData from "@/data/master_workshops.json";
import {
  SITE_URL,
  buildPageMetadata,
  buildWebPageJsonLd,
  toCanonicalUrl,
} from "@/utils/seo";

interface MasterWorkshopRecord {
  number?: number | string;
  year?: number | string;
  title?: string;
  dates?: string;
  venue?: string;
  address?: string;
  city?: string;
}

function formatOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

const ARCHIVE_TITLE = "Proceedings Archive (1999–2025) | HEMS Workshop";
const ARCHIVE_DESCRIPTION =
  "Search 25+ years of Harsh-Environment Mass Spectrometry (HEMS) Workshop proceedings, extended abstracts, posters, and full-text presentation slides (1999–2025).";

export const metadata: Metadata = buildPageMetadata({
  title: ARCHIVE_TITLE,
  description: ARCHIVE_DESCRIPTION,
  path: "/archive/",
  keywords: [
    "HEMS proceedings archive",
    "mass spectrometry conference proceedings",
    "portable mass spectrometry slides",
    "planetary mass spectrometry abstracts",
    "underwater mass spectrometry papers",
  ],
});

export default function ArchivePage() {
  const sortedWorkshops = [...(workshopsData as MasterWorkshopRecord[])]
    .filter((ws) => Number.isFinite(Number(ws.year)) && Number(ws.year) > 0)
    .sort((a, b) => Number(b.year) - Number(a.year));

  const webPageJsonLd = buildWebPageJsonLd({
    title: ARCHIVE_TITLE,
    description: ARCHIVE_DESCRIPTION,
    path: "/archive/",
    pageType: "CollectionPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Proceedings Archive", path: "/archive/" },
    ],
  });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/archive/#workshop-series`,
    name: "Workshop on Harsh-Environment Mass Spectrometry Proceedings Series",
    description:
      "Chronological archive of Harsh-Environment Mass Spectrometry (HEMS) Workshop programs, oral presentations, extended abstracts, and poster sessions.",
    numberOfItems: sortedWorkshops.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: sortedWorkshops.map((ws, idx) => {
      const yr = Number(ws.year);
      const num = Number(ws.number);
      const title = ws.title || `${formatOrdinal(num)} HEMS Workshop`;
      return {
        "@type": "ListItem",
        position: idx + 1,
        name: `${title} (${yr})`,
        url: toCanonicalUrl(`/archive/${yr}/`),
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <ArchiveHubClient />
    </>
  );
}
