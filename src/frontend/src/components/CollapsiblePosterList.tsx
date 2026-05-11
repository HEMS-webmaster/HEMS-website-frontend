"use client";

import React, { useState } from 'react';

export default function CollapsiblePosterList({ 
  isPosterSession, 
  items 
}: { 
  isPosterSession: boolean;
  items: React.ReactNode[];
}) {
  const [expanded, setExpanded] = useState(false);
  
  if (!isPosterSession || !items || items.length <= 4) {
    return <>{items}</>;
  }

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-primary/10">
        {expanded ? items : items.slice(0, 4)}
      </div>
      <div className="mt-4">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-sm font-bold text-primary hover:bg-primary/10 transition-colors flex items-center justify-center w-full py-2 bg-primary/5 rounded border border-primary/20"
        >
          {expanded ? "Hide Posters" : `View ${items.length - 4} More Posters...`}
        </button>
      </div>
    </div>
  );
}
