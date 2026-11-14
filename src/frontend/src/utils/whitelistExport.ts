import {
  ADMIN_ASSIGNABLE_ROLES,
  composePersonFullName,
  hydrateWhitelistPersonFields,
  isAssignableRole,
  sanitizeRoleList,
  type AssignableRole,
  type WhitelistEntry,
} from "@/utils/whitelistCsv";

export type WhitelistExportFormatId =
  | "full_csv"
  | "sheets_tsv"
  | "email_bcc"
  | "emails_only";

export type WhitelistRoleScope = AssignableRole | "unassigned";

export type RoleMatchMode = "any" | "all";

export interface WhitelistExportFormatMeta {
  id: WhitelistExportFormatId;
  label: string;
  badge: string;
  description: string;
  extension: "csv" | "tsv" | "txt";
  mimeType: string;
  supportsHeaderToggle: boolean;
  lineEnding: "\r\n" | "\n";
}

export interface WhitelistExportFilterOptions {
  selectAllUsers: boolean;
  selectedRoleScopes: readonly WhitelistRoleScope[];
  matchMode: RoleMatchMode;
}

export interface WhitelistExportFormatOptions {
  format: WhitelistExportFormatId;
  includeHeader?: boolean;
}

export interface WhitelistExportFilenameOptions {
  format: WhitelistExportFormatId;
  selectAllUsers: boolean;
  selectedRoleScopes: readonly WhitelistRoleScope[];
  date?: Date;
}

export const WHITELIST_EXPORT_FORMATS: readonly WhitelistExportFormatMeta[] = [
  {
    id: "full_csv",
    label: "Full Whitelist CSV",
    badge: "RFC-4180 .CSV",
    description:
      "Complete roster (First Name, Last Name, Institution, Email Address, Assigned Roles, Updated At) with UTF-8 BOM.",
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
      "Tab-separated First Name, Last Name, Institution, Email Address, and Assigned Roles for direct spreadsheet pasting.",
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
      "Clean newline-separated lowercase email addresses with no headers or display names for quick bulk pasting.",
    extension: "txt",
    mimeType: "text/plain;charset=utf-8;",
    supportsHeaderToggle: false,
    lineEnding: "\n",
  },
] as const;

const RFC5322_SPECIAL_RE = /[",.;:<>@\\()[\]]/;

export function getWhitelistExportFormatMeta(
  formatId: WhitelistExportFormatId
): WhitelistExportFormatMeta {
  const found = WHITELIST_EXPORT_FORMATS.find((item) => item.id === formatId);
  return found ?? WHITELIST_EXPORT_FORMATS[0];
}

function matchesScope(
  entryRoles: readonly string[],
  scope: WhitelistRoleScope
): boolean {
  const assignable = sanitizeRoleList(entryRoles).filter(isAssignableRole);
  if (scope === "unassigned") {
    return assignable.length === 0;
  }
  return assignable.includes(scope);
}

export function filterWhitelistForExport(
  whitelist: readonly WhitelistEntry[],
  options: WhitelistExportFilterOptions
): WhitelistEntry[] {
  const uniqueScopes: WhitelistRoleScope[] = [];
  const seenScopes = new Set<WhitelistRoleScope>();
  for (const scope of options.selectedRoleScopes) {
    if (
      (scope === "unassigned" || isAssignableRole(scope)) &&
      !seenScopes.has(scope)
    ) {
      seenScopes.add(scope);
      uniqueScopes.push(scope);
    }
  }

  if (!options.selectAllUsers && uniqueScopes.length === 0) {
    return [];
  }

  const result: WhitelistEntry[] = [];
  const seenEmails = new Set<string>();

  for (const entry of whitelist) {
    const cleanEmail = entry.email.trim().toLowerCase();
    if (!cleanEmail || seenEmails.has(cleanEmail)) {
      continue;
    }

    if (!options.selectAllUsers) {
      const matched =
        options.matchMode === "all"
          ? uniqueScopes.every((scope) => matchesScope(entry.roles, scope))
          : uniqueScopes.some((scope) => matchesScope(entry.roles, scope));
      if (!matched) {
        continue;
      }
    }

    seenEmails.add(cleanEmail);
    result.push(entry);
  }

  return result;
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sanitizeTsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

function formatRfc5322Recipient(entry: WhitelistEntry): string {
  const email = entry.email.trim().toLowerCase();
  if (!email) return "";

  const person = hydrateWhitelistPersonFields(entry);
  const displayName = composePersonFullName(
    person.firstName,
    person.lastName,
    person.name
  )
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

export function formatWhitelistExport(
  entries: readonly WhitelistEntry[],
  options: WhitelistExportFormatOptions
): string {
  const includeHeader = options.includeHeader ?? true;

  if (options.format === "full_csv") {
    const header = [
      "First Name",
      "Last Name",
      "Institution",
      "Email Address",
      "Assigned Roles",
      "Updated At",
    ].map(escapeCsvCell);

    const rows = entries.map((entry) => {
      const person = hydrateWhitelistPersonFields(entry);
      const rolesStr = sanitizeRoleList(entry.roles).join("; ");
      return [
        person.firstName,
        person.lastName,
        person.affiliation,
        entry.email.trim().toLowerCase(),
        rolesStr,
        entry.updatedAt || "",
      ]
        .map(escapeCsvCell)
        .join(",");
    });

    const lines = includeHeader ? [header.join(","), ...rows] : rows;
    return lines.join("\r\n");
  }

  if (options.format === "sheets_tsv") {
    const header = [
      "First Name",
      "Last Name",
      "Institution",
      "Email Address",
      "Assigned Roles",
    ];

    const rows = entries.map((entry) => {
      const person = hydrateWhitelistPersonFields(entry);
      const rolesStr = sanitizeRoleList(entry.roles).join("; ");
      return [
        person.firstName,
        person.lastName,
        person.affiliation,
        entry.email.trim().toLowerCase(),
        rolesStr,
      ]
        .map(sanitizeTsvCell)
        .join("\t");
    });

    const lines = includeHeader ? [header.join("\t"), ...rows] : rows;
    return lines.join("\n");
  }

  if (options.format === "email_bcc") {
    return entries
      .map(formatRfc5322Recipient)
      .filter(Boolean)
      .join(", ");
  }

  return entries
    .map((entry) => entry.email.trim().toLowerCase())
    .filter(Boolean)
    .join("\n");
}

function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildWhitelistExportFilename(
  options: WhitelistExportFilenameOptions
): string {
  const meta = getWhitelistExportFormatMeta(options.format);
  const validOrderedScopes = options.selectedRoleScopes.filter(
    (s) => s === "unassigned" || ADMIN_ASSIGNABLE_ROLES.includes(s)
  );
  const uniqueScopes = Array.from(new Set(validOrderedScopes));

  let scopeSlug = "all-users";
  if (!options.selectAllUsers) {
    if (uniqueScopes.length === 0) {
      scopeSlug = "empty";
    } else if (uniqueScopes.length === 1) {
      scopeSlug = slugifySegment(uniqueScopes[0]) || "role";
    } else {
      scopeSlug = `${uniqueScopes.length}-roles`;
    }
  }

  const dateStamp = (options.date ?? new Date()).toISOString().slice(0, 10);
  return `hems-whitelist-${scopeSlug}-${dateStamp}.${meta.extension}`;
}

