"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, FileText, Filter, Download, RotateCcw, X, ArrowRight, ExternalLink } from "lucide-react";
import workshopsData from "@/data/master_workshops.json";
import scientificSynonyms from "@/data/scientific_synonyms.json";

// Read Algolia credentials from environment variables
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";

export default function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeYearEra, setActiveYearEra] = useState("All");
  const [displayLimit, setDisplayLimit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [enableSynonyms, setEnableSynonyms] = useState(true);
  const [searchMode, setSearchMode] = useState<"metadata" | "algolia" | "mock_chunks">("metadata");
  
  // Local fallback database of 2,180 page-level slide and abstract text chunks
  const [mockChunks, setMockChunks] = useState<any[]>([]);
  const [isSearchingDeep, setIsSearchingDeep] = useState(false);

  const suggestedKeywords = ["Martian Regolith", "Deep Sea Vent", "Quadrupole", "Miniaturization"];

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

  // Fetch the pre-compiled local PDF content index chunks on-demand when user types a query
  useEffect(() => {
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
    } else if (searchQuery.trim().length === 0) {
      setSearchMode("metadata");
    }
  }, [searchQuery, mockChunks, algoliaIndex]);

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
    const papers: any[] = [];
    workshopsData.forEach((ws: any) => {
      const getOrdinal = (n: number) => {
        if (n === 1) return "1st";
        if (n === 2) return "2nd";
        if (n === 3) return "3rd";
        return `${n}th`;
      };
      const wsTitle = `${getOrdinal(ws.number)} HEMS Workshop (${ws.year})`;

      // Extract regular presentations
      if (ws.presentation_sessions && Array.isArray(ws.presentation_sessions)) {
        ws.presentation_sessions.forEach((session: any) => {
          if (session.presentations && Array.isArray(session.presentations)) {
            session.presentations.forEach((talk: any) => {
              papers.push({
                type: "presentation",
                workshopYear: ws.year,
                workshopOrdinal: ws.number,
                workshopTitle: wsTitle,
                sessionTitle: session.session_title || session.title || "Oral Session",
                title: talk.title || "",
                authors: talk.authors || [],
                presenter: talk.presenter || "",
                institutes: talk.institutes || [],
                presentationUrl: talk.public_website_url || talk.local_target_path || talk.legacy_url || talk.presentationUrl || talk.url || "",
                abstractUrl: talk.public_abstract_url || talk.local_abstract_target_path || talk.legacy_abstract_url || talk.abstractUrl || talk.abstract_url || ""
              });
            });
          }
        });
      }

      // Extract posters
      if (ws.posters && Array.isArray(ws.posters)) {
        ws.posters.forEach((poster: any) => {
          papers.push({
            type: "poster",
            workshopYear: ws.year,
            workshopOrdinal: ws.number,
            workshopTitle: wsTitle,
            sessionTitle: "Poster Session",
            title: poster.title || "",
            authors: poster.authors || [],
            presenter: poster.presenter || "",
            institutes: poster.institutes || [],
            presentationUrl: poster.public_website_url || poster.local_target_path || poster.legacy_url || poster.presentationUrl || poster.url || "",
            abstractUrl: poster.public_abstract_url || poster.local_abstract_target_path || poster.legacy_abstract_url || poster.abstractUrl || poster.abstract_url || ""
          });
        });
      }
    });
    return papers;
  }, []);

  // Match full-text paper contents (either via local chunks database or live Algolia indexing)
  const fullTextSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const queryKeywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let matchedChunks: any[] = [];

    // Mode A: Local mock PDF chunks database fallback
    if (searchMode === "mock_chunks" && mockChunks.length > 0) {
      matchedChunks = mockChunks.map((chunk) => {
        let chunkScore = 0;
        let isMatched = false;

        queryKeywords.forEach((keyword) => {
          const expandedTerms = getExpandedTerms(keyword);
          
          // Match keyword or any of its synonyms
          expandedTerms.forEach((term) => {
            const isExact = term === keyword;
            const termRegex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
            
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

        return { ...chunk, relevanceScore: chunkScore, isMatched };
      }).filter(chunk => chunk.isMatched && chunk.relevanceScore > 0);
    }

    // Group page-level matched chunks by parent paper (title + year) to consolidated search cards
    const paperGroups: Record<string, { paper: any; matches: any[]; maxScore: number }> = {};

    matchedChunks.forEach((chunk) => {
      const key = `${chunk.title}_${chunk.workshop_year}`;
      if (!paperGroups[key]) {
        const getOrdinal = (n: number) => {
          if (n === 1) return "1st";
          if (n === 2) return "2nd";
          if (n === 3) return "3rd";
          return `${n}th`;
        };
        paperGroups[key] = {
          paper: {
            title: chunk.title,
            authors: chunk.authors,
            institutes: chunk.institutions,
            workshopYear: chunk.workshop_year,
            workshopOrdinal: chunk.workshop_ordinal,
            workshopTitle: `${getOrdinal(chunk.workshop_ordinal)} HEMS Workshop (${chunk.workshop_year})`,
            sessionTitle: chunk.session_title,
            type: chunk.type,
            presentationUrl: chunk.presentation_url,
            abstractUrl: chunk.abstract_url
          },
          matches: [],
          maxScore: 0
        };
      }

      // Track maximum score among chunks for this paper
      if (chunk.relevanceScore > paperGroups[key].maxScore) {
        paperGroups[key].maxScore = chunk.relevanceScore;
      }

      // Check if this chunk has actual text content matches for query terms
      const textToSearch = chunk.text_content.toLowerCase();
      const hasTextMatch = queryKeywords.some(keyword => {
        const expanded = getExpandedTerms(keyword);
        return expanded.some(term => textToSearch.includes(term));
      });

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

    let results = allPapers;

    if (searchQuery.trim().length > 0) {
      const queryKeywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      
      results = results.map((paper) => {
        let paperScore = 0;
        let isMatched = false;

        queryKeywords.forEach((keyword) => {
          const expandedTerms = getExpandedTerms(keyword);

          expandedTerms.forEach((term) => {
            const isExact = term === keyword;
            const termRegex = new RegExp(`\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");

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
    setSearchQuery("");
    setActiveCategory("All");
    setActiveYearEra("All");
    setDisplayLimit(25);
  };

  // Tag chip query execution
  const handleChipClick = (keyword: string) => {
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
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-foreground">
          Workshop <span className="text-primary border-b-4 border-primary">Archives</span>
        </h1>
        <p className="text-xl text-foreground/70 max-w-3xl">
          Search over 25 years of HEMS proceedings, posters, and full PDF content slides.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="bg-surface border border-foreground/10 p-6 rounded-lg shadow-lg mb-12">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayLimit(25);
              }}
              placeholder="Search papers, authors, or slide text... (e.g. 'Martian Regolith')" 
              className="w-full bg-background border border-foreground/20 rounded-md py-3 pl-12 pr-10 text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-md flex items-center gap-2 border transition-all ${
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

        {/* Collapsible Advanced Filters Drawer */}
        {(showFilters || activeCategory !== "All" || activeYearEra !== "All") && (
          <div className="border-t border-foreground/10 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Category / Environment Filter */}
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-foreground/50 mb-3">Topic / Environment</h4>
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
              <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-foreground/50 mb-3">Workshop Era</h4>
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
            <span className="text-foreground/50 font-mono py-1">SUGGESTED:</span>
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
            <div className="flex items-center gap-2 text-xs font-mono bg-foreground/5 px-3 py-1 rounded-md border border-foreground/10 self-start sm:self-auto">
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
          <h3 className="font-mono text-sm text-foreground/50 border-b border-foreground/10 pb-2 mb-6 uppercase tracking-widest">Browse Past Workshops</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 14, year: 2022, title: "14th HEMS Workshop", url: "/archive/2022" },
              { id: 13, year: 2019, title: "13th HEMS Workshop", url: "/archive/2019" },
              { id: 12, year: 2018, title: "12th HEMS Workshop", url: "/archive/2018" },
              { id: 11, year: 2017, title: "11th HEMS Workshop", url: "/archive/2017" },
              { id: 10, year: 2015, title: "10th HEMS Workshop", url: "/archive/2015" },
              { id: 9, year: 2013, title: "9th HEMS Workshop", url: "/archive/2013" },
              { id: 8, year: 2011, title: "8th HEMS Workshop", url: "/archive/2011" },
              { id: 7, year: 2009, title: "7th HEMS Workshop", url: "/archive/2009" },
              { id: 6, year: 2007, title: "6th HEMS Workshop", url: "/archive/2007" },
              { id: 5, year: 2005, title: "5th HEMS Workshop", url: "/archive/2005" },
              { id: 4, year: 2003, title: "4th HEMS Workshop", url: "/archive/2003" },
              { id: 3, year: 2002, title: "3rd HEMS Workshop", url: "/archive/2002" },
              { id: 2, year: 2001, title: "2nd HEMS Workshop", url: "/archive/2001" },
              { id: 1, year: 1999, title: "1st HEMS Workshop", url: "/archive/1999" }
            ].map((workshop) => (
              <Link 
                key={workshop.id} 
                href={workshop.url}
                className="flex flex-col p-6 border border-foreground/10 bg-surface hover:border-primary/50 transition-colors group rounded-lg shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg font-bold font-mono">
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
        </div>
      ) : (
        /* Interactive Search Results List */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-foreground/10 pb-4 mb-4">
            <h3 className="font-mono text-sm text-foreground/50 tracking-widest uppercase flex items-center gap-2">
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
                We could not find any matches for your query. Try broadening your terms or resetting filters.
              </p>
              <button 
                onClick={resetFilters}
                className="bg-primary text-background font-bold px-6 py-2 rounded hover:bg-primary/95 transition-colors text-sm shadow-md"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Render Search Results - Standard Metadata View */}
              {searchMode === "metadata" && metadataSearchResults.slice(0, displayLimit).map((paper: any, idx) => (
                <div 
                  key={idx} 
                  className="bg-surface border border-foreground/10 rounded-lg p-6 hover:border-primary/40 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-grow space-y-2 max-w-4xl">
                    <div className="flex flex-wrap gap-2 items-center text-xs font-mono">
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
                        <span className="text-secondary font-bold font-mono text-[9px] bg-secondary/10 px-1.5 py-0.5 rounded animate-pulse">
                          Relevance Score: {paper.relevanceScore}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-foreground leading-snug">
                      {highlightText(paper.title, searchQuery)}
                    </h4>
                    <div className="flex flex-col gap-1">
                      {renderAuthors(paper.authors, searchQuery)}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 flex-shrink-0 justify-end items-stretch min-w-[140px]">
                    {paper.presentationUrl && (
                      <a 
                        href={paper.presentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary text-background hover:bg-primary/90 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm text-center"
                      >
                        <Download size={14} /> Slide PDF
                      </a>
                    )}
                    {paper.abstractUrl && (
                      <a 
                        href={paper.abstractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-background border border-foreground/20 hover:border-secondary hover:text-secondary text-foreground/80 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <FileText size={14} /> Abstract
                      </a>
                    )}
                    <Link 
                      href={`/archive/${paper.workshopYear}`}
                      className="bg-transparent border border-foreground/10 hover:bg-foreground/5 text-foreground/70 hover:text-foreground text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors text-center"
                    >
                      Program <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Render Search Results - Grouped Full-Text Document Search View */}
              {searchMode !== "metadata" && fullTextSearchResults.slice(0, displayLimit).map((hit, idx) => (
                <div 
                  key={idx} 
                  className="bg-surface border border-foreground/10 rounded-lg p-6 hover:border-primary/30 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-grow space-y-2 max-w-4xl">
                      <div className="flex flex-wrap gap-2 items-center text-xs font-mono">
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
                          <span className="text-secondary font-bold font-mono text-[9px] bg-secondary/10 px-1.5 py-0.5 rounded animate-pulse">
                            Relevance: {hit.maxScore}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-foreground leading-snug">
                        {highlightText(hit.paper.title, searchQuery)}
                      </h4>
                      <div className="flex flex-col gap-1">
                        {renderAuthors(hit.paper.authors, searchQuery)}
                      </div>
                    </div>

                    <div className="flex md:flex-col sm:flex-row gap-2 flex-shrink-0 justify-end items-stretch min-w-[140px]">
                      {hit.paper.presentationUrl && (
                        <a 
                          href={hit.paper.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary text-background hover:bg-primary/90 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm text-center"
                        >
                          <Download size={14} /> Slide PDF
                        </a>
                      )}
                      {hit.paper.abstractUrl && (
                        <a 
                          href={hit.paper.abstractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-background border border-foreground/20 hover:border-secondary hover:text-secondary text-foreground/80 text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <FileText size={14} /> Abstract
                        </a>
                      )}
                      <Link 
                        href={`/archive/${hit.paper.workshopYear}`}
                        className="bg-transparent border border-foreground/10 hover:bg-foreground/5 text-foreground/70 hover:text-foreground text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-colors text-center"
                      >
                        Program <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  {/* PDF Full-Text Page Matches Highlights Sub-Grid */}
                  {hit.matches && hit.matches.length > 0 && (
                    <div className="border-t border-foreground/5 pt-4 mt-2 space-y-3 bg-background/30 rounded-lg p-4 border border-foreground/5">
                      <div className="text-[10px] font-bold font-mono tracking-widest text-foreground/40 uppercase mb-2 flex items-center gap-1.5">
                        <FileText size={12} className="text-primary/70" /> Matches In Document Contents
                      </div>
                      <div className="space-y-3">
                        {hit.matches.map((match: any, mIdx: number) => {
                          const isAbstract = match.contentType === "abstract_text";
                          const targetUrl = isAbstract ? hit.paper.abstractUrl : hit.paper.presentationUrl;
                          const anchorLink = targetUrl ? `${targetUrl}#page=${match.pageNumber}` : null;
                          
                          return (
                            <div key={mIdx} className="text-xs bg-surface/40 p-3 rounded border border-foreground/15 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-primary/20 transition-all">
                              <div className="space-y-1">
                                <div className="font-mono font-bold text-[10px] text-secondary flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                  {isAbstract ? "Extended Abstract" : `Slide Page ${match.pageNumber}`}
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
              ))}

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
                  <p className="text-xs text-foreground/50 mt-2 font-mono">
                    Showing {displayLimit} of {searchMode === "metadata" ? metadataSearchResults.length : fullTextSearchResults.length} entries
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
