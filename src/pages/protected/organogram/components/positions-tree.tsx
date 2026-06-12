// Positions tab — top-down org CHART of the server-built position tree (solid
// reporting lines via the `.org-chart` CSS in index.css), enriched with
// headcount + matrix lines from the supporting lists.

import { Briefcase, ChevronDown, UserPlus } from "lucide-react";
import type {
  MatrixReport,
  OrganogramNode,
  Position,
  UserInline,
} from "@/redux/services/dashboard/organogramTypes";
import { cn } from "@/lib/utils";
import { ActingBadge, HeadcountMeter, HolderStack, VacantBadge } from "./org-primitives";

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

function SeatNode({ node, ctx }: { node: OrganogramNode; ctx: PositionsCtx }) {
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
  const actingFilled =
    node.holders.length > 0 && node.holders.every((u) => ctx.actingSet.has(`${u.id}@${node.id}`));

  return (
    <li data-pid={node.id}>
      <div
        data-card
        className={cn(
          "group flex w-56 flex-col items-center rounded-2xl border px-3 pb-2.5 pt-4 shadow-sm transition-all",
          fullyVacant
            ? "border-dashed border-slate-300 bg-slate-50/70"
            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
          highlighted && "!border-indigo-400 ring-2 ring-indigo-300",
        )}
        style={highlighted ? { animation: "pulseHL 1.4s ease-out" } : undefined}
      >
        <button onClick={() => ctx.openPosition(node.id)} className="flex w-full flex-col items-center text-center">
          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              fullyVacant ? "bg-slate-100 text-slate-300" : "bg-indigo-50 text-indigo-500",
            )}
          >
            {fullyVacant ? <UserPlus className="size-4" /> : <Briefcase className="size-4" />}
          </span>
          <div className="mt-2 flex max-w-full items-center gap-1.5">
            <span className={cn("truncate text-[13.5px] font-semibold", fullyVacant ? "text-slate-500" : "text-slate-800")}>
              {node.title}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10.5px] text-slate-500">{node.code}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {fullyVacant && <VacantBadge />}
            {actingFilled && !fullyVacant && <ActingBadge />}
            <HeadcountMeter filled={filled} total={headcount} />
          </div>
        </button>

        {node.holders.length > 0 && (
          <div className="mt-2">
            <HolderStack users={node.holders} onPick={ctx.openUser} />
          </div>
        )}

        {ctx.showMatrix && mxCount > 0 && (
          <div className="mt-2 flex w-full flex-col gap-1">
            {out.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 truncate rounded-lg bg-teal-50/70 px-2 py-1 text-[10.5px] text-teal-800 ring-1 ring-teal-100">
                <span className="inline-block h-0 w-3.5 shrink-0 border-t-2 border-dotted border-teal-500" />
                <span className="truncate">
                  → <span className="font-semibold">{m.reports_to.title}</span>
                  {m.relationship_label && <span className="text-teal-600/70"> · {m.relationship_label}</span>}
                </span>
              </span>
            ))}
            {inc.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 truncate rounded-lg bg-slate-50 px-2 py-1 text-[10.5px] text-slate-600 ring-1 ring-slate-100">
                <span className="inline-block h-0 w-3.5 shrink-0 border-t-2 border-dotted border-slate-400" />
                <span className="truncate"><span className="font-semibold">{m.position.title}</span> → here</span>
              </span>
            ))}
          </div>
        )}

        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              ctx.toggle(node.id);
            }}
            aria-expanded={open}
            className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
            {kids.length} {kids.length === 1 ? "report" : "reports"}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <ul>
          {kids.map((k) => (
            <SeatNode key={k.id} node={k} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function PositionsTree({ tree, ctx }: { tree: OrganogramNode[]; ctx: PositionsCtx }) {
  return (
    <div className="org-chart inline-flex min-w-full justify-center">
      <ul>
        {tree.map((node) => (
          <SeatNode key={node.id} node={node} ctx={ctx} />
        ))}
      </ul>
    </div>
  );
}
