import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routesPath";
import {
  useGetPermissionGroupDetailQuery,
  useUpdatePermissionGroupMutation,
  useGetPermissionsQuery,
} from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = Yup.object({
  name: Yup.string().trim().required("Group name is required"),
  description: Yup.string().trim(),
});

export default function EditPermissionGroup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: groupData, isLoading: groupLoading } = useGetPermissionGroupDetailQuery(id ?? "", { skip: !id });
  const { data: permissionsData } = useGetPermissionsQuery({ page_size: 200 });
  const [updateGroup, { isLoading }] = useUpdatePermissionGroupMutation();

  const group = groupData?.data;
  const permissions = permissionsData?.data ?? [];
  const existingKeys = group?.permissions?.map((p) => p.key) ?? [];

  if (groupLoading) {
    return (
      <DashboardLayout title="Edit Permission Group">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout title="Edit Permission Group">
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Group not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Permission Group" hasBack onBack={() => navigate(routesPath.PROTECTED.ROLES.GROUPS.INDEX)}>
      <main className="px-4.5 py-6 text-black-01 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Permission Group</h1>
          {group.is_system && (
            <p className="text-xs text-amber-600 mt-1">This is a system group. Some fields may be restricted.</p>
          )}
        </div>

        <Formik
          initialValues={{
            name: group.name ?? "",
            description: group.description ?? "",
            is_active: group.is_active,
            permission_keys: existingKeys,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateGroup({
              id: id!,
              body: {
                name: values.name,
                description: values.description,
                is_active: values.is_active,
                permission_keys: values.permission_keys,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Group updated.");
                navigate(routesPath.PROTECTED.ROLES.GROUPS.INDEX);
              })
              .catch(() => {})
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Group Details
                </h2>

                <CustomInput
                  id="name"
                  name="name"
                  label="Group Name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name ? errors.name : ""}
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
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={values.is_active}
                    onChange={(e) => setFieldValue("is_active", e.target.checked)}
                  />
                  <span className="text-sm text-black-01">Active</span>
                </label>
              </div>

              <div className="bg-white rounded-md p-6 space-y-4">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Permissions
                </h2>

                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {permissions.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-start gap-3 p-2.5 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-primary"
                        checked={values.permission_keys.includes(perm.key)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...values.permission_keys, perm.key]
                            : values.permission_keys.filter((k) => k !== perm.key);
                          setFieldValue("permission_keys", next);
                        }}
                      />
                      <div>
                        <p className="text-xs font-mono font-medium text-black-01">{perm.key}</p>
                        {perm.description && <p className="text-xs text-gray-01">{perm.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="white"
                  onClick={() => navigate(routesPath.PROTECTED.ROLES.GROUPS.INDEX)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!dirty || isLoading || isSubmitting}>
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
