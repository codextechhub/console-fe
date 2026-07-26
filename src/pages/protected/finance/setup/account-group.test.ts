import { describe, expect, it } from "vitest";
import type { Account } from "@/redux/services/finance/setup-types";
import { accountGroupContribution, descendantPostingAccounts } from "./account-group";

const account = (overrides: Partial<Account>): Account => ({
  id: 1,
  code: "1000",
  name: "Assets",
  account_type: "ASSET",
  normal_balance: "DEBIT",
  is_contra: false,
  is_postable: false,
  is_active: true,
  parent_id: null,
  parent_code: null,
  subtype: "",
  ...overrides,
});

describe("account group helpers", () => {
  it("returns every nested posting descendant without unrelated accounts", () => {
    const accounts = [
      account({ id: 1 }),
      account({ id: 2, code: "1100", parent_id: 1, is_postable: false }),
      account({ id: 3, code: "1110", parent_id: 2, is_postable: true }),
      account({ id: 4, code: "1200", parent_id: 1, is_postable: true }),
      account({ id: 5, code: "2100", parent_id: null, is_postable: true }),
    ];

    expect(descendantPostingAccounts(accounts, 1).map(({ id }) => id)).toEqual([3, 4]);
  });

  it("subtracts contra balances from the group contribution", () => {
    const contra = account({
      normal_balance: "CREDIT",
      is_contra: true,
      is_postable: true,
      balance: { kobo: 2500, naira: "25.00" },
    });

    expect(accountGroupContribution(contra, "DEBIT")).toBe(-2500);
  });
});
