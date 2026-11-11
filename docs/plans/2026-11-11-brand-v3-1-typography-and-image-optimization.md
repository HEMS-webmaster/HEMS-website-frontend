# Architectural Plan: Brand Guidelines v3.1.0 Sitewide Rollout & Non-Generative Web Image Optimization

- **Date:** 2026-11-11
- **Author:** `@arch` (with `@dev`, `@brand`, `@ops`, `@qa`, `@prod`)
- **Status:** APPROVED BY `@bo` — EXECUTING

---

## 1. Objectives & Scope

1. **Brand Guidelines `v3.1.0` Rollout (`Dual-Font Refinement`):**
   - Retire `IBM_Plex_Mono` (`--font-ibm-mono`, `font-mono`, and `Consolas` social-card overlays) across the HEMS web frontend (`src/frontend/src/`) so UI badges, photo credit pills, dates, fees, spectral peak annotations, and tables render in clean `Noto Sans` (`tabular-nums` for aligned figures) paired with `Source Serif 4` display headings.
   - Alias `--font-mono: var(--font-noto-sans), system-ui, -apple-system, sans-serif;` in [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css) so locked `/archive/[year]` pages automatically inherit `Noto Sans` with **zero file edits** to `src/frontend/src/app/archive/**`.

2. **Web-Sized Photography & Non-Generative Quality Enhancement (`72.2 MB` -> `~2.6 MB`):**
   - Downscale and progressively encode the 11 multi-megabyte camera originals in `src/frontend/public/images/{history,gallery}/` (`1.23 MB`–`10.36 MB` each) to fast-loading web dimensions (`<= 1600px` long edge, `~110–250 KB` each).
   - Apply **strictly classical, content-preserving photographic signal processing** (`Pillow` + `NumPy` + `SciPy` — **zero generative AI**, zero alteration of faces, expressions, postures, or scientific data):
     - **EXIF Orientation Normalization:** Bake `ImageOps.exif_transpose()` into `group-photo-2025.jpg` (`exif_orient=8`, upright `3712×5568` -> `1120×1600`) and synchronize intrinsic `width`/`height` props in [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx) to prevent layout shift (`CLS = 0`).
     - **Compositional Framing Crops:** Trim distracting empty ceiling, empty carpet, or edge clutter on `single-track-auditorium-smiles-2015.jpg`, `poster-session-smiles-oxnard-2017.jpg`, `sponsor-exhibit-smiles-2015.jpg`, `virginia-beach-boardwalk-2025.jpg`, `banquet-awards-applause-2019.jpg`, `don-cesar-hawaiian-smiles-2013.jpg`, `golden-hour-harbor-reception-2015.jpg`, and `group-photo-2025.jpg` while keeping 100% of workshop subjects intact.
     - **Chroma & Luminance Grain Reduction:** Apply YCbCr bilateral/Gaussian chroma smoothing and edge-preserving luminance denoising to high-ISO indoor/dusk and 1999 CCD photographs (`golden-hour-harbor-reception-2015.jpg`, `banquet-awards-applause-2019.jpg`, `sponsor-exhibit-smiles-2015.jpg`, `usf-cot-auv-nosecone-ms.jpg`, `group-photo-2025.jpg`).
     - **Tonal & White-Balance Polish:** Neutralize tungsten/fluorescent color casts (`sponsor-exhibit-smiles-2015.jpg`, `usf-cot-auv-nosecone-ms.jpg`), recover backlit shadows (`st-pete-beach-don-cesar-2013.jpg`, `golden-hour-harbor-reception-2015.jpg`), and clear volcanic steam / coastal haze via levels normalization (`fox-volcanic-fumarole-ms.jpg`, `myrtle-beach-pier-surf.jpg`, `virginia-beach-boardwalk-2025.jpg`).
     - **Resolution Upscaling & Diagram Crispness:** Upscale sub-`1200px` archived presentation captures (`verbeck-uav-drone-ms-2025.jpg`, `fox-volcanic-fumarole-ms.jpg`, `bell-subsea-lander-ms-2025.jpg`, `danell-dragonfly-titan-ms-2019.jpg`, `kibelka-aerosol-ms-cad-2025.jpg`, `verbeck-urban-ms-heatmap-2019.jpg`) to `1400px` wide via block-artifact pre-smoothing + `Lanczos` resampling + halo-free edge-guided unsharp masking, exporting CAD/plot figures with `4:4:4` chroma (`subsampling=0`).

3. **Before/After Review Archive:**
   - Keep `docs/source-documents/pics/` 100% untouched.
   - Save untouched `before/`, optimized `after/`, and side-by-side `comparisons/` in git-ignored `src/frontend/photo_review/` (outside `public/` so `0 KB` enters `src/frontend/out/`).

---

## 2. File-by-File Execution Matrix

| Domain | Files | Action |
| :--- | :--- | :--- |
| **Git Hygiene (`@ops`)** | [`.gitignore`](file:///c:/AntigravityP1_2/HEMS-website/.gitignore) | Ignore `src/frontend/photo_review/` local comparison archive. |
| **Font & Theme Core (`@dev`)** | [`layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/layout.tsx), [`globals.css`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/globals.css), `opengraph-image.png`, `twitter-image.png` | Remove `IBM_Plex_Mono` network font; alias `--font-mono` to `--font-noto-sans`; regenerate `1200×630` social share cards in Dual-Font `v3.1.0` styling. |
| **Public & Portal UI (`@dev`)** | [`page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/page.tsx), [`about/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/about/page.tsx), [`history/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/history/page.tsx), [`formatting-guidelines/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/formatting-guidelines/page.tsx), `(portal)/**`, `Navbar.tsx`, `Footer.tsx`, `ArchiveHubClient.tsx`, `CitationModal.tsx`, `components/workshop/*.tsx` | Replace `font-mono` and `var(--font-ibm-mono)` with clean `Noto Sans` (`tabular-nums` on numeric figures/dates/scores) and synchronize updated `width`/`height` image attributes. |
| **Web Photography (`@dev`)** | `src/frontend/public/images/{history,gallery}/*.jpg` (21 files) | Generate web-sized, non-generatively enhanced JPEGs + Before/After comparison sheets. |
| **Protected Archives** | `src/frontend/src/app/archive/**`, `src/frontend/src/data/**`, `tools/manager/**` | **STRICT ZERO DIFF (`0` bytes modified).** |

---

## 3. Verification Gates (`@qa`, `@ops`)

1. `Select-String` audit confirms `0` remaining `IBM_Plex_Mono` or `ibm-mono` references across `src/frontend/src/` and `0` `font-mono` classes in unlocked components.
2. Visual inspection of Before/After comparison sheets confirms zero content distortion, zero clipped heads/faces, upright orientation on `group-photo-2025.jpg`, and ~95%+ total image payload reduction.
3. `npm --prefix src/frontend run build` succeeds across all `40/40` static routes with `0` TypeScript errors and `0` diff in `src/frontend/src/app/archive/**`.

