import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/90 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Society Identity */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-24 sm:w-28 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
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
                  501(c)(3) Scientific Organization • Est. 1999
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md pt-1">
              An all-volunteer international forum uniting academic, government, and industrial scientists deploying mass spectrometry from the deep ocean to planetary surfaces.
            </p>
          </div>

          {/* Column 2: Society & Archives */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Society &amp; Repository
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-600">
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
            <ul className="space-y-1.5 text-sm text-slate-600">
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
                <Link href="/contact" className="inline-block py-1 hover:text-primary transition-colors">
                  Contact the Committee
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} Harsh-Environment Mass Spectrometry Society, Inc. Recognized IRS 501(c)(3) Public Charity.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <Link href="/archive/2025" className="py-1 hover:text-primary transition-colors">
              2025 Proceedings
            </Link>
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
