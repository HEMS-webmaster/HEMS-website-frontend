# Implementation Plan - HEMS Local Scientific Synonym Thesaurus & Query Expansion

This plan outlines the architecture and execution steps to implement a local, curated scientific synonym thesaurus and semantic query expansion engine inside HEMS search components, enabling cost-free semantic matching.

## User Review Required

> [!IMPORTANT]
> **Scientific Thesaurus Data File**:
> We will create a static scientific synonym index at `src/frontend/src/data/scientific_synonyms.json` containing HEMS-specific research fields. This keeps our data model clean and modifiable.
>
> **Tiered Relevance Ranking**:
> To prevent synonym matches from cluttering search results, we will implement a weighted scoring model. Exact keyword matches in title/authors will rank highest, followed by exact matches in slide text, followed by semantic synonym matches in title, and finally synonym matches in slide text.

## Open Questions

> [!WARNING]
> 1. **Default Synonym Mapping**: Are there specific technical or chemical terminology mappings you want added to the initial dictionary? Our proposed default dictionary covers *Spaceflight*, *Marine*, *Instrumentation*, and *Miniaturization* concepts.
> 2. **Synonym Search Toggle**: Should search expansions run automatically on all queries, or would you prefer a checkbox UI option (e.g. "Enable Semantic Synonym Search") to let users toggle it manually? (Recommended: Run automatically with exact matches ranked first).

---

## Proposed Architecture & Changes

### 1. Scientific Synonym Data Model

#### [NEW] [scientific_synonyms.json](file:///c:/Antigravity/HEMS-website/src/frontend/src/data/scientific_synonyms.json)
- Create a structured JSON dictionary of scientific synonym groups:
  ```json
  {
    "spaceflight": ["space", "mars", "planetary", "lunar", "titan", "europa", "venus", "probe", "atmosphere"],
    "marine": ["underwater", "oceanic", "sea", "vent", "plume", "hydrothermal", "lake", "mims", "cruise", "suncoaster"],
    "quadrupole": ["qms", "mass filter", "mass analyzer", "ion trap", "vacuum", "tof", "time-of-flight", "magnetic sector"],
    "miniaturization": ["portable", "handheld", "micro", "mems", "field", "compact"]
  }
  ```

---

### 2. Frontend Semantic Search Expansion

#### [MODIFY] [page.tsx](file:///c:/Antigravity/HEMS-website/src/frontend/src/app/archive/page.tsx)
- Import the synonym dictionary `scientific_synonyms.json`.
- Implement a **Query Expansion Tokenizer**:
  - Split the search input string into keywords.
  - Expand each keyword by adding related synonyms from the dictionary.
- Implement **Relevance Score Calculation**:
  - For each paper and matched slide, compute a match score based on query matching rules:
    - **Exact Title Match**: +10 points.
    - **Exact Author/Affiliation Match**: +8 points.
    - **Exact Slide Content Match**: +5 points.
    - **Synonym Title Match**: +3 points.
    - **Synonym Slide Content Match**: +1 point.
  - Sort search results chronologically within their respective score tiers, ensuring exact matches are presented first.
- Align the active category filter buttons with the JSON synonym dictionary to use a single, unified data model.

---

## Verification Plan

### Automated Tests
- Validate compilation success:
  ```powershell
  npm run build
  ```

### Manual Verification
- **Semantic Expansion Test**: Search for "Mars" and verify that papers containing "Spaceflight" or "Planetary" appear in results, ranked below exact "Mars" title matches.
- **Category Alignment Test**: Select the "Marine" topic category and verify that all related oceanic, underwater, and sea vent papers filter correctly.
