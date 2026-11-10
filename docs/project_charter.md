# Project Charter: Harsh-Environment Mass Spectrometry (HEMS) Web Platform

**Organization:** Harsh-Environment Mass Spectrometry Society, Inc. (Florida 501(c)(3) Public Charity)  
**Production Domain:** [hems-workshop.org](https://www.hems-workshop.org)  
**Custodian:** `@arch`  

---

## 1. Mission & Domain Scope

The HEMS Web Platform serves as both the public symposium portal and the canonical 25+ year digital research archive (1999–present) for the biennial **Workshop on Harsh-Environment Mass Spectrometry**. Its mission is to facilitate cross-disciplinary interaction among scientists, engineers, and field users deploying compact, reliable, and energy-efficient mass spectrometers outside controlled laboratory settings (deep ocean, planetary exploration, atmospheric plumes, security, and tactical field operations).

---

## 2. Technology Stack & System Topology

| Layer | Technology | Role & Scope |
| :--- | :--- | :--- |
| **Public Frontend** (`src/frontend/`) | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4 | Static export (`output: "export"`) deployed to Firebase Hosting (`http://localhost:3000` in dev). |
| **Workshop Manager** (`tools/manager/`) | Standalone Next.js Local Workbench | Local-only operational console (`http://localhost:4000`) for cataloging proceedings, generating previews, managing sponsors, and syncing to GCS. |
| **Auth & Database** | Firebase Authentication + Cloud Firestore | Role-Based Access Control (`admin`, `board`, `reviewer`, `submitter`, `attendee`, `general`), whitelist sync, and daily download quotas. |
| **Serverless Backend** (`functions/`) | Firebase Cloud Functions v2 (Node.js 22, TypeScript) | 2nd-Gen Firestore triggers synchronizing user whitelist roles. |
| **Proceedings Storage** | Google Cloud Storage (`gs://hems-workshop-archives/`) + `local_data/` | 15 workshops (1999–2025), 1,590 proceeding PDFs/previews (1.68 GB), and 91 master corporate sponsor logos. |
| **Search & CMS** | Page-Level PDF Chunk Index / Algolia + Decap CMS (`/admin`) | Deep slide/abstract full-text search and strictly scoped Markdown editorial configuration (`src/frontend/content/`). |

---

## 3. Architectural Guardrails & Non-Negotiables

1. **Zero Data Loss on Historical Archives:** `src/frontend/src/data/master_workshops.json`, `src/frontend/src/data/archives/*.json`, `docs/registries/`, and `local_data/proceedings/` are authoritative historical records. Schema integrity is enforced pre-build via Zod (`validate-archives.js`).
2. **Physical Isolation of Operational Tooling:** The Workshop Manager resides exclusively in `tools/manager/` (port 4000) so internal file-system APIs never enter the static public bundle (`src/frontend/out/`).
3. **Static Export Purity:** `src/frontend/public/` must contain only lightweight web assets and search indices—never multi-hundred-megabyte raw proceeding archives or build caches (`local_data/cache/`).
4. **Global Symposium Visual Identity:** Adheres strictly to `.agents/config/design/brand-guidelines.md` (Summit White `#FFFFFF`, Slate Black `#334155`, Protocol Gray `#E2E8F0`, Global Cerulean `#0284C7`, Diplomatic Emerald `#059669`, `Noto Sans` & `IBM Plex Mono`, and `mix-blend-multiply` logo treatment).
