import type { Metadata } from "next";
import AccommodationsClient from "@/components/workshop/AccommodationsClient";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Venue & Accommodations | HEMS Workshop";
const PAGE_DESCRIPTION =
  "Official host beachfront venue, discounted group room block details, and reservation deadlines for the Harsh-Environment Mass Spectrometry Workshop.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/accommodations",
  keywords: [
    "HEMS Workshop hotel",
    "HEMS Workshop venue",
    "symposium accommodations",
  ],
});

export default function Accommodations() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/accommodations",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "2027 Workshop", path: "/layout-portal" },
      { name: "Venue & Accommodations", path: "/accommodations" },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AccommodationsClient />
    </>
  );
}
