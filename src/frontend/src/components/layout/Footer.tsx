import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/90 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Society Identity */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center">
                <img
                  src="/hemslogo.jpg"
                  alt="HEMS Society Emblem"
                  width={36}
                  height={36}
                  decoding="async"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg text-slate-900 leading-tight">
                  Harsh-Environment Mass Spectrometry Society
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  501(c)(3) Scientific Organization • Est. 1999
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md pt-1">
              An all-volunteer international forum uniting academic, government, and industrial scientists deploying mass spectrometry from the deep ocean to planetary surfaces.
            </p>
          </div>

          {/* Column 2: Society & Archives */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Society &amp; Repository
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Mission &amp; Governance
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-primary transition-colors">
                  Workshop &amp; Society History (1999–2025)
                </Link>
              </li>
              <li>
                <Link href="/archive" className="hover:text-primary transition-colors">
                  Open-Access Proceedings Archive
                </Link>
              </li>
              <li>
                <Link href="/student-awards" className="hover:text-primary transition-colors">
                  Student Travel Awards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Biennial Workshop & Inquiries */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Symposium &amp; Contact
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/layout-portal" className="hover:text-primary transition-colors">
                  16th Workshop Hub (Sept 2027)
                </Link>
              </li>
              <li>
                <Link href="/call-for-papers" className="hover:text-primary transition-colors">
                  Call for Papers
                </Link>
              </li>
              <li>
                <Link href="/corporate-sponsorship" className="hover:text-primary transition-colors">
                  Corporate Sponsorship
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact the Committee
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Harsh-Environment Mass Spectrometry Society, Inc. Recognized IRS 501(c)(3) Public Charity.
          </p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Link href="/archive/2025" className="hover:text-primary transition-colors">
              2025 Proceedings
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/auth" className="hover:text-primary transition-colors">
              Committee Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
