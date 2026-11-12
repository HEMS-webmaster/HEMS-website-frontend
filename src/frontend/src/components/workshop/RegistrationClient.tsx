"use client";

import Link from "next/link";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { useUpcomingWorkshop } from "@/hooks/useUpcomingWorkshop";

export default function RegistrationClient() {
  const { workshop } = useUpcomingWorkshop();
  const canRegisterNow = workshop.registration_open && Boolean(workshop.reg_portal_url);

  return (
    <>
      {/* Page Header */}
      <header className="mb-8 sm:mb-10 border-b border-slate-200 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl sm:rounded-full max-w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium leading-snug mb-4 shadow-2xs tabular-nums">
            <Calendar size={14} className="text-primary shrink-0" /> Symposium Registration • {workshop.workshop_ordinal} HEMS Workshop
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
            Workshop Registration
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
            Registration information for the {workshop.workshop_ordinal} Harsh-Environment Mass Spectrometry Workshop ({workshop.target_window}).
          </p>
        </div>
        <div className="flex flex-col items-center p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-center shrink-0">
          <img
            src="/hemslogo.jpg"
            alt="Harsh-Environment Mass Spectrometry Society Emblem"
            width={3756}
            height={2594}
            decoding="async"
            className="w-24 sm:w-28 h-auto object-contain rounded-lg mix-blend-multiply bg-white p-0.5 block"
          />
        </div>
      </header>

      {!workshop.registration_open ? (
        /* Closed / Save-the-Date Academic Notice */
        <section className="max-w-3xl bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary tabular-nums">
            <Clock size={14} className="shrink-0" /> Registration Not Yet Open
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 leading-snug">
            Registration for the {workshop.workshop_ordinal} HEMS Workshop ({workshop.target_window}) has not yet opened.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Registration dates, fee schedules (including reduced student rates), and the online registration link will be posted here once the host venue and scientific program schedule are finalized by the Organizing Committee.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            In keeping with HEMS Society tradition, participation is open to academic, government, and industrial colleagues with no society membership requirement or separate membership fee.
          </p>
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm font-medium">
            {workshop.interest_form_url ? (
              <a
                href={workshop.interest_form_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
              >
                Join {workshop.workshop_year} Mailing List <ExternalLink size={13} />
              </a>
            ) : (
              <Link href="/contact#mailing-list" className="text-primary font-semibold hover:underline">
                Join Mailing List →
              </Link>
            )}
            <Link href="/contact" className="text-slate-600 hover:text-primary transition-colors">
              Contact Committee →
            </Link>
            <Link href="/student-awards" className="text-slate-600 hover:text-primary transition-colors">
              Student Travel Awards →
            </Link>
            <Link href="/corporate-sponsorship" className="text-slate-600 hover:text-primary transition-colors">
              Corporate Sponsorship →
            </Link>
          </div>
        </section>
      ) : (
        /* Live Registration Schedule (Active Only When registration_open === true) */
        <div className="space-y-8">
          <section className="bg-white border border-slate-200/95 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
                  Registration Categories &amp; Fees
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Registration includes technical sessions, poster receptions, abstract proceedings, and the workshop dinner.
                </p>
              </div>
              {canRegisterNow && (
                <a
                  href={workshop.reg_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-2xs"
                >
                  Online Registration <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 block mb-1">
                  Academic Trainee
                </span>
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  Student Registration
                </h3>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2 mb-2">
                  {workshop.reg_student_fee} <span className="text-xs font-normal text-slate-500">USD</span>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full-time undergraduate and graduate students. Eligible to apply for{" "}
                  <Link href="/student-awards" className="text-primary font-medium hover:underline">
                    Student Travel Awards
                  </Link>
                  .
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-primary/35 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary block mb-1">
                  Standard Academic / Government / Industry
                </span>
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  Regular Registration
                </h3>
                <p className="text-2xl font-bold text-primary tabular-nums mt-2 mb-2">
                  {workshop.reg_professional_fee} <span className="text-xs font-normal text-slate-500">USD</span>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  University faculty, postdoctoral fellows, government laboratory scientists, and industrial researchers.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 block mb-1">
                  Exhibitor &amp; Supporter
                </span>
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  Corporate Sponsor
                </h3>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2 mb-2">
                  {workshop.reg_sponsor_fee} <span className="text-xs font-normal text-slate-500">USD</span>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Includes display space, program recognition, and one regular registration. See{" "}
                  <Link href="/corporate-sponsorship" className="text-primary font-medium hover:underline">
                    Corporate Sponsorship
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs">
              <h2 className="font-serif text-lg font-semibold text-slate-900 mb-3">
                Important Dates
              </h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-600">Early Registration Opens</dt>
                  <dd className="font-medium text-slate-900 tabular-nums text-right">{workshop.reg_early_bird_opens}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-600">Early Registration Deadline</dt>
                  <dd className="font-medium text-slate-900 tabular-nums text-right">{workshop.reg_early_bird_closes}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-600">Final Registration Cutoff</dt>
                  <dd className="font-medium text-slate-900 tabular-nums text-right">{workshop.reg_final_cutoff}</dd>
                </div>
              </dl>
            </section>

            <section className="bg-white border border-slate-200/95 rounded-2xl p-6 shadow-2xs">
              <h2 className="font-serif text-lg font-semibold text-slate-900 mb-3">
                Cancellations &amp; Substitutions
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Written cancellation requests submitted to the Organizing Committee on or before{" "}
                <strong className="font-semibold text-slate-800 tabular-nums">{workshop.reg_refund_cutoff}</strong>{" "}
                are eligible for a refund less a $50 administrative fee. After {workshop.reg_refund_cutoff}, registrations are non-refundable due to venue commitments, though registrant substitutions from the same institution are welcome.
              </p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
