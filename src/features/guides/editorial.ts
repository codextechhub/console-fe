import { guideFreshness } from "./operations";
import type { GuideRecord, GuideRisk } from "./types";

export type GuideEditorialCounts = {
  guide_id: string;
  views: number;
  completions: number;
  helpful: number;
  not_helpful: number;
  outdated_reports: number;
  walkthrough_exits: number;
  walkthrough_finishes: number;
};

export type GuideEditorialQueueItem = {
  guideId: string;
  title: string;
  owner: string;
  risk: GuideRisk;
  dueAt: string;
  daysUntilDue: number;
  score: number;
  reasons: string[];
};

const RISK_WEIGHT: Record<GuideRisk, number> = {
  high: 30,
  medium: 15,
  low: 5,
};

/**
 * Combine the recurring risk review with reader signals. A guide enters the
 * queue when its review is due soon or telemetry points to a problem.
 */
export function buildGuideEditorialQueue({
  guides,
  analytics,
  now = new Date(),
}: {
  guides: readonly GuideRecord[];
  analytics: readonly GuideEditorialCounts[];
  now?: Date;
}): GuideEditorialQueueItem[] {
  const counts = new Map(analytics.map((row) => [row.guide_id, row]));
  return guides
    .filter((guide) => guide.status !== "retired")
    .map((guide) => {
      const freshness = guideFreshness(guide, now);
      const row = counts.get(guide.id);
      const views = row?.views ?? 0;
      const completions = row?.completions ?? 0;
      const abandonedWalkthroughs = Math.max(
        0,
        (row?.walkthrough_exits ?? 0) - (row?.walkthrough_finishes ?? 0),
      );
      const reasons: string[] = [];
      let score = RISK_WEIGHT[guide.risk];

      if (freshness.status === "stale") {
        reasons.push(`${Math.abs(freshness.daysUntilDue)} days overdue`);
        score += 100;
      } else if (freshness.status === "due-soon") {
        reasons.push(`review due in ${freshness.daysUntilDue} days`);
        score += 60;
      }
      if (row?.outdated_reports) {
        reasons.push(`${row.outdated_reports} outdated report${row.outdated_reports === 1 ? "" : "s"}`);
        score += Math.min(60, row.outdated_reports * 20);
      }
      if (row?.not_helpful) {
        reasons.push(`${row.not_helpful} not-helpful vote${row.not_helpful === 1 ? "" : "s"}`);
        score += Math.min(40, row.not_helpful * 10);
      }
      if (abandonedWalkthroughs) {
        reasons.push(`${abandonedWalkthroughs} walkthrough exit${abandonedWalkthroughs === 1 ? "" : "s"}`);
        score += Math.min(30, abandonedWalkthroughs * 6);
      }
      if (views >= 5 && completions / views < 0.25) {
        reasons.push(`${completions} completion${completions === 1 ? "" : "s"} from ${views} views`);
        score += 20;
      }

      return {
        guideId: guide.id,
        title: guide.title,
        owner: guide.owner,
        risk: guide.risk,
        dueAt: freshness.dueAt,
        daysUntilDue: freshness.daysUntilDue,
        score,
        reasons,
      };
    })
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => (
      b.score - a.score
      || a.daysUntilDue - b.daysUntilDue
      || a.title.localeCompare(b.title)
    ));
}
