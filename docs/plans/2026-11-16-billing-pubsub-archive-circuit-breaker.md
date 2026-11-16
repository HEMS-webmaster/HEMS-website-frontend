# Implementation Plan — Addendum 37: Billing Pub/Sub Archive Circuit Breaker (`billing-budget-alerts`) & Recovery Tooling

**Date:** 2026-11-16  
**Leads:** `@ops` (Cloud Functions Pub/Sub handler, IAM guardrails, Firestore rules, recovery CLI) + `@arch` (governance) + `@qa` (verification)  
**Budget & Topic:** Budget ID `8e66a672-bc09-401c-bf59-6f5c98bdf1e4` (`\$5.00/mo` target, `50% / 90% Forecast / 100% / 150%`) -> `projects/hems-workshop/topics/billing-budget-alerts`

## Architecture Overview

1. **Circuit Breaker Function ([`budgetCircuitBreaker.ts`](file:///c:/AntigravityP1_2/HEMS-website/functions/src/budgetCircuitBreaker.ts))**
   - Subscribes via `onMessagePublished` (`topic: "billing-budget-alerts"`, `region: "us-central1"`, `maxInstances: 2`, `memory: "256MiB"`, `timeoutSeconds: 60`).
   - Parses Google Cloud Billing Budget v1.0 payloads and triggers **only** on actual spend (`costAmount >= 7.5` USD default via `HEMS_ARCHIVE_CUTOFF_USD`, ignoring forecast-only spikes).
   - Enforces per-billing-interval idempotency via `system_alerts/budget_circuit_breaker` so repeat ~20-minute Pub/Sub heartbeats never spam IAM writes or alert emails.
   - Calls the GCS JSON API (`storage/v1/b/hems-workshop-archives/iam`) with `applicationDefault()` credentials to strip `allUsers` and `allAuthenticatedUsers` public read bindings while preserving service-account/project-owner bindings, logs audit telemetry, and sends a high-priority Postmark email (when `POSTMARK_SERVER_TOKEN` is configured).

2. **Firestore Audit Lock ([`firestore.rules`](file:///c:/AntigravityP1_2/HEMS-website/firestore.rules))**
   - Adds `match /system_alerts/{alertId}` (`allow read` for Board & Admin, `allow write: if false`).

3. **IAM & Operator Recovery Scripts**
   - [`configure-free-tier-guardrails.ps1`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/configure-free-tier-guardrails.ps1): Grants bucket-scoped `roles/storage.admin` on `gs://hems-workshop-archives` to the Compute Engine & App Engine Cloud Functions service accounts.
   - [`manage-archive-circuit-breaker.ps1`](file:///c:/AntigravityP1_2/HEMS-website/infrastructure/manage-archive-circuit-breaker.ps1): Provides `status`, `restore-public`, `pause-public`, and `test-pubsub` actions for 1-command operator verification and recovery.
