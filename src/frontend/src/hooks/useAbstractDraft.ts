"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import {
  AbstractDraftFormValues,
  AbstractDraftRecord,
  AffiliationEntry,
  AuthorEntry,
  clampFigureWidthInches,
  DraftGraphicMetaSnapshot,
  PRESENTATION_FORMAT_OPTIONS,
  RESEARCH_TRACK_OPTIONS,
} from "@/types/abstractSubmission";

const DRAFT_STORAGE_PREFIX = "hems_abstract_draft_v1:";
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

export interface RestoredDraftBannerInfo {
  savedAt: string;
  stage: number;
  source: "local" | "cloud";
  missingCrossDeviceGraphicName?: string;
}

export interface HydratedDraftPayload {
  record: AbstractDraftRecord;
  restoredGraphicFile: File | null;
  restoredGraphicPreviewUrl: string;
  source: "local" | "cloud";
  missingCrossDeviceGraphicName?: string;
}

function draftGraphicBlobKey(draftKey: string): string {
  return `draft_graphic:${draftKey}`;
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

function sanitizeDraftFormValues(
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

  return {
    currentStage: safeStage,
    title: values.title ?? "",
    correspondingEmail: values.correspondingEmail ?? "",
    secondaryEmail: values.secondaryEmail ?? "",
    presentationFormat: safeFormat,
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
    draftKey: string;
    uid: string;
    userEmail: string;
    workshopYear: number;
    updatedAt: string;
  }
): AbstractDraftRecord {
  return {
    ...sanitizeDraftFormValues(values),
    draftKey: meta.draftKey,
    uid: meta.uid,
    userEmail: meta.userEmail,
    workshopYear: meta.workshopYear,
    updatedAt: meta.updatedAt,
  };
}

function parseDraftRecord(
  raw: unknown,
  fallbackMeta: { draftKey: string; uid: string; userEmail: string; workshopYear: number }
): AbstractDraftRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<AbstractDraftRecord>;
  if (typeof candidate.updatedAt !== "string") return null;
  const sanitized = sanitizeDraftFormValues({
    currentStage: candidate.currentStage ?? 1,
    title: candidate.title ?? "",
    correspondingEmail: candidate.correspondingEmail ?? "",
    secondaryEmail: candidate.secondaryEmail ?? "",
    presentationFormat: candidate.presentationFormat ?? "Oral Presentation",
    studentTravelAwardApplicant: Boolean(candidate.studentTravelAwardApplicant),
    affiliations: candidate.affiliations ?? [],
    authors: candidate.authors ?? [],
    researchTrack: candidate.researchTrack ?? "Miniature & Ruggedized Hardware / Vacuum",
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
    draftKey: candidate.draftKey || fallbackMeta.draftKey,
    uid: candidate.uid || fallbackMeta.uid,
    userEmail: candidate.userEmail || fallbackMeta.userEmail,
    workshopYear: Number(candidate.workshopYear) || fallbackMeta.workshopYear,
    updatedAt: candidate.updatedAt,
  };
}

function readLocalDraft(
  draftKey: string,
  meta: { uid: string; userEmail: string; workshopYear: number }
): AbstractDraftRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${draftKey}`);
    if (!raw) return null;
    return parseDraftRecord(JSON.parse(raw), { draftKey, ...meta });
  } catch (err) {
    console.warn("Unable to read local abstract draft:", err);
    return null;
  }
}

function writeLocalDraft(draftKey: string, record: AbstractDraftRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${DRAFT_STORAGE_PREFIX}${draftKey}`,
      JSON.stringify(record)
    );
  } catch (err) {
    console.warn("Unable to persist local abstract draft:", err);
  }
}

function removeLocalDraft(draftKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${draftKey}`);
  } catch (err) {
    console.warn("Unable to remove local abstract draft:", err);
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
  onHydrate: (payload: HydratedDraftPayload) => void;
}) {
  const {
    uid,
    userEmail,
    workshopYear,
    enabled,
    values,
    graphicFile,
    suppressSaving,
    onHydrate,
  } = params;

  const draftKey = useMemo(() => {
    if (!enabled || !uid) return "";
    const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${safeUid}_${workshopYear}`;
  }, [enabled, uid, workshopYear]);

  const [draftStatus, setDraftStatus] = useState<DraftStatusInfo>({
    state: "idle",
    savedAt: null,
  });
  const [restoredBanner, setRestoredBanner] =
    useState<RestoredDraftBannerInfo | null>(null);

  const hydratedKeyRef = useRef<string>("");
  const hydratingTickRef = useRef<boolean>(false);
  const lastHydratedHashRef = useRef<string>("");
  const userEditedAfterMountRef = useRef<boolean>(false);
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

  // Clear pending timers helper
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

  // Reconstruct local File + preview URL from IndexedDB when available
  const restoreGraphicAssetFromIdb = useCallback(
    async (
      targetDraftKey: string,
      expectedMeta: DraftGraphicMetaSnapshot | null
    ): Promise<{
      file: File | null;
      previewUrl: string;
      missingName?: string;
    }> => {
      if (!expectedMeta) {
        return { file: null, previewUrl: "" };
      }
      const blob = await getDraftBlob(draftGraphicBlobKey(targetDraftKey));
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

  // Hydration Effect (Local immediate + max 1 Firestore getDoc check for newer cross-device draft)
  useEffect(() => {
    if (!draftKey || !uid) {
      hydratedKeyRef.current = "";
      return;
    }
    if (hydratedKeyRef.current === draftKey) return;

    let cancelled = false;
    lastHydratedHashRef.current = "";
    userEditedAfterMountRef.current = false;
    pendingLocalFlushRef.current = false;
    lastCloudHashRef.current = "";

    const fallbackMeta = {
      uid,
      userEmail: userEmail || "",
      workshopYear,
    };

    const runHydration = async () => {
      const localRecord = readLocalDraft(draftKey, fallbackMeta);
      let appliedLocalTime = 0;

      if (localRecord && hasMeaningfulDraftContent(localRecord)) {
        appliedLocalTime = Date.parse(localRecord.updatedAt) || 0;
        const asset = await restoreGraphicAssetFromIdb(
          draftKey,
          localRecord.graphicMeta
        );
        if (cancelled) {
          if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
          return;
        }
        const hydratedRecord: AbstractDraftRecord = asset.missingName
          ? { ...localRecord, graphicMeta: null }
          : localRecord;

        lastHydratedHashRef.current = computeDraftHash(hydratedRecord);
        hydratingTickRef.current = true;
        onHydrate({
          record: hydratedRecord,
          restoredGraphicFile: asset.file,
          restoredGraphicPreviewUrl: asset.previewUrl,
          source: "local",
          missingCrossDeviceGraphicName: asset.missingName,
        });
        prevStageRef.current = hydratedRecord.currentStage;
        setDraftStatus({
          state: "saved_local",
          savedAt: localRecord.updatedAt,
        });
        setRestoredBanner({
          savedAt: localRecord.updatedAt,
          stage: hydratedRecord.currentStage,
          source: "local",
          missingCrossDeviceGraphicName: asset.missingName,
        });
        window.setTimeout(() => {
          hydratingTickRef.current = false;
        }, 0);
      }

      hydratedKeyRef.current = draftKey;

      if (!hasFirebaseKeys || !db) return;

      try {
        const snap = await getDoc(
          doc(db, FIRESTORE_DRAFTS_COLLECTION, draftKey)
        );
        if (cancelled || !snap.exists() || userEditedAfterMountRef.current) {
          return;
        }
        const cloudRecord = parseDraftRecord(snap.data(), {
          draftKey,
          ...fallbackMeta,
        });
        if (!cloudRecord || !hasMeaningfulDraftContent(cloudRecord)) {
          return;
        }

        const cloudTime = Date.parse(cloudRecord.updatedAt) || 0;
        if (cloudTime > appliedLocalTime + 1000) {
          const asset = await restoreGraphicAssetFromIdb(
            draftKey,
            cloudRecord.graphicMeta
          );
          if (cancelled || userEditedAfterMountRef.current) {
            if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
            return;
          }
          const hydratedRecord: AbstractDraftRecord = asset.missingName
            ? { ...cloudRecord, graphicMeta: null }
            : cloudRecord;

          lastHydratedHashRef.current = computeDraftHash(hydratedRecord);
          hydratingTickRef.current = true;
          writeLocalDraft(draftKey, hydratedRecord);
          lastCloudHashRef.current = computeDraftHash(cloudRecord);
          onHydrate({
            record: hydratedRecord,
            restoredGraphicFile: asset.file,
            restoredGraphicPreviewUrl: asset.previewUrl,
            source: "cloud",
            missingCrossDeviceGraphicName: asset.missingName,
          });
          prevStageRef.current = hydratedRecord.currentStage;
          setDraftStatus({
            state: "synced_cloud",
            savedAt: cloudRecord.updatedAt,
          });
          setRestoredBanner({
            savedAt: cloudRecord.updatedAt,
            stage: hydratedRecord.currentStage,
            source: "cloud",
            missingCrossDeviceGraphicName: asset.missingName,
          });
          window.setTimeout(() => {
            hydratingTickRef.current = false;
          }, 0);
        } else if (
          localRecord &&
          Math.abs(cloudTime - appliedLocalTime) <= 1000
        ) {
          lastCloudHashRef.current = computeDraftHash(localRecord);
          setDraftStatus({
            state: "synced_cloud",
            savedAt: localRecord.updatedAt,
          });
        }
      } catch (err) {
        console.warn("Firestore abstract draft check skipped/blocked:", err);
      }
    };

    void runHydration();

    return () => {
      cancelled = true;
    };
  }, [draftKey, uid, userEmail, workshopYear, onHydrate, restoreGraphicAssetFromIdb]);

  // Graphic Blob Sync in IndexedDB
  useEffect(() => {
    if (!draftKey || hydratedKeyRef.current !== draftKey || suppressSaving) {
      return;
    }
    if (hydratingTickRef.current) return;

    if (graphicFile) {
      void putDraftBlob(draftGraphicBlobKey(draftKey), graphicFile);
    } else if (latestValuesRef.current.graphicMeta === null) {
      void deleteDraftBlob(draftGraphicBlobKey(draftKey));
    }
  }, [draftKey, graphicFile, suppressSaving]);

  // Tier 2: Throttled Firestore Cloud Sync
  const syncToCloud = useCallback(
    async (valuesToSync: AbstractDraftFormValues, forceLocalTimestamp = false) => {
      if (!draftKey || !uid || suppressSaving) return;
      if (!hasMeaningfulDraftContent(valuesToSync)) return;

      const hash = computeDraftHash(valuesToSync);
      const nowIso = new Date().toISOString();
      const record = buildDraftRecord(valuesToSync, {
        draftKey,
        uid,
        userEmail: userEmail || "",
        workshopYear,
        updatedAt: nowIso,
      });

      writeLocalDraft(draftKey, record);
      pendingLocalFlushRef.current = false;

      if (latestGraphicFileRef.current) {
        void putDraftBlob(
          draftGraphicBlobKey(draftKey),
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
        await setDoc(doc(db, FIRESTORE_DRAFTS_COLLECTION, draftKey), record);
        lastCloudHashRef.current = hash;
        setDraftStatus({ state: "synced_cloud", savedAt: record.updatedAt });
      } catch (err) {
        console.warn("Firestore abstract draft sync skipped/blocked; retained locally:", err);
        setDraftStatus({ state: "saved_local", savedAt: record.updatedAt });
      }
    },
    [draftKey, uid, userEmail, workshopYear, suppressSaving]
  );

  // Tier 1: Debounced Local Autosave (400 ms) + Tier 2 Idle Cloud Sync (45 s)
  useEffect(() => {
    if (
      !draftKey ||
      !uid ||
      hydratedKeyRef.current !== draftKey ||
      hydratingTickRef.current ||
      suppressSaving
    ) {
      return;
    }

    if (lastHydratedHashRef.current && contentHash === lastHydratedHashRef.current) {
      return;
    }
    lastHydratedHashRef.current = "";

    userEditedAfterMountRef.current = true;

    if (!hasDraftContent) {
      clearTimers();
      pendingLocalFlushRef.current = false;
      removeLocalDraft(draftKey);
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
      const currentSnapshot = latestValuesRef.current;
      const record = buildDraftRecord(currentSnapshot, {
        draftKey,
        uid,
        userEmail: userEmail || "",
        workshopYear,
        updatedAt: nowIso,
      });
      writeLocalDraft(draftKey, record);
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
        void syncToCloud(latestValuesRef.current);
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
    draftKey,
    uid,
    userEmail,
    workshopYear,
    contentHash,
    hasDraftContent,
    suppressSaving,
    clearTimers,
    syncToCloud,
  ]);

  // Trigger Cloud Sync immediately on Stage Change (Next / Back / Stepper Jump)
  useEffect(() => {
    if (
      !draftKey ||
      hydratedKeyRef.current !== draftKey ||
      hydratingTickRef.current ||
      suppressSaving
    ) {
      prevStageRef.current = values.currentStage;
      return;
    }

    if (values.currentStage !== prevStageRef.current) {
      prevStageRef.current = values.currentStage;
      if (hasMeaningfulDraftContent(latestValuesRef.current)) {
        void syncToCloud(latestValuesRef.current);
      }
    }
  }, [draftKey, values.currentStage, suppressSaving, syncToCloud]);

  // Synchronous localStorage flush on tab close / hide if a 400 ms save is pending
  useEffect(() => {
    if (typeof window === "undefined" || !draftKey || !uid) return;

    const flushSync = () => {
      if (suppressSaving || !pendingLocalFlushRef.current) return;
      if (!hasMeaningfulDraftContent(latestValuesRef.current)) return;
      const record = buildDraftRecord(latestValuesRef.current, {
        draftKey,
        uid,
        userEmail: userEmail || "",
        workshopYear,
        updatedAt: new Date().toISOString(),
      });
      writeLocalDraft(draftKey, record);
      pendingLocalFlushRef.current = false;
    };

    window.addEventListener("beforeunload", flushSync);
    window.addEventListener("pagehide", flushSync);
    return () => {
      window.removeEventListener("beforeunload", flushSync);
      window.removeEventListener("pagehide", flushSync);
    };
  }, [draftKey, uid, userEmail, workshopYear, suppressSaving]);

  const saveDraftNow = useCallback(async () => {
    clearTimers();
    await syncToCloud(latestValuesRef.current, true);
  }, [clearTimers, syncToCloud]);

  const clearDraftStorage = useCallback(async () => {
    clearTimers();
    lastHydratedHashRef.current = "";
    pendingLocalFlushRef.current = false;
    lastCloudHashRef.current = "";
    setRestoredBanner(null);
    setDraftStatus({ state: "idle", savedAt: null });

    if (!draftKey) return;
    removeLocalDraft(draftKey);
    await deleteDraftBlob(draftGraphicBlobKey(draftKey));

    if (hasFirebaseKeys && db) {
      try {
        await deleteDoc(doc(db, FIRESTORE_DRAFTS_COLLECTION, draftKey));
      } catch (err) {
        console.warn("Firestore abstract draft deletion skipped/blocked:", err);
      }
    }
  }, [clearTimers, draftKey]);

  const dismissRestoredBanner = useCallback(() => {
    setRestoredBanner(null);
  }, []);

  return {
    hasDraftContent,
    draftStatus,
    restoredBanner,
    dismissRestoredBanner,
    saveDraftNow,
    clearDraftStorage,
  };
}
