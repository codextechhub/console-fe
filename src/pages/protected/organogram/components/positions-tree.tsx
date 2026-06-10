// Positions tab — the server-built position tree (solid reporting lines),
// enriched with headcount + matrix lines from the supporting lists.

import { Briefcase, ChevronRight, UserPlus } from "lucide-react";
import type {
  MatrixReport,
  OrganogramNode,
  Position,
  UserInline,
} from "@/redux/services/dashboard/organogramTypes";
import { cn } from "@/lib/utils";
import { ActingBadge, HeadcountMeter, HolderStack, MatrixIndicator, VacantBadge } from "./org-primitives";

export interface PositionsCtx {
  expanded: Set<number>;
  toggle: (id: number) => void;
  openPosition: (id: number) => void;
  openUser: (u: UserInline) => void;
  highlightId: number | null;
  showMatrix: boolean;
  posMap: Map<number, Position>;
  matrixOut: Map<number, MatrixReport[]>;
  matrixIn: Map<number, MatrixReport[]>;
  actingSet: Set<string>;
}

function SeatNode({ node, depth, isLast, ctx }: { node: OrganogramNode; depth: number; isLast: boolean; ctx: PositionsCtx }) {
  const pos = ctx.posMap.get(node.id);
  const headcount = pos?.headcount ?? Math.max(node.holders.length, 1);
  const filled = pos ? pos.headcount - pos.open_seats : node.holders.length;
  const kids = node.direct_reports;
  const hasChildren = kids.length > 0;
  const open = ctx.expanded.has(node.id);
  const out = ctx.matrixOut.get(node.id) ?? [];
  const inc = ctx.matrixIn.get(node.id) ?? [];
  const mxCount = out.length + inc.length;
  const highlighted = ctx.highlightId === node.id;
  const fullyVacant = node.holders.length === 0;
  const actingFilled = node.holders.length > 0 && node.holders.every((u) => ctx.actingSet.has(`${u.id}@${node.id}`));

  return (
    <li className="relative" data-pid={node.id} style={{ paddingLeft: depth === 0 ? 0 : 28 }}>
      {depth > 0 && <span className="absolute bg-slate-200" style={{ left: 12, top: 0, width: 1, height: isLast ? 36 : "100%" }} />}
      {depth > 0 && <span className="absolute bg-slate-200" style={{ left: 12, top: 36, width: 16, height: 1 }} />}

      <div
        className={cn(
          "group my-1 flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-sm transition-all",
          fullyVacant ? "border-dashed border-slate-300 bg-slate-50/70" : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md",
          highlighted && "!border-indigo-400 ring-2 ring-indigo-300",
        )}
        style={highlighted ? { animation: "pulseHL 1.4s ease-out" } : undefined}
      >
        <button
          onClick={() => hasChildren && ctx.toggle(node.id)}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
            hasChildren ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700" : "invisible",
          )}
          aria-expanded={hasChildren ? open : undefined}
        >
          <ChevronRight className="size-4 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }} />
        </button>

        <button onClick={() => ctx.openPosition(node.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", fullyVacant ? "bg-slate-100 text-slate-300" : "bg-indigo-50 text-indigo-500")}>
            {fullyVacant ? <UserPlus className="size-4" /> : <Briefcase className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("truncate text-[14px] font-semibold", fullyVacant ? "text-slate-500" : "text-slate-800")}>{node.title}</span>
              {fullyVacant && <VacantBadge />}
              {actingFilled && !fullyVacant && <ActingBadge />}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10.5px] text-slate-500">{node.code}</span>
              {node.org_node && <span className="hidden truncate text-[12px] text-slate-400 sm:inline">{node.org_node.name}</span>}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <MatrixIndicator count={ctx.showMatrix ? mxCount : 0} />
          {node.holders.length > 0 && <HolderStack users={node.holders} onPick={ctx.openUser} />}
          <HeadcountMeter filled={filled} total={headcount} />
        </div>
      </div>

      {ctx.showMatrix && mxCount > 0 && (
        <div className="mb-1 ml-12 flex flex-wrap gap-1.5">
          {out.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50/70 px-2 py-1 text-[11px] text-teal-800 ring-1 ring-teal-100">
              <span className="inline-block h-0 w-4 border-t-2 border-dotted border-teal-500" />
              dotted → <span className="font-semibold">{m.reports_to.title}</span>
              {m.relationship_label && <span className="text-teal-600/70">· {m.relationship_label}</span>}
            </span>
          ))}
          {inc.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-100">
              <span className="inline-block h-0 w-4 border-t-2 border-dotted border-slate-400" />
              <span className="font-semibold">{m.position.title}</span> → dotted here
            </span>
          ))}
        </div>
      )}

      {hasChildren && (
        <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <ul>
              {kids.map((k, i) => (
                <SeatNode key={k.id} node={k} depth={depth + 1} isLast={i === kids.length - 1} ctx={ctx} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

export function PositionsTree({ tree, ctx }: { tree: OrganogramNode[]; ctx: PositionsCtx }) {
  return (
    <ul>
      {tree.map((node, i) => (
        <SeatNode key={node.id} node={node} depth={0} isLast={i === tree.length - 1} ctx={ctx} />
      ))}
    </ul>
  );
}
