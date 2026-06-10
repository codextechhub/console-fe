// Positions (seats) CRUD (admin). Gated by P.MANAGE_ORGANOGRAM at the page level.

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

const HEADERS = ["Title", "Code", "Org Unit", "Reports to", "Headcount", "Active", ""];

interface FormState {
  title: string;
  code: string;
  org_node_id: string;
  reports_to_id: string;
  headcount: string;
  is_active: boolean;
}
const empty: FormState = { title: "", code: "", org_node_id: "", reports_to_id: "", headcount: "1", is_active: true };

export default function PositionManager() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPositionsQuery({ page, page_size: 20 });
  const { data: allPosRes } = useGetPositionsQuery({ page_size: 100 });
  const { data: nodesRes } = useGetOrgNodesQuery({ page_size: 100 });

  const [createPos, { isLoading: creating }] = useCreatePositionMutation();
  const [updatePos, { isLoading: updating }] = useUpdatePositionMutation();
  const [deletePos, { isLoading: deleting }] = useDeletePositionMutation();

  const items = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const nodeOptions = useMemo(() => (Array.isArray(nodesRes?.data) ? nodesRes!.data : []).map((d) => ({ value: String(d.id), label: `${d.name} · ${d.kind}` })), [nodesRes]);
  const posOptions = useMemo(() => [{ value: "", label: "— none (top of org) —" }, ...(Array.isArray(allPosRes?.data) ? allPosRes!.data : []).map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` }))], [allPosRes]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<Position | null>(null);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Position) => {
    setEditing(p);
    setForm({
      title: p.title, code: p.code,
      org_node_id: String(p.org_node.id),
      reports_to_id: p.reports_to ? String(p.reports_to.id) : "",
      headcount: String(p.headcount), is_active: p.is_active,
    });
    setOpen(true);
  };

  const canSubmit = form.title.trim() && form.code.trim() && form.org_node_id;
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
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-01">Seats in the org chart. The solid reporting line is position → position via “reports to”.</p>
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
            <SearchSelect label="Org unit" isRequired options={nodeOptions} value={form.org_node_id} onChange={(e) => setForm((f) => ({ ...f, org_node_id: e.target.value }))} placeholder="Select org unit" />
            <SearchSelect label="Reports to (solid)" options={posOptions} value={form.reports_to_id} onChange={(e) => setForm((f) => ({ ...f, reports_to_id: e.target.value }))} placeholder="— none —" />
            <CustomInput id="p-headcount" label="Headcount" type="number" min={1} value={form.headcount} onChange={(e) => setForm((f) => ({ ...f, headcount: e.target.value }))} />
            <label className="flex items-center justify-between gap-2 rounded-md border border-white-02 px-3 py-2 text-sm">
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
