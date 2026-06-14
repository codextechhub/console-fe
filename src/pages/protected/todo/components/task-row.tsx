// A single task row: the done checkbox, title + assigned-by tag, the
// metric/target/department/deadline grid, status + priority pills, and an
// optional edit/delete menu (shown only when the viewer may modify the task).

import { Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/redux/services/dashboard/todo-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { relativeDeadline } from "../lib/todo-helpers";
import { AssignedTag, PriorityTag, StatusBadge } from "./primitives";

function Meta({
  label,
  value,
  muted,
  danger,
}: {
  label: string;
  value: string;
  muted?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="font-mont text-[10px] font-semibold uppercase tracking-wide text-gray-05">{label}</div>
      <div
        className={cn(
          "truncate font-mont text-[13px] font-semibold",
          danger ? "text-destructive" : muted ? "text-gray-02" : "text-gray-01",
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  canModify = false,
  toggling = false,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  canModify?: boolean;
  toggling?: boolean;
}) {
  const done = task.is_done;
  const overdue = task.status === "OVERDUE";
  const showMenu = canModify && (onEdit || onDelete);

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-md border px-4 py-4 transition-colors",
        done ? "border-transparent bg-gray-04" : "border bg-white hover:border-primary/40",
      )}
    >
      <button
        onClick={() => onToggle(task)}
        disabled={toggling}
        aria-pressed={done}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:opacity-50",
          done ? "border-green-01 bg-green-01" : "border-gray-02 bg-transparent hover:border-primary",
        )}
      >
        {done && <Check className="size-3.5 text-white" strokeWidth={3.5} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className={cn("font-mont text-[15px] font-semibold leading-tight", done ? "text-gray-05 line-through" : "text-black-01")}>
            {task.title}
          </h4>
          {!task.is_self_set && <AssignedTag by={task.assigned_by} fallbackName={task.assigned_by_name} />}
        </div>
        {task.description && (
          <p className={cn("mt-1 font-mont text-sm leading-snug", done ? "text-gray-02" : "text-gray-05")}>{task.description}</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          <Meta label="Metric" value={task.metric} muted={done} />
          <Meta label="Target" value={task.target} muted={done} />
          <Meta label="Department" value={task.department} muted={done} />
          <Meta label="Deadline" value={relativeDeadline(task.deadline, done)} muted={done} danger={overdue} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={task.status} />
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Task actions"
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-05 transition-colors hover:bg-gray-03 hover:text-gray-01 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="size-4" /> Edit task
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                    <Trash2 className="size-4" /> Delete task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <PriorityTag priority={task.priority} />
      </div>
    </div>
  );
}
