import { useMemo } from "react";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPendingApprovalsBellQuery,
  useGetReturnedSubmissionsBellQuery,
} from "@/redux/services/dashboard/workflow-api";
import { humanizeDocumentType } from "@/pages/protected/workflow/components/workflow-format";

/** Kind of notification — extend this union as new feeds are added. */
export type NotificationType = "approval" | "returned";

/** A single notification item (shown expanded on the full notifications page). */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  /** ISO timestamp the event occurred, or null. */
  time: string | null;
  /** Route to open when the item is clicked. */
  href: string;
}

/**
 * A module-level grouping of notifications, shown as one row in the bell
 * dropdown (e.g. "Approvals — 2 awaiting your vote").
 */
export interface NotificationGroup {
  key: string;
  type: NotificationType;
  title: string;
  description: string;
  count: number;
  /** Most recent item time in the group. */
  time: string | null;
  /** Route the group row opens (the module's own list). */
  href: string;
}

const newest = (times: (string | null)[]): string | null =>
  times.filter(Boolean).sort((a, b) => (a! < b! ? 1 : -1))[0] ?? null;

/**
 * Aggregates notifications for the header bell, grouped by module. Feeds:
 *  - Approvals waiting on the current user (approver).
 *  - Submissions returned to the current user for changes (requester).
 * Add more feeds by building their items + a group here (and a matching
 * `NotificationType`). Uses only data the bell already fetches.
 */
// Light polling so the bell updates without navigating. 60s is gentle, and
// skipPollingIfUnfocused pauses it when the tab is in the background.
const POLL = { pollingInterval: 60_000, skipPollingIfUnfocused: true } as const;

export function useNotifications() {
  const { data: pendingData, isLoading: pendingLoading } = useGetPendingApprovalsBellQuery(undefined, POLL);
  const { data: returnedData, isLoading: returnedLoading } = useGetReturnedSubmissionsBellQuery(undefined, POLL);

  const { items, groups } = useMemo(() => {
    const allItems: AppNotification[] = [];
    const allGroups: NotificationGroup[] = [];

    // ── Approvals waiting on me (approver) ───────────────────────────────
    const pending = pendingData?.results ?? [];
    const approvalItems: AppNotification[] = pending
      .map((p) => ({
        id: `approval:${p.id}`,
        type: "approval" as const,
        title: `${humanizeDocumentType(p.document_type)} #${String(p.document_object_id).slice(0, 8)}`,
        description: `Awaiting your vote · ${p.awaiting_on_stage}`,
        // When it reached this approver's queue (stage activation).
        time: p.awaiting_since ?? p.submitted_at,
        href: routesPath.PROTECTED.WORKFLOW.APPROVAL_DETAIL(p.id),
      }))
      .sort((a, b) => (a.time && b.time ? (a.time < b.time ? 1 : -1) : 0));

    allItems.push(...approvalItems);
    if (approvalItems.length) {
      allGroups.push({
        key: "approvals",
        type: "approval",
        title: "Approvals",
        description: `${approvalItems.length} ${approvalItems.length === 1 ? "item" : "items"} awaiting your vote`,
        count: approvalItems.length,
        time: newest(approvalItems.map((i) => i.time)),
        href: routesPath.PROTECTED.WORKFLOW.APPROVALS,
      });
    }

    // ── Submissions returned to me (requester) ───────────────────────────
    const returned = returnedData ?? [];
    const returnedItems: AppNotification[] = returned.map((s) => ({
      id: `returned:${s.id}`,
      type: "returned" as const,
      title: `${humanizeDocumentType(s.document_type)} #${String(s.document_object_id).slice(0, 8)}`,
      description: "Returned to you — needs changes & resubmission",
      time: s.submitted_at,
      href: routesPath.PROTECTED.WORKFLOW.SUBMISSION_DETAIL(s.id),
    }));

    allItems.push(...returnedItems);
    if (returnedItems.length) {
      allGroups.push({
        key: "returned",
        type: "returned",
        title: "Returned to you",
        description: `${returnedItems.length} ${returnedItems.length === 1 ? "submission needs" : "submissions need"} changes`,
        count: returnedItems.length,
        time: newest(returnedItems.map((i) => i.time)),
        href: routesPath.PROTECTED.WORKFLOW.MY_SUBMISSIONS,
      });
    }

    return { items: allItems, groups: allGroups };
  }, [pendingData, returnedData]);

  return { groups, items, count: items.length, isLoading: pendingLoading || returnedLoading };
}
