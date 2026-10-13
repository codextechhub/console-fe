import { describe, expect, it } from "vitest";
import type { Entitlement, EntitlementCalendarEntry } from "@/redux/services/config-api";
import { calendarEntryDate, canEditSchedule, entitlementTiming, formatWindowDate, windowShown } from "./entitlement-window";

const NOW = new Date("2026-10-12T12:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;
const iso = (offset: number) => new Date(NOW + offset).toISOString();

const grant = (over: Partial<Entitlement> & Record<string, unknown> = {}): Entitlement => ({
  id: "e1",
  capability: "c1",
  capability_key: "attendance",
  school: "s1",
  state: "GRANTED",
  state_label: "Granted",
  source: "PACKAGE",
  source_label: "Plan package",
  updated_at: iso(0),
  ...over,
});

const entry = (over: Partial<EntitlementCalendarEntry> = {}): EntitlementCalendarEntry => ({
  id: "x1",
  capability: "c1",
  capability_label: "Attendance",
  tenant_slug: "corona",
  tenant_name: "Corona",
  scope: "school",
  status: "active",
  status_label: "Active",
  warning: "none",
  ...over,
});

describe("windowShown", () => {
  it("tells an omitted date from a null one", () => {
    expect(windowShown({})).toEqual({ starts: false, ends: false });
    expect(windowShown({ starts_at: null, ends_at: null })).toEqual({ starts: true, ends: true });
    expect(windowShown({ ends_at: iso(DAY) })).toEqual({ starts: false, ends: true });
  });
});

describe("formatWindowDate", () => {
  it("returns null for empty and unparseable values, never Invalid Date", () => {
    expect(formatWindowDate(undefined)).toBeNull();
    expect(formatWindowDate(null)).toBeNull();
    expect(formatWindowDate("not a date")).toBeNull();
    expect(formatWindowDate(iso(0))).not.toMatch(/Invalid/);
  });
});

describe("entitlementTiming", () => {
  it("reads a full window as before", () => {
    expect(entitlementTiming(grant({ starts_at: null, ends_at: null }), NOW)).toBe("Active now");
    expect(entitlementTiming(grant({ starts_at: iso(DAY), ends_at: null }), NOW)).toMatch(/^Starts /);
    expect(entitlementTiming(grant({ starts_at: null, ends_at: iso(-DAY) }), NOW)).toBe("Expired");
    expect(entitlementTiming(grant({ starts_at: null, ends_at: iso(DAY) }), NOW)).toMatch(/^Expires /);
  });

  it("names the source, not a date, when the plan window is hidden", () => {
    const text = entitlementTiming(grant(), NOW);
    expect(text).toBe("Plan package");
    expect(text).not.toMatch(/Invalid|NaN|undefined|Active now/);
  });

  it("does not claim Active now when only one end of the window is hidden", () => {
    expect(entitlementTiming(grant({ starts_at: null }), NOW)).toBe("Plan package");
    expect(entitlementTiming(grant({ ends_at: null }), NOW)).toBe("Plan package");
  });

  it("still reports the visible end when the other is hidden", () => {
    expect(entitlementTiming(grant({ ends_at: iso(-DAY) }), NOW)).toBe("Expired");
    expect(entitlementTiming(grant({ ends_at: iso(DAY) }), NOW)).toMatch(/^Expires /);
  });

  it("reports an ungranted capability as not granted", () => {
    expect(entitlementTiming(grant({ state: "DENIED" }), NOW)).toBe("Not granted");
    expect(entitlementTiming(undefined, NOW)).toBe("Not granted");
  });
});

describe("canEditSchedule", () => {
  it("offers the editor only when both dates are shown or there is no grant", () => {
    expect(canEditSchedule(undefined)).toBe(true);
    expect(canEditSchedule(grant({ starts_at: null, ends_at: null }))).toBe(true);
    expect(canEditSchedule(grant())).toBe(false);
    expect(canEditSchedule(grant({ ends_at: null }))).toBe(false);
  });
});

describe("calendarEntryDate", () => {
  it("picks the activation for a scheduled entry and the expiry otherwise", () => {
    expect(calendarEntryDate(entry({ status: "scheduled", starts_at: iso(DAY), ends_at: null }))).not.toMatch(/No date|Invalid/);
    expect(calendarEntryDate(entry({ status: "active", starts_at: null, ends_at: iso(DAY) }))).not.toMatch(/No date|Invalid/);
  });

  it("falls back to No date when the date is shown but empty", () => {
    expect(calendarEntryDate(entry({ ends_at: null }))).toBe("No date");
  });

  it("returns nothing when the server withheld the date", () => {
    expect(calendarEntryDate(entry())).toBeUndefined();
    expect(calendarEntryDate(entry({ status: "scheduled", ends_at: iso(DAY) }))).toBeUndefined();
  });
});
