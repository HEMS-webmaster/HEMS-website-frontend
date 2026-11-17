"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  auth,
  db,
  googleProvider,
  microsoftProvider,
  hasFirebaseKeys,
} from "../utils/firebase";
import {
  AuthProvider as FirebaseOAuthProvider,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { PROTECTED_ADMIN_EMAIL, sanitizeRoleList } from "../utils/whitelistCsv";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
  loginCount?: number;
  downloadCount?: number;
  lastLogin?: string;
  downloadsToday?: number;
  lastDownloadDate?: string;
  emailVerified?: boolean;
}

export interface MagicLinkOptions {
  returnPath?: string;
  pendingDownloadUrl?: string;
}

export interface EmailLinkCompletionResult {
  completed: boolean;
  needsEmailPrompt: boolean;
  pendingDownloadUrl?: string | null;
  returnPath?: string | null;
  error?: string;
}

export type AuthErrorContext = "login" | "register" | "magic_link" | "reset" | "oauth" | "verify";

interface StoredPostSignInContext {
  returnPath?: string;
  pendingDownloadUrl?: string | null;
  sentAt?: number;
}

const EMAIL_FOR_SIGN_IN_KEY = "hems_email_for_sign_in_v1";
const POST_SIGN_IN_CONTEXT_KEY = "hems_post_signin_context_v1";

export function getFirebaseAuthErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err && typeof (err as { code?: unknown }).code === "string") {
    return (err as { code: string }).code;
  }
  if (err instanceof Error) {
    const match = err.message.match(/\((auth\/[a-z0-9-]+)\)/i);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return "";
}

export function formatFirebaseAuthError(err: unknown, context: AuthErrorContext = "login"): string {
  const code = getFirebaseAuthErrorCode(err);

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      if (context === "login") {
        return "Incorrect password — or no password has been set for this email yet. If your HEMS role was pre-assigned, use a 1-Click Email Link, Google/Microsoft, or 'Forgot / Set Password' below.";
      }
      return "Sign-in credentials were not recognized. Please check your email address and try again.";
    case "auth/email-already-in-use":
      return "An account already exists for this email address. Use a 1-Click Email Link, Google/Microsoft, or 'Forgot / Set Password' to set or update your password.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Please enter a password, or use a 1-Click Email Sign-In Link instead.";
    case "auth/operation-not-allowed":
      if (context === "magic_link") {
        return "1-click email sign-in links are not yet enabled on the server. Please continue with Google, Microsoft, or Password sign-in.";
      }
      return "This sign-in method is currently unavailable. Please choose another sign-in option.";
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
    case "auth/missing-continue-uri":
      return "This preview domain is not yet authorized for email sign-in links. Please continue with Google, Microsoft, or Password.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "This 1-time sign-in link has expired or was already opened (some institutional mail gateways pre-scan links). Please request a fresh link or use Google, Microsoft, or Password.";
    case "auth/too-many-requests":
      return "Too many requests in a short window. Please wait a minute before trying again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The sign-in window was closed before finishing. Please try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site or use a 1-Click Email Link.";
    case "auth/network-request-failed":
      return "Network connection interrupted. Please check your internet connection and try again.";
    default:
      if (err instanceof Error && err.message) {
        return err.message.replace(/^Firebase:\s*/i, "");
      }
      return "Authentication could not be completed. Please try again.";
  }
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  sendMagicSignInLink: (email: string, options?: MagicLinkOptions) => Promise<void>;
  completeEmailLinkSignIn: (emailOverride?: string) => Promise<EmailLinkCompletionResult>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRoles: (uid: string, newRoles: string[]) => Promise<void>;
  isMock: boolean;
  setMockRoles: (roles: string[]) => void;
  emailVerified: boolean;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
  completingEmailLink: boolean;
  pendingEmailLinkPrompt: boolean;
  emailLinkError: string;
  clearEmailLinkPrompt: () => void;
  readyDownloadUrl: string | null;
  clearReadyDownloadUrl: () => void;
  postSignInReturnPath: string | null;
  clearPostSignInReturnPath: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function stripFirebaseActionParamsFromCurrentUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const parsed = new URL(window.location.href);
    const firebaseParams = ["apiKey", "oobCode", "mode", "lang", "continueUrl"];
    let mutated = false;
    for (const key of firebaseParams) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.delete(key);
        mutated = true;
      }
    }
    if (mutated) {
      const cleanRel = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      window.history.replaceState({}, "", cleanRel);
    }
  } catch {
    // Ignore URL history cleanup failures
  }
}

function readStoredPostSignInContext(): StoredPostSignInContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POST_SIGN_IN_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPostSignInContext;
    if (!parsed || typeof parsed !== "object") return null;
    // Expire stale context older than 24 hours
    if (typeof parsed.sentAt === "number" && Date.now() - parsed.sentAt > 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(POST_SIGN_IN_CONTEXT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isPlaceholderUserName(candidate: string | undefined | null, email: string): boolean {
  const trimmed = (candidate || "").trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  const prefix = cleanEmail.split("@")[0] || "";
  return (
    lower === "user" ||
    lower === "member" ||
    lower === cleanEmail ||
    (Boolean(prefix) && lower === prefix)
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fbEmailVerified, setFbEmailVerified] = useState(false);

  const [completingEmailLink, setCompletingEmailLink] = useState(false);
  const [pendingEmailLinkPrompt, setPendingEmailLinkPrompt] = useState(false);
  const [emailLinkError, setEmailLinkError] = useState("");
  const [readyDownloadUrl, setReadyDownloadUrl] = useState<string | null>(null);
  const [postSignInReturnPath, setPostSignInReturnPath] = useState<string | null>(null);

  const pendingSignupNameRef = useRef<string>("");
  const lastAutoReloadRef = useRef<number>(0);
  const emailLinkAttemptedRef = useRef<boolean>(false);

  // Helper for mock users storage in localStorage
  const getMockUsers = (): UserProfile[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("hems_mock_users");
      return stored ? (JSON.parse(stored) as UserProfile[]) : [];
    } catch {
      return [];
    }
  };

  const saveMockUsers = (users: UserProfile[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("hems_mock_users", JSON.stringify(users));
  };

  const getMockCurrentUser = (): UserProfile | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("hems_mock_current_user");
      return stored ? (JSON.parse(stored) as UserProfile) : null;
    } catch {
      return null;
    }
  };

  const saveMockCurrentUser = (nextUser: UserProfile | null) => {
    if (typeof window === "undefined") return;
    if (nextUser) {
      localStorage.setItem("hems_mock_current_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("hems_mock_current_user");
    }
  };

  const isTrustedFirebaseUser = useCallback(
    (fbUser: {
      emailVerified: boolean;
      providerData?: Array<{ providerId?: string }>;
    }): boolean =>
      Boolean(
        fbUser.emailVerified ||
          (Array.isArray(fbUser.providerData) &&
            fbUser.providerData.some(
              (p) => p?.providerId === "google.com" || p?.providerId === "microsoft.com"
            ))
      ),
    []
  );

  const withProtectedWebmasterAdmin = useCallback((email: string, roles: string[]): string[] => {
    const cleanEmail = email.trim().toLowerCase();
    const cleaned = sanitizeRoleList(roles);
    if (cleanEmail !== PROTECTED_ADMIN_EMAIL) return cleaned;
    return cleaned.includes("admin") ? cleaned : sanitizeRoleList([...cleaned, "admin"]);
  }, []);

  // Basic mock whitelist function
  const getRolesForEmail = useCallback((email: string): string[] => {
    const lower = email.toLowerCase();
    if (lower.trim() === PROTECTED_ADMIN_EMAIL) return ["admin"];
    if (lower.includes("admin")) return ["admin", "reviewer", "operations", "treasurer", "board"];
    if (lower.includes("treasurer")) return ["treasurer"];
    if (lower.includes("operations")) return ["operations"];
    if (lower.includes("reviewer")) return ["reviewer"];
    if (lower.includes("board")) return ["board"];
    if (lower.includes("attendee")) return ["attendee"];
    return [];
  }, []);

  const fetchWhitelistEntry = useCallback(
    async (
      email: string
    ): Promise<{ found: boolean; roles: string[]; rawRoles?: string[]; name?: string }> => {
      const cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail) {
        return { found: false, roles: [] };
      }
      if (!hasFirebaseKeys) {
        const mockRoles = withProtectedWebmasterAdmin(cleanEmail, getRolesForEmail(cleanEmail));
        return { found: true, roles: mockRoles, rawRoles: mockRoles };
      }
      try {
        const whitelistDoc = await getDoc(doc(db, "whitelist", cleanEmail));
        if (whitelistDoc.exists()) {
          const data = whitelistDoc.data();
          const hasRawArray = Array.isArray(data?.roles);
          const rawRoles = hasRawArray
            ? (data.roles as unknown[]).map((r) => String(r))
            : [];
          const explicitName = typeof data?.name === "string" ? data.name.trim() : "";
          const combinedFirstLast = [
            typeof data?.firstName === "string" ? data.firstName.trim() : "",
            typeof data?.lastName === "string" ? data.lastName.trim() : "",
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
          const storedName = explicitName || combinedFirstLast || undefined;
          const effectiveRoles = withProtectedWebmasterAdmin(cleanEmail, rawRoles);
          const guaranteedRaw =
            cleanEmail === PROTECTED_ADMIN_EMAIL
              ? hasRawArray
                ? (data.roles as string[])
                : ["admin"]
              : hasRawArray
                ? (data.roles as string[])
                : undefined;
          return {
            found: true,
            roles: effectiveRoles,
            rawRoles: guaranteedRaw,
            name: storedName,
          };
        }
      } catch (err) {
        console.error("Error fetching whitelist roles:", err);
      }
      if (cleanEmail === PROTECTED_ADMIN_EMAIL) {
        return {
          found: true,
          roles: ["admin"],
          rawRoles: ["admin"],
          name: "HEMS Webmaster",
        };
      }
      return { found: false, roles: [] };
    },
    [getRolesForEmail, withProtectedWebmasterAdmin]
  );

  const fetchInitialProfileSeed = useCallback(
    async (
      email: string
    ): Promise<{ firestoreRoles: string[]; effectiveRoles: string[]; name?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetchWhitelistEntry(cleanEmail);
      if (res.found && Array.isArray(res.rawRoles)) {
        return {
          firestoreRoles: res.rawRoles,
          effectiveRoles: withProtectedWebmasterAdmin(cleanEmail, res.roles),
          name: res.name,
        };
      }
      if (cleanEmail === PROTECTED_ADMIN_EMAIL) {
        return {
          firestoreRoles: ["admin"],
          effectiveRoles: ["admin"],
          name: res.name || "HEMS Webmaster",
        };
      }
      return {
        firestoreRoles: ["general"],
        effectiveRoles: [],
        name: res.name,
      };
    },
    [fetchWhitelistEntry, withProtectedWebmasterAdmin]
  );

  const syncFirebaseUserSession = useCallback(
    async (
      firebaseUser: FirebaseUser,
      options?: { bumpLogin?: boolean; forceTokenRefresh?: boolean }
    ): Promise<boolean> => {
      const bumpLogin = Boolean(options?.bumpLogin);
      const trustedIdentity = isTrustedFirebaseUser(firebaseUser);
      setFbEmailVerified(trustedIdentity);

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? (userDoc.data() as UserProfile) : null;
      const cleanEmail = (firebaseUser.email || existingData?.email || "").trim().toLowerCase();

      const wasPreviouslyUnverified = Boolean(existingData && existingData.emailVerified === false);
      if (trustedIdentity && (options?.forceTokenRefresh || wasPreviouslyUnverified)) {
        // Ensure Firestore security rules immediately observe request.auth.token.email_verified == true
        await firebaseUser.getIdToken(true).catch(() => undefined);
      }

      const nowIso = new Date().toISOString();

      if (existingData) {
        const nextLoginCount = bumpLogin ? (existingData.loginCount || 0) + 1 : existingData.loginCount;

        if (trustedIdentity && cleanEmail) {
          const wl = await fetchWhitelistEntry(cleanEmail);
          const resolvedRoles = withProtectedWebmasterAdmin(
            cleanEmail,
            wl.found ? wl.roles : sanitizeRoleList(existingData.roles)
          );
          const resolvedName = !isPlaceholderUserName(existingData.name, cleanEmail)
            ? existingData.name.trim()
            : wl.name ||
              firebaseUser.displayName?.trim() ||
              existingData.name?.trim() ||
              cleanEmail.split("@")[0] ||
              "Member";

          const rolesNeedSync = Boolean(
            wl.found &&
              Array.isArray(wl.rawRoles) &&
              JSON.stringify(existingData.roles) !== JSON.stringify(wl.rawRoles)
          );
          const metaNeedSync = Boolean(
            bumpLogin || existingData.emailVerified !== true || existingData.name !== resolvedName
          );

          if (rolesNeedSync || metaNeedSync) {
            const basePatch: Record<string, unknown> = {
              emailVerified: true,
              name: resolvedName,
              ...(bumpLogin ? { loginCount: nextLoginCount, lastLogin: nowIso } : {}),
            };
            const fullPatch: Record<string, unknown> =
              rolesNeedSync && wl.rawRoles
                ? { ...basePatch, roles: wl.rawRoles }
                : basePatch;

            await updateDoc(userDocRef, fullPatch).catch(async () => {
              await updateDoc(userDocRef, basePatch).catch(async () => {
                await setDoc(userDocRef, basePatch, { merge: true }).catch(() => undefined);
              });
            });
          }

          setUser({
            ...existingData,
            ...(bumpLogin ? { loginCount: nextLoginCount, lastLogin: nowIso } : {}),
            name: resolvedName,
            roles: resolvedRoles,
            emailVerified: true,
          });
        } else {
          // Unverified Email+Password accounts retain zero portal privileges until email confirmation
          if (bumpLogin) {
            await updateDoc(userDocRef, {
              loginCount: nextLoginCount,
              lastLogin: nowIso,
              emailVerified: false,
            }).catch(() => undefined);
          }
          setUser({
            ...existingData,
            ...(bumpLogin ? { loginCount: nextLoginCount, lastLogin: nowIso } : {}),
            roles: [],
            emailVerified: false,
          });
        }
      } else {
        const emailDisplay = (firebaseUser.email || "").trim();
        if (trustedIdentity) {
          const seed = await fetchInitialProfileSeed(emailDisplay);
          const resolvedName =
            seed.name ||
            firebaseUser.displayName?.trim() ||
            emailDisplay.split("@")[0] ||
            "Member";
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: resolvedName,
            email: emailDisplay,
            roles: seed.firestoreRoles,
            createdAt: nowIso,
            loginCount: 1,
            lastLogin: nowIso,
            emailVerified: true,
          };
          await setDoc(userDocRef, newProfile).catch(async () => {
            await setDoc(userDocRef, { ...newProfile, roles: ["general"] });
          });
          setUser({ ...newProfile, roles: seed.effectiveRoles });
        } else {
          const pendingName = pendingSignupNameRef.current.trim();
          const unverifiedProfile: UserProfile = {
            uid: firebaseUser.uid,
            name:
              pendingName ||
              firebaseUser.displayName?.trim() ||
              emailDisplay.split("@")[0] ||
              "Member",
            email: emailDisplay,
            roles: ["general"],
            createdAt: nowIso,
            loginCount: 1,
            lastLogin: nowIso,
            emailVerified: false,
          };
          await setDoc(userDocRef, unverifiedProfile);
          setUser({ ...unverifiedProfile, roles: [] });
        }
      }

      return trustedIdentity;
    },
    [fetchInitialProfileSeed, fetchWhitelistEntry, isTrustedFirebaseUser, withProtectedWebmasterAdmin]
  );

  const completeEmailLinkSignIn = useCallback(
    async (emailOverride?: string): Promise<EmailLinkCompletionResult> => {
      if (typeof window === "undefined" || !hasFirebaseKeys) {
        return { completed: false, needsEmailPrompt: false };
      }

      const currentHref = window.location.href;
      if (!isSignInWithEmailLink(auth, currentHref)) {
        return { completed: false, needsEmailPrompt: false };
      }

      const candidateEmail = (
        emailOverride ||
        window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY) ||
        ""
      )
        .trim()
        .toLowerCase();

      if (!candidateEmail) {
        setPendingEmailLinkPrompt(true);
        return { completed: false, needsEmailPrompt: true };
      }

      setCompletingEmailLink(true);
      setEmailLinkError("");

      try {
        const credential = await signInWithEmailLink(auth, candidateEmail, currentHref);
        await syncFirebaseUserSession(credential.user, {
          bumpLogin: true,
          forceTokenRefresh: true,
        });

        const storedCtx = readStoredPostSignInContext();
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        window.localStorage.removeItem(POST_SIGN_IN_CONTEXT_KEY);
        stripFirebaseActionParamsFromCurrentUrl();
        setPendingEmailLinkPrompt(false);

        const pendingDownloadUrl = storedCtx?.pendingDownloadUrl || null;
        const returnPath = storedCtx?.returnPath || null;

        if (pendingDownloadUrl) {
          setReadyDownloadUrl(pendingDownloadUrl);
        }
        if (returnPath) {
          setPostSignInReturnPath(returnPath);
        }

        return {
          completed: true,
          needsEmailPrompt: false,
          pendingDownloadUrl,
          returnPath,
        };
      } catch (err) {
        const friendly = formatFirebaseAuthError(err, "magic_link");
        setEmailLinkError(friendly);
        const code = getFirebaseAuthErrorCode(err);
        if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
          stripFirebaseActionParamsFromCurrentUrl();
          setPendingEmailLinkPrompt(false);
        }
        return {
          completed: false,
          needsEmailPrompt: false,
          error: friendly,
        };
      } finally {
        setCompletingEmailLink(false);
      }
    },
    [syncFirebaseUserSession]
  );

  // Primary Auth State & Email-Link Callback Listener
  useEffect(() => {
    if (!hasFirebaseKeys) {
      const currentUser = getMockCurrentUser();
      setUser(currentUser);
      setFbEmailVerified(true);
      setLoading(false);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !emailLinkAttemptedRef.current &&
      isSignInWithEmailLink(auth, window.location.href)
    ) {
      emailLinkAttemptedRef.current = true;
      void completeEmailLinkSignIn();
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await syncFirebaseUserSession(firebaseUser);
        } else {
          setUser(null);
          setFbEmailVerified(false);
        }
      } catch (err) {
        console.error("Error fetching user profile from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [completeEmailLinkSignIn, syncFirebaseUserSession]);

  const reloadUser = useCallback(async (): Promise<boolean> => {
    if (!hasFirebaseKeys) return true;
    if (!auth.currentUser) return false;

    try {
      await auth.currentUser.reload();
      return await syncFirebaseUserSession(auth.currentUser, {
        forceTokenRefresh: true,
      });
    } catch (err) {
      console.error("Failed to reload Firebase user verification status:", err);
      return isTrustedFirebaseUser(auth.currentUser);
    }
  }, [isTrustedFirebaseUser, syncFirebaseUserSession]);

  // Automatic background verification check when an unverified user switches back from their email tab
  useEffect(() => {
    if (!hasFirebaseKeys || !user || fbEmailVerified || typeof window === "undefined") {
      return;
    }

    const checkIfVerifiedOnFocus = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastAutoReloadRef.current < 4000) return;
      lastAutoReloadRef.current = now;
      void reloadUser();
    };

    window.addEventListener("focus", checkIfVerifiedOnFocus);
    document.addEventListener("visibilitychange", checkIfVerifiedOnFocus);
    return () => {
      window.removeEventListener("focus", checkIfVerifiedOnFocus);
      document.removeEventListener("visibilitychange", checkIfVerifiedOnFocus);
    };
  }, [fbEmailVerified, reloadUser, user]);

  const handleOAuthLogin = async (provider: FirebaseOAuthProvider) => {
    if (!hasFirebaseKeys) {
      const mockEmail = `oauth_mock_${Math.floor(Math.random() * 1000)}@example.com`;
      const newMockUser: UserProfile = {
        uid: "mock_oauth_" + Math.random().toString(36).substring(2, 9),
        name: "Mock OAuth User",
        email: mockEmail,
        roles: getRolesForEmail(mockEmail),
        createdAt: new Date().toISOString(),
        loginCount: 1,
        lastLogin: new Date().toISOString(),
        emailVerified: true,
      };

      const mockUsers = getMockUsers();
      mockUsers.push(newMockUser);
      saveMockUsers(mockUsers);
      saveMockCurrentUser(newMockUser);
      setUser(newMockUser);
      setFbEmailVerified(true);
      return;
    }

    try {
      const credential = await signInWithPopup(auth, provider);
      await syncFirebaseUserSession(credential.user, {
        bumpLogin: true,
        forceTokenRefresh: true,
      });
    } catch (err) {
      const enriched = new Error(formatFirebaseAuthError(err, "oauth")) as Error & { code?: string };
      enriched.code = getFirebaseAuthErrorCode(err);
      throw enriched;
    }
  };

  const loginWithGoogle = () => handleOAuthLogin(googleProvider);
  const loginWithMicrosoft = () => handleOAuthLogin(microsoftProvider);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    if (!hasFirebaseKeys) {
      const mockUsers = getMockUsers();
      const existingUser = mockUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (!existingUser) {
        const err = new Error(
          "Incorrect password — or no password has been set for this email yet. Use a 1-Click Email Link or Set a Password below."
        ) as Error & { code?: string };
        err.code = "auth/invalid-credential";
        throw err;
      }
      existingUser.loginCount = (existingUser.loginCount || 0) + 1;
      existingUser.lastLogin = new Date().toISOString();
      saveMockUsers(mockUsers);
      saveMockCurrentUser(existingUser);
      setUser(existingUser);
      setFbEmailVerified(true);
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await syncFirebaseUserSession(credential.user, { bumpLogin: true });
    } catch (err) {
      const enriched = new Error(formatFirebaseAuthError(err, "login")) as Error & { code?: string };
      enriched.code = getFirebaseAuthErrorCode(err);
      throw enriched;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!hasFirebaseKeys) {
      const mockUsers = getMockUsers();
      const exists = mockUsers.some(
        (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (exists) {
        const err = new Error(
          "An account already exists for this email address. Use a 1-Click Email Link or 'Forgot / Set Password'."
        ) as Error & { code?: string };
        err.code = "auth/email-already-in-use";
        throw err;
      }

      const newMockUser: UserProfile = {
        uid: "mock_" + Math.random().toString(36).substring(2, 9),
        name: cleanName || cleanEmail.split("@")[0] || "Member",
        email: cleanEmail,
        roles: getRolesForEmail(cleanEmail),
        createdAt: new Date().toISOString(),
        loginCount: 1,
        lastLogin: new Date().toISOString(),
        emailVerified: true,
      };

      mockUsers.push(newMockUser);
      saveMockUsers(mockUsers);
      saveMockCurrentUser(newMockUser);
      setUser(newMockUser);
      setFbEmailVerified(true);
      return;
    }

    pendingSignupNameRef.current = cleanName;
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      try {
        await sendEmailVerification(credential.user);
      } catch (verifErr) {
        console.error("Failed to send initial email verification:", verifErr);
      }

      const resolvedEmail = (credential.user.email || cleanEmail).trim();
      const profile: UserProfile = {
        uid: credential.user.uid,
        name: cleanName || resolvedEmail.split("@")[0] || "Member",
        email: resolvedEmail,
        roles: ["general"],
        createdAt: new Date().toISOString(),
        loginCount: 1,
        lastLogin: new Date().toISOString(),
        emailVerified: false,
      };

      await setDoc(doc(db, "users", credential.user.uid), profile);
      setUser({ ...profile, roles: [] });
      setFbEmailVerified(false);
    } catch (err) {
      const enriched = new Error(formatFirebaseAuthError(err, "register")) as Error & { code?: string };
      enriched.code = getFirebaseAuthErrorCode(err);
      throw enriched;
    } finally {
      pendingSignupNameRef.current = "";
    }
  };

  const sendMagicSignInLink = async (email: string, options?: MagicLinkOptions) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (!hasFirebaseKeys) {
      // Offline / dev mock mode: complete passwordless sign-in immediately in 1 click
      const mockUsers = getMockUsers();
      let targetUser = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      const nowIso = new Date().toISOString();
      if (targetUser) {
        targetUser.loginCount = (targetUser.loginCount || 0) + 1;
        targetUser.lastLogin = nowIso;
        targetUser.emailVerified = true;
      } else {
        targetUser = {
          uid: "mock_link_" + Math.random().toString(36).substring(2, 9),
          name: cleanEmail.split("@")[0] || "Member",
          email: cleanEmail,
          roles: getRolesForEmail(cleanEmail),
          createdAt: nowIso,
          loginCount: 1,
          lastLogin: nowIso,
          emailVerified: true,
        };
        mockUsers.push(targetUser);
      }
      saveMockUsers(mockUsers);
      saveMockCurrentUser(targetUser);
      setUser(targetUser);
      setFbEmailVerified(true);
      if (options?.pendingDownloadUrl) {
        setReadyDownloadUrl(options.pendingDownloadUrl);
      }
      if (options?.returnPath) {
        setPostSignInReturnPath(options.returnPath);
      }
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://hems-workshop.web.app";
      const safePath =
        options?.returnPath && options.returnPath.startsWith("/")
          ? options.returnPath
          : "/auth/";
      const continueUrl = `${origin}${safePath}`;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, cleanEmail);
        const ctxPayload: StoredPostSignInContext = {
          returnPath: safePath,
          pendingDownloadUrl: options?.pendingDownloadUrl || null,
          sentAt: Date.now(),
        };
        window.localStorage.setItem(POST_SIGN_IN_CONTEXT_KEY, JSON.stringify(ctxPayload));
      }

      await sendSignInLinkToEmail(auth, cleanEmail, {
        url: continueUrl,
        handleCodeInApp: true,
      });
    } catch (err) {
      const enriched = new Error(formatFirebaseAuthError(err, "magic_link")) as Error & { code?: string };
      enriched.code = getFirebaseAuthErrorCode(err);
      throw enriched;
    }
  };

  const sendPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      throw new Error("Please enter your email address first so we know where to send the password setup link.");
    }

    if (!hasFirebaseKeys) {
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      const enriched = new Error(formatFirebaseAuthError(err, "reset")) as Error & { code?: string };
      enriched.code = getFirebaseAuthErrorCode(err);
      throw enriched;
    }
  };

  const logout = async () => {
    setReadyDownloadUrl(null);
    setPostSignInReturnPath(null);
    if (!hasFirebaseKeys) {
      saveMockCurrentUser(null);
      setUser(null);
      setFbEmailVerified(false);
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
    setFbEmailVerified(false);
  };

  const updateUserRoles = async (uid: string, newRoles: string[]) => {
    if (!hasFirebaseKeys) {
      const mockUsers = getMockUsers();
      const updatedUsers = mockUsers.map((u) => {
        if (u.uid === uid) {
          return { ...u, roles: newRoles };
        }
        return u;
      });
      saveMockUsers(updatedUsers);
      if (user && user.uid === uid) {
        const updatedSelf = { ...user, roles: newRoles };
        saveMockCurrentUser(updatedSelf);
        setUser(updatedSelf);
      }
      return;
    }

    await updateDoc(doc(db, "users", uid), { roles: newRoles });
    if (user && user.uid === uid) {
      setUser({ ...user, roles: newRoles });
    }
  };

  const setMockRoles = (roles: string[]) => {
    if (!hasFirebaseKeys && user) {
      void updateUserRoles(user.uid, roles);
    }
  };

  const sendVerificationEmail = async () => {
    if (!hasFirebaseKeys) return;
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (err) {
        const enriched = new Error(formatFirebaseAuthError(err, "verify")) as Error & { code?: string };
        enriched.code = getFirebaseAuthErrorCode(err);
        throw enriched;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithMicrosoft,
        register,
        sendMagicSignInLink,
        completeEmailLinkSignIn,
        sendPasswordReset,
        logout,
        updateUserRoles,
        isMock: !hasFirebaseKeys,
        setMockRoles,
        emailVerified: fbEmailVerified,
        sendVerificationEmail,
        reloadUser,
        completingEmailLink,
        pendingEmailLinkPrompt,
        emailLinkError,
        clearEmailLinkPrompt: () => {
          setPendingEmailLinkPrompt(false);
          setEmailLinkError("");
          stripFirebaseActionParamsFromCurrentUrl();
        },
        readyDownloadUrl,
        clearReadyDownloadUrl: () => setReadyDownloadUrl(null),
        postSignInReturnPath,
        clearPostSignInReturnPath: () => setPostSignInReturnPath(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
