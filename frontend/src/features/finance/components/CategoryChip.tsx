import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import { getFinanceIcon } from "@/features/finance/lib/finance-icons";
import type { TransactionCategory } from "@/features/finance/types/category";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  category: TransactionCategory | undefined;
  size?: number;
  className?: string;
}

/** A rounded, colour-tinted icon chip for a category (or "Uncategorized"). */
const CategoryChip = ({ category, size = 40, className }: CategoryChipProps) => {
  const color = category?.color ?? "slate";
  const classes = getFinanceColorClasses(color);
  const Icon = getFinanceIcon(category?.icon ?? "circle");
  const iconSize = Math.round(size * 0.45);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        classes.chip,
        classes.icon,
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={iconSize} />
    </div>
  );
};

export default CategoryChip;
