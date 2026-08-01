// People tab — top-down org CHART: each person is a card; connector lines drop
// from a card to its reports' row (the `.org-chart` CSS in index.css). Derived
// from the server position tree + holders, enriched with staff-profile status.

import { ChevronDown, UserPlus } from "lucide-react";
import type { UserInline } from "@/redux/services/dashboard/organogram-types";
import { cn } from "@/lib/utils";
import { countAllReports, nextFocusedNode, type PeopleNode, type ProfileMap } from "../lib/org-helpers";
import { ActingBadge, OrgAvatar, VacantBadge } from "./org-primitives";

export interface PeopleCtx {
  expanded: Set<string>;
  fullyExpanded: Set<string>;
  focusedPath: readonly string[];
  toggle: (id: string) => void;
  openUser: (u: UserInline) => void;
  highlightId: string | null;
  profiles: ProfileMap;
}

function VacantPersonCard({ node }: { node: Extract<PeopleNode, { kind: "vacant" }> }) {
  return (
    <li>
      <div data-card className="flex w-52 flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-300">
          <UserPlus className="size-4" />
        </span>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-medium text-slate-400">Vacant seat</span>
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {node.positionTitle} · {node.positionCode}
          </div>
          <div className="mt-1.5 flex justify-center"><VacantBadge /></div>
        </div>
      </div>
    </li>
  );
}

function PersonNode({ node, ctx }: { node: Extract<PeopleNode, { kind: "person" }>; ctx: PeopleCtx }) {
  const profile = ctx.profiles.get(node.user.id);
  const status = profile?.employment_status ?? null;
  const jobTitle = profile?.job_title || node.positionTitle;
  const directReports = node.children.filter((c) => c.kind === "person").length;
  const totalReports = countAllReports(node.children);
  const hasChildren = node.children.length > 0;
  const open = ctx.expanded.has(node.user.id);
  const focusedChild = nextFocusedNode(ctx.focusedPath, node.user.id);
  const focusedOnly = open && focusedChild !== null && !ctx.fullyExpanded.has(node.user.id);
  const visibleChildren = focusedOnly
    ? node.children.filter((child) => child.kind === "person" && child.user.id === focusedChild)
    : node.children;
  const highlighted = ctx.highlightId === node.user.id;

  return (
    <li data-uid={node.user.id}>
      <div
        data-card
        className={cn(
          "group flex w-52 flex-col items-center rounded-2xl border bg-white px-3 pb-2.5 pt-4 shadow-sm transition-all",
          highlighted
            ? "border-indigo-400 ring-2 ring-indigo-300"
            : "border-slate-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
        )}
        style={highlighted ? { animation: "pulseHL 1.4s ease-out" } : undefined}
      >
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
          className="flex w-full cursor-pointer flex-col items-center text-center"
        >
          <OrgAvatar user={node.user} size={44} status={status} />
          <div className="mt-2 flex max-w-full items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-slate-800">{node.user.full_name}</span>
            {node.isActing && <ActingBadge />}
          </div>
          <span className="max-w-full truncate text-[12px] text-slate-500">
            {node.isActing ? `Acting ${node.positionTitle}` : jobTitle}
          </span>
        </div>

        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              ctx.toggle(node.user.id);
            }}
            aria-expanded={open}
            className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
            {directReports} | {totalReports}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <ul>
          {visibleChildren.map((c) =>
            c.kind === "person" ? (
              // Key per seat (user + position): one person can hold several
              // positions among siblings, so user.id alone collides.
              <PersonNode key={`${c.user.id}-${c.positionId}`} node={c} ctx={ctx} />
            ) : (
              <VacantPersonCard key={c.key} node={c} />
            ),
          )}
        </ul>
      )}
    </li>
  );
}

export function PeopleTree({ roots, ctx }: { roots: PeopleNode[]; ctx: PeopleCtx }) {
  return (
    <div className="org-chart inline-flex min-w-full justify-center">
      <ul>
        {roots.map((node) =>
          node.kind === "person" ? (
            <PersonNode key={`${node.user.id}-${node.positionId}`} node={node} ctx={ctx} />
          ) : (
            <VacantPersonCard key={node.key} node={node} />
          ),
        )}
      </ul>
    </div>
  );
}
