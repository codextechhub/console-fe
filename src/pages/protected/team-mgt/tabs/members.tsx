import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

const tableHeader = [
  "Full Name",
  "Email",
  "Role",
  "Status",
  "Date Created",
  "Action",
];

export default function MembersTab() {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 1000);
  const navigate = useNavigate();
  const [query, setQuery] = useState({
    page: 1,
    exclude_status: "PENDING",
  });

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [debouncedValue]);

  const params = useMemo(
    () => ({
      ...query,
      search: debouncedValue,
    }),
    [query, debouncedValue],
  );

  const { data, isFetching } = useGetTeamMembersQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  const [suspendUser] = useSuspendTeamMemberMutation();
  const [reactivateUser] = useReactivateTeamMemberMutation();
  const [unlockUser] = useUnlockTeamMemberMutation();

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

      <div className="flex items-center justify-between mt-8 gap-5">
        <CustomInput
          id="search"
          canSearch
          placeholder="Search..."
          className="h-10"
          containerClass="max-w-[280px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="inline-flex items-center gap-3.5">
          <Button
            variant={"white"}
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
          >
            {svgIcons.exportIcon} Export
          </Button>
        </div>
      </div>

      <CustomTable
        tableHeaderList={tableHeader}
        tableBodyList={FORMAT_TABLE_DATA(data?.data)}
        dropDown
        dropDownList={(row: { _slug: string; _status: string }) => {
          const statusAction = () => {
            if (row._status === "ACTIVE") {
              return {
                label: "Suspend",
                className: "text-destructive focus:text-destructive focus:bg-destructive/10",
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
                className: "text-green-600 focus:text-green-600 focus:bg-green-50",
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
                className: "text-amber-600 focus:text-amber-600 focus:bg-amber-50",
                onActionClick: () =>
                  unlockUser(row._slug)
                    .unwrap()
                    .then(() => toast.success("User unlocked successfully."))
                    .catch(() => {}),
              };
            }
            return null;
          };

          return [
            { label: "View Details", className: "", onActionClick: () => {} },
            {
              label: "Edit",
              className: "",
              onActionClick: () =>
                navigate(routesPath.PROTECTED.TEAM_MGT.EDIT(row._slug)),
            },
            statusAction(),
          ].filter(Boolean);
        }}
        perPage={data?.pagination?.pageSize}
        totalPage={data?.pagination?.totalPages}
        currentPage={data?.pagination?.currentPage}
        loading={isFetching}
      />
    </>
  );
}

const FORMAT_TABLE_DATA = (data?: TeamMember[]) => {
  return data?.map((item: any) => ({
    name: <p className="capitalize truncate">{item?.full_name || "---"}</p>,
    email: item?.email || "---",

    role: item?.role || "---",
    status: (
      <Badge variant={item.status?.toLowerCase()} className="min-w-19.25">
        {item?.status || "---"}
      </Badge>
    ),
    date: item?.created_at ? formatRelativeDate(item?.created_at) : "---",
    _slug: item?.id,
    _status: item?.status,
  }));
};
