import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { Link } from "react-router";
import { routesPath } from "@/routes/routesPath";
import {
  useGetTeamMembersQuery,
  useResendInviteMutation,
} from "@/redux/services/dashboard/teamMgtApi";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "react-haiku";
import type { TeamMember } from "@/redux/services/dashboard/type";
import { formatRelativeDate } from "@/utils/helpers";
import { toast } from "sonner";
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

const tableHeader = [
  "Full Name",
  "Email",
  "Role",
  "Status",
  "Email Sent",
  "Days Left",
  "Date Created",
  "Action",
];

const INITIAL_FILTERS = {
  role: "",
  date_from: "",
  date_to: "",
  invited_by: "",
};

const SORT_OPTIONS = [
  { column: "first_name", label: "Name" },
  { column: "email", label: "Email" },
  { column: "role", label: "Role" },
  { column: "created_at", label: "Date" },
];

export default function InvitesTab() {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 1000);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState({ sortColumn: "", sortOrder: "" as "asc" | "desc" | "" });
  const onSort = (col: string) => handleSortToggle(col, sort, setSort);
  const [query, setQuery] = useState({
    page: 1,
    status: "PENDING",
  });

  const { roles } = useAllRoles();

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

  const { data, isLoading, isError, refetch, isFetching } =
    useGetTeamMembersQuery(params, { refetchOnMountOrArgChange: true });

  const [resendInvite] = useResendInviteMutation();

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
        <p className="font-semibold font-mont text-gray-01"></p>
        <PermissionGate permission={P.INVITE_TEAM_MEMBER}>
          <Link to={routesPath.PROTECTED.TEAM_MGT.CREATE}>
            <Button size="lg">
              <Plus /> Add New User
            </Button>
          </Link>
        </PermissionGate>
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
        dropDownList={[
          {
            label: "Resend Invite",
            className: "",
            onActionClick: (param: { _slug: string }) => {
              toast.promise(resendInvite(param._slug).unwrap(), {
                loading: "Resending invite...",
                success: "Invite resent successfully",
                error: "Failed to resend invite",
              });
            },
          },
        ]}
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
            <SearchSelect
              id="filter-role"
              label="Role"
              placeholder="All roles"
              options={roles.map((r) => ({ value: r.name, label: r.name }))}
              value={draftFilters.role}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, role: e.target.value }))
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

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const EMAIL_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SENT: "active",
  PENDING: "pending",
  FAILED: "suspended",
};

const daysLeft = (expiresAt?: string): string => {
  if (!expiresAt) return "---";
  const now = new Date();
  const expiry = new Date(expiresAt);
  // Floor both to local midnight so comparison is timezone-aware
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryLocal = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const days = Math.round((expiryLocal.getTime() - todayLocal.getTime()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  return `${days}d left`;
};

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
    emailSent: item?.invitation_email_status ? (
      <Badge
        variant={EMAIL_STATUS_VARIANT[item.invitation_email_status] ?? "pending"}
        className="min-w-16"
      >
        {item.invitation_email_status}
      </Badge>
    ) : (
      "---"
    ),
    daysLeft: (
      <span
        className={
          daysLeft(item?.invitation_expires_at) === "Expired"
            ? "text-destructive font-medium text-xs"
            : "text-xs"
        }
      >
        {daysLeft(item?.invitation_expires_at)}
      </span>
    ),
    date: item?.created_at ? formatRelativeDate(item?.created_at) : "---",
    _slug: item?.id,
  }));
};
