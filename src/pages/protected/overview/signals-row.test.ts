import { describe, expect, it } from "vitest";
import { buildSignalCards } from "./signals-model";

describe("buildSignalCards", () => {
  it("returns nothing for an absent or empty signals section", () => {
    expect(buildSignalCards(undefined)).toEqual([]);
    expect(buildSignalCards({})).toEqual([]);
  });

  it("maps each present key to one card and skips absent ones", () => {
    const cards = buildSignalCards({
      draft_journals: { count: 4 },
      jobs_failed_24h: { count: 1 },
    });
    expect(cards.map((c) => c.key)).toEqual(["jobs", "journals"]);
    expect(cards[1].stat).toBe("4");
  });

  it("orders red (broken now) before amber (needs attention soon)", () => {
    const cards = buildSignalCards({
      pos_awaiting_receipt: { count: 2 },
      webhook_failures_24h: { count: 3 },
    });
    expect(cards.map((c) => c.severity)).toEqual(["red", "amber"]);
  });

  it("words the runway card by state", () => {
    const expiring = buildSignalCards({
      fiscal_runway: { entity_name: "CodeX", status: "EXPIRING", days_remaining: 12, calendar_end: "2026-08-24" },
    })[0];
    expect(expiring.severity).toBe("amber");
    expect(expiring.stat).toBe("12 days left");

    const expired = buildSignalCards({
      fiscal_runway: { entity_name: "CodeX", status: "EXPIRED", days_remaining: -3, calendar_end: "2026-08-01" },
    })[0];
    expect(expired.severity).toBe("red");
    expect(expired.message).toContain("no longer post");
  });
});

describe("expanded signals", () => {
  it("maps each new key to a card with its count as the stat", () => {
    const cards = buildSignalCards({
      overdue_invoices: { count: 4 },
      unallocated_credit: { count: 2 },
      vendor_invoices_unpaid: { count: 5 },
      rfqs_open: { count: 1 },
      contracts_expiring: { count: 3 },
      users_without_roles: { count: 6 },
      team_overdue_tasks: { count: 7 },
    });
    expect(cards.map((c) => [c.key, c.stat])).toEqual([
      ["overdue_invoices", "4"],
      ["unallocated_credit", "2"],
      ["vendor_invoices", "5"],
      ["rfqs", "1"],
      ["contracts", "3"],
      ["roleless_users", "6"],
      ["team_overdue", "7"],
    ]);
    expect(cards.every((c) => c.severity === "amber")).toBe(true);
  });
});
