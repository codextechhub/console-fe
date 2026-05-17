import { useState, useMemo } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/helpers";
import { returnInitial } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import {
  useGetUserAssignmentsQuery,
  useAssignRoleMutation,
  useRevokeAssignmentMutation,
  useGetPlatformRolesQuery,
} from "@/redux/services/dashboard/rbacApi";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/teamMgtApi";
import type { UserAssignment } from "@/redux/services/dashboard/rbacTypes";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const TABLE_HEADERS = ["User", "Role", "Status", "Assigned By", "Assigned", "Revoked", "Action"];

type StatusFilter = "all" | "ACTIVE" | "REVOKED";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "REVOKED", label: "Revoked" },
];

// ── Assign Role Sheet ──────────────────────────────────────────────────────────
function AssignRoleSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [assignRole, { isLoading }] = useAssignRoleMutation();
  const { data: membersData } = useGetTeamMembersQuery({ page: 1, page_size: 200 }, { skip: !open });
  const { data: rolesData } = useGetPlatformRolesQuery({ page: 1, page_size: 200 }, { skip: !open });

  const members = membersData?.data ?? [];
  const roles = (rolesData?.data ?? []).filter((r) => r.status === "ACTIVE");

  const userOptions = members.map((m) => ({ value: m.id, label: `${m.full_name} — ${m.email}` }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  const handleSubmit = () => {
    if (!userId || !roleId) {
      toast.error("Select both a user and a role.");
      return;
    }
    assignRole({ user_id: userId, role_id: roleId })
      .unwrap()
      .then(() => {
        toast.success("Role assigned successfully.");
        onClose();
        setUserId("");
        setRoleId("");
      })
      .catch(() => {});
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">Assign Role</SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            Grant a platform role to a Vision staff member.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <CustomNativeSelect
            id="assign-user"
            label="User"
            isRequired
            placeholder="Select a staff member..."
            options={userOptions}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <CustomNativeSelect
            id="assign-role"
            label="Role"
            isRequired
            placeholder="Select a role..."
            options={roleOptions}
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          />
          <div className="rounded-md bg-pry-01/30 border border-pry-01 px-4 py-3 space-y-1.5 text-xs text-gray-01">
            <p className="font-semibold text-black-01">Rules enforced</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You cannot assign a role to yourself.</li>
              <li>No duplicate active assignments for the same user/role.</li>
              <li>Only Vision staff can be assigned platform roles.</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Assigning..." : "Assign Role"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Assignment Detail Sheet ────────────────────────────────────────────────────
function AssignmentDetailSheet({
  assignment,
  onClose,
  onRevoke,
  canRevoke,
}: {
  assignment: UserAssignment | null;
  onClose: () => void;
  onRevoke: (a: UserAssignment) => void;
  canRevoke: boolean;
}) {
  if (!assignment) return null;

  const rows = [
    { label: "Role", value: assignment.role_name },
    { label: "Status", value: assignment.assignment_status },
    { label: "Assigned by", value: assignment.assigned_by_name || "—" },
    { label: "Assigned at", value: assignment.assigned_at ? formatRelativeDate(assignment.assigned_at) : "—" },
    { label: "Revoked by", value: assignment.revoked_by_name || "—" },
    { label: "Revoked at", value: assignment.revoked_at ? formatRelativeDate(assignment.revoked_at) : "—" },
    { label: "Reason", value: assignment.reason_note || "—" },
  ];

  return (
    <Sheet open={!!assignment} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">Assignment Details</SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            {assignment.user_name} · {assignment.role_name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback className="text-sm font-semibold bg-pry-01 text-primary">
                {returnInitial(assignment.user_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-black-01">{assignment.user_name}</p>
              <p className="text-xs text-gray-01">{assignment.user_email}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={assignment.assignment_status === "ACTIVE" ? "active" : "inactive"}>
                {assignment.assignment_status}
              </Badge>
            </div>
          </div>

          <div className="bg-white rounded-md border border-white-02 divide-y divide-white-02">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
                <p className="text-xs text-gray-01 font-mont shrink-0">{label}</p>
                <p className="text-xs font-medium text-black-01 text-right">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
          {assignment.assignment_status === "ACTIVE" && canRevoke && (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => { onClose(); onRevoke(assignment); }}
            >
              Revoke Assignment
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Revoke Dialog ──────────────────────────────────────────────────────────────
function RevokeDialog({
  assignment,
  onClose,
}: {
  assignment: UserAssignment | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [revokeAssignment, { isLoading }] = useRevokeAssignmentMutation();

  const handleRevoke = () => {
    if (!reason.trim()) {
      toast.error("A reason is required to revoke an assignment.");
      return;
    }
    if (!assignment) return;
    revokeAssignment({ id: assignment.id, reason_note: reason.trim() })
      .unwrap()
      .then(() => {
        toast.success("Assignment revoked.");
        setReason("");
        onClose();
      })
      .catch(() => {});
  };

  return (
    <Dialog open={!!assignment} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Revoke Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3 text-xs text-destructive space-y-1">
            <p className="font-semibold">This action cannot be undone</p>
            <p>Once revoked, the assignment status cannot be reverted. Create a new assignment if needed.</p>
          </div>
          {assignment && (
            <div className="rounded-md bg-gray-50 border border-white-02 px-4 py-3">
              <p className="text-sm font-semibold text-black-01">{assignment.user_name} · {assignment.role_name}</p>
              <p className="text-xs text-gray-01 mt-0.5">Assigned {formatRelativeDate(assignment.assigned_at)}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black-01">
              Reason for revocation <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Explain why this assignment is being revoked. This is recorded in the audit trail."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" size="lg" onClick={handleRevoke} disabled={isLoading}>
            {isLoading ? "Revoking..." : "Revoke"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PlatformUserAssignments() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [query, setQuery] = useState({ page: 1 });
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<UserAssignment | null>(null);
  const [revokeItem, setRevokeItem] = useState<UserAssignment | null>(null);

  const params = useMemo(() => ({
    ...query,
    search: debouncedSearch,
    ...(statusFilter !== "all" && { assignment_status: statusFilter }),
    ...(roleFilter !== "all" && { role: roleFilter }),
  }), [query, debouncedSearch, statusFilter, roleFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useGetUserAssignmentsQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const { data: rolesData } = useGetPlatformRolesQuery({ page: 1, page_size: 200 });

  const assignments = data?.data ?? [];
  const totalAssignments = data?.pagination?.totalItems ?? 0;
  const activeCount = assignments.filter((a) => a.assignment_status === "ACTIVE").length;
  const revokedCount = assignments.filter((a) => a.assignment_status === "REVOKED").length;
  const last30Count = assignments.filter((a) => {
    return (Date.now() - new Date(a.assigned_at).getTime()) < 30 * 86400 * 1000;
  }).length;
  const uniqueUsers = new Set(assignments.map((a) => a.user_id)).size;

  const roleOptions = [
    { value: "all", label: "All Roles" },
    ...(rolesData?.data ?? []).map((r) => ({ value: r.id, label: r.name })),
  ];

  const metricCards = [
    { title: "Total Assignments", value: totalAssignments },
    { title: "Active", value: activeCount, hint: `${revokedCount} revoked` },
    { title: "Last 30 Days", value: last30Count, hint: "Newly assigned" },
    { title: "Unique Users", value: uniqueUsers },
  ];

  const tableData = assignments.map((a: UserAssignment) => ({
    user: (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-xs font-semibold bg-pry-01 text-primary">
            {returnInitial(a.user_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-black-01">{a.user_name}</p>
          <p className="text-xs text-gray-01">{a.user_email}</p>
        </div>
      </div>
    ),
    role: <span className="font-medium text-sm">{a.role_name}</span>,
    status: (
      <Badge variant={a.assignment_status === "ACTIVE" ? "active" : "inactive"}>
        {a.assignment_status}
      </Badge>
    ),
    assignedBy: <span className="text-xs text-gray-01">{a.assigned_by_name || "—"}</span>,
    assignedAt: <span className="text-xs text-gray-01">{formatRelativeDate(a.assigned_at)}</span>,
    revokedAt: (
      <span className="text-xs text-gray-01">
        {a.revoked_at ? formatRelativeDate(a.revoked_at) : "—"}
      </span>
    ),
    _id: a.id,
    _status: a.assignment_status,
    _raw: a,
  }));

  return (
    <DashboardLayout title="Platform User Assignments">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Platform User Role Assignments</p>
            <p className="text-xs text-gray-01 mt-0.5">Assign platform roles to Vision staff. Revocations require a written justification.</p>
          </div>
          <PermissionGate permission={P.ASSIGN_ROLE}>
            <Button size="lg" onClick={() => setAssignOpen(true)}>
              <Plus /> Assign Role
            </Button>
          </PermissionGate>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-md min-h-26 w-full px-5.5 pt-5 pb-5 space-y-2.5"
            >
              <h5 className="font-mont text-sm font-medium text-gray-01">{card.title}</h5>
              <p className="font-semibold text-2xl text-[#221122]">{card.value}</p>
              {card.hint && <p className="text-xs text-gray-01">{card.hint}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <CustomInput
            id="search-assignments"
            canSearch
            placeholder="Search by user name or email..."
            className="h-10"
            containerClass="w-full sm:max-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-flex items-center gap-3 shrink-0 flex-wrap">
            <CustomNativeSelect
              id="filter-status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setQuery({ page: 1 }); }}
              containerClass="w-36"
            />
            <CustomNativeSelect
              id="filter-role"
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setQuery({ page: 1 }); }}
              containerClass="w-44"
            />
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
            <p className="text-sm font-medium text-destructive">Failed to load assignments. Please try again.</p>
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
            dropDownList={(row: { _id: string; _status: string; _raw: UserAssignment }) => [
              {
                label: "View Details",
                className: "",
                onActionClick: () => setDetailItem(row._raw),
              },
              ...(row._status === "ACTIVE" && hasPermission(P.ASSIGN_ROLE)
                ? [{
                    label: "Revoke",
                    className: "text-destructive focus:text-destructive focus:bg-destructive/10",
                    onActionClick: () => setRevokeItem(row._raw),
                  }]
                : []),
            ]}
            perPage={data?.pagination?.pageSize}
            totalPage={data?.pagination?.totalPages}
            currentPage={data?.pagination?.currentPage}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
          />
        )}
      </main>

      <AssignRoleSheet open={assignOpen} onClose={() => setAssignOpen(false)} />

      <AssignmentDetailSheet
        assignment={detailItem}
        onClose={() => setDetailItem(null)}
        onRevoke={(a) => setRevokeItem(a)}
        canRevoke={hasPermission(P.ASSIGN_ROLE)}
      />

      <RevokeDialog
        assignment={revokeItem}
        onClose={() => setRevokeItem(null)}
      />
    </DashboardLayout>
  );
}
