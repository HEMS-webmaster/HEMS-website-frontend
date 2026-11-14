"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Database,
  ShieldCheck,
  KeyRound,
  Tags,
  CheckCircle2,
  Server,
} from "lucide-react";

interface MailingSystemInfoModalProps {
  open: boolean;
  onClose: () => void;
  isLiveFirestore: boolean;
}

export default function MailingSystemInfoModal({
  open,
  onClose,
  isLiveFirestore,
}: MailingSystemInfoModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mailing-info-dialog-title"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary block mb-0.5">
                Architecture &amp; Operations Reference
              </span>
              <h2
                id="mailing-info-dialog-title"
                className="font-serif text-xl sm:text-2xl font-semibold text-slate-900"
              >
                How the HEMS Mailing List &amp; Postmark Delivery Work
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close mailing system guide"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{ maxHeight: "70vh" }}
            className="block overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white"
          >
          {/* Live Environment Status Strip */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Server size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-xs sm:text-sm">
                  Current Storage:{" "}
                  {isLiveFirestore
                    ? "Live Google Cloud Firestore (hems-workshop)"
                    : "Offline Browser Sandbox (localStorage)"}
                </strong>
                <span className="text-xs text-slate-600">
                  Both <code className="bg-white px-1 py-0.5 rounded border border-slate-200">localhost:3000</code>{" "}
                  (with <code className="bg-white px-1 py-0.5 rounded border border-slate-200">.env.local</code>) and the{" "}
                  <strong>Firebase Preview</strong> share the exact same live Cloud Firestore database—all hygiene and tagging done here persist permanently for production cutover.
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Where Emails Are Stored */}
          <section className="space-y-2">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Database size={17} className="text-primary shrink-0" />
              1. Where Subscriber Emails Are Stored
            </h3>
            <p>
              Unlike traditional newsletter platforms, <strong>Postmark does not hold or own your subscriber list</strong>—Postmark is strictly a high-reputation delivery pipe. Your master audience lives inside HEMS&apos;s own Google Cloud / Firebase project (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">hems-workshop</code>):
            </p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <code className="text-xs font-semibold bg-slate-100 px-1.5 py-0.5 rounded">mailing_subscribers</code> — Master directory of emails, affiliations, sublists/tags, statuses (<em>Active</em>, <em>Pending Opt-In</em>, <em>Unsubscribed</em>, <em>Hard Bounced</em>, <em>Complained</em>), and private unsubscribe tokens. Locked by <code className="text-xs bg-slate-100 px-1 rounded">firestore.rules</code> strictly to signed-in <strong>Board</strong> and <strong>Admin</strong> accounts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <code className="text-xs font-semibold bg-slate-100 px-1.5 py-0.5 rounded">mailing_campaigns</code> — Permanent audit trail of society announcements, target sublists, and delivery counts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <code className="text-xs font-semibold bg-slate-100 px-1.5 py-0.5 rounded">mailing_public_requests</code> — Write-only public staging queue (visitors can submit a signup or opt-out, zero public read access, synced by Board Members in one click).
                </span>
              </li>
            </ul>
          </section>

          {/* Section 2: End-to-End Deliverability & Anti-Spam */}
          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={17} className="text-primary shrink-0" />
              2. How High-Trust Delivery &amp; Hygiene Work End-to-End
            </h3>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Tracking Pixels &amp; 100% Direct URLs:</strong> Every broadcast is dispatched with{" "}
                  <code className="text-xs bg-slate-100 px-1 rounded">TrackOpens: false</code> and{" "}
                  <code className="text-xs bg-slate-100 px-1 rounded">TrackLinks: &quot;None&quot;</code>. Links point directly to{" "}
                  <code className="text-xs bg-slate-100 px-1 rounded">https://hems-workshop.org/...</code> rather than masked click-tracking redirect domains—preventing <code className="text-xs bg-slate-100 px-1 rounded">.gov</code>, national-lab, and university security gateways from quarantining workshop notices.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>First-Party <code className="text-xs bg-slate-100 px-1 rounded">?src=</code> Attribution (Zero Redirects):</strong> The Announcement Composer automatically appends a clean first-party <code className="text-xs bg-slate-100 px-1 rounded">?src=&lt;campaign-slug&gt;</code> query tag to <code className="text-xs bg-slate-100 px-1 rounded">hems-workshop.org</code> links so you can measure real human visits, pages read, and conversions in <strong>Website Analytics</strong> without email pixels or redirect wrappers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>RFC 8058 One-Click Unsubscribe + Multipart Text:</strong> Every email includes a plain-text companion alongside scholarly HTML letterhead, the 501(c)(3) footer, and native Gmail/Outlook 1-click <code className="text-xs bg-slate-100 px-1 rounded">List-Unsubscribe-Post</code> headers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Bounce &amp; Complaint Suppression:</strong> When a retired <code className="text-xs bg-slate-100 px-1 rounded">.edu</code>/<code className="text-xs bg-slate-100 px-1 rounded">.gov</code> mailbox hard-bounces (<code className="text-xs bg-slate-100 px-1 rounded">550</code>) or reports spam, Postmark&apos;s webhook (<code className="text-xs bg-slate-100 px-1 rounded">/api/mailing/webhooks/postmark</code>) automatically marks that Firestore record as <em>Bounced</em> or <em>Complained</em> so it is never emailed again.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 3: Postmark Connection & Login Policy */}
          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <KeyRound size={17} className="text-primary shrink-0" />
              3. Postmark Connection &amp; Do Board Members Need a Login?
            </h3>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Safe Pre-Cutover Sandbox:</strong> Until <code className="text-xs bg-slate-100 px-1 rounded">POSTMARK_SERVER_TOKEN</code> is configured in Firebase Cloud Functions during domain cutover, zero live emails can accidentally leave the system while you import and clean lists.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Only One Society Admin Login Needed at Postmark:</strong> Only the Society Administrator creates a single account at <code className="text-xs bg-slate-100 px-1 rounded">postmarkapp.com</code> (eligible for Postmark&apos;s 501(c)(3) Nonprofit discount), adds the Google Cloud DNS <code className="text-xs bg-slate-100 px-1 rounded">2048-bit DKIM</code> &amp; <code className="text-xs bg-slate-100 px-1 rounded">Return-Path</code> records, and provides the Server API Token.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Board Members Never Log Into Postmark:</strong> Fellow officers simply sign into <code className="text-xs bg-slate-100 px-1 rounded">hems-workshop.org</code> with their authorized Board account and use <strong>Mailing List</strong> and <strong>Announcements</strong> directly on this website.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4: Sublists & Tags */}
          <section className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Tags size={17} className="text-primary shrink-0" />
              4. Using Sublists &amp; Cohort Tags
            </h3>
            <p>
              Create custom sublists such as <strong>Board Members</strong>, <strong>2025 Attendees</strong>, <strong>2025 Presenters</strong>, or <strong>2025 Corporate Sponsors</strong>. You can assign sublists during CSV upload, apply/remove tags in bulk using the table checkboxes, or add tags inline on individual rows—and target any sublist directly in the <strong>Announcement Composer</strong> (only <em>Active</em> non-suppressed members of that sublist will ever be emailed).
            </p>
          </section>
        </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-500">
              Full DNS cutover steps: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">infrastructure/postmark-dns-cutover.md</code>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

