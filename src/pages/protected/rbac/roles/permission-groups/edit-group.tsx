import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionGroupDetailQuery,
  useUpdatePermissionGroupMutation,
  useGetPermissionsQuery,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { PageShell } from "@/components/layout/page-shell";

const schema = Yup.object({
  name: Yup.string().trim().required("Group name is required"),
  description: Yup.string().trim(),
});

export default function EditPermissionGroup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: groupData, isLoading: groupLoading } = useGetPermissionGroupDetailQuery(id ?? "", { skip: !id });
  const [updateGroup, { isLoading }] = useUpdatePermissionGroupMutation();
  const [permSearch, setPermSearch] = useState("");
  const debouncedPermSearch = useDebounce(permSearch, 350);
  const { data: permissionsData } = useGetPermissionsQuery({
    page_size: 100,
    ...(debouncedPermSearch.trim() ? { search: debouncedPermSearch.trim() } : {}),
  });

  const group = groupData?.data;
  const permissions = permissionsData?.data ?? [];
  const existingKeys = group?.permissions?.map((p) => p.key) ?? [];

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
          {group.is_system && (
            <p className="text-xs text-amber-600 mt-1">This is a system group. Some fields may be restricted.</p>
          )}
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
            const filteredPermissions = permissions;

            return (
              <Form className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-5 items-start">
                  <div className="bg-white rounded-md p-6 space-y-5">
                    <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
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

                  <div className="bg-white rounded-md p-6 flex flex-col gap-4">
                    <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                      Permissions
                    </h2>

                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-md border border-gray-200 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    {filteredPermissions.length === 0 ? (
                      <p className="text-sm text-gray-01 italic">No permissions match your search.</p>
                    ) : (
                      <div className="space-y-1 overflow-y-auto max-h-[500px] pr-1">
                        {filteredPermissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 accent-primary"
                              checked={values.permission_keys.includes(perm.key)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...values.permission_keys, perm.key]
                                  : values.permission_keys.filter((k) => k !== perm.key);
                                setFieldValue("permission_keys", next);
                              }}
                            />
                            <div>
                              <p className="text-xs font-mono font-medium text-black-01">{perm.key}</p>
                              {perm.description && <p className="text-xs text-gray-01">{perm.description}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
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
