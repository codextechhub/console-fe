import { useState } from "react";
import { useSelector } from "react-redux";

// Background notification feeds (the header bell polls these every 60 s).
// They have their own in-page loading states, so their fetches must not flash
// the top bar. These are the *Bell endpoints from workflowApi — the page-level
// getPendingApprovals / getMySubmissions queries are foreground requests and
// SHOULD show the bar.
const SILENT_ENDPOINTS = new Set([
  "getPendingApprovalsBell",
  "getReturnedSubmissionsBell",
]);

// Minimal slice of RTK Query's internal cache state — enough to detect
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

const selectAnyPending = (state: BaseApiState): boolean => {
  const api = state.baseApi;
  if (!api) return false;
  return (
    Object.values(api.queries ?? {}).some(
      (q) => q?.status === "pending" && !SILENT_ENDPOINTS.has(q?.endpointName ?? ""),
    ) ||
    Object.values(api.mutations ?? {}).some((m) => m?.status === "pending")
  );
};

type Phase = "idle" | "running" | "finishing";

// Animation is pure CSS (keyframes below) instead of timer-driven setState, so
// there is no synchronous setState inside effects and nothing for the React
// Compiler to mis-memoise. Phase transitions happen via the sanctioned
// render-phase adjustment pattern; "finishing" → "idle" is event-driven
// (onAnimationEnd).
// The request trace is a local development aid. Keep the environment gate in
// the shared component so future placements cannot expose it in built apps.
export function TopProgressBar() {
  if (!import.meta.env.DEV) return null;
  return <DevelopmentTopProgressBar />;
}

function DevelopmentTopProgressBar() {
  const isActive = useSelector(selectAnyPending);
  const [phase, setPhase] = useState<Phase>("idle");

  // Adjust state when the derived store value changes (guarded, render-phase).
  if (isActive && phase !== "running") {
    setPhase("running");
  } else if (!isActive && phase === "running") {
    setPhase("finishing");
  }

  if (phase === "idle" && !isActive) return null;

  return (
    <div data-testid="api-progress-bar" className="absolute bottom-0 left-0 right-0 h-[3px]">
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
