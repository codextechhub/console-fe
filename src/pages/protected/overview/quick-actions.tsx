import { useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, Plus, Search, Zap } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { selectPermissions } from "@/redux/features/auth/auth-slice";
import { ACTIONS } from "@/lib/action-palette/registry";
import { filterActionsForPermissions } from "@/lib/action-palette/gate";
import { loadFrecencyScores, recordPick } from "@/lib/action-palette/popularity";
import { rankQuickActions } from "@/lib/action-palette/quick-actions";
import type { ActionDef } from "@/lib/action-palette/types";
import { requestWorkspaceSearchOpen } from "@/components/layout/workspace-search-model";
import { startNavigationProgress } from "@/components/custom/top-progress-bar";
import { cn } from "@/lib/utils";

// Creation verbs get the Plus; other "do" actions the bolt; views the arrow.
const CREATE_PREFIX = /^(create|new|invite|record|raise|upload|add|post|import)-/;
function chipIcon(action: ActionDef) {
  if (action.kind === "view") return ArrowUpRight;
  return CREATE_PREFIX.test(action.id) ? Plus : Zap;
}

/**
 * The user's top quick actions, first thing on the overview. Ranked by the
 * action palette's local frecency (what this user actually launches), gated by
 * the same permission rules as the palette, with curated defaults until they
 * have history. "More" hands over to the full Cmd/Ctrl+E search.
 */
export function QuickActionsRow() {
  const navigate = useNavigate();
  const permissions = useAppSelector(selectPermissions);
  const userId = useAppSelector((s) => (s.auth.user?.id == null ? undefined : String(s.auth.user.id)));

  // Frecency only moves when the user launches an action, so computing once per
  // permission/user change (not per render) is safe and keeps the row stable
  // while the reader is looking at it.
  const actions = useMemo(() => {
    const gated = filterActionsForPermissions(ACTIONS, permissions);
    return rankQuickActions(gated, loadFrecencyScores(userId));
  }, [permissions, userId]);

  const searchHint = useMemo(
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘ E" : "Ctrl E"),
    [],
  );

  const launch = (action: ActionDef) => {
    // Empty query: counts toward frecency without polluting the palette's
    // query-to-pick adaptive map.
    recordPick(userId, action.id, "");
    if ("to" in action.run) {
      startNavigationProgress();
      navigate(action.run.to);
    }
  };

  if (actions.length === 0) return null;

  return (
    <section
      aria-label="Quick actions"
      data-guide="overview.quick-actions"
      className="rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">Move faster</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Quick actions</h2>
          <p className="mt-1 text-xs text-gray-400">Personalized around the work you open most.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
        {actions.map((action, index) => {
          const Icon = chipIcon(action);
          const featured = index < 2;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => launch(action)}
              className={cn(
                "group inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition duration-200 active:scale-[0.98] sm:justify-start",
                featured
                  ? "border-primary bg-primary text-white shadow-[0_8px_18px_rgba(24,119,76,0.16)] hover:-translate-y-0.5 hover:bg-primary/90"
                  : "border-slate-200 bg-slate-50/70 text-black-01 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[0.04] hover:text-primary",
              )}
            >
              <Icon className={cn("size-3.5 shrink-0 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5", featured ? "text-white/80" : "text-gray-400 group-hover:text-primary")} />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={requestWorkspaceSearchOpen}
          className="col-span-2 inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-transparent px-3 py-2.5 text-xs font-semibold text-gray-500 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.025] hover:text-primary sm:col-auto sm:justify-start"
        >
          <Search className="size-3.5" />
          More
          {/* A shortcut hint means nothing on a phone; the tap still opens the
              mobile search sheet. */}
          <kbd className="hidden rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-400 sm:inline">{searchHint}</kbd>
        </button>
        </div>
      </div>
    </section>
  );
}
