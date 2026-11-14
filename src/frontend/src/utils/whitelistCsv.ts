import { parseCsvRows } from "@/utils/upcomingWorkshop";
import type { PastedSubscriberRow } from "@/utils/spreadsheetPaste";

export const ADMIN_ASSIGNABLE_ROLES = [
  "attendee",
  "submitter",
  "oral presenter",
  "poster presenter",
  "corporate sponsor",
  "reviewer",
  "board",
  "admin",
] as const;

export type AssignableRole = (typeof ADMIN_ASSIGNABLE_ROLES)[number];

export interface WhitelistEntry {
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  name: string;
  roles: string[];
  updatedAt?: string;
}

export interface RoleDisplayMeta {
  label: string;
  desc: string;
  badgeClass: string;
  activePillClass: string;
}

export const ROLE_DISPLAY_META: Record<string, RoleDisplayMeta> = {
  attendee: {
    label: "Registered Attendee",
    desc: "Registered conference participant",
    badgeClass: "text-teal-700 bg-teal-50 border-teal-200",
    activePillClass: "bg-teal-50 border-teal-400 text-teal-800",
  },
  submitter: {
    label: "Author / Submitter",
    desc: "Paper & abstract submission privileges",
    badgeClass: "text-sky-700 bg-sky-50 border-sky-200",
    activePillClass: "bg-sky-50 border-sky-400 text-sky-800",
  },
  "oral presenter": {
    label: "Oral Presenter",
    desc: "Scheduled platform oral speaker",
    badgeClass: "text-indigo-700 bg-indigo-50 border-indigo-200",
    activePillClass: "bg-indigo-50 border-indigo-400 text-indigo-800",
  },
  "poster presenter": {
    label: "Poster Presenter",
    desc: "Scheduled scientific poster presenter",
    badgeClass: "text-violet-700 bg-violet-50 border-violet-200",
    activePillClass: "bg-violet-50 border-violet-400 text-violet-800",
  },
  "corporate sponsor": {
    label: "Corporate Sponsor",
    desc: "Sponsor representative & exhibitor",
    badgeClass: "text-orange-700 bg-orange-50 border-orange-200",
    activePillClass: "bg-orange-50 border-orange-400 text-orange-800",
  },
  reviewer: {
    label: "Abstract Reviewer",
    desc: "Blind scoring & submission rubric reviews",
    badgeClass: "text-amber-700 bg-amber-50 border-amber-200",
    activePillClass: "bg-amber-50 border-amber-400 text-amber-800",
  },
  board: {
    label: "Executive Board",
    desc: "Governance, executive minutes & voting",
    badgeClass: "text-purple-700 bg-purple-50 border-purple-200",
    activePillClass: "bg-purple-50 border-purple-400 text-purple-800",
  },
  admin: {
    label: "Administrator",
    desc: "Full system control & configuration",
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    activePillClass: "bg-emerald-50 border-emerald-400 text-emerald-800",
  },
  general: {
    label: "General Member",
    desc: "Automatic proceeding access & downloads",
    badgeClass: "text-slate-700 bg-slate-100 border-slate-200",
    activePillClass: "bg-slate-100 border-slate-300 text-slate-800",
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ASSIGNABLE_ROLE_SET = new Set<string>(ADMIN_ASSIGNABLE_ROLES);

const HONORIFIC_PREFIX_RE = /^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|mx\.?)$/i;

const ROLE_ALIAS_MAP: Record<string, AssignableRole | "general"> = {
  general: "general",
  "general user": "general",
  "general member": "general",
  attendee: "attendee",
  attendees: "attendee",
  "registered attendee": "attendee",
  participant: "attendee",
  participants: "attendee",
  submitter: "submitter",
  submitters: "submitter",
  author: "submitter",
  authors: "submitter",
  "oral presenter": "oral presenter",
  "oral presenters": "oral presenter",
  oral: "oral presenter",
  "oral presentation": "oral presenter",
  speaker: "oral presenter",
  speakers: "oral presenter",
  "presenter (oral)": "oral presenter",
  "accept (oral)": "oral presenter",
  "poster presenter": "poster presenter",
  "poster presenters": "poster presenter",
  poster: "poster presenter",
  "poster presentation": "poster presenter",
  "presenter (poster)": "poster presenter",
  "accept (poster)": "poster presenter",
  "corporate sponsor": "corporate sponsor",
  "corporate sponsors": "corporate sponsor",
  "corperate sponsor": "corporate sponsor",
  "corperate sponsors": "corporate sponsor",
  sponsor: "corporate sponsor",
  sponsors: "corporate sponsor",
  exhibitor: "corporate sponsor",
  exhibitors: "corporate sponsor",
  reviewer: "reviewer",
  reviewers: "reviewer",
  "abstract reviewer": "reviewer",
  "abstract reviewers": "reviewer",
  board: "board",
  "board member": "board",
  "board members": "board",
  "executive board": "board",
  admin: "admin",
  admins: "admin",
  administrator: "admin",
  administrators: "admin",
};

export function splitPersonFullName(rawFullName: string): {
  firstName: string;
  lastName: string;
} {
  const cleaned = rawFullName.trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "", lastName: "" };

  const tokens = cleaned.split(" ");
  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: "" };
  }
  if (tokens.length === 2) {
    return { firstName: tokens[0], lastName: tokens[1] };
  }
  if (HONORIFIC_PREFIX_RE.test(tokens[0])) {
    return {
      firstName: tokens.slice(0, 2).join(" "),
      lastName: tokens.slice(2).join(" "),
    };
  }
  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(" "),
  };
}

export function composePersonFullName(
  firstName: string,
  lastName: string,
  fallbackName = ""
): string {
  const combined = [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return combined || fallbackName.trim();
}

export function hydrateWhitelistPersonFields(input: {
  firstName?: unknown;
  lastName?: unknown;
  affiliation?: unknown;
  institution?: unknown;
  name?: unknown;
}): {
  firstName: string;
  lastName: string;
  affiliation: string;
  name: string;
} {
  const rawFirst = typeof input.firstName === "string" ? input.firstName.trim() : "";
  const rawLast = typeof input.lastName === "string" ? input.lastName.trim() : "";
  const rawAffil =
    typeof input.affiliation === "string" && input.affiliation.trim()
      ? input.affiliation.trim()
      : typeof input.institution === "string"
        ? input.institution.trim()
        : "";
  const rawName = typeof input.name === "string" ? input.name.trim() : "";

  if (rawFirst || rawLast) {
    return {
      firstName: rawFirst,
      lastName: rawLast,
      affiliation: rawAffil,
      name: composePersonFullName(rawFirst, rawLast, rawName),
    };
  }

  if (rawName) {
    const split = splitPersonFullName(rawName);
    return {
      firstName: split.firstName,
      lastName: split.lastName,
      affiliation: rawAffil,
      name: rawName,
    };
  }

  return {
    firstName: "",
    lastName: "",
    affiliation: rawAffil,
    name: "",
  };
}

export function isAssignableRole(value: string): value is AssignableRole {
  return ASSIGNABLE_ROLE_SET.has(value);
}

export function isValidWhitelistEmail(raw: string): boolean {
  const clean = raw.trim().toLowerCase();
  return clean.length >= 5 && clean.length <= 254 && EMAIL_PATTERN.test(clean);
}

export function normalizeWhitelistRole(raw: string): AssignableRole | "general" | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!cleaned) return null;
  return ROLE_ALIAS_MAP[cleaned] || null;
}

/**
 * Canonicalizes role lists and strips the legacy automatic `'general'` role.
 */
export function sanitizeRoleList(rawRoles: unknown): string[] {
  if (!Array.isArray(rawRoles)) return [];

  const canonical = new Set<string>();
  const extras = new Set<string>();

  for (const item of rawRoles) {
    const rawStr = typeof item === "string" ? item.trim() : String(item || "").trim();
    if (!rawStr) continue;
    const mapped = normalizeWhitelistRole(rawStr);
    if (mapped === "general") {
      continue;
    }
    if (mapped) {
      canonical.add(mapped);
      continue;
    }
    const lowered = rawStr.toLowerCase();
    if (lowered !== "general") {
      extras.add(lowered);
    }
  }

  const ordered: string[] = [];
  for (const role of ADMIN_ASSIGNABLE_ROLES) {
    if (canonical.has(role)) {
      ordered.push(role);
    }
  }
  for (const extra of extras) {
    if (!ordered.includes(extra)) {
      ordered.push(extra);
    }
  }
  return ordered;
}

export interface WhitelistCsvParsedRow {
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  name: string;
  roles: AssignableRole[];
}

export interface WhitelistCsvParseResult {
  rows: WhitelistCsvParsedRow[];
  detectedRoles: AssignableRole[];
  skippedInvalidEmailCount: number;
  rowsMissingRoleCount: number;
  unrecognizedRoleTokens: string[];
  hadHeaderRow: boolean;
}

function findHeaderColumn(
  headers: string[],
  candidates: string[],
  excludedIndices: Set<number> = new Set()
): number {
  for (const candidate of candidates) {
    const exact = headers.findIndex(
      (h, idx) => !excludedIndices.has(idx) && h === candidate
    );
    if (exact >= 0) return exact;
  }
  for (const candidate of candidates) {
    const partial = headers.findIndex(
      (h, idx) => !excludedIndices.has(idx) && h.includes(candidate)
    );
    if (partial >= 0) return partial;
  }
  return -1;
}

function splitRoleCellTokens(cell: string): string[] {
  return cell
    .replace(/^"+|"+$/g, "")
    .split(/[;|,]/)
    .map((t) => t.replace(/^"+|"+$/g, "").trim())
    .filter(Boolean);
}

/**
 * Parses either headered (`First Name,Last Name,Institution,Email Address,Assigned Roles` / `name`)
 * or headerless CSV rosters into deduplicated person + normalized AssignableRole records.
 * When `batchOrFallbackRole` is specified, it is merged onto every valid imported row.
 */
export function parseWhitelistCsv(
  csvText: string,
  batchOrFallbackRole: AssignableRole | "" = ""
): WhitelistCsvParseResult {
  const rawRows = parseCsvRows(csvText);
  if (rawRows.length === 0) {
    return {
      rows: [],
      detectedRoles: [],
      skippedInvalidEmailCount: 0,
      rowsMissingRoleCount: 0,
      unrecognizedRoleTokens: [],
      hadHeaderRow: false,
    };
  }

  const firstRowEmailCol = rawRows[0].findIndex((cell) => isValidWhitelistEmail(cell));
  const hadHeaderRow = firstRowEmailCol === -1;

  let emailIdx = firstRowEmailCol;
  let firstIdx = -1;
  let lastIdx = -1;
  let affilIdx = -1;
  let roleIdx = -1;
  let nameIdx = -1;

  if (hadHeaderRow) {
    const normalizedHeaders = rawRows[0].map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[*()]+/g, " ")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

    const usedCols = new Set<number>();

    emailIdx = findHeaderColumn(
      normalizedHeaders,
      [
        "email address",
        "email",
        "e-mail",
        "e mail",
        "mail",
        "user email",
        "corresponding email",
      ],
      usedCols
    );
    if (emailIdx === -1 && rawRows.length > 1) {
      emailIdx = rawRows[1].findIndex((cell) => isValidWhitelistEmail(cell));
    }
    if (emailIdx >= 0) usedCols.add(emailIdx);

    firstIdx = findHeaderColumn(
      normalizedHeaders,
      ["first name", "firstname", "first", "fname", "given name", "given"],
      usedCols
    );
    if (firstIdx >= 0) usedCols.add(firstIdx);

    lastIdx = findHeaderColumn(
      normalizedHeaders,
      ["last name", "lastname", "last", "lname", "surname", "family name", "family"],
      usedCols
    );
    if (lastIdx >= 0) usedCols.add(lastIdx);

    affilIdx = findHeaderColumn(
      normalizedHeaders,
      [
        "institution",
        "affiliation",
        "organization",
        "org",
        "company",
        "university",
        "institute",
        "lab",
        "laboratory",
        "department",
        "employer",
      ],
      usedCols
    );
    if (affilIdx >= 0) usedCols.add(affilIdx);

    roleIdx = findHeaderColumn(
      normalizedHeaders,
      [
        "assigned roles",
        "assigned role",
        "portal role",
        "user role",
        "roles",
        "role",
        "presentation type",
        "registration type",
        "category",
        "type",
        "tier",
      ],
      usedCols
    );
    if (roleIdx >= 0) usedCols.add(roleIdx);

    nameIdx = findHeaderColumn(
      normalizedHeaders,
      [
        "full name",
        "fullname",
        "name",
        "presenter name",
        "presenter",
        "attendee name",
        "author",
        "contact name",
        "contact",
        "display name",
      ],
      usedCols
    );
  }

  const startRow = hadHeaderRow ? 1 : 0;
  const deduped = new Map<string, WhitelistCsvParsedRow>();
  const unrecognizedSet = new Set<string>();
  let skippedInvalidEmailCount = 0;
  let rowsMissingRoleCount = 0;

  for (let r = startRow; r < rawRows.length; r += 1) {
    const row = rawRows[r];
    if (!row || row.every((cell) => !cell.trim())) continue;

    let resolvedEmailIdx = emailIdx;
    if (resolvedEmailIdx < 0 || resolvedEmailIdx >= row.length) {
      resolvedEmailIdx = row.findIndex((cell) => isValidWhitelistEmail(cell));
    }
    const rawEmail =
      resolvedEmailIdx >= 0 ? (row[resolvedEmailIdx] || "").trim().toLowerCase() : "";
    if (!isValidWhitelistEmail(rawEmail)) {
      skippedInvalidEmailCount += 1;
      continue;
    }

    let firstName = "";
    let lastName = "";
    let affiliation = "";
    let extractedName = "";
    const parsedRoles = new Set<AssignableRole>();

    if (hadHeaderRow) {
      firstName =
        firstIdx >= 0 && firstIdx < row.length ? (row[firstIdx] || "").trim() : "";
      lastName =
        lastIdx >= 0 && lastIdx < row.length ? (row[lastIdx] || "").trim() : "";
      affiliation =
        affilIdx >= 0 && affilIdx < row.length ? (row[affilIdx] || "").trim() : "";
      const rawFullName =
        nameIdx >= 0 && nameIdx < row.length ? (row[nameIdx] || "").trim() : "";

      if (!firstName && !lastName && rawFullName) {
        const split = splitPersonFullName(rawFullName);
        firstName = split.firstName;
        lastName = split.lastName;
      }
      extractedName = composePersonFullName(firstName, lastName, rawFullName);

      if (roleIdx >= 0 && roleIdx < row.length) {
        const tokens = splitRoleCellTokens(row[roleIdx] || "");
        for (const tok of tokens) {
          const norm = normalizeWhitelistRole(tok);
          if (norm === "general") {
            continue;
          }
          if (norm) {
            parsedRoles.add(norm);
          } else {
            unrecognizedSet.add(tok);
          }
        }
      }
    } else {
      const nonRoleCells: string[] = [];
      for (let c = 0; c < row.length; c += 1) {
        if (c === resolvedEmailIdx) continue;
        const cell = (row[c] || "").trim();
        if (!cell) continue;
        const tokens = splitRoleCellTokens(cell);
        const mappedTokens = tokens.map((tok) => normalizeWhitelistRole(tok));
        const isRoleCell = tokens.length > 0 && mappedTokens.every((m) => m !== null);
        if (isRoleCell) {
          for (const mapped of mappedTokens) {
            if (mapped && mapped !== "general") {
              parsedRoles.add(mapped);
            }
          }
        } else {
          nonRoleCells.push(cell);
        }
      }

      if (nonRoleCells.length >= 3) {
        firstName = nonRoleCells[0];
        lastName = nonRoleCells[1];
        affiliation = nonRoleCells.slice(2).join(", ");
      } else if (nonRoleCells.length === 2) {
        firstName = nonRoleCells[0];
        lastName = nonRoleCells[1];
      } else if (nonRoleCells.length === 1) {
        const split = splitPersonFullName(nonRoleCells[0]);
        firstName = split.firstName;
        lastName = split.lastName;
      }
      extractedName = composePersonFullName(firstName, lastName);
    }

    if (parsedRoles.size === 0) {
      rowsMissingRoleCount += 1;
    }

    if (batchOrFallbackRole && isAssignableRole(batchOrFallbackRole)) {
      parsedRoles.add(batchOrFallbackRole);
    }

    const existing = deduped.get(rawEmail);
    if (existing) {
      if (!existing.firstName && firstName) existing.firstName = firstName;
      if (!existing.lastName && lastName) existing.lastName = lastName;
      if (!existing.affiliation && affiliation) existing.affiliation = affiliation;
      existing.name = composePersonFullName(
        existing.firstName,
        existing.lastName,
        existing.name || extractedName
      );
      for (const role of parsedRoles) {
        if (!existing.roles.includes(role)) {
          existing.roles.push(role);
        }
      }
      existing.roles = sanitizeRoleList(existing.roles).filter(isAssignableRole);
    } else {
      deduped.set(rawEmail, {
        email: rawEmail,
        firstName,
        lastName,
        affiliation,
        name: extractedName,
        roles: sanitizeRoleList(Array.from(parsedRoles)).filter(isAssignableRole),
      });
    }
  }

  const rows = Array.from(deduped.values());
  const detectedSet = new Set<AssignableRole>();
  for (const row of rows) {
    for (const role of row.roles) {
      detectedSet.add(role);
    }
  }
  const detectedRoles = ADMIN_ASSIGNABLE_ROLES.filter((role) => detectedSet.has(role));

  return {
    rows,
    detectedRoles,
    skippedInvalidEmailCount,
    rowsMissingRoleCount,
    unrecognizedRoleTokens: Array.from(unrecognizedSet),
    hadHeaderRow,
  };
}

/**
 * Converts editable 4-column Google Sheets paste table rows into a `WhitelistCsvParseResult`
 * ready for `computeWhitelistCsvPlan`.
 */
export function buildWhitelistParseResultFromPasteRows(
  rows: readonly PastedSubscriberRow[],
  assignedRoles: readonly AssignableRole[]
): {
  parsed: WhitelistCsvParseResult;
  invalidRowNumbers: number[];
  duplicateCount: number;
} {
  const cleanRoles = sanitizeRoleList([...assignedRoles]).filter(isAssignableRole);
  const invalidRowNumbers: number[] = [];
  const deduped = new Map<string, WhitelistCsvParsedRow>();
  let duplicateCount = 0;

  rows.forEach((row, idx) => {
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const affiliation = row.affiliation.trim();
    const email = row.email.trim().toLowerCase();

    const hasAnyContent = Boolean(firstName || lastName || affiliation || email);
    if (!hasAnyContent) return;

    if (!isValidWhitelistEmail(email)) {
      invalidRowNumbers.push(idx + 1);
      return;
    }

    const existing = deduped.get(email);
    if (existing) {
      duplicateCount += 1;
      if (!existing.firstName && firstName) existing.firstName = firstName;
      if (!existing.lastName && lastName) existing.lastName = lastName;
      if (!existing.affiliation && affiliation) existing.affiliation = affiliation;
      existing.name = composePersonFullName(
        existing.firstName,
        existing.lastName,
        existing.name
      );
      return;
    }

    deduped.set(email, {
      email,
      firstName,
      lastName,
      affiliation,
      name: composePersonFullName(firstName, lastName),
      roles: [...cleanRoles],
    });
  });

  const validRows = Array.from(deduped.values());
  return {
    parsed: {
      rows: validRows,
      detectedRoles: [...cleanRoles],
      skippedInvalidEmailCount: invalidRowNumbers.length,
      rowsMissingRoleCount: cleanRoles.length === 0 ? validRows.length : 0,
      unrecognizedRoleTokens: [],
      hadHeaderRow: false,
    },
    invalidRowNumbers,
    duplicateCount,
  };
}

export type CsvApplyMode = "append" | "overwrite";

export interface WhitelistCsvApplyPlan {
  nextEntries: WhitelistEntry[];
  mutations: WhitelistEntry[];
  addedPeopleCount: number;
  namesFilledCount: number;
  rolesGrantedPeopleCount: number;
  overwriteRemovedPeopleCount: number;
  effectiveOverwriteRoles: AssignableRole[];
}

function sameRolesSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Computes exact Append vs. Overwrite state transitions and Firestore write mutations.
 */
export function computeWhitelistCsvPlan(
  existingEntries: WhitelistEntry[],
  parsed: WhitelistCsvParseResult,
  mode: CsvApplyMode,
  overwriteRoles?: AssignableRole[]
): WhitelistCsvApplyPlan {
  const nowIso = new Date().toISOString();
  const originalByEmail = new Map<string, WhitelistEntry>();
  const workingByEmail = new Map<string, WhitelistEntry>();

  for (const entry of existingEntries) {
    const cleanEmail = entry.email.trim().toLowerCase();
    if (!cleanEmail) continue;
    const person = hydrateWhitelistPersonFields(entry);
    const cleanEntry: WhitelistEntry = {
      email: cleanEmail,
      firstName: person.firstName,
      lastName: person.lastName,
      affiliation: person.affiliation,
      name: person.name,
      roles: sanitizeRoleList(entry.roles),
      updatedAt: entry.updatedAt,
    };
    originalByEmail.set(cleanEmail, {
      ...cleanEntry,
      roles: [...cleanEntry.roles],
    });
    workingByEmail.set(cleanEmail, {
      ...cleanEntry,
      roles: [...cleanEntry.roles],
    });
  }

  const effectiveOverwriteRoles: AssignableRole[] =
    mode === "overwrite"
      ? (overwriteRoles && overwriteRoles.length > 0 ? overwriteRoles : parsed.detectedRoles).filter(
          isAssignableRole
        )
      : [];

  let overwriteRemovedPeopleCount = 0;

  if (mode === "overwrite" && effectiveOverwriteRoles.length > 0) {
    const csvRoleHolders = new Map<AssignableRole, Set<string>>();
    for (const r of effectiveOverwriteRoles) {
      csvRoleHolders.set(r, new Set<string>());
    }
    for (const row of parsed.rows) {
      for (const r of row.roles) {
        if (csvRoleHolders.has(r)) {
          csvRoleHolders.get(r)!.add(row.email);
        }
      }
    }

    for (const entry of workingByEmail.values()) {
      const filteredRoles = entry.roles.filter((r) => {
        if (isAssignableRole(r) && effectiveOverwriteRoles.includes(r)) {
          return csvRoleHolders.get(r)?.has(entry.email) ?? false;
        }
        return true;
      });
      if (filteredRoles.length < entry.roles.length) {
        overwriteRemovedPeopleCount += 1;
        entry.roles = filteredRoles;
        entry.updatedAt = nowIso;
      }
    }
  }

  let addedPeopleCount = 0;
  let namesFilledCount = 0;
  let rolesGrantedPeopleCount = 0;

  for (const row of parsed.rows) {
    const existing = workingByEmail.get(row.email);
    const incomingPerson = hydrateWhitelistPersonFields(row);

    if (!existing) {
      const cleanRoles = sanitizeRoleList(row.roles);
      workingByEmail.set(row.email, {
        email: row.email,
        firstName: incomingPerson.firstName,
        lastName: incomingPerson.lastName,
        affiliation: incomingPerson.affiliation,
        name: incomingPerson.name,
        roles: cleanRoles,
        updatedAt: nowIso,
      });
      addedPeopleCount += 1;
      if (cleanRoles.length > 0) {
        rolesGrantedPeopleCount += 1;
      }
      continue;
    }

    let profileFilled = false;
    if (!existing.firstName && incomingPerson.firstName) {
      existing.firstName = incomingPerson.firstName;
      profileFilled = true;
    }
    if (!existing.lastName && incomingPerson.lastName) {
      existing.lastName = incomingPerson.lastName;
      profileFilled = true;
    }
    if (!existing.affiliation && incomingPerson.affiliation) {
      existing.affiliation = incomingPerson.affiliation;
      profileFilled = true;
    }

    const recomposedName = composePersonFullName(
      existing.firstName,
      existing.lastName,
      existing.name || incomingPerson.name
    );
    if (!existing.name && recomposedName) {
      profileFilled = true;
    }
    existing.name = recomposedName;

    if (profileFilled) {
      namesFilledCount += 1;
    }

    const mergedRoles = sanitizeRoleList([...existing.roles, ...row.roles]);
    if (mergedRoles.some((r) => !existing.roles.includes(r))) {
      rolesGrantedPeopleCount += 1;
    }
    existing.roles = mergedRoles;
    existing.updatedAt = nowIso;
  }

  const nextEntries = Array.from(workingByEmail.values()).sort((a, b) =>
    a.email.localeCompare(b.email)
  );

  const mutations: WhitelistEntry[] = [];
  for (const next of nextEntries) {
    const orig = originalByEmail.get(next.email);
    if (!orig) {
      mutations.push({ ...next, updatedAt: nowIso });
      continue;
    }
    const rawHadGeneral = existingEntries
      .find((e) => e.email.trim().toLowerCase() === next.email)
      ?.roles.some((r) => String(r || "").trim().toLowerCase() === "general");

    const profileChanged =
      orig.firstName !== next.firstName ||
      orig.lastName !== next.lastName ||
      orig.affiliation !== next.affiliation ||
      orig.name !== next.name;
    const rolesChanged = !sameRolesSet(orig.roles, next.roles) || Boolean(rawHadGeneral);
    if (profileChanged || rolesChanged) {
      mutations.push({ ...next, updatedAt: nowIso });
    }
  }

  return {
    nextEntries,
    mutations,
    addedPeopleCount,
    namesFilledCount,
    rolesGrantedPeopleCount,
    overwriteRemovedPeopleCount,
    effectiveOverwriteRoles,
  };
}

export const WHITELIST_EXAMPLE_HEADING_ROW =
  "First Name,Last Name,Institution,Email Address,Assigned Roles";

export const SAMPLE_WHITELIST_CSV = [
  WHITELIST_EXAMPLE_HEADING_ROW,
  'Elena,Vance,"Dept. of Chemistry, USF",dr.elena.vance@university.edu,attendee; oral presenter',
  "Marcus,Chen,Pacific Northwest National Lab,marcus.chen@lab.gov,attendee; poster presenter",
  "Dana,Brooks,InstrumentCorp Mass Spec,sponsors@mass-spec-corp.com,corporate sponsor",
  "Alex,Rivera,,alex.rivera@institute.org,attendee",
].join("\n");
