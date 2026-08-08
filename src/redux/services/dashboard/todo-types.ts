// Types for the vs_todo module - "Tasks - Org Accountability".
// Backend mounted at .../v1/todo/*. The reporting hierarchy that powers roll-up
// and assignment is derived live from the CX organogram on the server, so the
// frontend just renders the dashboards it returns - it never re-derives the tree.

// Enums are UPPERCASE on the wire (Django TextChoices); map to labels in the UI.
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type TaskStatusKey = "COMPLETED" | "IN_PROGRESS" | "OVERDUE";

// Compact person card the dashboards draw (no department - tasks carry that).
export interface Person {
  id: number;
  name: string;
  role: string;
  initials: string;
}

// Roll-up counts for a set of tasks (own or area). `pct` is 0–100, done/total.
export interface TaskStats {
  total: number;
  done: number;
  in_progress: number;
  overdue: number;
  pct: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  metric: string;
  target: string;
  deadline: string; // YYYY-MM-DD
  priority: TaskPriority;
  department: string;
  assignee: Person;
  assigned_by: Person | null;
  assigned_by_name: string;
  is_done: boolean;
  completed_at: string | null;
  status: TaskStatusKey;
  is_self_set: boolean;
  created_at: string;
  updated_at: string;
}

// One direct report's headline on a manager's team dashboard: the person plus
// their *area* roll-up (themselves + everyone beneath them).
export interface ReportCard {
  person: Person;
  is_manager: boolean;
  area_stats: TaskStats;
}

// The full "My Team" dashboard for one focused node (manager or report).
export interface NodeDashboard {
  person: Person;
  is_manager: boolean;
  own_tasks: Task[];
  own_stats: TaskStats;
  area_stats: TaskStats;
  reports: ReportCard[];
  breadcrumb: Person[]; // root viewer → focused person
}

// The "My Tasks" dashboard for the logged-in user.
export interface MineDashboard {
  person: Person;
  tasks: Task[];
  stats: TaskStats;
}

// ── Write payloads ────────────────────────────────────────────────────────────

// Create a task. Omit `assignee_id` (or set it to yourself) for a self-set task;
// otherwise it is an assignment to someone in your area.
export interface TaskCreatePayload {
  title: string;
  description?: string;
  metric?: string;
  target?: string;
  deadline: string;
  priority: TaskPriority;
  assignee_id?: number;
}

// Edit a task's descriptive fields (ownership/assignment is fixed at creation).
export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  metric?: string;
  target?: string;
  deadline?: string;
  priority?: TaskPriority;
}

export interface DataEnvelope<T> {
  message?: string;
  data: T;
}
