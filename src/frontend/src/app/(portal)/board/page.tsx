"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasBoardOrAdminRole } from "@/utils/telemetryClient";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import { MOCK_CONTACT_INQUIRIES_KEY } from "@/components/workshop/ContactClient";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Building2,
  ShieldAlert,
  FileText,
  Download,
  Lock,
  Calendar,
  Users,
  Send,
  ArrowRight,
  ShieldCheck,
  BarChart2,
  Inbox,
  Mail,
  ExternalLink,
  CheckCircle2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface WebsiteInquiryRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  recipientEmail: string;
  createdAt: string;
  status: "pending" | "forwarded" | "processed";
  isLocalBuffer?: boolean;
}

export default function BoardPage() {
  const { user, loading, isMock } = useAuth();
  const [inquiries, setInquiries] = useState<WebsiteInquiryRecord[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState<boolean>(false);

  const authorized = Boolean(user && hasBoardOrAdminRole(user.roles));

  const loadInquiries = useCallback(async () => {
    if (!authorized) return;
    setLoadingInquiries(true);

    const combined: WebsiteInquiryRecord[] = [];

    if (!isMock && hasFirebaseKeys && db) {
      try {
        const snap = await getDocs(collection(db, "mailing_public_requests"));
        snap.forEach((d) => {
          const data = d.data();
          if (data.type === "contact_inquiry") {
            combined.push({
              id: d.id,
              firstName: String(data.firstName || ""),
              lastName: String(data.lastName || ""),
              email: String(data.email || ""),
              subject: String(data.subject || "General Society Inquiry"),
              message: String(data.message || ""),
              recipientEmail: String(
                data.recipientEmail || "president@hems-workshop.org"
              ),
              createdAt: String(data.createdAt || ""),
              status:
                data.status === "processed"
                  ? "processed"
                  : data.status === "forwarded"
                  ? "forwarded"
                  : "pending",
            });
          }
        });
      } catch {
        // Gracefully ignore if cloud rules are awaiting deploy
      }
    }

    if (typeof window !== "undefined") {
      try {
        const rawLocal = JSON.parse(
          window.localStorage.getItem(MOCK_CONTACT_INQUIRIES_KEY) || "[]"
        ) as Array<Record<string, unknown>>;
        for (const item of rawLocal) {
          const id = String(item.id || "");
          if (id && !combined.some((c) => c.id === id)) {
            combined.push({
              id,
              firstName: String(item.firstName || ""),
              lastName: String(item.lastName || ""),
              email: String(item.email || ""),
              subject: String(item.subject || "General Society Inquiry"),
              message: String(item.message || ""),
              recipientEmail: String(
                item.recipientEmail || "president@hems-workshop.org"
              ),
              createdAt: String(item.createdAt || ""),
              status:
                item.status === "processed"
                  ? "processed"
                  : item.status === "forwarded"
                  ? "forwarded"
                  : "pending",
              isLocalBuffer: true,
            });
          }
        }
      } catch {
        // Ignore malformed localStorage
      }
    }

    combined.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setInquiries(combined);
    setLoadingInquiries(false);
  }, [authorized, isMock]);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const handleMarkResolved = async (inq: WebsiteInquiryRecord) => {
    if (inq.isLocalBuffer) {
      if (typeof window !== "undefined") {
        const rawLocal = JSON.parse(
          window.localStorage.getItem(MOCK_CONTACT_INQUIRIES_KEY) || "[]"
        ) as Array<Record<string, unknown>>;
        const updated = rawLocal.map((r) =>
          String(r.id) === inq.id ? { ...r, status: "processed" } : r
        );
        window.localStorage.setItem(
          MOCK_CONTACT_INQUIRIES_KEY,
          JSON.stringify(updated)
        );
      }
    } else if (hasFirebaseKeys && db) {
      await updateDoc(doc(db, "mailing_public_requests", inq.id), {
        status: "processed",
      });
    }
    setInquiries((prev) =>
      prev.map((x) => (x.id === inq.id ? { ...x, status: "processed" } : x))
    );
  };

  const handleDeleteInquiry = async (inq: WebsiteInquiryRecord) => {
    if (inq.isLocalBuffer) {
      if (typeof window !== "undefined") {
        const rawLocal = JSON.parse(
          window.localStorage.getItem(MOCK_CONTACT_INQUIRIES_KEY) || "[]"
        ) as Array<Record<string, unknown>>;
        const filtered = rawLocal.filter((r) => String(r.id) !== inq.id);
        window.localStorage.setItem(
          MOCK_CONTACT_INQUIRIES_KEY,
          JSON.stringify(filtered)
        );
      }
    } else if (hasFirebaseKeys && db) {
      await deleteDoc(doc(db, "mailing_public_requests", inq.id));
    }
    setInquiries((prev) => prev.filter((x) => x.id !== inq.id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-foreground/50 mt-4">Verifying credentials...</p>
      </div>
    );
  }

  // Access Control check
  if (!user || !authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be logged in as an authenticated **HEMS Board Member** to view this panel.
        </p>
        <Link href="/auth" className="mt-6 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  const boardDocs = [
    { title: "HEMS Board Meeting Minutes - October 2025", date: "2025-10-18", size: "142 KB", type: "Minutes" },
    { title: "HEMS Annual Financial Report & Budget Review FY2025", date: "2025-12-10", size: "488 KB", type: "Financials" },
    { title: "Upcoming 16th HEMS Workshop Planning & Venue Agenda", date: "2026-03-05", size: "95 KB", type: "Agenda" }
  ];

  const openCount = inquiries.filter((i) => i.status !== "processed").length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <Building2 className="text-primary shrink-0" /> Board Member Panel
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Access secure board documents, review website inquiries, and manage society communications.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold text-primary self-start md:self-center break-all">
          Board Member: {user.email}
        </div>
      </div>

      {/* Society Communications & High-Deliverability Mailing Suite */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck size={19} className="text-primary shrink-0" />
              Society Communications &amp; Mailing List
            </h3>
            <p className="text-xs text-foreground/60 mt-0.5">
              High-deliverability Postmark distribution on <code className="font-semibold text-primary">hems-workshop.org</code> (zero tracking pixels, direct URLs, RFC 8058 one-click unsubscribe).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/board/mailing-list"
            className="group bg-background border border-foreground/10 hover:border-primary/45 rounded-2xl p-5 sm:p-6 transition-all shadow-2xs flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Users size={20} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open Directory <ArrowRight size={13} />
                </span>
              </div>
              <h4 className="font-serif text-lg font-semibold text-foreground">
                Subscriber Directory &amp; Sublists
              </h4>
              <p className="text-xs text-foreground/65 leading-relaxed">
                Manage confirmed subscribers, custom sublists, public opt-ins, CSV backups, and Mailchimp audience imports while preserving suppression history.
              </p>
            </div>
          </Link>

          <Link
            href="/board/announcements"
            className="group bg-background border border-foreground/10 hover:border-primary/45 rounded-2xl p-5 sm:p-6 transition-all shadow-2xs flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                  <Send size={20} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open Composer <ArrowRight size={13} />
                </span>
              </div>
              <h4 className="font-serif text-lg font-semibold text-foreground">
                Academic Announcement Composer
              </h4>
              <p className="text-xs text-foreground/65 leading-relaxed">
                Draft Call for Papers and Workshop announcements with automatic <code className="text-[11px]">?src=</code> first-party link tagging, URL-trust audit, and officer test-send safety gate.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="group bg-background border border-foreground/10 hover:border-primary/45 rounded-2xl p-5 sm:p-6 transition-all shadow-2xs flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <BarChart2 size={20} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Telemetry <ArrowRight size={13} />
                </span>
              </div>
              <h4 className="font-serif text-lg font-semibold text-foreground">
                Website &amp; Campaign Analytics
              </h4>
              <p className="text-xs text-foreground/65 leading-relaxed">
                Inspect page views, daily traffic spikes, <code className="text-[11px]">?src=</code> email campaign arrivals, live visitor stream, proceedings PDF downloads, and authenticated member activity.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Online Website Inquiries Inbox */}
      <div className="bg-background border border-foreground/10 rounded-2xl p-5 sm:p-6 md:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-3">
            <Inbox className="text-primary shrink-0" size={20} />
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-lg text-foreground">
                  Online Website Inquiries
                </h3>
                {openCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tabular-nums">
                    {openCount} Open
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/60">
                Messages submitted via the <strong>Submit Online</strong> button on <Link href="/contact" className="text-primary hover:underline">/contact</Link> (stored in Firestore &amp; forwarded via Postmark once active).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadInquiries()}
            disabled={loadingInquiries}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-foreground/15 text-xs font-semibold text-foreground/75 hover:border-primary/40 hover:text-primary transition-colors self-start sm:self-center cursor-pointer"
          >
            <RefreshCw size={13} className={loadingInquiries ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {inquiries.length === 0 ? (
          <p className="text-xs text-foreground/55 py-4 text-center">
            No online inquiries recorded yet. Submissions from the Contact page will appear here automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {inquiries.slice(0, 25).map((inq) => {
              const senderName = `${inq.firstName} ${inq.lastName}`.trim() || inq.email;
              const replySubject = `Re: [HEMS Website] ${inq.subject}`;
              const gmailReplyUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                inq.email
              )}&su=${encodeURIComponent(replySubject)}`;
              const mailtoReplyUrl = `mailto:${inq.email}?subject=${encodeURIComponent(
                replySubject
              )}`;

              return (
                <div
                  key={inq.id}
                  className={`p-4 rounded-xl border transition-colors space-y-2.5 ${
                    inq.status === "processed"
                      ? "bg-surface/40 border-foreground/5 opacity-75"
                      : "bg-surface border-foreground/15"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {inq.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10.5px] font-semibold">
                          To: {inq.recipientEmail}
                        </span>
                        {inq.status === "forwarded" && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-semibold">
                            Emailed via Postmark
                          </span>
                        )}
                        {inq.status === "processed" && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/65 mt-0.5">
                        From <strong>{senderName}</strong> ({inq.email}) •{" "}
                        {inq.createdAt ? new Date(inq.createdAt).toLocaleString() : "Recent"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <a
                        href={gmailReplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors"
                      >
                        Reply in Gmail <ExternalLink size={11} />
                      </a>
                      <a
                        href={mailtoReplyUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Mail size={11} /> Email App
                      </a>
                      {inq.status !== "processed" && (
                        <button
                          type="button"
                          onClick={() => void handleMarkResolved(inq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold cursor-pointer"
                        >
                          <CheckCircle2 size={11} /> Resolve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDeleteInquiry(inq)}
                        aria-label="Delete inquiry"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background border border-foreground/10 text-xs text-foreground/85 whitespace-pre-wrap leading-relaxed">
                    {inq.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-background border border-foreground/10 rounded-2xl p-5 sm:p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-foreground/10 pb-4">
          <Lock className="text-primary shrink-0" size={20} />
          <h3 className="font-bold text-lg text-foreground">Secure Board Repository</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {boardDocs.map((docItem, idx) => (
            <div key={idx} className="bg-surface border border-foreground/5 p-4 rounded-xl flex items-center justify-between gap-3 hover:border-primary/45 transition-all">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                <div className="bg-primary/10 text-primary p-3 rounded-lg flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground leading-snug">{docItem.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums text-xs text-foreground/50 mt-1 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {docItem.date}</span>
                    <span>Size: {docItem.size}</span>
                    <span className="bg-foreground/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{docItem.type}</span>
                  </div>
                </div>
              </div>

              <button className="bg-foreground text-background hover:bg-foreground/80 p-2.5 rounded-lg transition-all shadow cursor-pointer shrink-0">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
