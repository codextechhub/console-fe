/**
 * Pure helpers for the organogram views. Operate on the API shapes
 * (organogramTypes) - no network, no React. The server already builds the
 * position tree; here we derive the people view from it and enrich with
 * staff-profile status, plus KPI math from the supporting lists.
 */

import type {
  EmploymentStatus,
  EmploymentType,
  CurrentOrganogramAssignment,
  OrganogramNode,
  OrgNodeKind,
  Position,
  StaffProfileListItem,
  UserInline,
} from "@/redux/services/dashboard/organogram-types";

// The backend's success_response does `data or {}`, so an EMPTY list serialises
// to `{}` (an object), not `[]`. Coerce any non-array response payload to [].
export function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── Avatar colour (deterministic by id) ──────────────────────────────────────

const AV_PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-cyan-100 text-cyan-700",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  return AV_PALETTE[h % AV_PALETTE.length];
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Status / employment vocab (mirror model TextChoices) ──────────────────────

export const STATUS_META: Record<
  EmploymentStatus,
  { label: string; dot: string; text: string; soft: string }
> = {
  ACTIVE: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50 ring-emerald-200" },
  ON_LEAVE: { label: "On leave", dot: "bg-amber-500", text: "text-amber-700", soft: "bg-amber-50 ring-amber-200" },
  SUSPENDED: { label: "Suspended", dot: "bg-rose-500", text: "text-rose-700", soft: "bg-rose-50 ring-rose-200" },
  EXITED: { label: "Exited", dot: "bg-slate-400", text: "text-slate-500", soft: "bg-slate-100 ring-slate-200" },
};

export const EMP_TYPE_META: Record<EmploymentType, { label: string; cls: string }> = {
  FULL_TIME: { label: "Full-time", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  PART_TIME: { label: "Part-time", cls: "bg-indigo-50 text-indigo-600 ring-indigo-200" },
  CONTRACT: { label: "Contract", cls: "bg-teal-50 text-teal-700 ring-teal-200" },
  INTERN: { label: "Intern", cls: "bg-violet-50 text-violet-600 ring-violet-200" },
};

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const yearsSince = (s: string | null): string => {
  if (!s) return "-";
  const d = (Date.now() - new Date(s).getTime()) / (365.25 * 864e5);
  return d < 1 ? `${Math.round(d * 12)} mo` : `${d.toFixed(1)} yr`;
};

// ── Profile enrichment map (userId → list item) ───────────────────────────────

export type ProfileMap = Map<string, StaffProfileListItem>;

export function buildProfileMap(profiles: StaffProfileListItem[]): ProfileMap {
  const m: ProfileMap = new Map();
  for (const p of profiles) m.set(p.user.id, p);
  return m;
}

// Acting holders: set of `${userId}@${positionId}` that are acting (from current assignments).
export function buildActingSet(assignments: CurrentOrganogramAssignment[]): Set<string> {
  const s = new Set<string>();
  for (const a of assignments) {
    if (a.is_acting) s.add(`${a.user.id}@${a.position.id}`);
  }
  return s;
}

/**
 * ── Derived people tree from the server position tree ─────────────────────────
 *
 * A "person node" is a holder of a seat. Its children are the holders of the
 * seat's child positions. An empty seat contributes no card of its own: the
 * chart shows people, and an unfilled post is not a person. Its reports are
 * spliced up to the nearest filled ancestor, so nobody drops off the chart
 * because the seat above them happens to be vacant.
 */

export interface PersonNodeData {
  kind: "person";
  user: UserInline;
  positionId: number;
  positionTitle: string;
  positionCode: string;
  departmentName: string | null;
  isActing: boolean;
  children: PeopleNode[];
}

export type PeopleNode = PersonNodeData;

function peopleChildrenOf(node: OrganogramNode, actingSet: Set<string>): PeopleNode[] {
  const out: PeopleNode[] = [];
  for (const child of node.direct_reports) {
    if (child.holders.length) {
      for (const u of child.holders) {
        out.push({
          kind: "person",
          user: u,
          positionId: child.id,
          positionTitle: child.title,
          positionCode: child.code,
          departmentName: child.org_node?.name ?? null,
          isActing: actingSet.has(`${u.id}@${child.id}`),
          children: peopleChildrenOf(child, actingSet),
        });
      }
    } else {
      // Vacant seat: skip the seat itself and lift its reports a level, so the
      // branch beneath an empty post stays visible.
      out.push(...peopleChildrenOf(child, actingSet));
    }
  }
  return out;
}

/**
 * Strip unfilled seats out of the position tree before it is rendered.
 *
 * The chart is a view of the organisation as it is staffed, not of its
 * establishment: an empty post tells a reader nothing they can act on, and its
 * headcount is deliberately kept to Manage. A pruned seat splices its own
 * reports up to the nearest filled ancestor, exactly as the people tree does,
 * so removing a vacant manager never hides the team beneath them.
 */
export function pruneVacantPositions(tree: OrganogramNode[]): OrganogramNode[] {
  const out: OrganogramNode[] = [];
  for (const node of tree) {
    const kept = pruneVacantPositions(node.direct_reports);
    if (node.holders.length) {
      out.push({ ...node, direct_reports: kept });
    } else {
      out.push(...kept);
    }
  }
  return out;
}

// Build the people roots from the position-tree roots.
export function buildPeopleTree(tree: OrganogramNode[], actingSet: Set<string>): PeopleNode[] {
  const roots: PeopleNode[] = [];
  for (const node of tree) {
    if (node.holders.length) {
      for (const u of node.holders) {
        roots.push({
          kind: "person",
          user: u,
          positionId: node.id,
          positionTitle: node.title,
          positionCode: node.code,
          departmentName: node.org_node?.name ?? null,
          isActing: actingSet.has(`${u.id}@${node.id}`),
          children: peopleChildrenOf(node, actingSet),
        });
      }
    } else {
      // A vacant root promotes its own reports to roots.
      roots.push(...peopleChildrenOf(node, actingSet));
    }
  }
  return roots;
}

// Count everyone reporting under these children, directly or indirectly
// (i.e. the full team size below a person).
export function countAllReports(children: PeopleNode[]): number {
  let n = 0;
  for (const c of children) {
    n += 1 + countAllReports(c.children);
  }
  return n;
}

// Collect all expandable person ids in the people tree (for expand-all).
export function collectPeopleIds(nodes: PeopleNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    acc.push(n.user.id);
    collectPeopleIds(n.children, acc);
  }
  return acc;
}

/**
 * Person-node user ids from a root down to the matched user (inclusive).
 * Expanding exactly these ids reveals the user's chain - and their own direct
 * reports - while every other branch stays collapsed. Used to auto-focus the
 * chart on the logged-in viewer.
 */
export function findPeoplePathToUser(
  nodes: PeopleNode[],
  match: (u: UserInline) => boolean,
): string[] | null {
  for (const n of nodes) {
    if (match(n.user)) return [n.user.id];
    const below = findPeoplePathToUser(n.children, match);
    if (below) return [n.user.id, ...below];
  }
  return null;
}

// Position ids from a root down to the seat held by the matched user (inclusive).
// The positions-tab counterpart of findPeoplePathToUser.
export function findPositionPathToUser(
  tree: OrganogramNode[],
  match: (u: UserInline) => boolean,
): number[] | null {
  for (const n of tree) {
    if (n.holders.some(match)) return [n.id];
    const below = findPositionPathToUser(n.direct_reports, match);
    if (below) return [n.id, ...below];
  }
  return null;
}

// On the initial chart view, an expanded ancestor reveals only the next node
// on the viewer's reporting path. Once that ancestor is explicitly expanded,
// callers ignore this result and render all of its children.
export function nextFocusedNode<T extends string | number>(
  path: readonly T[],
  current: T,
): T | null {
  const index = path.indexOf(current);
  return index >= 0 && index + 1 < path.length ? path[index + 1] : null;
}

// Collect all position ids in the server tree (for expand-all on positions tab).
export function collectPositionIds(tree: OrganogramNode[], acc: number[] = []): number[] {
  for (const n of tree) {
    acc.push(n.id);
    collectPositionIds(n.direct_reports, acc);
  }
  return acc;
}

// Unique active-staff ids = distinct holders in the tree. The backend now counts
// only ACTIVE users as holders, so pending-invite hires (reserved into a seat
// but not yet activated) are excluded automatically.
export function collectActiveHolderIds(tree: OrganogramNode[], acc: Set<string> = new Set()): Set<string> {
  for (const n of tree) {
    n.holders.forEach((u) => acc.add(u.id));
    collectActiveHolderIds(n.direct_reports, acc);
  }
  return acc;
}

// ── Org-node hierarchy utilities ──────────────────────────────────────────────

export interface OrgNodeLike {
  id: number;
  name: string;
  code: string;
  kind: OrgNodeKind;
  parent: { id: number } | null;
}

export type OrgNodeMap = Map<number, OrgNodeLike>;

export function buildOrgNodeMap(nodes: OrgNodeLike[]): OrgNodeMap {
  return new Map(nodes.map((n) => [n.id, n]));
}

// All node ids in the subtree rooted at `rootId` (inclusive).
export function orgNodeDescendantIds(map: OrgNodeMap, rootId: number): Set<number> {
  const out = new Set<number>([rootId]);
  // Walk children by scanning the map (org trees are small).
  let added = true;
  while (added) {
    added = false;
    for (const node of map.values()) {
      if (node.parent && out.has(node.parent.id) && !out.has(node.id)) {
        out.add(node.id);
        added = true;
      }
    }
  }
  return out;
}

// The DIVISION / DEPARTMENT / TEAM ancestors of a node (self included), by tier.
export function resolveTiers(map: OrgNodeMap, nodeId: number | null | undefined): {
  division: OrgNodeLike | null;
  department: OrgNodeLike | null;
  team: OrgNodeLike | null;
} {
  const tiers = { division: null as OrgNodeLike | null, department: null as OrgNodeLike | null, team: null as OrgNodeLike | null };
  let cur = nodeId != null ? map.get(nodeId) ?? null : null;
  let guard = 0;
  while (cur && guard++ < 20) {
    if (cur.kind === "DIVISION" && !tiers.division) tiers.division = cur;
    if (cur.kind === "DEPARTMENT" && !tiers.department) tiers.department = cur;
    if (cur.kind === "TEAM" && !tiers.team) tiers.team = cur;
    cur = cur.parent ? map.get(cur.parent.id) ?? null : null;
  }
  return tiers;
}

// Prune the position tree to seats whose org node is in `allowed`, re-parenting
// kept descendants under kept ancestors (so the structure within the selected
// unit is preserved and its seats surface as roots).
export function pruneTreeByOrgNodes(nodes: OrganogramNode[], allowed: Set<number>): OrganogramNode[] {
  const out: OrganogramNode[] = [];
  for (const n of nodes) {
    const keptChildren = pruneTreeByOrgNodes(n.direct_reports, allowed);
    if (n.org_node && allowed.has(n.org_node.id)) {
      out.push({ ...n, direct_reports: keptChildren });
    } else {
      out.push(...keptChildren);
    }
  }
  return out;
}

// ── KPI math ─────────────────────────────────────────────────────────────────

export interface OrgKpis {
  headcountActive: number;
  departments: number;
  positions: number;
  totalSeats: number;
  filledSeats: number;
  vacantSeats: number;
  acting: number;
  onLeave: number;
  suspended: number;
}

export function computeKpis(args: {
  positions: Position[];
  profiles: StaffProfileListItem[];
  assignments: CurrentOrganogramAssignment[];
  departmentsTotal: number;
  // Distinct activated staff (from tree holders) - excludes pending-invite hires.
  activeStaffCount: number;
}): OrgKpis {
  const { positions, profiles, assignments, departmentsTotal, activeStaffCount } = args;
  let totalSeats = 0;
  let vacant = 0;
  for (const p of positions) {
    totalSeats += p.headcount;
    vacant += p.open_seats;
  }
  return {
    headcountActive: activeStaffCount,
    departments: departmentsTotal,
    positions: positions.length,
    totalSeats,
    filledSeats: totalSeats - vacant,
    vacantSeats: vacant,
    acting: assignments.filter((a) => a.is_acting).length,
    onLeave: profiles.filter((p) => p.employment_status === "ON_LEAVE").length,
    suspended: profiles.filter((p) => p.employment_status === "SUSPENDED").length,
  };
}
