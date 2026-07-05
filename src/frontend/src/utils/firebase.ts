import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public Firebase config keys (safe to include in bundle fallbacks)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCCb7nVRTLoikHZTz4y1JbNcT3ls9S_XGo",
  authDomain: "hems-workshop.firebaseapp.com",
  projectId: "hems-workshop",
  storageBucket: "hems-workshop.firebasestorage.app",
  messagingSenderId: "996590178042",
  appId: "1:996590178042:web:bb06372e6672bcb6e5c343"
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId
};

// Check if running on a live deployed Firebase hosting domain
const isLiveDomain = typeof window !== "undefined" && 
  (window.location.hostname.endsWith(".web.app") || 
   window.location.hostname.endsWith(".firebaseapp.com") || 
   window.location.hostname === "hems-workshop.org" ||
   window.location.hostname.endsWith("hems-workshop.org"));

// Real Firebase is used if keys are provided in environment OR if running on a live deployed domain
const hasFirebaseKeys = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || isLiveDomain;

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
