"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, hasFirebaseKeys, storage } from "@/utils/firebase";
import {
  AbstractSubmissionRecord,
  AffiliationEntry,
  AuthorEntry,
  CreateAbstractSubmissionInput,
  GraphicMetadata,
  SaveAbstractReviewInput,
} from "@/types/abstractSubmission";

const LEGACY_SUBMISSIONS_STORAGE_KEY = "hems_abstract_submissions_v1";
const SUBMISSIONS_STORAGE_KEY = "hems_abstract_submissions_v2";
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
    affiliations: [
      { id: "aff-1", institution: "Woods Hole Oceanographic Institution, Woods Hole, MA" },
      { id: "aff-2", institution: "Monterey Bay Aquarium Research Institute, Moss Landing, CA" },
    ],
    authors: [
      { id: "auth-1", name: "Dr. Alice Vance", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "M. Alvarez", affiliationId: "aff-1", isPresenter: false },
      { id: "auth-3", name: "K. Sato", affiliationId: "aff-2", isPresenter: false },
    ],
    presentationFormat: "Oral Presentation",
    researchTrack: "Underwater & Marine Biogeochemistry",
    summary:
      "AUV-integrated membrane-inlet quadrupole calibrated for real-time C₁–C₇ alkane, BTEX, and dissolved CO₂ profiling to 4,000 m depth.",
    abstractText:
      "In-situ geochemical mapping of hydrothermal vents and subseafloor hydrocarbon seeps requires compact mass analyzers capable of continuous dissolved-gas quantification at 40 MPa hydrostatic head. We present a 14 W triple-filter hyperbolic quadrupole mass spectrometer (m/z 2–200, Δm = 0.6 Da at FWHM) coupled behind a reinforced 25 μm polydimethylsiloxane (PDMS) capillary membrane inlet heated to 45 °C.\n\nBy stabilizing source electron emission at 70 eV and regulating foreline pressure to 1.4 × 10⁻⁶ Torr via a Ti-housing turbomolecular drag stage, permeation response times (τ₉₀) dropped below 18 s for CH₄, C₂H₆, benzene, and toluene. Across 42 hours of autonomous seabed deployment in the Guaymas Basin, calibrated sensitivity reached 1.2 nmol·L⁻¹ for dissolved CO₂ and H₂S while resolving isotopic methane ratios δ¹³C-CH₄ within ±1.8‰.",
    studentTravelAwardApplicant: false,
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
    affiliations: [
      { id: "aff-1", institution: "Scripps Institution of Oceanography, UC San Diego, La Jolla, CA" },
      { id: "aff-2", institution: "University of Colorado Boulder, INSTAAR, Boulder, CO" },
    ],
    authors: [
      { id: "auth-1", name: "Prof. Robert Chen", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "J. Nguyen", affiliationId: "aff-1", isPresenter: false },
      { id: "auth-3", name: "L. Park", affiliationId: "aff-2", isPresenter: false },
    ],
    presentationFormat: "Oral Presentation",
    researchTrack: "Atmospheric, Volcanic & Environmental",
    summary:
      "Cold-tolerant PDMS membrane pre-concentrators coupled with a 12 W cylindrical ion trap MS during polar firn air field campaigns.",
    abstractText:
      "Quantifying volatile organic halocarbons and biogenic sulfur species in polar firn air at -35 °C demands sub-pptv detection limits without liquid cryogens or bulky cylinder banks. We fabricated a 4-channel micro-machined cylindrical ion trap array (r₀ = 2.5 mm) integrated with a dual-bed Carboxen/PDMS thermal desorption trap consuming ≤12 W average power.\n\nFollowing the Mathieu stability criterion $q_z = \\frac{4eV}{m r_0^2 \\Omega^2}$ at Ω/2π = 1.45 MHz, resonance ejection scans achieved unit mass resolution through m/z 310 with duty cycles exceeding 65%. Field deployment at Summit Station demonstrated linear calibration (R² = 0.998) across 5–500 pptv for DMS, CH₃Br, and trichlorofluoromethane, maintaining <3.2% RSD across ambient pressure swings.",
    studentTravelAwardApplicant: false,
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
    affiliations: [
      { id: "aff-1", institution: "NASA Jet Propulsion Laboratory / Caltech, Pasadena, CA" },
    ],
    authors: [
      { id: "auth-1", name: "Elena Rostova", affiliationId: "aff-1", isPresenter: true },
      { id: "auth-2", name: "D. Patel", affiliationId: "aff-1", isPresenter: false },
    ],
    presentationFormat: "Poster Presentation",
    researchTrack: "Planetary & Spaceflight MS",
    summary:
      "Dual-stage reflectron mass resolution vs. cryogenic gas load constraints for hypervelocity ice-grain sampling on Enceladus.",
    abstractText:
      "Hypervelocity flybys (3–6 km·s⁻¹) through icy moon plumes generate transient impact ionization bursts characterized by wide axial energy spreads (ΔE ≥ 35 eV) alongside high H₂O vapor densities. Using SIMION 8.2 Monte Carlo ray tracing and laboratory laser-desorption analogs, we optimized a compact dual-stage gridless reflectron ToF analyzer with a total flight path L = 240 mm.\n\nUnder the kinetic time-focusing relation $\\frac{m}{z} = \\frac{2Vt^2}{L^2}$, second-order energy compensation preserved mass resolving power m/Δm > 2,400 across m/z 18–500 (including protonated amino-acid clusters [M+H]⁺) even when chamber background pressure spiked momentarily to 2.1 × 10⁻⁵ Torr. Vibration qualification to 18 g_rms confirmed <0.4 mDa mass-scale drift without active thermal stabilization.",
    studentTravelAwardApplicant: true,
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
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return sortNewestFirst(parsed as AbstractSubmissionRecord[]);
      }
    }

    // Migrate non-seed user submissions from v1 if present
    const legacyRaw = window.localStorage.getItem(LEGACY_SUBMISSIONS_STORAGE_KEY);
    let initialRecords = INITIAL_SAMPLE_SUBMISSIONS;
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as unknown;
      if (Array.isArray(legacyParsed)) {
        const userCreated = (legacyParsed as AbstractSubmissionRecord[]).filter(
          (item) => item && !item.isSampleSeed
        );
        if (userCreated.length > 0) {
          initialRecords = sortNewestFirst([...userCreated, ...INITIAL_SAMPLE_SUBMISSIONS]);
        }
      }
    }

    window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(initialRecords));
    return initialRecords;
  } catch (err) {
    console.warn("Failed to parse local abstract submissions:", err);
    return INITIAL_SAMPLE_SUBMISSIONS;
  }
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
        graphic: remote.graphic
          ? {
              ...remote.graphic,
              hasLocalBlob:
                remote.graphic.hasLocalBlob ?? existing.graphic?.hasLocalBlob,
            }
          : existing.graphic,
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

function deriveLegacyAuthorFields(
  authors: AuthorEntry[],
  affiliations: AffiliationEntry[]
): {
  presentingAuthor: string;
  affiliation: string;
  coAuthors: string;
} {
  const affLookup = new Map(affiliations.map((a) => [a.id, a.institution.trim()]));
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

  const primaryAff =
    (primaryPresenter && affLookup.get(primaryPresenter.affiliationId)) ||
    affiliations.find((a) => a.institution.trim().length > 0)?.institution.trim() ||
    "";

  return {
    presentingAuthor: presenterNames,
    affiliation: primaryAff,
    coAuthors: coAuthorNames,
  };
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
      assets?: SubmissionUploadAssets
    ): Promise<AbstractSubmissionRecord> => {
      try {
        const current = readLocalSubmissions();
        const id = generateSubmissionId(input.workshopYear, current);
        const nowIso = new Date().toISOString();

        const cleanAffiliations = input.affiliations
          .map((a) => ({ id: a.id, institution: a.institution.trim() }))
          .filter((a) => a.institution.length > 0);
        const cleanAuthors = input.authors
          .map((a) => ({
            id: a.id,
            name: a.name.trim(),
            affiliationId: a.affiliationId,
            isPresenter: a.isPresenter,
          }))
          .filter((a) => a.name.length > 0);

        const derived = deriveLegacyAuthorFields(cleanAuthors, cleanAffiliations);

        // Optional PDF storage
        let pdfStorageUrl: string | undefined;
        let storedPdfLocally = false;
        if (assets?.pdfFile) {
          storedPdfLocally = await putBlob(id, assets.pdfFile);
          if (hasFirebaseKeys && storage) {
            try {
              const safeName = assets.pdfFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
              const objectRef = storageRef(
                storage,
                `abstracts/${input.workshopYear}/${id}/${safeName}`
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
        }

        // Optional 300-DPI graphic storage
        let graphicRecord: GraphicMetadata | undefined;
        if (assets?.graphicFile && assets.graphicMeta) {
          const storedGraphicLocally = await putBlob(
            graphicBlobKey(id),
            assets.graphicFile
          );
          let graphicStorageUrl: string | undefined;
          if (hasFirebaseKeys && storage) {
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
                "Firebase Storage graphic upload skipped/blocked; using IndexedDB cache:",
                storageErr
              );
            }
          }

          graphicRecord = {
            ...assets.graphicMeta,
            ...(input.graphicCaption?.trim()
              ? { caption: input.graphicCaption.trim() }
              : {}),
            ...(graphicStorageUrl ? { storageUrl: graphicStorageUrl } : {}),
            hasLocalBlob: storedGraphicLocally,
          };
        }

        const record: AbstractSubmissionRecord = {
          id,
          workshopYear: input.workshopYear,
          title: input.title.trim(),
          presentingAuthor: (input.presentingAuthor || derived.presentingAuthor).trim(),
          correspondingEmail: input.correspondingEmail.trim(),
          affiliation: (input.affiliation || derived.affiliation).trim(),
          coAuthors: (input.coAuthors ?? derived.coAuthors).trim(),
          affiliations: cleanAffiliations,
          authors: cleanAuthors,
          presentationFormat: input.presentationFormat,
          researchTrack: input.researchTrack,
          summary: input.summary.trim(),
          abstractText: input.abstractText.trim(),
          ...(graphicRecord ? { graphic: graphicRecord } : {}),
          studentTravelAwardApplicant: input.studentTravelAwardApplicant,
          ...(assets?.pdfFile
            ? {
                fileName: assets.pdfFile.name,
                fileSizeBytes: assets.pdfFile.size,
                fileMimeType: assets.pdfFile.type || "application/pdf",
                ...(pdfStorageUrl ? { fileStorageUrl: pdfStorageUrl } : {}),
                hasLocalFileBlob: storedPdfLocally,
              }
            : {}),
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
      await deleteBlob(id);
      await deleteBlob(graphicBlobKey(id));
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
        return null;
      } catch (err) {
        console.warn("Unable to resolve graphic preview URL:", err);
        return null;
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

  return {
    submissions,
    loading,
    error,
    refresh,
    createSubmission,
    saveReview,
    withdrawSubmission,
    getGraphicPreviewUrl,
    openSubmissionPdf,
  };
}
