import type {
  Walkthrough,
  WalkthroughBranchStep,
  WalkthroughContentStep,
  WalkthroughProgress,
  WalkthroughStep,
} from "./types";

const STORAGE_PREFIX = "console-guide-walkthrough";
const PENDING_KEY = `${STORAGE_PREFIX}:pending`;
export const WALKTHROUGH_START_EVENT = "console:walkthrough-start";

export function walkthroughStorageKey(identityKey: string, walkthroughId: string): string {
  return `${STORAGE_PREFIX}:${identityKey}:${walkthroughId}`;
}

export function loadWalkthroughProgress(
  storage: Pick<Storage, "getItem">,
  identityKey: string,
  walkthrough: Walkthrough,
): WalkthroughProgress | null {
  try {
    const raw = storage.getItem(walkthroughStorageKey(identityKey, walkthrough.id));
    if (!raw) return null;
    const progress = JSON.parse(raw) as WalkthroughProgress;
    if (
      progress.walkthroughId !== walkthrough.id
      || progress.guideId !== walkthrough.guideId
      || progress.version !== walkthrough.version
      || !walkthrough.steps.some((step) => step.id === progress.currentStepId)
    ) return null;
    return progress;
  } catch {
    return null;
  }
}

export function saveWalkthroughProgress(
  storage: Pick<Storage, "setItem">,
  identityKey: string,
  progress: WalkthroughProgress,
): void {
  storage.setItem(walkthroughStorageKey(identityKey, progress.walkthroughId), JSON.stringify(progress));
}

export function queueWalkthrough(id: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, id);
  } catch {
    // Navigation still works when browser storage is unavailable.
  }
}

export function requestWalkthroughStart(id: string): void {
  window.dispatchEvent(new CustomEvent(WALKTHROUGH_START_EVENT, { detail: { id } }));
}

export function consumeQueuedWalkthrough(): string | null {
  try {
    const id = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return id;
  } catch {
    return null;
  }
}

export function walkthroughStepById(
  walkthrough: Walkthrough,
  stepId: string,
): WalkthroughStep | undefined {
  return walkthrough.steps.find((step) => step.id === stepId);
}

export function resolveBranchStep(
  walkthrough: Walkthrough,
  step: WalkthroughBranchStep,
  targetPresent: boolean,
): WalkthroughStep | undefined {
  return walkthroughStepById(walkthrough, targetPresent ? step.whenPresent : step.whenMissing);
}

export function nextContentStep(
  walkthrough: Walkthrough,
  currentStepId: string,
  targetPresent: (target: string) => boolean,
): WalkthroughContentStep | undefined {
  let index = walkthrough.steps.findIndex((step) => step.id === currentStepId);
  if (index < 0) index = 0;
  let candidate: WalkthroughStep | undefined = walkthrough.steps[index];
  const visited = new Set<string>();

  while (candidate?.kind === "branch") {
    if (visited.has(candidate.id)) return undefined;
    visited.add(candidate.id);
    candidate = resolveBranchStep(walkthrough, candidate, targetPresent(candidate.target));
  }
  return candidate as WalkthroughContentStep | undefined;
}

export function followingContentStep(
  walkthrough: Walkthrough,
  currentStepId: string,
  targetPresent: (target: string) => boolean,
): WalkthroughContentStep | undefined {
  const currentIndex = walkthrough.steps.findIndex((step) => step.id === currentStepId);
  if (currentIndex < 0) return nextContentStep(walkthrough, walkthrough.steps[0]?.id ?? "", targetPresent);
  const next = walkthrough.steps[currentIndex + 1];
  if (!next) return undefined;
  return nextContentStep(walkthrough, next.id, targetPresent);
}

export function validateWalkthroughs(
  walkthroughs: readonly Walkthrough[],
  guideIds: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const targets = new Set<string>();
  for (const walkthrough of walkthroughs) {
    if (ids.has(walkthrough.id)) issues.push(`Duplicate walkthrough ID: ${walkthrough.id}`);
    ids.add(walkthrough.id);
    if (!guideIds.has(walkthrough.guideId)) issues.push(`Missing guide for ${walkthrough.id}`);
    if (!walkthrough.route.startsWith("/")) issues.push(`Invalid route for ${walkthrough.id}`);
    if (walkthrough.version < 1) issues.push(`Invalid version for ${walkthrough.id}`);
    const stepIds = new Set(walkthrough.steps.map((step) => step.id));
    if (stepIds.size !== walkthrough.steps.length) issues.push(`Duplicate step ID in ${walkthrough.id}`);
    for (const step of walkthrough.steps) {
      if (step.kind === "branch") {
        if (!stepIds.has(step.whenPresent) || !stepIds.has(step.whenMissing)) {
          issues.push(`Invalid branch in ${walkthrough.id}:${step.id}`);
        }
      }
      if (step.target) {
        const contract = `${walkthrough.id}:${step.target}`;
        if (targets.has(contract)) continue;
        targets.add(contract);
      }
    }
  }
  return issues;
}
