// <StatusPill status="POSTED" /> — maps the backend's status vocabularies
// (DocumentStatus, InvoicePaymentStatus, PeriodStatus, payment/collection
// states, etc.) onto the app's existing Badge variants. Unknown statuses still
// render, humanised, with a neutral variant — never a crash.

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "active" | "inactive" | "pending" | "rejected" | "suspended";

// Status → variant. Grouped by meaning so new statuses slot in obviously.
const VARIANT_BY_STATUS: Record<string, BadgeVariant> = {
  // settled / good
  POSTED: "success",
  PAID: "success",
  APPROVED: "success",
  ACTIVE: "active",
  SUCCEEDED: "success",
  COMPLETED: "success",
  OPEN: "success",
  MATCHED: "success",
  RECONCILED: "success",
  SETTLED: "success",
  RESPONDED: "success",
  ISSUED: "success",
  RECEIVED: "success",
  IN_STOCK: "success",
  // in-flight / awaiting
  DRAFT: "pending",
  PENDING: "pending",
  PENDING_APPROVAL: "pending",
  PARTIAL: "pending",
  SOFT_CLOSED: "pending",
  QUEUED: "pending",
  RUNNING: "pending",
  SUBMITTED: "pending",
  SENT: "pending",
  AWAITED: "pending",
  LOW_STOCK: "pending",
  // closed / neutral-terminal
  UNPAID: "inactive",
  CLOSED: "inactive",
  LOCKED: "inactive",
  REVERSED: "inactive",
  CANCELLED: "inactive",
  EXPIRED: "inactive",
  NOT_TRACKED: "inactive",
  // problem
  FAILED: "rejected",
  REJECTED: "rejected",
  BLOCKED: "rejected",
  OVERDUE: "rejected",
  OUT_OF_STOCK: "rejected",
  TERMINATED: "suspended",
  OVER_TOLERANCE: "suspended",
};

function humanise(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusPill({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return <span className="text-gray-05">—</span>;
  const variant = VARIANT_BY_STATUS[status.toUpperCase()] ?? "inactive";
  return (
    <Badge variant={variant} className={cn("font-mont", className)}>
      {humanise(status)}
    </Badge>
  );
}
