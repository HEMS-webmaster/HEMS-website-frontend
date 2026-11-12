"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CampaignAttributionStat,
  DailyTelemetryPoint,
  DeviceTrafficStat,
  FileDownloadStat,
  GeoTrafficStat,
  PageTrafficStat,
  ReferrerTrafficStat,
  TelemetryDeviceType,
  TelemetryEventRecord,
  TelemetryEventType,
  UserActivityStat,
} from "@/types/telemetry";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import {
  formatFriendlyPageTitle,
  MOCK_TELEMETRY_STORAGE_KEY,
  normalizeTelemetryPath,
  sanitizeCampaignSlug,
} from "@/utils/telemetryClient";
import { buildCampaignSlug } from "@/utils/mailingTemplate";

export type AnalyticsWindowPreset = "7d" | "30d" | "90d" | "all";

interface RawDailyDoc {
  dateKey: string;
  totalViews: number;
  campaignViews: number;
  conversions: number;
  downloads: number;
  pages: Record<string, number>;
  referrers: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  campaigns: Record<string, number>;
  lastUpdatedAt: string;
}

interface RawCampaignMeta {
  slug: string;
  subject: string;
  sentAt: string;
  recipientCount: number;
}

interface RawRolledCampaignDoc {
  campaignSlug: string;
  views: number;
  conversions: number;
  downloads: number;
  pages: Record<string, number>;
  lastSeenAt: string;
}

function decodeMapFieldKey(encoded: string): string {
  return encoded.replace(/%2F/g, "/").replace(/%2E/g, ".");
}

function buildRecentDateKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function createSampleMockEvents(): TelemetryEventRecord[] {
  const now = Date.now();
  const hour = 3600 * 1000;
  const day = 24 * hour;

  const samples: Array<Omit<TelemetryEventRecord, "id" | "dateKey">> = [
    {
      eventType: "page_view",
      path: "/layout-portal",
      pageTitle: "16th Workshop Hub (2027)",
      sessionId: "sess-nasa01",
      campaignSlug: "16th-september-2027-save-date",
      referrerCategory: "Direct",
      referrerHost: "",
      deviceType: "Desktop",
      country: "US",
      region: "CA",
      targetLabel: "",
      userUid: "",
      userEmail: "",
      userName: "",
      timestamp: new Date(now - 2 * hour).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "page_view",
      path: "/call-for-papers",
      pageTitle: "Call for Papers",
      sessionId: "sess-nasa01",
      campaignSlug: "16th-september-2027-save-date",
      referrerCategory: "Direct",
      referrerHost: "",
      deviceType: "Desktop",
      country: "US",
      region: "CA",
      targetLabel: "",
      userUid: "",
      userEmail: "",
      userName: "",
      timestamp: new Date(now - 1.9 * hour).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "page_view",
      path: "/corporate-sponsorship",
      pageTitle: "Corporate Sponsorship",
      sessionId: "sess-corp02",
      campaignSlug: "16th-september-2027-save-date--2025-corporate-sponsors",
      referrerCategory: "Direct",
      referrerHost: "",
      deviceType: "Desktop",
      country: "US",
      region: "MA",
      targetLabel: "",
      userUid: "mock1",
      userEmail: "j.fox@inficon.com",
      userName: "Dr. James Fox",
      timestamp: new Date(now - 5 * hour).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "mailto_click",
      path: "/corporate-sponsorship",
      pageTitle: "Corporate Sponsorship",
      sessionId: "sess-corp02",
      campaignSlug: "16th-september-2027-save-date--2025-corporate-sponsors",
      referrerCategory: "Direct",
      referrerHost: "",
      deviceType: "Desktop",
      country: "US",
      region: "MA",
      targetLabel: "tim.short@hems-workshop.org",
      userUid: "mock1",
      userEmail: "j.fox@inficon.com",
      userName: "Dr. James Fox",
      timestamp: new Date(now - 4.9 * hour).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "page_view",
      path: "/archive/2025",
      pageTitle: "2025 Workshop Proceedings",
      sessionId: "sess-ethz03",
      campaignSlug: "",
      referrerCategory: "Google Search",
      referrerHost: "www.google.com",
      deviceType: "Desktop",
      country: "CH",
      region: "ZH",
      targetLabel: "",
      userUid: "mock3",
      userEmail: "jrichter@ethz.ch",
      userName: "Julia Richter",
      timestamp: new Date(now - 1 * day).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "pdf_download",
      path: "/archive/2025",
      pageTitle: "2025 Workshop Proceedings",
      sessionId: "sess-ethz03",
      campaignSlug: "",
      referrerCategory: "Google Search",
      referrerHost: "www.google.com",
      deviceType: "Desktop",
      country: "CH",
      region: "ZH",
      targetLabel: "15th: 15th_Fox_ARAMMIS_Autonomous_Robots_Presentation.pdf",
      userUid: "mock3",
      userEmail: "jrichter@ethz.ch",
      userName: "Julia Richter",
      timestamp: new Date(now - 0.98 * day).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "page_view",
      path: "/student-awards",
      pageTitle: "Student Travel Awards",
      sessionId: "sess-usf04",
      campaignSlug: "16th-call-papers-student-travel-awards",
      referrerCategory: "Academic (usf.edu)",
      referrerHost: "marine.usf.edu",
      deviceType: "Mobile",
      country: "US",
      region: "FL",
      targetLabel: "",
      userUid: "",
      userEmail: "",
      userName: "",
      timestamp: new Date(now - 2 * day).toISOString(),
      rolledUp: false,
    },
    {
      eventType: "mailing_signup",
      path: "/contact",
      pageTitle: "Contact & Mailing Signup",
      sessionId: "sess-usf04",
      campaignSlug: "16th-call-papers-student-travel-awards",
      referrerCategory: "Academic (usf.edu)",
      referrerHost: "marine.usf.edu",
      deviceType: "Mobile",
      country: "US",
      region: "FL",
      targetLabel: "Topics: workshop, student_awards",
      userUid: "",
      userEmail: "",
      userName: "",
      timestamp: new Date(now - 1.95 * day).toISOString(),
      rolledUp: false,
    },
  ];

  return samples.map((s, idx) => ({
    ...s,
    id: `sample-ev-${idx}`,
    dateKey: s.timestamp.slice(0, 10),
  }));
}

export function useSiteAnalytics(
  enabled: boolean,
  isMockAuth: boolean,
  windowPreset: AnalyticsWindowPreset = "30d",
  customSinceDate = ""
) {
  const [dailyDocs, setDailyDocs] = useState<RawDailyDoc[]>([]);
  const [rolledCampaignDocs, setRolledCampaignDocs] = useState<RawRolledCampaignDoc[]>([]);
  const [events, setEvents] = useState<TelemetryEventRecord[]>([]);
  const [campaignMetas, setCampaignMetas] = useState<RawCampaignMeta[]>([]);
  const [rawUsers, setRawUsers] = useState<UserActivityStat[]>([]);
  const [downloadsList, setDownloadsList] = useState<FileDownloadStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const isLiveFirestore = Boolean(!isMockAuth && hasFirebaseKeys && db);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!isLiveFirestore || !db) {
        // Offline Mock Mode
        const storedUsersRaw =
          typeof window !== "undefined"
            ? window.localStorage.getItem("hems_mock_users") || "[]"
            : "[]";
        let mockUsers = JSON.parse(storedUsersRaw) as Array<Partial<UserActivityStat>>;
        if (mockUsers.length <= 1) {
          mockUsers = [
            {
              uid: "mock1",
              name: "Dr. James Fox",
              email: "j.fox@inficon.com",
              loginCount: 14,
              downloadCount: 5,
              lastLogin: new Date(Date.now() - 3600000).toISOString(),
              createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            },
            {
              uid: "mock2",
              name: "Prof. Devon Higgins",
              email: "d.higgins@usf.edu",
              loginCount: 28,
              downloadCount: 12,
              lastLogin: new Date(Date.now() - 86400000).toISOString(),
              createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
            },
            {
              uid: "mock3",
              name: "Julia Richter",
              email: "jrichter@ethz.ch",
              loginCount: 8,
              downloadCount: 2,
              lastLogin: new Date(Date.now() - 172800000).toISOString(),
              createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            },
          ];
        }

        const storedDownloadsRaw =
          typeof window !== "undefined"
            ? window.localStorage.getItem("hems_mock_downloads") || "[]"
            : "[]";
        let mockDownloads = JSON.parse(storedDownloadsRaw) as FileDownloadStat[];
        if (mockDownloads.length === 0) {
          mockDownloads = [
            {
              fileName: "15th_Fox_ARAMMIS_Autonomous_Robots_Presentation.pdf",
              downloadCount: 15,
              lastDownloaded: new Date(Date.now() - 1800000).toISOString(),
              category: "Presentation",
              workshopName: "15th",
            },
            {
              fileName: "15th_Program.pdf",
              downloadCount: 24,
              lastDownloaded: new Date(Date.now() - 600000).toISOString(),
              category: "Program",
              workshopName: "15th",
            },
          ];
        }

        let mockEvents: TelemetryEventRecord[] = [];
        if (typeof window !== "undefined") {
          const existingRaw = window.localStorage.getItem(MOCK_TELEMETRY_STORAGE_KEY);
          if (existingRaw) {
            mockEvents = JSON.parse(existingRaw) as TelemetryEventRecord[];
          } else {
            mockEvents = createSampleMockEvents();
            window.localStorage.setItem(
              MOCK_TELEMETRY_STORAGE_KEY,
              JSON.stringify(mockEvents)
            );
          }
        }

        setDailyDocs([]);
        setRolledCampaignDocs([]);
        setEvents(mockEvents);
        setCampaignMetas([]);
        setRawUsers(
          mockUsers.map((u, idx) => ({
            uid: u.uid || `mock-${idx}`,
            name: u.name || "Member",
            email: u.email || "",
            loginCount: Number(u.loginCount || 1),
            pageViewCount: 0,
            downloadCount: Number(u.downloadCount || 0),
            lastLogin: u.lastLogin || "",
            lastActivePath: "",
            createdAt: u.createdAt || "",
          }))
        );
        setDownloadsList(mockDownloads);
        return;
      }

      // Live Google Cloud Firestore Mode
      const { collection, getDocs, limit, orderBy, query } = await import(
        "firebase/firestore"
      );

      const [
        dailyRes,
        rolledCampRes,
        eventsRes,
        mailingCampRes,
        usersRes,
        downloadsRes,
      ] = await Promise.allSettled([
        getDocs(collection(db, "telemetry_daily")),
        getDocs(collection(db, "telemetry_campaigns")),
        getDocs(
          query(
            collection(db, "telemetry_events"),
            orderBy("timestamp", "desc"),
            limit(1500)
          )
        ),
        getDocs(collection(db, "mailing_campaigns")),
        getDocs(collection(db, "users")),
        getDocs(query(collection(db, "downloads"), orderBy("downloadCount", "desc"))),
      ]);

      const rejectedPermissions = [
        dailyRes,
        rolledCampRes,
        eventsRes,
        usersRes,
        downloadsRes,
      ].some(
        (r) =>
          r.status === "rejected" &&
          String(r.reason?.message || r.reason || "")
            .toLowerCase()
            .includes("insufficient permissions")
      );

      if (rejectedPermissions) {
        setError(
          "Google Cloud is still running the previous Firestore security rules — run `firebase login --reauth` and `firebase deploy --only firestore:rules --project hems-workshop` once to activate live Board Member analytics permissions in Cloud Firestore."
        );
      }

      const loadedDaily: RawDailyDoc[] = [];
      if (dailyRes.status === "fulfilled") {
        dailyRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          loadedDaily.push({
            dateKey: String(d.dateKey || docSnap.id),
            totalViews: Number(d.totalViews || 0),
            campaignViews: Number(d.campaignViews || 0),
            conversions: Number(d.conversions || 0),
            downloads: Number(d.downloads || 0),
            pages: (d.pages as Record<string, number>) || {},
            referrers: (d.referrers as Record<string, number>) || {},
            devices: (d.devices as Record<string, number>) || {},
            countries: (d.countries as Record<string, number>) || {},
            campaigns: (d.campaigns as Record<string, number>) || {},
            lastUpdatedAt: String(d.lastUpdatedAt || ""),
          });
        });
      }

      const loadedRolledCamps: RawRolledCampaignDoc[] = [];
      if (rolledCampRes.status === "fulfilled") {
        rolledCampRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          loadedRolledCamps.push({
            campaignSlug: String(d.campaignSlug || docSnap.id),
            views: Number(d.views || 0),
            conversions: Number(d.conversions || 0),
            downloads: Number(d.downloads || 0),
            pages: (d.pages as Record<string, number>) || {},
            lastSeenAt: String(d.lastSeenAt || ""),
          });
        });
      }

      const loadedEvents: TelemetryEventRecord[] = [];
      if (eventsRes.status === "fulfilled") {
        eventsRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          loadedEvents.push({
            id: docSnap.id,
            eventType: (d.eventType as TelemetryEventType) || "page_view",
            path: normalizeTelemetryPath(String(d.path || "/")),
            pageTitle:
              String(d.pageTitle || "") ||
              formatFriendlyPageTitle(String(d.path || "/")),
            sessionId: String(d.sessionId || "anon"),
            campaignSlug: sanitizeCampaignSlug(String(d.campaignSlug || "")),
            referrerCategory: String(d.referrerCategory || "Direct"),
            referrerHost: String(d.referrerHost || ""),
            deviceType:
              d.deviceType === "Mobile" || d.deviceType === "Tablet"
                ? (d.deviceType as TelemetryDeviceType)
                : "Desktop",
            country: String(d.country || "Unknown"),
            region: String(d.region || ""),
            targetLabel: String(d.targetLabel || ""),
            userUid: String(d.userUid || ""),
            userEmail: String(d.userEmail || ""),
            userName: String(d.userName || ""),
            dateKey: String(d.dateKey || String(d.timestamp || "").slice(0, 10)),
            timestamp: String(d.timestamp || ""),
            rolledUp: Boolean(d.rolledUp),
          });
        });
      } else if (typeof window !== "undefined") {
        // Merge any locally buffered browser telemetry while awaiting `firestore:rules` deploy
        try {
          const buffered = window.localStorage.getItem(MOCK_TELEMETRY_STORAGE_KEY);
          if (buffered) {
            loadedEvents.push(...(JSON.parse(buffered) as TelemetryEventRecord[]));
          }
        } catch {
          // Ignore malformed local buffer
        }
      }

      const loadedMetas: RawCampaignMeta[] = [];
      if (mailingCampRes.status === "fulfilled") {
        mailingCampRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          const subject = String(d.subject || "");
          const segment = String(d.segment || "all");
          const slug = sanitizeCampaignSlug(
            String(d.campaignSlug || "") || buildCampaignSlug(subject, segment)
          );
          if (slug) {
            loadedMetas.push({
              slug,
              subject,
              sentAt: String(d.sentAt || d.createdAt || ""),
              recipientCount: Number(d.recipientCount || 0),
            });
          }
        });
      }

      const loadedUsers: UserActivityStat[] = [];
      if (usersRes.status === "fulfilled") {
        usersRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          loadedUsers.push({
            uid: docSnap.id,
            name: String(d.name || "Unknown"),
            email: String(d.email || ""),
            loginCount: Number(d.loginCount || 0),
            pageViewCount: 0,
            downloadCount: Number(d.downloadCount || 0),
            lastLogin: String(d.lastLogin || ""),
            lastActivePath: "",
            createdAt: String(d.createdAt || ""),
          });
        });
      }

      const loadedDownloads: FileDownloadStat[] = [];
      if (downloadsRes.status === "fulfilled") {
        downloadsRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          loadedDownloads.push({
            fileName: String(d.fileName || docSnap.id),
            downloadCount: Number(d.downloadCount || 0),
            lastDownloaded: String(d.lastDownloaded || ""),
            category: String(d.category || "Other"),
            workshopName: String(d.workshopName || "Unknown"),
          });
        });
      }

      setDailyDocs(loadedDaily);
      setRolledCampaignDocs(loadedRolledCamps);
      setEvents(loadedEvents);
      setCampaignMetas(loadedMetas);
      setRawUsers(loadedUsers);
      setDownloadsList(loadedDownloads);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load website analytics."
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, isLiveFirestore]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Compute effective cutoff date (`YYYY-MM-DD`)
  const cutoffDateKey = useMemo(() => {
    if (customSinceDate) return customSinceDate;
    if (windowPreset === "all") return "";
    const days = windowPreset === "7d" ? 7 : windowPreset === "30d" ? 30 : 90;
    const keys = buildRecentDateKeys(days);
    return keys[0] || "";
  }, [windowPreset, customSinceDate]);

  // Filter events within selected window
  const windowedEvents = useMemo(() => {
    if (!cutoffDateKey) return events;
    return events.filter((ev) => ev.dateKey >= cutoffDateKey);
  }, [events, cutoffDateKey]);

  const windowedDailyDocs = useMemo(() => {
    if (!cutoffDateKey) return dailyDocs;
    return dailyDocs.filter((d) => d.dateKey >= cutoffDateKey);
  }, [dailyDocs, cutoffDateKey]);

  // Aggregate daily timeline, pages, campaigns, referrers, geo, devices, and user enrichments
  const aggregated = useMemo(() => {
    const dailyMap = new Map<string, DailyTelemetryPoint>();
    const pageMap = new Map<
      string,
      {
        views: number;
        sessions: Set<string>;
        campaignViews: number;
        conversions: number;
        lastVisitedAt: string;
      }
    >();
    const campaignMap = new Map<
      string,
      {
        views: number;
        sessions: Set<string>;
        conversions: number;
        downloads: number;
        pages: Map<string, number>;
        lastSeenAt: string;
      }
    >();
    const referrerCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const deviceCounts = new Map<TelemetryDeviceType, number>([
      ["Desktop", 0],
      ["Mobile", 0],
      ["Tablet", 0],
    ]);

    // Seed calendar dates for 7d/30d/90d so timeline renders continuous bars
    if (!customSinceDate && windowPreset !== "all") {
      const days = windowPreset === "7d" ? 7 : windowPreset === "30d" ? 30 : 90;
      for (const dk of buildRecentDateKeys(days)) {
        dailyMap.set(dk, {
          dateKey: dk,
          totalViews: 0,
          campaignViews: 0,
          conversions: 0,
          downloads: 0,
        });
      }
    }

    // 1. Fold server rolled-up daily docs (`telemetry_daily`)
    for (const d of windowedDailyDocs) {
      const existing = dailyMap.get(d.dateKey) || {
        dateKey: d.dateKey,
        totalViews: 0,
        campaignViews: 0,
        conversions: 0,
        downloads: 0,
      };
      existing.totalViews += d.totalViews;
      existing.campaignViews += d.campaignViews;
      existing.conversions += d.conversions;
      existing.downloads += d.downloads;
      dailyMap.set(d.dateKey, existing);

      for (const [encPath, cnt] of Object.entries(d.pages || {})) {
        const path = normalizeTelemetryPath(decodeMapFieldKey(encPath));
        const p = pageMap.get(path) || {
          views: 0,
          sessions: new Set<string>(),
          campaignViews: 0,
          conversions: 0,
          lastVisitedAt: "",
        };
        p.views += Number(cnt || 0);
        if (d.lastUpdatedAt > p.lastVisitedAt) p.lastVisitedAt = d.lastUpdatedAt;
        pageMap.set(path, p);
      }

      for (const [encRef, cnt] of Object.entries(d.referrers || {})) {
        const ref = decodeMapFieldKey(encRef);
        referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + Number(cnt || 0));
      }

      for (const [dev, cnt] of Object.entries(d.devices || {})) {
        const key: TelemetryDeviceType =
          dev === "Mobile" || dev === "Tablet" ? dev : "Desktop";
        deviceCounts.set(key, (deviceCounts.get(key) || 0) + Number(cnt || 0));
      }

      for (const [encCountry, cnt] of Object.entries(d.countries || {})) {
        const c = decodeMapFieldKey(encCountry);
        countryCounts.set(c, (countryCounts.get(c) || 0) + Number(cnt || 0));
      }

      for (const [encSlug, cnt] of Object.entries(d.campaigns || {})) {
        const slug = sanitizeCampaignSlug(decodeMapFieldKey(encSlug));
        if (!slug) continue;
        const c = campaignMap.get(slug) || {
          views: 0,
          sessions: new Set<string>(),
          conversions: 0,
          downloads: 0,
          pages: new Map<string, number>(),
          lastSeenAt: "",
        };
        c.views += Number(cnt || 0);
        if (d.lastUpdatedAt > c.lastSeenAt) c.lastSeenAt = d.lastUpdatedAt;
        campaignMap.set(slug, c);
      }
    }

    // Supplement rolled-up campaign conversions/downloads/topPages when viewing all-time or matching window
    for (const rc of rolledCampaignDocs) {
      if (cutoffDateKey && rc.lastSeenAt && rc.lastSeenAt.slice(0, 10) < cutoffDateKey) {
        continue;
      }
      const slug = sanitizeCampaignSlug(rc.campaignSlug);
      if (!slug) continue;
      const c = campaignMap.get(slug) || {
        views: 0,
        sessions: new Set<string>(),
        conversions: 0,
        downloads: 0,
        pages: new Map<string, number>(),
        lastSeenAt: "",
      };
      // `views` already came from `windowedDailyDocs.campaigns`; take max in case daily doc predates
      if (rc.views > c.views && !cutoffDateKey) c.views = rc.views;
      c.conversions = Math.max(c.conversions, rc.conversions);
      c.downloads = Math.max(c.downloads, rc.downloads);
      if (rc.lastSeenAt > c.lastSeenAt) c.lastSeenAt = rc.lastSeenAt;
      for (const [encPath, cnt] of Object.entries(rc.pages || {})) {
        const p = normalizeTelemetryPath(decodeMapFieldKey(encPath));
        c.pages.set(p, Math.max(c.pages.get(p) || 0, Number(cnt || 0)));
      }
      campaignMap.set(slug, c);
    }

    // 2. Fold event stream:
    // - Session sets & user activity enrichments use ALL windowedEvents.
    // - Numeric counters add ONLY `!ev.rolledUp` events so rolledUp Cloud Function events are never double-counted.
    const allSessionIds = new Set<string>();
    const userPageViews = new Map<string, { count: number; lastPath: string; lastTs: string }>();

    for (const ev of windowedEvents) {
      if (ev.sessionId) allSessionIds.add(ev.sessionId);

      if (ev.userUid || ev.userEmail) {
        const uKey = ev.userUid || ev.userEmail.toLowerCase();
        const prev = userPageViews.get(uKey) || { count: 0, lastPath: "", lastTs: "" };
        if (ev.eventType === "page_view") prev.count += 1;
        if (ev.timestamp >= prev.lastTs) {
          prev.lastTs = ev.timestamp;
          prev.lastPath = ev.path;
        }
        userPageViews.set(uKey, prev);
      }

      const pStat = pageMap.get(ev.path) || {
        views: 0,
        sessions: new Set<string>(),
        campaignViews: 0,
        conversions: 0,
        lastVisitedAt: "",
      };
      if (ev.sessionId) pStat.sessions.add(ev.sessionId);
      if (ev.timestamp > pStat.lastVisitedAt) pStat.lastVisitedAt = ev.timestamp;
      if (ev.eventType === "page_view" && ev.campaignSlug) {
        pStat.campaignViews += 1;
      }
      if (ev.eventType !== "page_view") {
        pStat.conversions += 1;
      }
      if (!ev.rolledUp && ev.eventType === "page_view") {
        pStat.views += 1;
      }
      pageMap.set(ev.path, pStat);

      if (ev.campaignSlug) {
        const cStat = campaignMap.get(ev.campaignSlug) || {
          views: 0,
          sessions: new Set<string>(),
          conversions: 0,
          downloads: 0,
          pages: new Map<string, number>(),
          lastSeenAt: "",
        };
        if (ev.sessionId) cStat.sessions.add(ev.sessionId);
        if (ev.timestamp > cStat.lastSeenAt) cStat.lastSeenAt = ev.timestamp;
        if (!ev.rolledUp) {
          if (ev.eventType === "page_view") {
            cStat.views += 1;
            cStat.pages.set(ev.path, (cStat.pages.get(ev.path) || 0) + 1);
          } else if (ev.eventType === "pdf_download") {
            cStat.downloads += 1;
          } else {
            cStat.conversions += 1;
          }
        }
        campaignMap.set(ev.campaignSlug, cStat);
      }

      if (!ev.rolledUp) {
        const dPoint = dailyMap.get(ev.dateKey) || {
          dateKey: ev.dateKey,
          totalViews: 0,
          campaignViews: 0,
          conversions: 0,
          downloads: 0,
        };
        if (ev.eventType === "page_view") {
          dPoint.totalViews += 1;
          if (ev.campaignSlug) dPoint.campaignViews += 1;

          const refLabel = ev.campaignSlug
            ? `Email: ${ev.campaignSlug}`
            : ev.referrerCategory || "Direct";
          referrerCounts.set(refLabel, (referrerCounts.get(refLabel) || 0) + 1);
          deviceCounts.set(ev.deviceType, (deviceCounts.get(ev.deviceType) || 0) + 1);
          const geoLabel = ev.region
            ? `${ev.country} (${ev.region})`
            : ev.country || "Unknown";
          countryCounts.set(geoLabel, (countryCounts.get(geoLabel) || 0) + 1);
        } else if (ev.eventType === "pdf_download") {
          dPoint.downloads += 1;
        } else {
          dPoint.conversions += 1;
        }
        dailyMap.set(ev.dateKey, dPoint);
      }
    }

    // Ensure every dispatched MailingCampaign also appears in campaign attribution (even with 0 clicks yet)
    const metaBySlug = new Map<string, RawCampaignMeta>();
    for (const m of campaignMetas) {
      if (!metaBySlug.has(m.slug)) {
        metaBySlug.set(m.slug, m);
      }
      if (!campaignMap.has(m.slug)) {
        campaignMap.set(m.slug, {
          views: 0,
          sessions: new Set<string>(),
          conversions: 0,
          downloads: 0,
          pages: new Map<string, number>(),
          lastSeenAt: "",
        });
      }
    }

    const dailySeries = Array.from(dailyMap.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey)
    );

    const totalPageViews = dailySeries.reduce((s, d) => s + d.totalViews, 0);
    const totalCampaignViews = dailySeries.reduce((s, d) => s + d.campaignViews, 0);
    const totalConversions = dailySeries.reduce((s, d) => s + d.conversions, 0);

    const pageStats: PageTrafficStat[] = Array.from(pageMap.entries())
      .map(([path, stat]) => ({
        path,
        title: formatFriendlyPageTitle(path),
        views: stat.views,
        uniqueSessions: Math.max(stat.sessions.size, stat.views > 0 ? 1 : 0),
        campaignViews: stat.campaignViews,
        conversions: stat.conversions,
        lastVisitedAt: stat.lastVisitedAt,
      }))
      .filter((p) => p.views > 0 || p.conversions > 0)
      .sort((a, b) => b.views - a.views || b.conversions - a.conversions);

    const campaignStats: CampaignAttributionStat[] = Array.from(
      campaignMap.entries()
    )
      .map(([slug, stat]) => {
        const meta = metaBySlug.get(slug);
        const topPages = Array.from(stat.pages.entries())
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        return {
          campaignSlug: slug,
          campaignSubject: meta?.subject || `Tagged Link (?src=${slug})`,
          sentAt: meta?.sentAt || "",
          recipientCount: meta?.recipientCount || 0,
          views: stat.views,
          uniqueSessions: Math.max(stat.sessions.size, stat.views > 0 ? 1 : 0),
          conversions: stat.conversions,
          downloads: stat.downloads,
          topPages,
          lastSeenAt: stat.lastSeenAt,
        };
      })
      .sort(
        (a, b) =>
          b.views - a.views ||
          b.conversions - a.conversions ||
          b.sentAt.localeCompare(a.sentAt)
      );

    const totalRefViews = Array.from(referrerCounts.values()).reduce(
      (s, n) => s + n,
      0
    );
    const referrerStats: ReferrerTrafficStat[] = Array.from(
      referrerCounts.entries()
    )
      .map(([source, views]) => ({
        source,
        views,
        percentage: totalRefViews > 0 ? Math.round((views / totalRefViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    const totalGeoViews = Array.from(countryCounts.values()).reduce(
      (s, n) => s + n,
      0
    );
    const geoStats: GeoTrafficStat[] = Array.from(countryCounts.entries())
      .map(([location, views]) => ({
        location,
        views,
        percentage: totalGeoViews > 0 ? Math.round((views / totalGeoViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const totalDevViews = Array.from(deviceCounts.values()).reduce(
      (s, n) => s + n,
      0
    );
    const deviceStats: DeviceTrafficStat[] = (
      ["Desktop", "Mobile", "Tablet"] as TelemetryDeviceType[]
    ).map((device) => {
      const views = deviceCounts.get(device) || 0;
      return {
        device,
        views,
        percentage: totalDevViews > 0 ? Math.round((views / totalDevViews) * 100) : 0,
      };
    });

    const enrichedUsers: UserActivityStat[] = rawUsers
      .map((u) => {
        const enrich =
          userPageViews.get(u.uid) ||
          userPageViews.get(u.email.toLowerCase());
        return {
          ...u,
          pageViewCount: enrich?.count || 0,
          lastActivePath: enrich?.lastPath || "",
        };
      })
      .filter((u) => !cutoffDateKey || (u.lastLogin && u.lastLogin.slice(0, 10) >= cutoffDateKey));

    const filteredDownloads = !cutoffDateKey
      ? downloadsList
      : downloadsList.filter(
          (f) => f.lastDownloaded && f.lastDownloaded.slice(0, 10) >= cutoffDateKey
        );

    return {
      totalPageViews,
      uniqueSessions: Math.max(
        allSessionIds.size,
        totalPageViews > 0 && allSessionIds.size === 0 ? 1 : allSessionIds.size
      ),
      totalCampaignViews,
      totalConversions,
      dailySeries,
      pageStats,
      campaignStats,
      referrerStats,
      geoStats,
      deviceStats,
      enrichedUsers,
      filteredDownloads,
    };
  }, [
    windowedDailyDocs,
    rolledCampaignDocs,
    windowedEvents,
    campaignMetas,
    rawUsers,
    downloadsList,
    cutoffDateKey,
    customSinceDate,
    windowPreset,
  ]);

  return {
    loading,
    error,
    isLiveFirestore,
    refresh,
    recentEvents: windowedEvents,
    allUsersCount: rawUsers.length,
    ...aggregated,
  };
}

