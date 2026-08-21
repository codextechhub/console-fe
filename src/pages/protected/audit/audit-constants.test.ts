import { describe, expect, it } from "vitest";

import { auditEntityTrailRowKey } from "./audit-constants";

describe("audit entity trail row identity", () => {
  it("keeps the same raw id distinct across entity types", () => {
    expect(auditEntityTrailRowKey("User", "10")).not.toBe(
      auditEntityTrailRowKey("OnboardingTask", "10"),
    );
  });

  it("is stable for the same audit identity", () => {
    expect(auditEntityTrailRowKey("User", "10")).toBe(
      auditEntityTrailRowKey("User", "10"),
    );
  });
});
