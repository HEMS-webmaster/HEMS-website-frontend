import {
  DeliverabilityAudit,
  DeliverabilityCheckItem,
  DeliverabilitySeverity,
  MailchimpParsedRow,
  MailingInterest,
  SubscriberStatus,
} from "@/types/mailing";
import { parseCsvRows } from "@/utils/upcomingWorkshop";

const SHORTENER_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "lnkd.in",
  "rb.gy",
  "is.gd",
  "list-manage.com",
  "eepurl.com",
];

const SPAM_TRIGGER_PHRASES = [
  "act now",
  "click here!",
  "100% free",
  "limited time offer",
  "urgent!!!",
  "congratulations!",
];

export function normalizeSubscriberEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSubscriberEmail(email: string): boolean {
  const clean = normalizeSubscriberEmail(email);
  return (
    clean.length >= 5 &&
    clean.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)
  );
}

export function subscriberDocId(email: string): string {
  return encodeURIComponent(normalizeSubscriberEmail(email)).replace(/\./g, "%2E");
}

export function generateClientToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineMarkdownHtml(escapedLine: string): string {
  // Support **bold** and [label](https://...) links cleanly without raw HTML injection
  let html = escapedLine.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong style="font-weight:600;color:#0F172A;">$1</strong>'
  );
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" style="color:#1E3A8A;text-decoration:underline;font-weight:500;">$1</a>'
  );
  return html;
}

function formatInlineMarkdownPlain(rawLine: string): string {
  return rawLine
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 ($2)");
}

/**
 * Converts clean academic Markdown-lite prose into both lightweight semantic HTML
 * paragraphs (zero tracking pixels, zero redirect wrappers) and a matching plain-text body.
 */
export function renderAcademicEmailParts(
  subject: string,
  markdownBody: string
): {
  paragraphsHtml: string;
  fullPreviewHtml: string;
  plainBodyCore: string;
  fullPreviewPlain: string;
} {
  const blocks = markdownBody
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const htmlBlocks: string[] = [];
  const plainBlocks: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());

    if (lines.length === 1 && lines[0].startsWith("## ")) {
      const headingText = lines[0].slice(3).trim();
      htmlBlocks.push(
        `<h2 style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:#0F172A;margin:18px 0 8px 0;">${escapeHtml(
          headingText
        )}</h2>`
      );
      plainBlocks.push(headingText.toUpperCase());
      continue;
    }

    if (lines.every((l) => l.startsWith("- ") || l.startsWith("* "))) {
      const liHtml = lines
        .map(
          (l) =>
            `<li style="margin:0 0 6px 0;">${formatInlineMarkdownHtml(
              escapeHtml(l.slice(2).trim())
            )}</li>`
        )
        .join("");
      htmlBlocks.push(
        `<ul style="margin:0 0 16px 0;padding-left:20px;color:#1E293B;">${liHtml}</ul>`
      );
      plainBlocks.push(
        lines.map((l) => `• ${formatInlineMarkdownPlain(l.slice(2).trim())}`).join("\n")
      );
      continue;
    }

    const paragraphHtml = lines
      .map((l) => formatInlineMarkdownHtml(escapeHtml(l)))
      .join("<br />");
    htmlBlocks.push(`<p style="margin:0 0 15px 0;">${paragraphHtml}</p>`);
    plainBlocks.push(lines.map((l) => formatInlineMarkdownPlain(l)).join("\n"));
  }

  const paragraphsHtml = htmlBlocks.join("\n");
  const plainBodyCore = plainBlocks.join("\n\n");
  const sampleUnsubUrl = "https://hems-workshop.org/unsubscribe/?token=sample-subscriber-token";
  const postalFooter =
    "Harsh-Environment Mass Spectrometry Society, Inc. (501(c)(3) Scientific Organization) • St. Petersburg, FL, USA";

  const fullPreviewHtml = `
    <div style="background-color:#F8FAFC;padding:20px;border-radius:12px;border:1px solid #E2E8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
        <div style="padding:20px 24px 14px 24px;border-bottom:1px solid #E2E8F0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:#1E3A8A;">
            Harsh-Environment Mass Spectrometry Society
          </div>
          <div style="font-size:12px;color:#64748B;margin-top:2px;">
            501(c)(3) Scientific Organization &bull; hems-workshop.org
          </div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #E2E8F0;font-size:13px;color:#334155;">
            <strong>Subject:</strong> ${escapeHtml(subject || "(No subject entered)")}
          </div>
        </div>
        <div style="padding:22px 24px;font-size:14.5px;color:#1E293B;">
          ${paragraphsHtml || '<p style="color:#94A3B8;font-style:italic;">Compose announcement text to preview...</p>'}
        </div>
        <div style="padding:14px 24px 18px 24px;border-top:1px solid #F1F5F9;background:#F8FAFC;font-size:11.5px;color:#64748B;">
          <p style="margin:0 0 4px 0;">You are receiving official academic symposium announcements from the Harsh-Environment Mass Spectrometry Society. <span style="color:#1E3A8A;text-decoration:underline;">Manage subscription / Unsubscribe</span>.</p>
          <p style="margin:0;color:#94A3B8;">${escapeHtml(postalFooter)}</p>
        </div>
      </div>
    </div>
  `;

  const fullPreviewPlain = `${plainBodyCore}\n\n---\nManage subscription / Unsubscribe: ${sampleUnsubUrl}\n${postalFooter}`;

  return { paragraphsHtml, fullPreviewHtml, plainBodyCore, fullPreviewPlain };
}

/**
 * Evaluates a draft announcement against .gov / .edu / Proofpoint / Mimecast URL-trust
 * and anti-spam best practices before Board dispatch.
 */
export function auditCampaignDeliverability(
  subject: string,
  markdownBody: string
): DeliverabilityAudit {
  const checks: DeliverabilityCheckItem[] = [];
  const trimmedSubject = subject.trim();
  const trimmedBody = markdownBody.trim();

  // 1. Subject line check
  const upperLetters = trimmedSubject.replace(/[^A-Z]/g, "").length;
  const allLetters = trimmedSubject.replace(/[^A-Za-z]/g, "").length;
  const isShouting = allLetters >= 8 && upperLetters / allLetters > 0.65;
  const hasExclamations = /!{2,}/.test(trimmedSubject);

  if (!trimmedSubject) {
    checks.push({
      id: "subject",
      label: "Academic Subject Line",
      severity: "fail",
      detail: "Enter a clear, descriptive subject line (e.g., '16th HEMS Workshop — First Call for Papers').",
    });
  } else if (isShouting || hasExclamations) {
    checks.push({
      id: "subject",
      label: "Academic Subject Line",
      severity: "warning",
      detail: "Avoid ALL-CAPS words or multiple exclamation marks; sentence-case subjects achieve higher .gov/.edu trust.",
    });
  } else {
    checks.push({
      id: "subject",
      label: "Academic Subject Line",
      severity: "pass",
      detail: "Clean scholarly subject formatting with zero spam-punctuation flags.",
    });
  }

  // 2. HTTPS & URL Shortener Trust Check
  const urls = trimmedBody.match(/https?:\/\/[^\s)]+/gi) || [];
  const insecureUrls = urls.filter((u) => u.toLowerCase().startsWith("http://"));
  const shortenerHits = urls.filter((u) => {
    try {
      const host = new URL(u).hostname.toLowerCase();
      return SHORTENER_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return false;
    }
  });

  if (insecureUrls.length > 0) {
    checks.push({
      id: "https",
      label: "Direct HTTPS URL Trust",
      severity: "fail",
      detail: `Found ${insecureUrls.length} non-HTTPS (http://) link(s). Upgrade all links to https:// so enterprise gateways do not quarantine the message.`,
    });
  } else if (shortenerHits.length > 0) {
    checks.push({
      id: "https",
      label: "Direct HTTPS URL Trust",
      severity: "fail",
      detail: `Avoid link shorteners or Mailchimp redirect domains (${shortenerHits[0]}). Link directly to https://hems-workshop.org/...`,
    });
  } else {
    checks.push({
      id: "https",
      label: "Direct HTTPS URL Trust",
      severity: "pass",
      detail:
        urls.length > 0
          ? `All ${urls.length} link(s) use direct HTTPS with zero tracking redirects (TrackLinks: None).`
          : "Zero insecure or shortened links detected (TrackLinks: None, TrackOpens: OFF).",
    });
  }

  // 3. Spam-phrase & body length check
  const lowerCombined = `${trimmedSubject} ${trimmedBody}`.toLowerCase();
  const triggerHit = SPAM_TRIGGER_PHRASES.find((p) => lowerCombined.includes(p));
  if (trimmedBody.length < 40) {
    checks.push({
      id: "content",
      label: "Multipart Plain-Text + HTML Balance",
      severity: "fail",
      detail: "Body is too brief (< 40 characters). Very short bulk messages trigger heuristic spam filters.",
    });
  } else if (triggerHit) {
    checks.push({
      id: "content",
      label: "Multipart Plain-Text + HTML Balance",
      severity: "warning",
      detail: `Marketing phrase "${triggerHit}" detected; prefer neutral academic phrasing.`,
    });
  } else {
    checks.push({
      id: "content",
      label: "Multipart Plain-Text + HTML Balance",
      severity: "pass",
      detail: "Balanced scholarly text + matching plain-text companion generated automatically.",
    });
  }

  // 4. RFC 8058 + CAN-SPAM Compliance Header Guarantee
  checks.push({
    id: "rfc8058",
    label: "RFC 8058 One-Click Unsubscribe & 501(c)(3) Footer",
    severity: "pass",
    detail: "List-Unsubscribe-Post header and signed /unsubscribe footer link are injected automatically per recipient.",
  });

  let overallStatus: DeliverabilitySeverity = "pass";
  if (checks.some((c) => c.severity === "fail")) {
    overallStatus = "fail";
  } else if (checks.some((c) => c.severity === "warning")) {
    overallStatus = "warning";
  }

  return { overallStatus, checks };
}

/**
 * Cleans and normalizes a Board custom sublist / tag label while preserving readable casing
 * (e.g., "Board Members", "2025 Attendees", "2025 Corporate Sponsors").
 */
export function normalizeSublistTag(raw: string): string {
  return raw
    .replace(/^sublist:/i, "")
    .replace(/[;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function formatSegmentDisplayName(segment: string): string {
  if (segment === "all") return "All Active Subscribed";
  if (segment === "workshop") return "Topic: Biennial Workshop";
  if (segment === "student_awards") return "Topic: Student Travel Awards";
  if (segment === "sponsorship") return "Topic: Corporate Sponsorship";
  if (segment.startsWith("sublist:")) {
    return `Sublist: ${segment.slice("sublist:".length)}`;
  }
  return segment;
}

/**
 * Parses a standard Mailchimp Audience CSV export (Subscribed, Unsubscribed, or Cleaned/Bounced)
 * or any committee CSV (Attendees, Presenters, Corporate Sponsors, Board Members).
 */
export function parseMailchimpCsvExport(
  csvText: string,
  defaultStatusOverride: "auto" | SubscriberStatus = "auto",
  assignSublistTag = ""
): MailchimpParsedRow[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const findCol = (candidates: string[]): number =>
    headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));

  const emailIdx = findCol(["email address", "email"]);
  if (emailIdx === -1) return [];

  const firstIdx = findCol(["first name", "fname", "first_name"]);
  const lastIdx = findCol(["last name", "lname", "last_name"]);
  const orgIdx = findCol([
    "affiliation",
    "organization",
    "company",
    "institution",
    "institute",
    "university",
  ]);
  const tagsIdx = findCol(["sublists", "sublist", "tags", "groups", "interests"]);
  const dateAddedIdx = findCol([
    "date added",
    "added at",
    "created at",
    "created_at",
    "optin_time",
    "confirm_time",
    "timestamp",
  ]);
  const statusIdx = findCol(["status", "member status", "unsub_reason", "clean_time", "unsub_time"]);
  const unsubTimeIdx = headers.findIndex((h) => h.includes("unsub"));
  const cleanTimeIdx = headers.findIndex((h) => h.includes("clean") || h.includes("bounce"));

  const cleanBatchTag = normalizeSublistTag(assignSublistTag);
  const builtInTopicNames = new Set([
    "workshop",
    "student_awards",
    "student awards",
    "sponsorship",
  ]);

  const parsed: MailchimpParsedRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= emailIdx) continue;
    const email = normalizeSubscriberEmail(row[emailIdx] || "");
    if (!isValidSubscriberEmail(email)) continue;

    const firstName = firstIdx >= 0 ? (row[firstIdx] || "").trim() : "";
    const lastName = lastIdx >= 0 ? (row[lastIdx] || "").trim() : "";
    const affiliation = orgIdx >= 0 ? (row[orgIdx] || "").trim() : "";
    const rawTagsCell = tagsIdx >= 0 ? (row[tagsIdx] || "").trim() : "";
    const rawTags = rawTagsCell.toLowerCase();

    const interests: MailingInterest[] = ["workshop"];
    if (rawTags.includes("student") || rawTags.includes("award")) {
      interests.push("student_awards");
    }
    if (rawTags.includes("sponsor") || rawTags.includes("exhibitor") || rawTags.includes("corporate")) {
      interests.push("sponsorship");
    }

    const rowSublistsSet = new Set<string>();
    if (cleanBatchTag) {
      rowSublistsSet.add(cleanBatchTag);
    }
    if (rawTagsCell) {
      const splitTokens = rawTagsCell
        .replace(/^"+|"+$/g, "")
        .split(/[;,]/)
        .map((t) => normalizeSublistTag(t.replace(/^"+|"+$/g, "")))
        .filter(Boolean);
      for (const tok of splitTokens) {
        if (!builtInTopicNames.has(tok.toLowerCase())) {
          rowSublistsSet.add(tok);
        }
      }
    }

    let status: SubscriberStatus = "active";
    if (defaultStatusOverride !== "auto") {
      status = defaultStatusOverride;
    } else {
      const rawStatus = statusIdx >= 0 ? (row[statusIdx] || "").trim().toLowerCase() : "";
      const hasUnsubStamp = unsubTimeIdx >= 0 && Boolean((row[unsubTimeIdx] || "").trim());
      const hasCleanStamp = cleanTimeIdx >= 0 && Boolean((row[cleanTimeIdx] || "").trim());

      if (hasCleanStamp || rawStatus.includes("clean") || rawStatus.includes("bounce")) {
        status = "bounced";
      } else if (rawStatus.includes("complain") || rawStatus.includes("abuse")) {
        status = "complained";
      } else if (hasUnsubStamp || rawStatus.includes("unsub") || rawStatus.includes("non-subscribed")) {
        status = "unsubscribed";
      }
    }

    let parsedCreatedAt: string | undefined;
    if (dateAddedIdx >= 0) {
      const rawDate = (row[dateAddedIdx] || "").trim().replace(/^"+|"+$/g, "");
      if (rawDate) {
        const ms = Date.parse(rawDate);
        if (!Number.isNaN(ms) && ms > 0) {
          parsedCreatedAt = new Date(ms).toISOString();
        }
      }
    }

    parsed.push({
      email,
      firstName,
      lastName,
      affiliation,
      interests,
      sublists: Array.from(rowSublistsSet),
      status,
      ...(parsedCreatedAt ? { createdAt: parsedCreatedAt } : {}),
    });
  }

  return parsed;
}

