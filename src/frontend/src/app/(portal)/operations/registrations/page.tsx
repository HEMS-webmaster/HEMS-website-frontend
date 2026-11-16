"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileSpreadsheet,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Tag,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useWorkshopRegistrations } from "@/hooks/useWorkshopRegistrations";
import { useAbstractSubmissions } from "@/hooks/useAbstractSubmissions";
import {
  RegistrationTier,
  WorkshopPromoCode,
  WorkshopRegistrationRecord,
} from "@/types/registration";
import {
  buildArchiveParticipantRows,
  exportParticipantsArchivePdf,
  getParticipantsArchiveFilename,
} from "@/utils/exportParticipantsPdf";
import {
  evaluateRegistrationSchedule,
  formatCentsUsd,
} from "@/utils/upcomingWorkshop";
import {
  hasOperationsRole,
  hasTreasurerRole,
} from "@/utils/telemetryClient";

type BoardRegTab = "roster" | "promos" | "presenters" | "exports";

function escapeCsvCell(val: string | number | undefined | null): string {
  const s = String(val ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<string | number>>) {
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

export default function BoardRegistrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthorized = Boolean(user && hasOperationsRole(user.roles));
  const canManageFinances = Boolean(user && hasTreasurerRole(user.roles));

  const { workshop } = useUpcomingWorkshop();
  const schedule = evaluateRegistrationSchedule(workshop);
  const {
    registrations,
    promoCodes,
    loading,
    busy,
    errorMsg,
    reload,
    markInvoicePaid,
    transferSeat,
    toggleCheckIn,
    refundOrCancel,
    savePromoCode,
    togglePromoCode,
    resyncSheet,
  } = useWorkshopRegistrations(isAuthorized);

  const { submissions } = useAbstractSubmissions();

  const [activeTab, setActiveTab] = useState<BoardRegTab>("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [actionBanner, setActionBanner] = useState<{ ok: boolean; msg: string } | null>(
    null
  );
  const [printMode, setPrintMode] = useState<"badges" | "checkin" | null>(null);

  // Invoice Mark Paid modal
  const [markPaidTarget, setMarkPaidTarget] = useState<WorkshopRegistrationRecord | null>(
    null
  );
  const [paymentRefInput, setPaymentRefInput] = useState("");

  // Transfer Seat modal
  const [transferTarget, setTransferTarget] = useState<WorkshopRegistrationRecord | null>(
    null
  );
  const [txFirst, setTxFirst] = useState("");
  const [txLast, setTxLast] = useState("");
  const [txEmail, setTxEmail] = useState("");
  const [txAffil, setTxAffil] = useState("");

  // New Promo Code form
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoLabel, setNewPromoLabel] = useState("");
  const [newPromoType, setNewPromoType] = useState<"percent" | "fixed_cents">("percent");
  const [newPromoValue, setNewPromoValue] = useState("100");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("1");
  const [newPromoTiers, setNewPromoTiers] = useState<RegistrationTier[]>(["professional"]);
  const [newPromoGrantsSponsor, setNewPromoGrantsSponsor] = useState(false);

  // Proceedings Archive Participant List export options
  const [includeEmailInArchiveList, setIncludeEmailInArchiveList] = useState(true);
  const [excludeSamplesOverride, setExcludeSamplesOverride] = useState<boolean | null>(null);

  const activePaidRegs = useMemo(
    () =>
      registrations.filter(
        (r) => r.status === "paid" || r.status === "comped"
      ),
    [registrations]
  );

  const hasRealNonSamplePaidRegs = useMemo(
    () => activePaidRegs.some((r) => !r.isSampleSeed && !r.sandboxSimulation),
    [activePaidRegs]
  );

  const excludeSamplesInArchiveList = excludeSamplesOverride ?? hasRealNonSamplePaidRegs;

  const targetWorkshopYear = useMemo(
    () => Number.parseInt(workshop.workshop_year || "2027", 10) || 2027,
    [workshop.workshop_year]
  );

  const archiveParticipantRows = useMemo(
    () =>
      buildArchiveParticipantRows(registrations, {
        workshopYear: targetWorkshopYear,
        excludeSampleRecords: excludeSamplesInArchiveList,
      }),
    [registrations, targetWorkshopYear, excludeSamplesInArchiveList]
  );

  const pendingInvoices = useMemo(
    () => registrations.filter((r) => r.status === "pending_invoice"),
    [registrations]
  );

  const kpis = useMemo(() => {
    const grossPaidCents = activePaidRegs.reduce((s, r) => s + r.totalCents, 0);
    const estFeesCents = activePaidRegs.reduce(
      (s, r) => s + (r.stripeFeeEstimatedCents || 0),
      0
    );
    const pendingCents = pendingInvoices.reduce((s, r) => s + r.totalCents, 0);
    const dinnerAttendees = activePaidRegs.filter(
      (r) => r.wednesdayDinnerRsvp === "attending"
    ).length;
    const guestMeals = activePaidRegs.reduce((s, r) => s + (r.guestDinnerCount || 0), 0);
    const studentDonationsCents = activePaidRegs.reduce(
      (s, r) => s + (r.optionalStudentFundDonationCents || 0),
      0
    );
    return {
      paidCount: activePaidRegs.length,
      pendingCount: pendingInvoices.length,
      pendingCents,
      grossPaidCents,
      netEstimatedCents: Math.max(0, grossPaidCents - estFeesCents),
      totalDinnerHeadcount: dinnerAttendees + guestMeals,
      dinnerAttendees,
      guestMeals,
      studentDonationsCents,
    };
  }, [activePaidRegs, pendingInvoices]);

  // Registered email lookup for Presenter cross-check
  const registeredByEmail = useMemo(() => {
    const map = new Map<string, WorkshopRegistrationRecord>();
    for (const r of registrations) {
      if (r.status === "paid" || r.status === "comped" || r.status === "pending_invoice") {
        map.set(r.email.toLowerCase(), r);
      }
    }
    return map;
  }, [registrations]);

  const presenterStatusRows = useMemo(() => {
    const targetYear = Number.parseInt(workshop.workshop_year || "2027", 10) || 2027;
    return submissions
      .filter((s) => s.workshopYear === targetYear && s.decision !== "Decline")
      .map((sub) => {
        const emailA = (sub.correspondingEmail || "").toLowerCase();
        const emailB = (sub.submittedByEmail || "").toLowerCase();
        const match = registeredByEmail.get(emailA) || registeredByEmail.get(emailB) || null;
        return { submission: sub, registration: match };
      });
  }, [submissions, registeredByEmail, workshop.workshop_year]);

  const unregisteredAcceptedCount = useMemo(
    () =>
      presenterStatusRows.filter(
        (row) =>
          (row.submission.decision.startsWith("Accept") ||
            row.submission.status === "Reviewed") &&
          (!row.registration || row.registration.status === "pending_invoice")
      ).length,
    [presenterStatusRows]
  );

  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.affiliation.toLowerCase().includes(q) ||
        (r.receiptNumber || "").toLowerCase().includes(q) ||
        (r.invoiceNumber || "").toLowerCase().includes(q)
      );
    });
  }, [registrations, searchQuery, statusFilter, tierFilter]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 mt-4">Verifying Treasurer / Board access...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Operations Access Required</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must sign in with an authenticated{" "}
          <strong className="font-semibold text-foreground">
            Operations Officer (&lsquo;operations&rsquo;)
          </strong>{" "}
          whitelist role to access the Workshop Registration Console.
        </p>
        <Link
          href="/auth"
          className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

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

  const handleConfirmTransfer = async (e: FormEvent) => {
    e.preventDefault();
    if (!transferTarget) return;
    const res = await transferSeat({
      regId: transferTarget.id,
      toEmail: txEmail.trim().toLowerCase(),
      toFirstName: txFirst.trim(),
      toLastName: txLast.trim(),
      toAffiliation: txAffil.trim(),
    });
    setActionBanner({
      ok: res.ok,
      msg: res.ok
        ? `Transferred seat ${transferTarget.receiptNumber || transferTarget.id} to ${txFirst} ${txLast} (${txEmail}).`
        : res.error || "Seat transfer failed.",
    });
    setTransferTarget(null);
    setTxFirst("");
    setTxLast("");
    setTxEmail("");
    setTxAffil("");
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
    }
  };

  const exportTreasurerCsv = () => {
    downloadCsvFile(
      `HEMS_${workshop.workshop_year}_Treasurer_Ledger.csv`,
      [
        "Ref #",
        "Status",
        "Payment Mode",
        "Tier",
        "Pricing Window",
        "First Name",
        "Last Name",
        "Email",
        "Affiliation",
        "Base Fee (USD)",
        "Discount (USD)",
        "Guest Dinner Count",
        "Tax-Deductible Gift (USD)",
        "Total Gross (USD)",
        "Est Fee (USD)",
        "Est Net (USD)",
        "Promo Code",
        "Payment Summary",
        "Paid Date",
      ],
      registrations.map((r) => [
        r.receiptNumber || r.invoiceNumber || r.id,
        r.status,
        r.paymentMode,
        r.tier,
        r.pricingWindow,
        r.firstName,
        r.lastName,
        r.email,
        r.affiliation,
        (r.baseFeeCents / 100).toFixed(2),
        (r.discountCents / 100).toFixed(2),
        r.guestDinnerCount,
        (r.optionalStudentFundDonationCents / 100).toFixed(2),
        (r.totalCents / 100).toFixed(2),
        ((r.stripeFeeEstimatedCents || 0) / 100).toFixed(2),
        ((r.netEstimatedCents ?? r.totalCents) / 100).toFixed(2),
        r.promoCodeUsed || "",
        r.paymentSummary || "",
        r.paidAt || "",
      ])
    );
  };

  const exportCateringCsv = () => {
    downloadCsvFile(
      `HEMS_${workshop.workshop_year}_Catering_Dietary_Roster.csv`,
      [
        "Attendee Name",
        "Badge Affiliation",
        "Email",
        "Wednesday Dinner RSVP",
        "Dietary Restrictions",
        "Allergy / Seating Notes",
        "Guest Ticket Count",
        "Guest Names",
        "Guest Dietary Notes",
      ],
      activePaidRegs.map((r) => [
        `${r.firstName} ${r.lastName}`,
        r.badgeAffiliation,
        r.email,
        r.wednesdayDinnerRsvp,
        (r.dietaryRestrictions || []).join("; "),
        r.allergyNotes || "",
        r.guestDinnerCount,
        r.guestNames || "",
        r.guestDietaryNotes || "",
      ])
    );
  };

  const handleExportParticipantsPdf = () => {
    const ordinal = workshop.workshop_ordinal || "16th";
    if (archiveParticipantRows.length === 0) {
      setActionBanner({
        ok: false,
        msg: "No confirmed (paid or comped) participants match the current export settings.",
      });
      return;
    }
    const filename = exportParticipantsArchivePdf({
      rows: archiveParticipantRows,
      workshopOrdinal: ordinal,
      workshopYear: workshop.workshop_year || "2027",
      exactDates: workshop.exact_dates || workshop.target_window,
      venueName: workshop.hotel_name,
      cityState: workshop.venue_city_state,
      includeEmail: includeEmailInArchiveList,
    });
    setActionBanner({
      ok: true,
      msg: `Exported ${filename} (${archiveParticipantRows.length} confirmed participants) formatted for Proceedings Archive upload.`,
    });
  };

  const handleExportParticipantsCsv = () => {
    const ordinal = workshop.workshop_ordinal || "16th";
    if (archiveParticipantRows.length === 0) {
      setActionBanner({
        ok: false,
        msg: "No confirmed (paid or comped) participants match the current export settings.",
      });
      return;
    }
    const filename = getParticipantsArchiveFilename(ordinal, "csv");
    downloadCsvFile(
      filename,
      includeEmailInArchiveList
        ? ["Last Name", "First Name", "Affiliation", "Email"]
        : ["Last Name", "First Name", "Affiliation", "Country"],
      archiveParticipantRows.map((row) =>
        includeEmailInArchiveList
          ? [row.lastName, row.firstName, row.affiliation, row.email]
          : [row.lastName, row.firstName, row.affiliation, row.country]
      )
    );
    setActionBanner({
      ok: true,
      msg: `Exported ${filename} (${archiveParticipantRows.length} confirmed participants).`,
    });
  };

  const triggerPrintSheet = (mode: "badges" | "checkin") => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 120);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* Screen UI (Hidden when printing Avery badges or check-in roster) */}
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1">
              Workshop Operations • Auto-Advance Status: {schedule.statusBadgeLabel}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
              {workshop.workshop_ordinal} Workshop Registration Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Manage registrations, desk check-ins, seat transfers, presenter compliance, participant archive lists, and hotel meal/badge exports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canManageFinances && (
              <Link
                href="/treasurer"
                className="px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-800 hover:bg-rose-100/80 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CreditCard size={13} /> Treasurer &amp; Stripe Console →
              </Link>
            )}
            <button
              type="button"
              disabled={loading || archiveParticipantRows.length === 0}
              onClick={handleExportParticipantsPdf}
              title={`Download ${getParticipantsArchiveFilename(workshop.workshop_ordinal || "16th", "pdf")} for Proceedings Archive upload`}
              className="px-3.5 py-2 rounded-lg border border-primary/35 bg-sky-50/75 text-primary hover:bg-sky-100/80 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Users size={13} /> Export Participants List ({archiveParticipantRows.length})
            </button>
            <Link
              href="/registration"
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ExternalLink size={13} /> Registration Page
            </Link>
            <button
              type="button"
              disabled={loading || busy}
              onClick={() => void reload()}
              className="px-3.5 py-2 rounded-lg bg-primary text-white hover:bg-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {(errorMsg || actionBanner) && (
          <div
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
              className="text-current opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div
          className={`grid grid-cols-2 ${
            canManageFinances ? "lg:grid-cols-5" : "lg:grid-cols-4"
          } gap-3.5`}
        >
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Paid / Comped
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
              {kpis.paidCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              +{kpis.pendingCount} pending invoice(s)
            </div>
          </div>

          {canManageFinances ? (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Collected / Net Est.
              </div>
              <div className="text-2xl font-bold tabular-nums text-primary mt-1">
                {formatCentsUsd(kpis.grossPaidCents)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                Net ~{formatCentsUsd(kpis.netEstimatedCents)} • Pending {formatCentsUsd(kpis.pendingCents)}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Desk Checked-In
              </div>
              <div className="text-2xl font-bold tabular-nums text-emerald-700 mt-1">
                {activePaidRegs.filter((r) => Boolean(r.checkedInAt)).length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                of {kpis.paidCount} confirmed seats
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Wed. Dinner Headcount
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
              {kpis.totalDinnerHeadcount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              {kpis.dinnerAttendees} attendees + {kpis.guestMeals} guests
            </div>
          </div>

          {canManageFinances && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Student Fund Gifts
              </div>
              <div className="text-2xl font-bold tabular-nums text-secondary mt-1">
                {formatCentsUsd(kpis.studentDonationsCents)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">IRC § 6115 donations</div>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs col-span-2 lg:col-span-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              Unregistered Speakers
            </div>
            <div className="text-2xl font-bold tabular-nums text-amber-700 mt-1">
              {unregisteredAcceptedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Accepted / Reviewed abstracts</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "roster" as const, label: "Registrations & Check-In", icon: CreditCard },
            ...(canManageFinances
              ? [
                  {
                    id: "promos" as const,
                    label: `Promo & Sponsor Codes (${promoCodes.length})`,
                    icon: Tag,
                  },
                ]
              : []),
            { id: "presenters" as const, label: "Abstract Presenter Cross-Check", icon: BadgeCheck },
            { id: "exports" as const, label: "Exports & Avery Name Badges", icon: Printer },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-primary/40"
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ROSTER & INVOICES */}
        {activeTab === "roster" && (
          <div className="space-y-4">
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
                  placeholder="Search name, email, affiliation, or receipt/invoice #..."
                  className="hems-control w-full pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="hems-control"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending_invoice">Pending Invoice</option>
                <option value="comped">Comped / Waiver</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="hems-control"
              >
                <option value="all">All Tiers</option>
                <option value="student">Student</option>
                <option value="professional">Regular</option>
                <option value="sponsor">Corporate Sponsor</option>
              </select>
            </div>

            <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Ref #</th>
                      <th className="px-4 py-3">Registrant</th>
                      <th className="px-4 py-3">Tier &amp; Meals</th>
                      <th className="px-4 py-3">Total / Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegistrations.map((reg) => {
                      const refNum = reg.receiptNumber || reg.invoiceNumber || reg.id;
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            <div>{refNum}</div>
                            {reg.checkedInAt && (
                              <span className="text-[10px] text-emerald-700 font-sans font-bold">
                                ✓ Checked In
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 text-sm">
                              {reg.firstName} {reg.lastName}
                            </div>
                            <div className="text-slate-600">{reg.affiliation}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {reg.email}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize font-semibold text-slate-800">
                              {reg.tier}
                            </span>{" "}
                            <span className="text-slate-400">({reg.pricingWindow === "early_bird" ? "Early" : "Reg"})</span>
                            <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                              <Utensils size={11} className="text-slate-400" />
                              Dinner: {reg.wednesdayDinnerRsvp}
                              {reg.guestDinnerCount > 0 ? ` (+${reg.guestDinnerCount} guest)` : ""}
                            </div>
                            {reg.allergyNotes && (
                              <div className="text-[10.5px] text-amber-700 font-medium">
                                Allergy: {reg.allergyNotes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            <div className="font-bold text-slate-900">
                              {formatCentsUsd(reg.totalCents)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {reg.paymentSummary || reg.paymentMode}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                reg.status === "paid" || reg.status === "comped"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : reg.status === "pending_invoice"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {reg.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                            {canManageFinances && reg.status === "pending_invoice" && (
                              <button
                                type="button"
                                onClick={() => setMarkPaidTarget(reg)}
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-[11px] cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                            {(reg.status === "paid" || reg.status === "comped") && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void toggleCheckIn(reg.id)}
                                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:border-primary/50 text-slate-700 font-semibold text-[11px] cursor-pointer"
                                >
                                  {reg.checkedInAt ? "Undo Check-In" : "Check In"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferTarget(reg);
                                    setTxAffil(reg.affiliation);
                                  }}
                                  title="Transfer seat to colleague"
                                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:border-primary/50 text-slate-700 font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <ArrowRightLeft size={11} /> Transfer
                                </button>
                                {reg.sheetSyncStatus !== "synced" && (
                                  <button
                                    type="button"
                                    onClick={() => void resyncSheet(reg.id)}
                                    className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold cursor-pointer"
                                  >
                                    Sync Sheet
                                  </button>
                                )}
                              </>
                            )}
                            <Link
                              href={`/registration/receipt?regId=${encodeURIComponent(
                                reg.id
                              )}&token=${encodeURIComponent(reg.receiptToken)}`}
                              className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:text-primary text-slate-700 font-semibold text-[11px] inline-block"
                            >
                              Receipt
                            </Link>
                            {canManageFinances &&
                              reg.status !== "refunded" &&
                              reg.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void refundOrCancel(
                                      reg.id,
                                      reg.status === "pending_invoice" ? "cancelled" : "refunded"
                                    )
                                  }
                                  className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-[11px] font-semibold cursor-pointer"
                                >
                                  {reg.status === "pending_invoice" ? "Cancel" : "Refund"}
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

        {/* TAB 2: PROMO & SPONSOR WAIVER CODES */}
        {activeTab === "promos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={(e) => void handleCreatePromo(e)}
              className="lg:col-span-4 bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-4"
            >
              <h2 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
                <PlusCircle size={17} className="text-primary" /> Create Promo / Sponsor Code
              </h2>
              <div>
                <label className="hems-label">Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  placeholder="SPONSOR2027-X"
                  className="hems-control w-full uppercase font-mono"
                />
              </div>
              <div>
                <label className="hems-label">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  value={newPromoLabel}
                  onChange={(e) => setNewPromoLabel(e.target.value)}
                  placeholder="Sponsor Included Registration"
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
                    {newPromoType === "percent" ? "% Off (1-100)" : "$ Off"}
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
                Save Promo Code
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Purpose &amp; Discount</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promoCodes.map((p) => (
                    <tr key={p.code}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {p.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{p.label}</div>
                        <div className="text-[11px] text-slate-500">
                          {p.discountType === "percent"
                            ? `${p.discountValue}% off`
                            : `${formatCentsUsd(p.discountValue)} off`}{" "}
                          • {p.allowedTiers.join(", ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">
                        {p.usesCount} / {p.maxUses}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ABSTRACT PRESENTER CROSS-CHECK */}
        {activeTab === "presenters" && (
          <div className="bg-white border border-slate-200/95 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  Abstract Presenters vs. Paid Registration Compliance
                </h2>
                <p className="text-xs text-slate-600">
                  Cross-references {workshop.workshop_year} submitted abstracts against registered attendee emails before finalizing the program.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Abstract</th>
                    <th className="px-4 py-3">Presenter</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3">Registration Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {presenterStatusRows.map(({ submission, registration }) => (
                    <tr key={submission.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{submission.title}</div>
                        <div className="text-[11px] text-slate-500">{submission.presentationFormat}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{submission.presentingAuthor}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {submission.correspondingEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{submission.decision}</td>
                      <td className="px-4 py-3">
                        {registration &&
                        (registration.status === "paid" || registration.status === "comped") ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 size={13} /> Registered ({registration.receiptNumber || registration.id})
                          </span>
                        ) : registration ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertTriangle size={13} /> Pending Invoice ({registration.invoiceNumber})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                            <AlertTriangle size={13} /> Not Yet Registered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EXPORTS & NAME BADGES */}
        {activeTab === "exports" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-white border border-primary/25 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Users size={15} /> Proceedings Archive Publication
                </div>
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  {getParticipantsArchiveFilename(workshop.workshop_ordinal || "16th", "pdf")}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-900">
                  Archive-Ready Participant List ({archiveParticipantRows.length} Confirmed)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                  Generates a clean US Letter PDF sorted alphabetically by last name with automatic text wrapping and deduplicated emails, matching the{" "}
                  <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                    Administrative/{getParticipantsArchiveFilename(workshop.workshop_ordinal || "16th", "pdf")}
                  </code>{" "}
                  format expected by the HEMS Workshop Archive Manager for post-conference upload.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-700 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmailInArchiveList}
                    onChange={(e) => setIncludeEmailInArchiveList(e.target.checked)}
                  />
                  <span>Include attendee email column (standard 13th–15th archive layout)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeSamplesInArchiveList}
                    onChange={(e) => setExcludeSamplesOverride(e.target.checked)}
                  />
                  <span>Exclude sample / sandbox test registrations</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  disabled={archiveParticipantRows.length === 0}
                  onClick={handleExportParticipantsPdf}
                  className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} /> Download{" "}
                  {getParticipantsArchiveFilename(workshop.workshop_ordinal || "16th", "pdf")}
                </button>
                <button
                  type="button"
                  disabled={archiveParticipantRows.length === 0}
                  onClick={handleExportParticipantsCsv}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-primary/50 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} /> Download Participants CSV
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <FileSpreadsheet size={15} /> Treasurer &amp; Hotel Spreadsheets
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900">
                Accounting &amp; Catering CSV Exports
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Download UTF-8 Excel-ready CSV ledgers separated for Treasurer 501(c)(3) accounting reconciliation and Hotel Catering headcounts.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {canManageFinances && (
                  <button
                    type="button"
                    onClick={exportTreasurerCsv}
                    className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> Treasurer Financial CSV
                  </button>
                )}
                <button
                  type="button"
                  onClick={exportCateringCsv}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-primary/50 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} /> Catering &amp; Dietary CSV
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                <Printer size={15} /> On-Site Printables
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900">
                Avery 5395 Name Badges &amp; Check-In Roster
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Print calibrated 4&quot; × 3&quot; name badge cards for paid/comped attendees or an alphabetical registration desk check-in sheet.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => triggerPrintSheet("badges")}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={14} /> Print 4&quot;×3&quot; Name Badges
                </button>
                <button
                  type="button"
                  onClick={() => triggerPrintSheet("checkin")}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-primary/50 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={14} /> Print Check-In Desk Roster
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINT-ONLY AVERY 5395 BADGES / CHECK-IN ROSTER */}
      {printMode === "badges" && (
        <div className="hidden print:grid grid-cols-2 gap-4">
          {activePaidRegs.map((reg) => (
            <div
              key={reg.id}
              className="border border-slate-300 rounded-lg p-5 h-[2.95in] flex flex-col justify-between break-inside-avoid"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-serif font-bold text-primary text-xs">
                  {workshop.workshop_ordinal} HEMS Workshop ({workshop.workshop_year})
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-slate-300 rounded">
                  {reg.tier}
                </span>
              </div>
              <div className="text-center space-y-1 my-auto">
                <div className="font-serif text-2xl font-bold text-slate-900">
                  {reg.badgeName}
                </div>
                {reg.pronouns && (
                  <div className="text-xs text-slate-500">({reg.pronouns})</div>
                )}
                <div className="text-sm font-medium text-slate-700">
                  {reg.badgeAffiliation}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-100 pt-1.5 tabular-nums">
                <span>{reg.receiptNumber || reg.id}</span>
                <span>Dinner: {reg.wednesdayDinnerRsvp}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {printMode === "checkin" && (
        <div className="hidden print:block space-y-4">
          <h2 className="font-serif text-xl font-bold">
            {workshop.workshop_ordinal} HEMS Workshop — Registration Desk Check-In Roster
          </h2>
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-2">Check</th>
                <th className="border border-slate-300 p-2">Name</th>
                <th className="border border-slate-300 p-2">Affiliation</th>
                <th className="border border-slate-300 p-2">Tier</th>
                <th className="border border-slate-300 p-2">Dinner / Guests</th>
                <th className="border border-slate-300 p-2">Ref #</th>
              </tr>
            </thead>
            <tbody>
              {[...activePaidRegs]
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((r) => (
                  <tr key={r.id}>
                    <td className="border border-slate-300 p-2 text-center">☐</td>
                    <td className="border border-slate-300 p-2 font-semibold">
                      {r.lastName}, {r.firstName}
                    </td>
                    <td className="border border-slate-300 p-2">{r.affiliation}</td>
                    <td className="border border-slate-300 p-2 capitalize">{r.tier}</td>
                    <td className="border border-slate-300 p-2">
                      {r.wednesdayDinnerRsvp}
                      {r.guestDinnerCount > 0 ? ` (+${r.guestDinnerCount} guest)` : ""}
                    </td>
                    <td className="border border-slate-300 p-2 font-mono">
                      {r.receiptNumber || r.id}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Mark Pending Invoice Paid */}
      {markPaidTarget && (
        <div className="print:hidden fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
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
              ({formatCentsUsd(markPaidTarget.totalCents)}) as PAID. This provisions the attendee role, tags the mailing list, and sends the official paid receipt.
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

      {/* MODAL: Transfer Seat to Colleague */}
      {transferTarget && (
        <div className="print:hidden fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleConfirmTransfer(e)}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Transfer Registration Seat
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfer <strong>{transferTarget.receiptNumber || transferTarget.id}</strong> from{" "}
              <strong>{transferTarget.email}</strong> to a colleague with zero processing fees.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="hems-label">New First Name *</label>
                <input
                  type="text"
                  required
                  value={txFirst}
                  onChange={(e) => setTxFirst(e.target.value)}
                  className="hems-control w-full"
                />
              </div>
              <div>
                <label className="hems-label">New Last Name *</label>
                <input
                  type="text"
                  required
                  value={txLast}
                  onChange={(e) => setTxLast(e.target.value)}
                  className="hems-control w-full"
                />
              </div>
            </div>
            <div>
              <label className="hems-label">New Attendee Email *</label>
              <input
                type="email"
                required
                value={txEmail}
                onChange={(e) => setTxEmail(e.target.value)}
                className="hems-control w-full"
              />
            </div>
            <div>
              <label className="hems-label">Affiliation</label>
              <input
                type="text"
                value={txAffil}
                onChange={(e) => setTxAffil(e.target.value)}
                className="hems-control w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-sky-800 cursor-pointer"
              >
                Transfer Seat
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
