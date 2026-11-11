import type { Metadata } from "next";
import ContactClient from "@/components/workshop/ContactClient";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Contact the HEMS Society | Harsh-Environment Mass Spectrometry";
const PAGE_DESCRIPTION =
  "Contact the Harsh-Environment Mass Spectrometry (HEMS) Society organizing committee regarding the 16th Workshop, proceedings archive, or corporate sponsorship.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/contact",
  keywords: [
    "contact HEMS Society",
    "HEMS Workshop organizing committee",
    "HEMS corporate sponsorship contact",
  ],
});

export default function ContactPage() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/contact",
    pageType: "ContactPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}
