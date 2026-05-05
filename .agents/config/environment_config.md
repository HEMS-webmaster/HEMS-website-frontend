# 🔑 Environment & Account Manifest

**Custodian:** `@ops`
**Purpose:** This document tracks all version control, hosting, and third-party service configurations required for the HEMS Website Modernization project. 

> [!WARNING]
> **SECURITY MANDATE:** Never hardcode actual API keys, secrets, or passwords in this document. Use this file strictly to track account ownership, URLs, and environment variable *names*.

---

<!-- 0. GoDaddy Configuration
Customer number is 11646337. user name: HEMS
 931MeV

president@hems-workshop.org, pass: _NzYWK86b9/PuQV

-->


## 1. Version Control (Git)
*   **Account Name:** `HEMS-webmaster`
*   **Admin Account Email:** `webmaster@hems-workshop.org`
*   **Repository Name:** `HEMS-website-frontend`
*   **Remote URL:** `webmaster@hems-workshop.org:HEMS-webmaster/HEMS-website-frontend.git`
*   **Primary Branch:** `main`

---

## 2. Frontend Hosting (Firebase)
*   **Platform:** Firebase Classic Hosting (free Spark tier, static export)
*   **Project Name:** `hems-workshop`
*   **Project ID:** `hems-workshop`
*   **Preview URL:** `https://hems-workshop.web.app`
*   **Production URL:** `https://www.hems-workshop.org` (pending DNS cutover)
*   **Connected Repo:** `HEMS-webmaster/HEMS-website-frontend`
*   **CI/CD Pipeline:** Automated GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`)
*   **CI/CD Auth:** Google Cloud Workload Identity Federation (Keyless OIDC)
    *   **WIF Provider:** `projects/996590178042/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`
    *   **Service Account:** `firebase-github-deploy@hems-workshop.iam.gserviceaccount.com`

---

## 3. Search Engine (Algolia)
*   **Platform:** Algolia
*   **Purpose:** Instant search (<50ms) for the 25+ year paper archive.
*   **Account Owner:** `[Pending]`
*   **Application ID:** `[Pending]`
*   **Environment Variables Needed:**
    *   `NEXT_PUBLIC_ALGOLIA_APP_ID`
    *   `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` (Safe for client)
    *   `ALGOLIA_ADMIN_KEY` (SERVER-SIDE ONLY)

---

## 4. Backend & Storage (Google Cloud / Firebase)
*   **Platform:** Google Cloud Platform (GCS)
*   **Purpose:** Automated ingestion pipeline for PDFs and NoSQL metadata storage.
*   **GCP Project ID:** `hems-workshop` (same as Firebase project)
*   **GCP Project Number:** `996590178042`
*   **GCP Owner Account:** `webmaster@hems-workshop.org`
*   **GCS Bucket Name (Archive):** `gs://hems-workshop-archives` (Transfer Complete)
*   **Firebase Environment Variables Needed:**
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `FIREBASE_CLIENT_EMAIL` (Server-side)
    *   `FIREBASE_PRIVATE_KEY` (Server-side)

---

## 5. Domain & DNS
*   **Primary Domain:** `www.hems-workshop.org`
*   **Registrar:** GoDaddy (Customer #11646337)
*   **DNS Provider:** GoDaddy (pending cutover to Firebase)
*   **Status:** Legacy site active. DNS must be repointed to Firebase after GCS transfer is confirmed.
