import { describe, expect, it } from "vitest";

import { parseDate, toIsoDate } from "./date-picker-input";

describe("date picker value conversion", () => {
  it("parses API dates in local time without a UTC day shift", () => {
    const date = parseDate("2026-07-12");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(12);
  });

  it("rejects malformed and impossible API dates", () => {
    expect(parseDate("12/07/2026")).toBeUndefined();
    expect(parseDate("2026-02-30")).toBeUndefined();
  });

  it("serializes selected dates using the backend YYYY-MM-DD contract", () => {
    expect(toIsoDate(new Date(2026, 6, 12))).toBe("2026-07-12");
  });
});
