import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { routesPath } from "@/routes/routesPath";
import {
  useGetPermissionDetailQuery,
  useUpdatePermissionMutation,
} from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

const schema = Yup.object({
  description: Yup.string().trim(),
  sensitivity_level: Yup.string().oneOf(["NORMAL", "SENSITIVE", "CRITICAL"]).required(),
  is_restricted: Yup.boolean(),
  is_active: Yup.boolean(),
});

export default function EditPermission() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const decodedKey = decodeURIComponent(key ?? "");
  const { data: permData, isLoading: permLoading } = useGetPermissionDetailQuery(decodedKey, { skip: !key });
  const [updatePermission, { isLoading }] = useUpdatePermissionMutation();

  const perm = permData?.data;

  if (permLoading) {
    return (
      <DashboardLayout title="Edit Permission">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!perm) {
    return (
      <DashboardLayout title="Edit Permission">
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Permission not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Permission">
      <main className="px-4.5 py-6 text-black-01 max-w-2xl">
        <button
          onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}
          className="flex items-center gap-1 text-sm text-gray-01 hover:text-black-01 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Permissions
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Permission</h1>
          <p className="font-mono text-sm text-gray-01 mt-1">{perm.key}</p>
        </div>

        <div className="bg-gray-50 rounded-md px-4 py-3 border border-gray-100 mb-5">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-01">Module</p>
              <p className="font-medium capitalize">{perm.module_key}</p>
            </div>
            <div>
              <p className="text-xs text-gray-01">Resource</p>
              <p className="font-medium capitalize">{perm.resource_key}</p>
            </div>
            <div>
              <p className="text-xs text-gray-01">Action</p>
              <p className="font-medium capitalize">{perm.action_key}</p>
            </div>
          </div>
        </div>

        <Formik
          initialValues={{
            description: perm.description ?? "",
            sensitivity_level: perm.sensitivity_level ?? "NORMAL",
            is_restricted: perm.is_restricted,
            is_active: perm.is_active,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updatePermission({
              key: decodedKey,
              body: {
                description: values.description,
                sensitivity_level: values.sensitivity_level,
                is_restricted: values.is_restricted,
                is_active: values.is_active,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Permission updated.");
                navigate(routesPath.PROTECTED.PERMISSIONS.INDEX);
              })
              .catch(() => {})
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, handleChange, setFieldValue, isSubmitting }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Details
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    value={values.description}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <CustomNativeSelect
                  id="sensitivity_level"
                  name="sensitivity_level"
                  label="Sensitivity Level"
                  value={values.sensitivity_level}
                  onChange={handleChange}
                  options={[
                    { value: "NORMAL", label: "Normal" },
                    { value: "SENSITIVE", label: "Sensitive" },
                    { value: "CRITICAL", label: "Critical" },
                  ]}
                />

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={values.is_restricted}
                      onChange={(e) => setFieldValue("is_restricted", e.target.checked)}
                    />
                    <span className="text-sm text-black-01">Restricted</span>
                  </label>
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
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="white" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isSubmitting}>
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
