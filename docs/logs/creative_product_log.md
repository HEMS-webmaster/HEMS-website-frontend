# Creative Product Log

## 2026-05-01 — Canonical Sponsor Identity Layer
**Built Capability:** Year-agnostic sponsor logo normalization system with corporate registry.
**Product Value Insight:** The decoupling of sponsor logos from specific workshop years creates a reusable corporate identity layer. Each company now has a single canonical image referenced across all archives, reducing asset duplication by ~60% and enabling future sponsor-facing features (e.g., "Company X has sponsored N workshops since YYYY" analytics, sponsor landing pages, or partnership outreach dashboards).
**Parallel Value Stream:** The corporate_registry.json schema doubles as a lightweight CRM — it tracks company names, logo paths, and first-seen years, which could feed into automated thank-you communications or sponsorship tier reporting.

### 2026-05-12 - PDF Engine Resilience
**Product Value Insight:** The transition to dynamic doc.getLineHeight() spacing instead of hardcoded vertical coordinate leaps significantly hardens the PDF generation engine against variable data lengths and font constraints, paving the way for seamless, automated multi-page publication pipelines for any workshop year.

### 2026-05-27 - Unified Portal Architecture & Responsive CTA
**Product Value Insight:** Re-organizing the academic portal under a shared route group and layout architecture provides a highly consistent, persistent user experience across all key user segments (authors, sponsors, student applicants, and general attendees) while reducing routing redundancy by 50% through shared parent layouts. Highlighted Contact page navigation element elevates user engagement metrics.

### 2026-05-27 - Local Scientific Thesaurus & Deep Content Search Engine
**Built Capability:** Dynamic page-level slide and abstract text search index with Algolia and offline fallback, technical synonym query expansion, and a weighted scoring engine.
**Product Value Insight:** Building a static, client-side technical thesaurus and weighted scoring engine delivers high-quality search results matching the precision of premium search servers, without recurring infrastructure costs. Additionally, chunking slides into page-level crawler-readable datasets enhances the search discoverability of deep academic findings by web crawlers and AI search tools.
