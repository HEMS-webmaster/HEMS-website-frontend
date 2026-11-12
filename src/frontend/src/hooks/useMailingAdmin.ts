"use client";

import { useState, useEffect, useCallback } from "react";
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
  normalizeSubscriberEmail,
  renderAcademicEmailParts,
  subscriberDocId,
} from "@/utils/mailingTemplate";

const MOCK_SUBSCRIBERS_KEY = "hems_mock_mailing_subscribers_v1";
const MOCK_CAMPAIGNS_KEY = "hems_mock_mailing_campaigns_v1";
const MOCK_PUBLIC_REQ_KEY = "hems_mock_mailing_requests_v1";

const INITIAL_SAMPLE_SUBSCRIBERS: MailingSubscriber[] = [
  {
    id: subscriberDocId("tshort@usf.edu"),
    email: "tshort@usf.edu",
    firstName: "Tim",
    lastName: "Short",
    affiliation: "University of South Florida / SRI International",
    interests: ["workshop", "sponsorship"],
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
    status: "bounced",
    source: "mailchimp_import",
    unsubscribeToken: "sample-token-bounced-003",
    optInToken: "sample-optin-bounced-003",
    createdAt: "2019-09-16T12:00:00.000Z",
    updatedAt: "2025-04-10T09:15:00.000Z",
    bounceReason: "Mailchimp Cleaned Export (550 5.1.1 User unknown)",
  },
];

function readMockSubscribers(): MailingSubscriber[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_SUBSCRIBERS;
  const raw = localStorage.getItem(MOCK_SUBSCRIBERS_KEY);
  if (!raw) {
    localStorage.setItem(MOCK_SUBSCRIBERS_KEY, JSON.stringify(INITIAL_SAMPLE_SUBSCRIBERS));
    return INITIAL_SAMPLE_SUBSCRIBERS;
  }
  try {
    return JSON.parse(raw) as MailingSubscriber[];
  } catch {
    return INITIAL_SAMPLE_SUBSCRIBERS;
  }
}

function writeMockSubscribers(items: MailingSubscriber[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_SUBSCRIBERS_KEY, JSON.stringify(items));
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
  const [campaigns, setCampaigns] = useState<MailingCampaign[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PublicMailingRequest[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

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
      subSnap.forEach((d) => {
        const data = d.data();
        subList.push({
          id: d.id,
          email: String(data.email || ""),
          firstName: String(data.firstName || ""),
          lastName: String(data.lastName || ""),
          affiliation: String(data.affiliation || ""),
          interests: Array.isArray(data.interests)
            ? (data.interests as MailingInterest[])
            : ["workshop"],
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

  const upsertSubscriber = useCallback(
    async (input: {
      email: string;
      firstName: string;
      lastName: string;
      affiliation: string;
      interests: MailingInterest[];
      status: SubscriberStatus;
    }) => {
      const cleanEmail = normalizeSubscriberEmail(input.email);
      if (!isValidSubscriberEmail(cleanEmail)) {
        throw new Error("Please enter a valid subscriber email address.");
      }

      const now = new Date().toISOString();
      const id = subscriberDocId(cleanEmail);
      const existing = subscribers.find((s) => s.id === id || s.email === cleanEmail);

      const record: MailingSubscriber = {
        id,
        email: cleanEmail,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        affiliation: input.affiliation.trim(),
        interests: input.interests.length > 0 ? input.interests : ["workshop"],
        status: input.status,
        source: existing?.source || "board_manual",
        unsubscribeToken: existing?.unsubscribeToken || generateClientToken(),
        optInToken: existing?.optInToken || generateClientToken(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        confirmedAt: input.status === "active" ? existing?.confirmedAt || now : existing?.confirmedAt,
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

      await setDoc(doc(db, "mailing_subscribers", id), record, { merge: true });
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
   * Imports Mailchimp CSV rows while strictly protecting historical unsubscribes,
   * hard bounces, and spam complaints from ever being accidentally re-activated.
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

        // CAN-SPAM / Deliverability Guard: NEVER overwrite a suppressed address back to active!
        if (
          current &&
          suppressedStates.has(current.status) &&
          row.status === "active"
        ) {
          skippedProtected += 1;
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

        const nextRecord: MailingSubscriber = {
          id,
          email: cleanEmail,
          firstName: row.firstName || current?.firstName || "",
          lastName: row.lastName || current?.lastName || "",
          affiliation: row.affiliation || current?.affiliation || "",
          interests: mergedInterests.length > 0 ? mergedInterests : ["workshop"],
          status: finalStatus,
          source: current?.source || "mailchimp_import",
          unsubscribeToken: current?.unsubscribeToken || generateClientToken(),
          optInToken: current?.optInToken || generateClientToken(),
          createdAt: current?.createdAt || now,
          updatedAt: now,
          ...(finalStatus === "active"
            ? { confirmedAt: current?.confirmedAt || now }
            : {}),
          ...(finalStatus === "unsubscribed"
            ? { unsubscribedAt: current?.unsubscribedAt || now }
            : {}),
          ...(finalStatus === "bounced"
            ? { bounceReason: current?.bounceReason || "Imported from Mailchimp Cleaned/Bounced CSV" }
            : {}),
        };

        mergedMap.set(id, nextRecord);
        toWrite.push(nextRecord);
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
          batch.set(doc(db, "mailing_subscribers", item.id), item, { merge: true });
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
    [subscribers, refreshAll]
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
        batch.set(
          doc(db, "mailing_subscribers", id),
          {
            id,
            email: cleanEmail,
            firstName: req.firstName || existing?.firstName || "",
            lastName: req.lastName || existing?.lastName || "",
            affiliation: req.affiliation || existing?.affiliation || "",
            interests: req.interests || existing?.interests || ["workshop"],
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

      const matchingActive = subscribers.filter((s) => {
        if (s.status !== "active") return false;
        if (params.segment === "all") return true;
        return s.interests.includes(params.segment);
      });

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
    campaigns,
    pendingRequests,
    loadingData,
    errorMessage,
    refreshAll,
    upsertSubscriber,
    updateSubscriberStatus,
    removeSubscriber,
    importMailchimpRows,
    applyPendingPublicRequests,
    dispatchCampaign,
  };
}

