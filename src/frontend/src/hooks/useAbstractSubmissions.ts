"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { db, hasFirebaseKeys, storage } from "@/utils/firebase";
import {
  hasBoardOrAdminRole,
  hasOperationsRole,
  hasReviewerRole,
} from "@/utils/telemetryClient";
import {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
  clampFigureWidthInches,
  CommitteeSelection,
  CreateAbstractSubmissionInput,
  GraphicMetadata,
  SaveAbstractReviewInput,
} from "@/types/abstractSubmission";
import {
  buildReviewId,
  resolveOfficialSelection,
  summarizeSubmissionReviews,
} from "@/utils/abstractReviewMetrics";
import {
  dedupeReviewsById,
  dedupeSubmissionsById,
  generateSubmissionId,
  INITIAL_SAMPLE_REVIEWS,
  INITIAL_SAMPLE_SUBMISSIONS,
  sortReviewsNewestFirst,
  sortSubmissionsNewestFirst,
  stripUndefinedDeep,
} from "@/utils/abstractSubmissionIntegrity";

const LEGACY_V1_STORAGE_KEY = "hems_abstract_submissions_v1";
const LEGACY_V2_STORAGE_KEY = "hems_abstract_submissions_v2";
const LEGACY_V3_STORAGE_KEY = "hems_abstract_submissions_v3";
const SUBMISSIONS_STORAGE_KEY = "hems_abstract_submissions_v4";
const SUBMISSIONS_SYNC_EVENT = "hems-abstracts-updated";
const REVIEWS_STORAGE_KEY = "hems_abstract_reviews_v1";
const REVIEWS_SYNC_EVENT = "hems-abstract-reviews-updated";
const REALTIME_CHANNEL_NAME = "hems_abstracts_realtime_v1";
const IDB_NAME = "hems_abstract_files_idb";
const IDB_VERSION = 1;
const IDB_STORE = "abstract_pdfs";

export interface SelectionConflictInfo {
  submissionId: string;
  attemptedSelection: CommitteeSelection;
  remoteRecord: AbstractSubmissionRecord;
}

export type UpdateSelectionResult =
  | { ok: true; record: AbstractSubmissionRecord }
  | { ok: false; conflict: SelectionConflictInfo };

export {
  dedupeReviewsById,
  dedupeSubmissionsById,
  generateSubmissionId,
  stripUndefinedDeep,
};

export interface SubmissionUploadAssets {
  graphicFile?: File | null;
  graphicMeta?: Omit<GraphicMetadata, "storageUrl" | "hasLocalBlob"> | null;
  pdfFile?: File | null;
}

function graphicBlobKey(submissionId: string): string {
  return `graphic:${submissionId}`;
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

async function putBlob(key: string, file: Blob): Promise<boolean> {
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
    console.warn("Unable to cache file blob in IndexedDB:", err);
    return false;
  }
}

async function getBlob(key: string): Promise<Blob | null> {
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
    console.warn("Unable to read file blob from IndexedDB:", err);
    return null;
  }
}

async function deleteBlob(key: string): Promise<void> {
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
    console.warn("Unable to delete file blob from IndexedDB:", err);
  }
}

function broadcastRealtimeUpdate(kind: "submissions" | "reviews"): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  try {
    const channel = new BroadcastChannel(REALTIME_CHANNEL_NAME);
    channel.postMessage({ kind, ts: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel unavailable or blocked in restricted context
  }
}

async function buildEmbeddedGraphicDataUrl(file: File): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const lowerName = (file.name || "").toLowerCase();
    const isSvg = file.type === "image/svg+xml" || lowerName.endsWith(".svg");
    if (isSvg) {
      if (file.size > 180_000) return undefined;
      const bytes = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const dataUrl = `data:image/svg+xml;base64,${window.btoa(bin)}`;
      return dataUrl.length <= 260_000 ? dataUrl : undefined;
    }

    if (typeof document === "undefined") return undefined;
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Image decode failed"));
        image.src = objectUrl;
      });
      const srcW = img.naturalWidth || img.width || 0;
      const srcH = img.naturalHeight || img.height || 0;
      if (srcW <= 0 || srcH <= 0) return undefined;

      const maxDim = 1400;
      const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
      const dstW = Math.max(1, Math.round(srcW * scale));
      const dstH = Math.max(1, Math.round(srcH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, dstW, dstH);
      ctx.drawImage(img, 0, 0, dstW, dstH);

      const webpUrl = canvas.toDataURL("image/webp", 0.82);
      if (webpUrl.startsWith("data:image/webp") && webpUrl.length <= 260_000) {
        return webpUrl;
      }
      const jpegUrl = canvas.toDataURL("image/jpeg", 0.85);
      return jpegUrl.length <= 260_000 ? jpegUrl : undefined;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return undefined;
  }
}

function readLegacyNonSeedSubmissions(): AbstractSubmissionRecord[] {
  const byId = new Map<string, AbstractSubmissionRecord>();
  for (const key of [
    LEGACY_V3_STORAGE_KEY,
    LEGACY_V2_STORAGE_KEY,
    LEGACY_V1_STORAGE_KEY,
  ]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed as AbstractSubmissionRecord[]) {
        if (item?.id && !item.isSampleSeed && !byId.has(item.id)) {
          byId.set(item.id, item);
        }
      }
    } catch {
      // Ignore malformed legacy storage entry
    }
  }
  return Array.from(byId.values());
}

function readLocalSubmissions(): AbstractSubmissionRecord[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_SUBMISSIONS;
  try {
    const raw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const { records, changed } = dedupeSubmissionsById(
          parsed as AbstractSubmissionRecord[],
          INITIAL_SAMPLE_SUBMISSIONS
        );
        if (changed) {
          window.localStorage.setItem(
            SUBMISSIONS_STORAGE_KEY,
            JSON.stringify(records)
          );
        }
        return records;
      }
    }

    const legacyUserItems = readLegacyNonSeedSubmissions();
    const { records: initialRecords } = dedupeSubmissionsById(
      [...legacyUserItems, ...INITIAL_SAMPLE_SUBMISSIONS],
      INITIAL_SAMPLE_SUBMISSIONS
    );

    window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(initialRecords));
    return initialRecords;
  } catch (err) {
    console.warn("Failed to parse local abstract submissions:", err);
    return INITIAL_SAMPLE_SUBMISSIONS;
  }
}

function writeLocalSubmissions(records: AbstractSubmissionRecord[], notifyPeers = true): void {
  if (typeof window === "undefined") return;
  try {
    const { records: clean } = dedupeSubmissionsById(records, INITIAL_SAMPLE_SUBMISSIONS);
    window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(SUBMISSIONS_SYNC_EVENT));
    if (notifyPeers) {
      broadcastRealtimeUpdate("submissions");
    }
  } catch (err) {
    console.warn("Failed to write abstract submissions to localStorage:", err);
  }
}

function mergeByIdNewestWins(
  localItems: AbstractSubmissionRecord[],
  remoteItems: AbstractSubmissionRecord[]
): AbstractSubmissionRecord[] {
  const { records: cleanLocal } = dedupeSubmissionsById(
    localItems,
    INITIAL_SAMPLE_SUBMISSIONS
  );
  const byId = new Map<string, AbstractSubmissionRecord>();
  for (const item of cleanLocal) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const remote of remoteItems) {
    if (!remote?.id) continue;
    const existing = byId.get(remote.id);
    if (!existing) {
      byId.set(remote.id, remote);
      continue;
    }
    const existingTs = Date.parse(existing.updatedAt || existing.submittedAt || "") || 0;
    const remoteTs = Date.parse(remote.updatedAt || remote.submittedAt || "") || 0;
    const existingSelVer = existing.selectionVersion ?? 0;
    const remoteSelVer = remote.selectionVersion ?? 0;

    if (remoteTs >= existingTs || remoteSelVer > existingSelVer) {
      const resolvedGraphicLocalBlob =
        remote.graphic?.hasLocalBlob ?? existing.graphic?.hasLocalBlob;
      const resolvedGraphicEmbedded =
        remote.graphic?.embeddedDataUrl ?? existing.graphic?.embeddedDataUrl;
      const nextGraphic = remote.graphic
        ? {
            ...remote.graphic,
            ...(resolvedGraphicEmbedded !== undefined
              ? { embeddedDataUrl: resolvedGraphicEmbedded }
              : {}),
            ...(resolvedGraphicLocalBlob !== undefined
              ? { hasLocalBlob: resolvedGraphicLocalBlob }
              : {}),
          }
        : remoteTs === existingTs
        ? existing.graphic
        : undefined;

      const resolvedFileLocalBlob =
        remote.hasLocalFileBlob ?? existing.hasLocalFileBlob;

      // Always keep whichever record holds the strictly newer committeeSelection version
      const selWinner = existingSelVer > remoteSelVer ? existing : remote;
      const baseRecord = remoteTs >= existingTs ? remote : existing;

      byId.set(remote.id, {
        ...baseRecord,
        ...(selWinner.committeeSelection !== undefined
          ? { committeeSelection: selWinner.committeeSelection }
          : {}),
        ...(selWinner.selectionVersion !== undefined
          ? { selectionVersion: selWinner.selectionVersion }
          : {}),
        ...(selWinner.selectionUpdatedAt !== undefined
          ? { selectionUpdatedAt: selWinner.selectionUpdatedAt }
          : {}),
        ...(selWinner.selectionUpdatedBy !== undefined
          ? { selectionUpdatedBy: selWinner.selectionUpdatedBy }
          : {}),
        ...(selWinner.selectionUpdatedByName !== undefined
          ? { selectionUpdatedByName: selWinner.selectionUpdatedByName }
          : {}),
        ...(resolvedFileLocalBlob !== undefined
          ? { hasLocalFileBlob: resolvedFileLocalBlob }
          : {}),
        ...(nextGraphic ? { graphic: nextGraphic } : {}),
      });
    }
  }
  return dedupeSubmissionsById(
    Array.from(byId.values()),
    INITIAL_SAMPLE_SUBMISSIONS
  ).records;
}

function readLocalReviews(): AbstractReviewRecord[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_REVIEWS;
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const { records, changed } = dedupeReviewsById(
          parsed as AbstractReviewRecord[],
          INITIAL_SAMPLE_REVIEWS
        );
        if (changed) {
          window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(records));
        }
        return records;
      }
    }
    const { records: seeded } = dedupeReviewsById(
      INITIAL_SAMPLE_REVIEWS,
      INITIAL_SAMPLE_REVIEWS
    );
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  } catch (err) {
    console.warn("Failed to parse local abstract reviews:", err);
    return INITIAL_SAMPLE_REVIEWS;
  }
}

function writeLocalReviews(records: AbstractReviewRecord[], notifyPeers = true): void {
  if (typeof window === "undefined") return;
  try {
    const { records: clean } = dedupeReviewsById(records, INITIAL_SAMPLE_REVIEWS);
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(REVIEWS_SYNC_EVENT));
    if (notifyPeers) {
      broadcastRealtimeUpdate("reviews");
    }
  } catch (err) {
    console.warn("Failed to write abstract reviews to localStorage:", err);
  }
}

function mergeReviewsByIdNewestWins(
  localItems: AbstractReviewRecord[],
  remoteItems: AbstractReviewRecord[]
): AbstractReviewRecord[] {
  const { records: cleanLocal } = dedupeReviewsById(
    localItems,
    INITIAL_SAMPLE_REVIEWS
  );
  const byId = new Map<string, AbstractReviewRecord>();
  for (const item of cleanLocal) {
    if (item?.reviewId) byId.set(item.reviewId, item);
  }
  for (const remote of remoteItems) {
    if (!remote?.reviewId) continue;
    const existing = byId.get(remote.reviewId);
    if (!existing) {
      byId.set(remote.reviewId, remote);
      continue;
    }
    const existingTs =
      Date.parse(existing.updatedAt || existing.createdAt || "") || 0;
    const remoteTs =
      Date.parse(remote.updatedAt || remote.createdAt || "") || 0;
    if (remoteTs >= existingTs) {
      byId.set(remote.reviewId, remote);
    }
  }
  return dedupeReviewsById(
    Array.from(byId.values()),
    INITIAL_SAMPLE_REVIEWS
  ).records;
}

function deriveLegacyAuthorFields(
  authors: AuthorEntry[],
  affiliations: AffiliationEntry[]
): {
  presentingAuthor: string;
  affiliation: string;
  coAuthors: string;
} {
  const affLookup = new Map(
    affiliations.map((a) => [
      a.id,
      a.location?.trim()
        ? `${a.institution.trim()}, ${a.location.trim()}`
        : a.institution.trim(),
    ])
  );
  const cleanAuthors = authors.filter((a) => a.name.trim().length > 0);
  const presenters = cleanAuthors.filter((a) => a.isPresenter);
  const primaryPresenter = presenters[0] || cleanAuthors[0];
  const presenterNames =
    presenters.length > 0
      ? presenters.map((p) => p.name.trim()).join(", ")
      : primaryPresenter?.name.trim() || "Presenting Author";

  const presenterIds = new Set(
    (presenters.length > 0 ? presenters : primaryPresenter ? [primaryPresenter] : []).map(
      (a) => a.id
    )
  );
  const coAuthorNames = cleanAuthors
    .filter((a) => !presenterIds.has(a.id))
    .map((a) => a.name.trim())
    .join(", ");

  const firstAffEntry = affiliations.find((a) => a.institution.trim().length > 0);
  const fallbackAff = firstAffEntry
    ? firstAffEntry.location?.trim()
      ? `${firstAffEntry.institution.trim()}, ${firstAffEntry.location.trim()}`
      : firstAffEntry.institution.trim()
    : "";

  const primaryAff =
    (primaryPresenter && affLookup.get(primaryPresenter.affiliationId)) || fallbackAff;

  return {
    presentingAuthor: presenterNames,
    affiliation: primaryAff,
    coAuthors: coAuthorNames,
  };
}

export function useAbstractSubmissions() {
  const { user, loading: authLoading, isMock } = useAuth();
  const [submissions, setSubmissions] = useState<AbstractSubmissionRecord[]>([]);
  const [reviews, setReviews] = useState<AbstractReviewRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [liveSyncActive, setLiveSyncActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canAccessReviews = Boolean(
    user && (hasReviewerRole(user.roles) || hasBoardOrAdminRole(user.roles))
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localItems = readLocalSubmissions();
      let resolvedSubmissions = localItems;

      if (hasFirebaseKeys && db && user) {
        try {
          const canListAll =
            hasReviewerRole(user.roles) ||
            hasBoardOrAdminRole(user.roles) ||
            hasOperationsRole(user.roles);
          const submissionsQuery = canListAll
            ? collection(db, "abstract_submissions")
            : query(
                collection(db, "abstract_submissions"),
                where("submittedByUid", "==", user.uid)
              );
          const snap = await getDocs(submissionsQuery);
          const remoteItems: AbstractSubmissionRecord[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as AbstractSubmissionRecord;
            remoteItems.push({ ...data, id: data.id || docSnap.id });
          });
          const merged = mergeByIdNewestWins(localItems, remoteItems);
          resolvedSubmissions = merged;
          if (remoteItems.length > 0 && typeof window !== "undefined") {
            window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged));
          }
        } catch (firestoreErr) {
          console.warn(
            "Firestore abstract_submissions unavailable or gated; using local cache:",
            firestoreErr
          );
        }
      }
      setSubmissions(resolvedSubmissions);

      if (!canAccessReviews) {
        setReviews([]);
        return;
      }

      const localReviews = readLocalReviews();
      let resolvedReviews = localReviews;

      if (hasFirebaseKeys && db && user) {
        try {
          const reviewsSnap = await getDocs(collection(db, "reviews"));
          const remoteReviews: AbstractReviewRecord[] = [];
          reviewsSnap.forEach((docSnap) => {
            const data = docSnap.data() as AbstractReviewRecord;
            remoteReviews.push({
              ...data,
              reviewId: data.reviewId || docSnap.id,
            });
          });
          const mergedReviews = mergeReviewsByIdNewestWins(
            localReviews,
            remoteReviews
          );
          resolvedReviews = mergedReviews;
          if (remoteReviews.length > 0 && typeof window !== "undefined") {
            window.localStorage.setItem(
              REVIEWS_STORAGE_KEY,
              JSON.stringify(mergedReviews)
            );
          }
        } catch (reviewsErr) {
          console.warn(
            "Firestore reviews unavailable or gated; using local cache:",
            reviewsErr
          );
        }
      }
      setReviews(resolvedReviews);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load abstract submissions.";
      console.error("Error loading abstract submissions:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, canAccessReviews]);

  useEffect(() => {
    if (!authLoading) {
      void refresh();
    }
    if (typeof window === "undefined") return;

    const handleSubmissionsSync = () => {
      setSubmissions(readLocalSubmissions());
    };
    const handleReviewsSync = () => {
      setReviews(canAccessReviews ? readLocalReviews() : []);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SUBMISSIONS_STORAGE_KEY) {
        handleSubmissionsSync();
      } else if (e.key === REVIEWS_STORAGE_KEY) {
        handleReviewsSync();
      }
    };

    window.addEventListener(SUBMISSIONS_SYNC_EVENT, handleSubmissionsSync);
    window.addEventListener(REVIEWS_SYNC_EVENT, handleReviewsSync);
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
        bc.onmessage = (ev: MessageEvent<{ kind?: string }>) => {
          if (ev.data?.kind === "submissions") {
            handleSubmissionsSync();
          } else if (ev.data?.kind === "reviews") {
            handleReviewsSync();
          }
        };
      } catch {
        bc = null;
      }
    }

    const unsubscribers: Array<() => void> = [];
    if (!authLoading && hasFirebaseKeys && db && user) {
      const canListAll =
        hasReviewerRole(user.roles) ||
        hasBoardOrAdminRole(user.roles) ||
        hasOperationsRole(user.roles);
      const submissionsQuery = canListAll
        ? collection(db, "abstract_submissions")
        : query(
            collection(db, "abstract_submissions"),
            where("submittedByUid", "==", user.uid)
          );

      const unsubSubs = onSnapshot(
        submissionsQuery,
        (snap) => {
          const remoteItems: AbstractSubmissionRecord[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as AbstractSubmissionRecord;
            remoteItems.push({ ...data, id: data.id || docSnap.id });
          });
          const merged = mergeByIdNewestWins(readLocalSubmissions(), remoteItems);
          if (remoteItems.length > 0 && typeof window !== "undefined") {
            window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged));
          }
          setSubmissions(merged);
          setLiveSyncActive(true);
          setLoading(false);
        },
        (snapErr) => {
          console.warn("Realtime abstract_submissions listener fallback:", snapErr);
          setLiveSyncActive(false);
        }
      );
      unsubscribers.push(unsubSubs);

      if (canAccessReviews) {
        const unsubRevs = onSnapshot(
          collection(db, "reviews"),
          (snap) => {
            const remoteReviews: AbstractReviewRecord[] = [];
            snap.forEach((docSnap) => {
              const data = docSnap.data() as AbstractReviewRecord;
              remoteReviews.push({
                ...data,
                reviewId: data.reviewId || docSnap.id,
              });
            });
            const merged = mergeReviewsByIdNewestWins(
              readLocalReviews(),
              remoteReviews
            );
            if (remoteReviews.length > 0 && typeof window !== "undefined") {
              window.localStorage.setItem(
                REVIEWS_STORAGE_KEY,
                JSON.stringify(merged)
              );
            }
            setReviews(merged);
          },
          (revErr) => {
            console.warn("Realtime reviews listener fallback:", revErr);
          }
        );
        unsubscribers.push(unsubRevs);
      }
    } else {
      setLiveSyncActive(false);
    }

    return () => {
      window.removeEventListener(SUBMISSIONS_SYNC_EVENT, handleSubmissionsSync);
      window.removeEventListener(REVIEWS_SYNC_EVENT, handleReviewsSync);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      for (const unsub of unsubscribers) unsub();
    };
  }, [authLoading, refresh, user, canAccessReviews]);

  const createSubmission = useCallback(
    async (
      input: CreateAbstractSubmissionInput,
      assets?: SubmissionUploadAssets
    ): Promise<AbstractSubmissionRecord> => {
      try {
        const current = readLocalSubmissions();
        const candidateId = generateSubmissionId(input.workshopYear, current);
        const nowIso = new Date().toISOString();

        const cleanAffiliations: AffiliationEntry[] = input.affiliations
          .map((a) => ({
            id: a.id,
            institution: a.institution.trim(),
            location: (a.location || "").trim(),
          }))
          .filter((a) => a.institution.length > 0);

        const cleanAuthors: AuthorEntry[] = input.authors
          .map((a) => ({
            id: a.id,
            name: a.name.trim(),
            affiliationId: a.affiliationId,
            isPresenter: a.isPresenter,
          }))
          .filter((a) => a.name.length > 0);

        const derived = deriveLegacyAuthorFields(cleanAuthors, cleanAffiliations);

        let pdfStorageUrl: string | undefined;
        if (assets?.pdfFile && hasFirebaseKeys && storage && !isMock) {
          try {
            const safeName = assets.pdfFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
            const objectRef = storageRef(
              storage,
              `abstracts/${input.workshopYear}/${candidateId}/${safeName}`
            );
            await uploadBytes(objectRef, assets.pdfFile, {
              contentType: assets.pdfFile.type || "application/pdf",
            });
            pdfStorageUrl = await getDownloadURL(objectRef);
          } catch (storageErr) {
            console.warn(
              "Firebase Storage PDF upload skipped/blocked; using IndexedDB local cache:",
              storageErr
            );
          }
        }

        let graphicRecord: GraphicMetadata | undefined;
        let embeddedDataUrl: string | undefined;
        if (assets?.graphicFile && assets.graphicMeta) {
          let graphicStorageUrl: string | undefined;
          if (hasFirebaseKeys && storage && !isMock) {
            try {
              const safeImgName = assets.graphicFile.name.replace(
                /[^a-zA-Z0-9._-]+/g,
                "_"
              );
              const imgRef = storageRef(
                storage,
                `abstracts/${input.workshopYear}/${candidateId}/graphic_${safeImgName}`
              );
              await uploadBytes(imgRef, assets.graphicFile, {
                contentType: assets.graphicFile.type || "image/png",
              });
              graphicStorageUrl = await getDownloadURL(imgRef);
            } catch (storageErr) {
              console.warn(
                "Firebase Storage graphic upload skipped/blocked; using cross-device preview fallback:",
                storageErr
              );
            }
          }

          if (!graphicStorageUrl) {
            embeddedDataUrl = await buildEmbeddedGraphicDataUrl(assets.graphicFile);
          }

          graphicRecord = stripUndefinedDeep({
            ...assets.graphicMeta,
            widthInches: clampFigureWidthInches(
              input.figureWidthInches ?? assets.graphicMeta.widthInches
            ),
            ...(input.graphicCaption?.trim()
              ? { caption: input.graphicCaption.trim() }
              : {}),
            ...(graphicStorageUrl ? { storageUrl: graphicStorageUrl } : {}),
            ...(embeddedDataUrl ? { embeddedDataUrl } : {}),
            hasLocalBlob: false,
          });
        }

        let record: AbstractSubmissionRecord = stripUndefinedDeep({
          id: candidateId,
          workshopYear: input.workshopYear,
          title: input.title.trim(),
          presentingAuthor: (input.presentingAuthor || derived.presentingAuthor).trim(),
          correspondingEmail: input.correspondingEmail.trim(),
          ...(input.secondaryEmail?.trim()
            ? { secondaryEmail: input.secondaryEmail.trim() }
            : {}),
          affiliation: (input.affiliation || derived.affiliation).trim(),
          coAuthors: (input.coAuthors ?? derived.coAuthors).trim(),
          affiliations: cleanAffiliations,
          authors: cleanAuthors,
          presentationFormat: input.presentationFormat,
          presenterCategory:
            input.presenterCategory ||
            (input.studentTravelAwardApplicant ? "student" : "academic"),
          researchTrack: input.researchTrack,
          summary: input.summary.trim(),
          abstractText: input.abstractText.trim(),
          keywords: input.keywords.trim(),
          presenterBio: input.presenterBio.trim(),
          ...(graphicRecord ? { graphic: graphicRecord } : {}),
          studentTravelAwardApplicant: input.studentTravelAwardApplicant,
          ...(assets?.pdfFile
            ? {
                fileName: assets.pdfFile.name,
                fileSizeBytes: assets.pdfFile.size,
                fileMimeType: assets.pdfFile.type || "application/pdf",
                ...(pdfStorageUrl ? { fileStorageUrl: pdfStorageUrl } : {}),
                hasLocalFileBlob: false,
              }
            : {}),
          submittedByUid: input.submittedByUid,
          submittedByEmail: input.submittedByEmail,
          submittedAt: nowIso,
          updatedAt: nowIso,
          deadline: input.deadline,
          status: "Pending",
          decision: "Pending",
          committeeSelection: "pending",
          selectionVersion: 0,
        });

        if (hasFirebaseKeys && db && user && !isMock) {
          try {
            record = await runTransaction(db, async (tx) => {
              let chosenId = candidateId;
              const attemptedIds: AbstractSubmissionRecord[] = [
                ...current,
                { ...record, id: candidateId },
              ];
              for (let attempt = 0; attempt < 5; attempt++) {
                const candidateRef = doc(db!, "abstract_submissions", chosenId);
                const snap = await tx.get(candidateRef);
                if (!snap.exists()) {
                  const committed = stripUndefinedDeep({
                    ...record,
                    id: chosenId,
                  });
                  tx.set(candidateRef, committed);
                  return committed;
                }
                chosenId = generateSubmissionId(input.workshopYear, attemptedIds);
                attemptedIds.push({ ...record, id: chosenId });
              }
              throw new Error(
                "Unable to allocate a unique cloud abstract identifier. Please retry."
              );
            });
          } catch (firestoreErr) {
            const msg =
              firestoreErr instanceof Error
                ? firestoreErr.message
                : "Firestore write rejected";
            throw new Error(
              `Unable to submit abstract to cloud database (${msg}). Your work remains saved locally in Drafts; please verify your verified Attendee account and retry.`
            );
          }
        }

        // Persist local IndexedDB binary assets under the final committed ID
        let storedPdfLocally = false;
        if (assets?.pdfFile) {
          storedPdfLocally = await putBlob(record.id, assets.pdfFile);
        }
        let storedGraphicLocally = false;
        if (assets?.graphicFile && record.graphic) {
          storedGraphicLocally = await putBlob(
            graphicBlobKey(record.id),
            assets.graphicFile
          );
        }
        if (storedPdfLocally || storedGraphicLocally) {
          record = {
            ...record,
            ...(storedPdfLocally ? { hasLocalFileBlob: true } : {}),
            ...(record.graphic && storedGraphicLocally
              ? { graphic: { ...record.graphic, hasLocalBlob: true } }
              : {}),
          };
        }

        const next = sortSubmissionsNewestFirst([record, ...current]);
        writeLocalSubmissions(next);
        setSubmissions(next);
        return record;
      } catch (err) {
        console.error("Failed to create abstract submission:", err);
        throw err instanceof Error
          ? err
          : new Error("Unexpected error while saving abstract submission.");
      }
    },
    [user, isMock]
  );

  const updateSubmission = useCallback(
    async (
      id: string,
      input: CreateAbstractSubmissionInput,
      assets?: SubmissionUploadAssets & { keepExistingGraphic?: boolean }
    ): Promise<AbstractSubmissionRecord> => {
      try {
        const current = readLocalSubmissions();
        const existing = current.find((item) => item.id === id);
        if (!existing) {
          throw new Error(`Abstract submission ${id} not found.`);
        }

        const nowIso = new Date().toISOString();
        const cleanAffiliations: AffiliationEntry[] = input.affiliations
          .map((a) => ({
            id: a.id,
            institution: a.institution.trim(),
            location: (a.location || "").trim(),
          }))
          .filter((a) => a.institution.length > 0);

        const cleanAuthors: AuthorEntry[] = input.authors
          .map((a) => ({
            id: a.id,
            name: a.name.trim(),
            affiliationId: a.affiliationId,
            isPresenter: a.isPresenter,
          }))
          .filter((a) => a.name.length > 0);

        const derived = deriveLegacyAuthorFields(cleanAuthors, cleanAffiliations);

        let graphicRecord: GraphicMetadata | undefined;
        if (assets?.graphicFile && assets.graphicMeta) {
          const storedGraphicLocally = await putBlob(
            graphicBlobKey(id),
            assets.graphicFile
          );
          let graphicStorageUrl: string | undefined;
          if (hasFirebaseKeys && storage && !isMock) {
            try {
              const safeImgName = assets.graphicFile.name.replace(
                /[^a-zA-Z0-9._-]+/g,
                "_"
              );
              const imgRef = storageRef(
                storage,
                `abstracts/${input.workshopYear}/${id}/graphic_${safeImgName}`
              );
              await uploadBytes(imgRef, assets.graphicFile, {
                contentType: assets.graphicFile.type || "image/png",
              });
              graphicStorageUrl = await getDownloadURL(imgRef);
            } catch (storageErr) {
              console.warn(
                "Firebase Storage graphic upload skipped/blocked; using cross-device preview fallback:",
                storageErr
              );
            }
          }
          const embeddedDataUrl = !graphicStorageUrl
            ? await buildEmbeddedGraphicDataUrl(assets.graphicFile)
            : undefined;

          graphicRecord = stripUndefinedDeep({
            ...assets.graphicMeta,
            widthInches: clampFigureWidthInches(
              input.figureWidthInches ?? assets.graphicMeta.widthInches
            ),
            ...(input.graphicCaption?.trim()
              ? { caption: input.graphicCaption.trim() }
              : {}),
            ...(graphicStorageUrl ? { storageUrl: graphicStorageUrl } : {}),
            ...(embeddedDataUrl ? { embeddedDataUrl } : {}),
            hasLocalBlob: storedGraphicLocally,
          });
        } else if (assets?.keepExistingGraphic && existing.graphic) {
          graphicRecord = stripUndefinedDeep({
            ...existing.graphic,
            widthInches: clampFigureWidthInches(
              input.figureWidthInches ?? existing.graphic.widthInches
            ),
            ...(input.graphicCaption?.trim()
              ? { caption: input.graphicCaption.trim() }
              : {}),
          });
        } else {
          await deleteBlob(graphicBlobKey(id));
        }

        const updatedRecord: AbstractSubmissionRecord = stripUndefinedDeep({
          id: existing.id,
          workshopYear: input.workshopYear,
          title: input.title.trim(),
          presentingAuthor: (input.presentingAuthor || derived.presentingAuthor).trim(),
          correspondingEmail: input.correspondingEmail.trim(),
          ...(input.secondaryEmail?.trim()
            ? { secondaryEmail: input.secondaryEmail.trim() }
            : {}),
          affiliation: (input.affiliation || derived.affiliation).trim(),
          coAuthors: (input.coAuthors ?? derived.coAuthors).trim(),
          affiliations: cleanAffiliations,
          authors: cleanAuthors,
          presentationFormat: input.presentationFormat,
          presenterCategory:
            input.presenterCategory ||
            existing.presenterCategory ||
            (input.studentTravelAwardApplicant ? "student" : "academic"),
          researchTrack: input.researchTrack,
          ...(existing.recommendedTrack !== undefined
            ? { recommendedTrack: existing.recommendedTrack }
            : {}),
          summary: input.summary.trim(),
          abstractText: input.abstractText.trim(),
          keywords: input.keywords.trim(),
          presenterBio: input.presenterBio.trim(),
          ...(graphicRecord ? { graphic: graphicRecord } : {}),
          studentTravelAwardApplicant: input.studentTravelAwardApplicant,
          ...(existing.fileName
            ? {
                fileName: existing.fileName,
                ...(existing.fileSizeBytes !== undefined
                  ? { fileSizeBytes: existing.fileSizeBytes }
                  : {}),
                ...(existing.fileMimeType !== undefined
                  ? { fileMimeType: existing.fileMimeType }
                  : {}),
                ...(existing.fileStorageUrl
                  ? { fileStorageUrl: existing.fileStorageUrl }
                  : {}),
                ...(existing.hasLocalFileBlob !== undefined
                  ? { hasLocalFileBlob: existing.hasLocalFileBlob }
                  : {}),
              }
            : {}),
          submittedByUid: existing.submittedByUid,
          submittedByEmail: existing.submittedByEmail,
          submittedAt: existing.submittedAt,
          updatedAt: nowIso,
          deadline: input.deadline,
          status: existing.status,
          decision: existing.decision,
          ...(existing.committeeSelection !== undefined
            ? { committeeSelection: existing.committeeSelection }
            : {}),
          ...(existing.selectionVersion !== undefined
            ? { selectionVersion: existing.selectionVersion }
            : {}),
          ...(existing.selectionUpdatedAt !== undefined
            ? { selectionUpdatedAt: existing.selectionUpdatedAt }
            : {}),
          ...(existing.selectionUpdatedBy !== undefined
            ? { selectionUpdatedBy: existing.selectionUpdatedBy }
            : {}),
          ...(existing.selectionUpdatedByName !== undefined
            ? { selectionUpdatedByName: existing.selectionUpdatedByName }
            : {}),
          ...(typeof existing.score === "number" ? { score: existing.score } : {}),
          ...(typeof existing.hemsFitness === "number"
            ? { hemsFitness: existing.hemsFitness }
            : {}),
          ...(existing.reviewerComments !== undefined
            ? { reviewerComments: existing.reviewerComments }
            : {}),
          ...(existing.reviewedBy !== undefined
            ? { reviewedBy: existing.reviewedBy }
            : {}),
          ...(existing.reviewedAt !== undefined
            ? { reviewedAt: existing.reviewedAt }
            : {}),
          ...(existing.isSampleSeed ? { isSampleSeed: true } : {}),
        });

        if (hasFirebaseKeys && db && !isMock) {
          try {
            await setDoc(doc(db, "abstract_submissions", id), updatedRecord);
          } catch (firestoreErr) {
            const msg =
              firestoreErr instanceof Error
                ? firestoreErr.message
                : "Firestore update rejected";
            throw new Error(
              `Unable to update submitted abstract in cloud database (${msg}). Please check your sign-in session and try again.`
            );
          }
        }

        const next = sortSubmissionsNewestFirst(
          current.map((item) => (item.id === id ? updatedRecord : item))
        );
        writeLocalSubmissions(next);
        setSubmissions(next);
        return updatedRecord;
      } catch (err) {
        console.error("Failed to update abstract submission:", err);
        throw err instanceof Error
          ? err
          : new Error("Unexpected error while updating abstract submission.");
      }
    },
    [isMock]
  );

  const saveReview = useCallback(async (input: SaveAbstractReviewInput): Promise<void> => {
    try {
      const nowIso = new Date().toISOString();
      const current = readLocalSubmissions();
      const target = current.find((item) => item.id === input.id);
      if (!target) {
        throw new Error(`Abstract submission ${input.id} not found.`);
      }

      const normalizedReviewerEmail = input.reviewedBy.trim().toLowerCase();
      const reviewId = buildReviewId(input.id, normalizedReviewerEmail);
      const currentReviews = readLocalReviews();
      const existingReview = currentReviews.find((r) => r.reviewId === reviewId);

      const reviewRecord: AbstractReviewRecord = {
        reviewId,
        submissionId: input.id,
        reviewerEmail: normalizedReviewerEmail,
        ...(input.reviewerName?.trim()
          ? { reviewerName: input.reviewerName.trim() }
          : existingReview?.reviewerName
          ? { reviewerName: existingReview.reviewerName }
          : {}),
        score: input.score,
        hemsFitness: input.hemsFitness,
        decision: input.decision,
        recommendedTrack:
          input.recommendedTrack ||
          existingReview?.recommendedTrack ||
          target.recommendedTrack ||
          target.researchTrack,
        isCompleted: Boolean(existingReview?.isCompleted),
        ...(existingReview?.completedAt
          ? { completedAt: existingReview.completedAt }
          : {}),
        reviewerComments: input.reviewerComments.trim(),
        privateNotes: input.privateNotes.trim(),
        createdAt: existingReview?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      if (hasFirebaseKeys && db) {
        try {
          await setDoc(doc(db, "reviews", reviewId), stripUndefinedDeep(reviewRecord), {
            merge: true,
          });
        } catch (firestoreErr) {
          console.warn(
            "Firestore review write skipped/blocked; persisted locally:",
            firestoreErr
          );
        }
      }

      const nextReviews = sortReviewsNewestFirst([
        reviewRecord,
        ...currentReviews.filter((r) => r.reviewId !== reviewId),
      ]);
      writeLocalReviews(nextReviews);
      setReviews(nextReviews);

      const summary = summarizeSubmissionReviews(target, nextReviews);
      const targetOfficialSelection = target.committeeSelection;
      const resolvedDecisionForRecord =
        targetOfficialSelection === "accept_oral"
          ? "Accept (Oral)"
          : targetOfficialSelection === "accept_poster"
          ? "Accept (Poster)"
          : targetOfficialSelection === "decline"
          ? "Decline"
          : targetOfficialSelection === "pending"
          ? "Pending"
          : summary.consensusDecision !== "Pending"
          ? summary.consensusDecision
          : input.decision;

      const aggregatePatch = {
        status: "Reviewed" as const,
        decision: resolvedDecisionForRecord,
        recommendedTrack: summary.consensusRecommendedTrack,
        score: summary.medianScore ?? input.score,
        hemsFitness: summary.medianHemsFitness ?? input.hemsFitness,
        reviewedBy: normalizedReviewerEmail,
        reviewedAt: nowIso,
        updatedAt: nowIso,
      };

      // IMPORTANT: Never write privateNotes (confidential reviewer-only text) onto abstract_submissions,
      // and never overwrite another reviewer's concurrent committeeSelection / selectionVersion.
      let updatedRecord: AbstractSubmissionRecord = {
        ...target,
        ...aggregatePatch,
      };

      if (hasFirebaseKeys && db) {
        try {
          updatedRecord = await runTransaction(db, async (tx) => {
            const docRef = doc(db!, "abstract_submissions", input.id);
            const snap = await tx.get(docRef);
            const latestBase = snap.exists()
              ? ({ ...(snap.data() as AbstractSubmissionRecord), id: input.id })
              : target;
            const latestOfficialSel = latestBase.committeeSelection;
            const syncedDecision =
              latestOfficialSel === "accept_oral"
                ? "Accept (Oral)"
                : latestOfficialSel === "accept_poster"
                ? "Accept (Poster)"
                : latestOfficialSel === "decline"
                ? "Decline"
                : latestOfficialSel === "pending"
                ? "Pending"
                : aggregatePatch.decision;
            const merged: AbstractSubmissionRecord = stripUndefinedDeep({
              ...latestBase,
              ...aggregatePatch,
              decision: syncedDecision,
            });
            tx.set(docRef, merged, { merge: true });
            return merged;
          });
        } catch (firestoreErr) {
          console.warn(
            "Firestore abstract review status update skipped/blocked; persisted locally:",
            firestoreErr
          );
        }
      }

      const next = sortSubmissionsNewestFirst(
        readLocalSubmissions().map((item) =>
          item.id === input.id ? updatedRecord : item
        )
      );
      writeLocalSubmissions(next);
      setSubmissions(next);
    } catch (err) {
      console.error("Failed to save abstract review:", err);
      throw err instanceof Error
        ? err
        : new Error("Unexpected error while saving abstract review.");
    }
  }, []);

  const toggleReviewCompleted = useCallback(
    async (submissionId: string, forceState?: boolean): Promise<boolean> => {
      if (!user?.email) {
        throw new Error("Sign in as an authorized reviewer to update review status.");
      }
      const nowIso = new Date().toISOString();
      const target = readLocalSubmissions().find((item) => item.id === submissionId);
      const normalizedReviewerEmail = user.email.trim().toLowerCase();
      const reviewId = buildReviewId(submissionId, normalizedReviewerEmail);
      const currentReviews = readLocalReviews();
      const existing = currentReviews.find((r) => r.reviewId === reviewId);

      const nextCompleted =
        typeof forceState === "boolean"
          ? forceState
          : !Boolean(existing?.isCompleted);

      const nextRecord: AbstractReviewRecord = existing
        ? {
            ...existing,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? nowIso : "",
            updatedAt: nowIso,
          }
        : {
            reviewId,
            submissionId,
            reviewerEmail: normalizedReviewerEmail,
            ...(user.name?.trim() ? { reviewerName: user.name.trim() } : {}),
            score: null,
            hemsFitness: null,
            decision: "Pending",
            recommendedTrack:
              target?.recommendedTrack || target?.researchTrack || "Miscellaneous",
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? nowIso : "",
            reviewerComments: "",
            privateNotes: "",
            createdAt: nowIso,
            updatedAt: nowIso,
          };

      if (hasFirebaseKeys && db) {
        try {
          await setDoc(doc(db, "reviews", reviewId), stripUndefinedDeep(nextRecord), {
            merge: true,
          });
        } catch (firestoreErr) {
          console.warn(
            "Firestore review completed toggle skipped/blocked; persisted locally:",
            firestoreErr
          );
        }
      }

      const nextReviews = sortReviewsNewestFirst([
        nextRecord,
        ...readLocalReviews().filter((r) => r.reviewId !== reviewId),
      ]);
      writeLocalReviews(nextReviews);
      setReviews(nextReviews);
      return nextCompleted;
    },
    [user]
  );

  const updateCommitteeSelection = useCallback(
    async (params: {
      id: string;
      selection: CommitteeSelection;
      expectedVersion: number;
      forceOverride?: boolean;
    }): Promise<UpdateSelectionResult> => {
      if (!user?.email) {
        throw new Error("Sign in as an authorized reviewer to set Selection.");
      }
      const nowIso = new Date().toISOString();
      const actorEmail = user.email.trim().toLowerCase();
      const actorName = (user.name || "").trim();
      const currentList = readLocalSubmissions();
      const localTarget = currentList.find((item) => item.id === params.id);
      if (!localTarget) {
        throw new Error(`Abstract submission ${params.id} not found.`);
      }

      const localVer = localTarget.selectionVersion ?? 0;
      const localSel = resolveOfficialSelection(localTarget);

      if (
        !params.forceOverride &&
        localVer !== params.expectedVersion &&
        localSel !== params.selection
      ) {
        return {
          ok: false,
          conflict: {
            submissionId: params.id,
            attemptedSelection: params.selection,
            remoteRecord: localTarget,
          },
        };
      }

      if (hasFirebaseKeys && db) {
        try {
          let conflictRecord: AbstractSubmissionRecord | null = null;
          const updatedCloud = await runTransaction(db, async (tx) => {
            const docRef = doc(db!, "abstract_submissions", params.id);
            const snap = await tx.get(docRef);
            const base = snap.exists()
              ? ({ ...(snap.data() as AbstractSubmissionRecord), id: params.id })
              : localTarget;
            const remoteVer = base.selectionVersion ?? 0;
            const remoteSel = resolveOfficialSelection(base);

            if (
              !params.forceOverride &&
              remoteVer !== params.expectedVersion &&
              remoteSel !== params.selection
            ) {
              conflictRecord = base;
              return null;
            }

            const mappedDecision =
              params.selection === "accept_oral"
                ? ("Accept (Oral)" as const)
                : params.selection === "accept_poster"
                ? ("Accept (Poster)" as const)
                : params.selection === "decline"
                ? ("Decline" as const)
                : ("Pending" as const);
            const mappedStatus =
              params.selection === "pending"
                ? typeof base.score === "number"
                  ? ("Reviewed" as const)
                  : ("Pending" as const)
                : ("Reviewed" as const);

            const nextRecord: AbstractSubmissionRecord = stripUndefinedDeep({
              ...base,
              committeeSelection: params.selection,
              decision: mappedDecision,
              status: mappedStatus,
              selectionVersion: remoteVer + 1,
              selectionUpdatedAt: nowIso,
              selectionUpdatedBy: actorEmail,
              ...(actorName ? { selectionUpdatedByName: actorName } : {}),
              updatedAt: nowIso,
            });
            tx.set(docRef, nextRecord, { merge: true });
            return nextRecord;
          });

          if (conflictRecord) {
            const reconciled = sortSubmissionsNewestFirst(
              readLocalSubmissions().map((item) =>
                item.id === params.id ? conflictRecord! : item
              )
            );
            writeLocalSubmissions(reconciled);
            setSubmissions(reconciled);
            return {
              ok: false,
              conflict: {
                submissionId: params.id,
                attemptedSelection: params.selection,
                remoteRecord: conflictRecord,
              },
            };
          }

          if (updatedCloud) {
            const nextList = sortSubmissionsNewestFirst(
              readLocalSubmissions().map((item) =>
                item.id === params.id ? updatedCloud : item
              )
            );
            writeLocalSubmissions(nextList);
            setSubmissions(nextList);
            return { ok: true, record: updatedCloud };
          }
        } catch (firestoreErr) {
          console.warn(
            "Firestore transactional selection update fell back to local storage:",
            firestoreErr
          );
        }
      }

      const mappedLocalDecision =
        params.selection === "accept_oral"
          ? ("Accept (Oral)" as const)
          : params.selection === "accept_poster"
          ? ("Accept (Poster)" as const)
          : params.selection === "decline"
          ? ("Decline" as const)
          : ("Pending" as const);
      const mappedLocalStatus =
        params.selection === "pending"
          ? typeof localTarget.score === "number"
            ? ("Reviewed" as const)
            : ("Pending" as const)
          : ("Reviewed" as const);

      const nextRecord: AbstractSubmissionRecord = {
        ...localTarget,
        committeeSelection: params.selection,
        decision: mappedLocalDecision,
        status: mappedLocalStatus,
        selectionVersion: localVer + 1,
        selectionUpdatedAt: nowIso,
        selectionUpdatedBy: actorEmail,
        ...(actorName ? { selectionUpdatedByName: actorName } : {}),
        updatedAt: nowIso,
      };
      const nextList = sortSubmissionsNewestFirst(
        readLocalSubmissions().map((item) =>
          item.id === params.id ? nextRecord : item
        )
      );
      writeLocalSubmissions(nextList);
      setSubmissions(nextList);
      return { ok: true, record: nextRecord };
    },
    [user]
  );

  const withdrawSubmission = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteBlob(id);
        await deleteBlob(graphicBlobKey(id));
        if (hasFirebaseKeys && db) {
          try {
            await deleteDoc(doc(db, "abstract_submissions", id));
          } catch (firestoreErr) {
            console.warn("Firestore abstract deletion skipped/blocked:", firestoreErr);
          }

          if (canAccessReviews) {
            try {
              const relatedSnap = await getDocs(
                query(collection(db, "reviews"), where("submissionId", "==", id))
              );
              await Promise.all(
                relatedSnap.docs.map((d) => deleteDoc(doc(db!, "reviews", d.id)))
              );
            } catch (reviewDeleteErr) {
              console.warn(
                "Firestore related review cleanup skipped/blocked:",
                reviewDeleteErr
              );
            }
          }
        }
        const next = readLocalSubmissions().filter((item) => item.id !== id);
        writeLocalSubmissions(next);
        setSubmissions(next);

        const remainingReviews = readLocalReviews().filter(
          (r) => r.submissionId !== id
        );
        writeLocalReviews(remainingReviews);
        if (canAccessReviews) {
          setReviews(remainingReviews);
        }
      } catch (err) {
        console.error("Failed to withdraw abstract submission:", err);
        throw err instanceof Error
          ? err
          : new Error("Unexpected error while withdrawing submission.");
      }
    },
    [canAccessReviews]
  );

  const getGraphicPreviewUrl = useCallback(
    async (sub: AbstractSubmissionRecord): Promise<string | null> => {
      try {
        if (sub.graphic?.storageUrl) {
          return sub.graphic.storageUrl;
        }
        if (sub.graphic?.hasLocalBlob) {
          const blob = await getBlob(graphicBlobKey(sub.id));
          if (blob) {
            return URL.createObjectURL(blob);
          }
        }
        if (sub.graphic?.embeddedDataUrl) {
          return sub.graphic.embeddedDataUrl;
        }
        return null;
      } catch (err) {
        console.warn("Unable to resolve graphic preview URL:", err);
        return sub.graphic?.embeddedDataUrl || null;
      }
    },
    []
  );

  const openSubmissionPdf = useCallback(
    async (
      sub: AbstractSubmissionRecord
    ): Promise<{ ok: boolean; reason?: string }> => {
      try {
        if (sub.fileStorageUrl) {
          window.open(sub.fileStorageUrl, "_blank", "noopener,noreferrer");
          return { ok: true };
        }
        const blob = await getBlob(sub.id);
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          window.open(objectUrl, "_blank", "noopener,noreferrer");
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          return { ok: true };
        }
        return {
          ok: false,
          reason:
            "No legacy PDF attachment — use Show 1-Page Abstract Preview to inspect this formatted submission.",
        };
      } catch (err) {
        console.error("Failed to open submitted abstract PDF:", err);
        return {
          ok: false,
          reason: "Unable to open PDF preview in this browser.",
        };
      }
    },
    []
  );

  const getSubmissionGraphicAsset = useCallback(
    async (
      sub: AbstractSubmissionRecord
    ): Promise<{
      file: File | null;
      previewUrl: string;
      retainedMeta: GraphicMetadata | null;
    }> => {
      if (!sub.graphic) {
        return { file: null, previewUrl: "", retainedMeta: null };
      }
      try {
        const localBlob = await getBlob(graphicBlobKey(sub.id));
        if (localBlob) {
          const restoredFile = new File(
            [localBlob],
            sub.graphic.fileName || "figure.png",
            { type: sub.graphic.mimeType || localBlob.type || "image/png" }
          );
          return {
            file: restoredFile,
            previewUrl: URL.createObjectURL(restoredFile),
            retainedMeta: sub.graphic,
          };
        }

        if (sub.graphic.storageUrl) {
          try {
            const response = await fetch(sub.graphic.storageUrl);
            if (response.ok) {
              const fetchedBlob = await response.blob();
              const restoredFile = new File(
                [fetchedBlob],
                sub.graphic.fileName || "figure.png",
                {
                  type:
                    sub.graphic.mimeType || fetchedBlob.type || "image/png",
                }
              );
              return {
                file: restoredFile,
                previewUrl: URL.createObjectURL(restoredFile),
                retainedMeta: sub.graphic,
              };
            }
          } catch (fetchErr) {
            console.warn(
              "Unable to fetch remote submission graphic blob; using storage URL fallback:",
              fetchErr
            );
          }

          return {
            file: null,
            previewUrl: sub.graphic.storageUrl,
            retainedMeta: sub.graphic,
          };
        }

        if (sub.graphic.embeddedDataUrl) {
          try {
            const response = await fetch(sub.graphic.embeddedDataUrl);
            if (response.ok) {
              const fetchedBlob = await response.blob();
              const restoredFile = new File(
                [fetchedBlob],
                sub.graphic.fileName || "figure.png",
                {
                  type:
                    sub.graphic.mimeType || fetchedBlob.type || "image/png",
                }
              );
              return {
                file: restoredFile,
                previewUrl: URL.createObjectURL(restoredFile),
                retainedMeta: sub.graphic,
              };
            }
          } catch {
            // Fall back directly to data URL
          }

          return {
            file: null,
            previewUrl: sub.graphic.embeddedDataUrl,
            retainedMeta: sub.graphic,
          };
        }
      } catch (err) {
        console.warn("Unable to resolve submission graphic asset:", err);
      }
      return { file: null, previewUrl: "", retainedMeta: null };
    },
    []
  );

  return {
    submissions,
    reviews,
    loading,
    liveSyncActive,
    error,
    refresh,
    createSubmission,
    updateSubmission,
    saveReview,
    toggleReviewCompleted,
    updateCommitteeSelection,
    withdrawSubmission,
    getGraphicPreviewUrl,
    getSubmissionGraphicAsset,
    openSubmissionPdf,
  };
}
