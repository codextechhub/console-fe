// Positions (seats) CRUD (admin). Gated by P.MANAGE_ORGANOGRAM at the page level.
//
// Renders as a collapsible tree ordered by the solid "reports to" line.
// Clicking a row that has direct reports collapses/expands them - no arrow
// indicator, just the click. Vertical guide lines connect siblings at each depth.

import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InfoHint } from "@/components/finance-ui";
import PromptModal from "@/components/modal/prompt-modal";
import { Badge } from "@/components/ui/badge";
import {
  useCreatePositionMutation, useDeletePositionMutation, useGetOrgNodesQuery,
  useGetPositionsQuery, useUpdatePositionMutation,
} from "@/redux/services/dashboard/organogram-api";
import type { Position, PositionWritePayload } from "@/redux/services/dashboard/organogram-types";
import { childNodes, divisionsOf, nodeOption, singleId } from "./org-cascade";
import { cn } from "@/lib/utils";

// ── Tree builder ─────────────────────────────────────────────────────────────

type PosNode = Position & { children: PosNode[] };

function buildPosTree(positions: Position[]): PosNode[] {
  const map = new Map<number, PosNode>(
    positions.map((p) => [p.id, { ...p, children: [] as PosNode[] }]),
  );
  const roots: PosNode[] = [];
  for (const node of map.values()) {
    const parentId = node.reports_to?.id;
    if (parentId != null && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byTitle = (a: PosNode, b: PosNode) => a.title.localeCompare(b.title);
  for (const n of map.values()) n.children.sort(byTitle);
  roots.sort(byTitle);
  return roots;
}

// Flattened representation used for rendering. `guides[i]` = true means draw
// a vertical continuation line at depth i (more siblings remain at that level).
type FlatPos = { node: PosNode; depth: number; isLast: boolean; guides: boolean[] };

function flattenPosTree(roots: PosNode[], collapsed: Set<number>): FlatPos[] {
  const out: FlatPos[] = [];
  function visit(nodes: PosNode[], depth: number, guides: boolean[]) {
    nodes.forEach((node, i) => {
      const isLast = i === nodes.length - 1;
      out.push({ node, depth, isLast, guides: [...guides] });
      if (node.children.length > 0 && !collapsed.has(node.id)) {
        visit(node.children, depth + 1, [...guides, !isLast]);
      }
    });
  }
  visit(roots, 0, []);
  return out;
}

// ── Row component ─────────────────────────────────────────────────────────────

function PosRow({
  item, onToggle, onEdit, onDelete,
}: {
  item: FlatPos;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { node, depth, isLast, guides } = item;
  const hasChildren = node.children.length > 0;
  const filled = node.headcount - node.open_seats;

  return (
    <div
      className={cn(
        "group relative flex items-stretch pr-3 min-h-[44px]",
        "hover:bg-pry-01/20 transition-colors",
        "border-b border-white-02/40 last:border-b-0",
        depth === 0 && "bg-gray-50/80",
        hasChildren && "cursor-pointer select-none",
      )}
      onClick={hasChildren ? onToggle : undefined}
    >
      {/* Base left padding */}
      <div className="w-2 shrink-0" />

      {/* Ancestor guide lines - border-l draws the vertical continuation */}
      {guides.map((showLine, i) => (
        <div key={i} className={cn("w-5 shrink-0", showLine && "border-l border-gray-200")} />
      ))}

      {/* Connector glyph (├ or └) */}
      {depth > 0 && (
        <span className="font-mono text-[11px] text-gray-400 shrink-0 self-center w-4 text-center mr-0.5">
          {isLast ? "└" : "├"}
        </span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 self-center flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2.5">
        <span className={cn(
          "text-sm truncate max-w-[240px]",
          depth === 0 ? "font-semibold text-black-01" : "font-medium text-black-01",
        )}>
          {node.title}
        </span>

        <code className="text-[11px] font-mono text-gray-01 bg-gray-100 rounded px-1.5 py-px shrink-0">
          {node.code}
        </code>

        {node.org_node && (
          <span className="text-[11px] text-gray-01 shrink-0">{node.org_node.name}</span>
        )}

        <span className={cn("text-[11px] shrink-0", node.is_vacant ? "text-amber-600" : "text-gray-01")}>
          {filled}/{node.headcount} filled
        </span>
      </div>

      {/* Right rail */}
      <div className="flex items-center gap-1.5 shrink-0 self-center">
        <Badge variant={node.is_active ? "active" : "inactive"} className="h-5 text-[10px] px-1.5 rounded-sm">
          {node.is_active ? "Active" : "Inactive"}
        </Badge>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="rounded p-1 text-gray-01 hover:bg-pry-01/40 hover:text-primary"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit"
          ><Pencil className="size-3.5" /></button>
          <button
            className="rounded p-1 text-gray-01 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
          ><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  title: string; code: string;
  division_id: string; department_id: string; org_node_id: string;
  reports_to_id: string; headcount: string; is_active: boolean;
}
const empty: FormState = {
  title: "", code: "", division_id: "", department_id: "", org_node_id: "",
  reports_to_id: "", headcount: "1", is_active: true,
};

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PositionManager() {
  // Both allPosRes and allNodesRes drive the tree; no paginated query needed.
  const { data: allPosRes, isLoading } = useGetPositionsQuery({
    page_size: 100,
    ordering: "-updated_at",
  });
  const { data: nodesRes } = useGetOrgNodesQuery({ page_size: 100 });

  const [createPos, { isLoading: creating }] = useCreatePositionMutation();
  const [updatePos, { isLoading: updating }] = useUpdatePositionMutation();
  const [deletePos, { isLoading: deleting }] = useDeletePositionMutation();

  const allPositions = useMemo(
    () => (Array.isArray(allPosRes?.data) ? allPosRes!.data : []),
    [allPosRes],
  );
  const allNodes = useMemo(
    () => (Array.isArray(nodesRes?.data) ? nodesRes!.data : []),
    [nodesRes],
  );
  const posOptions = useMemo(
    () => allPositions.map((p) => ({ value: String(p.id), label: `${p.title} (${p.code})` })),
    [allPositions],
  );

  // ── Tree + collapse state ────────────────────────────────────────────────
  const posRoots = useMemo(() => buildPosTree(allPositions), [allPositions]);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleCollapse = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const flatItems = useMemo(
    () => flattenPosTree(posRoots, collapsed),
    [posRoots, collapsed],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<Position | null>(null);

  // ── Cascade data ─────────────────────────────────────────────────────────
  const divisions = useMemo(() => divisionsOf(allNodes), [allNodes]);
  const deptsOf = (divisionId: string) => childNodes(allNodes, divisionId, "DEPARTMENT");
  const teamsOf = (deptId: string) => childNodes(allNodes, deptId, "TEAM");

  const divisionOptions = useMemo(() => divisions.map(nodeOption), [divisions]);
  const deptOptions = useMemo(
    () => deptsOf(form.division_id).map(nodeOption),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allNodes, form.division_id],
  );
  const teamOptions = useMemo(
    () => teamsOf(form.department_id).map(nodeOption),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allNodes, form.department_id],
  );

  // ── Cascade handlers ──────────────────────────────────────────────────────
  const cascadeFromDivision = (division_id: string) => {
    const department_id = singleId(deptsOf(division_id));
    const org_node_id = department_id ? singleId(teamsOf(department_id)) : "";
    return { division_id, department_id, org_node_id };
  };
  const setDivision = (division_id: string) =>
    setForm((f) => ({ ...f, ...cascadeFromDivision(division_id) }));
  const setDepartment = (department_id: string) =>
    setForm((f) => ({ ...f, department_id, org_node_id: singleId(teamsOf(department_id)) }));

  // ── Open dialog ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    const division_id = singleId(divisions);
    setForm({ ...empty, ...(division_id ? cascadeFromDivision(division_id) : {}) });
    setOpen(true);
  };
  const openEdit = (p: Position) => {
    setEditing(p);
    const node = allNodes.find((n) => n.id === p.org_node?.id);
    let division_id = "", department_id = "", org_node_id = "";
    if (node?.kind === "TEAM") {
      org_node_id = String(node.id);
      department_id = String(node.parent?.id ?? "");
      const dept = allNodes.find((n) => String(n.id) === department_id);
      division_id = String(dept?.parent?.id ?? "");
    } else if (node?.kind === "DEPARTMENT") {
      department_id = String(node.id);
      division_id = String(node.parent?.id ?? "");
    } else if (node?.kind === "DIVISION") {
      division_id = String(node.id);
    }
    setForm({
      title: p.title, code: p.code,
      division_id, department_id, org_node_id,
      reports_to_id: p.reports_to ? String(p.reports_to.id) : "",
      headcount: String(p.headcount), is_active: p.is_active,
    });
    setOpen(true);
  };

  // ── Guards + preview ─────────────────────────────────────────────────────
  const noDivisions      = divisions.length === 0;
  const noDeptsInDiv     = !!form.division_id && deptsOf(form.division_id).length === 0;
  const noTeamsInDept    = !!form.department_id && teamsOf(form.department_id).length === 0;
  const editingNodeKind  = editing ? allNodes.find((n) => n.id === editing.org_node?.id)?.kind : undefined;
  const legacyNode       = !!editing && !!editingNodeKind && editingNodeKind !== "TEAM" && !form.org_node_id;
  const nameOf = (id: string) => allNodes.find((n) => String(n.id) === id)?.name ?? "";
  const previewChain = [form.division_id, form.department_id, form.org_node_id].filter(Boolean).map(nameOf);

  const canSubmit = !!form.title.trim() && !!form.code.trim() && !!form.org_node_id;

  const submit = () => {
    if (!canSubmit) return;
    const body: PositionWritePayload = {
      title: form.title.trim(), code: form.code.trim(),
      org_node_id: Number(form.org_node_id),
      reports_to_id: form.reports_to_id ? Number(form.reports_to_id) : null,
      headcount: Number(form.headcount) || 1,
      is_active: form.is_active,
    };
    const action = editing ? updatePos({ id: editing.id, body }) : createPos(body);
    action.unwrap()
      .then(() => { toast.success(editing ? "Position updated." : "Position created."); setOpen(false); })
      .catch(() => {});
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deletePos(toDelete.id).unwrap()
      .then(() => { toast.success("Position deleted."); setToDelete(null); })
      .catch(() => {});
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <InfoHint ariaLabel="About organisation positions" className="text-gray-01">
          Seats in the org chart ordered by the solid reporting line. Click a row to expand or collapse its direct reports.
        </InfoHint>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" /> New Position</Button>
      </div>

      {/* ── Tree view ── */}
      <div className="rounded-lg border border-white-02 overflow-hidden">
        {isLoading && flatItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-01">Loading…</div>
        ) : flatItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-01">
            No positions yet. Create the org structure first, then add positions.
          </div>
        ) : (
          <div>
            {flatItems.map((item) => (
              <PosRow
                key={item.node.id}
                item={item}
                onToggle={() => toggleCollapse(item.node.id)}
                onEdit={() => openEdit(item.node)}
                onDelete={() => setToDelete(item.node)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Position" : "New Position"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomInput id="p-title" label="Title" isRequired value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <CustomInput id="p-code" label="Code" isRequired placeholder="ENG-BE-SR" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />

            <SearchSelect
              label="Division" isRequired revealOnSearch
              options={divisionOptions} value={form.division_id}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="Type a division name or code…" disabled={noDivisions}
            />
            <SearchSelect
              label="Department" isRequired revealOnSearch
              options={deptOptions} value={form.department_id}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={form.division_id ? "Type a department name or code…" : "Pick a division first"}
              disabled={!form.division_id || noDeptsInDiv}
            />
            <SearchSelect
              label="Team" isRequired revealOnSearch containerClass="sm:col-span-2"
              options={teamOptions} value={form.org_node_id}
              onChange={(e) => setForm((f) => ({ ...f, org_node_id: e.target.value }))}
              placeholder={form.department_id ? "Type a team name or code…" : "Pick a department first"}
              disabled={!form.department_id || noTeamsInDept}
            />

            {noDivisions && <Hint>No divisions exist yet - create the org structure (Division → Department → Team) before adding positions.</Hint>}
            {noDeptsInDiv && <Hint>No departments under {nameOf(form.division_id)} yet - create one (and a team) first.</Hint>}
            {noTeamsInDept && <Hint>No teams under {nameOf(form.department_id)} yet - create one first; positions attach to teams.</Hint>}
            {legacyNode && !noDeptsInDiv && !noTeamsInDept && (
              <Hint>
                This position is attached to {editing?.org_node?.name} ({editingNodeKind?.toLowerCase()}), not a team - pick its team to save.
              </Hint>
            )}

            {previewChain.length > 0 && (
              <div className="sm:col-span-2 flex flex-wrap items-center gap-1 rounded-md bg-gray-03 px-3 py-2 text-xs text-gray-06">
                <span className="font-semibold">Will sit in:</span>
                {previewChain.map((name, i) => (
                  <span key={`${name}-${i}`} className="inline-flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3 text-gray-02" />}
                    <span className="font-medium text-black-01">{name}</span>
                  </span>
                ))}
                <ChevronRight className="size-3 text-gray-02" />
                <span className="italic">{form.title.trim() || "new position"}</span>
              </div>
            )}

            <SearchSelect
              label="Reports to (solid)" revealOnSearch
              options={posOptions} value={form.reports_to_id}
              onChange={(e) => setForm((f) => ({ ...f, reports_to_id: e.target.value }))}
              placeholder="Type a position title or code…"
            />
            <CustomInput
              id="p-headcount" label="Headcount" type="number" min={1}
              value={form.headcount} onChange={(e) => setForm((f) => ({ ...f, headcount: e.target.value }))}
            />
            <label className="flex items-center justify-between gap-2 rounded-md border border-white-02 px-3 py-2 text-sm sm:col-span-2">
              Active <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={creating || updating} disabled={!canSubmit}>
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromptModal
        isOpen={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete}
        title="Delete position?"
        description={`This permanently removes "${toDelete?.title}". Seats with assignment history block deletion (PROTECT).`}
        onConfirmText="Delete" canCancel loading={deleting}
        onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
      />
    </div>
  );
}
