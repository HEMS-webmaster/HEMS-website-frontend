# Architectural & Domain Plan: Website-Wide SEO, Scholarly Indexing & GEO Optimization

**Date:** 2026-11-11  
**Author:** `@arch` (System Architect) & `@web` (`@sme1` — Web, SEO, Accessibility & Scientific Archive SME)  
**Execution Lead:** `@dev` (Frontend Implementation within `src/frontend/`)  
**Verification & Deployment:** `@qa`, `@brand`, `@legal`, `@rte`, `@ops`

---

## 1. Governance & Role Routing (`scrumrules.md` Rule #8)

- In [`.agents/config/project_charter.md`](file:///c:/AntigravityP1_2/HEMS-website/.agents/config/project_charter.md), **`@web`** is the alias for **`@sme1`** (*Website design, modern UI/UX, SEO, high-performance, accessibility, scientific archive management*).
- Per [`scrumrules.md`](file:///c:/AntigravityP1_2/HEMS-website/.agents/rules/scrumrules.md) Section 2 and [`smeN.md`](file:///c:/AntigravityP1_2/HEMS-website/.agents/personas/smeN.md) Section 3.C, `@web` (`@sme1`) is **strictly read-only for `src/` codebase files**; `@web` defines the SEO/GEO technical specification and conducts the downstream `SMEX Domain Audit`, while **`@dev`** executes all `src/frontend/` modifications.
- **Strict Archive Page Lock Preserved:** Zero files under `src/frontend/src/app/archive/**`, `src/frontend/src/data/master_workshops.json`, or `src/frontend/src/data/archives/*.json` are modified. Archive pages automatically inherit root file-based OpenGraph/Twitter imagery (`src/app/opengraph-image.png`) and upgraded structured data via [`generateArchiveJsonLd.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/generateArchiveJsonLd.ts).

---

## 2. Baseline SEO Audit Findings (`@arch` & `@web`)

| Audit Dimension | Baseline State | SEO / Indexing Impact | Planned Remediation |
| :--- | :--- | :--- | :--- |
| **Root Metadata & Social Cards** ([`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx)) | Missing `metadataBase`, `title.template`, `openGraph`, `twitter`, and `og:image` (`0/33` pages have `og:image`). | Broken link previews on LinkedIn/Slack/X/Teams; inconsistent title branding. | Add `metadataBase`, `%s \| HEMS Society` template, Googlebot `max-image-preview: large`, and root `1200×630` `opengraph-image.png` / `twitter-image.png` (cascades to all routes including `/archive/**`). |
| **Canonical Tags** | `0/11` non-archive public pages emit `<link rel="canonical">`. | Duplicate-URL dilution between trailing-slash and non-trailing-slash variants. | Centralize `buildPageMetadata()` in [`seo.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/seo.ts) emitting trailing-slash canonicals (`https://www.hems-workshop.org/.../`) across all 11 public pages. |
| **Archive Event & Scholarly JSON-LD** ([`generateArchiveJsonLd.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/generateArchiveJsonLd.ts)) | `6/15` workshops (`1999`, `2001`, `2003`, `2011`, `2013`, `2015`) output `startDate: undefined` due to en-dash `–` and yearless date strings; `isAccessibleForFree: "False"` is a string instead of boolean `false`. | Google Event Rich Results rejects `40%` of historical workshops; schema type validation warnings on 436+ `ScholarlyArticle` nodes. | Support `–`/`—`/`-`, optional commas, year fallback, cross-month ranges, `eventStatus`, `url`, `image`, trailing-comma venue cleanup, boolean `isAccessibleForFree: false`, `headline`, `datePublished`, and author `affiliation`. |
| **XML Sitemap** ([`sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts)) | `21/22` URLs lack trailing slashes (causing `308` redirects under `trailingSlash: true`); 5 public routes missing (`/layout-portal/`, `/call-for-papers/`, `/registration/`, `/accommodations/`, `/formatting-guidelines/`); no `<lastmod>`. | Search Console flags redirecting URLs in sitemap; 2027 Workshop hub & CFP omitted from XML discovery. | Output all `27` canonical trailing-slash public URLs sorted cleanly with ISO `lastModified` metadata. |
| **Crawler & Private Portal Hygiene** ([`robots.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/robots.ts)) | `/admin/`, `/admin/analytics/`, `/board/`, `/reviewer/`, and `/auth/` export with homepage duplicate `<title>` and `index, follow`. | Thin `"Access Denied"` / login shells exposed to search indexation. | Add `noindex, nofollow` server `layout.tsx` wrappers with unique titles for `/auth`, `/admin`, `/board`, `/reviewer`, and disallow `/admin/`, `/board/`, `/reviewer/` in `robots.ts`. |
| **Client-Only `/contact` & Generic `/layout-portal` Metadata** | `/contact` starts with `"use client"` (0 page metadata, 100% duplicate of `/`); `/layout-portal` uses generic `"HEMS Workshop Portal"` (`86`-char description). | Poor branded & event-cycle SERP CTR for `"16th HEMS Workshop 2027"` and `"Contact HEMS Society"`. | Split [`ContactClient.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/workshop/ContactClient.tsx) from server [`contact/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/contact/page.tsx); upgrade `/layout-portal` and all public pages to `140–160` char descriptions + `BreadcrumbList` / `Event` JSON-LD. |
| **AI Search / GEO (`public/llms.txt`)** | Contains broken `file:///archives-index.json` URI and hallucinated 404 paths (`/archive/2023`, `/archive/2020`, `/archive/2016`); omits `/archive/2025/`. | LLMs and AI search engines (Perplexity, ChatGPT Search, Google AI Overviews) ingest non-existent workshop years and miss 2025 proceedings. | Rewrite [`llms.txt`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/llms.txt) with verified 1999–2025 workshop links, 2027 Save-the-Date hub, 501(c)(3) charter facts, and HTTPS `archives-index.json` endpoint. |
| **Semantic Headings & CLS (`width`/`height`)** | `formatting-guidelines/page.tsx` jumps `h2` -> `h4`; `<img>` elements omit intrinsic `width`/`height`. | WCAG heading warning and potential layout shift before image decode. | Fix `h2` -> `h3` hierarchy, add `manifest.ts`, and supply intrinsic `width`/`height`/`decoding="async"` on public `<img>` elements. |

---

## 3. Architectural Risks & Trade-Offs (`@arch` Mandatory Analysis)

1. **Static Export Constraint (`output: "export"`):** Dynamic runtime `ImageResponse` routes without `force-static` break static builds. Pre-rendering deterministic `1200×630` PNG assets (`src/app/opengraph-image.png` and `src/app/twitter-image.png`) guarantees zero runtime overhead, 100% LinkedIn/X/Slack compatibility (which reject `.svg` OG images), and automatic inheritance into locked `/archive/**` routes.
2. **Archive Page Lock Trade-Off:** Because `src/frontend/src/app/archive/**` is locked unless `@bo` grants explicit permission, `/archive/page.tsx` (`"use client"`) retains the root layout title/description while still gaining the new root `opengraph-image.png`, `twitter:card="summary_large_image"`, and global `Organization`/`WebSite` JSON-LD. An optional 1-file `src/app/archive/layout.tsx` unlock will be surfaced to `@bo` as a follow-up option.
3. **`robots.txt` vs `noindex` Interaction on `/auth/`:** Blocking a URL in `robots.txt` prevents Googlebot from seeing its `<meta name="robots" content="noindex">` tag. Therefore, `/auth/` is kept crawlable in `robots.txt` while emitting `noindex, nofollow` in HTML `<head>`, whereas RBAC-gated consoles (`/admin/`, `/board/`, `/reviewer/`) enforce both `noindex, nofollow` AND `robots.txt` `Disallow`.

---

## 4. Verification Gates (`@qa` & `@web`)

1. `npm --prefix src/frontend run build` passes Zod archive validation, TypeScript, and `37+` static route export with `0` errors.
2. Automated HTML & JSON-LD verification across `src/frontend/out/**/*.html`:
   - `15/15` `/archive/[year]/` pages emit valid ISO `startDate` & `endDate`, boolean `isAccessibleForFree: false`, `og:image`, and `twitter:card="summary_large_image"`.
   - `11/11` non-archive public pages emit unique `<title>`, `135–165` char `<meta name="description">`, trailing-slash `<link rel="canonical">`, `og:image`, `twitter:card="summary_large_image"`, single `<h1>`, and valid JSON-LD (`0` parse errors).
   - `5/5` private/auth routes (`/auth/`, `/admin/`, `/admin/analytics/`, `/board/`, `/reviewer/`) emit `noindex, nofollow`.
   - `out/sitemap.xml` contains all `27` trailing-slash public URLs with `<lastmod>` and `0` private/404 URLs.
   - `git diff src/frontend/src/app/archive` is `100%` empty.
