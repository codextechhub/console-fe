import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routes-path";
import { useCreatePermissionModuleMutation } from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";

const schema = Yup.object({
  name: Yup.string()
    .trim()
    .matches(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores")
    .required("Module name is required"),
  description: Yup.string().trim(),
  is_active: Yup.boolean(),
});

export default function CreateModule() {
  const navigate = useNavigate();
  const [createModule, { isLoading }] = useCreatePermissionModuleMutation();

  return (
    <DashboardLayout
      title="Create Module"
      hasBack
      onBack={() => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX)}
    >
      <main className="px-4.5 py-6 text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Create Permission Module</h1>
          <p className="text-sm text-gray-01 mt-1">
            Modules are top-level categories that group resources. The name becomes part of every permission key in this module.
          </p>
        </div>

        <Formik
          initialValues={{ name: "", description: "", is_active: true }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            createModule({
              name: values.name.trim(),
              description: values.description.trim(),
              is_active: values.is_active,
            })
              .unwrap()
              .then(() => {
                toast.success("Module created.");
                navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.name ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to create module.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Module Details
                </h2>

                <CustomInput
                  id="name"
                  name="name"
                  label="Module Name"
                  placeholder="e.g. payments"
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
                    placeholder="What does this module cover?"
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

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="white"
                  onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!dirty || isLoading || isSubmitting}>
                  {isLoading || isSubmitting ? "Creating..." : "Create Module"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </main>
    </DashboardLayout>
  );
}
