import DashboardLayout from "@/components/layout/dashboard-layout";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import PromptModal from "@/components/modal/prompt-modal";
import { Button } from "@/components/ui/button";
import useToggleModal from "@/hooks/use-toggle";
import { routesPath } from "@/routes/routesPath";
import { useNavigate } from "react-router";
import { SearchSelect } from "@/components/custom/search-select";
import { useAllRoles } from "@/hooks/use-all-roles";
import { useFormik } from "formik";
import { createTeamMemberSchema } from "@/schema/dashboard/team-mgt";
import { useCreateTeamMemberMutation } from "@/redux/services/dashboard/teamMgtApi";

export default function CreateAdmin() {
  const navigate = useNavigate();
  const { isOpen, toggleClick } = useToggleModal(false);

  const { roles } = useAllRoles();
  const [createTeamMember, { isLoading: creating }] =
    useCreateTeamMemberMutation();


  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      phone: "",
      gender: "",
    },
    validationSchema: createTeamMemberSchema,
    onSubmit: (values) => {
      createTeamMember(values)
        .unwrap()
        .then(() => {
          toggleClick();
        })
        .catch(() => {}); // errors are shown by the global baseQueryInterceptor
    },
  });

  return (
    <DashboardLayout title="Team Management" hasBack>
      <section className="px-4.5 py-6">
        <>
          <form onSubmit={formik.handleSubmit} className="max-w-235">
            <div className="mb-7 space-y-1.5">
              <h4 className="font-medium text-xl text-black-01">
                Add Team Member
              </h4>
              <p className="text-gray-01 font-mont text-xs">
                Add a user to the system and select their role and module
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
                  formik.touched.last_name ? formik.errors.last_name : undefined
                }
              />
              <CustomInput
                id="email"
                label="Email Address"
                placeholder="Enter email address"
                isRequired
                {...formik.getFieldProps("email")}
                error={formik.touched.email ? formik.errors.email : undefined}
              />
              <SearchSelect
                id="role"
                label="Role Title"
                placeholder="Select role"
                options={roles.map((role) => ({ label: role.name, value: role.id }))}
                isRequired
                {...formik.getFieldProps("role")}
                error={formik.touched.role ? formik.errors.role : undefined}
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
                error={formik.touched.gender ? formik.errors.gender : undefined}
              />
            </div>

            <div className="mt-10 inline-flex items-center gap-4">
              <Button
                type="submit"
                disabled={!formik.isValid || creating}
                loading={creating}
                className="w-37"
              >
                Send Invite
              </Button>
            </div>
          </form>

          <PromptModal
            isOpen={isOpen}
            onConfirm={() => {
              navigate(routesPath.PROTECTED.TEAM_MGT.INDEX + "?tab=invites", {
                replace: true,
              });
            }}
            title="Invite Successfully Sent!"
            description={`You have successfully sent an invite to ${formik.values.first_name} ${formik.values.last_name}, click the button below to continue`}
          />
        </>
      </section>
    </DashboardLayout>
  );
}
