// The console's implementation of @xvs/finance's host contract.
// See packages/xvs-finance/src/host.ts for what each member is for.

import { useGetBranchesQuery } from "@/redux/services/dashboard/school-mgt-api";
import { routesPath } from "@/routes/routes-path";
import { useGetAllRolesQuery } from "@/redux/services/dashboard/role-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import { getTenantSlug } from "@/utils/tenant-context";
import type { HostBranch, HostPerson, HostQueryResult, HostRole } from "@xvs/finance/host";

export { AppLogo } from "@/components/app-logo";
export { QuickExportButton } from "@/components/custom/quick-export-drawer";
export { UserAvatar } from "@/components/custom/user-avatar";
export { useDashboardTitle } from "@/components/layout/dashboard-header";
// The extra section on Setup -> Entities. It reads a console permission code
// that means something else entirely in the school app, which is why the
// package asks for it rather than shipping it.
export { PlatformLedgerInventory } from "@/components/finance/platform-ledger-inventory";

export function useBranches(): HostQueryResult<HostBranch> {
  const slug = getTenantSlug();
  const { data, isLoading, isError } = useGetBranchesQuery(
    { slug: slug!, params: { page_size: 100 } },
    { skip: !slug },
  );
  return { data: data?.data, isLoading, isError };
}

export function useDirectory(): HostQueryResult<HostPerson> {
  const { data, isLoading, isError } = useGetTeamMembersQuery({ page: 1, page_size: 500 });
  return { data: data?.data, isLoading, isError };
}

/** The console's roles, through the slice it already keeps.
 *
 *  The package does not read roles itself: both apps already query the same
 *  endpoint through their own slices, and a third would give each app two
 *  caches of one truth. See HostRole in the contract.
 */
export function useRoles(): HostQueryResult<HostRole> {
  const { data, isLoading, isError } = useGetAllRolesQuery({ page: 1, page_size: 500 });
  const rows = data?.data?.map((role) => ({
    id: role.id, key: role.key, name: role.name, status: role.status,
    assigned_users_count: role.assigned_users_count ?? 0,
  }));
  return { data: rows, isLoading, isError };
}

/** The console's own recently-opened trail. */
export { useLogRecentOpen } from "@/hooks/use-log-recent-open";

/** Where the console lists who holds which role. */
export const rolesHref = routesPath.PROTECTED.ROLES.USER_ASSIGNMENTS;

/** The console has the platform-wide staffing view; it keeps its own tab. */
export { default as ApprovalRolesTab } from "@/pages/protected/workflow-console/approval-roles-tab";
