"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import { hasAdminRole } from "@/utils/telemetryClient";
import {
  DEFAULT_UPCOMING_WORKSHOP,
  buildNextBiennialCycleTemplate,
  computeWorkshopConfigDiff,
  configToCsvString,
  normalizeWorkshopConfig,
  validateWorkshopConfig,
  type UpcomingWorkshopConfig,
} from "@/utils/upcomingWorkshop";
import {
  MOCK_WORKSHOP_DRAFT_KEY,
  MOCK_WORKSHOP_HISTORY_KEY,
  MOCK_WORKSHOP_LIVE_KEY,
  MOCK_WORKSHOP_PREVIEWS_KEY,
  WORKSHOP_CONFIG_UPDATED_EVENT,
  clearWorkshopLiveCache,
} from "@/hooks/useUpcomingWorkshop";

export type WorkshopDiffEntry = ReturnType<typeof computeWorkshopConfigDiff>[number];
export type WorkshopValidationIssue = ReturnType<typeof validateWorkshopConfig>[number];

export interface WorkshopPreviewRecord {
  token: string;
  label: string;
  createdByUid: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  revokedAt?: string;
  revokedByEmail?: string;
  draftSnapshot: UpcomingWorkshopConfig;
}

export interface WorkshopHistoryEntry {
  versionId: string;
  versionNumber: number;
  actionType: "seed" | "publish" | "rollback";
  createdAt: string;
  createdByUid: string;
  createdByEmail: string;
  createdByName: string;
  changeSummary: string;
  rolledBackFromVersion?: number;
  config: UpcomingWorkshopConfig;
  diffsFromPrevious: WorkshopDiffEntry[];
}

interface StoredLiveDoc {
  config: UpcomingWorkshopConfig;
  versionNumber: number;
  updatedAt: string;
  updatedByUid: string;
  updatedByEmail: string;
  updatedByName: string;
  changeSummary?: string;
}

interface StoredDraftDoc {
  config: UpcomingWorkshopConfig;
  baseVersion: number;
  updatedAt: string;
  updatedByUid: string;
  updatedByEmail: string;
  updatedByName: string;
}

function generateSecureToken(prefix = "hems"): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const length = 22;
  let randomPart = "";
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      randomPart += alphabet[bytes[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return `${prefix}_${randomPart}`;
}

function formatVersionId(versionNumber: number): string {
  return `v${String(Math.max(1, Math.floor(versionNumber))).padStart(4, "0")}`;
}

function broadcastWorkshopUpdate(): void {
  clearWorkshopLiveCache();
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(WORKSHOP_CONFIG_UPDATED_EVENT));
    } catch {
      // Ignore broadcast errors
    }
  }
}

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local storage errors
  }
}

export function isPreviewRecordActive(record: WorkshopPreviewRecord): boolean {
  if (record.revoked) return false;
  if (record.expiresAt) {
    const expMs = new Date(record.expiresAt).getTime();
    if (!Number.isNaN(expMs) && expMs <= Date.now()) {
      return false;
    }
  }
  return true;
}

export function useWorkshopConfigAdmin() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useMemo(() => Boolean(user && hasAdminRole(user.roles)), [user]);
  const isCloudBacked = Boolean(hasFirebaseKeys && db);

  const [liveConfig, setLiveConfig] = useState<UpcomingWorkshopConfig>(DEFAULT_UPCOMING_WORKSHOP);
  const [liveVersion, setLiveVersion] = useState<number>(1);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<string>("");
  const [liveUpdatedBy, setLiveUpdatedBy] = useState<string>("System Baseline");

  const [savedDraftConfig, setSavedDraftConfig] = useState<UpcomingWorkshopConfig>(
    DEFAULT_UPCOMING_WORKSHOP
  );
  const [draftConfig, setDraftConfig] = useState<UpcomingWorkshopConfig>(
    DEFAULT_UPCOMING_WORKSHOP
  );
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string>("");
  const [draftUpdatedBy, setDraftUpdatedBy] = useState<string>("System Baseline");

  const [allPreviews, setAllPreviews] = useState<WorkshopPreviewRecord[]>([]);
  const [historyEntries, setHistoryEntries] = useState<WorkshopHistoryEntry[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const actorInfo = useMemo(
    () => ({
      uid: user?.uid || "local-admin",
      email: user?.email || "admin@hems-workshop.org",
      name: user?.name || user?.email || "HEMS Administrator",
    }),
    [user]
  );

  const clearMessages = useCallback(() => {
    setFeedbackMsg(null);
    setErrorMsg(null);
  }, []);

  const reloadAll = useCallback(async () => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const nowIso = new Date().toISOString();

      if (isCloudBacked) {
        const liveRef = doc(db, "site_config", "workshop_live");
        const draftRef = doc(db, "site_config", "workshop_draft");
        const v1Ref = doc(db, "site_config_history", "v0001");

        const [liveSnap, draftSnap, historySnap, previewsSnap] = await Promise.all([
          getDoc(liveRef),
          getDoc(draftRef),
          getDocs(
            query(
              collection(db, "site_config_history"),
              orderBy("versionNumber", "desc"),
              limit(60)
            )
          ),
          getDocs(
            query(collection(db, "site_config_previews"), orderBy("createdAt", "desc"), limit(40))
          ),
        ]);

        let resolvedLiveDoc: StoredLiveDoc;
        let resolvedDraftDoc: StoredDraftDoc;
        let resolvedHistory: WorkshopHistoryEntry[] = historySnap.docs.map((d) => {
          const raw = d.data() as Partial<WorkshopHistoryEntry>;
          return {
            versionId: raw.versionId || d.id,
            versionNumber: Number(raw.versionNumber || 1),
            actionType: (raw.actionType as WorkshopHistoryEntry["actionType"]) || "publish",
            createdAt: String(raw.createdAt || nowIso),
            createdByUid: String(raw.createdByUid || ""),
            createdByEmail: String(raw.createdByEmail || "admin@hems-workshop.org"),
            createdByName: String(raw.createdByName || "HEMS Admin"),
            changeSummary: String(raw.changeSummary || ""),
            rolledBackFromVersion:
              typeof raw.rolledBackFromVersion === "number"
                ? raw.rolledBackFromVersion
                : undefined,
            config: normalizeWorkshopConfig(raw.config, DEFAULT_UPCOMING_WORKSHOP),
            diffsFromPrevious: Array.isArray(raw.diffsFromPrevious) ? raw.diffsFromPrevious : [],
          };
        });

        // Auto-seed v0001 on first Admin initialization if live config doesn't exist yet
        if (!liveSnap.exists()) {
          const seedConfig = normalizeWorkshopConfig(
            DEFAULT_UPCOMING_WORKSHOP,
            DEFAULT_UPCOMING_WORKSHOP
          );
          resolvedLiveDoc = {
            config: seedConfig,
            versionNumber: 1,
            updatedAt: nowIso,
            updatedByUid: actorInfo.uid,
            updatedByEmail: actorInfo.email,
            updatedByName: actorInfo.name,
            changeSummary:
              "Initial 44-key Workshop Control Center baseline migrated from bundled defaults.",
          };
          resolvedDraftDoc = draftSnap.exists()
            ? {
                ...(draftSnap.data() as StoredDraftDoc),
                config: normalizeWorkshopConfig(
                  (draftSnap.data() as StoredDraftDoc).config,
                  seedConfig
                ),
              }
            : {
                config: seedConfig,
                baseVersion: 1,
                updatedAt: nowIso,
                updatedByUid: actorInfo.uid,
                updatedByEmail: actorInfo.email,
                updatedByName: actorInfo.name,
              };

          const seedHistoryEntry: WorkshopHistoryEntry = {
            versionId: "v0001",
            versionNumber: 1,
            actionType: "seed",
            createdAt: nowIso,
            createdByUid: actorInfo.uid,
            createdByEmail: actorInfo.email,
            createdByName: actorInfo.name,
            changeSummary:
              "Initial 44-key Workshop Control Center baseline migrated from bundled defaults.",
            config: seedConfig,
            diffsFromPrevious: [],
          };

          const batch = writeBatch(db);
          batch.set(liveRef, resolvedLiveDoc);
          if (!draftSnap.exists()) {
            batch.set(draftRef, resolvedDraftDoc);
          }
          const existingV1 = await getDoc(v1Ref);
          if (!existingV1.exists() && resolvedHistory.length === 0) {
            batch.set(v1Ref, seedHistoryEntry);
            resolvedHistory = [seedHistoryEntry];
          }
          await batch.commit();
        } else {
          const rawLive = liveSnap.data() as Partial<StoredLiveDoc>;
          const normalizedLive = normalizeWorkshopConfig(
            rawLive.config ?? (rawLive as unknown as Partial<UpcomingWorkshopConfig>),
            DEFAULT_UPCOMING_WORKSHOP
          );
          resolvedLiveDoc = {
            config: normalizedLive,
            versionNumber: Number(rawLive.versionNumber || resolvedHistory[0]?.versionNumber || 1),
            updatedAt: String(rawLive.updatedAt || nowIso),
            updatedByUid: String(rawLive.updatedByUid || ""),
            updatedByEmail: String(rawLive.updatedByEmail || "admin@hems-workshop.org"),
            updatedByName: String(rawLive.updatedByName || rawLive.updatedByEmail || "HEMS Admin"),
            changeSummary: String(rawLive.changeSummary || ""),
          };

          if (draftSnap.exists()) {
            const rawDraft = draftSnap.data() as Partial<StoredDraftDoc>;
            resolvedDraftDoc = {
              config: normalizeWorkshopConfig(rawDraft.config, normalizedLive),
              baseVersion: Number(rawDraft.baseVersion || resolvedLiveDoc.versionNumber),
              updatedAt: String(rawDraft.updatedAt || resolvedLiveDoc.updatedAt),
              updatedByUid: String(rawDraft.updatedByUid || ""),
              updatedByEmail: String(rawDraft.updatedByEmail || resolvedLiveDoc.updatedByEmail),
              updatedByName: String(rawDraft.updatedByName || resolvedLiveDoc.updatedByName),
            };
          } else {
            resolvedDraftDoc = {
              config: normalizedLive,
              baseVersion: resolvedLiveDoc.versionNumber,
              updatedAt: resolvedLiveDoc.updatedAt,
              updatedByUid: actorInfo.uid,
              updatedByEmail: actorInfo.email,
              updatedByName: actorInfo.name,
            };
            await setDoc(draftRef, resolvedDraftDoc);
          }
        }

        const loadedPreviews: WorkshopPreviewRecord[] = previewsSnap.docs.map((d) => {
          const raw = d.data() as Partial<WorkshopPreviewRecord>;
          return {
            token: raw.token || d.id,
            label: String(raw.label || "Board Draft Review"),
            createdByUid: String(raw.createdByUid || ""),
            createdByEmail: String(raw.createdByEmail || "admin@hems-workshop.org"),
            createdByName: String(raw.createdByName || "HEMS Admin"),
            createdAt: String(raw.createdAt || nowIso),
            expiresAt: String(raw.expiresAt || nowIso),
            revoked: Boolean(raw.revoked),
            revokedAt: raw.revokedAt ? String(raw.revokedAt) : undefined,
            revokedByEmail: raw.revokedByEmail ? String(raw.revokedByEmail) : undefined,
            draftSnapshot: normalizeWorkshopConfig(raw.draftSnapshot, resolvedDraftDoc.config),
          };
        });

        setLiveConfig(resolvedLiveDoc.config);
        setLiveVersion(resolvedLiveDoc.versionNumber);
        setLiveUpdatedAt(resolvedLiveDoc.updatedAt);
        setLiveUpdatedBy(resolvedLiveDoc.updatedByName || resolvedLiveDoc.updatedByEmail);

        setSavedDraftConfig(resolvedDraftDoc.config);
        setDraftConfig(resolvedDraftDoc.config);
        setDraftUpdatedAt(resolvedDraftDoc.updatedAt);
        setDraftUpdatedBy(resolvedDraftDoc.updatedByName || resolvedDraftDoc.updatedByEmail);

        setHistoryEntries(resolvedHistory);
        setAllPreviews(loadedPreviews);
      } else {
        // Local development / offline mock store backed by localStorage
        let mockLive = readLocalJson<StoredLiveDoc | null>(MOCK_WORKSHOP_LIVE_KEY, null);
        let mockDraft = readLocalJson<StoredDraftDoc | null>(MOCK_WORKSHOP_DRAFT_KEY, null);
        let mockHistory = readLocalJson<WorkshopHistoryEntry[]>(MOCK_WORKSHOP_HISTORY_KEY, []);
        const mockPreviewsMap = readLocalJson<Record<string, WorkshopPreviewRecord>>(
          MOCK_WORKSHOP_PREVIEWS_KEY,
          {}
        );

        if (!mockLive) {
          const seedConfig = normalizeWorkshopConfig(
            DEFAULT_UPCOMING_WORKSHOP,
            DEFAULT_UPCOMING_WORKSHOP
          );
          mockLive = {
            config: seedConfig,
            versionNumber: 1,
            updatedAt: nowIso,
            updatedByUid: actorInfo.uid,
            updatedByEmail: actorInfo.email,
            updatedByName: actorInfo.name,
            changeSummary:
              "Initial 44-key Workshop Control Center baseline migrated from bundled defaults.",
          };
          mockDraft = {
            config: seedConfig,
            baseVersion: 1,
            updatedAt: nowIso,
            updatedByUid: actorInfo.uid,
            updatedByEmail: actorInfo.email,
            updatedByName: actorInfo.name,
          };
          if (mockHistory.length === 0) {
            mockHistory = [
              {
                versionId: "v0001",
                versionNumber: 1,
                actionType: "seed",
                createdAt: nowIso,
                createdByUid: actorInfo.uid,
                createdByEmail: actorInfo.email,
                createdByName: actorInfo.name,
                changeSummary:
                  "Initial 44-key Workshop Control Center baseline migrated from bundled defaults.",
                config: seedConfig,
                diffsFromPrevious: [],
              },
            ];
          }
          writeLocalJson(MOCK_WORKSHOP_LIVE_KEY, mockLive);
          writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, mockDraft);
          writeLocalJson(MOCK_WORKSHOP_HISTORY_KEY, mockHistory);
        } else {
          mockLive = {
            ...mockLive,
            config: normalizeWorkshopConfig(mockLive.config, DEFAULT_UPCOMING_WORKSHOP),
          };
          if (!mockDraft) {
            mockDraft = {
              config: mockLive.config,
              baseVersion: mockLive.versionNumber,
              updatedAt: mockLive.updatedAt,
              updatedByUid: actorInfo.uid,
              updatedByEmail: actorInfo.email,
              updatedByName: actorInfo.name,
            };
            writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, mockDraft);
          } else {
            mockDraft = {
              ...mockDraft,
              config: normalizeWorkshopConfig(mockDraft.config, mockLive.config),
            };
          }
        }

        const previewList = Object.values(mockPreviewsMap).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );

        setLiveConfig(mockLive.config);
        setLiveVersion(mockLive.versionNumber);
        setLiveUpdatedAt(mockLive.updatedAt);
        setLiveUpdatedBy(mockLive.updatedByName || mockLive.updatedByEmail);

        setSavedDraftConfig(mockDraft.config);
        setDraftConfig(mockDraft.config);
        setDraftUpdatedAt(mockDraft.updatedAt);
        setDraftUpdatedBy(mockDraft.updatedByName || mockDraft.updatedByEmail);

        setHistoryEntries([...mockHistory].sort((a, b) => b.versionNumber - a.versionNumber));
        setAllPreviews(previewList);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load workshop settings from storage.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [actorInfo.email, actorInfo.name, actorInfo.uid, authLoading, isAdmin, isCloudBacked]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const updateDraftField = useCallback(
    <K extends keyof UpcomingWorkshopConfig>(key: K, value: UpcomingWorkshopConfig[K]) => {
      setDraftConfig((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const updateDraftFields = useCallback((partial: Partial<UpcomingWorkshopConfig>) => {
    setDraftConfig((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  const dirtyDiffs = useMemo(
    () => computeWorkshopConfigDiff(savedDraftConfig, draftConfig),
    [savedDraftConfig, draftConfig]
  );

  const diffsVsLive = useMemo(
    () => computeWorkshopConfigDiff(liveConfig, draftConfig),
    [liveConfig, draftConfig]
  );

  const hasUnsavedChanges = dirtyDiffs.length > 0;
  const hasUnpublishedChanges = diffsVsLive.length > 0;

  const validationIssues = useMemo(
    () => validateWorkshopConfig(draftConfig),
    [draftConfig]
  );

  const hasBlockingErrors = useMemo(
    () => validationIssues.some((issue) => issue.severity === "error"),
    [validationIssues]
  );

  const activePreviews = useMemo(
    () => allPreviews.filter((record) => isPreviewRecordActive(record)),
    [allPreviews]
  );

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!isAdmin) return false;
    setBusyAction("saveDraft");
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const normalized = normalizeWorkshopConfig(draftConfig, liveConfig);
      const nextDraftDoc: StoredDraftDoc = {
        config: normalized,
        baseVersion: liveVersion,
        updatedAt: nowIso,
        updatedByUid: actorInfo.uid,
        updatedByEmail: actorInfo.email,
        updatedByName: actorInfo.name,
      };

      if (isCloudBacked) {
        const batch = writeBatch(db);
        batch.set(doc(db, "site_config", "workshop_draft"), nextDraftDoc);
        // Keep active non-revoked board review preview links synchronized with latest Draft
        for (const preview of activePreviews) {
          batch.update(doc(db, "site_config_previews", preview.token), {
            draftSnapshot: normalized,
          });
        }
        await batch.commit();
      } else {
        writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, nextDraftDoc);
        const previewsMap = readLocalJson<Record<string, WorkshopPreviewRecord>>(
          MOCK_WORKSHOP_PREVIEWS_KEY,
          {}
        );
        for (const preview of activePreviews) {
          if (previewsMap[preview.token]) {
            previewsMap[preview.token] = {
              ...previewsMap[preview.token],
              draftSnapshot: normalized,
            };
          }
        }
        writeLocalJson(MOCK_WORKSHOP_PREVIEWS_KEY, previewsMap);
      }

      setDraftConfig(normalized);
      setSavedDraftConfig(normalized);
      setDraftUpdatedAt(nowIso);
      setDraftUpdatedBy(actorInfo.name || actorInfo.email);
      setAllPreviews((prev) =>
        prev.map((p) => (isPreviewRecordActive(p) ? { ...p, draftSnapshot: normalized } : p))
      );
      broadcastWorkshopUpdate();
      setFeedbackMsg(
        activePreviews.length > 0
          ? `Draft saved & ${activePreviews.length} active Board Review link(s) refreshed. Live website unchanged.`
          : "Draft saved safely to staging. Your live public website is unchanged."
      );
      return true;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not save draft.");
      return false;
    } finally {
      setBusyAction(null);
    }
  }, [
    activePreviews,
    actorInfo.email,
    actorInfo.name,
    actorInfo.uid,
    draftConfig,
    isAdmin,
    isCloudBacked,
    liveConfig,
    liveVersion,
  ]);

  const resetDraftToLive = useCallback(async (): Promise<boolean> => {
    if (!isAdmin) return false;
    setBusyAction("resetDraft");
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const normalizedLive = normalizeWorkshopConfig(liveConfig, DEFAULT_UPCOMING_WORKSHOP);
      const nextDraftDoc: StoredDraftDoc = {
        config: normalizedLive,
        baseVersion: liveVersion,
        updatedAt: nowIso,
        updatedByUid: actorInfo.uid,
        updatedByEmail: actorInfo.email,
        updatedByName: actorInfo.name,
      };

      if (isCloudBacked) {
        await setDoc(doc(db, "site_config", "workshop_draft"), nextDraftDoc);
      } else {
        writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, nextDraftDoc);
      }

      setDraftConfig(normalizedLive);
      setSavedDraftConfig(normalizedLive);
      setDraftUpdatedAt(nowIso);
      setDraftUpdatedBy(actorInfo.name || actorInfo.email);
      setFeedbackMsg(`Draft reset cleanly to match Live Version #${liveVersion}.`);
      return true;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to reset draft to live.");
      return false;
    } finally {
      setBusyAction(null);
    }
  }, [actorInfo.email, actorInfo.name, actorInfo.uid, isAdmin, isCloudBacked, liveConfig, liveVersion]);

  const publishDraftToLive = useCallback(
    async (changeSummary: string): Promise<boolean> => {
      if (!isAdmin) return false;
      const issues = validateWorkshopConfig(draftConfig);
      if (issues.some((i) => i.severity === "error")) {
        setErrorMsg("Fix all blocking validation errors before publishing to Live.");
        return false;
      }

      const trimmedSummary =
        changeSummary.trim() ||
        `Published ${diffsVsLive.length} updated setting(s) via Workshop Settings Console.`;

      setBusyAction("publish");
      setErrorMsg(null);
      setFeedbackMsg(null);

      try {
        const nowIso = new Date().toISOString();
        const normalized = normalizeWorkshopConfig(draftConfig, liveConfig);
        const highestHistory = historyEntries.reduce(
          (maxVal, item) => Math.max(maxVal, item.versionNumber),
          0
        );
        const nextVersion = Math.max(liveVersion, highestHistory) + 1;
        const versionId = formatVersionId(nextVersion);
        const diffsFromPrev = computeWorkshopConfigDiff(liveConfig, normalized);

        const nextLiveDoc: StoredLiveDoc = {
          config: normalized,
          versionNumber: nextVersion,
          updatedAt: nowIso,
          updatedByUid: actorInfo.uid,
          updatedByEmail: actorInfo.email,
          updatedByName: actorInfo.name,
          changeSummary: trimmedSummary,
        };

        const nextDraftDoc: StoredDraftDoc = {
          config: normalized,
          baseVersion: nextVersion,
          updatedAt: nowIso,
          updatedByUid: actorInfo.uid,
          updatedByEmail: actorInfo.email,
          updatedByName: actorInfo.name,
        };

        const newHistoryEntry: WorkshopHistoryEntry = {
          versionId,
          versionNumber: nextVersion,
          actionType: "publish",
          createdAt: nowIso,
          createdByUid: actorInfo.uid,
          createdByEmail: actorInfo.email,
          createdByName: actorInfo.name,
          changeSummary: trimmedSummary,
          config: normalized,
          diffsFromPrevious: diffsFromPrev,
        };

        if (isCloudBacked) {
          const batch = writeBatch(db);
          batch.set(doc(db, "site_config", "workshop_live"), nextLiveDoc);
          batch.set(doc(db, "site_config", "workshop_draft"), nextDraftDoc);
          batch.set(doc(db, "site_config_history", versionId), newHistoryEntry);
          await batch.commit();
        } else {
          writeLocalJson(MOCK_WORKSHOP_LIVE_KEY, nextLiveDoc);
          writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, nextDraftDoc);
          const currentHistory = readLocalJson<WorkshopHistoryEntry[]>(
            MOCK_WORKSHOP_HISTORY_KEY,
            []
          );
          writeLocalJson(MOCK_WORKSHOP_HISTORY_KEY, [newHistoryEntry, ...currentHistory]);
        }

        setLiveConfig(normalized);
        setLiveVersion(nextVersion);
        setLiveUpdatedAt(nowIso);
        setLiveUpdatedBy(actorInfo.name || actorInfo.email);
        setSavedDraftConfig(normalized);
        setDraftConfig(normalized);
        setDraftUpdatedAt(nowIso);
        setDraftUpdatedBy(actorInfo.name || actorInfo.email);
        setHistoryEntries((prev) => [newHistoryEntry, ...prev]);
        broadcastWorkshopUpdate();
        setFeedbackMsg(
          `Published Live Version #${nextVersion} ("${trimmedSummary}"). All visitors now see these updates.`
        );
        return true;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to publish changes.");
        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [
      actorInfo.email,
      actorInfo.name,
      actorInfo.uid,
      diffsVsLive.length,
      draftConfig,
      historyEntries,
      isAdmin,
      isCloudBacked,
      liveConfig,
      liveVersion,
    ]
  );

  const createPreviewLink = useCallback(
    async (
      label: string,
      daysValid = 14
    ): Promise<{ token: string; url: string } | null> => {
      if (!isAdmin) return null;
      setBusyAction("createPreview");
      setErrorMsg(null);
      setFeedbackMsg(null);

      try {
        const now = new Date();
        const expires = new Date(now.getTime() + Math.max(1, daysValid) * 86400_000);
        const nowIso = now.toISOString();
        const expiresIso = expires.toISOString();
        const token = generateSecureToken("brd");
        const cleanLabel = label.trim() || `Board Review Draft (${now.toLocaleDateString()})`;
        const normalizedDraft = normalizeWorkshopConfig(draftConfig, liveConfig);

        const nextDraftDoc: StoredDraftDoc = {
          config: normalizedDraft,
          baseVersion: liveVersion,
          updatedAt: nowIso,
          updatedByUid: actorInfo.uid,
          updatedByEmail: actorInfo.email,
          updatedByName: actorInfo.name,
        };

        const previewDoc: WorkshopPreviewRecord = {
          token,
          label: cleanLabel,
          createdByUid: actorInfo.uid,
          createdByEmail: actorInfo.email,
          createdByName: actorInfo.name,
          createdAt: nowIso,
          expiresAt: expiresIso,
          revoked: false,
          draftSnapshot: normalizedDraft,
        };

        if (isCloudBacked) {
          const batch = writeBatch(db);
          batch.set(doc(db, "site_config", "workshop_draft"), nextDraftDoc);
          batch.set(doc(db, "site_config_previews", token), previewDoc);
          await batch.commit();
        } else {
          writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, nextDraftDoc);
          const previewsMap = readLocalJson<Record<string, WorkshopPreviewRecord>>(
            MOCK_WORKSHOP_PREVIEWS_KEY,
            {}
          );
          previewsMap[token] = previewDoc;
          writeLocalJson(MOCK_WORKSHOP_PREVIEWS_KEY, previewsMap);
        }

        setSavedDraftConfig(normalizedDraft);
        setDraftConfig(normalizedDraft);
        setDraftUpdatedAt(nowIso);
        setAllPreviews((prev) => [previewDoc, ...prev]);

        const origin = typeof window !== "undefined" ? window.location.origin : "https://hems-workshop.org";
        const url = `${origin}/?preview=${token}`;
        setFeedbackMsg(`Created shareable Board Preview Link "${cleanLabel}".`);
        return { token, url };
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Could not generate preview link.");
        return null;
      } finally {
        setBusyAction(null);
      }
    },
    [
      actorInfo.email,
      actorInfo.name,
      actorInfo.uid,
      draftConfig,
      isAdmin,
      isCloudBacked,
      liveConfig,
      liveVersion,
    ]
  );

  const revokePreviewLink = useCallback(
    async (token: string): Promise<boolean> => {
      if (!isAdmin) return false;
      setBusyAction(`revoke_${token}`);
      setErrorMsg(null);
      setFeedbackMsg(null);

      try {
        const nowIso = new Date().toISOString();
        if (isCloudBacked) {
          await updateDoc(doc(db, "site_config_previews", token), {
            revoked: true,
            revokedAt: nowIso,
            revokedByEmail: actorInfo.email,
          });
        } else {
          const previewsMap = readLocalJson<Record<string, WorkshopPreviewRecord>>(
            MOCK_WORKSHOP_PREVIEWS_KEY,
            {}
          );
          if (previewsMap[token]) {
            previewsMap[token] = {
              ...previewsMap[token],
              revoked: true,
              revokedAt: nowIso,
              revokedByEmail: actorInfo.email,
            };
            writeLocalJson(MOCK_WORKSHOP_PREVIEWS_KEY, previewsMap);
          }
        }

        setAllPreviews((prev) =>
          prev.map((item) =>
            item.token === token
              ? { ...item, revoked: true, revokedAt: nowIso, revokedByEmail: actorInfo.email }
              : item
          )
        );
        setFeedbackMsg("Preview link revoked. Anyone using it now sees the public Live website.");
        return true;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to revoke preview link.");
        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [actorInfo.email, isAdmin, isCloudBacked]
  );

  const loadHistoryIntoDraft = useCallback(
    (entry: WorkshopHistoryEntry): boolean => {
      const normalized = normalizeWorkshopConfig(entry.config, DEFAULT_UPCOMING_WORKSHOP);
      setDraftConfig(normalized);
      setErrorMsg(null);
      setFeedbackMsg(
        `Loaded Version #${entry.versionNumber} into your unsaved Draft editor. Review changes and Save Draft or Publish when ready.`
      );
      return true;
    },
    []
  );

  const rollbackToVersion = useCallback(
    async (entry: WorkshopHistoryEntry, reason?: string): Promise<boolean> => {
      if (!isAdmin) return false;
      setBusyAction("rollback");
      setErrorMsg(null);
      setFeedbackMsg(null);

      try {
        const nowIso = new Date().toISOString();
        const targetConfig = normalizeWorkshopConfig(entry.config, DEFAULT_UPCOMING_WORKSHOP);
        const highestHistory = historyEntries.reduce(
          (maxVal, item) => Math.max(maxVal, item.versionNumber),
          0
        );
        const nextVersion = Math.max(liveVersion, highestHistory) + 1;
        const versionId = formatVersionId(nextVersion);
        const rollbackNote =
          (reason && reason.trim()) ||
          `Rolled back live website from Version #${liveVersion} to Version #${entry.versionNumber}.`;
        const diffsFromPrev = computeWorkshopConfigDiff(liveConfig, targetConfig);

        const nextLiveDoc: StoredLiveDoc = {
          config: targetConfig,
          versionNumber: nextVersion,
          updatedAt: nowIso,
          updatedByUid: actorInfo.uid,
          updatedByEmail: actorInfo.email,
          updatedByName: actorInfo.name,
          changeSummary: rollbackNote,
        };

        const nextDraftDoc: StoredDraftDoc = {
          config: targetConfig,
          baseVersion: nextVersion,
          updatedAt: nowIso,
          updatedByUid: actorInfo.uid,
          updatedByEmail: actorInfo.email,
          updatedByName: actorInfo.name,
        };

        const rollbackHistoryEntry: WorkshopHistoryEntry = {
          versionId,
          versionNumber: nextVersion,
          actionType: "rollback",
          createdAt: nowIso,
          createdByUid: actorInfo.uid,
          createdByEmail: actorInfo.email,
          createdByName: actorInfo.name,
          changeSummary: rollbackNote,
          rolledBackFromVersion: entry.versionNumber,
          config: targetConfig,
          diffsFromPrevious: diffsFromPrev,
        };

        if (isCloudBacked) {
          const batch = writeBatch(db);
          batch.set(doc(db, "site_config", "workshop_live"), nextLiveDoc);
          batch.set(doc(db, "site_config", "workshop_draft"), nextDraftDoc);
          batch.set(doc(db, "site_config_history", versionId), rollbackHistoryEntry);
          await batch.commit();
        } else {
          writeLocalJson(MOCK_WORKSHOP_LIVE_KEY, nextLiveDoc);
          writeLocalJson(MOCK_WORKSHOP_DRAFT_KEY, nextDraftDoc);
          const currentHistory = readLocalJson<WorkshopHistoryEntry[]>(
            MOCK_WORKSHOP_HISTORY_KEY,
            []
          );
          writeLocalJson(MOCK_WORKSHOP_HISTORY_KEY, [rollbackHistoryEntry, ...currentHistory]);
        }

        setLiveConfig(targetConfig);
        setLiveVersion(nextVersion);
        setLiveUpdatedAt(nowIso);
        setLiveUpdatedBy(actorInfo.name || actorInfo.email);
        setSavedDraftConfig(targetConfig);
        setDraftConfig(targetConfig);
        setDraftUpdatedAt(nowIso);
        setDraftUpdatedBy(actorInfo.name || actorInfo.email);
        setHistoryEntries((prev) => [rollbackHistoryEntry, ...prev]);
        broadcastWorkshopUpdate();
        setFeedbackMsg(
          `Instant Rollback complete: Live Version #${nextVersion} restored from Version #${entry.versionNumber}.`
        );
        return true;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to roll back live version.");
        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [
      actorInfo.email,
      actorInfo.name,
      actorInfo.uid,
      historyEntries,
      isAdmin,
      isCloudBacked,
      liveConfig,
      liveVersion,
    ]
  );

  const prepareNextCycleInDraft = useCallback(() => {
    const templated = buildNextBiennialCycleTemplate(draftConfig);
    setDraftConfig(templated);
    setErrorMsg(null);
    setFeedbackMsg(
      `Next Biennial Cycle template (${templated.workshop_ordinal} · ${templated.workshop_year}) loaded into Draft. Review dates, venue, and deadlines, then Save Draft or share a Board Preview link.`
    );
  }, [draftConfig]);

  const downloadJsonBackup = useCallback(() => {
    if (typeof window === "undefined") return;
    const payload = {
      exportedAt: new Date().toISOString(),
      liveVersion,
      config: draftConfig,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hems-workshop-config-${draftConfig.workshop_year || "draft"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [draftConfig, liveVersion]);

  const downloadCsvBackup = useCallback(() => {
    if (typeof window === "undefined") return;
    const csvText = configToCsvString(draftConfig);
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hems-workshop-config-${draftConfig.workshop_year || "draft"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [draftConfig]);

  const importJsonBackup = useCallback(
    async (file: File): Promise<boolean> => {
      setErrorMsg(null);
      setFeedbackMsg(null);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as
          | { config?: Partial<UpcomingWorkshopConfig> }
          | Partial<UpcomingWorkshopConfig>;
        const rawConfig =
          parsed && typeof parsed === "object" && "config" in parsed && parsed.config
            ? parsed.config
            : (parsed as Partial<UpcomingWorkshopConfig>);

        if (!rawConfig || typeof rawConfig !== "object" || !("workshop_year" in rawConfig)) {
          setErrorMsg(
            "The uploaded JSON file does not look like a HEMS Workshop Configuration backup."
          );
          return false;
        }

        const normalized = normalizeWorkshopConfig(rawConfig, draftConfig);
        setDraftConfig(normalized);
        setFeedbackMsg(
          `Imported "${file.name}" into your Draft editor. Review the changes and click Save Draft to stage them.`
        );
        return true;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Could not read JSON backup file.");
        return false;
      }
    },
    [draftConfig]
  );

  return {
    user,
    authLoading,
    isAdmin,
    isCloudBacked,
    loading,
    busyAction,
    feedbackMsg,
    errorMsg,
    clearMessages,
    reloadAll,
    liveConfig,
    liveVersion,
    liveUpdatedAt,
    liveUpdatedBy,
    savedDraftConfig,
    draftConfig,
    draftUpdatedAt,
    draftUpdatedBy,
    dirtyDiffs,
    diffsVsLive,
    hasUnsavedChanges,
    hasUnpublishedChanges,
    validationIssues,
    hasBlockingErrors,
    allPreviews,
    activePreviews,
    historyEntries,
    updateDraftField,
    updateDraftFields,
    saveDraft,
    resetDraftToLive,
    publishDraftToLive,
    createPreviewLink,
    revokePreviewLink,
    loadHistoryIntoDraft,
    rollbackToVersion,
    prepareNextCycleInDraft,
    downloadJsonBackup,
    downloadCsvBackup,
    importJsonBackup,
  };
}
