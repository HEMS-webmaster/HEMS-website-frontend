import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const registrationFnSrc = fs.readFileSync(
  path.join(repoRoot, "functions/src/registration.ts"),
  "utf8"
);
const mailingClientSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/utils/mailingClient.ts"),
  "utf8"
);
const downloadGateSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/components/DownloadGate.tsx"),
  "utf8"
);
const mailingCardSrc = fs.readFileSync(
  path.join(repoRoot, "src/frontend/src/components/mailing/MailingListSignupCard.tsx"),
  "utf8"
);

// 1. Item #1: Strict mailingListOptIn consent guard in fulfillRegistration & receipt copy
assert.ok(
  registrationFnSrc.includes("if (current.mailingListOptIn)"),
  "fulfillRegistration must guard mailing_subscribers enrollment behind current.mailingListOptIn"
);
assert.ok(
  registrationFnSrc.includes("reg.mailingListOptIn ?"),
  "buildReceiptEmailHtml must mention mailing list tag only when reg.mailingListOptIn is true"
);

// 2. Item #2: Multi-seat-safe whitelist & cohort revocation across all 3 seat-removal paths
assert.ok(
  registrationFnSrc.includes("async function revokeAttendeeAccessIfNoActiveSeat("),
  "registration.ts must define revokeAttendeeAccessIfNoActiveSeat"
);
const revokeCallMatches = registrationFnSrc.match(/revokeAttendeeAccessIfNoActiveSeat\(/g) || [];
assert.ok(
  revokeCallMatches.length >= 4, // 1 definition + 3 call sites (charge.refunded, transfer_seat, refund_or_cancel)
  `Expected revokeAttendeeAccessIfNoActiveSeat in definition + all 3 seat-removal paths, found ${revokeCallMatches.length}`
);

// 3. Item #3: Voluntary unchecked Double-Opt-In checkbox & post-download subscribe in DownloadGate
assert.ok(
  mailingClientSrc.includes("export async function submitPublicMailingSignup(") &&
    mailingCardSrc.includes("submitPublicMailingSignup"),
  "Shared submitPublicMailingSignup utility must be exported and wired into MailingListSignupCard"
);
assert.ok(
  downloadGateSrc.includes("useState(false)") &&
    downloadGateSrc.includes("optInNewsletter") &&
    downloadGateSrc.includes("submitPublicMailingSignup"),
  "DownloadGate.tsx must default optInNewsletter to false and invoke submitPublicMailingSignup only on voluntary opt-in"
);

console.log(
  "✅ All Mailing Consent, Whitelist Seat/Refund Hygiene, and DownloadGate Voluntary Opt-In checks passed."
);

// 4. Phase 26: InlineMailingSignup wired across all 7 high-intent surfaces with source attribution
const inlineSignupSurfaces = [
  ["src/frontend/src/components/layout/Footer.tsx", "Global Footer"],
  ["src/frontend/src/components/workshop/UpcomingWorkshopSpotlight.tsx", "Homepage Spotlight"],
  ["src/frontend/src/components/workshop/RegistrationClient.tsx", "Registration Closed Alert"],
  ["src/frontend/src/components/workshop/CallForPapersClient.tsx", "CFP Sidebar Alert"],
  ["src/frontend/src/components/workshop/StudentAwardsClient.tsx", "Student Awards Alert"],
  ["src/frontend/src/components/workshop/AccommodationsClient.tsx", "Accommodations Venue Alert"],
  ["src/frontend/src/components/archive/ArchiveHubClient.tsx", "Archive Hub Banner"],
];

for (const [relPath, expectedLabel] of inlineSignupSurfaces) {
  const src = fs.readFileSync(path.join(repoRoot, relPath), "utf8");
  assert.ok(
    src.includes("InlineMailingSignup") && src.includes(expectedLabel),
    `${relPath} missing <InlineMailingSignup /> with sourceLabel="${expectedLabel}"`
  );
}

console.log("✅ All 7 site-wide InlineMailingSignup surfaces verified.");
