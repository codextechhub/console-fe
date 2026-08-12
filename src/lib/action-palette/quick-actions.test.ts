import { describe, expect, it } from "vitest";
import { ACTIONS } from "./registry";
import { DEFAULT_QUICK_ACTION_IDS, QUICK_ACTIONS_MAX, rankQuickActions } from "./quick-actions";
import type { ActionDef } from "./types";

const byId = (id: string): ActionDef => {
  const a = ACTIONS.find((x) => x.id === id);
  if (!a) throw new Error(`no action ${id}`);
  return a;
};

const ids = (actions: ActionDef[]) => actions.map((a) => a.id);

describe("rankQuickActions", () => {
  it("every curated default id exists in the registry and navigates", () => {
    for (const id of DEFAULT_QUICK_ACTION_IDS) {
      expect("to" in byId(id).run, `${id} should navigate`).toBe(true);
    }
  });

  it("cold start fills from defaults in listed order, capped at max", () => {
    const gated = DEFAULT_QUICK_ACTION_IDS.map(byId);
    const picked = rankQuickActions(gated, {});
    expect(ids(picked)).toEqual(DEFAULT_QUICK_ACTION_IDS.slice(0, QUICK_ACTIONS_MAX));
  });

  it("frecency-used actions rank first, defaults fill the rest", () => {
    const gated = [byId("view-schools"), byId("view-tasks"), byId("create-school")];
    const picked = rankQuickActions(gated, { "create-school": 12, "view-tasks": 3 });
    expect(ids(picked)).toEqual(["create-school", "view-tasks", "view-schools"]);
  });

  it("never includes command actions or view-home, even with high frecency", () => {
    const gated = [byId("logout"), byId("proxy-user"), byId("view-home"), byId("view-tasks")];
    const picked = rankQuickActions(gated, { logout: 50, "proxy-user": 40, "view-home": 30 });
    expect(ids(picked)).toEqual(["view-tasks"]);
  });

  it("only offers actions the caller's gate let through", () => {
    const gated = [byId("view-tasks")];
    const picked = rankQuickActions(gated, { "create-school": 99 });
    expect(ids(picked)).toEqual(["view-tasks"]);
  });

  it("caps at max even with abundant frecency", () => {
    const gated = ACTIONS.filter((a) => "to" in a.run);
    const scores = Object.fromEntries(gated.map((a, i) => [a.id, i + 1]));
    expect(rankQuickActions(gated, scores)).toHaveLength(QUICK_ACTIONS_MAX);
  });
});
