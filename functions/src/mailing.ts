import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const SITE_ORIGIN = process.env.HEMS_SITE_ORIGIN || "https://hems-workshop.org";
const FROM_TRANSACTIONAL =
  process.env.POSTMARK_FROM_TRANSACTIONAL ||
  "HEMS Society <announcements@mail.hems-workshop.org>";
const FROM_BROADCAST =
  process.env.POSTMARK_FROM_BROADCAST ||
  "HEMS Workshop Organizing Committee <announcements@mail.hems-workshop.org>";
const REPLY_TO_ADDRESS =
  process.env.POSTMARK_REPLY_TO || "info@hems-workshop.org";
const POSTAL_ADDRESS_FOOTER =
  process.env.HEMS_POSTAL_FOOTER ||
  "Harsh-Environment Mass Spectrometry Society, Inc. (501(c)(3) Scientific Organization) • St. Petersburg, FL, USA";

type SubscriberStatus =
  | "pending_opt_in"
  | "active"
  | "unsubscribed"
  | "bounced"
  | "complained";

interface PostmarkHeader {
  Name: string;
  Value: string;
}

interface PostmarkMessagePayload {
  From: string;
  To: string;
  ReplyTo: string;
  Subject: string;
  HtmlBody: string;
  TextBody: string;
  MessageStream: string;
  TrackOpens: boolean;
  TrackLinks: "None";
  Headers?: PostmarkHeader[];
}

function getDb(): admin.firestore.Firestore {
  return admin.firestore();
}

function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
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

function buildScholarlyLetterHtml(params: {
  heading: string;
  paragraphsHtml: string;
  unsubscribeUrl: string;
  isTransactional?: boolean;
}): string {
  const footerNote = params.isTransactional
    ? `You received this one-time verification message because this email address was entered on ${SITE_ORIGIN}. If you did not request this, simply ignore this email.`
    : `You are receiving official academic symposium announcements from the Harsh-Environment Mass Spectrometry Society. Unsubscribe or update your institutional email at any time: <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#1E3A8A;text-decoration:underline;">Manage subscription / Unsubscribe</a>.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(params.heading)}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;line-height:1.6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;">
    <tr>
      <td style="padding:24px 28px 16px 28px;border-bottom:1px solid #E2E8F0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;color:#1E3A8A;letter-spacing:-0.01em;">
          Harsh-Environment Mass Spectrometry Society
        </div>
        <div style="font-size:12px;color:#64748B;margin-top:2px;">
          501(c)(3) Scientific Organization &bull; <a href="${SITE_ORIGIN}/" style="color:#1E3A8A;text-decoration:none;">hems-workshop.org</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;font-size:15px;color:#1E293B;">
        ${params.paragraphsHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 22px 28px;border-top:1px solid #F1F5F9;background-color:#F8FAFC;font-size:12px;color:#64748B;border-bottom-left-radius:10px;border-bottom-right-radius:10px;">
        <p style="margin:0 0 6px 0;">${footerNote}</p>
        <p style="margin:0;color:#94A3B8;">${escapeHtml(POSTAL_ADDRESS_FOOTER)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendPostmarkSingle(
  serverToken: string,
  payload: PostmarkMessagePayload
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": serverToken,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text();
    return { ok: false, error: `Postmark HTTP ${res.status}: ${errBody}` };
  }
  return { ok: true };
}

async function sendPostmarkBatch(
  serverToken: string,
  messages: PostmarkMessagePayload[]
): Promise<{ delivered: number; failed: number }> {
  let delivered = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += 500) {
    const chunk = messages.slice(i, i + 500);
    const res = await fetch("https://api.postmarkapp.com/email/batch", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": serverToken,
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      failed += chunk.length;
      continue;
    }

    const results = (await res.json()) as Array<{ ErrorCode?: number }>;
    for (const item of results) {
      if (item && item.ErrorCode === 0) {
        delivered += 1;
      } else {
        failed += 1;
      }
    }
  }

  return { delivered, failed };
}

function matchesBoardOrAdminRoles(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => {
    if (typeof r !== "string") return false;
    const norm = r.trim().toLowerCase();
    return (
      norm === "admin" ||
      norm === "board" ||
      norm === "board_member" ||
      norm === "board member" ||
      norm === "board members"
    );
  });
}

async function verifyBoardOrAdminCaller(
  authHeader: string | undefined
): Promise<{ email: string; uid: string } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const db = getDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (matchesBoardOrAdminRoles(userDoc.data()?.roles)) {
      return { email: decoded.email || "", uid: decoded.uid };
    }

    if (decoded.email) {
      const wlDoc = await db
        .collection("whitelist")
        .doc(decoded.email.toLowerCase())
        .get();
      if (matchesBoardOrAdminRoles(wlDoc.data()?.roles)) {
        return { email: decoded.email, uid: decoded.uid };
      }
    }
    return null;
  } catch (err) {
    console.error("[mailing] Token verification failed:", err);
    return null;
  }
}

/**
 * Public Double-Opt-In Subscription Endpoint
 * Route: POST /api/mailing/subscribe
 */
export const mailingSubscribe = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    try {
      const body = typeof req.body === "object" && req.body ? req.body : {};
      // Honeypot check against automated bots
      if (body.websiteUrl && String(body.websiteUrl).trim() !== "") {
        res.status(200).json({ ok: true, mode: "filtered" });
        return;
      }

      const email = normalizeEmail(body.email);
      if (!isValidEmail(email)) {
        res.status(400).json({ ok: false, error: "Please enter a valid email address." });
        return;
      }

      const firstName = String(body.firstName || "").trim().slice(0, 80);
      const lastName = String(body.lastName || "").trim().slice(0, 80);
      const affiliation = String(body.affiliation || "").trim().slice(0, 140);
      const rawInterests = Array.isArray(body.interests) ? body.interests : ["workshop"];
      const allowedInterests = new Set(["workshop", "student_awards", "sponsorship"]);
      const interests = rawInterests
        .map((x: unknown) => String(x))
        .filter((x: string) => allowedInterests.has(x));

      const db = getDb();
      const docRef = db.collection("mailing_subscribers").doc(emailDocId(email));
      const existingSnap = await docRef.get();
      const existing = existingSnap.exists ? existingSnap.data() : null;

      if (existing?.status === "complained") {
        res.status(200).json({
          ok: true,
          message:
            "If this address is eligible for announcements, a confirmation link has been sent.",
        });
        return;
      }

      const now = new Date().toISOString();
      const optInToken = generateSecureToken();
      const unsubscribeToken =
        typeof existing?.unsubscribeToken === "string" && existing.unsubscribeToken.length >= 24
          ? existing.unsubscribeToken
          : generateSecureToken();

      const nextStatus: SubscriberStatus =
        existing?.status === "active" ? "active" : "pending_opt_in";

      await docRef.set(
        {
          email,
          firstName: firstName || existing?.firstName || "",
          lastName: lastName || existing?.lastName || "",
          affiliation: affiliation || existing?.affiliation || "",
          interests: interests.length > 0 ? interests : ["workshop"],
          status: nextStatus,
          source: existing?.source || "website",
          optInToken,
          unsubscribeToken,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        },
        { merge: true }
      );

      const postmarkToken = (process.env.POSTMARK_SERVER_TOKEN || "").trim();
      if (!postmarkToken) {
        res.status(200).json({
          ok: true,
          mode: "sandbox",
          alreadyActive: nextStatus === "active",
          message:
            "Subscription recorded in preview mode. Double opt-in email dispatch activates automatically once POSTMARK_SERVER_TOKEN is configured.",
        });
        return;
      }

      if (nextStatus !== "active") {
        const confirmUrl = `${SITE_ORIGIN}/unsubscribe/?confirm=${encodeURIComponent(optInToken)}`;
        const greeting = firstName ? `Dear ${escapeHtml(firstName)},` : "Dear Colleague,";
        const htmlBody = buildScholarlyLetterHtml({
          heading: "Confirm HEMS Society Mailing List Subscription",
          paragraphsHtml: `
            <p style="margin:0 0 14px 0;">${greeting}</p>
            <p style="margin:0 0 16px 0;">Please confirm your subscription to receive official announcements from the Harsh-Environment Mass Spectrometry (HEMS) Society, including Call for Papers, Student Travel Awards, and biennial workshop updates:</p>
            <p style="margin:0 0 18px 0;">
              <a href="${confirmUrl}" style="display:inline-block;padding:10px 18px;background-color:#1E3A8A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Confirm Subscription</a>
            </p>
            <p style="margin:0;font-size:13px;color:#475569;">Direct link: <a href="${confirmUrl}" style="color:#1E3A8A;">${confirmUrl}</a></p>
          `,
          unsubscribeUrl: confirmUrl,
          isTransactional: true,
        });
        const textBody = `${firstName ? `Dear ${firstName},` : "Dear Colleague,"}\n\nPlease confirm your subscription to the Harsh-Environment Mass Spectrometry (HEMS) Society mailing list by visiting:\n\n${confirmUrl}\n\nIf you did not request this subscription, you may safely disregard this message.\n\n${POSTAL_ADDRESS_FOOTER}`;

        await sendPostmarkSingle(postmarkToken, {
          From: FROM_TRANSACTIONAL,
          To: email,
          ReplyTo: REPLY_TO_ADDRESS,
          Subject: "Confirm your HEMS Society mailing list subscription",
          HtmlBody: htmlBody,
          TextBody: textBody,
          MessageStream: process.env.POSTMARK_TRANSACTIONAL_STREAM || "outbound",
          TrackOpens: false,
          TrackLinks: "None",
        });
      }

      res.status(200).json({
        ok: true,
        mode: "live",
        alreadyActive: nextStatus === "active",
        message:
          nextStatus === "active"
            ? "Your subscription preferences have been updated."
            : "Please check your inbox for a one-click confirmation link to complete your subscription.",
      });
    } catch (err) {
      console.error("[mailingSubscribe] Unexpected error:", err);
      res.status(500).json({ ok: false, error: "Unable to process subscription request." });
    }
  }
);

/**
 * Double-Opt-In Token Confirmation Endpoint
 * Route: POST /api/mailing/confirm
 */
export const mailingConfirm = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    try {
      const token = String(req.body?.token || "").trim();
      if (token.length < 16) {
        res.status(400).json({ ok: false, error: "Invalid confirmation token." });
        return;
      }

      const db = getDb();
      const snap = await db
        .collection("mailing_subscribers")
        .where("optInToken", "==", token)
        .limit(1)
        .get();

      if (snap.empty) {
        res.status(404).json({ ok: false, error: "Confirmation link expired or not found." });
        return;
      }

      const docSnap = snap.docs[0];
      const now = new Date().toISOString();
      await docSnap.ref.update({
        status: "active",
        confirmedAt: now,
        updatedAt: now,
      });

      res.status(200).json({
        ok: true,
        email: docSnap.data().email,
        message: "Your email address is now confirmed for HEMS Society announcements.",
      });
    } catch (err) {
      console.error("[mailingConfirm] Unexpected error:", err);
      res.status(500).json({ ok: false, error: "Unable to confirm subscription." });
    }
  }
);

/**
 * RFC 8058 One-Click Unsubscribe & Subscriber Self-Service Endpoint
 * Routes:
 *   POST /api/mailing/one-click-unsubscribe?token=...  (Gmail/Outlook native 1-click header)
 *   POST /api/mailing/unsubscribe                      (Website /unsubscribe UI)
 */
export const mailingUnsubscribe = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    try {
      const token = String(req.query.token || req.body?.token || "").trim();
      const action = String(req.body?.action || "unsubscribe").trim();
      const db = getDb();
      const now = new Date().toISOString();

      // Token-authenticated path (RFC 8058 1-click OR signed footer link)
      if (token.length >= 16) {
        const snap = await db
          .collection("mailing_subscribers")
          .where("unsubscribeToken", "==", token)
          .limit(1)
          .get();

        if (snap.empty) {
          res.status(404).json({ ok: false, error: "Subscription token not found." });
          return;
        }

        const subDoc = snap.docs[0];
        const subData = subDoc.data();

        if (action === "resubscribe") {
          await subDoc.ref.update({
            status: "active",
            updatedAt: now,
          });
          res.status(200).json({ ok: true, email: subData.email, status: "active" });
          return;
        }

        if (action === "update_email") {
          const newEmail = normalizeEmail(req.body?.newEmail);
          if (!isValidEmail(newEmail)) {
            res.status(400).json({ ok: false, error: "Please provide a valid new email address." });
            return;
          }
          const newDocRef = db.collection("mailing_subscribers").doc(emailDocId(newEmail));
          await db.runTransaction(async (tx) => {
            tx.update(subDoc.ref, {
              status: "unsubscribed",
              unsubscribedAt: now,
              updatedAt: now,
            });
            tx.set(
              newDocRef,
              {
                ...subData,
                email: newEmail,
                status: "active",
                unsubscribeToken: generateSecureToken(),
                optInToken: generateSecureToken(),
                updatedAt: now,
              },
              { merge: true }
            );
          });
          res.status(200).json({ ok: true, email: newEmail, status: "active" });
          return;
        }

        await subDoc.ref.update({
          status: "unsubscribed",
          unsubscribedAt: now,
          updatedAt: now,
        });
        res.status(200).json({ ok: true, email: subData.email, status: "unsubscribed" });
        return;
      }

      // Tokenless manual unsubscribe form submission
      const email = normalizeEmail(req.body?.email);
      if (!isValidEmail(email)) {
        res.status(400).json({ ok: false, error: "Please provide a valid email address." });
        return;
      }

      const subRef = db.collection("mailing_subscribers").doc(emailDocId(email));
      const subSnap = await subRef.get();
      const postmarkToken = (process.env.POSTMARK_SERVER_TOKEN || "").trim();

      if (subSnap.exists && postmarkToken) {
        const subData = subSnap.data()!;
        const unsubToken = subData.unsubscribeToken || generateSecureToken();
        if (!subData.unsubscribeToken) {
          await subRef.update({ unsubscribeToken: unsubToken });
        }
        const unsubUrl = `${SITE_ORIGIN}/unsubscribe/?token=${encodeURIComponent(unsubToken)}`;
        await sendPostmarkSingle(postmarkToken, {
          From: FROM_TRANSACTIONAL,
          To: email,
          ReplyTo: REPLY_TO_ADDRESS,
          Subject: "Confirm HEMS Society mailing list unsubscribe",
          HtmlBody: buildScholarlyLetterHtml({
            heading: "Unsubscribe Link",
            paragraphsHtml: `<p style="margin:0 0 14px 0;">Use the secure link below to immediately unsubscribe <strong>${escapeHtml(email)}</strong> from HEMS Society announcements:</p><p style="margin:0;"><a href="${unsubUrl}" style="color:#1E3A8A;font-weight:600;">${unsubUrl}</a></p>`,
            unsubscribeUrl: unsubUrl,
            isTransactional: true,
          }),
          TextBody: `Use the link below to immediately unsubscribe ${email} from HEMS Society announcements:\n\n${unsubUrl}\n\n${POSTAL_ADDRESS_FOOTER}`,
          MessageStream: process.env.POSTMARK_TRANSACTIONAL_STREAM || "outbound",
          TrackOpens: false,
          TrackLinks: "None",
        });
      } else if (subSnap.exists) {
        await subRef.update({
          status: "unsubscribed",
          unsubscribedAt: now,
          updatedAt: now,
        });
      }

      res.status(200).json({
        ok: true,
        message:
          "If that address is on the HEMS mailing list, your unsubscribe request has been processed.",
      });
    } catch (err) {
      console.error("[mailingUnsubscribe] Unexpected error:", err);
      res.status(500).json({ ok: false, error: "Unable to process unsubscribe request." });
    }
  }
);

/**
 * Postmark Bounce & Spam-Complaint Suppression Webhook
 * Route: POST /api/mailing/webhooks/postmark
 */
export const mailingWebhookPostmark = onRequest(
  { cors: false, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const expectedSecret = (process.env.POSTMARK_WEBHOOK_SECRET || "").trim();
    const providedSecret = String(req.headers["x-hems-webhook-secret"] || "").trim();
    if (!expectedSecret || providedSecret !== expectedSecret) {
      res.status(401).json({ ok: false, error: "Unauthorized webhook" });
      return;
    }

    try {
      const payload = req.body || {};
      const recordType = String(payload.RecordType || "");
      const email = normalizeEmail(payload.Email);

      if (!isValidEmail(email)) {
        res.status(200).json({ ok: true, ignored: true });
        return;
      }

      const db = getDb();
      const docRef = db.collection("mailing_subscribers").doc(emailDocId(email));
      const now = new Date().toISOString();

      if (recordType === "SpamComplaint") {
        await docRef.set(
          {
            email,
            status: "complained",
            bounceReason: "Postmark SpamComplaint feedback loop",
            updatedAt: now,
          },
          { merge: true }
        );
      } else if (
        recordType === "Bounce" &&
        ["HardBounce", "BadEmailAddress", "ManuallyDeactivated"].includes(
          String(payload.Type || "")
        )
      ) {
        await docRef.set(
          {
            email,
            status: "bounced",
            bounceReason: String(payload.Description || payload.Type || "HardBounce").slice(
              0,
              240
            ),
            updatedAt: now,
          },
          { merge: true }
        );
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[mailingWebhookPostmark] Error handling webhook:", err);
      res.status(500).json({ ok: false });
    }
  }
);

/**
 * Authenticated Board/Admin Test-Send & Broadcast Dispatch Endpoint
 * Route: POST /api/mailing/send-campaign
 */
export const mailingSendCampaign = onRequest(
  { cors: true, region: "us-central1", timeoutSeconds: 300 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const caller = await verifyBoardOrAdminCaller(req.headers.authorization);
    if (!caller) {
      res.status(403).json({
        ok: false,
        error: "Board Member or Admin authentication is required.",
      });
      return;
    }

    try {
      const mode = req.body?.mode === "broadcast" ? "broadcast" : "test";
      const subject = String(req.body?.subject || "").trim();
      const segment = String(req.body?.segment || "all").trim();
      const campaignSlug = String(req.body?.campaignSlug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

      const tagFirstPartyUrls = (content: string): string => {
        if (!campaignSlug) return content;
        return content.replace(
          /https:\/\/(?:www\.)?hems-workshop\.org(?:\/[^\s"<)]*)?/gi,
          (matchedUrl) => {
            const lower = matchedUrl.toLowerCase();
            if (
              lower.includes("/unsubscribe") ||
              lower.includes("/api/mailing/") ||
              /[?&](?:src|utm_campaign)=/i.test(matchedUrl)
            ) {
              return matchedUrl;
            }
            const hashIdx = matchedUrl.indexOf("#");
            const base = hashIdx >= 0 ? matchedUrl.slice(0, hashIdx) : matchedUrl;
            const hash = hashIdx >= 0 ? matchedUrl.slice(hashIdx) : "";
            const sep = base.includes("?") ? "&" : "?";
            return `${base}${sep}src=${encodeURIComponent(campaignSlug)}${hash}`;
          }
        );
      };

      const paragraphsHtml = tagFirstPartyUrls(String(req.body?.paragraphsHtml || "").trim());
      const plainBodyCore = tagFirstPartyUrls(String(req.body?.plainBodyCore || "").trim());
      const markdownBody = String(req.body?.markdownBody || "").trim();

      if (!subject || !paragraphsHtml || !plainBodyCore) {
        res.status(400).json({
          ok: false,
          error: "Subject, HTML content, and plain-text content are required.",
        });
        return;
      }

      const postmarkToken = (process.env.POSTMARK_SERVER_TOKEN || "").trim();
      const broadcastStream = process.env.POSTMARK_BROADCAST_STREAM || "broadcast";

      if (mode === "test") {
        const testRecipient = normalizeEmail(req.body?.testEmail || caller.email);
        if (!isValidEmail(testRecipient)) {
          res.status(400).json({ ok: false, error: "Valid test recipient email required." });
          return;
        }

        if (!postmarkToken) {
          res.status(200).json({
            ok: true,
            mode: "sandbox",
            recipientCount: 1,
            deliveredCount: 1,
            failedCount: 0,
            message: `Sandbox test verified for ${testRecipient} (set POSTMARK_SERVER_TOKEN to send live emails).`,
          });
          return;
        }

        const sampleUnsubUrl = `${SITE_ORIGIN}/unsubscribe/?token=test-preview`;
        const oneClickUrl = `${SITE_ORIGIN}/api/mailing/one-click-unsubscribe?token=test-preview`;
        const sendRes = await sendPostmarkSingle(postmarkToken, {
          From: FROM_BROADCAST,
          To: testRecipient,
          ReplyTo: REPLY_TO_ADDRESS,
          Subject: `[TEST] ${subject}`,
          HtmlBody: buildScholarlyLetterHtml({
            heading: subject,
            paragraphsHtml,
            unsubscribeUrl: sampleUnsubUrl,
          }),
          TextBody: `${plainBodyCore}\n\n---\nManage subscription / Unsubscribe: ${sampleUnsubUrl}\n${POSTAL_ADDRESS_FOOTER}`,
          MessageStream: broadcastStream,
          TrackOpens: false,
          TrackLinks: "None",
          Headers: [
            { Name: "List-Unsubscribe", Value: `<${oneClickUrl}>, <mailto:${REPLY_TO_ADDRESS}?subject=Unsubscribe>` },
            { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
          ],
        });

        if (!sendRes.ok) {
          res.status(502).json({ ok: false, error: sendRes.error });
          return;
        }

        res.status(200).json({
          ok: true,
          mode: "live",
          recipientCount: 1,
          deliveredCount: 1,
          failedCount: 0,
          message: `Test email sent to ${testRecipient} via Postmark (${broadcastStream}).`,
        });
        return;
      }

      // Broadcast mode
      const db = getDb();
      const activeSnap = await db
        .collection("mailing_subscribers")
        .where("status", "==", "active")
        .get();

      const recipients: Array<{ email: string; unsubscribeToken: string }> = [];
      activeSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const email = normalizeEmail(d.email);
        if (!isValidEmail(email)) return;
        if (segment !== "all") {
          const interests: string[] = Array.isArray(d.interests) ? d.interests : [];
          const sublists: string[] = Array.isArray(d.sublists) ? d.sublists : [];
          if (segment.startsWith("sublist:")) {
            const targetSublist = segment.slice("sublist:".length).trim().toLowerCase();
            const matchedSublist =
              sublists.some((t) => String(t).trim().toLowerCase() === targetSublist) ||
              interests.some((t) => String(t).trim().toLowerCase() === segment.toLowerCase());
            if (!matchedSublist) return;
          } else if (!interests.includes(segment)) {
            return;
          }
        }
        recipients.push({
          email,
          unsubscribeToken: d.unsubscribeToken || generateSecureToken(),
        });
      });

      const now = new Date().toISOString();

      if (!postmarkToken) {
        const campaignRef = await db.collection("mailing_campaigns").add({
          subject,
          segment,
          campaignSlug,
          markdownBody,
          status: "sandbox_logged",
          recipientCount: recipients.length,
          deliveredCount: recipients.length,
          failedCount: 0,
          createdByEmail: caller.email,
          createdAt: now,
          sentAt: now,
          postmarkStream: broadcastStream,
        });
        res.status(200).json({
          ok: true,
          mode: "sandbox",
          campaignId: campaignRef.id,
          recipientCount: recipients.length,
          deliveredCount: recipients.length,
          failedCount: 0,
          message: `Recorded in sandbox log (${recipients.length} active recipients matched). Configure POSTMARK_SERVER_TOKEN for live delivery.`,
        });
        return;
      }

      const batchMessages: PostmarkMessagePayload[] = recipients.map((r) => {
        const unsubPageUrl = `${SITE_ORIGIN}/unsubscribe/?token=${encodeURIComponent(r.unsubscribeToken)}`;
        const oneClickUrl = `${SITE_ORIGIN}/api/mailing/one-click-unsubscribe?token=${encodeURIComponent(r.unsubscribeToken)}`;
        return {
          From: FROM_BROADCAST,
          To: r.email,
          ReplyTo: REPLY_TO_ADDRESS,
          Subject: subject,
          HtmlBody: buildScholarlyLetterHtml({
            heading: subject,
            paragraphsHtml,
            unsubscribeUrl: unsubPageUrl,
          }),
          TextBody: `${plainBodyCore}\n\n---\nManage subscription / Unsubscribe: ${unsubPageUrl}\n${POSTAL_ADDRESS_FOOTER}`,
          MessageStream: broadcastStream,
          TrackOpens: false,
          TrackLinks: "None",
          Headers: [
            { Name: "List-Unsubscribe", Value: `<${oneClickUrl}>, <mailto:${REPLY_TO_ADDRESS}?subject=Unsubscribe>` },
            { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
          ],
        };
      });

      const { delivered, failed } = await sendPostmarkBatch(postmarkToken, batchMessages);

      const campaignRef = await db.collection("mailing_campaigns").add({
        subject,
        segment,
        campaignSlug,
        markdownBody,
        status: "sent",
        recipientCount: recipients.length,
        deliveredCount: delivered,
        failedCount: failed,
        createdByEmail: caller.email,
        createdAt: now,
        sentAt: now,
        postmarkStream: broadcastStream,
      });

      res.status(200).json({
        ok: true,
        mode: "live",
        campaignId: campaignRef.id,
        recipientCount: recipients.length,
        deliveredCount: delivered,
        failedCount: failed,
        message: `Broadcast dispatched to ${delivered} of ${recipients.length} recipients via Postmark.`,
      });
    } catch (err) {
      console.error("[mailingSendCampaign] Unexpected error:", err);
      res.status(500).json({ ok: false, error: "Failed to dispatch announcement." });
    }
  }
);

