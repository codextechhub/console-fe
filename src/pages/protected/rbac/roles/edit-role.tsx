import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { routesPath } from "@/routes/routesPath";
import {
  useGetPlatformRoleDetailQuery,
  useUpdatePlatformRoleMutation,
  useGetPermissionGroupsQuery,
} from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

const schema = Yup.object({
  name: Yup.string().trim().required("Role name is required"),
  description: Yup.string().trim(),
  status: Yup.string().oneOf(["ACTIVE", "INACTIVE"]).required("Status is required"),
});

export default function EditRole() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: roleData, isLoading: roleLoading } = useGetPlatformRoleDetailQuery(id ?? "", { skip: !id });
  const { data: groupsData } = useGetPermissionGroupsQuery({ page_size: 100 });
  const [updateRole, { isLoading }] = useUpdatePlatformRoleMutation();

  const role = roleData?.data;
  const groups = groupsData?.data ?? [];
  const attachedGroupIds = role?.role_groups?.map((rg) => rg.group.id) ?? [];

  if (roleLoading) {
    return (
      <DashboardLayout title="Edit Role">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!role) {
    return (
      <DashboardLayout title="Edit Role">
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Role not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Role">
      <main className="px-4.5 py-6 text-black-01 max-w-2xl">
        <button
          onClick={() => navigate(routesPath.PROTECTED.ROLES.INDEX)}
          className="flex items-center gap-1 text-sm text-gray-01 hover:text-black-01 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Platform Roles
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Role</h1>
          <p className="text-sm text-gray-01 mt-1">Update the details and permission groups for this role.</p>
        </div>

        {(role.is_system_role || role.is_locked) && (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {role.is_system_role ? "This is a system role and cannot be modified." : "This role is locked and cannot be modified."}
          </div>
        )}

        <Formik
          initialValues={{
            name: role.name ?? "",
            description: role.description ?? "",
            status: role.status ?? "ACTIVE",
            group_ids: attachedGroupIds,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateRole({
              id: id!,
              body: {
                name: values.name,
                description: values.description,
                status: values.status,
                group_ids: values.group_ids,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Role updated successfully.");
                navigate(routesPath.PROTECTED.ROLES.INDEX);
              })
              .catch(() => {})
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Basic Information
                </h2>

                <CustomInput
                  id="name"
                  name="name"
                  label="Role Name"
                  placeholder="e.g. Platform Finance Admin"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name ? errors.name : ""}
                  disabled={role.is_system_role || role.is_locked}
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                    Description <span className="text-gray-01">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={role.is_system_role || role.is_locked}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>

                <CustomNativeSelect
                  id="status"
                  name="status"
                  label="Status"
                  value={values.status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                  error={touched.status ? errors.status : ""}
                  disabled={role.is_system_role || role.is_locked}
                />
              </div>

              <div className="bg-white rounded-md p-6 space-y-4">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Permission Groups
                </h2>

                {groups.length === 0 ? (
                  <p className="text-sm text-gray-01 italic">No permission groups available.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-start gap-3 p-3 rounded-md border border-gray-100 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-primary"
                          checked={values.group_ids.includes(group.id)}
                          disabled={role.is_system_role || role.is_locked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...values.group_ids, group.id]
                              : values.group_ids.filter((gid) => gid !== group.id);
                            setFieldValue("group_ids", next);
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-black-01">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-gray-01 mt-0.5">{group.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{group.permissions_count} permissions</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="white"
                  onClick={() => navigate(routesPath.PROTECTED.ROLES.INDEX)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting || role.is_system_role || role.is_locked}
                >
                  {isLoading || isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </main>
    </DashboardLayout>
  );
}
