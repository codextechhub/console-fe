// Quick-actions ranking for the overview dashboard. Reuses the palette's
// permission gating and frecency store: the row shows what THIS user actually
// reaches for, and falls back to a curated default set until they have history.

import type { ActionDef } from "./types";

export const QUICK_ACTIONS_MAX = 6;

/**
 * Actions that never belong on the home screen's quick row:
 * - command actions (proxy/logout) are header concerns, not dashboard shortcuts
 *   (excluded structurally below, listed here only for the reader);
 * - view-home navigates to the page the row is already on.
 */
const EXCLUDED_IDS = new Set(["view-home"]);

// Cold-start defaults, in order. Gating trims this to what the user can see, so
// a finance-only user starts with the finance entries and a platform admin with
// the Main ones. Order within = most broadly useful first.
export const DEFAULT_QUICK_ACTION_IDS = [
  "view-approvals",
  "view-tasks",
  "view-schools",
  "invite-cx-user",
  "create-school",
  "view-cx-users",
  "new-journal-entry",
  "create-ar-invoice",
  "record-receipt",
  "create-requisition",
  "create-purchase-order",
  "view-notifications",
];

/**
 * Pick the row's actions from the caller's already-gated action list.
 * Frecency-ranked picks come first (score desc); remaining slots fill from the
 * curated defaults in their listed order. Pure and deterministic for tests.
 */
export function rankQuickActions(
  gated: readonly ActionDef[],
  frecencyScores: Record<string, number>,
  max = QUICK_ACTIONS_MAX,
): ActionDef[] {
  const eligible = gated.filter(
    (action) => "to" in action.run && !EXCLUDED_IDS.has(action.id),
  );
  const byId = new Map(eligible.map((action) => [action.id, action]));

  const ranked = eligible
    .filter((action) => (frecencyScores[action.id] ?? 0) > 0)
    .sort(
      (a, b) =>
        (frecencyScores[b.id] ?? 0) - (frecencyScores[a.id] ?? 0) ||
        a.label.localeCompare(b.label),
    );

  const picked: ActionDef[] = [];
  const taken = new Set<string>();
  for (const action of ranked) {
    if (picked.length >= max) break;
    picked.push(action);
    taken.add(action.id);
  }
  for (const id of DEFAULT_QUICK_ACTION_IDS) {
    if (picked.length >= max) break;
    if (taken.has(id)) continue;
    const action = byId.get(id);
    if (!action) continue;
    picked.push(action);
    taken.add(id);
  }
  return picked;
}
