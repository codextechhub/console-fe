// A person's task list with the All / In Progress / Completed / Overdue filter
// (with live counts) and stable sorting: overdue first, then in-progress, then
// completed; each bucket by deadline. Wraps TaskRow.

import { useMemo, useState } from "react";
import { List } from "lucide-react";
import type { Task, TaskStatusKey } from "@/redux/services/dashboard/todo-types";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "../lib/todo-helpers";
import { EmptyState } from "./primitives";
import { TaskRow } from "./task-row";

type FilterKey = "ALL" | TaskStatusKey;
const FILTERS: FilterKey[] = ["ALL", "IN_PROGRESS", "COMPLETED", "OVERDUE"];
const FILTER_LABEL: Record<FilterKey, string> = { ALL: "All", ...STATUS_LABEL };
const SORT_ORDER: Record<TaskStatusKey, number> = { OVERDUE: 0, IN_PROGRESS: 1, COMPLETED: 2 };

function StatusFilter({ value, onChange, tasks }: { value: FilterKey; onChange: (f: FilterKey) => void; tasks: Task[] }) {
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { ALL: tasks.length, COMPLETED: 0, IN_PROGRESS: 0, OVERDUE: 0 };
    tasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [tasks]);

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-md bg-gray-03 p-1">
      {FILTERS.map((f) => {
        const on = value === f;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded font-mont text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring px-3.5 py-2",
              on ? "bg-white text-black-01 shadow-sm" : "text-gray-05 hover:text-gray-01",
            )}
          >
            {FILTER_LABEL[f]}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                on ? "bg-pry-01 text-primary" : "bg-gray-02/40 text-gray-05",
              )}
            >
              {counts[f]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PersonTaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  canModify,
  togglingId,
  emptyMsg,
}: {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  canModify?: (task: Task) => boolean;
  togglingId?: number | null;
  emptyMsg: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const shown = useMemo(() => {
    const list = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);
    return [...list].sort(
      (a, b) =>
        SORT_ORDER[a.status] - SORT_ORDER[b.status] ||
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );
  }, [tasks, filter]);

  return (
    <div>
      <div className="mb-5">
        <StatusFilter value={filter} onChange={setFilter} tasks={tasks} />
      </div>
      {shown.length === 0 ? (
        <EmptyState
          icon={<List className="size-5" />}
          msg={tasks.length === 0 ? emptyMsg : `No ${FILTER_LABEL[filter].toLowerCase()} tasks.`}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              canModify={canModify ? canModify(t) : false}
              toggling={togglingId === t.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
