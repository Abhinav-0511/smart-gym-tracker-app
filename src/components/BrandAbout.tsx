import BrandLogo from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandAboutProps {
  className?: string;
}

/**
 * The shared "About LifeTrack" card — app mark, name, motto, version and the
 * immutable "Powered by Vernex Gen Technologies" attribution. Rendered on every
 * module's account/settings screen so the brand identity is consistent app-wide.
 */
const BrandAbout = ({ className }: BrandAboutProps) => (
  <section
    className={cn("glass-card overflow-hidden p-0", className)}
    aria-labelledby="about-brand-heading"
  >
    <div className="bg-brand-navy relative flex flex-col items-center px-5 py-7 text-center text-white">
      <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-white/40">
        <BrandLogo kind="app" className="h-[112%] w-[112%] max-w-none" />
      </div>
      <h3 id="about-brand-heading" className="relative mt-4 text-xl font-extrabold tracking-tight">
        {BRAND.name}
      </h3>
      <p className="relative mt-1.5 text-sm text-white/70">{BRAND.motto}</p>
      <span className="relative mt-3 rounded-full border border-white/15 bg-white/[.06] px-3 py-1 text-[11px] font-semibold text-white/70">
        Version {BRAND.version}
      </span>
    </div>
    <p className="py-3 text-center text-[11px] font-medium uppercase tracking-[.16em] text-muted-foreground">
      {BRAND.poweredBy}
    </p>
  </section>
);

export default BrandAbout;
