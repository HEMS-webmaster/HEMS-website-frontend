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
*   **Account Name:** `rbellAdapt`
*   **Admin Account Email:** `adaptivesensing@gmail.com`
*   **Repository Name:** `hems-website-frontend`
*   **Remote URL:** `adaptivesensing@gmail.com:rbellAdapt/hems-website-frontend.git`
*   **Primary Branch:** `main`

---

## 2. Frontend Hosting (Vercel)
*   **Platform:** Vercel (Next.js native hosting)
*   **Project Name:** `[Pending Setup]`
*   **Production URL:** `[Pending Deployment]`
*   **Connected Repo:** `Pending Deployment`
*   **Auto-Deploy:** Enabled on pushes to `main`

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
*   **Platform:** Google Cloud Platform (GCS / Cloud Functions) & Cloud Firestore
*   **Purpose:** Automated ingestion pipeline for PDFs and NoSQL metadata storage.
*   **GCP Project ID:** `hems-workshop-production`
*   **GCP Owner Account:** `hemsworkshop@gmail.com`
*   **GCS Bucket Name (Archive):** `hems-archive-assets`
*   **Firebase Environment Variables Needed:**
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `FIREBASE_CLIENT_EMAIL` (Server-side)
    *   `FIREBASE_PRIVATE_KEY` (Server-side)

---

## 5. Domain & DNS
*   **Primary Domain:** `www.hems-workshop.org`
*   **Registrar:** `[Pending - e.g., GoDaddy, Namecheap]`
*   **DNS Provider:** `[Pending - e.g., Cloudflare, Vercel]`
*   **Status:** Legacy site currently active. Will require DNS repointing to Vercel upon final launch.
