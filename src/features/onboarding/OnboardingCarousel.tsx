import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { ONBOARDING_SLIDES } from "./slides";

interface OnboardingCarouselProps {
  /** Called when the user finishes or skips — persists completion. */
  onComplete: () => void;
}

/**
 * Full-screen first-run tour. Steps through {@link ONBOARDING_SLIDES}; the user
 * can skip at any time. Rendered above everything and traps focus, Esc skips.
 * Styling matches the branded auth splash (brand-navy). No feature is promised
 * that the app doesn't ship.
 */
const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [index, setIndex] = useState(0);
  const slide = ONBOARDING_SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onComplete();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onComplete]);

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex((current) => Math.min(current + 1, ONBOARDING_SLIDES.length - 1));
    }
  };

  const back = () => setIndex((current) => Math.max(current - 1, 0));

  return (
    <div
      className="bg-brand-navy fixed inset-0 z-[120] flex flex-col overflow-hidden px-6 py-8 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to LifeTrack"
    >
      <div className="pointer-events-none absolute left-1/2 top-[36%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-10 items-center rounded-xl bg-white px-3 shadow-sm">
          <BrandLogo kind="full" className="h-5 w-auto max-w-[130px]" />
        </span>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Skip
        </button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <div className="animate-fade-in flex flex-col items-center" key={slide.id}>
          <span className="mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/10 ring-1 ring-white/20">
            <Icon size={44} className="text-primary" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {slide.title}
          </h1>
          {slide.modules ? (
            <div className="mt-6 w-full max-w-xs space-y-2.5">
              {slide.modules.map((module) => (
                <div
                  key={module.name}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/15"
                >
                  <p className="text-base font-bold text-white">{module.name}</p>
                  <p className="text-sm text-white/70">{module.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-1 text-lg leading-7 text-white/75 sm:text-xl">
              {slide.lines?.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="flex items-center gap-2" aria-hidden>
          {ONBOARDING_SLIDES.map((item, dotIndex) => (
            <span
              key={item.id}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index ? "w-6 bg-primary" : "w-2 bg-white/25"
              }`}
            />
          ))}
        </div>

        <div className="flex w-full max-w-sm items-center gap-3">
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={back}
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            onClick={next}
            className="flex-1 text-base font-semibold"
          >
            {isLast ? "Get Started" : "Next"}
            {!isLast && <ArrowRight size={18} />}
          </Button>
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[.16em] text-white/40">
          {BRAND.poweredBy}
        </p>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
