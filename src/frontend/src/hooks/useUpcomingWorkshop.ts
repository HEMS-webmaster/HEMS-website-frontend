"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_UPCOMING_WORKSHOP,
  UpcomingWorkshopConfig,
  parseWorkshopSheetCsv,
} from "@/utils/upcomingWorkshop";

interface UseUpcomingWorkshopResult {
  workshop: UpcomingWorkshopConfig;
  isLiveSynced: boolean;
}

let cachedLiveConfig: UpcomingWorkshopConfig | null = null;
let inflightRequest: Promise<UpcomingWorkshopConfig | null> | null = null;

function resolveSheetCsvUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WORKSHOP_SHEET_CSV_URL ?? "";
  return (envUrl || DEFAULT_UPCOMING_WORKSHOP.sheet_csv_url || "").trim();
}

async function fetchLiveSheetConfig(csvUrl: string): Promise<UpcomingWorkshopConfig | null> {
  try {
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from Google Sheet CSV endpoint`);
    }
    const csvText = await response.text();
    const parsed = parseWorkshopSheetCsv(csvText, DEFAULT_UPCOMING_WORKSHOP);
    cachedLiveConfig = parsed;
    return parsed;
  } catch (error) {
    console.error(
      "[useUpcomingWorkshop] Unable to fetch live Google Sheet CSV; retaining static workshop configuration:",
      error
    );
    return null;
  } finally {
    inflightRequest = null;
  }
}

export function useUpcomingWorkshop(): UseUpcomingWorkshopResult {
  const [workshop, setWorkshop] = useState<UpcomingWorkshopConfig>(
    cachedLiveConfig ?? DEFAULT_UPCOMING_WORKSHOP
  );
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(cachedLiveConfig !== null);

  useEffect(() => {
    const csvUrl = resolveSheetCsvUrl();
    if (!csvUrl) {
      return;
    }

    if (cachedLiveConfig) {
      setWorkshop(cachedLiveConfig);
      setIsLiveSynced(true);
      return;
    }

    let cancelled = false;
    if (!inflightRequest) {
      inflightRequest = fetchLiveSheetConfig(csvUrl);
    }

    inflightRequest
      .then((liveConfig) => {
        if (!cancelled && liveConfig) {
          setWorkshop(liveConfig);
          setIsLiveSynced(true);
        }
      })
      .catch((error) => {
        console.error("[useUpcomingWorkshop] Unexpected hydration error:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { workshop, isLiveSynced };
}

