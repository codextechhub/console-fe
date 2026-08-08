import { useCallback, useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import { selectPermissions } from "@/redux/features/auth/auth-slice";
import { ACTIONS } from "@/lib/action-palette/registry";
import { filterActionsForPermissions } from "@/lib/action-palette/gate";
import { scoreAction } from "@/lib/action-palette/match";
import { loadPopularity, recordPick } from "@/lib/action-palette/popularity";
import type { ActionDef, ScoredAction } from "@/lib/action-palette/types";

export interface UseActionSearch {
  results: ScoredAction[];
  total: number;
  /** Persist that the user launched this action for `query` (adaptive + frecency). */
  onLaunch: (action: ActionDef, query: string) => void;
}

/**
 * Rank the permission-gated action catalog against `query`. Gating is recomputed
 * only when the user's permission set changes; ranking only when the query
 * changes — so keystrokes stay cheap. Popularity (localStorage) reorders within
 * each match tier, so a weak match can never outrank a strong one.
 */
export function useActionSearch(query: string): UseActionSearch {
  const permissions = useAppSelector(selectPermissions);
  const userId = useAppSelector((s) => (s.auth.user?.id == null ? undefined : String(s.auth.user.id)));

  // Gate once per permission set. `permissions` (the raw array) is the stable
  // memo key, and the pure filter is shared with registry regression tests.
  const gated = useMemo(
    () => filterActionsForPermissions(ACTIONS, permissions),
    [permissions],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const pop = loadPopularity(userId);
    const scored: ScoredAction[] = [];
    for (const action of gated) {
      const m = scoreAction(action, q);
      if (!m) continue;
      scored.push({ action, tier: m.tier, popularity: pop.scoreFor(action.id, q), matchScore: m.score });
    }
    scored.sort(
      (a, b) =>
        b.tier - a.tier ||
        b.popularity - a.popularity ||
        b.matchScore - a.matchScore ||
        a.action.label.localeCompare(b.action.label),
    );
    return scored;
  }, [gated, query, userId]);

  const onLaunch = useCallback(
    (action: ActionDef, q: string) => recordPick(userId, action.id, q),
    [userId],
  );

  return { results, total: results.length, onLaunch };
}
