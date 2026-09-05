import { useState } from "react";
import { permissionLabel } from "@/utils/permission-label";
import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPlatformRoleDetailQuery,
  useUpdatePlatformRoleMutation,
  useGetPermissionGroupsQuery,
  useGetPermissionsQuery,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";

const schema = Yup.object({
  name: Yup.string().trim().required("Role name is required"),
  description: Yup.string().trim(),
  status: Yup.string().oneOf(["ACTIVE", "INACTIVE"]).required("Status is required"),
});

export default function EditRole() {
  // The `:id` route segment now carries the per-tenant role KEY, not a numeric id.
  const { id: roleKey } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: roleData, isLoading: roleLoading } = useGetPlatformRoleDetailQuery(roleKey ?? "", { skip: !roleKey });
  const { data: groupsData } = useGetPermissionGroupsQuery({ page_size: 100 });
  const [updateRole, { isLoading }] = useUpdatePlatformRoleMutation();
  const [groupSearch, setGroupSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");
  const debouncedPermSearch = useDebounce(permSearch, 350);
  const { data: permissionsData } = useGetPermissionsQuery({
    page_size: 100,
    is_active: "true",
    ...(debouncedPermSearch.trim() ? { search: debouncedPermSearch.trim() } : {}),
  });

  const role = roleData?.data;
  const groups = groupsData?.data ?? [];
  const permissions = (permissionsData?.data ?? []).filter((p) => p.is_active);
  const attachedGroupIds = role?.role_groups?.map((rg) => rg.group.id) ?? [];
  const attachedPermissionKeys = role?.role_permissions?.filter((rp) => rp.granted).map((rp) => rp.permission_key) ?? [];

  // platform.roles.transfer is deliberately reserved for the active super
  // admin, making it the frontend equivalent of the backend super-admin check.
  const canEditProtectedRole = hasPermission(P.TRANSFER_SUPER_ADMIN);
  const isNameLocked = !!(
    (role?.is_system_role || role?.is_locked) && !canEditProtectedRole
  );

  if (roleLoading) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </>
    );
  }

  if (!role) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Role not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageShell className="text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Role</h1>
          <p className="text-sm text-gray-01 mt-1">Update the details and permission assignments for this role.</p>
        </div>

        {isNameLocked && (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {role.is_system_role
              ? "This is a system role - the name cannot be changed. You can still update the description and permissions."
              : "This role is locked - the name cannot be changed. You can still update the description and permissions."}
          </div>
        )}

        <Formik
          initialValues={{
            name: role.name ?? "",
            description: role.description ?? "",
            status: role.status ?? "ACTIVE",
            group_ids: attachedGroupIds,
            permission_keys: attachedPermissionKeys,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateRole({
              key: roleKey!,
              body: {
                name: values.name,
                description: values.description,
                status: values.status,
                group_ids: values.group_ids,
                permission_keys: values.permission_keys,
              },
            })
              .unwrap()
              .then(() => {
                toast.success("Role updated successfully.");
                navigate(routesPath.PROTECTED.ROLES.INDEX);
              })
              .catch(() => {})
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => {
            const filteredGroups = groupSearch
              ? groups.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
              : groups;

            const filteredPerms = permissions;

            return (
              <Form className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-5 items-start">
                  {/* Left - Basic Info */}
                  <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 space-y-5")}>
                    <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-white-02 pb-3">
                      Basic Information
                    </h2>

                    <CustomInput
                      id="name"
                      name="name"
                      label="Role Name"
                      isRequired
                      placeholder="e.g. Platform Finance Admin"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name ? errors.name : ""}
                      disabled={isNameLocked}
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

                    <SearchSelect
                      id="status"
                      name="status"
                      label="Status"
                      isRequired
                      value={values.status}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={[
                        { value: "ACTIVE", label: "Active" },
                        { value: "INACTIVE", label: "Inactive" },
                      ]}
                      error={touched.status ? errors.status : ""}
                    />
                  </div>

                  {/* Right - Permission Groups */}
                  <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 flex flex-col gap-4")}>
                    <div className="flex items-center justify-between border-b border-white-02 pb-3">
                      <h2 className="text-sm font-semibold font-mont text-black-01">Permission Groups</h2>
                      {values.group_ids.length > 0 && (
                        <span className="text-xs font-medium text-primary bg-pry-01/30 px-2 py-0.5 rounded-full">
                          {values.group_ids.length} selected
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search groups..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-md border border-gray-200 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    {groups.length === 0 ? (
                      <p className="text-sm text-gray-01 italic">No permission groups available.</p>
                    ) : filteredGroups.length === 0 ? (
                      <p className="text-sm text-gray-01 italic">No groups match your search.</p>
                    ) : (
                      <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                        {filteredGroups.map((group) => (
                          <label
                            key={group.id}
                            className="flex items-start gap-3 p-3 rounded-md border border-white-02 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 accent-primary"
                              checked={values.group_ids.includes(group.id)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...values.group_ids, group.id]
                                  : values.group_ids.filter((gid) => gid !== group.id);
                                setFieldValue("group_ids", next);
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium text-black-01">{group.name}</p>
                              {group.description && (
                                <p className="text-xs text-gray-01 mt-0.5">{group.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">{group.permissions_count} permissions</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Permissions - full width */}
                <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 flex flex-col gap-4")}>
                  <div className="flex items-center justify-between border-b border-white-02 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold font-mont text-black-01">Individual Permissions</h2>
                      <p className="text-xs text-gray-01 mt-0.5">
                        Grant specific permissions directly to this role, outside of any group.
                      </p>
                    </div>
                    {values.permission_keys.length > 0 && (
                      <span className="text-xs font-medium text-primary bg-pry-01/30 px-2 py-0.5 rounded-full shrink-0">
                        {values.permission_keys.length} selected
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search permissions by key or description..."
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 rounded-md border border-gray-200 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-01 italic">No permissions available.</p>
                  ) : filteredPerms.length === 0 ? (
                    <p className="text-sm text-gray-01 italic">No permissions match your search.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto max-h-[400px] pr-1">
                      {filteredPerms.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex items-start gap-3 p-3 rounded-md border border-white-02 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-primary shrink-0"
                            checked={values.permission_keys.includes(perm.key)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...values.permission_keys, perm.key]
                                : values.permission_keys.filter((k) => k !== perm.key);
                              setFieldValue("permission_keys", next);
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-black-01 line-clamp-1">{permissionLabel(perm)}</p>
                            <p className="text-xs font-mono text-gray-01 mt-0.5 truncate">{perm.key}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="white"
                    onClick={() => navigate(routesPath.PROTECTED.ROLES.INDEX)}
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
