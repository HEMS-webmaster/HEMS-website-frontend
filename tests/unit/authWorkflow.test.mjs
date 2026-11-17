import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const authContextSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/context/AuthContext.tsx"),
  "utf8"
);
const downloadGateSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/components/DownloadGate.tsx"),
  "utf8"
);
const authPageSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/app/auth/page.tsx"),
  "utf8"
);
const portalLayoutSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/app/(portal)/layout.tsx"),
  "utf8"
);
const firestoreRulesSrc = fs.readFileSync(
  path.join(repoRoot, "firestore.rules"),
  "utf8"
);

// 1. Tier 1: DownloadGate.tsx must be 100% password-free and avoid stale closure bugs
assert.ok(
  !/type=["']password["']/i.test(downloadGateSrc),
  "DownloadGate.tsx must not render a password input field"
);
assert.ok(
  !/\bregister\s*\(/.test(downloadGateSrc),
  "DownloadGate.tsx must not invoke password account registration"
);
assert.ok(
  downloadGateSrc.includes("sendMagicSignInLink"),
  "DownloadGate.tsx must support 1-click email download links via sendMagicSignInLink"
);
assert.ok(
  downloadGateSrc.includes("await reloadUser()"),
  "DownloadGate.tsx must await reloadUser() boolean return value directly"
);
assert.ok(
  !downloadGateSrc.includes("const isVerifiedNow = isMock || emailVerified;"),
  "DownloadGate.tsx must not read stale closure emailVerified immediately after reloadUser()"
);

// 2. AuthContext.tsx must support Email Link, Password Reset, Token Refresh & Whitelist Sync
for (const token of [
  "sendSignInLinkToEmail",
  "isSignInWithEmailLink",
  "signInWithEmailLink",
  "sendPasswordResetEmail",
  "getIdToken(true)",
  "syncFirebaseUserSession",
  "formatFirebaseAuthError",
  "getFirebaseAuthErrorCode",
]) {
  assert.ok(
    authContextSrc.includes(token),
    `AuthContext.tsx missing required capability: ${token}`
  );
}

// Verify whitelist firstName + lastName fallback and rawRoles persistence
assert.ok(
  authContextSrc.includes("data?.firstName") && authContextSrc.includes("data?.lastName"),
  "AuthContext.tsx must compose whitelist display name from firstName + lastName when data.name is empty"
);
assert.ok(
  authContextSrc.includes("roles: wl.rawRoles"),
  "AuthContext.tsx must persist exact wl.rawRoles back to users/{uid} to satisfy firestore.rules"
);

// 3. Tier 2: /auth page must support 1-Click Email Link, Optional Name, Reset, and Unverified Gate
assert.ok(
  authPageSrc.includes("1-Click Email Link") && authPageSrc.includes("Send 1-Click Sign-In Link"),
  "auth/page.tsx must surface 1-Click Email Sign-In Link"
);
assert.ok(
  authPageSrc.includes("Verify Your Email to Activate Roles"),
  "auth/page.tsx must show explicit email-verification role-activation screen for unverified password signups"
);
assert.ok(
  !authPageSrc.includes("Account created! You may now enter the portal."),
  "auth/page.tsx must not mislead unverified password users into thinking assigned roles are already active"
);
assert.ok(
  authPageSrc.includes("Forgot / Reset?"),
  "auth/page.tsx must provide inline password setup / reset access"
);

// 4. Portal Layout must display Unverified Account Banner
assert.ok(
  portalLayoutSrc.includes("user && !emailVerified && !isMock"),
  "(portal)/layout.tsx must render an unverified-email role-unlock banner"
);

// 5. Security rules must remain intact (verified-email gate on whitelist & role hydration)
assert.ok(
  firestoreRulesSrc.includes("function hasVerifiedAuthEmail()") &&
    firestoreRulesSrc.includes("request.auth.token.email_verified == true"),
  "firestore.rules must preserve strict email_verified check"
);

console.log(
  "✅ All Two-Tier Smart Login, Zero-Password DownloadGate, and Whitelist Sync checks passed."
);
