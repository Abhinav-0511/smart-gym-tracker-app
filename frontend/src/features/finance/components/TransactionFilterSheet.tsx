import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TransactionFilters } from "@/features/finance/lib/filters";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
  type TransactionType,
} from "@/features/finance/types/common";
import type { TransactionCategory } from "@/features/finance/types/category";
import { cn } from "@/lib/utils";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

interface TransactionFilterSheetProps {
  open: boolean;
  filters: TransactionFilters;
  categories: TransactionCategory[];
  onOpenChange: (open: boolean) => void;
  onChange: (filters: TransactionFilters) => void;
  onClear: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const chipClass = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
    active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
  );

const TransactionFilterSheet = ({
  open,
  filters,
  categories,
  onOpenChange,
  onChange,
  onClear,
}: TransactionFilterSheetProps) => {
  const parseNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Refine the transactions you see.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={chipClass(filters.types.includes(type.value))}
                  onClick={() => onChange({ ...filters, types: toggle(filters.types, type.value) })}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method: PaymentMethod) => (
                <button
                  key={method}
                  type="button"
                  className={chipClass(filters.paymentMethods.includes(method))}
                  onClick={() =>
                    onChange({ ...filters, paymentMethods: toggle(filters.paymentMethods, method) })
                  }
                >
                  {PAYMENT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={chipClass(filters.categoryIds.includes(category.id))}
                  onClick={() =>
                    onChange({ ...filters, categoryIds: toggle(filters.categoryIds, category.id) })
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="filter-min">Min amount</Label>
              <NumericInput
                id="filter-min"
                value={filters.minAmount === null ? "" : String(filters.minAmount)}
                placeholder="0"
                enterKeyHint="next"
                onValueChange={(value) => onChange({ ...filters, minAmount: parseNumber(value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-max">Max amount</Label>
              <NumericInput
                id="filter-max"
                value={filters.maxAmount === null ? "" : String(filters.maxAmount)}
                placeholder="0"
                enterKeyHint="done"
                onValueChange={(value) => onChange({ ...filters, maxAmount: parseNumber(value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="filter-from">From date</Label>
              <Input
                id="filter-from"
                type="date"
                value={filters.fromDate ?? ""}
                onChange={(event) => onChange({ ...filters, fromDate: event.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-to">To date</Label>
              <Input
                id="filter-to"
                type="date"
                value={filters.toDate ?? ""}
                onChange={(event) => onChange({ ...filters, toDate: event.target.value || null })}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            Clear all
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionFilterSheet;
