import { describe, expect, it } from "vitest";

import { shouldForceMyTasks, type TasksTab } from "./tab-resolution";

describe("shouldForceMyTasks", () => {
  // The regression. A manager deep-linking to ?tab=team looks exactly like a
  // non-manager until the assignable query settles; forcing "mine" during that
  // window discarded the requested tab permanently.
  it.each<TasksTab>(["team", "mine"])(
    "never forces while manager status is unknown (tab=%s)",
    (tab) => {
      expect(shouldForceMyTasks({ tab, viewerIsManager: false, managerStatusKnown: false })).toBe(false);
    },
  );

  it("forces a confirmed non-manager off the team tab", () => {
    expect(shouldForceMyTasks({ tab: "team", viewerIsManager: false, managerStatusKnown: true })).toBe(true);
  });

  it("leaves a confirmed non-manager alone once already on mine", () => {
    expect(shouldForceMyTasks({ tab: "mine", viewerIsManager: false, managerStatusKnown: true })).toBe(false);
  });

  it.each<TasksTab>(["team", "mine"])("never forces a manager (tab=%s)", (tab) => {
    expect(shouldForceMyTasks({ tab, viewerIsManager: true, managerStatusKnown: true })).toBe(false);
  });
});
