"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, hasFirebaseKeys, storage } from "@/utils/firebase";
import {
  AbstractSubmissionRecord,
  CreateAbstractSubmissionInput,
  SaveAbstractReviewInput,
} from "@/types/abstractSubmission";

const SUBMISSIONS_STORAGE_KEY = "hems_abstract_submissions_v1";
const SUBMISSIONS_SYNC_EVENT = "hems-abstracts-updated";
const IDB_NAME = "hems_abstract_files_idb";
const IDB_VERSION = 1;
const IDB_STORE = "abstract_pdfs";

const INITIAL_SAMPLE_SUBMISSIONS: AbstractSubmissionRecord[] = [
  {
    id: "ABS-2027-001",
    workshopYear: 2027,
    title: "A Miniature Quadrupole Mass Filter for Deep-Ocean Hydrocarbon & Hydrothermal Plume Mapping",
    presentingAuthor: "Dr. Alice Vance",
    correspondingEmail: "avance@whoi.example.org",
    affiliation: "Woods Hole Oceanographic Institution",
    coAuthors: "M. Alvarez, K. Sato",
    presentationFormat: "Oral Presentation",
    researchTrack: "Underwater & Marine Biogeochemistry",
    summary:
      "Demonstrates an AUV-integrated membrane-inlet quadrupole system calibrated for real-time C1-C7 alkane, cycloalkane, BTEX, and dissolved CO2 profiling down to 4,000 m depth.",
    studentTravelAwardApplicant: false,
    fileName: "HEMS_Abstract_Vance_Alice.pdf",
    fileSizeBytes: 0,
    fileMimeType: "application/pdf",
    submittedByUid: "sample-001",
    submittedByEmail: "avance@whoi.example.org",
    submittedAt: "2026-10-14T16:20:00.000Z",
    updatedAt: "2026-10-14T16:20:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Pending",
    decision: "Pending",
    isSampleSeed: true,
  },
  {
    id: "ABS-2027-002",
    workshopYear: 2027,
    title: "Atmospheric Pre-Concentration of Trace VOCs in Polar Firn Air Using Cylindrical Ion Trap Arrays",
    presentingAuthor: "Prof. Robert Chen",
    correspondingEmail: "rchen@ucsd.example.edu",
    affiliation: "Scripps Institution of Oceanography, UC San Diego",
    coAuthors: "J. Nguyen, L. Park",
    presentationFormat: "Oral Presentation",
    researchTrack: "Atmospheric, Volcanic & Environmental",
    summary:
      "Evaluates cold-tolerant PDMS membrane pre-concentrators coupled with a compact 12 W cylindrical ion trap mass spectrometer during polar field campaigns.",
    studentTravelAwardApplicant: false,
    fileName: "HEMS_Abstract_Chen_Robert.pdf",
    fileSizeBytes: 0,
    fileMimeType: "application/pdf",
    submittedByUid: "sample-002",
    submittedByEmail: "rchen@ucsd.example.edu",
    submittedAt: "2026-10-19T11:05:00.000Z",
    updatedAt: "2026-10-22T14:40:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Reviewed",
    decision: "Accept (Oral)",
    score: 8.5,
    reviewerComments: "Strong field validation dataset under sub-zero operating conditions.",
    reviewedBy: "reviewer@hems-workshop.org",
    reviewedAt: "2026-10-22T14:40:00.000Z",
    isSampleSeed: true,
  },
  {
    id: "ABS-2027-003",
    workshopYear: 2027,
    title: "Linearized Time-of-Flight Ion Optics Refinements for Ocean-World Plume Flyby Landers",
    presentingAuthor: "Elena Rostova",
    correspondingEmail: "erostova@jpl.example.gov",
    affiliation: "NASA Jet Propulsion Laboratory / Caltech",
    coAuthors: "D. Patel",
    presentationFormat: "Poster Presentation",
    researchTrack: "Planetary & Spaceflight MS",
    summary:
      "Compares dual-stage reflectron mass resolution against cryogenic gas load constraints for hypervelocity ice-grain sampling on Enceladus and Europa missions.",
    studentTravelAwardApplicant: true,
    fileName: "HEMS_Abstract_Rostova_Elena.pdf",
    fileSizeBytes: 0,
    fileMimeType: "application/pdf",
    submittedByUid: "sample-003",
    submittedByEmail: "erostova@jpl.example.gov",
    submittedAt: "2026-10-28T09:15:00.000Z",
    updatedAt: "2026-10-28T09:15:00.000Z",
    deadline: "August 2027 (TBD)",
    status: "Pending",
    decision: "Pending",
    isSampleSeed: true,
  },
];

function openPdfDatabase(): Promise<IDBDatabase> {
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

async function putPdfBlob(id: string, file: Blob): Promise<boolean> {
  try {
    const database = await openPdfDatabase();
    return await new Promise<boolean>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put(file, id);
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
    console.warn("Unable to cache abstract PDF in IndexedDB:", err);
    return false;
  }
}

async function getPdfBlob(id: string): Promise<Blob | null> {
  try {
    const database = await openPdfDatabase();
    return await new Promise<Blob | null>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(id);
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
    console.warn("Unable to read abstract PDF from IndexedDB:", err);
    return null;
  }
}

async function deletePdfBlob(id: string): Promise<void> {
  try {
    const database = await openPdfDatabase();
    await new Promise<void>((resolve) => {
      const tx = database.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(id);
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
    console.warn("Unable to delete abstract PDF from IndexedDB:", err);
  }
}

function sortNewestFirst(items: AbstractSubmissionRecord[]): AbstractSubmissionRecord[] {
  return [...items].sort((a, b) => {
    const tA = Date.parse(a.submittedAt || "") || 0;
    const tB = Date.parse(b.submittedAt || "") || 0;
    return tB - tA;
  });
}

function readLocalSubmissions(): AbstractSubmissionRecord[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_SUBMISSIONS;
  try {
    const raw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        SUBMISSIONS_STORAGE_KEY,
        JSON.stringify(INITIAL_SAMPLE_SUBMISSIONS)
      );
      return INITIAL_SAMPLE_SUBMISSIONS;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return sortNewestFirst(parsed as AbstractSubmissionRecord[]);
    }
  } catch (err) {
    console.warn("Failed to parse local abstract submissions:", err);
  }
  return INITIAL_SAMPLE_SUBMISSIONS;
}

function writeLocalSubmissions(records: AbstractSubmissionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(SUBMISSIONS_SYNC_EVENT));
  } catch (err) {
    console.warn("Failed to write abstract submissions to localStorage:", err);
  }
}

function mergeByIdNewestWins(
  localItems: AbstractSubmissionRecord[],
  remoteItems: AbstractSubmissionRecord[]
): AbstractSubmissionRecord[] {
  const byId = new Map<string, AbstractSubmissionRecord>();
  for (const item of localItems) {
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
    if (remoteTs >= existingTs) {
      byId.set(remote.id, {
        ...remote,
        hasLocalFileBlob: remote.hasLocalFileBlob ?? existing.hasLocalFileBlob,
      });
    }
  }
  return sortNewestFirst(Array.from(byId.values()));
}

function generateSubmissionId(
  workshopYear: number,
  existing: AbstractSubmissionRecord[]
): string {
  const prefix = `ABS-${workshopYear}-`;
  let maxSeq = 0;
  for (const item of existing) {
    if (item.id.startsWith(prefix)) {
      const tail = Number.parseInt(item.id.slice(prefix.length), 10);
      if (!Number.isNaN(tail) && tail > maxSeq) {
        maxSeq = tail;
      }
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}

export function useAbstractSubmissions() {
  const [submissions, setSubmissions] = useState<AbstractSubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localItems = readLocalSubmissions();
      if (hasFirebaseKeys && db) {
        try {
          const snap = await getDocs(collection(db, "abstract_submissions"));
          const remoteItems: AbstractSubmissionRecord[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as AbstractSubmissionRecord;
            remoteItems.push({ ...data, id: data.id || docSnap.id });
          });
          const merged = mergeByIdNewestWins(localItems, remoteItems);
          setSubmissions(merged);
          if (remoteItems.length > 0 && typeof window !== "undefined") {
            window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged));
          }
          return;
        } catch (firestoreErr) {
          console.warn(
            "Firestore abstract_submissions unavailable or gated; using local cache:",
            firestoreErr
          );
        }
      }
      setSubmissions(localItems);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load abstract submissions.";
      console.error("Error loading abstract submissions:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (typeof window === "undefined") return;

    const handleSync = () => {
      setSubmissions(readLocalSubmissions());
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SUBMISSIONS_STORAGE_KEY) {
        handleSync();
      }
    };

    window.addEventListener(SUBMISSIONS_SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SUBMISSIONS_SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  const createSubmission = useCallback(
    async (
      input: CreateAbstractSubmissionInput,
      pdfFile: File
    ): Promise<AbstractSubmissionRecord> => {
      try {
        const current = readLocalSubmissions();
        const id = generateSubmissionId(input.workshopYear, current);
        const nowIso = new Date().toISOString();
        const storedLocally = await putPdfBlob(id, pdfFile);

        let fileStorageUrl: string | undefined;
        if (hasFirebaseKeys && storage) {
          try {
            const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
            const objectRef = storageRef(
              storage,
              `abstracts/${input.workshopYear}/${id}/${safeName}`
            );
            await uploadBytes(objectRef, pdfFile, {
              contentType: pdfFile.type || "application/pdf",
            });
            fileStorageUrl = await getDownloadURL(objectRef);
          } catch (storageErr) {
            console.warn(
              "Firebase Storage upload skipped/blocked; using IndexedDB local cache:",
              storageErr
            );
          }
        }

        const record: AbstractSubmissionRecord = {
          id,
          workshopYear: input.workshopYear,
          title: input.title.trim(),
          presentingAuthor: input.presentingAuthor.trim(),
          correspondingEmail: input.correspondingEmail.trim(),
          affiliation: input.affiliation.trim(),
          coAuthors: input.coAuthors.trim(),
          presentationFormat: input.presentationFormat,
          researchTrack: input.researchTrack,
          summary: input.summary.trim(),
          studentTravelAwardApplicant: input.studentTravelAwardApplicant,
          fileName: pdfFile.name,
          fileSizeBytes: pdfFile.size,
          fileMimeType: pdfFile.type || "application/pdf",
          ...(fileStorageUrl ? { fileStorageUrl } : {}),
          hasLocalFileBlob: storedLocally,
          submittedByUid: input.submittedByUid,
          submittedByEmail: input.submittedByEmail,
          submittedAt: nowIso,
          updatedAt: nowIso,
          deadline: input.deadline,
          status: "Pending",
          decision: "Pending",
        };

        if (hasFirebaseKeys && db) {
          try {
            await setDoc(doc(db, "abstract_submissions", id), record);
          } catch (firestoreErr) {
            console.warn(
              "Firestore abstract_submissions write skipped/blocked; persisted locally:",
              firestoreErr
            );
          }
        }

        const next = sortNewestFirst([record, ...current]);
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
    []
  );

  const saveReview = useCallback(async (input: SaveAbstractReviewInput): Promise<void> => {
    try {
      const nowIso = new Date().toISOString();
      const current = readLocalSubmissions();
      const target = current.find((item) => item.id === input.id);
      if (!target) {
        throw new Error(`Abstract submission ${input.id} not found.`);
      }

      const updatedRecord: AbstractSubmissionRecord = {
        ...target,
        status: "Reviewed",
        score: input.score,
        decision: input.decision,
        reviewerComments: input.reviewerComments.trim(),
        reviewedBy: input.reviewedBy,
        reviewedAt: nowIso,
        updatedAt: nowIso,
      };

      if (hasFirebaseKeys && db) {
        try {
          await setDoc(doc(db, "abstract_submissions", input.id), updatedRecord, {
            merge: true,
          });
        } catch (firestoreErr) {
          console.warn(
            "Firestore abstract review write skipped/blocked; persisted locally:",
            firestoreErr
          );
        }
      }

      const next = sortNewestFirst(
        current.map((item) => (item.id === input.id ? updatedRecord : item))
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

  const withdrawSubmission = useCallback(async (id: string): Promise<void> => {
    try {
      await deletePdfBlob(id);
      if (hasFirebaseKeys && db) {
        try {
          await deleteDoc(doc(db, "abstract_submissions", id));
        } catch (firestoreErr) {
          console.warn("Firestore abstract deletion skipped/blocked:", firestoreErr);
        }
      }
      const next = readLocalSubmissions().filter((item) => item.id !== id);
      writeLocalSubmissions(next);
      setSubmissions(next);
    } catch (err) {
      console.error("Failed to withdraw abstract submission:", err);
      throw err instanceof Error
        ? err
        : new Error("Unexpected error while withdrawing submission.");
    }
  }, []);

  const openSubmissionPdf = useCallback(
    async (
      sub: AbstractSubmissionRecord
    ): Promise<{ ok: boolean; reason?: string }> => {
      try {
        if (sub.fileStorageUrl) {
          window.open(sub.fileStorageUrl, "_blank", "noopener,noreferrer");
          return { ok: true };
        }
        const blob = await getPdfBlob(sub.id);
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          window.open(objectUrl, "_blank", "noopener,noreferrer");
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          return { ok: true };
        }
        if (sub.isSampleSeed) {
          return {
            ok: false,
            reason:
              "Sample placeholder entry — upload an abstract from /abstract-submission to inspect a live attached PDF.",
          };
        }
        return {
          ok: false,
          reason:
            "PDF file is stored on the submitter's browser cache until cloud storage rules are deployed.",
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

  return {
    submissions,
    loading,
    error,
    refresh,
    createSubmission,
    saveReview,
    withdrawSubmission,
    openSubmissionPdf,
  };
}
