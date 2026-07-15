import { lazy, Suspense, useState } from "react";
import { HelpCircle } from "lucide-react";

const HelpCenter = lazy(() => import("./HelpCenter"));

interface HelpButtonProps {
  /** The page whose contextual help should open, e.g. "finance.budgets". */
  pageKey: string;
  className?: string;
}

/**
 * The header Help control. Replaces the old theme toggle across every shell
 * (theme still lives in Settings). Styling mirrors the previous toggle button so
 * the header layout is unchanged. The Help Center itself is lazy-loaded — it only
 * mounts once opened, keeping it off the initial render path.
 */
const HelpButton = ({ pageKey, className }: HelpButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open help"
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        }
      >
        <HelpCircle size={18} />
      </button>
      {open && (
        <Suspense fallback={null}>
          <HelpCenter pageKey={pageKey} open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
};

export default HelpButton;
