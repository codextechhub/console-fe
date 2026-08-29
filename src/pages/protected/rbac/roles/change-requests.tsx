import { useState, useMemo } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import {
  useGetChangeRequestsQuery,
  useCreateChangeRequestMutation,
  useDecideChangeRequestMutation,
  useGetPlatformRolesQuery,
  useGetPermissionsQuery,
} from "@/redux/services/dashboard/rbac-api";
import type { ChangeRequest, ChangeRequestDelta } from "@/redux/services/dashboard/rbac-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell } from "@/components/layout/page-shell";

const TABLE_HEADERS = ["Request ID", "Target Role", "Deltas", "Status", "Requested By", "Submitted", "Decided"];

type StatusFilter = "all" | "PENDING" | "APPROVED" | "DENIED" | "APPLIED" | "APPLY_FAILED";

function statusBadgeVariant(status: string) {
  if (status === "PENDING") return "suspended";
  if (status === "APPROVED" || status === "APPLIED") return "active";
  if (status === "DENIED") return "inactive";
  if (status === "APPLY_FAILED") return "deactivated";
  return "default";
}

// ── New Request Sheet ──────────────────────────────────────────────────────────
function NewRequestSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [targetRoleId, setTargetRoleId] = useState("");
  const [justification, setJustification] = useState("");
  const [deltas, setDeltas] = useState<ChangeRequestDelta[]>([{ permission_key: "", operation: "ADD" }]);
  const [createRequest, { isLoading }] = useCreateChangeRequestMutation();
  const { data: rolesData } = useGetPlatformRolesQuery({ page: 1, page_size: 200 }, { skip: !open });
  const { data: permsData } = useGetPermissionsQuery({ page: 1, page_size: 500 }, { skip: !open });

  const roles = (rolesData?.data ?? []).filter((r) => r.status === "ACTIVE");
  const perms = permsData?.data ?? [];

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name + (r.is_locked ? " (locked)" : ""),
  }));
  const permOptions = perms.map((p) => ({ value: p.key, label: p.key }));

  const addDelta = () => setDeltas((s) => [...s, { permission_key: "", operation: "ADD" }]);
  const removeDelta = (i: number) => setDeltas((s) => s.filter((_, j) => j !== i));
  const updateDelta = (i: number, field: "permission_key" | "operation", value: string) =>
    setDeltas((s) => s.map((d, j) => j === i ? { ...d, [field]: value } : d));

  const handleSubmit = () => {
    const validDeltas = deltas
      .filter((d) => d.permission_key)
      .map((d) => ({ permission_key: d.permission_key as string, operation: d.operation }));
    if (!targetRoleId || !justification.trim() || validDeltas.length === 0) {
      toast.error("Fill in all required fields and add at least one delta.");
      return;
    }
    createRequest({ target_role_id: targetRoleId, delta_items: validDeltas, justification: justification.trim() })
      .unwrap()
      .then(() => {
        toast.success("Change request submitted.");
        onClose();
        setTargetRoleId("");
        setJustification("");
        setDeltas([{ permission_key: "", operation: "ADD" }]);
      })
      .catch(() => {});
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">New Change Request</SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            Propose ADD/REMOVE deltas to a role's permissions. A reviewer will approve or deny.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">
            <SearchSelect
              id="req-target-role"
              label="Target Role"
              isRequired
              placeholder="Select a role to modify..."
              options={roleOptions}
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black-01">
                Justification <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-gray-01">Why is this change needed? The reviewer will see this.</p>
              <Textarea
                placeholder="e.g. Finance team needs refund authority for Q2 ops..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">Delta Items</p>
                <Button variant="outline" size="sm" onClick={addDelta}>
                  <Plus className="size-3" /> Add Delta
                </Button>
              </div>
              <div className="space-y-2">
                {deltas.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-white-02 rounded-md px-3 py-2">
                    <select
                      className="text-xs border border-white-02 rounded px-2 py-1.5 bg-white text-black-01 shrink-0"
                      value={d.operation}
                      onChange={(e) => updateDelta(i, "operation", e.target.value)}
                    >
                      <option value="ADD">ADD</option>
                      <option value="REMOVE">REMOVE</option>
                    </select>
                    <select
                      className="flex-1 text-xs border border-white-02 rounded px-2 py-1.5 bg-white text-black-01 min-w-0"
                      value={d.permission_key}
                      onChange={(e) => updateDelta(i, "permission_key", e.target.value)}
                    >
                      <option value="">Select permission...</option>
                      {permOptions.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={deltas.length === 1}
                      onClick={() => removeDelta(i)}
                      className="text-gray-01 hover:text-destructive disabled:opacity-40 shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
        </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Request Detail Sheet ───────────────────────────────────────────────────────
function RequestDetailSheet({
  request,
  onClose,
  onDecide,
}: {
  request: ChangeRequest | null;
  onClose: () => void;
  onDecide: (req: ChangeRequest, decision: "APPROVED" | "DENIED") => void;
}) {
  if (!request) return null;
  const isPending = request.status === "PENDING";

  return (
    <Sheet open={!!request} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01 font-mono">
            {request.id}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            Target: {request.target_role_name}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusBadgeVariant(request.status)}>
                {request.status.replace("_", " ")}
              </Badge>
              <Badge variant="default">{request.requested_by_name}</Badge>
              <Badge variant="default">Submitted {formatRelativeDate(request.submitted_at)}</Badge>
              {request.decided_at && (
                <Badge variant="default">Decided {formatRelativeDate(request.decided_at)}</Badge>
              )}
            </div>

            {request.status === "APPLY_FAILED" && (
              <div className="rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3 text-xs text-destructive">
                <p className="font-semibold">Apply step failed</p>
                <p className="mt-0.5">The request was approved but the apply step failed. Check the dependency graph and retry.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">Justification</p>
              <div className="bg-white border border-white-02 rounded-md px-4 py-3">
                <p className="text-sm text-gray-01 leading-relaxed">{request.justification}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">
                Delta Items ({request.delta_items.length})
              </p>
              <div className="bg-white border border-white-02 rounded-md divide-y divide-white-02">
                {request.delta_items.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <Badge variant={d.operation === "ADD" ? "active" : "deactivated"}>
                      {d.operation}
                    </Badge>
                    <span className="font-mono text-xs text-black-01">{d.permission?.key ?? d.permission_key}</span>
                  </div>
                ))}
                {request.delta_items.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-01">No delta items.</p>
                )}
              </div>
            </div>

            {request.reviewer_notes && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">Reviewer</p>
                <div className="bg-white border border-white-02 rounded-md divide-y divide-white-02">
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <p className="text-xs text-gray-01 font-mont shrink-0">Notes</p>
                    <p className="text-xs font-medium text-black-01 text-right">{request.reviewer_notes}</p>
                  </div>
                </div>
              </div>
            )}
        </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
          {isPending && (
            <>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => { onClose(); onDecide(request, "DENIED"); }}
              >
                Deny
              </Button>
              <Button
                size="lg"
                onClick={() => { onClose(); onDecide(request, "APPROVED"); }}
              >
                Approve & Apply
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Decide Dialog ──────────────────────────────────────────────────────────────
function DecideDialog({
  context,
  onClose,
}: {
  context: { request: ChangeRequest; decision: "APPROVED" | "DENIED" } | null;
  onClose: () => void;
}) {
  const [reviewerNote, setReviewerNote] = useState("");
  const [decideRequest, { isLoading }] = useDecideChangeRequestMutation();

  const handleConfirm = () => {
    if (!context) return;
    decideRequest({ id: context.request.id, decision: context.decision, reviewer_note: reviewerNote.trim() || undefined })
      .unwrap()
      .then(() => {
        toast.success(context.decision === "APPROVED" ? "Request approved and applied." : "Request denied.");
        setReviewerNote("");
        onClose();
      })
      .catch(() => {});
  };

  const isApprove = context?.decision === "APPROVED";

  return (
    <Dialog open={!!context} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={isApprove ? "text-green-700" : "text-destructive"}>
            {isApprove ? "Approve & Apply Request" : "Deny Request"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {context && (
            <div className="rounded-md bg-gray-50 border border-white-02 px-4 py-3">
              <p className="text-sm font-semibold text-black-01 font-mono">{context.request.id}</p>
              <p className="text-xs text-gray-01 mt-0.5">Target: {context.request.target_role_name}</p>
              <p className="text-xs text-gray-01 mt-0.5">{context.request.delta_items.length} delta(s)</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black-01">Reviewer Notes</label>
            <Textarea
              placeholder="Optional notes for the requestor..."
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            size="lg"
            variant={isApprove ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : isApprove ? "Approve & Apply" : "Deny"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ChangeRequests() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [cardFilter, setCardFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState({ page: 1 });
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ChangeRequest | null>(null);
  const [decideContext, setDecideContext] = useState<{ request: ChangeRequest; decision: "APPROVED" | "DENIED" } | null>(null);

  const params = useMemo(() => ({
    ...query,
    search: debouncedSearch,
    ...(cardFilter !== "all" && { status: cardFilter }),
  }), [query, debouncedSearch, cardFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetChangeRequestsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  // The change-request payload carries only the target role's pk, so resolve a
  // display name from the tenant roles list.
  const { data: rolesData } = useGetPlatformRolesQuery({ page: 1, page_size: 200 });
  const roleNameByPk = useMemo(
    () => new Map((rolesData?.data ?? []).map((r) => [String(r.id), r.name])),
    [rolesData],
  );

  const requests = useMemo(
    () =>
      (data?.data ?? []).map((r) => ({
        ...r,
        target_role_name: roleNameByPk.get(String(r.target_role)) ?? r.target_role_name ?? String(r.target_role),
        requested_by_name: r.requested_by_name ?? String(r.requested_by),
      })),
    [data, roleNameByPk],
  );
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const approved = requests.filter((r) => r.status === "APPROVED" || r.status === "APPLIED").length;
  const denied = requests.filter((r) => r.status === "DENIED").length;
  const failed = requests.filter((r) => r.status === "APPLY_FAILED").length;

  const metricCards: { title: string; value: number; hint?: string; key: StatusFilter }[] = [
    { title: "Pending", value: pending, hint: "Awaiting review", key: "PENDING" },
    { title: "Approved", value: approved, key: "APPROVED" },
    { title: "Denied", value: denied, key: "DENIED" },
    { title: "Apply Failed", value: failed, hint: "Needs retry", key: "APPLY_FAILED" },
  ];

  const tableData = requests.map((r: ChangeRequest) => ({
    id: <span className="font-mono text-xs text-black-01 font-medium">{r.id}</span>,
    targetRole: <span className="font-medium text-sm">{r.target_role_name}</span>,
    deltas: (
      <Badge variant="default">
        {r.delta_items.length} change{r.delta_items.length === 1 ? "" : "s"}
      </Badge>
    ),
    status: (
      <Badge variant={statusBadgeVariant(r.status)}>
        {r.status.replace("_", " ")}
      </Badge>
    ),
    requestedBy: <span className="text-xs text-gray-01">{r.requested_by_name}</span>,
    submitted: <span className="text-xs text-gray-01">{formatRelativeDate(r.submitted_at)}</span>,
    decided: (
      <span className="text-xs text-gray-01">
        {r.decided_at ? formatRelativeDate(r.decided_at) : "-"}
      </span>
    ),
    _raw: r,
    _id: r.id,
  }));

  return (
    <>
      <PageShell className="space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Role Change Requests</p>
            <p className="text-xs text-gray-01 mt-0.5">
              Formal approval workflow for permission changes. Each request is a set of ADD/REMOVE deltas reviewed before applying.
            </p>
          </div>
          <Button size="lg" onClick={() => setNewRequestOpen(true)}>
            <Plus /> New Request
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {metricCards.map((card) => (
            <div
              key={card.key}
              className={cn(
                "bg-white rounded-md min-h-26 w-full px-4 sm:px-5.5 pt-5 pb-4 space-y-2.5 cursor-pointer transition-colors",
                cardFilter === card.key && "bg-pry-01",
              )}
              onClick={() => setCardFilter(cardFilter === card.key ? "all" : card.key)}
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{card.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{card.value}</p>
              {card.hint && <p className="text-xs text-gray-01">{card.hint}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <CustomInput
            id="search-requests"
            canSearch
            placeholder="Search by target role..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-flex items-center gap-3.5 shrink-0">
            <Button
              variant="white" size="lg"
              className="[&_svg]:size-5 font-medium font-mont"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-destructive">Failed to load change requests. Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <CustomTable
            tableHeaderList={TABLE_HEADERS}
            tableBodyList={tableData}
            loading={isLoading}
            dropDown
            dropDownList={(row: { _raw: ChangeRequest }) => [
              {
                label: "View Details",
                className: "",
                onActionClick: () => setDetailItem(row._raw),
              },
              ...(row._raw.status === "PENDING"
                ? [
                    {
                      label: "Approve",
                      className: "text-green-700 focus:text-green-700 focus:bg-green-50",
                      onActionClick: () => setDecideContext({ request: row._raw, decision: "APPROVED" }),
                    },
                    {
                      label: "Deny",
                      className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                      onActionClick: () => setDecideContext({ request: row._raw, decision: "DENIED" }),
                    },
                  ]
                : []),
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
          />
        )}
      </PageShell>

      <NewRequestSheet open={newRequestOpen} onClose={() => setNewRequestOpen(false)} />

      <RequestDetailSheet
        request={detailItem}
        onClose={() => setDetailItem(null)}
        onDecide={(req, decision) => setDecideContext({ request: req, decision })}
      />

      <DecideDialog
        context={decideContext}
        onClose={() => setDecideContext(null)}
      />
    </>
  );
}
