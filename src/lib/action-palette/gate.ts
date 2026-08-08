import { resolvePermissionKey } from "@/permissions";
import type { ActionDef, ActionGate } from "./types";

/** Evaluate an action gate against raw permission keys returned by the API. */
export function passesActionGate(
  gate: ActionGate,
  permissions: readonly string[],
): boolean {
  return passesGateWithSet(gate, permissions, new Set(permissions));
}

function passesGateWithSet(
  gate: ActionGate,
  permissions: readonly string[],
  held: ReadonlySet<string>,
): boolean {
  if (gate === null) return true;
  if ("perm" in gate) return held.has(resolvePermissionKey(gate.perm));
  if ("any" in gate) {
    return gate.any.some((code) => held.has(resolvePermissionKey(code)));
  }
  if ("all" in gate) {
    return gate.all.every((code) => held.has(resolvePermissionKey(code)));
  }
  if ("module" in gate) {
    return permissions.some((key) => gate.module.some((prefix) => key.startsWith(prefix)));
  }
  return false;
}

export function filterActionsForPermissions(
  actions: readonly ActionDef[],
  permissions: readonly string[],
): ActionDef[] {
  const held = new Set(permissions);
  return actions.filter((action) => passesGateWithSet(action.gate, permissions, held));
}
