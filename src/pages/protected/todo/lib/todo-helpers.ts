// Shared helpers for the Tasks module: enum→label maps, deterministic avatar
// tints, deadline formatting. Colour comes from the console design tokens
// (primary #4A659D, green-01, gray-0x) - NOT the prototype's navy/amber.

import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";
import type { TaskPriority, TaskStatusKey } from "@/redux/services/dashboard/todo-types";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

// ── Labels ────────────────────────────────────────────────────────────────────
export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const STATUS_LABEL: Record<TaskStatusKey, string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  OVERDUE: "Overdue",
};

// ── Badge variants (console design system - see components/ui/badge.tsx) ───────
export const STATUS_BADGE: Record<TaskStatusKey, BadgeVariant> = {
  COMPLETED: "success", // green-01 tint
  IN_PROGRESS: "pending", // yellow-01 tint (work still open)
  OVERDUE: "rejected", // destructive tint
};

export const PRIORITY_BADGE: Record<TaskPriority, BadgeVariant> = {
  HIGH: "rejected",
  MEDIUM: "pending",
  LOW: "inactive",
};

// Ring colours pulled from the design tokens (an SVG stroke needs literal values).
export const RING_PRIMARY = "#4A659D"; // --primary
export const RING_DONE = "#16A34A"; // --color-green-01
export const RING_TRACK = "#E5E7EB"; // neutral gray-200

// ── Avatar tint (deterministic by id) ─────────────────────────────────────────
// Soft tailwind tints, mirroring the org module's avatar palette style.
const AVATAR_TINTS = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
];
export function avatarTint(id: number | string): string {
  const n = typeof id === "number" ? id : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_TINTS[Math.abs(n) % AVATAR_TINTS.length];
}

// ── Dates ─────────────────────────────────────────────────────────────────────
function atMidnight(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function fmtDate(iso: string): string {
  return atMidnight(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((atMidnight(iso).getTime() - today.getTime()) / 86400000);
}

// Human deadline string: "3d overdue", "Due today", "Due in 5d", or a full date.
export function relativeDeadline(iso: string, done: boolean): string {
  if (done) return fmtDate(iso);
  const n = daysUntil(iso);
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n <= 7) return `Due in ${n}d`;
  return fmtDate(iso);
}

// The backend's success_response does `data or {}`, so an EMPTY list serialises
// to `{}` (an object), not `[]`. Coerce any non-array payload to [].
export function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
