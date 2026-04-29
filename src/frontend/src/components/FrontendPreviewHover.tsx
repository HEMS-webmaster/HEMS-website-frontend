"use client";

import React, { useState, useEffect } from 'react';

interface FrontendPreviewHoverProps {
  href?: string;
  title?: string;
  children: React.ReactNode;
}

export default function FrontendPreviewHover({ href, title, children }: FrontendPreviewHoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Determine if the URL is previewable (only GCloud and local endpoints have generated previews)
  const isPreviewable = href && href.includes('.pdf') && (href.includes('storage.googleapis.com') || href.includes('/api/manager/serve'));
  const isAbstract = href?.includes('_Abstract');

  useEffect(() => {
    if (isHovered && isPreviewable && !previewData && !error) {
      let previewUrl = '';
      
      // Handle the replacement safely depending on if it's a local /api/manager/serve link or a GCloud link
      if (isAbstract) {
        previewUrl = href.replace(/\.pdf$/, '_preview.txt').replace(/\.pdf&/, '_preview.txt&');
      } else {
        previewUrl = href.replace(/\.pdf$/, '_preview.png').replace(/\.pdf&/, '_preview.png&');
      }

      if (isAbstract) {
        fetch(previewUrl)
          .then(res => {
            if (!res.ok) throw new Error("No preview");
            return res.text();
          })
          .then(text => setPreviewData(text))
          .catch(() => setError(true));
      } else {
        // For images, preload via Image object to completely bypass CORS issues and cache it instantly
        const img = new window.Image();
        img.onload = () => {
          setPreviewData(previewUrl);
        };
        img.onerror = () => {
          setError(true);
        };
        img.src = previewUrl;
      }
    }
  }, [isHovered, isPreviewable, href, isAbstract, previewData, error]);

  if (!isPreviewable) {
    return <>{children}</>;
  }

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // We can choose to keep previewData cached or clear it to save memory. 
        // Keeping it cached is better for UX if they hover again.
      }}
    >
      {children}

      {isHovered && !error && (
        <div 
          className="absolute z-[100] left-0 bottom-full mb-2 w-[400px] bg-surface border border-foreground/20 rounded-lg shadow-2xl overflow-hidden p-4 animate-in fade-in zoom-in duration-200 origin-bottom-left"
          // Prevent the hover card from stealing pointer events so they can click the link underneath easily if they want
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-xs font-bold text-primary mb-3 uppercase tracking-widest border-b border-foreground/10 pb-2">
            {isAbstract ? "Abstract Preview (First 100 words)" : "Slide Preview"}
          </div>
          
          {title && isAbstract && (
            <div className="text-sm font-bold text-foreground mb-3 leading-tight">
              {title}
            </div>
          )}
          
          {!previewData ? (
            <div className="flex justify-center items-center py-8 text-foreground/50 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading Preview...
            </div>
          ) : isAbstract ? (
            <div className="text-sm text-foreground/80 leading-relaxed max-h-[300px] overflow-y-auto">
              "{previewData}"
            </div>
          ) : (
            <div className="bg-white rounded p-1 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewData} alt="Slide Preview" className="w-full h-auto object-contain max-h-[300px]" />
            </div>
          )}
        </div>
      )}
    </span>
  );
}
