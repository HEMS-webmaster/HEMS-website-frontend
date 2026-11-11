/**
 * Generates Schema.org JSON-LD structured data for a HEMS workshop archive page.
 * Maps the existing archive JSON schema to Event + ScholarlyArticle markup
 * for search engines (Google, Bing) and AI systems (Google Scholar, Semantic Scholar, LLMs).
 */

export interface ArchiveAuthorInput {
  name?: string;
  isPresenter?: boolean;
  institute?: string | number;
  affiliation?: string;
}

export interface ArchiveTalkInput {
  id?: string;
  type?: string;
  time?: string;
  title?: string;
  authors?: ArchiveAuthorInput[] | string;
  institutes?: string[];
  public_website_url?: string;
  legacy_url?: string;
  presentationUrl?: string;
  url?: string;
  public_abstract_url?: string;
  legacy_abstract_url?: string;
  abstractUrl?: string;
  abstract_url?: string;
}

export interface ArchiveScheduleItemInput {
  type?: string;
  time?: string;
  title?: string;
  talks?: ArchiveTalkInput[];
}

export interface ArchiveDayInput {
  title?: string;
  items?: ArchiveScheduleItemInput[];
}

export interface ArchiveSponsorInput {
  name?: string;
  url?: string;
}

export interface ArchiveDataInput {
  year: number | string;
  ordinal?: string;
  title?: string;
  dates?: string;
  venue?: string;
  address?: string;
  sponsors?: ArchiveSponsorInput[];
  schedule?: ArchiveDayInput[];
}

interface JsonLdPerson {
  "@type": "Person";
  name: string;
  affiliation?: {
    "@type": "Organization";
    name: string;
  };
}

interface JsonLdMediaObject {
  "@type": "MediaObject";
  contentUrl: string;
  encodingFormat: string;
  name?: string;
}

interface JsonLdArticle {
  "@type": "ScholarlyArticle";
  name: string;
  headline: string;
  url?: string;
  datePublished?: string;
  inLanguage: string;
  isAccessibleForFree: boolean;
  hasPart: {
    "@type": "WebPageElement";
    isAccessibleForFree: boolean;
    cssSelector: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  author?: JsonLdPerson[];
  associatedMedia?: JsonLdMediaObject[];
}

interface JsonLdSubEvent {
  "@type": "Event";
  name: string;
  startDate?: string;
  eventAttendanceMode: string;
  eventStatus: string;
  workPerformed?: JsonLdArticle[];
}

interface JsonLdOrganization {
  "@type": "Organization";
  "@id"?: string;
  name: string;
  url?: string;
}

interface JsonLdEvent {
  "@context": "https://schema.org";
  "@type": "Event";
  "@id": string;
  name: string;
  description: string;
  url: string;
  image: string[];
  startDate?: string;
  endDate?: string;
  eventStatus: string;
  eventAttendanceMode: string;
  location?: {
    "@type": "Place";
    name?: string;
    address?: string;
  };
  organizer: JsonLdOrganization;
  sponsor?: JsonLdOrganization[];
  subEvent?: JsonLdSubEvent[];
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function monthIndex(monthStr: string): number {
  return MONTHS.indexOf(monthStr.toLowerCase());
}

/**
 * Parses workshop date range strings into ISO-8601 startDate and endDate.
 * Supports ASCII hyphens (-), Unicode en-dashes (–), em-dashes (—),
 * optional commas ("October 7–10 2003"), yearless strings ("February 21–23" + fallbackYear),
 * and cross-month spans ("September 29 – October 2, 2027").
 */
export function parseDateRange(
  dates: string | undefined,
  fallbackYear: number | string
): { startDate?: string; endDate?: string } {
  const yrFallback = Number(fallbackYear);
  if (!dates) {
    return Number.isFinite(yrFallback) && yrFallback > 1900
      ? { startDate: `${yrFallback}-01-01`, endDate: `${yrFallback}-01-01` }
      : {};
  }

  const normalized = dates.trim().replace(/[\u2013\u2014]/g, "-");

  // Case 1: Same-month range, optional year: "September 15-18, 2025" or "February 21-23"
  const sameMonthMatch = normalized.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})(?:,?\s*(\d{4}))?$/
  );
  if (sameMonthMatch) {
    const mIdx = monthIndex(sameMonthMatch[1]);
    const startDay = parseInt(sameMonthMatch[2], 10);
    const endDay = parseInt(sameMonthMatch[3], 10);
    const yr = sameMonthMatch[4] ? parseInt(sameMonthMatch[4], 10) : yrFallback;

    if (mIdx >= 0 && Number.isFinite(yr)) {
      const mm = String(mIdx + 1).padStart(2, "0");
      return {
        startDate: `${yr}-${mm}-${String(startDay).padStart(2, "0")}`,
        endDate: `${yr}-${mm}-${String(endDay).padStart(2, "0")}`,
      };
    }
  }

  // Case 2: Cross-month range: "September 29 - October 2, 2027"
  const crossMonthMatch = normalized.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/
  );
  if (crossMonthMatch) {
    const m1 = monthIndex(crossMonthMatch[1]);
    const d1 = parseInt(crossMonthMatch[2], 10);
    const m2 = monthIndex(crossMonthMatch[3]);
    const d2 = parseInt(crossMonthMatch[4], 10);
    const yr = crossMonthMatch[5] ? parseInt(crossMonthMatch[5], 10) : yrFallback;

    if (m1 >= 0 && m2 >= 0 && Number.isFinite(yr)) {
      return {
        startDate: `${yr}-${String(m1 + 1).padStart(2, "0")}-${String(d1).padStart(2, "0")}`,
        endDate: `${yr}-${String(m2 + 1).padStart(2, "0")}-${String(d2).padStart(2, "0")}`,
      };
    }
  }

  return {};
}

function parseSessionIsoDateTime(dayPrefix: string, timeStr: string | undefined): string | undefined {
  if (!dayPrefix) return undefined;
  if (!timeStr) return dayPrefix;

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(a\.?m\.?|p\.?m\.?))?/i);
  if (!match) return dayPrefix;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  } else if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return `${dayPrefix}T${String(hours).padStart(2, "0")}:${minutes}`;
}

/**
 * Extracts author Person objects (including institutional affiliation when present)
 * from a talk's authors field.
 */
function extractAuthors(
  authors: ArchiveAuthorInput[] | string | undefined,
  institutes?: string[]
): JsonLdPerson[] {
  if (!authors) return [];

  if (Array.isArray(authors)) {
    return authors
      .filter((a): a is ArchiveAuthorInput & { name: string } => Boolean(a.name && a.name.trim()))
      .map((a) => {
        let orgName = "";
        if (typeof a.affiliation === "string" && a.affiliation.trim()) {
          orgName = a.affiliation.trim();
        } else if (typeof a.institute === "string" && a.institute.trim()) {
          orgName = a.institute.trim();
        } else if (
          typeof a.institute === "number" &&
          Array.isArray(institutes) &&
          institutes[a.institute - 1]
        ) {
          orgName = institutes[a.institute - 1].trim();
        }

        const person: JsonLdPerson = {
          "@type": "Person",
          name: a.name.trim(),
        };
        if (orgName) {
          person.affiliation = {
            "@type": "Organization",
            name: orgName,
          };
        }
        return person;
      });
  }

  if (typeof authors === "string" && authors.trim()) {
    return authors
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map((n) => ({
        "@type": "Person" as const,
        name: n,
      }));
  }

  return [];
}

function getAbsoluteUrl(urlStr: string): string {
  if (!urlStr || urlStr.startsWith("gs://")) return "";
  if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
    return urlStr;
  }
  if (urlStr.startsWith("/")) {
    return `https://www.hems-workshop.org${urlStr}`;
  }
  return `https://www.hems-workshop.org/${urlStr}`;
}

export function generateArchiveJsonLd(data: ArchiveDataInput): JsonLdEvent {
  const yearStr = String(data.year);
  const { startDate, endDate } = parseDateRange(data.dates, data.year);
  const cleanVenue = data.venue ? data.venue.replace(/,\s*$/, "").trim() : "";
  const cleanAddress = data.address ? data.address.trim() : "";
  const canonicalArchiveUrl = `https://www.hems-workshop.org/archive/${yearStr}/`;

  const jsonLd: JsonLdEvent = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${canonicalArchiveUrl}#event`,
    name: `${data.ordinal} Workshop on Harsh-Environment Mass Spectrometry`,
    description: `Scientific proceedings from the ${data.ordinal} Workshop on Harsh-Environment Mass Spectrometry (${yearStr}). International symposium advancing portable, miniaturized, and field-deployable mass spectrometers for space exploration, subsea science, environmental monitoring, and security applications.`,
    url: canonicalArchiveUrl,
    image: [
      "https://www.hems-workshop.org/images/og-hems-social.png",
      "https://www.hems-workshop.org/hemslogo.jpg",
    ],
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      "@id": "https://www.hems-workshop.org/#organization",
      name: "Harsh-Environment Mass Spectrometry Society, Inc.",
      url: "https://www.hems-workshop.org/",
    },
  };

  if (startDate) jsonLd.startDate = startDate;
  if (endDate) jsonLd.endDate = endDate;

  if (cleanVenue || cleanAddress) {
    jsonLd.location = {
      "@type": "Place",
      ...(cleanVenue ? { name: cleanVenue } : { name: cleanAddress }),
      ...(cleanAddress ? { address: cleanAddress } : { address: cleanVenue }),
    };
  }

  if (data.sponsors && data.sponsors.length > 0) {
    jsonLd.sponsor = data.sponsors
      .filter((s): s is ArchiveSponsorInput & { name: string } => Boolean(s.name))
      .map((s) => ({
        "@type": "Organization" as const,
        name: s.name,
        ...(s.url ? { url: s.url } : {}),
      }));
  }

  const subEvents: JsonLdSubEvent[] = [];

  if (data.schedule && Array.isArray(data.schedule)) {
    for (const day of data.schedule) {
      const dayDateMatch = day.title?.match(/(\d{4})-(\d{2})-(\d{2})/);
      const dayDatePrefix = dayDateMatch
        ? `${dayDateMatch[1]}-${dayDateMatch[2]}-${dayDateMatch[3]}`
        : startDate || "";

      if (day.items && Array.isArray(day.items)) {
        for (const item of day.items) {
          if (item.type !== "session") continue;

          const sessionStart = parseSessionIsoDateTime(dayDatePrefix, item.time);
          const sessionEvent: JsonLdSubEvent = {
            "@type": "Event",
            name: item.title || "Technical Session",
            ...(sessionStart ? { startDate: sessionStart } : {}),
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
          };

          if (item.talks && item.talks.length > 0) {
            sessionEvent.workPerformed = item.talks
              .filter(
                (talk): talk is ArchiveTalkInput & { title: string } =>
                  Boolean(talk.title && talk.type !== "event")
              )
              .map((talk) => {
                const article: JsonLdArticle = {
                  "@type": "ScholarlyArticle",
                  name: talk.title,
                  headline: talk.title,
                  ...(talk.id ? { url: `${canonicalArchiveUrl}#${talk.id}` } : {}),
                  datePublished: yearStr,
                  inLanguage: "en",
                  isAccessibleForFree: false,
                  hasPart: {
                    "@type": "WebPageElement",
                    isAccessibleForFree: false,
                    cssSelector: ".gated-pdf-content",
                  },
                  publisher: {
                    "@type": "Organization",
                    name: "Harsh-Environment Mass Spectrometry Society, Inc.",
                    url: "https://www.hems-workshop.org/",
                  },
                };

                const authors = extractAuthors(talk.authors, talk.institutes);
                if (authors.length > 0) {
                  article.author = authors;
                }

                const media: JsonLdMediaObject[] = [];
                const slidesUrlStr =
                  talk.public_website_url ||
                  talk.legacy_url ||
                  talk.presentationUrl ||
                  talk.url ||
                  "";
                const absSlidesUrl = getAbsoluteUrl(slidesUrlStr);
                if (absSlidesUrl) {
                  media.push({
                    "@type": "MediaObject",
                    contentUrl: absSlidesUrl,
                    encodingFormat: "application/pdf",
                    name: "Presentation Slides",
                  });
                }

                const abstractUrlStr =
                  talk.public_abstract_url ||
                  talk.legacy_abstract_url ||
                  talk.abstractUrl ||
                  talk.abstract_url ||
                  "";
                const absAbstractUrl = getAbsoluteUrl(abstractUrlStr);
                if (absAbstractUrl) {
                  media.push({
                    "@type": "MediaObject",
                    contentUrl: absAbstractUrl,
                    encodingFormat: "application/pdf",
                    name: "Extended Abstract",
                  });
                }

                if (media.length > 0) {
                  article.associatedMedia = media;
                }

                return article;
              });
          }

          if (sessionEvent.workPerformed && sessionEvent.workPerformed.length > 0) {
            subEvents.push(sessionEvent);
          }
        }
      }
    }
  }

  if (subEvents.length > 0) {
    jsonLd.subEvent = subEvents;
  }

  return jsonLd;
}
