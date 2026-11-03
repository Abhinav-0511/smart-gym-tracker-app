import { Lightbulb } from "lucide-react";

interface TipsListProps {
  tips: string[];
}

/** Renders a page's verified tips. Purely presentational. */
const TipsList = ({ tips }: TipsListProps) => {
  if (tips.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tips for this page yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tips.map((tip) => (
        <li
          key={tip}
          className="flex gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-3.5"
        >
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">{tip}</p>
        </li>
      ))}
    </ul>
  );
};

export default TipsList;
