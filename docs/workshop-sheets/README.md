# HEMS Upcoming Workshop Configuration Guide (Google Sheets + `$0` Nonprofit Tier)

This folder contains the ready-to-import templates for managing **Upcoming Biennial HEMS Workshop** details (starting with the **16th HEMS Workshop • September 2027**) across all **8 dynamic pages** of `hems-workshop.org` using HEMS's **Google Workspace for Nonprofits** account at **`$0.00 / month`**.

> **Separation of Concerns:**
> - **Upcoming Workshop Parameters (Multi-User):** Managed via this **Google Sheet** + [`upcoming_workshop.json`](../../src/frontend/src/data/upcoming_workshop.json).
> - **Historical Proceedings Archives (1999–2025+):** Managed exclusively via the local **Workshop Manager** (`npm run manager` on `http://localhost:4000`).

---

## 1. Five-Minute Google Sheet Setup (One-Time)

1. In your **Google Workspace for Nonprofits** Drive, create a new Google Sheet named:
   **`HEMS Upcoming Workshop Control Center`**
2. **Import Tab 1 (`1_Workshop_Config`):**
   - Rename `Sheet1` to `1_Workshop_Config`.
   - Click **File → Import → Upload** and select [`1_Workshop_Config.csv`](./1_Workshop_Config.csv) (*"Replace current sheet"*).
   - **Recommended Safety Lock:** Select Column `A` (`field_key`), right-click → **View more column actions → Protect range**, and restrict editing of `field_key` to the Webmaster so committee volunteers only edit Column `D` (**`value`**) and Column `E` (**`status`**).
3. **Import Tab 2 (`2_Website_Ingestion_Checklist`):**
   - Add a second tab (`+`) named `2_Website_Ingestion_Checklist`.
   - Click **File → Import → Upload** and select [`2_Website_Ingestion_Checklist.csv`](./2_Website_Ingestion_Checklist.csv) (*"Replace current sheet"*).
   - This tab gives every organizing committee volunteer a live checklist of **all 8 website pages** that ingest Tab 1 and how each page behaves during `TBA` planning vs. `Open` registration.
4. **Share with Organizing Committee Volunteers:**
   - Click **Share** (top right) and grant **Editor** access to the current Workshop Chair, Technical Program Chair, Student Awards Chair, and Sponsorship Coordinator using their regular Google accounts (no GitHub accounts needed!).
5. **Generate the Read-Only CSV Endpoint (`$0` CDN):**
   - Click **File → Share → Publish to web**.
   - In the first dropdown, select **`1_Workshop_Config`** (instead of *Entire Document*).
   - In the second dropdown, select **`Comma-separated values (.csv)`**, then click **Publish** and copy the generated `https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv` link.
   - *(Note: Publishing to web makes the CSV **read-only**; nobody can edit your Sheet without explicit Google Drive permission.)*
6. **Connect the URL to the Website:**
   - Paste that URL into `"sheet_csv_url"` inside [`src/frontend/src/data/upcoming_workshop.json`](../../src/frontend/src/data/upcoming_workshop.json) (or set `NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL` in your build environment).
   - **Instant Live Updates + Static Backup:** Once connected, all 8 pages load static defaults on frame 0 for instant SEO/speed **and** automatically hydrate live edits from the Google Sheet in the browser. Anytime you also want to snapshot the latest Sheet values permanently into Git, run:
     ```bash
     npm --prefix src/frontend run sync:workshop
     ```

---

## 2. Optional `$0` Google Forms Integration (Nonprofit Workspace)

Because `upcoming_workshop.json` and `1_Workshop_Config` include optional URL slots, you can create free **Google Forms** inside HEMS's Google Drive and paste their share links directly into Column `D` (`value`) of the Sheet:
- **`interest_form_url`:** Early *"16th HEMS Workshop (Sept 2027) — Save the Date & Mailing List"* signup form (automatically activates CTA links on Home, Portal, Call for Papers, and Registration while formal registration is still closed).
- **`student_award_form_url`:** *"Student Travel Award Application Packet"* Google Form with PDF file upload into a shared Student Awards Committee Drive folder (adds an online submission button right above `hemsworkshop@hems-workshop.org` on `/student-awards`).
- **`cfp_submission_url` / `reg_portal_url`:** Can point to either a Google Form or an external conference platform (e.g., Ex Ordo) once `cfp_open` / `registration_open` are flipped from `false` to `true`.

---

## 3. How to Privately Host / Preview the Website (`$0` Firebase Spark Tier)

Your repository is already connected to Firebase project `hems-workshop`. To publish a **private, unindexed staging preview** without touching the live `hems-workshop.org` domain:

```bash
# 1. Build the static export locally (24.5 MB)
npm run build

# 2. Deploy to an unlisted 30-day Firebase Hosting Preview Channel ($0 Spark Tier)
npx --prefix src/frontend firebase-tools hosting:channel:deploy preview-2027 --project hems-workshop --expires 30d
```

Firebase CLI will output a cryptographically random HTTPS preview URL:
`https://hems-workshop--preview-2027-<random-hash>.web.app`

You can open that URL on any device or share it privately with HEMS Board members to review changes before merging/pushing to `main`.
