import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Trigger on any write (create, update, delete) to the 'whitelist/{email}' collection
export const syncWhitelistToUser = functions.firestore
  .document("whitelist/{email}")
  .onWrite(async (change, context) => {
    const email = context.params.email.toLowerCase();
    const afterData = change.after.exists ? change.after.data() : null;

    let rolesToAssign = ["general"];

    if (afterData && Array.isArray(afterData.roles)) {
      rolesToAssign = afterData.roles;
    }

    // Try to find the user in Firebase Auth first (case-insensitive and most accurate)
    let uid: string | null = null;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err: any) {
      console.log(`User not found in Firebase Auth for email: ${email}. Error: ${err.message}`);
    }

    if (uid) {
      // User exists in Firebase Auth. Write/merge roles in users/{uid}
      await db.collection("users").doc(uid).set({
        roles: rolesToAssign
      }, { merge: true });
      console.log(`Successfully synced roles for existing user in Firebase Auth. Email: ${email}, UID: ${uid}, Roles: ${rolesToAssign.join(", ")}`);
    } else {
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
export const syncUserOnRegistration = functions.firestore
  .document("users/{uid}")
  .onCreate(async (snap, context) => {
    const user = snap.data();
    if (!user || !user.email) return null;

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
