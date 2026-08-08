import { useState } from "react";
import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { SearchSelect } from "@/components/custom/search-select";
import { routesPath } from "@/routes/routes-path";
import {
  useCreatePermissionResourceMutation,
  useGetPermissionModulesQuery,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";

const schema = Yup.object({
  module: Yup.string().required("Module is required"),
  name: Yup.string()
    .trim()
    .matches(/^[a-z][a-z0-9_]*$/, "Lowercase, underscores, must start with a letter")
    .required("Resource name is required"),
  description: Yup.string().trim().required("Description is required"),
  is_active: Yup.boolean(),
});

export default function CreateResource() {
  const navigate = useNavigate();
  const [createResource, { isLoading }] = useCreatePermissionResourceMutation();
  const { data: modulesData } = useGetPermissionModulesQuery({ page_size: 200 });
  const modules = (modulesData?.data ?? []).filter((m) => m.is_active);

  const [nameInput, setNameInput] = useState("");

  return (
    <>
      <main className="px-4.5 py-6 text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Create Permission Resource</h1>
          <p className="text-sm text-gray-01 mt-1">
            Resources are the middle segment of a permission key -{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">module.resource.action</code>.
            Each resource is scoped to one module.
          </p>
        </div>

        <Formik
          initialValues={{ module: "", name: "", description: "", is_active: true }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            createResource({
              module: values.module,
              name: values.name.trim(),
              description: values.description.trim(),
              is_active: values.is_active,
            })
              .unwrap()
              .then(() => {
                toast.success(`Resource ${values.module}.${values.name} created.`);
                navigate(routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.name ||
                  errors?.module ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to create resource.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => {
            const keyPreview = values.module && values.name ? `${values.module}.${values.name}` : "";
            return (
              <Form className="space-y-5">
                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Resource Details
                  </h2>

                  {keyPreview && (
                    <div className="bg-gray-50 rounded-md px-4 py-3 border border-gray-100">
                      <p className="text-xs text-gray-01 font-mont mb-1">Resource key preview</p>
                      <p className="font-mono text-sm font-semibold text-black-01">{keyPreview}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SearchSelect
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

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="name" className="text-xs font-medium text-black-01 font-mont">
                        Name (slug) <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        className={`w-full h-10 px-3 rounded-md border text-sm font-mono text-black-01 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${touched.name && errors.name ? "border-destructive" : "border-gray-200"}`}
                        placeholder="e.g. invoice"
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
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                      Description <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      placeholder="What does this resource represent?"
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
                    onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!dirty || isLoading || isSubmitting}>
                    {isLoading || isSubmitting ? "Creating..." : "Create Resource"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </main>
    </>
  );
}
