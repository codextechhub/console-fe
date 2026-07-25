import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchSelect } from "@/components/custom/search-select";
import { routesPath } from "@/routes/routes-path";
import {
  useGetPermissionDetailQuery,
  useUpdatePermissionMutation,
  useGetPermissionModulesQuery,
  useGetPermissionResourcesQuery,
} from "@/redux/services/dashboard/rbac-api";
import { toast } from "sonner";
import { Loader2, Lock, Link2 } from "lucide-react";

const ACTIONS = ["view", "create", "update", "delete", "approve", "export", "import", "assign", "revoke", "refund", "send"];

const SENSITIVITY_BADGE: Record<string, "active" | "suspended" | "locked"> = {
  NORMAL: "active",
  SENSITIVE: "locked",
  CRITICAL: "suspended",
};

const schema = Yup.object({
  module: Yup.string().required("Module is required"),
  resource: Yup.string().required("Resource is required"),
  action: Yup.string().required("Action is required"),
  description: Yup.string().trim(),
  sensitivity_level: Yup.string().oneOf(["NORMAL", "SENSITIVE", "CRITICAL"]).required(),
  is_restricted: Yup.boolean(),
  is_active: Yup.boolean(),
});

export default function EditPermission() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const decodedKey = decodeURIComponent(key ?? "");
  const { data: permData, isLoading: permLoading } = useGetPermissionDetailQuery(decodedKey, { skip: !key });
  const [updatePermission, { isLoading }] = useUpdatePermissionMutation();

  const [selectedModule, setSelectedModule] = useState("");
  const { data: modulesData } = useGetPermissionModulesQuery({ page_size: 100 });
  const modules = (modulesData?.data ?? []).filter((m) => m.is_active);
  const { data: resourcesData, isFetching: resourcesFetching } = useGetPermissionResourcesQuery(
    { module: selectedModule, page_size: 200 },
    { skip: !selectedModule },
  );
  const resources = (resourcesData?.data ?? []).filter((r) => r.is_active);

  const perm = permData?.data;

  // Hydrate the module select when the permission arrives (guarded
  // render-phase adjustment instead of a setState-in-effect cascade).
  const [prevModuleKey, setPrevModuleKey] = useState<string | null>(null);
  if (perm?.module_key && perm.module_key !== prevModuleKey) {
    setPrevModuleKey(perm.module_key);
    setSelectedModule(perm.module_key);
  }

  if (permLoading) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin size-6 text-primary" />
        </div>
      </>
    );
  }

  if (!perm) {
    return (
      <>
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm text-destructive">Permission not found.</p>
        </div>
      </>
    );
  }

  const hasDependents = (perm.dependents?.length ?? 0) > 0;
  const hasGroups = (perm.groups?.length ?? 0) > 0;
  const hasDependencies = (perm.dependencies?.length ?? 0) > 0;

  return (
    <>
      <main className="px-4.5 py-6 text-black-01 space-y-5">
        <div>
          <h1 className="text-xl font-semibold font-mont text-black-01">Edit Permission</h1>
          <p className="font-mono text-sm text-gray-01 mt-1">{perm.key}</p>
        </div>

        {hasDependents && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <Lock size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Key fields are locked</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {perm.dependents!.length} other permission{perm.dependents!.length > 1 ? "s depend" : " depends"} on
                this one. Module, resource, and action cannot be changed while dependents exist. You can still update
                description and settings below.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {perm.dependents!.map((d) => (
                  <span key={d.key} className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {d.key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {(hasGroups || hasDependencies) && (
          <div className="bg-white rounded-md p-5 space-y-4">
            <p className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Link2 size={15} /> Connections
            </p>
            {hasGroups && (
              <div>
                <p className="text-xs text-gray-01 font-mont mb-2">Permission Groups</p>
                <div className="flex flex-wrap gap-2">
                  {perm.groups!.map((g) => (
                    <Badge key={g.id} variant={g.is_system ? "active" : "inactive"} className="text-xs">
                      {g.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {hasDependencies && (
              <div>
                <p className="text-xs text-gray-01 font-mont mb-2">Depends On</p>
                <div className="flex flex-wrap gap-1.5">
                  {perm.dependencies!.map((d) => (
                    <span key={d.key} className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {d.key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Formik
          initialValues={{
            module: perm.module_key,
            resource: perm.resource_key,
            action: perm.action_key,
            description: perm.description ?? "",
            sensitivity_level: perm.sensitivity_level ?? "NORMAL",
            is_restricted: perm.is_restricted,
            is_active: perm.is_active,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            const newKey = `${values.module}.${values.resource}.${values.action}`;
            const body: Record<string, unknown> = {
              module: values.module,
              resource: values.resource,
              action: values.action,
              description: values.description,
              sensitivity_level: values.sensitivity_level,
              is_restricted: values.is_restricted,
              is_active: values.is_active,
            };
            if (newKey !== decodedKey) {
              body.key = newKey;
            }
            updatePermission({ key: decodedKey, body })
              .unwrap()
              .then(() => {
                toast.success("Permission updated.");
                navigate(routesPath.PROTECTED.PERMISSIONS.INDEX);
              })
              .catch((err) => {
                const errors = err?.data?.errors;
                const msg =
                  errors?.key ||
                  errors?.resource ||
                  errors?.module ||
                  errors?.action ||
                  err?.data?.message ||
                  err?.data?.detail ||
                  (typeof err?.data === "string" ? err.data : null) ||
                  "Failed to update permission.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => {
            const keyPreview = `${values.module}.${values.resource}.${values.action}`;
            const keyChanged = keyPreview !== perm.key && values.module && values.resource && values.action;

            return (
              <Form className="space-y-5">
                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Permission Key
                  </h2>

                  <div className="bg-gray-50 rounded-md px-4 py-3 border border-gray-100 space-y-0.5">
                    <p className="text-xs text-gray-01 font-mont">Current key</p>
                    <p className="font-mono text-sm font-semibold text-black-01">{perm.key}</p>
                    {keyChanged && (
                      <p className="font-mono text-sm text-primary">→ {keyPreview}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SearchSelect
                      id="module"
                      name="module"
                      label="Module"
                      value={values.module}
                      onChange={(e) => {
                        const mod = e.target.value;
                        setFieldValue("module", mod);
                        setFieldValue("resource", "");
                        setSelectedModule(mod);
                      }}
                      onBlur={handleBlur}
                      options={modules.map((m) => ({ value: m.name, label: m.name }))}
                      disabled={hasDependents}
                    />
                    <SearchSelect
                      id="resource"
                      name="resource"
                      label="Resource"
                      placeholder={
                        !values.module
                          ? "Select module first"
                          : resourcesFetching
                            ? "Loading..."
                            : resources.length === 0
                              ? "No resources"
                              : "Select resource..."
                      }
                      value={values.resource}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={resources.map((r) => ({ value: r.name, label: r.name }))}
                      disabled={hasDependents || !values.module || resourcesFetching}
                      loading={resourcesFetching}
                    />
                    <SearchSelect
                      id="action"
                      name="action"
                      label="Action"
                      value={values.action}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={ACTIONS.map((a) => ({ value: a, label: a }))}
                      disabled={hasDependents}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Details & Classification
                  </h2>

                  <div>
                    <p className="text-xs text-gray-01 mb-1">Current sensitivity</p>
                    <Badge variant={SENSITIVITY_BADGE[perm.sensitivity_level] ?? "inactive"} className="capitalize">
                      {perm.sensitivity_level?.toLowerCase()}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      value={values.description}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <SearchSelect
                    id="sensitivity_level"
                    name="sensitivity_level"
                    label="Sensitivity Level"
                    value={values.sensitivity_level}
                    onChange={handleChange}
                    options={[
                      { value: "NORMAL", label: "Normal" },
                      { value: "SENSITIVE", label: "Sensitive" },
                      { value: "CRITICAL", label: "Critical" },
                    ]}
                  />

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={values.is_restricted}
                        onChange={(e) => setFieldValue("is_restricted", e.target.checked)}
                      />
                      <span className="text-sm text-black-01">Restricted</span>
                    </label>
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
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="white" onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}>
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
      </main>
    </>
  );
}
