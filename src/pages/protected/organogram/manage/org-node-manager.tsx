// Org nodes CRUD (admin): Division → Department → Team. Gated by
// P.MANAGE_ORGANOGRAM at the page level; backend enforces the tiering.
//
// The parent picker cascades: a DEPARTMENT picks its Division; a TEAM picks a
// Division first, then a Department scoped to it. Levels with exactly one
// candidate auto-fill; selects reveal options only once the user types (name
// or code both match); a live breadcrumb previews where the node will sit.

import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PromptModal from "@/components/modal/prompt-modal";
import { Badge } from "@/components/ui/badge";
import {
  useCreateOrgNodeMutation, useDeleteOrgNodeMutation, useGetOrgNodesQuery,
  useGetPositionsQuery, useUpdateOrgNodeMutation,
} from "@/redux/services/dashboard/organogramApi";
import type { OrgNode, OrgNodeKind, OrgNodeWritePayload } from "@/redux/services/dashboard/organogramTypes";
import { childNodes, divisionsOf, nodeOption, singleId, suggestCode } from "./org-cascade";

const HEADERS = ["Name", "Code", "Tier", "Parent", "Head", "Active", ""];

const KIND_OPTS = [
  { value: "DIVISION", label: "Division" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEAM", label: "Team" },
];
const KIND_LABEL: Record<OrgNodeKind, string> = { DIVISION: "Division", DEPARTMENT: "Department", TEAM: "Team" };

interface FormState {
  name: string;
  code: string;
  kind: OrgNodeKind;
  // UI-only cascade step for TEAM (the saved parent is always parent_id).
  division_id: string;
  parent_id: string;
  head_position_id: string;
  description: string;
  is_active: boolean;
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

export default function OrgNodeManager() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetOrgNodesQuery({ page, page_size: 20 });
  const { data: allNodesRes } = useGetOrgNodesQuery({ page_size: 100 });
  const { data: posRes } = useGetPositionsQuery({ page_size: 100 });

  const [createNode, { isLoading: creating }] = useCreateOrgNodeMutation();
  const [updateNode, { isLoading: updating }] = useUpdateOrgNodeMutation();
  const [deleteNode, { isLoading: deleting }] = useDeleteOrgNodeMutation();

  const items = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const allNodes = useMemo(() => (Array.isArray(allNodesRes?.data) ? allNodesRes!.data : []), [allNodesRes]);
  const posOptions = useMemo(
    () => (Array.isArray(posRes?.data) ? posRes!.data : []).map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` })),
    [posRes],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgNode | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [initialForm, setInitialForm] = useState<FormState>(empty);
  const [codeTouched, setCodeTouched] = useState(false);
  const [toDelete, setToDelete] = useState<OrgNode | null>(null);

  // ── cascade data ─────────────────────────────────────────────────────────
  const divisions = useMemo(() => divisionsOf(allNodes), [allNodes]);
  const deptsOf = (divisionId: string) => childNodes(allNodes, divisionId, "DEPARTMENT");

  const divisionOptions = useMemo(
    () => divisions.map(nodeOption),
    [divisions],
  );
  // TEAM step 2: departments scoped to the chosen division.
  const deptOptions = useMemo(
    () => deptsOf(form.division_id).map(nodeOption),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allNodes, form.division_id],
  );

  // ── open dialog ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setCodeTouched(false);
    // Default kind is DEPARTMENT — auto-fill its division when there's only one.
    setForm({ ...empty, parent_id: singleId(divisions) });
    setInitialForm(empty);
    setOpen(true);
  };
  const openEdit = (n: OrgNode) => {
    setEditing(n);
    setCodeTouched(true); // never overwrite an existing code from the name
    // Back-fill the cascade: a team's division is its parent department's parent.
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

  // ── cascade handlers (auto-fill single options at each level) ─────────────
  const setKind = (kind: OrgNodeKind) =>
    setForm((f) => {
      const next = { ...f, kind, division_id: "", parent_id: "" };
      if (kind === "DEPARTMENT") {
        next.parent_id = singleId(divisions);
      } else if (kind === "TEAM") {
        next.division_id = singleId(divisions);
        if (next.division_id) next.parent_id = singleId(deptsOf(next.division_id));
      }
      return next;
    });

  const setDivision = (division_id: string) =>
    setForm((f) => ({ ...f, division_id, parent_id: singleId(deptsOf(division_id)) }));

  const setName = (name: string) =>
    setForm((f) => ({ ...f, name, code: codeTouched ? f.code : suggestCode(name) }));

  // ── guards + preview ─────────────────────────────────────────────────────
  const needsDivision = form.kind !== "DIVISION";
  const noDivisions = needsDivision && divisions.length === 0;
  const noDeptsInDivision =
    form.kind === "TEAM" && !!form.division_id && deptsOf(form.division_id).length === 0;

  const nameOf = (id: string) => allNodes.find((n) => String(n.id) === id)?.name ?? "";
  const previewChain: string[] =
    form.kind === "DEPARTMENT" && form.parent_id
      ? [nameOf(form.parent_id)]
      : form.kind === "TEAM" && form.division_id
        ? [nameOf(form.division_id), ...(form.parent_id ? [nameOf(form.parent_id)] : [])]
        : [];

  const isDirty = !editing || (
    form.name !== initialForm.name ||
    form.code !== initialForm.code ||
    form.kind !== initialForm.kind ||
    form.parent_id !== initialForm.parent_id ||
    form.head_position_id !== initialForm.head_position_id ||
    form.description !== initialForm.description ||
    form.is_active !== initialForm.is_active
  );

  const canSubmit =
    !!form.name.trim() && !!form.code.trim() && (form.kind === "DIVISION" || !!form.parent_id) && isDirty;

  const submit = () => {
    if (!canSubmit) return;
    const body: OrgNodeWritePayload = {
      name: form.name.trim(),
      code: form.code.trim(),
      kind: form.kind,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      head_position_id: form.head_position_id ? Number(form.head_position_id) : null,
      description: form.description,
      is_active: form.is_active,
    };
    const action = editing ? updateNode({ id: editing.id, body }) : createNode(body);
    action.unwrap().then(() => { toast.success(editing ? "Org node updated." : "Org node created."); setOpen(false); }).catch(() => {});
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteNode(toDelete.id).unwrap().then(() => { toast.success("Org node deleted."); setToDelete(null); }).catch(() => {});
  };

  const tierVariant: Record<OrgNodeKind, "active" | "inactive" | "outline"> = { DIVISION: "outline", DEPARTMENT: "active", TEAM: "inactive" };

  const tableData = useMemo(
    () => items.map((n) => ({
      name: <span className="text-sm font-medium text-black-01">{n.name}</span>,
      code: <span className="font-mono text-xs text-gray-01">{n.code}</span>,
      tier: <Badge variant={tierVariant[n.kind]}>{KIND_LABEL[n.kind]}</Badge>,
      parent: <span className="text-sm">{n.parent?.name || "—"}</span>,
      head: (
        <span className="text-sm">
          {n.head?.full_name
            ? n.head.full_name
            : n.head_position?.title
              ? <span className="text-gray-01 italic">{n.head_position.title} <span className="not-italic text-xs">(vacant)</span></span>
              : "—"}
        </span>
      ),
      active: <Badge variant={n.is_active ? "active" : "inactive"}>{n.is_active ? "Active" : "Inactive"}</Badge>,
      actions: (
        <div className="flex items-center gap-1">
          <button className="rounded p-1.5 text-gray-01 hover:bg-pry-01/40 hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(n); }} title="Edit"><Pencil className="size-4" /></button>
          <button className="rounded p-1.5 text-gray-01 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setToDelete(n); }} title="Delete"><Trash2 className="size-4" /></button>
        </div>
      ),
      _raw: n,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-01">Tiered org units: Division → Department → Team. Set a head position whose holder leads the unit.</p>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" /> New Org Node</Button>
      </div>

      <CustomTable
        tableHeaderList={HEADERS}
        tableBodyList={tableData}
        loading={isLoading || isFetching}
        currentPage={page}
        totalPage={data?.pagination.totalPages ?? 0}
        onPageChange={(p) => setPage(Number(p))}
        onRowClick={(row) => row?._raw && openEdit(row._raw)}
        emptyText="No org nodes yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Org Node" : "New Org Node"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomInput id="n-name" label="Name" isRequired value={form.name} onChange={(e) => setName(e.target.value)} />
            <CustomInput
              id="n-code" label="Code" isRequired placeholder="ENG" value={form.code}
              onChange={(e) => { setCodeTouched(true); setForm((f) => ({ ...f, code: e.target.value })); }}
            />
            <SearchSelect label="Tier" isRequired clearable={false} options={KIND_OPTS} value={form.kind} onChange={(e) => setKind(e.target.value as OrgNodeKind)} />

            {/* Parent cascade — type to search (name or code both match). */}
            {form.kind === "DIVISION" && (
              <div className="flex items-end pb-2 text-xs text-gray-05">Top level — divisions have no parent.</div>
            )}
            {form.kind === "DEPARTMENT" && (
              <SearchSelect
                label="Division" isRequired revealOnSearch
                options={divisionOptions} value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                placeholder="Type a division name or code…"
                disabled={noDivisions}
              />
            )}
            {form.kind === "TEAM" && (
              <>
                <SearchSelect
                  label="Division" isRequired revealOnSearch
                  options={divisionOptions} value={form.division_id}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="Type a division name or code…"
                  disabled={noDivisions}
                />
                <SearchSelect
                  label="Department" isRequired revealOnSearch
                  options={deptOptions} value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  placeholder={form.division_id ? "Type a department name or code…" : "Pick a division first"}
                  disabled={!form.division_id || noDeptsInDivision}
                />
              </>
            )}

            {noDivisions && <Hint>No divisions exist yet — create a Division first, then come back to this {KIND_LABEL[form.kind].toLowerCase()}.</Hint>}
            {noDeptsInDivision && (
              <Hint>No departments under {nameOf(form.division_id)} yet — create one first, then add this team.</Hint>
            )}

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

            <SearchSelect label="Head position" containerClass="sm:col-span-2" revealOnSearch options={posOptions} value={form.head_position_id} onChange={(e) => setForm((f) => ({ ...f, head_position_id: e.target.value }))} placeholder="Type a position title or code…" />
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
            <Button onClick={submit} loading={creating || updating} disabled={!canSubmit}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromptModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete org node?"
        description={`This permanently removes "${toDelete?.name}". Child nodes or positions block deletion (PROTECT).`}
        onConfirmText="Delete"
        canCancel
        loading={deleting}
        onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
      />
    </div>
  );
}
