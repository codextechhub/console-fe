import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionModuleDetailQuery,
  useUpdatePermissionModuleMutation,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

const schema = Yup.object({
  description: Yup.string().trim(),
  is_active: Yup.boolean(),
});

export default function EditModule() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { data: moduleData, isLoading: moduleLoading } = useGetPermissionModuleDetailQuery(name ?? "", { skip: !name });
  const [updateModule, { isLoading }] = useUpdatePermissionModuleMutation();

  const mod = moduleData?.data;

  if (moduleLoading) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </>
    );
  }

  if (!mod) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Module not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageShell className="text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Module</h1>
          <p className="font-mono text-sm text-gray-01 mt-1">{mod.name}</p>
        </div>

        <Formik
          initialValues={{
            description: mod.description ?? "",
            is_active: mod.is_active,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateModule({
              name: name!,
              body: {
                description: values.description.trim(),
                is_active: values.is_active,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Module updated.");
                navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.name ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to update module.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => (
            <Form className="space-y-5">
              <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 space-y-5")}>
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-white-02 pb-3">
                  Module Details
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-black-01 font-mont">Module Name</label>
                  <p className="font-mono text-sm px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-400">
                    {mod.name}
                  </p>
                  <p className="text-xs text-gray-01">The module name is its key and cannot be changed.</p>
                </div>

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

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="white"
                  onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.MODULES.INDEX)}
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
