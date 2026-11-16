"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Utensils,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";
import { useWorkshopRegistrations } from "@/hooks/useWorkshopRegistrations";
import {
  calculateRegistrationTotals,
  DIETARY_OPTIONS,
  RegistrationTier,
  StudentDegreeProgram,
  WednesdayDinnerRsvp,
  WorkshopPromoCode,
} from "@/types/registration";
import {
  evaluateRegistrationSchedule,
  formatCentsUsd,
  UpcomingWorkshopConfig,
} from "@/utils/upcomingWorkshop";
import {
  hasAdminRole,
  hasBoardRole,
  hasOperationsRole,
  hasTreasurerRole,
} from "@/utils/telemetryClient";

type BoardSimulatedPhase =
  | "live"
  | "before_opening"
  | "early_bird"
  | "regular"
  | "concluded_closed";

function buildSimulatedWorkshopConfig(
  base: UpcomingWorkshopConfig,
  sim: BoardSimulatedPhase
): UpcomingWorkshopConfig {
  if (sim === "live") return base;
  if (sim === "before_opening") {
    return {
      ...base,
      registration_mode: "auto_schedule",
      reg_opening_date: "March 1, 2099",
      reg_early_bird_closes: "July 15, 2099",
      conference_end_date: "September 17, 2099",
    };
  }
  if (sim === "early_bird") {
    return {
      ...base,
      registration_mode: "auto_schedule",
      reg_opening_date: "January 1, 2020",
      reg_early_bird_closes: "July 15, 2099",
      conference_end_date: "September 17, 2099",
    };
  }
  if (sim === "regular") {
    return {
      ...base,
      registration_mode: "auto_schedule",
      reg_opening_date: "January 1, 2020",
      reg_early_bird_closes: "January 2, 2020",
      conference_end_date: "September 17, 2099",
    };
  }
  return {
    ...base,
    registration_mode: "auto_schedule",
    reg_opening_date: "January 1, 2020",
    reg_early_bird_closes: "February 1, 2020",
    conference_end_date: "March 1, 2020",
  };
}

export default function RegistrationClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { workshop, isLiveSynced, source } = useUpcomingWorkshop();
  const {
    busy,
    validatePromoCode,
    submitRegistration,
  } = useWorkshopRegistrations(false);

  const hasOperations = Boolean(user && hasOperationsRole(user.roles));
  const hasTreasurer = Boolean(user && hasTreasurerRole(user.roles));
  const isBoardOrAdmin = Boolean(
    user &&
      (hasBoardRole(user.roles) ||
        hasAdminRole(user.roles) ||
        hasOperations ||
        hasTreasurer)
  );

  // Board / Admin Auto-Advance Schedule Simulator state
  const [simulatedPhase, setSimulatedPhase] = useState<BoardSimulatedPhase>("live");

  const effectiveWorkshop = useMemo(
    () =>
      isBoardOrAdmin
        ? buildSimulatedWorkshopConfig(workshop, simulatedPhase)
        : workshop,
    [isBoardOrAdmin, simulatedPhase, workshop]
  );

  const schedule = useMemo(
    () => evaluateRegistrationSchedule(effectiveWorkshop),
    [effectiveWorkshop]
  );

  const parsedYear = Number.parseInt(workshop.workshop_year || "2027", 10) || 2027;

  // Checkout Form State
  const [tier, setTier] = useState<RegistrationTier>("professional");
  const [paymentMode, setPaymentMode] = useState<"stripe" | "invoice">("stripe");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [country, setCountry] = useState("United States");

  const [badgeTouched, setBadgeTouched] = useState(false);
  const [badgeName, setBadgeName] = useState("");
  const [badgeAffiliation, setBadgeAffiliation] = useState("");
  const [pronouns, setPronouns] = useState("");

  const [studentDegreeProgram, setStudentDegreeProgram] =
    useState<StudentDegreeProgram>("Ph.D.");
  const [studentAdvisorName, setStudentAdvisorName] = useState("");
  const [studentAdvisorEmail, setStudentAdvisorEmail] = useState("");

  const [wednesdayDinnerRsvp, setWednesdayDinnerRsvp] =
    useState<WednesdayDinnerRsvp>("attending");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(["None"]);
  const [allergyNotes, setAllergyNotes] = useState("");

  const [guestDinnerCount, setGuestDinnerCount] = useState<number>(0);
  const [guestNames, setGuestNames] = useState("");
  const [guestDietaryNotes, setGuestDietaryNotes] = useState("");

  const [donationChoice, setDonationChoice] = useState<number>(0);
  const [customDonationDollars, setCustomDonationDollars] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<WorkshopPromoCode | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const [mailingListOptIn, setMailingListOptIn] = useState(true);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [formError, setFormError] = useState("");

  // Pre-fill signed-in user identity once when empty
  useEffect(() => {
    if (!user) return;
    if (!email && user.email) {
      setEmail(user.email);
    }
    if (!firstName && !lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      } else if (parts.length === 1) {
        setFirstName(parts[0]);
      }
    }
  }, [user, email, firstName, lastName]);

  // Auto-sync Name Badge fields until customized by user
  useEffect(() => {
    if (badgeTouched) return;
    const composed = `${firstName.trim()} ${lastName.trim()}`.trim();
    setBadgeName(composed);
    setBadgeAffiliation(affiliation.trim());
  }, [firstName, lastName, affiliation, badgeTouched]);

  // Default Corporate Sponsor to Invoice/ACH option if desired (keep user-selectable)
  const handleSelectTier = (nextTier: RegistrationTier) => {
    setTier(nextTier);
    if (appliedPromo && !appliedPromo.allowedTiers.includes(nextTier)) {
      setAppliedPromo(null);
      setPromoFeedback({
        ok: false,
        msg: `Promo "${appliedPromo.code}" does not apply to ${nextTier} tier and was cleared.`,
      });
    }
  };

  const toggleDietary = (opt: string) => {
    setDietaryRestrictions((prev) => {
      if (opt === "None") {
        return ["None"];
      }
      const withoutNone = prev.filter((item) => item !== "None");
      if (withoutNone.includes(opt)) {
        const next = withoutNone.filter((item) => item !== opt);
        return next.length > 0 ? next : ["None"];
      }
      return [...withoutNone, opt];
    });
  };

  const activeTierBaseCents = useMemo(() => {
    if (tier === "student") return schedule.activeFees.studentCents;
    if (tier === "sponsor") return schedule.activeFees.sponsorCents;
    return schedule.activeFees.professionalCents;
  }, [tier, schedule.activeFees]);

  const optionalStudentFundDonationCents = useMemo(() => {
    if (!workshop.reg_enable_student_fund_donation) return 0;
    if (donationChoice === -1) {
      const parsed = Number.parseFloat(customDonationDollars || "0");
      if (!Number.isFinite(parsed) || parsed <= 0) return 0;
      return Math.min(250_000, Math.round(parsed * 100));
    }
    return Math.max(0, donationChoice);
  }, [workshop.reg_enable_student_fund_donation, donationChoice, customDonationDollars]);

  const totals = useMemo(
    () =>
      calculateRegistrationTotals({
        baseFeeCents: activeTierBaseCents,
        promo: appliedPromo,
        guestDinnerCount,
        guestDinnerUnitCents: schedule.activeFees.guestDinnerCents,
        optionalStudentFundDonationCents,
      }),
    [
      activeTierBaseCents,
      appliedPromo,
      guestDinnerCount,
      schedule.activeFees.guestDinnerCents,
      optionalStudentFundDonationCents,
    ]
  );

  const handleApplyPromo = async () => {
    setPromoFeedback(null);
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) {
      setAppliedPromo(null);
      return;
    }
    setPromoChecking(true);
    try {
      const res = await validatePromoCode(trimmed, tier, parsedYear);
      if (res.valid && res.promo) {
        setAppliedPromo(res.promo);
        setPromoFeedback({ ok: true, msg: res.message });
      } else {
        setAppliedPromo(null);
        setPromoFeedback({ ok: false, msg: res.message });
      }
    } finally {
      setPromoChecking(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!firstName.trim() || !lastName.trim()) {
      setFormError("Please enter your first and last name.");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setFormError("Please enter a valid institutional or work email address.");
      return;
    }
    if (!affiliation.trim()) {
      setFormError("Please enter your university, agency, or company affiliation.");
      return;
    }
    if (!badgeName.trim()) {
      setFormError("Please confirm the display name for your workshop badge.");
      return;
    }
    if (tier === "student" && (!studentAdvisorName.trim() || !studentAdvisorEmail.trim())) {
      setFormError(
        "Student registrations require a Research Advisor / Supervisor name and email for verification."
      );
      return;
    }
    if (guestDinnerCount > 0 && !guestNames.trim()) {
      setFormError("Please enter the name(s) of your Workshop Dinner guest(s).");
      return;
    }
    if (!policyAccepted) {
      setFormError(
        "Please acknowledge the registration cancellation & substitution policy before continuing."
      );
      return;
    }

    const result = await submitRegistration(
      {
        workshopYear: parsedYear,
        workshopOrdinal: workshop.workshop_ordinal,
        tier,
        pricingWindow: schedule.activeFees.pricingWindow,
        paymentMode: totals.totalCents === 0 ? "stripe" : paymentMode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        affiliation: affiliation.trim(),
        country: country.trim() || "United States",
        badgeName: badgeName.trim(),
        badgeAffiliation: badgeAffiliation.trim() || affiliation.trim(),
        pronouns: pronouns.trim() || undefined,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        guestDinnerCount,
        guestNames: guestNames.trim() || undefined,
        guestDietaryNotes: guestDietaryNotes.trim() || undefined,
        optionalStudentFundDonationCents,
        studentDegreeProgram: tier === "student" ? studentDegreeProgram : undefined,
        studentAdvisorName: tier === "student" ? studentAdvisorName.trim() : undefined,
        studentAdvisorEmail: tier === "student" ? studentAdvisorEmail.trim() : undefined,
        wednesdayDinnerRsvp,
        dietaryRestrictions,
        allergyNotes: allergyNotes.trim() || undefined,
        mailingListOptIn,
        sandboxOverride: isBoardOrAdmin && simulatedPhase !== "live",
      },
      effectiveWorkshop
    );

    if (!result.ok) {
      setFormError(result.error || "Unable to process registration. Please try again.");
      return;
    }

    if (result.mode === "stripe_redirect" && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    if (result.receiptUrl) {
      router.push(result.receiptUrl);
    }
  };

  return (
    <>
      {/* Page Header */}
      <header className="mb-7 sm:mb-10 border-b border-slate-200 pb-6 sm:pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium leading-snug mb-4 shadow-2xs tabular-nums">
            <Calendar size={14} className="text-primary shrink-0" />
            <span>
              Symposium Registration • {workshop.workshop_ordinal} HEMS Workshop ({schedule.statusBadgeLabel})
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            Workshop Registration
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
            {workshop.workshop_ordinal} Harsh-Environment Mass Spectrometry Workshop ({workshop.target_window}) —{" "}
            {workshop.venue_confirmed ? `${workshop.hotel_name}, ${workshop.venue_city_state}` : workshop.venue_city_state}.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-center p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-center shrink-0">
          <img
            src="/hemslogo.jpg"
            alt="Harsh-Environment Mass Spectrometry Society Emblem"
            width={3756}
            height={2594}
            decoding="async"
            className="w-24 sm:w-28 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-0.5 block"
          />
        </div>
      </header>

      {/* Board & Admin Auto-Advance Simulator Bar (Hidden from public users) */}
      {isBoardOrAdmin && (
        <aside className="mb-8 bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-300">
              <Sparkles size={14} className="shrink-0" />
              <span>Board Sandbox • Auto-Advance Lifecycle Preview</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span>
                Schedule Sync:{" "}
                <strong>
                  {source === "preview_draft"
                    ? "Draft Preview"
                    : isLiveSynced
                    ? "Admin Cloud Live"
                    : "Static Snapshot"}
                </strong>
              </span>
              {hasOperations && (
                <Link
                  href="/operations/registrations"
                  className="text-sky-300 hover:text-white underline font-semibold"
                >
                  Operations Console →
                </Link>
              )}
              {hasTreasurer && (
                <Link
                  href="/treasurer"
                  className="text-rose-300 hover:text-white underline font-semibold"
                >
                  Treasurer &amp; Stripe →
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "live", label: "Live Sheet Date" },
                { id: "before_opening", label: "Pre-Opening (Hidden)" },
                { id: "early_bird", label: "Early-Bird Open" },
                { id: "regular", label: "Regular Open" },
                { id: "concluded_closed", label: "Post-Conference (Closed)" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSimulatedPhase(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  simulatedPhase === btn.id
                    ? "bg-sky-500 text-slate-950 border-sky-400"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {simulatedPhase !== "live" && (
            <p className="text-[11px] text-amber-300 leading-relaxed">
              Simulating <strong>{simulatedPhase.replace("_", " ")}</strong> locally for officer testing. Public visitors continue seeing the live schedule state ({evaluateRegistrationSchedule(workshop).statusBadgeLabel}). Sample test promo codes: <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded">INFICON2027</code>, <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded">HOST2027</code>, <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded">AWARD2027</code>.
            </p>
          )}
        </aside>
      )}

      {/* =====================================================================
          GATE STATE: Registration Closed / Before Opening / Post-Conference
          ===================================================================== */}
      {!schedule.isOpen ? (
        <div className="space-y-8">
          <section className="max-w-3xl bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary tabular-nums">
              {schedule.phase === "concluded_closed" || schedule.phase === "force_closed" ? (
                <Lock size={14} className="shrink-0" />
              ) : (
                <Clock size={14} className="shrink-0" />
              )}
              <span>
                {schedule.phase === "before_opening"
                  ? `Registration Opens ${schedule.openingDateLabel}`
                  : schedule.phase === "concluded_closed"
                  ? "Registration Closed — Workshop Concluded"
                  : schedule.phase === "force_closed"
                  ? "Registration Temporarily Paused"
                  : "Registration Not Yet Open"}
              </span>
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 leading-snug">
              {schedule.phase === "before_opening"
                ? `Online registration for the ${workshop.workshop_ordinal} HEMS Workshop opens automatically on ${schedule.openingDateLabel}.`
                : schedule.phase === "concluded_closed"
                ? `Online registration closed following the final day of the ${workshop.workshop_ordinal} HEMS Workshop (${schedule.conferenceEndDateLabel}).`
                : schedule.phase === "force_closed"
                ? `Registration is currently paused by the Organizing Committee.`
                : `Registration for the ${workshop.workshop_ordinal} HEMS Workshop (${workshop.target_window}) has not yet opened.`}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {schedule.phase === "concluded_closed"
                ? "Thank you to all investigators, students, and corporate partners who participated. Archived technical programs, slide decks, and posters will be added to the Open-Access Digital Archive."
                : schedule.phase === "before_opening"
                ? `Our scheduled registration calendar automatically activates Early Registration (${schedule.activeFees.studentEarlyCents < schedule.activeFees.studentRegularCents ? `${formatCentsUsd(schedule.activeFees.studentEarlyCents)} Student / ${formatCentsUsd(schedule.activeFees.professionalEarlyCents)} Regular` : "discount pricing"}) at 12:00 AM ${schedule.timezoneLabel} on ${schedule.openingDateLabel}. Early rates remain available through ${schedule.earlyBirdCloseDateLabel}, and registration closes after the final day of the workshop (${schedule.conferenceEndDateLabel}).`
                : "Registration opening dates, early-bird cutoffs, and online payment links activate automatically once published in the HEMS Workshop schedule. Participation is open to academic, government, and industrial colleagues with no separate Society membership fee."}
            </p>

            {/* Schedule Milestones Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-3.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Registration Opens
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                  {schedule.openingDateLabel}
                </div>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-3.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Early Registration Closes
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                  {schedule.earlyBirdCloseDateLabel}
                </div>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-3.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Final Close (End of Conf.)
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                  {schedule.conferenceEndDateLabel}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm font-medium">
              {schedule.phase === "concluded_closed" ? (
                <Link href="/archive" className="text-primary font-semibold hover:underline">
                  Explore Proceedings Archive →
                </Link>
              ) : (
                <Link href="/contact#mailing-list" className="text-primary font-semibold hover:underline">
                  Join Mailing List for Opening Alert →
                </Link>
              )}
              <Link href="/contact" className="text-slate-600 hover:text-primary transition-colors">
                Contact Committee →
              </Link>
              <Link href="/student-awards" className="text-slate-600 hover:text-primary transition-colors">
                Student Travel Awards →
              </Link>
              <Link href="/corporate-sponsorship" className="text-slate-600 hover:text-primary transition-colors">
                Corporate Sponsorship →
              </Link>
            </div>
          </section>

          {/* Read-Only Planned Fee Preview */}
          <section className="max-w-4xl bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-slate-900 mb-3">
              Planned Registration Categories ({workshop.workshop_ordinal} Workshop)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="font-semibold uppercase tracking-wider text-slate-500 text-[10.5px]">
                  Student Attendee
                </div>
                <div className="font-bold text-slate-900 text-lg tabular-nums">
                  {formatCentsUsd(schedule.activeFees.studentEarlyCents)} Early •{" "}
                  {formatCentsUsd(schedule.activeFees.studentRegularCents)} Regular
                </div>
                <p className="text-slate-600">Includes technical sessions, poster sessions &amp; Workshop Dinner.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="font-semibold uppercase tracking-wider text-primary text-[10.5px]">
                  Regular Professional
                </div>
                <div className="font-bold text-primary text-lg tabular-nums">
                  {formatCentsUsd(schedule.activeFees.professionalEarlyCents)} Early •{" "}
                  {formatCentsUsd(schedule.activeFees.professionalRegularCents)} Regular
                </div>
                <p className="text-slate-600">Academic, government &amp; industry investigators.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="font-semibold uppercase tracking-wider text-slate-500 text-[10.5px]">
                  Corporate Sponsor
                </div>
                <div className="font-bold text-slate-900 text-lg tabular-nums">
                  {formatCentsUsd(schedule.activeFees.sponsorRegularCents)}
                </div>
                <p className="text-slate-600">Exhibition display space, recognition &amp; 1 regular registration.</p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* =====================================================================
           ACTIVE AUTO-ADVANCE CHECKOUT INTERFACE (Early-Bird or Regular Window)
           ===================================================================== */
        <div className="space-y-8">
          {/* Active Auto-Advance Schedule Strip */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
              schedule.isEarlyBirdActive
                ? "bg-teal-50/75 border-teal-200 text-teal-950"
                : "bg-sky-50/75 border-sky-200 text-sky-950"
            }`}
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>
                  {schedule.isEarlyBirdActive
                    ? `Early Registration Active — Save on Student & Regular Tiers through ${schedule.earlyBirdCloseDateLabel}`
                    : `Regular Registration Open — Closes After ${schedule.conferenceEndDateLabel}`}
                </span>
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                Includes full technical program, proceedings access, evening poster receptions, and the Wednesday Workshop Dinner. Instant 501(c)(3) expense receipts, 2027 Portal access, and federal GPC-compliant checkout (zero platform tips).
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0 text-xs tabular-nums">
              <div className="font-semibold uppercase tracking-wider opacity-70 text-[10px]">
                Closing Cutoff ({schedule.timezoneLabel})
              </div>
              <div className="font-bold text-sm">{schedule.conferenceEndDateLabel}</div>
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 8 COLUMNS: Interactive Registration Sections */}
            <div className="lg:col-span-8 space-y-6">
              {formError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertTriangle size={17} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: Tier Selection + Promo Code */}
              <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <Ticket size={18} className="text-primary" /> 1. Select Registration Tier
                  </h2>
                  <span className="text-xs font-medium text-slate-500">
                    {schedule.isEarlyBirdActive ? "Early-Bird Window" : "Standard Rate Window"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Student Tier */}
                  <button
                    type="button"
                    onClick={() => handleSelectTier("student")}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      tier === "student"
                        ? "border-primary bg-sky-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                          Student
                        </span>
                        <GraduationCap size={15} className="text-primary" />
                      </div>
                      <div className="font-serif font-semibold text-base text-slate-900">
                        Graduate / Student
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 tabular-nums">
                        <span className="text-2xl font-bold text-slate-900">
                          {schedule.activeFees.studentLabel}
                        </span>
                        {schedule.isEarlyBirdActive &&
                          schedule.activeFees.studentEarlyCents <
                            schedule.activeFees.studentRegularCents && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatCentsUsd(schedule.activeFees.studentRegularCents)}
                            </span>
                          )}
                      </div>
                    </div>
                    <p className="text-[11.5px] text-slate-600 mt-2 leading-snug">
                      Full-time B.S./M.S./Ph.D. trainees. Eligible for Student Travel Awards.
                    </p>
                  </button>

                  {/* Regular Professional Tier */}
                  <button
                    type="button"
                    onClick={() => handleSelectTier("professional")}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      tier === "professional"
                        ? "border-primary bg-sky-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
                          Standard
                        </span>
                        <BadgeCheck size={15} className="text-primary" />
                      </div>
                      <div className="font-serif font-semibold text-base text-slate-900">
                        Regular Attendee
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 tabular-nums">
                        <span className="text-2xl font-bold text-primary">
                          {schedule.activeFees.professionalLabel}
                        </span>
                        {schedule.isEarlyBirdActive &&
                          schedule.activeFees.professionalEarlyCents <
                            schedule.activeFees.professionalRegularCents && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatCentsUsd(schedule.activeFees.professionalRegularCents)}
                            </span>
                          )}
                      </div>
                    </div>
                    <p className="text-[11.5px] text-slate-600 mt-2 leading-snug">
                      Academic faculty, postdocs, government labs &amp; industry investigators.
                    </p>
                  </button>

                  {/* Corporate Sponsor Tier */}
                  <button
                    type="button"
                    onClick={() => handleSelectTier("sponsor")}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      tier === "sponsor"
                        ? "border-primary bg-sky-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-secondary">
                          Exhibitor
                        </span>
                        <Building2 size={15} className="text-secondary" />
                      </div>
                      <div className="font-serif font-semibold text-base text-slate-900">
                        Corporate Sponsor
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 tabular-nums">
                        <span className="text-2xl font-bold text-slate-900">
                          {schedule.activeFees.sponsorLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11.5px] text-slate-600 mt-2 leading-snug">
                      Exhibition table, program recognition &amp; 1 full attendee registration.
                    </p>
                  </button>
                </div>

                {/* Promo / Sponsor Seat / Waiver Code */}
                <div className="pt-3 border-t border-slate-100">
                  <label
                    htmlFor="reg-promo-code"
                    className="hems-label flex items-center gap-1.5"
                  >
                    <Tag size={13} className="text-primary" /> Promo, Sponsor-Seat, or Awardee Waiver Code (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      id="reg-promo-code"
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="e.g. INFICON2027, HOST2027, AWARD2027"
                      className="hems-control flex-1 uppercase font-mono text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      disabled={promoChecking}
                      onClick={() => void handleApplyPromo()}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      {promoChecking ? "Checking..." : "Apply Code"}
                    </button>
                  </div>
                  {promoFeedback && (
                    <p
                      className={`text-xs mt-1.5 font-medium ${
                        promoFeedback.ok ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {promoFeedback.msg}
                    </p>
                  )}
                </div>
              </section>

              {/* STEP 2: Attendee Details & Name Badge */}
              <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <BadgeCheck size={18} className="text-primary" /> 2. Attendee &amp; Name Badge Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-first" className="hems-label">
                      First Name *
                    </label>
                    <input
                      id="reg-first"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="hems-control w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-last" className="hems-label">
                      Last Name *
                    </label>
                    <input
                      id="reg-last"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="hems-control w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="hems-label">
                      Institutional / Work Email *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scientist@university.edu"
                      className="hems-control w-full"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Unlocks 2027 Attendee Portal &amp; Abstract Submission access automatically.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="reg-country" className="hems-label">
                      Country *
                    </label>
                    <input
                      id="reg-country"
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="hems-control w-full"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="reg-affiliation" className="hems-label">
                      Institution, Agency, or Company *
                    </label>
                    <input
                      id="reg-affiliation"
                      type="text"
                      required
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      placeholder="e.g. Woods Hole Oceanographic Institution"
                      className="hems-control w-full"
                    />
                  </div>
                </div>

                {/* Live Lanyard Name Badge Block */}
                <div className="bg-slate-50/80 border border-slate-200/85 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Printed Conference Name Badge
                    </span>
                    <span className="text-[11px] text-slate-500">4&quot; × 3&quot; Badge Preview</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="reg-badge-name" className="hems-label">
                        Badge Display Name *
                      </label>
                      <input
                        id="reg-badge-name"
                        type="text"
                        required
                        value={badgeName}
                        onChange={(e) => {
                          setBadgeTouched(true);
                          setBadgeName(e.target.value);
                        }}
                        className="hems-control w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-badge-affil" className="hems-label">
                        Badge Affiliation
                      </label>
                      <input
                        id="reg-badge-affil"
                        type="text"
                        value={badgeAffiliation}
                        onChange={(e) => {
                          setBadgeTouched(true);
                          setBadgeAffiliation(e.target.value);
                        }}
                        className="hems-control w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-pronouns" className="hems-label">
                        Pronouns (Optional)
                      </label>
                      <input
                        id="reg-pronouns"
                        type="text"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        placeholder="e.g. she/her"
                        className="hems-control w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Student Advisor Verification */}
                {tier === "student" && (
                  <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <GraduationCap size={14} /> Graduate / Student Verification
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="reg-degree" className="hems-label">
                          Degree Program *
                        </label>
                        <select
                          id="reg-degree"
                          value={studentDegreeProgram}
                          onChange={(e) =>
                            setStudentDegreeProgram(e.target.value as StudentDegreeProgram)
                          }
                          className="hems-control w-full"
                        >
                          <option value="Ph.D.">Ph.D. Candidate</option>
                          <option value="M.S.">M.S. Student</option>
                          <option value="M.A.">M.A. Student</option>
                          <option value="B.S./Undergraduate">B.S. / Undergraduate</option>
                          <option value="Postdoctoral Trainee">Postdoctoral Trainee</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="reg-advisor-name" className="hems-label">
                          Research Advisor Name *
                        </label>
                        <input
                          id="reg-advisor-name"
                          type="text"
                          required={tier === "student"}
                          value={studentAdvisorName}
                          onChange={(e) => setStudentAdvisorName(e.target.value)}
                          className="hems-control w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-advisor-email" className="hems-label">
                          Advisor Email *
                        </label>
                        <input
                          id="reg-advisor-email"
                          type="email"
                          required={tier === "student"}
                          value={studentAdvisorEmail}
                          onChange={(e) => setStudentAdvisorEmail(e.target.value)}
                          className="hems-control w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* STEP 3: Catering, Guest Dinner Ticket & Voluntary Student Award Contribution */}
              <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Utensils size={18} className="text-primary" /> 3. Workshop Dinner, Dietary &amp; Guest Tickets
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-dinner-rsvp" className="hems-label">
                      Wednesday Evening Workshop Dinner RSVP
                    </label>
                    <select
                      id="reg-dinner-rsvp"
                      value={wednesdayDinnerRsvp}
                      onChange={(e) =>
                        setWednesdayDinnerRsvp(e.target.value as WednesdayDinnerRsvp)
                      }
                      className="hems-control w-full"
                    >
                      <option value="attending">Attending (Included with Registration)</option>
                      <option value="declining">Not Attending Wednesday Dinner</option>
                      <option value="undecided">Undecided — Will Confirm Later</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="reg-guest-count" className="hems-label">
                      Spouse / Guest Dinner Ticket ({schedule.activeFees.guestDinnerLabel} each)
                    </label>
                    <select
                      id="reg-guest-count"
                      value={guestDinnerCount}
                      onChange={(e) => setGuestDinnerCount(Number(e.target.value))}
                      className="hems-control w-full"
                    >
                      <option value={0}>No Extra Guest Dinner Tickets ($0)</option>
                      <option value={1}>1 Guest Dinner Ticket (+{schedule.activeFees.guestDinnerLabel})</option>
                      <option value={2}>2 Guest Dinner Tickets (+{formatCentsUsd(schedule.activeFees.guestDinnerCents * 2)})</option>
                    </select>
                  </div>
                </div>

                {guestDinnerCount > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                    <div>
                      <label htmlFor="reg-guest-names" className="hems-label">
                        Guest Name(s) for Dinner Roster *
                      </label>
                      <input
                        id="reg-guest-names"
                        type="text"
                        required
                        value={guestNames}
                        onChange={(e) => setGuestNames(e.target.value)}
                        placeholder="e.g. Morgan Vance"
                        className="hems-control w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-guest-diet" className="hems-label">
                        Guest Dietary / Allergy Notes
                      </label>
                      <input
                        id="reg-guest-diet"
                        type="text"
                        value={guestDietaryNotes}
                        onChange={(e) => setGuestDietaryNotes(e.target.value)}
                        placeholder="e.g. Vegetarian, nut allergy"
                        className="hems-control w-full"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <span className="hems-label">Your Dietary Requirements</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {DIETARY_OPTIONS.map((opt) => {
                      const active = dietaryRestrictions.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleDietary(opt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-700 border-slate-200 hover:border-primary/40"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-allergy" className="hems-label">
                    Severe Food Allergy / Seating Accommodation Notes (Optional)
                  </label>
                  <input
                    id="reg-allergy"
                    type="text"
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                    placeholder="e.g. Celiac disease, anaphylactic peanut allergy, accessibility seating"
                    className="hems-control w-full"
                  />
                </div>

                {/* Optional Tax-Deductible Student Travel Award Add-On */}
                {workshop.reg_enable_student_fund_donation !== false && (
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                      <Award size={14} /> Support Graduate Student Travel Awards (Optional 501(c)(3) Gift)
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      100% of voluntary contributions support competitive {workshop.student_award_amount} Student Travel Awards and are separately itemized as tax-deductible charitable gifts under IRS IRC § 6115.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { cents: 0, label: "No Add-On ($0)" },
                        { cents: 2500, label: "+$25" },
                        { cents: 5000, label: "+$50" },
                        { cents: 10000, label: "+$100" },
                        { cents: -1, label: "Custom" },
                      ].map((choice) => (
                        <button
                          key={choice.cents}
                          type="button"
                          onClick={() => setDonationChoice(choice.cents)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            donationChoice === choice.cents
                              ? "bg-secondary text-white border-secondary"
                              : "bg-white text-slate-700 border-slate-200 hover:border-secondary/40"
                          }`}
                        >
                          {choice.label}
                        </button>
                      ))}
                      {donationChoice === -1 && (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={customDonationDollars}
                          onChange={(e) => setCustomDonationDollars(e.target.value)}
                          placeholder="$ Amount"
                          className="hems-control w-28 text-xs"
                        />
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* STEP 4: Payment Method & Consents */}
              <section className="bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <h2 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" /> 4. Payment Method &amp; Confirmation
                </h2>

                {totals.totalCents > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("stripe")}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                        paymentMode === "stripe"
                          ? "border-primary bg-sky-50/40"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <CreditCard size={15} className="text-primary" /> Pay Online Now (Stripe Checkout)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Visa/Mastercard/Amex, university &amp; federal GPC travel cards, Apple Pay, Google Pay, or US Bank ACH. Instant whitelist &amp; itemized receipt.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode("invoice")}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                        paymentMode === "invoice"
                          ? "border-primary bg-sky-50/40"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <FileText size={15} className="text-secondary" /> Official Invoice / Check / PO
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Generates Invoice #{`HEMS-${parsedYear}-INV-XXXX`} + W-9 instructions for agency POs, checks, or bank transfers ($0 card fee). Activates upon Treasurer verification.
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-2.5">
                    <CheckCircle2 size={17} className="text-emerald-700 shrink-0" />
                    <span>
                      Your balance due is <strong>$0.00</strong> with promo code{" "}
                      <strong>{appliedPromo?.code}</strong>. Submitting completes registration and activates portal access immediately.
                    </span>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs text-slate-700">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mailingListOptIn}
                      onChange={(e) => setMailingListOptIn(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span>
                      <Mail size={12} className="inline mr-1 text-primary" />
                      Add my email to the <strong>&ldquo;{parsedYear} Attendees&rdquo;</strong> cohort in the HEMS Society mailing list for technical program, venue, and proceedings notices.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(e) => setPolicyAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span>
                      I acknowledge the cancellation &amp; substitution policy: refunds less a $50 administrative fee are available until{" "}
                      <strong className="tabular-nums">{workshop.reg_refund_cutoff}</strong>; colleague seat transfers remain welcome thereafter at no cost.
                    </span>
                  </label>
                </div>
              </section>
            </div>

            {/* RIGHT 4 COLUMNS: Sticky Summary & Important Dates */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white border-2 border-primary/25 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-lg font-semibold text-slate-900">
                    Registration Summary
                  </h3>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {schedule.isEarlyBirdActive ? "Early Bird" : "Regular"}
                  </span>
                </div>

                <dl className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-600 capitalize">{tier} Tier</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">
                      {formatCentsUsd(totals.baseFeeCents)}
                    </dd>
                  </div>

                  {totals.discountCents > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-700">
                      <dt>Waiver ({appliedPromo?.code})</dt>
                      <dd className="font-semibold tabular-nums">
                        -{formatCentsUsd(totals.discountCents)}
                      </dd>
                    </div>
                  )}

                  {guestDinnerCount > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-600">
                        Guest Dinner × {guestDinnerCount}
                      </dt>
                      <dd className="font-semibold tabular-nums text-slate-900">
                        {formatCentsUsd(totals.guestDinnerSubtotalCents)}
                      </dd>
                    </div>
                  )}

                  {totals.optionalStudentFundDonationCents > 0 && (
                    <div className="flex justify-between gap-3 text-secondary">
                      <dt>Student Award Gift</dt>
                      <dd className="font-semibold tabular-nums">
                        +{formatCentsUsd(totals.optionalStudentFundDonationCents)}
                      </dd>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline gap-3">
                    <dt className="font-semibold text-slate-900">Total Due</dt>
                    <dd className="text-2xl font-bold tabular-nums text-primary">
                      {formatCentsUsd(totals.totalCents)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-primary text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-sky-800 transition-colors shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
                >
                  {busy ? (
                    <span>Processing Registration...</span>
                  ) : totals.totalCents === 0 ? (
                    <>
                      <span>Complete Complimentary Registration</span>
                      <ArrowRight size={16} />
                    </>
                  ) : paymentMode === "invoice" ? (
                    <>
                      <span>Generate Official Invoice</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <span>Continue to Secure Checkout</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                  <ShieldCheck size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    Zero HEMS membership dues, zero platform tip prompts, and immediate printable IRS 501(c)(3) travel receipts.
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/95 rounded-2xl p-5 shadow-2xs space-y-2.5 text-xs">
                <div className="font-semibold uppercase tracking-wider text-slate-500 text-[10.5px] flex items-center gap-1.5">
                  <HeartHandshake size={13} className="text-primary" /> Key Workshop Windows
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Registration Opens</span>
                  <span className="font-semibold text-slate-900 tabular-nums text-right">
                    {schedule.openingDateLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Early Registration Deadline</span>
                  <span className="font-semibold text-slate-900 tabular-nums text-right">
                    {schedule.earlyBirdCloseDateLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Closes After Last Day</span>
                  <span className="font-semibold text-slate-900 tabular-nums text-right">
                    {schedule.conferenceEndDateLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-600">Refund Cutoff</span>
                  <span className="font-semibold text-slate-900 tabular-nums text-right">
                    {workshop.reg_refund_cutoff}
                  </span>
                </div>
              </div>
            </aside>
          </form>
        </div>
      )}
    </>
  );
}
