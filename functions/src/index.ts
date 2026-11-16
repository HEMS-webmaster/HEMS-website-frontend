import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export {
  mailingSubscribe,
  mailingConfirm,
  mailingUnsubscribe,
  mailingWebhookPostmark,
  mailingSendCampaign,
  contactInquiry,
} from "./mailing";
export { telemetryEvent } from "./telemetry";
export {
  registrationCreateSession,
  registrationWebhookStripe,
  registrationGetReceipt,
  registrationAdminAction,
} from "./registration";
export { budgetCircuitBreaker } from "./budgetCircuitBreaker";

const PROTECTED_ADMIN_EMAIL = "webmaster@hems-workshop.org";

function isVerifiedUserRecord(userRecord: admin.auth.UserRecord): boolean {
  return Boolean(
    userRecord.emailVerified ||
      userRecord.providerData.some(
        (p) => p.providerId === "google.com" || p.providerId === "microsoft.com"
      )
  );
}

function withProtectedWebmasterAdmin(email: string, roles: string[]): string[] {
  if (email.trim().toLowerCase() !== PROTECTED_ADMIN_EMAIL) return roles;
  const cleaned = roles.filter((r) => String(r || "").trim().toLowerCase() !== "general");
  if (cleaned.some((r) => {
    const norm = String(r || "").trim().toLowerCase();
    return norm === "admin" || norm === "administration" || norm === "administrator";
  })) {
    return cleaned;
  }
  return Array.from(new Set([...cleaned, "admin"]));
}

// Trigger on any write (create, update, delete) to the 'whitelist/{email}' collection
export const syncWhitelistToUserV2 = onDocumentWritten(
  { document: "whitelist/{email}", region: "us-central1", maxInstances: 5 },
  async (event) => {
    const email = event.params.email.toLowerCase();
    const afterData = event.data?.after.exists ? event.data.after.data() : null;

    let rolesToAssign = ["general"];

    if (afterData && Array.isArray(afterData.roles)) {
      rolesToAssign = afterData.roles;
    }

    rolesToAssign = withProtectedWebmasterAdmin(email, rolesToAssign);

    // Resolve strictly via Firebase Auth so unverified or spoofed users/{uid}.email fields are never promoted
    let userRecord: admin.auth.UserRecord | null = null;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`User not found in Firebase Auth for email: ${email}. Skipping whitelist sync (${msg}).`);
      return null;
    }

    const effectiveRoles = isVerifiedUserRecord(userRecord) ? rolesToAssign : ["general"];
    await db.collection("users").doc(userRecord.uid).set(
      {
        roles: effectiveRoles,
      },
      { merge: true }
    );
    console.log(
      `Synced whitelist roles for Auth user ${email} (uid=${userRecord.uid}, verified=${isVerifiedUserRecord(userRecord)}): ${effectiveRoles.join(", ")}`
    );

    return null;
  }
);

// Trigger on new user profile creation
export const syncUserOnRegistrationV2 = onDocumentCreated(
  { document: "users/{uid}", region: "us-central1", maxInstances: 5 },
  async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const user = snap.data() || {};
    let authUser: admin.auth.UserRecord;
    try {
      authUser = await admin.auth().getUser(event.params.uid);
    } catch (err) {
      console.warn(`[syncUserOnRegistrationV2] Unable to load Auth record for ${event.params.uid}:`, err);
      await snap.ref.update({ roles: ["general"] });
      return null;
    }

    const authEmail = (authUser.email || "").trim().toLowerCase();
    if (!authEmail) {
      await snap.ref.update({ roles: ["general"] });
      return null;
    }

    const clientEmail = String(user.email || "").trim().toLowerCase();
    const emailPatch = clientEmail !== authEmail ? { email: authEmail } : {};

    if (!isVerifiedUserRecord(authUser)) {
      // Never promote unverified Email+Password accounts before link verification
      await snap.ref.update({ ...emailPatch, roles: ["general"], emailVerified: false });
      return null;
    }

    const whitelistDoc = await db.collection("whitelist").doc(authEmail).get();

    if (whitelistDoc.exists) {
      const whitelistData = whitelistDoc.data();
      if (whitelistData && Array.isArray(whitelistData.roles)) {
        const syncedRoles = withProtectedWebmasterAdmin(authEmail, whitelistData.roles);
        await snap.ref.update({ ...emailPatch, roles: syncedRoles, emailVerified: true });
        console.log(`Applied verified whitelist roles to new user ${authEmail}: ${syncedRoles.join(", ")}`);
        return null;
      }
    } else if (authEmail === PROTECTED_ADMIN_EMAIL) {
      const syncedRoles = withProtectedWebmasterAdmin(authEmail, []);
      await db.collection("whitelist").doc(authEmail).set({
        email: authEmail,
        firstName: "HEMS",
        lastName: "Webmaster",
        affiliation: "HEMS Society",
        name: "HEMS Webmaster",
        roles: syncedRoles,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await snap.ref.update({ ...emailPatch, roles: syncedRoles, emailVerified: true });
      return null;
    }

    if (Object.keys(emailPatch).length > 0) {
      await snap.ref.update(emailPatch);
    }

    return null;
  }
);
