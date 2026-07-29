// Wizard step bar: dashed connectors, uppercase micro-labels, one dot per step.
//
// Steps are clickable when `onStepClick` is given, because blocking validation
// belongs on the review step rather than on the gates between steps — someone
// who wants to jump back to step 2 and change a column should not have to click
// "Back" three times. A step carrying validation errors shows a count instead of
// its dot, so the step bar itself says where the problem is.
//
// Rendered as a tablist so arrow keys move between steps, per WCAG's authoring
// pattern for tabs.

import { cn } from "@/lib/utils";

interface StepProgressBarProps {
  totalSteps?: number;
  currentStep?: number;
  /** Micro-labels under each dot. Falls back to "Step N". */
  labels?: string[];
  /** Makes the steps interactive. Omit for a read-only progress indicator. */
  onStepClick?: (step: number) => void;
  /** 1-indexed step number → number of blocking problems on that step. */
  errorsByStep?: Record<number, number>;
}

const StepProgressBar = ({
  totalSteps = 5,
  currentStep = 1,
  labels,
  onStepClick,
  errorsByStep,
}: StepProgressBarProps) => {
  const clamped = Math.max(1, Math.min(currentStep, totalSteps));

  // Arrow keys move along the strip; Home/End jump to the ends.
  const onKeyDown = (e: React.KeyboardEvent, stepNum: number) => {
    if (!onStepClick) return;
    const next =
      e.key === "ArrowRight" ? stepNum + 1
      : e.key === "ArrowLeft" ? stepNum - 1
      : e.key === "Home" ? 1
      : e.key === "End" ? totalSteps
      : null;
    if (next === null) return;
    e.preventDefault();
    if (next >= 1 && next <= totalSteps) onStepClick(next);
  };

  return (
    <div className="w-full font-mont" role="tablist" aria-label="Export builder steps">
      {/* Track */}
      <div className="flex w-full items-center">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < clamped;
          const isActive = stepNum === clamped;
          const errors = errorsByStep?.[stepNum] ?? 0;

          const dot = (
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                errors > 0 && "border-2 border-destructive bg-destructive",
                errors === 0 && isCompleted && "border-2 border-primary bg-primary",
                errors === 0 && isActive && "border-2 border-dashed border-gray-01 bg-white",
                errors === 0 && !isCompleted && !isActive && "border-2 border-dashed border-gray-300 bg-white",
              )}
            >
              {errors > 0 ? (
                <span className="font-geist-mono text-[9px] font-semibold tabular-nums text-white">
                  {errors}
                </span>
              ) : isCompleted ? (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : isActive ? (
                <div className="size-2 rounded-full bg-gray-01" />
              ) : null}
            </div>
          );

          return (
            <div key={i} className="flex flex-1 items-center">
              {onStepClick ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onStepClick(stepNum)}
                  onKeyDown={(e) => onKeyDown(e, stepNum)}
                  aria-label={`${labels?.[i] ?? `Step ${stepNum}`}${
                    errors > 0 ? `, ${errors} problem${errors === 1 ? "" : "s"}` : ""
                  }`}
                  className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {dot}
                </button>
              ) : (
                dot
              )}

              {/* Connector */}
              {i < totalSteps - 1 && (
                <div className="mx-1 flex-1">
                  <svg width="100%" height="2" style={{ display: "block", overflow: "visible" }} aria-hidden>
                    <line
                      x1="0"
                      y1="1"
                      x2="100%"
                      y2="1"
                      stroke={isCompleted ? "#4A659D" : "#D1D5DB"}
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="mt-1.5 flex">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < clamped;
          const isActive = stepNum === clamped;
          const errors = errorsByStep?.[stepNum] ?? 0;
          return (
            <div key={i} className="min-w-0 flex-1 pr-2">
              <span
                className={cn(
                  "block truncate text-[10px] uppercase tracking-widest",
                  errors > 0 && "font-semibold text-error-text",
                  errors === 0 && isActive && "font-bold text-gray-01",
                  errors === 0 && isCompleted && "font-semibold text-primary",
                  errors === 0 && !isActive && !isCompleted && "text-gray-300",
                )}
              >
                {labels?.[i] ?? `Step ${stepNum}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressBar;
