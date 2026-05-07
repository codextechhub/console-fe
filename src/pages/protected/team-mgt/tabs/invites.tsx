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
import { format } from "date-fns";
import { toast } from "sonner";

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

  const { data, isFetching } = useGetTeamMembersQuery(params, {
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
              // resendInvite(param._slug).unwrap()
              // .then(() => {
              //   // Handle success, e.g., show a success message
              // })
              // .catch(() => {});
            },
          },
        ]}
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
      <Badge variant={item.status?.toLowerCase()} className="w-19.25">
        {item?.status || "---"}
      </Badge>
    ),
    date: item?.created_at ? format(item?.created_at, "dd MMM, yyyy") : "---",
    _slug: item?.id,
  }));
};
