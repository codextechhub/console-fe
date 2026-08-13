import type { ScoredAction } from "@/lib/action-palette";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogram-types";
import type { ScoredGuide } from "@/features/guides";

export type WorkspaceSearchRow =
  | { kind: "action"; action: ScoredAction }
  | { kind: "show-all-actions" }
  | { kind: "guide"; guide: ScoredGuide }
  | { kind: "person"; person: StaffProfileListItem };

export type WorkspaceSearchSection = "Actions" | "Guides" | "People";

/**
 * Anywhere in the app can ask the header to open and focus the workspace
 * search (the overview's "More actions" chip does). An event keeps the caller
 * decoupled from the layout: the header owns the input refs and the
 * desktop-vs-mobile split, so it stays the only place that focuses them.
 */
export const WORKSPACE_SEARCH_OPEN_EVENT = "workspace-search:open";

export function requestWorkspaceSearchOpen(): void {
  window.dispatchEvent(new Event(WORKSPACE_SEARCH_OPEN_EVENT));
}

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
  guides: ScoredGuide[],
  people: StaffProfileListItem[],
): WorkspaceSearchRow[] {
  return [
    ...actions.map((action) => ({ kind: "action" as const, action })),
    ...(hasMoreActions ? [{ kind: "show-all-actions" as const }] : []),
    ...guides.map((guide) => ({ kind: "guide" as const, guide })),
    ...people.map((person) => ({ kind: "person" as const, person })),
  ];
}

export function getWorkspaceSearchSections(rows: WorkspaceSearchRow[]): WorkspaceSearchSection[] {
  const sections: WorkspaceSearchSection[] = [];
  if (rows.some((row) => row.kind === "action" || row.kind === "show-all-actions")) sections.push("Actions");
  if (rows.some((row) => row.kind === "guide")) sections.push("Guides");
  if (rows.some((row) => row.kind === "person")) sections.push("People");
  return sections;
}
