/**
 * Generates Schema.org JSON-LD structured data for a HEMS workshop archive page.
 * Maps the existing archive JSON schema to Event + ScholarlyArticle markup
 * for search engines (Google, Bing) and AI systems (Google Scholar, Semantic Scholar, LLMs).
 */

interface JsonLdPerson {
  '@type': 'Person';
  name: string;
}

interface JsonLdArticle {
  '@type': 'ScholarlyArticle';
  name: string;
  author?: JsonLdPerson[];
}

interface JsonLdSubEvent {
  '@type': 'Event';
  name: string;
  startDate?: string;
  workPerformed?: JsonLdArticle[];
}

interface JsonLdOrganization {
  '@type': 'Organization';
  name: string;
  url?: string;
}

interface JsonLdEvent {
  '@context': 'https://schema.org';
  '@type': 'Event';
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  eventAttendanceMode: string;
  location?: {
    '@type': 'Place';
    name?: string;
    address?: string;
  };
  organizer: JsonLdOrganization;
  sponsor?: JsonLdOrganization[];
  subEvent?: JsonLdSubEvent[];
}

/**
 * Attempts to parse date range strings like "September 26-29, 2022" or "October 16-18, 2018"
 * into ISO start/end dates.
 */
function parseDateRange(dates: string, year: number): { startDate?: string; endDate?: string } {
  if (!dates) return {};

  // Match "Month DD-DD, YYYY"
  const rangeMatch = dates.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)\s*-\s*(\d+),?\s*(\d{4})$/i
  );
  if (rangeMatch) {
    const monthStr = rangeMatch[1];
    const startDay = parseInt(rangeMatch[2]);
    const endDay = parseInt(rangeMatch[3]);
    const yr = parseInt(rangeMatch[4]);

    const monthIdx = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ].indexOf(monthStr.toLowerCase());

    if (monthIdx >= 0) {
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        startDate: `${yr}-${mm}-${String(startDay).padStart(2, '0')}`,
        endDate: `${yr}-${mm}-${String(endDay).padStart(2, '0')}`,
      };
    }
  }

  return {};
}

/**
 * Extracts author Person objects from a talk's authors field.
 * Handles both the structured array format and legacy comma-separated strings.
 */
function extractAuthors(authors: any): JsonLdPerson[] {
  if (!authors) return [];

  if (Array.isArray(authors)) {
    return authors
      .filter((a: any) => a.name && a.name.trim())
      .map((a: any) => ({
        '@type': 'Person' as const,
        name: a.name.trim(),
      }));
  }

  if (typeof authors === 'string' && authors.trim()) {
    return authors
      .split(',')
      .map((n: string) => n.trim())
      .filter((n: string) => n.length > 0)
      .map((n: string) => ({
        '@type': 'Person' as const,
        name: n,
      }));
  }

  return [];
}

export function generateArchiveJsonLd(data: any): JsonLdEvent {
  const { startDate, endDate } = parseDateRange(data.dates, data.year);
  const locationStr = [data.venue, data.address].filter(Boolean).join(', ');

  const jsonLd: JsonLdEvent = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${data.ordinal} Workshop on Harsh-Environment Mass Spectrometry`,
    description: `Scientific proceedings from the ${data.ordinal} Workshop on Harsh-Environment Mass Spectrometry (${data.year}). Conference focused on portable, miniaturized, and field-deployable mass spectrometers for space exploration, defense, environmental monitoring, and underwater applications.`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: 'HEMS Workshop',
      url: 'https://www.hems-workshop.org',
    },
  };

  if (startDate) jsonLd.startDate = startDate;
  if (endDate) jsonLd.endDate = endDate;

  if (data.venue || data.address) {
    jsonLd.location = {
      '@type': 'Place',
      ...(data.venue ? { name: data.venue } : {}),
      ...(data.address ? { address: data.address } : {}),
    };
  }

  // Sponsors
  if (data.sponsors && data.sponsors.length > 0) {
    jsonLd.sponsor = data.sponsors
      .filter((s: any) => s.name)
      .map((s: any) => ({
        '@type': 'Organization' as const,
        name: s.name,
        ...(s.url ? { url: s.url } : {}),
      }));
  }

  // Sub-events (sessions with talks)
  const subEvents: JsonLdSubEvent[] = [];

  if (data.schedule && Array.isArray(data.schedule)) {
    for (const day of data.schedule) {
      const dayDateMatch = day.title?.match(/(\d{4})-(\d{2})-(\d{2})/);
      const dayDatePrefix = dayDateMatch ? `${dayDateMatch[1]}-${dayDateMatch[2]}-${dayDateMatch[3]}` : '';

      if (day.items && Array.isArray(day.items)) {
        for (const item of day.items) {
          if (item.type !== 'session') continue;

          const sessionEvent: JsonLdSubEvent = {
            '@type': 'Event',
            name: item.title || 'Session',
          };

          // Build a rough ISO datetime for the session start
          if (dayDatePrefix && item.time) {
            const timeMatch = item.time.match(/^(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              sessionEvent.startDate = `${dayDatePrefix}T${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            } else {
              sessionEvent.startDate = dayDatePrefix;
            }
          }

          // Map talks → ScholarlyArticle
          if (item.talks && item.talks.length > 0) {
            sessionEvent.workPerformed = item.talks
              .filter((talk: any) => talk.title && talk.type !== 'event')
              .map((talk: any) => {
                const article: JsonLdArticle = {
                  '@type': 'ScholarlyArticle',
                  name: talk.title,
                };
                const authors = extractAuthors(talk.authors);
                if (authors.length > 0) {
                  article.author = authors;
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
