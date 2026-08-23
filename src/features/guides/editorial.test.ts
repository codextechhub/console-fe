import { describe, expect, it } from "vitest";

import type { GuideRecord } from "./types";
import { buildGuideEditorialQueue } from "./editorial";

const guide = (overrides: Partial<GuideRecord>): GuideRecord => ({
  id: "guide.one",
  slug: "guide-one",
  title: "Guide one",
  summary: "Summary",
  category: "getting-started",
  tags: [],
  aliases: [],
  audiences: ["all-users"],
  routes: ["/overview"],
  access: { mode: "authenticated", permissions: [] },
  owner: "Console product team",
  reviewedAt: "2026-08-01",
  risk: "high",
  status: "published",
  article: async () => ({ default: () => null }),
  ...overrides,
} as GuideRecord);

describe("buildGuideEditorialQueue", () => {
  it("prioritizes outdated and abandoned high-risk guidance", () => {
    const queue = buildGuideEditorialQueue({
      guides: [
        guide({ id: "guide.high", title: "High", risk: "high" }),
        guide({ id: "guide.low", title: "Low", risk: "low" }),
      ],
      analytics: [
        {
          guide_id: "guide.high",
          views: 10,
          completions: 1,
          helpful: 0,
          not_helpful: 2,
          outdated_reports: 1,
          walkthrough_exits: 3,
          walkthrough_finishes: 1,
        },
      ],
      now: new Date("2026-08-23T00:00:00Z"),
    });

    expect(queue.map((item) => item.guideId)).toEqual(["guide.high"]);
    expect(queue[0].reasons).toEqual([
      "1 outdated report",
      "2 not-helpful votes",
      "2 walkthrough exits",
      "1 completion from 10 views",
    ]);
  });

  it("adds due reviews even before reader signals arrive", () => {
    const queue = buildGuideEditorialQueue({
      guides: [guide({ reviewedAt: "2026-01-01", risk: "medium" })],
      analytics: [],
      now: new Date("2026-08-23T00:00:00Z"),
    });

    expect(queue).toHaveLength(1);
    expect(queue[0].reasons[0]).toContain("days overdue");
  });
});
