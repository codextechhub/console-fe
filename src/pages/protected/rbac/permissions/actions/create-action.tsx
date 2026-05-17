import { useState } from "react";
import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routesPath";
import { useCreatePermissionActionMutation } from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";

const schema = Yup.object({
  name: Yup.string()
    .trim()
    .matches(/^[a-z][a-z0-9_]*$/, "Lowercase, underscores, must start with a letter")
    .required("Action name is required"),
  description: Yup.string().trim().required("Description is required"),
  is_active: Yup.boolean(),
});

export default function CreateAction() {
  const navigate = useNavigate();
  const [createAction, { isLoading }] = useCreatePermissionActionMutation();
  const [nameInput, setNameInput] = useState("");

  return (
    <DashboardLayout
      title="Create Action"
      hasBack
      onBack={() => navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX)}
    >
      <main className="px-4.5 py-6 text-black-01 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Create Permission Action</h1>
          <p className="text-sm text-gray-01 mt-1">
            Actions are the final segment of a permission key —{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">module.resource.action</code>.
            They describe the verb an actor performs: view, create, approve, refund.
          </p>
        </div>

        <Formik
          initialValues={{ name: "", description: "", is_active: true }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            createAction({
              name: values.name.trim(),
              description: values.description.trim(),
              is_active: values.is_active,
            })
              .unwrap()
              .then(() => {
                toast.success(`Action "${values.name}" created.`);
                navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.name ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to create action.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Action Details
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs font-medium text-black-01 font-mont">
                    Name (slug) <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-gray-01">Lowercase letters and underscores only. e.g. view, create, approve.</p>
                  <input
                    id="name"
                    name="name"
                    className={`w-full h-10 px-3 rounded-md border text-sm font-mono text-black-01 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${touched.name && errors.name ? "border-destructive" : "border-gray-200"}`}
                    placeholder="e.g. approve"
                    value={nameInput}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      setNameInput(val);
                      setFieldValue("name", val);
                    }}
                    onBlur={handleBlur}
                  />
                  {touched.name && errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="What does this action allow?"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-md border px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${touched.description && errors.description ? "border-destructive" : "border-gray-200"}`}
                  />
                  {touched.description && errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
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
                  onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isSubmitting}>
                  {isLoading || isSubmitting ? "Creating..." : "Create Action"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </main>
    </DashboardLayout>
  );
}
