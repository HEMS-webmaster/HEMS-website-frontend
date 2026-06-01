# Workshop Manager Asset Status Indicators & Action Overhaul

This plan outlines the enhancements to the HEMS Workshop Manager's asset tracking UI. We will modify `DragDropZone.tsx` and the underlying APIs to show status indicators, interactive folder-opening links, file deletion commands, and clean fallback states for 'Local Target Path', 'GCloud URL', and 'Public Website URL'. We will also remove redundant preview blocks across all manager screens.

---

## User Review Required

> [!IMPORTANT]
> **Active Directory Opening Feature**:
> Clicking the 'Local Target Path' link in local development will directly launch a Windows Explorer window showing the exact target folder on the host computer. This is implemented via a secure local-only API route.

---

## Open Questions

> [!NOTE]
> No unresolved design conflicts. The visual statuses align directly with the standard theme colors of the workspace dashboard.

---

## Proposed Changes

### Core API Layer (Local Development Only)

#### [MODIFY] [check-file/route.ts](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/api/manager/check-file/route.ts)
- Update the API to perform an asynchronous `HEAD` request to the public Google Cloud Storage bucket link (`gcloudUrl`) to check if the file is already uploaded.
- Generate and return `gcloudExists: boolean` and `gcloudConsoleUri: string` (hyperlink to the specific console proceedings bucket subfolder).

#### [NEW] [open-folder/route.ts](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/api/manager/open-folder/route.ts)
- Create a new GET API endpoint `/api/manager/open-folder` that:
  - Takes a local `path` query parameter.
  - Validates and extracts the parent directory path.
  - Spawns a background shell execution command using `explorer.exe` (on Windows) to open the parent directory in Windows Explorer.

---

### React Frontend Components

#### [MODIFY] [DragDropZone.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/manager/components/DragDropZone.tsx)
- Integrate background polling checks for GCloud file presence from `check-file/route.ts`.
- Restructure the UI status layout for the three asset columns:
  - **Local Target Path**:
    - If file is missing: Greyed out text with no hyperlink.
    - If file is present: Green checkmark `✅` indicator next to label. Path value is styled as a hyperlink. Clicking it calls `/api/manager/open-folder?path=...` to open Windows Explorer. A red `✕` delete button is added to allow direct local deletion via `/api/manager/delete`.
  - **GCloud URL**:
    - If local file and GCloud file are missing: Greyed out.
    - If local file is present, but GCloud file is missing: Display an upload pending icon `📤 Upload Pending` (pushed on live deployment), no hyperlink.
    - If GCloud file has been uploaded: Display an uploaded checkmark `✅`, and make the path a hyperlink pointing to GCloud bucket console view folder.
    - If local file is deleted/missing, but GCloud file is present: Display a deletion pending icon `🗑️ Deletion Pending` (synced on next live deployment), hyperlink pointing to console view folder remains active.
  - **Public Website URL**:
    - If GCloud file is not uploaded: Greyed out text with no hyperlink.
    - If GCloud file is uploaded: Styled as an active hyperlink to the public online location.

#### [MODIFY] [page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/manager/page.tsx)
- Remove the redundant administrative "Attached" preview block below the `DragDropZone` components.

#### [MODIFY] [PresentationsManager.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/manager/components/PresentationsManager.tsx)
- Remove the redundant session presentation "Attached" preview block below the `DragDropZone` components.

#### [MODIFY] [PostersManager.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/manager/components/PostersManager.tsx)
- Remove the redundant poster "Attached" preview block below the `DragDropZone` components.

#### [MODIFY] [StudentsManager.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/manager/components/StudentsManager.tsx)
- Remove the redundant student award "Attached" preview block below the `DragDropZone` components.

---

## Verification Plan

### Automated Tests
- Save workshop files and verify that backend API requests correctly return exact GCloud and local paths.
- Run `npm run build` locally to verify that type checkings are 100% correct.

### Manual Verification
- Test DragDropZone in the local UI:
  - Verify that a missing local file correctly greys out all fields.
  - Drag and drop a file, and verify the green checkmark next to "Local Target Path".
  - Click the "Local Target Path" link and verify that Windows Explorer opens the parent directory.
  - Click the "✕" delete button and verify the local file is removed, updating status to greyed out and marking GCloud with "Deletion Pending" (if previously uploaded).
  - Verify that GCloud files not yet uploaded show `📤 Upload Pending` status, and update to `✅ Uploaded` with active links after executing "Push to Live".
