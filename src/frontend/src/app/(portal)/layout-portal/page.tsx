import type { Metadata } from "next";
import PortalOverviewClient from "@/components/workshop/PortalOverviewClient";
import { getStaticUpcomingWorkshop } from "@/utils/upcomingWorkshop";
import {
  buildPageMetadata,
  buildUpcomingWorkshopEventJsonLd,
  buildBreadcrumbJsonLd,
} from "@/utils/seo";

const upcoming = getStaticUpcomingWorkshop();
const PAGE_TITLE = `${upcoming.workshop_ordinal} HEMS Workshop (${upcoming.target_window}) | Harsh-Environment Mass Spectrometry`;
const PAGE_DESCRIPTION =
  "Official hub for the 16th Biennial Workshop on Harsh-Environment Mass Spectrometry (September 2027): announcements, Call for Papers, registration, and venue.";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/layout-portal",
  keywords: [
    "16th HEMS Workshop",
    "HEMS Workshop 2027",
    "Harsh-Environment Mass Spectrometry 2027",
    "mass spectrometry symposium 2027",
  ],
});

export default function LayoutPortal() {
  const eventJsonLd = buildUpcomingWorkshopEventJsonLd(upcoming);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: `${upcoming.workshop_ordinal} Workshop (${upcoming.workshop_year})`, path: "/layout-portal" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PortalOverviewClient />
    </>
  );
}
