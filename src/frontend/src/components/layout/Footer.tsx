import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-primary/10 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-mono font-bold text-xl text-foreground mb-2">HEMS Workshop</h3>
            <p className="text-foreground/70 text-sm max-w-md">
              Advancing in situ mass spectrometry in the most extreme environments known to science—from deep space to the abyssal ocean.
            </p>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="text-foreground/70 hover:text-primary transition-colors">About</Link>
            <Link href="/archive" className="text-foreground/70 hover:text-primary transition-colors">Archive</Link>
            <Link href="/contact" className="text-foreground/70 hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center text-xs text-foreground/50">
          <p>&copy; {new Date().getFullYear()} Harsh-Environment Mass Spectrometry Society, Inc.</p>
          <p className="mt-2 md:mt-0">A Public Charity under section 501(c)(3).</p>
        </div>
      </div>
    </footer>
  );
}
