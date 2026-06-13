import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatEnum,
  formatRelativeDate,
  formatStartedTime,
  generateQueryString,
  returnInitial,
} from "./helpers";

describe("returnInitial", () => {
  it("uses first letters of the first two words", () => {
    expect(returnInitial("Jane Doe")).toBe("JD");
    expect(returnInitial("Jane Anne Doe")).toBe("JA");
  });

  it("returns a single letter for a mononym", () => {
    expect(returnInitial("Admin")).toBe("A");
  });

  it("ignores stray spaces between words", () => {
    expect(returnInitial("Jane  Doe")).toBe("JD");
    expect(returnInitial("  Solo")).toBe("S");
  });

  it("returns empty string for empty input", () => {
    expect(returnInitial("")).toBe("");
  });
});

describe("formatEnum", () => {
  it("uses the explicit label map", () => {
    expect(formatEnum("FAITH_BASED")).toBe("Faith-Based");
    expect(formatEnum("3_TERMS")).toBe("3 Terms");
  });

  it("title-cases unknown enum keys", () => {
    expect(formatEnum("SOME_RAW_VALUE")).toBe("Some Raw Value");
  });

  it("returns an em dash for empty values", () => {
    expect(formatEnum(null)).toBe("—");
    expect(formatEnum(undefined)).toBe("—");
    expect(formatEnum("")).toBe("—");
  });
});

describe("generateQueryString", () => {
  it("builds a query string and skips empty values", () => {
    expect(
      generateQueryString({ page: 1, search: "abc", empty: "", skip: undefined as unknown as string }),
    ).toBe("?page=1&search=abc");
  });

  it("returns empty string when nothing survives filtering", () => {
    expect(generateQueryString({ a: "" })).toBe("");
    expect(generateQueryString({})).toBe("");
  });

  it("URL-encodes keys and values", () => {
    expect(generateQueryString({ "q v": "a&b" })).toBe("?q%20v=a%26b");
  });
});

describe("formatDate", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(formatDate(new Date(2026, 5, 11))).toBe("2026-06-11");
  });

  it("returns an em dash for invalid dates", () => {
    expect(formatDate(new Date("nope"))).toBe("—");
  });
});

describe("formatRelativeDate", () => {
  it("recognises today and yesterday", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    expect(formatRelativeDate(today.toISOString())).toBe("Today");
    expect(formatRelativeDate(yesterday.toISOString())).toBe("Yesterday");
  });

  it("uses ordinal suffixes for older dates", () => {
    expect(formatRelativeDate("2020-01-01T12:00:00Z")).toBe("1st Jan 2020");
    expect(formatRelativeDate("2020-03-22T12:00:00Z")).toBe("22nd Mar 2020");
    expect(formatRelativeDate("2020-05-13T12:00:00Z")).toBe("13th May 2020");
  });

  it("returns an em dash for invalid input", () => {
    expect(formatRelativeDate("not a date")).toBe("—");
  });
});

describe("formatStartedTime", () => {
  it("returns an em dash for invalid input", () => {
    expect(formatStartedTime("garbage")).toBe("—");
  });
});
