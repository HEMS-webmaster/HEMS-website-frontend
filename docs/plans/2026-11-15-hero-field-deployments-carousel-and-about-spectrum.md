# Plan: Relocate Interactive Mass Spectrum to `/about` & Add Scrollable Archive Field-Deployments Showcase to `/` Hero

**Date:** 2026-11-15  
**Leads:** `@web`, `@dev`, `@arch`  
**Status:** Executing

## Summary
1. Move `<HeroMassSpectrum />` (`src/frontend/src/components/home/HeroMassSpectrum.tsx`) out of the `/` Hero and place it inside a new editorial **Section 04 — Analytical Signatures in the Field** at the bottom of `/about` (`src/frontend/src/app/about/page.tsx`), adjusting the internal widget `<h2>` to `<h3>` for strict semantic heading hierarchy (`h1` -> `h2` -> `h3`).
2. Curate **6 authentic MS field-deployment photographs** drawn directly from HEMS Workshop archive presentations (`2` pre-verified gallery images: `bell-subsea-lander-ms-2025.jpg` and `verbeck-uav-drone-ms-2025.jpg` + `4` newly extracted and visually audited field photos from `local_data/proceedings/`), keeping **0% alcohol**, **0% generative AI** (classical `PyMuPDF` extraction + `Pillow` only), and zero overlap with Section 2 `CHARTER_PILLARS` images on `/`.
3. Create [`HeroFieldDeploymentsCarousel.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/home/HeroFieldDeploymentsCarousel.tsx) featuring native horizontal scroll-snap, Previous/Next controls, a 6-thumbnail filmstrip selector, keyboard navigation, and Provenance-First captions linking directly to `/archive/[year]#[talk.id]`.
4. Wire `<HeroFieldDeploymentsCarousel />` into the right column of `/` Hero (`src/frontend/src/app/page.tsx`).
5. Validate with `tsc --noEmit`, `npm --prefix src/frontend run build` (`45/45` static pages), DOM assertions on `out/index.html` and `out/about/index.html`, archive anchor checks, and restart the local dev server on `http://localhost:3000`.
