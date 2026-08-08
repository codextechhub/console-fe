// Matrix (dotted-line) reports CRUD (admin). Add/remove dotted relationships
// between two positions. Gated by P.MANAGE_ORGANOGRAM at the page level.

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PromptModal from "@/components/modal/prompt-modal";
import {
  useCreateMatrixReportMutation, useDeleteMatrixReportMutation,
  useGetMatrixReportsQuery, useGetPositionsQuery,
} from "@/redux/services/dashboard/organogram-api";
import type { MatrixReport, MatrixReportWritePayload } from "@/redux/services/dashboard/organogram-types";

const HEADERS = ["Position", "Dotted-reports to", "Relationship", ""];

interface FormState {
  position_id: string;
  reports_to_id: string;
  relationship_label: string;
}
const empty: FormState = { position_id: "", reports_to_id: "", relationship_label: "" };

export default function MatrixManager() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetMatrixReportsQuery({ page, page_size: 20 });
  const { data: posRes } = useGetPositionsQuery({ page_size: 100 });

  const [createMatrix, { isLoading: creating }] = useCreateMatrixReportMutation();
  const [deleteMatrix, { isLoading: deleting }] = useDeleteMatrixReportMutation();

  const items = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const posOptions = useMemo(() => (Array.isArray(posRes?.data) ? posRes!.data : []).map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` })), [posRes]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<MatrixReport | null>(null);

  const openCreate = () => { setForm(empty); setOpen(true); };

  const canSubmit = form.position_id && form.reports_to_id && form.position_id !== form.reports_to_id;
  const submit = () => {
    if (!canSubmit) return;
    const body: MatrixReportWritePayload = {
      position_id: Number(form.position_id),
      reports_to_id: Number(form.reports_to_id),
      relationship_label: form.relationship_label.trim(),
    };
    createMatrix(body).unwrap().then(() => { toast.success("Matrix line added."); setOpen(false); }).catch(() => {});
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMatrix(toDelete.id).unwrap().then(() => { toast.success("Matrix line removed."); setToDelete(null); }).catch(() => {});
  };

  const tableData = useMemo(
    () => items.map((m) => ({
      position: <span className="text-sm font-medium text-black-01">{m.position.title}</span>,
      reports_to: <span className="text-sm">{m.reports_to.title}</span>,
      relationship: <span className="text-sm text-gray-01">{m.relationship_label || "-"}</span>,
      actions: (
        <button className="rounded p-1.5 text-gray-01 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setToDelete(m); }} title="Remove"><Trash2 className="size-4" /></button>
      ),
      _raw: m,
    })),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-01">Dotted-line relationships, separate from the solid reporting line. One per position pair.</p>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" /> New Matrix Line</Button>
      </div>

      <CustomTable
        tableHeaderList={HEADERS}
        tableBodyList={tableData}
        loading={isLoading || isFetching}
        currentPage={page}
        totalPage={data?.pagination.totalPages ?? 0}
        onPageChange={(p) => setPage(Number(p))}
        emptyText="No matrix lines yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Matrix Line</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <SearchSelect label="Position" isRequired options={posOptions} value={form.position_id} onChange={(e) => setForm((f) => ({ ...f, position_id: e.target.value }))} placeholder="Select position" />
            <SearchSelect label="Dotted-reports to" isRequired options={posOptions} value={form.reports_to_id} onChange={(e) => setForm((f) => ({ ...f, reports_to_id: e.target.value }))} placeholder="Select position" />
            {form.position_id && form.position_id === form.reports_to_id && (
              <p className="text-xs text-destructive">A position can't have a matrix line to itself.</p>
            )}
            <CustomInput id="m-label" label="Relationship label" placeholder="e.g. Cloud cost oversight" value={form.relationship_label} onChange={(e) => setForm((f) => ({ ...f, relationship_label: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={creating} disabled={!canSubmit}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromptModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove matrix line?"
        description={toDelete ? `Remove the dotted line from "${toDelete.position.title}" to "${toDelete.reports_to.title}"?` : ""}
        onConfirmText="Remove"
        canCancel
        loading={deleting}
        onConfirmClass="bg-error-01 text-white hover:bg-error-01/90"
      />
    </div>
  );
}
