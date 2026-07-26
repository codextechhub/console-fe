import type { Account } from "@/redux/services/finance/setup-types";

export function descendantPostingAccounts(accounts: Account[], rootId: number): Account[] {
  const children = new Map<number, number[]>();
  for (const account of accounts) {
    if (account.parent_id == null) continue;
    const siblings = children.get(account.parent_id) ?? [];
    siblings.push(account.id);
    children.set(account.parent_id, siblings);
  }

  const descendantIds = new Set<number>();
  const pending = [rootId];
  while (pending.length) {
    for (const childId of children.get(pending.pop()!) ?? []) {
      if (descendantIds.has(childId)) continue;
      descendantIds.add(childId);
      pending.push(childId);
    }
  }
  return accounts
    .filter((account) => descendantIds.has(account.id) && account.is_postable)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function accountGroupContribution(account: Account, groupNormalBalance: string): number {
  const balance = account.balance?.kobo ?? 0;
  return balance * (account.normal_balance === groupNormalBalance ? 1 : -1);
}
