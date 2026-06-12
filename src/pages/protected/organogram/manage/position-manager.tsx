// Positions (seats) CRUD (admin). Gated by P.MANAGE_ORGANOGRAM at the page level.
//
// A position always attaches to a TEAM (team → department → division), so the
// unit picker is a three-step cascade with single-option auto-fill at every
// level; selects reveal options only once the user types (name or code match),
// and a breadcrumb previews exactly where the seat will sit.

import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PromptModal from "@/components/modal/prompt-modal";
import { Badge } from "@/components/ui/badge";
import {
  useCreatePositionMutation, useDeletePositionMutation, useGetOrgNodesQuery,
  useGetPositionsQuery, useUpdatePositionMutation,
} from "@/redux/services/dashboard/organogramApi";
import type { Position, PositionWritePayload } from "@/redux/services/dashboard/organogramTypes";
import { childNodes, divisionsOf, nodeOption, singleId } from "./org-cascade";

const HEADERS = ["Title", "Code", "Org Unit", "Reports to", "Headcount", "Active", ""];

interface FormState {
  title: string;
  code: string;
  // Cascade: division and department are UI-only; the TEAM is what's saved.
  division_id: string;
  department_id: string;
  org_node_id: string;
  reports_to_id: string;
  headcount: string;
  is_active: boolean;
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

export default function PositionManager() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPositionsQuery({ page, page_size: 20 });
  const { data: allPosRes } = useGetPositionsQuery({ page_size: 100 });
  const { data: nodesRes } = useGetOrgNodesQuery({ page_size: 100 });

  const [createPos, { isLoading: creating }] = useCreatePositionMutation();
  const [updatePos, { isLoading: updating }] = useUpdatePositionMutation();
  const [deletePos, { isLoading: deleting }] = useDeletePositionMutation();

  const items = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const allNodes = useMemo(() => (Array.isArray(nodesRes?.data) ? nodesRes!.data : []), [nodesRes]);
  const posOptions = useMemo(
    () => (Array.isArray(allPosRes?.data) ? allPosRes!.data : []).map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` })),
    [allPosRes],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<Position | null>(null);

  // ── cascade data ─────────────────────────────────────────────────────────
  const divisions = useMemo(() => divisionsOf(allNodes), [allNodes]);
  const deptsOf = (divisionId: string) => childNodes(allNodes, divisionId, "DEPARTMENT");
  const teamsOf = (deptId: string) => childNodes(allNodes, deptId, "TEAM");

  const divisionOptions = useMemo(
    () => divisions.map(nodeOption),
    [divisions],
  );
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

  // ── cascade handlers (auto-fill single options down the chain) ────────────
  const cascadeFromDivision = (division_id: string) => {
    const department_id = singleId(deptsOf(division_id));
    const org_node_id = department_id ? singleId(teamsOf(department_id)) : "";
    return { division_id, department_id, org_node_id };
  };
  const setDivision = (division_id: string) => setForm((f) => ({ ...f, ...cascadeFromDivision(division_id) }));
  const setDepartment = (department_id: string) =>
    setForm((f) => ({ ...f, department_id, org_node_id: singleId(teamsOf(department_id)) }));

  // ── open dialog ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    const division_id = singleId(divisions);
    setForm({ ...empty, ...(division_id ? cascadeFromDivision(division_id) : {}) });
    setOpen(true);
  };
  const openEdit = (p: Position) => {
    setEditing(p);
    // Back-fill the cascade from the attached node. Legacy seats attached to a
    // department/division (pre team-only rule) back-fill what they can and
    // must be re-pointed at a team before saving.
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

  // ── guards + preview ─────────────────────────────────────────────────────
  const noDivisions = divisions.length === 0;
  const noDeptsInDivision = !!form.division_id && deptsOf(form.division_id).length === 0;
  const noTeamsInDept = !!form.department_id && teamsOf(form.department_id).length === 0;
  // Editing a seat attached to a department/division (pre team-only rule).
  const editingNodeKind = editing ? allNodes.find((n) => n.id === editing.org_node?.id)?.kind : undefined;
  const legacyNode = !!editing && !!editingNodeKind && editingNodeKind !== "TEAM" && !form.org_node_id;

  const nameOf = (id: string) => allNodes.find((n) => String(n.id) === id)?.name ?? "";
  const previewChain = [form.division_id, form.department_id, form.org_node_id]
    .filter(Boolean)
    .map(nameOf);

  const canSubmit = !!form.title.trim() && !!form.code.trim() && !!form.org_node_id;

  const submit = () => {
    if (!canSubmit) return;
    const body: PositionWritePayload = {
      title: form.title.trim(),
      code: form.code.trim(),
      org_node_id: Number(form.org_node_id),
      reports_to_id: form.reports_to_id ? Number(form.reports_to_id) : null,
      headcount: Number(form.headcount) || 1,
      is_active: form.is_active,
    };
    const action = editing ? updatePos({ id: editing.id, body }) : createPos(body);
    action.unwrap().then(() => { toast.success(editing ? "Position updated." : "Position created."); setOpen(false); }).catch(() => {});
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deletePos(toDelete.id).unwrap().then(() => { toast.success("Position deleted."); setToDelete(null); }).catch(() => {});
  };

  const tableData = useMemo(
    () => items.map((p) => ({
      title: <span className="text-sm font-medium text-black-01">{p.title}</span>,
      code: <span className="font-mono text-xs text-gray-01">{p.code}</span>,
      department: <span className="text-sm">{p.org_node?.name || "—"}</span>,
      reports_to: <span className="text-sm">{p.reports_to?.title || "—"}</span>,
      headcount: <span className="text-sm">{p.headcount - p.open_seats}/{p.headcount}</span>,
      active: <Badge variant={p.is_active ? "active" : "inactive"}>{p.is_active ? "Active" : "Inactive"}</Badge>,
      actions: (
        <div className="flex items-center gap-1">
          <button className="rounded p-1.5 text-gray-01 hover:bg-pry-01/40 hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(p); }} title="Edit"><Pencil className="size-4" /></button>
          <button className="rounded p-1.5 text-gray-01 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setToDelete(p); }} title="Delete"><Trash2 className="size-4" /></button>
        </div>
      ),
      _raw: p,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-01">Seats in the org chart. Every position belongs to a team; the solid reporting line is position → position via “reports to”.</p>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" /> New Position</Button>
      </div>

      <CustomTable
        tableHeaderList={HEADERS}
        tableBodyList={tableData}
        loading={isLoading || isFetching}
        currentPage={page}
        totalPage={data?.pagination.totalPages ?? 0}
        onPageChange={(p) => setPage(Number(p))}
        onRowClick={(row) => row?._raw && openEdit(row._raw)}
        emptyText="No positions yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Position" : "New Position"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomInput id="p-title" label="Title" isRequired value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <CustomInput id="p-code" label="Code" isRequired placeholder="ENG-BE-SR" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />

            {/* Team cascade — type to search (name or code both match). */}
            <SearchSelect
              label="Division" isRequired revealOnSearch
              options={divisionOptions} value={form.division_id}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="Type a division name or code…"
              disabled={noDivisions}
            />
            <SearchSelect
              label="Department" isRequired revealOnSearch
              options={deptOptions} value={form.department_id}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={form.division_id ? "Type a department name or code…" : "Pick a division first"}
              disabled={!form.division_id || noDeptsInDivision}
            />
            <SearchSelect
              label="Team" isRequired revealOnSearch containerClass="sm:col-span-2"
              options={teamOptions} value={form.org_node_id}
              onChange={(e) => setForm((f) => ({ ...f, org_node_id: e.target.value }))}
              placeholder={form.department_id ? "Type a team name or code…" : "Pick a department first"}
              disabled={!form.department_id || noTeamsInDept}
            />

            {noDivisions && <Hint>No divisions exist yet — create the org structure (Division → Department → Team) before adding positions.</Hint>}
            {noDeptsInDivision && <Hint>No departments under {nameOf(form.division_id)} yet — create one (and a team) first.</Hint>}
            {noTeamsInDept && <Hint>No teams under {nameOf(form.department_id)} yet — create one first; positions attach to teams.</Hint>}
            {legacyNode && !noDeptsInDivision && !noTeamsInDept && (
              <Hint>
                This position is attached to {editing?.org_node?.name} ({editingNodeKind?.toLowerCase()}), not a team —
                pick its team to save.
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

            <SearchSelect label="Reports to (solid)" revealOnSearch options={posOptions} value={form.reports_to_id} onChange={(e) => setForm((f) => ({ ...f, reports_to_id: e.target.value }))} placeholder="Type a position title or code…" />
            <CustomInput id="p-headcount" label="Headcount" type="number" min={1} value={form.headcount} onChange={(e) => setForm((f) => ({ ...f, headcount: e.target.value }))} />
            <label className="flex items-center justify-between gap-2 rounded-md border border-white-02 px-3 py-2 text-sm sm:col-span-2">
              Active <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={creating || updating} disabled={!canSubmit}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromptModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete position?"
        description={`This permanently removes "${toDelete?.title}". Seats with assignment history block deletion (PROTECT).`}
        onConfirmText="Delete"
        canCancel
        loading={deleting}
        onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
      />
    </div>
  );
}
