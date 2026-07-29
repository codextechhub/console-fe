import { useState, useMemo } from "react";
import { useNow } from "@/hooks/use-now";
import { ArrowRightLeft, Plus, RefreshCw } from "lucide-react";
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
import { UserAvatar } from "@/components/custom/user-avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import {
  useGetUserAssignmentsQuery,
  useAssignRoleMutation,
  useRevokeAssignmentMutation,
  useReplaceAssignmentMutation,
  useGetPlatformRolesQuery,
} from "@/redux/services/dashboard/rbac-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import type { UserAssignment } from "@/redux/services/dashboard/rbac-types";
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

const SUPER_ADMIN_ROLE_KEY = "xvs_super_admin";

// ── Assign Role Sheet ──────────────────────────────────────────────────────────
function AssignRoleSheet({
  open,
  onClose,
  assignmentToChange,
}: {
  open: boolean;
  onClose: () => void;
  assignmentToChange: UserAssignment | null;
}) {
  const [userId, setUserId] = useState(assignmentToChange?.user_id ?? "");
  const [roleId, setRoleId] = useState("");
  const [formerAssignment, setFormerAssignment] = useState<UserAssignment | null>(assignmentToChange);
  const [assignRole, { isLoading }] = useAssignRoleMutation();
  const [replaceAssignment, { isLoading: isReplacing }] = useReplaceAssignmentMutation();
  const isChange = !!assignmentToChange;
  const isSaving = isLoading || isReplacing;
  const { data: membersData } = useGetTeamMembersQuery(
    { page: 1, page_size: 200 },
    { skip: !open || isChange },
  );
  const { data: rolesData } = useGetPlatformRolesQuery({ page: 1, page_size: 200 }, { skip: !open });
  const {
    data: activeAssignmentsData,
    isFetching: isLoadingAssignments,
    isError: assignmentsCheckFailed,
  } = useGetUserAssignmentsQuery(
    { page: 1, page_size: 200, user: userId, assignment_status: "ACTIVE" },
    { skip: !open || isChange || !userId },
  );

  const members = membersData?.data ?? [];
  const roles = (rolesData?.data ?? []).filter(
    (r) => r.status === "ACTIVE" && r.key !== SUPER_ADMIN_ROLE_KEY,
  );
  const activeAssignments = activeAssignmentsData?.data ?? [];

  const userOptions = isChange && assignmentToChange
    ? [{
        value: assignmentToChange.user_id,
        label: `${assignmentToChange.user_name} — ${assignmentToChange.user_email}`,
      }]
    : members.map((m) => ({ value: m.id, label: `${m.full_name} — ${m.email}` }));
  const roleOptions = roles
    .filter((r) => r.id !== formerAssignment?.role_id)
    .map((r) => ({ value: r.id, label: r.name }));

  const closeAndReset = () => {
    setUserId("");
    setRoleId("");
    setFormerAssignment(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!userId || !roleId) {
      toast.error("Select both a user and a role.");
      return;
    }
    const request = formerAssignment
      ? replaceAssignment({
          id: formerAssignment.id,
          role_id: roleId,
        })
      : assignRole({ user_id: userId, role_id: roleId });

    request
      .unwrap()
      .then(() => {
        toast.success(formerAssignment ? "Role changed successfully." : "Role assigned successfully.");
        closeAndReset();
      })
      .catch(() => {});
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closeAndReset()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white-02">
          <SheetTitle className="text-base font-semibold text-black-01">
            {isChange ? "Change Role" : "Assign Role"}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-01">
            {isChange
              ? "Switch this assignment from its current role to a new role."
              : "Grant a platform role to a CX staff member."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <SearchSelect
            id="assign-user"
            label="User"
            isRequired
            placeholder="Select a staff member..."
            options={userOptions}
            value={userId}
            disabled={isChange}
            onChange={(e) => {
              setUserId(e.target.value);
              setRoleId("");
              setFormerAssignment(null);
            }}
          />
          {formerAssignment && (
            <div className="rounded-md border border-primary/20 bg-pry-01/30 px-4 py-3">
              <p className="text-xs text-gray-01">Former role</p>
              <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-black-01">
                  {formerAssignment.role_name}
                </p>
                <Badge variant="inactive" className="shrink-0">Will be revoked</Badge>
              </div>
            </div>
          )}
          <SearchSelect
            id="assign-role"
            label={formerAssignment ? "New role" : "Role"}
            isRequired
            placeholder={formerAssignment ? "Select the new role..." : "Select a role..."}
            options={roleOptions}
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          />
          {!isChange && userId && !isLoadingAssignments && activeAssignments.length > 0 && (
            <div className="space-y-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-black-01">This user already has one or more active roles</p>
                <p className="mt-0.5 text-xs text-gray-01">
                  Choose a former role below to switch it to the new role, or leave it unchanged to add another role.
                </p>
              </div>
              <div className="space-y-2">
                {activeAssignments.map((assignment) => {
                  const selected = formerAssignment?.id === assignment.id;
                  const isSuperAdmin = assignment.role_key === SUPER_ADMIN_ROLE_KEY;
                  return (
                    <div
                      key={assignment.id}
                      className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-white px-3 py-2.5"
                    >
                      <p className="min-w-0 truncate text-sm font-semibold text-black-01">
                        {assignment.role_name}
                      </p>
                      {isSuperAdmin ? (
                        <span className="text-xs font-medium text-gray-01">
                          Use Transfer Super Admin
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn("shrink-0", selected && "border-primary bg-pry-01 text-primary")}
                          onClick={() => {
                            setFormerAssignment(selected ? null : assignment);
                            if (!selected && roleId === assignment.role_id) setRoleId("");
                          }}
                        >
                          <ArrowRightLeft className="size-3.5" />
                          {selected ? "Keep former role" : "Revoke former role"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!isChange && userId && assignmentsCheckFailed && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              We could not check this user’s active roles. Refresh and try again before assigning a role.
            </div>
          )}
          <div className="rounded-md bg-pry-01/30 border border-pry-01 px-4 py-3 space-y-1.5 text-xs text-gray-01">
            <p className="font-semibold text-black-01">Assignment behavior</p>
            <ul className="list-disc list-inside space-y-1">
              <li>No duplicate active assignments for the same user/role.</li>
              <li>Other active roles stay unchanged unless you select one as the former role.</li>
              {formerAssignment && <li>The former role is revoked only when the new assignment succeeds.</li>}
            </ul>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row flex-wrap justify-end gap-3">
          <Button variant="outline" size="lg" onClick={closeAndReset} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSaving || (!isChange && !!userId && (isLoadingAssignments || assignmentsCheckFailed))}
          >
            {isSaving
              ? (formerAssignment ? "Changing..." : "Assigning...")
              : (formerAssignment ? "Change Role" : "Assign Role")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function AssignedBy({
  userId,
  name,
}: {
  userId: string | null;
  name: string | null;
}) {
  if (!userId && !name) {
    return <span className="text-xs text-gray-01">—</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar
        userId={userId}
        name={name}
        className="size-7 shrink-0"
        fallbackClassName="text-[10px] font-semibold bg-pry-01 text-primary"
      />
      <span className="min-w-0 truncate text-xs font-semibold text-black-01">
        {name || "Unknown user"}
      </span>
    </div>
  );
}

// ── Assignment Detail Sheet ────────────────────────────────────────────────────
function AssignmentDetailSheet({
  assignment,
  onClose,
  onRevoke,
  onChangeRole,
  canRevoke,
}: {
  assignment: UserAssignment | null;
  onClose: () => void;
  onRevoke: (a: UserAssignment) => void;
  onChangeRole: (a: UserAssignment) => void;
  canRevoke: boolean;
}) {
  if (!assignment) return null;
  const isSuperAdmin = assignment.role_key === SUPER_ADMIN_ROLE_KEY;

  const rows = [
    { label: "Role", value: assignment.role_name },
    { label: "Status", value: assignment.assignment_status },
    {
      label: "Assigned by",
      value: (
        <AssignedBy
          userId={assignment.assigned_by_id}
          name={assignment.assigned_by_name}
        />
      ),
    },
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
            <UserAvatar
              userId={assignment.user_id}
              name={assignment.user_name}
              className="size-11 shrink-0"
              fallbackClassName="text-sm font-semibold bg-pry-01 text-primary"
            />
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
                <div className="text-xs font-medium text-black-01 text-right">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-white-02 flex flex-row flex-wrap justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
          {assignment.assignment_status === "ACTIVE" && canRevoke && !isSuperAdmin && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => { onClose(); onChangeRole(assignment); }}
            >
              <ArrowRightLeft />
              Change Role
            </Button>
          )}
          {assignment.assignment_status === "ACTIVE" && canRevoke && !isSuperAdmin && (
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
  const [changeItem, setChangeItem] = useState<UserAssignment | null>(null);

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

  const assignments = useMemo(() => data?.data ?? [], [data]);
  const now = useNow();
  const totalAssignments = data?.pagination?.totalItems ?? 0;
  const activeCount = assignments.filter((a) => a.assignment_status === "ACTIVE").length;
  const revokedCount = assignments.filter((a) => a.assignment_status === "REVOKED").length;
  const last30Count = assignments.filter((a) => {
    return (now - new Date(a.assigned_at).getTime()) < 30 * 86400 * 1000;
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
        <UserAvatar
          userId={a.user_id}
          name={a.user_name}
          className="size-8 shrink-0"
          fallbackClassName="text-xs font-semibold bg-pry-01 text-primary"
        />
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
    assignedBy: <AssignedBy userId={a.assigned_by_id} name={a.assigned_by_name} />,
    assignedAt: <span className="text-xs text-gray-01">{formatRelativeDate(a.assigned_at)}</span>,
    revokedAt: (
      <span className="text-xs text-gray-01">
        {a.revoked_at ? formatRelativeDate(a.revoked_at) : "—"}
      </span>
    ),
    _id: a.id,
    _status: a.assignment_status,
    _isSuperAdmin: a.role_key === SUPER_ADMIN_ROLE_KEY,
    _raw: a,
  }));

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Platform User Role Assignments</p>
            <p className="text-xs text-gray-01 mt-0.5">Assign platform roles to CX staff. Revocations require a written justification.</p>
          </div>
          <PermissionGate permission={P.ASSIGN_ROLE}>
            <Button size="lg" onClick={() => setAssignOpen(true)}>
              <Plus /> Assign Role
            </Button>
          </PermissionGate>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
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
          <div className="inline-flex max-w-full items-center gap-3 shrink-0 flex-wrap">
            <SearchSelect
              id="filter-status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setQuery({ page: 1 }); }}
              containerClass="w-36"
            />
            <SearchSelect
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
            dropDownList={(row: { _id: string; _status: string; _isSuperAdmin: boolean; _raw: UserAssignment }) => [
              {
                label: "View Details",
                className: "",
                onActionClick: () => setDetailItem(row._raw),
              },
              ...(row._status === "ACTIVE" && !row._isSuperAdmin && hasPermission(P.ASSIGN_ROLE)
                ? [{
                    label: "Change Role",
                    className: "",
                    onActionClick: () => setChangeItem(row._raw),
                  }, {
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

      <AssignRoleSheet
        key={changeItem?.id ?? "assign-role"}
        open={assignOpen || !!changeItem}
        assignmentToChange={changeItem}
        onClose={() => {
          setAssignOpen(false);
          setChangeItem(null);
        }}
      />

      <AssignmentDetailSheet
        assignment={detailItem}
        onClose={() => setDetailItem(null)}
        onRevoke={(a) => setRevokeItem(a)}
        onChangeRole={(a) => setChangeItem(a)}
        canRevoke={hasPermission(P.ASSIGN_ROLE)}
      />

      <RevokeDialog
        assignment={revokeItem}
        onClose={() => setRevokeItem(null)}
      />
    </>
  );
}
