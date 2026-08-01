import { describe, expect, it } from "vitest";

import { routesPath } from "@/routes/routes-path";
import { resolveAttentionDestination } from "./overview-navigation";

const R = routesPath.PROTECTED;

describe("resolveAttentionDestination", () => {
  it("opens notifications when unread notifications are the active attention item", () => {
    expect(
      resolveAttentionDestination(
        [
          { count: 0, to: R.TODO.INDEX },
          { count: 0, to: R.WORKFLOW.MY_SUBMISSIONS },
          { count: 0, to: R.WORKFLOW.APPROVALS },
          { count: 2, to: R.NOTIFICATIONS },
        ],
        R.TODO.INDEX,
      ),
    ).toBe(R.NOTIFICATIONS);
  });

  it("uses the first populated attention category and falls back when clear", () => {
    const items = [
      { count: 1, to: R.TODO.INDEX },
      { count: 3, to: R.WORKFLOW.APPROVALS },
    ];

    expect(resolveAttentionDestination(items, R.NOTIFICATIONS)).toBe(R.TODO.INDEX);
    expect(resolveAttentionDestination([], R.TODO.INDEX)).toBe(R.TODO.INDEX);
  });
});
