import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import PromptModal from "@/components/modal/prompt-modal";
import { Button } from "@/components/ui/button";
import useToggleModal from "@/hooks/use-toggle";
import { routesPath } from "@/routes/routes-path";
import { useNavigate } from "react-router";
import { SearchSelect } from "@/components/custom/search-select";
import { useAllRoles } from "@/hooks/use-all-roles";
import { useFormik } from "formik";
import { useMemo } from "react";
import { createTeamMemberSchema } from "@/schema/dashboard/team-mgt";
import { useCreateTeamMemberMutation } from "@/redux/services/dashboard/team-mgt-api";
import { useGetOrgNodesQuery, useGetPositionsQuery } from "@/redux/services/dashboard/organogram-api";
import { buildOrgNodeMap, resolveTiers } from "@/pages/protected/organogram/lib/org-helpers";

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

export default function CreateAdmin() {
  const navigate = useNavigate();
  const { isOpen, toggleClick } = useToggleModal(false);

  const { roles } = useAllRoles();
  const [createTeamMember, { isLoading: creating }] =
    useCreateTeamMemberMutation();

  // Organogram seat is required at creation; the position's title IS the job title.
  const { data: positionsRes } = useGetPositionsQuery({ page_size: 100 });
  const { data: orgNodesRes } = useGetOrgNodesQuery({ page_size: 100 });
  const positions = useMemo(() => (Array.isArray(positionsRes?.data) ? positionsRes!.data : []), [positionsRes]);
  const positionOptions = useMemo(
    () => positions.map((p) => ({ value: String(p.id), label: `${p.title} · ${p.code}` })),
    [positions],
  );
  const orgNodeMap = useMemo(
    () => buildOrgNodeMap(Array.isArray(orgNodesRes?.data) ? orgNodesRes!.data : []),
    [orgNodesRes],
  );

  // CX-staff creation goes through the PLATFORM_USER_CREATION approval workflow —
  // the backend returns a workflow_instance and sends NO invite until approved.
  // Key the success messaging off the response so it stays correct if an
  // immediate-invite path is ever reached here.
  const [pendingApproval, setPendingApproval] = useState(false);

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      phone: "",
      gender: "",
      // Optional seat + HR prefill (CX staff). Empty values are stripped below.
      position: "",
      job_title: "",
      employee_id: "",
      employment_type: "",
      date_joined: "",
    },
    validationSchema: createTeamMemberSchema,
    onSubmit: (values) => {
      // Send the core fields plus only the optional seat/HR fields that were set
      // — the backend rejects an empty date and treats blanks as "not provided".
      const payload: Record<string, string> = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        phone: values.phone,
        gender: values.gender,
      };
      if (values.position) payload.position = values.position;
      if (values.job_title.trim()) payload.job_title = values.job_title.trim();
      if (values.employee_id.trim()) payload.employee_id = values.employee_id.trim();
      if (values.employment_type) payload.employment_type = values.employment_type;
      if (values.date_joined) payload.date_joined = values.date_joined;

      createTeamMember(payload)
        .unwrap()
        .then((res) => {
          setPendingApproval(!!(res as { workflow_instance?: unknown })?.workflow_instance);
          toggleClick();
        })
        .catch(() => {}); // errors are shown by the global baseQueryInterceptor
    },
  });

  // Division / Department / Team are derived from the selected position's org
  // node (walking up the tier hierarchy) — read-only, shown for context.
  const tiers = useMemo(() => {
    const pos = positions.find((p) => String(p.id) === formik.values.position);
    return resolveTiers(orgNodeMap, pos?.org_node?.id ?? null);
  }, [positions, orgNodeMap, formik.values.position]);

  return (
    <DashboardLayout title="CX Users" hasBack>
      <section className="px-4.5 py-6">
        <>
          <form onSubmit={formik.handleSubmit} className="max-w-235">
            <div className="mb-7 space-y-1.5">
              <h4 className="font-medium text-xl text-black-01">
                Add Team Member
              </h4>
              <p className="text-gray-01 font-mont text-xs">
                Add a user to the system and select their role and module
                access. New members are submitted for approval — an invitation
                is sent automatically once the request is approved.
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
                options={roles.map((role) => ({ label: role.name, value: role.key }))}
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

            {/* Seat & HR details. The seat is required — its title becomes the
                job title. The seat is held but not counted as occupied until the
                hire activates, and is vacated if the creation is rejected. */}
            <div className="mt-9 mb-4 space-y-1">
              <p className="inline-flex items-center text-gray-05 text-sm">Seat &amp; HR details</p>
              <p className="text-xs text-gray-01">Slot the new hire into a position — its title fills the job title automatically. Other HR fields are optional.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <SearchSelect
                id="position"
                label="Position (seat)"
                placeholder="Select a seat"
                isRequired
                options={positionOptions}
                value={formik.values.position}
                onChange={(e) => {
                  const id = e.target.value;
                  formik.setFieldValue("position", id);
                  // The position's title IS the job title — keep them in sync.
                  const pos = positions.find((p) => String(p.id) === id);
                  formik.setFieldValue("job_title", pos?.title ?? "");
                }}
                error={formik.touched.position ? formik.errors.position : undefined}
              />
              <CustomInput
                id="job_title"
                label="Job Title"
                placeholder="Filled from the selected position"
                readOnly
                className="bg-gray-06/40 cursor-not-allowed"
                {...formik.getFieldProps("job_title")}
              />
              {/* Derived from the position's org node — read-only, for context. */}
              <CustomInput
                id="division"
                label="Division"
                placeholder="From position"
                readOnly
                className="bg-gray-06/40 cursor-not-allowed"
                value={tiers.division?.name ?? ""}
              />
              <CustomInput
                id="department"
                label="Department"
                placeholder="From position"
                readOnly
                className="bg-gray-06/40 cursor-not-allowed"
                value={tiers.department?.name ?? ""}
              />
              <CustomInput
                id="team"
                label="Team"
                placeholder="From position"
                readOnly
                className="bg-gray-06/40 cursor-not-allowed"
                value={tiers.team?.name ?? ""}
              />
              <CustomInput
                id="employee_id"
                label="Employee ID"
                placeholder="e.g., CX-0042"
                {...formik.getFieldProps("employee_id")}
                error={formik.touched.employee_id ? formik.errors.employee_id : undefined}
              />
              <SearchSelect
                id="employment_type"
                label="Employment Type"
                placeholder="Select type"
                options={EMPLOYMENT_TYPE_OPTIONS}
                {...formik.getFieldProps("employment_type")}
              />
              <CustomInput
                id="date_joined"
                label="Date Joined"
                type="date"
                {...formik.getFieldProps("date_joined")}
              />
            </div>

            <div className="mt-10 inline-flex items-center gap-4">
              <Button
                type="submit"
                disabled={!formik.isValid || creating}
                loading={creating}
                className="w-fit px-6"
              >
                Submit for Approval
              </Button>
            </div>
          </form>

          <PromptModal
            isOpen={isOpen}
            onConfirm={() => {
              navigate(
                pendingApproval
                  ? routesPath.PROTECTED.WORKFLOW.MY_SUBMISSIONS
                  : routesPath.PROTECTED.TEAM_MGT.CX + "?tab=invites",
                { replace: true },
              );
            }}
            title={pendingApproval ? "Submitted for Approval" : "Invite Successfully Sent!"}
            description={
              pendingApproval
                ? `${formik.values.first_name} ${formik.values.last_name} has been submitted for approval. They'll get an invitation to set up their account once the request is approved. Track its progress under My Submissions.`
                : `You have successfully sent an invite to ${formik.values.first_name} ${formik.values.last_name}, click the button below to continue.`
            }
            onConfirmText={pendingApproval ? "View My Submissions" : undefined}
          />
        </>
      </section>
    </DashboardLayout>
  );
}
