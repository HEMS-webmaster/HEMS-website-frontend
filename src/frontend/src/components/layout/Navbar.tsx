import Link from "next/link";
import { Activity } from "lucide-react";
import workshopsData from "@/data/master_workshops.json";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-primary/30 relative">
      {/* Topographic SVG Graphic - Constrained to prevent bleeding */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 overflow-hidden">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,50 Q250,-20 500,50 T1000,50" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <path d="M0,60 Q250,0 500,60 T1000,60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary opacity-70" />
          <path d="M0,70 Q250,20 500,70 T1000,70" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-secondary opacity-50" />
          <path d="M0,80 Q250,40 500,80 T1000,80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground opacity-30" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-2xl text-foreground tracking-wider flex items-center gap-2">
              HEMS Workshop
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8 text-sm font-medium">
              <div className="relative group">
                <button className="text-foreground/90 hover:text-primary transition-colors flex items-center gap-1 font-medium bg-transparent px-2 py-1 rounded-md">
                  Home Prototypes
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-foreground/10 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary">Layout: Split Hero</Link>
                    <Link href="/layout-expo" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary">Layout A: Expo</Link>
                    <Link href="/layout-editorial" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary">Layout B: Editorial</Link>
                  </div>
                </div>
              </div>
              <Link href="/layout-portal" className="text-foreground/90 hover:text-primary transition-colors font-medium bg-transparent px-2 py-1 rounded-md">Portal</Link>
              <Link href="/about" className="text-foreground/90 hover:text-primary transition-colors font-medium bg-transparent px-2 py-1 rounded-md">About Us</Link>
              <div className="relative group">
                <Link href="/archive" className="text-foreground/90 hover:text-primary transition-colors flex items-center gap-1 font-medium bg-transparent px-2 py-1 rounded-md">
                  Archives
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </Link>
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-foreground/10 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 max-h-[70vh] overflow-y-auto">
                    <Link href="/archive" className="block px-4 py-2 text-sm font-bold text-primary border-b border-foreground/10 hover:bg-primary/10">Archives Home</Link>
                    {[...workshopsData].sort((a, b) => Number(b.year) - Number(a.year)).map((ws: any, idx: number) => {
                      const getOrdinal = (n: number) => {
                        if (n === 1) return "1st";
                        if (n === 2) return "2nd";
                        if (n === 3) return "3rd";
                        return `${n}th`;
                      };
                      return (
                      <Link 
                        key={idx} 
                        href={`/archive/${ws.year}`} 
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary"
                      >
                        {getOrdinal(ws.number)} Workshop ({ws.year})
                      </Link>
                    )})}
                  </div>
                </div>
              </div>
              <Link href="/contact" className="text-foreground/90 hover:text-primary transition-colors font-medium bg-transparent px-2 py-1 rounded-md">Contact</Link>
              <Link href="/join" className="bg-foreground text-background hover:bg-foreground/80 px-4 py-2 rounded-md font-bold transition-all shadow-md">
                Join HEMS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
