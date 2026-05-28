"use client";

import React, { useState, useEffect } from 'react';

interface PreviewHoverProps {
  fileName: string;
  wsNum: string;
  session: string;
  title?: string;
  children?: React.ReactNode;
}

export default function PreviewHover({ fileName, wsNum, session, title, children }: PreviewHoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const cleanSession = session.replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_');
  const wsOrdinal = `${wsNum}${getOrdinalSuffix(parseInt(wsNum))}`;
  const relativePath = `${wsOrdinal}/${cleanSession}/${fileName}`;
  const isAbstract = fileName.includes('_Abstract.pdf');

  useEffect(() => {
    if (isHovered && !previewData && !error) {
      // Fetch preview with cache-buster
      const url = `/api/manager/preview?file=${encodeURIComponent(relativePath)}&t=${Date.now()}`;
      if (isAbstract) {
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error("No preview");
            return res.text();
          })
          .then(text => setPreviewData(text))
          .catch(() => setError(true));
      } else {
        // For images, we can just use the URL directly in an img tag, 
        // but we can check if it exists first
        fetch(url, { method: 'HEAD' })
          .then(res => {
            if (!res.ok) throw new Error("No preview");
            setPreviewData(url); // Store the URL to use in src
          })
          .catch(() => setError(true));
      }
    }
  }, [isHovered, relativePath, isAbstract, previewData, error]);

  return (
    <div 
      className="relative inline-block ml-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPreviewData(null);
        setError(false);
      }}
    >
      {children ? children : (
        <span className="cursor-help border-b border-dashed border-green-400 hover:text-green-300">
          {fileName}
        </span>
      )}

      {isHovered && !error && (
        <div className="absolute z-50 left-0 bottom-full mb-2 w-[400px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden p-3 animate-in fade-in zoom-in duration-200 origin-bottom-left">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider border-b border-slate-700 pb-1">
            {isAbstract ? "Abstract Preview (First 100 words)" : "Slide Preview"}
          </div>
          
          {title && isAbstract && (
            <div className="text-sm font-bold text-sky-400 mb-2 leading-tight">
              {title}
            </div>
          )}
          
          {!previewData ? (
            <div className="flex justify-center items-center py-8 text-slate-500 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading Preview...
            </div>
          ) : isAbstract ? (
            <div className="text-sm text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto">
              "{previewData}"
            </div>
          ) : (
            <div className="bg-slate-900 rounded p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewData} alt="Slide Preview" className="w-full h-auto object-contain max-h-[300px]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
