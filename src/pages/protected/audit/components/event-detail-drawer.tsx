import { useNavigate } from "react-router";
import { Copy, Filter } from "lucide-react";
import { friendlyAction } from "../audit-constants";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/utils/helpers";
import { routesPath } from "@/routes/routes-path";
import { useGetAuditEventDetailQuery } from "@/redux/services/dashboard/audit-api";
import { useState } from "react";

interface Props {
  eventId: string | null;
  onClose: () => void;
  onFilterEntity?: (entity_type: string, entity_id: string) => void;
}

export default function EventDetailDrawer({ eventId, onClose, onFilterEntity }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"diff" | "meta">("diff");
  const { data, isFetching } = useGetAuditEventDetailQuery(eventId ?? "", { skip: !eventId });
  const event = data?.data;

  return (
    <Sheet open={!!eventId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetTitle className="sr-only">Audit event detail</SheetTitle>
        {isFetching && !event && (
          <div className="p-6 text-center text-xs text-gray-01">Loading event…</div>
        )}
        {event && (
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    event.severity === "CRITICAL"
                      ? "suspended"
                      : event.severity === "WARNING"
                      ? "locked"
                      : "active"
                  }
                  className="text-[10px] uppercase"
                >
                  {event.severity}
                </Badge>
                <Badge variant={event.status === "SUCCESS" ? "active" : "suspended"} className="text-[10px] uppercase">
                  {event.status}
                </Badge>
                <span className="text-xs text-gray-01 uppercase font-medium">{event.module_key}</span>
                <span className="text-xs text-gray-01">·</span>
                <span className="text-xs text-gray-01">{formatRelativeDate(event.event_at)}</span>
              </div>
              <p className="text-base font-semibold">{friendlyAction(event.action_type)}</p>
              <p className="text-sm text-gray-01">{event.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded p-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase text-gray-01">Actor</p>
                <p className="text-sm font-medium">{event.actor_user?.full_name || event.actor_user?.email || event.actor_label || "System"}</p>
                <p className="text-[10px] text-gray-01 uppercase">{event.actor_type}</p>
              </div>
              <div className="bg-gray-50 rounded p-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase text-gray-01">Entity</p>
                <p className="text-sm font-medium">{event.entity_label || "—"}</p>
                <p className="text-[10px] text-gray-01 uppercase">{event.entity_type}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1"
                  onClick={() => {
                    onClose();
                    navigate(routesPath.PROTECTED.AUDIT.ENTITY_TRAIL_DETAIL(event.entity_type, event.entity_id));
                  }}
                >
                  Open trail
                </Button>
              </div>
            </div>

            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setTab("diff")}
                className={`px-3 py-2 text-xs font-medium border-b-2 ${
                  tab === "diff" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-01"
                }`}
              >
                Diff
              </button>
              <button
                type="button"
                onClick={() => setTab("meta")}
                className={`px-3 py-2 text-xs font-medium border-b-2 ${
                  tab === "meta" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-01"
                }`}
              >
                Metadata
              </button>
            </div>

            {tab === "diff" && (
              <div className="space-y-2">
                {event.before_data && Object.keys(event.before_data).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-gray-01 mb-1">Before</p>
                    <pre className="bg-red-50 text-xs p-3 rounded overflow-x-auto">
                      {JSON.stringify(event.before_data, null, 2)}
                    </pre>
                  </div>
                )}
                {event.diff_data && Object.keys(event.diff_data).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-gray-01 mb-1">Diff</p>
                    <pre className="bg-emerald-50 text-xs p-3 rounded overflow-x-auto">
                      {JSON.stringify(event.diff_data, null, 2)}
                    </pre>
                  </div>
                )}
                {(!event.before_data || Object.keys(event.before_data).length === 0) &&
                  (!event.diff_data || Object.keys(event.diff_data).length === 0) && (
                    <div className="text-center text-xs text-gray-01 py-6">
                      No state change recorded for this event.
                    </div>
                  )}
              </div>
            )}

            {tab === "meta" && (
              <pre className="bg-gray-50 text-xs p-3 rounded overflow-x-auto">
                {JSON.stringify(event.metadata ?? {}, null, 2)}
              </pre>
            )}

            <div className="flex items-center gap-2 pt-4 border-t">
              <span className="font-mono text-[10px] text-gray-01 flex-1 truncate">{event.id}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => navigator.clipboard.writeText(event.id)}
              >
                <Copy className="size-3" /> Copy ID
              </Button>
              {onFilterEntity && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onFilterEntity(event.entity_type, event.entity_id)}
                >
                  <Filter className="size-3" /> Filter to entity
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
