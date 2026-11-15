# Implementation Plan: On-Site 3rd-Party Ads, Curated Whitelists & Permanent Host Recognition Analysis (`@prod` & `@brand`)

- **Date:** 2026-11-15
- **Custodians:** `@prod`, `@brand`, `@arch`
- **Target Artifact:** [`hems_2027_marketing_and_ads_playbook.html`](../marketing/hems_2027_marketing_and_ads_playbook.html)
- **Role & Codebase Guardrails:** `@prod` and `@brand` are strictly read-only for `src/`, and `src/frontend/src/app/archive/**` requires explicit `@bo` approval prior to any source modification (`docs/project_charter.md` Guardrail #1). All updates are strictly confined to `docs/marketing/`, `docs/plans/`, and `docs/logs/`.

---

## 1. Strategic Decisions & Findings

1. **Protect the `$10,000/month` (`$120,000/yr`) Google Ad Grant First:**
   - Third-party programmatic display networks (`Google AdSense`, open exchanges) directly conflict with Google Ad Grants Website Policy, whereas mission-aligned nonprofit corporate sponsorship acknowledgments and host credits are allowed.
2. **Enforce IRS `IRC § 513(i)` Qualified Sponsorship Framing (`$0` UBIT):**
   - Displaying a sponsor's or workshop host's logo, name, technical equipment domain, and neutral outbound URL avoids Unrelated Business Income Tax (`Form 990-T`) triggers associated with price promos, call-to-action discounts, or qualitative superlatives.
3. **Recommended On-Site Placement Architecture:**
   - **Permanent Free Host Showcase on `/archive/[year]`:** Upgrade HEMS's existing `host_corporation` JSON schema (`1999`–`2025`, e.g., Pfeiffer Vacuum, NASA JPL, Inficon, USF COT) into a permanent, tasteful institutional host patronage showcase to help recruit 2027/2029+ hosts at `$0` cost. *(Code changes to `/archive/[year]/page.tsx` queued for explicit `@bo` archive unlock.)*
   - **1–3 Curated First-Party Whitelist Underwriter Slots (Not EthicalAds / BuySellAds / AdSense):** Replace ad networks (high traffic floors, ~25% marketplace fees, external script risks, low `~$12–$25/mo` yields) and heavy `GAM`/`doubleclick` tags (blocked by ~35–45% of academic/technical browsers) with 3 ad-blocker-proof, `CLS = 0` Specimen White placements managed via HEMS's existing JSON / Google Sheet / `/admin/analytics` pipeline at `$750–$1,500/yr` (or bundled into a Sustaining Sponsor tier).

---

## 2. Planned Playbook Enhancements (`hems_2027_marketing_and_ads_playbook.html`)

1. **CSS Additions (Brand v3.2.0):** `.host-showcase-mock`, `.whitelist-slot-grid`, `.whitelist-card`, and `.verdict-badge` variants (`verdict-yes`, `verdict-cond`, `verdict-no`) using Alabaster/Specimen White/Sapphire/Teal/Amber/Rose tokens with responsive mobile stacking.
2. **Sticky Navigation & Dynamic Checklist Progress:** Add Pillar 4 navigation pill (`#section-4-onsite-ads`), renumber Roadmap (5), UTM/Analytics (6), and Checklist (7) (`20` tasks total).
3. **New Section 4 (`#section-4-onsite-ads`):**
   - Card 4.1: Google Ad Grants & `IRC § 513(i)` dual guardrails + 5-method comparison ledger table (`Host Showcase`, `First-Party Whitelist`, `Google Ad Manager Direct-Sold`, `EthicalAds / BuySellAds`, `AdSense`).
   - Card 4.2: Permanent `/archive/[year]` Host Showcase pros/cons, codebase audit of existing `host_corporation` data, and interactive 2-tab live mockup (`Pfeiffer Vacuum` 2025 Corporate Host & `NASA JPL` 2002 Institutional Host).
   - Card 4.3: 1–3 Whitelisted Underwriter spots design (`Inficon`, `BaySpec`, and open Slot 3 live mockup), 3 strategic placement zones (`/archive`, `/layout-portal` + `/call-for-papers`, `/student-awards`), GAM conditional setup note, and copyable Sponsor & Host Pitch snippet.
4. **UTM & Checklist Updates:** Add UTM row for `#section-4-onsite-ads` placements and add tasks `t19` & `t20` to Section 7.
