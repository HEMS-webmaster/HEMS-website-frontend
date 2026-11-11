import type { Metadata } from "next";
import CorporateSponsorshipClient from "@/components/workshop/CorporateSponsorshipClient";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Corporate Sponsorship | HEMS Society & Biennial Workshop";
const PAGE_DESCRIPTION =
  "Partner with the 501(c)(3) HEMS Workshop. Review corporate sponsorship benefits, tabletop hardware exhibition space, split invoicing, and 52 industry partners.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/corporate-sponsorship",
  keywords: [
    "HEMS corporate sponsorship",
    "mass spectrometry conference sponsor",
    "scientific instrument exhibition",
  ],
});

export default function CorporateSponsorshipPage() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/corporate-sponsorship",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Corporate Sponsorship", path: "/corporate-sponsorship" },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CorporateSponsorshipClient />
    </>
  );
}
