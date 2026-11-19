import { addDoc, collection } from "firebase/firestore";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import { MailingInterest, PublicMailingRequest } from "@/types/mailing";
import {
  isValidSubscriberEmail,
  normalizeSubscriberEmail,
} from "@/utils/mailingTemplate";
import { recordTelemetryEvent } from "@/utils/telemetryClient";

const MOCK_PUBLIC_REQ_KEY = "hems_mock_mailing_requests_v1";

export interface PublicMailingSignupInput {
  email: string;
  firstName?: string;
  lastName?: string;
  affiliation?: string;
  interests?: MailingInterest[];
  websiteUrl?: string;
  sourceLabel?: string;
}

export interface PublicMailingSignupResult {
  ok: boolean;
  message: string;
  handledByFunction: boolean;
}

/**
 * Submits a voluntary Double-Opt-In mailing list subscription via `/api/mailing/subscribe`,
 * falling back cleanly to the write-only `mailing_public_requests` queue on static previews
 * or local dev environments where Cloud Functions rewrites are not mounted.
 */
export async function submitPublicMailingSignup(
  input: PublicMailingSignupInput
): Promise<PublicMailingSignupResult> {
  if (input.websiteUrl && input.websiteUrl.trim() !== "") {
    return {
      ok: true,
      message: "Thank you. Your subscription request has been received.",
      handledByFunction: true,
    };
  }

  const cleanEmail = normalizeSubscriberEmail(input.email);
  if (!isValidSubscriberEmail(cleanEmail)) {
    throw new Error(
      "Please enter a valid academic, government, or institutional email address."
    );
  }

  const firstName = (input.firstName || "").trim().slice(0, 80);
  const lastName = (input.lastName || "").trim().slice(0, 80);
  const affiliation = (input.affiliation || "").trim().slice(0, 140);
  const interests: MailingInterest[] =
    input.interests && input.interests.length > 0 ? input.interests : ["workshop"];

  let handledByFunction = false;
  let responseMessage =
    "Please check your inbox for a one-click confirmation link to complete your subscription.";

  try {
    const res = await fetch("/api/mailing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        firstName,
        lastName,
        affiliation,
        interests,
        websiteUrl: input.websiteUrl || "",
      }),
    });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to complete signup.");
      }
      if (data.message) {
        responseMessage = data.message;
      }
      handledByFunction = true;
    }
  } catch (err) {
    if (err instanceof Error && /too many|already sent|valid email/i.test(err.message)) {
      throw err;
    }
    handledByFunction = false;
  }

  if (!handledByFunction) {
    const now = new Date().toISOString();
    if (hasFirebaseKeys && db) {
      await addDoc(collection(db, "mailing_public_requests"), {
        type: "subscribe",
        email: cleanEmail,
        firstName,
        lastName,
        affiliation,
        interests,
        createdAt: now,
        status: "pending",
      });
    } else if (typeof window !== "undefined") {
      const existing = JSON.parse(
        localStorage.getItem(MOCK_PUBLIC_REQ_KEY) || "[]"
      ) as PublicMailingRequest[];
      existing.push({
        id: `req-${Date.now()}`,
        type: "subscribe",
        email: cleanEmail,
        firstName,
        lastName,
        affiliation,
        interests,
        createdAt: now,
        status: "pending",
      });
      localStorage.setItem(MOCK_PUBLIC_REQ_KEY, JSON.stringify(existing));
    }

    responseMessage =
      "Your subscription request has been recorded for the HEMS Society announcement list.";
  }

  void recordTelemetryEvent({
    eventType: "mailing_signup",
    targetLabel: input.sourceLabel
      ? `${input.sourceLabel} (${interests.join(", ")})`
      : `Topics: ${interests.join(", ")}`,
  });

  return {
    ok: true,
    message: responseMessage,
    handledByFunction,
  };
}
