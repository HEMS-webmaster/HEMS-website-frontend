# 🚀 Project Charter: Workshop on Harsh-Environment Mass Spectrometry (HEMS)

## 1. Project Overview
*   **Mission:** Transition the HEMS website from its legacy state into a modern, high-performance, and searchable scientific hub.
*   **Target Audience:** Scientific community, academic researchers, and government-funded participants interested in mass spectrometers in harsh environments (e.g., Mars rovers, underwater drones).

## 2. Tech Stack Boundaries (For @dev & @ops)
*   **Frontend:** Next.js (React) hosted on Firebase Classic Hosting (free Spark tier, static export). Static Site Generation (SSG) for all public pages. Dark-themed UI (Slate/Charcoal) with vibrant accents (Electric Blue/Safety Orange). The Workshop Manager admin tool runs locally only (`next dev`) and is never deployed.
*   **Backend:** Google Cloud Functions (Python/Node.js) for automated ingestion and processing.
*   **Database:** Cloud Firestore (NoSQL) for metadata, sessions, and speaker bios.
*   **Search Engine:** Algolia (Free Tier) for instant search (<50ms).
*   **Storage:** Google Cloud Storage (GCS) for 25+ years of PDF/PPTX proceedings (5GB+).

## 3. Brand Tone (For @brand & @prod)
*   **Active Styling Guide:** `docs/design/brand-guidelines.md` (Read this file for all aesthetic rules).
*   **Voice:** Professional, "Rugged Science". Prioritize scientific impact over text-heavy legacy designs.

## 4. Legal Domain Focus (For @legal)
*   **Primary Domain:** Website for non-profit organization, public domain .pptx and .pdf files, Creative Commons licenses, CC BY 4.0 licensing terms, public domain images, fair use doctrine, DOI, privacy policy, ORCID.
*   **Key Metrics:** Compliance with data privacy and security laws and regulations. Ensure all work is compliant with data privacy and security laws and regulations.

## 5. SME1 Domain Focus (For @sme1, Alias: @web)
*   **Primary Domain:** Website design, modern UI/UX, SEO, high-performance, accessibility, scientific archive management, conference logistics.
*   **Key Metrics:** High performance, instant search, responsive mobile-friendly schedule.
*   **Strict Constraints:** Adhere to WCAG 2.1 Accessibility guidelines (high-contrast, screen-reader friendly). Do NOT scrape the existing legacy site due to 5GB+ of large files.

## 6. SME2 Domain Focus (For @sme2, Alias: @ms)
*   **Primary Domain:** Mass Spectrometry (MS) Science and Technology, field-deployable mass spectrometry, vacuum technology, inlet systems, ion sources, mass analyzers, detectors, data analysis, instrument calibration, and instrument maintenance.
*   **Key Metrics:** Ensure accuracy and up-to-date information on mass spectrometry.
