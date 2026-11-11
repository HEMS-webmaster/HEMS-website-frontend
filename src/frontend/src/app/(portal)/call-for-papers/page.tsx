import type { Metadata } from "next";
import CallForPapersClient from "@/components/workshop/CallForPapersClient";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Call for Papers | HEMS Workshop";
const PAGE_DESCRIPTION =
  "Abstract submission guidelines, milestone dates, and technical focus areas for the biennial Harsh-Environment Mass Spectrometry (HEMS) Workshop.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/call-for-papers",
  keywords: [
    "HEMS Call for Papers",
    "mass spectrometry abstract submission",
    "portable mass spectrometry conference",
  ],
});

export default function CallForPapers() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/call-for-papers",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "2027 Workshop", path: "/layout-portal" },
      { name: "Call for Papers", path: "/call-for-papers" },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CallForPapersClient />
    </>
  );
}
