"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db, hasFirebaseKeys } from "@/utils/firebase";
import {
  calculateRegistrationTotals,
  INITIAL_SAMPLE_PROMO_CODES,
  INITIAL_SAMPLE_REGISTRATIONS,
  RegistrationSubmitPayload,
  RegistrationTier,
  StripeTreasurerSummary,
  WorkshopPromoCode,
  WorkshopRegistrationRecord,
} from "@/types/registration";
import {
  evaluateRegistrationSchedule,
  UpcomingWorkshopConfig,
} from "@/utils/upcomingWorkshop";

const REG_STORAGE_KEY = "hems_workshop_registrations_v1";
const PROMO_STORAGE_KEY = "hems_workshop_promo_codes_v1";
const REG_SYNC_EVENT = "hems-workshop-registrations-updated";
const MOCK_WHITELIST_KEY = "hems_mock_whitelist";
const MOCK_SUBSCRIBERS_KEY = "hems_mock_mailing_subscribers_v1";
const MOCK_SUBLISTS_KEY = "hems_mock_mailing_sublists_v1";

function readStoredList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredList<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(REG_SYNC_EVENT));
  } catch {
    // Ignore quota errors
  }
}

function makeRandomToken(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return `tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Mirrors registration fulfillment updates into mock localStorage whitelist &
 * mailing collections when running locally without Firebase API keys.
 */
function syncLocalMockWhitelistAndMailing(reg: WorkshopRegistrationRecord): void {
  if (typeof window === "undefined") return;
  const emailLower = reg.email.trim().toLowerCase();
  const fullName = `${reg.firstName} ${reg.lastName}`.trim() || emailLower;

  try {
    const rawWl = window.sessionStorage.getItem(MOCK_WHITELIST_KEY);
    const wlList: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
      affiliation?: string;
      name?: string;
      roles: string[];
      workshopYears?: number[];
      updatedAt?: string;
    }> = rawWl ? JSON.parse(rawWl) : [];
    const idx = wlList.findIndex((e) => e.email.toLowerCase() === emailLower);
    const neededRoles =
      reg.tier === "sponsor" ? ["attendee", "corporate sponsor"] : ["attendee"];
    if (idx >= 0) {
      const existing = wlList[idx];
      const roleSet = new Set([...(existing.roles || []), ...neededRoles]);
      const yearsSet = new Set([...(existing.workshopYears || []), reg.workshopYear]);
      wlList[idx] = {
        ...existing,
        firstName: existing.firstName || reg.firstName,
        lastName: existing.lastName || reg.lastName,
        affiliation: existing.affiliation || reg.affiliation,
        name: existing.name || fullName,
        roles: Array.from(roleSet),
        workshopYears: Array.from(yearsSet),
        updatedAt: new Date().toISOString(),
      };
    } else {
      wlList.push({
        email: emailLower,
        firstName: reg.firstName,
        lastName: reg.lastName,
        affiliation: reg.affiliation,
        name: fullName,
        roles: neededRoles,
        workshopYears: [reg.workshopYear],
        updatedAt: new Date().toISOString(),
      });
    }
    window.sessionStorage.setItem(MOCK_WHITELIST_KEY, JSON.stringify(wlList));
  } catch {
    // Ignore sessionStorage errors
  }

  try {
    const yearTag = `${reg.workshopYear} Attendees`;
    const sponsorTag = `${reg.workshopYear} Corporate Sponsors`;
    const tagsToAdd = reg.tier === "sponsor" ? [yearTag, sponsorTag] : [yearTag];

    const rawSubs = window.localStorage.getItem(MOCK_SUBSCRIBERS_KEY);
    if (rawSubs) {
      const subs: Array<Record<string, unknown>> = JSON.parse(rawSubs);
      const subIdx = subs.findIndex(
        (s) => String(s.email || "").toLowerCase() === emailLower
      );
      const nowIso = new Date().toISOString();
      if (subIdx >= 0) {
        const currentTags = Array.isArray(subs[subIdx].sublists)
          ? (subs[subIdx].sublists as string[])
          : [];
        subs[subIdx] = {
          ...subs[subIdx],
          sublists: Array.from(new Set([...currentTags, ...tagsToAdd])),
          status:
            subs[subIdx].status === "unsubscribed" && !reg.mailingListOptIn
              ? "unsubscribed"
              : "active",
          updatedAt: nowIso,
        };
      } else if (reg.mailingListOptIn) {
        subs.push({
          id: encodeURIComponent(emailLower).replace(/\./g, "%2E"),
          email: emailLower,
          firstName: reg.firstName,
          lastName: reg.lastName,
          affiliation: reg.affiliation,
          interests: ["workshop"],
          sublists: tagsToAdd,
          status: "active",
          source: "registration",
          unsubscribeToken: makeRandomToken(),
          optInToken: makeRandomToken(),
          createdAt: nowIso,
          updatedAt: nowIso,
          confirmedAt: nowIso,
        });
      }
      window.localStorage.setItem(MOCK_SUBSCRIBERS_KEY, JSON.stringify(subs));
    }

    const rawMeta = window.localStorage.getItem(MOCK_SUBLISTS_KEY);
    if (rawMeta) {
      const meta: string[] = JSON.parse(rawMeta);
      window.localStorage.setItem(
        MOCK_SUBLISTS_KEY,
        JSON.stringify(Array.from(new Set([...meta, ...tagsToAdd])))
      );
    }
  } catch {
    // Ignore localStorage errors
  }
}

async function getBearerToken(): Promise<string | null> {
  if (!hasFirebaseKeys || !auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export interface PromoValidationResult {
  valid: boolean;
  promo?: WorkshopPromoCode;
  message: string;
}

export interface CreateRegistrationResponse {
  ok: boolean;
  mode: "stripe_redirect" | "completed" | "pending_invoice" | "sandbox";
  checkoutUrl?: string;
  registration?: WorkshopRegistrationRecord;
  receiptUrl?: string;
  error?: string;
}

export function useWorkshopRegistrations(enabledAdminFetch = false) {
  const [registrations, setRegistrations] = useState<WorkshopRegistrationRecord[]>([]);
  const [promoCodes, setPromoCodes] = useState<WorkshopPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    if (!hasFirebaseKeys || !db) {
      setRegistrations(
        readStoredList<WorkshopRegistrationRecord>(
          REG_STORAGE_KEY,
          INITIAL_SAMPLE_REGISTRATIONS
        )
      );
      setPromoCodes(
        readStoredList<WorkshopPromoCode>(PROMO_STORAGE_KEY, INITIAL_SAMPLE_PROMO_CODES)
      );
      setLoading(false);
      return;
    }

    if (!enabledAdminFetch) {
      setLoading(false);
      return;
    }

    try {
      const regSnap = await getDocs(
        query(collection(db, "workshop_registrations"), orderBy("createdAt", "desc"))
      );
      const regList = regSnap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as WorkshopRegistrationRecord)
      );
      setRegistrations(regList);

      const promoSnap = await getDocs(collection(db, "workshop_promo_codes"));
      const promoList = promoSnap.docs.map(
        (d) => ({ code: d.id, ...(d.data() as Record<string, unknown>) } as WorkshopPromoCode)
      );
      setPromoCodes(promoList);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to load workshop registrations."
      );
    } finally {
      setLoading(false);
    }
  }, [enabledAdminFetch]);

  useEffect(() => {
    void loadData();
    if (typeof window === "undefined") return;
    const onSync = () => {
      if (!hasFirebaseKeys || !db) {
        setRegistrations(
          readStoredList<WorkshopRegistrationRecord>(
            REG_STORAGE_KEY,
            INITIAL_SAMPLE_REGISTRATIONS
          )
        );
        setPromoCodes(
          readStoredList<WorkshopPromoCode>(PROMO_STORAGE_KEY, INITIAL_SAMPLE_PROMO_CODES)
        );
      }
    };
    window.addEventListener(REG_SYNC_EVENT, onSync);
    return () => window.removeEventListener(REG_SYNC_EVENT, onSync);
  }, [loadData]);

  const validatePromoCodeLocalOrServer = useCallback(
    async (
      codeRaw: string,
      tier: RegistrationTier,
      workshopYear: number
    ): Promise<PromoValidationResult> => {
      const code = codeRaw.trim().toUpperCase();
      if (!code) {
        return { valid: false, message: "Enter a promo or sponsor seat code." };
      }

      if (!hasFirebaseKeys) {
        const list = readStoredList<WorkshopPromoCode>(
          PROMO_STORAGE_KEY,
          INITIAL_SAMPLE_PROMO_CODES
        );
        const match = list.find((p) => p.code.toUpperCase() === code);
        if (!match) {
          return { valid: false, message: `Code "${code}" not recognized.` };
        }
        if (!match.active || match.workshopYear !== workshopYear) {
          return { valid: false, message: `Code "${code}" is no longer active.` };
        }
        if (match.usesCount >= match.maxUses) {
          return {
            valid: false,
            message: `Code "${code}" has reached its maximum redemptions (${match.maxUses}).`,
          };
        }
        if (!match.allowedTiers.includes(tier)) {
          return {
            valid: false,
            message: `Code "${code}" applies to ${match.allowedTiers.join(" / ")} tier.`,
          };
        }
        return { valid: true, promo: match, message: `${match.label} applied.` };
      }

      try {
        const res = await fetch("/api/registration/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "validate_promo",
            promoCode: code,
            tier,
            workshopYear,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          promo?: WorkshopPromoCode;
          message?: string;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.promo) {
          return {
            valid: false,
            message: data.error || data.message || `Code "${code}" is invalid.`,
          };
        }
        return {
          valid: true,
          promo: data.promo,
          message: data.message || `${data.promo.label} applied.`,
        };
      } catch (err) {
        return {
          valid: false,
          message: err instanceof Error ? err.message : "Could not verify code.",
        };
      }
    },
    []
  );

  const submitRegistration = useCallback(
    async (
      payload: RegistrationSubmitPayload,
      workshopConfig: UpcomingWorkshopConfig
    ): Promise<CreateRegistrationResponse> => {
      setBusy(true);
      try {
        if (hasFirebaseKeys) {
          const token = await getBearerToken();
          const res = await fetch("/api/registration/create-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
          });
          const data = (await res.json()) as CreateRegistrationResponse;
          if (!res.ok || !data.ok) {
            return {
              ok: false,
              mode: "pending_invoice",
              error: data.error || `Request failed (${res.status}).`,
            };
          }
          return data;
        }

        // Local sandbox / dev simulation mode
        const schedule = evaluateRegistrationSchedule(workshopConfig);
        const tierFeeCents =
          payload.tier === "student"
            ? payload.pricingWindow === "early_bird"
              ? schedule.activeFees.studentEarlyCents
              : schedule.activeFees.studentRegularCents
            : payload.tier === "sponsor"
            ? payload.pricingWindow === "early_bird"
              ? schedule.activeFees.sponsorEarlyCents
              : schedule.activeFees.sponsorRegularCents
            : payload.pricingWindow === "early_bird"
            ? schedule.activeFees.professionalEarlyCents
            : schedule.activeFees.professionalRegularCents;

        const currentPromos = readStoredList<WorkshopPromoCode>(
          PROMO_STORAGE_KEY,
          INITIAL_SAMPLE_PROMO_CODES
        );
        const promoCodeClean = (payload.promoCode || "").trim().toUpperCase();
        const promoMatch = promoCodeClean
          ? currentPromos.find((p) => p.code.toUpperCase() === promoCodeClean)
          : undefined;

        if (promoCodeClean) {
          if (
            !promoMatch ||
            !promoMatch.active ||
            promoMatch.usesCount >= promoMatch.maxUses ||
            !promoMatch.allowedTiers.includes(payload.tier)
          ) {
            return {
              ok: false,
              mode: "sandbox",
              error: `Promo code "${promoCodeClean}" is invalid, exhausted, or not valid for this tier.`,
            };
          }
        }

        const totals = calculateRegistrationTotals({
          baseFeeCents: tierFeeCents,
          promo: promoMatch || null,
          guestDinnerCount: payload.guestDinnerCount,
          guestDinnerUnitCents: schedule.activeFees.guestDinnerCents,
          optionalStudentFundDonationCents: payload.optionalStudentFundDonationCents,
        });

        const currentRegs = readStoredList<WorkshopRegistrationRecord>(
          REG_STORAGE_KEY,
          INITIAL_SAMPLE_REGISTRATIONS
        );
        const seqNum = currentRegs.length + 1;
        const seqStr = String(seqNum).padStart(4, "0");
        const regId = `REG-${payload.workshopYear}-${seqStr}`;
        const nowIso = new Date().toISOString();
        const isZeroTotal = totals.totalCents === 0;
        const isInvoice = !isZeroTotal && payload.paymentMode === "invoice";

        const newRecord: WorkshopRegistrationRecord = {
          id: regId,
          workshopYear: payload.workshopYear,
          workshopOrdinal: payload.workshopOrdinal,
          email: payload.email.trim().toLowerCase(),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          affiliation: payload.affiliation.trim(),
          country: payload.country.trim() || "United States",
          badgeName: payload.badgeName.trim(),
          badgeAffiliation: payload.badgeAffiliation.trim(),
          pronouns: payload.pronouns?.trim() || undefined,
          tier: payload.tier,
          pricingWindow: payload.pricingWindow,
          promoCodeUsed: promoMatch ? promoMatch.code : undefined,
          baseFeeCents: totals.baseFeeCents,
          discountCents: totals.discountCents,
          guestDinnerCount: payload.guestDinnerCount,
          guestDinnerUnitCents: schedule.activeFees.guestDinnerCents,
          optionalStudentFundDonationCents: totals.optionalStudentFundDonationCents,
          totalCents: totals.totalCents,
          stripeFeeEstimatedCents: isInvoice || isZeroTotal ? 0 : totals.estimatedStripeCardFeeCents,
          netEstimatedCents:
            isInvoice || isZeroTotal
              ? totals.totalCents
              : Math.max(0, totals.totalCents - totals.estimatedStripeCardFeeCents),
          studentDegreeProgram: payload.studentDegreeProgram,
          studentAdvisorName: payload.studentAdvisorName?.trim() || undefined,
          studentAdvisorEmail: payload.studentAdvisorEmail?.trim().toLowerCase() || undefined,
          wednesdayDinnerRsvp: payload.wednesdayDinnerRsvp,
          dietaryRestrictions: payload.dietaryRestrictions,
          allergyNotes: payload.allergyNotes?.trim() || undefined,
          guestNames: payload.guestNames?.trim() || undefined,
          guestDietaryNotes: payload.guestDietaryNotes?.trim() || undefined,
          mailingListOptIn: payload.mailingListOptIn,
          sandboxSimulation: true,
          linkedAbstractIds: [],
          paymentMode: isZeroTotal ? "comped" : isInvoice ? "invoice" : "stripe",
          status: isZeroTotal ? "comped" : isInvoice ? "pending_invoice" : "paid",
          invoiceNumber: isInvoice ? `HEMS-${payload.workshopYear}-INV-${seqStr}` : undefined,
          receiptNumber: !isInvoice ? `HEMS-${payload.workshopYear}-${seqStr}` : undefined,
          receiptToken: makeRandomToken(),
          paymentSummary: isZeroTotal
            ? `Promo Waiver (${promoMatch?.code || "COMP"})`
            : isInvoice
            ? "Pending Institutional Check / ACH PO"
            : "Sandbox Card •••• 4242",
          createdAt: nowIso,
          updatedAt: nowIso,
          paidAt: !isInvoice ? nowIso : undefined,
          fulfilledAt: !isInvoice ? nowIso : undefined,
          sheetSyncStatus: "synced",
        };

        if (promoMatch) {
          const updatedPromos = currentPromos.map((p) =>
            p.code === promoMatch.code
              ? { ...p, usesCount: p.usesCount + 1, updatedAt: nowIso }
              : p
          );
          writeStoredList(PROMO_STORAGE_KEY, updatedPromos);
        }

        const updatedRegs = [newRecord, ...currentRegs];
        writeStoredList(REG_STORAGE_KEY, updatedRegs);
        if (!isInvoice) {
          syncLocalMockWhitelistAndMailing(newRecord);
        }

        const receiptUrl = `/registration/receipt?regId=${encodeURIComponent(
          newRecord.id
        )}&token=${encodeURIComponent(newRecord.receiptToken)}`;

        return {
          ok: true,
          mode: isInvoice ? "pending_invoice" : "sandbox",
          registration: newRecord,
          receiptUrl,
        };
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const runAdminAction = useCallback(
    async (action: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> => {
      setBusy(true);
      try {
        if (hasFirebaseKeys) {
          const token = await getBearerToken();
          if (!token) {
            return { ok: false, error: "Sign in with an authorized Board or Admin account." };
          }
          const res = await fetch("/api/registration/admin-action", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action, ...payload }),
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !data.ok) {
            return { ok: false, error: data.error || `Admin action failed (${res.status}).` };
          }
          await loadData();
          return { ok: true };
        }

        // Local sandbox mutations
        const nowIso = new Date().toISOString();
        const currentRegs = readStoredList<WorkshopRegistrationRecord>(
          REG_STORAGE_KEY,
          INITIAL_SAMPLE_REGISTRATIONS
        );

        if (action === "mark_invoice_paid") {
          const regId = String(payload.regId || "");
          const refNote = String(payload.paymentReferenceNote || "Check / ACH Verified").trim();
          const updated = currentRegs.map((r) => {
            if (r.id !== regId) return r;
            const receiptNum =
              r.receiptNumber ||
              `HEMS-${r.workshopYear}-${String(currentRegs.length + 10).padStart(4, "0")}`;
            const nextReg: WorkshopRegistrationRecord = {
              ...r,
              status: "paid",
              receiptNumber: receiptNum,
              paymentSummary: refNote,
              paymentReferenceNote: refNote,
              paidAt: nowIso,
              fulfilledAt: nowIso,
              updatedAt: nowIso,
            };
            syncLocalMockWhitelistAndMailing(nextReg);
            return nextReg;
          });
          writeStoredList(REG_STORAGE_KEY, updated);
          setRegistrations(updated);
          return { ok: true };
        }

        if (action === "transfer_seat") {
          const regId = String(payload.regId || "");
          const toEmail = String(payload.toEmail || "").trim().toLowerCase();
          const toFirstName = String(payload.toFirstName || "").trim();
          const toLastName = String(payload.toLastName || "").trim();
          const toAffiliation = String(payload.toAffiliation || "").trim();
          const updated = currentRegs.map((r) => {
            if (r.id !== regId) return r;
            const nextReg: WorkshopRegistrationRecord = {
              ...r,
              email: toEmail,
              firstName: toFirstName || r.firstName,
              lastName: toLastName || r.lastName,
              affiliation: toAffiliation || r.affiliation,
              badgeName: `${toFirstName || r.firstName} ${toLastName || r.lastName}`.trim(),
              badgeAffiliation: toAffiliation || r.badgeAffiliation,
              updatedAt: nowIso,
              transferHistory: [
                ...(r.transferHistory || []),
                {
                  fromEmail: r.email,
                  toEmail,
                  fromName: `${r.firstName} ${r.lastName}`,
                  toName: `${toFirstName} ${toLastName}`.trim(),
                  transferredBy: "board_sandbox",
                  transferredAt: nowIso,
                },
              ],
            };
            syncLocalMockWhitelistAndMailing(nextReg);
            return nextReg;
          });
          writeStoredList(REG_STORAGE_KEY, updated);
          setRegistrations(updated);
          return { ok: true };
        }

        if (action === "toggle_checkin") {
          const regId = String(payload.regId || "");
          const updated = currentRegs.map((r) =>
            r.id === regId
              ? { ...r, checkedInAt: r.checkedInAt ? undefined : nowIso, updatedAt: nowIso }
              : r
          );
          writeStoredList(REG_STORAGE_KEY, updated);
          setRegistrations(updated);
          return { ok: true };
        }

        if (action === "refund_or_cancel") {
          const regId = String(payload.regId || "");
          const nextStatus = payload.status === "cancelled" ? "cancelled" : "refunded";
          const refundReason = String(payload.refundReason || "").trim();
          const revokeAttendeeRole = payload.revokeAttendeeRole !== false;
          let targetEmail = "";
          let targetTier: RegistrationTier = "professional";
          const updated = currentRegs.map((r) => {
            if (r.id !== regId) return r;
            targetEmail = r.email.toLowerCase();
            targetTier = r.tier;
            return {
              ...r,
              status: nextStatus as WorkshopRegistrationRecord["status"],
              refundedAt: nowIso,
              ...(refundReason ? { refundReason } : {}),
              updatedAt: nowIso,
            };
          });
          writeStoredList(REG_STORAGE_KEY, updated);
          setRegistrations(updated);

          if (revokeAttendeeRole && targetEmail && typeof window !== "undefined") {
            try {
              const rawWl = window.sessionStorage.getItem(MOCK_WHITELIST_KEY);
              if (rawWl) {
                const wlList: Array<{ email: string; roles: string[]; updatedAt?: string }> =
                  JSON.parse(rawWl);
                const nextWl = wlList.map((entry) => {
                  if (entry.email.toLowerCase() !== targetEmail) return entry;
                  const filtered = (entry.roles || []).filter((role) => {
                    const lower = String(role || "").trim().toLowerCase();
                    if (lower === "attendee") return false;
                    if (targetTier === "sponsor" && lower === "corporate sponsor") return false;
                    return true;
                  });
                  return { ...entry, roles: filtered, updatedAt: nowIso };
                });
                window.sessionStorage.setItem(MOCK_WHITELIST_KEY, JSON.stringify(nextWl));
              }
            } catch {
              // Ignore mock sessionStorage errors
            }
          }
          return { ok: true };
        }

        if (action === "upsert_promo") {
          const promo = payload.promo as WorkshopPromoCode;
          const cleanCode = promo.code.trim().toUpperCase();
          const currentPromos = readStoredList<WorkshopPromoCode>(
            PROMO_STORAGE_KEY,
            INITIAL_SAMPLE_PROMO_CODES
          );
          const exists = currentPromos.some((p) => p.code === cleanCode);
          const nextPromo: WorkshopPromoCode = {
            ...promo,
            code: cleanCode,
            createdAt: exists
              ? currentPromos.find((p) => p.code === cleanCode)?.createdAt || nowIso
              : nowIso,
            updatedAt: nowIso,
          };
          const nextPromos = exists
            ? currentPromos.map((p) => (p.code === cleanCode ? nextPromo : p))
            : [nextPromo, ...currentPromos];
          writeStoredList(PROMO_STORAGE_KEY, nextPromos);
          setPromoCodes(nextPromos);
          return { ok: true };
        }

        if (action === "toggle_promo") {
          const code = String(payload.code || "").trim().toUpperCase();
          const currentPromos = readStoredList<WorkshopPromoCode>(
            PROMO_STORAGE_KEY,
            INITIAL_SAMPLE_PROMO_CODES
          );
          const nextPromos = currentPromos.map((p) =>
            p.code === code ? { ...p, active: !p.active, updatedAt: nowIso } : p
          );
          writeStoredList(PROMO_STORAGE_KEY, nextPromos);
          setPromoCodes(nextPromos);
          return { ok: true };
        }

        return { ok: true };
      } finally {
        setBusy(false);
      }
    },
    [loadData]
  );

  const fetchStripeSummary = useCallback(async (): Promise<StripeTreasurerSummary> => {
    const nowIso = new Date().toISOString();
    if (!hasFirebaseKeys) {
      return {
        configured: false,
        mode: "local_sandbox",
        hasWebhookSecret: false,
        availableUsdCents: null,
        pendingUsdCents: null,
        recentPayouts: [],
        fetchedAt: nowIso,
      };
    }

    const token = await getBearerToken();
    if (!token) {
      return {
        configured: false,
        mode: "unconfigured",
        hasWebhookSecret: false,
        availableUsdCents: null,
        pendingUsdCents: null,
        recentPayouts: [],
        fetchedAt: nowIso,
        error: "Treasurer or Board Firebase ID token required.",
      };
    }

    try {
      const res = await fetch("/api/registration/admin-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_stripe_summary" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        summary?: StripeTreasurerSummary;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.summary) {
        return {
          configured: false,
          mode: "unconfigured",
          hasWebhookSecret: false,
          availableUsdCents: null,
          pendingUsdCents: null,
          recentPayouts: [],
          fetchedAt: nowIso,
          error: data.error || `Stripe status check failed (${res.status}).`,
        };
      }
      return data.summary;
    } catch (err) {
      return {
        configured: false,
        mode: "unconfigured",
        hasWebhookSecret: false,
        availableUsdCents: null,
        pendingUsdCents: null,
        recentPayouts: [],
        fetchedAt: nowIso,
        error: err instanceof Error ? err.message : "Could not reach Stripe status endpoint.",
      };
    }
  }, []);

  return {
    registrations,
    promoCodes,
    loading,
    busy,
    errorMsg,
    reload: loadData,
    fetchStripeSummary,
    validatePromoCode: validatePromoCodeLocalOrServer,
    submitRegistration,
    markInvoicePaid: (regId: string, paymentReferenceNote: string) =>
      runAdminAction("mark_invoice_paid", { regId, paymentReferenceNote }),
    transferSeat: (params: {
      regId: string;
      toEmail: string;
      toFirstName: string;
      toLastName: string;
      toAffiliation: string;
    }) => runAdminAction("transfer_seat", params),
    toggleCheckIn: (regId: string) => runAdminAction("toggle_checkin", { regId }),
    refundOrCancel: (
      regId: string,
      status: "refunded" | "cancelled",
      options?: { refundReason?: string; revokeAttendeeRole?: boolean }
    ) =>
      runAdminAction("refund_or_cancel", {
        regId,
        status,
        ...(options?.refundReason ? { refundReason: options.refundReason } : {}),
        ...(typeof options?.revokeAttendeeRole === "boolean"
          ? { revokeAttendeeRole: options.revokeAttendeeRole }
          : {}),
      }),
    savePromoCode: (promo: WorkshopPromoCode) =>
      runAdminAction("upsert_promo", { promo }),
    togglePromoCode: (code: string) => runAdminAction("toggle_promo", { code }),
    resyncSheet: (regId: string) => runAdminAction("resync_sheet", { regId }),
    resendReceipt: (regId: string) => runAdminAction("resend_receipt", { regId }),
  };
}
