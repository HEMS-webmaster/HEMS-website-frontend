"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  X,
  BookOpen,
  FileCode,
  Link,
  Bookmark,
  ExternalLink,
  Share2,
} from "lucide-react";
import { HEMS_LINKEDIN_GROUP_URL, SITE_URL } from "@/utils/seo";
import ScientificText from "@/components/workshop/ScientificText";
import {
  foldLatinDiacriticsToAscii,
  toBibTeXScientificText,
  toPlainScientificText,
} from "@/utils/unicodeText";

interface Author {
  name: string;
  isPresenter?: boolean;
  institute?: string;
}

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  authors: Author[];
  year: number;
  workshopName: string;
  location: string;
  id: string;
  type: "pres" | "poster";
}

export default function CitationModal({
  isOpen,
  onClose,
  title,
  authors,
  year,
  workshopName,
  location,
  id,
  type
}: CitationModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Formatting authors: "Short, T., Callahan, J." etc.
  const formatAuthorsAPA = (authorList: Author[]) => {
    if (!authorList || authorList.length === 0) return "Unknown Author";
    return authorList
      .map(author => {
        const parts = author.name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        const lastName = parts[parts.length - 1];
        const firstInit = parts[0].charAt(0).toUpperCase();
        return `${lastName}, ${firstInit}.`;
      })
      .join(", ");
  };

  const formatAuthorsBibTeX = (authorList: Author[]) => {
    if (!authorList || authorList.length === 0) return "Unknown Author";
    return authorList.map(a => a.name).join(" and ");
  };

  const plainTitle = toPlainScientificText(title);
  const bibtexTitle = toBibTeXScientificText(title);

  // Generate Cite Keys (e.g. short1999mass, hohn2018optimized)
  const generateCiteKey = () => {
    const primaryAuthor = foldLatinDiacriticsToAscii(authors[0]?.name || "unknown");
    const lastName = primaryAuthor.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "unknown";
    const firstWord = foldLatinDiacriticsToAscii(plainTitle).trim().split(/\s+/)[0]?.toLowerCase() || "untitled";
    return `${lastName}${year}${firstWord.replace(/[^a-z0-9]/g, "") || "paper"}`;
  };

  const baseOrigin = origin || SITE_URL;
  const permalink = `${baseOrigin}/archive/${year}/#${id}`;
  const trackedShareUrl = `${SITE_URL}/archive/${year}/?src=linkedin-archive-share#${id}`;

  const authorNames =
    authors.length > 0 ? authors.map((a) => a.name).join(", ") : "HEMS Workshop Authors";
  const linkedinPostDraft = `From the HEMS Proceedings Archive (${year}): "${plainTitle}" by ${authorNames} — presented at the ${workshopName} (${location}).\n\nExplore the open-access proceedings & slide archive: ${trackedShareUrl}\n\n#MassSpectrometry #HarshEnvironmentMS #AnalyticalChemistry #FieldScience #HEMSWorkshop`;
  const linkedinShareHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    trackedShareUrl
  )}`;

  const apaCitation = `${formatAuthorsAPA(authors)} (${year}). ${plainTitle}. Presented at the ${workshopName}, ${location}. URL: ${permalink}`;

  const bibtexCitation = `@inproceedings{${generateCiteKey()},
  author    = {${formatAuthorsBibTeX(authors)}},
  title     = {${bibtexTitle}},
  booktitle = {Proceedings of the ${workshopName}},
  year      = {${year}},
  address   = {${location}},
  url       = {${permalink}}
}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-surface border border-foreground/10 w-full max-w-2xl rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[90dvh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <Bookmark className="text-primary" size={22} />
            <h3 className="text-lg font-bold text-foreground">Cite &amp; Share Presentation</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close citation modal"
            className="text-foreground/40 hover:text-foreground/80 p-2 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2">
          {/* Metadata preview card */}
          <div className="bg-foreground/5 p-4 rounded-xl border border-foreground/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
              {type === "pres" ? "Oral Presentation" : "Poster"}
            </span>
            <h4 className="font-bold text-foreground leading-snug">
              <ScientificText text={title} />
            </h4>
            <p className="text-xs text-foreground/60">{authors.map((a) => a.name).join(", ")}</p>
            <p className="text-[11px] text-foreground/45 mt-2 font-medium">
              {workshopName} • {location} ({year})
            </p>
          </div>

          {/* Share on LinkedIn / Ready-to-Post Blurb */}
          <div className="space-y-2.5 bg-background border border-foreground/10 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground/75 flex items-center gap-1.5">
                <Share2 size={14} className="text-[#0A66C2]" /> Share on LinkedIn / Ready-to-Post Blurb
              </span>
              <button
                type="button"
                onClick={() => handleCopy(linkedinPostDraft, "linkedin")}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedField === "linkedin" ? (
                  <>
                    <Check size={12} /> Copied Draft!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy Post Draft
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-surface border border-foreground/10 rounded-lg text-xs leading-relaxed text-foreground/90 font-sans whitespace-pre-line break-words select-all select-text">
              {linkedinPostDraft}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <a
                href={linkedinShareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#0A66C2] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#09539E] transition-colors"
              >
                <span>Share to LinkedIn Feed</span>
                <ExternalLink size={12} />
              </a>
              <a
                href={HEMS_LINKEDIN_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-surface border border-foreground/15 text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-[#0A66C2]/50 hover:text-[#0A66C2] transition-colors"
              >
                <span>Open HEMS LinkedIn Group</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* APA Format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground/60 flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" /> APA Citation
              </span>
              <button
                onClick={() => handleCopy(apaCitation, "apa")}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedField === "apa" ? (
                  <>
                    <Check size={12} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-background border border-foreground/10 rounded-lg text-xs leading-relaxed text-foreground/90 font-sans break-words select-all select-text">
              {apaCitation}
            </div>
          </div>

          {/* BibTeX Format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground/60 flex items-center gap-1.5">
                <FileCode size={14} className="text-primary" /> BibTeX Entry
              </span>
              <button
                onClick={() => handleCopy(bibtexCitation, "bibtex")}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedField === "bibtex" ? (
                  <>
                    <Check size={12} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-background border border-foreground/10 rounded-lg text-xs leading-relaxed text-foreground/90 overflow-x-auto font-sans whitespace-pre-wrap break-words select-all select-text">
              {bibtexCitation}
            </pre>
          </div>

          {/* Identifier / Permalink */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground/60 flex items-center gap-1.5">
                <Link size={14} className="text-primary" /> Permanent Link (Permalink)
              </span>
              <button
                onClick={() => handleCopy(permalink, "permalink")}
                className="text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                {copiedField === "permalink" ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="p-2.5 bg-background border border-foreground/10 rounded-lg text-xs font-sans truncate text-foreground/75 select-all">
              {permalink}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-foreground/5 mt-4">
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-xs hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
