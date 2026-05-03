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

## 3. SME Domain Focus (For @sme)
*   **Primary Domain:** Harsh-environment mass spectrometry, scientific archive management, conference logistics.
*   **Key Metrics:** High performance, instant search, responsive mobile-friendly schedule.
*   **Strict Constraints:** Adhere to WCAG 2.1 Accessibility guidelines (high-contrast, screen-reader friendly). Do NOT scrape the existing legacy site due to 5GB+ of large files.

## 4. Brand Tone (For @brand & @prod)
*   **Active Styling Guide:** `docs/design/brand-guidelines.md` (Read this file for all aesthetic rules).
*   **Voice:** Professional, "Rugged Science". Prioritize scientific impact over text-heavy legacy designs.