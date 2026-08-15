import { describe, expect, it } from "vitest";

import { formatBytes } from "./format-bytes";

// These cases are the ones the four old copies disagreed on. They are pinned
// here so a future edit has to change a test on purpose rather than change a
// screen by accident.
describe("formatBytes", () => {
  it("reports nothing as 0 KB", () => {
    // KB, not B: a size column reads in KB, and "0 B" next to "1.3 MB" invites
    // the reader to check whether the unit changed meaning.
    expect(formatBytes(0)).toBe("0 KB");
  });

  it("treats a missing or NaN size as nothing rather than throwing", () => {
    expect(formatBytes(NaN)).toBe("0 KB");
    expect(formatBytes(undefined as unknown as number)).toBe("0 KB");
  });

  it("shows whole bytes below 1 KB, with no decimal", () => {
    expect(formatBytes(1)).toBe("1 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("switches unit at exactly 1024", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
  });

  it("keeps one decimal below 10 of a unit, where it carries information", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1_363_148)).toBe("1.3 MB");
    expect(formatBytes(5 * 1024 ** 3)).toBe("5.0 GB");
  });

  it("drops the decimal at or above 10 of a unit, where it is noise", () => {
    expect(formatBytes(10 * 1024)).toBe("10 KB");
    expect(formatBytes(512 * 1024)).toBe("512 KB");
    expect(formatBytes(50 * 1024 * 1024)).toBe("50 MB");
  });

  it("does not invent a unit above GB", () => {
    // Nothing this app serves gets near a terabyte, but running off the end of
    // the unit list silently would be worse than a long number.
    expect(formatBytes(1024 ** 4)).toBe("1024.0 GB");
  });
});
