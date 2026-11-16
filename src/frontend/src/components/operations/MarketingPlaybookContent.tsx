"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Printer, RotateCcw } from "lucide-react";
import {
  ARCHIVE_MONTHLY_SPOTLIGHTS,
  CALENDAR_LONG_COPY,
  CALENDAR_SHORT_COPY,
  ChecklistTaskItem,
  EXECUTION_CHECKLIST_TRACK_A,
  EXECUTION_CHECKLIST_TRACK_B,
  GOOGLE_AD_GRANT_CAMPAIGNS,
  GRAD_COORDINATOR_CLUSTERS,
  GRAD_FLYER_EMAIL,
  HOST_PROTOTYPE_MOCKS,
  LINKEDIN_AD_BURSTS,
  NEGATIVE_KEYWORD_SHIELD,
  ONSITE_EVAL_ROWS,
  ONSITE_PITCH_COPY,
  PLAYBOOK_KPI_CARDS,
  PLAYBOOK_NAV_PILLS,
  PLAYBOOK_STORAGE_KEY,
  PREBUILT_UTM_LINKS,
  SOCIETY_CALENDARS,
  SPEAKER_KIT_EMAIL,
  SPONSOR_KIT_EMAIL,
  TWELVE_MONTH_ROADMAP,
  WHITELIST_UNDERWRITER_SLOTS,
} from "@/data/marketingPlaybookData";

interface MarketingPlaybookContentProps {
  canViewBoardAnalytics: boolean;
}

const ALL_TASK_IDS: string[] = [
  ...EXECUTION_CHECKLIST_TRACK_A.map((item) => item.id),
  ...EXECUTION_CHECKLIST_TRACK_B.map((item) => item.id),
];

function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export default function MarketingPlaybookContent({
  canViewBoardAnalytics,
}: MarketingPlaybookContentProps) {
  // Tab state
  const [activeGagTab, setActiveGagTab] = useState<string>(
    GOOGLE_AD_GRANT_CAMPAIGNS[0].id
  );
  const [activeArchiveTab, setActiveArchiveTab] = useState<string>(
    ARCHIVE_MONTHLY_SPOTLIGHTS[0].id
  );
  const [activeHostTab, setActiveHostTab] = useState<string>(
    HOST_PROTOTYPE_MOCKS[0].id
  );

  // Interactive ROI & Break-Even Simulator sliders
  const [grantMonthly, setGrantMonthly] = useState<number>(6500);
  const [grantMonths, setGrantMonths] = useState<number>(10);
  const [burstCfp, setBurstCfp] = useState<number>(500);
  const [burstGrants, setBurstGrants] = useState<number>(500);
  const [burstReg, setBurstReg] = useState<number>(500);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  // Image fallback state (if any public image fails in a constrained environment)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Persistent checklist state synced with window.localStorage
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [storageHydrated, setStorageHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLAYBOOK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const clean: Record<string, boolean> = {};
          for (const id of ALL_TASK_IDS) {
            if (parsed[id] === true) clean[id] = true;
          }
          setCheckedTasks(clean);
        }
      }
    } catch {
      // Ignore storage access restrictions
    } finally {
      setStorageHydrated(true);
    }

    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!storageHydrated) return;
    try {
      window.localStorage.setItem(
        PLAYBOOK_STORAGE_KEY,
        JSON.stringify(checkedTasks)
      );
    } catch {
      // Ignore storage write errors
    }
  }, [checkedTasks, storageHydrated]);

  const simMetrics = useMemo(() => {
    const cashTotal = burstCfp + burstGrants + burstReg;
    const grantTotal = grantMonthly * grantMonths;
    const totalMedia = cashTotal + grantTotal;
    const estGoogleClicks = grantTotal / 1.85;
    const estLinkedInClicks = cashTotal / 5.25;
    const totalClicks = Math.round(estGoogleClicks + estLinkedInClicks);
    const sponsorsNeeded = cashTotal === 0 ? 0 : Math.ceil(cashTotal / 1350);
    const regsNeeded = cashTotal === 0 ? 0 : Math.ceil(cashTotal / 500);

    const breakEvenLabel =
      cashTotal === 0
        ? "$0 Outlay (Free)"
        : `${sponsorsNeeded} ${sponsorsNeeded === 1 ? "Sponsor" : "Sponsors"} or ${regsNeeded} ${regsNeeded === 1 ? "Reg" : "Regs"}`;

    return {
      cashTotal,
      totalMedia,
      totalClicks,
      breakEvenLabel,
    };
  }, [grantMonthly, grantMonths, burstCfp, burstGrants, burstReg]);

  const totalTasksCount = ALL_TASK_IDS.length;
  const doneTasksCount = useMemo(
    () => ALL_TASK_IDS.filter((id) => checkedTasks[id] === true).length,
    [checkedTasks]
  );
  const progressPct =
    totalTasksCount > 0
      ? Math.round((doneTasksCount / totalTasksCount) * 100)
      : 0;

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const handleToggleTask = (taskId: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleResetChecklist = () => {
    setCheckedTasks({});
  };

  const handleCopy = (key: string, text: string) => {
    const cleanText = text.trim();
    const markCopied = () => {
      setCopiedId(key);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    };

    const fallbackCopy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = cleanText;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        markCopied();
      } catch {
        // Ignore clipboard errors in headless environments
      }
    };

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof window !== "undefined" &&
      window.isSecureContext
    ) {
      navigator.clipboard
        .writeText(cleanText)
        .then(markCopied)
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  const renderAnalyticsReference = (
    label = "Board Portal → Website Analytics (/admin/analytics)"
  ) => {
    if (canViewBoardAnalytics) {
      return (
        <Link
          href="/admin/analytics"
          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>{label}</span>
          <ExternalLink size={12} className="shrink-0" />
        </Link>
      );
    }
    return (
      <span
        className="font-semibold text-slate-800"
        title="Website Analytics is hosted in the Board Portal ('board' whitelist role required)"
      >
        {label}
      </span>
    );
  };

  const renderCopyButton = (key: string, body: string, idleLabel: string) => {
    const isCopied = copiedId === key;
    return (
      <button
        type="button"
        onClick={() => handleCopy(key, body)}
        className={`hems-playbook-noprint inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
          isCopied
            ? "bg-teal-700 border-teal-700 text-white"
            : "bg-white border-slate-300 text-slate-800 hover:border-primary hover:text-primary hover:bg-sky-50"
        }`}
      >
        {isCopied ? <Check size={13} /> : <Copy size={13} />}
        <span>{isCopied ? "Copied ✓" : idleLabel}</span>
      </button>
    );
  };

  const renderChecklistColumn = (
    heading: string,
    items: ChecklistTaskItem[]
  ) => (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
      <h4 className="font-sans text-sm sm:text-base font-bold text-slate-900 mb-3">
        {heading}
      </h4>
      <div className="grid gap-2">
        {items.map((item) => {
          const isDone = checkedTasks[item.id] === true;
          return (
            <label
              key={item.id}
              className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                isDone
                  ? "bg-teal-50/75 border-teal-200"
                  : "bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => handleToggleTask(item.id)}
                className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
              />
              <span className="min-w-0">
                <span
                  className={`block text-[13.5px] font-semibold leading-snug ${
                    isDone ? "line-through text-slate-500" : "text-slate-900"
                  }`}
                >
                  {item.title}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {item.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="hems-playbook-scope max-w-[1160px] mx-auto w-full min-w-0 space-y-8 text-slate-700 print:max-w-none print:space-y-5">
      <style jsx global>{`
        @media print {
          .hems-playbook-noprint {
            display: none !important;
          }
          .hems-playbook-print-block {
            display: block !important;
            margin-bottom: 14px !important;
            page-break-inside: avoid;
          }
          .hems-playbook-scope article,
          .hems-playbook-scope header,
          .hems-playbook-scope .hems-print-keep {
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Top Section Jump-Nav & Live Checklist Progress Bar */}
      <div className="hems-playbook-noprint lg:sticky lg:top-[76px] lg:z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-3 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <nav
            aria-label="Marketing Playbook Sections"
            className="flex flex-wrap items-center gap-1.5"
          >
            {PLAYBOOK_NAV_PILLS.map((pill) => (
              <a
                key={pill.id}
                href={`#${pill.id}`}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:border-primary hover:text-primary hover:bg-sky-50 transition-colors"
              >
                {pill.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-field-label tabular-nums"
              aria-live="polite"
            >
              <span>
                {doneTasksCount} / {totalTasksCount} Tasks Done
              </span>
              <div className="w-24 h-1.5 rounded-full bg-slate-300 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #0369A1, #0F766E)",
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-primary hover:text-primary hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleResetChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Masthead */}
      <header className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
            <div className="w-28 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shrink-0">
              {!failedImages["masthead-logo"] ? (
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Official Emblem"
                  onError={() => markImageFailed("masthead-logo")}
                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                />
              ) : (
                <span className="font-serif font-bold text-xl text-primary tracking-tight">
                  HEMS
                </span>
              )}
            </div>

            <div className="min-w-0">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-primary mb-1.5">
                501(c)(3) Nonprofit Growth Playbook &bull; Brand Spec v3.2.0
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight leading-tight mb-2">
                16th HEMS Workshop Online Advertising &amp; Volunteer Multiplier Plan
              </h1>
              <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                A complete, volunteer-friendly acquisition playbook pairing{" "}
                <strong className="font-semibold text-slate-900">
                  $10,000/month in free 501(c)(3) Google Ad Grants
                </strong>
                , three surgical{" "}
                <strong className="font-semibold text-slate-900">
                  3-week LinkedIn ad bursts
                </strong>
                , free scientific society calendars, and high-leverage organic
                multipliers built directly onto{" "}
                <strong className="font-semibold text-slate-900">
                  hems-workshop.org
                </strong>{" "}
                infrastructure.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-1.5 shrink-0 tabular-nums">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap">
              IRS 501(c)(3) Public Charity &bull; Est. 1999
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-sky-50 border border-sky-200 text-sky-900 whitespace-nowrap">
              Target Cycle: 16th Workshop &bull; September 2027
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-slate-100 border border-slate-200 text-slate-800 whitespace-nowrap">
              LinkedIn Group #4385091 &bull; 436+ Archive Talks
            </span>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mt-5 tabular-nums">
          {PLAYBOOK_KPI_CARDS.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-slate-50/75 border border-slate-200 rounded-xl p-4"
            >
              <div className="text-xs font-semibold text-field-label mb-1">
                {kpi.label}
              </div>
              <div
                className={`text-xl font-bold leading-snug mb-1 ${
                  kpi.accent === "teal"
                    ? "text-teal-700"
                    : kpi.accent === "blue"
                      ? "text-primary"
                      : "text-slate-900"
                }`}
              >
                {kpi.value}
              </div>
              <div className="text-[11.5px] text-slate-500 leading-relaxed">
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Interactive ROI & Budget Simulator */}
      <section id="roi-simulator" className="scroll-mt-32 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-teal-700 mb-1">
            Executive Financial Planning
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            Interactive Media Value &amp; Break-Even Simulator
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Adjust expected monthly Google Ad Grant capture and the three
            LinkedIn burst budgets to model search/social reach and sponsorship
            break-even economics.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sim-grant-monthly"
                  className="flex items-baseline justify-between gap-2 text-xs sm:text-[13px] font-semibold text-field-label mb-1.5"
                >
                  <span>
                    Google Ad Grants Utilization{" "}
                    <span className="font-normal text-slate-500">
                      (501(c)(3) Free In-Kind Credit)
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-900">
                    {formatUsd(grantMonthly)} / mo
                  </span>
                </label>
                <input
                  id="sim-grant-monthly"
                  type="range"
                  min={0}
                  max={10000}
                  step={500}
                  value={grantMonthly}
                  onChange={(e) => setGrantMonthly(Number(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-grant-months"
                  className="flex items-baseline justify-between gap-2 text-xs sm:text-[13px] font-semibold text-field-label mb-1.5"
                >
                  <span>
                    Active Grant Months Before Workshop{" "}
                    <span className="font-normal text-slate-500">
                      (Year-Round Autopilot)
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-900">
                    {grantMonths} {grantMonths === 1 ? "month" : "months"}
                  </span>
                </label>
                <input
                  id="sim-grant-months"
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={grantMonths}
                  onChange={(e) => setGrantMonths(Number(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-burst-cfp"
                  className="flex items-baseline justify-between gap-2 text-xs sm:text-[13px] font-semibold text-field-label mb-1.5"
                >
                  <span>
                    Burst 1: Call for Papers Launch{" "}
                    <span className="font-normal text-slate-500">
                      (3 Weeks &bull; Spring 2027)
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-900">
                    {formatUsd(burstCfp)}
                  </span>
                </label>
                <input
                  id="sim-burst-cfp"
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={burstCfp}
                  onChange={(e) => setBurstCfp(Number(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-burst-grants"
                  className="flex items-baseline justify-between gap-2 text-xs sm:text-[13px] font-semibold text-field-label mb-1.5"
                >
                  <span>
                    Burst 2: $1,500 Student Travel Awards{" "}
                    <span className="font-normal text-slate-500">
                      (3 Weeks &bull; Late Spring 2027)
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-900">
                    {formatUsd(burstGrants)}
                  </span>
                </label>
                <input
                  id="sim-burst-grants"
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={burstGrants}
                  onChange={(e) => setBurstGrants(Number(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-burst-reg"
                  className="flex items-baseline justify-between gap-2 text-xs sm:text-[13px] font-semibold text-field-label mb-1.5"
                >
                  <span>
                    Burst 3: Early-Bird Reg &amp; Sponsors{" "}
                    <span className="font-normal text-slate-500">
                      (3 Weeks &bull; Summer 2027)
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-900">
                    {formatUsd(burstReg)}
                  </span>
                </label>
                <input
                  id="sim-burst-reg"
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={burstReg}
                  onChange={(e) => setBurstReg(Number(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="rounded-xl p-3.5 bg-sky-50 border border-sky-200 text-xs sm:text-[13px] text-field-label leading-relaxed">
                <strong className="font-semibold">Modeling Assumptions:</strong>{" "}
                Conservative niche scientific blended CPC of{" "}
                <strong className="font-semibold">$1.85</strong> on Google Ad
                Grants search (~2.5% landing conversion to signup/CFP/PDF) and{" "}
                <strong className="font-semibold">$5.25</strong> manual-bid CPC
                on hyper-targeted LinkedIn Matched &amp; Lookalike Audiences.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 tabular-nums">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900">
                  {formatUsd(simMetrics.cashTotal)}
                </div>
                <div className="text-[11.5px] font-semibold text-field-label mt-0.5">
                  Total Paid Cash Budget
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-lg sm:text-xl font-bold text-teal-700">
                  {formatUsd(simMetrics.totalMedia)}
                </div>
                <div className="text-[11.5px] font-semibold text-field-label mt-0.5">
                  Total Media Value (Grant + Paid)
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  ~{simMetrics.totalClicks.toLocaleString("en-US")}
                </div>
                <div className="text-[11.5px] font-semibold text-field-label mt-0.5">
                  Qualified Researcher Clicks
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900">
                  {simMetrics.breakEvenLabel}
                </div>
                <div className="text-[11.5px] font-semibold text-field-label mt-0.5">
                  Paid Cash Break-Even ($1,350 / $500)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: ONLINE ADS */}
      <section id="section-1-ads" className="scroll-mt-32 space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-primary mb-1">
            Pillar 1 &bull; Core Recommendation Implementation
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            1. Where to Spend Ads (and Unlocking $10,000/Month Free)
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Combine year-round 501(c)(3) Google Search Grants, three tightly
            scoped 21-day LinkedIn bursts, and high-trust scientific society
            calendars.
          </p>
        </div>

        {/* 1.1 Google Ad Grants */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                1.1 Google for Nonprofits &rarr; Google Ad Grants ($10,000/month
                Free Search Ads)
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Runs year-round on autopilot bidding on high-intent scientific
                searches, routing researchers straight to{" "}
                <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">
                  /archive
                </code>
                ,{" "}
                <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">
                  /call-for-papers
                </code>
                , and{" "}
                <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">
                  /student-awards
                </code>
                .
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap tabular-nums">
              Est. Setup: 2–3 Hours &bull; Cost: $0/mo
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <h4 className="font-sans text-sm font-bold text-slate-900 mb-2">
                Step-by-Step 501(c)(3) Activation Checklist
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-[13.5px] leading-relaxed">
                <li>
                  <strong className="text-slate-900">
                    Verify Nonprofit Status:
                  </strong>{" "}
                  Enroll{" "}
                  <em>
                    Harsh-Environment Mass Spectrometry Society, Inc.
                  </em>{" "}
                  (Florida 501(c)(3) EIN) at{" "}
                  <strong className="text-slate-900">
                    google.com/nonprofits
                  </strong>{" "}
                  via Google&apos;s verification partner (Goodstack / Percent).
                  Expect 2–5 business days for approval.
                </li>
                <li>
                  <strong className="text-slate-900">
                    Enable Google Analytics 4 Conversions First:
                  </strong>{" "}
                  Because <code className="text-xs">hems-workshop.org</code>{" "}
                  already fires structured telemetry events (
                  <code className="text-xs">mailing_signup</code>,{" "}
                  <code className="text-xs">outbound_click</code>,{" "}
                  <code className="text-xs">mailto_click</code>, abstract/PDF
                  downloads), mark those key actions as Conversions inside GA4
                  and link GA4 to the Google Ad Grants account.
                </li>
                <li>
                  <strong className="text-slate-900">
                    Activate &ldquo;Maximize Conversions&rdquo; Bidding:
                  </strong>{" "}
                  Ad Grants normally caps manual bids at $2.00 CPC—often too low
                  for competitive terms. Enabling conversion-based Smart Bidding
                  automatically lifts the $2.00 cap so HEMS wins top
                  scientific search placements for free.
                </li>
                <li>
                  <strong className="text-slate-900">
                    Maintain Ad Grants Compliance Automatically:
                  </strong>{" "}
                  Keep at least 2 active ad groups per campaign, 2 Responsive
                  Search Ads per ad group, 2+ sitelink extensions (
                  <code className="text-xs">/archive</code>,{" "}
                  <code className="text-xs">/student-awards</code>,{" "}
                  <code className="text-xs">/call-for-papers</code>,{" "}
                  <code className="text-xs">/corporate-sponsorship</code>),
                  geo-targeting across US/Canada/Europe/Japan/Australia research
                  hubs, and an account-wide CTR &ge; 5.0% (enforced by our
                  Negative Keyword Shield).
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-3.5 bg-rose-50 border border-rose-200 text-[13px] text-rose-900 leading-relaxed">
                <strong className="font-semibold">
                  Critical Warning — Protect CTR From &ldquo;HEMS&rdquo; Acronym
                  Collisions:
                </strong>
                <br />
                In broader search traffic, <em>HEMS</em> also means{" "}
                <strong>Helicopter Emergency Medical Services</strong> and{" "}
                <strong>Home Energy Management Systems</strong>. Without strict
                negative keywords, irrelevant clicks will burn grant budget and
                drop CTR below Google&apos;s mandatory 5% rule. Always use
                Exact/Phrase match on multi-word instrumentation terms and apply
                the negative shield below at the Account Level.
              </div>

              <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                  <span className="text-xs font-bold text-field-label">
                    Account-Level Negative Keyword Shield (Paste Into Google Ads)
                  </span>
                  {renderCopyButton(
                    "neg-keywords",
                    NEGATIVE_KEYWORD_SHIELD,
                    "Copy Shield"
                  )}
                </div>
                <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0">
                  {NEGATIVE_KEYWORD_SHIELD}
                </pre>
              </div>
            </div>
          </div>

          {/* 4 Google Ad Grant Campaigns */}
          <div className="pt-2">
            <h4 className="font-sans text-sm font-bold text-slate-900 mb-2.5">
              Four Ready-to-Launch Google Ad Grants Search Campaigns (With Exact
              RSA Ad Copy)
            </h4>
            <div
              className="hems-playbook-noprint flex flex-wrap gap-1.5 mb-3"
              role="tablist"
              aria-label="Google Ad Grants Campaigns"
            >
              {GOOGLE_AD_GRANT_CAMPAIGNS.map((camp) => {
                const isActive = activeGagTab === camp.id;
                return (
                  <button
                    key={camp.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveGagTab(camp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary border-primary text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {camp.tabLabel}
                  </button>
                );
              })}
            </div>

            {GOOGLE_AD_GRANT_CAMPAIGNS.map((camp) => {
              const isActive = activeGagTab === camp.id;
              return (
                <div
                  key={camp.id}
                  className={`${
                    isActive ? "block" : "hidden"
                  } hems-playbook-print-block`}
                >
                  <div className="hidden print:block text-xs font-bold text-primary mb-1.5">
                    {camp.tabLabel}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                        <span className="text-xs font-bold text-field-label">
                          {camp.keywordsTitle}
                        </span>
                        {renderCopyButton(
                          `${camp.id}-kw`,
                          camp.keywordsBody,
                          "Copy Keywords"
                        )}
                      </div>
                      <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0">
                        {camp.keywordsBody}
                      </pre>
                    </div>

                    <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                        <span className="text-xs font-bold text-field-label">
                          {camp.adTitle}
                        </span>
                        {renderCopyButton(
                          `${camp.id}-ad`,
                          camp.adBody,
                          "Copy Ad Copy"
                        )}
                      </div>
                      <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-all sm:break-words">
                        {camp.adBody}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* 1.2 LinkedIn 3-Week Ad Bursts */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                1.2 Three Surgical 3-Week LinkedIn Ad Bursts ($300–$750 Each —
                Not Year-Round)
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Avoid $8–$12/click bleed by running concentrated 21-day
                single-image bursts exclusively at high-decision milestones.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-sky-50 border border-sky-200 text-sky-900 whitespace-nowrap tabular-nums">
              3 Windows &bull; Total $900–$2,250
            </span>
          </div>

          <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-[13px] text-amber-950 leading-relaxed">
            <strong className="font-semibold">
              Precision Targeting &amp; Bid-Control Checklist (Cuts LinkedIn CPC
              by 40–55%):
            </strong>
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li>
                <strong>Step 1 — Upload HEMS First-Party Seed List:</strong>{" "}
                Export emails from{" "}
                <Link
                  href="/operations/mailing-list"
                  className="font-semibold text-primary hover:underline"
                >
                  Operations Portal &rarr; Mailing List (/operations/mailing-list)
                </Link>{" "}
                and upload as a <strong>LinkedIn Matched Audience</strong>.
                Build both a direct Retargeting audience and a 1%{" "}
                <strong>Lookalike Audience</strong>.
              </li>
              <li>
                <strong>
                  Step 2 — Layer Job Skills, Fields of Study &amp; Competitor
                  Followers:
                </strong>{" "}
                Intersect <em>Skills / Interests</em> (
                <code className="text-xs">Mass Spectrometry</code>,{" "}
                <code className="text-xs">ASMS</code>,{" "}
                <code className="text-xs">Analytical Chemistry</code>,{" "}
                <code className="text-xs">
                  Gas Chromatography-Mass Spectrometry
                </code>
                , <code className="text-xs">Oceanography</code>,{" "}
                <code className="text-xs">Spaceflight Instrumentation</code>)
                with <em>Followers of HEMS Corporate Sponsors</em>{" "}
                (vacuum/analyzer OEMs &amp; instrumentation firms).
              </li>
              <li>
                <strong>
                  Step 3 — Mandatory Cost Guards Before Launching:
                </strong>{" "}
                Uncheck <strong>Audience Expansion</strong> and uncheck{" "}
                <strong>LinkedIn Audience Network</strong> (both burn budget on
                off-platform mobile apps). Choose{" "}
                <strong>Website Visits</strong> +{" "}
                <strong>Manual CPC Bid ($4.50–$6.00)</strong> with a daily cap
                of $20–$35/day for 21 days.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {LINKEDIN_AD_BURSTS.map((burst) => (
              <div
                key={burst.id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mb-2 tabular-nums ${
                      burst.badgeTone === "teal"
                        ? "bg-teal-50 border-teal-200 text-teal-800"
                        : burst.badgeTone === "amber"
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-sky-50 border-sky-200 text-sky-900"
                    }`}
                  >
                    {burst.badgeText}
                  </span>
                  <h4 className="font-sans text-sm font-bold text-slate-900">
                    {burst.title}
                  </h4>
                  <p className="text-[13px] text-slate-600 mt-1">
                    {burst.description}
                  </p>
                </div>

                <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                    <span className="text-xs font-bold text-field-label">
                      {burst.copyTitle}
                    </span>
                    {renderCopyButton(burst.id, burst.copyBody, "Copy")}
                  </div>
                  <pre className="p-3 text-[12.5px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-all sm:break-words">
                    {burst.copyBody}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* 1.3 Free Scientific Society Calendars */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                1.3 Free Scientific Society Calendars &amp; Interest Groups
                (Higher Trust Than Paid Ads)
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Submit event dates, CFP deadlines, and $1,500 student travel
                award notices once dates/venue lock in Spring 2027.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap">
              Cost: $0 &bull; Highest Conversion Quality
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Society / Publication
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Exact Placement Channel
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Target Researcher Segment
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Best Trigger Moment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {SOCIETY_CALENDARS.map((row) => (
                  <tr key={row.society} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-semibold text-slate-900 align-top">
                      {row.society}
                    </td>
                    <td className="px-3 py-2.5 align-top">{row.channel}</td>
                    <td className="px-3 py-2.5 align-top">{row.segment}</td>
                    <td className="px-3 py-2.5 align-top">
                      {row.triggerMoment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-bold text-field-label">
                  65-Word Calendar Listing Blurb (ASMS / LPI / Trade Portals)
                </span>
                {renderCopyButton(
                  "cal-short",
                  CALENDAR_SHORT_COPY,
                  "Copy 65-Word Listing"
                )}
              </div>
              <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-all sm:break-words">
                {CALENDAR_SHORT_COPY}
              </pre>
            </div>

            <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-bold text-field-label">
                  140-Word Section Newsletter Announcement (AGU / PEN / OCB /
                  ANYL)
                </span>
                {renderCopyButton(
                  "cal-long",
                  CALENDAR_LONG_COPY,
                  "Copy Newsletter Post"
                )}
              </div>
              <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-all sm:break-words">
                {CALENDAR_LONG_COPY}
              </pre>
            </div>
          </div>
        </article>
      </section>

      {/* SECTION 2: ZERO-BUDGET MULTIPLIERS */}
      <section id="section-2-multipliers" className="scroll-mt-32 space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-teal-700 mb-1">
            Pillar 2 &bull; Minimum Committee Effort Multipliers
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            2. Zero-Budget Organic Multipliers (Built Onto HEMS Site Tools)
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Turn HEMS&apos;s 436+ open-access archival talks, 52+ loyal corporate
            sponsors, and 40 graduate departments into self-reinforcing free
            reach.
          </p>
        </div>

        {/* 2.1 Batch-Schedule From the HEMS Archive */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                2.1 Batch-Schedule &ldquo;From the HEMS Archive&rdquo; Posts on
                LinkedIn (45 Minutes = 6 Months)
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Use the built-in <strong>Cite / Share</strong> button on any
                talk inside <code className="text-xs">hems-workshop.org/archive</code>{" "}
                plus LinkedIn&apos;s native clock scheduler to queue 1 post per
                month, tagging authors, labs, and instrument companies.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap tabular-nums">
              Time Required: 45 min / 6 mos &bull; Cost: $0
            </span>
          </div>

          <ol className="list-decimal pl-5 space-y-1.5 text-[13.5px] leading-relaxed">
            <li>
              Open{" "}
              <Link
                href="/archive"
                className="font-semibold text-primary hover:underline"
              >
                <code className="text-xs">hems-workshop.org/archive</code>
              </Link>{" "}
              (or a year page such as{" "}
              <Link
                href="/archive/2025"
                className="text-primary hover:underline"
              >
                <code className="text-xs">/archive/2025</code>
              </Link>{" "}
              or{" "}
              <Link
                href="/archive/2019"
                className="text-primary hover:underline"
              >
                <code className="text-xs">/archive/2019</code>
              </Link>
              ) and click <strong>Cite / Share</strong> on a standout talk.
            </li>
            <li>
              Click <strong>Copy Post Draft</strong> (auto-appends{" "}
              <code className="text-xs">?src=linkedin-archive-share</code> for
              attribution in {renderAnalyticsReference("/admin/analytics")}) or
              customize one of the 6 pre-written spotlights below.
            </li>
            <li>
              Post in the official <strong>HEMS LinkedIn Group</strong> (
              <a
                href="https://www.linkedin.com/groups/4385091/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <code className="text-xs">linkedin.com/groups/4385091/</code>
              </a>
              ) AND on an officer&apos;s personal LinkedIn feed using
              LinkedIn&apos;s <strong>Schedule for later</strong> icon
              (once/month for 6 months).{" "}
              <strong className="text-slate-900">
                Always <code className="text-xs">@mention</code> the lead
                author, their institution, and any instrument OEM partner
              </strong>
              —tagged communications teams routinely repost for free.
            </li>
          </ol>

          <div
            className="hems-playbook-noprint flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="6 Monthly Archive Spotlight Drafts"
          >
            {ARCHIVE_MONTHLY_SPOTLIGHTS.map((item) => {
              const isActive = activeArchiveTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveArchiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary border-primary text-white"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {item.tabLabel}
                </button>
              );
            })}
          </div>

          {ARCHIVE_MONTHLY_SPOTLIGHTS.map((item) => {
            const isActive = activeArchiveTab === item.id;
            return (
              <div
                key={item.id}
                className={`${
                  isActive ? "block" : "hidden"
                } hems-playbook-print-block`}
              >
                <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                    <span className="text-xs font-bold text-field-label">
                      {item.boxTitle}
                    </span>
                    {renderCopyButton(
                      item.id,
                      item.body,
                      "Copy LinkedIn Post"
                    )}
                  </div>
                  <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-words">
                    {item.body}
                  </pre>
                </div>
              </div>
            );
          })}
        </article>

        {/* 2.2 Sponsor & Speaker 1-Click LinkedIn Cards */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                2.2 Give Confirmed Sponsors &amp; Speakers a &ldquo;1-Click
                LinkedIn Promo Kit&rdquo;
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Each confirmed corporate sponsor (with dedicated marketing teams)
                and accepted presenter gets a clean promo visual + 2-sentence
                copy + a tracked partner link—turning 20+ organizations into
                zero-cost distributors.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-sky-50 border border-sky-200 text-sky-900 whitespace-nowrap">
              Multiplies Reach Across 20–50+ Partner Feeds
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div
                className="p-5 text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #0F172A 0%, #075985 60%, #0F766E 100%)",
                }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-sky-200 mb-1.5">
                  Official Corporate Sponsor &bull; 16th Biennial Workshop
                </div>
                <div className="font-serif text-xl font-semibold leading-snug mb-2">
                  We&apos;re Exhibiting at the 16th HEMS Workshop
                </div>
                <div className="text-xs text-slate-200">
                  Harsh-Environment Mass Spectrometry Society &bull; September
                  2027 &bull; Single-Track Forum
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Target Graphic Spec: 1200&times;627 px SVG/PNG w/ Partner Logo
                  Badge
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 border border-sky-200 text-sky-900">
                  ?utm_source=sponsor
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div
                className="p-5 text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #0F172A 0%, #0F766E 70%, #0369A1 100%)",
                }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-sky-200 mb-1.5">
                  Accepted Technical Presentation &bull; Peer-Reviewed Program
                </div>
                <div className="font-serif text-xl font-semibold leading-snug mb-2">
                  Our Group Is Presenting at the 16th HEMS Workshop
                </div>
                <div className="text-xs text-slate-200">
                  Field-Portable, Deep-Ocean, Planetary &amp; Atmospheric MS
                  &bull; September 2027
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Include Talk/Poster Title Card + Presenter Name</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-800">
                  ?utm_source=speaker
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-bold text-field-label">
                  Confirmed Sponsor Email (Send From
                  tim.short@hems-workshop.org)
                </span>
                {renderCopyButton(
                  "sponsor-kit-email",
                  SPONSOR_KIT_EMAIL,
                  "Copy Sponsor Kit Email"
                )}
              </div>
              <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-words">
                {SPONSOR_KIT_EMAIL}
              </pre>
            </div>

            <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-bold text-field-label">
                  Accepted Speaker Email Insert (Add to Acceptance Notifications)
                </span>
                {renderCopyButton(
                  "speaker-kit-email",
                  SPEAKER_KIT_EMAIL,
                  "Copy Speaker Snippet"
                )}
              </div>
              <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-words">
                {SPEAKER_KIT_EMAIL}
              </pre>
            </div>
          </div>
        </article>

        {/* 2.3 Email Printable Student Award Flyer */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                2.3 Email the Printable 1-Page Student Award Flyer to ~40
                Graduate Program Coordinators
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Attaching or linking{" "}
                <Link
                  href="/student-awards?print=1"
                  className="text-primary font-medium hover:underline"
                >
                  <code className="text-xs">
                    hems-workshop.org/student-awards/?print=1
                  </code>
                </Link>{" "}
                gives department administrators a 10-second forwardable flyer,
                consistently introducing new research groups to HEMS.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap tabular-nums">
              40 Departments &bull; Target: $1,500.00 Awards
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-sans text-sm font-bold text-slate-900 mb-2">
                4-Cluster Target Roster (~40 Graduate Departments)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                      <th className="px-3 py-2 whitespace-nowrap">
                        Discipline Cluster
                      </th>
                      <th className="px-3 py-2 whitespace-nowrap">Count</th>
                      <th className="px-3 py-2">
                        Representative Institutions to Target
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {GRAD_COORDINATOR_CLUSTERS.map((row) => (
                      <tr key={row.discipline} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2.5 font-semibold text-slate-900 align-top">
                          {row.discipline}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums whitespace-nowrap align-top">
                          {row.count}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          {row.institutions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                  <span className="text-xs font-bold text-field-label">
                    Graduate Coordinator Forwarding Email Template (With Print
                    PDF Link)
                  </span>
                  {renderCopyButton(
                    "grad-flyer-email",
                    GRAD_FLYER_EMAIL,
                    "Copy Coordinator Email"
                  )}
                </div>
                <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-words">
                  {GRAD_FLYER_EMAIL}
                </pre>
              </div>

              <div className="rounded-xl p-3.5 bg-teal-50 border border-teal-200 text-[13px] text-teal-900 leading-relaxed">
                <strong>1-Minute PDF Generation Step:</strong> Visit{" "}
                <Link
                  href="/student-awards?print=1"
                  className="font-semibold text-teal-900 underline"
                >
                  <code className="text-xs">
                    https://www.hems-workshop.org/student-awards/?print=1
                  </code>
                </Link>{" "}
                in Chrome, press <strong>Ctrl+P &rarr; Save as PDF</strong>{" "}
                (Margins: None/Minimum), and attach{" "}
                <code className="text-xs">
                  HEMS_2027_Student_Travel_Award_Flyer.pdf
                </code>{" "}
                to 4 batches of 10 BCC emails via Google Workspace.
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* SECTION 3: EXTENDED MARKETING PLAN */}
      <section id="section-3-extended" className="scroll-mt-32 space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-primary mb-1">
            Pillar 3 &bull; Extensive Strategy Building on Prior Notes
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            3. High-Leverage Additions Built for HEMS&apos;s Portal &amp;
            Community
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Seven compounding extensions tailored specifically to an intimate
            single-track 501(c)(3) scientific symposium and HEMS&apos;s new
            Firestore/Google Workspace web platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 3.1 */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-sans text-base font-bold text-slate-900">
                  3.1 Segmented Reactivation via Mailing List &amp;
                  Announcements Portals
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Leverage Cohort Tags inside{" "}
                  <Link
                    href="/operations/mailing-list"
                    className="text-primary font-medium hover:underline"
                  >
                    <code className="text-xs">/operations/mailing-list</code>
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/operations/announcements"
                    className="text-primary font-medium hover:underline"
                  >
                    <code className="text-xs">/operations/announcements</code>
                  </Link>{" "}
                  instead of sending generic blasts.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 border border-sky-200 text-sky-900 whitespace-nowrap">
                Operations Portal Built-In
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-[13.5px] leading-relaxed">
              <li>
                <strong className="text-slate-900">
                  Cohort A — Lapsed Workshop Alumni (1999–2023):
                </strong>{" "}
                Tag attendees from earlier cycles who missed the 15th Workshop
                with a &ldquo;15th Proceedings Are Now Free &amp; Online&rdquo;
                note linking{" "}
                <Link href="/archive/2025" className="text-primary underline">
                  <code className="text-xs">/archive/2025</code>
                </Link>{" "}
                + Save the Date. Reconnecting alumni typically converts at
                3&times; cold outreach rates.
              </li>
              <li>
                <strong className="text-slate-900">
                  Cohort B — 52+ Historical Corporate Sponsors:
                </strong>{" "}
                Export sponsor contacts via{" "}
                <Link
                  href="/operations/mailing-list"
                  className="text-primary underline"
                >
                  <code className="text-xs">/operations/mailing-list</code>
                </Link>{" "}
                Export Modal and invite prior exhibitors early via{" "}
                <code className="text-xs">tim.short@hems-workshop.org</code>{" "}
                using the printable{" "}
                <Link
                  href="/corporate-sponsorship?print=1"
                  className="text-primary underline"
                >
                  <code className="text-xs">/corporate-sponsorship/?print=1</code>
                </Link>{" "}
                1-pager.
              </li>
              <li>
                <strong className="text-slate-900">
                  Cohort C — Past Student Travel Award Winners:
                </strong>{" "}
                Showcase alumni from the{" "}
                <strong>Student Travel Awards Honor Roll</strong> (
                <Link href="/student-awards" className="text-primary underline">
                  <code className="text-xs">/student-awards</code>
                </Link>
                ) who are now faculty, national-lab staff, or instrumentation
                startup founders—asking each to nominate 1 current PhD student.
              </li>
              <li>
                <strong className="text-slate-900">
                  Cohort D — General Subscribers Never Attending Yet:
                </strong>{" "}
                Invite archive downloaders who signed up via{" "}
                <code className="text-xs">Contact</code>/
                <code className="text-xs">Archive</code> to make September 2027
                their first in-person HEMS workshop.
              </li>
            </ul>
          </article>

          {/* 3.2 */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-sans text-base font-bold text-slate-900">
                  3.2 &ldquo;Zero-Booth&rdquo; Conference Talk Final-Slide &amp;
                  QR Strategy
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Turn committee members&apos; own talks at ASMS, AGU, Pittcon,
                  and Ocean Sciences into live recruitment funnels for $0 booth
                  cost.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap">
                $0 Exhibit Fee
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-[13.5px] leading-relaxed">
              <li>
                <strong className="text-slate-900">
                  Standardize 1 Final Acknowledgement Slide:
                </strong>{" "}
                Create one crisp Alabaster/Sapphire HEMS invitation slide
                (featuring a clean QR code pointing to{" "}
                <code className="text-xs break-all">
                  /call-for-papers/?utm_source=conf-slide&amp;utm_medium=qr&amp;utm_campaign=asms-2027
                </code>
                ) that every Board Member and friendly PI includes on their
                talk/poster conclusion slide throughout 2026–2027.
              </li>
              <li>
                <strong className="text-slate-900">
                  Co-Anchor the ASMS Harsh-Environment Interest Group Evening
                  Session:
                </strong>{" "}
                Distribute physical 4&times;6 postcard handouts pointing straight
                to <code className="text-xs">/student-awards/?print=1</code> and{" "}
                <code className="text-xs">/archive</code>—historically
                HEMS&apos;s single highest-converting in-person funnel.
              </li>
              <li>
                <strong className="text-slate-900">
                  Host a 30-Minute Virtual &ldquo;Ask the Program Committee&rdquo;
                  Info Session:
                </strong>{" "}
                Once in Spring 2027 before abstract close for prospective
                first-time grad students (recorded &amp; embedded or linked from{" "}
                <Link
                  href="/call-for-papers"
                  className="text-primary underline"
                >
                  <code className="text-xs">/call-for-papers</code>
                </Link>
                ).
              </li>
            </ul>
          </article>

          {/* 3.3 */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-sans text-base font-bold text-slate-900">
                  3.3 Technical SEO, PDF Scholar Indexing &amp; AI Answer
                  Citations (<code className="text-xs">llms.txt</code>)
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Capture researchers asking Google, Google Scholar, ChatGPT, or
                  Perplexity for field mass spectrometry priors.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 border border-sky-200 text-sky-900 whitespace-nowrap">
                Compounding Moat
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-[13.5px] leading-relaxed">
              <li>
                <strong className="text-slate-900">
                  Leverage HEMS&apos;s Canonical Schema +{" "}
                  <code className="text-xs">llms.txt</code>:
                </strong>{" "}
                Because the site already publishes Knowledge Graph JSON-LD and{" "}
                <code className="text-xs">/llms.txt</code> alongside 1,590
                proceedings PDFs, submitting the XML sitemap in Google Search
                Console ensures every talk title, author, and instrumentation
                keyword ranks organically—lowering Google Ad Grant CPC and
                doubling organic search traffic.
              </li>
              <li>
                <strong className="text-slate-900">
                  Publish 3 Curated &ldquo;Topic Guides&rdquo; Derived From
                  Existing Talks:
                </strong>{" "}
                Without writing new papers, link curated talk collections on
                LinkedIn (e.g.,{" "}
                <em>
                  &ldquo;Top 5 Deep-Ocean MIMS Talks in the HEMS Archive&rdquo;
                </em>
                ,{" "}
                <em>
                  &ldquo;How NASA &amp; University Teams Qualified Ion Traps for
                  Ocean Worlds&rdquo;
                </em>
                ). Listicle posts earn 3–5&times; higher saves and shares among
                grad students.
              </li>
              <li>
                <strong className="text-slate-900">
                  Add a &ldquo;DOI / Cite This Talk&rdquo; Prompt to Authors:
                </strong>{" "}
                Encourage past HEMS presenters to list their free HEMS archive
                talk URL on Google Scholar, ORCID, and lab publication
                pages—building authoritative <code className="text-xs">.edu</code>{" "}
                and <code className="text-xs">.gov</code> backlinks back to{" "}
                <code className="text-xs">hems-workshop.org</code>.
              </li>
            </ul>
          </article>

          {/* 3.4 */}
          <article className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-sans text-base font-bold text-slate-900">
                  3.4 Abstract Co-Author Conversion &amp; Industry Demo
                  Spotlight Loop
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Every submitted abstract averages 3–5 co-authors and often
                  relies on specific OEM vacuum/electronics hardware.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-800 whitespace-nowrap">
                Program Leverage
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-[13.5px] leading-relaxed">
              <li>
                <strong className="text-slate-900">
                  Co-Author Invitation Loop:
                </strong>{" "}
                When an abstract is accepted in the{" "}
                <strong>Reviewer Panel &rarr; Abstract Overview</strong>{" "}
                workflow, prompt the submitting corresponding author to share
                registration + Student Award links with all listed co-authors
                and affiliated engineering labs.
              </li>
              <li>
                <strong className="text-slate-900">
                  Corporate &ldquo;Live Hardware Demo Hour&rdquo; Promotion:
                </strong>{" "}
                Feature confirmed $1,350 sponsors in a single &ldquo;What
                Hardware Will Be on the Floor in September 2027?&rdquo; teaser
                post 4 weeks pre-workshop—giving engineering managers a concrete
                technical reason to approve travel budgets.
              </li>
              <li>
                <strong className="text-slate-900">
                  Post-Workshop 48-Hour Photo &amp; Proceedings Loop:
                </strong>{" "}
                Capture group deployment/tabletop photos in September 2027 to
                seed Month 1 of the 2029 cycle (and tag every Student Travel
                Award recipient&apos;s institution immediately).
              </li>
            </ul>
          </article>
        </div>
      </section>

      {/* SECTION 4: ON-SITE SPONSORSHIP, HOST RECOGNITION & 3RD-PARTY AD ASSESSMENT */}
      <section id="section-4-onsite-ads" className="scroll-mt-32 space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-primary mb-1">
            Pillar 4 &bull; @prod &amp; @brand On-Site Monetization &amp; Host
            Value Review
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            4. On-Site 3rd-Party Ads, Curated Whitelists &amp; Permanent Host
            Recognition
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Evaluating permanent free archive placement for Workshop Hosts
            alongside 1–3 small, professional partner spots—without jeopardizing
            HEMS&apos;s $10,000/mo Google Ad Grant, 501(c)(3) tax exemption, or
            scholarly visual identity.
          </p>
        </div>

        {/* 4.1 Statutory Guardrails & 5-Method Matrix */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                4.1 Statutory Guardrails &amp; 5-Method Evaluation Matrix
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Why open programmatic networks conflict with HEMS&apos;s
                nonprofit economics, while curated first-party sponsorship and
                host recognition generate real upside.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap tabular-nums">
              Net Upside: $2,250–$4,500/yr + Host ROI
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 bg-rose-50 border border-rose-200 text-[13px] text-rose-900 leading-relaxed">
              <strong>
                Policy Guardrail 1 — Protect the $10,000/mo ($120,000/yr)
                Google Ad Grant:
              </strong>
              <br />
              Google Ad Grants Website Policy strictly restricts{" "}
              <strong>Google AdSense</strong> and third-party commercial display
              ad networks on grantee websites. Putting external programmatic ad
              scripts on <code className="text-xs">hems-workshop.org</code> to
              earn ~$12–$25/month in display CPMs risks suspending up to{" "}
              <strong>$120,000/year in free Google Search grants</strong>. By
              contrast, clearly framed nonprofit sponsor/underwriter
              acknowledgments and host institution credits are permitted.
            </div>

            <div className="rounded-xl p-4 bg-teal-50 border border-teal-200 text-[13px] text-teal-900 leading-relaxed">
              <strong>
                Policy Guardrail 2 — IRS IRC &sect; 513(i) Qualified Sponsorship
                ($0 Tax vs. UBIT):
              </strong>
              <br />
              Under Internal Revenue Code <strong>&sect; 513(i)</strong>, a
              tax-exempt 501(c)(3) avoids Unrelated Business Income Tax (UBIT /
              Form 990-T) as long as sponsor or host cards are{" "}
              <strong>value-neutral acknowledgments</strong> (logo, organization
              name, technical product domain, location, and URL). Copy using
              comparative claims (<em>&ldquo;Best vacuum pump&rdquo;</em>),
              discounts (<em>&ldquo;15% Off&rdquo;</em>), or third-party ad
              exchanges converts tax-free sponsorship into taxable advertising.
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                  <th className="px-3 py-2.5">On-Site Method</th>
                  <th className="px-3 py-2.5">Pros &amp; Strategic Value</th>
                  <th className="px-3 py-2.5">
                    Cons, Minimums &amp; Policy Risks
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Est. Annual Net
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Ad Grant Safe?
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ONSITE_EVAL_ROWS.map((row) => (
                  <tr key={row.method} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-semibold text-slate-900 align-top">
                      {row.method}
                    </td>
                    <td className="px-3 py-2.5 align-top">{row.pros}</td>
                    <td className="px-3 py-2.5 align-top">{row.cons}</td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap align-top">
                      <span className="font-semibold text-slate-900 block">
                        {row.estAnnualNet}
                      </span>
                      {row.estAnnualSub && (
                        <span className="text-[11.5px] text-slate-500">
                          {row.estAnnualSub}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap align-top">
                      <strong className="text-slate-900 block">
                        {row.adGrantSafe}
                      </strong>
                      <span className="text-[11.5px] text-slate-500">
                        {row.adGrantNote}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          row.verdictTone === "yes"
                            ? "bg-teal-50 border-teal-200 text-teal-800"
                            : row.verdictTone === "cond"
                              ? "bg-amber-50 border-amber-200 text-amber-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        {row.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* 4.2 Permanent Archive Host Showcase */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                4.2 Permanent Free Host Recognition on{" "}
                <code className="text-sm">/archive/[year]</code> (Zero-Cost Host
                Recruitment Asset)
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Upgrade HEMS&apos;s existing{" "}
                <code className="text-xs">host_corporation</code> field in
                archive JSON files into a permanent, high-value patronage
                showcase on every workshop year page.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-sky-50 border border-sky-200 text-sky-900 whitespace-nowrap">
              @prod + @brand Endorsed
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
              <h4 className="font-sans text-sm font-bold text-slate-900 mb-2">
                Why Hosts Value Permanent Archive Placement
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-[13.5px] leading-relaxed">
                <li>
                  <strong>Tangible ROI for Out-of-Pocket Host Costs:</strong>{" "}
                  University marine/chemistry departments, national labs, and
                  instrument firms absorb AV, local coordination, reception
                  guarantees, and staff hours when hosting HEMS. Granting a
                  permanent showcase on{" "}
                  <code className="text-xs">/archive/[year]</code> turns a 3-day
                  hospitality outlay into a{" "}
                  <strong>decade-long technical credibility asset</strong>.
                </li>
                <li>
                  <strong>Zero Marginal Cash Cost to HEMS:</strong> The
                  infrastructure is already statically hosted; recognizing all
                  15 historic hosts (1999–2025) and future 2027/2029 hosts costs{" "}
                  <strong>$0</strong>.
                </li>
                <li>
                  <strong>Codebase Readiness Note:</strong> Archive datasets (
                  <code className="text-xs">1999.json</code>–
                  <code className="text-xs">2025.json</code>) already populate{" "}
                  <code className="text-xs">host_corporation</code> (currently
                  shown as a simple crest box). When ready for engineering
                  implementation, obtain explicit <code className="text-xs">@bo</code>{" "}
                  authorization to lift the{" "}
                  <code className="text-xs">/archive/**</code> lock for{" "}
                  <code className="text-xs">@dev</code> so each year card
                  renders a standardized blurb, venue link, and facility
                  highlights.
                </li>
              </ul>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
              <h4 className="font-sans text-sm font-bold text-slate-900 mb-2">
                Brand &amp; Editorial Guardrails (Avoid Archive Clutter)
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-[13.5px] leading-relaxed">
                <li>
                  <strong>Above Schedule, Below Workshop Metadata:</strong> Keep
                  card vertical height &le; 120px on desktop so presentations,
                  talks, and DownloadGate PDFs remain the immediate hero on{" "}
                  <code className="text-xs">/archive/[year]</code>.
                </li>
                <li>
                  <strong>IRC &sect; 513(i) Scholarly Framing:</strong> Use
                  factual institutional attribution (
                  <em>
                    &ldquo;Host Patron &amp; Technical Program Partner &bull;
                    Provided Local Instrumentation Lab Tour &amp; Welcome
                    Reception&rdquo;
                  </em>
                  )—never promotional sales banners.
                </li>
                <li>
                  <strong>Graceful M&amp;A Governance:</strong> Over 25+ years,
                  corporate hosts evolve (e.g., Hamilton Sundstrand &rarr; UTC
                  Aerospace &rarr; Collins Aerospace). Preserve the historical
                  host name as published at the time of the workshop, with an
                  optional neutral note linking the current successor site.
                </li>
              </ul>
            </div>
          </div>

          <div
            className="hems-playbook-noprint flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Permanent Host Recognition Prototypes"
          >
            {HOST_PROTOTYPE_MOCKS.map((mock) => {
              const isActive = activeHostTab === mock.id;
              return (
                <button
                  key={mock.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveHostTab(mock.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary border-primary text-white"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {mock.tabLabel}
                </button>
              );
            })}
          </div>

          {HOST_PROTOTYPE_MOCKS.map((mock) => {
            const isActive = activeHostTab === mock.id;
            const imgFailed = failedImages[mock.id] === true;
            return (
              <div
                key={mock.id}
                className={`${
                  isActive ? "block" : "hidden"
                } hems-playbook-print-block`}
              >
                <div
                  className={`bg-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs border-l-4 border ${
                    mock.tone === "teal"
                      ? "border-teal-200 border-l-teal-700"
                      : "border-sky-200 border-l-primary"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
                    <div className="w-44 h-19 bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-center shrink-0">
                      {!imgFailed ? (
                        <img
                          src={mock.logoSrc}
                          alt={mock.logoAlt}
                          onError={() => markImageFailed(mock.id)}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <span className="font-serif font-bold text-sm text-primary text-center">
                          {mock.fallbackText}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span
                        className={`inline-block text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-1 ${
                          mock.tone === "teal" ? "text-teal-700" : "text-primary"
                        }`}
                      >
                        {mock.kicker}
                      </span>
                      <div className="font-serif text-lg font-semibold text-slate-900 leading-snug mb-1">
                        {mock.title}
                      </div>
                      <p className="text-[13px] text-slate-600 leading-relaxed mb-2">
                        {mock.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {mock.tags.map((tag, idx) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              idx === 0
                                ? "bg-teal-50 border-teal-200 text-teal-800"
                                : "bg-slate-100 border-slate-200 text-slate-700"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                    <span className="text-xs text-slate-500">
                      External Institutional Link
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                      {mock.ctaText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </article>

        {/* 4.3 Curated 1-3 Whitelist Ad / Underwriter Spots */}
        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-sans text-base sm:text-[17px] font-bold text-slate-900">
                4.3 Curated Whitelist Method: 1 to 3 Small, Professional
                &ldquo;Instrumentation Underwriter&rdquo; Spots
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Replace low-yield external ad networks with up to 3
                strict-whitelist partner cards served cleanly from first-party
                HEMS data (or optional GAM Direct-Sold only).
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-amber-50 border border-amber-200 text-amber-800 whitespace-nowrap">
              Strict Cap: Max 3 Whitelisted OEMs / Year
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-sans text-sm font-bold text-slate-900 mb-2">
                Recommended Implementation Method (First-Party Whitelist vs.
                GAM)
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-[13.5px] leading-relaxed">
                <li>
                  <strong className="text-slate-900">
                    Pre-Approve OEMs Strictly by Committee Whitelist:
                  </strong>{" "}
                  Only admit established scientific instrumentation,
                  vacuum/detector OEMs, analytical software, or academic presses
                  vetted by the HEMS Board (drawing first from the 52 alumni
                  corporate sponsors).
                </li>
                <li>
                  <strong className="text-slate-900">
                    Deliver via First-Party Config (Google Sheet / Static JSON):
                  </strong>{" "}
                  Store 1–3 active underwriter records (
                  <code className="text-xs">slot_id</code>,{" "}
                  <code className="text-xs">company</code>,{" "}
                  <code className="text-xs">logo_url</code>,{" "}
                  <code className="text-xs">neutral_summary</code>,{" "}
                  <code className="text-xs">destination_url</code>,{" "}
                  <code className="text-xs">valid_until</code>) in the same
                  Google Sheet / JSON flow already powering HEMS cycles. Zero
                  external ad-network tags means{" "}
                  <strong>0% ad-blocker filtering</strong> and zero Ad Grants
                  risk.
                </li>
                <li>
                  <strong className="text-slate-900">
                    Track Impressions &amp; Clicks in{" "}
                    {renderAnalyticsReference("/admin/analytics")}:
                  </strong>{" "}
                  Wrap each outbound sponsor URL with first-party{" "}
                  <code className="text-xs">outbound_click</code> telemetry +
                  UTM tags so HEMS delivers an exact annual click report proving
                  sponsor ROI without invasive cookies.
                </li>
                <li>
                  <strong className="text-slate-900">
                    Optional GAM Direct-Sold Upgrade (Only If &gt;5 Sponsors
                    Rotate):
                  </strong>{" "}
                  If demand eventually exceeds 3 annual underwriters and
                  requires automated percentage weighting, enable Google Ad
                  Manager <em>Small Business (Free)</em> strictly with{" "}
                  <strong>AdSense/Dynamic Allocation turned OFF</strong> and
                  whitelisted 1st-party creatives only.
                </li>
              </ol>
            </div>

            <div className="bg-white border border-slate-400/80 rounded-xl overflow-hidden shadow-inner self-start">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-bold text-field-label">
                  Sponsor &amp; Host Prospectus Add-On Copy (For
                  tim.short@hems-workshop.org)
                </span>
                {renderCopyButton(
                  "onsite-pitch-copy",
                  ONSITE_PITCH_COPY,
                  "Copy Offer Pitch"
                )}
              </div>
              <pre className="p-3 text-[13px] text-slate-900 whitespace-pre-wrap leading-relaxed font-sans m-0 break-words">
                {ONSITE_PITCH_COPY}
              </pre>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-sans text-sm font-bold text-slate-900 mb-3">
              Live Brand v3.2.0 Mockup — How 3 Subtle Whitelisted Underwriter
              Spots Look (Zero Banner Clutter)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {WHITELIST_UNDERWRITER_SLOTS.map((slot) => {
                const imgKey = `whitelist-${slot.brandName}`;
                const imgFailed = failedImages[imgKey] === true;
                return (
                  <div
                    key={slot.eyebrow}
                    className={`rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs ${
                      slot.isOpen
                        ? "bg-slate-50/70 border border-dashed border-slate-400"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-[10.5px] font-bold uppercase tracking-[0.08em] ${
                          slot.isOpen ? "text-teal-700" : "text-slate-500"
                        }`}
                      >
                        {slot.eyebrow}
                      </div>

                      {slot.isOpen ? (
                        <div className="w-32 h-13 my-2 bg-slate-100 border border-dashed border-slate-300 rounded-lg px-2 flex items-center justify-center">
                          <span className="text-[11px] font-bold text-field-label text-center leading-tight">
                            {slot.openBoxLine1}
                            <br />
                            {slot.openBoxLine2}
                          </span>
                        </div>
                      ) : (
                        <div className="w-32 h-13 my-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-center">
                          {slot.logoSrc && !imgFailed ? (
                            <img
                              src={slot.logoSrc}
                              alt={slot.logoAlt || slot.brandName}
                              onError={() => markImageFailed(imgKey)}
                              className="max-w-full max-h-full object-contain mix-blend-multiply"
                            />
                          ) : (
                            <span className="font-serif font-bold text-sm text-primary">
                              {slot.fallbackText}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {slot.brandName}
                      </div>
                      <p className="text-[12.5px] text-slate-600 leading-relaxed mt-1">
                        {slot.copy}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11.5px] text-slate-500">
                      <span>{slot.footerLeft}</span>
                      <span
                        className={`font-semibold ${
                          slot.isOpen ? "text-teal-700" : "text-primary"
                        }`}
                      >
                        {slot.footerRight}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </section>

      {/* SECTION 5: MASTER 12-MONTH TIMELINE */}
      <section id="section-4-timeline" className="scroll-mt-32 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-teal-700 mb-1">
            Operational Cadence
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            5. Master 12-Month Biennial Marketing Roadmap (Late 2026 – Oct
            2027)
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Aligns directly with Google Sheet workshop configuration stages (
            <code className="text-xs">save_the_date</code> &rarr;{" "}
            <code className="text-xs">cfp_open</code> &rarr;{" "}
            <code className="text-xs">registration_open</code>).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                  <th className="px-3.5 py-2.5 whitespace-nowrap">
                    Phase &amp; Window
                  </th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">
                    Website State
                  </th>
                  <th className="px-3.5 py-2.5">Primary Paid / Grant Actions</th>
                  <th className="px-3.5 py-2.5">
                    Zero-Budget / Organic Actions
                  </th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">
                    Owner &amp; Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {TWELVE_MONTH_ROADMAP.map((row) => (
                  <tr key={row.phase} className="hover:bg-slate-50/80">
                    <td className="px-3.5 py-3 align-top font-semibold text-slate-900">
                      {row.phase}
                      <span className="block text-xs font-normal text-slate-500 mt-0.5">
                        {row.window}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 align-top">
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs text-slate-800">
                        {row.siteState}
                      </code>
                    </td>
                    <td className="px-3.5 py-3 align-top">{row.paidActions}</td>
                    <td className="px-3.5 py-3 align-top">
                      {row.organicActions}
                    </td>
                    <td className="px-3.5 py-3 align-top whitespace-nowrap">
                      <span className="font-medium text-slate-900 block">
                        {row.owner}
                      </span>
                      <span className="text-xs text-slate-500">{row.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 6: UTM & ANALYTICS ATTRIBUTION */}
      <section id="section-5-utm" className="scroll-mt-32 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-primary mb-1">
            Closed-Loop Measurement
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            6. Pre-Built UTM Links &amp; HEMS Website Analytics Attribution
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Every link below matches the tracking schemas read natively by{" "}
            {renderAnalyticsReference("Board Portal → Website Analytics")} (
            <code className="text-xs">/admin/analytics</code>) and Google
            Analytics 4.
          </p>
        </div>

        <article className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Campaign Channel / Preset
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    Destination Route
                  </th>
                  <th className="px-3 py-2.5">
                    Tracked URL (Matches{" "}
                    <code className="text-[11px] lowercase">
                      /admin/analytics
                    </code>
                    )
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {PREBUILT_UTM_LINKS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-semibold text-slate-900 align-top">
                      {row.channel}
                    </td>
                    <td className="px-3 py-2.5 align-top whitespace-nowrap">
                      {row.destination}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span className="inline-block bg-sky-50 border border-sky-200 text-sky-900 rounded-md px-2 py-0.5 text-xs font-medium break-all">
                        {row.url}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top whitespace-nowrap">
                      {renderCopyButton(row.id, row.url, "Copy URL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl p-4 bg-sky-50 border border-sky-200 text-[13px] text-field-label leading-relaxed">
            <strong>
              How to Read Results Inside{" "}
              {renderAnalyticsReference("/admin/analytics")}:
            </strong>{" "}
            Open <strong>Board Portal &rarr; Website Analytics &rarr; Campaigns</strong>{" "}
            to compare real clicks, mailing-list signups (
            <code className="text-xs">mailing_signup</code>), and officer email
            inquiries (<code className="text-xs">mailto_click</code>) side by
            side across <code className="text-xs">google-ad-grant-2027</code>,{" "}
            <code className="text-xs">li-ad-cfp-2027</code>,{" "}
            <code className="text-xs">li-ad-student-grants-2027</code>,{" "}
            <code className="text-xs">linkedin-archive-share</code>, and{" "}
            <code className="text-xs">sponsor-partner-kit-2027</code>. Use the
            built-in UTM Builder at the bottom of Website Analytics to generate
            additional custom trackable links anytime.
          </div>
        </article>
      </section>

      {/* SECTION 7: INTERACTIVE CHECKLIST */}
      <section id="section-6-checklist" className="scroll-mt-32 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.11em] text-teal-700 mb-1">
            Committee Accountability &bull; Auto-Saved Locally
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
            7. Master Execution Checklist (20 Action Items)
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Check off steps as officers complete them; progress saves
            automatically in this browser for operations &amp; board reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderChecklistColumn(
            "Track A — Google Ad Grants, Paid LinkedIn & On-Site Policy",
            EXECUTION_CHECKLIST_TRACK_A
          )}
          {renderChecklistColumn(
            "Track B — Zero-Budget Multipliers, Calendars & Host Value",
            EXECUTION_CHECKLIST_TRACK_B
          )}
        </div>
      </section>
    </div>
  );
}
