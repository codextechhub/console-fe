import { useId } from "react";
import { cn } from "@/lib/utils";
import { INK, PEN, WORDMARK_RATIO, WORDMARK_VIEWBOX } from "./app-logo-wordmark";

/** Height of the mark in px. The flip box is sized from this, so callers set one number. */
const DEFAULT_SIZE = 40;

/**
 * The wordmark is set a little shorter than the front mark so the two faces carry
 * similar visual weight - matching their heights makes the calligraphy tower.
 */
const WORDMARK_SCALE = 0.78;

type AppLogoProps = {
  /** Height of the front mark in px. Default 40. */
  size?: number;
  /**
   * Turn the hover animation off where there is no room for the wordmark - the
   * collapsed icon sidebar being the case that matters. The mark still renders.
   */
  animate?: boolean;
  /** White on a blue surface, blue everywhere else. */
  surface?: "blue" | "other";
  /** Colour of the calligraphy; it paints with `currentColor`. */
  className?: string;
};

/**
 * The CodeX mark, which turns over on hover to write "CodeX" in calligraphy and
 * turns back when the pointer leaves.
 *
 * Everything here is CSS (see `.app-logo` in index.css): the flip is a transition
 * on `transform`, and the write-on is a transition on each pen stroke's dash
 * offset. Transitions rather than keyframes on purpose - they reverse from
 * wherever they had got to, so flicking the pointer across the logo never leaves
 * it stranded mid-spin, and the letters un-write in the reverse order they were
 * written. No JS, no timers, no state.
 *
 * This renders the visual only. Callers own the link, so the click keeps doing
 * whatever it did before; hover lives on the box, so it works either way.
 */
export function AppLogo({
  size = DEFAULT_SIZE,
  animate = true,
  surface = "other",
  className,
}: AppLogoProps) {
  // Masks are referenced by id, and the logo renders more than once per page.
  const maskId = useId();
  const logoSrc = surface === "blue"
    ? "/image/codex-mark-white.png"
    : "/image/codex-mark-blue.png";

  if (!animate) {
    return (
      <img
        src={logoSrc}
        alt="CodeX"
        className="object-contain"
        style={{ height: size, width: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        "app-logo",
        surface === "blue" ? "text-white" : "text-primary",
        className,
      )}
      // The box is as wide as the wider face so the header cannot shift as it turns.
      style={{ height: size, width: size * WORDMARK_RATIO * WORDMARK_SCALE }}
    >
      <span className="app-logo__card">
        <span className="app-logo__face">
          <img src={logoSrc} alt="CodeX" className="h-full w-auto" />
        </span>

        <span className="app-logo__face app-logo__face--back">
          <svg
            viewBox={WORDMARK_VIEWBOX}
            className="w-full"
            style={{ height: size * WORDMARK_SCALE }}
            aria-hidden="true"
            focusable="false"
          >
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-20" y="-20" width="290" height="140">
              {PEN.map((stroke, i) => (
                <path
                  key={i}
                  className="app-logo__pen"
                  d={stroke.d}
                  pathLength={1}
                  style={
                    // Each stroke's slice of the write-on (as fractions of the
                    // shared duration) and its hidden dash offset. Read by the
                    // transition timings in the CSS.
                    { "--s": stroke.s, "--l": stroke.l, "--o": stroke.o } as React.CSSProperties
                  }
                />
              ))}
            </mask>
            <path d={INK} fill="currentColor" mask={`url(#${maskId})`} />
          </svg>
        </span>
      </span>
    </span>
  );
}
