"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import {
  AbstractDraftFormValues,
  AbstractDraftRecord,
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
  clampFigureWidthInches,
  DEFAULT_FIGURE_WIDTH_IN,
  DraftGraphicMetaSnapshot,
  PRESENTATION_FORMAT_OPTIONS,
  PRESENTER_CATEGORY_OPTIONS,
  PresenterCategory,
  RESEARCH_TRACK_OPTIONS,
} from "@/types/abstractSubmission";
import { stripUndefinedDeep } from "@/utils/abstractSubmissionIntegrity";

const LEGACY_DRAFT_STORAGE_PREFIX = "hems_abstract_draft_v1:";
const DRAFTS_LIST_STORAGE_PREFIX = "hems_abstract_drafts_v2:";
const FIRESTORE_DRAFTS_COLLECTION = "abstract_drafts";
const IDB_NAME = "hems_abstract_files_idb";
const IDB_VERSION = 1;
const IDB_STORE = "abstract_pdfs";
const LOCAL_DEBOUNCE_MS = 400;
const CLOUD_IDLE_MS = 45_000;

export type DraftSaveState = "idle" | "saving" | "saved_local" | "synced_cloud";

export interface DraftStatusInfo {
  state: DraftSaveState;
  savedAt: string | null;
}

export interface HydratedDraftPayload {
  record: AbstractDraftRecord;
  restoredGraphicFile: File | null;
  restoredGraphicPreviewUrl: string;
  missingCrossDeviceGraphicName?: string;
}

function draftGraphicBlobKey(draftId: string): string {
  return `draft_graphic:${draftId}`;
}

function generateDraftId(scopeKey: string): string {
  return `${scopeKey}_drf_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function openBlobDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable in this environment."));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IDB_STORE)) {
        database.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Failed to open IndexedDB."));
  });
}

async function putDraftBlob(key: string, file: Blob): Promise<boolean> {
  try {
    const database = await openBlobDatabase();
    return await new Promise<boolean>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(file, key);
      tx.oncomplete = () => {
        database.close();
        resolve(true);
      };
      tx.onerror = () => {
        database.close();
        resolve(false);
      };
    });
  } catch (err) {
    console.warn("Unable to cache draft graphic in IndexedDB:", err);
    return false;
  }
}

async function getDraftBlob(key: string): Promise<Blob | null> {
  try {
    const database = await openBlobDatabase();
    return await new Promise<Blob | null>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => {
        database.close();
        resolve(req.result instanceof Blob ? req.result : null);
      };
      req.onerror = () => {
        database.close();
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("Unable to read draft graphic from IndexedDB:", err);
    return null;
  }
}

async function deleteDraftBlob(key: string): Promise<void> {
  try {
    const database = await openBlobDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => {
        database.close();
        resolve();
      };
      tx.onerror = () => {
        database.close();
        resolve();
      };
    });
  } catch (err) {
    console.warn("Unable to delete draft graphic from IndexedDB:", err);
  }
}

function normalizeGraphicMeta(
  raw: DraftGraphicMetaSnapshot | null | undefined
): DraftGraphicMetaSnapshot | null {
  if (!raw || typeof raw.fileName !== "string") return null;
  return {
    fileName: raw.fileName,
    fileSizeBytes: Number(raw.fileSizeBytes) || 0,
    mimeType: raw.mimeType || "image/png",
    widthPx: Number(raw.widthPx) || 0,
    heightPx: Number(raw.heightPx) || 0,
    detectedDpi: Number(raw.detectedDpi) || 300,
    dpiSource:
      raw.dpiSource === "metadata" ||
      raw.dpiSource === "effective" ||
      raw.dpiSource === "vector"
        ? raw.dpiSource
        : "effective",
  };
}

function normalizeAffiliations(
  raw: AffiliationEntry[] | undefined
): AffiliationEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ id: "aff-1", institution: "", location: "" }];
  }
  return raw.map((item, idx) => ({
    id: item?.id || `aff-${idx + 1}`,
    institution: item?.institution ?? "",
    location: item?.location ?? "",
  }));
}

function normalizeAuthors(raw: AuthorEntry[] | undefined): AuthorEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ id: "auth-1", name: "", affiliationId: "aff-1", isPresenter: true }];
  }
  const normalized = raw.map((item, idx) => ({
    id: item?.id || `auth-${idx + 1}`,
    name: item?.name ?? "",
    affiliationId: item?.affiliationId || "aff-1",
    isPresenter: Boolean(item?.isPresenter),
  }));
  if (!normalized.some((a) => a.isPresenter)) {
    normalized[0] = { ...normalized[0], isPresenter: true };
  }
  return normalized;
}

const VALID_PRESENTER_CATEGORIES = new Set<PresenterCategory>(
  PRESENTER_CATEGORY_OPTIONS.map((o) => o.value)
);

export function sanitizeDraftFormValues(
  values: AbstractDraftFormValues
): AbstractDraftFormValues {
  const safeStage = Math.min(
    7,
    Math.max(1, Math.round(Number(values.currentStage) || 1))
  );
  const safeFormat = PRESENTATION_FORMAT_OPTIONS.includes(values.presentationFormat)
    ? values.presentationFormat
    : "Oral Presentation";
  const safeTrack = RESEARCH_TRACK_OPTIONS.includes(values.researchTrack)
    ? values.researchTrack
    : "Miniature & Ruggedized Hardware / Vacuum";
  const safeCategory: PresenterCategory = VALID_PRESENTER_CATEGORIES.has(
    values.presenterCategory
  )
    ? values.presenterCategory
    : values.studentTravelAwardApplicant
    ? "student"
    : "academic";

  return {
    currentStage: safeStage,
    title: values.title ?? "",
    correspondingEmail: values.correspondingEmail ?? "",
    secondaryEmail: values.secondaryEmail ?? "",
    presentationFormat: safeFormat,
    presenterCategory: safeCategory,
    studentTravelAwardApplicant: Boolean(values.studentTravelAwardApplicant),
    affiliations: normalizeAffiliations(values.affiliations),
    authors: normalizeAuthors(values.authors),
    researchTrack: safeTrack,
    summary: values.summary ?? "",
    abstractText: values.abstractText ?? "",
    figureWidthInches: clampFigureWidthInches(values.figureWidthInches),
    graphicCaption: values.graphicCaption ?? "",
    figurePanelHidden: Boolean(values.figurePanelHidden),
    graphicMeta: normalizeGraphicMeta(values.graphicMeta),
    keywords: values.keywords ?? "",
    presenterBio: values.presenterBio ?? "",
  };
}

export function hasMeaningfulDraftContent(values: AbstractDraftFormValues): boolean {
  const hasAffData = values.affiliations.some(
    (a) => a.institution.trim().length > 0 || (a.location || "").trim().length > 0
  );
  return Boolean(
    values.currentStage > 1 ||
      values.title.trim() ||
      values.secondaryEmail.trim() ||
      hasAffData ||
      values.authors.length > 1 ||
      values.summary.trim() ||
      values.abstractText.trim() ||
      values.graphicMeta !== null ||
      values.graphicCaption.trim() ||
      values.keywords.trim() ||
      values.presenterBio.trim() ||
      values.studentTravelAwardApplicant
  );
}

function computeDraftHash(values: AbstractDraftFormValues): string {
  return JSON.stringify(sanitizeDraftFormValues(values));
}

function buildDraftRecord(
  values: AbstractDraftFormValues,
  meta: {
    draftId: string;
    uid: string;
    userEmail: string;
    workshopYear: number;
    createdAt: string;
    updatedAt: string;
  }
): AbstractDraftRecord {
  return {
    ...sanitizeDraftFormValues(values),
    draftId: meta.draftId,
    draftKey: meta.draftId,
    uid: meta.uid,
    userEmail: meta.userEmail,
    workshopYear: meta.workshopYear,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
}

function parseDraftRecord(
  raw: unknown,
  fallbackMeta: {
    draftId: string;
    uid: string;
    userEmail: string;
    workshopYear: number;
  }
): AbstractDraftRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<AbstractDraftRecord>;
  if (typeof candidate.updatedAt !== "string") return null;

  const resolvedId =
    (typeof candidate.draftId === "string" && candidate.draftId.trim()) ||
    (typeof candidate.draftKey === "string" && candidate.draftKey.trim()) ||
    fallbackMeta.draftId;

  const sanitized = sanitizeDraftFormValues({
    currentStage: candidate.currentStage ?? 1,
    title: candidate.title ?? "",
    correspondingEmail: candidate.correspondingEmail ?? "",
    secondaryEmail: candidate.secondaryEmail ?? "",
    presentationFormat: candidate.presentationFormat ?? "Oral Presentation",
    presenterCategory:
      candidate.presenterCategory ??
      (candidate.studentTravelAwardApplicant ? "student" : "academic"),
    studentTravelAwardApplicant: Boolean(candidate.studentTravelAwardApplicant),
    affiliations: candidate.affiliations ?? [],
    authors: candidate.authors ?? [],
    researchTrack:
      candidate.researchTrack ?? "Miniature & Ruggedized Hardware / Vacuum",
    summary: candidate.summary ?? "",
    abstractText: candidate.abstractText ?? "",
    figureWidthInches: clampFigureWidthInches(candidate.figureWidthInches),
    graphicCaption: candidate.graphicCaption ?? "",
    figurePanelHidden: Boolean(candidate.figurePanelHidden),
    graphicMeta: candidate.graphicMeta ?? null,
    keywords: candidate.keywords ?? "",
    presenterBio: candidate.presenterBio ?? "",
  });

  return {
    ...sanitized,
    draftId: resolvedId,
    draftKey: resolvedId,
    uid: candidate.uid || fallbackMeta.uid,
    userEmail: candidate.userEmail || fallbackMeta.userEmail,
    workshopYear: Number(candidate.workshopYear) || fallbackMeta.workshopYear,
    createdAt:
      typeof candidate.createdAt === "string" && candidate.createdAt
        ? candidate.createdAt
        : candidate.updatedAt,
    updatedAt: candidate.updatedAt,
  };
}

function sortDraftsNewestFirst(items: AbstractDraftRecord[]): AbstractDraftRecord[] {
  return [...items].sort((a, b) => {
    const tA = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    const tB = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    return tB - tA;
  });
}

function mergeDraftLists(
  localItems: AbstractDraftRecord[],
  remoteItems: AbstractDraftRecord[]
): AbstractDraftRecord[] {
  const byId = new Map<string, AbstractDraftRecord>();
  for (const item of localItems) {
    if (item?.draftId && hasMeaningfulDraftContent(item)) {
      byId.set(item.draftId, item);
    }
  }
  for (const remote of remoteItems) {
    if (!remote?.draftId || !hasMeaningfulDraftContent(remote)) continue;
    const existing = byId.get(remote.draftId);
    if (!existing) {
      byId.set(remote.draftId, remote);
      continue;
    }
    const localTs = Date.parse(existing.updatedAt || "") || 0;
    const remoteTs = Date.parse(remote.updatedAt || "") || 0;
    if (remoteTs >= localTs) {
      byId.set(remote.draftId, remote);
    }
  }
  return sortDraftsNewestFirst(Array.from(byId.values()));
}

function readLocalDraftsWithMigration(
  scopeKey: string,
  meta: { uid: string; userEmail: string; workshopYear: number }
): AbstractDraftRecord[] {
  if (typeof window === "undefined" || !scopeKey) return [];
  const listKey = `${DRAFTS_LIST_STORAGE_PREFIX}${scopeKey}`;
  const legacyKey = `${LEGACY_DRAFT_STORAGE_PREFIX}${scopeKey}`;
  const items: AbstractDraftRecord[] = [];
  let migratedLegacy = false;

  try {
    const rawList = window.localStorage.getItem(listKey);
    if (rawList) {
      const parsedList = JSON.parse(rawList) as unknown;
      if (Array.isArray(parsedList)) {
        for (const entry of parsedList) {
          const parsed = parseDraftRecord(entry, {
            draftId: scopeKey,
            ...meta,
          });
          if (parsed && hasMeaningfulDraftContent(parsed)) {
            items.push(parsed);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Unable to read multi-draft list from localStorage:", err);
  }

  try {
    const rawLegacy = window.localStorage.getItem(legacyKey);
    if (rawLegacy) {
      const legacyRecord = parseDraftRecord(JSON.parse(rawLegacy), {
        draftId: scopeKey,
        ...meta,
      });
      if (
        legacyRecord &&
        hasMeaningfulDraftContent(legacyRecord) &&
        !items.some((d) => d.draftId === legacyRecord.draftId)
      ) {
        items.push(legacyRecord);
      }
      window.localStorage.removeItem(legacyKey);
      migratedLegacy = true;
    }
  } catch (err) {
    console.warn("Unable to migrate legacy abstract draft:", err);
  }

  const dedupedById = new Map<string, AbstractDraftRecord>();
  for (const item of items) {
    const prev = dedupedById.get(item.draftId);
    if (!prev) {
      dedupedById.set(item.draftId, item);
      continue;
    }
    migratedLegacy = true;
    const prevTs = Date.parse(prev.updatedAt || prev.createdAt || "") || 0;
    const nextTs = Date.parse(item.updatedAt || item.createdAt || "") || 0;
    if (nextTs >= prevTs) {
      dedupedById.set(item.draftId, item);
    }
  }

  const sorted = sortDraftsNewestFirst(Array.from(dedupedById.values()));
  if (migratedLegacy) {
    writeLocalDrafts(scopeKey, sorted);
  }
  return sorted;
}

function writeLocalDrafts(scopeKey: string, records: AbstractDraftRecord[]): void {
  if (typeof window === "undefined" || !scopeKey) return;
  try {
    window.localStorage.setItem(
      `${DRAFTS_LIST_STORAGE_PREFIX}${scopeKey}`,
      JSON.stringify(sortDraftsNewestFirst(records))
    );
  } catch (err) {
    console.warn("Unable to persist multi-draft list in localStorage:", err);
  }
}

export function useAbstractDraft(params: {
  uid: string | undefined;
  userEmail: string | undefined;
  workshopYear: number;
  enabled: boolean;
  values: AbstractDraftFormValues;
  graphicFile: File | null;
  suppressSaving: boolean;
}) {
  const {
    uid,
    userEmail,
    workshopYear,
    enabled,
    values,
    graphicFile,
    suppressSaving,
  } = params;

  const scopeKey = useMemo(() => {
    if (!enabled || !uid) return "";
    const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${safeUid}_${workshopYear}`;
  }, [enabled, uid, workshopYear]);

  const [drafts, setDrafts] = useState<AbstractDraftRecord[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState<boolean>(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatusInfo>({
    state: "idle",
    savedAt: null,
  });

  const draftsRef = useRef<AbstractDraftRecord[]>([]);
  draftsRef.current = drafts;

  const activeDraftIdRef = useRef<string | null>(null);
  activeDraftIdRef.current = activeDraftId;

  const activeCreatedAtRef = useRef<string>("");
  const loadedScopeRef = useRef<string>("");
  const hydratingTickRef = useRef<boolean>(false);
  const lastHydratedHashRef = useRef<string>("");
  const pendingLocalFlushRef = useRef<boolean>(false);
  const lastCloudHashRef = useRef<string>("");
  const prevStageRef = useRef<number>(values.currentStage);

  const latestValuesRef = useRef<AbstractDraftFormValues>(values);
  latestValuesRef.current = values;

  const latestGraphicFileRef = useRef<File | null>(graphicFile);
  latestGraphicFileRef.current = graphicFile;

  const localTimerRef = useRef<number | null>(null);
  const cloudTimerRef = useRef<number | null>(null);

  const contentHash = useMemo(() => computeDraftHash(values), [values]);
  const hasDraftContent = useMemo(
    () => hasMeaningfulDraftContent(values),
    [values]
  );

  const clearTimers = useCallback(() => {
    if (typeof window === "undefined") return;
    if (localTimerRef.current !== null) {
      window.clearTimeout(localTimerRef.current);
      localTimerRef.current = null;
    }
    if (cloudTimerRef.current !== null) {
      window.clearTimeout(cloudTimerRef.current);
      cloudTimerRef.current = null;
    }
  }, []);

  const restoreGraphicAssetFromIdb = useCallback(
    async (
      targetDraftId: string,
      expectedMeta: DraftGraphicMetaSnapshot | null
    ): Promise<{
      file: File | null;
      previewUrl: string;
      missingName?: string;
    }> => {
      if (!expectedMeta) {
        return { file: null, previewUrl: "" };
      }
      const blob = await getDraftBlob(draftGraphicBlobKey(targetDraftId));
      if (!blob) {
        return {
          file: null,
          previewUrl: "",
          missingName: expectedMeta.fileName,
        };
      }
      if (
        expectedMeta.fileSizeBytes > 0 &&
        blob.size !== expectedMeta.fileSizeBytes
      ) {
        return {
          file: null,
          previewUrl: "",
          missingName: expectedMeta.fileName,
        };
      }
      const restoredFile = new File([blob], expectedMeta.fileName, {
        type: expectedMeta.mimeType || blob.type || "image/png",
      });
      const previewUrl = URL.createObjectURL(restoredFile);
      return { file: restoredFile, previewUrl };
    },
    []
  );

  const upsertDraftInList = useCallback(
    (record: AbstractDraftRecord): AbstractDraftRecord[] => {
      if (!scopeKey) return draftsRef.current;
      const filtered = draftsRef.current.filter(
        (item) => item.draftId !== record.draftId
      );
      const next = sortDraftsNewestFirst([record, ...filtered]);
      draftsRef.current = next;
      writeLocalDrafts(scopeKey, next);
      setDrafts(next);
      return next;
    },
    [scopeKey]
  );

  const removeDraftFromList = useCallback(
    (draftId: string): AbstractDraftRecord[] => {
      if (!scopeKey) return draftsRef.current;
      const next = draftsRef.current.filter((item) => item.draftId !== draftId);
      draftsRef.current = next;
      writeLocalDrafts(scopeKey, next);
      setDrafts(next);
      return next;
    },
    [scopeKey]
  );

  // Load multi-draft list on mount / user / year change
  useEffect(() => {
    if (!scopeKey || !uid) {
      loadedScopeRef.current = "";
      setDrafts([]);
      setLoadingDrafts(false);
      return;
    }
    if (loadedScopeRef.current === scopeKey) return;

    let cancelled = false;
    const meta = {
      uid,
      userEmail: userEmail || "",
      workshopYear,
    };

    const loadDrafts = async () => {
      setLoadingDrafts(true);
      const localList = readLocalDraftsWithMigration(scopeKey, meta);
      if (!cancelled) {
        draftsRef.current = localList;
        setDrafts(localList);
      }

      if (!hasFirebaseKeys || !db) {
        loadedScopeRef.current = scopeKey;
        if (!cancelled) setLoadingDrafts(false);
        return;
      }

      try {
        const snap = await getDocs(
          query(collection(db, FIRESTORE_DRAFTS_COLLECTION), where("uid", "==", uid))
        );
        if (cancelled) return;

        const remoteList: AbstractDraftRecord[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const docYear = Number(data?.workshopYear) || workshopYear;
          if (docYear !== workshopYear) return;
          const parsed = parseDraftRecord(data, {
            draftId: docSnap.id,
            ...meta,
          });
          if (parsed && hasMeaningfulDraftContent(parsed)) {
            remoteList.push(parsed);
          }
        });

        const merged = mergeDraftLists(localList, remoteList);
        draftsRef.current = merged;
        writeLocalDrafts(scopeKey, merged);
        setDrafts(merged);
        loadedScopeRef.current = scopeKey;
      } catch (err) {
        console.warn("Firestore multi-draft fetch skipped/blocked:", err);
        loadedScopeRef.current = scopeKey;
      } finally {
        if (!cancelled) setLoadingDrafts(false);
      }
    };

    void loadDrafts();

    return () => {
      cancelled = true;
    };
  }, [scopeKey, uid, userEmail, workshopYear]);

  // Graphic Blob Sync in IndexedDB for active draft
  useEffect(() => {
    if (!activeDraftId || suppressSaving || hydratingTickRef.current) {
      return;
    }

    if (graphicFile) {
      void putDraftBlob(draftGraphicBlobKey(activeDraftId), graphicFile);
    } else if (latestValuesRef.current.graphicMeta === null) {
      void deleteDraftBlob(draftGraphicBlobKey(activeDraftId));
    }
  }, [activeDraftId, graphicFile, suppressSaving]);

  // Tier 2: Throttled Firestore Cloud Sync for active draft
  const syncToCloud = useCallback(
    async (
      valuesToSync: AbstractDraftFormValues,
      targetDraftId?: string,
      forceLocalTimestamp = false
    ) => {
      const idToSync = targetDraftId || activeDraftIdRef.current;
      if (!scopeKey || !idToSync || !uid || suppressSaving) return;
      if (!hasMeaningfulDraftContent(valuesToSync)) return;

      const hash = computeDraftHash(valuesToSync);
      const nowIso = new Date().toISOString();
      const createdAt = activeCreatedAtRef.current || nowIso;
      activeCreatedAtRef.current = createdAt;

      const record = buildDraftRecord(valuesToSync, {
        draftId: idToSync,
        uid,
        userEmail: userEmail || "",
        workshopYear,
        createdAt,
        updatedAt: nowIso,
      });

      upsertDraftInList(record);
      pendingLocalFlushRef.current = false;

      if (latestGraphicFileRef.current) {
        void putDraftBlob(
          draftGraphicBlobKey(idToSync),
          latestGraphicFileRef.current
        );
      }

      if (!hasFirebaseKeys || !db) {
        setDraftStatus({ state: "saved_local", savedAt: nowIso });
        return;
      }

      if (!forceLocalTimestamp && hash === lastCloudHashRef.current) {
        setDraftStatus({ state: "synced_cloud", savedAt: nowIso });
        return;
      }

      setDraftStatus((prev) => ({ ...prev, state: "saving" }));
      try {
        await setDoc(
          doc(db, FIRESTORE_DRAFTS_COLLECTION, idToSync),
          stripUndefinedDeep(record)
        );
        lastCloudHashRef.current = hash;
        setDraftStatus({ state: "synced_cloud", savedAt: record.updatedAt });
      } catch (err) {
        console.warn(
          "Firestore abstract draft sync skipped/blocked; retained locally:",
          err
        );
        setDraftStatus({ state: "saved_local", savedAt: record.updatedAt });
      }
    },
    [scopeKey, uid, userEmail, workshopYear, suppressSaving, upsertDraftInList]
  );

  // Tier 1: Debounced Local Autosave (400 ms) + Tier 2 Idle Cloud Sync (45 s)
  useEffect(() => {
    if (
      !scopeKey ||
      !activeDraftId ||
      !uid ||
      hydratingTickRef.current ||
      suppressSaving
    ) {
      return;
    }

    if (lastHydratedHashRef.current && contentHash === lastHydratedHashRef.current) {
      return;
    }
    lastHydratedHashRef.current = "";

    if (!hasDraftContent) {
      clearTimers();
      pendingLocalFlushRef.current = false;
      removeDraftFromList(activeDraftId);
      lastCloudHashRef.current = "";
      setDraftStatus({ state: "idle", savedAt: null });
      return;
    }

    pendingLocalFlushRef.current = true;
    setDraftStatus((prev) => ({ ...prev, state: "saving" }));

    if (localTimerRef.current !== null) {
      window.clearTimeout(localTimerRef.current);
    }
    localTimerRef.current = window.setTimeout(() => {
      const nowIso = new Date().toISOString();
      const createdAt = activeCreatedAtRef.current || nowIso;
      activeCreatedAtRef.current = createdAt;
      const currentSnapshot = latestValuesRef.current;
      const record = buildDraftRecord(currentSnapshot, {
        draftId: activeDraftId,
        uid,
        userEmail: userEmail || "",
        workshopYear,
        createdAt,
        updatedAt: nowIso,
      });
      upsertDraftInList(record);
      pendingLocalFlushRef.current = false;
      const currentHash = computeDraftHash(currentSnapshot);
      setDraftStatus({
        state:
          hasFirebaseKeys && db && lastCloudHashRef.current === currentHash
            ? "synced_cloud"
            : "saved_local",
        savedAt: nowIso,
      });
    }, LOCAL_DEBOUNCE_MS);

    if (cloudTimerRef.current !== null) {
      window.clearTimeout(cloudTimerRef.current);
    }
    if (hasFirebaseKeys && db && contentHash !== lastCloudHashRef.current) {
      cloudTimerRef.current = window.setTimeout(() => {
        void syncToCloud(latestValuesRef.current, activeDraftId);
      }, CLOUD_IDLE_MS);
    }

    return () => {
      if (localTimerRef.current !== null) {
        window.clearTimeout(localTimerRef.current);
      }
      if (cloudTimerRef.current !== null) {
        window.clearTimeout(cloudTimerRef.current);
      }
    };
  }, [
    scopeKey,
    activeDraftId,
    uid,
    userEmail,
    workshopYear,
    contentHash,
    hasDraftContent,
    suppressSaving,
    clearTimers,
    upsertDraftInList,
    removeDraftFromList,
    syncToCloud,
  ]);

  // Trigger Cloud Sync immediately on Stage Change (Next / Back / Stepper Jump)
  useEffect(() => {
    if (
      !activeDraftId ||
      hydratingTickRef.current ||
      suppressSaving
    ) {
      prevStageRef.current = values.currentStage;
      return;
    }

    if (values.currentStage !== prevStageRef.current) {
      prevStageRef.current = values.currentStage;
      if (hasMeaningfulDraftContent(latestValuesRef.current)) {
        void syncToCloud(latestValuesRef.current, activeDraftId);
      }
    }
  }, [activeDraftId, values.currentStage, suppressSaving, syncToCloud]);

  // Synchronous localStorage flush on tab close / hide if a 400 ms save is pending
  useEffect(() => {
    if (typeof window === "undefined" || !scopeKey || !activeDraftId || !uid) {
      return;
    }

    const flushSync = () => {
      if (suppressSaving || !pendingLocalFlushRef.current) return;
      if (!hasMeaningfulDraftContent(latestValuesRef.current)) return;
      const nowIso = new Date().toISOString();
      const createdAt = activeCreatedAtRef.current || nowIso;
      const record = buildDraftRecord(latestValuesRef.current, {
        draftId: activeDraftId,
        uid,
        userEmail: userEmail || "",
        workshopYear,
        createdAt,
        updatedAt: nowIso,
      });
      upsertDraftInList(record);
      pendingLocalFlushRef.current = false;
    };

    window.addEventListener("beforeunload", flushSync);
    window.addEventListener("pagehide", flushSync);
    return () => {
      window.removeEventListener("beforeunload", flushSync);
      window.removeEventListener("pagehide", flushSync);
    };
  }, [
    scopeKey,
    activeDraftId,
    uid,
    userEmail,
    workshopYear,
    suppressSaving,
    upsertDraftInList,
  ]);

  const startNewDraft = useCallback((): string => {
    clearTimers();
    const baseScope = scopeKey || `local_${workshopYear}`;
    const newId = generateDraftId(baseScope);
    hydratingTickRef.current = true;
    activeDraftIdRef.current = newId;
    activeCreatedAtRef.current = new Date().toISOString();
    lastHydratedHashRef.current = "";
    lastCloudHashRef.current = "";
    pendingLocalFlushRef.current = false;
    prevStageRef.current = 1;
    setActiveDraftId(newId);
    setDraftStatus({ state: "idle", savedAt: null });
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        hydratingTickRef.current = false;
      }, 0);
    } else {
      hydratingTickRef.current = false;
    }
    return newId;
  }, [clearTimers, scopeKey, workshopYear]);

  const openDraft = useCallback(
    async (draftId: string): Promise<HydratedDraftPayload | null> => {
      const target = draftsRef.current.find((d) => d.draftId === draftId);
      if (!target) return null;

      clearTimers();
      hydratingTickRef.current = true;

      const asset = await restoreGraphicAssetFromIdb(draftId, target.graphicMeta);
      const hydratedRecord: AbstractDraftRecord = asset.missingName
        ? { ...target, graphicMeta: null }
        : target;

      const hydratedHash = computeDraftHash(hydratedRecord);
      activeDraftIdRef.current = draftId;
      activeCreatedAtRef.current = hydratedRecord.createdAt;
      lastHydratedHashRef.current = hydratedHash;
      lastCloudHashRef.current = hydratedHash;
      pendingLocalFlushRef.current = false;
      prevStageRef.current = hydratedRecord.currentStage;
      setActiveDraftId(draftId);
      setDraftStatus({
        state: hasFirebaseKeys && db ? "synced_cloud" : "saved_local",
        savedAt: hydratedRecord.updatedAt,
      });

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          hydratingTickRef.current = false;
        }, 0);
      } else {
        hydratingTickRef.current = false;
      }

      return {
        record: hydratedRecord,
        restoredGraphicFile: asset.file,
        restoredGraphicPreviewUrl: asset.previewUrl,
        missingCrossDeviceGraphicName: asset.missingName,
      };
    },
    [clearTimers, restoreGraphicAssetFromIdb]
  );

  const duplicateDraft = useCallback(
    async (draftId: string): Promise<AbstractDraftRecord | null> => {
      if (!scopeKey || !uid) return null;
      const source = draftsRef.current.find((d) => d.draftId === draftId);
      if (!source) return null;

      const newId = generateDraftId(scopeKey);
      const nowIso = new Date().toISOString();
      const baseTitle = source.title.trim();
      const copyTitle = baseTitle
        ? baseTitle.startsWith("Copy of ")
          ? baseTitle
          : `Copy of ${baseTitle}`
        : "Untitled Draft (Copy)";

      let copiedGraphicMeta: DraftGraphicMetaSnapshot | null = null;
      if (source.graphicMeta) {
        const blob = await getDraftBlob(draftGraphicBlobKey(source.draftId));
        if (blob) {
          const ok = await putDraftBlob(draftGraphicBlobKey(newId), blob);
          if (ok) copiedGraphicMeta = source.graphicMeta;
        }
      }

      const cloned = buildDraftRecord(
        {
          ...source,
          title: copyTitle,
          graphicMeta: copiedGraphicMeta,
          graphicCaption: copiedGraphicMeta ? source.graphicCaption : "",
        },
        {
          draftId: newId,
          uid,
          userEmail: userEmail || source.userEmail || "",
          workshopYear,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
      );

      upsertDraftInList(cloned);
      if (hasFirebaseKeys && db) {
        try {
          await setDoc(
            doc(db, FIRESTORE_DRAFTS_COLLECTION, newId),
            stripUndefinedDeep(cloned)
          );
        } catch (err) {
          console.warn(
            "Firestore duplicate draft sync skipped/blocked; saved locally:",
            err
          );
        }
      }
      return cloned;
    },
    [scopeKey, uid, userEmail, workshopYear, upsertDraftInList]
  );

  const createDraftFromSubmission = useCallback(
    async (
      sub: AbstractSubmissionRecord,
      graphicFileToCopy: File | null
    ): Promise<AbstractDraftRecord | null> => {
      if (!scopeKey || !uid) return null;

      const newId = generateDraftId(scopeKey);
      const nowIso = new Date().toISOString();

      const copiedAffiliations: AffiliationEntry[] =
        sub.affiliations && sub.affiliations.length > 0
          ? sub.affiliations.map((a) => ({ ...a }))
          : [{ id: "aff-1", institution: sub.affiliation || "", location: "" }];

      const copiedAuthors: AuthorEntry[] =
        sub.authors && sub.authors.length > 0
          ? sub.authors.map((a) => ({ ...a }))
          : [
              {
                id: "auth-1",
                name: sub.presentingAuthor || "",
                affiliationId: copiedAffiliations[0]?.id || "aff-1",
                isPresenter: true,
              },
            ];

      let copiedGraphicMeta: DraftGraphicMetaSnapshot | null = null;
      if (graphicFileToCopy && sub.graphic) {
        const ok = await putDraftBlob(
          draftGraphicBlobKey(newId),
          graphicFileToCopy
        );
        if (ok) {
          copiedGraphicMeta = {
            fileName: sub.graphic.fileName || graphicFileToCopy.name,
            fileSizeBytes:
              sub.graphic.fileSizeBytes || graphicFileToCopy.size,
            mimeType:
              sub.graphic.mimeType ||
              graphicFileToCopy.type ||
              "image/png",
            widthPx: sub.graphic.widthPx || 0,
            heightPx: sub.graphic.heightPx || 0,
            detectedDpi: sub.graphic.detectedDpi || 300,
            dpiSource: sub.graphic.dpiSource || "effective",
          };
        }
      }

      const baseTitle = sub.title.trim();
      const copyTitle = baseTitle
        ? baseTitle.startsWith("Copy of ")
          ? baseTitle
          : `Copy of ${baseTitle}`
        : "Copied Abstract Draft";

      const cloned = buildDraftRecord(
        {
          currentStage: 1,
          title: copyTitle,
          correspondingEmail: sub.correspondingEmail || userEmail || "",
          secondaryEmail: sub.secondaryEmail || "",
          presentationFormat: sub.presentationFormat || "Oral Presentation",
          presenterCategory:
            sub.presenterCategory ??
            (sub.studentTravelAwardApplicant ? "student" : "academic"),
          studentTravelAwardApplicant: Boolean(sub.studentTravelAwardApplicant),
          affiliations: copiedAffiliations,
          authors: copiedAuthors,
          researchTrack:
            sub.researchTrack || "Miniature & Ruggedized Hardware / Vacuum",
          summary: sub.summary || "",
          abstractText: sub.abstractText || sub.summary || "",
          figureWidthInches: clampFigureWidthInches(
            sub.graphic?.widthInches ?? DEFAULT_FIGURE_WIDTH_IN
          ),
          graphicCaption: copiedGraphicMeta ? sub.graphic?.caption || "" : "",
          figurePanelHidden: false,
          graphicMeta: copiedGraphicMeta,
          keywords: sub.keywords || "",
          presenterBio: sub.presenterBio || "",
        },
        {
          draftId: newId,
          uid,
          userEmail: userEmail || "",
          workshopYear,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
      );

      upsertDraftInList(cloned);
      if (hasFirebaseKeys && db) {
        try {
          await setDoc(
            doc(db, FIRESTORE_DRAFTS_COLLECTION, newId),
            stripUndefinedDeep(cloned)
          );
        } catch (err) {
          console.warn(
            "Firestore submission-to-draft copy sync skipped/blocked; saved locally:",
            err
          );
        }
      }
      return cloned;
    },
    [scopeKey, uid, userEmail, workshopYear, upsertDraftInList]
  );

  const deleteDraftById = useCallback(
    async (draftId: string): Promise<void> => {
      if (activeDraftIdRef.current === draftId) {
        clearTimers();
        lastHydratedHashRef.current = "";
        pendingLocalFlushRef.current = false;
        lastCloudHashRef.current = "";
        activeDraftIdRef.current = null;
        activeCreatedAtRef.current = "";
        setActiveDraftId(null);
        setDraftStatus({ state: "idle", savedAt: null });
      }

      removeDraftFromList(draftId);
      await deleteDraftBlob(draftGraphicBlobKey(draftId));

      if (hasFirebaseKeys && db) {
        try {
          await deleteDoc(doc(db, FIRESTORE_DRAFTS_COLLECTION, draftId));
        } catch (err) {
          console.warn("Firestore abstract draft deletion skipped/blocked:", err);
        }
      }
    },
    [clearTimers, removeDraftFromList]
  );

  const closeActiveDraft = useCallback(async () => {
    const idToFlush = activeDraftIdRef.current;
    clearTimers();
    if (
      idToFlush &&
      uid &&
      !suppressSaving &&
      hasMeaningfulDraftContent(latestValuesRef.current)
    ) {
      const currentHash = computeDraftHash(latestValuesRef.current);
      if (pendingLocalFlushRef.current || currentHash !== lastCloudHashRef.current) {
        await syncToCloud(latestValuesRef.current, idToFlush);
      }
    }
    activeDraftIdRef.current = null;
    activeCreatedAtRef.current = "";
    lastHydratedHashRef.current = "";
    lastCloudHashRef.current = "";
    pendingLocalFlushRef.current = false;
    setActiveDraftId(null);
    setDraftStatus({ state: "idle", savedAt: null });
  }, [clearTimers, uid, suppressSaving, syncToCloud]);

  const saveDraftNow = useCallback(async () => {
    clearTimers();
    await syncToCloud(latestValuesRef.current, undefined, true);
  }, [clearTimers, syncToCloud]);

  return {
    drafts,
    loadingDrafts,
    activeDraftId,
    hasDraftContent,
    draftStatus,
    startNewDraft,
    openDraft,
    duplicateDraft,
    createDraftFromSubmission,
    deleteDraftById,
    closeActiveDraft,
    saveDraftNow,
  };
}
