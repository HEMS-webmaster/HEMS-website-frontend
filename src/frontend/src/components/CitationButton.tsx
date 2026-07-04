"use client";

import React, { useState } from "react";
import { Bookmark } from "lucide-react";
import CitationModal from "./CitationModal";

interface Author {
  name: string;
  isPresenter?: boolean;
  institute?: string;
}

interface CitationButtonProps {
  title: string;
  authors: Author[];
  year: number;
  workshopName: string;
  location: string;
  id: string;
  type: "pres" | "poster";
}

export default function CitationButton(props: CitationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-foreground/40 hover:text-primary transition-colors cursor-pointer border border-foreground/10 hover:border-primary/30 px-1.5 py-0.5 rounded bg-foreground/5 hover:bg-primary/5 hover:scale-[1.03] active:scale-[0.97] transition-all ml-2"
        title="Cite this work"
      >
        <Bookmark size={10} /> Cite
      </button>

      {isOpen && (
        <CitationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          {...props}
        />
      )}
    </>
  );
}
