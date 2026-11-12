import type { Metadata } from "next";
import StudentAwardsClient from "@/components/workshop/StudentAwardsClient";
import { buildPageMetadata, buildWebPageJsonLd } from "@/utils/seo";

const PAGE_TITLE = "Student Travel Awards | HEMS Workshop";
const PAGE_DESCRIPTION =
  "HEMS Workshop Student Travel Award guidelines, $1,500.00 graduate travel grants, M.S./M.A./Ph.D. eligibility, selection criteria, and application instructions.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/student-awards",
  keywords: [
    "HEMS student travel award",
    "mass spectrometry graduate travel grant",
    "student conference travel grant",
  ],
});

export default function StudentTravelAwardsPage() {
  const jsonLd = buildWebPageJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/student-awards",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Student Travel Awards", path: "/student-awards" },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StudentAwardsClient />
    </>
  );
}
