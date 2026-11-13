export type PresentationFormat =
  | "Oral Presentation"
  | "Poster Presentation"
  | "Either (Oral Preferred)";

export type ResearchTrack =
  | "Planetary & Spaceflight MS"
  | "Underwater & Marine Biogeochemistry"
  | "Atmospheric, Volcanic & Environmental"
  | "Miniature & Ruggedized Hardware / Vacuum"
  | "Autonomous Platforms (UAV / AUV / ROV) & Security"
  | "Onboard Data Processing & Deconvolution";

export type ReviewStatus = "Pending" | "Reviewed";

export type ReviewDecision =
  | "Pending"
  | "Accept (Oral)"
  | "Accept (Poster)"
  | "Revision Requested"
  | "Decline";

export const SYNOPSIS_MAX_CHARS = 300;
export const ABSTRACT_MAX_CHARS = 3000;
export const CAPTION_MAX_CHARS = 300;
export const KEYWORDS_MAX_CHARS = 150;
export const BIO_MAX_CHARS = 500;
export const MIN_GRAPHIC_DPI = 300;
export const FIGURE_MARKER_TOKEN = "[FIGURE]";
export const MIN_FIGURE_WIDTH_IN = 3;
export const MAX_FIGURE_WIDTH_IN = 6.5;
export const DEFAULT_FIGURE_WIDTH_IN = 4.5;
export const PRINTABLE_TEXT_WIDTH_IN = 6.5;
export const RIGHT_WRAP_THRESHOLD_IN = 3.5;

export function isRightWrappedFigureWidth(widthInches: number): boolean {
  return widthInches < RIGHT_WRAP_THRESHOLD_IN;
}

export function clampFigureWidthInches(raw?: number): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) {
    return DEFAULT_FIGURE_WIDTH_IN;
  }
  const clamped = Math.min(MAX_FIGURE_WIDTH_IN, Math.max(MIN_FIGURE_WIDTH_IN, raw));
  return Math.round(clamped * 100) / 100;
}

export const PRESENTATION_FORMAT_OPTIONS: readonly PresentationFormat[] = [
  "Oral Presentation",
  "Poster Presentation",
  "Either (Oral Preferred)",
];

export const RESEARCH_TRACK_OPTIONS: readonly ResearchTrack[] = [
  "Planetary & Spaceflight MS",
  "Underwater & Marine Biogeochemistry",
  "Atmospheric, Volcanic & Environmental",
  "Miniature & Ruggedized Hardware / Vacuum",
  "Autonomous Platforms (UAV / AUV / ROV) & Security",
  "Onboard Data Processing & Deconvolution",
];

export interface AffiliationEntry {
  id: string;
  institution: string;
  location?: string;
}

export interface AuthorEntry {
  id: string;
  name: string;
  affiliationId: string;
  isPresenter: boolean;
}

export type DpiDetectionSource = "metadata" | "effective" | "vector";

export interface GraphicMetadata {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  widthPx: number;
  heightPx: number;
  detectedDpi: number;
  dpiSource: DpiDetectionSource;
  widthInches?: number;
  caption?: string;
  storageUrl?: string;
  hasLocalBlob?: boolean;
}

export interface AbstractSubmissionRecord {
  id: string;
  workshopYear: number;
  title: string;
  presentingAuthor: string;
  correspondingEmail: string;
  secondaryEmail?: string;
  affiliation: string;
  coAuthors: string;
  affiliations?: AffiliationEntry[];
  authors?: AuthorEntry[];
  presentationFormat: PresentationFormat;
  researchTrack: ResearchTrack;
  summary: string;
  abstractText?: string;
  keywords?: string;
  presenterBio?: string;
  graphic?: GraphicMetadata;
  studentTravelAwardApplicant: boolean;
  fileName?: string;
  fileSizeBytes?: number;
  fileMimeType?: string;
  fileStorageUrl?: string;
  hasLocalFileBlob?: boolean;
  submittedByUid: string;
  submittedByEmail: string;
  submittedAt: string;
  updatedAt: string;
  deadline: string;
  status: ReviewStatus;
  decision: ReviewDecision;
  score?: number;
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isSampleSeed?: boolean;
}

export interface CreateAbstractSubmissionInput {
  workshopYear: number;
  title: string;
  presentingAuthor?: string;
  correspondingEmail: string;
  secondaryEmail?: string;
  affiliation?: string;
  coAuthors?: string;
  affiliations: AffiliationEntry[];
  authors: AuthorEntry[];
  presentationFormat: PresentationFormat;
  researchTrack: ResearchTrack;
  summary: string;
  abstractText: string;
  keywords: string;
  presenterBio: string;
  graphicCaption?: string;
  figureWidthInches?: number;
  studentTravelAwardApplicant: boolean;
  deadline: string;
  submittedByUid: string;
  submittedByEmail: string;
}

export interface SaveAbstractReviewInput {
  id: string;
  score: number;
  decision: ReviewDecision;
  reviewerComments: string;
  reviewedBy: string;
}
