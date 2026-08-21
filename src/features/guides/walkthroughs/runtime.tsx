import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Pause, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolvePermissionKey } from "@/permissions";
import { useAppSelector } from "@/redux/store";
import { routesPath } from "@/routes/routes-path";

import { GUIDE_REGISTRY } from "../registry";
import {
  consumeQueuedWalkthrough,
  followingContentStep,
  loadWalkthroughProgress,
  nextContentStep,
  queueWalkthrough,
  saveWalkthroughProgress,
  WALKTHROUGH_START_EVENT,
} from "./engine";
import { findWalkthrough } from "./registry";
import { WalkthroughRuntimeContext } from "./context";
import { canFocusWalkthroughCoach } from "./focus";
import { positionWalkthroughCoach, visibleWalkthroughTarget } from "./positioning";
import type { RectLike, SizeLike } from "./positioning";
import type { Walkthrough, WalkthroughContentStep, WalkthroughProgress } from "./types";

function targetElement(target?: string): HTMLElement | null {
  if (!target) return null;
  return [...document.querySelectorAll<HTMLElement>(`[data-guide="${CSS.escape(target)}"]`)]
    .find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null;
}

function effectiveIdentityKey(userId: number | undefined, impersonationId: number | undefined): string {
  return `${userId ?? "anonymous"}:${impersonationId == null ? "direct" : `proxy-${impersonationId}`}`;
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);
  const identityKey = effectiveIdentityKey(auth.user?.id, auth.impersonation?.id);
  const [walkthrough, setWalkthrough] = useState<Walkthrough | null>(null);
  const [step, setStep] = useState<WalkthroughContentStep | null>(null);
  const [missingTarget, setMissingTarget] = useState(false);

  const hasTarget = useCallback((target: string) => Boolean(targetElement(target)), []);

  const persist = useCallback((active: Walkthrough, current: WalkthroughContentStep, completedStepIds: string[], completedAt?: string) => {
    const progress: WalkthroughProgress = {
      walkthroughId: active.id,
      guideId: active.guideId,
      version: active.version,
      currentStepId: current.id,
      completedStepIds,
      ...(completedAt ? { completedAt } : {}),
    };
    try {
      saveWalkthroughProgress(localStorage, identityKey, progress);
    } catch {
      // The walkthrough remains usable for this visit when storage is blocked.
    }
  }, [identityKey]);

  const activate = useCallback((id: string) => {
    const selected = findWalkthrough(id);
    if (!selected) return;
    const allowed = selected.permissions
      .map(resolvePermissionKey)
      .every((permission) => (auth.permissions ?? []).includes(permission));
    if (!allowed) return;
    if (location.pathname !== selected.route) {
      queueWalkthrough(id);
      navigate(selected.route);
      return;
    }
    const saved = loadWalkthroughProgress(localStorage, identityKey, selected);
    const savedStep = saved && !saved.completedAt
      ? nextContentStep(selected, saved.currentStepId, hasTarget)
      : undefined;
    const first = savedStep ?? nextContentStep(selected, selected.steps[0]?.id ?? "", hasTarget);
    if (!first) return;
    setWalkthrough(selected);
    setStep(first);
    setMissingTarget(false);
    persist(selected, first, saved?.completedStepIds ?? []);
  }, [auth.permissions, hasTarget, identityKey, location.pathname, navigate, persist]);

  useEffect(() => {
    const queued = consumeQueuedWalkthrough();
    if (!queued) return;
    const timeout = window.setTimeout(() => activate(queued), 0);
    return () => window.clearTimeout(timeout);
  }, [activate, location.pathname]);

  useEffect(() => {
    const listener = (event: Event) => activate((event as CustomEvent<{ id?: string }>).detail?.id ?? "");
    window.addEventListener(WALKTHROUGH_START_EVENT, listener);
    return () => window.removeEventListener(WALKTHROUGH_START_EVENT, listener);
  }, [activate]);

  useEffect(() => {
    if (!walkthrough || !step?.target) return;
    let ready = false;
    const check = () => {
      if (ready) setMissingTarget(!targetElement(step.target));
    };
    const timeout = window.setTimeout(() => {
      ready = true;
      check();
    }, 700);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [location.search, step, walkthrough]);

  useEffect(() => {
    if (!walkthrough || !step?.search) return;
    const search = step.search.startsWith("?") ? step.search : `?${step.search}`;
    if (location.pathname === walkthrough.route && location.search === search) return;
    navigate({ pathname: walkthrough.route, search }, { replace: true });
  }, [location.pathname, location.search, navigate, step?.search, walkthrough]);

  const move = useCallback((direction: 1 | -1) => {
    if (!walkthrough || !step) return;
    const completed = loadWalkthroughProgress(localStorage, identityKey, walkthrough)?.completedStepIds ?? [];
    if (direction < 0) {
      const previousId = completed.at(-1);
      const previous = walkthrough.steps.find(
        (item): item is WalkthroughContentStep => item.kind !== "branch" && item.id === previousId,
      );
      if (previous) {
        setStep(previous);
        persist(walkthrough, previous, completed.slice(0, -1));
      }
      return;
    }
    const next = followingContentStep(walkthrough, step.id, hasTarget);
    const nextCompleted = [...new Set([...completed, step.id])];
    if (!next) {
      persist(walkthrough, step, nextCompleted, new Date().toISOString());
      setWalkthrough(null);
      setStep(null);
      return;
    }
    setStep(next);
    setMissingTarget(false);
    persist(walkthrough, next, nextCompleted);
  }, [hasTarget, identityKey, persist, step, walkthrough]);

  useEffect(() => {
    if (!walkthrough || !step || step.advance !== "target-click" || !step.target) return;
    const target = targetElement(step.target);
    if (!target) return;
    const advance = () => window.setTimeout(() => move(1), 0);
    target.addEventListener("click", advance, { once: true });
    return () => target.removeEventListener("click", advance);
  }, [move, step, walkthrough]);

  useEffect(() => {
    if (!walkthrough || !step || step.advance !== "route-change") return;
    if (step.route && location.pathname !== step.route) return;
    const timeout = window.setTimeout(() => move(1), 0);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, move, step, walkthrough]);

  const runtime = useMemo(() => ({ start: activate, active: walkthrough != null }), [activate, walkthrough]);

  return (
    <WalkthroughRuntimeContext value={runtime}>
      {children}
      {walkthrough && step && createPortal(
        <WalkthroughCoach
          walkthrough={walkthrough}
          step={step}
          missingTarget={missingTarget}
          onBack={() => move(-1)}
          onNext={() => move(1)}
          onPause={() => { setWalkthrough(null); setStep(null); }}
        />,
        document.body,
      )}
    </WalkthroughRuntimeContext>
  );
}

function WalkthroughCoach({
  walkthrough,
  step,
  missingTarget,
  onBack,
  onNext,
  onPause,
}: {
  walkthrough: Walkthrough;
  step: WalkthroughContentStep;
  missingTarget: boolean;
  onBack: () => void;
  onNext: () => void;
  onPause: () => void;
}) {
  const [rect, setRect] = useState<RectLike | null>(null);
  const [cardSize, setCardSize] = useState<SizeLike>({ width: 340, height: 280 });
  const cardRef = useRef<HTMLElement>(null);
  const guide = GUIDE_REGISTRY.find((item) => item.id === walkthrough.guideId);
  const contentSteps = walkthrough.steps.filter((item): item is WalkthroughContentStep => item.kind !== "branch");
  const stepIndex = contentSteps.findIndex((item) => item.id === step.id);
  const finalStep = stepIndex === contentSteps.length - 1;

  useEffect(() => {
    let frame = 0;
    let scrollTimer = 0;
    let target: HTMLElement | null = null;
    let targetObserver: ResizeObserver | null = null;
    let scrolled = false;

    const measure = () => {
      frame = 0;
      const nextTarget = targetElement(step.target);
      if (nextTarget !== target) {
        targetObserver?.disconnect();
        target = nextTarget;
        if (target) {
          targetObserver = new ResizeObserver(scheduleMeasure);
          targetObserver.observe(target);
        }
      }
      if (target && !scrolled) {
        scrolled = true;
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        scrollTimer = window.setTimeout(scheduleMeasure, 450);
      }
      const nextRect = target?.getBoundingClientRect();
      setRect(nextRect ? {
        left: nextRect.left,
        top: nextRect.top,
        right: nextRect.right,
        bottom: nextRect.bottom,
        width: nextRect.width,
        height: nextRect.height,
      } : null);
    };

    function scheduleMeasure() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    }

    scheduleMeasure();
    const observer = new MutationObserver(scheduleMeasure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(scrollTimer);
      observer.disconnect();
      targetObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };
  }, [step.id, step.target]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () => {
      const next = card.getBoundingClientRect();
      setCardSize((current) => (
        current.width === next.width && current.height === next.height
          ? current
          : { width: next.width, height: next.height }
      ));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [missingTarget, step.id]);

  useEffect(() => {
    const card = cardRef.current;
    if (card && canFocusWalkthroughCoach(card)) card.focus();
  }, [step.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onPause();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack, onNext, onPause]);

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const focusRect = rect ? visibleWalkthroughTarget({
    target: rect,
    viewport,
    maxHeight: viewport.width < 640 ? 120 : 180,
  }) : null;
  const coachPosition = focusRect ? positionWalkthroughCoach({
    target: focusRect,
    card: cardSize,
    viewport,
    preferred: step.placement,
    allowedSides: viewport.width < 640 ? ["top", "bottom"] : ["top", "right", "bottom", "left"],
  }) : {
    left: Math.max(16, (viewport.width - cardSize.width) / 2),
    top: Math.max(80, (viewport.height - cardSize.height) / 2),
    side: "bottom" as const,
  };

  const card = (
    <section
      ref={cardRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby="walkthrough-title"
      aria-describedby="walkthrough-description"
      className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.22)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Interactive walkthrough</p><p className="mt-1 text-xs text-gray-400">Step {stepIndex + 1} of {contentSteps.length}</p></div>
        <button type="button" aria-label="Pause walkthrough" onClick={onPause} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="size-4" /></button>
      </div>
      <h2 id="walkthrough-title" className="mt-4 font-mont text-lg font-semibold">{missingTarget ? "This step is unavailable" : step.title}</h2>
      <p id="walkthrough-description" className="mt-2 text-sm leading-6 text-gray-01">
        {missingTarget ? "The highlighted control is not available in your current layout or permission state. Return to the guide or continue safely." : step.body}
      </p>
      {missingTarget && guide?.status === "published" && (
        <Button asChild variant="outline" size="sm" className="mt-4 w-full"><a href={routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL(guide.slug)}><BookOpenText className="size-4" /> Return to the guide</a></Button>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onPause}><Pause className="size-4" /> Pause</Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onBack} disabled={stepIndex === 0}><ArrowLeft className="size-4" /><span className="sr-only sm:not-sr-only">Back</span></Button>
          <Button type="button" size="sm" onClick={onNext}>{finalStep ? <Check className="size-4" /> : null}{finalStep ? "Finish" : missingTarget ? "Skip step" : "Next"}{!finalStep && <ArrowRight className="size-4" />}</Button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" data-walkthrough-active={walkthrough.id}>
      {focusRect && !missingTarget && (
        <div
          aria-hidden="true"
          data-walkthrough-spotlight
          className={cn("absolute rounded-xl border-2 border-white ring-4 ring-primary/70 transition-all")}
          style={{
            left: focusRect.left - 6,
            top: focusRect.top - 6,
            width: focusRect.width + 12,
            height: focusRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, .45)",
          }}
        />
      )}
      {(!focusRect || missingTarget) && <div className="absolute inset-0 bg-slate-950/45" aria-hidden="true" />}
      <div
        className="pointer-events-auto absolute w-[calc(100%-2rem)] sm:w-[340px]"
        data-walkthrough-coach-side={coachPosition.side}
        style={{ left: coachPosition.left, top: coachPosition.top }}
      >
        {card}
      </div>
    </div>
  );
}
