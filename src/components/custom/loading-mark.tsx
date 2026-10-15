import { useId } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** The CodeX mark's two strokes, in the mark's own 51 x 48 drawing box. */
const MARK_PATHS = [
  "M20.368 20.5314C25.7632 12.0541 29.1709 7.70124 36.3578 0.544128C32.4565 -1.12654 29.7496 0.898732 24.1751 8.72939L17.3223 19.5796L9.89846 17.2954C6.11892 16.4344 4.0123 15.8523 0 16.7243C6.21429 18.4466 9.62751 19.5826 15.4188 22.435C10.835 28.5808 7.85292 31.5236 1.52284 35.3791C5.13918 36.4529 7.14935 36.2055 10.6599 33.4755C13.9845 30.4881 15.8247 28.1166 18.8451 24.1481C25.1112 27.7591 28.6544 30.0794 34.835 32.7141C38.8249 33.5127 40.5009 33.3961 42.4492 31.3816C33.9825 27.7647 29.0964 25.3184 20.368 20.5314Z",
  "M32.9314 14.8209C28.6111 16.9011 26.2043 18.1782 21.8908 20.9123L24.5558 22.435C31.0714 18.153 34.7949 16.0974 41.4974 12.727C38.4039 12.7851 36.5256 13.2229 32.9314 14.8209Z",
] as const;

const TONE_COLOR = { blue: "#4A659D", white: "#FFFFFF" } as const;

export type LoadingMarkProps = {
  /** White on a blue surface, blue everywhere else. */
  tone?: keyof typeof TONE_COLOR;
  /** Size it with a `size-*` or `h-*` class; unsized it renders at 64 x 60. */
  className?: string;
  /**
   * What a screen reader hears. Pass `null` where the mark sits beside text
   * that already says what is happening, such as a Refresh button's label.
   */
  label?: string | null;
  /**
   * The mark sits inside a button. The resting logo is drawn at 60% rather
   * than 30%, because a busy button is also disabled and fades to half
   * strength, which would leave a 30% logo barely visible.
   */
  inButton?: boolean;
};

/**
 * The CodeX loading mark: the logo drawn faint, with a band of light sweeping
 * across it. Used for every wait that has nothing better to show, from the
 * boot screen to a section loading, and in place of the arrow on a Refresh
 * button while it fetches.
 *
 * The drawing matches `public/image/codex-loading-{blue,white}.svg`, which
 * serve the one place React cannot reach, the boot screen in `index.html`.
 * This copy is inline rather than an `<img>` so it sits
 * in a button as an `svg` child and takes the button's icon sizing and
 * padding. Clip and gradient ids come from `useId`, because a page can show
 * several marks at once. The motion lives in `.loading-mark` in index.css,
 * which also stills it, at full strength, for readers who ask for reduced
 * motion.
 */
export function LoadingMark({ tone = "blue", className, label = "Loading", inButton = false }: LoadingMarkProps) {
  const id = useId();
  const clipId = `${id}-clip`;
  const gradientId = `${id}-sweep`;
  const color = TONE_COLOR[tone];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-4 -6 51 48"
      width="64"
      height="60"
      className={cn("loading-mark shrink-0", inButton && "loading-mark--in-button", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={clipId}>
          {MARK_PATHS.map((d) => <path key={d} d={d} />)}
        </clipPath>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset=".5" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="loading-mark__base" opacity=".3" fill={color}>
        {MARK_PATHS.map((d) => <path key={d} d={d} />)}
      </g>
      <g clipPath={`url(#${clipId})`}>
        <g transform="rotate(20 21 18)">
          <rect className="loading-mark__sweep" x="-10" y="-30" width="26" height="100" fill={`url(#${gradientId})`} />
        </g>
      </g>
    </svg>
  );
}

/**
 * The icon on a Refresh button: the refresh arrow at rest, the loading mark
 * while the refetch runs. Both are `svg` elements, so the button keeps its
 * width and padding as one replaces the other.
 */
export function RefreshIcon({ spinning = false, className }: { spinning?: boolean; className?: string }) {
  return spinning
    ? <LoadingMark label={null} inButton className={className} />
    : <RefreshCw className={className} />;
}
