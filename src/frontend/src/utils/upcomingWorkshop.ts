import rawUpcomingWorkshop from "@/data/upcoming_workshop.json";

export type WorkshopCycleStage =
  | "save_the_date"
  | "open"
  | "program_published"
  | "concluded";

export type RegistrationMode = "auto_schedule" | "open_manual" | "paused_closed";

export interface UpcomingWorkshopConfig {
  workshop_number: number;
  workshop_ordinal: string;
  workshop_year: string;
  target_window: string;
  cycle_stage: WorkshopCycleStage;
  exact_dates: string;
  conference_start_date: string;
  conference_end_date: string;
  announcement_headline: string;
  announcement_body: string;
  venue_confirmed: boolean;
  venue_city_state: string;
  hotel_name: string;
  hotel_address: string;
  hotel_maps_url: string;
  hotel_group_rate: string;
  hotel_discount_window: string;
  hotel_booking_cutoff: string;
  hotel_booking_url: string;
  venue_session_room: string;
  venue_foyer_room: string;
  welcome_reception_time: string;
  welcome_reception_venue: string;
  dinner_day_time: string;
  dinner_venue_name: string;
  dinner_venue_address: string;
  dinner_venue_url: string;
  dinner_plan_notes: string;
  cfp_open: boolean;
  cfp_abstract_deadline: string;
  cfp_abstract_deadline_time: string;
  cfp_abstract_deadline_timezone: string;
  cfp_notification_date: string;
  registration_mode: RegistrationMode;
  reg_opening_date: string;
  reg_timezone: string;
  reg_early_bird_closes: string;
  reg_final_cutoff: string;
  reg_refund_cutoff: string;
  reg_student_early_fee: string;
  reg_professional_early_fee: string;
  reg_sponsor_early_fee: string;
  reg_student_fee: string;
  reg_professional_fee: string;
  reg_sponsor_fee: string;
  reg_guest_dinner_fee: string;
  reg_enable_student_fund_donation: boolean;
  student_award_amount: string;
  student_award_deadline: string;
  student_award_extended: boolean;
  student_award_email: string;
  sponsor_coordinator_name: string;
  sponsor_coordinator_email: string;
}

export type WorkshopSectionId =
  | "identity"
  | "announcement"
  | "venue"
  | "cfp"
  | "registration"
  | "awards_sponsors";

export interface WorkshopSectionMeta {
  id: WorkshopSectionId;
  title: string;
  subtitle: string;
}

export interface WorkshopPageRef {
  label: string;
  href: string;
}

export interface WorkshopFieldMeta {
  key: keyof UpcomingWorkshopConfig;
  section: WorkshopSectionId;
  label: string;
  helpText: string;
  controlType: "text" | "textarea" | "number" | "boolean" | "select" | "date" | "currency" | "url" | "email";
  usedOnPages: WorkshopPageRef[];
}

export interface WorkshopValidationIssue {
  fieldKey?: keyof UpcomingWorkshopConfig;
  section: WorkshopSectionId;
  severity: "error" | "warning";
  message: string;
}

export interface WorkshopFieldDiff {
  key: keyof UpcomingWorkshopConfig;
  label: string;
  section: WorkshopSectionId;
  beforeValue: string;
  afterValue: string;
  usedOnPages: WorkshopPageRef[];
}

const VALID_STAGES: readonly WorkshopCycleStage[] = [
  "save_the_date",
  "open",
  "program_published",
  "concluded",
];

const VALID_REG_MODES: readonly RegistrationMode[] = [
  "auto_schedule",
  "open_manual",
  "paused_closed",
];

function isValidCycleStage(val: string): val is WorkshopCycleStage {
  return (VALID_STAGES as readonly string[]).includes(val);
}

function isValidRegistrationMode(val: string): val is RegistrationMode {
  return (VALID_REG_MODES as readonly string[]).includes(val);
}

function parseBooleanCell(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") return raw;
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "yes", "1", "open", "y", "confirmed"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "0", "closed", "n", "tba"].includes(normalized)) {
    return false;
  }
  return fallback;
}

export const DEFAULT_UPCOMING_WORKSHOP: UpcomingWorkshopConfig = {
  ...(rawUpcomingWorkshop as UpcomingWorkshopConfig),
};

export const WORKSHOP_SECTIONS: readonly WorkshopSectionMeta[] = [
  {
    id: "identity",
    title: "1. Workshop Identity & Dates",
    subtitle: "Symposium edition, target month, stage badge, and calendar start/end dates.",
  },
  {
    id: "announcement",
    title: "2. Homepage & Portal Announcement",
    subtitle: "Official headline and committee overview shown on Portal Overview and Google Event metadata.",
  },
  {
    id: "venue",
    title: "3. Venue, Rooms & Dinner Plans",
    subtitle: "Hotel property, plenary & poster rooms, arrival reception, workshop banquet/dinner plans, and room-block rates.",
  },
  {
    id: "cfp",
    title: "4. Call for Papers & Abstract Cutoff",
    subtitle: "Controls Call for Papers badges and enforces exact wall-clock abstract submission lockouts.",
  },
  {
    id: "registration",
    title: "5. Registration Schedule & Fees",
    subtitle: "Controls automatic Early/Regular pricing transitions, Checkout availability, and USD fees.",
  },
  {
    id: "awards_sponsors",
    title: "6. Student Travel Awards & Sponsorship Contacts",
    subtitle: "Student grant amount, application deadlines, committee email, and sponsorship coordinator.",
  },
];

const PAGES_ALL_PUBLIC: WorkshopPageRef[] = [
  { label: "Home", href: "/" },
  { label: "Portal Overview", href: "/layout-portal" },
  { label: "Call for Papers", href: "/call-for-papers" },
  { label: "Registration", href: "/registration" },
  { label: "Accommodations", href: "/accommodations" },
  { label: "Student Awards", href: "/student-awards" },
  { label: "Sponsorship", href: "/corporate-sponsorship" },
  { label: "Contact", href: "/contact" },
];

export const WORKSHOP_FIELD_CATALOG: readonly WorkshopFieldMeta[] = [
  {
    key: "workshop_number",
    section: "identity",
    label: "Workshop Number",
    helpText: "Numeric workshop edition (e.g. 16).",
    controlType: "number",
    usedOnPages: [{ label: "Stripe Receipts", href: "/registration" }],
  },
  {
    key: "workshop_ordinal",
    section: "identity",
    label: "Workshop Ordinal",
    helpText: "Ordinal label such as '16th' or '17th'.",
    controlType: "text",
    usedOnPages: PAGES_ALL_PUBLIC.slice(0, 6),
  },
  {
    key: "workshop_year",
    section: "identity",
    label: "Workshop Year",
    helpText: "4-digit calendar year (e.g. 2027).",
    controlType: "text",
    usedOnPages: [{ label: "Home", href: "/" }, { label: "Registration", href: "/registration" }, { label: "Portal", href: "/layout-portal" }],
  },
  {
    key: "target_window",
    section: "identity",
    label: "Target Month & Year",
    helpText: "Public summary window (e.g. 'September 2027').",
    controlType: "text",
    usedOnPages: PAGES_ALL_PUBLIC.slice(0, 5),
  },
  {
    key: "cycle_stage",
    section: "identity",
    label: "Workshop Lifecycle Stage",
    helpText: "Controls Home status pill ('Save the Date', 'Open', 'Program Published', 'Concluded').",
    controlType: "select",
    usedOnPages: [{ label: "Home", href: "/" }, { label: "Student Awards", href: "/student-awards" }],
  },
  {
    key: "conference_start_date",
    section: "identity",
    label: "Workshop Start Date",
    helpText: "Pick the first conference day (or leave TBA).",
    controlType: "date",
    usedOnPages: [
      { label: "Portal Overview", href: "/layout-portal" },
      { label: "Registration", href: "/registration" },
      { label: "Schedule Builder", href: "/reviewer/schedule" },
    ],
  },
  {
    key: "conference_end_date",
    section: "identity",
    label: "Workshop Final Day",
    helpText: "Registration automatically closes at 11:59 PM on this final conference day.",
    controlType: "date",
    usedOnPages: [
      { label: "Registration", href: "/registration" },
      { label: "Portal Overview", href: "/layout-portal" },
      { label: "Schedule Builder", href: "/reviewer/schedule" },
    ],
  },
  {
    key: "exact_dates",
    section: "identity",
    label: "Formatted Workshop Dates Display",
    helpText: "Public display range (auto-built when calendar dates are picked, or type 'September 2027 (Exact Dates TBA)').",
    controlType: "text",
    usedOnPages: [{ label: "Portal Overview", href: "/layout-portal" }, { label: "Accommodations", href: "/accommodations" }, { label: "Contact", href: "/contact" }],
  },
  {
    key: "announcement_headline",
    section: "announcement",
    label: "Official Announcement Headline",
    helpText: "Shown in the Official Announcements card on the Workshop Portal.",
    controlType: "text",
    usedOnPages: [{ label: "Portal Overview", href: "/layout-portal" }],
  },
  {
    key: "announcement_body",
    section: "announcement",
    label: "Announcement Description",
    helpText: "1–3 sentence overview shared with attendees and embedded in search engine Event metadata.",
    controlType: "textarea",
    usedOnPages: [{ label: "Portal Overview", href: "/layout-portal" }, { label: "Google Event SEO", href: "/" }],
  },
  {
    key: "venue_confirmed",
    section: "venue",
    label: "Hotel Contract Signed / Venue Confirmed",
    helpText: "Turn ON only once the hotel name and city are ready for public display.",
    controlType: "boolean",
    usedOnPages: [{ label: "Home", href: "/" }, { label: "Accommodations", href: "/accommodations" }, { label: "Contact", href: "/contact" }],
  },
  {
    key: "venue_city_state",
    section: "venue",
    label: "Host City & State",
    helpText: "e.g. 'Virginia Beach, VA' (or 'Coastal Venue TBA').",
    controlType: "text",
    usedOnPages: [
      { label: "Home", href: "/" },
      { label: "Accommodations", href: "/accommodations" },
      { label: "Contact", href: "/contact" },
      { label: "Schedule Builder", href: "/reviewer/schedule" },
    ],
  },
  {
    key: "hotel_name",
    section: "venue",
    label: "Official Conference Hotel",
    helpText: "Property name displayed once Venue Confirmed is enabled.",
    controlType: "text",
    usedOnPages: [
      { label: "Accommodations", href: "/accommodations" },
      { label: "Contact", href: "/contact" },
      { label: "Registration", href: "/registration" },
      { label: "Schedule Builder", href: "/reviewer/schedule" },
    ],
  },
  {
    key: "hotel_address",
    section: "venue",
    label: "Hotel Street Address",
    helpText: "Full mailing address for travel planning.",
    controlType: "text",
    usedOnPages: [{ label: "Accommodations", href: "/accommodations" }, { label: "Contact", href: "/contact" }],
  },
  {
    key: "hotel_maps_url",
    section: "venue",
    label: "Google Maps Link",
    helpText: "Direct https://maps.google.com/... link to the hotel entrance.",
    controlType: "url",
    usedOnPages: [{ label: "Accommodations", href: "/accommodations" }, { label: "Contact", href: "/contact" }],
  },
  {
    key: "hotel_group_rate",
    section: "venue",
    label: "HEMS Group Room Rate",
    helpText: "e.g. '$149/night' (or 'TBA' until contract pricing is locked).",
    controlType: "text",
    usedOnPages: [{ label: "Accommodations", href: "/accommodations" }],
  },
  {
    key: "hotel_discount_window",
    section: "venue",
    label: "Group Rate Availability Window",
    helpText: "Dates when the negotiated group rate applies (e.g. 'Sept 11–18, 2027').",
    controlType: "text",
    usedOnPages: [{ label: "Accommodations", href: "/accommodations" }],
  },
  {
    key: "hotel_booking_cutoff",
    section: "venue",
    label: "Room Block Booking Cutoff",
    helpText: "Last date attendees can book inside the HEMS room block.",
    controlType: "date",
    usedOnPages: [{ label: "Accommodations", href: "/accommodations" }],
  },
  {
    key: "hotel_booking_url",
    section: "venue",
    label: "Hotel Group Booking Link",
    helpText: "Direct reservation URL activating the 'Book Hotel Room' button.",
    controlType: "url",
    usedOnPages: [{ label: "Accommodations", href: "/accommodations" }],
  },
  {
    key: "venue_session_room",
    section: "venue",
    label: "Plenary Technical Session Room",
    helpText: "Main single-track presentation ballroom/room name inside the conference venue (e.g. 'Ocean Grand Ballroom').",
    controlType: "text",
    usedOnPages: [
      { label: "Schedule Builder", href: "/reviewer/schedule" },
      { label: "Accommodations", href: "/accommodations" },
    ],
  },
  {
    key: "venue_foyer_room",
    section: "venue",
    label: "Foyer, Sponsor & Poster Area",
    helpText: "Space used for registration desk, breakfasts, coffee breaks, sponsors, and posters (e.g. 'Ocean Grand Foyer').",
    controlType: "text",
    usedOnPages: [{ label: "Schedule Builder", href: "/reviewer/schedule" }],
  },
  {
    key: "welcome_reception_time",
    section: "venue",
    label: "Day 1 Welcome Reception Time",
    helpText: "Evening Meet & Greet / early registration hours on travel arrival day (e.g. '6:00 p.m. – 8:00 p.m.').",
    controlType: "text",
    usedOnPages: [{ label: "Schedule Builder", href: "/reviewer/schedule" }],
  },
  {
    key: "welcome_reception_venue",
    section: "venue",
    label: "Welcome Reception Venue / Room",
    helpText: "Location of the Day 1 Meet & Greet / Welcome Reception (hotel foyer or nearby restaurant/venue).",
    controlType: "text",
    usedOnPages: [
      { label: "Schedule Builder", href: "/reviewer/schedule" },
      { label: "Accommodations", href: "/accommodations" },
    ],
  },
  {
    key: "dinner_day_time",
    section: "venue",
    label: "Workshop Dinner Evening & Time",
    helpText: "Evening and time window for the Official Workshop Banquet/Dinner (e.g. 'Wednesday • 6:30 p.m. – 9:30 p.m.').",
    controlType: "text",
    usedOnPages: [
      { label: "Schedule Builder", href: "/reviewer/schedule" },
      { label: "Registration", href: "/registration" },
    ],
  },
  {
    key: "dinner_venue_name",
    section: "venue",
    label: "Workshop Dinner Venue Name",
    helpText: "Restaurant, aquarium, pavilion, or hotel banquet hall hosting the official Workshop Dinner.",
    controlType: "text",
    usedOnPages: [
      { label: "Schedule Builder", href: "/reviewer/schedule" },
      { label: "Accommodations", href: "/accommodations" },
    ],
  },
  {
    key: "dinner_venue_address",
    section: "venue",
    label: "Workshop Dinner Address & Directions",
    helpText: "Street address, pier/waterfront directions, or walking/shuttle distance from the hotel.",
    controlType: "text",
    usedOnPages: [{ label: "Schedule Builder", href: "/reviewer/schedule" }],
  },
  {
    key: "dinner_venue_url",
    section: "venue",
    label: "Workshop Dinner Venue / Map Link",
    helpText: "Optional https:// restaurant website or Google Maps URL for attendees.",
    controlType: "url",
    usedOnPages: [{ label: "Schedule Builder", href: "/reviewer/schedule" }],
  },
  {
    key: "dinner_plan_notes",
    section: "venue",
    label: "Workshop Dinner Logistics & Guest Plan",
    helpText: "Included attendee dinner details, guest ticket info, dietary notes, shuttle times, or sponsor credit.",
    controlType: "textarea",
    usedOnPages: [
      { label: "Schedule Builder", href: "/reviewer/schedule" },
      { label: "Registration", href: "/registration" },
    ],
  },
  {
    key: "cfp_open",
    section: "cfp",
    label: "Accepting Abstract Submissions",
    helpText: "Turn ON to display the green 'Accepting Abstracts' badge on Call for Papers.",
    controlType: "boolean",
    usedOnPages: [{ label: "Call for Papers", href: "/call-for-papers" }, { label: "Abstract Portal", href: "/abstract-submission" }],
  },
  {
    key: "cfp_abstract_deadline",
    section: "cfp",
    label: "Abstract Submission Deadline Date",
    helpText: "Concrete calendar date automatically locks new edits/withdrawals once passed.",
    controlType: "date",
    usedOnPages: [{ label: "Call for Papers", href: "/call-for-papers" }, { label: "Abstract Portal", href: "/abstract-submission" }],
  },
  {
    key: "cfp_abstract_deadline_time",
    section: "cfp",
    label: "Abstract Cutoff Clock Time",
    helpText: "Cutoff clock time on the deadline date (default '11:59 PM').",
    controlType: "text",
    usedOnPages: [{ label: "Abstract Portal", href: "/abstract-submission" }, { label: "Portal Overview", href: "/layout-portal" }],
  },
  {
    key: "cfp_abstract_deadline_timezone",
    section: "cfp",
    label: "Abstract Cutoff Timezone",
    helpText: "Official timezone (e.g. 'EDT (UTC-04:00)', 'AoE', 'UTC').",
    controlType: "text",
    usedOnPages: [{ label: "Abstract Portal", href: "/abstract-submission" }, { label: "Call for Papers", href: "/call-for-papers" }],
  },
  {
    key: "cfp_notification_date",
    section: "cfp",
    label: "Author Decision Notification Date",
    helpText: "Target date when authors receive oral/poster acceptance emails.",
    controlType: "date",
    usedOnPages: [{ label: "Call for Papers", href: "/call-for-papers" }],
  },
  {
    key: "registration_mode",
    section: "registration",
    label: "Registration Activation Mode",
    helpText: "Choose automatic schedule by dates, manual force-open, or emergency pause.",
    controlType: "select",
    usedOnPages: [{ label: "Registration", href: "/registration" }, { label: "Portal Overview", href: "/layout-portal" }],
  },
  {
    key: "reg_opening_date",
    section: "registration",
    label: "Registration Opens Date",
    helpText: "Checkout opens automatically at 12:00 AM in the registration timezone on this date.",
    controlType: "date",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_early_bird_closes",
    section: "registration",
    label: "Early-Bird Pricing Cutoff Date",
    helpText: "Pricing switches cleanly from Early to Regular rates at 11:59 PM on this date.",
    controlType: "date",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_final_cutoff",
    section: "registration",
    label: "Final Registration Cutoff Label",
    helpText: "Reference closing date displayed on registration schedule cards.",
    controlType: "date",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_refund_cutoff",
    section: "registration",
    label: "Cancellation Refund Cutoff Date",
    helpText: "Last day attendees may request a refund.",
    controlType: "date",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_timezone",
    section: "registration",
    label: "Registration Schedule Timezone",
    helpText: "Timezone governing midnight opening & early-bird cutoffs.",
    controlType: "text",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_student_early_fee",
    section: "registration",
    label: "Student Early Fee (USD)",
    helpText: "Discounted student tier rate during the early-bird window.",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }, { label: "Stripe Checkout", href: "/registration" }],
  },
  {
    key: "reg_professional_early_fee",
    section: "registration",
    label: "Regular Professional Early Fee (USD)",
    helpText: "Discounted academic/industry rate during the early-bird window.",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }, { label: "Stripe Checkout", href: "/registration" }],
  },
  {
    key: "reg_sponsor_early_fee",
    section: "registration",
    label: "Corporate Sponsor Early Fee (USD)",
    helpText: "Early corporate sponsor package rate (usually $1,350).",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_student_fee",
    section: "registration",
    label: "Student Standard Fee (USD)",
    helpText: "Standard graduate student registration fee.",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_professional_fee",
    section: "registration",
    label: "Regular Professional Standard Fee (USD)",
    helpText: "Standard academic, government, and industry attendee fee.",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_sponsor_fee",
    section: "registration",
    label: "Corporate Sponsor Full Package (USD)",
    helpText: "Exhibition booth + 1 attendee registration rate (usually $1,350).",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }, { label: "Sponsorship", href: "/corporate-sponsorship" }],
  },
  {
    key: "reg_guest_dinner_fee",
    section: "registration",
    label: "Wednesday Guest Dinner Fee (USD)",
    helpText: "Per-guest add-on fee for Wednesday Workshop Banquet guests.",
    controlType: "currency",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "reg_enable_student_fund_donation",
    section: "registration",
    label: "Allow Optional Student Fund Gift at Checkout",
    helpText: "Shows an optional tax-deductible Student Travel Fund contribution during checkout.",
    controlType: "boolean",
    usedOnPages: [{ label: "Registration", href: "/registration" }],
  },
  {
    key: "student_award_amount",
    section: "awards_sponsors",
    label: "Proposed Student Travel Award (USD)",
    helpText: "Grant value displayed across Home, Student Awards, and Sponsorship pages.",
    controlType: "currency",
    usedOnPages: [{ label: "Home", href: "/" }, { label: "Student Awards", href: "/student-awards" }, { label: "Sponsorship", href: "/corporate-sponsorship" }],
  },
  {
    key: "student_award_deadline",
    section: "awards_sponsors",
    label: "Student Award Application Deadline",
    helpText: "Calendar deadline shown on Student Awards page & printable departmental flyer.",
    controlType: "date",
    usedOnPages: [{ label: "Student Awards", href: "/student-awards" }],
  },
  {
    key: "student_award_extended",
    section: "awards_sponsors",
    label: "Show 'Deadline Extended' Highlight Badge",
    helpText: "Turn ON if the committee extends the student award deadline.",
    controlType: "boolean",
    usedOnPages: [{ label: "Student Awards", href: "/student-awards" }],
  },
  {
    key: "student_award_email",
    section: "awards_sponsors",
    label: "Student Awards Committee Email",
    helpText: "Submission address used for application email links.",
    controlType: "email",
    usedOnPages: [{ label: "Student Awards", href: "/student-awards" }],
  },
  {
    key: "sponsor_coordinator_name",
    section: "awards_sponsors",
    label: "Corporate Sponsorship Coordinator",
    helpText: "Displayed on Corporate Sponsorship & Contact pages.",
    controlType: "text",
    usedOnPages: [{ label: "Sponsorship", href: "/corporate-sponsorship" }, { label: "Contact", href: "/contact" }],
  },
  {
    key: "sponsor_coordinator_email",
    section: "awards_sponsors",
    label: "Sponsorship Coordinator Email",
    helpText: "Official @hems-workshop.org sponsorship contact address.",
    controlType: "email",
    usedOnPages: [{ label: "Sponsorship", href: "/corporate-sponsorship" }, { label: "Contact", href: "/contact" }],
  },
];

export const WORKSHOP_FIELD_MAP: Record<string, WorkshopFieldMeta> = Object.fromEntries(
  WORKSHOP_FIELD_CATALOG.map((item) => [item.key, item])
);

function resolveString(val: unknown, fallback: string, allowEmpty = false): string {
  if (typeof val !== "string") {
    return val === undefined || val === null ? fallback : String(val).trim() || fallback;
  }
  const trimmed = val.trim();
  if (!trimmed) return allowEmpty ? "" : fallback;
  return trimmed;
}

function normalizeUrlValue(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/**
 * Normalizes any Firestore, JSON backup, or legacy snapshot cleanly into the canonical 53-key schema.
 */
export function normalizeWorkshopConfig(
  raw: unknown,
  baseConfig: UpcomingWorkshopConfig = DEFAULT_UPCOMING_WORKSHOP
): UpcomingWorkshopConfig {
  if (!raw || typeof raw !== "object") {
    return { ...baseConfig };
  }
  const src = raw as Record<string, unknown>;

  const rawStage = String(src.cycle_stage ?? baseConfig.cycle_stage).trim().toLowerCase();
  const parsedNum = Number.parseInt(String(src.workshop_number ?? baseConfig.workshop_number), 10);

  let resolvedMode: RegistrationMode = baseConfig.registration_mode;
  const rawMode = String(src.registration_mode ?? "").trim().toLowerCase();
  if (isValidRegistrationMode(rawMode)) {
    resolvedMode = rawMode;
  } else if ("reg_force_closed" in src || "registration_open" in src) {
    if (parseBooleanCell(src.reg_force_closed, false)) {
      resolvedMode = "paused_closed";
    } else if (parseBooleanCell(src.registration_open, false)) {
      resolvedMode = "open_manual";
    } else {
      resolvedMode = "auto_schedule";
    }
  }

  const openingCandidate =
    src.reg_opening_date ?? src.registration_opening_date ?? src.reg_early_bird_opens;

  const rawSponsorEmail = resolveString(
    src.sponsor_coordinator_email,
    baseConfig.sponsor_coordinator_email
  );
  const cleanSponsorEmail =
    rawSponsorEmail.toLowerCase() === "rtshort00@gmail.com"
      ? "tim.short@hems-workshop.org"
      : rawSponsorEmail;

  return {
    workshop_number: Number.isFinite(parsedNum) && parsedNum > 0 ? parsedNum : baseConfig.workshop_number,
    workshop_ordinal: resolveString(src.workshop_ordinal, baseConfig.workshop_ordinal),
    workshop_year: resolveString(src.workshop_year, baseConfig.workshop_year),
    target_window: resolveString(src.target_window, baseConfig.target_window),
    cycle_stage: isValidCycleStage(rawStage) ? rawStage : baseConfig.cycle_stage,
    exact_dates: resolveString(src.exact_dates, baseConfig.exact_dates),
    conference_start_date: resolveString(src.conference_start_date, baseConfig.conference_start_date),
    conference_end_date: resolveString(src.conference_end_date, baseConfig.conference_end_date),
    announcement_headline: resolveString(src.announcement_headline, baseConfig.announcement_headline),
    announcement_body: resolveString(src.announcement_body, baseConfig.announcement_body),
    venue_confirmed: parseBooleanCell(src.venue_confirmed, baseConfig.venue_confirmed),
    venue_city_state: resolveString(src.venue_city_state, baseConfig.venue_city_state),
    hotel_name: resolveString(src.hotel_name, baseConfig.hotel_name),
    hotel_address: resolveString(src.hotel_address, baseConfig.hotel_address),
    hotel_maps_url:
      src.hotel_maps_url !== undefined
        ? normalizeUrlValue(src.hotel_maps_url)
        : baseConfig.hotel_maps_url,
    hotel_group_rate: resolveString(src.hotel_group_rate, baseConfig.hotel_group_rate),
    hotel_discount_window: resolveString(src.hotel_discount_window, baseConfig.hotel_discount_window),
    hotel_booking_cutoff: resolveString(src.hotel_booking_cutoff, baseConfig.hotel_booking_cutoff),
    hotel_booking_url:
      src.hotel_booking_url !== undefined
        ? normalizeUrlValue(src.hotel_booking_url)
        : baseConfig.hotel_booking_url,
    venue_session_room: resolveString(src.venue_session_room, baseConfig.venue_session_room),
    venue_foyer_room: resolveString(src.venue_foyer_room, baseConfig.venue_foyer_room),
    welcome_reception_time: resolveString(
      src.welcome_reception_time,
      baseConfig.welcome_reception_time
    ),
    welcome_reception_venue: resolveString(
      src.welcome_reception_venue,
      baseConfig.welcome_reception_venue
    ),
    dinner_day_time: resolveString(src.dinner_day_time, baseConfig.dinner_day_time),
    dinner_venue_name: resolveString(src.dinner_venue_name, baseConfig.dinner_venue_name),
    dinner_venue_address: resolveString(src.dinner_venue_address, baseConfig.dinner_venue_address),
    dinner_venue_url:
      src.dinner_venue_url !== undefined
        ? normalizeUrlValue(src.dinner_venue_url)
        : baseConfig.dinner_venue_url,
    dinner_plan_notes: resolveString(src.dinner_plan_notes, baseConfig.dinner_plan_notes),
    cfp_open: parseBooleanCell(src.cfp_open, baseConfig.cfp_open),
    cfp_abstract_deadline: resolveString(src.cfp_abstract_deadline, baseConfig.cfp_abstract_deadline),
    cfp_abstract_deadline_time: resolveString(
      src.cfp_abstract_deadline_time,
      baseConfig.cfp_abstract_deadline_time
    ),
    cfp_abstract_deadline_timezone: resolveString(
      src.cfp_abstract_deadline_timezone,
      baseConfig.cfp_abstract_deadline_timezone
    ),
    cfp_notification_date: resolveString(src.cfp_notification_date, baseConfig.cfp_notification_date),
    registration_mode: resolvedMode,
    reg_opening_date: resolveString(openingCandidate, baseConfig.reg_opening_date),
    reg_timezone: resolveString(src.reg_timezone, baseConfig.reg_timezone),
    reg_early_bird_closes: resolveString(
      src.reg_early_bird_closes ?? src.early_registration_date,
      baseConfig.reg_early_bird_closes
    ),
    reg_final_cutoff: resolveString(src.reg_final_cutoff, baseConfig.reg_final_cutoff),
    reg_refund_cutoff: resolveString(src.reg_refund_cutoff, baseConfig.reg_refund_cutoff),
    reg_student_early_fee: resolveString(src.reg_student_early_fee, baseConfig.reg_student_early_fee),
    reg_professional_early_fee: resolveString(
      src.reg_professional_early_fee,
      baseConfig.reg_professional_early_fee
    ),
    reg_sponsor_early_fee: resolveString(src.reg_sponsor_early_fee, baseConfig.reg_sponsor_early_fee),
    reg_student_fee: resolveString(src.reg_student_fee, baseConfig.reg_student_fee),
    reg_professional_fee: resolveString(src.reg_professional_fee, baseConfig.reg_professional_fee),
    reg_sponsor_fee: resolveString(src.reg_sponsor_fee, baseConfig.reg_sponsor_fee),
    reg_guest_dinner_fee: resolveString(src.reg_guest_dinner_fee, baseConfig.reg_guest_dinner_fee),
    reg_enable_student_fund_donation: parseBooleanCell(
      src.reg_enable_student_fund_donation,
      baseConfig.reg_enable_student_fund_donation
    ),
    student_award_amount: resolveString(src.student_award_amount, baseConfig.student_award_amount),
    student_award_deadline: resolveString(
      src.student_award_deadline,
      baseConfig.student_award_deadline
    ),
    student_award_extended: parseBooleanCell(
      src.student_award_extended,
      baseConfig.student_award_extended
    ),
    student_award_email: resolveString(src.student_award_email, baseConfig.student_award_email),
    sponsor_coordinator_name: resolveString(
      src.sponsor_coordinator_name,
      baseConfig.sponsor_coordinator_name
    ),
    sponsor_coordinator_email: cleanSponsorEmail,
  };
}

/**
 * RFC-4180 compliant CSV tokenizer supporting quoted commas (e.g. "$1,500.00"),
 * escaped double quotes (""), and multi-line quoted cells.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (ch === "\r" && next === "\n") {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Parses an exported workshop backup CSV (`field_key`, `value`) into the canonical 53-key schema.
 */
export function parseWorkshopSheetCsv(
  csvText: string,
  baseConfig: UpcomingWorkshopConfig = DEFAULT_UPCOMING_WORKSHOP
): UpcomingWorkshopConfig {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { ...baseConfig };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const keyIdx = headers.indexOf("field_key");
  const valIdx = headers.indexOf("value");

  if (keyIdx === -1 || valIdx === -1) {
    return { ...baseConfig };
  }

  const rawObj: Record<string, string> = {};
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= keyIdx) continue;
    const rawKey = (row[keyIdx] || "").trim();
    if (!rawKey || rawKey.startsWith("#")) continue;
    const val = row.length > valIdx ? (row[valIdx] ?? "").trim() : "";
    rawObj[rawKey] = val;
  }

  return normalizeWorkshopConfig(rawObj, baseConfig);
}

export function getStaticUpcomingWorkshop(): UpcomingWorkshopConfig {
  return DEFAULT_UPCOMING_WORKSHOP;
}

export interface AbstractDeadlineEvaluation {
  dateLabel: string;
  timeLabel: string;
  timezoneLabel: string;
  formattedDeadline: string;
  deadlineEpochMs: number | null;
  deadlineIsoUtc: string | null;
  hasConcreteDate: boolean;
  isPastDeadline: boolean;
}

const MONTH_INDEX_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const FULL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const TZ_ABBREV_OFFSET_MINUTES: Record<string, number> = {
  AOE: -720,
  HST: -600,
  AKST: -540,
  AKDT: -480,
  PST: -480,
  PDT: -420,
  MST: -420,
  MDT: -360,
  CST: -360,
  CDT: -300,
  EST: -300,
  EDT: -240,
  AST: -240,
  ADT: -180,
  UTC: 0,
  GMT: 0,
  BST: 60,
  CET: 60,
  CEST: 120,
  JST: 540,
};

const GENERIC_US_IANA_MAP: Record<string, string> = {
  ET: "America/New_York",
  CT: "America/Chicago",
  MT: "America/Denver",
  PT: "America/Los_Angeles",
};

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

export function parseDeadlineCalendarDate(
  rawDate: string
): { year: number; month: number; day: number } | null {
  const cleaned = String(rawDate || "").trim();
  if (!cleaned || /\b(tba|tbd|to be announced|to be determined)\b/i.test(cleaned)) {
    return null;
  }

  const isoMatch = /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/.exec(cleaned);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  const slashMatch = /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/.exec(cleaned);
  if (slashMatch) {
    const month = Number.parseInt(slashMatch[1], 10);
    const day = Number.parseInt(slashMatch[2], 10);
    const year = Number.parseInt(slashMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  const monthFirstMatch =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (monthFirstMatch) {
    const month = MONTH_INDEX_MAP[monthFirstMatch[1].toLowerCase()];
    const day = Number.parseInt(monthFirstMatch[2], 10);
    const year = Number.parseInt(monthFirstMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  const dayFirstMatch =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (dayFirstMatch) {
    const day = Number.parseInt(dayFirstMatch[1], 10);
    const month = MONTH_INDEX_MAP[dayFirstMatch[2].toLowerCase()];
    const year = Number.parseInt(dayFirstMatch[3], 10);
    if (month && isValidCalendarDate(year, month, day)) {
      return { year, month, day };
    }
  }

  return null;
}

/**
 * Converts a stored human date (e.g. "September 13, 2027") into ISO YYYY-MM-DD for <input type="date">.
 */
export function formatDateInputIso(raw: string): string {
  const cal = parseDeadlineCalendarDate(raw);
  if (!cal) return "";
  return `${cal.year}-${String(cal.month).padStart(2, "0")}-${String(cal.day).padStart(2, "0")}`;
}

/**
 * Converts an ISO YYYY-MM-DD date from <input type="date"> into human-readable "September 13, 2027".
 */
export function formatHumanDateFromIso(iso: string): string {
  const cal = parseDeadlineCalendarDate(iso);
  if (!cal) return "";
  return `${FULL_MONTH_NAMES[cal.month - 1]} ${cal.day}, ${cal.year}`;
}

/**
 * Builds a clean multi-day conference date range display string from two ISO dates.
 */
export function formatDateRangeDisplay(startIso: string, endIso: string): string {
  const s = parseDeadlineCalendarDate(startIso);
  const e = parseDeadlineCalendarDate(endIso);
  if (!s && !e) return "";
  if (s && !e) return formatHumanDateFromIso(startIso);
  if (!s && e) return formatHumanDateFromIso(endIso);
  if (!s || !e) return "";

  if (s.year === e.year && s.month === e.month && s.day === e.day) {
    return `${FULL_MONTH_NAMES[s.month - 1]} ${s.day}, ${s.year}`;
  }
  if (s.year === e.year && s.month === e.month) {
    return `${FULL_MONTH_NAMES[s.month - 1]} ${s.day}–${e.day}, ${s.year}`;
  }
  if (s.year === e.year) {
    return `${FULL_MONTH_NAMES[s.month - 1]} ${s.day} – ${FULL_MONTH_NAMES[e.month - 1]} ${e.day}, ${s.year}`;
  }
  return `${FULL_MONTH_NAMES[s.month - 1]} ${s.day}, ${s.year} – ${FULL_MONTH_NAMES[e.month - 1]} ${e.day}, ${e.year}`;
}

function parseDeadlineClockTime(rawTime: string): {
  hour: number;
  minute: number;
  second: number;
  ms: number;
} {
  const cleaned = rawTime.trim().toLowerCase();
  if (cleaned === "noon") {
    return { hour: 12, minute: 0, second: 59, ms: 999 };
  }
  if (cleaned === "midnight") {
    return { hour: 23, minute: 59, second: 59, ms: 999 };
  }

  const match = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(rawTime);
  if (!match) {
    return { hour: 23, minute: 59, second: 59, ms: 999 };
  }

  let hour = Number.parseInt(match[1], 10);
  const minute = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
  const hasExplicitSeconds = Boolean(match[3]);
  const second = hasExplicitSeconds
    ? Math.min(59, Math.max(0, Number.parseInt(match[3], 10)))
    : 59;
  const meridiem = match[4]?.toLowerCase();

  if (meridiem === "am") {
    if (hour === 12) hour = 0;
  } else if (meridiem === "pm") {
    if (hour < 12) hour += 12;
  }

  if (hour < 0 || hour > 23) {
    return { hour: 23, minute: 59, second: 59, ms: 999 };
  }

  return { hour, minute, second, ms: 999 };
}

function resolveIanaOffsetMinutes(ianaZone: string, refUtcMs: number): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date(refUtcMs));
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
    if (tzPart === "GMT" || tzPart === "UTC") return 0;
    const m = /(?:GMT|UTC)\s*([+-])\s*(\d{1,2})(?::(\d{2}))?/i.exec(tzPart);
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    const hrs = Number.parseInt(m[2], 10);
    const mins = m[3] ? Number.parseInt(m[3], 10) : 0;
    return sign * (hrs * 60 + mins);
  } catch {
    return null;
  }
}

function parseTimezoneOffsetMinutes(rawTz: string, refUtcMs: number): number {
  const cleaned = rawTz.trim();
  if (!cleaned) return 0;

  const explicitUtcMatch =
    /(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?|\(([+-])(\d{2}):?(\d{2})\)|([+-])(\d{2}):(\d{2})$/i.exec(
      cleaned
    );
  if (explicitUtcMatch) {
    const signChar =
      explicitUtcMatch[1] || explicitUtcMatch[4] || explicitUtcMatch[7];
    const hourStr =
      explicitUtcMatch[2] || explicitUtcMatch[5] || explicitUtcMatch[8];
    const minStr =
      explicitUtcMatch[3] || explicitUtcMatch[6] || explicitUtcMatch[9];
    const sign = signChar === "-" ? -1 : 1;
    const hrs = Number.parseInt(hourStr, 10);
    const mins = minStr ? Number.parseInt(minStr, 10) : 0;
    return sign * (hrs * 60 + mins);
  }

  const tokens = cleaned.toUpperCase().split(/[\s,()[\]/]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok in TZ_ABBREV_OFFSET_MINUTES) {
      return TZ_ABBREV_OFFSET_MINUTES[tok];
    }
    if (tok in GENERIC_US_IANA_MAP) {
      const ianaOffset = resolveIanaOffsetMinutes(GENERIC_US_IANA_MAP[tok], refUtcMs);
      if (ianaOffset !== null) return ianaOffset;
    }
  }

  const directIanaMatch = /[A-Za-z_]+\/[A-Za-z0-9_+-]+/.exec(cleaned);
  if (directIanaMatch) {
    const ianaOffset = resolveIanaOffsetMinutes(directIanaMatch[0], refUtcMs);
    if (ianaOffset !== null) return ianaOffset;
  }

  return 0;
}

export function formatAbstractDeadlineDisplay(
  workshop: Pick<
    UpcomingWorkshopConfig,
    | "cfp_abstract_deadline"
    | "cfp_abstract_deadline_time"
    | "cfp_abstract_deadline_timezone"
  >
): string {
  const dateLabel = (workshop.cfp_abstract_deadline || "").trim() || "Summer 2027 (TBA)";
  const timeLabel = (workshop.cfp_abstract_deadline_time || "").trim() || "11:59 PM";
  const timezoneLabel =
    (workshop.cfp_abstract_deadline_timezone || "").trim() || "EDT (UTC-04:00)";

  const alreadyHasClock = /\b\d{1,2}:\d{2}\b/.test(dateLabel);
  if (alreadyHasClock) {
    const hasTz =
      /\b(UTC|GMT|EDT|EST|CDT|CST|MDT|MST|PDT|PST|AOE|ET|CT|MT|PT)\b/i.test(
        dateLabel
      ) || /[A-Za-z_]+\/[A-Za-z_]+/.test(dateLabel);
    return hasTz ? dateLabel : `${dateLabel} ${timezoneLabel}`;
  }

  const hasConcreteDate = parseDeadlineCalendarDate(dateLabel) !== null;
  return hasConcreteDate
    ? `${dateLabel} at ${timeLabel} ${timezoneLabel}`
    : `${dateLabel} • ${timeLabel} ${timezoneLabel}`;
}

export function evaluateAbstractDeadline(
  workshop: Pick<
    UpcomingWorkshopConfig,
    | "cfp_abstract_deadline"
    | "cfp_abstract_deadline_time"
    | "cfp_abstract_deadline_timezone"
  >,
  nowMs: number = Date.now()
): AbstractDeadlineEvaluation {
  const dateLabel = (workshop.cfp_abstract_deadline || "").trim() || "Summer 2027 (TBA)";
  const timeLabel = (workshop.cfp_abstract_deadline_time || "").trim() || "11:59 PM";
  const timezoneLabel =
    (workshop.cfp_abstract_deadline_timezone || "").trim() || "EDT (UTC-04:00)";
  const formattedDeadline = formatAbstractDeadlineDisplay({
    cfp_abstract_deadline: dateLabel,
    cfp_abstract_deadline_time: timeLabel,
    cfp_abstract_deadline_timezone: timezoneLabel,
  });

  const parsedDate = parseDeadlineCalendarDate(dateLabel);
  if (!parsedDate) {
    return {
      dateLabel,
      timeLabel,
      timezoneLabel,
      formattedDeadline,
      deadlineEpochMs: null,
      deadlineIsoUtc: null,
      hasConcreteDate: false,
      isPastDeadline: false,
    };
  }

  const inlineTimeMatch = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(dateLabel);
  const parsedTime = parseDeadlineClockTime(
    inlineTimeMatch ? inlineTimeMatch[0] : timeLabel
  );

  const wallClockUtcMs = Date.UTC(
    parsedDate.year,
    parsedDate.month - 1,
    parsedDate.day,
    parsedTime.hour,
    parsedTime.minute,
    parsedTime.second,
    parsedTime.ms
  );

  const offsetMinutes = parseTimezoneOffsetMinutes(timezoneLabel, wallClockUtcMs);
  const deadlineEpochMs = wallClockUtcMs - offsetMinutes * 60_000;

  return {
    dateLabel,
    timeLabel,
    timezoneLabel,
    formattedDeadline,
    deadlineEpochMs,
    deadlineIsoUtc: new Date(deadlineEpochMs).toISOString(),
    hasConcreteDate: true,
    isPastDeadline: nowMs > deadlineEpochMs,
  };
}

export type RegistrationLifecyclePhase =
  | "unscheduled"
  | "before_opening"
  | "early_bird"
  | "regular"
  | "concluded_closed"
  | "force_closed";

export interface CalendarDateValue {
  year: number;
  month: number;
  day: number;
}

export interface RegistrationActiveFees {
  pricingWindow: "early_bird" | "regular";
  studentCents: number;
  professionalCents: number;
  sponsorCents: number;
  studentEarlyCents: number;
  professionalEarlyCents: number;
  sponsorEarlyCents: number;
  studentRegularCents: number;
  professionalRegularCents: number;
  sponsorRegularCents: number;
  guestDinnerCents: number;
  studentLabel: string;
  professionalLabel: string;
  sponsorLabel: string;
  guestDinnerLabel: string;
  hasEarlyBirdDiscount: boolean;
}

export interface RegistrationScheduleEvaluation {
  phase: RegistrationLifecyclePhase;
  isOpen: boolean;
  isEarlyBirdActive: boolean;
  statusBadgeLabel: string;
  timezoneLabel: string;
  openingDateLabel: string;
  earlyBirdCloseDateLabel: string;
  conferenceEndDateLabel: string;
  openEpochMs: number | null;
  earlyBirdCloseEpochMs: number | null;
  conferenceEndEpochMs: number | null;
  activeFees: RegistrationActiveFees;
}

export function parseCurrencyToCents(raw: string, fallbackCents: number): number {
  const cleaned = String(raw || "").replace(/[^0-9.]/g, "");
  if (!cleaned) return fallbackCents;
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return fallbackCents;
  return Math.round(parsed * 100);
}

export function formatCentsUsd(cents: number): string {
  const dollars = cents / 100;
  const hasFraction = cents % 100 !== 0;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function parseConferenceDateRange(raw: string): {
  start: CalendarDateValue | null;
  end: CalendarDateValue | null;
} {
  const cleaned = String(raw || "")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || /\b(tba|tbd|to be announced|to be determined)\b/i.test(cleaned)) {
    return { start: null, end: null };
  }

  const sameMonthMatch =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*-\s*(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (sameMonthMatch) {
    const month = MONTH_INDEX_MAP[sameMonthMatch[1].toLowerCase()];
    const startDay = Number.parseInt(sameMonthMatch[2], 10);
    const endDay = Number.parseInt(sameMonthMatch[3], 10);
    const year = Number.parseInt(sameMonthMatch[4], 10);
    if (
      month &&
      isValidCalendarDate(year, month, startDay) &&
      isValidCalendarDate(year, month, endDay)
    ) {
      return {
        start: { year, month, day: startDay },
        end: { year, month, day: endDay },
      };
    }
  }

  const crossMonthMatch =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*-\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (crossMonthMatch) {
    const m1 = MONTH_INDEX_MAP[crossMonthMatch[1].toLowerCase()];
    const d1 = Number.parseInt(crossMonthMatch[2], 10);
    const m2 = MONTH_INDEX_MAP[crossMonthMatch[3].toLowerCase()];
    const d2 = Number.parseInt(crossMonthMatch[4], 10);
    const year = Number.parseInt(crossMonthMatch[5], 10);
    if (m1 && m2 && isValidCalendarDate(year, m1, d1) && isValidCalendarDate(year, m2, d2)) {
      return {
        start: { year, month: m1, day: d1 },
        end: { year, month: m2, day: d2 },
      };
    }
  }

  const dayFirstRange =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s*-\s*(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(20\d{2})\b/i.exec(
      cleaned
    );
  if (dayFirstRange) {
    const d1 = Number.parseInt(dayFirstRange[1], 10);
    const d2 = Number.parseInt(dayFirstRange[2], 10);
    const month = MONTH_INDEX_MAP[dayFirstRange[3].toLowerCase()];
    const year = Number.parseInt(dayFirstRange[4], 10);
    if (month && isValidCalendarDate(year, month, d1) && isValidCalendarDate(year, month, d2)) {
      return {
        start: { year, month, day: d1 },
        end: { year, month, day: d2 },
      };
    }
  }

  const splitParts = cleaned.split(/\s+(?:to|-)\s+/i);
  if (splitParts.length === 2) {
    const start = parseDeadlineCalendarDate(splitParts[0]);
    const end = parseDeadlineCalendarDate(splitParts[1]);
    if (start && end) {
      return { start, end };
    }
  }

  const single = parseDeadlineCalendarDate(cleaned);
  return { start: single, end: single };
}

function computeZonedWallClockEpochMs(
  cal: CalendarDateValue,
  time: { hour: number; minute: number; second: number; ms: number },
  timezoneLabel: string
): number {
  const wallClockUtcMs = Date.UTC(
    cal.year,
    cal.month - 1,
    cal.day,
    time.hour,
    time.minute,
    time.second,
    time.ms
  );
  const offsetMinutes = parseTimezoneOffsetMinutes(timezoneLabel, wallClockUtcMs);
  return wallClockUtcMs - offsetMinutes * 60_000;
}

export function evaluateRegistrationSchedule(
  workshop: UpcomingWorkshopConfig,
  nowMs: number = Date.now()
): RegistrationScheduleEvaluation {
  const timezoneLabel =
    (workshop.reg_timezone || workshop.cfp_abstract_deadline_timezone || "").trim() ||
    "EDT (UTC-04:00)";

  const openingDateLabel = (workshop.reg_opening_date || "").trim() || "Spring 2027 (TBA)";
  const earlyBirdCloseDateLabel =
    (workshop.reg_early_bird_closes || "").trim() || "Summer 2027 (TBA)";

  const parsedRange = parseConferenceDateRange(workshop.exact_dates);
  const explicitEndDate = parseDeadlineCalendarDate(workshop.conference_end_date);
  const cutoffDateFallback = parseDeadlineCalendarDate(workshop.reg_final_cutoff);
  const conferenceEndCal = explicitEndDate || parsedRange.end || cutoffDateFallback;

  const conferenceEndDateLabel =
    (workshop.conference_end_date &&
    !/\b(tba|tbd|to be announced)\b/i.test(workshop.conference_end_date)
      ? workshop.conference_end_date.trim()
      : "") ||
    (workshop.exact_dates && !/\b(tba|tbd|to be announced)\b/i.test(workshop.exact_dates)
      ? workshop.exact_dates.trim()
      : "") ||
    (workshop.reg_final_cutoff || "").trim() ||
    "September 2027 (TBA)";

  const openingCal = parseDeadlineCalendarDate(workshop.reg_opening_date);
  let openEpochMs: number | null = null;
  if (openingCal) {
    const inlineTimeMatch = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(
      openingDateLabel
    );
    const openTime = inlineTimeMatch
      ? parseDeadlineClockTime(inlineTimeMatch[0])
      : { hour: 0, minute: 0, second: 0, ms: 0 };
    openEpochMs = computeZonedWallClockEpochMs(openingCal, openTime, timezoneLabel);
  }

  const earlyCloseCal = parseDeadlineCalendarDate(earlyBirdCloseDateLabel);
  let earlyBirdCloseEpochMs: number | null = null;
  if (earlyCloseCal) {
    const inlineTimeMatch = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i.exec(
      earlyBirdCloseDateLabel
    );
    const closeTime = inlineTimeMatch
      ? parseDeadlineClockTime(inlineTimeMatch[0])
      : { hour: 23, minute: 59, second: 59, ms: 999 };
    earlyBirdCloseEpochMs = computeZonedWallClockEpochMs(
      earlyCloseCal,
      closeTime,
      timezoneLabel
    );
  }

  let conferenceEndEpochMs: number | null = null;
  if (conferenceEndCal) {
    conferenceEndEpochMs = computeZonedWallClockEpochMs(
      conferenceEndCal,
      { hour: 23, minute: 59, second: 59, ms: 999 },
      timezoneLabel
    );
  }

  let phase: RegistrationLifecyclePhase = "unscheduled";
  let isOpen = false;
  let pricingWindow: "early_bird" | "regular" = "regular";
  let statusBadgeLabel = `Opening ${workshop.workshop_year || "2027"}`;

  if (workshop.registration_mode === "paused_closed") {
    phase = "force_closed";
    isOpen = false;
    statusBadgeLabel = "Registration Paused";
  } else if (conferenceEndEpochMs !== null && nowMs > conferenceEndEpochMs) {
    phase = "concluded_closed";
    isOpen = false;
    statusBadgeLabel = "Closed (Workshop Ended)";
  } else if (workshop.registration_mode === "open_manual") {
    isOpen = true;
    if (earlyBirdCloseEpochMs !== null && nowMs <= earlyBirdCloseEpochMs) {
      phase = "early_bird";
      pricingWindow = "early_bird";
      statusBadgeLabel = "Early Registration Open";
    } else {
      phase = "regular";
      pricingWindow = "regular";
      statusBadgeLabel = "Registration Open";
    }
  } else if (openEpochMs !== null) {
    if (nowMs < openEpochMs) {
      phase = "before_opening";
      isOpen = false;
      statusBadgeLabel = `Opens ${openingDateLabel}`;
    } else if (earlyBirdCloseEpochMs !== null && nowMs <= earlyBirdCloseEpochMs) {
      phase = "early_bird";
      isOpen = true;
      pricingWindow = "early_bird";
      statusBadgeLabel = "Early Registration Open";
    } else {
      phase = "regular";
      isOpen = true;
      pricingWindow = "regular";
      statusBadgeLabel = "Registration Open";
    }
  }

  const studentRegularCents = parseCurrencyToCents(workshop.reg_student_fee, 25000);
  const professionalRegularCents = parseCurrencyToCents(
    workshop.reg_professional_fee,
    50000
  );
  const sponsorRegularCents = parseCurrencyToCents(workshop.reg_sponsor_fee, 135000);

  const studentEarlyCents = parseCurrencyToCents(
    workshop.reg_student_early_fee,
    studentRegularCents
  );
  const professionalEarlyCents = parseCurrencyToCents(
    workshop.reg_professional_early_fee,
    professionalRegularCents
  );
  const sponsorEarlyCents = parseCurrencyToCents(
    workshop.reg_sponsor_early_fee,
    sponsorRegularCents
  );
  const guestDinnerCents = parseCurrencyToCents(workshop.reg_guest_dinner_fee, 7500);

  const isEarlyBirdActive =
    pricingWindow === "early_bird" &&
    (studentEarlyCents < studentRegularCents ||
      professionalEarlyCents < professionalRegularCents ||
      sponsorEarlyCents < sponsorRegularCents);

  const studentCents =
    pricingWindow === "early_bird" ? studentEarlyCents : studentRegularCents;
  const professionalCents =
    pricingWindow === "early_bird" ? professionalEarlyCents : professionalRegularCents;
  const sponsorCents =
    pricingWindow === "early_bird" ? sponsorEarlyCents : sponsorRegularCents;

  return {
    phase,
    isOpen,
    isEarlyBirdActive,
    statusBadgeLabel,
    timezoneLabel,
    openingDateLabel,
    earlyBirdCloseDateLabel,
    conferenceEndDateLabel,
    openEpochMs,
    earlyBirdCloseEpochMs,
    conferenceEndEpochMs,
    activeFees: {
      pricingWindow,
      studentCents,
      professionalCents,
      sponsorCents,
      studentEarlyCents,
      professionalEarlyCents,
      sponsorEarlyCents,
      studentRegularCents,
      professionalRegularCents,
      sponsorRegularCents,
      guestDinnerCents,
      studentLabel: formatCentsUsd(studentCents),
      professionalLabel: formatCentsUsd(professionalCents),
      sponsorLabel: formatCentsUsd(sponsorCents),
      guestDinnerLabel: formatCentsUsd(guestDinnerCents),
      hasEarlyBirdDiscount:
        studentEarlyCents < studentRegularCents ||
        professionalEarlyCents < professionalRegularCents,
    },
  };
}

function dateEpochDay(cal: { year: number; month: number; day: number }): number {
  return Date.UTC(cal.year, cal.month - 1, cal.day);
}

/**
 * Plain-English validation guardrails preventing non-technical Admins from publishing broken dates, fees, or TBA contradictions.
 */
export function validateWorkshopConfig(
  config: UpcomingWorkshopConfig
): WorkshopValidationIssue[] {
  const issues: WorkshopValidationIssue[] = [];

  if (!Number.isFinite(config.workshop_number) || config.workshop_number < 16) {
    issues.push({
      fieldKey: "workshop_number",
      section: "identity",
      severity: "error",
      message: "Workshop Number must be 16 or higher.",
    });
  }
  if (!/^\d{4}$/.test(config.workshop_year.trim())) {
    issues.push({
      fieldKey: "workshop_year",
      section: "identity",
      severity: "error",
      message: "Workshop Year must be a 4-digit year (e.g. 2027).",
    });
  }

  const startCal = parseDeadlineCalendarDate(config.conference_start_date);
  const endCal = parseDeadlineCalendarDate(config.conference_end_date);
  if (startCal && endCal && dateEpochDay(endCal) < dateEpochDay(startCal)) {
    issues.push({
      fieldKey: "conference_end_date",
      section: "identity",
      severity: "error",
      message: `Workshop Final Day (${config.conference_end_date}) cannot be earlier than Start Date (${config.conference_start_date}).`,
    });
  }

  if (config.announcement_headline.trim().length < 4) {
    issues.push({
      fieldKey: "announcement_headline",
      section: "announcement",
      severity: "error",
      message: "Official Announcement Headline cannot be blank.",
    });
  }

  if (config.venue_confirmed) {
    if (!config.venue_city_state.trim() || /\btba\b/i.test(config.venue_city_state)) {
      issues.push({
        fieldKey: "venue_city_state",
        section: "venue",
        severity: "error",
        message: "Enter a real Host City & State before turning on 'Hotel Contract Signed'.",
      });
    }
    if (
      !config.hotel_name.trim() ||
      /\b(tba|to be announced)\b/i.test(config.hotel_name)
    ) {
      issues.push({
        fieldKey: "hotel_name",
        section: "venue",
        severity: "error",
        message: "Enter the confirmed hotel name before turning on 'Hotel Contract Signed'.",
      });
    }
    if (!config.hotel_booking_url.trim()) {
      issues.push({
        fieldKey: "hotel_booking_url",
        section: "venue",
        severity: "warning",
        message: "Venue is confirmed, but the Hotel Group Booking Link is still blank ('Book Hotel Room' button remains hidden).",
      });
    }
  }

  for (const urlKey of ["hotel_maps_url", "hotel_booking_url", "dinner_venue_url"] as const) {
    const v = config[urlKey].trim();
    if (v && !/^https?:\/\/[^\s]+$/i.test(v)) {
      issues.push({
        fieldKey: urlKey,
        section: "venue",
        severity: "error",
        message: `${WORKSHOP_FIELD_MAP[urlKey]?.label || urlKey} must start with https://.`,
      });
    }
  }

  const cfpCal = parseDeadlineCalendarDate(config.cfp_abstract_deadline);
  const cfpNotifCal = parseDeadlineCalendarDate(config.cfp_notification_date);
  if (cfpCal && cfpNotifCal && dateEpochDay(cfpNotifCal) < dateEpochDay(cfpCal)) {
    issues.push({
      fieldKey: "cfp_notification_date",
      section: "cfp",
      severity: "error",
      message: "Author Decision Notification Date cannot precede the Abstract Submission Deadline.",
    });
  }

  const regOpenCal = parseDeadlineCalendarDate(config.reg_opening_date);
  const earlyCloseCal = parseDeadlineCalendarDate(config.reg_early_bird_closes);
  const refundCal = parseDeadlineCalendarDate(config.reg_refund_cutoff);

  if (regOpenCal && earlyCloseCal && dateEpochDay(earlyCloseCal) < dateEpochDay(regOpenCal)) {
    issues.push({
      fieldKey: "reg_early_bird_closes",
      section: "registration",
      severity: "error",
      message: "Early-Bird Cutoff Date cannot be earlier than Registration Opening Date.",
    });
  }
  if (earlyCloseCal && endCal && dateEpochDay(earlyCloseCal) > dateEpochDay(endCal)) {
    issues.push({
      fieldKey: "reg_early_bird_closes",
      section: "registration",
      severity: "error",
      message: "Early-Bird Cutoff Date cannot be later than the final day of the workshop.",
    });
  }
  if (regOpenCal && endCal && dateEpochDay(regOpenCal) > dateEpochDay(endCal)) {
    issues.push({
      fieldKey: "reg_opening_date",
      section: "registration",
      severity: "error",
      message: "Registration Opening Date cannot be after the Workshop ends.",
    });
  }
  if (refundCal && endCal && dateEpochDay(refundCal) > dateEpochDay(endCal)) {
    issues.push({
      fieldKey: "reg_refund_cutoff",
      section: "registration",
      severity: "warning",
      message: "Refund Cutoff Date is set after the Workshop's final day — double check this date.",
    });
  }

  const feePairs: Array<{
    earlyKey: keyof UpcomingWorkshopConfig;
    regularKey: keyof UpcomingWorkshopConfig;
    label: string;
  }> = [
    { earlyKey: "reg_student_early_fee", regularKey: "reg_student_fee", label: "Student" },
    { earlyKey: "reg_professional_early_fee", regularKey: "reg_professional_fee", label: "Professional" },
    { earlyKey: "reg_sponsor_early_fee", regularKey: "reg_sponsor_fee", label: "Sponsor" },
  ];

  for (const pair of feePairs) {
    const earlyCents = parseCurrencyToCents(String(config[pair.earlyKey]), -1);
    const regCents = parseCurrencyToCents(String(config[pair.regularKey]), -1);
    if (earlyCents < 0 || regCents <= 0) {
      issues.push({
        fieldKey: pair.regularKey,
        section: "registration",
        severity: "error",
        message: `${pair.label} registration fees must be valid USD amounts.`,
      });
    } else if (earlyCents > regCents) {
      issues.push({
        fieldKey: pair.earlyKey,
        section: "registration",
        severity: "error",
        message: `${pair.label} Early Fee (${String(config[pair.earlyKey])}) cannot be higher than Standard Fee (${String(config[pair.regularKey])}).`,
      });
    }
  }

  for (const emailKey of ["student_award_email", "sponsor_coordinator_email"] as const) {
    const addr = config[emailKey].trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
      issues.push({
        fieldKey: emailKey,
        section: "awards_sponsors",
        severity: "error",
        message: `Enter a valid email address for ${WORKSHOP_FIELD_MAP[emailKey]?.label || emailKey}.`,
      });
    }
  }

  return issues;
}

function formatReadableFieldValue(val: unknown): string {
  if (typeof val === "boolean") return val ? "Yes (ON)" : "No (OFF)";
  const str = String(val ?? "").trim();
  return str || "— (Blank)";
}

/**
 * Computes field-level Before -> After differences across all 53 fields for Visual Diff & Audit History.
 */
export function computeWorkshopConfigDiff(
  before: UpcomingWorkshopConfig,
  after: UpcomingWorkshopConfig
): WorkshopFieldDiff[] {
  const diffs: WorkshopFieldDiff[] = [];
  for (const meta of WORKSHOP_FIELD_CATALOG) {
    const prevRaw = before[meta.key];
    const nextRaw = after[meta.key];
    if (String(prevRaw) !== String(nextRaw)) {
      diffs.push({
        key: meta.key,
        label: meta.label,
        section: meta.section,
        beforeValue: formatReadableFieldValue(prevRaw),
        afterValue: formatReadableFieldValue(nextRaw),
        usedOnPages: meta.usedOnPages,
      });
    }
  }
  return diffs;
}

function ordinalSuffix(num: number): string {
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  const mod10 = num % 10;
  if (mod10 === 1) return `${num}st`;
  if (mod10 === 2) return `${num}nd`;
  if (mod10 === 3) return `${num}rd`;
  return `${num}th`;
}

/**
 * Prepares the next biennial symposium cycle cleanly inside Draft (preserving fee templates & contacts).
 */
export function buildNextBiennialCycleTemplate(
  current: UpcomingWorkshopConfig
): UpcomingWorkshopConfig {
  const nextNum = (current.workshop_number || 16) + 1;
  const nextOrd = ordinalSuffix(nextNum);
  const currentYearNum = Number.parseInt(current.workshop_year || "2027", 10) || 2027;
  const nextYear = String(currentYearNum + 2);

  return {
    ...current,
    workshop_number: nextNum,
    workshop_ordinal: nextOrd,
    workshop_year: nextYear,
    target_window: `September ${nextYear}`,
    cycle_stage: "save_the_date",
    exact_dates: `September ${nextYear} (Exact Dates TBA)`,
    conference_start_date: `September ${nextYear} (TBA)`,
    conference_end_date: `September ${nextYear} (TBA)`,
    announcement_headline: `${nextOrd} HEMS Workshop — Save the Date (September ${nextYear})`,
    announcement_body: `Planning is underway for the ${nextOrd} Workshop on Harsh-Environment Mass Spectrometry in September ${nextYear}. Coastal venue details, Call for Papers deadlines, and registration dates will be posted once confirmed by the Organizing Committee.`,
    venue_confirmed: false,
    venue_city_state: "Coastal Venue TBA",
    hotel_name: "Official Beachfront Venue To Be Announced",
    hotel_address: `Host hotel & room block details will be published once finalized for September ${nextYear}.`,
    hotel_maps_url: "",
    hotel_group_rate: "TBA",
    hotel_discount_window: `September ${nextYear} (Dates TBA)`,
    hotel_booking_cutoff: `Summer ${nextYear} (TBA)`,
    hotel_booking_url: "",
    venue_session_room: "Main Plenary Ballroom (TBA)",
    venue_foyer_room: "Ballroom Foyer & Exhibit Area (TBA)",
    welcome_reception_time: "6:00 p.m. – 8:00 p.m.",
    welcome_reception_venue: "Host Hotel Foyer / Coastal Welcome Venue (TBA)",
    dinner_day_time: "Wednesday • 6:30 p.m. – 9:30 p.m.",
    dinner_venue_name: "Coastal Banquet Venue (TBA)",
    dinner_venue_address: "Banquet address & transportation details TBA",
    dinner_venue_url: "",
    dinner_plan_notes: "Included with full attendee registration; additional guest dinner tickets available during registration. Sponsor recognition and banquet details TBA.",
    cfp_open: false,
    cfp_abstract_deadline: `Summer ${nextYear} (TBA)`,
    cfp_notification_date: `Summer ${nextYear} (TBA)`,
    registration_mode: "auto_schedule",
    reg_opening_date: `Spring ${nextYear} (TBA)`,
    reg_early_bird_closes: `Summer ${nextYear} (TBA)`,
    reg_final_cutoff: `September ${nextYear} (TBA)`,
    reg_refund_cutoff: `August ${nextYear} (TBA)`,
    student_award_deadline: `Summer ${nextYear} (To Be Announced)`,
    student_award_extended: false,
  };
}

/**
 * Formats a Workshop config as an RFC-4180 readable CSV backup.
 */
export function configToCsvString(config: UpcomingWorkshopConfig): string {
  const esc = (cell: unknown): string => {
    const s = String(cell ?? "");
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["field_key", "section", "label", "value", "used_on_pages"].join(",");
  const rows = WORKSHOP_FIELD_CATALOG.map((meta) =>
    [
      esc(meta.key),
      esc(meta.section),
      esc(meta.label),
      esc(config[meta.key]),
      esc(meta.usedOnPages.map((p) => p.label).join("; ")),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}
