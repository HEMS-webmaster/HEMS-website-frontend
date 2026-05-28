# HEMS Proceedings PDF SEO Optimization & Discoverability Plan

This plan outlines the approach to enhance the discoverability of all 669 proceedings PDF files (abstracts and slides) across the HEMS Workshop archives (1st to 15th workshops). By parsing the structured metadata registry at `docs/design/pdf_seo_registry.md`, we will write targeted metadata properties directly to the internal headers of each local PDF file.

---

## User Review Required

> [!IMPORTANT]
> **Binary PDF Header Modification**:
> We will write a Python script `scratch/inject_pdf_metadata.py` using `PyPDF2` to update the internal metadata headers of the physical files in `docs/archives_translation/proceedings/`. 
> Because the proceedings directory is ignored by Git, these changes will affect your local storage. To deploy these optimized PDFs live, you will need to sync them to the Google Cloud Storage bucket (or the public file hosting server where the static PDF downloads are served).

---

## Open Questions

> [!WARNING]
> 1. **Asset Deployment Command**: 
>    Could you confirm the exact command or pipeline used to synchronize local proceedings PDFs to your live assets server (e.g., GCloud Storage bucket)? Once we know the sync command, we can integrate it or document it for your deployment steps.

---

## Proposed Changes

### PDF Metadata Injection Pipeline

#### [NEW] [inject_pdf_metadata.py](file:///c:/Antigravity/HEMS-website/scratch/inject_pdf_metadata.py)
- Create a Python script `scratch/inject_pdf_metadata.py` that will:
  1. Open and parse the registry at `docs/design/pdf_seo_registry.md`.
  2. For each record, locate the PDF at the specified path.
  3. Load the PDF using `PyPDF2.PdfReader`.
  4. Build a new PDF using `PyPDF2.PdfWriter` containing the same pages, and inject the matching metadata:
     - `/Title` (Paper Title)
     - `/Author` (List of authors)
     - `/Subject` (Descriptive subject referencing the workshop year and session)
     - `/Keywords` (Extracted key search terms)
  5. Save the updated PDF back to its original location.
  6. Support a `--dry-run` flag to validate the registry paths without modifying any files.
  7. Support a `--verify` flag to print current metadata headers of all proceeding PDFs.

#### [MODIFY] [implementation_plan.md](file:///c:/Antigravity/HEMS-website/docs/implementation_plan.md)
- Update the system blueprint document to reflect the PDF SEO optimization work.

---

## Discoverability Enhancements (How Else to Prepare the Files)

To maximize how search engine bots and AI indexers crawl and understand the HEMS proceedings, we also recommend the following structural discoverability steps:

1. **Structured Data Markup (JSON-LD)**:
   - Ensure every archive workshop page renders Schema.org structured data. This has been established in `src/frontend/src/utils/generateArchiveJsonLd.ts` using `ScholarlyArticle` markup with `associatedMedia` properties linking directly to the PDF files. This is highly effective for Google Scholar.
2. **Crawlable Standard Link Anchors**:
   - Ensure the proceedings and archive pages render standard `<a>` tags with absolute or relative URLs pointing directly to the PDF downloads. Search engine crawlers only follow standard `<a href="...">` elements and will ignore interactive JavaScript download buttons.
3. **Robots.txt Configuration**:
   - Confirm that the `robots.txt` configuration does not block the crawl paths for the `/assets/archives/` or `/proceedings/` subdirectories, allowing spiders to fully read and parse the text content.

---

## Verification Plan

### Automated Verification
- We will execute the injector script in dry-run mode to verify all file paths:
  ```powershell
  python scratch/inject_pdf_metadata.py --dry-run
  ```
- We will run the complete injection script to update all files:
  ```powershell
  python scratch/inject_pdf_metadata.py
  ```
- We will verify that the metadata is correctly embedded by running the script with the verify flag:
  ```powershell
  python scratch/inject_pdf_metadata.py --verify
  ```

### Manual Verification
- We will open a few updated PDF files in a browser or PDF reader (e.g. Chrome, Acrobat) and inspect their document properties to ensure Title, Author, and Keywords are present and accurate.
