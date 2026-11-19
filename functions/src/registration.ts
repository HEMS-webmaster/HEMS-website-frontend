import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import {
  evaluateServerRegistrationSchedule,
  fetchServerWorkshopConfig,
} from "./workshopSchedule";
import {
  enforceRateLimit,
  extractHashedClientIp,
  hashSubjectKey,
  isVerifiedDecodedToken,
  timingSafeSecretMatch,
} from "./rateLimit";

const SITE_ORIGIN = process.env.HEMS_SITE_ORIGIN || "https://hems-workshop.org";
const FROM_TRANSACTIONAL =
  process.env.POSTMARK_FROM_TRANSACTIONAL ||
  "HEMS Society <announcements@mail.hems-workshop.org>";
const REPLY_TO_ADDRESS =
  process.env.POSTMARK_REPLY_TO || "president@hems-workshop.org";
const POSTAL_ADDRESS_FOOTER =
  process.env.HEMS_POSTAL_FOOTER ||
  "Harsh-Environment Mass Spectrometry Society, Inc. (501(c)(3) Scientific Organization) • St. Petersburg, FL, USA";

type RegistrationTier = "student" | "professional" | "sponsor";

interface PromoCodeDoc {
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

interface RegistrationDoc {
  id: string;
  workshopYear: number;
  workshopOrdinal: string;
  email: string;
  firstName: string;
  lastName: string;
  affiliation: string;
  country: string;
  linkedUid?: string;
  badgeName: string;
  badgeAffiliation: string;
  pronouns?: string;
  tier: RegistrationTier;
  pricingWindow: "early_bird" | "regular";
  promoCodeUsed?: string;
  grantsSponsorRole?: boolean;
  baseFeeCents: number;
  discountCents: number;
  guestDinnerCount: number;
  guestDinnerUnitCents: number;
  optionalStudentFundDonationCents: number;
  totalCents: number;
  stripeFeeEstimatedCents?: number;
  netEstimatedCents?: number;
  studentDegreeProgram?: string;
  studentAdvisorName?: string;
  studentAdvisorEmail?: string;
  wednesdayDinnerRsvp: string;
  dietaryRestrictions: string[];
  allergyNotes?: string;
  guestNames?: string;
  guestDietaryNotes?: string;
  mailingListOptIn: boolean;
  sandboxSimulation?: boolean;
  linkedAbstractIds: string[];
  transferHistory?: Array<{
    fromEmail: string;
    toEmail: string;
    fromName: string;
    toName: string;
    transferredBy: string;
    transferredAt: string;
  }>;
  paymentMode: "stripe" | "invoice" | "comped";
  status:
    | "checkout_started"
    | "pending_invoice"
    | "paid"
    | "comped"
    | "refunded"
    | "transferred"
    | "cancelled";
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
}

function getDb(): admin.firestore.Firestore {
  return admin.firestore();
}

function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function isValidEmail(email: string): boolean {
  return (
    email.length >= 5 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

function emailDocId(email: string): string {
  return encodeURIComponent(normalizeEmail(email)).replace(/\./g, "%2E");
}

function generateSecureToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatUsd(cents: number): string {
  const dollars = cents / 100;
  const hasFrac = cents % 100 !== 0;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: hasFrac ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeRoleToken(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function matchesBoardOrAdminRoles(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => {
    const norm = normalizeRoleToken(r);
    return (
      norm === "admin" ||
      norm === "administration" ||
      norm === "administrator" ||
      norm === "administrators" ||
      norm === "board" ||
      norm === "board member" ||
      norm === "board members"
    );
  });
}

function matchesOperationsAccessRoles(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => {
    const norm = normalizeRoleToken(r);
    return (
      norm === "operations" ||
      norm === "operation" ||
      norm === "operations officer" ||
      norm === "operations officers" ||
      norm === "workshop operations" ||
      norm === "logistics"
    );
  });
}

function matchesTreasurerAccessRoles(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => {
    const norm = normalizeRoleToken(r);
    return (
      norm === "treasurer" ||
      norm === "treasurers" ||
      norm === "society treasurer" ||
      norm === "finance" ||
      norm === "financial officer"
    );
  });
}

async function verifyCallerAuth(
  authHeader: string | undefined
): Promise<{
  uid: string;
  email: string;
  isBoardOrAdmin: boolean;
  canManageOperations: boolean;
  canManageTreasurer: boolean;
} | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!isVerifiedDecodedToken(decoded)) {
      return {
        uid: decoded.uid,
        email: "",
        isBoardOrAdmin: false,
        canManageOperations: false,
        canManageTreasurer: false,
      };
    }
    const db = getDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const userRoles = userDoc.data()?.roles;

    let wlRoles: unknown = [];
    if (decoded.email) {
      const wlDoc = await db
        .collection("whitelist")
        .doc(decoded.email.toLowerCase())
        .get();
      wlRoles = wlDoc.data()?.roles;
    }

    const isBoardOrAdmin =
      matchesBoardOrAdminRoles(userRoles) || matchesBoardOrAdminRoles(wlRoles);
    const canManageOperations =
      matchesOperationsAccessRoles(userRoles) || matchesOperationsAccessRoles(wlRoles);
    const canManageTreasurer =
      matchesTreasurerAccessRoles(userRoles) || matchesTreasurerAccessRoles(wlRoles);

    return {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
      isBoardOrAdmin,
      canManageOperations,
      canManageTreasurer,
    };
  } catch {
    return null;
  }
}

async function sendPostmarkEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}): Promise<void> {
  const serverToken = (process.env.POSTMARK_SERVER_TOKEN || "").trim();
  if (!serverToken) return;

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": serverToken,
    },
    body: JSON.stringify({
      From: FROM_TRANSACTIONAL,
      To: params.to,
      ReplyTo: REPLY_TO_ADDRESS,
      Subject: params.subject,
      HtmlBody: params.htmlBody,
      TextBody: params.textBody,
      MessageStream: process.env.POSTMARK_STREAM_TRANSACTIONAL || "outbound",
      TrackOpens: false,
      TrackLinks: "None",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[registration] Postmark send failed: HTTP ${res.status} ${body}`);
  }
}

function buildReceiptEmailHtml(reg: RegistrationDoc): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const isPaid = reg.status === "paid" || reg.status === "comped";
  const docNum = reg.receiptNumber || reg.invoiceNumber || reg.id;
  const receiptLink = `${SITE_ORIGIN}/registration/receipt?regId=${encodeURIComponent(
    reg.id
  )}&token=${encodeURIComponent(reg.receiptToken)}`;
  const ein = (process.env.HEMS_SOCIETY_EIN || "").trim();
  const quidProQuoCents = Math.max(
    0,
    reg.totalCents - (reg.optionalStudentFundDonationCents || 0)
  );

  const subject = isPaid
    ? `[${reg.workshopYear} HEMS Workshop] Official Receipt ${docNum} — ${reg.firstName} ${reg.lastName}`
    : `[${reg.workshopYear} HEMS Workshop] Official Invoice ${docNum} — ${reg.firstName} ${reg.lastName}`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;line-height:1.6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;">
    <tr>
      <td style="padding:24px 28px;border-bottom:1px solid #E2E8F0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;color:#0369A1;">Harsh-Environment Mass Spectrometry Society, Inc.</div>
        <div style="font-size:12px;color:#64748B;margin-top:2px;">501(c)(3) Scientific Public Charity ${ein ? `&bull; EIN: ${escapeHtml(ein)}` : ""}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;font-size:14px;color:#1E293B;">
        <p style="margin-top:0;">Dear ${escapeHtml(reg.firstName)} ${escapeHtml(reg.lastName)},</p>
        <p>${isPaid
          ? `Thank you for registering for the <strong>${reg.workshopOrdinal} HEMS Workshop (${reg.workshopYear})</strong>. Your <strong>${reg.workshopYear} Attendee</strong> portal role (enabling abstract submissions at <a href="${SITE_ORIGIN}/abstract-submission">${SITE_ORIGIN}/abstract-submission</a>)${reg.mailingListOptIn ? ` and <strong>${reg.workshopYear} Attendees</strong> mailing list tag are` : " is"} now active.`
          : `An institutional registration invoice (<strong>${escapeHtml(docNum)}</strong>) has been generated for the <strong>${reg.workshopOrdinal} HEMS Workshop (${reg.workshopYear})</strong>. Please share the printable invoice link below with your accounting or purchasing office.`}</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin:18px 0;font-size:13px;border:1px solid #E2E8F0;">
          <tr style="background:#F8FAFC;"><td style="padding:10px;border-bottom:1px solid #E2E8F0;"><strong>Reference #</strong></td><td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:right;">${escapeHtml(docNum)}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;">Registration Tier</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:right;text-transform:capitalize;">${escapeHtml(reg.tier)} (${reg.pricingWindow === "early_bird" ? "Early" : "Regular"})</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;">Name Badge</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:right;">${escapeHtml(reg.badgeName)} (${escapeHtml(reg.badgeAffiliation)})</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #E2E8F0;">Total ${isPaid ? "Paid" : "Due"}</td><td style="padding:10px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:700;">${formatUsd(reg.totalCents)} USD</td></tr>
          <tr style="background:#F8FAFC;"><td style="padding:10px;"><strong>Balance Due</strong></td><td style="padding:10px;text-align:right;font-weight:700;">${isPaid ? "$0.00 USD" : `${formatUsd(reg.totalCents)} USD`}</td></tr>
        </table>
        <p style="margin:20px 0;"><a href="${escapeHtml(receiptLink)}" style="display:inline-block;background:#0369A1;color:#FFFFFF;text-decoration:none;font-weight:600;padding:11px 18px;border-radius:8px;font-size:13px;">Print / Save Official Expense Receipt PDF</a></p>
        <p style="font-size:11.5px;color:#475569;background:#F8FAFC;padding:12px;border-radius:8px;border:1px solid #E2E8F0;"><strong>IRS IRC §§ 170 &amp; 6115 Travel Reimbursement Notice:</strong> Registration and guest meal fees (${formatUsd(quidProQuoCents)} USD) represent an exchange for symposium goods and services and are not charitable donations. ${reg.optionalStudentFundDonationCents > 0 ? `Your optional Student Travel Award gift (${formatUsd(reg.optionalStudentFundDonationCents)} USD) is tax-deductible with no goods or services provided.` : ""}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;border-top:1px solid #E2E8F0;background:#F8FAFC;font-size:11.5px;color:#64748B;">
        ${escapeHtml(POSTAL_ADDRESS_FOOTER)}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = [
    `HEMS Society — ${isPaid ? "Official Registration Receipt" : "Official Registration Invoice"} (${docNum})`,
    `Attendee: ${reg.firstName} ${reg.lastName} (${reg.affiliation})`,
    `Tier: ${reg.tier} (${reg.pricingWindow})`,
    `Total ${isPaid ? "Paid" : "Due"}: ${formatUsd(reg.totalCents)} USD | Balance Due: ${isPaid ? "$0.00 USD" : `${formatUsd(reg.totalCents)} USD`}`,
    `Printable Receipt / Expense PDF: ${receiptLink}`,
  ].join("\n\n");

  return { subject, htmlBody, textBody };
}

async function appendRowToGoogleSheet(reg: RegistrationDoc): Promise<{
  status: "synced" | "skipped_unconfigured" | "error";
  error?: string;
}> {
  const sheetId = (process.env.GOOGLE_REGISTRATION_SHEET_ID || "").trim();
  if (!sheetId) {
    return { status: "skipped_unconfigured" };
  }

  try {
    const tokenObj = await admin.credential.applicationDefault().getAccessToken();
    const accessToken = tokenObj?.access_token;
    if (!accessToken) {
      return { status: "error", error: "Service account returned no OAuth2 token." };
    }

    const tabName = encodeURIComponent(
      process.env.GOOGLE_REGISTRATION_SHEET_TAB || `${reg.workshopYear} Registrations`
    );
    const range = `${tabName}!A1`;
    const row = [
      reg.receiptNumber || reg.invoiceNumber || reg.id,
      reg.createdAt,
      reg.status,
      reg.paymentMode,
      reg.tier,
      reg.pricingWindow,
      reg.firstName,
      reg.lastName,
      reg.email,
      reg.affiliation,
      reg.country,
      reg.badgeName,
      reg.badgeAffiliation,
      reg.wednesdayDinnerRsvp,
      (reg.dietaryRestrictions || []).join(", "),
      reg.allergyNotes || "",
      reg.guestDinnerCount,
      reg.guestNames || "",
      (reg.totalCents / 100).toFixed(2),
      (reg.optionalStudentFundDonationCents / 100).toFixed(2),
      reg.promoCodeUsed || "",
      reg.paymentSummary || "",
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        sheetId
      )}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { status: "error", error: `Sheets HTTP ${res.status}: ${errText}` };
    }
    return { status: "synced" };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Google Sheets append error",
    };
  }
}

/**
 * Atomic 5-Step Post-Payment Fulfillment:
 * 1) Sequential Receipt # & Paid State
 * 2) Non-destructive Whitelist Role Union + Cycle Year
 * 3) Mailing List Cohort Tagging ("2027 Attendees")
 * 4) Abstract Submission Presenter Cross-Link
 * 5) Postmark IRC 6115 Receipt + Google Sheets Sync
 */
async function fulfillRegistration(params: {
  regId: string;
  targetStatus: "paid" | "comped";
  paymentSummary: string;
  stripePaymentIntentId?: string;
  paymentReferenceNote?: string;
}): Promise<RegistrationDoc | null> {
  const db = getDb();
  const regRef = db.collection("workshop_registrations").doc(params.regId);
  const nowIso = new Date().toISOString();

  const fulfilledDoc = await db.runTransaction(async (tx) => {
    const regSnap = await tx.get(regRef);
    if (!regSnap.exists) return null;
    const current = regSnap.data() as RegistrationDoc;

    // Idempotency guard: if already fulfilled, return immediately
    if (current.fulfilledAt && (current.status === "paid" || current.status === "comped")) {
      return current;
    }

    const counterRef = db.collection("workshop_counters").doc(String(current.workshopYear));
    const counterSnap = await tx.get(counterRef);
    const nextSeq = ((counterSnap.exists ? counterSnap.data()?.receiptSeq : 0) || 0) + 1;
    const receiptNumber =
      current.receiptNumber ||
      `HEMS-${current.workshopYear}-${String(nextSeq).padStart(4, "0")}`;

    const wlRef = db.collection("whitelist").doc(current.email);
    const wlSnap = await tx.get(wlRef);

    const existingWlRoles = Array.isArray(wlSnap.data()?.roles)
      ? wlSnap.data()?.roles.map((r: unknown) => String(r))
      : [];
    const roleSet = new Set<string>(existingWlRoles);
    roleSet.add("attendee");
    if (current.tier === "sponsor" || current.grantsSponsorRole) {
      roleSet.add("corporate sponsor");
    }

    const existingYears = Array.isArray(wlSnap.data()?.workshopYears)
      ? (wlSnap.data()?.workshopYears as number[])
      : [];
    const yearsSet = new Set<number>([...existingYears, current.workshopYear]);

    const yearTag = `${current.workshopYear} Attendees`;
    const sponsorTag = `${current.workshopYear} Corporate Sponsors`;
    const subRef = db.collection("mailing_subscribers").doc(emailDocId(current.email));
    const subSnap = await tx.get(subRef);
    const subMetaRef = db.collection("mailing_subscribers").doc("_meta_sublists");
    const subMetaSnap = await tx.get(subMetaRef);

    tx.set(
      counterRef,
      { receiptSeq: nextSeq, updatedAt: nowIso },
      { merge: true }
    );

    const updatedReg: RegistrationDoc = {
      ...current,
      status: params.targetStatus,
      receiptNumber,
      paymentSummary: params.paymentSummary || current.paymentSummary || "",
      stripePaymentIntentId:
        params.stripePaymentIntentId || current.stripePaymentIntentId,
      paymentReferenceNote:
        params.paymentReferenceNote || current.paymentReferenceNote,
      paidAt: current.paidAt || nowIso,
      fulfilledAt: nowIso,
      updatedAt: nowIso,
    };

    tx.set(regRef, updatedReg, { merge: true });

    // Step 2: Cycle-Scoped Whitelist Union (Preserves board/reviewer/admin/submitter)
    tx.set(
      wlRef,
      {
        email: current.email,
        firstName: wlSnap.data()?.firstName || current.firstName,
        lastName: wlSnap.data()?.lastName || current.lastName,
        affiliation: wlSnap.data()?.affiliation || current.affiliation,
        name:
          wlSnap.data()?.name ||
          `${current.firstName} ${current.lastName}`.trim(),
        roles: Array.from(roleSet),
        workshopYears: Array.from(yearsSet).sort(),
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // Step 3: Mailing List Cohort Tagging (Strictly respects mailingListOptIn consent)
    if (current.mailingListOptIn) {
      const existingSubData = subSnap.exists ? subSnap.data() : null;
      const existingSublists = Array.isArray(existingSubData?.sublists)
        ? (existingSubData?.sublists as string[])
        : [];
      const subTagSet = new Set<string>([...existingSublists, yearTag]);
      if (current.tier === "sponsor" || current.grantsSponsorRole) {
        subTagSet.add(sponsorTag);
      }

      const existingStatus = existingSubData?.status as string | undefined;
      const nextSubStatus = existingStatus === "complained" ? "complained" : "active";

      tx.set(
        subRef,
        {
          email: current.email,
          firstName: existingSubData?.firstName || current.firstName,
          lastName: existingSubData?.lastName || current.lastName,
          affiliation: existingSubData?.affiliation || current.affiliation,
          interests: Array.isArray(existingSubData?.interests)
            ? Array.from(new Set([...existingSubData.interests, "workshop"]))
            : ["workshop"],
          sublists: Array.from(subTagSet),
          status: nextSubStatus,
          source: existingSubData?.source || "registration",
          unsubscribeToken:
            typeof existingSubData?.unsubscribeToken === "string" &&
            existingSubData.unsubscribeToken.length >= 24
              ? existingSubData.unsubscribeToken
              : generateSecureToken(),
          optInToken:
            typeof existingSubData?.optInToken === "string"
              ? existingSubData.optInToken
              : generateSecureToken(),
          createdAt: existingSubData?.createdAt || nowIso,
          updatedAt: nowIso,
          confirmedAt: existingSubData?.confirmedAt || nowIso,
        },
        { merge: true }
      );

      const catalogTags = Array.isArray(subMetaSnap.data()?.tags)
        ? (subMetaSnap.data()?.tags as string[])
        : [];
      const catalogSet = new Set<string>([...catalogTags, yearTag]);
      if (current.tier === "sponsor" || current.grantsSponsorRole) {
        catalogSet.add(sponsorTag);
      }
      tx.set(
        subMetaRef,
        { tags: Array.from(catalogSet), updatedAt: nowIso },
        { merge: true }
      );
    }

    return updatedReg;
  });

  if (!fulfilledDoc) return null;

  // Step 4: Abstract Submission Presenter Cross-Link (best-effort query outside txn)
  try {
    const absByCorresponding = await db
      .collection("abstract_submissions")
      .where("workshopYear", "==", fulfilledDoc.workshopYear)
      .where("correspondingEmail", "==", fulfilledDoc.email)
      .get();
    const absBySubmitter = await db
      .collection("abstract_submissions")
      .where("workshopYear", "==", fulfilledDoc.workshopYear)
      .where("submittedByEmail", "==", fulfilledDoc.email)
      .get();
    const idSet = new Set<string>();
    absByCorresponding.docs.forEach((d) => idSet.add(d.id));
    absBySubmitter.docs.forEach((d) => idSet.add(d.id));
    if (idSet.size > 0) {
      fulfilledDoc.linkedAbstractIds = Array.from(idSet);
      await regRef.update({ linkedAbstractIds: fulfilledDoc.linkedAbstractIds });
    }
  } catch (err) {
    console.warn("[registration] Abstract cross-link query skipped:", err);
  }

  // Step 5A: Google Sheets API v4 Sync
  const sheetRes = await appendRowToGoogleSheet(fulfilledDoc);
  fulfilledDoc.sheetSyncStatus = sheetRes.status;
  fulfilledDoc.sheetSyncError = sheetRes.error;
  await regRef.set(
    {
      sheetSyncStatus: sheetRes.status,
      ...(sheetRes.error ? { sheetSyncError: sheetRes.error } : {}),
    },
    { merge: true }
  );

  // Step 5B: Postmark Receipt Email
  const emailMsg = buildReceiptEmailHtml(fulfilledDoc);
  await sendPostmarkEmail({
    to: fulfilledDoc.email,
    subject: emailMsg.subject,
    htmlBody: emailMsg.htmlBody,
    textBody: emailMsg.textBody,
  });

  return fulfilledDoc;
}

/**
 * Multi-seat-safe revocation of cycle `attendee` / `corporate sponsor` roles and
 * `${workshopYear} Attendees` sublist tags when a registration is refunded, cancelled,
 * or transferred away from `email`. Preserves all committee/officer roles.
 */
async function revokeAttendeeAccessIfNoActiveSeat(params: {
  db: admin.firestore.Firestore;
  email: string;
  workshopYear: number;
  excludeRegId: string;
  nowIso: string;
}): Promise<void> {
  const cleanEmail = normalizeEmail(params.email);
  if (!cleanEmail) return;

  const otherRegsSnap = await params.db
    .collection("workshop_registrations")
    .where("email", "==", cleanEmail)
    .where("workshopYear", "==", params.workshopYear)
    .get();

  let hasOtherActiveSeat = false;
  let hasOtherSponsorSeat = false;
  otherRegsSnap.docs.forEach((d) => {
    if (d.id === params.excludeRegId) return;
    const r = d.data() as RegistrationDoc;
    if (r.status === "paid" || r.status === "comped") {
      hasOtherActiveSeat = true;
      if (r.tier === "sponsor" || r.grantsSponsorRole) {
        hasOtherSponsorSeat = true;
      }
    }
  });

  const wlRef = params.db.collection("whitelist").doc(cleanEmail);
  const wlSnap = await wlRef.get();
  if (wlSnap.exists) {
    const wlData = wlSnap.data() || {};
    const existingRoles = Array.isArray(wlData.roles)
      ? (wlData.roles as unknown[]).map((r) => String(r))
      : [];
    const filteredRoles = existingRoles.filter((r) => {
      const lower = r.trim().toLowerCase();
      if (!hasOtherActiveSeat && lower === "attendee") return false;
      if (!hasOtherSponsorSeat && lower === "corporate sponsor") return false;
      return true;
    });
    if (
      cleanEmail === "webmaster@hems-workshop.org" &&
      !filteredRoles.some((r) => {
        const n = r.trim().toLowerCase();
        return n === "admin" || n === "administration" || n === "administrator";
      })
    ) {
      filteredRoles.push("admin");
    }

    const existingYears = Array.isArray(wlData.workshopYears)
      ? (wlData.workshopYears as number[])
      : [];
    const nextYears = hasOtherActiveSeat
      ? existingYears
      : existingYears.filter((y) => Number(y) !== params.workshopYear);

    await wlRef.set(
      {
        roles: filteredRoles,
        workshopYears: nextYears,
        updatedAt: params.nowIso,
      },
      { merge: true }
    );
  }

  const subRef = params.db.collection("mailing_subscribers").doc(emailDocId(cleanEmail));
  const subSnap = await subRef.get();
  if (subSnap.exists) {
    const subData = subSnap.data() || {};
    const existingSublists = Array.isArray(subData.sublists)
      ? (subData.sublists as unknown[]).map((t) => String(t))
      : [];
    const yearTagLower = `${params.workshopYear} attendees`;
    const sponsorTagLower = `${params.workshopYear} corporate sponsors`;
    const filteredSublists = existingSublists.filter((t) => {
      const lower = t.trim().toLowerCase();
      if (!hasOtherActiveSeat && lower === yearTagLower) return false;
      if (!hasOtherSponsorSeat && lower === sponsorTagLower) return false;
      return true;
    });
    if (filteredSublists.length !== existingSublists.length) {
      await subRef.set(
        {
          sublists: filteredSublists,
          updatedAt: params.nowIso,
        },
        { merge: true }
      );
    }
  }
}

function calculateBreakdown(params: {
  baseFeeCents: number;
  promo: PromoCodeDoc | null;
  guestDinnerCount: number;
  guestDinnerUnitCents: number;
  optionalStudentFundDonationCents: number;
}) {
  let discountCents = 0;
  if (params.promo) {
    if (params.promo.discountType === "percent") {
      const pct = Math.max(0, Math.min(100, params.promo.discountValue));
      discountCents = Math.round((params.baseFeeCents * pct) / 100);
    } else {
      discountCents = Math.max(
        0,
        Math.min(params.baseFeeCents, params.promo.discountValue)
      );
    }
  }
  const netRegistrationCents = Math.max(0, params.baseFeeCents - discountCents);
  const guestCount = Math.max(0, Math.min(4, Math.floor(params.guestDinnerCount || 0)));
  const guestSubtotalCents = guestCount * params.guestDinnerUnitCents;
  const donationCents = Math.max(
    0,
    Math.min(250_000, Math.round(params.optionalStudentFundDonationCents || 0))
  );
  const totalCents = netRegistrationCents + guestSubtotalCents + donationCents;
  return {
    baseFeeCents: params.baseFeeCents,
    discountCents,
    netRegistrationCents,
    guestCount,
    guestSubtotalCents,
    donationCents,
    totalCents,
  };
}

function verifyStripeWebhookSignature(
  rawBody: Buffer,
  sigHeader: string | undefined,
  secret: string
): boolean {
  if (!sigHeader || !secret) return false;
  const parts = sigHeader.split(",").map((s) => s.trim());
  let timestamp = "";
  const v1Sigs: string[] = [];

  for (const part of parts) {
    if (part.startsWith("t=")) timestamp = part.slice(2);
    else if (part.startsWith("v1=")) v1Sigs.push(part.slice(3));
  }
  if (!timestamp || v1Sigs.length === 0) return false;

  const tsNum = Number.parseInt(timestamp, 10);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > 300) {
    return false;
  }

  const payloadToSign = `${timestamp}.${rawBody.toString("utf8")}`;
  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(payloadToSign, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expectedHex, "hex");

  return v1Sigs.some((sigHex) => {
    if (sigHex.length !== expectedHex.length) return false;
    try {
      return crypto.timingSafeEqual(expectedBuf, Buffer.from(sigHex, "hex"));
    } catch {
      return false;
    }
  });
}

/**
 * POST /api/registration/create-session
 * Authoritatively validates Google-Sheet Auto-Advance dates & fees, validates
 * promo codes transactionally, creates `workshop_registrations/{regId}`, and
 * either dispatches Stripe Checkout or completes $0 comp / Pending Invoice.
 */
export const registrationCreateSession = onRequest(
  {
    cors: true,
    region: "us-central1",
    maxInstances: 5,
    memory: "256MiB",
    timeoutSeconds: 45,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    try {
      const body = typeof req.body === "object" && req.body ? req.body : {};
      const db = getDb();
      const workshopConfig = await fetchServerWorkshopConfig();
      const schedule = evaluateServerRegistrationSchedule(workshopConfig);
      const activeYear = Number.parseInt(workshopConfig.workshop_year || "2027", 10) || 2027;

      // Support live promo validation lookup without creating a registration (rate-limited against brute-forcing)
      if (body.action === "validate_promo") {
        const promoRate = await enforceRateLimit({
          db,
          bucketKey: extractHashedClientIp(req, "promo_check"),
          maxHits: 25,
          windowSeconds: 900,
          persistToFirestore: true,
        });
        if (!promoRate.allowed) {
          res.setHeader("Retry-After", String(promoRate.retryAfterSec));
          res.status(429).json({
            ok: false,
            error: "Too many promo code validation attempts. Please wait a few minutes.",
          });
          return;
        }
        const promoCodeRaw = String(body.promoCode || "").trim().toUpperCase();
        const tier = String(body.tier || "professional") as RegistrationTier;
        if (!promoCodeRaw) {
          res.status(400).json({ ok: false, error: "Promo code is required." });
          return;
        }
        const snap = await db.collection("workshop_promo_codes").doc(promoCodeRaw).get();
        if (!snap.exists) {
          res.status(404).json({ ok: false, error: `Code "${promoCodeRaw}" not found.` });
          return;
        }
        const promo = snap.data() as PromoCodeDoc;
        if (!promo.active || promo.workshopYear !== activeYear) {
          res.status(400).json({ ok: false, error: `Code "${promoCodeRaw}" is inactive.` });
          return;
        }
        if (promo.usesCount >= promo.maxUses) {
          res.status(400).json({ ok: false, error: `Code "${promoCodeRaw}" redemption limit reached.` });
          return;
        }
        if (Array.isArray(promo.allowedTiers) && !promo.allowedTiers.includes(tier)) {
          res.status(400).json({
            ok: false,
            error: `Code "${promoCodeRaw}" only applies to ${promo.allowedTiers.join(" / ")}.`,
          });
          return;
        }
        res.status(200).json({ ok: true, promo, message: `${promo.label} applied.` });
        return;
      }

      const caller = await verifyCallerAuth(req.headers.authorization);
      const isSandboxOverride = Boolean(body.sandboxOverride && caller?.isBoardOrAdmin);

      // Authoritative Auto-Advance Gate Check
      if (!schedule.isOpen && !isSandboxOverride) {
        const reason =
          schedule.phase === "before_opening"
            ? `Registration opens on ${schedule.openingDateLabel}.`
            : schedule.phase === "concluded_closed"
            ? `Registration closed after the final conference date (${schedule.conferenceEndDateLabel}).`
            : "Workshop registration is not currently open.";
        res.status(403).json({ ok: false, error: reason });
        return;
      }

      const tier = String(body.tier || "professional") as RegistrationTier;
      if (!["student", "professional", "sponsor"].includes(tier)) {
        res.status(400).json({ ok: false, error: "Invalid registration tier." });
        return;
      }

      const email = normalizeEmail(body.email);
      if (!isValidEmail(email)) {
        res.status(400).json({ ok: false, error: "Valid email address is required." });
        return;
      }

      if (!isSandboxOverride) {
        const ipRate = await enforceRateLimit({
          db,
          bucketKey: extractHashedClientIp(req, "reg_create_ip"),
          maxHits: 10,
          windowSeconds: 3600,
          persistToFirestore: true,
        });
        if (!ipRate.allowed) {
          res.setHeader("Retry-After", String(ipRate.retryAfterSec));
          res.status(429).json({
            ok: false,
            error: "Too many registration attempts from your network. Please wait before trying again.",
          });
          return;
        }

        const emailRate = await enforceRateLimit({
          db,
          bucketKey: hashSubjectKey(email, "reg_create_email"),
          maxHits: 5,
          windowSeconds: 3600,
          persistToFirestore: true,
        });
        if (!emailRate.allowed) {
          res.setHeader("Retry-After", String(emailRate.retryAfterSec));
          res.status(429).json({
            ok: false,
            error: "Multiple registration attempts already exist for this email address in the past hour.",
          });
          return;
        }
      }
      const firstName = String(body.firstName || "").trim().slice(0, 80);
      const lastName = String(body.lastName || "").trim().slice(0, 80);
      const affiliation = String(body.affiliation || "").trim().slice(0, 140);
      if (!firstName || !lastName || !affiliation) {
        res.status(400).json({
          ok: false,
          error: "First name, last name, and affiliation are required.",
        });
        return;
      }

      const pricingWindow =
        isSandboxOverride && body.pricingWindow === "early_bird"
          ? "early_bird"
          : isSandboxOverride && body.pricingWindow === "regular"
          ? "regular"
          : schedule.pricingWindow;

      const baseFeeCents =
        tier === "student"
          ? pricingWindow === "early_bird"
            ? schedule.studentEarlyCents
            : schedule.studentRegularCents
          : tier === "sponsor"
          ? pricingWindow === "early_bird"
            ? schedule.sponsorEarlyCents
            : schedule.sponsorRegularCents
          : pricingWindow === "early_bird"
          ? schedule.professionalEarlyCents
          : schedule.professionalRegularCents;

      const promoCode = String(body.promoCode || "").trim().toUpperCase();
      const guestDinnerCount = Number(body.guestDinnerCount || 0);
      const optionalDonationCents = Number(body.optionalStudentFundDonationCents || 0);
      const requestedPaymentMode = body.paymentMode === "invoice" ? "invoice" : "stripe";

      const regId = `REG-${activeYear}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const receiptToken = generateSecureToken();
      const nowIso = new Date().toISOString();

      // Atomic Promo Validation + Pending Registration Creation
      const created = await db.runTransaction(async (tx) => {
        let appliedPromo: PromoCodeDoc | null = null;
        if (promoCode) {
          const pRef = db.collection("workshop_promo_codes").doc(promoCode);
          const pSnap = await tx.get(pRef);
          if (!pSnap.exists) {
            throw new Error(`Promo code "${promoCode}" was not found.`);
          }
          const pData = pSnap.data() as PromoCodeDoc;
          if (!pData.active || pData.workshopYear !== activeYear) {
            throw new Error(`Promo code "${promoCode}" is not active.`);
          }
          if (pData.usesCount >= pData.maxUses) {
            throw new Error(`Promo code "${promoCode}" has reached its usage limit.`);
          }
          if (Array.isArray(pData.allowedTiers) && !pData.allowedTiers.includes(tier)) {
            throw new Error(`Promo code "${promoCode}" is not valid for the ${tier} tier.`);
          }
          appliedPromo = pData;
          tx.update(pRef, { usesCount: pData.usesCount + 1, updatedAt: nowIso });
        }

        const breakdown = calculateBreakdown({
          baseFeeCents,
          promo: appliedPromo,
          guestDinnerCount,
          guestDinnerUnitCents: schedule.guestDinnerCents,
          optionalStudentFundDonationCents: optionalDonationCents,
        });

        const isZeroTotal = breakdown.totalCents === 0;
        const isInvoice = !isZeroTotal && requestedPaymentMode === "invoice";

        let invoiceNumber: string | undefined;
        if (isInvoice) {
          const counterRef = db.collection("workshop_counters").doc(String(activeYear));
          const counterSnap = await tx.get(counterRef);
          const nextInvSeq =
            ((counterSnap.exists ? counterSnap.data()?.invoiceSeq : 0) || 0) + 1;
          invoiceNumber = `HEMS-${activeYear}-INV-${String(nextInvSeq).padStart(4, "0")}`;
          tx.set(counterRef, { invoiceSeq: nextInvSeq, updatedAt: nowIso }, { merge: true });
        }

        const record: RegistrationDoc = {
          id: regId,
          workshopYear: activeYear,
          workshopOrdinal: workshopConfig.workshop_ordinal,
          email,
          firstName,
          lastName,
          affiliation,
          country: String(body.country || "United States").trim().slice(0, 80),
          linkedUid: caller?.uid,
          badgeName:
            String(body.badgeName || `${firstName} ${lastName}`).trim().slice(0, 80),
          badgeAffiliation:
            String(body.badgeAffiliation || affiliation).trim().slice(0, 120),
          pronouns: String(body.pronouns || "").trim().slice(0, 40) || undefined,
          tier,
          pricingWindow,
          promoCodeUsed: appliedPromo ? appliedPromo.code : undefined,
          grantsSponsorRole: appliedPromo?.grantsSponsorRole || undefined,
          baseFeeCents: breakdown.baseFeeCents,
          discountCents: breakdown.discountCents,
          guestDinnerCount: breakdown.guestCount,
          guestDinnerUnitCents: schedule.guestDinnerCents,
          optionalStudentFundDonationCents: breakdown.donationCents,
          totalCents: breakdown.totalCents,
          studentDegreeProgram:
            tier === "student" ? String(body.studentDegreeProgram || "Ph.D.") : undefined,
          studentAdvisorName:
            tier === "student"
              ? String(body.studentAdvisorName || "").trim().slice(0, 100) || undefined
              : undefined,
          studentAdvisorEmail:
            tier === "student" ? normalizeEmail(body.studentAdvisorEmail) || undefined : undefined,
          wednesdayDinnerRsvp: String(body.wednesdayDinnerRsvp || "attending"),
          dietaryRestrictions: Array.isArray(body.dietaryRestrictions)
            ? body.dietaryRestrictions.map((x: unknown) => String(x)).slice(0, 10)
            : ["None"],
          allergyNotes: String(body.allergyNotes || "").trim().slice(0, 240) || undefined,
          guestNames: String(body.guestNames || "").trim().slice(0, 160) || undefined,
          guestDietaryNotes:
            String(body.guestDietaryNotes || "").trim().slice(0, 200) || undefined,
          mailingListOptIn: body.mailingListOptIn !== false,
          sandboxSimulation: isSandboxOverride,
          linkedAbstractIds: [],
          paymentMode: isZeroTotal ? "comped" : isInvoice ? "invoice" : "stripe",
          status: isZeroTotal
            ? "comped"
            : isInvoice
            ? "pending_invoice"
            : "checkout_started",
          invoiceNumber,
          receiptToken,
          paymentSummary: isZeroTotal
            ? `Promo Waiver (${appliedPromo?.code || "COMP"})`
            : isInvoice
            ? "Pending Institutional Check / ACH PO"
            : "Awaiting Stripe Checkout",
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        tx.set(db.collection("workshop_registrations").doc(regId), record);
        return record;
      });

      const receiptUrl = `/registration/receipt?regId=${encodeURIComponent(
        created.id
      )}&token=${encodeURIComponent(created.receiptToken)}`;

      if (created.status === "comped") {
        const fulfilled = await fulfillRegistration({
          regId: created.id,
          targetStatus: "comped",
          paymentSummary: created.paymentSummary || "Promo Waiver",
        });
        res.status(200).json({
          ok: true,
          mode: "completed",
          registration: fulfilled || created,
          receiptUrl,
        });
        return;
      }

      if (created.status === "pending_invoice") {
        const emailMsg = buildReceiptEmailHtml(created);
        await sendPostmarkEmail({
          to: created.email,
          subject: emailMsg.subject,
          htmlBody: emailMsg.htmlBody,
          textBody: emailMsg.textBody,
        });
        res.status(200).json({
          ok: true,
          mode: "pending_invoice",
          registration: created,
          receiptUrl,
        });
        return;
      }

      // Stripe Hosted Checkout Session (Card + US Bank Account ACH)
      const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
      if (!stripeSecretKey) {
        if (isSandboxOverride) {
          const fulfilled = await fulfillRegistration({
            regId: created.id,
            targetStatus: "paid",
            paymentSummary: "Sandbox Card •••• 4242",
          });
          res.status(200).json({
            ok: true,
            mode: "sandbox",
            registration: fulfilled || created,
            receiptUrl,
          });
          return;
        }
        res.status(503).json({
          ok: false,
          error:
            "Online Stripe Checkout is not configured on this environment yet. Choose Official Invoice / PO or configure STRIPE_SECRET_KEY.",
        });
        return;
      }

      const formParams = new URLSearchParams();
      formParams.set("mode", "payment");
      formParams.set("client_reference_id", created.id);
      formParams.set("customer_email", created.email);
      formParams.set("payment_method_types[0]", "card");
      formParams.set("payment_method_types[1]", "us_bank_account");
      formParams.set(
        "success_url",
        `${SITE_ORIGIN}${receiptUrl}&session_id={CHECKOUT_SESSION_ID}`
      );
      formParams.set("cancel_url", `${SITE_ORIGIN}/registration?canceled=1`);
      formParams.set("metadata[regId]", created.id);
      formParams.set("metadata[workshopYear]", String(created.workshopYear));

      let itemIdx = 0;
      const netReg = Math.max(0, created.baseFeeCents - created.discountCents);
      if (netReg > 0) {
        formParams.set(`line_items[${itemIdx}][price_data][currency]`, "usd");
        formParams.set(
          `line_items[${itemIdx}][price_data][product_data][name]`,
          `${created.workshopOrdinal} HEMS Workshop (${created.workshopYear}) — ${created.tier} Registration`
        );
        formParams.set(
          `line_items[${itemIdx}][price_data][unit_amount]`,
          String(netReg)
        );
        formParams.set(`line_items[${itemIdx}][quantity]`, "1");
        itemIdx += 1;
      }

      const guestSub = created.guestDinnerCount * created.guestDinnerUnitCents;
      if (guestSub > 0) {
        formParams.set(`line_items[${itemIdx}][price_data][currency]`, "usd");
        formParams.set(
          `line_items[${itemIdx}][price_data][product_data][name]`,
          "Guest Workshop Dinner Ticket"
        );
        formParams.set(
          `line_items[${itemIdx}][price_data][unit_amount]`,
          String(created.guestDinnerUnitCents)
        );
        formParams.set(
          `line_items[${itemIdx}][quantity]`,
          String(created.guestDinnerCount)
        );
        itemIdx += 1;
      }

      if (created.optionalStudentFundDonationCents > 0) {
        formParams.set(`line_items[${itemIdx}][price_data][currency]`, "usd");
        formParams.set(
          `line_items[${itemIdx}][price_data][product_data][name]`,
          "Voluntary Gift — HEMS Student Travel Award Fund"
        );
        formParams.set(
          `line_items[${itemIdx}][price_data][unit_amount]`,
          String(created.optionalStudentFundDonationCents)
        );
        formParams.set(`line_items[${itemIdx}][quantity]`, "1");
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formParams.toString(),
      });
      const stripeData = (await stripeRes.json()) as {
        id?: string;
        url?: string;
        error?: { message?: string };
      };
      if (!stripeRes.ok || !stripeData.url) {
        res.status(502).json({
          ok: false,
          error: stripeData.error?.message || "Failed to initialize Stripe Checkout session.",
        });
        return;
      }

      await db.collection("workshop_registrations").doc(created.id).update({
        stripeSessionId: stripeData.id || "",
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        ok: true,
        mode: "stripe_redirect",
        checkoutUrl: stripeData.url,
        registration: created,
        receiptUrl,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create registration.";
      console.error("[registrationCreateSession] Error:", err);
      res.status(400).json({ ok: false, error: msg });
    }
  }
);

/**
 * POST /api/registration/webhooks/stripe
 * Verified Stripe webhook handling Cards, delayed ACH settlement, and refunds.
 */
export const registrationWebhookStripe = onRequest(
  {
    region: "us-central1",
    maxInstances: 5,
    memory: "256MiB",
    timeoutSeconds: 45,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!webhookSecret) {
      res.status(503).send("STRIPE_WEBHOOK_SECRET not configured");
      return;
    }

    const sig = req.headers["stripe-signature"];
    const sigStr = Array.isArray(sig) ? sig[0] : sig;
    if (!req.rawBody || !verifyStripeWebhookSignature(req.rawBody, sigStr, webhookSecret)) {
      res.status(400).send("Invalid Stripe signature");
      return;
    }

    try {
      const event = JSON.parse(req.rawBody.toString("utf8")) as {
        type?: string;
        data?: { object?: Record<string, unknown> };
      };
      const eventType = event.type || "";
      const obj = event.data?.object || {};
      const db = getDb();

      if (
        eventType === "checkout.session.completed" ||
        eventType === "checkout.session.async_payment_succeeded"
      ) {
        const paymentStatus = String(obj.payment_status || "");
        const metadata =
          typeof obj.metadata === "object" && obj.metadata
            ? (obj.metadata as Record<string, unknown>)
            : {};
        const regId = String(obj.client_reference_id || metadata.regId || "");
        const pi = String(obj.payment_intent || "");

        if (regId && (paymentStatus === "paid" || eventType === "checkout.session.async_payment_succeeded")) {
          const typesArr = Array.isArray(obj.payment_method_types)
            ? obj.payment_method_types.map((t) => String(t))
            : [];
          const summary = typesArr.includes("us_bank_account")
            ? "Stripe Online (Card / US ACH)"
            : "Stripe Card Payment";
          await fulfillRegistration({
            regId,
            targetStatus: "paid",
            paymentSummary: summary,
            stripePaymentIntentId: pi || undefined,
          });
        }
      } else if (eventType === "checkout.session.async_payment_failed") {
        const metadata =
          typeof obj.metadata === "object" && obj.metadata
            ? (obj.metadata as Record<string, unknown>)
            : {};
        const regId = String(obj.client_reference_id || metadata.regId || "");
        if (regId) {
          await db.collection("workshop_registrations").doc(regId).set(
            {
              status: "cancelled",
              paymentSummary: "ACH / Payment Failed",
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } else if (eventType === "charge.refunded") {
        const pi = String(obj.payment_intent || "");
        if (pi) {
          const snap = await db
            .collection("workshop_registrations")
            .where("stripePaymentIntentId", "==", pi)
            .limit(1)
            .get();
          if (!snap.empty) {
            const refundedDoc = snap.docs[0];
            const refundedData = refundedDoc.data() as RegistrationDoc;
            const nowIso = new Date().toISOString();
            await refundedDoc.ref.set(
              {
                status: "refunded",
                refundedAt: nowIso,
                updatedAt: nowIso,
              },
              { merge: true }
            );
            if (refundedData.email) {
              await revokeAttendeeAccessIfNoActiveSeat({
                db,
                email: refundedData.email,
                workshopYear: refundedData.workshopYear,
                excludeRegId: refundedDoc.id,
                nowIso,
              });
            }
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[registrationWebhookStripe] Processing error:", err);
      res.status(500).send("Webhook handler failure");
    }
  }
);

/**
 * GET /api/registration/receipt?regId=...&token=...
 * Returns token-authenticated read-only registration record for printable receipt.
 */
export const registrationGetReceipt = onRequest(
  {
    cors: true,
    region: "us-central1",
    maxInstances: 5,
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const regId = String(req.query.regId || "").trim();
    const token = String(req.query.token || "").trim();
    if (!regId) {
      res.status(400).json({ ok: false, error: "Missing regId parameter." });
      return;
    }

    try {
      const db = getDb();
      const ipRate = await enforceRateLimit({
        db,
        bucketKey: extractHashedClientIp(req, "reg_receipt"),
        maxHits: 40,
        windowSeconds: 900,
        persistToFirestore: true,
      });
      if (!ipRate.allowed) {
        res.setHeader("Retry-After", String(ipRate.retryAfterSec));
        res.status(429).json({ ok: false, error: "Too many receipt requests. Please wait a few minutes." });
        return;
      }

      const docSnap = await db.collection("workshop_registrations").doc(regId).get();
      if (!docSnap.exists) {
        res.status(404).json({ ok: false, error: "Registration record not found." });
        return;
      }
      const record = docSnap.data() as RegistrationDoc;
      const caller = await verifyCallerAuth(req.headers.authorization);
      const tokenMatches = Boolean(
        token && record.receiptToken && timingSafeSecretMatch(token, record.receiptToken)
      );
      const ownerMatches = Boolean(caller?.email && caller.email === record.email);

      if (
        !tokenMatches &&
        !ownerMatches &&
        !caller?.canManageOperations &&
        !caller?.canManageTreasurer
      ) {
        res.status(403).json({ ok: false, error: "Unauthorized receipt token." });
        return;
      }

      res.status(200).json({ ok: true, registration: record });
    } catch (err) {
      console.error("[registrationGetReceipt] Error:", err);
      res.status(500).json({ ok: false, error: "Failed to retrieve receipt." });
    }
  }
);

/**
 * POST /api/registration/admin-action
 * Restricted Board & Admin Treasurer Console actions (Mark Paid, Seat Transfer,
 * Refund/Cancel, Check-In, Promo CRUD, Sheet Resync, Resend Receipt).
 */
export const registrationAdminAction = onRequest(
  {
    cors: true,
    region: "us-central1",
    maxInstances: 3,
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const caller = await verifyCallerAuth(req.headers.authorization);
    if (!caller || (!caller.canManageOperations && !caller.canManageTreasurer)) {
      res.status(403).json({
        ok: false,
        error: "Operations or Treasurer authorization required.",
      });
      return;
    }

    try {
      const body = typeof req.body === "object" && req.body ? req.body : {};
      const action = String(body.action || "");
      const db = getDb();
      const nowIso = new Date().toISOString();

      const OPERATIONS_ONLY_ACTIONS = new Set([
        "toggle_checkin",
        "transfer_seat",
      ]);

      const TREASURER_ONLY_ACTIONS = new Set([
        "mark_invoice_paid",
        "refund_or_cancel",
        "upsert_promo",
        "toggle_promo",
        "get_stripe_summary",
      ]);

      if (OPERATIONS_ONLY_ACTIONS.has(action) && !caller.canManageOperations) {
        res.status(403).json({
          ok: false,
          error: "Operations Officer authorization required for desk/roster actions.",
        });
        return;
      }

      if (TREASURER_ONLY_ACTIONS.has(action) && !caller.canManageTreasurer) {
        res.status(403).json({
          ok: false,
          error: "Treasurer authorization required for financial actions.",
        });
        return;
      }

      if (action === "get_stripe_summary") {
        const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
        const hasWebhookSecret = Boolean((process.env.STRIPE_WEBHOOK_SECRET || "").trim());
        const mode = !stripeSecretKey
          ? "unconfigured"
          : stripeSecretKey.startsWith("sk_live_")
          ? "live"
          : stripeSecretKey.startsWith("sk_test_")
          ? "test"
          : "live";

        if (!stripeSecretKey) {
          res.status(200).json({
            ok: true,
            summary: {
              configured: false,
              mode: "unconfigured",
              hasWebhookSecret,
              availableUsdCents: null,
              pendingUsdCents: null,
              recentPayouts: [],
              fetchedAt: nowIso,
            },
          });
          return;
        }

        try {
          const [balRes, payRes] = await Promise.all([
            fetch("https://api.stripe.com/v1/balance", {
              headers: { Authorization: `Bearer ${stripeSecretKey}` },
              signal: AbortSignal.timeout(5000),
            }),
            fetch("https://api.stripe.com/v1/payouts?limit=5", {
              headers: { Authorization: `Bearer ${stripeSecretKey}` },
              signal: AbortSignal.timeout(5000),
            }),
          ]);

          let availableUsdCents = 0;
          let pendingUsdCents = 0;
          if (balRes.ok) {
            const balData = (await balRes.json()) as {
              available?: Array<{ amount?: number; currency?: string }>;
              pending?: Array<{ amount?: number; currency?: string }>;
            };
            availableUsdCents = (balData.available || [])
              .filter((x) => (x.currency || "usd") === "usd")
              .reduce((sum, x) => sum + (x.amount || 0), 0);
            pendingUsdCents = (balData.pending || [])
              .filter((x) => (x.currency || "usd") === "usd")
              .reduce((sum, x) => sum + (x.amount || 0), 0);
          }

          let recentPayouts: Array<{
            id: string;
            amountCents: number;
            currency: string;
            status: string;
            arrivalDateIso: string;
            method?: string;
          }> = [];
          if (payRes.ok) {
            const payData = (await payRes.json()) as {
              data?: Array<{
                id: string;
                amount: number;
                currency: string;
                status: string;
                arrival_date?: number;
                method?: string;
              }>;
            };
            recentPayouts = (payData.data || []).map((p) => ({
              id: p.id,
              amountCents: p.amount || 0,
              currency: (p.currency || "usd").toUpperCase(),
              status: p.status || "unknown",
              arrivalDateIso: p.arrival_date
                ? new Date(p.arrival_date * 1000).toISOString()
                : nowIso,
              method: p.method,
            }));
          }

          res.status(200).json({
            ok: true,
            summary: {
              configured: true,
              mode,
              hasWebhookSecret,
              availableUsdCents: balRes.ok ? availableUsdCents : null,
              pendingUsdCents: balRes.ok ? pendingUsdCents : null,
              recentPayouts,
              fetchedAt: nowIso,
              ...(!balRes.ok ? { error: `Stripe Balance API returned HTTP ${balRes.status}` } : {}),
            },
          });
        } catch (stripeErr) {
          res.status(200).json({
            ok: true,
            summary: {
              configured: true,
              mode,
              hasWebhookSecret,
              availableUsdCents: null,
              pendingUsdCents: null,
              recentPayouts: [],
              fetchedAt: nowIso,
              error: stripeErr instanceof Error ? stripeErr.message : "Stripe summary request failed",
            },
          });
        }
        return;
      }

      if (action === "mark_invoice_paid") {
        const regId = String(body.regId || "").trim();
        const refNote = String(body.paymentReferenceNote || "Check / ACH Verified")
          .trim()
          .slice(0, 120);
        const fulfilled = await fulfillRegistration({
          regId,
          targetStatus: "paid",
          paymentSummary: refNote,
          paymentReferenceNote: refNote,
        });
        if (!fulfilled) {
          res.status(404).json({ ok: false, error: "Registration not found." });
          return;
        }
        res.status(200).json({ ok: true, registration: fulfilled });
        return;
      }

      if (action === "transfer_seat") {
        const regId = String(body.regId || "").trim();
        const toEmail = normalizeEmail(body.toEmail);
        const toFirstName = String(body.toFirstName || "").trim().slice(0, 80);
        const toLastName = String(body.toLastName || "").trim().slice(0, 80);
        const toAffiliation = String(body.toAffiliation || "").trim().slice(0, 140);
        if (!regId || !isValidEmail(toEmail) || !toFirstName || !toLastName) {
          res.status(400).json({
            ok: false,
            error: "Valid regId, recipient name, and email are required for seat transfer.",
          });
          return;
        }

        const regRef = db.collection("workshop_registrations").doc(regId);
        const { updatedReg, fromEmail } = await db.runTransaction(async (tx) => {
          const snap = await tx.get(regRef);
          if (!snap.exists) throw new Error("Registration not found.");
          const cur = snap.data() as RegistrationDoc;
          const prevEmail = normalizeEmail(cur.email);

          const newWlRef = db.collection("whitelist").doc(toEmail);
          const newWlSnap = await tx.get(newWlRef);
          const newSubRef = db.collection("mailing_subscribers").doc(emailDocId(toEmail));
          const newSubSnap = await tx.get(newSubRef);

          const nextHistory = [
            ...(cur.transferHistory || []),
            {
              fromEmail: cur.email,
              toEmail,
              fromName: `${cur.firstName} ${cur.lastName}`,
              toName: `${toFirstName} ${toLastName}`,
              transferredBy: caller.email || caller.uid,
              transferredAt: nowIso,
            },
          ];

          const nextDoc: RegistrationDoc = {
            ...cur,
            email: toEmail,
            firstName: toFirstName,
            lastName: toLastName,
            affiliation: toAffiliation || cur.affiliation,
            badgeName: `${toFirstName} ${toLastName}`.trim(),
            badgeAffiliation: toAffiliation || cur.badgeAffiliation,
            transferHistory: nextHistory,
            updatedAt: nowIso,
          };

          tx.set(regRef, nextDoc, { merge: true });

          if (cur.status === "paid" || cur.status === "comped") {
            const roleSet = new Set<string>(
              Array.isArray(newWlSnap.data()?.roles)
                ? newWlSnap.data()?.roles.map((r: unknown) => String(r))
                : []
            );
            roleSet.add("attendee");
            if (cur.tier === "sponsor" || cur.grantsSponsorRole) {
              roleSet.add("corporate sponsor");
            }
            const yearsSet = new Set<number>([
              ...(Array.isArray(newWlSnap.data()?.workshopYears)
                ? (newWlSnap.data()?.workshopYears as number[])
                : []),
              cur.workshopYear,
            ]);

            tx.set(
              newWlRef,
              {
                email: toEmail,
                firstName: newWlSnap.data()?.firstName || toFirstName,
                lastName: newWlSnap.data()?.lastName || toLastName,
                affiliation: newWlSnap.data()?.affiliation || toAffiliation || cur.affiliation,
                name: newWlSnap.data()?.name || `${toFirstName} ${toLastName}`,
                roles: Array.from(roleSet),
                workshopYears: Array.from(yearsSet).sort(),
                updatedAt: nowIso,
              },
              { merge: true }
            );

            if (cur.mailingListOptIn) {
              const existingNewSub = newSubSnap.exists ? newSubSnap.data() : null;
              const existingNewStatus = existingNewSub?.status as string | undefined;
              if (existingNewStatus !== "complained" && existingNewStatus !== "unsubscribed") {
                const yearTag = `${cur.workshopYear} Attendees`;
                const subTags = new Set<string>([
                  ...(Array.isArray(existingNewSub?.sublists)
                    ? (existingNewSub?.sublists as string[])
                    : []),
                  yearTag,
                ]);
                if (cur.tier === "sponsor" || cur.grantsSponsorRole) {
                  subTags.add(`${cur.workshopYear} Corporate Sponsors`);
                }
                tx.set(
                  newSubRef,
                  {
                    email: toEmail,
                    firstName: existingNewSub?.firstName || toFirstName,
                    lastName: existingNewSub?.lastName || toLastName,
                    affiliation: existingNewSub?.affiliation || toAffiliation || cur.affiliation,
                    interests: ["workshop"],
                    sublists: Array.from(subTags),
                    status: "active",
                    source: existingNewSub?.source || "registration_transfer",
                    unsubscribeToken:
                      existingNewSub?.unsubscribeToken || generateSecureToken(),
                    optInToken: existingNewSub?.optInToken || generateSecureToken(),
                    createdAt: existingNewSub?.createdAt || nowIso,
                    updatedAt: nowIso,
                    confirmedAt: existingNewSub?.confirmedAt || nowIso,
                  },
                  { merge: true }
                );
              }
            }
          }

          return { updatedReg: nextDoc, fromEmail: prevEmail };
        });

        if (fromEmail && fromEmail !== toEmail) {
          await revokeAttendeeAccessIfNoActiveSeat({
            db,
            email: fromEmail,
            workshopYear: updatedReg.workshopYear,
            excludeRegId: updatedReg.id,
            nowIso,
          });
        }

        const msg = buildReceiptEmailHtml(updatedReg);
        await sendPostmarkEmail({
          to: updatedReg.email,
          subject: `[Seat Transfer Confirmed] ${msg.subject}`,
          htmlBody: msg.htmlBody,
          textBody: msg.textBody,
        });

        res.status(200).json({ ok: true, registration: updatedReg });
        return;
      }

      if (action === "toggle_checkin") {
        const regId = String(body.regId || "").trim();
        const ref = db.collection("workshop_registrations").doc(regId);
        const snap = await ref.get();
        if (!snap.exists) {
          res.status(404).json({ ok: false, error: "Registration not found." });
          return;
        }
        const cur = snap.data() as RegistrationDoc;
        await ref.update({
          checkedInAt: cur.checkedInAt ? admin.firestore.FieldValue.delete() : nowIso,
          updatedAt: nowIso,
        });
        res.status(200).json({ ok: true });
        return;
      }

      if (action === "refund_or_cancel") {
        const regId = String(body.regId || "").trim();
        const nextStatus = body.status === "cancelled" ? "cancelled" : "refunded";
        const refundReason = String(body.refundReason || "").trim().slice(0, 200);
        const revokeAttendeeRole = body.revokeAttendeeRole !== false;
        const ref = db.collection("workshop_registrations").doc(regId);
        const snap = await ref.get();
        if (!snap.exists) {
          res.status(404).json({ ok: false, error: "Registration not found." });
          return;
        }
        const cur = snap.data() as RegistrationDoc;
        const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
        if (nextStatus === "refunded" && cur.stripePaymentIntentId && stripeSecretKey) {
          const rfParams = new URLSearchParams();
          rfParams.set("payment_intent", cur.stripePaymentIntentId);
          const rfRes = await fetch("https://api.stripe.com/v1/refunds", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: rfParams.toString(),
          });
          if (!rfRes.ok) {
            const rfErr = await rfRes.text();
            res.status(502).json({ ok: false, error: `Stripe refund failed: ${rfErr}` });
            return;
          }
        }
        await ref.set(
          {
            status: nextStatus,
            refundedAt: nowIso,
            ...(refundReason ? { refundReason } : {}),
            updatedAt: nowIso,
          },
          { merge: true }
        );
        if (revokeAttendeeRole && cur.email) {
          await revokeAttendeeAccessIfNoActiveSeat({
            db,
            email: cur.email,
            workshopYear: cur.workshopYear,
            excludeRegId: cur.id,
            nowIso,
          });
        }
        res.status(200).json({ ok: true });
        return;
      }

      if (action === "upsert_promo") {
        const promo = body.promo as PromoCodeDoc;
        const cleanCode = String(promo?.code || "").trim().toUpperCase();
        if (!cleanCode) {
          res.status(400).json({ ok: false, error: "Promo code string required." });
          return;
        }
        const ref = db.collection("workshop_promo_codes").doc(cleanCode);
        const snap = await ref.get();
        await ref.set(
          {
            ...promo,
            code: cleanCode,
            createdAt: snap.exists ? snap.data()?.createdAt || nowIso : nowIso,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        res.status(200).json({ ok: true });
        return;
      }

      if (action === "toggle_promo") {
        const code = String(body.code || "").trim().toUpperCase();
        const ref = db.collection("workshop_promo_codes").doc(code);
        const snap = await ref.get();
        if (!snap.exists) {
          res.status(404).json({ ok: false, error: "Promo code not found." });
          return;
        }
        await ref.update({ active: !snap.data()?.active, updatedAt: nowIso });
        res.status(200).json({ ok: true });
        return;
      }

      if (action === "resync_sheet") {
        const regId = String(body.regId || "").trim();
        const ref = db.collection("workshop_registrations").doc(regId);
        const snap = await ref.get();
        if (!snap.exists) {
          res.status(404).json({ ok: false, error: "Registration not found." });
          return;
        }
        const sheetRes = await appendRowToGoogleSheet(snap.data() as RegistrationDoc);
        await ref.set(
          {
            sheetSyncStatus: sheetRes.status,
            ...(sheetRes.error ? { sheetSyncError: sheetRes.error } : {}),
            updatedAt: nowIso,
          },
          { merge: true }
        );
        res.status(200).json({ ok: sheetRes.status === "synced", ...sheetRes });
        return;
      }

      if (action === "resend_receipt") {
        const regId = String(body.regId || "").trim();
        const snap = await db.collection("workshop_registrations").doc(regId).get();
        if (!snap.exists) {
          res.status(404).json({ ok: false, error: "Registration not found." });
          return;
        }
        const reg = snap.data() as RegistrationDoc;
        const msg = buildReceiptEmailHtml(reg);
        await sendPostmarkEmail({
          to: reg.email,
          subject: msg.subject,
          htmlBody: msg.htmlBody,
          textBody: msg.textBody,
        });
        res.status(200).json({ ok: true });
        return;
      }

      res.status(400).json({ ok: false, error: `Unknown admin action: ${action}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Admin action failed.";
      console.error("[registrationAdminAction] Error:", err);
      res.status(500).json({ ok: false, error: msg });
    }
  }
);
