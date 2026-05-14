import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import { routesPath } from "@/routes/routesPath";
import { Link, useNavigate } from "react-router";
import {
  useGetTeamMembersQuery,
  useSuspendTeamMemberMutation,
  useReactivateTeamMemberMutation,
  useUnlockTeamMemberMutation,
} from "@/redux/services/dashboard/teamMgtApi";
import { useEffect, useMemo, useState } from "react";
import type { TeamMember } from "@/redux/services/dashboard/type";
import { formatRelativeDate } from "@/utils/helpers";
import { useDebounce } from "react-haiku";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/auth/authSlice";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { CustomDateInput } from "@/components/custom/custom-date-input";
import { useAllRoles } from "@/hooks/use-all-roles";
import { SortBar, buildOrdering, handleSortToggle } from "@/components/custom/sort-bar";

const tableHeader = [
  "Full Name",
  "Email",
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

export default function MembersTab() {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 1000);
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState({
    page: 1,
    exclude_status: "PENDING",
  });

  const { roles } = useAllRoles();

  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  useEffect(() => {
    setQuery((prev) => ({ ...prev, page: 1 }));
  }, [debouncedValue]);

  const params = useMemo(
    () => ({
      ...query,
      ...appliedFilters,
      search: debouncedValue,
      ordering: buildOrdering(sort.sortColumn, sort.sortOrder),
    }),
    [query, appliedFilters, debouncedValue, sort],
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
        <p className="font-semibold font-mont text-gray-01">User Information</p>
        <Link to={routesPath.PROTECTED.TEAM_MGT.CREATE}>
          <Button size="lg">
            <Plus /> Add New User
          </Button>
        </Link>
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
        options={SORT_OPTIONS}
        sortColumn={sort.sortColumn}
        sortOrder={sort.sortOrder}
        onSort={onSort}
        className="mt-3"
      />

      <CustomTable
        tableHeaderList={tableHeader}
        tableBodyList={isError ? [] : FORMAT_TABLE_DATA(data?.data)}
        emptyText={
          isError ? "Failed to load data. Please try again." : undefined
        }
        loading={isLoading}
        dropDown={!isError}
        dropDownList={(row: { _slug: string; _status: string }) => {
          const statusAction = () => {
            if (row._status === "ACTIVE") {
              if (String(currentUser?.id) === String(row._slug)) return null;
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
          return [
            {
              label: "View Details",
              className: "",
              onActionClick: () =>
                navigate(routesPath.PROTECTED.TEAM_MGT.VIEW(row._slug)),
            },
            {
              label: "Edit",
              className: "",
              onActionClick: () =>
                navigate(routesPath.PROTECTED.TEAM_MGT.EDIT(row._slug)),
            },
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

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold font-mont">
              Filters
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-5">
            <CustomNativeSelect
              id="filter-role"
              label="Role"
              placeholder="All roles"
              options={roles.map((r) => ({ value: r.name, label: r.name }))}
              value={draftFilters.role}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, role: e.target.value }))
              }
            />
            <CustomNativeSelect
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
    </>
  );
}

const FORMAT_TABLE_DATA = (data?: TeamMember[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => ({
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
