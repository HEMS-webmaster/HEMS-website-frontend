# Goal: Environment-Aware Frontend URL Routing

The user has requested that when the Next.js application runs locally (`npm run dev`), the frontend archive pages should serve files directly from the local file system (e.g., `Local Target Path`), allowing the user to view and test PDFs without needing to push them to the Google Cloud backend first. Conversely, when the app is built and pushed to production/git, the frontend must point to the public cloud URLs (e.g., `Public Website URL`).

## User Review Required
> [!WARNING]
> This plan proposes creating a new local API endpoint (`/api/manager/serve`) specifically for streaming local PDFs during development. The `save` API route will be updated to calculate the `local_target_path` for all uploaded artifacts alongside their `public_website_url`. Finally, the archive template (`archive/[year]/page.tsx`) will dynamically toggle between these URLs using `process.env.NODE_ENV === 'development'`.

## Proposed Changes

---

### Backend API: Local File Server

#### [NEW] `src/frontend/src/app/api/manager/serve/route.ts`
- Create a new GET endpoint similar to `/preview`, but designed to serve the full raw file (PDF/PPTX) instead of a text/png preview.
- It will read the `?file=` parameter, securely resolve it against `docs/archives_translation/proceedings/`, and return a `NextResponse` with the raw file buffer and appropriate headers.

---

### Backend API: Workshop Compiler

#### [MODIFY] `src/frontend/src/app/api/manager/save/route.ts`
- **URL Generators:** 
  - Create a new `buildLocalUrl()` helper that constructs the route to the new endpoint, e.g., `/api/manager/serve?file=14th/Session/filename.pdf`.
- **Archive Generation (`[year].json`):** 
  - For all Resources (Program, Participant List), Talks, Posters, and Student Awards, append new `local_target_path` (and `local_abstract_target_path` where applicable) properties alongside `public_website_url` and `gcloud_url`.

---

### Frontend UI: Dynamic Routing

#### [MODIFY] `src/frontend/src/app/archive/[year]/page.tsx`
- Define `const isLocal = process.env.NODE_ENV === 'development';` at the top of the component or inside the main function.
- **Resources Loop:** Modify the `href` assignment to use `isLocal && res.local_target_path ? res.local_target_path : (res.public_website_url || res.legacy_url || res.url)`.
- **Presentations/Posters Loop:** Modify `presUrl` and `absUrl` to check `isLocal` and use `talk.local_target_path` and `talk.local_abstract_target_path` if available.

## Verification Plan
1. Start the Next.js dev server locally (`npm run dev`).
2. Run `/api/manager/save` to re-compile `2022.json` with the new local target paths.
3. Visit the `http://localhost:3000/archive/2022` page.
4. Verify that the "Download" links for presentations and abstracts point to `/api/manager/serve?file=...` instead of `https://storage.googleapis.com/...`.
5. Click a link to ensure the local API correctly serves the PDF from the `docs/archives_translation/proceedings` directory.
