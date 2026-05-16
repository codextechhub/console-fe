import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routesPath";
import { useCreatePermissionGroupMutation, useGetPermissionsQuery } from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";

const schema = Yup.object({
  name: Yup.string().trim().required("Group name is required"),
  description: Yup.string().trim(),
  is_active: Yup.boolean(),
});

export default function CreatePermissionGroup() {
  const navigate = useNavigate();
  const [createGroup, { isLoading }] = useCreatePermissionGroupMutation();
  const { data: permissionsData } = useGetPermissionsQuery({ page_size: 200 });
  const permissions = permissionsData?.data ?? [];

  return (
    <DashboardLayout title="Create Permission Group" hasBack onBack={() => navigate(routesPath.PROTECTED.ROLES.GROUPS.INDEX)}>
      <main className="px-4.5 py-6 text-black-01 max-w-2xl">

        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Create Permission Group</h1>
          <p className="text-sm text-gray-01 mt-1">Bundle related permissions together for easy role assignment.</p>
        </div>

        <Formik
          initialValues={{ name: "", description: "", is_active: true, permission_keys: [] as string[] }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            createGroup({
              name: values.name,
              description: values.description,
              is_active: values.is_active,
              permission_keys: values.permission_keys,
            })
              .unwrap()
              .then(() => {
                toast.success("Permission group created.");
                navigate(routesPath.PROTECTED.ROLES.GROUPS.INDEX);
              })
              .catch(() => {})
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Group Details
                </h2>

                <CustomInput
                  id="name"
                  name="name"
                  label="Group Name"
                  placeholder="e.g. Finance — Operations"
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
                    placeholder="Briefly describe what this group covers..."
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
                <p className="text-xs text-gray-01">
                  Select the individual permissions that belong to this group.
                </p>

                {permissions.length === 0 ? (
                  <p className="text-sm text-gray-01 italic">No permissions available.</p>
                ) : (
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
                          {perm.description && (
                            <p className="text-xs text-gray-01">{perm.description}</p>
                          )}
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
                  onClick={() => navigate(routesPath.PROTECTED.ROLES.GROUPS.INDEX)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isSubmitting}>
                  {isLoading || isSubmitting ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </main>
    </DashboardLayout>
  );
}
