# Goal: Native Google Cloud URL Routing in Workshop Manager

The current Workshop Manager UI correctly downloads the legacy files from `hems-workshop.org` and saves them locally. However, when the Manager translates the data into the production Next.js JSON schema (`save/route.ts`), it simply passes the legacy URLs through to the frontend. This required manual python scripts to fix for Workshop 14. 

We need to update the backend logic so that any future workshop data ingested automatically builds the correct `storage.googleapis.com` Cloud CDN path when it creates the `[year].json` file.

## User Review Required
> [!WARNING]
> This plan changes the core translation behavior of `save/route.ts`. It will permanently map all presentation, abstract, poster, and administrative links directly to `https://storage.googleapis.com/hems-archive-assets/...` based strictly on their downloaded `fileName` and `session`. If a file is not downloaded, we will still use the legacy URL as a fallback. 

## Proposed Changes

---

### Backend API

#### [MODIFY] `src/frontend/src/app/api/manager/save/route.ts`
- **Helper Function:** Introduce a `buildCloudUrl(category, wsNum, session, fileName)` function that dynamically constructs the Google Cloud path (e.g., `https://storage.googleapis.com/hems-archive-assets/proceedings/{wsNum}th/{cleanSession}/{fileName}`).
- **Administrative Links:** Update the `program_url` and `participant_list_url` mapping to use `buildCloudUrl('Administrative')` if `program_file` / `participant_list_file` exists; otherwise fallback to the legacy string.
- **Presentations & Abstracts:** Update the mapping in the `talks` array. If `presentation_file` or `abstract_file` is defined, call `buildCloudUrl('Presentation', ws.number, pres.session, pres.presentation_file)`.
- **Posters & Student Awards:** Update their respective mapping loops to route through `buildCloudUrl('Poster')` and `buildCloudUrl('Student_Award')`.

#### [MODIFY] `src/frontend/src/app/manager/page.tsx`
- Ensure that the `onPaste` handlers for `program_url` and `participant_list_url` actually save the resulting `filePath` (the downloaded filename) to `currentWs.program_file` and `currentWs.participant_list_file` in the state array, otherwise the backend won't have the filename to construct the cloud URL.
- **Frontend Button Split:** Rename the existing "Push to Cloud" button to "Push Frontend to Git". This button will only commit and push code to the repository (triggering Vercel).
- **New GCloud Button:** Add a new "Sync Assets to GCloud" button next to it. This button will trigger a new endpoint dedicated exclusively to syncing heavy PDF assets to Google Cloud Storage.

#### [MODIFY] `src/frontend/src/app/api/manager/push/route.ts`
- Remove the `gsutil rsync` block. This route will be strictly dedicated to Git operations for the Next.js frontend.

#### [NEW] `src/frontend/src/app/api/manager/sync-gcs/route.ts`
- Create a new API route dedicated to executing the Google Cloud Storage upload.
- It will execute `gsutil -m rsync -r docs/archives_translation/proceedings gs://hems-archive-assets/proceedings` to securely synchronize the heavy assets directly to the cloud CDN without bloating the Git repository.

## Verification Plan
1. Launch the local development server.
2. Open the Workshop Manager UI and select a test workshop.
3. Paste a legacy URL into the "Legacy Program URL" field.
4. Verify the UI locally sets `program_file`.
5. Click **Save and Present on Local Host**.
6. Inspect the generated `<year>.json` archive manifest to confirm it automatically produced the `https://storage.googleapis.com/...` link without any manual intervention.
