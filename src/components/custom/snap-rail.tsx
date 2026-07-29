import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A horizontal, swipeable rail of equal-width slides with position dots.
 *
 * Built on CSS scroll-snap rather than a carousel library: native touch
 * momentum and native keyboard scrolling come for free, there is no dependency
 * to ship, and — the part that matters here — advancing a slide is a scroll,
 * not a re-render. The only React state is the active dot index, and it lives
 * inside this component so a rail on a dashboard never re-renders the screen
 * around it.
 *
 * Auto-advance is opt-in via `autoAdvanceMs` and is deliberately timid:
 *   * it stops **permanently** the moment the reader touches the rail — the
 *     point of the timer is to animate a rail nobody has engaged with, and once
 *     someone has chosen a slide, moving it out from under them is hostile;
 *   * it only runs while the rail is actually on screen (IntersectionObserver)
 *     and the tab is visible, so a rail below the fold isn't cycling unseen;
 *   * it does not run at all under `prefers-reduced-motion`.
 */
export function SnapRail({
  children,
  ariaLabel,
  autoAdvanceMs,
  className,
  slideClassName,
  dotClassName,
  activeDotClassName,
}: {
  children: React.ReactNode[];
  ariaLabel: string;
  /** Omit for a purely manual rail. */
  autoAdvanceMs?: number;
  className?: string;
  slideClassName?: string;
  /** Dots sit on light surfaces by default; override for dark backgrounds. */
  dotClassName?: string;
  activeDotClassName?: string;
}) {
  const slides = children.filter(Boolean);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Once true, the timer never restarts for the life of the component.
  const engagedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  // Derive the active slide from scroll position rather than tracking it as
  // truth: the reader can flick, drag the scrollbar or tab across, and reading
  // the DOM is the only source that survives all three. Guarded so it only
  // sets state when the index actually changes.
  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    setActive((prev) => (prev === index ? prev : Math.min(index, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    // rAF-coalesced: a flick fires scroll dozens of times per second and we
    // only need the settled index.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncActive();
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [syncActive]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !autoAdvanceMs) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, [autoAdvanceMs]);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }, []);

  // Marks the rail as engaged. Pointer/wheel/key are the reader's own input;
  // programmatic `scrollTo` above deliberately does NOT go through here.
  const engage = useCallback(() => {
    engagedRef.current = true;
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!autoAdvanceMs || !visible || engagedRef.current || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const track = trackRef.current;
      if (!track) return;
      const next = (Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)) + 1) % slides.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [autoAdvanceMs, visible, slides.length]);

  if (!slides.length) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={engage}
        onWheel={engage}
        onKeyDown={engage}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain",
          // The rail is the affordance; a scrollbar under it just adds noise.
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "focus-visible:outline-none",
        )}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className={cn("w-full shrink-0 snap-center", slideClassName)}
          >
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => {
                engage();
                goTo(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active
                  ? cn("w-4", activeDotClassName ?? "bg-primary")
                  : cn("w-1.5", dotClassName ?? "bg-gray-300 hover:bg-gray-400"),
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
