"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, FileText, Filter, Download, RotateCcw, X, ArrowRight, ExternalLink, Database } from "lucide-react";
import workshopsData from "@/data/master_workshops.json";
import scientificSynonyms from "@/data/scientific_synonyms.json";
import DownloadGate from "@/components/DownloadGate";
import FrontendPreviewHover from "@/components/FrontendPreviewHover";

// Read Algolia credentials from environment variables
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";

interface MasterWorkshopSummary {
  number?: number | string;
  year?: number | string;
  title?: string;
}

interface BrowseWorkshopCard {
  id: number;
  year: number;
  title: string;
  url: string;
}

interface IndexedAuthorDetail {
  name: string;
  institute?: string;
  isPresenter?: boolean;
}

interface ArchiveIndexEntry {
  id?: string;
  canonical_url?: string;
  title: string;
  authors: string[];
  author_details?: IndexedAuthorDetail[];
  institutions: string[];
  workshop_year: number | string;
  workshop_ordinal: number;
  workshop_ordinal_label?: string;
  workshop_location?: string;
  session_title: string;
  type: "presentation" | "poster";
  presentation_url: string;
  abstract_url: string;
  citation?: string;
}

function formatOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

export default function ArchiveHubClient() {
  const pastWorkshops = useMemo<BrowseWorkshopCard[]>(() => {
    return (workshopsData as MasterWorkshopSummary[])
      .map((ws) => {
        const num = Number(ws.number);
        const yr = Number(ws.year);
        return {
          id: Number.isFinite(num) && num > 0 ? num : yr,
          year: yr,
          title: ws.title || `${formatOrdinal(num)} HEMS Workshop`,
          url: `/archive/${yr}/`,
        };
      })
      .filter((ws) => Number.isFinite(ws.year) && ws.year > 0)
      .sort((a, b) => b.year - a.year);
  }, []);
  const SEARCH_DEBOUNCE_MS = 2500;

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [enableDeepPdfSearch, setEnableDeepPdfSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeYearEra, setActiveYearEra] = useState("All");
  const [displayLimit, setDisplayLimit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [enableSynonyms, setEnableSynonyms] = useState(true);
  const [searchMode, setSearchMode] = useState<"metadata" | "algolia" | "mock_chunks">("metadata");
  
  // Local fallback database of page-level slide and abstract text chunks
  const [mockChunks, setMockChunks] = useState<any[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<ArchiveIndexEntry[]>([]);
  const [isSearchingDeep, setIsSearchingDeep] = useState(false);

  // Debounce keystrokes by 2.5s so partial words don't trigger redundant scans or chunk downloads
  useEffect(() => {
    const nextTrimmed = searchInput.trim();
    if (!nextTrimmed) {
      if (searchQuery !== "") {
        setSearchQuery("");
      }
      return;
    }
    if (searchInput === searchQuery) return;
    const timerId = window.setTimeout(() => {
      setSearchQuery(searchInput);
      setDisplayLimit(25);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timerId);
  }, [searchInput, searchQuery]);

  const commitSearchNow = (explicitQuery?: string) => {
    const target = explicitQuery !== undefined ? explicitQuery : searchInput;
    setSearchInput(target);
    setSearchQuery(target);
    setDisplayLimit(25);
  };

  // Hydrate enriched proceedings catalog (with verified GCS PDFs & #anchor deep links)
  useEffect(() => {
    fetch("/archives-index.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ArchiveIndexEntry[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalogEntries(data);
        }
      })
      .catch(() => {
        // Fallback to static master_workshops.json if offline
      });
  }, []);

  const suggestedKeywords = ["Martian Regolith", "Deep Sea Vent", "Quadrupole", "Miniaturization"];

  // Dynamically build a dictionary of ~1,000 highly relevant HEMS technical terms for typo detection
  const HEMS_DICTIONARY = useMemo(() => {
    const words = new Set<string>();
    
    // Add all scientific synonyms
    Object.values(scientificSynonyms).forEach((groupValues) => {
      groupValues.forEach((val) => words.add(val.toLowerCase()));
    });
    
    // Helper to clean and add strings
    const cleanAndAdd = (str: string) => {
      if (!str) return;
      str.toLowerCase().split(/[\s,.:()"\-/]+/).forEach(w => {
        if (w.length > 3 && /^[a-z]+$/.test(w)) {
          words.add(w);
        }
      });
    };
    
    // Add terms from workshops titles, authors, and institutions
    workshopsData.forEach((ws: any) => {
      if (ws.presentation_sessions) {
        ws.presentation_sessions.forEach((session: any) => {
          cleanAndAdd(session.session_title);
          if (session.presentations) {
            session.presentations.forEach((talk: any) => {
              cleanAndAdd(talk.title);
              if (Array.isArray(talk.authors)) {
                talk.authors.forEach((a: any) => cleanAndAdd(a.name));
              } else if (typeof talk.authors === 'string') {
                cleanAndAdd(talk.authors);
              }
              if (Array.isArray(talk.institutes)) {
                talk.institutes.forEach((inst: string) => cleanAndAdd(inst));
              }
            });
          }
        });
      }
      
      if (ws.posters) {
        ws.posters.forEach((poster: any) => {
          cleanAndAdd(poster.title);
          if (Array.isArray(poster.authors)) {
            poster.authors.forEach((a: any) => cleanAndAdd(a.name));
          } else if (typeof poster.authors === 'string') {
            cleanAndAdd(poster.authors);
          }
          if (Array.isArray(poster.institutes)) {
            poster.institutes.forEach((inst: string) => cleanAndAdd(inst));
          }
        });
      }
    });
    
    return Array.from(words);
  }, []);

  // Compute Levenshtein distance between two strings for spelling similarity checking
  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return matrix[a.length][b.length];
  };

  // Generate suggested query string if potential spelling typos are encountered
  const spellingSuggestion = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    // Spellcheck tokens only (filtering exclusions and exact phrases)
    const words = searchQuery.toLowerCase().trim()
      .replace(/"[^"]+"/g, "")
      .split(/\s+/)
      .map(w => w.replace(/^-/, ""))
      .filter(w => w.length > 3 && /^[a-z]+$/.test(w));
      
    if (words.length === 0) return null;
    
    const suggestions: Record<string, string> = {};
    let hasCorrection = false;
    
    words.forEach(word => {
      if (HEMS_DICTIONARY.includes(word)) {
        suggestions[word] = word;
        return;
      }
      
      let closestWord = word;
      let minDistance = 3; // Match threshold distance <= 2
      
      for (const dictWord of HEMS_DICTIONARY) {
        const dist = getLevenshteinDistance(word, dictWord);
        if (dist < minDistance) {
          minDistance = dist;
          closestWord = dictWord;
        }
      }
      
      if (closestWord !== word) {
        suggestions[word] = closestWord;
        hasCorrection = true;
      } else {
        suggestions[word] = word;
      }
    });
    
    if (!hasCorrection) return null;
    
    // Reconstruct query with corrected terms
    const parts = searchQuery.split(/\s+/);
    const correctedParts = parts.map(part => {
      const clean = part.toLowerCase().replace(/^-/, "").replace(/"/g, "");
      if (suggestions[clean]) {
        const isNeg = part.startsWith("-");
        const hasQuotes = part.startsWith('"') && part.endsWith('"');
        let term = suggestions[clean];
        if (hasQuotes) term = `"${term}"`;
        return (isNeg ? "-" : "") + term;
      }
      return part;
    });
    
    return correctedParts.join(" ");
  }, [searchQuery, HEMS_DICTIONARY]);

  // Query operators parser: exact phrase quotes ("phrase") and excludes (-term)
  const queryTerms = useMemo(() => {
    const exactPhrases: string[] = [];
    const excludedTerms: string[] = [];
    const normalKeywords: string[] = [];
    
    if (!searchQuery.trim()) {
      return { exactPhrases, excludedTerms, normalKeywords };
    }
    
    let workingQuery = searchQuery.toLowerCase().trim();
    
    // Extract exact phrases
    const quoteRegex = /"([^"]+)"/g;
    let match;
    while ((match = quoteRegex.exec(workingQuery)) !== null) {
      exactPhrases.push(match[1].trim());
    }
    workingQuery = workingQuery.replace(/"[^"]+"/g, " ");
    
    // Extract exclusions and standard keywords
    const tokens = workingQuery.split(/\s+/).filter(Boolean);
    tokens.forEach(token => {
      if (token.startsWith("-") && token.length > 1) {
        excludedTerms.push(token.slice(1));
      } else {
        normalKeywords.push(token);
      }
    });
    
    return { exactPhrases, excludedTerms, normalKeywords };
  }, [searchQuery]);

  // Initialize Algolia search client if credentials are set
  const algoliaIndex = useMemo(() => {
    if (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) {
      try {
        const { algoliasearch } = require("algoliasearch");
        const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
        return client;
      } catch (e) {
        console.error("Failed to initialize Algolia client library:", e);
      }
    }
    return null;
  }, []);

  // Fetch the 13.56 MB page-level PDF content index ONLY when user explicitly opts in
  useEffect(() => {
    if (!enableDeepPdfSearch) {
      setIsSearchingDeep(false);
      setSearchMode("metadata");
      return;
    }

    if (searchQuery.trim().length > 0 && mockChunks.length === 0 && !algoliaIndex) {
      setIsSearchingDeep(true);
      fetch("/mock-pdf-chunks.json")
        .then((res) => res.json())
        .then((data) => {
          setMockChunks(data);
          setSearchMode("mock_chunks");
          setIsSearchingDeep(false);
        })
        .catch((err) => {
          console.error("Failed to load local HEMS PDF content database fallback:", err);
          setIsSearchingDeep(false);
        });
    } else if (algoliaIndex && searchQuery.trim().length > 0) {
      setSearchMode("algolia");
    } else if (mockChunks.length > 0 && searchQuery.trim().length > 0) {
      setSearchMode("mock_chunks");
    } else {
      setSearchMode("metadata");
    }
  }, [enableDeepPdfSearch, searchQuery, mockChunks.length, algoliaIndex]);

  const isSearchActive = searchQuery.trim().length > 0 || activeCategory !== "All" || activeYearEra !== "All";

  // Helper function to extract related synonyms for query expansion
  const getExpandedTerms = useMemo(() => {
    return (keyword: string) => {
      const terms = new Set<string>([keyword]);
      if (!enableSynonyms) return Array.from(terms);

      Object.entries(scientificSynonyms).forEach(([groupName, groupValues]) => {
        const lowerGroupValues = groupValues.map(v => v.toLowerCase());
        const lowerGroupName = groupName.toLowerCase();
        
        if (lowerGroupName === keyword || lowerGroupValues.includes(keyword)) {
          terms.add(lowerGroupName);
          lowerGroupValues.forEach(v => terms.add(v));
        }
      });
      return Array.from(terms);
    };
  }, [enableSynonyms]);

  // Flatten all presentations and posters for standard metadata queries
  const allPapers = useMemo(() => {
    if (catalogEntries.length > 0) {
      return catalogEntries.map((entry) => {
        const yrNum = Number(entry.workshop_year);
        const ordLabel = entry.workshop_ordinal_label || formatOrdinal(entry.workshop_ordinal);
        return {
          id: entry.id || "",
          type: entry.type,
          workshopYear: Number.isFinite(yrNum) ? yrNum : entry.workshop_year,
          workshopOrdinal: entry.workshop_ordinal,
          workshopTitle: `${ordLabel} HEMS Workshop (${entry.workshop_year})`,
          sessionTitle: entry.session_title || "Oral Session",
          title: entry.title || "",
          authors:
            entry.author_details && entry.author_details.length > 0
              ? entry.author_details
              : entry.authors || [],
          presenter: "",
          institutes: entry.institutions || [],
          presentationUrl: entry.presentation_url || "",
          abstractUrl: entry.abstract_url || "",
        };
      });
    }

    const papers: any[] = [];
    workshopsData.forEach((ws: any) => {
      const yrNum = Number(ws.year);
      const wsTitle = `${formatOrdinal(Number(ws.number))} HEMS Workshop (${ws.year})`;

      // Extract regular presentations
      if (ws.presentation_sessions && Array.isArray(ws.presentation_sessions)) {
        ws.presentation_sessions.forEach((session: any) => {
          if (session.presentations && Array.isArray(session.presentations)) {
            session.presentations.forEach((talk: any) => {
              papers.push({
                id: talk.id || "",
                type: "presentation",
                workshopYear: Number.isFinite(yrNum) ? yrNum : ws.year,
                workshopOrdinal: Number(ws.number),
                workshopTitle: wsTitle,
                sessionTitle: session.session_title || session.title || "Oral Session",
                title: talk.title || "",
                authors: talk.authors || [],
                presenter: talk.presenter || "",
                institutes: talk.institutes || [],
                presentationUrl: talk.public_website_url || "",
                abstractUrl: talk.public_abstract_url || "",
              });
            });
          }
        });
      }

      // Extract posters
      if (ws.posters && Array.isArray(ws.posters)) {
        ws.posters.forEach((poster: any) => {
          papers.push({
            id: poster.id || "",
            type: "poster",
            workshopYear: Number.isFinite(yrNum) ? yrNum : ws.year,
            workshopOrdinal: Number(ws.number),
            workshopTitle: wsTitle,
            sessionTitle: "Poster Session",
            title: poster.title || "",
            authors: poster.authors || [],
            presenter: poster.presenter || "",
            institutes: poster.institutes || [],
            presentationUrl: poster.public_website_url || "",
            abstractUrl: poster.public_abstract_url || "",
          });
        });
      }
    });
    return papers;
  }, [catalogEntries]);

  // Match full-text paper contents (either via local chunks database or live Algolia indexing)
  const fullTextSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const { exactPhrases, excludedTerms, normalKeywords } = queryTerms;
    let matchedChunks: any[] = [];

    // Mode A: Local mock PDF chunks database fallback
    if (searchMode === "mock_chunks" && mockChunks.length > 0) {
      matchedChunks = mockChunks.map((chunk) => {
        let chunkScore = 0;
        let isMatched = false;

        const authorsStr = Array.isArray(chunk.authors) ? chunk.authors.join(" ") : String(chunk.authors || "");
        const institutionsStr = Array.isArray(chunk.institutions) ? chunk.institutions.join(" ") : String(chunk.institutions || "");
        const combinedText = `${chunk.title} ${chunk.text_content} ${authorsStr} ${institutionsStr}`.toLowerCase();

        // 1. Enforce Exclude Operators (-exclude)
        const hasExcluded = excludedTerms.some(term => {
          const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}`, "i");
          return regex.test(combinedText);
        });
        if (hasExcluded) return { ...chunk, relevanceScore: 0, isMatched: false };

        // 2. Enforce Exact Phrase Quotes ("phrase")
        const hasAllExact = exactPhrases.every(phrase => {
          return combinedText.includes(phrase);
        });
        if (exactPhrases.length > 0 && !hasAllExact) return { ...chunk, relevanceScore: 0, isMatched: false };

        // Exact phrases match without normal keywords
        if (exactPhrases.length > 0 && normalKeywords.length === 0) {
          let phraseScore = 0;
          exactPhrases.forEach(phrase => {
            if (chunk.title.toLowerCase().includes(phrase)) phraseScore += 10;
            if (chunk.text_content.toLowerCase().includes(phrase)) phraseScore += 5;
            if (authorsStr.toLowerCase().includes(phrase)) phraseScore += 8;
          });
          return { ...chunk, relevanceScore: phraseScore || 1, isMatched: true };
        }

        // 3. Match Normal Keywords with Synonym Expansion
        if (normalKeywords.length > 0) {
          normalKeywords.forEach((keyword) => {
            const expandedTerms = getExpandedTerms(keyword);
            
            expandedTerms.forEach((term) => {
              const isExact = term === keyword;
              let pattern = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
              if (term.length > 3 && term.endsWith('s') && !term.endsWith('ss')) {
                const stem = term.slice(0, -1);
                const escapedStem = stem.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                pattern = `(?:${pattern}|${escapedStem}\\b)`;
              }
              const termRegex = new RegExp(`\\b${pattern}`, "i");
              
              // 1. Match in Title
              if (termRegex.test(chunk.title)) {
                chunkScore += isExact ? 10 : 3;
                isMatched = true;
              }
              
              // 2. Match in Slide Text Content
              if (termRegex.test(chunk.text_content)) {
                chunkScore += isExact ? 5 : 1;
                isMatched = true;
              }

              // 3. Match in Authors
              const authorMatch = Array.isArray(chunk.authors) 
                ? chunk.authors.some((name: string) => termRegex.test(name))
                : typeof chunk.authors === "string" && termRegex.test(chunk.authors);
              if (authorMatch) {
                chunkScore += isExact ? 8 : 2;
                isMatched = true;
              }

              // 4. Match in Institutions
              const instMatch = Array.isArray(chunk.institutions)
                ? chunk.institutions.some((inst: string) => termRegex.test(inst))
                : false;
              if (instMatch) {
                chunkScore += isExact ? 8 : 2;
                isMatched = true;
              }
            });
          });
        }

        return { ...chunk, relevanceScore: chunkScore, isMatched };
      }).filter(chunk => chunk.isMatched && chunk.relevanceScore > 0);
    }

    // Group page-level matched chunks by parent paper (title + year) to consolidated search cards
    const paperGroups: Record<string, { paper: any; matches: any[]; maxScore: number }> = {};

    matchedChunks.forEach((chunk) => {
      const key = chunk.id || `${chunk.title}_${chunk.workshop_year}`;
      if (!paperGroups[key]) {
        const yrNum = Number(chunk.workshop_year);
        paperGroups[key] = {
          paper: {
            id: chunk.id || "",
            title: chunk.title,
            authors:
              Array.isArray(chunk.author_details) && chunk.author_details.length > 0
                ? chunk.author_details
                : chunk.authors,
            institutes: chunk.institutions,
            workshopYear: Number.isFinite(yrNum) ? yrNum : chunk.workshop_year,
            workshopOrdinal: Number(chunk.workshop_ordinal),
            workshopTitle: `${formatOrdinal(Number(chunk.workshop_ordinal))} HEMS Workshop (${chunk.workshop_year})`,
            sessionTitle: chunk.session_title,
            type: chunk.type,
            presentationUrl: chunk.presentation_url,
            abstractUrl: chunk.abstract_url,
          },
          matches: [],
          maxScore: 0,
        };
      }

      // Track maximum score among chunks for this paper
      if (chunk.relevanceScore > paperGroups[key].maxScore) {
        paperGroups[key].maxScore = chunk.relevanceScore;
      }

      // Check if this chunk has actual text content matches for query terms
      const textToSearch = chunk.text_content.toLowerCase();
      let hasTextMatch = false;

      if (normalKeywords.length > 0) {
        hasTextMatch = normalKeywords.some(keyword => {
          const expanded = getExpandedTerms(keyword);
          return expanded.some(term => textToSearch.includes(term));
        });
      } else if (exactPhrases.length > 0) {
        hasTextMatch = exactPhrases.some(phrase => {
          return textToSearch.includes(phrase);
        });
      }

      if (hasTextMatch) {
        paperGroups[key].matches.push({
          contentType: chunk.content_type,
          pageNumber: chunk.slide_number,
          textContent: chunk.text_content,
          score: chunk.relevanceScore
        });
      }
    });

    let results = Object.values(paperGroups);

    // Apply sidebar navigation categories filter (inferred)
    if (activeCategory !== "All") {
      results = results.filter((item) => {
        const textToSearch = `${item.paper.title} ${item.paper.sessionTitle}`.toLowerCase();
        
        if (activeCategory === "Spaceflight") {
          return textToSearch.includes("space") || textToSearch.includes("mars") || textToSearch.includes("planetary") || textToSearch.includes("lunar") || textToSearch.includes("titan") || textToSearch.includes("europa") || textToSearch.includes("flight");
        }
        if (activeCategory === "Marine") {
          return textToSearch.includes("marine") || textToSearch.includes("ocean") || textToSearch.includes("water") || textToSearch.includes("underwater") || textToSearch.includes("sea") || textToSearch.includes("vent") || textToSearch.includes("lake");
        }
        if (activeCategory === "Instrumentation") {
          return textToSearch.includes("quadrupole") || textToSearch.includes("ion trap") || textToSearch.includes("trap") || textToSearch.includes("tof") || textToSearch.includes("time-of-flight") || textToSearch.includes("vacuum") || textToSearch.includes("mass filter");
        }
        if (activeCategory === "Miniaturization") {
          return textToSearch.includes("mini") || textToSearch.includes("portable") || textToSearch.includes("handheld") || textToSearch.includes("micro") || textToSearch.includes("mems") || textToSearch.includes("field");
        }
        return true;
      });
    }

    // Apply era bracket filters
    if (activeYearEra !== "All") {
      results = results.filter((item) => {
        const yr = item.paper.workshopYear;
        if (activeYearEra === "2020s") return yr >= 2020;
        if (activeYearEra === "2010s") return yr >= 2010 && yr <= 2019;
        if (activeYearEra === "2000s") return yr >= 2000 && yr <= 2009;
        if (activeYearEra === "1990s") return yr === 1999;
        return true;
      });
    }

    // Sort grouped papers based on relevance score, and then chronologically
    results.sort((a, b) => {
      if (b.maxScore !== a.maxScore) {
        return b.maxScore - a.maxScore;
      }
      return b.paper.workshopYear - a.paper.workshopYear;
    });

    // Also sort matches inside each paper by page-level score
    results.forEach(group => {
      group.matches.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.pageNumber - b.pageNumber;
      });
    });

    return results;
  }, [searchQuery, mockChunks, searchMode, activeCategory, activeYearEra, getExpandedTerms]);

  // Standard metadata results matching with relevance scoring and synonym expansion
  const metadataSearchResults = useMemo(() => {
    if (isSearchActive && searchMode !== "metadata") return [];

    const { exactPhrases, excludedTerms, normalKeywords } = queryTerms;
    let results = allPapers;

    if (searchQuery.trim().length > 0) {
      results = results.map((paper) => {
        let paperScore = 0;
        let isMatched = false;

        const authorsStr = Array.isArray(paper.authors)
          ? paper.authors.map((a: any) => typeof a === "string" ? a : a.name).join(" ")
          : String(paper.authors || "");
        const institutesStr = Array.isArray(paper.institutes) ? paper.institutes.join(" ") : "";
        const combinedText = `${paper.title} ${paper.sessionTitle} ${authorsStr} ${institutesStr} ${paper.workshopYear}`.toLowerCase();

        // 1. Enforce Exclude Operators
        const hasExcluded = excludedTerms.some(term => {
          const regex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}`, "i");
          return regex.test(combinedText);
        });
        if (hasExcluded) return { ...paper, relevanceScore: 0, isMatched: false };

        // 2. Enforce Exact Phrase Quotes
        const hasAllExact = exactPhrases.every(phrase => {
          return combinedText.includes(phrase);
        });
        if (exactPhrases.length > 0 && !hasAllExact) return { ...paper, relevanceScore: 0, isMatched: false };

        // Exact phrases match without normal keywords
        if (exactPhrases.length > 0 && normalKeywords.length === 0) {
          let phraseScore = 0;
          exactPhrases.forEach(phrase => {
            if (paper.title.toLowerCase().includes(phrase)) phraseScore += 10;
            if (authorsStr.toLowerCase().includes(phrase)) phraseScore += 8;
          });
          return { ...paper, relevanceScore: phraseScore || 1, isMatched: true };
        }

        // 3. Match Normal Keywords
        if (normalKeywords.length > 0) {
          normalKeywords.forEach((keyword) => {
            const expandedTerms = getExpandedTerms(keyword);

            expandedTerms.forEach((term) => {
              const isExact = term === keyword;
              let pattern = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
              if (term.length > 3 && term.endsWith('s') && !term.endsWith('ss')) {
                const stem = term.slice(0, -1);
                const escapedStem = stem.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                pattern = `(?:${pattern}|${escapedStem}\\b)`;
              }
              const termRegex = new RegExp(`\\b${pattern}`, "i");

              // 1. Title Match
              if (termRegex.test(paper.title)) {
                paperScore += isExact ? 10 : 3;
                isMatched = true;
              }

              // 2. Authors Match
              let authMatch = false;
              if (Array.isArray(paper.authors)) {
                authMatch = paper.authors.some((a: any) => {
                  const name = typeof a === "string" ? a : a.name;
                  return termRegex.test(name);
                });
              } else if (typeof paper.authors === "string") {
                authMatch = termRegex.test(paper.authors);
              }
              if (authMatch) {
                paperScore += isExact ? 8 : 2;
                isMatched = true;
              }

              // 3. Affiliation/Institution Match
              let instMatch = false;
              if (Array.isArray(paper.institutes)) {
                instMatch = paper.institutes.some((inst: string) => termRegex.test(inst));
              }
              if (instMatch) {
                paperScore += isExact ? 8 : 2;
                isMatched = true;
              }

              // 4. Session Title/Year Match
              if (termRegex.test(paper.sessionTitle) || String(paper.workshopYear).includes(term)) {
                paperScore += 1;
                isMatched = true;
              }
            });
          });
        }

        return { ...paper, relevanceScore: paperScore, isMatched };
      }).filter((paper: any) => paper.isMatched && paper.relevanceScore > 0);

      // Sort by relevance score, then chronologically
      (results as any[]).sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.workshopYear - a.workshopYear;
      });
    }

    if (activeCategory !== "All") {
      results = results.filter((paper) => {
        const textToSearch = `${paper.title} ${paper.sessionTitle}`.toLowerCase();
        
        if (activeCategory === "Spaceflight") {
          return textToSearch.includes("space") || textToSearch.includes("mars") || textToSearch.includes("planetary") || textToSearch.includes("lunar") || textToSearch.includes("titan") || textToSearch.includes("europa") || textToSearch.includes("flight");
        }
        if (activeCategory === "Marine") {
          return textToSearch.includes("marine") || textToSearch.includes("ocean") || textToSearch.includes("water") || textToSearch.includes("underwater") || textToSearch.includes("sea") || textToSearch.includes("vent") || textToSearch.includes("lake");
        }
        if (activeCategory === "Instrumentation") {
          return textToSearch.includes("quadrupole") || textToSearch.includes("ion trap") || textToSearch.includes("trap") || textToSearch.includes("tof") || textToSearch.includes("time-of-flight") || textToSearch.includes("vacuum") || textToSearch.includes("mass filter");
        }
        if (activeCategory === "Miniaturization") {
          return textToSearch.includes("mini") || textToSearch.includes("portable") || textToSearch.includes("handheld") || textToSearch.includes("micro") || textToSearch.includes("mems") || textToSearch.includes("field");
        }
        return true;
      });
    }

    if (activeYearEra !== "All") {
      results = results.filter((paper) => {
        const yr = paper.workshopYear;
        if (activeYearEra === "2020s") return yr >= 2020;
        if (activeYearEra === "2010s") return yr >= 2010 && yr <= 2019;
        if (activeYearEra === "2000s") return yr >= 2000 && yr <= 2009;
        if (activeYearEra === "1990s") return yr === 1999;
        return true;
      });
    }

    return results;
  }, [allPapers, searchQuery, activeCategory, activeYearEra, searchMode, getExpandedTerms]);

  // Reset all filters
  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setActiveCategory("All");
    setActiveYearEra("All");
    setDisplayLimit(25);
  };

  // Tag chip query execution
  const handleChipClick = (keyword: string) => {
    setSearchInput(keyword);
    setSearchQuery(keyword);
    setActiveCategory("All");
    setActiveYearEra("All");
    setDisplayLimit(25);
  };

  // Secure text highlight helper
  function highlightText(text: string, search: string) {
    if (!search.trim()) return <span>{text}</span>;
    
    // Expand highlights to match synonyms too
    const queryKeywords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const highlightTerms = new Set<string>();
    
    queryKeywords.forEach(keyword => {
      highlightTerms.add(keyword);
      const expanded = getExpandedTerms(keyword);
      expanded.forEach(term => highlightTerms.add(term));
    });

    const escapedTerms = Array.from(highlightTerms)
      .map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .sort((a, b) => b.length - a.length); // Longest first to avoid partial replacements

    if (escapedTerms.length === 0) return <span>{text}</span>;

    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-primary/20 text-primary font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  // Bibliographic authors list renderer
  function renderAuthors(authors: any, query: string) {
    if (!authors) return null;

    if (Array.isArray(authors)) {
      return (
        <span className="text-sm text-foreground/70">
          {authors.map((author: any, idx: number) => {
            const name = typeof author === "string" ? author : author.name;
            const institute = typeof author === "string" ? null : author.institute;
            const isPresenter = typeof author === "string" ? idx === 0 : (author.isPresenter || false);
            
            return (
              <span key={idx}>
                {isPresenter ? (
                  <span className="underline decoration-secondary decoration-1 underline-offset-2 text-foreground font-medium">
                    {highlightText(name, query)}
                  </span>
                ) : (
                  highlightText(name, query)
                )}
                {institute && (
                  <span className="text-foreground/50 text-xs italic">
                    {" "}
                    ({highlightText(institute, query)})
                  </span>
                )}
                {idx < authors.length - 1 ? ", " : ""}
              </span>
            );
          })}
        </span>
      );
    }

    if (typeof authors === "string") {
      const parts = authors.split(",");
      return (
        <span className="text-sm text-foreground/70">
          {parts.map((part: string, idx: number) => {
            const name = part.trim();
            const isPresenter = idx === 0;
            return (
              <span key={idx}>
                {isPresenter ? (
                  <span className="underline decoration-secondary decoration-1 underline-offset-2 text-foreground font-medium">
                    {highlightText(name, query)}
                  </span>
                ) : (
                  highlightText(name, query)
                )}
                {idx < parts.length - 1 ? ", " : ""}
              </span>
            );
          })}
        </span>
      );
    }

    return null;
  }

  return (
    <div className="flex flex-col flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
            Workshop <span className="text-primary border-b-4 border-primary">Archives</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl">
            Search over 25 years of HEMS proceedings, posters, and full PDF content slides.
          </p>
        </div>
        <div className="flex flex-col items-center p-3 sm:p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs self-start md:self-center shrink-0">
          <img 
            src="/hemslogo.jpg" 
            alt="Harsh-Environment Mass Spectrometry Society Emblem" 
            width={3756}
            height={2594}
            decoding="async"
            className="w-28 sm:w-36 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-1 block" 
          />
          <span className="text-[11px] font-medium text-slate-500 mt-1">Proceedings Archive</span>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="bg-surface border border-foreground/10 p-4 sm:p-6 rounded-lg shadow-lg mb-12">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50" size={20} />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitSearchNow();
                }
              }}
              placeholder="Search papers, authors, or titles... (e.g. 'Martian Regolith')" 
              className="w-full bg-background border border-foreground/20 rounded-md py-3 pl-12 pr-10 text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {searchInput && (
              <button 
                onClick={() => commitSearchNow("")}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            )}
            {searchInput.trim() !== searchQuery.trim() && (
              <div className="text-xs mt-2 text-foreground/60 flex flex-wrap items-center gap-2">
                <span>Pausing briefly while you type&hellip; (press Enter to search now)</span>
                <button
                  type="button"
                  onClick={() => commitSearchNow()}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Search Now
                </button>
              </div>
            )}
            {spellingSuggestion && searchInput.trim() === searchQuery.trim() && (
              <div className="text-xs mt-2 text-foreground/60 flex items-center gap-1.5 animate-fadeIn">
                <span>Did you mean:</span>
                <button
                  onClick={() => commitSearchNow(spellingSuggestion)}
                  className="text-primary hover:underline font-bold"
                >
                  {spellingSuggestion}
                </button>
                <span>?</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-md flex items-center justify-center gap-2 border transition-all ${
              showFilters || activeCategory !== "All" || activeYearEra !== "All"
                ? "bg-primary/10 border-primary text-primary font-semibold"
                : "bg-surface border-foreground/20 text-foreground hover:bg-foreground/5"
            }`}
          >
            <Filter size={18} /> Filters
            {(activeCategory !== "All" || activeYearEra !== "All") && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>

          {isSearchActive && (
            <button 
              onClick={resetFilters}
              className="border border-foreground/20 hover:border-primary/50 text-foreground/80 hover:text-primary px-6 py-3 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={18} /> Reset
            </button>
          )}
        </div>

        {/* Opt-In Deep PDF Content Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-foreground/5">
          <label
            htmlFor="deep-pdf-search-toggle"
            className="inline-flex items-center gap-2.5 text-xs font-semibold text-foreground/80 cursor-pointer select-none"
          >
            <input
              id="deep-pdf-search-toggle"
              type="checkbox"
              checked={enableDeepPdfSearch}
              onChange={(e) => {
                const enabled = e.target.checked;
                setEnableDeepPdfSearch(enabled);
                if (enabled && searchInput.trim() && searchInput !== searchQuery) {
                  commitSearchNow();
                }
              }}
              className="w-4 h-4 rounded border-foreground/30 text-primary focus:ring-primary bg-background cursor-pointer"
            />
            <span>Search Inside Full Slide &amp; Abstract PDFs (6,477 pages)</span>
            <span className="font-normal text-foreground/55">
              &mdash;{" "}
              {enableDeepPdfSearch
                ? "Full PDF text index active"
                : "Instant title/author/institution metadata search active (saves bandwidth)"}
            </span>
          </label>
          {isSearchingDeep && (
            <span className="text-xs text-primary font-medium flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading PDF page index...
            </span>
          )}
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {(showFilters || activeCategory !== "All" || activeYearEra !== "All") && (
          <div className="border-t border-foreground/10 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Category / Environment Filter */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/55 mb-3">Topic / Environment</h4>
              <div className="flex flex-wrap gap-2">
                {["All", "Spaceflight", "Marine", "Instrumentation", "Miniaturization"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setDisplayLimit(25);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-background border-primary font-bold shadow-md"
                        : "bg-background border-foreground/10 text-foreground/80 hover:border-primary/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Era Filter */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/55 mb-3">Workshop Era</h4>
              <div className="flex flex-wrap gap-2">
                {["All", "2020s", "2010s", "2000s", "1990s"].map((era) => (
                  <button
                    key={era}
                    onClick={() => {
                      setActiveYearEra(era);
                      setDisplayLimit(25);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      activeYearEra === era
                        ? "bg-primary text-background border-primary font-bold shadow-md"
                        : "bg-background border-foreground/10 text-foreground/80 hover:border-primary/50"
                    }`}
                  >
                    {era}
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Semantic Synonym Toggle Option */}
            <div className="md:col-span-2 border-t border-foreground/5 pt-4 mt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="synonym-toggle"
                checked={enableSynonyms}
                onChange={(e) => {
                  setEnableSynonyms(e.target.checked);
                  setDisplayLimit(25);
                }}
                className="w-4 h-4 rounded border-foreground/30 text-primary focus:ring-primary bg-background cursor-pointer"
              />
              <label htmlFor="synonym-toggle" className="text-xs font-semibold text-foreground/80 cursor-pointer select-none">
                Enable Semantic Synonym Search (Cost-Free Local Academic Thesaurus)
              </label>
            </div>
          </div>
        )}
        
        {/* Search Mode & Suggested Keywords Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 border-t border-foreground/5 pt-4">
          <div className="flex gap-2 flex-wrap text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50 py-1">Suggested:</span>
            {suggestedKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => handleChipClick(kw)}
                className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold hover:bg-primary hover:text-background transition-all"
              >
                {kw}
              </button>
            ))}
          </div>

          {isSearchActive && (
            <div className="flex items-center gap-2 text-xs font-medium bg-foreground/5 px-3 py-1 rounded-md border border-foreground/10 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground/60 flex items-center gap-1.5">
                {searchMode === "algolia" && "Deep Index (Algolia)"}
                {searchMode === "mock_chunks" && "Deep Index (Offline Chunks)"}
                {searchMode === "metadata" && "Metadata Index"}
                {enableSynonyms && <span className="text-primary font-bold">(+Semantic Synonyms)</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Main Body Content */}
      {!isSearchActive ? (
        /* Static Browse Grid - Shown only when search is idle */
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-foreground/55 border-b border-foreground/10 pb-2 mb-6 uppercase tracking-[0.1em]">Browse Past Workshops</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastWorkshops.map((workshop) => (
              <Link 
                key={workshop.id} 
                href={workshop.url}
                className="flex flex-col p-6 border border-foreground/10 bg-surface hover:border-primary/50 transition-colors group rounded-lg shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="px-2.5 h-9 bg-primary/10 text-primary flex items-center justify-center rounded-lg font-bold text-sm tabular-nums">
                    {workshop.year}
                  </div>
                  <FileText className="text-foreground/20 group-hover:text-primary/50 transition-colors" />
                </div>
                <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{workshop.title}</h4>
                <p className="text-foreground/60 text-sm mt-auto">
                  View legacy archive program, materials, and participants list.
                </p>
              </Link>
            ))}
          </div>

          {/* Open Bibliometric & AI Citation Feeds */}
          <div className="mt-10 pt-8 border-t border-slate-200/90">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
                  <Database size={14} /> Open Bibliometric &amp; AI Citation Access
                </div>
                <h4 className="font-serif font-semibold text-base sm:text-lg text-slate-900">
                  Machine-Readable Proceedings Catalogs (1999–2025)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Direct structured indexes of all <span className="tabular-nums font-medium text-slate-800">436</span> HEMS oral presentations, extended abstracts, and posters with canonical citation anchors and archival PDF references for literature reviews, bibliometric tools, and AI research assistants.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href="/llms-full.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-xs font-semibold transition-colors"
                >
                  <FileText size={13} /> Full Citation Corpus (.txt)
                </a>
                <a
                  href="/archives-index.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                >
                  <Database size={13} /> JSON Index
                </a>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-primary border border-slate-200/80 hover:border-primary/30 text-xs font-medium transition-colors"
                >
                  AI Guide (llms.txt)
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Search Results List */
        <DownloadGate>
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-foreground/10 pb-4 mb-4">
            <h3 className="text-xs font-semibold text-foreground/55 tracking-[0.1em] uppercase flex items-center gap-2 tabular-nums">
              Search Results 
              {isSearchingDeep && <span className="w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
              <span className="text-foreground/40 font-normal">
                ({searchMode === "metadata" ? metadataSearchResults.length : fullTextSearchResults.length} matches)
              </span>
            </h3>
            <button 
              onClick={resetFilters} 
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              Clear Results <X size={12} />
            </button>
          </div>

          {((searchMode === "metadata" && metadataSearchResults.length === 0) || 
            (searchMode !== "metadata" && fullTextSearchResults.length === 0)) && !isSearchingDeep ? (
            <div className="text-center py-16 bg-surface border border-foreground/10 rounded-lg">
              <RotateCcw className="mx-auto mb-4 text-foreground/30 animate-spin-reverse" size={40} />
              <h4 className="text-xl font-bold text-foreground mb-2">No Papers Found</h4>
              <p className="text-foreground/60 max-w-md mx-auto mb-6">
                We could not find any matches for your query. Try broadening your terms, searching inside PDF slide text, or resetting filters.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {!enableDeepPdfSearch && searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEnableDeepPdfSearch(true)}
                    className="bg-secondary text-white font-bold px-5 py-2 rounded hover:opacity-95 transition-opacity text-sm shadow-md cursor-pointer"
                  >
                    Search Inside All 6,477 Slide &amp; Abstract PDFs
                  </button>
                )}
                <button 
                  onClick={resetFilters}
                  className="bg-primary text-background font-bold px-6 py-2 rounded hover:bg-primary/95 transition-colors text-sm shadow-md cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Render Search Results - Standard Metadata View */}
              {searchMode === "metadata" && metadataSearchResults.slice(0, displayLimit).map((paper: any, idx) => {
                const programHref = paper.id
                  ? `/archive/${paper.workshopYear}/#${paper.id}`
                  : `/archive/${paper.workshopYear}/`;
                return (
                <div 
                  key={idx} 
                  className="bg-surface border border-foreground/10 rounded-lg p-6 hover:border-primary/40 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-grow space-y-2 max-w-4xl">
                    <div className="flex flex-wrap gap-2 items-center text-xs tabular-nums">
                      <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                        {paper.workshopYear}
                      </span>
                      <span className="bg-foreground/5 text-foreground/60 border border-foreground/10 px-2 py-0.5 rounded">
                        {paper.type === "presentation" ? "Oral Presentation" : "Poster"}
                      </span>
                      <span className="text-foreground/40 font-semibold uppercase tracking-wider text-[10px]">
                        {paper.sessionTitle}
                      </span>
                      {paper.relevanceScore && (
                        <span className="text-secondary font-bold text-[10px] bg-secondary/10 px-1.5 py-0.5 rounded">
                          Relevance Score: {paper.relevanceScore}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-foreground leading-snug">
                      <Link href={programHref} className="hover:text-primary transition-colors">
                        {highlightText(paper.title, searchQuery)}
                      </Link>
                    </h4>
                    <div className="flex flex-col gap-1">
                      {renderAuthors(paper.authors, searchQuery)}
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0 justify-start md:justify-end items-stretch md:min-w-[140px]">
                    {paper.presentationUrl && (
                      <FrontendPreviewHover href={paper.presentationUrl} title={paper.title}>
                        <a 
                          href={paper.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-primary text-background hover:bg-primary/90 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm text-center"
                        >
                          <Download size={14} /> Slide PDF
                        </a>
                      </FrontendPreviewHover>
                    )}
                    {paper.abstractUrl && (
                      <FrontendPreviewHover href={paper.abstractUrl} title={paper.title}>
                        <a 
                          href={paper.abstractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-background border border-foreground/20 hover:border-secondary hover:text-secondary text-foreground/80 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <FileText size={14} /> Abstract
                        </a>
                      </FrontendPreviewHover>
                    )}
                    <Link 
                      href={programHref}
                      className="bg-transparent border border-foreground/10 hover:bg-foreground/5 text-foreground/70 hover:text-foreground text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors text-center"
                    >
                      Cite / Program <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
                );
              })}

              {/* Render Search Results - Grouped Full-Text Document Search View */}
              {searchMode !== "metadata" && fullTextSearchResults.slice(0, displayLimit).map((hit, idx) => {
                const hitProgramHref = hit.paper.id
                  ? `/archive/${hit.paper.workshopYear}/#${hit.paper.id}`
                  : `/archive/${hit.paper.workshopYear}/`;
                return (
                <div 
                  key={idx} 
                  className="bg-surface border border-foreground/10 rounded-lg p-6 hover:border-primary/30 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-grow space-y-2 max-w-4xl">
                      <div className="flex flex-wrap gap-2 items-center text-xs tabular-nums">
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                          {hit.paper.workshopYear}
                        </span>
                        <span className="bg-foreground/5 text-foreground/60 border border-foreground/10 px-2 py-0.5 rounded">
                          {hit.paper.type === "presentation" ? "Oral Presentation" : "Poster"}
                        </span>
                        <span className="text-foreground/40 font-semibold uppercase tracking-wider text-[10px]">
                          {hit.paper.sessionTitle}
                        </span>
                        {hit.maxScore > 0 && (
                          <span className="text-secondary font-bold text-[10px] bg-secondary/10 px-1.5 py-0.5 rounded">
                            Relevance: {hit.maxScore}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-foreground leading-snug">
                        <Link href={hitProgramHref} className="hover:text-primary transition-colors">
                          {highlightText(hit.paper.title, searchQuery)}
                        </Link>
                      </h4>
                      <div className="flex flex-col gap-1">
                        {renderAuthors(hit.paper.authors, searchQuery)}
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0 justify-start md:justify-end items-stretch md:min-w-[140px]">
                      {hit.paper.presentationUrl && (
                        <FrontendPreviewHover href={hit.paper.presentationUrl} title={hit.paper.title}>
                          <a 
                            href={hit.paper.presentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-primary text-background hover:bg-primary/90 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm text-center"
                          >
                            <Download size={14} /> Slide PDF
                          </a>
                        </FrontendPreviewHover>
                      )}
                      {hit.paper.abstractUrl && (
                        <FrontendPreviewHover href={hit.paper.abstractUrl} title={hit.paper.title}>
                          <a 
                            href={hit.paper.abstractUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-background border border-foreground/20 hover:border-secondary hover:text-secondary text-foreground/80 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-center"
                          >
                            <FileText size={14} /> Abstract
                          </a>
                        </FrontendPreviewHover>
                      )}
                      <Link 
                        href={hitProgramHref}
                        className="bg-transparent border border-foreground/10 hover:bg-foreground/5 text-foreground/70 hover:text-foreground text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors text-center"
                      >
                        Cite / Program <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  {/* PDF Full-Text Page Matches Highlights Sub-Grid */}
                  {hit.matches && hit.matches.length > 0 && (
                    <div className="border-t border-foreground/5 pt-4 mt-2 space-y-3 bg-background/30 rounded-lg p-4 border border-foreground/5">
                      <div className="text-[10px] font-semibold tracking-[0.08em] text-foreground/45 uppercase mb-2 flex items-center gap-1.5">
                        <FileText size={12} className="text-primary/70" /> Matches In Document Contents
                      </div>
                      <div className="space-y-3">
                        {hit.matches.map((match: any, mIdx: number) => {
                          const isAbstract = match.contentType === "abstract_text";
                          const isBiblio = match.contentType === "bibliographic_summary";
                          const targetUrl = isBiblio
                            ? null
                            : isAbstract
                            ? hit.paper.abstractUrl
                            : hit.paper.presentationUrl;
                          const anchorLink = targetUrl ? `${targetUrl}#page=${match.pageNumber}` : null;
                          const matchLabel = isBiblio
                            ? "Catalog Bibliographic Record"
                            : isAbstract
                            ? "Extended Abstract"
                            : `Slide Page ${match.pageNumber}`;
                          
                          return (
                            <div key={mIdx} className="text-xs bg-surface/40 p-3 rounded border border-foreground/15 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-primary/20 transition-all">
                              <div className="space-y-1">
                                <div className="font-semibold text-[11px] text-secondary flex items-center gap-2 tabular-nums">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                  {matchLabel}
                                  <span className="text-foreground/40 text-[9px] font-normal">Score: {match.score}</span>
                                </div>
                                <p className="text-foreground/70 italic leading-relaxed">
                                  "...{highlightText(match.textContent, searchQuery)}..."
                                </p>
                              </div>
                              {anchorLink && (
                                <a 
                                  href={anchorLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 font-semibold shrink-0 text-[10px] flex items-center gap-1 border border-primary/20 hover:border-primary/50 px-2.5 py-1 rounded bg-primary/5 transition-all self-end sm:self-auto"
                                >
                                  Jump to Page <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}

              {/* Load More Button */}
              {((searchMode === "metadata" && metadataSearchResults.length > displayLimit) || 
                (searchMode !== "metadata" && fullTextSearchResults.length > displayLimit)) && (
                <div className="text-center pt-8 pb-4">
                  <button 
                    onClick={() => setDisplayLimit((prev) => prev + 25)}
                    className="bg-surface border border-foreground/20 hover:border-primary hover:text-primary text-foreground font-bold px-8 py-3 rounded-md transition-colors text-sm shadow-sm"
                  >
                    Load More Results
                  </button>
                  <p className="text-xs text-foreground/50 mt-2 tabular-nums">
                    Showing {displayLimit} of {searchMode === "metadata" ? metadataSearchResults.length : fullTextSearchResults.length} entries
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        </DownloadGate>
      )}
    </div>
  );
}
