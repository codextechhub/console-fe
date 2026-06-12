// Visual primitives for the Tasks module, built on the console design system:
// Badge for status/priority pills, gray-0x/black-01 tokens, font-mont, and a
// completion ring recoloured to the app's primary blue (green when complete).

import { useEffect, useRef, useState } from "react";
import { Check, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Person, TaskPriority, TaskStatusKey } from "@/redux/services/dashboard/todoTypes";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  RING_DONE,
  RING_PRIMARY,
  RING_TRACK,
  STATUS_BADGE,
  STATUS_LABEL,
  avatarTint,
} from "../lib/todo-helpers";

// ── Pills ───────────────────────────────────────────────────────────────────
export function PriorityTag({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant={PRIORITY_BADGE[priority]} className="font-mont">
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: TaskStatusKey }) {
  return (
    <Badge variant={STATUS_BADGE[status]} className="font-mont">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function AssignedTag({ by, fallbackName }: { by: Person | null; fallbackName?: string }) {
  const name = by?.name || fallbackName;
  const label = name ? `Assigned by ${name.split(" ")[0]}` : "Assigned";
  return (
    <Badge variant="outline" className="gap-1 font-mont text-gray-06">
      <Flag className="size-3" /> {label}
    </Badge>
  );
}

// ── Avatar (initials, soft tint by id) ────────────────────────────────────────
export function Avatar({ person, size = 40 }: { person: Person; size?: number }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-mont font-semibold", avatarTint(person.id))}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {person.initials}
    </span>
  );
}

// ── Completion ring (primary blue, green when complete) ───────────────────────
export function ProgressRing({
  pct,
  size = 96,
  stroke = 9,
  showLabel = true,
  sublabel,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  sublabel?: string | null;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    // setState lives only inside the rAF callback (never synchronously in the
    // effect body), so this stays compiler-safe. 0ms duration for reduced motion.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0 : 700;
    const start = performance.now();
    const from = shownRef.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (pct - from) * e);
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const offset = circ - (shown / 100) * circ;
  const complete = pct === 100;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={RING_TRACK} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={complete ? RING_DONE : RING_PRIMARY}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.4s ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mont">
          <span className="font-semibold tracking-tight text-black-01" style={{ fontSize: size * 0.26, lineHeight: 1 }}>
            {shown}
            <span style={{ fontSize: size * 0.14 }}>%</span>
          </span>
          {sublabel && (
            <span className="mt-0.5 font-medium text-gray-05" style={{ fontSize: Math.max(10, size * 0.1) }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── On-track / overdue pill ───────────────────────────────────────────────────
export function HealthPill({ overdue }: { overdue: number }) {
  return overdue > 0 ? (
    <Badge variant="rejected" className="gap-1 font-mont">
      <Flag className="size-3" /> {overdue} overdue
    </Badge>
  ) : (
    <Badge variant="success" className="gap-1 font-mont">
      <Check className="size-3" /> On track
    </Badge>
  );
}

export function EmptyState({ msg, icon }: { msg: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-gray-04 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-03 text-gray-05">{icon}</div>
      <p className="mt-3 font-mont text-sm font-medium text-gray-05">{msg}</p>
    </div>
  );
}
