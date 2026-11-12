import type { Metadata } from "next";
import RegistrationClient from "@/components/workshop/RegistrationClient";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Workshop Registration | HEMS Workshop";
const PAGE_DESCRIPTION =
  "Symposium registration information for the biennial Harsh-Environment Mass Spectrometry (HEMS) Workshop.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/registration",
  keywords: [
    "HEMS Workshop registration",
    "mass spectrometry workshop registration",
  ],
});

export default function Registration() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/registration",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "2027 Workshop", path: "/layout-portal" },
      { name: "Registration", path: "/registration" },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RegistrationClient />
    </>
  );
}
