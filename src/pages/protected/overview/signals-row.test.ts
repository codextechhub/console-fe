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
