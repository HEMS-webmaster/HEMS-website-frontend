"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Landmark,
  Mail,
  PlusCircle,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Wallet,
  Webhook,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useWorkshopRegistrations } from "@/hooks/useWorkshopRegistrations";
import {
  RegistrationTier,
  StripeTreasurerSummary,
  WorkshopPromoCode,
  WorkshopRegistrationRecord,
} from "@/types/registration";
import {
  evaluateRegistrationSchedule,
  formatCentsUsd,
} from "@/utils/upcomingWorkshop";
import { hasOperationsRole, hasTreasurerRole } from "@/utils/telemetryClient";

type TreasurerTab = "overview" | "ledger" | "promos" | "stripe" | "compliance";

function escapeCsvCell(val: string | number | undefined | null): string {
  const s = String(val ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) => r.map(escapeCsvCell).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function estimateNonprofitCardFeeCents(totalCents: number): number {
  if (totalCents <= 0) return 0;
  return Math.round(totalCents * 0.022) + 30;
}

function daysOutstanding(createdAtIso: string): number {
  const ms = Date.parse(createdAtIso);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24)));
}

export default function TreasurerPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthorized = Boolean(user && hasTreasurerRole(user.roles));
  const canViewOperations = Boolean(user && hasOperationsRole(user.roles));

  const { workshop, isLiveSynced } = useUpcomingWorkshop();
  const schedule = evaluateRegistrationSchedule(workshop);
  const {
    registrations,
    promoCodes,
    loading,
    busy,
    errorMsg,
    reload,
    fetchStripeSummary,
    markInvoicePaid,
    refundOrCancel,
    savePromoCode,
    togglePromoCode,
    resendReceipt,
  } = useWorkshopRegistrations(isAuthorized);

  const [activeTab, setActiveTab] = useState<TreasurerTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [useNonprofitFeeEstimate, setUseNonprofitFeeEstimate] = useState(false);

  const [stripeSummary, setStripeSummary] = useState<StripeTreasurerSummary | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeDashboardMode, setStripeDashboardMode] = useState<"live" | "test">(() =>
    process.env.NEXT_PUBLIC_STRIPE_DASHBOARD_MODE === "test" ? "test" : "live"
  );

  const [actionBanner, setActionBanner] = useState<{ ok: boolean; msg: string } | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mark Paid modal
  const [markPaidTarget, setMarkPaidTarget] = useState<WorkshopRegistrationRecord | null>(
    null
  );
  const [paymentRefInput, setPaymentRefInput] = useState("");

  // Refund / Cancel confirmation modal
  const [refundTarget, setRefundTarget] = useState<WorkshopRegistrationRecord | null>(
    null
  );
  const [refundReasonInput, setRefundReasonInput] = useState("");
  const [revokeRoleOnRefund, setRevokeRoleOnRefund] = useState(true);

  // Promo / Sponsor code form
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoLabel, setNewPromoLabel] = useState("");
  const [newPromoType, setNewPromoType] = useState<"percent" | "fixed_cents">("percent");
  const [newPromoValue, setNewPromoValue] = useState("100");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("1");
  const [newPromoTiers, setNewPromoTiers] = useState<RegistrationTier[]>(["professional"]);
  const [newPromoGrantsSponsor, setNewPromoGrantsSponsor] = useState(false);
  const [newPromoNotes, setNewPromoNotes] = useState("");

  const refreshStripeStatus = useCallback(async () => {
    if (!isAuthorized) return;
    setLoadingStripe(true);
    try {
      const summary = await fetchStripeSummary();
      setStripeSummary(summary);
      if (summary.mode === "test") {
        setStripeDashboardMode("test");
      } else if (summary.mode === "live") {
        setStripeDashboardMode("live");
      }
    } finally {
      setLoadingStripe(false);
    }
  }, [fetchStripeSummary, isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      void refreshStripeStatus();
    }
  }, [isAuthorized, refreshStripeStatus]);

  const copyText = useCallback(async (id: string, text: string, bannerMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setActionBanner({ ok: true, msg: bannerMsg });
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2200);
    } catch {
      setActionBanner({ ok: false, msg: "Clipboard copy unavailable in this browser context." });
    }
  }, []);

  const paidOrCompedRegs = useMemo(
    () => registrations.filter((r) => r.status === "paid" || r.status === "comped"),
    [registrations]
  );

  const pendingInvoices = useMemo(
    () => registrations.filter((r) => r.status === "pending_invoice"),
    [registrations]
  );

  const refundedOrCancelledRegs = useMemo(
    () =>
      registrations.filter(
        (r) => r.status === "refunded" || r.status === "cancelled"
      ),
    [registrations]
  );

  const getFeeCents = useCallback(
    (reg: WorkshopRegistrationRecord): number => {
      if (reg.paymentMode !== "stripe" || reg.totalCents <= 0) return 0;
      if (useNonprofitFeeEstimate) {
        return estimateNonprofitCardFeeCents(reg.totalCents);
      }
      if (typeof reg.stripeFeeEstimatedCents === "number") {
        return reg.stripeFeeEstimatedCents;
      }
      return Math.round(reg.totalCents * 0.029) + 30;
    },
    [useNonprofitFeeEstimate]
  );

  const financials = useMemo(() => {
    let grossCollectedCents = 0;
    let estFeesCents = 0;
    let standardFeesCents = 0;
    let nonprofitFeesCents = 0;
    let studentDonationsCents = 0;
    let programServiceRevenueCents = 0;
    let promoDiscountTotalCents = 0;
    let stripePaidCount = 0;
    let stripeGrossCents = 0;
    let invoiceSettledCount = 0;
    let invoiceSettledCents = 0;
    let compedCount = 0;
    let donor250PlusCount = 0;

    for (const r of paidOrCompedRegs) {
      grossCollectedCents += r.totalCents;
      const fee = getFeeCents(r);
      estFeesCents += fee;
      if (r.paymentMode === "stripe" && r.totalCents > 0) {
        standardFeesCents +=
          typeof r.stripeFeeEstimatedCents === "number"
            ? r.stripeFeeEstimatedCents
            : Math.round(r.totalCents * 0.029) + 30;
        nonprofitFeesCents += estimateNonprofitCardFeeCents(r.totalCents);
        stripePaidCount += 1;
        stripeGrossCents += r.totalCents;
      } else if (r.paymentMode === "invoice") {
        invoiceSettledCount += 1;
        invoiceSettledCents += r.totalCents;
      } else if (r.paymentMode === "comped") {
        compedCount += 1;
      }

      const gift = r.optionalStudentFundDonationCents || 0;
      studentDonationsCents += gift;
      if (gift >= 25000) donor250PlusCount += 1;
      programServiceRevenueCents += Math.max(0, r.totalCents - gift);
      promoDiscountTotalCents += r.discountCents || 0;
    }

    const pendingTotalCents = pendingInvoices.reduce((s, r) => s + r.totalCents, 0);
    const overdueInvoiceCount = pendingInvoices.filter(
      (r) => daysOutstanding(r.createdAt) >= 30
    ).length;

    const refundedTotalCents = refundedOrCancelledRegs
      .filter((r) => r.status === "refunded")
      .reduce((s, r) => s + r.totalCents, 0);

    return {
      grossCollectedCents,
      estFeesCents,
      nonprofitSavingsCents: Math.max(0, standardFeesCents - nonprofitFeesCents),
      netProceedsCents: Math.max(0, grossCollectedCents - estFeesCents),
      pendingTotalCents,
      overdueInvoiceCount,
      studentDonationsCents,
      programServiceRevenueCents,
      promoDiscountTotalCents,
      refundedTotalCents,
      refundedCount: refundedOrCancelledRegs.filter((r) => r.status === "refunded").length,
      stripePaidCount,
      stripeGrossCents,
      invoiceSettledCount,
      invoiceSettledCents,
      compedCount,
      donor250PlusCount,
    };
  }, [paidOrCompedRegs, pendingInvoices, refundedOrCancelledRegs, getFeeCents]);

  const tierBreakdown = useMemo(() => {
    const map: Record<
      RegistrationTier,
      {
        label: string;
        count: number;
        baseCents: number;
        discountCents: number;
        guestDinnerCents: number;
        donationsCents: number;
        grossCents: number;
        feesCents: number;
      }
    > = {
      student: {
        label: "Student Registration",
        count: 0,
        baseCents: 0,
        discountCents: 0,
        guestDinnerCents: 0,
        donationsCents: 0,
        grossCents: 0,
        feesCents: 0,
      },
      professional: {
        label: "Regular / Professional",
        count: 0,
        baseCents: 0,
        discountCents: 0,
        guestDinnerCents: 0,
        donationsCents: 0,
        grossCents: 0,
        feesCents: 0,
      },
      sponsor: {
        label: "Corporate Sponsor",
        count: 0,
        baseCents: 0,
        discountCents: 0,
        guestDinnerCents: 0,
        donationsCents: 0,
        grossCents: 0,
        feesCents: 0,
      },
    };

    for (const r of paidOrCompedRegs) {
      const bucket = map[r.tier] || map.professional;
      bucket.count += 1;
      bucket.baseCents += r.baseFeeCents || 0;
      bucket.discountCents += r.discountCents || 0;
      bucket.guestDinnerCents += (r.guestDinnerCount || 0) * (r.guestDinnerUnitCents || 0);
      bucket.donationsCents += r.optionalStudentFundDonationCents || 0;
      bucket.grossCents += r.totalCents || 0;
      bucket.feesCents += getFeeCents(r);
    }

    return Object.entries(map).map(([tier, data]) => ({
      tier: tier as RegistrationTier,
      ...data,
      netCents: Math.max(0, data.grossCents - data.feesCents),
    }));
  }, [paidOrCompedRegs, getFeeCents]);

  const discountTotalByPromo = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrations) {
      if (
        r.promoCodeUsed &&
        (r.status === "paid" || r.status === "comped" || r.status === "pending_invoice")
      ) {
        const key = r.promoCodeUsed.toUpperCase();
        map.set(key, (map.get(key) || 0) + (r.discountCents || 0));
      }
    }
    return map;
  }, [registrations]);

  const filteredLedger = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (paymentModeFilter !== "all" && r.paymentMode !== paymentModeFilter) return false;
      if (!q) return true;
      return (
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.affiliation.toLowerCase().includes(q) ||
        (r.receiptNumber || "").toLowerCase().includes(q) ||
        (r.invoiceNumber || "").toLowerCase().includes(q) ||
        (r.stripePaymentIntentId || "").toLowerCase().includes(q) ||
        (r.promoCodeUsed || "").toLowerCase().includes(q)
      );
    });
  }, [registrations, searchQuery, statusFilter, paymentModeFilter]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 mt-4">Verifying Treasurer credentials...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Treasurer Access Required</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          Sign in with an authorized HEMS{" "}
          <strong className="font-semibold text-foreground">
            Society Treasurer (&lsquo;treasurer&rsquo;)
          </strong>{" "}
          account to access financial controls, refunds, promo codes, and Stripe reporting.
        </p>
        <Link
          href={user ? "/layout-portal" : "/auth"}
          className="mt-6 bg-primary text-white hover:bg-sky-800 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          {user ? "Return to Workshop Overview" : "Treasurer Sign In"}
        </Link>
      </div>
    );
  }

  const stripeBaseUrl =
    stripeDashboardMode === "test"
      ? "https://dashboard.stripe.com/test"
      : "https://dashboard.stripe.com";

  const handleConfirmMarkPaid = async (e: FormEvent) => {
    e.preventDefault();
    if (!markPaidTarget) return;
    const res = await markInvoicePaid(
      markPaidTarget.id,
      paymentRefInput.trim() || "Check / ACH Verified by Treasurer"
    );
    setActionBanner({
      ok: res.ok,
      msg: res.ok
        ? `Marked ${markPaidTarget.firstName} ${markPaidTarget.lastName} as PAID and provisioned Attendee role + mailing tag.`
        : res.error || "Failed to mark invoice paid.",
    });
    setMarkPaidTarget(null);
    setPaymentRefInput("");
  };

  const handleConfirmRefundOrCancel = async (e: FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;
    const nextStatus = refundTarget.status === "pending_invoice" ? "cancelled" : "refunded";
    const res = await refundOrCancel(refundTarget.id, nextStatus, {
      refundReason: refundReasonInput.trim(),
      revokeAttendeeRole: revokeRoleOnRefund,
    });
    setActionBanner({
      ok: res.ok,
      msg: res.ok
        ? `${nextStatus === "refunded" ? "Refund processed" : "Invoice cancelled"} for ${refundTarget.firstName} ${refundTarget.lastName} (${formatCentsUsd(refundTarget.totalCents)}).`
        : res.error || "Failed to update registration status.",
    });
    setRefundTarget(null);
    setRefundReasonInput("");
  };

  const handleApplyPromoPreset = (presetId: "sponsor" | "student" | "speaker" | "half_student") => {
    if (presetId === "sponsor") {
      setNewPromoCode("SPONSOR2027-");
      setNewPromoLabel("Corporate Sponsor Included Registration");
      setNewPromoType("percent");
      setNewPromoValue("100");
      setNewPromoMaxUses("1");
      setNewPromoTiers(["professional", "sponsor"]);
      setNewPromoGrantsSponsor(true);
      setNewPromoNotes("Sponsor package complimentary badge & exhibitor access.");
    } else if (presetId === "student") {
      setNewPromoCode("AWARD2027-");
      setNewPromoLabel("Student Travel Awardee Fee Waiver");
      setNewPromoType("percent");
      setNewPromoValue("100");
      setNewPromoMaxUses("10");
      setNewPromoTiers(["student"]);
      setNewPromoGrantsSponsor(false);
      setNewPromoNotes("Student award finalist complimentary registration.");
    } else if (presetId === "speaker") {
      setNewPromoCode("KEYNOTE2027");
      setNewPromoLabel("Invited Speaker / Host Waiver");
      setNewPromoType("percent");
      setNewPromoValue("100");
      setNewPromoMaxUses("4");
      setNewPromoTiers(["professional"]);
      setNewPromoGrantsSponsor(false);
      setNewPromoNotes("Approved by Organizing Committee & Treasurer.");
    } else {
      setNewPromoCode("STUDENT50");
      setNewPromoLabel("Graduate Student 50% Grant Support");
      setNewPromoType("percent");
      setNewPromoValue("50");
      setNewPromoMaxUses("20");
      setNewPromoTiers(["student"]);
      setNewPromoGrantsSponsor(false);
      setNewPromoNotes("Partial student travel registration discount.");
    }
  };

  const handleCreatePromo = async (e: FormEvent) => {
    e.preventDefault();
    const clean = newPromoCode.trim().toUpperCase();
    if (!clean || !newPromoLabel.trim()) return;
    const rawNum = Number.parseFloat(newPromoValue || "0");
    const discountValue =
      newPromoType === "percent"
        ? Math.max(1, Math.min(100, Math.round(rawNum)))
        : Math.max(100, Math.round(rawNum * 100));

    const promoObj: WorkshopPromoCode = {
      code: clean,
      label: newPromoLabel.trim(),
      workshopYear: Number.parseInt(workshop.workshop_year || "2027", 10) || 2027,
      discountType: newPromoType,
      discountValue,
      allowedTiers: newPromoTiers.length > 0 ? newPromoTiers : ["professional"],
      grantsSponsorRole: newPromoGrantsSponsor,
      maxUses: Math.max(1, Number.parseInt(newPromoMaxUses || "1", 10) || 1),
      usesCount: 0,
      active: true,
      notes: newPromoNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const res = await savePromoCode(promoObj);
    setActionBanner({
      ok: res.ok,
      msg: res.ok ? `Saved promo code ${clean}.` : res.error || "Could not save promo code.",
    });
    if (res.ok) {
      setNewPromoCode("");
      setNewPromoLabel("");
      setNewPromoNotes("");
    }
  };

  const exportTreasurerCsv = () => {
    downloadCsvFile(
      `HEMS_${workshop.workshop_year}_Treasurer_Ledger.csv`,
      [
        "Ref #",
        "Status",
        "Payment Mode",
        "Stripe PI",
        "Tier",
        "Pricing Window",
        "First Name",
        "Last Name",
        "Email",
        "Affiliation",
        "Base Fee (USD)",
        "Discount (USD)",
        "Guest Dinner USD",
        "IRC 6115 Gift (USD)",
        "Total Gross (USD)",
        "Est Stripe Fee (USD)",
        "Est Net Proceeds (USD)",
        "Promo Code",
        "Payment Summary",
        "Paid Date",
        "Refunded Date",
        "Refund Reason",
      ],
      registrations.map((r) => {
        const fee = r.status === "paid" ? getFeeCents(r) : 0;
        const dinnerCents = (r.guestDinnerCount || 0) * (r.guestDinnerUnitCents || 0);
        return [
          r.receiptNumber || r.invoiceNumber || r.id,
          r.status,
          r.paymentMode,
          r.stripePaymentIntentId || "",
          r.tier,
          r.pricingWindow,
          r.firstName,
          r.lastName,
          r.email,
          r.affiliation,
          (r.baseFeeCents / 100).toFixed(2),
          (r.discountCents / 100).toFixed(2),
          (dinnerCents / 100).toFixed(2),
          ((r.optionalStudentFundDonationCents || 0) / 100).toFixed(2),
          (r.totalCents / 100).toFixed(2),
          (fee / 100).toFixed(2),
          ((r.totalCents - fee) / 100).toFixed(2),
          r.promoCodeUsed || "",
          r.paymentSummary || "",
          r.paidAt || "",
          r.refundedAt || "",
          r.refundReason || "",
        ];
      })
    );
  };

  const exportPendingInvoicesCsv = () => {
    downloadCsvFile(
      `HEMS_${workshop.workshop_year}_Pending_Invoices_Aging.csv`,
      [
        "Invoice #",
        "Attendee Name",
        "Email",
        "Affiliation",
        "Tier",
        "Amount Due (USD)",
        "Issued Date",
        "Days Outstanding",
      ],
      pendingInvoices.map((r) => [
        r.invoiceNumber || r.id,
        `${r.firstName} ${r.lastName}`,
        r.email,
        r.affiliation,
        r.tier,
        (r.totalCents / 100).toFixed(2),
        r.createdAt.slice(0, 10),
        daysOutstanding(r.createdAt),
      ])
    );
  };

  const exportDonationsCsv = () => {
    const donors = paidOrCompedRegs.filter(
      (r) => (r.optionalStudentFundDonationCents || 0) > 0
    );
    downloadCsvFile(
      `HEMS_${workshop.workshop_year}_Charitable_Donations_Log.csv`,
      [
        "Receipt #",
        "Donor Name",
        "Email",
        "Affiliation",
        "Charitable Gift (USD)",
        "Quid Pro Quo Registration+Meals (USD)",
        "Total Payment (USD)",
        "IRC 170 >= $250 Substantiation Required",
        "Paid Date",
      ],
      donors.map((r) => {
        const gift = r.optionalStudentFundDonationCents || 0;
        const quidProQuo = Math.max(0, r.totalCents - gift);
        return [
          r.receiptNumber || r.id,
          `${r.firstName} ${r.lastName}`,
          r.email,
          r.affiliation,
          (gift / 100).toFixed(2),
          (quidProQuo / 100).toFixed(2),
          (r.totalCents / 100).toFixed(2),
          gift >= 25000 ? "YES" : "NO",
          (r.paidAt || r.createdAt).slice(0, 10),
        ];
      })
    );
  };

  const configuredEin = (process.env.NEXT_PUBLIC_HEMS_SOCIETY_EIN || "").trim();

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700 mb-1">
            <span>Society Treasurer • 501(c)(3) Financial Control</span>
            <span className="text-slate-300">•</span>
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] tracking-wider ${
                stripeSummary?.mode === "live"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : stripeSummary?.mode === "test"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              Stripe:{" "}
              {stripeSummary?.mode === "live"
                ? "Live Mode Connected"
                : stripeSummary?.mode === "test"
                ? "Test Mode Connected"
                : stripeSummary?.mode === "local_sandbox"
                ? "Local Sandbox"
                : "Keys Pending Setup"}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 flex items-center gap-2.5">
            <Landmark className="text-rose-700 shrink-0" size={26} />
            <span>{workshop.workshop_ordinal} Workshop Treasurer &amp; Stripe Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Monitor collected revenue, estimated Stripe fees, and net proceeds; settle institutional POs; issue full refunds; mint sponsor and award promo codes; and open Stripe Dashboard views.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={stripeBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#635BFF] text-white hover:bg-[#5249F5] text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            Open Stripe Dashboard <ExternalLink size={13} />
          </a>
          <button
            type="button"
            onClick={exportTreasurerCsv}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-primary/50 hover:text-primary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} /> Ledger CSV
          </button>
          <button
            type="button"
            disabled={loading || loadingStripe || busy}
            onClick={() => {
              void reload();
              void refreshStripeStatus();
            }}
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading || loadingStripe ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
      </header>

      {(errorMsg || actionBanner) && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            errorMsg || (actionBanner && !actionBanner.ok)
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <span>{errorMsg || actionBanner?.msg}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            aria-label="Dismiss banner"
            className="text-current opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 6 Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Gross Collected
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 mt-1">
            {formatCentsUsd(financials.grossCollectedCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            {paidOrCompedRegs.length} settled seat(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Est. Fees</span>
            <button
              type="button"
              onClick={() => setUseNonprofitFeeEstimate((v) => !v)}
              title="Toggle standard (2.9%+$0.30) vs 501(c)(3) Nonprofit discounted rate (2.2%+$0.30)"
              className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-primary hover:bg-primary/10 cursor-pointer"
            >
              {useNonprofitFeeEstimate ? "2.2% NP" : "2.9% Std"}
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-amber-700 mt-1">
            -{formatCentsUsd(financials.estFeesCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            Saves ~{formatCentsUsd(financials.nonprofitSavingsCents)} on NP rate
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
            Net Proceeds
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-emerald-800 mt-1">
            {formatCentsUsd(financials.netProceedsCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            After est. processing
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Pending POs / Checks
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-amber-800 mt-1">
            {formatCentsUsd(financials.pendingTotalCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            {pendingInvoices.length} open
            {financials.overdueInvoiceCount > 0
              ? ` (${financials.overdueInvoiceCount} ≥30d)`
              : ""}
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Student Travel Gifts
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-secondary mt-1">
            {formatCentsUsd(financials.studentDonationsCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            IRC § 6115 restricted
          </div>
        </div>

        <div className="bg-white border border-slate-200/95 rounded-xl p-4 shadow-2xs">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Refunds / Waivers
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 mt-1">
            {formatCentsUsd(financials.refundedTotalCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            {financials.refundedCount} refunded • {formatCentsUsd(financials.promoDiscountTotalCents)} waived
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          [
            { id: "overview", label: "Money & Cash-Flow", icon: Wallet },
            { id: "ledger", label: `Invoices & Refunds (${registrations.length})`, icon: ReceiptText },
            { id: "promos", label: `Promo & Sponsor Codes (${promoCodes.length})`, icon: Tag },
            { id: "stripe", label: "Stripe Account & Setup", icon: Webhook },
            { id: "compliance", label: "501(c)(3) Tax & Exports", icon: FileSpreadsheet },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-primary/40"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MONEY & CASH-FLOW OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Stripe Balance & Recent Payouts */}
            <div className="lg:col-span-5 bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <BadgeDollarSign size={18} className="text-[#635BFF]" />
                  Stripe Balance &amp; Bank Payouts
                </h2>
                <a
                  href={`${stripeBaseUrl}/balance/overview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#635BFF] hover:underline inline-flex items-center gap-1"
                >
                  Stripe Balance <ArrowUpRight size={12} />
                </a>
              </div>

              {stripeSummary?.configured && stripeSummary.availableUsdCents !== null ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700 block">
                        Available for Payout
                      </span>
                      <span className="text-xl font-bold tabular-nums text-emerald-900">
                        {formatCentsUsd(stripeSummary.availableUsdCents)}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                        Pending Clearing
                      </span>
                      <span className="text-xl font-bold tabular-nums text-slate-900">
                        {formatCentsUsd(stripeSummary.pendingUsdCents ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Recent Bank Transfers ({stripeSummary.recentPayouts.length})
                    </h3>
                    {stripeSummary.recentPayouts.length === 0 ? (
                      <p className="text-xs text-slate-500">No Stripe bank payouts initiated yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {stripeSummary.recentPayouts.map((p) => (
                          <div key={p.id} className="px-3 py-2 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-mono text-[11px] text-slate-700">{p.id}</span>
                              <div className="text-[10.5px] text-slate-500">
                                Arrival: {p.arrivalDateIso.slice(0, 10)} • {p.status}
                              </div>
                            </div>
                            <span className="font-bold tabular-nums text-slate-900">
                              {formatCentsUsd(p.amountCents)} {p.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-slate-800">
                      {stripeSummary?.mode === "local_sandbox"
                        ? "Running in Local Sandbox Mode"
                        : "Live Stripe Secret Key Not Yet Configured"}
                    </div>
                    <p>
                      Once <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">STRIPE_SECRET_KEY</code> is saved in Firebase Secrets, live HEMS Stripe bank balances and recent payouts load here automatically alongside direct Stripe Dashboard launchpad links.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("stripe")}
                      className="px-3.5 py-2 rounded-lg bg-[#635BFF] text-white font-semibold hover:bg-[#5249F5] cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Webhook size={13} /> View Stripe Setup Checklist
                    </button>
                    <a
                      href={stripeBaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:border-primary/40 inline-flex items-center gap-1.5"
                    >
                      Open stripe.com <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Active Pricing Window & Payment Channels */}
            <div className="lg:col-span-7 bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Payment Channels &amp; Live Fee Schedule
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  Sheet Sync: <strong>{isLiveSynced ? "Live Google Sheet" : "Snapshot"}</strong> • {schedule.statusBadgeLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-slate-200">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Stripe Online Settled
                  </span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {formatCentsUsd(financials.stripeGrossCents)}
                  </span>
                  <span className="block text-[11px] text-slate-500 tabular-nums">
                    {financials.stripePaidCount} card / ACH payment(s)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-slate-200">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Check / PO Settled
                  </span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {formatCentsUsd(financials.invoiceSettledCents)}
                  </span>
                  <span className="block text-[11px] text-slate-500 tabular-nums">
                    {financials.invoiceSettledCount} zero-fee invoice(s)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-slate-200">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                    100% Waiver / Comp
                  </span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {financials.compedCount} seat(s)
                  </span>
                  <span className="block text-[11px] text-slate-500 tabular-nums">
                    {formatCentsUsd(financials.promoDiscountTotalCents)} total discounted
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Student (Early / Reg)
                  </span>
                  <strong className="text-slate-900">
                    {formatCentsUsd(schedule.activeFees.studentEarlyCents)} /{" "}
                    {formatCentsUsd(schedule.activeFees.studentRegularCents)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Regular (Early / Reg)
                  </span>
                  <strong className="text-slate-900">
                    {formatCentsUsd(schedule.activeFees.professionalEarlyCents)} /{" "}
                    {formatCentsUsd(schedule.activeFees.professionalRegularCents)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Sponsor Tier
                  </span>
                  <strong className="text-slate-900">
                    {formatCentsUsd(schedule.activeFees.sponsorRegularCents)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Guest Dinner Add-On
                  </span>
                  <strong className="text-slate-900">
                    {formatCentsUsd(schedule.activeFees.guestDinnerCents)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Tier & Revenue Stream Breakdown */}
          <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  Revenue Breakdown by Registration Tier
                </h2>
                <p className="text-xs text-slate-500">
                  Includes base registration fees, applied promo/sponsor waivers, guest Wednesday dinner tickets, and Student Fund gifts across confirmed registrations.
                </p>
              </div>
              {canViewOperations && (
                <Link
                  href="/operations/registrations"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Open Operations Registration Roster <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3 text-right">Seats</th>
                    <th className="px-4 py-3 text-right">Base Fees</th>
                    <th className="px-4 py-3 text-right">Waivers / Discounts</th>
                    <th className="px-4 py-3 text-right">Guest Meals</th>
                    <th className="px-4 py-3 text-right">Student Fund Gifts</th>
                    <th className="px-4 py-3 text-right">Gross Collected</th>
                    <th className="px-4 py-3 text-right">Est. Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {tierBreakdown.map((row) => (
                    <tr key={row.tier}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-right font-medium">{row.count}</td>
                      <td className="px-4 py-3 text-right">{formatCentsUsd(row.baseCents)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        -{formatCentsUsd(row.discountCents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCentsUsd(row.guestDinnerCents)}
                      </td>
                      <td className="px-4 py-3 text-right text-secondary font-medium">
                        {formatCentsUsd(row.donationsCents)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCentsUsd(row.grossCents)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800">
                        {formatCentsUsd(row.netCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEDGER, INVOICES & REFUNDS */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {pendingInvoices.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-950">
                <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>
                    {pendingInvoices.length} Institutional Invoice(s) Awaiting Settlement (
                    {formatCentsUsd(financials.pendingTotalCents)})
                  </strong>
                  <p className="text-amber-900/80 mt-0.5">
                    Click <strong>Mark Paid</strong> once the institutional check, wire, or ACH PO clears the HEMS bank account to unlock attendee whitelist access and email the paid receipt.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={exportPendingInvoicesCsv}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100/70 shrink-0 cursor-pointer"
              >
                Export Aging CSV
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payee, email, receipt/invoice #, promo code, or Stripe pi_..."
                className="hems-control w-full pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="hems-control"
            >
              <option value="all">All Statuses</option>
              <option value="pending_invoice">Pending Invoice</option>
              <option value="paid">Paid</option>
              <option value="comped">Comped / Waiver</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="hems-control"
            >
              <option value="all">All Payment Channels</option>
              <option value="stripe">Stripe (Card / ACH)</option>
              <option value="invoice">Institutional Invoice / PO</option>
              <option value="comped">100% Waiver / Comp</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Ref # / Stripe</th>
                    <th className="px-4 py-3">Payee &amp; Institution</th>
                    <th className="px-4 py-3">Itemized Breakdown</th>
                    <th className="px-4 py-3 text-right">Gross / Net</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Treasurer Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((reg) => {
                    const refNum = reg.receiptNumber || reg.invoiceNumber || reg.id;
                    const fee = reg.status === "paid" ? getFeeCents(reg) : 0;
                    const netCents = Math.max(0, reg.totalCents - fee);
                    const receiptAbsoluteUrl =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/registration/receipt?regId=${encodeURIComponent(
                            reg.id
                          )}&token=${encodeURIComponent(reg.receiptToken)}`
                        : `/registration/receipt?regId=${encodeURIComponent(reg.id)}&token=${encodeURIComponent(reg.receiptToken)}`;

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <div className="font-bold text-slate-900">{refNum}</div>
                          {reg.stripePaymentIntentId ? (
                            <a
                              href={`${stripeBaseUrl}/payments/${encodeURIComponent(reg.stripePaymentIntentId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#635BFF] hover:underline inline-flex items-center gap-0.5 mt-0.5"
                            >
                              {reg.stripePaymentIntentId.slice(0, 18)}… <ArrowUpRight size={10} />
                            </a>
                          ) : (
                            <span className="text-[10.5px] font-sans text-slate-400">
                              {reg.paymentMode === "invoice" ? "Check / ACH PO" : reg.paymentMode}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {reg.firstName} {reg.lastName}
                          </div>
                          <div className="text-slate-600">{reg.affiliation}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{reg.email}</div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-[11px] text-slate-600">
                          <div>
                            <strong className="capitalize text-slate-800">{reg.tier}</strong> (
                            {reg.pricingWindow === "early_bird" ? "Early" : "Reg"}):{" "}
                            {formatCentsUsd(reg.baseFeeCents)}
                          </div>
                          {reg.discountCents > 0 && (
                            <div className="text-emerald-700 font-medium">
                              Promo {reg.promoCodeUsed || ""}: -{formatCentsUsd(reg.discountCents)}
                            </div>
                          )}
                          {(reg.guestDinnerCount || 0) > 0 && (
                            <div>
                              Guest Dinners ({reg.guestDinnerCount}):{" "}
                              {formatCentsUsd(
                                reg.guestDinnerCount * (reg.guestDinnerUnitCents || 0)
                              )}
                            </div>
                          )}
                          {(reg.optionalStudentFundDonationCents || 0) > 0 && (
                            <div className="text-secondary font-medium">
                              IRC § 6115 Gift:{" "}
                              {formatCentsUsd(reg.optionalStudentFundDonationCents)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <div className="font-bold text-slate-900">
                            {formatCentsUsd(reg.totalCents)}
                          </div>
                          {fee > 0 ? (
                            <div className="text-[10.5px] text-slate-500">
                              Net {formatCentsUsd(netCents)} (-{formatCentsUsd(fee)})
                            </div>
                          ) : (
                            <div className="text-[10.5px] text-slate-400">
                              {reg.paymentSummary || reg.paymentMode}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              reg.status === "paid" || reg.status === "comped"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : reg.status === "pending_invoice"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {reg.status.replace("_", " ")}
                          </span>
                          {reg.status === "pending_invoice" && (
                            <div className="text-[10.5px] text-amber-800 mt-0.5 tabular-nums">
                              {daysOutstanding(reg.createdAt)}d open
                            </div>
                          )}
                          {reg.refundReason && (
                            <div className="text-[10.5px] text-slate-500 mt-0.5 max-w-[160px] truncate" title={reg.refundReason}>
                              {reg.refundReason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                          {reg.status === "pending_invoice" && (
                            <>
                              <button
                                type="button"
                                onClick={() => setMarkPaidTarget(reg)}
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-[11px] cursor-pointer"
                              >
                                Mark Paid
                              </button>
                              <button
                                type="button"
                                title="Copy polite Treasurer invoice payment reminder to clipboard"
                                onClick={() =>
                                  void copyText(
                                    `inv-${reg.id}`,
                                    `Subject: Payment Reminder — ${workshop.workshop_ordinal} HEMS Workshop Invoice ${refNum}\n\nDear ${reg.firstName} ${reg.lastName},\n\nOur records show institutional registration invoice ${refNum} (${formatCentsUsd(reg.totalCents)} USD) is currently open for ${workshop.workshop_ordinal} HEMS Workshop (${workshop.workshop_year}).\n\nPrintable Invoice & Remittance Link:\n${receiptAbsoluteUrl}\n\nPlease reply with your check number or ACH reference once remitted so our Treasurer can mark your account settled.\n\nSincerely,\nHEMS Society Treasurer`,
                                    `Copied follow-up reminder for invoice ${refNum}.`
                                  )
                                }
                                className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-900 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                {copiedId === `inv-${reg.id}` ? (
                                  <Check size={11} />
                                ) : (
                                  <Mail size={11} />
                                )}
                                Remind
                              </button>
                            </>
                          )}
                          <Link
                            href={`/registration/receipt?regId=${encodeURIComponent(
                              reg.id
                            )}&token=${encodeURIComponent(reg.receiptToken)}`}
                            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:text-primary text-slate-700 font-semibold text-[11px] inline-block"
                          >
                            Receipt
                          </Link>
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await resendReceipt(reg.id);
                              setActionBanner({
                                ok: res.ok,
                                msg: res.ok
                                  ? `Dispatched receipt email to ${reg.email}.`
                                  : res.error || "Failed to resend receipt.",
                              });
                            }}
                            title="Re-send official email receipt via Postmark"
                            className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:text-primary text-slate-600 font-semibold text-[11px] cursor-pointer"
                          >
                            Email
                          </button>
                          {reg.status !== "refunded" && reg.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundTarget(reg);
                                setRefundReasonInput("");
                                setRevokeRoleOnRefund(true);
                              }}
                              className="px-2.5 py-1 rounded border border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                            >
                              <RotateCcw size={11} />
                              {reg.status === "pending_invoice" ? "Cancel PO" : "Refund"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROMO & CORPORATE SPONSOR CODES */}
      {activeTab === "promos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={(e) => void handleCreatePromo(e)}
            className="lg:col-span-4 bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-4"
          >
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
                <PlusCircle size={17} className="text-primary" /> Issue Promo / Sponsor Code
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Start from a Treasurer template or customize tier eligibility, usage cap, and Sponsor role grant.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPromoPreset("sponsor")}
                className="px-2 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-800 text-[10.5px] font-semibold hover:bg-orange-100 cursor-pointer"
              >
                + Sponsor Seat (100%)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPromoPreset("student")}
                className="px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10.5px] font-semibold hover:bg-teal-100 cursor-pointer"
              >
                + Student Award (100%)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPromoPreset("speaker")}
                className="px-2 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-[10.5px] font-semibold hover:bg-sky-100 cursor-pointer"
              >
                + Keynote Comp
              </button>
              <button
                type="button"
                onClick={() => handleApplyPromoPreset("half_student")}
                className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10.5px] font-semibold hover:bg-slate-200 cursor-pointer"
              >
                + Student 50%
              </button>
            </div>

            <div>
              <label className="hems-label">Code (Uppercase) *</label>
              <input
                type="text"
                required
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                placeholder="SPONSOR2027-ACME"
                className="hems-control w-full uppercase font-mono"
              />
            </div>

            <div>
              <label className="hems-label">Receipt Description / Purpose *</label>
              <input
                type="text"
                required
                value={newPromoLabel}
                onChange={(e) => setNewPromoLabel(e.target.value)}
                placeholder="Corporate Sponsor Included Seat"
                className="hems-control w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="hems-label">Discount Type</label>
                <select
                  value={newPromoType}
                  onChange={(e) =>
                    setNewPromoType(e.target.value as "percent" | "fixed_cents")
                  }
                  className="hems-control w-full"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed_cents">Fixed ($ USD)</option>
                </select>
              </div>
              <div>
                <label className="hems-label">
                  {newPromoType === "percent" ? "% Off (1-100)" : "$ USD Off"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPromoValue}
                  onChange={(e) => setNewPromoValue(e.target.value)}
                  className="hems-control w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="hems-label">Max Redemptions</label>
                <input
                  type="number"
                  min="1"
                  value={newPromoMaxUses}
                  onChange={(e) => setNewPromoMaxUses(e.target.value)}
                  className="hems-control w-full"
                />
              </div>
              <div>
                <label className="hems-label">Tier Scope</label>
                <select
                  value={newPromoTiers.join(",")}
                  onChange={(e) =>
                    setNewPromoTiers(e.target.value.split(",") as RegistrationTier[])
                  }
                  className="hems-control w-full"
                >
                  <option value="professional">Regular Only</option>
                  <option value="student">Student Only</option>
                  <option value="professional,sponsor">Regular &amp; Sponsor</option>
                  <option value="student,professional,sponsor">All Tiers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="hems-label">Internal Treasurer Note (Optional)</label>
              <input
                type="text"
                value={newPromoNotes}
                onChange={(e) => setNewPromoNotes(e.target.value)}
                placeholder="e.g. Approved in Oct Board budget"
                className="hems-control w-full"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newPromoGrantsSponsor}
                onChange={(e) => setNewPromoGrantsSponsor(e.target.checked)}
              />
              <span>Also grant &ldquo;corporate sponsor&rdquo; whitelist role</span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-sky-800 cursor-pointer"
            >
              Save / Update Promo Code
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Purpose &amp; Terms</th>
                    <th className="px-4 py-3">Redemptions</th>
                    <th className="px-4 py-3 text-right">Waived USD</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promoCodes.map((p) => {
                    const waived = discountTotalByPromo.get(p.code.toUpperCase()) || 0;
                    return (
                      <tr key={p.code} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{p.code}</span>
                            <button
                              type="button"
                              onClick={() =>
                                void copyText(
                                  `promo-${p.code}`,
                                  p.code,
                                  `Copied promo code "${p.code}" to clipboard.`
                                )
                              }
                              title="Copy promo code"
                              className="text-slate-400 hover:text-primary cursor-pointer"
                            >
                              {copiedId === `promo-${p.code}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                          {p.grantsSponsorRole && (
                            <span className="inline-block mt-1 text-[9.5px] font-sans font-semibold px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                              +Sponsor Role
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{p.label}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.discountType === "percent"
                              ? `${p.discountValue}% off`
                              : `${formatCentsUsd(p.discountValue)} off`}{" "}
                            • {p.allowedTiers.join(", ")}
                          </div>
                          {p.notes && (
                            <div className="text-[10.5px] text-slate-400 mt-0.5">{p.notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {p.usesCount} / {p.maxUses}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800">
                          {formatCentsUsd(waived)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              p.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {p.active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void togglePromoCode(p.code)}
                            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {p.active ? "Disable" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STRIPE ACCOUNT VISUAL HUB & SETUP CHECKLIST */}
      {activeTab === "stripe" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#635BFF] block mb-1">
                  Visual Dashboard Access • PCI-DSS Compliant Direct Links
                </span>
                <h2 className="font-serif text-xl font-semibold text-slate-900">
                  Stripe Account Control Views
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Stripe blocks third-party iframe embedding via <code className="bg-slate-100 px-1 rounded">X-Frame-Options</code> for banking security. Use these direct deep-links alongside the live Balance &amp; Payouts API panel above to visualize transactions, bank deposits, disputes, and webhooks.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 shrink-0 self-start">
                <button
                  type="button"
                  onClick={() => setStripeDashboardMode("live")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    stripeDashboardMode === "live"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Live Mode
                </button>
                <button
                  type="button"
                  onClick={() => setStripeDashboardMode("test")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    stripeDashboardMode === "test"
                      ? "bg-amber-100 text-amber-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Test Sandbox
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  title: "Payments & Card/ACH Charges",
                  desc: "Inspect real-time Card and US Bank Account ACH settlements, receipts, and declines.",
                  href: `${stripeBaseUrl}/payments`,
                },
                {
                  title: "Balances & Bank Payouts",
                  desc: "Track cleared funds, pending ACH holds, and automated transfers to the HEMS bank account.",
                  href: `${stripeBaseUrl}/balance/overview`,
                },
                {
                  title: "Refunds & Disputes Center",
                  desc: "Review issued refunds, partial credits, or chargeback evidence deadlines.",
                  href: `${stripeBaseUrl}/disputes`,
                },
                {
                  title: "Webhook Delivery Logs",
                  desc: "Verify HTTP 200 delivery of checkout.session.completed and charge.refunded events.",
                  href: `${stripeBaseUrl}/webhooks`,
                },
                {
                  title: "Team Access & 2FA Settings",
                  desc: "Add Treasurer & President logins with least-privilege Developer vs. View/Refund roles.",
                  href: `${stripeBaseUrl}/settings/team`,
                },
                {
                  title: "Account & Nonprofit Rate Settings",
                  desc: "Verify 501(c)(3) legal entity details, payout schedule, and fee discount status.",
                  href: `${stripeBaseUrl}/settings/account`,
                },
              ].map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-[#FAFBFD] border border-slate-200/90 hover:border-[#635BFF]/60 hover:bg-white transition-all group space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 group-hover:text-[#635BFF]">
                    <span>{card.title}</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* 5-Step Stripe Login, Setup & Visualization Checklist */}
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              Stripe Login, Setup &amp; Firebase Wiring Checklist
            </h3>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="font-bold text-slate-900">
                  1. Verify Login, Legal Entity &amp; 501(c)(3) Nonprofit Fee Discount
                </div>
                <p>
                  Sign in at{" "}
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-semibold"
                  >
                    dashboard.stripe.com
                  </a>{" "}
                  under the Harsh-Environment Mass Spectrometry Society, Inc. account (with 2FA enabled). Invite Board Officers under{" "}
                  <strong>Settings → Team</strong> as Treasurer/Admin. Email{" "}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                    nonprofit@stripe.com
                  </code>{" "}
                  with HEMS&apos;s IRS 501(c)(3) determination letter and EIN to request Stripe&apos;s discounted{" "}
                  <strong>2.2% + $0.30</strong> nonprofit card rate (down from 2.9% + $0.30) and zero-cost ACH cap.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="font-bold text-slate-900">
                  2. Enable Cards + US Bank Account (ACH Direct Debit)
                </div>
                <p>
                  In Stripe Dashboard → <strong>Settings → Payment methods</strong>, confirm{" "}
                  <strong>Cards</strong> and <strong>US bank account (ACH Direct Debit)</strong> are turned On (our backend sends{" "}
                  <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">
                    payment_method_types: [&quot;card&quot;, &quot;us_bank_account&quot;]
                  </code>{" "}
                  so institutional registrants can pay 0.8% ACH capped at $5.00).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span>3. Save Stripe API Keys in Google Cloud / Firebase Secrets</span>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                      stripeSummary?.configured
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {stripeSummary?.configured
                      ? `Secret Key Active (${stripeSummary.mode})`
                      : "Pending Secret Key"}
                  </span>
                </div>
                <p>
                  Copy the Secret Key (<code className="font-mono">sk_test_...</code> first for sandbox tests, then <code className="font-mono">sk_live_...</code>) from Stripe Developers → API Keys and bind it to Cloud Functions:
                </p>
                <div className="flex items-center justify-between gap-2 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 font-mono text-[11px] overflow-x-auto">
                  <span>
                    firebase functions:secrets:set STRIPE_SECRET_KEY &amp;&amp; firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        "cmd-secrets",
                        "firebase functions:secrets:set STRIPE_SECRET_KEY\nfirebase functions:secrets:set STRIPE_WEBHOOK_SECRET",
                        "Copied Firebase Secret Manager commands."
                      )
                    }
                    className="text-sky-300 hover:text-white shrink-0 cursor-pointer"
                  >
                    <ClipboardCopy size={13} />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span>4. Register HEMS Webhook Endpoint in Stripe Dashboard</span>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                      stripeSummary?.hasWebhookSecret
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {stripeSummary?.hasWebhookSecret ? "Webhook Secret Configured" : "Pending Webhook"}
                  </span>
                </div>
                <p>
                  Under Stripe Dashboard → <strong>Developers → Webhooks → Add endpoint</strong>, paste the URL below, subscribe to{" "}
                  <code className="font-mono">checkout.session.completed</code>,{" "}
                  <code className="font-mono">checkout.session.async_payment_succeeded</code>,{" "}
                  <code className="font-mono">checkout.session.async_payment_failed</code>, and{" "}
                  <code className="font-mono">charge.refunded</code>, then copy the <code className="font-mono">whsec_...</code> signing secret into <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>:
                </p>
                <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-800">
                  <span>https://hems-workshop.org/api/registration/webhooks/stripe</span>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        "webhook-url",
                        "https://hems-workshop.org/api/registration/webhooks/stripe",
                        "Copied Stripe webhook endpoint URL."
                      )
                    }
                    className="text-primary hover:underline shrink-0 cursor-pointer"
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="font-bold text-slate-900">
                  5. Visualize Every Transaction Without Paid Third-Party SaaS
                </div>
                <p>
                  Once connected, Stripe events automatically visualize in 3 places at <strong>$0/month</strong>: (1) Stripe&apos;s own web Dashboard &amp; Stripe iOS/Android mobile app with live payout charts, (2) this Treasurer Portal&apos;s live Balance/Payouts &amp; Tier Revenue view, and (3) automatic row sync to the Officer Google Sheet (<code className="font-mono">GOOGLE_REGISTRATION_SHEET_ID</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 501(c)(3) TAX, FORM 990 & EXPORTS */}
      {activeTab === "compliance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Building2 size={15} /> IRS Form 990 &amp; IRC § 6115 Summary ({workshop.workshop_year})
            </div>
            <h2 className="font-serif text-xl font-semibold text-slate-900">
              Nonprofit Revenue vs. Charitable Gifts Split
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically separates quid-pro-quo conference registration and guest dinner revenue (Form 990 Part VIII Line 2 Program Service Revenue) from voluntary Student Travel Award donations (Form 990 Part VIII Line 1f).
            </p>
            <div className="grid grid-cols-2 gap-3 tabular-nums">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Program Service Revenue
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {formatCentsUsd(financials.programServiceRevenueCents)}
                </span>
                <span className="text-[11px] text-slate-500 block">Non-deductible exchange</span>
              </div>
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-secondary block">
                  Charitable Contributions
                </span>
                <span className="text-xl font-bold text-secondary">
                  {formatCentsUsd(financials.studentDonationsCents)}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {financials.donor250PlusCount} donor(s) ≥ $250 IRC § 170(f)(8)
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFBFD] border border-slate-200 text-xs space-y-1 text-slate-700">
              <div>
                <strong>Payee / Legal Entity:</strong> Harsh-Environment Mass Spectrometry Society, Inc.
              </div>
              <div>
                <strong>IRS Tax Status:</strong> 501(c)(3) Scientific Public Charity
              </div>
              <div>
                <strong>Federal EIN:</strong>{" "}
                {configuredEin || "Set NEXT_PUBLIC_HEMS_SOCIETY_EIN in build environment for W-9 display"}
              </div>
              <div>
                <strong>Remittance / Billing Contact:</strong>{" "}
                Harsh-Environment Mass Spectrometry Society, Inc. • St. Petersburg, FL, USA ({workshop.sponsor_coordinator_email || "tim.short@hems-workshop.org"})
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-700">
              <FileSpreadsheet size={15} /> Treasurer Audit &amp; Reconciliation CSVs
            </div>
            <h2 className="font-serif text-xl font-semibold text-slate-900">
              Accounting Spreadsheets
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download UTF-8 BOM Excel/Sheets-ready CSV files separated for annual Board financial audits, bank reconciliation, and overdue accounts receivable follow-up.
            </p>
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={exportTreasurerCsv}
                className="w-full px-4 py-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-sky-800 flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>Full Treasurer Accounting Ledger CSV ({registrations.length} rows)</span>
                <Download size={14} />
              </button>
              <button
                type="button"
                onClick={exportPendingInvoicesCsv}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold hover:border-primary/50 flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>Open Institutional Invoices Aging CSV ({pendingInvoices.length} rows)</span>
                <Download size={14} />
              </button>
              <button
                type="button"
                onClick={exportDonationsCsv}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold hover:border-primary/50 flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>IRS Form 990 / IRC § 6115 Charitable Donations CSV</span>
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mark Pending Invoice Paid */}
      {markPaidTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleConfirmMarkPaid(e)}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Confirm Institutional Payment
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mark Invoice <strong>{markPaidTarget.invoiceNumber || markPaidTarget.id}</strong> for{" "}
              <strong>
                {markPaidTarget.firstName} {markPaidTarget.lastName}
              </strong>{" "}
              ({formatCentsUsd(markPaidTarget.totalCents)}) as PAID. This provisions the attendee whitelist role and sends the paid receipt.
            </p>
            <div>
              <label className="hems-label">Check # / ACH / Wire Reference *</label>
              <input
                type="text"
                required
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                placeholder="e.g. Check #44192 deposited 06/12/2027"
                className="hems-control w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMarkPaidTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Confirm Paid &amp; Provision
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Issue Refund or Cancel Invoice */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleConfirmRefundOrCancel(e)}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-red-700 block">
                  {refundTarget.status === "pending_invoice"
                    ? "Invoice Cancellation"
                    : "Stripe / Ledger Refund"}
                </span>
                <h3 className="font-serif text-xl font-semibold text-slate-900">
                  {refundTarget.status === "pending_invoice"
                    ? "Cancel Open Invoice"
                    : `Issue Full Refund (${formatCentsUsd(refundTarget.totalCents)})`}
                </h3>
              </div>
              <CheckCircle2 size={18} className="text-red-600 shrink-0 mt-1" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
              <div>
                <strong>Payee:</strong> {refundTarget.firstName} {refundTarget.lastName} ({refundTarget.email})
              </div>
              <div>
                <strong>Reference:</strong> {refundTarget.receiptNumber || refundTarget.invoiceNumber || refundTarget.id}
              </div>
              {refundTarget.stripePaymentIntentId && (
                <div className="text-red-800 font-medium">
                  This will execute a full refund via Stripe API against PaymentIntent{" "}
                  <code className="font-mono">{refundTarget.stripePaymentIntentId}</code>.
                </div>
              )}
            </div>

            <div>
              <label className="hems-label">Treasurer Refund / Cancellation Reason</label>
              <input
                type="text"
                value={refundReasonInput}
                onChange={(e) => setRefundReasonInput(e.target.value)}
                placeholder="e.g. Registrant unable to travel (policy cutoff)"
                className="hems-control w-full"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeRoleOnRefund}
                onChange={(e) => setRevokeRoleOnRefund(e.target.checked)}
              />
              <span>Revoke 2027 Attendee (and Sponsor) whitelist access for this email</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Keep Registration
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                {refundTarget.status === "pending_invoice"
                  ? "Confirm Cancel Invoice"
                  : "Confirm Issue Refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
