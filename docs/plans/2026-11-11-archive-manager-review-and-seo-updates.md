# Architectural Review & Execution Plan: Archive Construction, Workshop Manager Interaction & Archive SEO Updates

**Date:** 2026-11-11  
**Author:** `@arch` (reviewed with `@dev` & `@web` / `@sme1`)  
**Authorization:** Explicit `@bo` permission granted upon completion of the Archive–Manager review.

---

## 1. Architectural Review: How the Archive Is Constructed & Interacts with the Workshop Manager

### 1.1 Dual-Tier JSON Data Flow (`tools/manager` → `src/frontend`)
1. **Workstation Authoring (`http://localhost:4000`):**
   - The standalone Next.js **Workshop Manager** in [`tools/manager/`](file:///c:/AntigravityP1_2/HEMS-website/tools/manager) is physically isolated from `src/frontend/` so internal `fs` / `child_process` API routes never enter the Firebase static export (`src/frontend/out/`).
   - [`GET /api/manager/workshops`](file:///c:/AntigravityP1_2/HEMS-website/tools/manager/src/app/api/manager/workshops/route.ts) loads the canonical authoring dataset [`src/frontend/src/data/master_workshops.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/master_workshops.json) (15 workshops, `1999`–`2025`).
2. **Save & Fan-Out Compilation (`POST /api/manager/save`):**
   - When an archivist clicks **Save** in [`tools/manager/src/app/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/tools/manager/src/app/page.tsx), [`POST /api/manager/save`](file:///c:/AntigravityP1_2/HEMS-website/tools/manager/src/app/api/manager/save/route.ts):
     1. Writes the updated array back to `master_workshops.json`.
     2. Verifies on-disk proceeding files inside `local_data/proceedings/{ordinal}/{Session|Posters|Administrative|Student_Award}/` and resolves corporate logos against [`corporate_registry.json`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/data/corporate_registry.json) + `src/frontend/public/images/sponsors/` (appending `?v=<mtimeMs>` cache-busters).
     3. Compiles all 15 per-year view-model files in `src/frontend/src/data/archives/{year}.json` (`1999.json`–`2025.json`), populating **four parallel URL fields** per document:
        - `local_target_path` / `local_abstract_target_path`: `/api/manager/serve?file=...`
        - `public_website_url` / `public_abstract_url`: `https://storage.googleapis.com/hems-workshop-archives/proceedings/...`
        - `gcloud_url` / `gcloud_abstract_url`: `gs://hems-workshop-archives/proceedings/...`
        - `legacy_url` / `legacy_abstract_url`: historical fallback URLs.
     4. Opens `http://localhost:3000/archive/{year}` in a new browser tab for immediate visual inspection.
3. **Pre-Build Validation, Search Indexing & Static Export (`build-prod.js`):**
   - [`src/frontend/scripts/build-prod.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/build-prod.js) executes four sequential stages:
     1. [`validate-archives.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/validate-archives.js): Validates all 15 `src/data/archives/*.json` files against Zod schemas.
     2. [`generate-archives-index.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/generate-archives-index.js): Compiles `master_workshops.json` into `src/frontend/public/archives-index.json` (flat catalog for crawlers/LLMs and downstream PDF indexing).
     3. [`index-pdf-contents.js`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/scripts/index-pdf-contents.js): Reads page-level PDF text caches from `local_data/cache/*.json` and writes `src/frontend/public/mock-pdf-chunks.json` (or syncs to Algolia when credentials are present).
     4. `npx next build` (`output: "export"`, `trailingSlash: true`): Pre-renders `/archive/index.html` and all 15 `/archive/[year]/index.html` static routes via `generateStaticParams()`.
4. **Local Dev vs. Production Asset & UI Wiring:**
   - In `next dev` (`NODE_ENV === "development"`), [`next.config.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/next.config.ts) proxies `/api/manager/:path*` to `http://localhost:4000/api/manager/:path*`, so [`archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) (`isLocal === true`) and [`FrontendPreviewHover.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/FrontendPreviewHover.tsx) stream local PDFs and `_preview.png` / `_preview.txt` hover cards directly from `local_data/proceedings/`.
   - In static production (`isLocal === false`), links resolve directly to `public_website_url` on `storage.googleapis.com`, gated on click by [`DownloadGate.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/DownloadGate.tsx) (Firebase Auth + email verification + 30/day Firestore quota) while keeping HTML, `<meta>`, and JSON-LD 100% open to search/scholarly crawlers. [`CitationButton.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/CitationButton.tsx) binds APA/BibTeX permalinks to `<div id={talk.id}>`.

---

## 2. Safety & Discovery Findings from the Review

1. **Strict One-Way Data Contract:** Neither `tools/manager/**` nor `src/frontend/scripts/*.js` reads or mutates `src/frontend/src/app/archive/**`. All SEO updates inside `src/frontend/src/app/archive/**` are 100% non-disruptive to Manager saves, GCS syncs, Zod validation, and PDF indexing.
2. **Orphaned 2025 Card & Hardcoded Browse Grid Discovered in `archive/page.tsx`:** Lines 964–979 of [`archive/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/page.tsx) used a hardcoded 14-item array (`14th / 2022` down to `1st / 1999`), omitting the **15th HEMS Workshop (`2025`)** (`/archive/2025/`) from the static browse grid and preventing future Workshop Manager additions from appearing automatically. Deriving the browse list dynamically from `workshopsData` (`master_workshops.json`) resolves both the SEO orphan link and future Manager synchronization.
3. **Double Comma & Non-Trailing-Slash Canonical in `archive/[year]/page.tsx`:**
   - `2025.json` stores `"venue": "Sheraton Virginia Beach Oceanfront Hotel,"`, which caused `[data.venue, data.address].join(', ')` to emit `,,` in `<meta name="description">`.
   - `canonicalUrl` omitted the trailing slash (`https://www.hems-workshop.org/archive/${year}`), conflicting with `trailingSlash: true`, `sitemap.xml`, and `generateArchiveJsonLd.ts`.
   - Custom `openGraph` without `images` shallow-replaced the root layout's `og:image` in Next.js 16.

---

## 3. Authorized Archive SEO Execution Checklist (`@dev`)

1. **Server/Client Split for `/archive/` Hub:**
   - Create [`src/frontend/src/components/archive/ArchiveHubClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/archive/ArchiveHubClient.tsx) preserving 100% of the search, Levenshtein spellcheck, synonym expansion, and deep PDF chunk matching logic while deriving the `Browse Past Workshops` grid dynamically from `master_workshops.json` (`2025`–`1999`), normalizing internal links to `/archive/${year}/`, and adding `width={96} height={96} decoding="async"` to `/hemslogo.jpg`.
   - Convert [`src/frontend/src/app/archive/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/page.tsx) into a Server Component exporting `buildPageMetadata` (`path: "/archive/"`) and emitting `CollectionPage` (`ItemList` of all 15 workshops) + `BreadcrumbList` JSON-LD.
2. **Metadata, Breadcrumb JSON-LD & Image Dimension Polish on `/archive/[year]/`:**
   - Update `generateMetadata()` in [`src/frontend/src/app/archive/[year]/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/archive/%5Byear%5D/page.tsx) to use `toCanonicalUrl(\`/archive/\${year}/\`)`, strip trailing venue commas, include `DEFAULT_OG_IMAGE` (`1200×630`) + `DEFAULT_OG_ALT` in `openGraph.images` and `twitter` (`summary_large_image`), and set `siteName: SITE_NAME`.
   - Emit `BreadcrumbList` JSON-LD (`Home` → `Proceedings Archive` → `{ordinal} HEMS Workshop ({year})`) alongside `generateArchiveJsonLd(data)`.
   - Normalize `<Link href="/archive/">` and add intrinsic `width`/`height`/`loading="lazy"`/`decoding="async"` attributes on host and sponsor `<img>` elements without changing any visual CSS or interactive components (`DownloadGate`, `FrontendPreviewHover`, `CollapsiblePosterList`, `CitationButton`).
3. **Zero Data Mutation Verification (`@qa`):**
   - Verify `0` git diff on `master_workshops.json`, `src/data/archives/*.json`, `tools/manager/**`, and `local_data/`.
   - Run `npm --prefix src/frontend run build` and audit all `16/16` archive HTML outputs (`/archive/` + `15` `/archive/[year]/` routes) for `canonical`, `og:image`, `twitter:card`, JSON-LD (`ld >= 3`), `h1=1`, `noAlt=0`, and `noDim=0`.

