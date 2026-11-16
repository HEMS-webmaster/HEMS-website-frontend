/** Hard per-file upload cap (10 MB) to stay comfortably within Firebase no-cost limits. */
export const MAX_BOARD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Soft recommendation threshold (5 MB) encouraging PDF/slide compression for faster volunteer downloads. */
export const SOFT_WARN_BOARD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum length for document notes or archival reasons stored in Firestore metadata. */
export const MAX_BOARD_NOTES_LENGTH = 240;

export const ALLOWED_BOARD_EXTENSIONS: readonly string[] = [
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".txt",
  ".md",
  ".xls",
  ".xlsx",
  ".ods",
  ".csv",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".zip",
];

export const BLOCKED_BOARD_EXTENSIONS: readonly string[] = [
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".ps1",
  ".sh",
  ".js",
  ".mjs",
  ".cjs",
  ".vbs",
  ".scr",
  ".dmg",
  ".app",
  ".apk",
  ".jar",
];

export const BOARD_DOCUMENT_CATEGORIES = [
  "Minutes",
  "Financials",
  "Agenda",
  "Governance",
  "Venue & Contracts",
  "Sponsorship & Grants",
  "Other",
] as const;

export type BoardDocumentCategory = (typeof BOARD_DOCUMENT_CATEGORIES)[number];

export type BoardDocumentStatus = "active" | "archived";

export const BOARD_CYCLE_PRESETS = [
  "Society-Wide",
  "16th Workshop (2027)",
  "15th Workshop (2025)",
  "FY2027",
  "FY2026",
  "FY2025",
] as const;

export interface BoardDocumentRecord {
  id: string;
  title: string;
  category: BoardDocumentCategory;
  documentDate: string;
  cycleTag: string;
  notes?: string;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath?: string;
  storageUrl?: string;
  firestoreChunkCount?: number;
  hasLocalBlob?: boolean;
  uploadedByUid: string;
  uploadedByEmail: string;
  uploadedAt: string;
  updatedAt: string;
  status: BoardDocumentStatus;
  archivedAt?: string;
  archivedByEmail?: string;
  archiveReason?: string;
  isSampleSeed?: boolean;
  isPinned?: boolean;
  staticAssetUrl?: string;
}

export interface UploadBoardDocumentInput {
  title: string;
  category: BoardDocumentCategory;
  documentDate: string;
  cycleTag: string;
  notes?: string;
  file: File;
}

export interface BoardFileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/** Format byte counts concisely for repository badges and quota readouts. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb >= 100 ? Math.round(kb) : kb.toFixed(1).replace(/\.0$/, "")} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 1 : 2).replace(/\.?0+$/, "")} MB`;
}

/** Extract the lowercase file extension including leading dot (or empty string if absent). */
export function getFileExtension(fileName: string): string {
  const clean = (fileName || "").trim();
  const lastDot = clean.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === clean.length - 1) return "";
  return clean.slice(lastDot).toLowerCase();
}

/**
 * Validate uploaded Board Repository files against the 10 MB limit, non-empty requirement,
 * executable blocklist, and approved document format whitelist.
 */
export function validateBoardUploadFile(
  file: Pick<File, "name" | "size" | "type"> | null | undefined
): BoardFileValidationResult {
  if (!file) {
    return { valid: false, error: "Please select a document file to upload." };
  }

  const fileName = (file.name || "").trim();
  if (!fileName) {
    return { valid: false, error: "Selected file has an invalid or empty filename." };
  }

  const ext = getFileExtension(fileName);
  if (!ext) {
    return {
      valid: false,
      error: "File must include an explicit extension (for example, .pdf, .docx, or .xlsx).",
    };
  }

  if (BLOCKED_BOARD_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Executable or script files (${ext}) are blocked for Board repository security.`,
    };
  }

  if (!ALLOWED_BOARD_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (${ext}). Allowed formats: PDF, Word, Excel/CSV, PowerPoint, text/Markdown, images, or .zip.`,
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return {
      valid: false,
      error: "Selected file is empty (0 B) and cannot be uploaded.",
    };
  }

  if (file.size > MAX_BOARD_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 10 MB per-file limit (${formatFileSize(MAX_BOARD_FILE_SIZE_BYTES)}). Please compress or split the document before uploading.`,
    };
  }

  if (file.size > SOFT_WARN_BOARD_FILE_SIZE_BYTES) {
    return {
      valid: true,
      warning: `Large file (${formatFileSize(file.size)} of 10 MB max). Consider compressing embedded images or slides so board members can download faster.`,
    };
  }

  return { valid: true };
}
