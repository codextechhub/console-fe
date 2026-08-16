import { describe, expect, it } from "vitest";
import {
  historyParams,
  historyWindowStart,
  HISTORY_WINDOW_DAYS,
  PLATFORM_SCOPE,
  type HistoryScope,
} from "./history-params";

const WINDOW = "2026-08-09T00:00:00.000Z";

const filters = (over: Partial<Parameters<typeof historyParams>[0]> = {}) =>
  historyParams({ page: 1, email: "", status: "", scope: "", createdAfter: WINDOW, ...over });

// Every param the backend accepts as "you have narrowed this down".
const FILTER_KEYS = ["scope", "recipient_email", "status", "created_after"];

describe("historyWindowStart", () => {
  it("looks back seven days", () => {
    const now = Date.parse("2026-08-16T12:00:00.000Z");
    expect(historyWindowStart(now)).toBe("2026-08-09T12:00:00.000Z");
    expect(HISTORY_WINDOW_DAYS).toBe(7);
  });
});

describe("historyParams", () => {
  it("falls back to the date window when nothing is filtered", () => {
    expect(filters()).toEqual({ page: "1", created_after: WINDOW });
  });

  it("sends scope=platform when platform scope is chosen", () => {
    expect(filters({ scope: PLATFORM_SCOPE }).scope).toBe("platform");
  });

  it("sends no scope at all for the 'all' option", () => {
    expect("scope" in filters({ scope: "" })).toBe(false);
  });

  it("keeps the date window when scope is the only thing set", () => {
    // The deliberate choice: scope narrows whose rows, not how far back, so
    // picking it must not silently widen the table to all of history.
    expect(filters({ scope: PLATFORM_SCOPE })).toEqual({
      page: "1",
      scope: "platform",
      created_after: WINDOW,
    });
  });

  it("drops the date window once a row filter is set, scope or no scope", () => {
    expect(filters({ status: "FAILED" })).toEqual({ page: "1", status: "FAILED" });
    expect(filters({ status: "FAILED", scope: PLATFORM_SCOPE })).toEqual({
      page: "1",
      status: "FAILED",
      scope: "platform",
    });
    expect(filters({ email: "ada@example.com" })).toEqual({
      page: "1",
      recipient_email: "ada@example.com",
    });
  });

  it("combines every filter and carries the page", () => {
    expect(filters({ page: 4, email: "ada@example.com", status: "SENT", scope: PLATFORM_SCOPE })).toEqual({
      page: "4",
      recipient_email: "ada@example.com",
      status: "SENT",
      scope: "platform",
    });
  });

  it("never asks for an unfiltered dump, whatever the filter row looks like", () => {
    // The endpoint answers 422 rather than an empty list, so a params object of
    // only { page } would break the screen rather than show nothing.
    for (const email of ["", "ada@example.com"]) {
      for (const status of ["", "PENDING"]) {
        for (const scope of ["", PLATFORM_SCOPE] as HistoryScope[]) {
          const params = filters({ page: 2, email, status, scope });
          expect(Object.keys(params)).not.toEqual(["page"]);
          expect(FILTER_KEYS.some((key) => key in params)).toBe(true);
        }
      }
    }
  });
});
