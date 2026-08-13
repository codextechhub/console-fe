import { describe, expect, it } from "vitest";

import { ACTIONS } from "@/lib/action-palette/registry";

import { GUIDE_REGISTRY } from "./registry";
import type { GuideRecord } from "./types";
import { validateGuideRegistry } from "./validate";

const actionIds = new Set(ACTIONS.map((action) => action.id));

describe("guide registry validation", () => {
  it("accepts the canonical registry and its action mappings", () => {
    expect(validateGuideRegistry(GUIDE_REGISTRY, { validActionIds: actionIds })).toEqual([]);
  });

  it("reports duplicated identities, unknown routes, and missing owners", () => {
    const base = GUIDE_REGISTRY[0];
    const invalid = [
      base,
      {
        ...base,
        owner: "",
        routes: ["/not-a-console-route"],
      },
    ] as unknown as readonly GuideRecord[];

    expect(validateGuideRegistry(invalid).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "duplicate-id",
      "duplicate-slug",
      "invalid-route",
      "missing-owner",
    ]));
  });

  it("requires an article loader before a guide can be published", () => {
    const invalid = [{ ...GUIDE_REGISTRY[1], status: "published" }] as unknown as readonly GuideRecord[];

    expect(validateGuideRegistry(invalid)).toContainEqual(expect.objectContaining({ code: "missing-article" }));
  });

  it("rejects broken related guides and duplicated article sections", () => {
    const base = GUIDE_REGISTRY[0];
    const invalid = [{
      ...base,
      relatedGuideIds: ["missing-guide"],
      sections: [{ id: "same-section", title: "One" }, { id: "same-section", title: "Two" }],
    }] as unknown as readonly GuideRecord[];

    expect(validateGuideRegistry(invalid).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "missing-related-guide",
      "invalid-section",
    ]));
  });
});
