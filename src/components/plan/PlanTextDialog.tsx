import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlanTextDialogProps {
  open: boolean;
  title: string;
  description: string;
  label: string;
  value: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: string) => Promise<void>;
}

const PlanTextDialog = ({
  open,
  title,
  description,
  label,
  value,
  saving,
  onOpenChange,
  onSave,
}: PlanTextDialogProps) => {
  const [nextValue, setNextValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNextValue(value);
      setError(null);
    }
  }, [open, value]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedValue = nextValue.trim();

    if (!normalizedValue) {
      setError(`${label} is required.`);
      return;
    }

    try {
      await onSave(normalizedValue);
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn’t save changes.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-text-value">{label}</Label>
            <Input
              id="plan-text-value"
              value={nextValue}
              onChange={(event) => setNextValue(event.target.value)}
              maxLength={100}
              disabled={saving}
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlanTextDialog;
