import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";

// Background notification feeds (the header bell polls these every 60 s).
// They have their own in-page loading states, so their fetches must not flash
// the top bar. These are the *Bell endpoints from workflowApi - the page-level
// getPendingApprovals / getMySubmissions queries are foreground requests and
// SHOULD show the bar.
const SILENT_ENDPOINTS = new Set([
  "getPendingApprovalsBell",
  "getReturnedSubmissionsBell",
  "getNotifications",
  "getUnreadCount",
  "acknowledgeNotificationRoute",
]);

const NAVIGATION_START_EVENT = "app:navigation-start";

/** Programmatic navigation cannot be discovered from an anchor click. */
export function startNavigationProgress(): void {
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

// Minimal slice of RTK Query's internal cache state - enough to detect
// in-flight requests without reaching for `any`.
interface CacheEntry {
  status?: string;
  endpointName?: string;
}
interface BaseApiState {
  baseApi?: {
    queries?: Record<string, CacheEntry | undefined>;
    mutations?: Record<string, CacheEntry | undefined>;
  };
}

// Mutations are deliberately NOT tracked: every mutation in the app is fired
// from a control with its own busy state (button spinner, disabled form), so
// echoing it in a global bar reads as unexplained background churn.
const selectAnyPending = (state: BaseApiState): boolean => {
  const api = state.baseApi;
  if (!api) return false;
  return Object.values(api.queries ?? {}).some(
    (q) => q?.status === "pending" && !SILENT_ENDPOINTS.has(q?.endpointName ?? ""),
  );
};

// Activity must persist this long before the bar appears. Fast responses (warm
// cache, local dev, quick API hits) come and go without ever flashing the bar;
// only genuinely slow work - the case the bar exists for - surfaces it.
const SHOW_DELAY_MS = 300;

// In production the bar is a NAVIGATION signal only. Data fetches there have
// their own in-page loading states, and real network latency would otherwise
// keep the bar crawling on every screen - reading as background trouble rather
// than feedback. Local dev keeps the API signal: latency is near zero, so it
// only ever appears when something is genuinely stuck, which is exactly when a
// developer wants to see it.
const TRACK_API_ACTIVITY = import.meta.env.DEV;

type Phase = "idle" | "running" | "finishing";

// Animation is pure CSS (keyframes below) instead of timer-driven setState, so
// there is no synchronous setState inside effects and nothing for the React
// Compiler to mis-memoise. Phase transitions happen via the sanctioned
// render-phase adjustment pattern; "finishing" → "idle" is event-driven
// (onAnimationEnd).
export function TopProgressBar() {
  const hasPendingRequest = useSelector(
    TRACK_API_ACTIVITY ? selectAnyPending : () => false,
  );
  const location = useLocation();
  const [navigationFrom, setNavigationFrom] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const navigationPending = navigationFrom === location.key;
  const isActive = hasPendingRequest || navigationPending;

  useEffect(() => {
    const start = () => setNavigationFrom(location.key);
    const startForInternalLink = (event: MouseEvent) => {
      // React Router prevents the browser's default anchor navigation itself,
      // so `defaultPrevented` is expected for <Link> and must not exclude it.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.getAttribute("aria-disabled") === "true" || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}` === `${window.location.pathname}${window.location.search}`) return;
      start();
    };
    window.addEventListener(NAVIGATION_START_EVENT, start);
    document.addEventListener("click", startForInternalLink);
    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, start);
      document.removeEventListener("click", startForInternalLink);
    };
  }, [location.key]);

  // Surface the bar only after activity has persisted past SHOW_DELAY_MS.
  // Clearing the timeout on the inactive edge is what swallows fast requests:
  // active → inactive within the window unschedules the show entirely.
  useEffect(() => {
    if (!isActive) return;
    const timer = window.setTimeout(() => setPhase("running"), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isActive]);

  // Adjust state when the derived store value changes (guarded, render-phase).
  if (!isActive && phase === "running") {
    setPhase("finishing");
  }

  // Phase alone decides visibility: while the show-delay window is open the
  // phase is still "idle" even though activity is pending - render nothing.
  if (phase === "idle") return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      data-testid="api-progress-bar"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[1.5px]"
    >
      <style>{`
        @keyframes tpb-grow { from { width: 0 } to { width: 85% } }
        @keyframes tpb-finish {
          0%   { width: 85%;  opacity: 1 }
          40%  { width: 100%; opacity: 1 }
          100% { width: 100%; opacity: 0 }
        }
      `}</style>
      <div
        key={phase}
        onAnimationEnd={() => {
          if (phase === "finishing") setPhase("idle");
        }}
        style={{
          height: "100%",
          backgroundColor: "var(--color-primary)",
          borderRadius: "0 2px 2px 0",
          animation:
            phase === "finishing"
              ? "tpb-finish 0.7s ease forwards"
              : "tpb-grow 8s cubic-bezier(0.05, 0.5, 0.1, 1) forwards",
        }}
      />
    </div>
  );
}
