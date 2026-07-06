import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  label: string;
  variant?: "dashboard" | "detail" | "analytics" | "profile";
  className?: string;
}

const PageSkeleton = ({ label, variant = "detail", className }: PageSkeletonProps) => (
  <div
    className={cn("space-y-6 animate-fade-in", className)}
    role="status"
    aria-label={label}
  >
    <div className="space-y-3">
      <Skeleton className="h-7 w-44 rounded-lg" />
      <Skeleton className="h-4 w-64 max-w-[75%] rounded-md" />
    </div>
    {variant === "profile" && (
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-5 w-36 rounded-md" />
      </div>
    )}
    <div className={cn("grid gap-3", variant === "analytics" || variant === "dashboard" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
      {(variant === "analytics" || variant === "dashboard" ? [1, 2, 3, 4] : [1, 2]).map((item) => (
        <Skeleton key={item} className="h-24 rounded-2xl" />
      ))}
    </div>
    <Skeleton className={cn("rounded-2xl", variant === "analytics" ? "h-72" : "h-40")} />
    <span className="sr-only">{label}</span>
  </div>
);

export default PageSkeleton;
