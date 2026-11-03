import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = false, ...props }: GlassCardProps) => (
  <div
    className={cn(
      "glass-card p-5 transition-[border-color,box-shadow,transform] duration-200",
      hover && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default GlassCard;
