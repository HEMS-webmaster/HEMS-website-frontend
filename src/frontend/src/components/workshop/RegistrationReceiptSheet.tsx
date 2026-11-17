"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { auth, hasFirebaseKeys } from "@/utils/firebase";
import {
  calculateRegistrationTotals,
  WorkshopRegistrationRecord,
} from "@/types/registration";
import { formatCentsUsd } from "@/utils/upcomingWorkshop";

const REG_STORAGE_KEY = "hems_workshop_registrations_v1";

function findLocalRegistration(
  regId: string,
  token: string
): WorkshopRegistrationRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REG_STORAGE_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as WorkshopRegistrationRecord[];
    const match = list.find((r) => r.id === regId);
    if (!match) return null;
    if (token && match.receiptToken && match.receiptToken !== token) {
      return null;
    }
    return match;
  } catch {
    return null;
  }
}

export default function RegistrationReceiptSheet() {
  const searchParams = useSearchParams();
  const regId = (searchParams.get("regId") || "").trim();
  const token = (searchParams.get("token") || "").trim();
  const sessionId = (searchParams.get("session_id") || "").trim();

  const [record, setRecord] = useState<WorkshopRegistrationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const societyEin = (process.env.NEXT_PUBLIC_HEMS_SOCIETY_EIN || "").trim();

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadReceipt = async (attempt: number) => {
      if (!regId) {
        if (active) {
          setErrorMsg("Missing registration ID in receipt link.");
          setLoading(false);
        }
        return;
      }

      if (!hasFirebaseKeys) {
        const localMatch = findLocalRegistration(regId, token);
        if (active) {
          if (localMatch) {
            setRecord(localMatch);
            setErrorMsg("");
          } else {
            setErrorMsg(
              "Receipt not found in browser storage. Open this receipt from the browser session used to submit the sandbox registration."
            );
          }
          setLoading(false);
        }
        return;
      }

      try {
        let bearer = "";
        if (auth?.currentUser) {
          try {
            bearer = await auth.currentUser.getIdToken();
          } catch {
            bearer = "";
          }
        }
        const qs = new URLSearchParams({ regId });
        if (token) qs.set("token", token);
        if (sessionId) qs.set("session_id", sessionId);

        const res = await fetch(`/api/registration/receipt?${qs.toString()}`, {
          headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
          cache: "no-store",
        });
        const data = (await res.json()) as {
          ok?: boolean;
          registration?: WorkshopRegistrationRecord;
          error?: string;
        };

        if (!active) return;

        if (!res.ok || !data.ok || !data.registration) {
          setErrorMsg(data.error || "Unable to load official registration receipt.");
          setLoading(false);
          return;
        }

        setRecord(data.registration);
        setLoading(false);

        if (
          data.registration.status === "checkout_started" &&
          sessionId &&
          attempt < 4
        ) {
          setPollCount(attempt + 1);
          timer = setTimeout(() => {
            void loadReceipt(attempt + 1);
          }, 1800);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to retrieve receipt."
          );
          setLoading(false);
        }
      }
    };

    void loadReceipt(0);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [regId, token, sessionId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-600">Loading official registration record...</p>
      </div>
    );
  }

  if (errorMsg || !record) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-2xs">
        <AlertTriangle className="text-amber-600 mx-auto" size={36} />
        <h1 className="font-serif text-2xl font-semibold text-slate-900">
          Receipt Record Unavailable
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">{errorMsg}</p>
        <Link
          href="/registration"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-sky-800 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Registration
        </Link>
      </div>
    );
  }

  const isPaid = record.status === "paid" || record.status === "comped";
  const isPendingInvoice = record.status === "pending_invoice";
  const isCheckoutPending = record.status === "checkout_started";

  const totals = calculateRegistrationTotals({
    baseFeeCents: record.baseFeeCents,
    promo:
      record.discountCents > 0
        ? { discountType: "fixed_cents", discountValue: record.discountCents }
        : null,
    guestDinnerCount: record.guestDinnerCount,
    guestDinnerUnitCents: record.guestDinnerUnitCents,
    optionalStudentFundDonationCents: record.optionalStudentFundDonationCents,
  });

  const tierTitle =
    record.tier === "student"
      ? `Graduate / Student Registration (${record.pricingWindow === "early_bird" ? "Early" : "Standard"})`
      : record.tier === "sponsor"
      ? "Corporate Sponsor & Exhibitor Package (Includes 1 Registration)"
      : `Regular Professional Registration (${record.pricingWindow === "early_bird" ? "Early" : "Standard"})`;

  const docLabel = isPaid
    ? "Official Conference Registration Receipt"
    : isPendingInvoice
    ? "Official Workshop Registration Invoice"
    : "Payment Confirmation Pending";

  const docRefNumber =
    record.receiptNumber || record.invoiceNumber || record.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Screen-only Action Toolbar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/95 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/registration"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 transition-colors"
          >
            <ArrowLeft size={14} /> Registration Page
          </Link>
          {record.sandboxSimulation && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
              <Sparkles size={12} /> Sandbox Test Record
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-sky-800 transition-colors shadow-xs cursor-pointer"
        >
          <Printer size={15} /> Print / Save Official PDF
        </button>
      </div>

      {/* Confirmation Banner */}
      {isPaid && (
        <div className="print:hidden bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-950 text-xs sm:text-sm">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              Registration Confirmed ({docRefNumber})
            </p>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              Your {record.workshopYear} Attendee access has been provisioned on{" "}
              <span className="font-mono font-medium">{record.email}</span> (allowing abstract submission once signed in) and tagged in{" "}
              <strong>{record.workshopYear} Attendees</strong>.
            </p>
          </div>
        </div>
      )}

      {isCheckoutPending && (
        <div className="print:hidden bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3 text-sky-950 text-xs sm:text-sm">
          <Clock size={18} className="text-sky-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              Confirming payment settlement{pollCount > 0 ? "..." : "."}
            </p>
            <p className="text-sky-800 mt-0.5 leading-relaxed">
              Card checkouts finalize in seconds; US ACH bank transfers take 2–4 business days before receipt issuance. Refresh this bookmark anytime to view your updated receipt.
            </p>
          </div>
        </div>
      )}

      {/* Printable 1-Page Letter Official Document */}
      <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm print:border-0 print:shadow-none print:p-0 text-slate-900">
        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900/15">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1">
              <ShieldCheck size={13} /> IRS 501(c)(3) Scientific Public Charity
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
              Harsh-Environment Mass Spectrometry Society, Inc.
            </h1>
            <p className="text-xs text-slate-600 mt-1 tabular-nums">
              {societyEin ? `Federal EIN: ${societyEin} • ` : ""}
              Florida Non-Profit Corporation (Est. 2008) • https://hems-workshop.org
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {docLabel}
            </div>
            <div className="text-lg font-bold tabular-nums text-slate-900 mt-0.5">
              {docRefNumber}
            </div>
            <span
              className={`inline-block mt-1 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isPaid
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : isPendingInvoice
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {isPaid
                ? "PAID IN FULL"
                : isPendingInvoice
                ? "PAYMENT DUE UPON RECEIPT"
                : record.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Registrant &amp; Travel Reimbursement Payee
            </div>
            <div className="font-semibold text-slate-900 text-base">
              {record.firstName} {record.lastName}
            </div>
            <div className="text-slate-700">{record.affiliation}</div>
            <div className="text-slate-600">{record.country}</div>
            <div className="text-slate-600 font-mono text-xs">{record.email}</div>
            <div className="text-xs text-slate-500 pt-1">
              Name Badge: <strong className="text-slate-800">{record.badgeName}</strong> ({record.badgeAffiliation})
            </div>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Symposium Event Details
            </div>
            <div className="font-semibold text-slate-900">
              {record.workshopOrdinal} HEMS Workshop ({record.workshopYear})
            </div>
            <div className="text-slate-600">
              Issue Date:{" "}
              <span className="tabular-nums font-medium text-slate-800">
                {new Date(record.paidAt || record.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="text-slate-600">
              Payment Method:{" "}
              <span className="font-medium text-slate-800">
                {record.paymentSummary || record.paymentMode.toUpperCase()}
              </span>
            </div>
            <div className="text-slate-600">
              Wednesday Dinner RSVP:{" "}
              <span className="font-medium text-slate-800 capitalize">
                {record.wednesdayDinnerRsvp}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Financial Table */}
        <div className="py-6">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2.5 font-semibold">Item Description</th>
                <th className="pb-2.5 font-semibold text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 pr-4">
                  <div className="font-medium text-slate-900">{tierTitle}</div>
                  <div className="text-xs text-slate-500">
                    Includes all single-track technical sessions, poster receptions, proceedings access &amp; Wednesday Workshop Dinner (goods &amp; services provided).
                  </div>
                </td>
                <td className="py-3 text-right tabular-nums font-medium text-slate-900">
                  {formatCentsUsd(totals.baseFeeCents)}
                </td>
              </tr>

              {totals.discountCents > 0 && (
                <tr>
                  <td className="py-3 pr-4 text-emerald-700">
                    Promo / Institutional Waiver ({record.promoCodeUsed || "APPLIED"})
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-emerald-700">
                    -{formatCentsUsd(totals.discountCents)}
                  </td>
                </tr>
              )}

              {record.guestDinnerCount > 0 && (
                <tr>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">
                      Guest Workshop Dinner Ticket × {record.guestDinnerCount}
                    </div>
                    {record.guestNames && (
                      <div className="text-xs text-slate-500">
                        Guest(s): {record.guestNames}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-slate-900">
                    {formatCentsUsd(totals.guestDinnerSubtotalCents)}
                  </td>
                </tr>
              )}

              {totals.optionalStudentFundDonationCents > 0 && (
                <tr>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">
                      Voluntary Contribution — HEMS Student Travel Award Fund
                    </div>
                    <div className="text-xs text-slate-500">
                      Charitable contribution with no goods or services provided in return.
                    </div>
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-slate-900">
                    {formatCentsUsd(totals.optionalStudentFundDonationCents)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900/20">
                <td className="pt-4 font-semibold text-slate-900">
                  {isPaid ? "Total Amount Paid" : "Total Invoice Amount Due"}
                </td>
                <td className="pt-4 text-right text-lg font-bold tabular-nums text-slate-900">
                  {formatCentsUsd(totals.totalCents)} USD
                </td>
              </tr>
              <tr>
                <td className="pt-1 text-xs text-slate-500">Remaining Balance Due</td>
                <td className="pt-1 text-right text-xs font-bold tabular-nums text-slate-800">
                  {isPaid ? "$0.00 USD" : `${formatCentsUsd(totals.totalCents)} USD`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Institutional Remittance Notice (for Pending Invoice) */}
        {isPendingInvoice && (
          <div className="mb-6 bg-amber-50/75 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-[11px]">
              Institutional Payment Instructions (Check / ACH / Purchase Order)
            </div>
            <p className="leading-relaxed">
              Please reference Invoice <strong>{docRefNumber}</strong> and attendee{" "}
              <strong>{record.firstName} {record.lastName}</strong> on all checks, wire memos, and institutional POs. For W-9 copies or ACH routing details, contact Treasurer &amp; Sponsorship Coordinator Tim Short at{" "}
              <a href="mailto:tim.short@hems-workshop.org" className="underline font-medium">
                tim.short@hems-workshop.org
              </a>
              . Portal attendee privileges and mailing list cohort tags activate automatically upon payment confirmation.
            </p>
          </div>
        )}

        {/* IRS IRC 170 / 6115 Quid-Pro-Quo Tax Compliance Footer */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-[11.5px] text-slate-600 leading-relaxed space-y-1">
          <div className="font-semibold text-slate-800 uppercase tracking-wider text-[10.5px]">
            Tax &amp; Government Travel Audit Notice (IRS IRC §§ 170 &amp; 6115)
          </div>
          <p>
            Conference registration and guest meal fees ({formatCentsUsd(totals.nonDeductibleQuidProQuoCents)} USD) represent an exchange for symposium goods and services (technical program, proceedings access, and meals) and are <strong>not</strong> tax-deductible charitable contributions—supporting standard federal, state, and university travel reimbursement audits.
            {totals.taxDeductibleDonationCents > 0
              ? ` Your voluntary Student Travel Award Fund contribution of ${formatCentsUsd(totals.taxDeductibleDonationCents)} USD is a tax-deductible charitable contribution for which no goods or services were provided in exchange.`
              : ""}
          </p>
        </div>
      </article>
    </div>
  );
}
