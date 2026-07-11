import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/redux/services/tickets-api";

const STATUS_BADGE: Record<TicketStatus, string> = {
  OPEN: "bg-primary/10 text-primary",
  ASSIGNED: "bg-violet-500/10 text-violet-600",
  IN_PROGRESS: "bg-yellow-01/10 text-yellow-01",
  RESOLVED: "bg-green-01/10 text-green-01",
  CLOSED: "bg-gray-05/10 text-gray-05",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={cn("font-mont text-xs", STATUS_BADGE[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}
