import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routesPath";
import { useCreatePermissionMutation, useGetPermissionModulesQuery } from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

const schema = Yup.object({
  module: Yup.string().required("Module is required"),
  resource: Yup.string().trim().required("Resource is required"),
  action: Yup.string().required("Action is required"),
  description: Yup.string().trim(),
  sensitivity_level: Yup.string().oneOf(["NORMAL", "SENSITIVE", "CRITICAL"]).required(),
  is_restricted: Yup.boolean(),
  is_active: Yup.boolean(),
});

const ACTIONS = ["view", "create", "update", "delete", "approve", "export", "import", "assign", "revoke", "refund", "send"];

export default function CreatePermission() {
  const navigate = useNavigate();
  const [createPermission, { isLoading }] = useCreatePermissionMutation();
  const { data: modulesData } = useGetPermissionModulesQuery({ page_size: 100 });
  const modules = (modulesData?.data ?? []).filter((m) => m.is_active);

  return (
    <DashboardLayout title="Create Permission">
      <main className="px-4.5 py-6 text-black-01 max-w-2xl">
        <button
          onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}
          className="flex items-center gap-1 text-sm text-gray-01 hover:text-black-01 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Permissions
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Create Permission</h1>
          <p className="text-sm text-gray-01 mt-1">
            Add a new permission to the platform registry. The key is composed as{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">module.resource.action</code>.
          </p>
        </div>

        <Formik
          initialValues={{
            module: "",
            resource: "",
            action: "",
            description: "",
            sensitivity_level: "NORMAL",
            is_restricted: false,
            is_active: true,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            createPermission({
              module: values.module,
              resource: values.resource,
              action: values.action,
              description: values.description,
              sensitivity_level: values.sensitivity_level,
              is_restricted: values.is_restricted,
              is_active: values.is_active,
            })
              .unwrap()
              .then(() => {
                toast.success("Permission created.");
                navigate(routesPath.PROTECTED.PERMISSIONS.INDEX);
              })
              .catch(() => {})
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => {
            const keyPreview = [values.module, values.resource, values.action].filter(Boolean).join(".");
            return (
              <Form className="space-y-5">
                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Permission Key
                  </h2>

                  {keyPreview && (
                    <div className="bg-gray-50 rounded-md px-4 py-3 border border-gray-100">
                      <p className="text-xs text-gray-01 font-mont mb-1">Preview key</p>
                      <p className="font-mono text-sm font-semibold text-black-01">{keyPreview}</p>
                    </div>
                  )}

                  <CustomNativeSelect
                    id="module"
                    name="module"
                    label="Module"
                    placeholder="Select module..."
                    value={values.module}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    options={modules.map((m) => ({ value: m.name, label: m.name }))}
                    error={touched.module ? errors.module : ""}
                  />

                  <CustomInput
                    id="resource"
                    name="resource"
                    label="Resource"
                    placeholder="e.g. invoice, profile, grades"
                    value={values.resource}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.resource ? errors.resource : ""}
                  />

                  <CustomNativeSelect
                    id="action"
                    name="action"
                    label="Action"
                    placeholder="Select action..."
                    value={values.action}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    options={ACTIONS.map((a) => ({ value: a, label: a }))}
                    error={touched.action ? errors.action : ""}
                  />
                </div>

                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Details & Classification
                  </h2>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                      Description <span className="text-gray-01">(optional)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="What does this permission allow?"
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
                  <Button
                    type="button"
                    variant="white"
                    onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || isSubmitting}>
                    {isLoading || isSubmitting ? "Creating..." : "Create Permission"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </main>
    </DashboardLayout>
  );
}
