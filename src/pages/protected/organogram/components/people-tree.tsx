// People tab — humans nested under humans, derived from the server position
// tree + holders (there is no people-tree endpoint). Enriched with staff-profile
// status/job title via the profile map.

import { ChevronRight, PanelRightOpen, UserPlus } from "lucide-react";
import type { UserInline } from "@/redux/services/dashboard/organogramTypes";
import { cn } from "@/lib/utils";
import { countAllReports, type PeopleNode, type ProfileMap } from "../lib/org-helpers";
import { ActingBadge, DeptChip, OrgAvatar, ReportsBadge, StatusPill, VacantBadge } from "./org-primitives";

export interface PeopleCtx {
  expanded: Set<string>;
  toggle: (id: string) => void;
  openUser: (u: UserInline) => void;
  openPosition: (id: number) => void;
  highlightId: string | null;
  profiles: ProfileMap;
}

function VacantPersonNode({ node, isLast }: { node: Extract<PeopleNode, { kind: "vacant" }>; isLast: boolean }) {
  return (
    <li className="relative" style={{ paddingLeft: 28 }}>
      <span className="absolute bg-slate-200" style={{ left: 12, top: 0, width: 1, height: isLast ? 32 : "100%" }} />
      <span className="absolute bg-slate-200" style={{ left: 12, top: 32, width: 16, height: 1 }} />
      <div className="my-1 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-300">
          <UserPlus className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Vacant seat</span>
            <VacantBadge />
          </div>
          <div className="text-xs text-slate-400">
            {node.positionTitle} · {node.positionCode}
          </div>
        </div>
      </div>
    </li>
  );
}

function PersonNode({ node, depth, isLast, ctx }: { node: Extract<PeopleNode, { kind: "person" }>; depth: number; isLast: boolean; ctx: PeopleCtx }) {
  const profile = ctx.profiles.get(node.user.id);
  const status = profile?.employment_status ?? null;
  const jobTitle = profile?.job_title || node.positionTitle;
  const directReports = node.children.filter((c) => c.kind === "person").length;
  const totalReports = countAllReports(node.children);
  const hasChildren = node.children.length > 0;
  const open = ctx.expanded.has(node.user.id);
  const highlighted = ctx.highlightId === node.user.id;

  return (
    <li className="relative" data-uid={node.user.id} style={{ paddingLeft: depth === 0 ? 0 : 28 }}>
      {depth > 0 && <span className="absolute bg-slate-200" style={{ left: 12, top: 0, width: 1, height: isLast ? 34 : "100%" }} />}
      {depth > 0 && <span className="absolute bg-slate-200" style={{ left: 12, top: 34, width: 16, height: 1 }} />}

      <div
        className={cn(
          "group my-1 flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-all",
          highlighted ? "border-indigo-400 ring-2 ring-indigo-300" : "border-slate-200 hover:border-indigo-200 hover:shadow-md",
        )}
        style={highlighted ? { animation: "pulseHL 1.4s ease-out" } : undefined}
      >
        <button
          onClick={() => hasChildren && ctx.toggle(node.user.id)}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
            hasChildren ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700" : "invisible",
          )}
          aria-expanded={hasChildren ? open : undefined}
        >
          <ChevronRight className="size-4 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }} />
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => ctx.openUser(node.user)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              ctx.openUser(node.user);
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <OrgAvatar user={node.user} size={40} status={status} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[14px] font-semibold text-slate-800">{node.user.full_name}</span>
              {node.isActing && <ActingBadge />}
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="truncate text-[12.5px] text-slate-500">{node.isActing ? `Acting ${node.positionTitle}` : jobTitle}</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <DeptChip name={node.departmentName} onClick={(e) => { e.stopPropagation(); ctx.openPosition(node.positionId); }} />
            {status && <StatusPill status={status} />}
            <ReportsBadge direct={directReports} total={totalReports} />
          </div>
        </div>

        <button
          onClick={() => ctx.openUser(node.user)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-indigo-50 hover:text-indigo-600 group-hover:opacity-100"
          title="Details"
        >
          <PanelRightOpen className="size-4" />
        </button>
      </div>

      {hasChildren && (
        <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <ul>
              {node.children.map((c, i) => {
                const last = i === node.children.length - 1;
                return c.kind === "person" ? (
                  <PersonNode key={c.user.id} node={c} depth={depth + 1} isLast={last} ctx={ctx} />
                ) : (
                  <VacantPersonNode key={c.key} node={c} isLast={last} />
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

export function PeopleTree({ roots, ctx }: { roots: PeopleNode[]; ctx: PeopleCtx }) {
  return (
    <ul>
      {roots.map((node, i) =>
        node.kind === "person" ? (
          <PersonNode key={node.user.id} node={node} depth={0} isLast={i === roots.length - 1} ctx={ctx} />
        ) : (
          <VacantPersonNode key={node.key} node={node} isLast={i === roots.length - 1} />
        ),
      )}
    </ul>
  );
}
