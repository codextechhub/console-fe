// Action palette — the Cmd/Ctrl+E workspace search is an *action* launcher, not
// a page finder. Every entry is a permission-gated action a user can type
// ("view schools", "new payout"). See docs/ACTION_PALETTE_CATALOG.md for the
// approved vocabulary this registry implements.

import type { PermissionCode } from "@/permissions";

// Which console an action belongs to — drives the grouped headers in the
// expanded results list (fixed order: Main → Finance → Procurement).
export type ActionConsole = "Main" | "Finance" | "Procurement";

// A gate is evaluated against usePermissions(). `null` = always visible.
// - perm:   hasPermission(code)
// - any:    hasAnyPermission(...codes)
// - all:    hasAllPermissions(...codes)
// - module: hasModuleAccess(...prefixes) — visible with ANY backend key under a
//           prefix (the one place raw keys are used, matching the sidebar).
export type ActionGate =
  | null
  | { perm: PermissionCode }
  | { any: PermissionCode[] }
  | { all: PermissionCode[] }
  | { module: string[] };

// What running an action does. Most navigate; a couple invoke a header command
// (proxy dialog / logout confirm) that only the header can open.
export type ActionRun =
  | { to: string }
  | { command: "proxy" | "logout" };

export interface ActionDef {
  // Stable id (kebab-case) — the key used by popularity storage, so it must not
  // change once shipped or a user's learned ranking resets.
  id: string;
  label: string;
  aliases: string[];
  console: ActionConsole;
  // Sub-section within the console (e.g. "Receivables") — shown as the row's
  // detail line so an action carries its context without a header.
  group: string;
  kind: "view" | "do";
  gate: ActionGate;
  run: ActionRun;
}

// A scored, permission-passed action ready to render.
export interface ScoredAction {
  action: ActionDef;
  // Coarse relevance bucket (higher = stronger match): 4 exact, 3 prefix,
  // 2 initials/word-prefix, 1 substring. Popularity only reorders *within* a
  // tier, so a weak match can never outrank a strong one.
  tier: number;
  // Popularity score (adaptive pick + frecency) — the within-tier sort key.
  popularity: number;
  // Match strength within the tier — the final deterministic tie-break.
  matchScore: number;
}
