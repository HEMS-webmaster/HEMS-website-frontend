"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  captureAndCleanCampaignQuery,
  normalizeTelemetryPath,
  recordTelemetryEvent,
} from "@/utils/telemetryClient";

/**
 * Cookie-free, visible-tab-only first-party telemetry observer.
 * - Ignores background pre-renders & email-gateway link scanners (`visibilityState === "visible"`).
 * - Captures `?src=` first-party email campaign arrivals and cleans the URL bar.
 * - Tracks `mailto:` officer contact clicks and external workshop resource clicks.
 */
export default function TelemetryTracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const lastLoggedRef = useRef<{ path: string; ts: number }>({ path: "", ts: 0 });
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 1. Page-View Tracking (waits briefly for Auth state hydration so signed-in members are attributed cleanly)
  useEffect(() => {
    if (typeof window === "undefined" || loading) return;

    // Immediately capture `?src=` before any user interaction
    captureAndCleanCampaignQuery();

    const normPath = normalizeTelemetryPath(pathname);

    const emitIfVisible = () => {
      if (document.visibilityState !== "visible") return false;
      const now = Date.now();
      if (
        lastLoggedRef.current.path === normPath &&
        now - lastLoggedRef.current.ts < 4000
      ) {
        return true;
      }
      lastLoggedRef.current = { path: normPath, ts: now };
      void recordTelemetryEvent({
        eventType: "page_view",
        path: normPath,
        user: userRef.current,
      });
      return true;
    };

    if (emitIfVisible()) return;

    const onVisibilityChange = () => {
      if (emitIfVisible()) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, loading]);

  // 2. Delegated Click Listener for `mailto:` inquiries & high-value external links (Sponsor Prospectus, Venue Maps, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = (anchor.getAttribute("href") || "").trim();
      if (!href) return;

      if (href.toLowerCase().startsWith("mailto:")) {
        const address = href.slice(7).split("?")[0].trim().toLowerCase();
        void recordTelemetryEvent({
          eventType: "mailto_click",
          targetLabel: address || "mailto",
          user: userRef.current,
        });
        return;
      }

      if (/^https?:\/\//i.test(href)) {
        try {
          const parsed = new URL(href);
          const host = parsed.hostname.toLowerCase();
          const lowerPath = parsed.pathname.toLowerCase();
          const isExternalDomain = !host.endsWith("hems-workshop.org");
          const isSponsorProspectus =
            lowerPath.includes("sponsorship") && lowerPath.endsWith(".pdf");

          if (isExternalDomain || isSponsorProspectus) {
            const label =
              (anchor.textContent || "").trim().slice(0, 70) || parsed.hostname;
            void recordTelemetryEvent({
              eventType: "outbound_click",
              targetLabel: `${label} (${parsed.hostname})`,
              user: userRef.current,
            });
          }
        } catch {
          // Ignore malformed hrefs
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  return null;
}
