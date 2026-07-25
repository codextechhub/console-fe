import { describe, expect, it } from "vitest";
import {
  mergeHandles,
  resolveHeader,
  type DashboardHandle,
  type HeaderOverride,
} from "./dashboard-header";

// The header of every protected screen is resolved from two sources: static
// route `handle` metadata and a per-location runtime override. These are the
// rules that keep a title from bleeding across screens.

describe("mergeHandles", () => {
  it("returns an empty handle when no match declares one", () => {
    expect(mergeHandles([{}, { handle: undefined }])).toEqual({});
  });

  it("takes the deepest match's title", () => {
    const merged = mergeHandles([
      { handle: { title: "Finance" } satisfies DashboardHandle },
      { handle: { title: "Receivables" } satisfies DashboardHandle },
    ]);
    expect(merged.title).toBe("Receivables");
  });

  it("inherits fields the deepest match leaves unset", () => {
    // The finance console declares its sidebar on a pathless parent; the leaf
    // route only names the screen and must keep the console's sidebar.
    const merged = mergeHandles([
      { handle: { sidebar: "finance", title: "Finance" } satisfies DashboardHandle },
      { handle: { title: "Payroll" } satisfies DashboardHandle },
    ]);
    expect(merged).toEqual({ title: "Payroll", back: undefined, sidebar: "finance" });
  });

  it("merges the back affordance from whichever match declares it", () => {
    const merged = mergeHandles([
      { handle: { title: "Roles" } satisfies DashboardHandle },
      { handle: { back: "/roles" } satisfies DashboardHandle },
    ]);
    expect(merged).toEqual({ title: "Roles", back: "/roles", sidebar: undefined });
  });

  it("ignores matches with no handle without losing earlier ones", () => {
    const merged = mergeHandles([
      { handle: { title: "Audit" } satisfies DashboardHandle },
      {},
    ]);
    expect(merged.title).toBe("Audit");
  });
});

describe("resolveHeader", () => {
  const handle: DashboardHandle = { title: "Support", back: true };

  it("falls back to the route handle when nothing overrides it", () => {
    expect(resolveHeader(handle, null, "loc-1")).toEqual({ title: "Support", back: true });
  });

  it("lets a runtime override win on the location that set it", () => {
    const override: HeaderOverride = { key: "loc-1", title: "TCK-4821" };
    expect(resolveHeader(handle, override, "loc-1")).toEqual({
      title: "TCK-4821",
      back: true,
    });
  });

  it("drops an override the moment the location changes", () => {
    // The reset that matters: a ticket number must never survive into the next
    // screen, even if the page that set it has not run its cleanup yet.
    const stale: HeaderOverride = { key: "loc-1", title: "TCK-4821" };
    expect(resolveHeader({ title: "Roles" }, stale, "loc-2")).toEqual({
      title: "Roles",
      back: undefined,
    });
  });

  it("falls back to the handle when the override clears its title", () => {
    // What useDashboardTitle's cleanup writes: same location, no title.
    const cleared: HeaderOverride = { key: "loc-1", title: undefined };
    expect(resolveHeader(handle, cleared, "loc-1").title).toBe("Support");
  });

  it("prefers an override back handler over the handle's destination", () => {
    const handler = () => {};
    const override: HeaderOverride = { key: "loc-1", back: handler };
    expect(resolveHeader({ title: "Edit Template", back: "/x" }, override, "loc-1")).toEqual({
      title: "Edit Template",
      back: handler,
    });
  });

  it("keeps the handle's back when only the title is overridden", () => {
    const override: HeaderOverride = { key: "loc-1", title: "Resume draft" };
    expect(resolveHeader({ title: "CX Users", back: true }, override, "loc-1")).toEqual({
      title: "Resume draft",
      back: true,
    });
  });

  it("reports no title at all when neither source has one (header shows Home)", () => {
    expect(resolveHeader({}, null, "loc-1")).toEqual({ title: undefined, back: undefined });
  });
});
