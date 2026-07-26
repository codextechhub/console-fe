import { describe, expect, it } from "vitest";
import { getWorkspaceToastCenter } from "./sonner";

describe("workspace toast positioning", () => {
  it("centers over the expanded dashboard inset", () => {
    expect(getWorkspaceToastCenter("expanded")).toBe("calc(50% + 8rem)");
  });

  it("tracks the collapsed sidebar width", () => {
    expect(getWorkspaceToastCenter("collapsed")).toBe("calc(50% + 1.5rem)");
  });
});
