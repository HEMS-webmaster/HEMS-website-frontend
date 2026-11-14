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
  sanitizeRoleList,
  WhitelistCsvApplyPlan,
  WhitelistEntry,
} from "@/utils/whitelistCsv";

const MOCK_WHITELIST_STORAGE_KEY = "hems_mock_whitelist";

const INITIAL_MOCK_WHITELIST: WhitelistEntry[] = [
  {
    email: "admin@example.com",
    name: "Society Admin",
    roles: ["admin", "reviewer", "board"],
  },
  {
    email: "reviewer@example.com",
    name: "Dr. Jordan Blake",
    roles: ["reviewer"],
  },
  {
    email: "elena.vance@university.edu",
    name: "Dr. Elena Vance",
    roles: ["attendee", "oral presenter"],
  },
  {
    email: "marcus.chen@lab.gov",
    name: "Marcus Chen",
    roles: ["attendee", "poster presenter"],
  },
  {
    email: "sponsorship@instrumentcorp.com",
    name: "Dana Brooks",
    roles: ["corporate sponsor"],
  },
];

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
      window.sessionStorage.setItem(
        MOCK_WHITELIST_STORAGE_KEY,
        JSON.stringify(INITIAL_MOCK_WHITELIST)
      );
      return INITIAL_MOCK_WHITELIST.map((e) => ({ ...e, roles: [...e.roles] }));
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized: WhitelistEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const email = typeof rec.email === "string" ? rec.email.trim().toLowerCase() : "";
      if (!email) continue;
      normalized.push({
        email,
        name: typeof rec.name === "string" ? rec.name.trim() : "",
        roles: sanitizeRoleList(rec.roles),
        updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : undefined,
      });
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeMockWhitelist(entries: WhitelistEntry[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(MOCK_WHITELIST_STORAGE_KEY, JSON.stringify(entries));
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

      const [whitelistSnap, userNamesByEmail] = await Promise.all([
        getDocs(collection(db, "whitelist")),
        (async (): Promise<Map<string, string>> => {
          const map = new Map<string, string>();
          try {
            const usersSnap = await getDocs(collection(db, "users"));
            usersSnap.forEach((userDoc) => {
              const data = userDoc.data();
              const rawEmail =
                typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
              const rawName = typeof data.name === "string" ? data.name.trim() : "";
              if (rawEmail && rawName && !map.has(rawEmail)) {
                map.set(rawEmail, rawName);
              }
            });
          } catch {
            // Best-effort fallback name hydration from registered user profiles
          }
          return map;
        })(),
      ]);

      const entries: WhitelistEntry[] = [];
      whitelistSnap.forEach((docSnap) => {
        const id = docSnap.id.toLowerCase().trim();
        if (!id) return;
        const d = docSnap.data();
        const storedName = typeof d.name === "string" ? d.name.trim() : "";
        entries.push({
          email: id,
          name: storedName || userNamesByEmail.get(id) || "",
          roles: sanitizeRoleList(d.roles),
          updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : undefined,
        });
      });

      entries.sort((a, b) => a.email.localeCompare(b.email));
      setWhitelist(entries);
    } catch (err: unknown) {
      setErrorMsg("Failed to load whitelist: " + extractErrorMessage(err, "Unknown error"));
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
    async (
      email: string,
      name: string,
      rolesToAdd: string[]
    ): Promise<{ isNew: boolean; email: string }> => {
      const targetEmail = email.trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      setSavingBusy(true);
      setErrorMsg("");
      try {
        const nowIso = new Date().toISOString();
        const cleanIncomingRoles = sanitizeRoleList(rolesToAdd);
        const existing = whitelist.find((w) => w.email === targetEmail);
        const isNew = !existing;
        const finalName = existing
          ? existing.name.trim() || name.trim()
          : name.trim();
        const finalRoles = existing
          ? sanitizeRoleList([...existing.roles, ...cleanIncomingRoles])
          : cleanIncomingRoles;

        const nextEntry: WhitelistEntry = {
          email: targetEmail,
          name: finalName,
          roles: finalRoles,
          updatedAt: nowIso,
        };

        if (hasFirebaseKeys) {
          await setDoc(
            doc(db, "whitelist", targetEmail),
            {
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

  const updateEntryName = useCallback(async (email: string, name: string): Promise<void> => {
    const targetEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const nowIso = new Date().toISOString();

    setErrorMsg("");
    try {
      if (hasFirebaseKeys) {
        await setDoc(
          doc(db, "whitelist", targetEmail),
          { name: cleanName, updatedAt: nowIso },
          { merge: true }
        );
      }

      setWhitelist((prev) => {
        const next = prev.map((w) =>
          w.email === targetEmail ? { ...w, name: cleanName, updatedAt: nowIso } : w
        );
        if (!hasFirebaseKeys) {
          writeMockWhitelist(next);
        }
        return next;
      });
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to update name.");
      setErrorMsg(msg);
      throw new Error(msg);
    }
  }, []);

  const toggleRole = useCallback(
    async (email: string, role: AssignableRole, currentRoles: string[]): Promise<void> => {
      const targetEmail = email.trim().toLowerCase();
      const nowIso = new Date().toISOString();
      const baseRoles = sanitizeRoleList(currentRoles);
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
            w.email === targetEmail ? { ...w, roles: updatedRoles, updatedAt: nowIso } : w
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

  const deleteEntry = useCallback(async (email: string): Promise<void> => {
    const targetEmail = email.trim().toLowerCase();
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

  const applyCsvPlan = useCallback(async (plan: WhitelistCsvApplyPlan): Promise<void> => {
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
  }, []);

  return {
    whitelist,
    loadingList,
    savingBusy,
    errorMsg,
    loadWhitelist,
    addOrUpdateManualUser,
    updateEntryName,
    toggleRole,
    deleteEntry,
    applyCsvPlan,
  };
}
