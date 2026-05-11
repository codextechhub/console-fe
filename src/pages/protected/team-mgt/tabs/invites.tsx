import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
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
import { RefreshCw } from "lucide-react";

const tableHeader = [
  "Full Name",
  "Email",
  "Role",
  "Status",
  "Date Created",
  "Action",
];

export default function InvitesTab() {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 1000);
  const [query, setQuery] = useState({
    page: 1,
    status: "PENDING",
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

  const { data, isLoading, isError, refetch, isFetching } = useGetTeamMembersQuery(params, {
    refetchOnMountOrArgChange: true,
  });


  const [resendInvite] = useResendInviteMutation();
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-semibold font-mont text-gray-01"></p>
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
        tableBodyList={isError ? [] : FORMAT_TABLE_DATA(data?.data)}
        emptyText={isError ? "Failed to load data. Please try again." : undefined}
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
              // .catch(() => {});
            },
          },
        ]}
        perPage={data?.pagination?.pageSize}
        totalPage={data?.pagination?.totalPages}
        currentPage={data?.pagination?.currentPage}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page: page as number }))}
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
  }));
};
