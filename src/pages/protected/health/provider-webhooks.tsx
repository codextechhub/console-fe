/**
 * Provider Webhooks - inbound gateway events that belong to no tenant.
 *
 * Every other view of a webhook event reaches it through the collection or payout it
 * matched, which is also how it gets an entity. An event that matched neither has no
 * entity, so it appeared on no screen at all - and it is not nothing: money moved at
 * the provider against a reference we do not recognise. It cannot be shown to every
 * tenant either, because the reference belongs to exactly one of them.
 *
 * So it lives here, at platform scope, for CX staff only. Expect the list to be short
 * and usually empty; that is the healthy state. What is left over is genuine debris -
 * a staging PSP pointed at production, a reference that no longer exists, an event
 * type we do not handle - plus the occasional one that becomes bookable once whatever
 * was missing (most often the virtual account the deposit named) has been created.
 *
 * Replay re-runs the stored event against the body already on file. It is safe to
 * press twice: the confirm services are idempotent on a terminal record. A replay that
 * succeeds attributes the event, so it leaves this list for that entity's own screen.
 */

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import {
  useGetUnattributedWebhooksQuery,
  useReplayUnattributedWebhookMutation,
} from "@/redux/services/payments/payments-api";
import type { WebhookEvent } from "@/redux/services/payments/payments-types";
import { HealthFrame, HealthTable, PageIntro } from "./primitives";

const STATUS_LABEL: Record<string, { label: string; variant: "rejected" | "suspended" | "inactive" }> = {
  FAILED: { label: "Failed to book", variant: "rejected" },
  IGNORED: { label: "Unmatched", variant: "suspended" },
  RECEIVED: { label: "Not yet processed", variant: "inactive" },
};

const fmtDateTime = (value?: string | null) =>
  (value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");

export default function ProviderWebhooksPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission(P.PAY_VIEW_UNATTRIBUTED_WEBHOOKS);
  const canReplay = hasPermission(P.PAY_REPLAY_UNATTRIBUTED_WEBHOOK);

  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [replayingId, setReplayingId] = useState<number | null>(null);

  // Filters are server-side; reset to page 1 during render so the reset lands in the
  // same pass rather than flashing an out-of-range page.
  const filterKey = `${status} ${search}`;
  const [pagedFor, setPagedFor] = useState(filterKey);
  if (pagedFor !== filterKey) {
    setPagedFor(filterKey);
    setPage(1);
  }

  const params = useMemo(() => ({
    page,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  }), [page, status, search]);

  const { data, isLoading, isFetching, refetch } = useGetUnattributedWebhooksQuery(params, {
    skip: !canView,
  });
  const [replay] = useReplayUnattributedWebhookMutation();

  const rows: WebhookEvent[] = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;

  if (!canView) return <PageAccessDenied />;

  const doReplay = async (event: WebhookEvent) => {
    setReplayingId(event.id);
    try {
      const res = await replay({ id: event.id }).unwrap();
      toast.success(res.message || "Webhook replayed.");
    } catch {
      /* central error handling */
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <HealthFrame>
      <PageIntro
        title="Provider Webhooks"
        description="Gateway events that matched no collection and no payout, so they belong to no school."
        guideTarget="platform-health.provider-webhooks"
        onRefresh={refetch}
        refreshing={isFetching}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-56">
          <NativeSelect
            className="h-10"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">Needs a look</option>
            <option value="IGNORED">Unmatched</option>
            <option value="FAILED">Failed to book</option>
            <option value="ALL">Everything unattributed</option>
          </NativeSelect>
        </div>
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search provider reference"
          className="h-10 w-full font-mont text-sm sm:w-64"
        />
      </div>

      <HealthTable
        // The action column only exists for someone who can press it: an "Action"
        // header over a column of blanks would promise a control that is not there.
        headers={[
          "Received", "Provider", "Event", "Provider reference", "Status", "Why it is here",
          ...(canReplay ? ["Action"] : []),
        ]}
        loading={isLoading}
        rows={rows.map((event) => [
          <span className="tabular-nums text-gray-01">{fmtDateTime(event.created_at)}</span>,
          event.provider,
          <span className="text-gray-01">{event.event_type || "-"}</span>,
          <span className="block max-w-[220px] truncate font-medium" title={event.provider_reference}>
            {event.provider_reference || "-"}
          </span>,
          <Badge
            variant={STATUS_LABEL[event.status]?.variant ?? "inactive"}
            className="font-mont text-xs"
          >
            {STATUS_LABEL[event.status]?.label ?? event.status}
          </Badge>,
          // The reason is the point of the screen, so it wraps rather than truncating.
          // TableCell is whitespace-nowrap by default, which would otherwise let a long
          // reason run straight over the Retry button.
          <span className="block max-w-[420px] whitespace-normal text-gray-01">
            {event.error || "Stored, not yet processed."}
          </span>,
          ...(canReplay
            ? [
                <button
                  type="button"
                  disabled={replayingId !== null}
                  onClick={() => void doReplay(event)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-03 px-2 py-1 font-mont text-[11px] whitespace-nowrap text-gray-01 hover:bg-gray-03 disabled:opacity-50"
                >
                  <RotateCcw className={cn("size-3.5", replayingId === event.id && "animate-spin")} />
                  {replayingId === event.id ? "Retrying" : "Retry"}
                </button>,
              ]
            : []),
        ])}
        emptyText="Nothing unattributed. Every provider event so far matched something of ours."
        totalPage={pagination?.totalPages}
        currentPage={pagination?.currentPage}
        onPageChange={(next) => setPage(next as number)}
      />
    </HealthFrame>
  );
}
