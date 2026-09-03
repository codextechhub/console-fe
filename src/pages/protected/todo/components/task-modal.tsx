/**
 * Add / Assign / Edit task modal. One component, three modes:
 *   "add"    - self-log a task (no assignee picker)
 *   "assign" - hand a task down to someone in your area (assignee picker)
 *   "edit"   - edit an existing task's descriptive fields
 * Built on the console's shadcn Dialog + design tokens (primary/gray/font-mont).
 */

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Person,
  Task,
  TaskCreatePayload,
  TaskPriority,
  TaskUpdatePayload,
} from "@/redux/services/dashboard/todo-types";
import { PRIORITY_LABEL } from "../lib/todo-helpers";

export type TaskModalMode = "add" | "assign" | "edit";

const PRIORITIES: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];
const selectCls =
  "w-full rounded-md border bg-white px-3 py-2 font-mont text-sm text-black-01 transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mont text-xs font-semibold uppercase tracking-wide text-gray-05">{label}</span>
      {children}
      {error && <span className="mt-1 block font-mont text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}

interface FormState {
  title: string;
  description: string;
  metric: string;
  target: string;
  deadline: string;
  priority: TaskPriority;
  assignee_id: string;
}

const blank = (presetTarget?: number | string): FormState => ({
  title: "",
  description: "",
  metric: "",
  target: "",
  deadline: "",
  priority: "MEDIUM",
  assignee_id: presetTarget != null ? String(presetTarget) : "",
});

const fromTask = (t: Task): FormState => ({
  title: t.title,
  description: t.description,
  metric: t.metric,
  target: t.target,
  deadline: t.deadline,
  priority: t.priority,
  assignee_id: String(t.assignee.id),
});

export function TaskModal({
  open,
  onClose,
  mode,
  assigner,
  candidates = [],
  presetTarget,
  editing,
  submitting = false,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  mode: TaskModalMode;
  assigner?: Person | null;
  candidates?: Person[];
  presetTarget?: number | string;
  editing?: Task | null;
  submitting?: boolean;
  onCreate?: (payload: TaskCreatePayload) => void;
  onUpdate?: (id: number, payload: TaskUpdatePayload) => void;
}) {
  const isAssign = mode === "assign";
  const isEdit = mode === "edit";

  const initialAssignee = useMemo(
    () => (presetTarget != null ? String(presetTarget) : candidates[0]?.id != null ? String(candidates[0].id) : ""),
    [presetTarget, candidates],
  );

  const [form, setForm] = useState<FormState>(blank());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset the form whenever a new modal session opens. Adjusting state during
  // render when a derived key changes is the React-recommended, compiler-safe
  // alternative to a reset effect (no synchronous setState inside useEffect).
  const sessionKey = open ? `${mode}:${editing?.id ?? "new"}:${presetTarget ?? ""}` : null;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  if (sessionKey && sessionKey !== activeKey) {
    setActiveKey(sessionKey);
    setForm(isEdit && editing ? fromTask(editing) : blank(presetTarget ?? initialAssignee));
    setErrors({});
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const er: Record<string, string> = {};
    if (!form.title.trim()) er.title = "Give the task a title.";
    if (!form.target.trim()) er.target = "Set a target.";
    if (!form.deadline) er.deadline = "Pick a deadline.";
    if (isAssign && !form.assignee_id) er.assignee_id = "Choose who it's for.";
    setErrors(er);
    if (Object.keys(er).length) return;

    if (isEdit && editing) {
      onUpdate?.(editing.id, {
        title: form.title.trim(),
        description: form.description,
        metric: form.metric,
        target: form.target,
        deadline: form.deadline,
        priority: form.priority,
      });
      return;
    }
    const payload: TaskCreatePayload = {
      title: form.title.trim(),
      description: form.description,
      metric: form.metric,
      target: form.target,
      deadline: form.deadline,
      priority: form.priority,
    };
    if (isAssign && form.assignee_id) payload.assignee_id = Number(form.assignee_id);
    onCreate?.(payload);
  };

  const heading = isEdit ? "Edit task" : isAssign ? "Assign a task" : "Add a task";
  const sub = isEdit
    ? "Update the task's details."
    : isAssign
      ? `It'll show in their list, flagged from ${assigner ? assigner.name.split(" ")[0] : "you"}.`
      : "Log a new KPI commitment.";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mont text-black-01">{heading}</DialogTitle>
          <DialogDescription className="font-mont text-gray-05">{sub}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {isAssign && (
            <Field label="Assign to" error={errors.assignee_id}>
              <select value={form.assignee_id} onChange={set("assignee_id")} className={selectCls}>
                <option value="" disabled>
                  Select a team member…
                </option>
                {candidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.role}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Title" error={errors.title}>
            <Input value={form.title} onChange={set("title")} placeholder="e.g. Close monthly sales pipeline" />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="What does success look like?"
              className="resize-none"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Metric">
              <Input value={form.metric} onChange={set("metric")} placeholder="e.g. Deals closed" />
            </Field>
            <Field label="Target" error={errors.target}>
              <Input value={form.target} onChange={set("target")} placeholder="e.g. 15 deals" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Deadline" error={errors.deadline}>
              <Input type="date" value={form.deadline} onChange={set("deadline")} />
            </Field>
            <Field label="Priority">
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => {
                  const on = form.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-2 font-mont text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on ? "border-primary bg-pry-01 text-primary" : "border bg-white text-gray-05 hover:border-primary/40",
                      )}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting} className="gap-2">
            {!isEdit && <Plus className="size-4" />}
            {submitting ? "Saving…" : isEdit ? "Save changes" : isAssign ? "Assign task" : "Add task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
