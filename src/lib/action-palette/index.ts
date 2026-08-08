export { ACTIONS } from "./registry";
export { scoreAction, TIER } from "./match";
export { loadPopularity, recordPick } from "./popularity";
export type { ActionDef, ActionConsole, ScoredAction, ActionRun, ActionGate } from "./types";

import type { ActionConsole, ScoredAction } from "./types";

// Fixed console order for the grouped, expanded results list - stable ordering
// reads more scannably than relevance-ordered group headers.
export const CONSOLE_ORDER: ActionConsole[] = ["Main", "Finance", "Procurement"];

export interface ConsoleGroup {
  console: ActionConsole;
  items: ScoredAction[];
}

/** Group ranked results by console in fixed order, preserving relevance order
 *  within each group. Empty consoles are omitted. */
export function groupByConsole(results: ScoredAction[]): ConsoleGroup[] {
  return CONSOLE_ORDER.map((console) => ({
    console,
    items: results.filter((r) => r.action.console === console),
  })).filter((g) => g.items.length > 0);
}
