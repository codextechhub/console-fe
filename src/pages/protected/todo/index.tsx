// Tasks — Org Accountability. The CX-staff accountability tool: every person owns
// KPI "tasks"; managers see their whole area roll up, drill into reports, add
// their own tasks and assign tasks down their reporting line. Hierarchy, roll-up
// and assignment bounds are all enforced server-side (vs_todo, derived from the
// organogram) — this page just orchestrates the dashboards and the task modal.

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Person, Task, TaskCreatePayload, TaskUpdatePayload } from "@/redux/services/dashboard/todo-types";
import {
  useCreateTodoTaskMutation,
  useDeleteTodoTaskMutation,
  useGetTodoAssignableQuery,
  useGetTodoMineQuery,
  useGetTodoTeamQuery,
  useToggleTodoTaskMutation,
  useUpdateTodoTaskMutation,
} from "@/redux/services/dashboard/todo-api";
import { asArray } from "./lib/todo-helpers";
import { Breadcrumb, MyTasksView, NodeDashboardView } from "./components/node-dashboard";
import { TaskModal, type TaskModalMode } from "./components/task-modal";

type Tab = "team" | "mine";
interface ModalState {
  mode: TaskModalMode;
  preset?: number;
  editing?: Task | null;
}

// App-style tab bar (mirrors src/components/custom/tab.tsx).
function TabBar({ active, onChange, showTeam }: { active: Tab; onChange: (t: Tab) => void; showTeam: boolean }) {
  const tabs: { value: Tab; label: string }[] = [
    ...(showTeam ? [{ value: "team" as Tab, label: "My Team" }] : []),
    { value: "mine", label: "My Tasks" },
  ];
  return (
    <div className="flex h-11 w-fit items-center gap-x-4 rounded-sm bg-white px-1.5 py-1" role="tablist" aria-label="Tasks views">
      {tabs.map((t) => {
        const on = active === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              "h-full min-w-26.75 cursor-pointer rounded bg-transparent px-2 font-mont text-base font-medium text-black-01",
              on && "bg-pry-01",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function TodoPage() {
  const [tab, setTab] = useState<Tab>("team");
  const [focus, setFocus] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data: teamRes, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useGetTodoTeamQuery(
    focus ? { focus } : undefined,
  );
  const { data: mineRes, isLoading: mineLoading, isError: mineError, refetch: refetchMine } = useGetTodoMineQuery();
  const { data: assignableRes } = useGetTodoAssignableQuery();

  const [createTask, { isLoading: creating }] = useCreateTodoTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateTodoTaskMutation();
  const [deleteTask, { isLoading: deletingBusy }] = useDeleteTodoTaskMutation();
  const [toggleTask] = useToggleTodoTaskMutation();

  const team = teamRes?.data;
  const mine = mineRes?.data;
  const assignable = useMemo(() => asArray<Person>(assignableRes?.data), [assignableRes]);

  // A manager is anyone with at least one report (i.e. non-empty assignable set).
  const viewerIsManager = assignable.length > 0;
  const viewerId = mine?.person.id ?? team?.breadcrumb?.[0]?.id ?? 0;
  const viewer = mine?.person ?? team?.breadcrumb?.[0] ?? null;

  // Non-managers only ever see "My Tasks".
  useEffect(() => {
    if (!viewerIsManager && tab !== "mine") setTab("mine");
  }, [viewerIsManager, tab]);

  const effectiveTab: Tab = viewerIsManager ? tab : "mine";

  const goTab = (t: Tab) => {
    setTab(t);
    setFocus(null);
  };

  // ── Drill navigation (breadcrumb is server-provided) ────────────────────────
  const breadcrumb = team?.breadcrumb ?? [];
  const drilled = breadcrumb.length > 1;
  const jumpCrumb = (index: number) => setFocus(index === 0 ? null : breadcrumb[index].id);
  const goBack = () => {
    if (breadcrumb.length <= 1) return;
    const parent = breadcrumb[breadcrumb.length - 2];
    setFocus(breadcrumb.length - 2 === 0 ? null : parent.id);
  };

  // ── Task mutations ──────────────────────────────────────────────────────────
  const onToggle = async (task: Task) => {
    setTogglingId(task.id);
    const completing = !task.is_done;
    // Completing your OWN task asks your reviewer (assigner, else line manager)
    // to look at it. The backend holds the email for 5 s and re-checks the task
    // state at send time, so undoing here cancels the request entirely.
    const selfComplete = completing && task.assignee.id === viewerId;
    try {
      await toggleTask({ id: task.id, done: completing }).unwrap();
      if (selfComplete) {
        toast.success(`"${task.title}" marked as done`, {
          description: "Your reviewer will be notified in 5 seconds.",
          duration: 5_000,
          action: {
            label: "Undo",
            onClick: () => {
              toggleTask({ id: task.id, done: false })
                .unwrap()
                .then(() => toast.info("Completion undone — no review request sent."))
                .catch(() => {});
            },
          },
        });
      }
    } catch {
      /* baseApi surfaces the error toast */
    } finally {
      setTogglingId(null);
    }
  };

  const onCreate = async (payload: TaskCreatePayload) => {
    try {
      await createTask(payload).unwrap();
      toast.success(payload.assignee_id ? "Task assigned." : "Task added.");
      setModal(null);
    } catch {
      /* handled by baseApi */
    }
  };

  const onUpdate = async (id: number, payload: TaskUpdatePayload) => {
    try {
      await updateTask({ id, body: payload }).unwrap();
      toast.success("Task updated.");
      setModal(null);
    } catch {
      /* handled by baseApi */
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTask(deleting.id).unwrap();
      toast.success("Task deleted.");
    } catch {
      /* handled by baseApi */
    } finally {
      setDeleting(null);
    }
  };

  // ── Modal openers ───────────────────────────────────────────────────────────
  const openAdd = () => setModal({ mode: "add" });
  const openAssign = () => setModal({ mode: "assign", preset: focus ?? undefined });
  const openEdit = (task: Task) => setModal({ mode: "edit", editing: task });

  // ── Render ──────────────────────────────────────────────────────────────────
  const showTeam = effectiveTab === "team";
  const loading = showTeam ? teamLoading && !team : mineLoading && !mine;
  const errored = showTeam ? teamError && !team : mineError && !mine;
  const retry = () => (showTeam ? refetchTeam() : refetchMine());

  return (
    <DashboardLayout title="Tasks">
      <main className="min-w-0 px-4.5 py-6 space-y-5 text-black-01">
        {/* Intro row: heading + subtitle left, actions right (house pattern) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold font-mont text-gray-01">
              {showTeam ? "Team Tasks" : "My Tasks"}
            </p>
            <p className="text-xs text-gray-01 mt-0.5">
              {showTeam
                ? "Completion rolls up through your reporting line — open a report to drill in."
                : "Your personal KPI commitments and their deadlines."}
            </p>
          </div>
          <div className="inline-flex items-center gap-3.5">
            {viewerIsManager && showTeam && (
              <Button variant="outline" onClick={openAssign}>
                <Plus /> Assign Task
              </Button>
            )}
            <Button onClick={openAdd}>
              <Plus /> Add Task
            </Button>
          </div>
        </div>

        <TabBar active={effectiveTab} onChange={goTab} showTeam={viewerIsManager} />

        {loading ? (
          <DashboardSkeleton />
        ) : errored ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-white px-6 py-16 text-center">
            <p className="font-mont text-sm font-medium text-gray-05">We couldn’t load your tasks. Please try again.</p>
            <Button variant="outline" onClick={retry} className="mt-4 gap-2">
              <RefreshCw className="size-4" /> Retry
            </Button>
          </div>
        ) : showTeam && team ? (
          <div className="space-y-5">
            {drilled && (
              <div className="flex items-center gap-3">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded font-mont text-sm font-semibold text-gray-05 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring px-2 py-1"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
                <span className="text-gray-02">|</span>
                <Breadcrumb chain={breadcrumb} onJump={jumpCrumb} />
              </div>
            )}
            <NodeDashboardView
              dashboard={team}
              viewerId={viewerId}
              onToggle={onToggle}
              onEdit={openEdit}
              onDelete={setDeleting}
              onOpenReport={setFocus}
              togglingId={togglingId}
            />
          </div>
        ) : mine ? (
          <MyTasksView
            dashboard={mine}
            onToggle={onToggle}
            onEdit={openEdit}
            onDelete={setDeleting}
            togglingId={togglingId}
          />
        ) : null}
      </main>

      <TaskModal
        open={!!modal}
        mode={modal?.mode ?? "add"}
        assigner={viewer}
        candidates={assignable}
        presetTarget={modal?.preset}
        editing={modal?.editing}
        submitting={creating || updating}
        onClose={() => setModal(null)}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be permanently removed. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletingBusy} className="bg-destructive text-white hover:bg-destructive/90">
              {deletingBusy ? "Deleting…" : "Delete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-26 rounded-md bg-white" />
        ))}
      </div>
      <Skeleton className="h-11 w-64 rounded-sm bg-white" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md bg-white" />
        ))}
      </div>
    </div>
  );
}
