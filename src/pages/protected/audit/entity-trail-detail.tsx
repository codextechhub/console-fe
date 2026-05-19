import { useParams } from "react-router";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetEntityTrailDetailQuery } from "@/redux/services/dashboard/auditApi";
import { formatRelativeDate } from "@/utils/helpers";
import { useState } from "react";
import EventDetailDrawer from "./components/event-detail-drawer";

export default function EntityTrailDetail() {
  const params = useParams<{ entity_type: string; entity_id: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useGetEntityTrailDetailQuery(
    { entity_type: params.entity_type!, entity_id: params.entity_id! },
    { skip: !params.entity_type || !params.entity_id },
  );

  const trail = data?.data?.trail;
  const events = data?.data?.events ?? [];

  return (
    <DashboardLayout title={trail ? (trail.entity_label || trail.entity_type) : "Entity Trail"} hasBack>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <p className="font-semibold font-mont text-gray-01">
            {trail ? (trail.entity_label || trail.entity_type) : "Entity Trail"}
          </p>
          <Button variant="white" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 bg-white rounded-md">
            <p className="text-sm font-medium text-destructive">Trail not found or failed to load.</p>
          </div>
        ) : isLoading ? (
          <div className="text-center text-xs text-gray-01 py-6">Loading trail…</div>
        ) : trail ? (
          <>
            <div className="bg-white rounded-md p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="inactive" className="text-[10px] uppercase">{trail.entity_type}</Badge>
                <p className="text-base font-semibold">{trail.entity_label || trail.entity_id}</p>
              </div>
              <p className="font-mono text-xs text-gray-01">{trail.entity_id}</p>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div>
                  <p className="text-[10px] uppercase text-gray-01">Events</p>
                  <p className="text-lg font-semibold">{trail.event_count}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-01">First seen</p>
                  <p className="text-sm">{trail.first_event_at ? formatRelativeDate(trail.first_event_at) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-01">Last seen</p>
                  <p className="text-sm">{trail.last_event_at ? formatRelativeDate(trail.last_event_at) : "—"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md p-5">
              <p className="font-semibold text-sm mb-3">Activity timeline ({events.length})</p>
              {events.length === 0 ? (
                <p className="text-xs text-gray-01">No events recorded for this entity.</p>
              ) : (
                <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                  {events.map((e) => (
                    <li key={e.id} className="ml-4 cursor-pointer hover:bg-gray-50 rounded p-2 -ml-2"
                        onClick={() => setSelectedId(e.id)}>
                      <span
                        className={`absolute -left-1.5 mt-1.5 size-3 rounded-full ring-2 ring-white ${
                          e.severity === "CRITICAL" ? "bg-red-500" : e.severity === "WARNING" ? "bg-amber-500" : "bg-blue-500"
                        }`}
                      />
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-medium">{e.action_type}</span>
                        <span className="text-gray-01 uppercase">{e.module_key}</span>
                        <span className="text-gray-01">·</span>
                        <span className="text-gray-01">{formatRelativeDate(e.event_at)}</span>
                      </div>
                      <p className="text-xs text-gray-01 mt-1">{e.summary}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        ) : null}

        <EventDetailDrawer eventId={selectedId} onClose={() => setSelectedId(null)} />
      </main>
    </DashboardLayout>
  );
}
