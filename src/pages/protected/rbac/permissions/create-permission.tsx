import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { ChevronDown, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomNativeSelect } from "@/components/custom/custom-native-select";
import { cn } from "@/lib/utils";
import { routesPath } from "@/routes/routesPath";
import {
  useCreatePermissionMutation,
  useGetPermissionActionsQuery,
  useGetPermissionModulesQuery,
  useGetPermissionResourcesQuery,
} from "@/redux/services/dashboard/rbacApi";
import { toast } from "sonner";

const schema = Yup.object({
  module: Yup.string().required("Module is required"),
  resource: Yup.string().trim().required("Resource is required"),
  action: Yup.string().required("Action is required"),
  description: Yup.string().trim(),
  sensitivity_level: Yup.string().oneOf(["NORMAL", "SENSITIVE", "CRITICAL"]).required(),
  is_restricted: Yup.boolean(),
  is_active: Yup.boolean(),
});

function ActionPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(
    () => (search.trim() ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options),
    [options, search],
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label htmlFor="action" className="text-xs font-medium text-black-01 font-mont">
        Action <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <button
          id="action"
          type="button"
          onClick={() => {
            if (open) setSearch("");
            setOpen((v) => !v);
          }}
          className={cn(
            "w-full h-10 px-3 rounded-md border text-sm font-mono text-left bg-white outline-none flex items-center justify-between gap-2 transition-colors",
            open ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300",
          )}
        >
          <span className={cn("truncate", selected ? "text-black-01" : "text-gray-400")}>
            {selected ? selected.label : "Search and select action..."}
          </span>
          <ChevronDown className={cn("size-4 text-gray-01 shrink-0 transition-transform duration-150", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search className="size-3.5 text-gray-01 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="flex-1 text-xs font-mono text-black-01 outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-01 text-center">No actions match "{search}".</p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs font-mono transition-colors",
                      o.value === value ? "bg-pry-01/40 text-primary font-semibold" : "hover:bg-gray-50 text-black-01",
                    )}
                  >
                    {o.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePermission() {
  const navigate = useNavigate();
  const [createPermission, { isLoading }] = useCreatePermissionMutation();
  const [selectedModule, setSelectedModule] = useState("");

  const { data: modulesData } = useGetPermissionModulesQuery({ page_size: 100 });
  const modules = (modulesData?.data ?? []).filter((m) => m.is_active);

  const { data: resourcesData, isFetching: resourcesFetching } = useGetPermissionResourcesQuery(
    { module: selectedModule, page_size: 200 },
    { skip: !selectedModule },
  );
  const resources = (resourcesData?.data ?? []).filter((r) => r.is_active);
  const { data: actionsData, isFetching: actionsFetching } = useGetPermissionActionsQuery({ page_size: 500 });
  const actionOptions = (actionsData?.data ?? [])
    .filter((a) => a.is_active)
    .map((a) => ({ value: a.name, label: a.name }));

  return (
    <DashboardLayout title="Create Permission" hasBack onBack={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}>
      <main className="px-4.5 py-6 text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Create Permission</h1>
          <p className="text-sm text-gray-01 mt-1">
            Add a new permission to the platform registry. The key is composed as{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">module.resource.action</code>.
          </p>
        </div>

        <Formik
          initialValues={{
            module: "",
            resource: "",
            action: "",
            description: "",
            sensitivity_level: "NORMAL",
            is_restricted: false,
            is_active: true,
          }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            createPermission({
              module: values.module,
              resource: values.resource,
              action: values.action,
              description: values.description,
              sensitivity_level: values.sensitivity_level,
              is_restricted: values.is_restricted,
              is_active: values.is_active,
            })
              .unwrap()
              .then(() => {
                toast.success("Permission created.");
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
                  "Failed to create permission.";
                toast.error(msg);
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, dirty }) => {
            const keyPreview = [values.module, values.resource, values.action].filter(Boolean).join(".");

            const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const mod = e.target.value;
              setFieldValue("module", mod);
              setFieldValue("resource", "");
              setSelectedModule(mod);
            };

            return (
              <Form className="space-y-5">
                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Permission Key
                  </h2>

                  {keyPreview && (
                    <div className="bg-gray-50 rounded-md px-4 py-3 border border-gray-100">
                      <p className="text-xs text-gray-01 font-mont mb-1">Preview key</p>
                      <p className="font-mono text-sm font-semibold text-black-01">{keyPreview}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <CustomNativeSelect
                      id="module"
                      name="module"
                      label="Module"
                      placeholder="Select module..."
                      value={values.module}
                      onChange={handleModuleChange}
                      onBlur={handleBlur}
                      options={modules.map((m) => ({ value: m.name, label: m.name }))}
                      error={touched.module ? errors.module : ""}
                    />

                    <CustomNativeSelect
                      id="resource"
                      name="resource"
                      label="Resource"
                      placeholder={
                        !values.module
                          ? "Select a module first"
                          : resourcesFetching
                            ? "Loading resources..."
                            : resources.length === 0
                              ? "No resources for this module"
                              : "Select resource..."
                      }
                      value={values.resource}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={resources.map((r) => ({ value: r.name, label: r.name }))}
                      disabled={!values.module || resourcesFetching}
                      loading={resourcesFetching}
                      error={touched.resource ? errors.resource : ""}
                    />

                    <div>
                      <ActionPicker
                        options={actionOptions}
                        value={values.action}
                        onChange={(v) => setFieldValue("action", v)}
                      />
                      {actionsFetching && <p className="mt-1 text-xs text-gray-01">Loading actions...</p>}
                      {!actionsFetching && touched.action && errors.action && (
                        <p className="mt-1 text-xs text-destructive">{errors.action}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md p-6 space-y-5">
                  <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-gray-100 pb-3">
                    Details & Classification
                  </h2>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="description" className="text-xs font-medium text-black-01 font-mont">
                      Description <span className="text-gray-01">(optional)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="What does this permission allow?"
                      value={values.description}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black-01 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <CustomNativeSelect
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
                  <Button
                    type="button"
                    variant="white"
                    onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.INDEX)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!dirty || isLoading || isSubmitting}>
                    {isLoading || isSubmitting ? "Creating..." : "Create Permission"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </main>
    </DashboardLayout>
  );
}
