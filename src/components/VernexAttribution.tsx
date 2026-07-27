import { BRAND, BRAND_LOGOS } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface VernexAttributionProps {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  variant?: "inline" | "stacked";
}

const VernexAttribution = ({
  className,
  logoClassName,
  textClassName,
  variant = "inline",
}: VernexAttributionProps) => (
  <div
    className={cn(
      "flex items-center justify-center gap-2",
      variant === "stacked" && "flex-col gap-2",
      className,
    )}
  >
    <span
      className={cn(
        "flex h-8 w-28 items-center justify-center overflow-visible",
        logoClassName,
      )}
    >
      <img
        src={BRAND_LOGOS.vernex}
        alt={BRAND.company}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-full w-full object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]"
      />
    </span>
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground",
        textClassName,
      )}
    >
      {BRAND.poweredBy}
    </span>
  </div>
);

export default VernexAttribution;
