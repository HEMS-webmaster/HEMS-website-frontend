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
exports.syncUserOnRegistrationV2 = exports.syncWhitelistToUserV2 = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// Trigger on any write (create, update, delete) to the 'whitelist/{email}' collection
exports.syncWhitelistToUserV2 = (0, firestore_1.onDocumentWritten)("whitelist/{email}", async (event) => {
    const email = event.params.email.toLowerCase();
    const afterData = event.data?.after.exists ? event.data.after.data() : null;
    let rolesToAssign = ["general"];
    if (afterData && Array.isArray(afterData.roles)) {
        rolesToAssign = afterData.roles;
    }
    // Try to find the user in Firebase Auth first (case-insensitive and most accurate)
    let uid = null;
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        uid = userRecord.uid;
    }
    catch (err) {
        console.log(`User not found in Firebase Auth for email: ${email}. Error: ${err.message}`);
    }
    if (uid) {
        // User exists in Firebase Auth. Write/merge roles in users/{uid}
        await db.collection("users").doc(uid).set({
            roles: rolesToAssign
        }, { merge: true });
        console.log(`Successfully synced roles for existing user in Firebase Auth. Email: ${email}, UID: ${uid}, Roles: ${rolesToAssign.join(", ")}`);
    }
    else {
        // Fallback: search by email field in users collection (case-sensitive exact match)
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("email", "==", email).get();
        if (snapshot.empty) {
            console.log(`No registered user found in Auth or users collection for email: ${email}. Skipping sync.`);
            return null;
        }
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { roles: rolesToAssign });
        });
        await batch.commit();
        console.log(`Successfully synced roles via email query for ${email}: ${rolesToAssign.join(", ")}`);
    }
    return null;
});
// Trigger on new user profile creation
exports.syncUserOnRegistrationV2 = (0, firestore_1.onDocumentCreated)("users/{uid}", async (event) => {
    const snap = event.data;
    if (!snap)
        return null;
    const user = snap.data();
    if (!user || !user.email)
        return null;
    const email = user.email.toLowerCase();
    const whitelistDoc = await db.collection("whitelist").doc(email).get();
    if (whitelistDoc.exists) {
        const whitelistData = whitelistDoc.data();
        if (whitelistData && Array.isArray(whitelistData.roles)) {
            await snap.ref.update({ roles: whitelistData.roles });
            console.log(`Applied whitelist roles to new user ${email}: ${whitelistData.roles.join(", ")}`);
        }
    }
    return null;
});
//# sourceMappingURL=index.js.map