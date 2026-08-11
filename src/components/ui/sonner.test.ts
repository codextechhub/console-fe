import { describe, expect, it } from "vitest";
import {
  getNotificationDuration,
  getToastDuration,
  getWorkspaceToastCenter,
  MAX_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_DURATION_MS,
} from "./sonner";

describe("workspace toast positioning", () => {
  it("centers over the expanded dashboard inset", () => {
    expect(getWorkspaceToastCenter("expanded")).toBe("calc(50% + 8rem)");
  });

  it("tracks the collapsed sidebar width", () => {
    expect(getWorkspaceToastCenter("collapsed")).toBe("calc(50% + 1.5rem)");
  });
});

describe("notification display duration", () => {
  it("uses the minimum duration for short messages", () => {
    expect(getNotificationDuration("Saved.")).toBe(MIN_NOTIFICATION_DURATION_MS);
  });

  it("increases the duration as the title and description get longer", () => {
    expect(
      getNotificationDuration("Import finished.", {
        description: "Review the imported records and resolve any rows that need attention.",
      }),
    ).toBe(6_000);
  });

  it("caps long messages at the maximum duration", () => {
    expect(getNotificationDuration("A".repeat(500))).toBe(MAX_NOTIFICATION_DURATION_MS);
  });

  it("keeps critical errors visible until the user dismisses them", () => {
    expect(
      getToastDuration({
        title: "The server could not save your changes.",
        type: "error",
      }),
    ).toBe(Infinity);
  });

  it("keeps notifications with user actions visible", () => {
    expect(
      getToastDuration({
        title: "Import complete.",
        type: "success",
        action: { label: "Review", onClick: () => undefined },
      }),
    ).toBe(Infinity);
  });
});
