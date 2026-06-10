// Staff Directory — admin list of CX staff profiles. Gated by
// platform.staff_profile.view. Row → full profile; create → new profile.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { SearchSelect } from "@/components/custom/search-select";
import { CustomInput } from "@/components/custom/custom-input";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { useDebounce } from "@/hooks/use-debounce";
import { useGetStaffProfilesQuery, useGetOrgNodesQuery } from "@/redux/services/dashboard/organogramApi";
import type { StaffProfileListItem } from "@/redux/services/dashboard/organogramTypes";
import { OrgAvatar, StatusPill, EmpBadge } from "../components/org-primitives";

const HEADERS = ["Name", "Job Title", "Department", "Employment", "Status"];

const STATUS_OPTS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXITED", label: "Exited" },
];

export default function StaffDirectory() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orgNode, setOrgNode] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const { data: nodesRes } = useGetOrgNodesQuery({ page_size: 100 });
  const nodeOptions = useMemo(
    () => [{ value: "", label: "All org units" }, ...(nodesRes?.data ?? []).map((d) => ({ value: String(d.id), label: `${d.name} · ${d.kind}` }))],
    [nodesRes],
  );

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (orgNode) p.org_node = orgNode;
    if (status) p.employment_status = status;
    return p;
  }, [page, debouncedSearch, orgNode, status]);

  const { data, isLoading, isFetching } = useGetStaffProfilesQuery(params, { refetchOnMountOrArgChange: true });
  const items = useMemo(() => data?.data ?? [], [data]);

  const tableData = useMemo(
    () =>
      items.map((s: StaffProfileListItem) => ({
        name: (
          <div className="flex items-center gap-2.5">
            <OrgAvatar user={s.user} size={30} status={s.employment_status} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-black-01">{s.user.full_name}</div>
              <div className="truncate text-xs text-gray-01">{s.user.email}</div>
            </div>
          </div>
        ),
        jobTitle: <span className="text-sm">{s.job_title || "—"}</span>,
        department: <span className="text-sm">{s.department?.name || "—"}</span>,
        employment: <EmpBadge type={s.employment_type} />,
        status: <StatusPill status={s.employment_status} />,
        _id: s.id,
      })),
    [items],
  );

  return (
    <DashboardLayout title="Staff Directory">
      <main className="px-4.5 py-6 space-y-5 text-black-01">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold font-mont text-gray-01">Staff Directory</p>
            <p className="text-xs text-gray-01 mt-0.5">CX staff profiles — HR, contact and employment records.</p>
          </div>
          <PermissionGate permission={P.CREATE_STAFF_PROFILE}>
            <Button size="lg" onClick={() => navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_CREATE)}>
              <Plus className="size-4" /> New Profile
            </Button>
          </PermissionGate>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <CustomInput id="staff-search" label="" placeholder="Search name, email, employee ID…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <SearchSelect options={nodeOptions} value={orgNode} onChange={(e) => { setOrgNode(e.target.value); setPage(1); }} placeholder="All org units" revealOnSearch />
          <SearchSelect options={STATUS_OPTS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses" clearable={false} />
        </div>

        <CustomTable
          tableHeaderList={HEADERS}
          tableBodyList={tableData}
          loading={isLoading || isFetching}
          currentPage={page}
          totalPage={data?.pagination.totalPages ?? 0}
          onPageChange={(p) => setPage(Number(p))}
          onRowClick={(row) => row?._id && navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_VIEW(row._id))}
          emptyText="No staff profiles found."
        />
      </main>
    </DashboardLayout>
  );
}
