import type { Metadata } from "next";
import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";

export const SITE_URL = "https://www.hems-workshop.org";
export const SITE_NAME = "HEMS Society";
export const SITE_LEGAL_NAME = "Harsh-Environment Mass Spectrometry Society, Inc.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-hems-social.png`;
export const DEFAULT_OG_ALT =
  "Harsh-Environment Mass Spectrometry Society (HEMS) — Chemical Measurement Beyond the Laboratory. Biennial international symposium and 25+ year open-access proceedings archive.";

export interface PageMetadataOptions {
  title: string;
  description: string;
  /** Route path such as "/" or "/about" (normalized automatically to trailing slash). */
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function normalizeCanonicalPath(routePath: string): string {
  if (!routePath || routePath === "/") {
    return "/";
  }
  const withLeading = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export function toCanonicalUrl(routePath: string): string {
  return `${SITE_URL}${normalizeCanonicalPath(routePath)}`;
}

const CORE_KEYWORDS = [
  "harsh-environment mass spectrometry",
  "HEMS Workshop",
  "HEMS Society",
  "portable mass spectrometer",
  "in-situ mass spectrometry",
  "field-deployable mass spectrometry",
  "underwater mass spectrometry",
  "planetary mass spectrometry",
];

export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const canonicalUrl = toCanonicalUrl(options.path);
  const imageUrl = options.ogImage
    ? options.ogImage.startsWith("http")
      ? options.ogImage
      : `${SITE_URL}${options.ogImage.startsWith("/") ? options.ogImage : `/${options.ogImage}`}`
    : DEFAULT_OG_IMAGE;
  const imageWidth = options.ogImage ? options.ogImageWidth ?? 1200 : 1200;
  const imageHeight = options.ogImage ? options.ogImageHeight ?? 630 : 630;
  const imageAlt = options.ogImageAlt || DEFAULT_OG_ALT;

  const mergedKeywords = options.keywords
    ? Array.from(new Set([...options.keywords, ...CORE_KEYWORDS]))
    : CORE_KEYWORDS;

  return {
    title: options.title,
    description: options.description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type: options.ogType ?? "website",
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [imageUrl],
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        },
  };
}

export function buildNoIndexMetadata(title: string, description: string): Metadata {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export function buildGlobalKnowledgeGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "NGO"],
        "@id": `${SITE_URL}/#organization`,
        name: SITE_LEGAL_NAME,
        alternateName: [
          "HEMS Society",
          "HEMS Workshop",
          "Workshop on Harsh-Environment Mass Spectrometry",
        ],
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/hemslogo.jpg`,
          width: 3756,
          height: 2594,
        },
        image: DEFAULT_OG_IMAGE,
        foundingDate: "1999",
        nonprofitStatus: "https://schema.org/Nonprofit501c3",
        description:
          "IRS 501(c)(3) scientific public charity advancing portable, ruggedized, and in-situ mass spectrometry across subsea, planetary, atmospheric, and field environments through biennial workshops and an open-access proceedings archive.",
        areaServed: "Worldwide",
        knowsAbout: [
          "Harsh-Environment Mass Spectrometry",
          "Portable and Miniaturized Mass Spectrometers",
          "Underwater and Subsea Chemical Sensing",
          "Planetary and Spaceflight Mass Spectrometry",
          "Membrane Inlet Mass Spectrometry (MIMS)",
          "Miniature Vacuum Technology",
          "Environmental and Tactical Field Chemical Analysis",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "General & Symposium Enquiries",
            email: "president@hems-workshop.org",
            url: `${SITE_URL}/contact/`,
            availableLanguage: ["English"],
          },
          {
            "@type": "ContactPoint",
            contactType: "Corporate Sponsorship & Billing",
            email: "tim.short@hems-workshop.org",
            url: `${SITE_URL}/corporate-sponsorship/`,
            availableLanguage: ["English"],
          },
          {
            "@type": "ContactPoint",
            contactType: "Website & Technical Support",
            email: "webmaster@hems-workshop.org",
            url: `${SITE_URL}/contact/?topic=webmaster`,
            availableLanguage: ["English"],
          },
          {
            "@type": "ContactPoint",
            contactType: "Student Travel Awards Committee",
            email: "hemsworkshop@hems-workshop.org",
            url: `${SITE_URL}/student-awards/`,
            availableLanguage: ["English"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "HEMS Society — Harsh-Environment Mass Spectrometry",
        alternateName: "HEMS Workshop & Proceedings Archive",
        inLanguage: "en-US",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: toCanonicalUrl(item.path),
    })),
  };
}

export function buildWebPageJsonLd(options: {
  title: string;
  description: string;
  path: string;
  pageType?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  breadcrumbs?: BreadcrumbItem[];
}) {
  const canonicalUrl = toCanonicalUrl(options.path);
  const pageNode = {
    "@type": options.pageType ?? "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: options.title,
    description: options.description,
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
  };

  if (!options.breadcrumbs || options.breadcrumbs.length === 0) {
    return {
      "@context": "https://schema.org",
      ...pageNode,
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      pageNode,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: options.breadcrumbs.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.name,
          item: toCanonicalUrl(item.path),
        })),
      },
    ],
  };
}

function parseFeeDigits(feeStr: string): string | null {
  const cleaned = feeStr.replace(/[^0-9.]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

export function buildUpcomingWorkshopEventJsonLd(workshop: UpcomingWorkshopConfig) {
  const yr = workshop.workshop_year || "2027";
  // Default to September 2027 window when exact days are TBA so Schema.org Event has valid ISO-8601 bounds
  const startDate = `${yr}-09-01`;
  const endDate = `${yr}-09-30`;

  const studentPrice = parseFeeDigits(workshop.reg_student_fee);
  const profPrice = parseFeeDigits(workshop.reg_professional_fee);
  const offers = [
    ...(studentPrice
      ? [
          {
            "@type": "Offer",
            name: "Graduate Student Registration",
            price: studentPrice,
            priceCurrency: "USD",
            availability: workshop.registration_open
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            url: `${SITE_URL}/registration/`,
          },
        ]
      : []),
    ...(profPrice
      ? [
          {
            "@type": "Offer",
            name: "General / Professional Registration",
            price: profPrice,
            priceCurrency: "USD",
            availability: workshop.registration_open
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            url: `${SITE_URL}/registration/`,
          },
        ]
      : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    "@id": `${SITE_URL}/layout-portal/#event-${yr}`,
    name: `${workshop.workshop_ordinal} Workshop on Harsh-Environment Mass Spectrometry (${yr})`,
    description: workshop.announcement_body,
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}/layout-portal/`,
    image: [
      DEFAULT_OG_IMAGE,
      `${SITE_URL}/images/gallery/golden-hour-harbor-reception-2015.jpg`,
    ],
    location: {
      "@type": "Place",
      name: workshop.venue_confirmed ? workshop.hotel_name : "United States Coastal Symposium Venue",
      address: {
        "@type": "PostalAddress",
        addressLocality: workshop.venue_confirmed ? workshop.venue_city_state : "Coastal Venue TBA",
        addressCountry: "US",
      },
    },
    organizer: {
      "@id": `${SITE_URL}/#organization`,
    },
    ...(offers.length > 0 ? { offers } : {}),
  };
}

