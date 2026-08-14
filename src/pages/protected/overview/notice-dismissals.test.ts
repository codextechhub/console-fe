import { beforeEach, describe, expect, it } from "vitest";
import { dismissNotice, isDismissed, loadDismissals } from "./notice-dismissals";

const USER = 42;
const NOON = new Date("2026-08-14T12:00:00").getTime();
const LATER = new Date("2026-08-14T22:00:00").getTime();
const TOMORROW = new Date("2026-08-15T09:00:00").getTime();

describe("notice dismissals", () => {
  beforeEach(() => localStorage.clear());

  it("hides the dismissed row for the rest of the day", () => {
    const map = dismissNotice(USER, {}, "exports_ready", "3", NOON);
    expect(isDismissed(map, "exports_ready", "3", NOON)).toBe(true);
    expect(isDismissed(map, "exports_ready", "3", LATER)).toBe(true);
  });

  it("brings the row back when the figure changes", () => {
    // Two more exports finished: that is new information, not the thing the
    // reader put down.
    const map = dismissNotice(USER, {}, "exports_ready", "3", NOON);
    expect(isDismissed(map, "exports_ready", "5", NOON)).toBe(false);
  });

  it("brings the row back the next day", () => {
    const map = dismissNotice(USER, {}, "notifications", "7", NOON);
    expect(isDismissed(map, "notifications", "7", TOMORROW)).toBe(false);
  });

  it("never hides a row that was not dismissed", () => {
    const map = dismissNotice(USER, {}, "exports_ready", "3", NOON);
    expect(isDismissed(map, "notifications", "3", NOON)).toBe(false);
  });

  it("persists per user, so one reader cannot hide another's notice", () => {
    dismissNotice(USER, {}, "exports_ready", "3", NOON);
    expect(isDismissed(loadDismissals(USER), "exports_ready", "3", NOON)).toBe(true);
    expect(isDismissed(loadDismissals(7), "exports_ready", "3", NOON)).toBe(false);
  });

  it("drops stale days on write instead of growing", () => {
    const yesterday = dismissNotice(USER, {}, "notifications", "7", NOON);
    const today = dismissNotice(USER, yesterday, "exports_ready", "1", TOMORROW);
    expect(Object.keys(today)).toEqual(["exports_ready"]);
  });

  it("treats unreadable storage as nothing dismissed", () => {
    localStorage.setItem("overview-notices:v1:42", "not json");
    expect(loadDismissals(USER)).toEqual({});
    localStorage.setItem("overview-notices:v1:42", "[1,2]");
    expect(loadDismissals(USER)).toEqual({});
  });
});
