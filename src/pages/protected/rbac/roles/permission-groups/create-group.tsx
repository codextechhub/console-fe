import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { AccessCataloguePicker } from "@/components/custom/access-catalogue-picker";
import { routesPath } from "@/routes/routes-path";
import { useCreatePermissionGroupMutation, useGetAccessCatalogueQuery } from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const schema = Yup.object({
  name: Yup.string().trim().required("Group name is required"),
  description: Yup.string().trim(),
  is_active: Yup.boolean(),
});

export default function CreatePermissionGroup() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(P.CREATE_PERMISSION_GROUP);
  const [createGroup, { isLoading }] = useCreatePermissionGroupMutation();
  const catalogue = useGetAccessCatalogueQuery(undefined, { skip: !canCreate });

  if (!canCreate) return <PageAccessDenied />;

  return (
    <>
      <PageShell className="text-black-01">
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
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => {
            return (
              <Form className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-5 items-start">
                  <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 space-y-5")}>
                    <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-white-02 pb-3">
                      Group Details
                    </h2>

                    <CustomInput
                      id="name"
                      name="name"
                      label="Group Name"
                      placeholder="e.g. Finance - Operations"
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

                  <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 flex flex-col gap-4")}>
                    <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-white-02 pb-3">
                      Permissions
                    </h2>
                    <p className="text-xs text-gray-01">
                      Select every permission this reusable role shortcut should include. Required dependencies must be selected too.
                    </p>
                    <AccessCataloguePicker
                      modules={catalogue.data?.data ?? []}
                      selected={new Set(values.permission_keys)}
                      loading={catalogue.isLoading}
                      disableRestricted
                      onToggle={(key) => {
                        const next = values.permission_keys.includes(key)
                          ? values.permission_keys.filter((entry) => entry !== key)
                          : [...values.permission_keys, key];
                        void setFieldValue("permission_keys", next);
                      }}
                    />
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
                    {isLoading || isSubmitting ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </PageShell>
    </>
  );
}
