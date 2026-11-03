import { useState } from "react";
import { ImageOff } from "lucide-react";

import type { HelpAbout } from "@/features/help/types";

interface AboutThisPageProps {
  about: HelpAbout;
}

/**
 * Illustrated page guide: a screenshot with numbered markers plus a matching
 * numbered description list. The screenshot is optional — until the PNG is added
 * to `/public/help`, a neutral placeholder is shown and the numbered guide still
 * works, so the feature is useful before and after images are supplied.
 */
const AboutThisPage = ({ about }: AboutThisPageProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const src = `/help/${about.screenshot}`;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{about.intro}</p>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/40">
        {imageFailed ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff size={22} />
            <p className="text-xs font-medium">Guide image coming soon</p>
          </div>
        ) : (
          <img
            src={src}
            alt={`Annotated screenshot of the ${about.markers.length}-part page layout`}
            className="block w-full"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <ol className="space-y-3">
        {about.markers.map((marker) => (
          <li key={marker.n} className="flex gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {marker.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{marker.label}</p>
              <p className="text-sm text-muted-foreground">{marker.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default AboutThisPage;
