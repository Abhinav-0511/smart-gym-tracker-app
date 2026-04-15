import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = false, ...props }: GlassCardProps) => (
  <div
    className={cn(
      "glass-card p-4 transition-all duration-300",
      hover && "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default GlassCard;
