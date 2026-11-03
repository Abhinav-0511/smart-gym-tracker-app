import { cn } from "@/lib/utils";

interface CompletionRingProps {
  /** Completion percentage, 0–100. */
  value: number;
  label?: string;
  size?: number;
  className?: string;
}

/** Lightweight SVG progress ring used for completion percentages. */
const CompletionRing = ({ value, label, size = 72, className }: CompletionRingProps) => {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-extrabold text-foreground">{clamped}%</span>
        {label && <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
};

export default CompletionRing;
