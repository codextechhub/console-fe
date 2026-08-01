import type { ScoredAction } from "@/lib/action-palette";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogram-types";

export type WorkspaceSearchRow =
  | { kind: "action"; action: ScoredAction }
  | { kind: "show-all-actions" }
  | { kind: "person"; person: StaffProfileListItem };

export type WorkspaceSearchSection = "Actions" | "People";

/**
 * Search text belongs to the effective identity, not to the route. Keeping the
 * proxy session in the key makes entering, switching, or leaving proxy mode an
 * explicit boundary even while the protected layout remains mounted.
 */
export function getWorkspaceSearchIdentityKey(
  userId: string | number | null | undefined,
  impersonationId: string | number | null | undefined,
): string {
  return `${userId ?? "anonymous"}:${impersonationId ?? "direct"}`;
}

/** Self results use the existing owner-only My Profile experience. */
export function isWorkspaceSearchSelf(
  personUserId: string | number,
  currentUserId: string | number | null | undefined,
): boolean {
  return currentUserId != null && String(personUserId) === String(currentUserId);
}

/** The single visual/keyboard order for the grouped workspace results. */
export function buildWorkspaceSearchRows(
  actions: ScoredAction[],
  hasMoreActions: boolean,
  people: StaffProfileListItem[],
): WorkspaceSearchRow[] {
  return [
    ...actions.map((action) => ({ kind: "action" as const, action })),
    ...(hasMoreActions ? [{ kind: "show-all-actions" as const }] : []),
    ...people.map((person) => ({ kind: "person" as const, person })),
  ];
}

export function getWorkspaceSearchSections(rows: WorkspaceSearchRow[]): WorkspaceSearchSection[] {
  const sections: WorkspaceSearchSection[] = [];
  if (rows.some((row) => row.kind === "action" || row.kind === "show-all-actions")) sections.push("Actions");
  if (rows.some((row) => row.kind === "person")) sections.push("People");
  return sections;
}
