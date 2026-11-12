# Final SEO & AI Archive Accessibility Plan

**Date:** 2026-11-12  
**Authors:** `@arch`, `@prod`, `@dev`  
**Scope:** Traditional Search Engine Optimization (Google, Bing, Google Scholar, Semantic Scholar) & AI Research Agent Discoverability (`llms.txt`, `llms-full.txt`, `archives-index.json`, `mock-pdf-chunks.json`, Schema.org JSON-LD, `robots.txt`, and `/archive` search deep-linking).

---

## 1. Executive Audit Summary

### What Already Passed (`[PASS]`)
- **Canonical Sitemap (`sitemap.ts`):** Exports all `27` canonical trailing-slash public URLs (`12` static Society/Workshop pages + `15` `/archive/[year]/` pages) with ISO `lastModified` dates and zero private route leaks.
- **Route Metadata & Social Cards (`seo.ts` + Page `metadata`):** All public routes emit unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:image` (`1200x630`), `twitter:card = summary_large_image`, single `<h1>`, image `alt` + `width`/`height` attributes, and `googleBot` `max-snippet: -1` / `max-image-preview: large`. All private routes (`/admin`, `/board`, `/reviewer`, `/auth`, `/unsubscribe`) emit `noindex, nofollow`.

### Critical Archive & AI Reference Gaps Uncovered (`[FIXED IN THIS RELEASE]`)
1. **Stale & Missing PDF/Citation URLs in `public/archives-index.json` and `public/mock-pdf-chunks.json`:**
   - `scripts/generate-archives-index.js` previously read only `src/data/master_workshops.json` instead of cross-referencing `src/data/archives/1999.json` … `2025.json`.
   - As a result, `archives-index.json` and `mock-pdf-chunks.json` contained **`0` live Google Cloud Storage (`storage.googleapis.com/hems-workshop-archives/...`) URLs**, **`0` canonical `#anchor` citation URLs**, blank PDF URLs for all 2025 (15th Workshop) talks/posters, and `376` legacy `*WS/` URLs that will 404 once DNS cuts over to Firebase Hosting.
2. **PDF Indexer Path & Hallucination Bugs (`scripts/index-pdf-contents.js`):**
   - `getProceedingsWsDir(ordinal)` hardcoded `` `${ordinal}th` `` (`1th`, `2th`, `3th` instead of `1st`, `2nd`, `3rd`), causing `0` PDFs from the inaugural 1st HEMS Workshop (1999) to be extracted despite existing in `local_data/proceedings/1st/`.
   - GCS URL parsing produced a double `local_data/proceedings/proceedings/...` path.
   - Missing-PDF fallback blocks injected fabricated hardware strings (`"Pfeiffer HiPace turbomolecular vacuum pump"`, `"Creare molecular drag pump"`), creating an AI/search hallucination risk for talks without uploaded slides.
3. **False Paywall Markup on `ScholarlyArticle` JSON-LD (`src/utils/generateArchiveJsonLd.ts`):**
   - Every `ScholarlyArticle` across all 15 `/archive/[year]/` pages declared `isAccessibleForFree: false` with a non-existent `.gated-pdf-content` CSS selector, instructing Google Scholar and AI crawlers to treat open proceedings as paywalled.
4. **Interactive `/archive` Search Missing Live GCS URLs & Talk Deep Links (`src/components/archive/ArchiveHubClient.tsx`):**
   - Metadata search read `master_workshops.json` directly (missing 2025 PDFs and `#id` anchors), and `"Program ->"` linked only to `/archive/[year]/` rather than `/archive/[year]/#[id]`.
5. **AI Reference Corpus (`llms.txt` + `llms-full.txt`), `robots.ts`, & Knowledge Graph (`seo.ts`):**
   - `public/llms.txt` contained a legacy `info@hems-workshop.org` address and lacked a complete single-file Markdown citation catalog (`public/llms-full.txt`) covering all 15 workshops, 18 Student Travel Awardees, and 436 citable presentations/posters.
   - `robots.ts` lacked explicit `Allow: /` rules for named AI search/research bots (`GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `Applebot-Extended`).
   - Global Knowledge Graph JSON-LD (`seo.ts`) lacked a `DataCatalog` (`#proceedings-catalog`) entry linking the machine-readable archive feeds.

---

## 2. File-Level Architecture (100% Charter Lock Compliant)

> **Charter Lock Compliance:** Zero modifications to `src/frontend/src/app/archive/**`, `src/frontend/src/data/master_workshops.json`, or `src/frontend/src/data/archives/*.json`.

1. `src/frontend/scripts/generate-archives-index.js` — Enrich all 436 entries (preserving exact array order for `local_data/cache/` compatibility) from `src/data/archives/*.json` with `id`, `canonical_url` (`https://www.hems-workshop.org/archive/YYYY/#id`), verified live GCS `presentation_url` & `abstract_url`, hover preview URLs (`slide_preview_png_url`, `abstract_preview_txt_url`), host `location`, `dates`, and formatted academic `citation` text.
2. `src/frontend/scripts/index-pdf-contents.js` — Fix `1st`/`2nd`/`3rd` ordinal directory lookup and GCS `proceedings/` path mapping; carry `id`, `canonical_url`, and `citation` into every chunk; replace fabricated hardware fallback text with truthful bibliographic metadata (`content_type: "bibliographic_summary"` when no PDF exists, or clean abstract summary).
3. `src/frontend/scripts/generate-llms-catalog.js` & `src/frontend/scripts/build-prod.js` — Build-time generator writing `src/frontend/public/llms-full.txt` with Society overview, citation instructions, all 15 workshops (`2025`–`1999`), administrative Program/Participant PDFs, Student Travel Award fellows, and all 436 papers with canonical `#anchor` and GCS PDF links.
4. `src/frontend/public/llms.txt` — Update official committee emails and link `/llms-full.txt`, `/archives-index.json`, `/mock-pdf-chunks.json`, and `/sitemap.xml` with explicit AI citation guidance.
5. `src/frontend/src/utils/generateArchiveJsonLd.ts` — Set `isAccessibleForFree: true`, remove phantom `.gated-pdf-content` paywall block, add `@id`, `isPartOf`, and `creditText` (formatted citation), and ensure `MediaObject.contentUrl` prefers live GCS URLs without dead legacy fallbacks.
6. `src/frontend/src/utils/seo.ts` & `src/frontend/src/app/robots.ts` — Add `DataCatalog` (`https://www.hems-workshop.org/archive/#catalog`) with `DataDownload` distributions in `buildGlobalKnowledgeGraphJsonLd()`; explicitly allow AI search/citation user-agents in `robots.ts` while keeping private portals disallowed.
7. `src/frontend/src/components/archive/ArchiveHubClient.tsx` & `src/frontend/src/components/layout/Footer.tsx` — Hydrate `/archive` search papers from `/archives-index.json` so all 436 papers expose live GCS Slide/Abstract PDFs (wrapped in `<DownloadGate>`) and deep-link directly to `/archive/[year]/#[id]`; expose clean HTML discovery links to `/llms.txt`, `/llms-full.txt`, and `/archives-index.json`.

