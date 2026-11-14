import { parseCsvRows } from "@/utils/upcomingWorkshop";

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
 * Parses either headered (`email,name,role` / `first name` + `last name`) or headerless CSV rosters
 * into deduplicated email + name + normalized AssignableRole records.
 */
export function parseWhitelistCsv(
  csvText: string,
  fallbackRole: AssignableRole | "" = ""
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
  let nameIdx = -1;
  let firstIdx = -1;
  let lastIdx = -1;
  let roleIdx = -1;

  if (hadHeaderRow) {
    const normalizedHeaders = rawRows[0].map((h) =>
      h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
    );
    emailIdx = findHeaderColumn(normalizedHeaders, [
      "email address",
      "email",
      "e-mail",
      "e mail",
      "mail",
      "user email",
      "corresponding email",
    ]);
    if (emailIdx === -1 && rawRows.length > 1) {
      emailIdx = rawRows[1].findIndex((cell) => isValidWhitelistEmail(cell));
    }

    firstIdx = findHeaderColumn(normalizedHeaders, [
      "first name",
      "firstname",
      "fname",
      "given name",
    ]);
    lastIdx = findHeaderColumn(normalizedHeaders, [
      "last name",
      "lastname",
      "lname",
      "surname",
      "family name",
    ]);
    roleIdx = findHeaderColumn(normalizedHeaders, [
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
    ]);

    const excludedForFullName = new Set<number>();
    if (emailIdx >= 0) excludedForFullName.add(emailIdx);
    if (firstIdx >= 0) excludedForFullName.add(firstIdx);
    if (lastIdx >= 0) excludedForFullName.add(lastIdx);
    if (roleIdx >= 0) excludedForFullName.add(roleIdx);

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
      excludedForFullName
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
    const rawEmail = resolvedEmailIdx >= 0 ? (row[resolvedEmailIdx] || "").trim().toLowerCase() : "";
    if (!isValidWhitelistEmail(rawEmail)) {
      skippedInvalidEmailCount += 1;
      continue;
    }

    let extractedName = "";
    const parsedRoles = new Set<AssignableRole>();

    if (hadHeaderRow) {
      if (nameIdx >= 0 && nameIdx < row.length) {
        extractedName = (row[nameIdx] || "").trim();
      }
      if (!extractedName) {
        const first = firstIdx >= 0 && firstIdx < row.length ? (row[firstIdx] || "").trim() : "";
        const last = lastIdx >= 0 && lastIdx < row.length ? (row[lastIdx] || "").trim() : "";
        extractedName = `${first} ${last}`.trim();
      }

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
      const nameParts: string[] = [];
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
          nameParts.push(cell);
        }
      }
      extractedName = nameParts.join(" ").trim();
    }

    if (parsedRoles.size === 0) {
      rowsMissingRoleCount += 1;
      if (fallbackRole) {
        parsedRoles.add(fallbackRole);
      }
    }

    const existing = deduped.get(rawEmail);
    if (existing) {
      if (!existing.name && extractedName) {
        existing.name = extractedName;
      }
      for (const role of parsedRoles) {
        if (!existing.roles.includes(role)) {
          existing.roles.push(role);
        }
      }
      existing.roles = sanitizeRoleList(existing.roles).filter(isAssignableRole);
    } else {
      deduped.set(rawEmail, {
        email: rawEmail,
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
    const cleanEntry: WhitelistEntry = {
      email: cleanEmail,
      name: (entry.name || "").trim(),
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
    if (!existing) {
      const cleanRoles = sanitizeRoleList(row.roles);
      workingByEmail.set(row.email, {
        email: row.email,
        name: row.name.trim(),
        roles: cleanRoles,
        updatedAt: nowIso,
      });
      addedPeopleCount += 1;
      if (cleanRoles.length > 0) {
        rolesGrantedPeopleCount += 1;
      }
      continue;
    }

    const incomingName = row.name.trim();
    if (!existing.name.trim() && incomingName) {
      existing.name = incomingName;
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

    const nameChanged = orig.name !== next.name;
    const rolesChanged = !sameRolesSet(orig.roles, next.roles) || Boolean(rawHadGeneral);
    if (nameChanged || rolesChanged) {
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

export const SAMPLE_WHITELIST_CSV = [
  "email,name,role",
  "dr.elena.vance@university.edu,Dr. Elena Vance,oral presenter",
  "marcus.chen@lab.gov,Marcus Chen,poster presenter",
  "sponsors@mass-spec-corp.com,Dana Brooks,corporate sponsor",
  "alex.rivera@institute.org,Alex Rivera,attendee",
].join("\n");
