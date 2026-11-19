"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import { hasBoardOrAdminRole, hasReviewerRole } from "@/utils/telemetryClient";
import type {
  AbstractReviewRecord,
  AbstractSubmissionRecord,
} from "@/types/abstractSubmission";
import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";
import {
  buildSuggestedHemsSchedule,
  extractAcceptedSubmissionsForSchedule,
  syncScheduleLocationsFromWorkshopSettings,
  type ConferenceSchedulePlan,
} from "@/utils/conferenceScheduleBuilder";

export type ScheduleSyncState = "loading" | "ready" | "saving" | "cloud" | "local" | "error";

const SCHEDULE_STORAGE_PREFIX = "hems_conference_schedule_v1_";

function getLocalScheduleKey(workshopNumber: number): string {
  return `${SCHEDULE_STORAGE_PREFIX}${workshopNumber || 16}`;
}

function getFirestoreDocId(workshopNumber: number): string {
  return `workshop_${workshopNumber || 16}`;
}

function stripUndefinedDeep<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

function readLocalSchedule(workshopNumber: number): ConferenceSchedulePlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getLocalScheduleKey(workshopNumber));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConferenceSchedulePlan;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.days)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeLocalSchedule(
  workshopNumber: number,
  plan: ConferenceSchedulePlan
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getLocalScheduleKey(workshopNumber),
      JSON.stringify(plan)
    );
  } catch (err) {
    console.warn("Unable to cache schedule draft in localStorage:", err);
  }
}

export function useConferenceSchedule(options: {
  workshop: UpcomingWorkshopConfig;
  submissions: readonly AbstractSubmissionRecord[];
  reviews: readonly AbstractReviewRecord[];
  submissionsLoading: boolean;
}) {
  const { workshop, submissions, reviews, submissionsLoading } = options;
  const { user, loading: authLoading } = useAuth();
  const workshopNumber = workshop.workshop_number || 16;

  const [plan, setPlanState] = useState<ConferenceSchedulePlan | null>(null);
  const [syncState, setSyncState] = useState<ScheduleSyncState>("loading");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const initializedRef = useRef<number | null>(null);

  const canAccessCloud = Boolean(
    hasFirebaseKeys &&
      db &&
      user &&
      (hasReviewerRole(user.roles) || hasBoardOrAdminRole(user.roles))
  );

  // Persist to localStorage + Firestore (if authorized reviewer/admin)
  const persistPlan = useCallback(
    async (nextPlan: ConferenceSchedulePlan) => {
      const sanitized = stripUndefinedDeep({
        ...nextPlan,
        workshopNumber,
        workshopOrdinal: workshop.workshop_ordinal || nextPlan.workshopOrdinal,
        workshopYear: workshop.workshop_year || nextPlan.workshopYear,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || nextPlan.updatedBy || "reviewer",
      });

      writeLocalSchedule(workshopNumber, sanitized);
      setLastSavedAt(sanitized.updatedAt);
      setSaveError(null);

      if (!canAccessCloud || !db) {
        setSyncState("local");
        return sanitized;
      }

      setSyncState("saving");
      try {
        await setDoc(
          doc(db, "workshop_schedules", getFirestoreDocId(workshopNumber)),
          sanitized
        );
        setSyncState("cloud");
      } catch (err) {
        console.warn("Failed saving schedule draft to Firestore, kept locally:", err);
        setSyncState("local");
        setSaveError(
          err instanceof Error
            ? `Saved locally (Cloud sync unavailable: ${err.message})`
            : "Saved locally (Cloud sync unavailable)."
        );
      }
      return sanitized;
    },
    [canAccessCloud, user?.email, workshop.workshop_ordinal, workshop.workshop_year, workshopNumber]
  );

  // Initial load from Firestore/localStorage, or auto-generate suggested HEMS baseline
  useEffect(() => {
    if (authLoading || submissionsLoading) return;
    if (initializedRef.current === workshopNumber && plan !== null) return;

    let cancelled = false;

    const loadInitial = async () => {
      const localDraft = readLocalSchedule(workshopNumber);
      let remoteDraft: ConferenceSchedulePlan | null = null;

      if (canAccessCloud && db) {
        try {
          const snap = await getDoc(
            doc(db, "workshop_schedules", getFirestoreDocId(workshopNumber))
          );
          if (snap.exists()) {
            const data = snap.data() as ConferenceSchedulePlan;
            if (data && data.version === 1 && Array.isArray(data.days)) {
              remoteDraft = data;
            }
          }
        } catch (err) {
          console.warn("Firestore workshop_schedules read fallback to local:", err);
        }
      }

      if (cancelled) return;

      let chosen: ConferenceSchedulePlan | null = null;
      let resolvedSource: ScheduleSyncState = "local";

      if (remoteDraft && localDraft) {
        const tRemote = Date.parse(remoteDraft.updatedAt || "") || 0;
        const tLocal = Date.parse(localDraft.updatedAt || "") || 0;
        chosen = tRemote >= tLocal ? remoteDraft : localDraft;
        resolvedSource = canAccessCloud ? "cloud" : "local";
      } else if (remoteDraft) {
        chosen = remoteDraft;
        resolvedSource = "cloud";
      } else if (localDraft) {
        chosen = localDraft;
        resolvedSource = "local";
      }

      if (!chosen) {
        const { oralCandidates, posterCandidates } =
          extractAcceptedSubmissionsForSchedule(submissions, reviews, {
            includePendingOral: false,
          });
        chosen = buildSuggestedHemsSchedule(
          workshop,
          oralCandidates,
          posterCandidates,
          {
            defaultTalkDurationMinutes: 30,
            updatedBy: user?.email || "auto-suggest",
          }
        );
        writeLocalSchedule(workshopNumber, chosen);
        resolvedSource = canAccessCloud ? "ready" : "local";
      }

      initializedRef.current = workshopNumber;
      setPlanState(chosen);
      setLastSavedAt(chosen.updatedAt || "");
      setSyncState(resolvedSource);
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    canAccessCloud,
    plan,
    reviews,
    submissions,
    submissionsLoading,
    user?.email,
    workshop,
    workshopNumber,
  ]);

  const updatePlan = useCallback(
    (
      updater:
        | ConferenceSchedulePlan
        | ((prev: ConferenceSchedulePlan) => ConferenceSchedulePlan)
    ) => {
      setPlanState((prev) => {
        if (!prev) return prev;
        const next = typeof updater === "function" ? updater(prev) : updater;
        void persistPlan(next);
        return next;
      });
    },
    [persistPlan]
  );

  const saveScheduleNow = useCallback(async () => {
    if (!plan) return;
    const saved = await persistPlan(plan);
    setPlanState(saved);
  }, [persistPlan, plan]);

  const resetToSuggestedSchedule = useCallback(
    (opts: { includePendingOral: boolean; defaultTalkDurationMinutes: number }) => {
      const { oralCandidates, posterCandidates } =
        extractAcceptedSubmissionsForSchedule(submissions, reviews, {
          includePendingOral: opts.includePendingOral,
        });
      const rebuilt = buildSuggestedHemsSchedule(
        workshop,
        oralCandidates,
        posterCandidates,
        {
          defaultTalkDurationMinutes: opts.defaultTalkDurationMinutes,
          updatedBy: user?.email || "auto-suggest",
        }
      );
      setPlanState(rebuilt);
      void persistPlan(rebuilt);
      return rebuilt;
    },
    [persistPlan, reviews, submissions, user?.email, workshop]
  );

  const syncLocationsFromWorkshop = useCallback(() => {
    if (!plan) return;
    const synced = syncScheduleLocationsFromWorkshopSettings(plan, workshop);
    setPlanState(synced);
    void persistPlan(synced);
  }, [persistPlan, plan, workshop]);

  return {
    plan,
    syncState,
    lastSavedAt,
    saveError,
    isCloudCapable: canAccessCloud,
    updatePlan,
    saveScheduleNow,
    resetToSuggestedSchedule,
    syncLocationsFromWorkshop,
  };
}
