import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Submit button for the auth screens with in-place progress.
 *
 * The plain `loading`/`loadingText` Button swaps its label for text plus three
 * fading dots, which reads as frozen on the one screen where the user is doing
 * nothing but waiting. Here the button holds its footprint and *moves*: the
 * label leaves upward, a spinner rises into its place, a bar sweeps the bottom
 * edge for as long as the request is alive, and a status strip rises into flow
 * underneath. Nothing changes size, so a failure can drop straight back to the
 * form without the layout lurching.
 *
 * Progress copy is deliberately not staged on a timer - there is a single
 * request in flight and inventing "verifying…" steps would be fiction. The one
 * escalation is `slowStatus`, shown only once the request outlives
 * SLOW_AFTER_MS, which is real information: it is taking longer than normal.
 */

// Long enough that a healthy login never sees it (p99 well under this), short
// enough that a stalled one explains itself before the user starts guessing.
const SLOW_AFTER_MS = 2500;

export function AuthSubmitButton({
  label,
  busy,
  disabled,
  status,
  slowStatus,
  className,
}: {
  label: string;
  /** Request in flight - drives the whole progress treatment. */
  busy: boolean;
  /** Form-level gating (invalid, untouched); `busy` disables on its own. */
  disabled?: boolean;
  /** Copy for the strip that rises under the button while in flight. */
  status: string;
  /** Replaces `status` once the request outlives SLOW_AFTER_MS. */
  slowStatus?: string;
  className?: string;
}) {
  return (
    <div>
      <Button
        type="submit"
        disabled={disabled || busy}
        aria-busy={busy}
        className={cn(
          "relative h-11 w-full overflow-hidden",
          // Disabled-while-busy must not look inert: the standard 50% wash is
          // what makes the current state feel dead. Not clickable, still alive.
          busy && "disabled:opacity-100",
          className
        )}
      >
        {/* Both layers are absolute inside a fixed-height box, so the label and
            the spinner cross without the button resizing by a pixel. */}
        <span className="relative block h-5 w-full">
          <span
            aria-hidden={busy}
            className={cn(
              "auth-swap absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out",
              busy ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            {label}
          </span>
          <span
            aria-hidden={!busy}
            className={cn(
              "auth-swap absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out",
              busy ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            )}
          >
            <Loader2 className="size-5 animate-spin" />
          </span>
        </span>

        {busy && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
            <span className="auth-sweep block h-full w-2/5 rounded-full bg-white/70" />
          </span>
        )}
      </Button>

      {/* Mounted only while in flight: leaving flight throws the strip away
          along with its slow-request timer, so the next attempt starts clean. */}
      {busy && <ConnectingStrip status={status} slowStatus={slowStatus} />}
    </div>
  );
}

function ConnectingStrip({
  status,
  slowStatus,
}: {
  status: string;
  slowStatus?: string;
}) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!slowStatus) return;
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [slowStatus]);

  const text = slow && slowStatus ? slowStatus : status;

  return (
    <div className="auth-strip-in" role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-03 px-3 py-2">
        <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        {/* Keyed so the escalation replays the rise instead of swapping in place. */}
        <span key={text} className="auth-line-in font-mont text-xs font-medium text-gray-01">
          {text}
        </span>
      </div>
    </div>
  );
}
