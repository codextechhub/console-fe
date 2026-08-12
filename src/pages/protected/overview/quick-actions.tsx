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
    <section aria-label="Quick actions">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Quick actions</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = chipIcon(action);
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => launch(action)}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-white-02 bg-white px-3 py-2 text-xs font-medium text-black-01 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:border-primary/25 hover:text-primary"
            >
              <Icon className="size-3.5 text-gray-400 transition group-hover:text-primary" />
              {action.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={requestWorkspaceSearchOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-transparent px-3 py-2 text-xs font-medium text-gray-500 transition hover:border-primary/40 hover:text-primary"
        >
          <Search className="size-3.5" />
          More
          {/* A shortcut hint means nothing on a phone; the tap still opens the
              mobile search sheet. */}
          <kbd className="hidden rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-400 sm:inline">{searchHint}</kbd>
        </button>
      </div>
    </section>
  );
}
