import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const hasFirebaseKeys = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let microsoftProvider: any = null;

if (hasFirebaseKeys) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    microsoftProvider = new OAuthProvider('microsoft.com');
  } catch (error) {
    console.error("Firebase initialization failed, falling back to mock mode:", error);
  }
}

export { auth, db, googleProvider, microsoftProvider, hasFirebaseKeys };
