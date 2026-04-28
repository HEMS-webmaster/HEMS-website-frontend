import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, FileText, Download, Building, ArrowLeft, Award } from "lucide-react";
import { notFound } from "next/navigation";
import path from "path";
import { promises as fs } from "fs";

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

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <Link href="/archive" className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors mb-8 w-fit">
        <ArrowLeft size={16} /> Back to Archives
      </Link>

      <div className="bg-surface border border-foreground/10 rounded-lg p-8 md:p-12 mb-12 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 font-mono">
          {data.ordinal} Annual Workshop
        </span>
        
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-6">
          {data.year} HEMS Workshop
        </h1>
        
        <p className="text-xl text-foreground/80 max-w-3xl mb-8 leading-relaxed">
          The {data.ordinal} Workshop on Harsh-Environment Mass Spectrometry.
        </p>

          <div className="flex flex-col sm:flex-row gap-6 text-foreground/70 font-medium border-b border-foreground/10 pb-8 mb-8">
            <div className="flex items-center gap-3">
              <Calendar className="text-secondary" size={20} />
              <span>{data.dates}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-secondary mt-1 flex-shrink-0" size={20} />
              <span>
                {data.venue_url ? (
                  <a href={data.venue_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors font-bold">
                    {data.venue}
                  </a>
                ) : (
                  <span className="font-bold">{data.venue}</span>
                )}
                <br/>
                <span className="text-sm font-normal text-foreground/50">{data.address}</span>
              </span>
            </div>
          </div>

          {data.resources && data.resources.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-4">Workshop Resources</h3>
              <div className="flex flex-wrap gap-4">
                {data.resources.map((res: any, idx: number) => {
                  const href = isLocal && res.local_target_path ? res.local_target_path : (res.public_website_url || res.legacy_url || res.url);
                  const isAnchor = href?.startsWith('#');
                  return (
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
                })}
              </div>
            </div>
          )}

          {data.sponsors && data.sponsors.length > 0 && (
            <div className="mt-12 border-t border-foreground/10 pt-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-6 flex items-center gap-2">
                <Building size={16} /> Corporate Sponsors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...data.sponsors].sort((a, b) => (parseInt(a.year) || 9999) - (parseInt(b.year) || 9999)).map((sponsor: any, idx: number) => {
                  const sponsorYear = parseInt(sponsor.year);
                  const yearsSince = sponsorYear ? new Date().getFullYear() - sponsorYear : 0;
                  return (
                    <a 
                      key={idx}
                      href={sponsor.url || '#'}
                      target={sponsor.url ? "_blank" : undefined}
                      rel={sponsor.url ? "noopener noreferrer" : undefined}
                      className="bg-surface border border-foreground/10 p-4 rounded-lg flex items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="bg-white rounded p-2 h-16 w-24 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Image 
                          src={sponsor.image} 
                          alt={sponsor.name} 
                          width={80} 
                          height={40}
                          className="object-contain max-h-full max-w-full transition-all duration-300" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{sponsor.name}</h4>
                        {sponsorYear ? (
                          <div className="text-xs font-bold text-secondary/80 mt-1 uppercase tracking-wider">
                            {yearsSince > 0 ? `${yearsSince} Year Sponsor` : 'New Sponsor'}
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
            <div className="mt-12 border-t border-foreground/10 pt-8 mb-12">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-6 flex items-center gap-2">
                <Award size={16} /> Student Presenters
              </h3>
              <div className="bg-background border border-foreground/10 rounded-lg overflow-hidden divide-y divide-foreground/5">
                {data.student_awards.map((award: any, idx: number) => {
                  const presUrl = isLocal && award.local_target_path ? award.local_target_path : (award.public_website_url || award.legacy_url || award.presentationUrl);
                  const absUrl = isLocal && award.local_abstract_target_path ? award.local_abstract_target_path : (award.public_abstract_url || award.legacy_abstract_url || award.abstractUrl);
                  
                  return (
                    <div key={idx} className="px-6 py-4 flex flex-col hover:bg-surface/30 transition-colors">
                      <p className="text-base font-bold flex items-start gap-2">
                        {presUrl ? (
                          <a href={presUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-words flex-1 leading-snug">{award.title}</a>
                        ) : (
                          <span className="text-foreground/80 break-words flex-1 leading-snug">{award.title}</span>
                        )}
                      </p>
                      <p className="text-sm text-foreground/70 mt-1">
                        {award.authors}
                      </p>
                      {absUrl && (
                        <p className="text-xs mt-2">
                          <a href={absUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-secondary/10 text-secondary px-2 py-1 rounded hover:bg-secondary/20 transition-colors">Abstract</a>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Technical Program Inline */}
        <div id="technical-program" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
            <FileText className="text-primary" /> Technical Program
          </h2>
          
          <div className="bg-background border border-foreground/10 rounded-lg overflow-hidden">
            
            {data.schedule?.map((day: any, dIdx: number) => (
              <div key={dIdx} className="border-b border-foreground/10 last:border-0">
                <div className="bg-surface px-6 py-4 border-b border-foreground/10">
                  <h3 className="font-bold text-lg">{day.title}</h3>
                </div>
                <div className="divide-y divide-foreground/5">
                  
                  {day.items?.map((item: any, iIdx: number) => {
                    if (item.type === 'event') {
                      return (
                        <div key={iIdx} className="px-4 py-3 flex flex-col md:flex-row gap-4 hover:bg-surface/30 transition-colors border-l-4 border-transparent">
                          <div className="md:w-32 font-mono text-sm font-bold text-foreground flex-shrink-0">{item.time}</div>
                          <div>
                            <h4 className="font-bold">{item.title}</h4>
                            <p className="text-sm text-foreground/70 mt-1">{item.subtitle}</p>
                          </div>
                        </div>
                      );
                    } else if (item.type === 'session') {
                      const isPlenary = item.title?.toLowerCase().includes('plenary');
                      const bgClass = isPlenary ? 'bg-secondary/5' : 'bg-primary/5';
                      const borderClass = isPlenary ? 'border-secondary' : 'border-primary';
                      const textClass = isPlenary ? 'text-secondary' : 'text-primary';

                      return (
                        <div key={iIdx} className={`px-4 py-4 flex flex-col md:flex-row gap-4 ${bgClass} border-l-4 ${borderClass} transition-colors`}>
                          <div className="md:w-32 font-mono text-sm font-bold text-foreground flex-shrink-0">{item.time}</div>
                          <div className="flex-1">
                            <h4 className={`font-bold ${textClass} text-lg`}>{item.title}</h4>
                            <div className="mt-3 divide-y divide-primary/10">
                              
                              {item.talks?.map((talk: any, tIdx: number) => {
                                let authorElements = null;
                                
                                if (Array.isArray(talk.authors)) {
                                  authorElements = talk.authors.map((a: any, i: number) => (
                                    <span key={i}>
                                      {a.isPresenter ? <span className="underline">{a.name}</span> : a.name}
                                      {i < talk.authors.length - 1 ? ', ' : ''}
                                    </span>
                                  ));
                                } else {
                                  // Fallback for legacy comma-separated string if not migrated
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

                                const presUrl = isLocal && talk.local_target_path ? talk.local_target_path : (talk.public_website_url || talk.legacy_url || talk.presentationUrl);
                                const absUrl = isLocal && talk.local_abstract_target_path ? talk.local_abstract_target_path : (talk.public_abstract_url || talk.legacy_abstract_url || talk.abstractUrl);

                                return (
                                  <div key={tIdx} className="py-3 first:pt-0 last:pb-0">
                                    <p className="text-sm font-bold flex items-start gap-2">
                                      {talk.time && <span className="text-foreground/50 font-mono font-normal flex-shrink-0 mt-0.5">{talk.time}</span>}
                                      {presUrl ? (
                                        <a href={presUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-words flex-1 leading-snug">{talk.title}</a>
                                      ) : (
                                        <span className="text-foreground/60 break-words flex-1 leading-snug">{talk.title}</span>
                                      )}
                                    </p>
                                    <p className="text-sm text-foreground/70 mt-1">
                                      {authorElements}
                                    </p>
                                    {absUrl && (
                                      <p className="text-xs mt-1">
                                        <a href={absUrl} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Abstract</a>
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                              
                            </div>
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
  );
}
