import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionResourceDetailQuery,
  useUpdatePermissionResourceMutation,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

const schema = Yup.object({
  description: Yup.string().trim().required("Description is required"),
  is_active: Yup.boolean(),
});

export default function EditResource() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: resourceData, isLoading: resourceLoading } = useGetPermissionResourceDetailQuery(id ?? "", { skip: !id });
  const [updateResource, { isLoading }] = useUpdatePermissionResourceMutation();

  const resource = resourceData?.data;

  if (resourceLoading) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </>
    );
  }

  if (!resource) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Resource not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageShell className="text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Resource</h1>
          <p className="font-mono text-sm text-gray-01 mt-1">{resource.module}.{resource.name}</p>
        </div>

        <div className="flex items-start gap-3 mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
          <Lock size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Module and name are the resource key and cannot be changed. Delete and recreate if you need to rekey.
          </p>
        </div>

        <Formik
          initialValues={{
            description: resource.description ?? "",
            is_active: resource.is_active,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateResource({
              id: id!,
              body: {
                description: values.description.trim(),
                is_active: values.is_active,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Resource updated.");
                navigate(routesPath.PROTECTED.PERMISSIONS.RESOURCES.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.description ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to update resource.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => (
            <Form className="space-y-5">
              <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 space-y-5")}>
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-white-02 pb-3">
                  Resource Details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-black-01 font-mont">Module</label>
                    <p className="font-mono text-sm px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-400">
                      {resource.module}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-black-01 font-mont">Name</label>
                    <p className="font-mono text-sm px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-400">
                      {resource.name}
                    </p>
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
                  {isLoading || isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </PageShell>
    </>
  );
}
