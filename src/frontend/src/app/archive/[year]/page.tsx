import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, FileText, Download, Building, ArrowLeft, Award } from "lucide-react";
import { notFound } from "next/navigation";
import path from "path";
import { promises as fs } from "fs";
import FrontendPreviewHover from "@/components/FrontendPreviewHover";
import CollapsiblePosterList from "@/components/CollapsiblePosterList";
import { generateArchiveJsonLd } from "@/utils/generateArchiveJsonLd";
export async function generateStaticParams() {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'archives');
  let files = [];
  try {
    files = await fs.readdir(dataDir);
  } catch(e) {
    return [];
  }
  const years = files
    .filter((f: string) => f.endsWith('.json') && f !== 'template.json')
    .map((f: string) => f.replace('.json', ''));
    
  return years.map(year => ({ year }));
}
export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const dataPath = path.join(process.cwd(), 'src', 'data', 'archives', `${year}.json`);
  try {
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    const locationStr = [data.venue, data.address].filter(Boolean).join(', ');
    const description = `Proceedings of the ${data.ordinal} Workshop on Harsh-Environment Mass Spectrometry${data.dates ? `, ${data.dates}` : ''}${locationStr ? ` — ${locationStr}` : ''}. Technical presentations, abstracts, and poster sessions on portable, space-flight, and field-deployable mass spectrometry.`;
    const canonicalUrl = `https://www.hems-workshop.org/archive/${year}`;
    return {
      title: `${data.ordinal} HEMS Workshop (${data.year}) | Harsh-Environment Mass Spectrometry`,
      description,
      keywords: ['HEMS', 'harsh-environment mass spectrometry', 'portable mass spectrometer', 'scientific proceedings', `${data.year} workshop`, data.address].filter(Boolean),
      openGraph: {
        title: `${data.ordinal} HEMS Workshop — ${data.dates || data.year}`,
        description,
        type: 'website' as const,
        url: canonicalUrl,
        siteName: 'HEMS Workshop',
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (e) {
    return { title: 'HEMS Workshop Archive' };
  }
}

export default async function WorkshopArchive({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const isLocal = process.env.NODE_ENV === 'development';
  
  const dataPath = path.join(process.cwd(), 'src', 'data', 'archives', `${year}.json`);
  let data;
  try {
    const fileContents = await fs.readFile(dataPath, 'utf8');
    data = JSON.parse(fileContents);
  } catch (e) {
    notFound();
  }

  // --- Unified Schedule Logic ---
  const parseDayDate = (title: string): Date => {
    if (!title) return new Date(0);
    // Try to parse YYYY-MM-DD
    const isoMatch = title.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }
    // Try to parse text date
    const textMatch = title.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)[,\s]+(\d{4})/i);
    if (textMatch) {
      const monthStr = textMatch[1];
      const day = parseInt(textMatch[2]);
      const year = parseInt(textMatch[3]);
      const monthIdx = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(monthStr.toLowerCase());
      return new Date(year, monthIdx, day);
    }
    // Try to parse MM/DD/YYYY (US Format)
    const usMatch = title.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
    }
    return new Date(0);
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    if (t.match(/^\d{2}:\d{2}$/)) {
      const [hh, mm] = t.split(':');
      let h = parseInt(hh);
      const suffix = h >= 12 ? 'p.m.' : 'a.m.';
      if (h === 0) h = 12;
      if (h > 12) h -= 12;
      return `${h}:${mm} ${suffix}`;
    }
    return t;
  };

  const formatDayTitle = (date: Date): string => {
    if (isNaN(date.getTime()) || date.getTime() === 0) return 'Unknown Date';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const parseDateGroupTitle = (title: string): string => {
    if (!title) return '';
    if (title.includes(':')) {
       return title.split(':').slice(1).join(':').trim();
    }
    return '';
  };

  let unifiedSchedule: any[] = [];
  
  if (data.schedule && Array.isArray(data.schedule)) {
    unifiedSchedule = JSON.parse(JSON.stringify(data.schedule)).map((day: any) => ({
      ...day,
      rawDateObj: parseDayDate(day.title),
      dateGroupTitle: parseDateGroupTitle(day.title),
      items: (day.items || []).filter((item: any) => item.type === 'session')
    })).filter((day: any) => day.items && day.items.length > 0);
  }

  if (data.events && Array.isArray(data.events)) {
    data.events.forEach((eg: any) => {
      const [y, m, d] = eg.date.split('-');
      const eventDateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      
      let targetDay = unifiedSchedule.find((day: any) => {
        return day.rawDateObj && day.rawDateObj.getTime() === eventDateObj.getTime();
      });

      if (!targetDay) {
        targetDay = { rawDateObj: eventDateObj, dateGroupTitle: eg.title, items: [] };
        unifiedSchedule.push(targetDay);
      } else if (!targetDay.dateGroupTitle && eg.title) {
        targetDay.dateGroupTitle = eg.title;
      }

      if (!targetDay.items) targetDay.items = [];

      eg.events?.forEach((ev: any) => {
        let formattedTime = formatTime(ev.time);
        let formattedEndTime = formatTime(ev.end_time);
        
        let displayTime = formattedTime;
        if (formattedEndTime) displayTime += ` - ${formattedEndTime}`;

        let subtitleElements = [];
        if (ev.subtitle) {
          if (ev.subtitle_url) {
            subtitleElements.push(`<a href="${ev.subtitle_url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${ev.subtitle}</a>`);
          } else {
            subtitleElements.push(ev.subtitle);
          }
        }
        if (ev.location) {
          if (ev.location_url) {
            subtitleElements.push(`<a href="${ev.location_url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${ev.location}</a>`);
          } else {
            subtitleElements.push(ev.location);
          }
        }

        targetDay.items.push({
          type: 'event',
          time: displayTime || ev.time,
          rawTime: ev.time, // Keep raw time for sorting
          title: ev.title,
          subtitle: [ev.subtitle, ev.location].filter(Boolean).join(' | '),
          subtitleHtml: subtitleElements.join(' | ')
        });
      });
    });
  }

  const parseSortTime = (item: any): number => {
    const t = (item.rawTime || item.time || '').trim().toLowerCase().replace(/\./g, '');
    if (!t) return Infinity;

    const match = t.match(/(\d{1,2}):(\d{2})\s*(a|p)/);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const isPm = match[3] === 'p';
      if (isPm && h !== 12) h += 12;
      if (!isPm && h === 12) h = 0;
      return h * 60 + m;
    }

    const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
    if (h24) {
      let h = parseInt(h24[1]);
      const m = parseInt(h24[2]);
      if (h >= 1 && h <= 6) h += 12;
      return h * 60 + m;
    }

    return Infinity;
  };

  unifiedSchedule.forEach((day: any) => {
    // Set the standardized title
    if (day.rawDateObj && day.rawDateObj.getTime() !== 0) {
      let fTitle = formatDayTitle(day.rawDateObj);
      if (day.dateGroupTitle) fTitle += `: ${day.dateGroupTitle}`;
      day.title = fTitle;
    } else if (!day.title) {
      day.title = 'Unknown Date';
    }

    if (day.items) {
      day.items.sort((a: any, b: any) => {
        const timeA = parseSortTime(a);
        const timeB = parseSortTime(b);
        return timeA - timeB;
      });
    }
  });

  // Sort days chronologically using the Date objects
  unifiedSchedule.sort((a: any, b: any) => {
    const timeA = a.rawDateObj ? a.rawDateObj.getTime() : 0;
    const timeB = b.rawDateObj ? b.rawDateObj.getTime() : 0;
    return timeA - timeB;
  });

  // --- Interleave events into sessions they chronologically interrupt ---
  unifiedSchedule.forEach((day: any) => {
    if (!day.items || day.items.length < 2) return;

    const eventsToRemove = new Set<number>();

    day.items.forEach((item: any, idx: number) => {
      if (item.type !== 'event') return;
      const eventTime = parseSortTime(item);

      for (const other of day.items) {
        if (other.type !== 'session' || !other.talks || other.talks.length < 2) continue;

        const firstTalkTime = parseSortTime(other.talks[0]);
        const lastTalkTime = parseSortTime(other.talks[other.talks.length - 1]);

        if (eventTime > firstTalkTime && eventTime < lastTalkTime) {
          // This event falls within this session — inject it into the talks array
          other.talks.push({
            type: 'event',
            time: item.time,
            rawTime: item.rawTime || item.time,
            title: item.title,
            subtitle: item.subtitle,
            subtitleHtml: item.subtitleHtml
          });
          other.talks.sort((a: any, b: any) => {
            const tA = parseSortTime(a);
            const tB = parseSortTime(b);
            return tA - tB;
          });
          eventsToRemove.add(idx);
          break;
        }
      }
    });

    if (eventsToRemove.size > 0) {
      day.items = day.items.filter((_: any, idx: number) => !eventsToRemove.has(idx));
    }
  });
  // --- End Unified Schedule Logic ---

  // --- SEO: JSON-LD Structured Data ---
  const jsonLd = generateArchiveJsonLd(data);

  // --- SEO: Summary stats for sr-only text ---
  const totalSessions = unifiedSchedule.reduce((acc: number, day: any) => acc + (day.items?.filter((i: any) => i.type === 'session').length || 0), 0);
  const totalTalks = unifiedSchedule.reduce((acc: number, day: any) => acc + (day.items?.reduce((tAcc: number, i: any) => tAcc + (i.type === 'session' && i.talks ? i.talks.filter((t: any) => t.type !== 'event').length : 0), 0) || 0), 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <Link href="/archive" className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors mb-8 w-fit">
        <ArrowLeft size={16} /> Back to Archives
      </Link>

      <div className="bg-surface border border-foreground/10 rounded-lg p-8 md:p-12 mb-12 relative">
        {/* Subtle background decoration contained safely without clipping hover previews */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 relative z-10">
          <div className="flex-1">
            <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 font-mono">
              {data.ordinal} Annual Workshop
            </span>
            
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              {data.title || `${data.ordinal} HEMS Workshop`}
            </h1>
            
            <p className="text-xl text-foreground/80 max-w-3xl mb-8 leading-relaxed">
              {data.tagline || `The ${data.ordinal} Workshop on Harsh-Environment Mass Spectrometry.`}
            </p>

            {/* SEO: Screen-reader-only summary for AI crawlers */}
            <p className="sr-only">
              The {data.ordinal} Workshop on Harsh-Environment Mass Spectrometry was held {data.dates || `in ${data.year}`}
              {data.address ? ` in ${data.address}` : ''}
              {data.venue ? ` at ${data.venue}` : ''}.
              The workshop featured {totalTalks} technical presentations across {totalSessions} sessions
              {data.sponsors?.length ? `, ${data.sponsors.length} corporate sponsors` : ''}
              {data.student_awards?.length ? `, and ${data.student_awards.length} student award ${data.student_awards.length === 1 ? 'recipient' : 'recipients'}` : ''}.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 text-foreground/70 font-medium border-b border-foreground/10 pb-8 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="text-secondary" size={20} />
                <time>{data.dates}</time>
              </div>
              <div className={`flex ${data.venue ? 'items-start' : 'items-center'} gap-3`}>
                <MapPin className={`text-secondary ${data.venue ? 'mt-1' : ''} flex-shrink-0`} size={20} />
                <span>
                  {data.venue && (
                    <>
                      {data.venue_url ? (
                        <a href={data.venue_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors font-bold">
                          {data.venue}
                        </a>
                      ) : (
                        <span className="font-bold">{data.venue}</span>
                      )}
                      <br/>
                    </>
                  )}
                  {data.venue_address_url ? (
                    <a href={data.venue_address_url} target="_blank" rel="noopener noreferrer" className={`${!data.venue ? 'font-bold' : 'text-sm font-normal'} text-foreground/50 hover:text-primary hover:underline transition-colors`}>
                      {data.address}
                    </a>
                  ) : (
                    <span className={`${!data.venue ? 'font-bold' : 'text-sm font-normal text-foreground/50'}`}>{data.address}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-shrink-0 items-center justify-center bg-white p-4 rounded-xl border border-foreground/10 shadow-lg mt-4 md:mt-12 w-[240px] lg:w-[270px]">
            <Image 
              src="/hemslogo.jpg" 
              alt="HEMS Logo" 
              width={255} 
              height={127} 
              className="object-contain w-full h-auto rounded" 
            />
          </div>
        </div>

        {data.host_corporation && data.host_corporation.name && (
          <div className="mb-12 border-t border-foreground/10 pt-8">
            <p className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-4 flex items-center gap-2">
              <Building size={16} /> Official Host
            </p>
            <a 
              href={data.host_corporation.url || '#'} 
              target={data.host_corporation.url ? "_blank" : undefined}
              rel={data.host_corporation.url ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-6 bg-surface border border-foreground/10 p-6 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
            >
              {data.host_corporation.logo_file && (
                <div className="bg-white rounded p-4 h-40 w-64 flex items-center justify-center flex-shrink-0 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={data.host_corporation.logo_file_url || `/images/sponsors/${data.host_corporation.logo_file}`}
                    alt={data.host_corporation.name} 
                    width={200} 
                    height={100}
                    className="object-contain max-h-full max-w-full" 
                  />
                </div>
              )}
              <div>
                <h4 className="font-bold text-foreground text-xl group-hover:text-primary transition-colors">{data.host_corporation.name}</h4>
                <span className="text-sm text-primary/80 font-bold tracking-wide uppercase">Workshop Host</span>
              </div>
            </a>
          </div>
        )}

          {data.resources && data.resources.length > 0 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-4">Workshop Resources</p>
              <div className="flex flex-wrap gap-4">
                {data.resources.map((res: any, idx: number) => {
                  const href = isLocal 
                    ? (res.local_target_path || (res.legacy_url || res.url))
                    : (res.public_website_url || (res.legacy_url || res.url));
                  if (!href) return null;
                  const isAnchor = href.startsWith('#');
                  const anchorElement = (
                    <a 
                      key={idx}
                      href={href} 
                      target={isAnchor ? undefined : "_blank"} 
                      rel={isAnchor ? undefined : "noopener noreferrer"}
                      className={`flex items-center gap-2 bg-surface border border-foreground/10 px-4 py-2 rounded-md transition-colors text-sm font-bold ${
                        idx === 0 ? 'hover:border-secondary hover:text-secondary' : 'hover:border-primary hover:text-primary'
                      }`}
                    >
                      {res.icon === 'Download' && <Download size={16} />}
                      {res.icon === 'Users' && <Users size={16} />}
                      {res.icon === 'Building' && <Building size={16} />}
                      {res.icon === 'FileText' && <FileText size={16} />}
                      {!['Download', 'Users', 'Building', 'FileText'].includes(res.icon) && <Download size={16} />}
                      {res.label}
                    </a>
                  );
                  return isAnchor ? anchorElement : (
                    <FrontendPreviewHover key={idx} href={href} title={res.label}>
                      {anchorElement}
                    </FrontendPreviewHover>
                  );
                })}
              </div>
            </div>
          )}

          {data.sponsors && data.sponsors.length > 0 && (
            <div className="mt-12 border-t border-foreground/10 pt-8">
              <p className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-4 flex items-center gap-2">
                <Building size={16} /> Corporate Sponsors
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[...data.sponsors].sort((a, b) => (parseInt(a.year) || 9999) - (parseInt(b.year) || 9999)).map((sponsor: any, idx: number) => {
                  const sponsorYear = parseInt(sponsor.year);
                  return (
                    <a 
                      key={idx}
                      href={sponsor.url || '#'}
                      target={sponsor.url ? "_blank" : undefined}
                      rel={sponsor.url ? "noopener noreferrer" : undefined}
                      className="bg-surface border border-foreground/10 p-2 rounded-lg flex items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="bg-white rounded p-[2px] h-12 w-20 flex items-center justify-center flex-shrink-0 shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={sponsor.image} 
                          alt={sponsor.name} 
                          width={80} 
                          height={40}
                          className="object-contain max-h-full max-w-full transition-all duration-300" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-xs leading-tight line-clamp-2 break-words group-hover:text-primary transition-colors">{sponsor.name}</h4>
                        {sponsorYear ? (
                          <div className="text-[10px] font-bold text-secondary/80 mt-0.5 uppercase tracking-wider">
                            {`Since ${sponsorYear}`}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {data.student_awards && data.student_awards.length > 0 && (
            <div className="mt-12 mb-12">
              <div className="bg-background border border-foreground/10 rounded-lg">
                <div className="px-4 py-5 flex flex-col gap-4 bg-primary/5 border-l-4 border-primary transition-colors">
                  <div className="flex-1">
                    <h4 className="font-bold text-primary text-lg flex items-center gap-2 mb-4">
                      <Award size={20} /> {data.student_awards.length === 1 ? 'Student Award' : 'Student Awards'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                      {data.student_awards.map((award: any, idx: number) => {
                        const presUrl = isLocal 
                          ? (award.local_target_path || (award.legacy_url || award.presentationUrl || award.url))
                          : (award.public_website_url || (award.legacy_url || award.presentationUrl || award.url));
                        const absUrl = isLocal 
                          ? (award.local_abstract_target_path || (award.legacy_abstract_url || award.abstractUrl || award.abstract_url))
                          : (award.public_abstract_url || (award.legacy_abstract_url || award.abstractUrl || award.abstract_url));
                        
                        return (
                          <div key={idx} className="flex flex-col">
                            {award.title && award.title.toLowerCase() !== 'student award' && (
                              <div className="text-base font-bold flex items-start gap-2 mb-1">
                                {presUrl ? (
                                  <FrontendPreviewHover href={presUrl} title={award.title}>
                                    <a href={presUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-words flex-1 leading-snug">{award.title}</a>
                                  </FrontendPreviewHover>
                                ) : (
                                  <span className="text-foreground/80 break-words flex-1 leading-snug">{award.title}</span>
                                )}
                              </div>
                            )}
                            
                            <div className={`text-sm mb-2 flex-1 ${(!award.title || award.title.toLowerCase() === 'student award') ? 'font-bold text-foreground text-base' : 'text-foreground/70'}`}>
                              {presUrl && (!award.title || award.title.toLowerCase() === 'student award') ? (
                                <FrontendPreviewHover href={presUrl} title={award.title || 'Student Award'}>
                                  <a href={presUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-words">{award.authors}</a>
                                </FrontendPreviewHover>
                              ) : (
                                award.authors
                              )}
                            </div>
                            {absUrl && (
                              <div className="text-xs">
                                <FrontendPreviewHover href={absUrl} title={award.title}>
                                  <a href={absUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-secondary/10 text-secondary px-2 py-1 rounded hover:bg-secondary/20 transition-colors">Abstract</a>
                                </FrontendPreviewHover>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Program Inline */}
        <div id="technical-program" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
            <FileText className="text-primary" /> Technical Program
          </h2>
          <div className="bg-background border border-foreground/10 rounded-lg">
            
            {unifiedSchedule.map((day: any, dIdx: number) => (
              <div key={dIdx} className="border-b border-foreground/10 last:border-0">
                <div className="bg-surface px-6 py-3 border-b border-foreground/10">
                  <h3 className="font-bold text-lg">{day.title}</h3>
                </div>
                <div className="divide-y divide-foreground/5">
                  
                  {day.items?.map((item: any, iIdx: number) => {
                    if (item.type === 'event') {
                      return (
                        <div key={iIdx} className="px-4 py-2 flex flex-col md:flex-row gap-4 hover:bg-surface/30 transition-colors border-l-4 border-transparent">
                          <div className="md:w-48 font-mono text-sm font-bold text-foreground flex-shrink-0 md:text-center">{item.time}</div>
                          <div>
                            <h4 className="font-bold inline">{item.title}</h4>
                            {(item.subtitleHtml || item.subtitle) && (
                              <span className="text-sm text-foreground/70 ml-2 font-normal" dangerouslySetInnerHTML={{ __html: item.subtitleHtml || item.subtitle }}></span>
                            )}
                          </div>
                        </div>
                      );
                    } else if (item.type === 'session') {
                      const isPlenary = item.title?.toLowerCase().includes('plenary');
                      const bgClass = isPlenary ? 'bg-secondary/5' : 'bg-primary/5';
                      const bgClassHeader = isPlenary ? 'bg-secondary/15' : 'bg-primary/15';
                      const borderClass = isPlenary ? 'border-secondary' : 'border-primary';
                      const textClass = isPlenary ? 'text-secondary' : 'text-primary';
                      const isPosterSession = item.title?.toLowerCase().includes('poster');

                      return (
                        <div key={iIdx} className={`border-l-4 ${borderClass} transition-colors`}>
                          {/* Session header row — distinct shade */}
                          <div className={`flex flex-col md:flex-row gap-4 px-4 py-3 ${bgClassHeader}`}>
                            <div className="md:w-48 font-mono text-sm font-bold text-foreground flex-shrink-0 md:text-center">{formatTime(item.time)}</div>
                            <div className="flex-1">
                              <h4 className={`font-bold ${textClass} text-lg`}>{item.title}</h4>
                            </div>
                          </div>

                          {/* Talk rows — lighter shade */}
                          <div className={`px-4 pb-3 pt-2 ${bgClass}`}>
                            <CollapsiblePosterList isPosterSession={isPosterSession} items={
                              item.talks?.map((talk: any, tIdx: number) => {
                                   // Render interleaved events (breaks, etc.) within the session
                                   if (talk.type === 'event') {
                                     return (
                                       <div key={tIdx} className="py-3 flex flex-col md:flex-row gap-4 items-center border-t border-b border-foreground/10 my-1">
                                         <div className="md:w-48 flex-shrink-0 md:text-center">
                                           <span className="font-mono text-sm font-bold text-foreground/70">{talk.time}</span>
                                         </div>
                                         <div className="flex-1 flex items-center gap-3">
                                           <div className="flex-1 h-px bg-foreground/10"></div>
                                           <h4 className="font-bold text-foreground/50 text-sm uppercase tracking-wider whitespace-nowrap">{talk.title}</h4>
                                           {(talk.subtitleHtml || talk.subtitle) && (
                                             <span className="text-xs text-foreground/40" dangerouslySetInnerHTML={{ __html: talk.subtitleHtml || talk.subtitle }}></span>
                                           )}
                                           <div className="flex-1 h-px bg-foreground/10"></div>
                                         </div>
                                       </div>
                                     );
                                   }
                                   let authorElements = null;

                                   if (Array.isArray(talk.authors) && talk.authors.length > 0) {
                                     // Check if any author has an institute reference
                                     const hasInstitutes = talk.authors.some((a: any) => a.institute);
                                     if (hasInstitutes) {
                                       // Group authors by institute
                                       const instituteMap: Record<string, any[]> = {};
                                       const noInstitute: any[] = [];
                                       for (const a of talk.authors) {
                                         if (a.institute) {
                                           if (!instituteMap[a.institute]) instituteMap[a.institute] = [];
                                           instituteMap[a.institute].push(a);
                                         } else {
                                           noInstitute.push(a);
                                         }
                                       }
                                       const groups: Array<{ institute: string | null; authors: any[] }> = [];
                                       Object.entries(instituteMap).forEach(([inst, auths]) => groups.push({ institute: inst, authors: auths }));
                                       if (noInstitute.length > 0) groups.push({ institute: null, authors: noInstitute });

                                       authorElements = (
                                         <span>
                                           {groups.map((grp, gIdx) => (
                                             <span key={gIdx} className="block">
                                               {grp.authors.map((a: any, i: number) => (
                                                 <span key={i}>
                                                   {a.isPresenter ? <span className="underline">{a.name}</span> : a.name}
                                                   {i < grp.authors.length - 1 ? ', ' : ''}
                                                 </span>
                                               ))}
                                               {grp.institute && <span className="italic">, {grp.institute}</span>}
                                             </span>
                                           ))}
                                         </span>
                                       );
                                     } else {
                                       // Flat list — no institutes assigned
                                       authorElements = talk.authors.map((a: any, i: number) => (
                                         <span key={i}>
                                           {a.isPresenter ? <span className="underline">{a.name}</span> : a.name}
                                           {i < talk.authors.length - 1 ? ', ' : ''}
                                         </span>
                                       ));
                                     }
                                   } else {
                                     // Fallback for legacy comma-separated string
                                     const authorParts = typeof talk.authors === 'string' ? talk.authors.split(',') : [];
                                     const firstAuthor = authorParts.length > 0 ? authorParts[0] : '';
                                     const restAuthors = authorParts.length > 1 ? ',' + authorParts.slice(1).join(',') : '';
                                     authorElements = (
                                       <>
                                         {firstAuthor && <span className="underline">{firstAuthor}</span>}
                                         {restAuthors}
                                       </>
                                     );
                                   }

                                   const presUrl = isLocal
                                     ? (talk.local_target_path || (talk.legacy_url || talk.presentationUrl || talk.url))
                                     : (talk.public_website_url || (talk.legacy_url || talk.presentationUrl || talk.url));
                                   const absUrl = isLocal
                                     ? (talk.local_abstract_target_path || (talk.legacy_abstract_url || talk.abstractUrl || talk.abstract_url))
                                     : (talk.public_abstract_url || (talk.legacy_abstract_url || talk.abstractUrl || talk.abstract_url));

                              return (
                                <div key={tIdx} className="py-2 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4">
                                  {/* Time — right-justified in the shared left column */}
                                  <div className="md:w-48 flex-shrink-0 md:text-right">
                                    {talk.time && !isPosterSession && (
                                      <span className="font-mono text-sm text-foreground/50 font-normal">{formatTime(talk.time)}</span>
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div className="flex-1">
                                    <div className="text-sm font-bold">
                                      {presUrl ? (
                                        <FrontendPreviewHover href={presUrl} title={talk.title}>
                                          <a href={presUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-words leading-snug">{talk.title}</a>
                                        </FrontendPreviewHover>
                                      ) : (
                                        <span className="text-foreground/60 break-words leading-snug">{talk.title}</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-foreground/70 mt-1">{authorElements}</p>
                                    {absUrl && (
                                      <div className="text-xs mt-1">
                                        <FrontendPreviewHover href={absUrl} title={talk.title}>
                                          <a href={absUrl} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Abstract</a>
                                        </FrontendPreviewHover>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })} />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                </div>
              </div>
            ))}
            
          </div>
        </div>
      </div>
    </>
  );
}
