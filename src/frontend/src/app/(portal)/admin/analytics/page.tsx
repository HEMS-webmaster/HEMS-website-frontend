"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart2,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Layers,
  Link2,
  Mail,
  MousePointerClick,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tag,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AnalyticsWindowPreset,
  useSiteAnalytics,
} from "@/hooks/useSiteAnalytics";
import { hasBoardOrAdminRole } from "@/utils/telemetryClient";
import { GA_MEASUREMENT_ID } from "@/utils/firebase";
import { TelemetryEventType } from "@/types/telemetry";

type AnalyticsTab = "pages" | "campaigns" | "stream" | "users" | "files";
type StreamFilter = "all" | "page_view" | "campaign" | "conversions" | "signed_in";

const LINK_BUILDER_DESTINATIONS = [
  { label: "16th Workshop Hub (/layout-portal)", path: "/layout-portal" },
  { label: "Call for Papers (/call-for-papers)", path: "/call-for-papers" },
  { label: "Corporate Sponsorship (/corporate-sponsorship)", path: "/corporate-sponsorship" },
  { label: "Student Travel Awards (/student-awards)", path: "/student-awards" },
  { label: "Proceedings Archive (/archive)", path: "/archive" },
  { label: "2025 Proceedings (/archive/2025)", path: "/archive/2025" },
  { label: "Accommodations (/accommodations)", path: "/accommodations" },
  { label: "Contact & Mailing List (/contact)", path: "/contact" },
];

function formatTimestampShort(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatEventBadge(type: TelemetryEventType): {
  label: string;
  classes: string;
} {
  switch (type) {
    case "page_view":
      return {
        label: "Page View",
        classes: "bg-slate-100 text-slate-700 border-slate-200",
      };
    case "mailto_click":
      return {
        label: "Officer Email Click",
        classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "mailing_signup":
      return {
        label: "Mailing Signup",
        classes: "bg-primary/10 text-primary border-primary/25",
      };
    case "contact_inquiry":
      return {
        label: "Online Inquiry",
        classes: "bg-teal-50 text-teal-800 border-teal-200",
      };
    case "pdf_download":
      return {
        label: "PDF Download",
        classes: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "outbound_click":
      return {
        label: "External / Prospectus",
        classes: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
  }
}

export default function AdminAnalyticsPage() {
  const { user, loading: authLoading, isMock } = useAuth();

  const isAuthorized = useMemo(
    () => Boolean(user && hasBoardOrAdminRole(user.roles)),
    [user]
  );

  const [windowPreset, setWindowPreset] = useState<AnalyticsWindowPreset>("30d");
  const [sinceDate, setSinceDate] = useState("");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("pages");
  const [searchQuery, setSearchQuery] = useState("");
  const [streamFilter, setStreamFilter] = useState<StreamFilter>("all");

  // Quick First-Party ?src= Link Builder state (for 1-off officer emails / flyers)
  const [builderPath, setBuilderPath] = useState("/corporate-sponsorship");
  const [builderTag, setBuilderTag] = useState("2027-sponsor-outreach");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Column sorting states
  const [pageSort, setPageSort] = useState<{
    col: "title" | "views" | "sessions" | "campaignViews" | "conversions" | "lastVisitedAt";
    dir: "asc" | "desc";
  }>({ col: "views", dir: "desc" });

  const [userSort, setUserSort] = useState<{
    col: "name" | "loginCount" | "pageViewCount" | "downloadCount" | "lastLogin";
    dir: "asc" | "desc";
  }>({ col: "lastLogin", dir: "desc" });

  const [fileSort, setFileSort] = useState<{
    col: "fileName" | "workshopName" | "category" | "downloadCount" | "lastDownloaded";
    dir: "asc" | "desc";
  }>({ col: "downloadCount", dir: "desc" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (
      tab === "pages" ||
      tab === "campaigns" ||
      tab === "stream" ||
      tab === "users" ||
      tab === "files"
    ) {
      setActiveTab(tab);
    }
  }, []);

  const {
    loading,
    error,
    isLiveFirestore,
    refresh,
    allUsersCount,
    totalPageViews,
    uniqueSessions,
    totalCampaignViews,
    totalConversions,
    dailySeries,
    pageStats,
    campaignStats,
    referrerStats,
    geoStats,
    deviceStats,
    recentEvents,
    enrichedUsers,
    filteredDownloads,
  } = useSiteAnalytics(isAuthorized, isMock, windowPreset, sinceDate);

  const totalDownloads = useMemo(
    () => filteredDownloads.reduce((sum, f) => sum + (f.downloadCount || 0), 0),
    [filteredDownloads]
  );

  const totalLogins = useMemo(
    () => enrichedUsers.reduce((sum, u) => sum + (u.loginCount || 0), 0),
    [enrichedUsers]
  );

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of filteredDownloads) {
      counts[f.category] = (counts[f.category] || 0) + f.downloadCount;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredDownloads]);

  const maxDailyViews = useMemo(
    () => Math.max(1, ...dailySeries.map((d) => d.totalViews)),
    [dailySeries]
  );

  const qLower = searchQuery.trim().toLowerCase();

  const sortedPages = useMemo(() => {
    const base = qLower
      ? pageStats.filter(
          (p) =>
            p.path.toLowerCase().includes(qLower) ||
            p.title.toLowerCase().includes(qLower)
        )
      : pageStats;

    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (pageSort.col) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "views":
          cmp = a.views - b.views;
          break;
        case "sessions":
          cmp = a.uniqueSessions - b.uniqueSessions;
          break;
        case "campaignViews":
          cmp = a.campaignViews - b.campaignViews;
          break;
        case "conversions":
          cmp = a.conversions - b.conversions;
          break;
        case "lastVisitedAt":
          cmp = a.lastVisitedAt.localeCompare(b.lastVisitedAt);
          break;
      }
      return pageSort.dir === "asc" ? cmp : -cmp;
    });
  }, [pageStats, qLower, pageSort]);

  const filteredCampaigns = useMemo(() => {
    if (!qLower) return campaignStats;
    return campaignStats.filter(
      (c) =>
        c.campaignSlug.toLowerCase().includes(qLower) ||
        c.campaignSubject.toLowerCase().includes(qLower)
    );
  }, [campaignStats, qLower]);

  const filteredStream = useMemo(() => {
    return recentEvents.filter((ev) => {
      if (streamFilter === "page_view" && ev.eventType !== "page_view") return false;
      if (streamFilter === "campaign" && !ev.campaignSlug) return false;
      if (streamFilter === "conversions" && ev.eventType === "page_view") return false;
      if (streamFilter === "signed_in" && !ev.userEmail && !ev.userUid) return false;

      if (!qLower) return true;
      return (
        ev.path.toLowerCase().includes(qLower) ||
        ev.pageTitle.toLowerCase().includes(qLower) ||
        ev.campaignSlug.toLowerCase().includes(qLower) ||
        ev.userEmail.toLowerCase().includes(qLower) ||
        ev.userName.toLowerCase().includes(qLower) ||
        ev.targetLabel.toLowerCase().includes(qLower) ||
        ev.country.toLowerCase().includes(qLower)
      );
    });
  }, [recentEvents, streamFilter, qLower]);

  const sortedUsers = useMemo(() => {
    const base = qLower
      ? enrichedUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(qLower) ||
            u.email.toLowerCase().includes(qLower)
        )
      : enrichedUsers;

    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (userSort.col) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "loginCount":
          cmp = a.loginCount - b.loginCount;
          break;
        case "pageViewCount":
          cmp = a.pageViewCount - b.pageViewCount;
          break;
        case "downloadCount":
          cmp = a.downloadCount - b.downloadCount;
          break;
        case "lastLogin":
          cmp = (a.lastLogin || "").localeCompare(b.lastLogin || "");
          break;
      }
      return userSort.dir === "asc" ? cmp : -cmp;
    });
  }, [enrichedUsers, qLower, userSort]);

  const sortedFiles = useMemo(() => {
    const base = qLower
      ? filteredDownloads.filter(
          (f) =>
            f.fileName.toLowerCase().includes(qLower) ||
            f.workshopName.toLowerCase().includes(qLower) ||
            f.category.toLowerCase().includes(qLower)
        )
      : filteredDownloads;

    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (fileSort.col) {
        case "fileName":
          cmp = a.fileName.localeCompare(b.fileName);
          break;
        case "workshopName":
          cmp = a.workshopName.localeCompare(b.workshopName);
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
        case "downloadCount":
          cmp = a.downloadCount - b.downloadCount;
          break;
        case "lastDownloaded":
          cmp = (a.lastDownloaded || "").localeCompare(b.lastDownloaded || "");
          break;
      }
      return fileSort.dir === "asc" ? cmp : -cmp;
    });
  }, [filteredDownloads, qLower, fileSort]);

  const generatedTaggedUrl = useMemo(() => {
    const cleanSlug = builderTag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72);
    return cleanSlug
      ? `https://hems-workshop.org${builderPath}/?src=${cleanSlug}`.replace(
          "//?src=",
          "/?src="
        )
      : `https://hems-workshop.org${builderPath}/`.replace("///", "/");
  }, [builderPath, builderTag]);

  const handleCopyTaggedUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedTaggedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const suffix = sinceDate || windowPreset;
    let fileName = `hems_analytics_${activeTab}_${suffix}.csv`;

    if (activeTab === "pages") {
      headers = [
        "Page Path",
        "Page Title",
        "Page Views",
        "Unique Sessions",
        "Email Campaign Visits",
        "Actions & Downloads",
        "Last Visited",
      ];
      rows = sortedPages.map((p) => [
        p.path,
        p.title,
        String(p.views),
        String(p.uniqueSessions),
        String(p.campaignViews),
        String(p.conversions),
        p.lastVisitedAt,
      ]);
    } else if (activeTab === "campaigns") {
      headers = [
        "Campaign Slug (?src=)",
        "Subject / Label",
        "Sent At",
        "Recipients",
        "Website Visits",
        "Unique Sessions",
        "Actions",
        "PDF Downloads",
        "Last Seen",
      ];
      rows = filteredCampaigns.map((c) => [
        c.campaignSlug,
        c.campaignSubject,
        c.sentAt,
        String(c.recipientCount),
        String(c.views),
        String(c.uniqueSessions),
        String(c.conversions),
        String(c.downloads),
        c.lastSeenAt,
      ]);
    } else if (activeTab === "stream") {
      headers = [
        "Timestamp",
        "Event Type",
        "Page Path",
        "Target / Detail",
        "Campaign (?src=)",
        "Referrer",
        "Country",
        "Region",
        "Device",
        "Member Name",
        "Member Email",
        "Session ID",
      ];
      rows = filteredStream.map((e) => [
        e.timestamp,
        e.eventType,
        e.path,
        e.targetLabel,
        e.campaignSlug,
        e.referrerCategory,
        e.country,
        e.region,
        e.deviceType,
        e.userName,
        e.userEmail,
        e.sessionId,
      ]);
    } else if (activeTab === "users") {
      headers = [
        "Name",
        "Email",
        "Logins",
        "Pages Viewed",
        "PDF Downloads",
        "Last Active Page",
        "Last Login",
      ];
      rows = sortedUsers.map((u) => [
        u.name,
        u.email,
        String(u.loginCount),
        String(u.pageViewCount),
        String(u.downloadCount),
        u.lastActivePath,
        u.lastLogin,
      ]);
      fileName = `hems_registered_members_${suffix}.csv`;
    } else {
      headers = [
        "File Name",
        "Workshop",
        "Category",
        "Downloads",
        "Last Downloaded",
      ];
      rows = sortedFiles.map((f) => [
        f.fileName,
        f.workshopName,
        f.category,
        String(f.downloadCount),
        f.lastDownloaded,
      ]);
      fileName = `hems_pdf_downloads_${suffix}.csv`;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="animate-spin text-primary" size={30} />
        <p className="text-slate-500 text-sm">Verifying Board / Admin session...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white border border-red-200 rounded-2xl shadow-sm">
        <ShieldAlert className="text-red-500 mx-auto mb-4" size={44} />
        <h2 className="font-serif text-2xl font-semibold text-slate-900 mb-2">
          Board or Admin Access Required
        </h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Sign in with an authorized HEMS Board Member or Administrator account to view website traffic and email campaign attribution.
        </p>
        <Link
          href="/auth"
          className="inline-block bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Committee Sign In
        </Link>
      </div>
    );
  }

  const campaignSharePct =
    totalPageViews > 0 ? Math.round((totalCampaignViews / totalPageViews) * 100) : 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto w-full min-w-0 py-2 sm:py-4">
      {/* Header & Time-Range Controls */}
      <header className="border-b border-slate-200 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-1 tabular-nums">
            First-Party Firestore Telemetry • Google Analytics 4 ({GA_MEASUREMENT_ID})
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-2.5">
            <BarChart2 className="text-primary shrink-0" size={26} />
            Website Traffic &amp; Campaign Attribution
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isLiveFirestore
              ? "Connected to live Google Cloud Firestore (hems-workshop) alongside Google Analytics 4 web stream."
              : "Offline Browser Sandbox Mode — displaying local mock telemetry."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {(
              [
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "90d", label: "90D" },
                { id: "all", label: "All" },
              ] as Array<{ id: AnalyticsWindowPreset; label: string }>
            ).map((preset) => {
              const active = !sinceDate && windowPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSinceDate("");
                    setWindowPreset(preset.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-primary text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <span className="font-semibold text-slate-500">Since:</span>
            <input
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              aria-label="Filter telemetry since date"
              className="bg-transparent border-0 text-xs text-slate-900 focus:outline-none tabular-nums font-semibold cursor-pointer"
            />
            {sinceDate && (
              <button
                type="button"
                onClick={() => setSinceDate("")}
                className="text-slate-400 hover:text-slate-700 font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : "text-primary"} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* External Analytics, Search Console & Domain Authority Quick-Launch Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white border border-slate-200/95 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                Google Analytics 4
              </span>
              <span className="text-[10.5px] font-semibold tabular-nums bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {GA_MEASUREMENT_ID}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time visitor streams, organic acquisition channels, and geographic engagement on analytics.google.com.
            </p>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 bg-primary text-white group-hover:bg-sky-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs">
              Open Google Analytics <ExternalLink size={13} />
            </span>
          </div>
        </a>

        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white border border-slate-200/95 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                Google Search Console
              </span>
              <span className="text-[10.5px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
                Indexing &amp; Sitemaps
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitor Google search queries, proceedings indexing coverage, and sitemap status (sitemap.xml).
            </p>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-300 group-hover:border-primary group-hover:text-primary px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs">
              Open Search Console <ExternalLink size={13} />
            </span>
          </div>
        </a>

        <a
          href="https://ahrefs.com/website-authority-checker/?input=www.hems-workshop.org"
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white border border-slate-200/95 hover:border-secondary/50 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 group-hover:text-secondary transition-colors">
                Website Authority Checker
              </span>
              <span className="text-[10.5px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                Ahrefs DR
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inspect live Domain Rating (DR), referring academic/industry backlinks, and authority for www.hems-workshop.org.
            </p>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white group-hover:bg-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs">
              Check Authority <ExternalLink size={13} />
            </span>
          </div>
        </a>
      </div>

      {/* 6 Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200/95 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Page Views</span>
            <Eye size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {totalPageViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {uniqueSessions.toLocaleString()} unique session(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Email (?src=)</span>
            <Tag size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-700 mt-1.5">
            {totalCampaignViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {campaignSharePct}% of total page views
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>CTA Actions</span>
            <MousePointerClick size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {totalConversions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Email clicks &amp; signups
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>PDF Downloads</span>
            <FileText size={15} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {totalDownloads.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {filteredDownloads.length} archive file(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Portal Members</span>
            <Users size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {allUsersCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {totalLogins.toLocaleString()} total login(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Top Page</span>
            <Activity size={15} className="text-primary" />
          </div>
          <div
            className="text-sm font-bold text-slate-900 mt-2 truncate"
            title={pageStats[0]?.title || "No traffic yet"}
          >
            {pageStats[0]?.path || "—"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums truncate">
            {pageStats[0] ? `${pageStats[0].views} views` : "Browse site to populate"}
          </div>
        </div>
      </div>

      {/* Daily Traffic & Email Campaign Timeline */}
      <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              Daily Website Visits &amp; Email-Driven Arrivals
            </h2>
            <p className="text-xs text-slate-500">
              Hover any day to inspect human page views, <code className="bg-slate-100 px-1 rounded">?src=</code> email arrivals, CTA actions, and PDF downloads.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-primary/80 inline-block" />
              Direct / Organic Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              Email (?src=) Views
            </span>
          </div>
        </div>

        {dailySeries.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-8 text-center">
            No daily traffic recorded in the selected window yet.
          </p>
        ) : (
          <div className="pt-2">
            <div className="h-36 flex items-end gap-1 sm:gap-1.5 border-b border-slate-200 pb-1">
              {dailySeries.slice(-45).map((pt) => {
                const totalPct =
                  pt.totalViews > 0
                    ? Math.max(8, Math.round((pt.totalViews / maxDailyViews) * 100))
                    : 2;
                const emailRatio =
                  pt.totalViews > 0
                    ? Math.min(100, Math.round((pt.campaignViews / pt.totalViews) * 100))
                    : 0;
                return (
                  <div
                    key={pt.dateKey}
                    className="flex-1 h-full flex flex-col justify-end group relative min-w-[4px]"
                    title={`${pt.dateKey}: ${pt.totalViews} page views (${pt.campaignViews} from ?src= email, ${pt.conversions} CTA actions, ${pt.downloads} PDF downloads)`}
                  >
                    <div
                      style={{ height: `${totalPct}%` }}
                      className={`w-full rounded-t-sm overflow-hidden flex flex-col justify-end transition-opacity group-hover:opacity-85 ${
                        pt.totalViews === 0 ? "bg-slate-100" : "bg-primary/80"
                      }`}
                    >
                      {emailRatio > 0 && (
                        <div
                          style={{ height: `${emailRatio}%` }}
                          className="w-full bg-emerald-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 tabular-nums mt-1.5">
              <span>{dailySeries.slice(-45)[0]?.dateKey || ""}</span>
              <span>
                Peak: {maxDailyViews === 1 && totalPageViews === 0 ? 0 : maxDailyViews} view(s)/day
              </span>
              <span>{dailySeries[dailySeries.length - 1]?.dateKey || ""}</span>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: 9-Col Tabbed Explorer + 3-Col Breakdown Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* Tab Switcher + Search Input */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "pages", label: `Pages (${pageStats.length})` },
                  { id: "campaigns", label: `Email & Sources (${campaignStats.length})` },
                  { id: "stream", label: `Live Stream (${recentEvents.length})` },
                  { id: "users", label: `Members (${enrichedUsers.length})` },
                  { id: "files", label: `PDF Downloads (${filteredDownloads.length})` },
                ] as Array<{ id: AnalyticsTab; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-60">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter current table..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <RefreshCw className="animate-spin text-primary mx-auto mb-3" size={24} />
              <p className="text-xs sm:text-sm text-slate-500">
                Aggregating first-party website and campaign telemetry...
              </p>
            </div>
          ) : activeTab === "pages" ? (
            /* TAB 1: PAGES & CONTENT */
            <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="text-[11px] font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setPageSort((s) => ({
                              col: "title",
                              dir: s.col === "title" && s.dir === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Page / Route <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPageSort((s) => ({
                              col: "views",
                              dir: s.col === "views" && s.dir === "desc" ? "asc" : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Views{" "}
                          {pageSort.col === "views" ? (
                            pageSort.dir === "desc" ? (
                              <ArrowDown size={12} />
                            ) : (
                              <ArrowUp size={12} />
                            )
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPageSort((s) => ({
                              col: "sessions",
                              dir: s.col === "sessions" && s.dir === "desc" ? "asc" : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Sessions <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPageSort((s) => ({
                              col: "campaignViews",
                              dir:
                                s.col === "campaignViews" && s.dir === "desc"
                                  ? "asc"
                                  : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          From ?src= <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPageSort((s) => ({
                              col: "conversions",
                              dir:
                                s.col === "conversions" && s.dir === "desc" ? "asc" : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Actions <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPageSort((s) => ({
                              col: "lastVisitedAt",
                              dir:
                                s.col === "lastVisitedAt" && s.dir === "desc"
                                  ? "asc"
                                  : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Last Visited <ArrowUpDown size={12} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedPages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                          No public page visits recorded yet—open any public HEMS page (such as <code className="not-italic bg-slate-100 px-1 rounded">/call-for-papers</code> or <code className="not-italic bg-slate-100 px-1 rounded">/contact</code>) and click Refresh.
                        </td>
                      </tr>
                    ) : (
                      sortedPages.map((p) => (
                        <tr key={p.path} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <Link
                              href={p.path}
                              className="font-semibold text-slate-900 hover:text-primary inline-flex items-center gap-1.5"
                            >
                              <span>{p.title}</span>
                              <ExternalLink size={12} className="text-slate-400 shrink-0" />
                            </Link>
                            <div className="text-[11px] font-mono text-slate-500">{p.path}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-bold text-primary">
                            {p.views.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                            {p.uniqueSessions.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-emerald-700">
                            {p.campaignViews > 0 ? p.campaignViews.toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-800">
                            {p.conversions > 0 ? p.conversions.toLocaleString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-xs text-slate-500 whitespace-nowrap">
                            {formatTimestampShort(p.lastVisitedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "campaigns" ? (
            /* TAB 2: EMAIL CAMPAIGNS (?src=) & TRAFFIC SOURCES */
            <div className="space-y-6">
              {/* 1-Click First-Party Tagged Link Builder for Officer Emails / Flyers */}
              <div className="bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link2 size={17} className="text-primary shrink-0" />
                    <h3 className="font-serif text-base font-semibold text-slate-900">
                      First-Party <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">?src=</code> Link Builder
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                     Announcements in <Link href="/board/announcements" className="text-primary font-semibold hover:underline">/board/announcements</Link> auto-tag links automatically; use this for 1-on-1 emails or PDF flyers.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <select
                      value={builderPath}
                      onChange={(e) => setBuilderPath(e.target.value)}
                      aria-label="Select destination page"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary"
                    >
                      {LINK_BUILDER_DESTINATIONS.map((d) => (
                        <option key={d.path} value={d.path}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={builderTag}
                      onChange={(e) => setBuilderTag(e.target.value)}
                      placeholder="e.g. 2027-sponsor-outreach"
                      aria-label="Campaign ?src= tag"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => void handleCopyTaggedUrl()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                      {copiedUrl ? "Copied!" : "Copy Direct URL"}
                    </button>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 break-all">
                  {generatedTaggedUrl}
                </div>
              </div>

              {/* Campaign Attribution Table */}
              <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Mail size={14} className="text-primary" /> Email Campaign Attribution (<code className="text-[11px]">?src=</code>)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Visible-tab human visits only (gateway pre-scanners excluded)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead className="text-[11px] font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Campaign &amp; ?src= Slug</th>
                        <th className="px-4 py-3 text-right">Sent</th>
                        <th className="px-4 py-3 text-right">Page Visits</th>
                        <th className="px-4 py-3 text-right">Sessions</th>
                        <th className="px-4 py-3 text-right">Actions / PDFs</th>
                        <th className="px-4 py-3">Top Visited Pages</th>
                        <th className="px-5 py-3 text-right">Last Arrival</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCampaigns.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                            No <code className="not-italic bg-slate-100 px-1 rounded">?src=</code> campaign arrivals recorded yet. Try visiting <code className="not-italic bg-slate-100 px-1 rounded">/call-for-papers?src=test-blast</code> to verify live attribution!
                          </td>
                        </tr>
                      ) : (
                        filteredCampaigns.map((c) => (
                          <tr key={c.campaignSlug} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-900">
                                {c.campaignSubject}
                              </div>
                              <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                                ?src={c.campaignSlug}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">
                              {c.recipientCount > 0 ? c.recipientCount.toLocaleString() : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-bold text-primary">
                              {c.views.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                              {c.views > 0 ? c.uniqueSessions.toLocaleString() : "0"}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-emerald-700">
                              {c.conversions + c.downloads > 0
                                ? `${c.conversions} act / ${c.downloads} pdf`
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {c.topPages.length === 0
                                ? "—"
                                : c.topPages
                                    .map((tp) => `${tp.path} (${tp.count})`)
                                    .join(", ")}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-xs text-slate-500 whitespace-nowrap">
                              {formatTimestampShort(c.lastSeenAt || c.sentAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Referrer Channels Table */}
              <div className="bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Traffic Channels &amp; External Referrers
                </h3>
                {referrerStats.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No referrer data recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {referrerStats.slice(0, 12).map((ref) => (
                      <div key={ref.source} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-800">{ref.source}</span>
                          <span className="tabular-nums font-semibold text-slate-700">
                            {ref.views} ({ref.percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              ref.source.startsWith("Email:")
                                ? "bg-emerald-500"
                                : "bg-primary"
                            }`}
                            style={{ width: `${Math.max(2, ref.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "stream" ? (
            /* TAB 3: LIVE VISITOR & ACTIVITY STREAM ("WHEN, WHERE, BY WHOM") */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "all", label: "All Events" },
                    { id: "page_view", label: "Page Views" },
                    { id: "campaign", label: "Email Arrivals (?src=)" },
                    { id: "conversions", label: "Actions & Downloads" },
                    { id: "signed_in", label: "Signed-In Members Only" },
                  ] as Array<{ id: StreamFilter; label: string }>
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStreamFilter(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      streamFilter === f.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="text-[11px] font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-4 py-3">When</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Page / Target</th>
                        <th className="px-4 py-3">Source / ?src=</th>
                        <th className="px-4 py-3">Region &amp; Device</th>
                        <th className="px-4 py-3">Visitor ("By Whom")</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStream.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                            No matching events in the live stream yet.
                          </td>
                        </tr>
                      ) : (
                        filteredStream.slice(0, 200).map((ev) => {
                          const badge = formatEventBadge(ev.eventType);
                          return (
                            <tr key={ev.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 tabular-nums text-slate-500 whitespace-nowrap">
                                {formatTimestampShort(ev.timestamp)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.classes}`}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{ev.path}</div>
                                {ev.targetLabel && (
                                  <div
                                    className="text-[11px] text-slate-500 truncate max-w-xs"
                                    title={ev.targetLabel}
                                  >
                                    {ev.targetLabel}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {ev.campaignSlug ? (
                                  <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                                    ?src={ev.campaignSlug}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">{ev.referrerCategory}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {ev.country}
                                {ev.region ? ` (${ev.region})` : ""} • {ev.deviceType}
                              </td>
                              <td className="px-4 py-3">
                                {ev.userEmail ? (
                                  <div>
                                    <span className="font-semibold text-primary block">
                                      {ev.userName || "Signed-In Member"}
                                    </span>
                                    <span className="text-[11px] text-slate-500 break-all">
                                      {ev.userEmail}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-mono text-[11px] text-slate-400">
                                    Anon #{ev.sessionId.slice(0, 6)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === "users" ? (
            /* TAB 4: REGISTERED PORTAL MEMBERS */
            <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="text-[11px] font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setUserSort((s) => ({
                              col: "name",
                              dir: s.col === "name" && s.dir === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Member <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setUserSort((s) => ({
                              col: "loginCount",
                              dir:
                                s.col === "loginCount" && s.dir === "desc" ? "asc" : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Logins <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setUserSort((s) => ({
                              col: "pageViewCount",
                              dir:
                                s.col === "pageViewCount" && s.dir === "desc"
                                  ? "asc"
                                  : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Pages Viewed <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setUserSort((s) => ({
                              col: "downloadCount",
                              dir:
                                s.col === "downloadCount" && s.dir === "desc"
                                  ? "asc"
                                  : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          PDF Downloads <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">Last Page</th>
                      <th className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setUserSort((s) => ({
                              col: "lastLogin",
                              dir:
                                s.col === "lastLogin" && s.dir === "desc" ? "asc" : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Last Login <ArrowUpDown size={12} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                          No registered member sessions recorded in this window.
                        </td>
                      </tr>
                    ) : (
                      sortedUsers.map((usr) => (
                        <tr key={usr.uid} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">{usr.name}</div>
                            <div className="text-xs text-slate-500 break-all">{usr.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-700">
                            {usr.loginCount}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                            {usr.pageViewCount > 0 ? usr.pageViewCount : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-bold text-primary">
                            {usr.downloadCount}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-slate-500">
                            {usr.lastActivePath || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-xs text-slate-500 whitespace-nowrap">
                            {formatTimestampShort(usr.lastLogin)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 5: PROCEEDINGS PDF DOWNLOAD LEADERBOARD */
            <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="text-[11px] font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setFileSort((s) => ({
                              col: "fileName",
                              dir: s.col === "fileName" && s.dir === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          File Name <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setFileSort((s) => ({
                              col: "workshopName",
                              dir:
                                s.col === "workshopName" && s.dir === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Workshop <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setFileSort((s) => ({
                              col: "category",
                              dir: s.col === "category" && s.dir === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Category <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setFileSort((s) => ({
                              col: "downloadCount",
                              dir:
                                s.col === "downloadCount" && s.dir === "desc"
                                  ? "asc"
                                  : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Downloads <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setFileSort((s) => ({
                              col: "lastDownloaded",
                              dir:
                                s.col === "lastDownloaded" && s.dir === "desc"
                                  ? "asc"
                                  : "desc",
                            }))
                          }
                          className="inline-flex items-center gap-1 hover:text-primary cursor-pointer"
                        >
                          Last Downloaded <ArrowUpDown size={12} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                          No archive PDF downloads recorded in this window.
                        </td>
                      </tr>
                    ) : (
                      sortedFiles.map((file) => (
                        <tr key={file.fileName} className="hover:bg-slate-50/70">
                          <td
                            className="px-5 py-3.5 font-semibold text-xs text-slate-900 truncate max-w-xs md:max-w-sm"
                            title={file.fileName}
                          >
                            {file.fileName}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 tabular-nums text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              <Calendar size={11} className="text-primary" /> {file.workshopName}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {file.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-bold text-primary">
                            {file.downloadCount}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-xs text-slate-500 whitespace-nowrap">
                            {formatTimestampShort(file.lastDownloaded)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right 3 Columns: Device, Geography, Download Split & Trust Architecture */}
        <div className="lg:col-span-3 space-y-5">
          {/* Device Split */}
          <section className="bg-white border border-slate-200/95 p-5 rounded-2xl shadow-2xs">
            <h3 className="font-bold uppercase tracking-wider text-xs text-slate-700 mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Smartphone size={14} className="text-primary" /> Devices
            </h3>
            <div className="space-y-3">
              {deviceStats.map((d) => (
                <div key={d.device} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{d.device}</span>
                    <span className="tabular-nums text-slate-900 font-semibold">
                      {d.views} ({d.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${d.views > 0 ? Math.max(4, d.percentage) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Coarse Geography */}
          <section className="bg-white border border-slate-200/95 p-5 rounded-2xl shadow-2xs">
            <h3 className="font-bold uppercase tracking-wider text-xs text-slate-700 mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Globe size={14} className="text-primary" /> Countries &amp; Regions
            </h3>
            {geoStats.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No region data yet.</p>
            ) : (
              <div className="space-y-2.5">
                {geoStats.map((g) => (
                  <div key={g.location} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate pr-2">{g.location}</span>
                    <span className="tabular-nums font-semibold text-slate-900 shrink-0">
                      {g.views} ({g.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Archive Category Distribution */}
          <section className="bg-white border border-slate-200/95 p-5 rounded-2xl shadow-2xs">
            <h3 className="font-bold uppercase tracking-wider text-xs text-slate-700 mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-primary" /> Download Categories
            </h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No PDF downloads yet.</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map(([cat, count]) => {
                  const pct =
                    totalDownloads > 0 ? Math.round((count / totalDownloads) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{cat}</span>
                        <span className="tabular-nums font-semibold text-slate-900">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* High-Trust Architecture Explainer */}
          <section className="bg-slate-50/90 border border-slate-200/95 p-5 rounded-2xl text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <h4 className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
              Maximum-Trust Design
            </h4>
            <p>
              <strong>Zero Tracking Pixels:</strong> Emails carry direct{" "}
              <code className="bg-white px-1 rounded border border-slate-200">
                hems-workshop.org
              </code>{" "}
              links with <code className="bg-white px-1 rounded border border-slate-200">?src=</code>{" "}
              tags (<code className="bg-white px-1 rounded border border-slate-200">200 OK</code>, zero redirects).
            </p>
            <p>
              <strong>Bot &amp; Scanner Resistant:</strong> Visits record only when a real browser tab becomes visible, excluding enterprise mail-gateway pre-fetches.
            </p>
            <p>
              <strong>Privacy-Preserving:</strong> Zero cookies and zero IP storage; signed-in names/emails appear only when members authenticate into the HEMS portal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
