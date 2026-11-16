import Link from "next/link";
import { HEMS_LINKEDIN_GROUP_URL } from "@/utils/seo";

function LinkedInMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/90 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8 sm:gap-8 lg:gap-10">
          {/* Column 1: Society Identity */}
          <div className="col-span-2 lg:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="hidden sm:flex w-24 sm:w-28 rounded-xl bg-white border border-slate-200 p-1.5 items-center justify-center shadow-2xs shrink-0">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Emblem"
                  width={3756}
                  height={2594}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-auto object-contain mix-blend-multiply block"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-slate-900 leading-snug">
                  Harsh-Environment Mass Spectrometry Society
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5 tabular-nums">
                  All-Volunteer 501(c)(3) Organization • Est. 1999
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md pt-1">
              An international forum uniting academic, government, and industrial scientists deploying mass spectrometry from the deep ocean to planetary surfaces.
            </p>
            <div className="pt-1">
              <a
                href={HEMS_LINKEDIN_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700 hover:border-[#0A66C2]/40 hover:text-[#0A66C2] transition-colors"
              >
                <LinkedInMark size={14} />
                <span>Join HEMS on LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Column 2: Society & Archives */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Society &amp; Repository
            </h4>
            <ul className="space-y-1.5 text-[13px] sm:text-sm leading-snug text-slate-600">
              <li>
                <Link href="/about" className="inline-block py-1 hover:text-primary transition-colors">
                  Mission &amp; Governance
                </Link>
              </li>
              <li>
                <Link href="/history" className="inline-block py-1 hover:text-primary transition-colors">
                  Workshop &amp; Society History (1999–2025)
                </Link>
              </li>
              <li>
                <Link href="/archive" className="inline-block py-1 hover:text-primary transition-colors">
                  Open-Access Proceedings Archive
                </Link>
              </li>
              <li>
                <Link href="/student-awards" className="inline-block py-1 hover:text-primary transition-colors">
                  Student Travel Awards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Biennial Workshop & Inquiries */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Symposium &amp; Contact
            </h4>
            <ul className="space-y-1.5 text-[13px] sm:text-sm leading-snug text-slate-600">
              <li>
                <Link href="/layout-portal" className="inline-block py-1 hover:text-primary transition-colors">
                  16th Workshop Hub (Sept 2027)
                </Link>
              </li>
              <li>
                <Link href="/call-for-papers" className="inline-block py-1 hover:text-primary transition-colors">
                  Call for Papers
                </Link>
              </li>
              <li>
                <Link href="/corporate-sponsorship" className="inline-block py-1 hover:text-primary transition-colors">
                  Corporate Sponsorship
                </Link>
              </li>
              <li>
                <Link href="/contact#mailing-list" className="inline-block py-1 hover:text-primary transition-colors">
                  Join Mailing List
                </Link>
              </li>
              <li>
                <a
                  href={HEMS_LINKEDIN_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1 hover:text-[#0A66C2] transition-colors"
                >
                  <LinkedInMark size={13} />
                  <span>LinkedIn Community</span>
                </a>
              </li>
              <li>
                <Link href="/contact" className="inline-block py-1 hover:text-primary transition-colors">
                  Contact the Committee
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} Harsh-Environment Mass Spectrometry Society, Inc. (Est. 1999). Recognized IRS 501(c)(3) Public Charity.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <Link href="/archive/2025" className="py-1 hover:text-primary transition-colors">
              2025 Proceedings
            </Link>
            <span className="text-slate-300">•</span>
            <a href="/llms.txt" className="py-1 hover:text-primary transition-colors" title="Machine-readable HEMS Society & Proceedings index for scholarly and AI citation">
              AI &amp; Citation Index
            </a>
            <span className="text-slate-300">•</span>
            <a href="mailto:webmaster@hems-workshop.org" className="py-1 hover:text-primary transition-colors">
              Website Support
            </a>
            <span className="text-slate-300">•</span>
            <Link href="/unsubscribe" className="py-1 hover:text-primary transition-colors">
              Unsubscribe
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/auth" className="py-1 hover:text-primary transition-colors">
              Committee Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
