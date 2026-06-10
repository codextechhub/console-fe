// Organogram — Org Chart page. Tabs: People (derived) & Positions (server tree),
// with KPI strip, global search, dept filter, expand/collapse, matrix toggle and
// a detail drawer. Wired to the vs_user organogram API.

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Ban, Briefcase, Building2, ChevronsDownUp, Filter, Info,
  PlaneTakeoff, Search, Sparkles, UserPlus, Users, X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { routesPath } from "@/routes/routesPath";
import type {
  MatrixReport, OrgNode, OrganogramNode, Position, PositionAssignment,
  StaffProfileListItem, UserInline,
} from "@/redux/services/dashboard/organogramTypes";
import {
  useGetAssignmentsQuery, useGetOrgNodesQuery, useGetMatrixReportsQuery,
  useGetPositionsQuery, useGetPositionTreeQuery, useGetStaffProfilesQuery,
} from "@/redux/services/dashboard/organogramApi";
import {
  asArray, buildActingSet, buildOrgNodeMap, buildPeopleTree, buildProfileMap,
  collectActiveHolderIds, collectPeopleIds, collectPositionIds, computeKpis,
  orgNodeDescendantIds, pruneTreeByOrgNodes,
} from "./lib/org-helpers";
import { SearchSelect } from "@/components/custom/search-select";
import { OrgAvatar } from "./components/org-primitives";
import { PositionsTree, type PositionsCtx } from "./components/positions-tree";
import { PeopleTree, type PeopleCtx } from "./components/people-tree";
import { DetailDrawer, type DetailTarget } from "./components/detail-drawer";

const LARGE = { page_size: 100 } as const;

function Stat({ icon: Icon, label, value, sub, accent }: { icon: React.ElementType; label: string; value: number | string; sub?: string; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accent)}><Icon className="size-[15px]" /></span>
      <div className="leading-tight">
        <div className="text-[15px] font-bold text-slate-800">{value} {sub && <span className="text-[11px] font-medium text-slate-400">{sub}</span>}</div>
        <div className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </div>
  );
}

export default function OrganogramPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const { data: treeRes, isLoading: treeLoading } = useGetPositionTreeQuery();
  const { data: positionsRes } = useGetPositionsQuery(LARGE);
  const { data: orgNodesRes } = useGetOrgNodesQuery(LARGE);
  const { data: profilesRes } = useGetStaffProfilesQuery(LARGE);
  const { data: assignmentsRes } = useGetAssignmentsQuery({ current: "true", ...LARGE });
  const { data: matrixRes } = useGetMatrixReportsQuery(LARGE);

  // NOTE: the backend's success_response does `data or {}`, so an EMPTY list
  // serialises to `{}` (an object), not `[]`. Coerce defensively everywhere.
  const tree = useMemo(() => asArray<OrganogramNode>(treeRes?.data), [treeRes]);
  const positions = useMemo(() => asArray<Position>(positionsRes?.data), [positionsRes]);
  const orgNodes = useMemo(() => asArray<OrgNode>(orgNodesRes?.data), [orgNodesRes]);
  const profilesList = useMemo(() => asArray<StaffProfileListItem>(profilesRes?.data), [profilesRes]);
  const assignments = useMemo(() => asArray<PositionAssignment>(assignmentsRes?.data), [assignmentsRes]);
  const matrix = useMemo(() => asArray<MatrixReport>(matrixRes?.data), [matrixRes]);

  const posMap = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);
  const orgNodeMap = useMemo(() => buildOrgNodeMap(orgNodes), [orgNodes]);
  const profileMap = useMemo(() => buildProfileMap(profilesList), [profilesList]);
  const actingSet = useMemo(() => buildActingSet(assignments), [assignments]);
  const matrixOut = useMemo(() => {
    const m = new Map<number, typeof matrix>();
    for (const r of matrix) { const a = m.get(r.position.id) ?? []; a.push(r); m.set(r.position.id, a); }
    return m;
  }, [matrix]);
  const matrixIn = useMemo(() => {
    const m = new Map<number, typeof matrix>();
    for (const r of matrix) { const a = m.get(r.reports_to.id) ?? []; a.push(r); m.set(r.reports_to.id, a); }
    return m;
  }, [matrix]);

  const kpis = useMemo(
    () => computeKpis({
      positions,
      profiles: profilesList,
      assignments,
      departmentsTotal: orgNodes.filter((n) => n.kind === "DEPARTMENT").length,
      activeStaffCount: collectActiveHolderIds(tree).size,
    }),
    [positions, profilesList, assignments, orgNodes, tree],
  );

  // Org-unit filter options — grouped by tier, plain names.
  const nodeOptions = useMemo(() => {
    const rank = { DIVISION: 0, DEPARTMENT: 1, TEAM: 2 } as const;
    return [...orgNodes]
      .sort((a, b) => rank[a.kind] - rank[b.kind] || a.name.localeCompare(b.name))
      .map((n) => ({ value: String(n.id), label: n.name }));
  }, [orgNodes]);

  // ── view state ──
  const [tab, setTab] = useState<"people" | "positions">("people");
  const [deptFilter, setDeptFilter] = useState<number | "ALL">("ALL");
  const [showMatrix, setShowMatrix] = useState(false);
  const [target, setTarget] = useState<DetailTarget | null>(null);
  const [highlightUid, setHighlightUid] = useState<string | null>(null);
  const [highlightPid, setHighlightPid] = useState<number | null>(null);
  const [expandedPeople, setExpandedPeople] = useState<Set<string>>(new Set());
  const [expandedPos, setExpandedPos] = useState<Set<number>>(new Set());
  const [initialised, setInitialised] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Filter the position tree to the selected org node (and its descendant nodes),
  // re-parenting kept seats so the unit's positions surface as roots.
  const viewTree = useMemo(() => {
    if (deptFilter === "ALL") return tree;
    const allowed = orgNodeDescendantIds(orgNodeMap, deptFilter);
    return pruneTreeByOrgNodes(tree, allowed);
  }, [tree, orgNodeMap, deptFilter]);

  const peopleRoots = useMemo(() => buildPeopleTree(viewTree, actingSet), [viewTree, actingSet]);

  // Seed default expansion (roots + their direct children) once data arrives.
  if (!initialised && tree.length) {
    const pos = new Set<number>();
    const ppl = new Set<string>();
    for (const root of tree) {
      pos.add(root.id);
      root.direct_reports.forEach((c) => pos.add(c.id));
      root.holders.forEach((u) => ppl.add(u.id));
      root.direct_reports.forEach((c) => c.holders.forEach((u) => ppl.add(u.id)));
    }
    setExpandedPos(pos);
    setExpandedPeople(ppl);
    setInitialised(true);
  }

  const openUser = (u: UserInline) => setTarget({ kind: "person", user: u });
  const openPosition = (id: number) => setTarget({ kind: "position", id });
  const closeDetail = () => setTarget(null);

  const togglePos = (id: number) => setExpandedPos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const togglePeople = (id: string) => setExpandedPeople((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const expandAll = () => {
    if (tab === "positions") setExpandedPos(new Set(collectPositionIds(viewTree)));
    else setExpandedPeople(new Set(collectPeopleIds(peopleRoots)));
  };
  const collapseAll = () => {
    if (tab === "positions") setExpandedPos(new Set(viewTree.map((n) => n.id)));
    else setExpandedPeople(new Set(peopleRoots.filter((n) => n.kind === "person").map((n) => (n.kind === "person" ? n.user.id : ""))));
  };

  const scrollToNode = (selector: string) => {
    requestAnimationFrame(() => {
      const cont = scrollRef.current;
      if (!cont) return;
      const el = cont.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      const top = el.getBoundingClientRect().top - cont.getBoundingClientRect().top + cont.scrollTop - 100;
      cont.scrollTo({ top, behavior: "smooth" });
    });
  };

  const jumpToUser = (u: UserInline) => {
    setDeptFilter("ALL");
    setTab("people");
    // Expand all so the node is reachable, then highlight + scroll.
    setExpandedPeople(new Set(collectPeopleIds(buildPeopleTree(tree, actingSet))));
    setHighlightUid(u.id);
    setTimeout(() => setHighlightUid((h) => (h === u.id ? null : h)), 1600);
    setTimeout(() => scrollToNode(`[data-uid="${u.id}"]`), 90);
  };
  const jumpToPosition = (id: number) => {
    setDeptFilter("ALL");
    setTab("positions");
    setExpandedPos(new Set(collectPositionIds(tree)));
    setHighlightPid(id);
    setTimeout(() => setHighlightPid((h) => (h === id ? null : h)), 1600);
    setTimeout(() => scrollToNode(`[data-pid="${id}"]`), 90);
  };

  const drawerCtx = {
    profiles: profileMap,
    posMap,
    matrixOut,
    matrixIn,
    openUser,
    openPosition,
    onEditProfile: hasPermission(P.MODIFY_STAFF_PROFILE) ? (pid: number) => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_EDIT(pid)) : undefined,
    actingSet,
  };
  const positionsCtx: PositionsCtx = { expanded: expandedPos, toggle: togglePos, openPosition, openUser, highlightId: highlightPid, showMatrix, posMap, matrixOut, matrixIn, actingSet };
  const peopleCtx: PeopleCtx = { expanded: expandedPeople, toggle: togglePeople, openUser, openPosition, highlightId: highlightUid, profiles: profileMap };

  return (
    <DashboardLayout title="Organogram">
      <main className="min-w-0 text-slate-800">
        {/* search + summary */}
        <div className="border-b border-slate-100 bg-white px-4.5 py-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold font-mont text-gray-01">Organisation Chart</p>
              <p className="text-xs text-gray-01 mt-0.5">CX staff reporting structure — seats, holders, and vacancies.</p>
            </div>
            <OrgSearch posMap={posMap} profiles={profilesList} onJumpUser={jumpToUser} onJumpPosition={jumpToPosition} />
          </div>
          <div className="flex flex-wrap items-center gap-y-2 divide-x divide-slate-100">
            <Stat icon={Users} label="Active staff" value={kpis.headcountActive} accent="bg-indigo-50 text-indigo-500" />
            <Stat icon={Building2} label="Departments" value={kpis.departments} accent="bg-slate-100 text-slate-500" />
            <Stat icon={Briefcase} label="Seats filled" value={kpis.filledSeats} sub={`/ ${kpis.totalSeats}`} accent="bg-emerald-50 text-emerald-500" />
            <Stat icon={UserPlus} label="Vacancies" value={kpis.vacantSeats} accent="bg-amber-50 text-amber-500" />
            <Stat icon={Sparkles} label="Acting" value={kpis.acting} accent="bg-amber-50 text-amber-500" />
            <Stat icon={PlaneTakeoff} label="On leave" value={kpis.onLeave} accent="bg-amber-50 text-amber-500" />
            <Stat icon={Ban} label="Suspended" value={kpis.suspended} accent="bg-rose-50 text-rose-500" />
          </div>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 bg-white px-4.5">
          {([["people", "People", Users], ["positions", "Positions", Briefcase]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn("relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold transition-colors", tab === id ? "text-indigo-600" : "text-slate-500 hover:text-slate-700")}
            >
              <Icon className="size-4" />{label}
              {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-indigo-600" />}
            </button>
          ))}
        </div>

        {/* toolbar */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white/90 px-4.5 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-slate-400" />
            <div className="w-60">
              <SearchSelect
                options={nodeOptions}
                value={deptFilter === "ALL" ? "" : String(deptFilter)}
                onChange={(e) => setDeptFilter(e.target.value ? Number(e.target.value) : "ALL")}
                placeholder="All org units"
                revealOnSearch
              />
            </div>
            {deptFilter !== "ALL" && (
              <button onClick={() => setDeptFilter("ALL")} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                <X className="size-3" />Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
              <ChevronsDownUp className="size-3.5 rotate-180 text-slate-400" />Expand all
            </button>
            <button onClick={collapseAll} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
              <ChevronsDownUp className="size-3.5 text-slate-400" />Collapse all
            </button>
            {tab === "positions" && (
              <button
                onClick={() => setShowMatrix((v) => !v)}
                className={cn("inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors", showMatrix ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
              >
                <span className="inline-block h-0 w-4 border-t-2 border-dotted border-current" />Matrix lines
              </button>
            )}
          </div>
        </div>

        {/* tree */}
        <div ref={scrollRef} className="max-h-[calc(100vh-19rem)] overflow-y-auto">
          <div className="mx-auto max-w-5xl px-5 py-6">
            {deptFilter !== "ALL" && (
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                <Filter className="size-3.5 text-indigo-500" />
                Showing <span className="font-semibold text-slate-700">{orgNodes.find((d) => d.id === deptFilter)?.name}</span> unit
              </div>
            )}
            {treeLoading ? (
              <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
            ) : viewTree.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center">
                <Info className="mx-auto mb-2 size-6 text-slate-300" />
                <p className="text-[13px] font-medium text-slate-500">No organogram data yet.</p>
                <p className="mt-1 text-[12px] text-slate-400">Create departments and positions to build the chart.</p>
              </div>
            ) : tab === "positions" ? (
              <PositionsTree tree={viewTree} ctx={positionsCtx} />
            ) : (
              <PeopleTree roots={peopleRoots} ctx={peopleCtx} />
            )}
          </div>
        </div>
      </main>

      <DetailDrawer target={target} onClose={closeDetail} ctx={drawerCtx} />
    </DashboardLayout>
  );
}

// ── inline global search ──────────────────────────────────────────────────────

function OrgSearch({
  posMap, profiles, onJumpUser, onJumpPosition,
}: {
  posMap: Map<number, import("@/redux/services/dashboard/organogramTypes").Position>;
  profiles: import("@/redux/services/dashboard/organogramTypes").StaffProfileListItem[];
  onJumpUser: (u: UserInline) => void;
  onJumpPosition: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as Array<{ kind: "person"; user: UserInline; sub: string } | { kind: "position"; id: number; title: string; sub: string }>;
    const out: Array<{ kind: "person"; user: UserInline; sub: string } | { kind: "position"; id: number; title: string; sub: string }> = [];
    for (const p of profiles) {
      if ((p.user.full_name + " " + (p.job_title ?? "") + " " + (p.department?.name ?? "")).toLowerCase().includes(term)) {
        out.push({ kind: "person", user: p.user, sub: `${p.job_title || ""} · ${p.department?.name || ""}` });
      }
      if (out.length >= 6) break;
    }
    for (const p of posMap.values()) {
      if ((p.title + " " + p.code).toLowerCase().includes(term)) {
        out.push({ kind: "position", id: p.id, title: p.title, sub: p.code });
      }
      if (out.length >= 10) break;
    }
    return out.slice(0, 8);
  }, [q, profiles, posMap]);

  return (
    <div className="relative w-full max-w-md" ref={ref} onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-indigo-300 focus-within:bg-white">
        <Search className="size-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, seats, departments, codes…"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
        />
        {q && <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button>}
      </div>
      {open && q.trim() && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {results.length ? results.map((r) => (
            <button
              key={r.kind === "person" ? "u" + r.user.id : "p" + r.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { if (r.kind === "person") onJumpUser(r.user); else onJumpPosition(r.id); setOpen(false); setQ(""); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-indigo-50"
            >
              {r.kind === "person" ? <OrgAvatar user={r.user} size={28} /> : <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500"><Briefcase className="size-3.5" /></span>}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-slate-700">{r.kind === "person" ? r.user.full_name : r.title}</div>
                <div className="truncate text-[11px] text-slate-400">{r.sub}</div>
              </div>
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", r.kind === "person" ? "bg-indigo-50 text-indigo-500" : "bg-teal-50 text-teal-600")}>{r.kind}</span>
            </button>
          )) : <div className="px-3 py-5 text-center text-[12.5px] text-slate-400">No matches for “{q}”</div>}
        </div>
      )}
    </div>
  );
}
