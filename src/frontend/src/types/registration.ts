export type RegistrationTier = "student" | "professional" | "sponsor";

export type RegistrationPaymentMode = "stripe" | "invoice" | "comped";

export type RegistrationStatus =
  | "checkout_started"
  | "pending_invoice"
  | "paid"
  | "comped"
  | "refunded"
  | "transferred"
  | "cancelled";

export type WednesdayDinnerRsvp = "attending" | "declining" | "undecided";

export type StudentDegreeProgram =
  | "Ph.D."
  | "M.S."
  | "M.A."
  | "B.S./Undergraduate"
  | "Postdoctoral Trainee";

export const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Kosher / Halal",
  "Shellfish / Nut Allergy",
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

export interface RegistrationTransferEvent {
  fromEmail: string;
  toEmail: string;
  fromName: string;
  toName: string;
  transferredBy: string;
  transferredAt: string;
  reason?: string;
}

export interface WorkshopRegistrationRecord {
  id: string;
  workshopYear: number;
  workshopOrdinal: string;
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  country: string;
  phone?: string;
  linkedUid?: string;

  // Name Badge fields
  badgeName: string;
  badgeAffiliation: string;
  pronouns?: string;

  // Tier, Pricing & Promo Breakdown (all integer cents)
  tier: RegistrationTier;
  pricingWindow: "early_bird" | "regular";
  promoCodeUsed?: string;
  baseFeeCents: number;
  discountCents: number;
  guestDinnerCount: number;
  guestDinnerUnitCents: number;
  optionalStudentFundDonationCents: number;
  totalCents: number;
  stripeFeeEstimatedCents?: number;
  netEstimatedCents?: number;

  // Student verification
  studentDegreeProgram?: StudentDegreeProgram;
  studentAdvisorName?: string;
  studentAdvisorEmail?: string;

  // Meals & Logistics
  wednesdayDinnerRsvp: WednesdayDinnerRsvp;
  dietaryRestrictions: string[];
  allergyNotes?: string;
  guestNames?: string;
  guestDietaryNotes?: string;
  mailingListOptIn: boolean;
  sandboxSimulation?: boolean;

  // Linked Abstract Submissions & Transfers
  linkedAbstractIds: string[];
  transferHistory?: RegistrationTransferEvent[];
  transferredFromRegId?: string;
  transferredToEmail?: string;

  // Payment, Fulfillment & Check-In State
  paymentMode: RegistrationPaymentMode;
  status: RegistrationStatus;
  invoiceNumber?: string;
  receiptNumber?: string;
  receiptToken: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentSummary?: string;
  paymentReferenceNote?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  refundedAt?: string;
  refundReason?: string;
  sheetSyncStatus?: "synced" | "skipped_unconfigured" | "error";
  sheetSyncError?: string;
  checkedInAt?: string;
  isSampleSeed?: boolean;
}

export interface WorkshopPromoCode {
  code: string;
  label: string;
  workshopYear: number;
  discountType: "percent" | "fixed_cents";
  discountValue: number;
  allowedTiers: RegistrationTier[];
  grantsSponsorRole?: boolean;
  maxUses: number;
  usesCount: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StripePayoutItem {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  arrivalDateIso: string;
  method?: string;
}

export interface StripeTreasurerSummary {
  configured: boolean;
  mode: "live" | "test" | "unconfigured" | "local_sandbox";
  hasWebhookSecret: boolean;
  availableUsdCents: number | null;
  pendingUsdCents: number | null;
  recentPayouts: StripePayoutItem[];
  fetchedAt: string;
  error?: string;
}

export interface RegistrationSubmitPayload {
  workshopYear: number;
  workshopOrdinal: string;
  tier: RegistrationTier;
  pricingWindow: "early_bird" | "regular";
  paymentMode: "stripe" | "invoice";
  firstName: string;
  lastName: string;
  email: string;
  affiliation: string;
  country: string;
  badgeName: string;
  badgeAffiliation: string;
  pronouns?: string;
  promoCode?: string;
  guestDinnerCount: number;
  guestNames?: string;
  guestDietaryNotes?: string;
  optionalStudentFundDonationCents: number;
  studentDegreeProgram?: StudentDegreeProgram;
  studentAdvisorName?: string;
  studentAdvisorEmail?: string;
  wednesdayDinnerRsvp: WednesdayDinnerRsvp;
  dietaryRestrictions: string[];
  allergyNotes?: string;
  mailingListOptIn: boolean;
  sandboxOverride?: boolean;
}

export interface RegistrationTotalsBreakdown {
  baseFeeCents: number;
  discountCents: number;
  netRegistrationCents: number;
  guestDinnerSubtotalCents: number;
  optionalStudentFundDonationCents: number;
  totalCents: number;
  nonDeductibleQuidProQuoCents: number;
  taxDeductibleDonationCents: number;
  estimatedStripeCardFeeCents: number;
  estimatedStripeAchFeeCents: number;
}

/**
 * Computes itemized integer-cent totals including promo discounts, guest dinner
 * add-ons, voluntary Student Travel Award donations, and IRC § 6115 split.
 */
export function calculateRegistrationTotals(params: {
  baseFeeCents: number;
  promo?: Pick<WorkshopPromoCode, "discountType" | "discountValue"> | null;
  guestDinnerCount: number;
  guestDinnerUnitCents: number;
  optionalStudentFundDonationCents: number;
}): RegistrationTotalsBreakdown {
  const baseFeeCents = Math.max(0, Math.round(params.baseFeeCents));
  const guestCount = Math.max(0, Math.min(4, Math.floor(params.guestDinnerCount || 0)));
  const guestDinnerUnitCents = Math.max(0, Math.round(params.guestDinnerUnitCents));
  const donationCents = Math.max(
    0,
    Math.round(params.optionalStudentFundDonationCents || 0)
  );

  let discountCents = 0;
  if (params.promo) {
    if (params.promo.discountType === "percent") {
      const pct = Math.max(0, Math.min(100, params.promo.discountValue));
      discountCents = Math.round((baseFeeCents * pct) / 100);
    } else {
      discountCents = Math.max(0, Math.min(baseFeeCents, params.promo.discountValue));
    }
  }

  const netRegistrationCents = Math.max(0, baseFeeCents - discountCents);
  const guestDinnerSubtotalCents = guestCount * guestDinnerUnitCents;
  const nonDeductibleQuidProQuoCents = netRegistrationCents + guestDinnerSubtotalCents;
  const totalCents = nonDeductibleQuidProQuoCents + donationCents;

  const estimatedStripeCardFeeCents =
    totalCents > 0 ? Math.round(totalCents * 0.029) + 30 : 0;
  const estimatedStripeAchFeeCents =
    totalCents > 0 ? Math.min(500, Math.round(totalCents * 0.008)) : 0;

  return {
    baseFeeCents,
    discountCents,
    netRegistrationCents,
    guestDinnerSubtotalCents,
    optionalStudentFundDonationCents: donationCents,
    totalCents,
    nonDeductibleQuidProQuoCents,
    taxDeductibleDonationCents: donationCents,
    estimatedStripeCardFeeCents,
    estimatedStripeAchFeeCents,
  };
}

export const INITIAL_SAMPLE_PROMO_CODES: WorkshopPromoCode[] = [
  {
    code: "INFICON2027",
    label: "Corporate Sponsor Complimentary Seat",
    workshopYear: 2027,
    discountType: "percent",
    discountValue: 100,
    allowedTiers: ["professional", "sponsor"],
    grantsSponsorRole: true,
    maxUses: 2,
    usesCount: 0,
    active: true,
    notes: "Reserved for Platinum/Sponsor package exhibitor badge.",
    createdAt: "2026-11-15T12:00:00.000Z",
    updatedAt: "2026-11-15T12:00:00.000Z",
  },
  {
    code: "HOST2027",
    label: "Permanent Workshop Host Patron Comp",
    workshopYear: 2027,
    discountType: "percent",
    discountValue: 100,
    allowedTiers: ["professional"],
    grantsSponsorRole: false,
    maxUses: 4,
    usesCount: 0,
    active: true,
    notes: "Host Patron Committee complimentary pass.",
    createdAt: "2026-11-15T12:00:00.000Z",
    updatedAt: "2026-11-15T12:00:00.000Z",
  },
  {
    code: "AWARD2027",
    label: "Student Travel Awardee Fee Waiver",
    workshopYear: 2027,
    discountType: "percent",
    discountValue: 100,
    allowedTiers: ["student"],
    grantsSponsorRole: false,
    maxUses: 10,
    usesCount: 0,
    active: true,
    notes: "Full student registration waiver for Travel Award finalists.",
    createdAt: "2026-11-15T12:00:00.000Z",
    updatedAt: "2026-11-15T12:00:00.000Z",
  },
];

export const INITIAL_SAMPLE_REGISTRATIONS: WorkshopRegistrationRecord[] = [
  {
    id: "REG-2027-001",
    workshopYear: 2027,
    workshopOrdinal: "16th",
    email: "avance@whoi.example.org",
    firstName: "Alice",
    lastName: "Vance",
    affiliation: "Woods Hole Oceanographic Institution",
    country: "United States",
    badgeName: "Dr. Alice Vance",
    badgeAffiliation: "WHOI — Applied Ocean Physics",
    tier: "professional",
    pricingWindow: "early_bird",
    baseFeeCents: 42500,
    discountCents: 0,
    guestDinnerCount: 1,
    guestDinnerUnitCents: 7500,
    optionalStudentFundDonationCents: 5000,
    totalCents: 55000,
    stripeFeeEstimatedCents: 1625,
    netEstimatedCents: 53375,
    wednesdayDinnerRsvp: "attending",
    dietaryRestrictions: ["None"],
    guestNames: "David Vance",
    guestDietaryNotes: "Vegetarian",
    mailingListOptIn: true,
    sandboxSimulation: true,
    linkedAbstractIds: ["ABS-2027-001"],
    paymentMode: "stripe",
    status: "paid",
    receiptNumber: "HEMS-2027-0001",
    receiptToken: "demo-receipt-token-001",
    paymentSummary: "Visa •••• 4242",
    createdAt: "2026-11-10T15:30:00.000Z",
    updatedAt: "2026-11-10T15:31:00.000Z",
    paidAt: "2026-11-10T15:31:00.000Z",
    fulfilledAt: "2026-11-10T15:31:05.000Z",
    sheetSyncStatus: "synced",
    isSampleSeed: true,
  },
  {
    id: "REG-2027-002",
    workshopYear: 2027,
    workshopOrdinal: "16th",
    email: "jblake.student@usf.example.edu",
    firstName: "Jordan",
    lastName: "Blake",
    affiliation: "University of South Florida",
    country: "United States",
    badgeName: "Jordan Blake",
    badgeAffiliation: "USF College of Marine Science",
    tier: "student",
    pricingWindow: "early_bird",
    baseFeeCents: 20000,
    discountCents: 0,
    guestDinnerCount: 0,
    guestDinnerUnitCents: 7500,
    optionalStudentFundDonationCents: 0,
    totalCents: 20000,
    stripeFeeEstimatedCents: 610,
    netEstimatedCents: 19390,
    studentDegreeProgram: "Ph.D.",
    studentAdvisorName: "Dr. Tim Short",
    studentAdvisorEmail: "tim.short@hems-workshop.org",
    wednesdayDinnerRsvp: "attending",
    dietaryRestrictions: ["Gluten-Free"],
    allergyNotes: "Strict celiac — separate prep requested",
    mailingListOptIn: true,
    sandboxSimulation: true,
    linkedAbstractIds: [],
    paymentMode: "stripe",
    status: "paid",
    receiptNumber: "HEMS-2027-0002",
    receiptToken: "demo-receipt-token-002",
    paymentSummary: "Mastercard •••• 8812",
    createdAt: "2026-11-11T19:00:00.000Z",
    updatedAt: "2026-11-11T19:01:00.000Z",
    paidAt: "2026-11-11T19:01:00.000Z",
    fulfilledAt: "2026-11-11T19:01:03.000Z",
    sheetSyncStatus: "synced",
    isSampleSeed: true,
  },
  {
    id: "REG-2027-003",
    workshopYear: 2027,
    workshopOrdinal: "16th",
    email: "exhibits@inficon.example.com",
    firstName: "Hannah",
    lastName: "Myers",
    affiliation: "INFICON, Inc.",
    country: "United States",
    badgeName: "Hannah Myers",
    badgeAffiliation: "INFICON Sponsor Exhibit",
    tier: "sponsor",
    pricingWindow: "early_bird",
    baseFeeCents: 135000,
    discountCents: 0,
    guestDinnerCount: 0,
    guestDinnerUnitCents: 7500,
    optionalStudentFundDonationCents: 0,
    totalCents: 135000,
    stripeFeeEstimatedCents: 0,
    netEstimatedCents: 135000,
    wednesdayDinnerRsvp: "attending",
    dietaryRestrictions: ["None"],
    mailingListOptIn: true,
    sandboxSimulation: true,
    linkedAbstractIds: [],
    paymentMode: "invoice",
    status: "pending_invoice",
    invoiceNumber: "HEMS-2027-INV-0003",
    receiptToken: "demo-receipt-token-003",
    paymentSummary: "Pending Institutional Check / ACH PO",
    createdAt: "2026-11-12T10:15:00.000Z",
    updatedAt: "2026-11-12T10:15:00.000Z",
    sheetSyncStatus: "synced",
    isSampleSeed: true,
  },
];
