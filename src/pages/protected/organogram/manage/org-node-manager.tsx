// Org nodes CRUD (admin): Division → Department → Team. Gated by
// P.MANAGE_ORGANOGRAM at the page level; backend enforces the tiering.

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

const HEADERS = ["Name", "Code", "Tier", "Parent", "Head", "Active", ""];

const KIND_OPTS = [
  { value: "DIVISION", label: "Division" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEAM", label: "Team" },
];
// The tier a given kind must sit under (mirrors the backend rule).
const REQUIRED_PARENT_KIND: Record<OrgNodeKind, OrgNodeKind | null> = {
  DIVISION: null,
  DEPARTMENT: "DIVISION",
  TEAM: "DEPARTMENT",
};
const KIND_LABEL: Record<OrgNodeKind, string> = { DIVISION: "Division", DEPARTMENT: "Department", TEAM: "Team" };

interface FormState {
  name: string;
  code: string;
  kind: OrgNodeKind;
  parent_id: string;
  head_position_id: string;
  description: string;
  is_active: boolean;
}
const empty: FormState = { name: "", code: "", kind: "DEPARTMENT", parent_id: "", head_position_id: "", description: "", is_active: true };

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
    () => [{ value: "", label: "— none —" }, ...(Array.isArray(posRes?.data) ? posRes!.data : []).map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` }))],
    [posRes],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgNode | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<OrgNode | null>(null);

  // Parent options are constrained to the tier the selected kind must sit under.
  const requiredParent = REQUIRED_PARENT_KIND[form.kind];
  const parentOptions = useMemo(
    () => [
      { value: "", label: requiredParent ? `— select ${KIND_LABEL[requiredParent]} —` : "— none (top-level) —" },
      ...allNodes.filter((n) => n.kind === requiredParent).map((n) => ({ value: String(n.id), label: n.name })),
    ],
    [allNodes, requiredParent],
  );

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (n: OrgNode) => {
    setEditing(n);
    setForm({
      name: n.name, code: n.code, kind: n.kind,
      parent_id: n.parent ? String(n.parent.id) : "",
      head_position_id: n.head_position ? String(n.head_position.id) : "",
      description: n.description ?? "", is_active: n.is_active,
    });
    setOpen(true);
  };

  // Reset parent when the kind changes (the old parent may be the wrong tier).
  const setKind = (kind: OrgNodeKind) => setForm((f) => ({ ...f, kind, parent_id: "" }));

  const canSubmit = form.name.trim() && form.code.trim() && (!requiredParent || form.parent_id);
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
      head: <span className="text-sm">{n.head?.full_name || "—"}</span>,
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
            <CustomInput id="n-name" label="Name" isRequired value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <CustomInput id="n-code" label="Code" isRequired placeholder="ENG" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <SearchSelect label="Tier" isRequired clearable={false} options={KIND_OPTS} value={form.kind} onChange={(e) => setKind(e.target.value as OrgNodeKind)} />
            <SearchSelect
              label={requiredParent ? `Parent ${KIND_LABEL[requiredParent]}` : "Parent"}
              isRequired={!!requiredParent}
              options={parentOptions}
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
              disabled={!requiredParent}
              placeholder={requiredParent ? `Select ${KIND_LABEL[requiredParent]}` : "Top-level"}
            />
            <SearchSelect label="Head position" containerClass="sm:col-span-2" options={posOptions} value={form.head_position_id} onChange={(e) => setForm((f) => ({ ...f, head_position_id: e.target.value }))} placeholder="— none —" />
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
