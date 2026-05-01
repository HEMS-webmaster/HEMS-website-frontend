# Goal: Referenced Institute Author Groups

The objective is to implement a referenced "Institute" list for each presentation and poster. Instead of nesting authors inside institutes, each presentation will have a buildable list of institutes, and each author will have a dropdown to select which institute they belong to. We will also implement an auto-extraction routine to migrate existing author data seamlessly.

## User Review Required
> [!IMPORTANT]
> The auto-extraction routine will trigger when the Manager component loads. It will look for commas in existing author names (e.g., "John Doe, University of Science"), split the string, add "University of Science" to the new institute list, and re-assign the author's name to just "John Doe" while linking them to the institute. Does this logic adequately cover your existing dataset?

## Proposed Changes

---

### Shared Schema & Components

#### [MODIFY] `src/frontend/src/app/manager/components/PresentationsManager.tsx`
- **Data Structure:**
  - Update `Author` interface: `institute?: string | null`.
  - Update `Presentation` interface: add `institutes?: string[]`.
- **UI - Institute List:**
  - Above the Authors list in each presentation card, add a "Manage Institutes" section to build an array of strings.
- **UI - Author Dropdown:**
  - Next to each Author's name input, add a `<select>` dropdown populated with the presentation's `institutes` array, plus a "None" option.
- **Auto-Extraction (Migration):**
  - Add a `useEffect` hook that runs once on component mount. It will iterate through all existing presentations.
  - If an author's name contains a comma, it will split it: the first part becomes the name, the second part becomes an institute.
  - The extracted institute is added to the presentation's `institutes` array (avoiding duplicates), and the author's `institute` reference is set.

#### [MODIFY] `src/frontend/src/app/manager/components/PostersManager.tsx`
- Mirror the exact same data structure, UI, and auto-extraction logic applied to `PresentationsManager.tsx`.

---

### Backend API: Save Route

#### [MODIFY] `src/frontend/src/app/api/manager/save/route.ts`
- Update the mapping loops for both `sessionGroup.presentations` and `ws.posters` to include the new `institutes` array when generating the final JSON artifact.

---

### Frontend UI: Archive Template

#### [MODIFY] `src/frontend/src/app/archive/[year]/page.tsx`
- Refactor the `authorElements` rendering block in the template.
- Group the `talk.authors` array by their `institute` field.
- Render each group separated by a new line. For example:
  - `John Doe, Jane Smith (University of Mars)`
  - `Alex Johnson (University of Venus)`

## Verification Plan

### Automated Tests
- Validate TypeScript compilation (`npm run build`) to ensure the new interface properties don't break existing components.

### Manual Verification
- Open the Workshop Manager locally and load an existing archive (e.g., 2022). Verify that the auto-extraction cleanly splits existing names and institutes.
- Test adding, removing, and renaming institutes. Ensure the author dropdowns reflect these changes in real-time.
- Save the workspace and verify the JSON artifact contains the new structure.
- Navigate to the frontend archive page and verify authors are grouped by institute on separate lines.
