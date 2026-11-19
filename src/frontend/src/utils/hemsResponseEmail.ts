import type {
  AbstractSubmissionRecord,
  CommitteeSelection,
} from "@/types/abstractSubmission";
import type { UpcomingWorkshopConfig } from "@/utils/upcomingWorkshop";
import { fixMojibakeAndNormalize, toPlainScientificText } from "@/utils/unicodeText";

export interface PreparedHemsEmail {
  formattedRecipient: string;
  subject: string;
  body: string;
  selection: CommitteeSelection;
}

const SELECTION_LABELS: Record<CommitteeSelection, string> = {
  accept_oral: "Accept to Oral",
  accept_poster: "Accept to Poster",
  decline: "Decline",
  pending: "Decision Pending",
};

export function formatCommitteeSelectionLabel(selection: CommitteeSelection): string {
  return SELECTION_LABELS[selection] || "Decision Pending";
}

function sanitizeDisplayNameForHeader(raw: string): string {
  return fixMojibakeAndNormalize(raw)
    .replace(/[\r\n"<>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Formats an email recipient string suitable for 1-click copy/paste into any desktop/web email client.
 */
export function formatHemsRecipientAddress(sub: AbstractSubmissionRecord): string {
  const primaryEmail = (sub.correspondingEmail || sub.submittedByEmail || "").trim();
  const presenterName = sanitizeDisplayNameForHeader(
    sub.authors?.find((a) => a.isPresenter)?.name || sub.presentingAuthor || ""
  );
  const secondary = (sub.secondaryEmail || "").trim();

  const parts: string[] = [];
  if (primaryEmail) {
    parts.push(presenterName ? `"${presenterName}" <${primaryEmail}>` : `<${primaryEmail}>`);
  }
  if (secondary && secondary.toLowerCase() !== primaryEmail.toLowerCase()) {
    parts.push(`<${secondary}>`);
  }
  return parts.join(", ");
}

function resolveGreetingName(sub: AbstractSubmissionRecord): string {
  const presenterName = sanitizeDisplayNameForHeader(
    sub.authors?.find((a) => a.isPresenter)?.name || sub.presentingAuthor || ""
  );
  return presenterName || "Colleague";
}

/**
 * Builds a warm, collegial, copy-ready HEMS Program Committee response tailored to the reviewer Selection.
 */
export function buildHemsResponseEmail(
  sub: AbstractSubmissionRecord,
  selection: CommitteeSelection,
  workshop: UpcomingWorkshopConfig,
  effectiveTrack?: string
): PreparedHemsEmail {
  const ordinal = (workshop.workshop_ordinal || "16th").trim();
  const year = (workshop.workshop_year || "2027").trim();
  const dates = (workshop.exact_dates || workshop.target_window || `Fall ${year}`).trim();
  const venueParts = [workshop.hotel_name, workshop.venue_city_state]
    .map((s) => (s || "").trim())
    .filter((s) => Boolean(s) && !/^TBA$/i.test(s));
  const venueSummary =
    venueParts.length > 0 ? venueParts.join(" in ") : workshop.venue_city_state || "the host venue";

  const cleanTitle = toPlainScientificText(sub.title || "Untitled Abstract").trim();
  const greetingName = resolveGreetingName(sub);
  const trackLabel = (effectiveTrack || sub.recommendedTrack || sub.researchTrack || "").trim();
  const formattedRecipient = formatHemsRecipientAddress(sub);

  if (selection === "accept_oral") {
    const subject = `${ordinal} HEMS Workshop (${year}) — Abstract Acceptance (Oral Presentation): ${sub.id}`;
    const body = [
      `Dear ${greetingName},`,
      ``,
      `On behalf of the ${ordinal} Biennial Workshop on Harsh-Environment Mass Spectrometry (HEMS ${year}) Program Committee, it is a pleasure to inform you that your submitted abstract has been accepted for an Oral Presentation:`,
      ``,
      `  Abstract ID: ${sub.id}`,
      `  Title: "${cleanTitle}"`,
      ...(trackLabel ? [`  Program Track: ${trackLabel}`] : []),
      `  Accepted Format: Oral Presentation`,
      ``,
      `We were very pleased by the technical quality and direct relevance of your work to the HEMS community. Because the HEMS Workshop maintains a single-track format dedicated to lively technical exchange, your talk will be featured before the full workshop audience.`,
      ``,
      `Workshop Details & Next Steps:`,
      `• Dates: ${dates}`,
      `• Venue: ${venueSummary}`,
      `• Detailed Session Schedule: Exact talk date, time slot, and slide upload guidelines will follow once the technical program is finalized.`,
      `• Registration & Accommodations: Please remember to complete workshop registration and book within the HEMS group hotel block (details at https://www.hems-workshop.org/registration and https://www.hems-workshop.org/accommodations).`,
      ``,
      `Thank you again for contributing your research to HEMS ${year}. We look forward to welcoming you and hearing your presentation.`,
      ``,
      `Warm regards,`,
      ``,
      `The ${ordinal} HEMS Workshop Program Committee`,
      `Harsh-Environment Mass Spectrometry Society`,
      `https://www.hems-workshop.org`,
    ].join("\n");

    return { formattedRecipient, subject, body, selection };
  }

  if (selection === "accept_poster") {
    const requestedOralNote =
      sub.presentationFormat === "Oral Presentation" ||
      sub.presentationFormat === "Either (Oral Preferred)"
        ? `\nWhile our single-track schedule permits only a limited number of oral slots this year, the Program Committee enthusiastically selected your work for our featured Interactive Poster Session, where presenters consistently enjoy deep one-on-one hardware and methodology discussions with attendees and sponsors.`
        : `\nOur dedicated Interactive Poster Session is a centerpiece of the workshop, giving attendees extended opportunities for direct technical discussion alongside your displayed graphics and instrumentation details.`;

    const subject = `${ordinal} HEMS Workshop (${year}) — Abstract Acceptance (Poster Presentation): ${sub.id}`;
    const body = [
      `Dear ${greetingName},`,
      ``,
      `On behalf of the ${ordinal} Biennial Workshop on Harsh-Environment Mass Spectrometry (HEMS ${year}) Program Committee, thank you for submitting your work. We are pleased to inform you that your abstract has been accepted for a Poster Presentation:`,
      ``,
      `  Abstract ID: ${sub.id}`,
      `  Title: "${cleanTitle}"`,
      ...(trackLabel ? [`  Program Track: ${trackLabel}`] : []),
      `  Accepted Format: Poster Presentation`,
      requestedOralNote,
      ``,
      `Workshop Details & Next Steps:`,
      `• Dates: ${dates}`,
      `• Venue: ${venueSummary}`,
      `• Poster Logistics: Your poster board number, dimensions, and setup window will be shared prior to the workshop.`,
      `• Registration & Accommodations: Please remember to complete workshop registration and reserve accommodations via https://www.hems-workshop.org/registration and https://www.hems-workshop.org/accommodations.`,
      ``,
      `We sincerely appreciate your contribution to HEMS ${year} and look forward to seeing you at the workshop.`,
      ``,
      `Warm regards,`,
      ``,
      `The ${ordinal} HEMS Workshop Program Committee`,
      `Harsh-Environment Mass Spectrometry Society`,
      `https://www.hems-workshop.org`,
    ].join("\n");

    return { formattedRecipient, subject, body, selection };
  }

  if (selection === "decline") {
    const subject = `${ordinal} HEMS Workshop (${year}) — Abstract Status Notification: ${sub.id}`;
    const body = [
      `Dear ${greetingName},`,
      ``,
      `Thank you very much for submitting your abstract to the ${ordinal} Biennial Workshop on Harsh-Environment Mass Spectrometry (HEMS ${year}):`,
      ``,
      `  Abstract ID: ${sub.id}`,
      `  Title: "${cleanTitle}"`,
      ``,
      `We received a strong response this cycle and, because HEMS operates as a focused single-track workshop with limited presentation capacity, the Program Committee had to make difficult prioritization decisions based on overall fit with harsh-environment mass spectrometry scope and session balance.`,
      ``,
      `Regrettably, we are unable to include this abstract in the ${year} technical program. We greatly appreciate your interest in the HEMS community, warmly encourage you to attend the workshop in ${venueSummary} (${dates}), and hope you will consider sharing future work at a subsequent HEMS Workshop.`,
      ``,
      `With best wishes and kind regards,`,
      ``,
      `The ${ordinal} HEMS Workshop Program Committee`,
      `Harsh-Environment Mass Spectrometry Society`,
      `https://www.hems-workshop.org`,
    ].join("\n");

    return { formattedRecipient, subject, body, selection };
  }

  return {
    formattedRecipient,
    subject: `${ordinal} HEMS Workshop (${year}) — Abstract Status (${sub.id})`,
    body: [
      `Dear ${greetingName},`,
      ``,
      `[Please select "Accept to Oral", "Accept to Poster", or "Decline" above or in the Abstract Overview Selection dropdown to generate the prepared HEMS Committee response for ${sub.id}: "${cleanTitle}".]`,
    ].join("\n"),
    selection: "pending",
  };
}
