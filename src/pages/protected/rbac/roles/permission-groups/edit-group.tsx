import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { AccessCataloguePicker } from "@/components/custom/access-catalogue-picker";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionGroupDetailQuery,
  useUpdatePermissionGroupMutation,
  useGetAccessCatalogueQuery,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import PageAccessDenied from "@/components/custom/page-access-denied";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";

const schema = Yup.object({
  name: Yup.string().trim().required("Group name is required"),
  description: Yup.string().trim(),
});

export default function EditPermissionGroup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(P.UPDATE_PERMISSION_GROUP);
  const { data: groupData, isLoading: groupLoading } = useGetPermissionGroupDetailQuery(id ?? "", { skip: !id || !canUpdate });
  const [updateGroup, { isLoading }] = useUpdatePermissionGroupMutation();
  const catalogue = useGetAccessCatalogueQuery(undefined, { skip: !canUpdate });

  const group = groupData?.data;
  const existingKeys = group?.permissions?.map((p) => p.key) ?? [];

  if (!canUpdate) return <PageAccessDenied />;

  if (groupLoading) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Group not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageShell className="text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Permission Group</h1>
          <p className="text-sm text-gray-01 mt-1">Change the reusable permission bundle administrators attach to roles.</p>
        </div>

        <Formik
          initialValues={{
            name: group.name ?? "",
            description: group.description ?? "",
            is_active: group.is_active,
            permission_keys: existingKeys,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateGroup({
              id: id!,
              body: {
                name: values.name,
                description: values.description,
                is_active: values.is_active,
                permission_keys: values.permission_keys,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Group updated.");
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
                    <p className="text-xs text-gray-01">Required dependencies must remain selected with the permissions that need them.</p>
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
                    {isLoading || isSubmitting ? "Saving..." : "Save Changes"}
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
