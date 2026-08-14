// "Appoint your approvers" - the seeded approval roles and who holds them.
//
// A tenant's approval ladders are published with its books and arrive blocked:
// the roles exist, nobody is appointed, and no stage auto-skips. Without this
// screen the first symptom is a requisition that parks with nothing useful said,
// which reads as broken software rather than as a control working correctly.
//
// Read-only plus a link out. Appointing somebody is a permission change with its
// own audit trail and its own screen, and duplicating that here would be a second
// path to the same grant with fewer checks around it.
import { Link } from "react-router";
import { AlertTriangle, Check, ExternalLink, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/finance-ui/states";
import { P } from "@/permissions";
import { useCan } from "@/components/finance-ui/can";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPlatformRolesQuery, useGetUserAssignmentsQuery,
} from "@/redux/services/dashboard/rbac-api";
import { staffingFor, unstaffed, type RoleStaffing } from "./approval-roles";

export default function ApprovalRolesTab() {
  const { can } = useCan();
  const canManage = can(P.ASSIGN_ROLE);
  const rolesQ = useGetPlatformRolesQuery({ page_size: 200 });
  // One read for every role's holders: the rows carry `role_key`, so counting
  // client-side costs one request instead of one per role.
  const assignmentsQ = useGetUserAssignmentsQuery({ page_size: 200 });

  const loading = rolesQ.isLoading || assignmentsQ.isLoading;
  const failed = rolesQ.isError || assignmentsQ.isError;
  const rows = staffingFor(rolesQ.data?.data, assignmentsQ.data?.data);
  const blocked = unstaffed(rows);

  if (loading) return <LoadingState rows={6} />;
  if (failed) return <ErrorState onRetry={() => { rolesQ.refetch(); assignmentsQ.refetch(); }} />;
  if (rows.every((row) => row.roleId === null)) {
    return (
      <EmptyState
        title="No approval roles here yet"
        message="This tenant's approval ladders have not been published. Its books were created before approvals were seeded with them."
      />
    );
  }

  return (
    <div className="space-y-4">
      {blocked.length > 0 ? (
        <div className="flex flex-wrap items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="font-mont text-xs font-semibold text-amber-900">
              {blocked.length === 1
                ? "One approving role has nobody appointed"
                : `${blocked.length} approving roles have nobody appointed`}
            </p>
            <p className="mt-1 font-mont text-xs leading-5 text-amber-900">
              Anything needing one of these will be submitted and then wait, because there is
              nobody who can decide it. Appointing someone releases every document already waiting.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-green-01/30 bg-green-01/5 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-01" />
          <p className="font-mont text-xs leading-5 text-gray-01">
            Every approving role has somebody in it. Nothing will park for want of an approver.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row) => <RoleRow key={row.key} row={row} canManage={canManage} />)}
      </div>
    </div>
  );
}

function RoleRow({ row, canManage }: { row: RoleStaffing; canManage: boolean }) {
  const empty = row.holders === 0;
  const missing = row.roleId === null;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-white-02 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mont text-sm font-medium text-gray-01">{row.name}</p>
          <span className={`rounded px-1.5 py-0.5 font-mont text-[10px] font-medium ${
            missing ? "bg-gray-05/10 text-gray-05"
              : empty ? "bg-amber-100 text-amber-700"
                : "bg-green-01/10 text-green-01"
          }`}>
            {missing ? "Not published"
              : empty ? "Nobody appointed"
                : `${row.holders} ${row.holders === 1 ? "person" : "people"}`}
          </span>
        </div>
        <p className="mt-1 font-mont text-xs leading-5 text-gray-05">
          Approves: {row.approves}
        </p>
        {row.note ? (
          <p className="mt-0.5 font-mont text-[11px] leading-5 text-gray-05">{row.note}</p>
        ) : null}
        <p className="mt-1 font-mont text-[11px] text-gray-05">{row.key}</p>
      </div>
      {!missing && canManage ? (
        <Button asChild size="sm" variant={empty ? "default" : "outline"} className="shrink-0 gap-1.5">
          {/* Appointing happens on the assignments screen, which owns the audit
              trail for a permission grant. This only points at it. */}
          <Link to={routesPath.PROTECTED.ROLES.USER_ASSIGNMENTS}>
            {empty ? <>Appoint someone <ExternalLink className="size-3.5" /></> : <>Manage <ExternalLink className="size-3.5" /></>}
          </Link>
        </Button>
      ) : !missing && !empty ? (
        <Check className="size-4 shrink-0 text-green-01" />
      ) : null}
    </div>
  );
}
