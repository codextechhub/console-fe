import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionActionDetailQuery,
  useUpdatePermissionActionMutation,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

const schema = Yup.object({
  description: Yup.string().trim().required("Description is required"),
  is_active: Yup.boolean(),
});

export default function EditAction() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { data: actionData, isLoading: actionLoading } = useGetPermissionActionDetailQuery(name ?? "", { skip: !name });
  const [updateAction, { isLoading }] = useUpdatePermissionActionMutation();

  const action = actionData?.data;

  if (actionLoading) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </>
    );
  }

  if (!action) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Action not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="px-4.5 py-6 text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Action</h1>
          <p className="font-mono text-sm text-gray-01 mt-1">{action.name}</p>
        </div>

        <div className="flex items-start gap-3 mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
          <Lock size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            The action name is its key and cannot be changed — every permission that uses it ends with this slug.
          </p>
        </div>

        <Formik
          initialValues={{
            description: action.description ?? "",
            is_active: action.is_active,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateAction({
              name: name!,
              body: {
                description: values.description.trim(),
                is_active: values.is_active,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Action updated.");
                navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.description ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to update action.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => (
            <Form className="space-y-5">
              <div className="bg-white rounded-md p-6 space-y-5">
                <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                  Action Details
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-black-01 font-mont">Name</label>
                  <p className="font-mono text-sm px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-gray-400">
                    {action.name}
                  </p>
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
                  onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.ACTIONS.INDEX)}
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
    </>
  );
}
