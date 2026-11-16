"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, ExternalLink, Eye, LogOut, X } from "lucide-react";
import { parsePreviewChannelName } from "@/utils/telemetryClient";
import {
  exitWorkshopPreview,
  setPreviewCompareMode,
  useUpcomingWorkshop,
} from "@/hooks/useUpcomingWorkshop";

/**
 * Displays a crisp Board Review Staging ribbon when viewing:
 *  1. A shareable zero-login Admin Draft Preview session (`?preview=<token>`), with
 *     instant A/B switching between Proposed Draft and Current Live (`[Viewing: Draft | Switch to Live]`).
 *  2. An unlisted Firebase Hosting Preview Channel (`hems-workshop--<channel>-<hash>.web.app`).
 * Renders `null` during normal browsing on production and localhost.
 */
export default function PreviewChannelBanner() {
  const pathname = usePathname() || "/";
  const { previewMeta, compareMode } = useUpcomingWorkshop();
  const [channelName, setChannelName] = useState<string | null>(null);
  const [isStaticMode, setIsStaticMode] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const isTokenPreview = Boolean(previewMeta);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detected = parsePreviewChannelName(window.location.hostname);
    setChannelName(detected);

    const envDisabled =
      (process.env.NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC || "").trim().toLowerCase() === "true";
    const queryStatic =
      new URLSearchParams(window.location.search).get("sheet") === "static";
    setIsStaticMode(envDisabled || queryStatic);

    if (detected || isTokenPreview) {
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.setAttribute("name", "robots");
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute("content", "noindex, nofollow");
    }
  }, [pathname, isTokenPreview]);

  if ((!channelName && !isTokenPreview) || dismissed) {
    return null;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const liveCompareUrl = `https://hems-workshop.org${normalizedPath}`;
  const isComparingLive = isTokenPreview && compareMode === "live";

  return (
    <div
      role="region"
      aria-label="Board Review Preview Banner"
      className={`print:hidden px-4 py-2 text-xs font-sans z-[60] border-b transition-colors ${
        isComparingLive
          ? "bg-slate-900 text-slate-50 border-sky-400/40"
          : "bg-amber-950 text-amber-50 border-amber-500/40"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-semibold uppercase tracking-wide text-[10px] border ${
              isComparingLive
                ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                : "bg-amber-500/20 border-amber-400/50 text-amber-200"
            }`}
          >
            <Eye size={12} />
            {isTokenPreview
              ? isComparingLive
                ? `Preview Compare: Live Website (${previewMeta?.label})`
                : `Board Draft Preview: ${previewMeta?.label}`
              : `Board Review Preview (${channelName})`}
          </span>

          <span className={isComparingLive ? "text-slate-200/90" : "text-amber-100/90"}>
            {isTokenPreview ? (
              isComparingLive ? (
                <>
                  Showing <strong>Current Live Website</strong> for side-by-side comparison — analytics paused.
                </>
              ) : (
                <>
                  Showing <strong>Proposed Draft</strong> shared by {previewMeta?.createdByEmail || "HEMS Admin"} — live{" "}
                  <strong>hems-workshop.org</strong> is unchanged &amp; analytics are paused.
                </>
              )
            ) : (
              <>
                Unlisted staging build — live <strong>hems-workshop.org</strong> is unchanged &amp; analytics are paused.
              </>
            )}
          </span>

          {isStaticMode && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900/70 border border-amber-400/30 text-amber-200 text-[10px] font-semibold">
              Static Snapshot Mode
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isTokenPreview && (
            <>
              <button
                type="button"
                onClick={() => setPreviewCompareMode(isComparingLive ? "draft" : "live")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer border ${
                  isComparingLive
                    ? "bg-amber-500/25 hover:bg-amber-500/35 text-amber-100 border-amber-400/50"
                    : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 border-sky-400/40"
                }`}
              >
                <ArrowLeftRight size={12} />
                {isComparingLive
                  ? "Viewing: Live | Switch to Draft"
                  : "Viewing: Draft | Switch to Live"}
              </button>
              <button
                type="button"
                onClick={() => exitWorkshopPreview()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={12} />
                Exit Preview
              </button>
            </>
          )}

          {channelName && !isTokenPreview && (
            <a
              href={liveCompareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-400/40 font-semibold transition-colors"
            >
              Compare with Live Page <ExternalLink size={12} />
            </a>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Hide staging preview banner"
            className="p-1 rounded hover:bg-white/10 text-white/75 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
