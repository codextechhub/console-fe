import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { routesPath } from "@/routes/routes-path";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetTeamMembersQuery,
  useSuspendTeamMemberMutation,
  useReactivateTeamMemberMutation,
  useUnlockTeamMemberMutation,
} from "@/redux/services/dashboard/team-mgt-api";
import { useMemo, useState } from "react";
import type { TeamMember } from "@/redux/services/dashboard/dashboard-types";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/auth/auth-slice";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchSelect } from "@/components/custom/search-select";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { useAllRoles } from "@/hooks/use-all-roles";
import { SortBar, buildOrdering, handleSortToggle } from "@/components/custom/sort-bar";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { SchoolUserDetail, USER_TYPE_LABELS } from "../school-user-detail";

const CX_TABLE_HEADER = [
  "Full Name",
  "Email",
  "Role",
  "Status",
  "Date Created",
  "Action",
];

const SCHOOL_TABLE_HEADER = [
  "User",
  "School",
  "Branch",
  "User Type",
  "Role",
  "Status",
  "Date Created",
  "Action",
];

const INITIAL_FILTERS = {
  role: "",
  status: "",
  date_from: "",
  date_to: "",
  invited_by: "",
  school_id: "",
  user_type: "",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "LOCKED", label: "Locked" },
];

const SORT_OPTIONS = [
  { column: "first_name", label: "Name" },
  { column: "email", label: "Email" },
  { column: "role", label: "Role" },
  { column: "status", label: "Status" },
  { column: "created_at", label: "Date" },
];

export default function MembersTab({
  scope,
  variant = "members",
}: {
  scope: "cx" | "school";
  variant?: "members" | "drafts";
}) {
  const isDrafts = variant === "drafts";
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 1000);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSchoolUser, setSelectedSchoolUser] = useState<TeamMember | null>(null);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  // Drafts tab lists status=DRAFT; the members list hides drafts and invites.
  const [query, setQuery] = useState<Record<string, string | number>>(
    isDrafts ? { page: 1, status: "DRAFT" } : { page: 1, exclude_status: "PENDING,DRAFT" },
  );

  const { roles } = useAllRoles();
  const { data: schoolsRes } = useGetSchoolsQuery(
    { page_size: 100 },
    { skip: scope !== "school" },
  );

  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  // Reset to page 1 when the (debounced) search changes — done in the same
  // render pass, so no intermediate request with the old page is fired.
  const [prevSearch, setPrevSearch] = useState(debouncedValue);
  if (debouncedValue !== prevSearch) {
    setPrevSearch(debouncedValue);
    setQuery((prev) => ({ ...prev, page: 1 }));
  }

  const params = useMemo(
    () => ({
      ...query,
      ...appliedFilters,
      // Drafts tab is always pinned to status=DRAFT (an empty applied status
      // filter must not widen it back to everyone).
      ...(isDrafts ? { status: "DRAFT" } : {}),
      ...(scope === "cx" ? { user_type: "CX_STAFF" } : { scope: "school" }),
      search: debouncedValue,
      ordering: buildOrdering(sort.sortColumn, sort.sortOrder),
    }),
    [query, appliedFilters, debouncedValue, scope, sort, isDrafts],
  );

  const currentUser = useSelector(selectUser);

  const { data, isLoading, isError, refetch, isFetching } =
    useGetTeamMembersQuery(params, { refetchOnMountOrArgChange: true });

  const [suspendUser] = useSuspendTeamMemberMutation();
  const [reactivateUser] = useReactivateTeamMemberMutation();
  const [unlockUser] = useUnlockTeamMemberMutation();

  const handleOpenFilter = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setQuery((prev) => ({ ...prev, page: 1 }));
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setQuery((prev) => ({ ...prev, page: 1 }));
    setFilterOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-semibold font-mont text-gray-01">
          {isDrafts ? "Draft users" : "User Information"}
        </p>
        {scope === "cx" && !isDrafts && (
          <PermissionGate permission={P.INVITE_TEAM_MEMBER}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  <Plus /> Add New CX User
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border rounded-sm">
                <DropdownMenuItem
                  onClick={() => navigate(routesPath.PROTECTED.TEAM_MGT.CREATE)}
                  className="text-sm cursor-pointer text-custom-gray-scale-400"
                >
                  Create new user
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      `${routesPath.PROTECTED.DATA_IMPORTS.BATCHES.NEW}?dataset_type=cx_users&lock_template=true&return_to=${encodeURIComponent(
                        `${routesPath.PROTECTED.TEAM_MGT.CX}?tab=members`,
                      )}&return_label=${encodeURIComponent("CX Users")}`,
                    )
                  }
                  className="text-sm cursor-pointer text-custom-gray-scale-400"
                >
                  Bulk upload
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-8 gap-3">
        <CustomInput
          id="search"
          canSearch
          placeholder="Search..."
          className="h-10"
          containerClass="w-full sm:max-w-[280px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="inline-flex items-center gap-3.5 shrink-0">
          <Button
            variant="white"
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
          <Button
            variant="white"
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont relative"
            onClick={handleOpenFilter}
          >
            <SlidersHorizontal /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-semibold leading-none">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            variant={"white"}
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
          >
            {svgIcons.exportIcon} Export
          </Button>
        </div>
      </div>

      <SortBar
        options={scope === "school" ? SORT_OPTIONS.filter((option) => option.column !== "role") : SORT_OPTIONS}
        sortColumn={sort.sortColumn}
        sortOrder={sort.sortOrder}
        onSort={onSort}
        className="mt-3"
      />

      {isError ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3">
          <p className="text-sm font-medium text-destructive">
            Failed to load members. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <CustomTable
          tableHeaderList={scope === "school" ? SCHOOL_TABLE_HEADER : CX_TABLE_HEADER}
          tableBodyList={FORMAT_TABLE_DATA(data?.data, scope)}
          loading={isLoading}
          dropDown
          dropDownList={(row: { _slug: string; _status: string }) => {
            const statusAction = () => {
              if (row._status === "ACTIVE") {
                if (String(currentUser?.id) === String(row._slug)) return null;
                if (!hasPermission(P.SUSPEND_TEAM_MEMBER)) return null;
                return {
                  label: "Suspend",
                  className:
                    "text-destructive focus:text-destructive focus:bg-destructive/10",
                  onActionClick: () =>
                    suspendUser(row._slug)
                      .unwrap()
                      .then(() => toast.success("User suspended successfully."))
                      .catch(() => {}),
                };
              }
              if (row._status === "SUSPENDED") {
                if (!hasPermission(P.REACTIVATE_TEAM_MEMBER)) return null;
                return {
                  label: "Reactivate",
                  className:
                    "text-green-600 focus:text-green-600 focus:bg-green-50",
                  onActionClick: () =>
                    reactivateUser(row._slug)
                      .unwrap()
                      .then(() => toast.success("User reactivated successfully."))
                      .catch(() => {}),
                };
              }
              if (row._status === "LOCKED") {
                if (!hasPermission(P.REACTIVATE_TEAM_MEMBER)) return null;
                return {
                  label: "Unlock",
                  className:
                    "text-amber-600 focus:text-amber-600 focus:bg-amber-50",
                  onActionClick: () =>
                    unlockUser(row._slug)
                      .unwrap()
                      .then(() => toast.success("User unlocked successfully."))
                      .catch(() => {}),
                };
              }
              return null;
            };

            const action = statusAction();

            // A draft isn't a real member yet — its only action is Resume, which
            // reopens it in the add-user form to finish and submit.
            if (row._status === "DRAFT") {
              if (!hasPermission(P.INVITE_TEAM_MEMBER)) return [];
              return [{
                label: "Resume",
                className: "text-primary focus:text-primary focus:bg-primary/10",
                onActionClick: () =>
                  navigate(`${routesPath.PROTECTED.TEAM_MGT.CREATE}?draft=${row._slug}`),
              }];
            }

            if (scope === "school") {
              return [{
                label: "View Details",
                className: "",
                onActionClick: () => {
                  const selected = data?.data?.find((item) => item.id === row._slug) ?? null;
                  setSelectedSchoolUser(selected);
                },
              }];
            }
            return [
              ...(scope === "cx" ? [{
                label: "View Details",
                className: "",
                // Opens the staff profile, looked up by the user's id.
                onActionClick: () =>
                  navigate(routesPath.PROTECTED.ORGANOGRAM.STAFF_BY_USER(row._slug)),
              }] : []),
              ...(hasPermission(P.MODIFY_TEAM_MEMBER) ? [{
                label: "Edit",
                className: "",
                onActionClick: () =>
                  navigate(routesPath.PROTECTED.TEAM_MGT.EDIT(row._slug, scope === "cx" ? "cx" : "schools")),
              }] : []),
              ...(action ? [action] : []),
            ];
          }}
          perPage={data?.pagination?.pageSize}
          totalPage={data?.pagination?.totalPages}
          currentPage={data?.pagination?.currentPage}
          onPageChange={(page) =>
            setQuery((prev) => ({ ...prev, page: page as number }))
          }
        />
      )}

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold font-mont">
              Filters
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-5">
            <SearchSelect
              id="filter-school"
              label="School"
              placeholder="All schools"
              options={(schoolsRes?.data ?? []).map((school) => ({
                value: String(school.id),
                label: school.name,
              }))}
              value={draftFilters.school_id}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, school_id: e.target.value }))
              }
              containerClass={scope === "school" ? undefined : "hidden"}
            />
            <SearchSelect
              id="filter-user-type"
              label="User Type"
              placeholder="All user types"
              options={Object.entries(USER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              value={draftFilters.user_type}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, user_type: e.target.value }))
              }
              containerClass={scope === "school" ? undefined : "hidden"}
            />
            <SearchSelect
              id="filter-role"
              label="Role"
              placeholder="All roles"
              options={roles.map((r) => ({ value: r.name, label: r.name }))}
              value={draftFilters.role}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, role: e.target.value }))
              }
              containerClass={scope === "school" ? "hidden" : undefined}
            />
            <SearchSelect
              id="filter-status"
              label="Status"
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              value={draftFilters.status}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, status: e.target.value }))
              }
            />
            <CustomDateInput
              id="filter-date-from"
              label="Date Created From"
              value={draftFilters.date_from}
              onValueChange={(v) =>
                setDraftFilters((p) => ({ ...p, date_from: v }))
              }
            />
            <CustomDateInput
              id="filter-date-to"
              label="Date Created To"
              value={draftFilters.date_to}
              onValueChange={(v) =>
                setDraftFilters((p) => ({ ...p, date_to: v }))
              }
            />
            <CustomInput
              id="filter-invited-by"
              label="Invited By"
              placeholder="Search by name..."
              value={draftFilters.invited_by}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, invited_by: e.target.value }))
              }
            />
          </div>
          <SheetFooter>
            <div className="flex gap-3">
              <Button
                variant="white"
                className="flex-1"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
              <Button className="flex-1" onClick={handleApplyFilters}>
                Apply
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {scope === "school" && (
        <SchoolUserDetail user={selectedSchoolUser} onClose={() => setSelectedSchoolUser(null)} />
      )}
    </>
  );
}

const FORMAT_TABLE_DATA = (data: TeamMember[] | undefined, scope: "cx" | "school") => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => scope === "school" ? {
    user: (
      <div className="min-w-40">
        <p className="capitalize truncate">{item?.full_name?.trim() || "---"}</p>
        <p className="mt-0.5 truncate text-xs font-normal text-gray-01">{item?.email?.trim() || "---"}</p>
      </div>
    ),
    school: item?.school_name?.trim() || "---",
    branch: item?.branch_name?.trim() || "School-wide",
    userType: USER_TYPE_LABELS[item?.user_type] || item?.user_type || "---",
    role: item?.role?.trim() || "---",
    status: (
      <Badge variant={item.status?.toLowerCase()} className="min-w-19.25">
        {item?.status?.trim() || "---"}
      </Badge>
    ),
    date: item?.created_at ? formatRelativeDate(item.created_at) : "---",
    _slug: item?.id,
    _status: item?.status,
  } : ({
    name: <p className="capitalize truncate">{item?.full_name?.trim() || "---"}</p>,
    email: item?.email?.trim() || "---",
    role: item?.role?.trim() || "---",
    status: (
      <Badge variant={item.status?.toLowerCase()} className="min-w-19.25">
        {item?.status?.trim() || "---"}
      </Badge>
    ),
    date: item?.created_at ? formatRelativeDate(item?.created_at) : "---",
    _slug: item?.id,
    _status: item?.status,
  }));
};
