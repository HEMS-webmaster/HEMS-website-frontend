"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserOnRegistrationV2 = exports.syncWhitelistToUserV2 = exports.budgetCircuitBreaker = exports.registrationAdminAction = exports.registrationGetReceipt = exports.registrationWebhookStripe = exports.registrationCreateSession = exports.telemetryEvent = exports.contactInquiry = exports.mailingSendCampaign = exports.mailingWebhookPostmark = exports.mailingUnsubscribe = exports.mailingConfirm = exports.mailingSubscribe = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
var mailing_1 = require("./mailing");
Object.defineProperty(exports, "mailingSubscribe", { enumerable: true, get: function () { return mailing_1.mailingSubscribe; } });
Object.defineProperty(exports, "mailingConfirm", { enumerable: true, get: function () { return mailing_1.mailingConfirm; } });
Object.defineProperty(exports, "mailingUnsubscribe", { enumerable: true, get: function () { return mailing_1.mailingUnsubscribe; } });
Object.defineProperty(exports, "mailingWebhookPostmark", { enumerable: true, get: function () { return mailing_1.mailingWebhookPostmark; } });
Object.defineProperty(exports, "mailingSendCampaign", { enumerable: true, get: function () { return mailing_1.mailingSendCampaign; } });
Object.defineProperty(exports, "contactInquiry", { enumerable: true, get: function () { return mailing_1.contactInquiry; } });
var telemetry_1 = require("./telemetry");
Object.defineProperty(exports, "telemetryEvent", { enumerable: true, get: function () { return telemetry_1.telemetryEvent; } });
var registration_1 = require("./registration");
Object.defineProperty(exports, "registrationCreateSession", { enumerable: true, get: function () { return registration_1.registrationCreateSession; } });
Object.defineProperty(exports, "registrationWebhookStripe", { enumerable: true, get: function () { return registration_1.registrationWebhookStripe; } });
Object.defineProperty(exports, "registrationGetReceipt", { enumerable: true, get: function () { return registration_1.registrationGetReceipt; } });
Object.defineProperty(exports, "registrationAdminAction", { enumerable: true, get: function () { return registration_1.registrationAdminAction; } });
var budgetCircuitBreaker_1 = require("./budgetCircuitBreaker");
Object.defineProperty(exports, "budgetCircuitBreaker", { enumerable: true, get: function () { return budgetCircuitBreaker_1.budgetCircuitBreaker; } });
const PROTECTED_ADMIN_EMAIL = "webmaster@hems-workshop.org";
function isVerifiedUserRecord(userRecord) {
    return Boolean(userRecord.emailVerified ||
        userRecord.providerData.some((p) => p.providerId === "google.com" || p.providerId === "microsoft.com"));
}
function withProtectedWebmasterAdmin(email, roles) {
    if (email.trim().toLowerCase() !== PROTECTED_ADMIN_EMAIL)
        return roles;
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
exports.syncWhitelistToUserV2 = (0, firestore_1.onDocumentWritten)({ document: "whitelist/{email}", region: "us-central1", maxInstances: 5 }, async (event) => {
    const email = event.params.email.toLowerCase();
    const afterData = event.data?.after.exists ? event.data.after.data() : null;
    let rolesToAssign = ["general"];
    if (afterData && Array.isArray(afterData.roles)) {
        rolesToAssign = afterData.roles;
    }
    rolesToAssign = withProtectedWebmasterAdmin(email, rolesToAssign);
    // Resolve strictly via Firebase Auth so unverified or spoofed users/{uid}.email fields are never promoted
    let userRecord = null;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`User not found in Firebase Auth for email: ${email}. Skipping whitelist sync (${msg}).`);
        return null;
    }
    const effectiveRoles = isVerifiedUserRecord(userRecord) ? rolesToAssign : ["general"];
    await db.collection("users").doc(userRecord.uid).set({
        roles: effectiveRoles,
    }, { merge: true });
    console.log(`Synced whitelist roles for Auth user ${email} (uid=${userRecord.uid}, verified=${isVerifiedUserRecord(userRecord)}): ${effectiveRoles.join(", ")}`);
    return null;
});
// Trigger on new user profile creation
exports.syncUserOnRegistrationV2 = (0, firestore_1.onDocumentCreated)({ document: "users/{uid}", region: "us-central1", maxInstances: 5 }, async (event) => {
    const snap = event.data;
    if (!snap)
        return null;
    const user = snap.data() || {};
    let authUser;
    try {
        authUser = await admin.auth().getUser(event.params.uid);
    }
    catch (err) {
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
    }
    else if (authEmail === PROTECTED_ADMIN_EMAIL) {
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
});
//# sourceMappingURL=index.js.map