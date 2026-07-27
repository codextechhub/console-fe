// Org nodes CRUD (admin): Division → Department → Team.
// Gated by P.MANAGE_ORGANOGRAM at the page level; backend enforces tiering.
//
// The hierarchy renders as a collapsible tree: clicking a Division row
// collapses/expands its departments; clicking a Department row does the same
// for its teams. No arrow indicator — just click the row.

import { useMemo, useState } from "react";
import { ChevronRight, Info, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PromptModal from "@/components/modal/prompt-modal";
import { Badge } from "@/components/ui/badge";
import {
  useCreateOrgNodeMutation, useDeleteOrgNodeMutation, useGetOrgNodesQuery,
  useGetPositionsQuery, useUpdateOrgNodeMutation,
} from "@/redux/services/dashboard/organogram-api";
import type { OrgNode, OrgNodeKind, OrgNodeWritePayload } from "@/redux/services/dashboard/organogram-types";
import { childNodes, divisionsOf, nodeOption, singleId, suggestCode } from "./org-cascade";
import { cn } from "@/lib/utils";

// ── Tree builder ─────────────────────────────────────────────────────────────

type TreeTeam = OrgNode;
type TreeDept = OrgNode & { teams: TreeTeam[] };
type TreeDiv  = OrgNode & { depts: TreeDept[] };

function buildOrgTree(nodes: OrgNode[]): { divisions: TreeDiv[]; orphans: OrgNode[] } {
  const divNodes  = nodes.filter((n) => n.kind === "DIVISION");
  const deptNodes = nodes.filter((n) => n.kind === "DEPARTMENT");
  const teamNodes = nodes.filter((n) => n.kind === "TEAM");

  const placedDeptIds = new Set<number>();
  const placedTeamIds = new Set<number>();

  const divisions: TreeDiv[] = divNodes.map((div) => {
    const depts = deptNodes
      .filter((d) => d.parent?.id === div.id)
      .map((dept) => {
        const teams = teamNodes.filter((t) => t.parent?.id === dept.id);
        teams.forEach((t) => placedTeamIds.add(t.id));
        placedDeptIds.add(dept.id);
        return { ...dept, teams };
      });
    return { ...div, depts };
  });

  const orphans = [
    ...deptNodes.filter((d) => !placedDeptIds.has(d.id)),
    ...teamNodes.filter((t) => !placedTeamIds.has(t.id)),
  ];
  return { divisions, orphans };
}

// ── Row component ─────────────────────────────────────────────────────────────

const TIER_VARIANT: Record<OrgNodeKind, "outline" | "active" | "inactive"> = {
  DIVISION: "outline", DEPARTMENT: "active", TEAM: "inactive",
};
const TIER_LABEL: Record<OrgNodeKind, string> = {
  DIVISION: "Division", DEPARTMENT: "Dept", TEAM: "Team",
};
const CHILD_NOUN: Record<OrgNodeKind, string> = {
  DIVISION: "dept", DEPARTMENT: "team", TEAM: "",
};

function OrgRow({
  node, depth, isLast, hasChildren, deptIsLast,
  onToggle, onEdit, onDelete,
}: {
  node: OrgNode;
  depth: 0 | 1 | 2;
  isLast: boolean;
  hasChildren: boolean;
  deptIsLast?: boolean; // for depth=2: whether the parent dept is last (guide line)
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const headText   = node.head?.full_name ?? node.head_position?.title;
  const headVacant = !node.head?.full_name && !!node.head_position?.title;
  const childCount = node.children_count;
  const childLabel = CHILD_NOUN[node.kind];

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

      {/* Depth-1 guide line column (only for depth=2 teams) */}
      {depth === 2 && (
        <div className={cn("w-5 shrink-0", !deptIsLast && "border-l border-gray-200")} />
      )}

      {/* Connector glyph */}
      {depth > 0 && (
        <span className="font-mono text-[11px] text-gray-400 shrink-0 self-center mr-1 w-4 text-center">
          {isLast ? "└" : "├"}
        </span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 self-center flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2.5">
        <span className={cn(
          "text-sm truncate max-w-[220px]",
          depth === 0 ? "font-semibold text-black-01" : "font-medium text-black-01",
        )}>
          {node.name}
        </span>

        <code className="text-[11px] font-mono text-gray-01 bg-gray-100 rounded px-1.5 py-px shrink-0">
          {node.code}
        </code>

        <Badge variant={TIER_VARIANT[node.kind]} className="h-5 text-[10px] px-1.5 rounded-sm shrink-0">
          {TIER_LABEL[node.kind]}
        </Badge>

        {hasChildren && childCount > 0 && (
          <span className="text-[11px] text-gray-01 shrink-0">
            {childCount} {childLabel}{childCount !== 1 ? "s" : ""}
          </span>
        )}

        {headText && (
          <span className={cn("text-xs shrink-0", headVacant ? "italic text-gray-01" : "text-gray-01")}>
            · {headText}{headVacant ? " (vacant)" : ""}
          </span>
        )}
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
  name: string; code: string; kind: OrgNodeKind;
  division_id: string; parent_id: string;
  head_position_id: string; description: string; is_active: boolean;
}
const empty: FormState = {
  name: "", code: "", kind: "DEPARTMENT", division_id: "", parent_id: "",
  head_position_id: "", description: "", is_active: true,
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

export default function OrgNodeManager() {
  const { data: allNodesRes, isLoading } = useGetOrgNodesQuery({ page_size: 100 });
  const { data: posRes } = useGetPositionsQuery({ page_size: 100 });

  const [createNode, { isLoading: creating }] = useCreateOrgNodeMutation();
  const [updateNode, { isLoading: updating }] = useUpdateOrgNodeMutation();
  const [deleteNode, { isLoading: deleting }] = useDeleteOrgNodeMutation();

  const allNodes = useMemo(
    () => (Array.isArray(allNodesRes?.data) ? allNodesRes!.data : []),
    [allNodesRes],
  );
  const posOptions = useMemo(
    () => (Array.isArray(posRes?.data) ? posRes!.data : [])
      .map((p) => ({ value: String(p.id), label: `${p.title} (${p.code})` })),
    [posRes],
  );

  const { divisions, orphans } = useMemo(() => buildOrgTree(allNodes), [allNodes]);

  // ── Collapse state (empty set = all expanded) ────────────────────────────
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleCollapse = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgNode | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [initialForm, setInitialForm] = useState<FormState>(empty);
  const [codeTouched, setCodeTouched] = useState(false);
  const [toDelete, setToDelete] = useState<OrgNode | null>(null);

  // ── Cascade data ─────────────────────────────────────────────────────────
  const divisions_list = useMemo(() => divisionsOf(allNodes), [allNodes]);
  const deptsOf = (divisionId: string) => childNodes(allNodes, divisionId, "DEPARTMENT");

  const divisionOptions = useMemo(() => divisions_list.map(nodeOption), [divisions_list]);
  const deptOptions = useMemo(
    () => deptsOf(form.division_id).map(nodeOption),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allNodes, form.division_id],
  );

  // ── Open dialog ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setCodeTouched(false);
    const initial = { ...empty, parent_id: singleId(divisions_list) };
    setInitialForm(empty);
    setForm(initial);
    setOpen(true);
  };
  const openEdit = (n: OrgNode) => {
    setEditing(n);
    setCodeTouched(true);
    const parentFull = n.parent ? allNodes.find((x) => x.id === n.parent!.id) : undefined;
    const snapshot: FormState = {
      name: n.name, code: n.code, kind: n.kind,
      division_id: n.kind === "TEAM" ? String(parentFull?.parent?.id ?? "") : "",
      parent_id: n.parent ? String(n.parent.id) : "",
      head_position_id: n.head_position ? String(n.head_position.id) : "",
      description: n.description ?? "", is_active: n.is_active,
    };
    setInitialForm(snapshot);
    setForm(snapshot);
    setOpen(true);
  };

  // ── Cascade handlers ──────────────────────────────────────────────────────
  const setKind = (kind: OrgNodeKind) =>
    setForm((f) => {
      const next = { ...f, kind, division_id: "", parent_id: "" };
      if (kind === "DEPARTMENT") next.parent_id = singleId(divisions_list);
      else if (kind === "TEAM") {
        next.division_id = singleId(divisions_list);
        if (next.division_id) next.parent_id = singleId(deptsOf(next.division_id));
      }
      return next;
    });

  const setDivision = (division_id: string) =>
    setForm((f) => ({ ...f, division_id, parent_id: singleId(deptsOf(division_id)) }));

  const setName = (name: string) =>
    setForm((f) => ({ ...f, name, code: codeTouched ? f.code : suggestCode(name) }));

  // ── Guards + preview ──────────────────────────────────────────────────────
  const needsDivision   = form.kind !== "DIVISION";
  const noDivisions     = needsDivision && divisions_list.length === 0;
  const noDeptsInDiv    = form.kind === "TEAM" && !!form.division_id && deptsOf(form.division_id).length === 0;
  const nameOf = (id: string) => allNodes.find((n) => String(n.id) === id)?.name ?? "";
  const previewChain: string[] =
    form.kind === "DEPARTMENT" && form.parent_id
      ? [nameOf(form.parent_id)]
      : form.kind === "TEAM" && form.division_id
        ? [nameOf(form.division_id), ...(form.parent_id ? [nameOf(form.parent_id)] : [])]
        : [];

  const KIND_LABEL: Record<OrgNodeKind, string> = { DIVISION: "Division", DEPARTMENT: "Department", TEAM: "Team" };

  const isDirty = !editing || (
    form.name !== initialForm.name || form.code !== initialForm.code ||
    form.kind !== initialForm.kind || form.parent_id !== initialForm.parent_id ||
    form.head_position_id !== initialForm.head_position_id ||
    form.description !== initialForm.description || form.is_active !== initialForm.is_active
  );
  const canSubmit =
    !!form.name.trim() && !!form.code.trim() &&
    (form.kind === "DIVISION" || !!form.parent_id) && isDirty;

  const submit = () => {
    if (!canSubmit) return;
    const body: OrgNodeWritePayload = {
      name: form.name.trim(), code: form.code.trim(), kind: form.kind,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      head_position_id: form.head_position_id ? Number(form.head_position_id) : null,
      description: form.description, is_active: form.is_active,
    };
    const action = editing ? updateNode({ id: editing.id, body }) : createNode(body);
    action.unwrap()
      .then(() => { toast.success(editing ? "Org node updated." : "Org node created."); setOpen(false); })
      .catch(() => {});
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteNode(toDelete.id).unwrap()
      .then(() => { toast.success("Org node deleted."); setToDelete(null); })
      .catch(() => {});
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = divisions.length === 0 && orphans.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-4 text-gray-01 cursor-default" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-64 text-xs leading-relaxed">
              Tiered org units: Division → Department → Team. Click a row to expand or collapse its children. Set a head position whose current holder leads the unit.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" /> New Org Node</Button>
      </div>

      {/* ── Tree view ── */}
      <div className="rounded-lg border border-white-02 overflow-hidden">
        {isLoading && isEmpty ? (
          <div className="py-12 text-center text-sm text-gray-01">Loading…</div>
        ) : isEmpty ? (
          <div className="py-12 text-center text-sm text-gray-01">
            No org units yet. Create a Division to get started.
          </div>
        ) : (
          <div>
            {divisions.map((div) => (
              <div key={div.id}>
                <OrgRow
                  node={div} depth={0} isLast={false}
                  hasChildren={div.depts.length > 0}
                  onToggle={() => toggleCollapse(div.id)}
                  onEdit={() => openEdit(div)}
                  onDelete={() => setToDelete(div)}
                />
                {!collapsed.has(div.id) && div.depts.map((dept, di) => {
                  const isLastDept = di === div.depts.length - 1;
                  return (
                    <div key={dept.id}>
                      <OrgRow
                        node={dept} depth={1}
                        isLast={isLastDept}
                        hasChildren={dept.teams.length > 0}
                        onToggle={() => toggleCollapse(dept.id)}
                        onEdit={() => openEdit(dept)}
                        onDelete={() => setToDelete(dept)}
                      />
                      {!collapsed.has(dept.id) && dept.teams.map((team, ti) => (
                        <OrgRow
                          key={team.id} node={team} depth={2}
                          isLast={ti === dept.teams.length - 1}
                          hasChildren={false}
                          deptIsLast={isLastDept}
                          onToggle={() => {}}
                          onEdit={() => openEdit(team)}
                          onDelete={() => setToDelete(team)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}

            {orphans.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border-b border-white-02/60">
                  Unassigned (parent not found)
                </div>
                {orphans.map((n) => (
                  <OrgRow
                    key={n.id} node={n} depth={0} isLast={false} hasChildren={false}
                    onToggle={() => {}} onEdit={() => openEdit(n)} onDelete={() => setToDelete(n)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create / Edit dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Org Node" : "New Org Node"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomInput id="n-name" label="Name" isRequired value={form.name} onChange={(e) => setName(e.target.value)} />
            <CustomInput
              id="n-code" label="Code" isRequired placeholder="ENG" value={form.code}
              onChange={(e) => { setCodeTouched(true); setForm((f) => ({ ...f, code: e.target.value })); }}
            />
            <SearchSelect
              label="Tier" isRequired clearable={false}
              options={[
                { value: "DIVISION", label: "Division" },
                { value: "DEPARTMENT", label: "Department" },
                { value: "TEAM", label: "Team" },
              ]}
              value={form.kind}
              onChange={(e) => setKind(e.target.value as OrgNodeKind)}
            />
            {form.kind === "DIVISION" && (
              <div className="flex items-end pb-2 text-xs text-gray-05">Top level — divisions have no parent.</div>
            )}
            {form.kind === "DEPARTMENT" && (
              <SearchSelect
                label="Division" isRequired revealOnSearch
                options={divisionOptions} value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                placeholder="Type a division name or code…" disabled={noDivisions}
              />
            )}
            {form.kind === "TEAM" && (
              <>
                <SearchSelect
                  label="Division" isRequired revealOnSearch
                  options={divisionOptions} value={form.division_id}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="Type a division name or code…" disabled={noDivisions}
                />
                <SearchSelect
                  label="Department" isRequired revealOnSearch
                  options={deptOptions} value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  placeholder={form.division_id ? "Type a department name or code…" : "Pick a division first"}
                  disabled={!form.division_id || noDeptsInDiv}
                />
              </>
            )}
            {noDivisions && <Hint>No divisions exist yet — create a Division first, then come back to this {KIND_LABEL[form.kind].toLowerCase()}.</Hint>}
            {noDeptsInDiv && <Hint>No departments under {nameOf(form.division_id)} yet — create one first, then add this team.</Hint>}
            {previewChain.length > 0 && (
              <div className="sm:col-span-2 flex flex-wrap items-center gap-1 rounded-md bg-gray-03 px-3 py-2 text-xs text-gray-06">
                <span className="font-semibold">Will sit under:</span>
                {previewChain.map((name, i) => (
                  <span key={`${name}-${i}`} className="inline-flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3 text-gray-02" />}
                    <span className="font-medium text-black-01">{name}</span>
                  </span>
                ))}
                <ChevronRight className="size-3 text-gray-02" />
                <span className="italic">{form.name.trim() || `new ${KIND_LABEL[form.kind].toLowerCase()}`}</span>
              </div>
            )}
            <SearchSelect
              label="Head position" containerClass="sm:col-span-2" revealOnSearch
              options={posOptions} value={form.head_position_id}
              onChange={(e) => setForm((f) => ({ ...f, head_position_id: e.target.value }))}
              placeholder="Type a position title or code…"
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-black-01">Description</label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
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
        title="Delete org node?"
        description={
          toDelete?.children_count
            ? `"${toDelete.name}" has ${toDelete.children_count} child unit${toDelete.children_count === 1 ? "" : "s"}. ` +
              "Delete or re-parent them first — the server will refuse this delete."
            : `This permanently removes "${toDelete?.name}". Seats (positions) still attached to it block deletion.`
        }
        onConfirmText="Delete" canCancel loading={deleting}
        onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
      />
    </div>
  );
}
