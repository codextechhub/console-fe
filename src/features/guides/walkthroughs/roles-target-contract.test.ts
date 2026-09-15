import { describe, expect, it } from "vitest";

import fieldAccessSource from "@/pages/protected/rbac/field-access/index.tsx?raw";

import { WALKTHROUGH_REGISTRY } from "./registry";

/**
 * The Field Access walkthrough points at markers on the Field Access page.
 * Renaming or dropping one on the page silently strands a coach mark, so the
 * page source is checked for every target the walkthrough names.
 */
describe("field access walkthrough targets", () => {
  it("finds every walkthrough target on the Field Access page", () => {
    const walkthrough = WALKTHROUGH_REGISTRY.find((entry) => entry.id === "walkthrough.roles.manage-field-access");
    expect(walkthrough).toBeDefined();
    const targets = new Set(walkthrough!.steps.flatMap((step) => ("target" in step && step.target ? [step.target] : [])));

    expect([...targets].sort()).toEqual([
      "field-access.fields",
      "field-access.save",
      "field-access.scope",
      "field-access.search",
    ]);
    for (const target of targets) expect(fieldAccessSource).toContain(`"${target}"`);
  });

  it("never lets the walkthrough save for the reader", () => {
    const walkthrough = WALKTHROUGH_REGISTRY.find((entry) => entry.id === "walkthrough.roles.manage-field-access")!;
    const saveStep = walkthrough.steps.find((step) => step.id === "save");

    expect(saveStep && "advance" in saveStep ? saveStep.advance : undefined).toBe("manual");
  });
});
