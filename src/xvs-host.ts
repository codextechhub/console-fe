// The console's implementation of @xvs/finance's host contract.
// See packages/xvs-finance/src/host.ts for what each member is for.

import { useGetBranchesQuery } from "@/redux/services/dashboard/school-mgt-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import { getTenantSlug } from "@/utils/tenant-context";
import type { HostBranch, HostPerson, HostQueryResult } from "@xvs/finance/host";

export { AppLogo } from "@/components/app-logo";
export { QuickExportButton } from "@/components/custom/quick-export-drawer";
export { UserAvatar } from "@/components/custom/user-avatar";
export { useDashboardTitle } from "@/components/layout/dashboard-header";

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
