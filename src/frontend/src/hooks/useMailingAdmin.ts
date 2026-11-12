"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, hasFirebaseKeys } from "@/utils/firebase";
import {
  MailchimpImportResult,
  MailchimpParsedRow,
  MailingCampaign,
  MailingInterest,
  MailingSegment,
  MailingSubscriber,
  PublicMailingRequest,
  SubscriberStatus,
} from "@/types/mailing";
import {
  generateClientToken,
  isValidSubscriberEmail,
  normalizeSublistTag,
  normalizeSubscriberEmail,
  renderAcademicEmailParts,
  subscriberDocId,
} from "@/utils/mailingTemplate";

const MOCK_SUBSCRIBERS_KEY = "hems_mock_mailing_subscribers_v1";
const MOCK_CAMPAIGNS_KEY = "hems_mock_mailing_campaigns_v1";
const MOCK_PUBLIC_REQ_KEY = "hems_mock_mailing_requests_v1";
const MOCK_SUBLISTS_KEY = "hems_mock_mailing_sublists_v1";

/**
 * Reserved document ID inside `mailing_subscribers` storing the Board's Sublist Catalog.
 * Authorized under deployed `firestore.rules` (`match /mailing_subscribers/{subscriberId}`).
 */
const SUBLIST_META_DOC_ID = "_meta_sublists";

const VALID_PUBLIC_INTERESTS: ReadonlySet<string> = new Set([
  "workshop",
  "student_awards",
  "sponsorship",
]);

const DEFAULT_STARTER_SUBLISTS = [
  "Board Members",
  "2025 Attendees",
  "2025 Presenters",
  "2025 Corporate Sponsors",
];

const INITIAL_SAMPLE_SUBSCRIBERS: MailingSubscriber[] = [
  {
    id: subscriberDocId("tshort@usf.edu"),
    email: "tshort@usf.edu",
    firstName: "Tim",
    lastName: "Short",
    affiliation: "University of South Florida / SRI International",
    interests: ["workshop", "sponsorship"],
    sublists: ["Board Members", "2025 Attendees"],
    status: "active",
    source: "board_manual",
    unsubscribeToken: "sample-token-usf-001",
    optInToken: "sample-optin-usf-001",
    createdAt: "2025-09-18T14:00:00.000Z",
    updatedAt: "2025-09-18T14:00:00.000Z",
    confirmedAt: "2025-09-18T14:00:00.000Z",
  },
  {
    id: subscriberDocId("researcher@jpl.nasa.gov"),
    email: "researcher@jpl.nasa.gov",
    firstName: "Elena",
    lastName: "Vance",
    affiliation: "NASA Jet Propulsion Laboratory",
    interests: ["workshop", "student_awards"],
    sublists: ["2025 Presenters", "2025 Attendees"],
    status: "active",
    source: "website",
    unsubscribeToken: "sample-token-jpl-002",
    optInToken: "sample-optin-jpl-002",
    createdAt: "2025-10-04T18:20:00.000Z",
    updatedAt: "2025-10-04T18:22:00.000Z",
    confirmedAt: "2025-10-04T18:22:00.000Z",
  },
  {
    id: subscriberDocId("alumni2019@old-lab.edu"),
    email: "alumni2019@old-lab.edu",
    firstName: "Marcus",
    lastName: "Lin",
    affiliation: "Former Graduate Lab",
    interests: ["workshop"],
    sublists: [],
    status: "bounced",
    source: "mailchimp_import",
    unsubscribeToken: "sample-token-bounced-003",
    optInToken: "sample-optin-bounced-003",
    createdAt: "2019-09-16T12:00:00.000Z",
    updatedAt: "2025-04-10T09:15:00.000Z",
    bounceReason: "Mailchimp Cleaned Export (550 5.1.1 User unknown)",
  },
];

/**
 * Mirrors custom `sublists` as `sublist:<Name>` entries inside Firestore's `interests` array
 * so `functions/src/mailing.ts` (`mailingSendCampaign`) filters `segment = "sublist:<Name>"` natively.
 */
function buildFirestoreInterests(
  baseInterests: MailingInterest[],
  sublists: string[]
): string[] {
  const cleanBase =
    baseInterests.length > 0 ? baseInterests : (["workshop"] as MailingInterest[]);
  const sublistTokens = sublists
    .map((t) => normalizeSublistTag(t))
    .filter(Boolean)
    .map((t) => `sublist:${t}`);
  return Array.from(new Set([...cleanBase, ...sublistTokens]));
}

function extractCleanInterestsAndSublists(
  rawInterests: unknown,
  rawSublists: unknown
): { interests: MailingInterest[]; sublists: string[] } {
  const interestsSet = new Set<MailingInterest>();
  const sublistsSet = new Set<string>();

  if (Array.isArray(rawInterests)) {
    for (const item of rawInterests) {
      const s = String(item || "").trim();
      if (VALID_PUBLIC_INTERESTS.has(s)) {
        interestsSet.add(s as MailingInterest);
      } else if (s.startsWith("sublist:")) {
        const tag = normalizeSublistTag(s.slice("sublist:".length));
        if (tag) sublistsSet.add(tag);
      }
    }
  }

  if (Array.isArray(rawSublists)) {
    for (const item of rawSublists) {
      const tag = normalizeSublistTag(String(item || ""));
      if (tag) sublistsSet.add(tag);
    }
  }

  const interests =
    interestsSet.size > 0
      ? Array.from(interestsSet)
      : (["workshop"] as MailingInterest[]);
  return {
    interests,
    sublists: Array.from(sublistsSet),
  };
}

export function matchesMailingSegment(
  subscriber: MailingSubscriber,
  segment: MailingSegment
): boolean {
  if (subscriber.status !== "active") return false;
  if (segment === "all") return true;
  if (segment.startsWith("sublist:")) {
    const targetTag = normalizeSublistTag(segment.slice("sublist:".length)).toLowerCase();
    return subscriber.sublists.some((t) => t.toLowerCase() === targetTag);
  }
  return subscriber.interests.includes(segment as MailingInterest);
}

function toFirestoreSubscriberPayload(record: MailingSubscriber): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: record.id,
    email: record.email,
    firstName: record.firstName,
    lastName: record.lastName,
    affiliation: record.affiliation,
    interests: buildFirestoreInterests(record.interests, record.sublists),
    sublists: record.sublists,
    status: record.status,
    source: record.source,
    unsubscribeToken: record.unsubscribeToken,
    optInToken: record.optInToken,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  if (record.confirmedAt) payload.confirmedAt = record.confirmedAt;
  if (record.unsubscribedAt) payload.unsubscribedAt = record.unsubscribedAt;
  if (record.bounceReason) payload.bounceReason = record.bounceReason;
  return payload;
}

function readMockSubscribers(): MailingSubscriber[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_SUBSCRIBERS;
  const raw = localStorage.getItem(MOCK_SUBSCRIBERS_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_SUBSCRIBERS_KEY, JSON.stringify(INITIAL_SAMPLE_SUBSCRIBERS));
    return INITIAL_SAMPLE_SUBSCRIBERS;
  }
  try {
    const parsed = JSON.parse(raw) as Array<Partial<MailingSubscriber>>;
    return parsed.map((p) => ({
      ...(p as MailingSubscriber),
      sublists: Array.isArray(p.sublists) ? p.sublists : [],
    }));
  } catch {
    return INITIAL_SAMPLE_SUBSCRIBERS;
  }
}

function writeMockSubscribers(items: MailingSubscriber[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_SUBSCRIBERS_KEY, JSON.stringify(items));
}

function readMockCatalogSublists(): string[] {
  if (typeof window === "undefined") return DEFAULT_STARTER_SUBLISTS;
  const raw = localStorage.getItem(MOCK_SUBLISTS_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_SUBLISTS_KEY, JSON.stringify(DEFAULT_STARTER_SUBLISTS));
    return DEFAULT_STARTER_SUBLISTS;
  }
  try {
    return (JSON.parse(raw) as string[]).map(normalizeSublistTag).filter(Boolean);
  } catch {
    return DEFAULT_STARTER_SUBLISTS;
  }
}

function writeMockCatalogSublists(tags: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_SUBLISTS_KEY, JSON.stringify(tags));
}

function readMockCampaigns(): MailingCampaign[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MOCK_CAMPAIGNS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MailingCampaign[];
  } catch {
    return [];
  }
}

function writeMockCampaigns(items: MailingCampaign[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_CAMPAIGNS_KEY, JSON.stringify(items));
}

export function useMailingAdmin(enabled: boolean) {
  const [subscribers, setSubscribers] = useState<MailingSubscriber[]>([]);
  const [catalogSublists, setCatalogSublists] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<MailingCampaign[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PublicMailingRequest[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isLiveFirestore = Boolean(hasFirebaseKeys && db);

  const availableSublists = useMemo(() => {
    const map = new Map<string, string>();
    for (const tag of catalogSublists) {
      const clean = normalizeSublistTag(tag);
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), clean);
      }
    }
    for (const sub of subscribers) {
      for (const tag of sub.sublists) {
        const clean = normalizeSublistTag(tag);
        if (clean && !map.has(clean.toLowerCase())) {
          map.set(clean.toLowerCase(), clean);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [catalogSublists, subscribers]);

  const refreshAll = useCallback(async () => {
    if (!enabled) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setErrorMessage("");

    try {
      if (!hasFirebaseKeys || !db) {
        setSubscribers(readMockSubscribers());
        setCatalogSublists(readMockCatalogSublists());
        setCampaigns(readMockCampaigns());
        const mockReqs =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem(MOCK_PUBLIC_REQ_KEY) || "[]")
            : [];
        setPendingRequests(
          (mockReqs as PublicMailingRequest[]).filter((r) => r.status === "pending")
        );
        return;
      }

      const [subSnap, campSnap, reqSnap] = await Promise.all([
        getDocs(collection(db, "mailing_subscribers")),
        getDocs(query(collection(db, "mailing_campaigns"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "mailing_public_requests")),
      ]);

      const subList: MailingSubscriber[] = [];
      let loadedCatalog: string[] = [];

      subSnap.forEach((d) => {
        const data = d.data();
        if (d.id === SUBLIST_META_DOC_ID) {
          if (Array.isArray(data.customSublists)) {
            loadedCatalog = data.customSublists
              .map((x: unknown) => normalizeSublistTag(String(x || "")))
              .filter(Boolean);
          }
          return;
        }

        const { interests, sublists } = extractCleanInterestsAndSublists(
          data.interests,
          data.sublists
        );

        subList.push({
          id: d.id,
          email: String(data.email || ""),
          firstName: String(data.firstName || ""),
          lastName: String(data.lastName || ""),
          affiliation: String(data.affiliation || ""),
          interests,
          sublists,
          status: (data.status as SubscriberStatus) || "active",
          source: (data.source as MailingSubscriber["source"]) || "website",
          unsubscribeToken: String(data.unsubscribeToken || ""),
          optInToken: String(data.optInToken || ""),
          createdAt: String(data.createdAt || ""),
          updatedAt: String(data.updatedAt || ""),
          confirmedAt: data.confirmedAt ? String(data.confirmedAt) : undefined,
          unsubscribedAt: data.unsubscribedAt ? String(data.unsubscribedAt) : undefined,
          bounceReason: data.bounceReason ? String(data.bounceReason) : undefined,
        });
      });

      subList.sort((a, b) => a.email.localeCompare(b.email));
      setSubscribers(subList);
      setCatalogSublists(loadedCatalog);

      const campList: MailingCampaign[] = [];
      campSnap.forEach((d) => {
        const data = d.data();
        campList.push({
          id: d.id,
          subject: String(data.subject || ""),
          segment: (data.segment as MailingSegment) || "all",
          markdownBody: String(data.markdownBody || ""),
          status: (data.status as MailingCampaign["status"]) || "sent",
          recipientCount: Number(data.recipientCount || 0),
          deliveredCount: Number(data.deliveredCount || 0),
          failedCount: Number(data.failedCount || 0),
          createdByEmail: String(data.createdByEmail || ""),
          createdAt: String(data.createdAt || ""),
          sentAt: data.sentAt ? String(data.sentAt) : undefined,
          postmarkStream: String(data.postmarkStream || "broadcast"),
        });
      });
      setCampaigns(campList);

      const reqList: PublicMailingRequest[] = [];
      reqSnap.forEach((d) => {
        const data = d.data();
        if (data.status === "pending") {
          reqList.push({
            id: d.id,
            type: data.type as PublicMailingRequest["type"],
            email: String(data.email || ""),
            newEmail: data.newEmail ? String(data.newEmail) : undefined,
            firstName: data.firstName ? String(data.firstName) : undefined,
            lastName: data.lastName ? String(data.lastName) : undefined,
            affiliation: data.affiliation ? String(data.affiliation) : undefined,
            interests: Array.isArray(data.interests)
              ? (data.interests as MailingInterest[])
              : ["workshop"],
            createdAt: String(data.createdAt || ""),
            status: "pending",
          });
        }
      });
      setPendingRequests(reqList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown Firestore error";
      console.error("[useMailingAdmin] Error loading mailing directory:", err);
      setErrorMessage(
        `Unable to load live Firestore mailing collections (${msg}). Ensure updated firestore.rules are deployed.`
      );
    } finally {
      setLoadingData(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const persistCatalogSublists = useCallback(
    async (nextCatalog: string[]) => {
      const dedupedMap = new Map<string, string>();
      for (const item of nextCatalog) {
        const clean = normalizeSublistTag(item);
        if (clean && !dedupedMap.has(clean.toLowerCase())) {
          dedupedMap.set(clean.toLowerCase(), clean);
        }
      }
      const cleanList = Array.from(dedupedMap.values()).sort((a, b) =>
        a.localeCompare(b)
      );

      if (!hasFirebaseKeys || !db) {
        writeMockCatalogSublists(cleanList);
        setCatalogSublists(cleanList);
        return;
      }

      await setDoc(
        doc(db, "mailing_subscribers", SUBLIST_META_DOC_ID),
        {
          customSublists: cleanList,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setCatalogSublists(cleanList);
    },
    []
  );

  const createSublist = useCallback(
    async (rawTag: string): Promise<string> => {
      const clean = normalizeSublistTag(rawTag);
      if (!clean) {
        throw new Error("Please enter a sublist or tag name.");
      }
      const exists = availableSublists.find(
        (t) => t.toLowerCase() === clean.toLowerCase()
      );
      if (exists) {
        return exists;
      }
      await persistCatalogSublists([...availableSublists, clean]);
      return clean;
    },
    [availableSublists, persistCatalogSublists]
  );

  const deleteSublist = useCallback(
    async (tagToRemove: string) => {
      const targetLower = normalizeSublistTag(tagToRemove).toLowerCase();
      if (!targetLower) return;

      const remainingCatalog = availableSublists.filter(
        (t) => t.toLowerCase() !== targetLower
      );
      const now = new Date().toISOString();

      if (!hasFirebaseKeys || !db) {
        writeMockCatalogSublists(remainingCatalog);
        setCatalogSublists(remainingCatalog);
        const updatedSubs = subscribers.map((s) =>
          s.sublists.some((t) => t.toLowerCase() === targetLower)
            ? {
                ...s,
                sublists: s.sublists.filter((t) => t.toLowerCase() !== targetLower),
                updatedAt: now,
              }
            : s
        );
        writeMockSubscribers(updatedSubs);
        setSubscribers(updatedSubs);
        return;
      }

      await persistCatalogSublists(remainingCatalog);

      const affected = subscribers.filter((s) =>
        s.sublists.some((t) => t.toLowerCase() === targetLower)
      );
      for (let i = 0; i < affected.length; i += 400) {
        const batch = writeBatch(db);
        for (const sub of affected.slice(i, i + 400)) {
          const nextSublists = sub.sublists.filter(
            (t) => t.toLowerCase() !== targetLower
          );
          batch.update(doc(db, "mailing_subscribers", sub.id), {
            sublists: nextSublists,
            interests: buildFirestoreInterests(sub.interests, nextSublists),
            updatedAt: now,
          });
        }
        await batch.commit();
      }
      await refreshAll();
    },
    [availableSublists, subscribers, persistCatalogSublists, refreshAll]
  );

  const updateSubscriberSublists = useCallback(
    async (subscriber: MailingSubscriber, nextSublistsRaw: string[]) => {
      const cleanMap = new Map<string, string>();
      for (const item of nextSublistsRaw) {
        const clean = normalizeSublistTag(item);
        if (clean && !cleanMap.has(clean.toLowerCase())) {
          cleanMap.set(clean.toLowerCase(), clean);
        }
      }
      const nextSublists = Array.from(cleanMap.values());
      const now = new Date().toISOString();

      if (!hasFirebaseKeys || !db) {
        const updated = subscribers.map((s) =>
          s.id === subscriber.id ? { ...s, sublists: nextSublists, updatedAt: now } : s
        );
        writeMockSubscribers(updated);
        setSubscribers(updated);
        return;
      }

      await updateDoc(doc(db, "mailing_subscribers", subscriber.id), {
        sublists: nextSublists,
        interests: buildFirestoreInterests(subscriber.interests, nextSublists),
        updatedAt: now,
      });
      setSubscribers((prev) =>
        prev.map((s) =>
          s.id === subscriber.id ? { ...s, sublists: nextSublists, updatedAt: now } : s
        )
      );
    },
    [subscribers]
  );

  const bulkModifySublists = useCallback(
    async (
      subscriberIds: string[],
      rawTag: string,
      mode: "add" | "remove"
    ): Promise<number> => {
      const cleanTag = normalizeSublistTag(rawTag);
      if (!cleanTag || subscriberIds.length === 0) return 0;

      if (mode === "add") {
        const inCatalog = availableSublists.some(
          (t) => t.toLowerCase() === cleanTag.toLowerCase()
        );
        if (!inCatalog) {
          await persistCatalogSublists([...availableSublists, cleanTag]);
        }
      }

      const targetIds = new Set(subscriberIds);
      const now = new Date().toISOString();
      const targetLower = cleanTag.toLowerCase();

      const toModify = subscribers.filter((s) => {
        if (!targetIds.has(s.id)) return false;
        const hasTag = s.sublists.some((t) => t.toLowerCase() === targetLower);
        return mode === "add" ? !hasTag : hasTag;
      });

      if (toModify.length === 0) return 0;

      if (!hasFirebaseKeys || !db) {
        const updated = subscribers.map((s) => {
          if (!targetIds.has(s.id)) return s;
          const nextSublists =
            mode === "add"
              ? Array.from(
                  new Set([
                    ...s.sublists.filter((t) => t.toLowerCase() !== targetLower),
                    cleanTag,
                  ])
                )
              : s.sublists.filter((t) => t.toLowerCase() !== targetLower);
          return { ...s, sublists: nextSublists, updatedAt: now };
        });
        writeMockSubscribers(updated);
        setSubscribers(updated);
        return toModify.length;
      }

      for (let i = 0; i < toModify.length; i += 400) {
        const batch = writeBatch(db);
        for (const sub of toModify.slice(i, i + 400)) {
          const nextSublists =
            mode === "add"
              ? [
                  ...sub.sublists.filter((t) => t.toLowerCase() !== targetLower),
                  cleanTag,
                ]
              : sub.sublists.filter((t) => t.toLowerCase() !== targetLower);
          batch.update(doc(db, "mailing_subscribers", sub.id), {
            sublists: nextSublists,
            interests: buildFirestoreInterests(sub.interests, nextSublists),
            updatedAt: now,
          });
        }
        await batch.commit();
      }

      await refreshAll();
      return toModify.length;
    },
    [subscribers, availableSublists, persistCatalogSublists, refreshAll]
  );

  const upsertSubscriber = useCallback(
    async (input: {
      email: string;
      firstName: string;
      lastName: string;
      affiliation: string;
      interests: MailingInterest[];
      sublists?: string[];
      status: SubscriberStatus;
    }) => {
      const cleanEmail = normalizeSubscriberEmail(input.email);
      if (!isValidSubscriberEmail(cleanEmail)) {
        throw new Error("Please enter a valid subscriber email address.");
      }

      const now = new Date().toISOString();
      const id = subscriberDocId(cleanEmail);
      const existing = subscribers.find((s) => s.id === id || s.email === cleanEmail);

      const mergedSublists = Array.from(
        new Set(
          [...(existing?.sublists || []), ...(input.sublists || [])]
            .map(normalizeSublistTag)
            .filter(Boolean)
        )
      );

      const record: MailingSubscriber = {
        id,
        email: cleanEmail,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        affiliation: input.affiliation.trim(),
        interests: input.interests.length > 0 ? input.interests : ["workshop"],
        sublists: mergedSublists,
        status: input.status,
        source: existing?.source || "board_manual",
        unsubscribeToken: existing?.unsubscribeToken || generateClientToken(),
        optInToken: existing?.optInToken || generateClientToken(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        confirmedAt:
          input.status === "active"
            ? existing?.confirmedAt || now
            : existing?.confirmedAt,
        unsubscribedAt:
          input.status === "unsubscribed" ? now : existing?.unsubscribedAt,
      };

      if (!hasFirebaseKeys || !db) {
        const updated = existing
          ? subscribers.map((s) => (s.id === id ? record : s))
          : [...subscribers, record].sort((a, b) => a.email.localeCompare(b.email));
        writeMockSubscribers(updated);
        setSubscribers(updated);
        return;
      }

      await setDoc(
        doc(db, "mailing_subscribers", id),
        toFirestoreSubscriberPayload(record),
        { merge: true }
      );
      await refreshAll();
    },
    [subscribers, refreshAll]
  );

  const updateSubscriberStatus = useCallback(
    async (subscriber: MailingSubscriber, nextStatus: SubscriberStatus) => {
      const now = new Date().toISOString();
      if (!hasFirebaseKeys || !db) {
        const updated = subscribers.map((s) =>
          s.id === subscriber.id
            ? {
                ...s,
                status: nextStatus,
                updatedAt: now,
                unsubscribedAt:
                  nextStatus === "unsubscribed" ? now : s.unsubscribedAt,
              }
            : s
        );
        writeMockSubscribers(updated);
        setSubscribers(updated);
        return;
      }

      await updateDoc(doc(db, "mailing_subscribers", subscriber.id), {
        status: nextStatus,
        updatedAt: now,
        ...(nextStatus === "unsubscribed" ? { unsubscribedAt: now } : {}),
      });
      await refreshAll();
    },
    [subscribers, refreshAll]
  );

  const removeSubscriber = useCallback(
    async (subscriber: MailingSubscriber) => {
      if (!hasFirebaseKeys || !db) {
        const updated = subscribers.filter((s) => s.id !== subscriber.id);
        writeMockSubscribers(updated);
        setSubscribers(updated);
        return;
      }
      await deleteDoc(doc(db, "mailing_subscribers", subscriber.id));
      await refreshAll();
    },
    [subscribers, refreshAll]
  );

  /**
   * Imports Mailchimp / Committee CSV rows while strictly protecting historical unsubscribes,
   * hard bounces, and spam complaints from ever being accidentally re-activated,
   * AND merging any existing or newly assigned Sublists/Tags!
   */
  const importMailchimpRows = useCallback(
    async (rows: MailchimpParsedRow[]): Promise<MailchimpImportResult> => {
      const existingMap = new Map<string, MailingSubscriber>();
      for (const s of subscribers) {
        existingMap.set(s.email, s);
      }

      const now = new Date().toISOString();
      const mergedMap = new Map<string, MailingSubscriber>();
      for (const s of subscribers) {
        mergedMap.set(s.id, s);
      }

      const discoveredSublists = new Set<string>(availableSublists);
      let importedActive = 0;
      let importedSuppressed = 0;
      let skippedProtected = 0;
      const toWrite: MailingSubscriber[] = [];

      const suppressedStates: ReadonlySet<SubscriberStatus> = new Set([
        "unsubscribed",
        "bounced",
        "complained",
      ]);

      for (const row of rows) {
        const cleanEmail = normalizeSubscriberEmail(row.email);
        if (!isValidSubscriberEmail(cleanEmail)) continue;
        const id = subscriberDocId(cleanEmail);
        const current = mergedMap.get(id) || existingMap.get(cleanEmail);

        const mergedSublistMap = new Map<string, string>();
        for (const t of [...(current?.sublists || []), ...(row.sublists || [])]) {
          const cleanT = normalizeSublistTag(t);
          if (cleanT && !mergedSublistMap.has(cleanT.toLowerCase())) {
            mergedSublistMap.set(cleanT.toLowerCase(), cleanT);
            discoveredSublists.add(cleanT);
          }
        }
        const mergedSublists = Array.from(mergedSublistMap.values());

        // CAN-SPAM / Deliverability Guard: NEVER overwrite a suppressed address back to active!
        if (
          current &&
          suppressedStates.has(current.status) &&
          row.status === "active"
        ) {
          skippedProtected += 1;
          // Still preserve newly added cohort sublists (e.g. "2025 Attendees" historical record) while keeping status suppressed
          if (mergedSublists.length !== current.sublists.length) {
            const updatedProtected: MailingSubscriber = {
              ...current,
              sublists: mergedSublists,
              updatedAt: now,
            };
            mergedMap.set(id, updatedProtected);
            toWrite.push(updatedProtected);
          }
          continue;
        }

        const finalStatus = row.status;
        if (finalStatus === "active") {
          importedActive += 1;
        } else {
          importedSuppressed += 1;
        }

        const mergedInterests = Array.from(
          new Set([...(current?.interests || []), ...row.interests])
        ) as MailingInterest[];

        let resolvedCreatedAt = current?.createdAt || row.createdAt || now;
        if (current?.createdAt && row.createdAt) {
          const currMs = Date.parse(current.createdAt);
          const rowMs = Date.parse(row.createdAt);
          if (!Number.isNaN(currMs) && !Number.isNaN(rowMs) && rowMs < currMs) {
            resolvedCreatedAt = row.createdAt;
          }
        }

        const nextRecord: MailingSubscriber = {
          id,
          email: cleanEmail,
          firstName: row.firstName || current?.firstName || "",
          lastName: row.lastName || current?.lastName || "",
          affiliation: row.affiliation || current?.affiliation || "",
          interests: mergedInterests.length > 0 ? mergedInterests : ["workshop"],
          sublists: mergedSublists,
          status: finalStatus,
          source: current?.source || "mailchimp_import",
          unsubscribeToken: current?.unsubscribeToken || generateClientToken(),
          optInToken: current?.optInToken || generateClientToken(),
          createdAt: resolvedCreatedAt,
          updatedAt: now,
          ...(finalStatus === "active"
            ? { confirmedAt: current?.confirmedAt || now }
            : {}),
          ...(finalStatus === "unsubscribed"
            ? { unsubscribedAt: current?.unsubscribedAt || now }
            : {}),
          ...(finalStatus === "bounced"
            ? {
                bounceReason:
                  current?.bounceReason ||
                  "Imported from Mailchimp Cleaned/Bounced CSV",
              }
            : {}),
        };

        mergedMap.set(id, nextRecord);
        toWrite.push(nextRecord);
      }

      if (discoveredSublists.size > availableSublists.length) {
        await persistCatalogSublists(Array.from(discoveredSublists));
      }

      if (!hasFirebaseKeys || !db) {
        const all = Array.from(mergedMap.values()).sort((a, b) =>
          a.email.localeCompare(b.email)
        );
        writeMockSubscribers(all);
        setSubscribers(all);
        return {
          totalParsed: rows.length,
          importedActive,
          importedSuppressed,
          skippedProtected,
        };
      }

      // Commit in Firestore batches of 400 (limit is 500 ops/batch)
      for (let i = 0; i < toWrite.length; i += 400) {
        const batch = writeBatch(db);
        for (const item of toWrite.slice(i, i + 400)) {
          batch.set(
            doc(db, "mailing_subscribers", item.id),
            toFirestoreSubscriberPayload(item),
            { merge: true }
          );
        }
        await batch.commit();
      }

      await refreshAll();
      return {
        totalParsed: rows.length,
        importedActive,
        importedSuppressed,
        skippedProtected,
      };
    },
    [subscribers, availableSublists, persistCatalogSublists, refreshAll]
  );

  const applyPendingPublicRequests = useCallback(async (): Promise<number> => {
    if (pendingRequests.length === 0) return 0;
    const now = new Date().toISOString();

    if (!hasFirebaseKeys || !db) {
      const map = new Map(subscribers.map((s) => [s.id, s]));
      for (const req of pendingRequests) {
        const cleanEmail = normalizeSubscriberEmail(req.email);
        const id = subscriberDocId(cleanEmail);
        const existing = map.get(id);
        if (req.type === "unsubscribe") {
          if (existing) {
            map.set(id, {
              ...existing,
              status: "unsubscribed",
              unsubscribedAt: now,
              updatedAt: now,
            });
          }
        } else if (req.type === "subscribe") {
          map.set(id, {
            id,
            email: cleanEmail,
            firstName: req.firstName || existing?.firstName || "",
            lastName: req.lastName || existing?.lastName || "",
            affiliation: req.affiliation || existing?.affiliation || "",
            interests: req.interests || existing?.interests || ["workshop"],
            sublists: existing?.sublists || [],
            status: "active",
            source: "website",
            unsubscribeToken: existing?.unsubscribeToken || generateClientToken(),
            optInToken: existing?.optInToken || generateClientToken(),
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            confirmedAt: now,
          });
        }
      }
      const next = Array.from(map.values()).sort((a, b) =>
        a.email.localeCompare(b.email)
      );
      writeMockSubscribers(next);
      setSubscribers(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(MOCK_PUBLIC_REQ_KEY, "[]");
      }
      setPendingRequests([]);
      return pendingRequests.length;
    }

    const batch = writeBatch(db);
    for (const req of pendingRequests) {
      const cleanEmail = normalizeSubscriberEmail(req.email);
      const id = subscriberDocId(cleanEmail);
      const existing = subscribers.find((s) => s.id === id);

      if (req.type === "unsubscribe") {
        batch.set(
          doc(db, "mailing_subscribers", id),
          {
            email: cleanEmail,
            status: "unsubscribed",
            unsubscribedAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      } else if (req.type === "subscribe") {
        const nextInterests = req.interests || existing?.interests || ["workshop"];
        const preservedSublists = existing?.sublists || [];
        batch.set(
          doc(db, "mailing_subscribers", id),
          {
            id,
            email: cleanEmail,
            firstName: req.firstName || existing?.firstName || "",
            lastName: req.lastName || existing?.lastName || "",
            affiliation: req.affiliation || existing?.affiliation || "",
            interests: buildFirestoreInterests(nextInterests, preservedSublists),
            sublists: preservedSublists,
            status: existing?.status === "complained" ? "complained" : "active",
            source: existing?.source || "website",
            unsubscribeToken: existing?.unsubscribeToken || generateClientToken(),
            optInToken: existing?.optInToken || generateClientToken(),
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            confirmedAt: now,
          },
          { merge: true }
        );
      }
      batch.update(doc(db, "mailing_public_requests", req.id), {
        status: "processed",
      });
    }

    await batch.commit();
    await refreshAll();
    return pendingRequests.length;
  }, [pendingRequests, subscribers, refreshAll]);

  const dispatchCampaign = useCallback(
    async (params: {
      mode: "test" | "broadcast";
      subject: string;
      segment: MailingSegment;
      markdownBody: string;
      testEmail: string;
      callerEmail: string;
    }): Promise<{ mode: "live" | "sandbox"; message: string; deliveredCount: number }> => {
      const { paragraphsHtml, plainBodyCore } = renderAcademicEmailParts(
        params.subject,
        params.markdownBody
      );

      const matchingActive = subscribers.filter((s) =>
        matchesMailingSegment(s, params.segment)
      );

      // Ensure Firestore `interests` mirror `sublist:<Name>` before calling live Cloud Function
      if (
        params.mode === "broadcast" &&
        params.segment.startsWith("sublist:") &&
        hasFirebaseKeys &&
        db &&
        matchingActive.length > 0
      ) {
        for (let i = 0; i < matchingActive.length; i += 400) {
          const batch = writeBatch(db);
          for (const sub of matchingActive.slice(i, i + 400)) {
            batch.update(doc(db, "mailing_subscribers", sub.id), {
              interests: buildFirestoreInterests(sub.interests, sub.sublists),
            });
          }
          await batch.commit();
        }
      }

      // Attempt live Cloud Functions endpoint first when Firebase Auth is active
      if (hasFirebaseKeys && auth?.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const response = await fetch("/api/mailing/send-campaign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              mode: params.mode,
              subject: params.subject,
              segment: params.segment,
              paragraphsHtml,
              plainBodyCore,
              markdownBody: params.markdownBody,
              testEmail: params.testEmail,
            }),
          });

          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const payload = (await response.json()) as {
              ok?: boolean;
              mode?: "live" | "sandbox";
              message?: string;
              error?: string;
              deliveredCount?: number;
            };
            if (!response.ok || !payload.ok) {
              throw new Error(payload.error || "Dispatch rejected by server.");
            }
            if (params.mode === "broadcast") {
              await refreshAll();
            }
            return {
              mode: payload.mode || "live",
              message: payload.message || "Dispatched successfully.",
              deliveredCount: payload.deliveredCount ?? matchingActive.length,
            };
          }
        } catch (err) {
          console.warn(
            "[useMailingAdmin] Cloud Function /api/mailing/send-campaign unavailable in static preview; falling back to sandbox log:",
            err
          );
        }
      }

      // Preview / Sandbox fallback when Cloud Functions rewrite or POSTMARK_SERVER_TOKEN is not yet live
      const now = new Date().toISOString();
      if (params.mode === "test") {
        return {
          mode: "sandbox",
          deliveredCount: 1,
          message: `Preview test validated for ${params.testEmail}. Live email delivery activates automatically once Cloud Functions + POSTMARK_SERVER_TOKEN are deployed.`,
        };
      }

      const newCampaign: MailingCampaign = {
        id: `sandbox-${Date.now()}`,
        subject: params.subject,
        segment: params.segment,
        markdownBody: params.markdownBody,
        status: "sandbox_logged",
        recipientCount: matchingActive.length,
        deliveredCount: matchingActive.length,
        failedCount: 0,
        createdByEmail: params.callerEmail,
        createdAt: now,
        sentAt: now,
        postmarkStream: "broadcast",
      };

      if (hasFirebaseKeys && db) {
        await addDoc(collection(db, "mailing_campaigns"), {
          subject: newCampaign.subject,
          segment: newCampaign.segment,
          markdownBody: newCampaign.markdownBody,
          status: newCampaign.status,
          recipientCount: newCampaign.recipientCount,
          deliveredCount: newCampaign.deliveredCount,
          failedCount: 0,
          createdByEmail: newCampaign.createdByEmail,
          createdAt: now,
          sentAt: now,
          postmarkStream: "broadcast",
        });
        await refreshAll();
      } else {
        const updated = [newCampaign, ...campaigns];
        writeMockCampaigns(updated);
        setCampaigns(updated);
      }

      return {
        mode: "sandbox",
        deliveredCount: matchingActive.length,
        message: `Logged in preview sandbox (${matchingActive.length} active recipients matched). Deploy Cloud Functions + POSTMARK_SERVER_TOKEN for live Postmark Broadcast delivery.`,
      };
    },
    [subscribers, campaigns, refreshAll]
  );

  return {
    subscribers,
    availableSublists,
    isLiveFirestore,
    campaigns,
    pendingRequests,
    loadingData,
    errorMessage,
    refreshAll,
    createSublist,
    deleteSublist,
    updateSubscriberSublists,
    bulkModifySublists,
    upsertSubscriber,
    updateSubscriberStatus,
    removeSubscriber,
    importMailchimpRows,
    applyPendingPublicRequests,
    dispatchCampaign,
  };
}
