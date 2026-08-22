import { useMemo, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { SearchSelect } from "@/components/custom/search-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useApproveGoLiveMutation,
  useGetGoLiveRequestsQuery,
  useRejectGoLiveMutation,
  type GoLiveRequest,
} from "@/redux/services/dashboard/onboarding-api";
import { formatEnum, formatStartedTime } from "@/utils/helpers";
import { toast } from "sonner";

const TABLE_HEADERS = [
  "School",
  "Requested",
  "Preferred go-live",
  "Requested by",
  "Status",
  "Reviewed",
  "Action",
];

// Mirrors GoLiveStatus on the backend. Only PENDING can be decided on; the
// rest are history, and the screen shows them because "we already said no in
// March, and why" is the first thing a reviewer needs when a school asks again.
const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ACTIVATED", label: "Activated" },
  { value: "FAILED", label: "Failed" },
];

const STATUS_TONE: Record<string, "active" | "pending" | "rejected" | "inactive"> = {
  PENDING: "pending",
  APPROVED: "active",
  ACTIVATED: "active",
  REJECTED: "rejected",
  FAILED: "rejected",
};

type Decision = { request: GoLiveRequest; kind: "approve" | "reject" };

export default function GoLiveQueue() {
  // The queue opens on what is waiting, because that is what it is for.
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const { hasPermission } = usePermissions();

  const canApprove = hasPermission(P.APPROVE_GO_LIVE);
  const canReject = hasPermission(P.REJECT_GO_LIVE);

  const params = useMemo(() => {
    const next: Record<string, string | number> = { page };
    if (status) next.status = status;
    return next;
  }, [page, status]);

  const { data, isLoading, isFetching, isError, refetch } = useGetGoLiveRequestsQuery(params, {
    refetchOnMountOrArgChange: true,
  });
  const [approveGoLive, { isLoading: approving }] = useApproveGoLiveMutation();
  const [rejectGoLive, { isLoading: rejecting }] = useRejectGoLiveMutation();

  const rows = useMemo(() => data?.data ?? [], [data]);
  const busy = approving || rejecting;
  // The backend refuses a blank reason, so the button does too rather than
  // sending a call that can only come back as an error.
  const blocked = decision?.kind === "reject" && !reason.trim();

  const closeDecision = () => {
    setDecision(null);
    setReason("");
  };

  const submitDecision = () => {
    if (!decision || blocked) return;
    const { request, kind } = decision;
    const done = (message: string) => {
      closeDecision();
      toast.success(message);
    };

    if (kind === "approve") {
      approveGoLive({ id: request.id, slug: request.tenant_slug })
        .unwrap()
        .then(() => done(`${request.school_name} is now live.`))
        .catch(() => {
          // The interceptor surfaces the backend's own refusal - a request that
          // is no longer pending answers 409 - so the dialog stays open under it.
        });
      return;
    }

    rejectGoLive({
      id: request.id,
      slug: request.tenant_slug,
      rejection_reason: reason.trim(),
    })
      .unwrap()
      .then(() => done(`${request.school_name}'s request was declined.`))
      .catch(() => {});
  };

  const tableData = rows.map((row) => ({
    school: (
      <div className="min-w-0">
        <p className="truncate font-semibold capitalize">{row.school_name}</p>
        <p className="mt-0.5 truncate font-mont text-xs text-gray-01">{row.tenant_slug}</p>
        {row.books_provisioned === false && (
          <Badge variant="rejected" className="mt-1 text-[11px]">
            <TriangleAlert className="size-3" />
            No books
          </Badge>
        )}
      </div>
    ),
    requested: formatStartedTime(row.created_at),
    preferred: formatStartedTime(row.preferred_go_live_at),
    requestedBy: row.requested_by_name || "---",
    status: (
      <Badge variant={STATUS_TONE[row.status] ?? "inactive"}>{formatEnum(row.status)}</Badge>
    ),
    reviewed: row.reviewed_at
      ? `${formatStartedTime(row.reviewed_at)}${row.reviewed_by_name ? ` by ${row.reviewed_by_name}` : ""}`
      : "---",
    _row: row,
  }));

  return (
    <>
      <main className="grid min-w-0 grid-cols-1 gap-5 px-4.5 py-6 text-black-01">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-xl font-medium">Go-Live Requests</h4>
            <p className="mt-0.5 font-mont text-xs text-gray-01">
              Schools that have finished onboarding and are asking to be taken live.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-3.5">
            <Button
              variant="white"
              size="lg"
              className="font-mont font-medium [&_svg]:size-5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        <div className="w-full sm:max-w-[220px]">
          <SearchSelect
            id="go-live-status"
            label="Status"
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          />
        </div>

        {isError ? (
          <div className="grid h-48 place-content-center rounded-md border bg-white text-center">
            <p className="text-sm font-medium text-destructive">
              The go-live queue could not be loaded.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            currentPage={data?.pagination?.currentPage ?? 1}
            totalPage={data?.pagination?.totalPages ?? 0}
            onPageChange={(next) => setPage(next as number)}
            dropDown
            dropDownList={(item: { _row: GoLiveRequest }) => {
              // Only a pending request can be decided on, and the backend
              // answers 409 for anything else. An approved school has nothing
              // left to do here, so it gets no menu rather than a failing one.
              if (item._row.status !== "PENDING") return [];
              return [
                ...(canApprove
                  ? [{
                      label: "Approve and take live",
                      onActionClick: () => { setReason(""); setDecision({ request: item._row, kind: "approve" }); },
                    }]
                  : []),
                ...(canReject
                  ? [{
                      label: "Decline with a reason",
                      onActionClick: () => { setReason(""); setDecision({ request: item._row, kind: "reject" }); },
                    }]
                  : []),
              ];
            }}
            emptyText={
              status === "PENDING"
                ? "No school is waiting on a decision."
                : "No requests with this status."
            }
          />
        )}
      </main>

      <AlertDialog open={!!decision} onOpenChange={(open) => !open && closeDecision()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision?.kind === "approve"
                ? `Take ${decision.request.school_name} live?`
                : `Decline ${decision?.request.school_name}'s request?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision?.kind === "approve" ? (
                <>
                  Approving activates the school in the same step: its
                  administrators can sign in and every module its package allows
                  becomes available. It asked to go live on{" "}
                  {decision.request.preferred_go_live_at
                    ? formatStartedTime(decision.request.preferred_go_live_at)
                    : "no particular date"}
                  .
                </>
              ) : (
                <>
                  The school stays in onboarding and keeps everything it has done.
                  It can correct what you name below and ask again, so write the
                  reason for them rather than for us.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {decision?.kind === "reject" && (
            <div className="space-y-1.5">
              <label htmlFor="go-live-reason" className="text-sm text-black-01">
                Reason <span className="pl-1.5 text-error">*</span>
              </label>
              <Textarea
                id="go-live-reason"
                rows={3}
                placeholder="What has to change before this school can go live"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <p className="font-mont text-[11px] leading-4 text-gray-01">
                Sent to the school with the decision.
              </p>
            </div>
          )}

          {decision?.request.books_provisioned === false && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <p className="flex items-center gap-1.5 font-mont text-[11px] font-semibold text-destructive">
                <TriangleAlert className="size-3.5" />
                This school has no set of books
              </p>
              <p className="mt-1 text-sm text-black-01">
                {decision.kind === "approve"
                  ? "Books are provisioned when a school is created, best effort, so this one's did not arrive. Approving takes it live without a ledger, and it will find out in Finance once it is already trading. Provision the books first if you can."
                  : "Worth mentioning in your reason: this school has no ledger, so its books need provisioning before it can trade."}
              </p>
            </div>
          )}

          {decision?.request.note ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="font-mont text-[11px] font-medium text-gray-01">
                What the school said
              </p>
              <p className="mt-1 text-sm text-black-01">{decision.request.note}</p>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); submitDecision(); }}
              disabled={busy || blocked}
              className={decision?.kind === "reject" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {busy
                ? "Saving..."
                : decision?.kind === "approve"
                  ? "Approve and take live"
                  : "Decline request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
