import { Link } from "react-router";
import { ChevronRight, CornerUpLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import type {
  ApprovalWorklistItem,
  ReturnedSubmissionItem,
} from "@/redux/services/dashboard/overview-types";
import { DocumentRef } from "../workflow/components/workflow-ui";

const R = routesPath.PROTECTED;

// Past this age a decision is officially lingering: the row's age turns red.
const STALE_AFTER_DAYS = 3;

function ageDays(iso: string | null): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

function ageLabel(since: string): string {
  // Past the stale line, "how long has this waited" is the message; an
  // absolute date makes the reader do that arithmetic themselves.
  const days = ageDays(since);
  return days >= STALE_AFTER_DAYS ? `Waiting ${Math.floor(days)} days` : formatRelativeDate(since);
}

/**
 * `variant="row"` sits right-aligned beside the title (desktop); on phones the
 * title needs the full width, so the row stamp hides and a `variant="inline"`
 * copy rides in the sub-line instead.
 */
function AgeStamp({ since, variant }: { since: string | null; variant: "row" | "inline" }) {
  if (!since) return null;
  const stale = ageDays(since) >= STALE_AFTER_DAYS;
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap text-xs",
        stale ? "font-medium text-red-500" : "text-gray-400",
        variant === "row" ? "hidden sm:inline" : "sm:hidden",
      )}
    >
      {variant === "inline" && <span aria-hidden> · </span>}
      {ageLabel(since)}
    </span>
  );
}

/**
 * The dashboard worklist: the actual decisions and returned submissions, not
 * their counts. Each approval row lands on the existing decision screen - the
 * one surface that knows quorum and rejection semantics - so the dashboard
 * never grows a second decision UI that can drift.
 */
export function AttentionWorklist({
  approvals,
  returned,
  pendingTotal,
}: {
  approvals: ApprovalWorklistItem[];
  returned: ReturnedSubmissionItem[];
  pendingTotal: number;
}) {
  return (
    <div className="divide-y divide-gray-50">
      {approvals.map((item) => (
        <Link
          key={item.id}
          to={R.WORKFLOW.APPROVAL_DETAIL(item.id)}
          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/[0.025]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-pry-01 text-primary">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm">
                <DocumentRef documentType={item.document_type} objectId={item.document_object_id} />
              </span>
              <Badge variant="pending" className="hidden shrink-0 sm:inline-flex">
                {item.stage_label}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {item.requested_by_name ? `From ${item.requested_by_name}` : "Awaiting your decision"}
              <AgeStamp since={item.awaiting_since} variant="inline" />
            </p>
          </div>
          <AgeStamp since={item.awaiting_since} variant="row" />
          <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-primary" />
        </Link>
      ))}

      {returned.map((item) => (
        <Link
          key={item.id}
          to={R.WORKFLOW.SUBMISSION_DETAIL(item.id)}
          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-primary/[0.025]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
            <CornerUpLeft className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm">
              <DocumentRef documentType={item.document_type} objectId={item.document_object_id} />
            </span>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              Returned to you for changes
              <AgeStamp since={item.returned_at} variant="inline" />
            </p>
          </div>
          <AgeStamp since={item.returned_at} variant="row" />
          <ChevronRight className="size-4 shrink-0 text-gray-300 group-hover:text-primary" />
        </Link>
      ))}

      {pendingTotal > approvals.length && (
        <Link
          to={R.WORKFLOW.APPROVALS}
          className="flex items-center justify-center gap-1 px-2 py-2.5 text-xs font-semibold text-primary hover:underline"
        >
          View all {pendingTotal} pending approvals
        </Link>
      )}
    </div>
  );
}
