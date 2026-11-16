"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import {
  DEFAULT_UPCOMING_WORKSHOP,
  normalizeWorkshopConfig,
  type UpcomingWorkshopConfig,
} from "@/utils/upcomingWorkshop";

export const WORKSHOP_PREVIEW_TOKEN_KEY = "hems_workshop_preview_token_v1";
export const WORKSHOP_PREVIEW_COMPARE_KEY = "hems_workshop_preview_compare_v1";
export const WORKSHOP_LIVE_CACHE_KEY = "hems_workshop_live_cache_v1";
export const WORKSHOP_CONFIG_UPDATED_EVENT = "hems:workshop-config-updated";

export const MOCK_WORKSHOP_LIVE_KEY = "hems_mock_workshop_live_v1";
export const MOCK_WORKSHOP_DRAFT_KEY = "hems_mock_workshop_draft_v1";
export const MOCK_WORKSHOP_PREVIEWS_KEY = "hems_mock_workshop_previews_v1";
export const MOCK_WORKSHOP_HISTORY_KEY = "hems_mock_workshop_history_v1";

const CACHE_TTL_MS = 10 * 60 * 1000;
const TOKEN_FORMAT_RE = /^[a-zA-Z0-9_-]{4,96}$/;

export type WorkshopConfigSource =
  | "static"
  | "live_cloud"
  | "preview_draft"
  | "preview_live_compare";

export type WorkshopCompareMode = "draft" | "live";

export interface WorkshopPreviewMeta {
  token: string;
  label: string;
  createdByEmail: string;
  expiresAt: string;
}

export interface UseUpcomingWorkshopResult {
  workshop: UpcomingWorkshopConfig;
  isLiveSynced: boolean;
  source: WorkshopConfigSource;
  previewMeta: WorkshopPreviewMeta | null;
  compareMode: WorkshopCompareMode;
}

interface CachedLiveEntry {
  timestamp: number;
  config: Partial<UpcomingWorkshopConfig>;
}

interface StoredPreviewRecord {
  token?: string;
  label?: string;
  createdByEmail?: string;
  expiresAt?: string;
  revoked?: boolean;
  draftSnapshot?: Partial<UpcomingWorkshopConfig>;
}

function safeSessionGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode failures
  }
}

function safeSessionRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage quota or private-mode failures
  }
}

function safeLocalGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function dispatchConfigUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(WORKSHOP_CONFIG_UPDATED_EVENT));
  } catch {
    // Ignore event dispatch failures
  }
}

export function clearWorkshopLiveCache(): void {
  safeSessionRemove(WORKSHOP_LIVE_CACHE_KEY);
}

export function getActivePreviewToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const paramToken = params.get("preview");
    if (paramToken !== null) {
      const trimmed = paramToken.trim();
      const lower = trimmed.toLowerCase();
      if (lower === "off" || lower === "clear" || lower === "false" || lower === "0" || trimmed === "") {
        safeSessionRemove(WORKSHOP_PREVIEW_TOKEN_KEY);
        safeSessionRemove(WORKSHOP_PREVIEW_COMPARE_KEY);
        return null;
      }
      if (TOKEN_FORMAT_RE.test(trimmed)) {
        safeSessionSet(WORKSHOP_PREVIEW_TOKEN_KEY, trimmed);
        return trimmed;
      }
    }
    const stored = safeSessionGet(WORKSHOP_PREVIEW_TOKEN_KEY);
    if (stored && TOKEN_FORMAT_RE.test(stored)) {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

export function getPreviewCompareMode(): WorkshopCompareMode {
  return safeSessionGet(WORKSHOP_PREVIEW_COMPARE_KEY) === "live" ? "live" : "draft";
}

export function setPreviewCompareMode(mode: WorkshopCompareMode): void {
  safeSessionSet(WORKSHOP_PREVIEW_COMPARE_KEY, mode === "live" ? "live" : "draft");
  dispatchConfigUpdated();
}

export function exitWorkshopPreview(): void {
  safeSessionRemove(WORKSHOP_PREVIEW_TOKEN_KEY);
  safeSessionRemove(WORKSHOP_PREVIEW_COMPARE_KEY);
  if (typeof window !== "undefined") {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("preview")) {
        url.searchParams.delete("preview");
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, "", nextUrl);
      }
    } catch {
      // Ignore history mutation errors
    }
  }
  dispatchConfigUpdated();
}

function readCachedLiveConfig(): UpcomingWorkshopConfig | null {
  const raw = safeSessionGet(WORKSHOP_LIVE_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedLiveEntry;
    if (
      parsed &&
      typeof parsed.timestamp === "number" &&
      Date.now() - parsed.timestamp < CACHE_TTL_MS &&
      parsed.config
    ) {
      return normalizeWorkshopConfig(parsed.config, DEFAULT_UPCOMING_WORKSHOP);
    }
  } catch {
    safeSessionRemove(WORKSHOP_LIVE_CACHE_KEY);
  }
  return null;
}

function writeCachedLiveConfig(config: UpcomingWorkshopConfig): void {
  try {
    safeSessionSet(
      WORKSHOP_LIVE_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        config,
      } satisfies CachedLiveEntry)
    );
  } catch {
    // Ignore serialization/quota errors
  }
}

function readMockLiveConfig(): UpcomingWorkshopConfig | null {
  const raw = safeLocalGet(MOCK_WORKSHOP_LIVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { config?: Partial<UpcomingWorkshopConfig> } | Partial<UpcomingWorkshopConfig>;
    const candidate =
      parsed && typeof parsed === "object" && "config" in parsed && parsed.config
        ? parsed.config
        : (parsed as Partial<UpcomingWorkshopConfig>);
    return normalizeWorkshopConfig(candidate, DEFAULT_UPCOMING_WORKSHOP);
  } catch {
    return null;
  }
}

function readMockPreviewRecord(token: string): StoredPreviewRecord | null {
  const raw = safeLocalGet(MOCK_WORKSHOP_PREVIEWS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, StoredPreviewRecord> | StoredPreviewRecord[];
    if (Array.isArray(parsed)) {
      return parsed.find((item) => item?.token === token) ?? null;
    }
    if (parsed && typeof parsed === "object" && token in parsed) {
      return parsed[token] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function isPreviewValid(record: StoredPreviewRecord | null): record is StoredPreviewRecord {
  if (!record || record.revoked === true || !record.draftSnapshot) return false;
  if (record.expiresAt) {
    const expMs = new Date(record.expiresAt).getTime();
    if (!Number.isNaN(expMs) && expMs <= Date.now()) {
      return false;
    }
  }
  return true;
}

export function useUpcomingWorkshop(): UseUpcomingWorkshopResult {
  const [state, setState] = useState<UseUpcomingWorkshopResult>({
    workshop: DEFAULT_UPCOMING_WORKSHOP,
    isLiveSynced: false,
    source: "static",
    previewMeta: null,
    compareMode: "draft",
  });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const onUpdated = () => setRefreshTick((tick) => tick + 1);
    window.addEventListener(WORKSHOP_CONFIG_UPDATED_EVENT, onUpdated);
    window.addEventListener("popstate", onUpdated);
    return () => {
      window.removeEventListener(WORKSHOP_CONFIG_UPDATED_EVENT, onUpdated);
      window.removeEventListener("popstate", onUpdated);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveConfig() {
      const envDisabled = process.env.NEXT_PUBLIC_DISABLE_LIVE_SHEET_SYNC === "true";
      const queryStatic =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("sheet") === "static";

      if (envDisabled || queryStatic) {
        if (!cancelled) {
          setState({
            workshop: DEFAULT_UPCOMING_WORKSHOP,
            isLiveSynced: false,
            source: "static",
            previewMeta: null,
            compareMode: "draft",
          });
        }
        return;
      }

      const activeToken = getActivePreviewToken();
      const compareMode = getPreviewCompareMode();

      const loadLiveConfig = async (): Promise<{
        config: UpcomingWorkshopConfig;
        fromCloudOrMock: boolean;
      }> => {
        const cached = readCachedLiveConfig();
        if (cached) {
          return { config: cached, fromCloudOrMock: true };
        }

        if (hasFirebaseKeys && db) {
          try {
            const snap = await getDoc(doc(db, "site_config", "workshop_live"));
            if (snap.exists()) {
              const data = snap.data() as { config?: Partial<UpcomingWorkshopConfig> };
              const rawConfig = data?.config ?? (data as unknown as Partial<UpcomingWorkshopConfig>);
              const normalized = normalizeWorkshopConfig(rawConfig, DEFAULT_UPCOMING_WORKSHOP);
              writeCachedLiveConfig(normalized);
              return { config: normalized, fromCloudOrMock: true };
            }
          } catch {
            // Fall through cleanly to bundled defaults
          }
          return { config: DEFAULT_UPCOMING_WORKSHOP, fromCloudOrMock: false };
        }

        const mockLive = readMockLiveConfig();
        if (mockLive) {
          return { config: mockLive, fromCloudOrMock: true };
        }
        return { config: DEFAULT_UPCOMING_WORKSHOP, fromCloudOrMock: false };
      };

      if (activeToken) {
        let previewRecord: StoredPreviewRecord | null = null;

        if (hasFirebaseKeys && db) {
          try {
            const previewSnap = await getDoc(doc(db, "site_config_previews", activeToken));
            if (previewSnap.exists()) {
              previewRecord = previewSnap.data() as StoredPreviewRecord;
            }
          } catch {
            previewRecord = null;
          }
        } else {
          previewRecord = readMockPreviewRecord(activeToken);
        }

        if (isPreviewValid(previewRecord)) {
          const previewMeta: WorkshopPreviewMeta = {
            token: activeToken,
            label: String(previewRecord.label || "Board Draft Review"),
            createdByEmail: String(previewRecord.createdByEmail || "HEMS Admin"),
            expiresAt: String(previewRecord.expiresAt || ""),
          };

          if (compareMode === "live") {
            const liveResolved = await loadLiveConfig();
            if (!cancelled) {
              setState({
                workshop: liveResolved.config,
                isLiveSynced: true,
                source: "preview_live_compare",
                previewMeta,
                compareMode: "live",
              });
            }
            return;
          }

          const draftNormalized = normalizeWorkshopConfig(
            previewRecord.draftSnapshot,
            DEFAULT_UPCOMING_WORKSHOP
          );
          if (!cancelled) {
            setState({
              workshop: draftNormalized,
              isLiveSynced: true,
              source: "preview_draft",
              previewMeta,
              compareMode: "draft",
            });
          }
          return;
        }

        // Expired or revoked preview token -> clear cleanly and fall back to Live
        safeSessionRemove(WORKSHOP_PREVIEW_TOKEN_KEY);
        safeSessionRemove(WORKSHOP_PREVIEW_COMPARE_KEY);
      }

      const liveResolved = await loadLiveConfig();
      if (!cancelled) {
        setState({
          workshop: liveResolved.config,
          isLiveSynced: liveResolved.fromCloudOrMock,
          source: liveResolved.fromCloudOrMock ? "live_cloud" : "static",
          previewMeta: null,
          compareMode: "draft",
        });
      }
    }

    void resolveConfig();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return state;
}

export default useUpcomingWorkshop;
