import DashboardLayout from "@/components/layout/dashboard-layout";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routes-path";
import { useNavigate, useParams } from "react-router";
import { SearchSelect } from "@/components/custom/search-select";
import { useFormik } from "formik";
import { editTeamMemberSchema } from "@/schema/dashboard/team-mgt";
import {
  useUpdateTeamMemberMutation,
  useGetTeamMembersDetailsQuery,
} from "@/redux/services/dashboard/team-mgt-api";
import { toast } from "sonner";

export default function EditAdmin() {
  const navigate = useNavigate();
  const params = useParams();
  const { data: teamMember, isLoading } = useGetTeamMembersDetailsQuery(
    params?.id || "",
    { skip: !params?.id },
  );
  const [updateTeamMember, { isLoading: updating }] =
    useUpdateTeamMemberMutation();


  const formik = useFormik({
    initialValues: {
      first_name: teamMember?.data?.first_name || "",
      last_name: teamMember?.data?.last_name || "",
      phone: teamMember?.data?.phone || "",
      gender: teamMember?.data?.gender || "",
    },
    enableReinitialize: true,
    validationSchema: editTeamMemberSchema,
    onSubmit: (values) => {
      updateTeamMember({ id: params?.id, body: values })
        .unwrap()
        .then(() => {
          toast.success("Team member updated successfully!");
          navigate(routesPath.PROTECTED.TEAM_MGT.INDEX);
        })
        .catch(() => {});
    },
  });
  return (
    <DashboardLayout title="Team Management" hasBack>
      {!isLoading && teamMember?.data ? (
        <section className="px-4.5 py-6">
          <>
            <form onSubmit={formik.handleSubmit} className="max-w-235">
              <div className="mb-7 space-y-1.5">
                <h4 className="font-medium text-xl text-black-01">
                  Edit Team Member
                </h4>
                <p className="text-gray-01 font-mont text-xs">
                  Edit a user to the system and select their role and module
                  access.
                </p>
              </div>

              <p className="inline-flex items-center text-gray-05 text-sm mb-4">
                User Group
                <figure className="size-fit ml-2">{svgIcons.infoIcon}</figure>
              </p>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <CustomInput
                  id="first_name"
                  label="First Name"
                  placeholder="Enter first name e.g., Emeka"
                  isRequired
                  {...formik.getFieldProps("first_name")}
                  error={
                    formik.touched.first_name
                      ? formik.errors.first_name
                      : undefined
                  }
                />
                <CustomInput
                  id="last_name"
                  label="Last Name"
                  placeholder="Enter last name e.g., Osegbo"
                  isRequired
                  {...formik.getFieldProps("last_name")}
                  error={
                    formik.touched.last_name
                      ? formik.errors.last_name
                      : undefined
                  }
                />
                <CustomInput
                  id="email"
                  label="Email Address"
                  placeholder="Enter email address"
                  value={teamMember?.data?.email}
                  disabled
                />
                <CustomInput
                  id="role"
                  label="Role Title"
                  value={teamMember?.data?.role || ""}
                  disabled
                />
                <CustomInput
                  id="phone"
                  label="Phone Number"
                  placeholder="Enter phone number e.g., +23481..."
                  isRequired
                  {...formik.getFieldProps("phone")}
                  error={formik.touched.phone ? formik.errors.phone : undefined}
                />
                <SearchSelect
                  id="gender"
                  label="Gender"
                  placeholder="Select gender"
                  options={[
                    { label: "Male", value: "MALE" },
                    { label: "Female", value: "FEMALE" },
                  ]}
                  isRequired
                  {...formik.getFieldProps("gender")}
                  error={
                    formik.touched.gender ? formik.errors.gender : undefined
                  }
                />
              </div>

              <div className="mt-10 inline-flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={!formik.isValid || !formik.dirty || updating}
                  loading={updating}
                  className="w-37"
                >
                  Update User
                </Button>
              </div>
            </form>
          </>
        </section>
      ) : (
        <section className="grid h-[80vh] place-content-center">
          <div className="loader" />
        </section>
      )}
    </DashboardLayout>
  );
}
