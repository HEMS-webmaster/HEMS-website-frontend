"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import {
  AssignableRole,
  composePersonFullName,
  ensureProtectedWhitelistEntries,
  hydrateWhitelistPersonFields,
  PROTECTED_ADMIN_EMAIL,
  sanitizeRoleList,
  WhitelistCsvApplyPlan,
  WhitelistEntry,
} from "@/utils/whitelistCsv";

const MOCK_WHITELIST_STORAGE_KEY = "hems_mock_whitelist";
const MOCK_WHITELIST_OFFICER_SEED_KEY = "hems_mock_whitelist_officers_v3";

const INITIAL_MOCK_WHITELIST: WhitelistEntry[] = [
  {
    email: PROTECTED_ADMIN_EMAIL,
    firstName: "HEMS",
    lastName: "Webmaster",
    affiliation: "HEMS Society",
    name: "HEMS Webmaster",
    roles: ["admin"],
  },
  {
    email: "admin@example.com",
    firstName: "Society",
    lastName: "Admin",
    affiliation: "HEMS Executive Office",
    name: "Society Admin",
    roles: ["admin", "reviewer", "operations", "treasurer", "board"],
  },
  {
    email: "operations@hems-workshop.org",
    firstName: "Workshop",
    lastName: "Operations",
    affiliation: "HEMS Organizing Committee",
    name: "Workshop Operations",
    roles: ["operations"],
  },
  {
    email: "treasurer@hems-workshop.org",
    firstName: "Society",
    lastName: "Treasurer",
    affiliation: "HEMS Finance Committee",
    name: "Society Treasurer",
    roles: ["treasurer"],
  },
  {
    email: "reviewer@example.com",
    firstName: "Dr. Jordan",
    lastName: "Blake",
    affiliation: "National High Magnetic Field Lab",
    name: "Dr. Jordan Blake",
    roles: ["reviewer"],
  },
  {
    email: "elena.vance@university.edu",
    firstName: "Dr. Elena",
    lastName: "Vance",
    affiliation: "Dept. of Chemistry, USF",
    name: "Dr. Elena Vance",
    roles: ["attendee", "oral presenter"],
  },
  {
    email: "marcus.chen@lab.gov",
    firstName: "Marcus",
    lastName: "Chen",
    affiliation: "Pacific Northwest National Lab",
    name: "Marcus Chen",
    roles: ["attendee", "poster presenter"],
  },
  {
    email: "sponsorship@instrumentcorp.com",
    firstName: "Dana",
    lastName: "Brooks",
    affiliation: "InstrumentCorp Mass Spec",
    name: "Dana Brooks",
    roles: ["corporate sponsor"],
  },
];

const INITIAL_MOCK_BY_EMAIL = new Map(
  INITIAL_MOCK_WHITELIST.map((entry) => [entry.email.toLowerCase(), entry])
);

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

function readMockWhitelist(): WhitelistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(MOCK_WHITELIST_STORAGE_KEY);
    if (!raw) {
      const seeded = ensureProtectedWhitelistEntries(INITIAL_MOCK_WHITELIST);
      window.sessionStorage.setItem(
        MOCK_WHITELIST_STORAGE_KEY,
        JSON.stringify(seeded)
      );
      window.sessionStorage.setItem(MOCK_WHITELIST_OFFICER_SEED_KEY, "1");
      return seeded.map((e) => ({ ...e, roles: [...e.roles] }));
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized: WhitelistEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const email =
        typeof rec.email === "string" ? rec.email.trim().toLowerCase() : "";
      if (!email) continue;
      const seed = INITIAL_MOCK_BY_EMAIL.get(email);
      const person = hydrateWhitelistPersonFields({
        firstName: rec.firstName,
        lastName: rec.lastName,
        affiliation:
          typeof rec.affiliation === "string" && rec.affiliation.trim()
            ? rec.affiliation
            : typeof rec.institution === "string" && rec.institution.trim()
              ? rec.institution
              : seed?.affiliation,
        name: rec.name,
      });
      normalized.push({
        email,
        firstName: person.firstName,
        lastName: person.lastName,
        affiliation: person.affiliation,
        name: person.name,
        roles: sanitizeRoleList(rec.roles),
        updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : undefined,
      });
    }
    if (!window.sessionStorage.getItem(MOCK_WHITELIST_OFFICER_SEED_KEY)) {
      const existingEmails = new Set(normalized.map((e) => e.email.toLowerCase()));
      let added = false;
      for (const seedEntry of INITIAL_MOCK_WHITELIST) {
        const em = seedEntry.email.toLowerCase();
        if (!existingEmails.has(em)) {
          normalized.push({ ...seedEntry, roles: [...seedEntry.roles] });
          existingEmails.add(em);
          added = true;
        }
      }
      const secured = ensureProtectedWhitelistEntries(normalized);
      window.sessionStorage.setItem(MOCK_WHITELIST_OFFICER_SEED_KEY, "1");
      if (added || secured.length !== normalized.length) {
        window.sessionStorage.setItem(
          MOCK_WHITELIST_STORAGE_KEY,
          JSON.stringify(secured)
        );
      }
      return secured;
    }
    const secured = ensureProtectedWhitelistEntries(normalized);
    if (
      secured.length !== normalized.length ||
      secured.some(
        (entry, idx) =>
          entry.email !== normalized[idx]?.email ||
          entry.roles.length !== normalized[idx]?.roles.length
      )
    ) {
      window.sessionStorage.setItem(
        MOCK_WHITELIST_STORAGE_KEY,
        JSON.stringify(secured)
      );
    }
    return secured;
  } catch {
    return [];
  }
}

function writeMockWhitelist(entries: WhitelistEntry[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    MOCK_WHITELIST_STORAGE_KEY,
    JSON.stringify(entries)
  );
}

export function useWhitelistAdmin(isAuthorized: boolean) {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [savingBusy, setSavingBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const loadWhitelist = useCallback(async () => {
    setLoadingList(true);
    setErrorMsg("");
    try {
      if (!hasFirebaseKeys) {
        const mockList = readMockWhitelist().sort((a, b) =>
          a.email.localeCompare(b.email)
        );
        setWhitelist(mockList);
        return;
      }

      const [whitelistSnap, userFallbackByEmail] = await Promise.all([
        getDocs(collection(db, "whitelist")),
        (async (): Promise<Map<string, { name: string; affiliation: string }>> => {
          const map = new Map<string, { name: string; affiliation: string }>();
          try {
            const usersSnap = await getDocs(collection(db, "users"));
            usersSnap.forEach((userDoc) => {
              const data = userDoc.data();
              const rawEmail =
                typeof data.email === "string"
                  ? data.email.trim().toLowerCase()
                  : "";
              const rawName = typeof data.name === "string" ? data.name.trim() : "";
              const rawAffil =
                typeof data.affiliation === "string" && data.affiliation.trim()
                  ? data.affiliation.trim()
                  : typeof data.institution === "string"
                    ? data.institution.trim()
                    : "";
              if (rawEmail && (rawName || rawAffil) && !map.has(rawEmail)) {
                map.set(rawEmail, { name: rawName, affiliation: rawAffil });
              }
            });
          } catch {
            // Best-effort fallback profile hydration from registered user profiles
          }
          return map;
        })(),
      ]);

      const entries: WhitelistEntry[] = [];
      whitelistSnap.forEach((docSnap) => {
        const id = docSnap.id.toLowerCase().trim();
        if (!id) return;
        const d = docSnap.data();
        const fallback = userFallbackByEmail.get(id);
        const storedName = typeof d.name === "string" ? d.name.trim() : "";
        const storedAffil =
          typeof d.affiliation === "string" && d.affiliation.trim()
            ? d.affiliation.trim()
            : typeof d.institution === "string" && d.institution.trim()
              ? d.institution.trim()
              : fallback?.affiliation || "";

        const person = hydrateWhitelistPersonFields({
          firstName: d.firstName,
          lastName: d.lastName,
          affiliation: storedAffil,
          name: storedName || fallback?.name || "",
        });

        entries.push({
          email: id,
          firstName: person.firstName,
          lastName: person.lastName,
          affiliation: person.affiliation,
          name: person.name,
          roles: sanitizeRoleList(d.roles),
          updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : undefined,
        });
      });

      const rawProtected = entries.find((e) => e.email === PROTECTED_ADMIN_EMAIL);
      const securedEntries = ensureProtectedWhitelistEntries(entries);
      if (!rawProtected || !rawProtected.roles.includes("admin")) {
        const guaranteed = securedEntries.find((e) => e.email === PROTECTED_ADMIN_EMAIL);
        if (guaranteed) {
          try {
            await setDoc(
              doc(db, "whitelist", PROTECTED_ADMIN_EMAIL),
              {
                firstName: guaranteed.firstName,
                lastName: guaranteed.lastName,
                affiliation: guaranteed.affiliation,
                name: guaranteed.name,
                roles: guaranteed.roles,
                updatedAt: guaranteed.updatedAt || new Date().toISOString(),
              },
              { merge: true }
            );
          } catch {
            // Non-admin callers rely on backend sync and AuthContext fallback
          }
        }
      }
      setWhitelist(securedEntries);
    } catch (err: unknown) {
      setErrorMsg(
        "Failed to load whitelist: " + extractErrorMessage(err, "Unknown error")
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      void loadWhitelist();
    } else {
      setLoadingList(false);
    }
  }, [isAuthorized, loadWhitelist]);

  const addOrUpdateManualUser = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      affiliation: string;
      email: string;
      rolesToAdd: string[];
    }): Promise<{ isNew: boolean; email: string }> => {
      const targetEmail = input.email.trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      setSavingBusy(true);
      setErrorMsg("");
      try {
        const nowIso = new Date().toISOString();
        const cleanIncomingRoles = sanitizeRoleList(input.rolesToAdd);
        const existing = whitelist.find((w) => w.email === targetEmail);
        const isNew = !existing;

        const incomingFirst = input.firstName.trim();
        const incomingLast = input.lastName.trim();
        const incomingAffil = input.affiliation.trim();

        const finalFirst = existing
          ? existing.firstName.trim() || incomingFirst
          : incomingFirst;
        const finalLast = existing
          ? existing.lastName.trim() || incomingLast
          : incomingLast;
        const finalAffil = existing
          ? existing.affiliation.trim() || incomingAffil
          : incomingAffil;
        const finalName = composePersonFullName(
          finalFirst,
          finalLast,
          existing?.name || ""
        );
        const finalRoles = existing
          ? sanitizeRoleList([...existing.roles, ...cleanIncomingRoles])
          : cleanIncomingRoles;

        const nextEntry: WhitelistEntry = {
          email: targetEmail,
          firstName: finalFirst,
          lastName: finalLast,
          affiliation: finalAffil,
          name: finalName,
          roles: finalRoles,
          updatedAt: nowIso,
        };

        if (hasFirebaseKeys) {
          await setDoc(
            doc(db, "whitelist", targetEmail),
            {
              firstName: finalFirst,
              lastName: finalLast,
              affiliation: finalAffil,
              name: finalName,
              roles: finalRoles,
              updatedAt: nowIso,
            },
            { merge: true }
          );
        } else {
          const updated = existing
            ? whitelist.map((w) => (w.email === targetEmail ? nextEntry : w))
            : [...whitelist, nextEntry];
          const sorted = updated.sort((a, b) => a.email.localeCompare(b.email));
          writeMockWhitelist(sorted);
        }

        setWhitelist((prev) => {
          const hasExisting = prev.some((w) => w.email === targetEmail);
          const next = hasExisting
            ? prev.map((w) => (w.email === targetEmail ? nextEntry : w))
            : [...prev, nextEntry];
          return next.sort((a, b) => a.email.localeCompare(b.email));
        });

        return { isNew, email: targetEmail };
      } catch (err: unknown) {
        const msg = extractErrorMessage(err, "Failed to save whitelist entry.");
        setErrorMsg(msg);
        throw new Error(msg);
      } finally {
        setSavingBusy(false);
      }
    },
    [whitelist]
  );

  const updateEntryProfile = useCallback(
    async (
      email: string,
      updates: { firstName: string; lastName: string; affiliation: string }
    ): Promise<void> => {
      const targetEmail = email.trim().toLowerCase();
      const cleanFirst = updates.firstName.trim();
      const cleanLast = updates.lastName.trim();
      const cleanAffiliation = updates.affiliation.trim();
      const cleanName = composePersonFullName(cleanFirst, cleanLast);
      const nowIso = new Date().toISOString();

      setErrorMsg("");
      try {
        if (hasFirebaseKeys) {
          await setDoc(
            doc(db, "whitelist", targetEmail),
            {
              firstName: cleanFirst,
              lastName: cleanLast,
              affiliation: cleanAffiliation,
              name: cleanName,
              updatedAt: nowIso,
            },
            { merge: true }
          );
        }

        setWhitelist((prev) => {
          const next = prev.map((w) =>
            w.email === targetEmail
              ? {
                  ...w,
                  firstName: cleanFirst,
                  lastName: cleanLast,
                  affiliation: cleanAffiliation,
                  name: cleanName,
                  updatedAt: nowIso,
                }
              : w
          );
          if (!hasFirebaseKeys) {
            writeMockWhitelist(next);
          }
          return next;
        });
      } catch (err: unknown) {
        const msg = extractErrorMessage(err, "Failed to update whitelist profile.");
        setErrorMsg(msg);
        throw new Error(msg);
      }
    },
    []
  );

  const toggleRole = useCallback(
    async (
      email: string,
      role: AssignableRole,
      currentRoles: string[]
    ): Promise<void> => {
      const targetEmail = email.trim().toLowerCase();
      const nowIso = new Date().toISOString();
      const baseRoles = sanitizeRoleList(currentRoles);
      if (
        targetEmail === PROTECTED_ADMIN_EMAIL &&
        role === "admin" &&
        baseRoles.includes("admin")
      ) {
        const msg = `${PROTECTED_ADMIN_EMAIL} permanently retains the Administrator ('admin') role and cannot be demoted.`;
        setErrorMsg(msg);
        throw new Error(msg);
      }
      const updatedRoles = baseRoles.includes(role)
        ? baseRoles.filter((r) => r !== role)
        : sanitizeRoleList([...baseRoles, role]);

      setErrorMsg("");
      try {
        if (hasFirebaseKeys) {
          await setDoc(
            doc(db, "whitelist", targetEmail),
            { roles: updatedRoles, updatedAt: nowIso },
            { merge: true }
          );
        }

        setWhitelist((prev) => {
          const next = prev.map((w) =>
            w.email === targetEmail
              ? { ...w, roles: updatedRoles, updatedAt: nowIso }
              : w
          );
          if (!hasFirebaseKeys) {
            writeMockWhitelist(next);
          }
          return next;
        });
      } catch (err: unknown) {
        const msg = extractErrorMessage(err, "Failed to update roles.");
        setErrorMsg(msg);
        throw new Error(msg);
      }
    },
    []
  );

  const bulkUpdateRole = useCallback(
    async (
      emails: string[],
      role: AssignableRole,
      action: "add" | "remove"
    ): Promise<number> => {
      const targetSet = new Set(
        emails.map((e) => e.trim().toLowerCase()).filter(Boolean)
      );
      if (targetSet.size === 0) return 0;

      const nowIso = new Date().toISOString();
      const changedEntries: WhitelistEntry[] = [];
      const nextEntries = whitelist.map((entry) => {
        if (!targetSet.has(entry.email)) return entry;
        if (
          action === "remove" &&
          role === "admin" &&
          entry.email === PROTECTED_ADMIN_EMAIL
        ) {
          return entry;
        }
        const baseRoles = sanitizeRoleList(entry.roles);
        const hasRole = baseRoles.includes(role);
        if ((action === "add" && hasRole) || (action === "remove" && !hasRole)) {
          return entry;
        }
        const nextRoles =
          action === "add"
            ? sanitizeRoleList([...baseRoles, role])
            : baseRoles.filter((r) => r !== role);
        const updated: WhitelistEntry = {
          ...entry,
          roles: nextRoles,
          updatedAt: nowIso,
        };
        changedEntries.push(updated);
        return updated;
      });

      if (changedEntries.length === 0) return 0;

      setSavingBusy(true);
      setErrorMsg("");
      try {
        if (hasFirebaseKeys) {
          const BATCH_LIMIT = 400;
          for (let i = 0; i < changedEntries.length; i += BATCH_LIMIT) {
            const chunk = changedEntries.slice(i, i + BATCH_LIMIT);
            const batch = writeBatch(db);
            for (const entry of chunk) {
              batch.set(
                doc(db, "whitelist", entry.email),
                { roles: entry.roles, updatedAt: nowIso },
                { merge: true }
              );
            }
            await batch.commit();
          }
        } else {
          writeMockWhitelist(nextEntries);
        }

        setWhitelist(nextEntries);
        return changedEntries.length;
      } catch (err: unknown) {
        const msg = extractErrorMessage(err, "Failed to update roles in bulk.");
        setErrorMsg(msg);
        throw new Error(msg);
      } finally {
        setSavingBusy(false);
      }
    },
    [whitelist]
  );

  const deleteEntry = useCallback(async (email: string): Promise<void> => {
    const targetEmail = email.trim().toLowerCase();
    if (targetEmail === PROTECTED_ADMIN_EMAIL) {
      const msg = `${PROTECTED_ADMIN_EMAIL} is the protected system webmaster and cannot be removed from the whitelist.`;
      setErrorMsg(msg);
      throw new Error(msg);
    }
    setErrorMsg("");
    try {
      if (hasFirebaseKeys) {
        await deleteDoc(doc(db, "whitelist", targetEmail));
      }

      setWhitelist((prev) => {
        const next = prev.filter((w) => w.email !== targetEmail);
        if (!hasFirebaseKeys) {
          writeMockWhitelist(next);
        }
        return next;
      });
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to remove whitelist entry.");
      setErrorMsg(msg);
      throw new Error(msg);
    }
  }, []);

  const applyCsvPlan = useCallback(
    async (plan: WhitelistCsvApplyPlan): Promise<void> => {
      setSavingBusy(true);
      setErrorMsg("");
      try {
        const nowIso = new Date().toISOString();
        if (hasFirebaseKeys) {
          const BATCH_LIMIT = 400;
          for (let i = 0; i < plan.mutations.length; i += BATCH_LIMIT) {
            const chunk = plan.mutations.slice(i, i + BATCH_LIMIT);
            const batch = writeBatch(db);
            for (const mutation of chunk) {
              batch.set(
                doc(db, "whitelist", mutation.email),
                {
                  firstName: mutation.firstName,
                  lastName: mutation.lastName,
                  affiliation: mutation.affiliation,
                  name: mutation.name,
                  roles: mutation.roles,
                  updatedAt: mutation.updatedAt || nowIso,
                },
                { merge: true }
              );
            }
            await batch.commit();
          }
        } else {
          writeMockWhitelist(plan.nextEntries);
        }

        setWhitelist(plan.nextEntries);
      } catch (err: unknown) {
        const msg = extractErrorMessage(err, "Failed to apply CSV import.");
        setErrorMsg(msg);
        throw new Error(msg);
      } finally {
        setSavingBusy(false);
      }
    },
    []
  );

  return {
    whitelist,
    loadingList,
    savingBusy,
    errorMsg,
    loadWhitelist,
    addOrUpdateManualUser,
    updateEntryProfile,
    toggleRole,
    bulkUpdateRole,
    deleteEntry,
    applyCsvPlan,
  };
}
