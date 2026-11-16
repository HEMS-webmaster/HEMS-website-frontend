import type { MailingSubscriber, SubscriberSource } from "@/types/mailing";
import { normalizeSublistTag, normalizeSubscriberEmail } from "@/utils/mailingTemplate";

export type MailingExportFormatId =
  | "full_csv"
  | "sheets_tsv"
  | "email_bcc"
  | "emails_only";

export type MailingExportStatusScope =
  | "active_only"
  | "all_statuses"
  | "suppressed_only";

export type CohortMatchMode = "any" | "all";

export interface MailingExportFormatMeta {
  id: MailingExportFormatId;
  label: string;
  badge: string;
  description: string;
  extension: "csv" | "tsv" | "txt";
  mimeType: string;
  supportsHeaderToggle: boolean;
  lineEnding: "\r\n" | "\n";
}

export interface MailingExportFilterOptions {
  statusScope: MailingExportStatusScope;
  selectAllCohorts: boolean;
  selectedCohorts: readonly string[];
  matchMode: CohortMatchMode;
}

export interface MailingExportFormatOptions {
  format: MailingExportFormatId;
  includeHeader?: boolean;
}

export interface MailingExportFilenameOptions {
  format: MailingExportFormatId;
  statusScope: MailingExportStatusScope;
  selectAllCohorts: boolean;
  selectedCohorts: readonly string[];
  date?: Date;
}

export const MAILING_EXPORT_FORMATS: readonly MailingExportFormatMeta[] = [
  {
    id: "full_csv",
    label: "Full Directory CSV",
    badge: "RFC-4180 .CSV",
    description:
      "Complete subscriber directory (names, affiliation, status, sublists, topics, timestamps) with UTF-8 BOM.",
    extension: "csv",
    mimeType: "text/csv;charset=utf-8;",
    supportsHeaderToggle: true,
    lineEnding: "\r\n",
  },
  {
    id: "sheets_tsv",
    label: "Google Sheets Roster",
    badge: "TSV .TSV",
    description:
      "Tab-separated First Name, Last Name, Affiliation, Email, and Cohort Tags formatted for direct spreadsheet pasting.",
    extension: "tsv",
    mimeType: "text/tab-separated-values;charset=utf-8;",
    supportsHeaderToggle: true,
    lineEnding: "\n",
  },
  {
    id: "email_bcc",
    label: "Email Client To / BCC",
    badge: "RFC-5322 .TXT",
    description:
      "Comma-separated Display Name <email> recipients ready to paste into Gmail, Outlook, or Apple Mail BCC fields.",
    extension: "txt",
    mimeType: "text/plain;charset=utf-8;",
    supportsHeaderToggle: false,
    lineEnding: "\n",
  },
  {
    id: "emails_only",
    label: "Plain Email Addresses",
    badge: "1 / LINE .TXT",
    description:
      "Clean newline-separated email addresses with no headers or display names for quick bulk pasting.",
    extension: "txt",
    mimeType: "text/plain;charset=utf-8;",
    supportsHeaderToggle: false,
    lineEnding: "\n",
  },
] as const;

const SUPPRESSED_STATUSES = new Set<MailingSubscriber["status"]>([
  "unsubscribed",
  "bounced",
  "complained",
]);

const RFC5322_SPECIAL_RE = /[",.;:<>@\\()[\]]/;

export function getExportFormatMeta(
  formatId: MailingExportFormatId
): MailingExportFormatMeta {
  const found = MAILING_EXPORT_FORMATS.find((item) => item.id === formatId);
  return found ?? MAILING_EXPORT_FORMATS[0];
}

export function matchesStatusScope(
  status: MailingSubscriber["status"],
  scope: MailingExportStatusScope
): boolean {
  if (scope === "active_only") {
    return status === "active";
  }
  if (scope === "suppressed_only") {
    return SUPPRESSED_STATUSES.has(status);
  }
  return true;
}

export function filterSubscribersForExport(
  subscribers: readonly MailingSubscriber[],
  options: MailingExportFilterOptions
): MailingSubscriber[] {
  const normalizedSelected: string[] = [];
  const seenTargetTags = new Set<string>();

  for (const rawTag of options.selectedCohorts) {
    const clean = normalizeSublistTag(rawTag).toLowerCase();
    if (clean && !seenTargetTags.has(clean)) {
      seenTargetTags.add(clean);
      normalizedSelected.push(clean);
    }
  }

  if (!options.selectAllCohorts && normalizedSelected.length === 0) {
    return [];
  }

  const result: MailingSubscriber[] = [];
  const seenKeys = new Set<string>();

  for (const subscriber of subscribers) {
    if (!matchesStatusScope(subscriber.status, options.statusScope)) {
      continue;
    }

    if (!options.selectAllCohorts) {
      const subTags = new Set(
        subscriber.sublists
          .map((tag) => normalizeSublistTag(tag).toLowerCase())
          .filter(Boolean)
      );

      const matched =
        options.matchMode === "all"
          ? normalizedSelected.every((tag) => subTags.has(tag))
          : normalizedSelected.some((tag) => subTags.has(tag));

      if (!matched) {
        continue;
      }
    }

    const dedupKey = normalizeSubscriberEmail(subscriber.email) || subscriber.id;
    if (!dedupKey || seenKeys.has(dedupKey)) {
      continue;
    }

    seenKeys.add(dedupKey);
    result.push(subscriber);
  }

  return result;
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sanitizeTsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

function sanitizeExportSource(source: SubscriberSource): string {
  return source === "mailchimp_import" ? "csv_import" : source;
}

function formatRfc5322Recipient(subscriber: MailingSubscriber): string {
  const email = (
    normalizeSubscriberEmail(subscriber.email) || subscriber.email
  ).trim();
  if (!email) {
    return "";
  }

  const displayName = [subscriber.firstName.trim(), subscriber.lastName.trim()]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!displayName) {
    return email;
  }

  if (RFC5322_SPECIAL_RE.test(displayName)) {
    const quoted = displayName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${quoted}" <${email}>`;
  }

  return `${displayName} <${email}>`;
}

export function formatSubscribersExport(
  subscribers: readonly MailingSubscriber[],
  options: MailingExportFormatOptions
): string {
  const includeHeader = options.includeHeader ?? true;

  if (options.format === "full_csv") {
    const header = [
      "Email Address",
      "First Name",
      "Last Name",
      "Affiliation",
      "Status",
      "Sublists",
      "Topics",
      "Source",
      "Date Added",
      "Updated At",
    ].map(escapeCsvCell);

    const rows = subscribers.map((subscriber) =>
      [
        normalizeSubscriberEmail(subscriber.email) || subscriber.email,
        subscriber.firstName,
        subscriber.lastName,
        subscriber.affiliation,
        subscriber.status,
        subscriber.sublists.map(normalizeSublistTag).filter(Boolean).join("; "),
        subscriber.interests.join("; "),
        sanitizeExportSource(subscriber.source),
        subscriber.createdAt,
        subscriber.updatedAt,
      ]
        .map(escapeCsvCell)
        .join(",")
    );

    const lines = includeHeader ? [header.join(","), ...rows] : rows;
    return lines.join("\r\n");
  }

  if (options.format === "sheets_tsv") {
    const header = [
      "First Name",
      "Last Name",
      "Affiliation",
      "Email Address",
      "Cohort Tags",
      "Status",
    ];

    const rows = subscribers.map((subscriber) =>
      [
        subscriber.firstName,
        subscriber.lastName,
        subscriber.affiliation,
        normalizeSubscriberEmail(subscriber.email) || subscriber.email,
        subscriber.sublists.map(normalizeSublistTag).filter(Boolean).join("; "),
        subscriber.status,
      ]
        .map(sanitizeTsvCell)
        .join("\t")
    );

    const lines = includeHeader ? [header.join("\t"), ...rows] : rows;
    return lines.join("\n");
  }

  if (options.format === "email_bcc") {
    return subscribers
      .map(formatRfc5322Recipient)
      .filter(Boolean)
      .join(", ");
  }

  return subscribers
    .map((subscriber) =>
      (normalizeSubscriberEmail(subscriber.email) || subscriber.email).trim()
    )
    .filter(Boolean)
    .join("\n");
}

function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildExportFilename(
  options: MailingExportFilenameOptions
): string {
  const meta = getExportFormatMeta(options.format);
  const uniqueTags = Array.from(
    new Set(
      options.selectedCohorts.map((tag) => normalizeSublistTag(tag)).filter(Boolean)
    )
  );

  let cohortSlug = "-all-cohorts";
  if (!options.selectAllCohorts) {
    if (uniqueTags.length === 0) {
      cohortSlug = "-empty";
    } else if (uniqueTags.length === 1) {
      cohortSlug = `-${slugifySegment(uniqueTags[0]) || "cohort"}`;
    } else {
      cohortSlug = `-${uniqueTags.length}-cohorts`;
    }
  }

  const statusSlug =
    options.statusScope === "active_only"
      ? "-active"
      : options.statusScope === "suppressed_only"
      ? "-suppressed"
      : "-all-statuses";

  const dateStamp = (options.date ?? new Date()).toISOString().slice(0, 10);
  return `hems-mailing-list${cohortSlug}${statusSlug}-${dateStamp}.${meta.extension}`;
}

