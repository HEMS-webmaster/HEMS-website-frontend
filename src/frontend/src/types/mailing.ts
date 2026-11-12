export type SubscriberStatus =
  | "active"
  | "pending_opt_in"
  | "unsubscribed"
  | "bounced"
  | "complained";

export type MailingInterest = "workshop" | "student_awards" | "sponsorship";

/**
 * Broadcast segment identifier:
 * - "all": All Active Subscribed
 * - MailingInterest: Public opt-in topic ("workshop" | "student_awards" | "sponsorship")
 * - `sublist:${string}`: Custom Board Sublist / Tag (e.g., "sublist:Board Members", "sublist:2025 Attendees")
 */
export type MailingSegment = "all" | MailingInterest | `sublist:${string}`;

export type SubscriberSource = "website" | "mailchimp_import" | "board_manual";

export interface MailingSubscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  interests: MailingInterest[];
  sublists: string[];
  status: SubscriberStatus;
  source: SubscriberSource;
  unsubscribeToken: string;
  optInToken: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  bounceReason?: string;
}

export interface PublicMailingRequest {
  id: string;
  type: "subscribe" | "unsubscribe" | "update_email" | "contact_inquiry";
  email: string;
  newEmail?: string;
  firstName?: string;
  lastName?: string;
  affiliation?: string;
  interests?: MailingInterest[];
  token?: string;
  subject?: string;
  message?: string;
  recipientEmail?: string;
  createdAt: string;
  status: "pending" | "processed" | "forwarded";
}

export type CampaignStatus = "sent" | "sandbox_logged" | "draft";

export interface MailingCampaign {
  id: string;
  subject: string;
  segment: MailingSegment;
  campaignSlug?: string;
  markdownBody: string;
  status: CampaignStatus;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdByEmail: string;
  createdAt: string;
  sentAt?: string;
  postmarkStream: string;
}

export type DeliverabilitySeverity = "pass" | "warning" | "fail";

export interface DeliverabilityCheckItem {
  id: string;
  label: string;
  severity: DeliverabilitySeverity;
  detail: string;
}

export interface DeliverabilityAudit {
  overallStatus: DeliverabilitySeverity;
  checks: DeliverabilityCheckItem[];
}

export interface MailchimpParsedRow {
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  interests: MailingInterest[];
  sublists: string[];
  status: SubscriberStatus;
  createdAt?: string;
}

export interface MailchimpImportResult {
  totalParsed: number;
  importedActive: number;
  importedSuppressed: number;
  skippedProtected: number;
}
