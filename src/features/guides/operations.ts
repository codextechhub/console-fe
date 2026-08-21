import type { ActionDef } from "@/lib/action-palette/types";

import type { GuideRecord, GuideRisk, GuideValidationIssue } from "./types";
import { validateGuideRegistry } from "./validate";
import type { Walkthrough } from "./walkthroughs/types";
import type { WalkthroughVerificationRecord } from "./walkthroughs/verification";

const DAY_MS = 86_400_000;
const DUE_SOON_DAYS = 30;

export const GUIDE_REVIEW_INTERVAL_DAYS: Record<GuideRisk, number> = {
  high: 90,
  medium: 180,
  low: 365,
};

export type GuideFreshnessStatus = "current" | "due-soon" | "stale";

export type GuideFreshnessItem = {
  guideId: string;
  title: string;
  owner: string;
  risk: GuideRisk;
  reviewedAt: string;
  dueAt: string;
  daysUntilDue: number;
  status: GuideFreshnessStatus;
};

export type GuideRouteGap = { route: string };
export type GuideActionGap = { actionId: string; label: string; destination?: string };

export type WalkthroughTargetGap = {
  walkthroughId: string;
  guideId: string;
  targetId: string;
  reason: "verification-missing" | "version-mismatch" | "target-not-found";
};

export type GuideOperationsReport = {
  generatedAt: string;
  publishedGuideCount: number;
  draftGuideCount: number;
  routeCount: number;
  coveredRouteCount: number;
  actionCount: number;
  coveredActionCount: number;
  currentReviewCount: number;
  routeGaps: GuideRouteGap[];
  actionGaps: GuideActionGap[];
  freshnessQueue: GuideFreshnessItem[];
  integrityIssues: GuideValidationIssue[];
  walkthroughTargetGaps: WalkthroughTargetGap[];
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function atUtcMidnight(value: string | Date): Date {
  if (typeof value === "string") return new Date(`${value}T00:00:00Z`);
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function guideFreshness(
  guide: GuideRecord,
  now: Date,
): GuideFreshnessItem {
  const today = atUtcMidnight(now);
  const reviewed = atUtcMidnight(guide.reviewedAt);
  const due = addDays(reviewed, GUIDE_REVIEW_INTERVAL_DAYS[guide.risk]);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / DAY_MS);
  const status: GuideFreshnessStatus = daysUntilDue < 0
    ? "stale"
    : daysUntilDue <= DUE_SOON_DAYS
      ? "due-soon"
      : "current";

  return {
    guideId: guide.id,
    title: guide.title,
    owner: guide.owner,
    risk: guide.risk,
    reviewedAt: guide.reviewedAt,
    dueAt: isoDate(due),
    daysUntilDue,
    status,
  };
}

function actionDestination(action: ActionDef): string | undefined {
  return "to" in action.run ? action.run.to : undefined;
}

function isHighValueAction(action: ActionDef): boolean {
  return action.kind === "do" && !("command" in action.run && action.run.command === "logout");
}

export function buildGuideOperationsReport({
  guides,
  shippedRoutes,
  actions,
  walkthroughs,
  verificationRecords,
  now = new Date(),
}: {
  guides: readonly GuideRecord[];
  shippedRoutes: readonly string[];
  actions: readonly ActionDef[];
  walkthroughs: readonly Walkthrough[];
  verificationRecords: readonly WalkthroughVerificationRecord[];
  now?: Date;
}): GuideOperationsReport {
  const activeGuides = guides.filter((guide) => guide.status !== "retired");
  const routeGaps = shippedRoutes
    .filter((route) => !activeGuides.some((guide) => guide.routes.includes(route)))
    .map((route) => ({ route }));

  const highValueActions = actions.filter(isHighValueAction);
  const actionGaps = highValueActions
    .filter((action) => !activeGuides.some((guide) => guide.actionIds?.includes(action.id)))
    .map((action) => {
      const destination = actionDestination(action);
      return {
        actionId: action.id,
        label: action.label,
        ...(destination ? { destination } : {}),
      };
    });

  const freshness = activeGuides.map((guide) => guideFreshness(guide, now));
  const freshnessQueue = freshness
    .filter((item) => item.status !== "current")
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue || a.title.localeCompare(b.title));

  const actionIds = new Set(actions.map((action) => action.id));
  const walkthroughIds = new Set(walkthroughs.map((walkthrough) => walkthrough.id));
  const integrityIssues = validateGuideRegistry(guides, {
    validActionIds: actionIds,
    validWalkthroughIds: walkthroughIds,
  });

  const verificationByWalkthrough = new Map(
    verificationRecords.map((record) => [record.walkthroughId, record]),
  );
  const walkthroughTargetGaps: WalkthroughTargetGap[] = [];
  for (const walkthrough of walkthroughs) {
    const targets = [...new Set(walkthrough.steps.flatMap((step) => (
      step.target ? [step.target] : []
    )))];
    const record = verificationByWalkthrough.get(walkthrough.id);
    if (!record) {
      walkthroughTargetGaps.push(...targets.map((targetId) => ({
        walkthroughId: walkthrough.id,
        guideId: walkthrough.guideId,
        targetId,
        reason: "verification-missing" as const,
      })));
      continue;
    }
    if (record.version !== walkthrough.version) {
      walkthroughTargetGaps.push(...targets.map((targetId) => ({
        walkthroughId: walkthrough.id,
        guideId: walkthrough.guideId,
        targetId,
        reason: "version-mismatch" as const,
      })));
      continue;
    }
    walkthroughTargetGaps.push(...record.missingTargetIds.map((targetId) => ({
      walkthroughId: walkthrough.id,
      guideId: walkthrough.guideId,
      targetId,
      reason: "target-not-found" as const,
    })));
  }

  return {
    generatedAt: isoDate(atUtcMidnight(now)),
    publishedGuideCount: guides.filter((guide) => guide.status === "published").length,
    draftGuideCount: guides.filter((guide) => guide.status === "draft").length,
    routeCount: shippedRoutes.length,
    coveredRouteCount: shippedRoutes.length - routeGaps.length,
    actionCount: highValueActions.length,
    coveredActionCount: highValueActions.length - actionGaps.length,
    currentReviewCount: freshness.length - freshnessQueue.length,
    routeGaps,
    actionGaps,
    freshnessQueue,
    integrityIssues,
    walkthroughTargetGaps,
  };
}
