"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { db, hasFirebaseKeys, storage } from "@/utils/firebase";
import { hasBoardRole } from "@/utils/telemetryClient";
import {
  BoardDocumentRecord,
  MAX_BOARD_NOTES_LENGTH,
  UploadBoardDocumentInput,
  getFileExtension,
  validateBoardUploadFile,
} from "@/types/boardRepository";

const BOARD_REPO_STORAGE_KEY = "hems_board_repository_v1";
const BOARD_REPO_SEEDED_KEY = "hems_board_repository_seeded_v1";
const BOARD_REPO_SYNC_EVENT = "hems-board-repo-updated";
const IDB_NAME = "hems_board_files_idb";
const IDB_VERSION = 1;
const IDB_STORE = "board_blobs";
const RAW_CHUNK_BYTES = 600 * 1024;

export const PINNED_MASTER_LOGO_DOC: BoardDocumentRecord = {
  id: "BOARD-PINNED-HEMS-LOGO-MASTER",
  title: "Official HEMS Society Emblem — Full-Resolution Master (3756 × 2594 px)",
  category: "Governance",
  documentDate: "2026-11-16",
  cycleTag: "Society-Wide",
  notes:
    "Uncompressed 3756 × 2594 px master graphic for print banners, signage, and publications (public webpages serve a compressed 1127 × 778 copy).",
  fileName: "HEMS-Society-Logo-Master-3756x2594.jpg",
  fileExtension: ".jpg",
  mimeType: "image/jpeg",
  fileSizeBytes: 846986,
  staticAssetUrl: "/images/brand/hemslogo-fullres-3756x2594.jpg",
  uploadedByUid: "system-brand-master",
  uploadedByEmail: "webmaster@hems-workshop.org",
  uploadedAt: "2026-11-16T00:00:00.000Z",
  updatedAt: "2026-11-16T00:00:00.000Z",
  status: "active",
  isPinned: true,
};

interface BoardBlobChunkDoc {
  docId: string;
  chunkIndex: number;
  base64Data: string;
}

const INITIAL_SAMPLE_BOARD_DOCS: BoardDocumentRecord[] = [
  {
    id: "BOARD-DOC-SEED-001",
    title: "HEMS Board Meeting Minutes - October 2025",
    category: "Minutes",
    documentDate: "2025-10-18",
    cycleTag: "FY2025",
    notes: "Sample seed record from the 15th Workshop post-conference Board session.",
    fileName: "hems-board-minutes-october-2025.pdf",
    fileExtension: ".pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 145408,
    uploadedByUid: "seed-board",
    uploadedByEmail: "president@hems-workshop.org",
    uploadedAt: "2025-10-18T18:00:00.000Z",
    updatedAt: "2025-10-18T18:00:00.000Z",
    status: "active",
    isSampleSeed: true,
  },
  {
    id: "BOARD-DOC-SEED-002",
    title: "HEMS Annual Financial Report & Budget Review FY2025",
    category: "Financials",
    documentDate: "2025-12-10",
    cycleTag: "FY2025",
    notes: "Sample seed summary for 501(c)(3) annual budget & Student Travel Award reserve.",
    fileName: "hems-annual-financial-report-fy2025.pdf",
    fileExtension: ".pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 499712,
    uploadedByUid: "seed-board",
    uploadedByEmail: "president@hems-workshop.org",
    uploadedAt: "2025-12-10T17:30:00.000Z",
    updatedAt: "2025-12-10T17:30:00.000Z",
    status: "active",
    isSampleSeed: true,
  },
  {
    id: "BOARD-DOC-SEED-003",
    title: "Upcoming 16th HEMS Workshop Planning & Venue Agenda",
    category: "Agenda",
    documentDate: "2026-03-05",
    cycleTag: "16th Workshop (2027)",
    notes: "Sample planning agenda for September 2027 coastal host selection and hotel block.",
    fileName: "hems-16th-workshop-planning-agenda.pdf",
    fileExtension: ".pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 97280,
    uploadedByUid: "seed-board",
    uploadedByEmail: "president@hems-workshop.org",
    uploadedAt: "2026-03-05T15:00:00.000Z",
    updatedAt: "2026-03-05T15:00:00.000Z",
    status: "active",
    isSampleSeed: true,
  },
];

function stripUndefinedFields(record: BoardDocumentRecord): BoardDocumentRecord {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    documentDate: record.documentDate,
    cycleTag: record.cycleTag,
    ...(record.notes ? { notes: record.notes } : {}),
    fileName: record.fileName,
    fileExtension: record.fileExtension,
    mimeType: record.mimeType,
    fileSizeBytes: record.fileSizeBytes,
    ...(record.storagePath ? { storagePath: record.storagePath } : {}),
    ...(record.storageUrl ? { storageUrl: record.storageUrl } : {}),
    ...(typeof record.firestoreChunkCount === "number"
      ? { firestoreChunkCount: record.firestoreChunkCount }
      : {}),
    ...(typeof record.hasLocalBlob === "boolean"
      ? { hasLocalBlob: record.hasLocalBlob }
      : {}),
    uploadedByUid: record.uploadedByUid,
    uploadedByEmail: record.uploadedByEmail,
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt,
    status: record.status,
    ...(record.archivedAt ? { archivedAt: record.archivedAt } : {}),
    ...(record.archivedByEmail ? { archivedByEmail: record.archivedByEmail } : {}),
    ...(record.archiveReason ? { archiveReason: record.archiveReason } : {}),
    ...(typeof record.isSampleSeed === "boolean"
      ? { isSampleSeed: record.isSampleSeed }
      : {}),
  };
}

function readLocalDocuments(): BoardDocumentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOARD_REPO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as BoardDocumentRecord[];
      }
    }
    const alreadySeeded = window.localStorage.getItem(BOARD_REPO_SEEDED_KEY);
    if (!alreadySeeded) {
      window.localStorage.setItem(
        BOARD_REPO_STORAGE_KEY,
        JSON.stringify(INITIAL_SAMPLE_BOARD_DOCS)
      );
      window.localStorage.setItem(BOARD_REPO_SEEDED_KEY, "1");
      return INITIAL_SAMPLE_BOARD_DOCS;
    }
    return [];
  } catch (err) {
    console.error("Failed reading local board repository cache:", err);
    return [];
  }
}

function writeLocalDocuments(records: BoardDocumentRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOARD_REPO_STORAGE_KEY, JSON.stringify(records));
    window.localStorage.setItem(BOARD_REPO_SEEDED_KEY, "1");
    window.dispatchEvent(new CustomEvent(BOARD_REPO_SYNC_EVENT));
  } catch (err) {
    console.error("Failed writing local board repository cache:", err);
  }
}

function mergeByIdNewestWins(
  localItems: BoardDocumentRecord[],
  remoteItems: BoardDocumentRecord[]
): BoardDocumentRecord[] {
  const merged = new Map<string, BoardDocumentRecord>();
  for (const item of localItems) {
    merged.set(item.id, item);
  }
  for (const remote of remoteItems) {
    const existing = merged.get(remote.id);
    if (!existing) {
      merged.set(remote.id, remote);
      continue;
    }
    const existingTime = Date.parse(existing.updatedAt || existing.uploadedAt || "0");
    const remoteTime = Date.parse(remote.updatedAt || remote.uploadedAt || "0");
    if (remoteTime >= existingTime) {
      merged.set(remote.id, {
        ...remote,
        ...(existing.hasLocalBlob ? { hasLocalBlob: true } : {}),
      });
    }
  }
  return Array.from(merged.values()).sort((a, b) =>
    (b.updatedAt || b.documentDate).localeCompare(a.updatedAt || a.documentDate)
  );
}

function openBlobDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(IDB_STORE)) {
          database.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error("IndexedDB open error for board repository:", request.error);
        resolve(null);
      };
    } catch (err) {
      console.error("IndexedDB initialization failed:", err);
      resolve(null);
    }
  });
}

async function putBoardBlob(docId: string, blob: Blob): Promise<boolean> {
  try {
    const database = await openBlobDb();
    if (!database) return false;
    return await new Promise<boolean>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(blob, docId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error("Failed caching board file blob locally:", tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.error("putBoardBlob exception:", err);
    return false;
  }
}

async function getBoardBlob(docId: string): Promise<Blob | null> {
  try {
    const database = await openBlobDb();
    if (!database) return null;
    return await new Promise<Blob | null>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(docId);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => {
        console.error("Failed reading local board file blob:", req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.error("getBoardBlob exception:", err);
    return null;
  }
}

async function deleteBoardBlob(docId: string): Promise<void> {
  try {
    const database = await openBlobDb();
    if (!database) return;
    await new Promise<void>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(docId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.error("deleteBoardBlob exception:", err);
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  const sliceSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += sliceSize) {
    const chunk = bytes.subarray(offset, offset + sliceSize);
    parts.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }
  return window.btoa(parts.join(""));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const output = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    output[i] = binary.charCodeAt(i);
  }
  return output;
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function generateBoardDocId(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BOARD-${stamp}-${suffix}`;
}

async function deleteFirestoreChunks(docId: string): Promise<void> {
  if (!hasFirebaseKeys || !db) return;
  const chunksQuery = query(
    collection(db, "board_document_blobs"),
    where("docId", "==", docId)
  );
  const snap = await getDocs(chunksQuery);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}

export function useBoardRepository() {
  const { user, loading: authLoading } = useAuth();
  const canAccessBoard = Boolean(user && hasBoardRole(user.roles));

  const [documents, setDocuments] = useState<BoardDocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    if (!canAccessBoard || !user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const localItems = readLocalDocuments();
      let resolved = localItems;

      if (hasFirebaseKeys && db) {
        try {
          const snap = await getDocs(collection(db, "board_documents"));
          const remoteItems: BoardDocumentRecord[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as BoardDocumentRecord;
            remoteItems.push({
              ...data,
              id: data.id || docSnap.id,
              status: data.status === "archived" ? "archived" : "active",
            });
          });
          if (remoteItems.length > 0) {
            resolved = mergeByIdNewestWins(localItems, remoteItems);
            writeLocalDocuments(resolved);
          }
        } catch (firestoreErr) {
          console.error("Failed loading board_documents from Firestore:", firestoreErr);
          setError(
            "Unable to sync live Board Repository from Firestore; showing locally cached documents."
          );
        }
      }

      setDocuments(resolved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed loading Board Repository.";
      console.error("Board Repository refresh error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [canAccessBoard, user]);

  useEffect(() => {
    if (!authLoading) {
      void refresh();
    }
    if (typeof window === "undefined") return;

    const handleLocalSync = () => {
      if (canAccessBoard) {
        setDocuments(readLocalDocuments());
      }
    };
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === BOARD_REPO_STORAGE_KEY && canAccessBoard) {
        setDocuments(readLocalDocuments());
      }
    };

    window.addEventListener(BOARD_REPO_SYNC_EVENT, handleLocalSync);
    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener(BOARD_REPO_SYNC_EVENT, handleLocalSync);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [authLoading, canAccessBoard, refresh]);

  const uploadDocument = useCallback(
    async (input: UploadBoardDocumentInput): Promise<BoardDocumentRecord> => {
      if (!canAccessBoard || !user) {
        throw new Error("Only authenticated Board Members may upload materials.");
      }

      const validation = validateBoardUploadFile(input.file);
      if (!validation.valid) {
        const msg = validation.error || "Invalid upload file.";
        setError(msg);
        throw new Error(msg);
      }

      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) {
        const msg = "Please enter a clear document title.";
        setError(msg);
        throw new Error(msg);
      }

      setUploading(true);
      setUploadProgress(5);
      setError(null);

      try {
        const id = generateBoardDocId();
        const nowIso = new Date().toISOString();
        const safeFileName = input.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const cleanNotes = (input.notes || "").trim().slice(0, MAX_BOARD_NOTES_LENGTH);

        const storedLocally = await putBoardBlob(id, input.file);
        setUploadProgress(15);

        let uploadedStoragePath: string | undefined;
        let uploadedStorageUrl: string | undefined;
        let firestoreChunkCount: number | undefined;

        if (hasFirebaseKeys && db) {
          if (storage) {
            try {
              const candidatePath = `board_repository/${id}/${safeFileName}`;
              const fileRef = storageRef(storage, candidatePath);
              const task = uploadBytesResumable(fileRef, input.file, {
                contentType: input.file.type || "application/octet-stream",
              });

              await new Promise<void>((resolve, reject) => {
                task.on(
                  "state_changed",
                  (snapshot) => {
                    const ratio =
                      snapshot.totalBytes > 0
                        ? snapshot.bytesTransferred / snapshot.totalBytes
                        : 0;
                    setUploadProgress(Math.round(15 + ratio * 70));
                  },
                  (uploadErr) => reject(uploadErr),
                  () => resolve()
                );
              });

              uploadedStorageUrl = await getDownloadURL(fileRef);
              uploadedStoragePath = candidatePath;
              setUploadProgress(90);
            } catch (storageErr) {
              console.warn(
                "Firebase Storage unavailable for board upload; switching to chunked Firestore fallback:",
                storageErr
              );
              uploadedStoragePath = undefined;
              uploadedStorageUrl = undefined;
            }
          }

          if (!uploadedStorageUrl) {
            const buffer = await input.file.arrayBuffer();
            const rawBytes = new Uint8Array(buffer);
            const totalChunks = Math.max(1, Math.ceil(rawBytes.length / RAW_CHUNK_BYTES));

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
              const start = chunkIndex * RAW_CHUNK_BYTES;
              const end = Math.min(rawBytes.length, start + RAW_CHUNK_BYTES);
              const chunkPayload: BoardBlobChunkDoc = {
                docId: id,
                chunkIndex,
                base64Data: uint8ArrayToBase64(rawBytes.subarray(start, end)),
              };
              await setDoc(
                doc(db, "board_document_blobs", `${id}_${chunkIndex}`),
                chunkPayload
              );
              setUploadProgress(Math.round(20 + ((chunkIndex + 1) / totalChunks) * 70));
            }
            firestoreChunkCount = totalChunks;
          }
        } else {
          setUploadProgress(90);
        }

        const cleanRecord = stripUndefinedFields({
          id,
          title: trimmedTitle.slice(0, 240),
          category: input.category,
          documentDate: input.documentDate || nowIso.slice(0, 10),
          cycleTag: (input.cycleTag || "Society-Wide").trim().slice(0, 80),
          ...(cleanNotes ? { notes: cleanNotes } : {}),
          fileName: input.file.name.trim().slice(0, 240),
          fileExtension: getFileExtension(input.file.name),
          mimeType: input.file.type || "application/octet-stream",
          fileSizeBytes: input.file.size,
          ...(uploadedStoragePath ? { storagePath: uploadedStoragePath } : {}),
          ...(uploadedStorageUrl ? { storageUrl: uploadedStorageUrl } : {}),
          ...(typeof firestoreChunkCount === "number"
            ? { firestoreChunkCount }
            : {}),
          hasLocalBlob: storedLocally,
          uploadedByUid: user.uid,
          uploadedByEmail: (user.email || "board@hems-workshop.org").toLowerCase(),
          uploadedAt: nowIso,
          updatedAt: nowIso,
          status: "active",
        });

        if (hasFirebaseKeys && db) {
          await setDoc(doc(db, "board_documents", id), cleanRecord);
        }

        const current = readLocalDocuments();
        const next = [cleanRecord, ...current.filter((item) => item.id !== id)];
        writeLocalDocuments(next);
        setDocuments(next);
        setUploadProgress(100);
        return cleanRecord;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed uploading document to Board Repository.";
        console.error("uploadDocument error:", err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setUploading(false);
      }
    },
    [canAccessBoard, user]
  );

  const archiveDocument = useCallback(
    async (docId: string, reason?: string): Promise<void> => {
      if (!canAccessBoard || !user) {
        throw new Error("Only authenticated Board Members may archive materials.");
      }
      if (docId === PINNED_MASTER_LOGO_DOC.id) {
        throw new Error("The pinned official Society emblem master cannot be archived.");
      }

      try {
        const current = readLocalDocuments();
        const existing =
          current.find((item) => item.id === docId) ||
          documents.find((item) => item.id === docId);
        if (!existing) {
          throw new Error("Document could not be found.");
        }

        const nowIso = new Date().toISOString();
        const cleanReason = (reason || "").trim().slice(0, MAX_BOARD_NOTES_LENGTH);
        const updatedRecord = stripUndefinedFields({
          ...existing,
          status: "archived",
          archivedAt: nowIso,
          archivedByEmail: (user.email || "board@hems-workshop.org").toLowerCase(),
          ...(cleanReason ? { archiveReason: cleanReason } : {}),
          updatedAt: nowIso,
        });

        if (hasFirebaseKeys && db) {
          await setDoc(doc(db, "board_documents", docId), updatedRecord);
        }

        const next = current.map((item) => (item.id === docId ? updatedRecord : item));
        writeLocalDocuments(next);
        setDocuments(next);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed archiving Board document.";
        console.error("archiveDocument error:", err);
        setError(msg);
        throw new Error(msg);
      }
    },
    [canAccessBoard, user, documents]
  );

  const restoreDocument = useCallback(
    async (docId: string): Promise<void> => {
      if (!canAccessBoard || !user) {
        throw new Error("Only authenticated Board Members may restore archived materials.");
      }

      try {
        const current = readLocalDocuments();
        const existing =
          current.find((item) => item.id === docId) ||
          documents.find((item) => item.id === docId);
        if (!existing) {
          throw new Error("Archived document could not be found.");
        }

        const nowIso = new Date().toISOString();
        const restoredBase: BoardDocumentRecord = {
          ...existing,
          status: "active",
          updatedAt: nowIso,
        };
        delete restoredBase.archivedAt;
        delete restoredBase.archivedByEmail;
        delete restoredBase.archiveReason;

        const cleanRecord = stripUndefinedFields(restoredBase);

        if (hasFirebaseKeys && db) {
          await setDoc(doc(db, "board_documents", docId), cleanRecord);
        }

        const next = current.map((item) => (item.id === docId ? cleanRecord : item));
        writeLocalDocuments(next);
        setDocuments(next);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed restoring Board document.";
        console.error("restoreDocument error:", err);
        setError(msg);
        throw new Error(msg);
      }
    },
    [canAccessBoard, user, documents]
  );

  const deleteDocument = useCallback(
    async (docId: string): Promise<void> => {
      if (!canAccessBoard || !user) {
        throw new Error("Only authenticated Board Members may delete Board materials.");
      }
      if (docId === PINNED_MASTER_LOGO_DOC.id) {
        throw new Error("The pinned official Society emblem master cannot be deleted.");
      }

      try {
        const current = readLocalDocuments();
        const target =
          current.find((item) => item.id === docId) ||
          documents.find((item) => item.id === docId);

        await deleteBoardBlob(docId);

        if (hasFirebaseKeys && db) {
          if (target?.storagePath && storage) {
            try {
              await deleteObject(storageRef(storage, target.storagePath));
            } catch (storageErr) {
              console.warn("Could not delete Storage object (may already be removed):", storageErr);
            }
          }
          if (target?.firestoreChunkCount && target.firestoreChunkCount > 0) {
            await deleteFirestoreChunks(docId);
          }
          await deleteDoc(doc(db, "board_documents", docId));
        }

        const next = current.filter((item) => item.id !== docId);
        writeLocalDocuments(next);
        setDocuments(next);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed deleting Board document.";
        console.error("deleteDocument error:", err);
        setError(msg);
        throw new Error(msg);
      }
    },
    [canAccessBoard, user, documents]
  );

  const downloadDocument = useCallback(async (record: BoardDocumentRecord): Promise<void> => {
    setError(null);
    try {
      if (record.staticAssetUrl) {
        try {
          const response = await fetch(record.staticAssetUrl);
          if (response.ok) {
            const masterBlob = await response.blob();
            triggerBrowserDownload(masterBlob, record.fileName);
            return;
          }
        } catch (staticErr) {
          console.warn("Static master fetch failed; opening asset URL fallback:", staticErr);
        }
        window.open(record.staticAssetUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const localBlob = await getBoardBlob(record.id);
      if (localBlob) {
        triggerBrowserDownload(localBlob, record.fileName);
        return;
      }

      if (record.storageUrl) {
        try {
          const response = await fetch(record.storageUrl);
          if (response.ok) {
            const fetchedBlob = await response.blob();
            await putBoardBlob(record.id, fetchedBlob);
            triggerBrowserDownload(fetchedBlob, record.fileName);
            return;
          }
        } catch (fetchErr) {
          console.warn("Direct fetch from storageUrl blocked; opening URL fallback:", fetchErr);
        }
        window.open(record.storageUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (
        record.firestoreChunkCount &&
        record.firestoreChunkCount > 0 &&
        hasFirebaseKeys &&
        db
      ) {
        const chunksQuery = query(
          collection(db, "board_document_blobs"),
          where("docId", "==", record.id)
        );
        const snap = await getDocs(chunksQuery);
        if (!snap.empty) {
          const ordered: BoardBlobChunkDoc[] = [];
          snap.forEach((chunkSnap) => {
            ordered.push(chunkSnap.data() as BoardBlobChunkDoc);
          });
          ordered.sort((a, b) => a.chunkIndex - b.chunkIndex);

          const decodedArrays = ordered.map((c) => base64ToUint8Array(c.base64Data));
          const totalLen = decodedArrays.reduce((sum, arr) => sum + arr.length, 0);
          const combined = new Uint8Array(totalLen);
          let cursor = 0;
          for (const arr of decodedArrays) {
            combined.set(arr, cursor);
            cursor += arr.length;
          }

          const reconstructed = new Blob([combined], {
            type: record.mimeType || "application/octet-stream",
          });
          await putBoardBlob(record.id, reconstructed);
          triggerBrowserDownload(reconstructed, record.fileName);
          return;
        }
      }

      if (record.isSampleSeed) {
        const { jsPDF } = await import("jspdf");
        const samplePdf = new jsPDF({ unit: "pt", format: "letter" });
        samplePdf.setFont("times", "bold");
        samplePdf.setFontSize(16);
        samplePdf.text("HEMS Society — Secure Board Repository (Sample File)", 54, 72);
        samplePdf.setFont("helvetica", "normal");
        samplePdf.setFontSize(12);
        samplePdf.text(`Title: ${record.title}`, 54, 108, { maxWidth: 504 });
        samplePdf.text(`Category: ${record.category}   |   Cycle: ${record.cycleTag}`, 54, 140);
        samplePdf.text(`Document Date: ${record.documentDate}`, 54, 162);
        samplePdf.text(
          "This entry is an initial repository placeholder. Use '+ Upload Material' on the Board Member Panel to upload real signed minutes, budgets, or agendas (up to 10 MB).",
          54,
          196,
          { maxWidth: 504 }
        );
        const sampleBlob = samplePdf.output("blob");
        triggerBrowserDownload(sampleBlob, record.fileName);
        return;
      }

      throw new Error(
        "File binary could not be located in cloud storage or this browser's local cache."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed downloading Board document.";
      console.error("downloadDocument error:", err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const activeDocuments = useMemo(
    () => [
      PINNED_MASTER_LOGO_DOC,
      ...documents.filter(
        (d) => d.status !== "archived" && d.id !== PINNED_MASTER_LOGO_DOC.id
      ),
    ],
    [documents]
  );

  const archivedDocuments = useMemo(
    () =>
      documents.filter(
        (d) => d.status === "archived" && d.id !== PINNED_MASTER_LOGO_DOC.id
      ),
    [documents]
  );

  const totalBytesUsed = useMemo(
    () =>
      [
        PINNED_MASTER_LOGO_DOC,
        ...documents.filter((d) => d.id !== PINNED_MASTER_LOGO_DOC.id),
      ].reduce((sum, d) => sum + (Number(d.fileSizeBytes) || 0), 0),
    [documents]
  );

  return {
    documents,
    activeDocuments,
    archivedDocuments,
    totalBytesUsed,
    loading,
    uploading,
    uploadProgress,
    error,
    clearError,
    refresh,
    uploadDocument,
    archiveDocument,
    restoreDocument,
    deleteDocument,
    downloadDocument,
  };
}
