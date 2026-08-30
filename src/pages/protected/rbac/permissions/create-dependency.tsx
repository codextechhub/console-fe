import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routes-path";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { INFORMATION_CARD_SURFACE } from "@/components/ui/card-surface";
import { PageShell } from "@/components/layout/page-shell";
import {
  useCreatePermissionDependencyMutation,
  useGetPermissionsQuery,
  useGetPermissionDependenciesQuery,
} from "@/redux/services/dashboard/rbac-api";

function PermissionPicker({
  label,
  description,
  options,
  value,
  onChange,
  placeholder = "Search permissions...",
}: {
  label: string;
  description: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  );

  const selected = options.find((o) => o.value === value);

  // Guarded render-phase adjustment: clear the search whenever the dropdown
  // closes (covers outside-click, selection and toggle paths alike).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setSearch("");
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
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
      <label className="text-xs font-medium text-black-01">
        {label} <span className="text-destructive">*</span>
      </label>
      <p className="text-xs text-gray-01">{description}</p>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full h-10 px-3 rounded-md border text-sm font-mono text-left bg-white outline-none flex items-center justify-between gap-2 transition-colors",
            open
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200 hover:border-gray-300",
          )}
        >
          <span className={cn("truncate", selected ? "text-black-01" : "text-gray-400")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-gray-01 shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
            <div className="p-2 border-b border-white-02 flex items-center gap-2">
              <Search className="size-3.5 text-gray-01 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="flex-1 text-xs font-mono text-black-01 outline-none placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-01 hover:text-black-01 text-xs shrink-0"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-01 text-center">
                  No permissions match "{search}".
                </p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs font-mono transition-colors",
                      o.value === value
                        ? "bg-pry-01/40 text-primary font-semibold"
                        : "hover:bg-gray-50 text-black-01",
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

export default function CreateDependency() {
  const navigate = useNavigate();
  const [permKey, setPermKey] = useState("");
  const [depsOnKey, setDepsOnKey] = useState("");
  const [error, setError] = useState("");

  const [createDep, { isLoading }] = useCreatePermissionDependencyMutation();
  const { data: permsData } = useGetPermissionsQuery({ page: 1, page_size: 500 });
  const { data: existingData } = useGetPermissionDependenciesQuery({ page_size: 500 });

  const perms = permsData?.data ?? [];
  const existingDeps = existingData?.data ?? [];
  const permOptions = perms.map((p) => ({ value: p.key, label: p.key }));
  const canPreview = permKey && depsOnKey;

  const handleSubmit = () => {
    setError("");
    if (!permKey || !depsOnKey) { setError("Pick exactly one permission and one dependency."); return; }
    if (permKey === depsOnKey) { setError("A permission cannot depend on itself."); return; }
    if (existingDeps.some((d) => d.permission_key === permKey && d.depends_on_key === depsOnKey)) {
      setError("This dependency already exists.");
      return;
    }
    createDep({ permission_key: permKey, depends_on_key: depsOnKey })
      .unwrap()
      .then(() => {
        toast.success(`Dependency added: ${permKey} → ${depsOnKey}`);
        navigate(routesPath.PROTECTED.PERMISSIONS.DEPENDENCIES.INDEX);
      })
      .catch((err) => {
        setError(err?.data?.detail || "Failed to add dependency.");
      });
  };

  return (
    <>
      <PageShell className="text-black-01">
        <div className="mb-6">
          <h1 className="text-xl font-semibold font-mont text-black-01">Add Permission Dependency</h1>
          <p className="text-sm text-gray-01 mt-1">
            Define that a permission requires another permission to be granted alongside it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-start">
          {/* Left - picker form */}
          <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 space-y-5")}>
            <h2 className="text-sm font-semibold font-mont text-black-01 border-b border-white-02 pb-3">
              Select Permissions
            </h2>

            <PermissionPicker
              label="Permission"
              description="The permission that has a dependency."
              options={permOptions}
              value={permKey}
              onChange={(v) => { setError(""); setPermKey(v); }}
              placeholder="Search and select a permission..."
            />

            <div className="flex items-center gap-2 text-gray-01 text-xs py-1">
              <ArrowRight className="size-4" />
              <span>requires</span>
            </div>

            <PermissionPicker
              label="Depends On"
              description="The permission that must also be granted."
              options={permOptions.filter((p) => p.value !== permKey)}
              value={depsOnKey}
              onChange={(v) => { setError(""); setDepsOnKey(v); }}
              placeholder="Search and select the required permission..."
            />

            {error && (
              <div className="rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3 text-xs text-destructive">
                <p className="font-semibold">Cannot add dependency</p>
                <p className="mt-0.5">{error}</p>
              </div>
            )}
          </div>

          {/* Right - preview + info */}
          <div className="space-y-5">
            <div className={cn(INFORMATION_CARD_SURFACE, "rounded-md p-6 space-y-3")}>
              <p className="text-xs font-semibold text-black-01 uppercase tracking-wide">Preview</p>
              {canPreview ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-black-01 bg-gray-50 border border-white-02 rounded px-3 py-1.5">
                    {permKey}
                  </span>
                  <div className="flex items-center gap-1.5 text-gray-01">
                    <ArrowRight className="size-4" />
                    <span className="text-xs font-medium">requires</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-primary bg-pry-01/30 border border-pry-01 rounded px-3 py-1.5">
                    {depsOnKey}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-01">
                  Select both permissions to preview the dependency.
                </p>
              )}
            </div>

            <div className="rounded-md bg-pry-01/30 border border-pry-01 px-4 py-4 space-y-2 text-xs text-gray-01">
              <p className="font-semibold text-black-01">How dependencies work</p>
              <ul className="list-disc list-inside space-y-1">
                <li>When a role grants the left permission, the right permission must also be granted.</li>
                <li>Dependencies are validated when roles are assigned to users.</li>
                <li>Circular dependencies are not allowed.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-5">
          <Button
            variant="white"
            size="lg"
            onClick={() => navigate(routesPath.PROTECTED.PERMISSIONS.DEPENDENCIES.INDEX)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={isLoading || !canPreview}>
            {isLoading ? "Adding..." : "Add Dependency"}
          </Button>
        </div>
      </PageShell>
    </>
  );
}
