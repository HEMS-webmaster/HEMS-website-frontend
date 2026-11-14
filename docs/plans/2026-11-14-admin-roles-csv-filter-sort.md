# Architecture Plan: Administrative Panel Roles, CSV Upload (Append/Overwrite), & Whitelist Filter/Sort

**Date:** 2026-11-14  
**Epic Owner:** `@bo` | **Contributors:** `@web`, `@dev`, `@arch`  
**Status:** Executing

---

## 1. Objectives
1. Remove `'general'` from the Administrative Whitelist role assignment UI because general portal/proceedings access is automatic for all registered users.
2. Add `'oral presenter'`, `'poster presenter'`, and `'corporate sponsor'` roles (alongside `'attendee'`, `'submitter'`, `'reviewer'`, `'board'`, and `'admin'`), tolerating CSV spelling variants such as `'corperate sponsor'`.
3. Store optional `name` alongside `email` and `roles` in `whitelist/{email}` (`{ name, roles, updatedAt }`), filling names when not already present without clobbering existing curated names.
4. Provide a staged **CSV Upload** workflow on `/admin` with post-upload selection between **Append** and **Overwrite** modes for the CSV-specified role(s), preserving unrelated roles and people's core `email`/`name` entries.
5. Add comprehensive **Filter** (text search + role filter pills including `No Special Roles`) and **Sort** controls (`Name`, `Email`, `Role Count`) plus inline name editing in the Whitelist table.

---

## 2. File Inventory
- [whitelistCsv.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/utils/whitelistCsv.ts) — Role definitions (`ADMIN_ASSIGNABLE_ROLES`, `ROLE_DISPLAY_META`), alias normalizer, headered/headerless CSV parser, Append/Overwrite diff engine, and sample CSV generator.
- [useWhitelistAdmin.ts](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/hooks/useWhitelistAdmin.ts) — Custom React hook encapsulating Firestore (`whitelist` + `users` name lookup, `writeBatch` up to 400 docs/batch) and mock `sessionStorage` CRUD operations.
- [page.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/admin/page.tsx) — Admin Whitelist Manager UI: manual add (`email` + `name` + role pills), CSV staging with Append/Overwrite mode & affected-count previews, inline name editor, role pills, and filter/sort toolbar.
- [Navbar.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) — Synced `ROLE_DEFINITIONS` badge metadata; strips `'general'` when higher/workshop roles exist while showing `'general'` automatically if `roles` is empty.
- [layout.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/(portal)/layout.tsx) — Dev Mode Role Switcher updated for automatic `general` (`""`) and new presenter/sponsor presets.
- [AuthContext.tsx](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/context/AuthContext.tsx) — Reads `whitelist/{email}.name` and `roles` while preserving `firestore.rules` `users/{uid}` `allow create` compliance (`['general']` or exact whitelist match).

---

## 3. Data & Security Guarantees
- **`whitelist/{email}` Schema:** `{ name: string, roles: string[], updatedAt: string }` (note `roles` may be `[]`, meaning general access only).
- **Firestore `users/{uid}` Creation Rule Preserved:** When creating a `users/{uid}` document on registration or first OAuth sign-in, `AuthContext` assigns `['general']` when `whitelist/{email}.roles` is empty or missing, or the exact raw `whitelist/{email}.roles` array when populated, ensuring `firestore.rules` lines 92–96 continue passing without requiring Cloud Function / rule changes.
- **Zero `any` Policy:** All TypeScript modules use strict types and `unknown` error catching.

---

## 4. Verification Plan
1. `Set-Location src/frontend; npx tsc --noEmit` exits `0`.
2. Verify CSV parser & Append/Overwrite diff behavior via read-only Node execution.
3. Verify `/admin/` and `/layout-portal/` return HTTP `200` on local Next.js dev server.
4. Stage and commit only touched files cleanly on `main`.
