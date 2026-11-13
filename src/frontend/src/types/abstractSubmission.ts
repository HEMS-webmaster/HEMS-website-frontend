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

export interface AbstractSubmissionRecord {
  id: string;
  workshopYear: number;
  title: string;
  presentingAuthor: string;
  correspondingEmail: string;
  affiliation: string;
  coAuthors: string;
  presentationFormat: PresentationFormat;
  researchTrack: ResearchTrack;
  summary: string;
  studentTravelAwardApplicant: boolean;
  fileName: string;
  fileSizeBytes: number;
  fileMimeType: string;
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
  presentingAuthor: string;
  correspondingEmail: string;
  affiliation: string;
  coAuthors: string;
  presentationFormat: PresentationFormat;
  researchTrack: ResearchTrack;
  summary: string;
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
