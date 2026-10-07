import { describe, expect, it } from "vitest";
import { scoreAction, TIER } from "./match";
import { ACTIONS } from "./registry";
import { routesPath } from "@/routes/routes-path";
import type { ActionDef } from "./types";

const byId = (id: string): ActionDef => {
  const a = ACTIONS.find((x) => x.id === id);
  if (!a) throw new Error(`no action ${id}`);
  return a;
};

// Best-matching action id for a query across the whole registry (no gating).
function topMatch(query: string): string | null {
  const scored = ACTIONS.map((action) => ({ action, m: scoreAction(action, query) }))
    .filter((x) => x.m)
    .sort((a, b) => b.m!.tier - a.m!.tier || b.m!.score - a.m!.score || a.action.label.localeCompare(b.action.label));
  return scored[0]?.action.id ?? null;
}

function matchesInclude(query: string, id: string): boolean {
  return ACTIONS.some((a) => a.id === id && scoreAction(a, query));
}

describe("scoreAction - tiers", () => {
  it("exact label is the top tier", () => {
    expect(scoreAction(byId("view-home"), "view home")?.tier).toBe(TIER.EXACT);
  });
  it("prefix beats initials beats substring", () => {
    expect(scoreAction(byId("view-home"), "view h")?.tier).toBe(TIER.PREFIX);
    expect(scoreAction(byId("view-home"), "v h")?.tier).toBe(TIER.INITIALS);
  });
  it("returns null for no match", () => {
    expect(scoreAction(byId("view-home"), "zzzzz")).toBeNull();
  });
  it("empty query never matches", () => {
    expect(scoreAction(byId("view-home"), "   ")).toBeNull();
  });
});

describe("scoreAction - token / initials matching", () => {
  it("'vi ho' matches View Home", () => {
    expect(matchesInclude("vi ho", "view-home")).toBe(true);
  });
  it("'vi m-p' and 'vi m p' both match View My Profile", () => {
    expect(matchesInclude("vi m-p", "view-my-profile")).toBe(true);
    expect(matchesInclude("vi m p", "view-my-profile")).toBe(true);
  });
  it("'cr sch' matches Create School", () => {
    expect(matchesInclude("cr sch", "create-school")).toBe(true);
  });
  it("tokens may skip words: 'v rec' matches View bank reconciliation", () => {
    expect(matchesInclude("v rec", "view-bank-reconciliation")).toBe(true);
  });
  // The provider's request log and the money that moved are two screens, each found by its own words.
  it("finds payment provider activity by 'paystack log', 'failed payment' and 'payment attempts'", () => {
    expect(matchesInclude("paystack log", "view-provider-activity")).toBe(true);
    expect(matchesInclude("failed payment", "view-provider-activity")).toBe(true);
    expect(matchesInclude("payment attempts", "view-provider-activity")).toBe(true);
    expect(matchesInclude("provider log", "view-provider-activity")).toBe(true);
    expect(matchesInclude("money in and out", "view-transactions-log")).toBe(true);
    expect(matchesInclude("money in and out", "view-provider-activity")).toBe(false);
  });
  // A menu renamed into plain words is still found by the words it used to say.
  it("finds a renamed screen by its old name: 'ap aging', 'ar invoices', 'gr/ir'", () => {
    expect(matchesInclude("ap aging", "view-ap-aging")).toBe(true);
    expect(matchesInclude("unpaid bills", "view-ap-aging")).toBe(true);
    expect(matchesInclude("ar invoices", "view-ar-invoices")).toBe(true);
    expect(matchesInclude("gr/ir", "view-grir-control")).toBe(true);
    expect(matchesInclude("goods not yet billed", "view-grir-control")).toBe(true);
  });
  // The check that closed months have not moved is Closed figures, and still found as Sealed Figures.
  it("finds Closed figures by its name and by its old one, 'sealed figures'", () => {
    expect(byId("view-closed-figures").label).toBe("View closed figures");
    expect(matchesInclude("closed figures", "view-closed-figures")).toBe(true);
    expect(matchesInclude("sealed figures", "view-closed-figures")).toBe(true);
    expect(matchesInclude("verify seals", "view-closed-figures")).toBe(true);
  });
  it("single letter 'v' matches view actions via initials", () => {
    expect(matchesInclude("v", "view-home")).toBe(true);
    expect(matchesInclude("v", "view-schools")).toBe(true);
  });
});

describe("scoreAction - verb synonyms", () => {
  it("'open home' matches View Home", () => {
    expect(matchesInclude("open home", "view-home")).toBe(true);
  });
  it("'create payout' / 'raise payout' match New payout", () => {
    expect(matchesInclude("create payout", "new-payout")).toBe(true);
    expect(matchesInclude("raise payout", "new-payout")).toBe(true);
  });
  it("'new payment' matches both the payout and the vendor payment", () => {
    expect(matchesInclude("new payment", "new-payout")).toBe(true);
    expect(matchesInclude("new payment", "new-vendor-payment")).toBe(true);
  });
});

describe("scoreAction - ranking", () => {
  it("a full label ranks its own action first", () => {
    expect(topMatch("view schools")).toBe("view-schools");
  });
  it("alias 'coa' finds chart of accounts", () => {
    expect(topMatch("coa")).toBe("view-chart-of-accounts");
  });
});

describe("finance receipt destinations", () => {
  it("opens Record payment from Receipts & Allocation", () => {
    expect(routesPath.PROTECTED.FINANCE.RECORD_PAYMENT).toBe(
      `${routesPath.PROTECTED.FINANCE.RECEIPTS_ALLOCATION}?action=new`,
    );
    expect(byId("record-receipt").run).toEqual({
      to: routesPath.PROTECTED.FINANCE.RECORD_PAYMENT,
    });
  });
});
