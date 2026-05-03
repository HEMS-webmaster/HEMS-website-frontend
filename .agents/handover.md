# HEMS Next.js Handover Document

**Summary:** Migrated full hosting stack from Vercel/rbellAdapt to Firebase Classic Hosting under HEMS-webmaster; transferred 1GB/348-file GCS archive from `hems-archive-assets` to `hems-workshop-archives` under new project `hems-workshop`; deployed live site to `hems-workshop.web.app`; updated all bucket refs in source + archive JSON; configured static export pipeline (`output: 'export'`) with all Manager API routes annotated `force-static`.
**Current Task:** Infrastructure Migration (Vercel → Firebase, Git account transfer, GCS bucket transfer)
**Next Step:** DNS cutover — point `www.hems-workshop.org` at Firebase via GoDaddy (deferred by @bo until later in development). Continue populating remaining workshop archives (pre-2017). Consider deploying a GitHub Actions workflow for auto-deploy on push to main.
**Timestamp:** 2026-05-03 10:25
