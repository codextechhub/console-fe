// Create/update dialog shared by the Settings panels. One dialog, five modes —
// each maps to a single backend write endpoint under /config/.

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCapabilityMutation,
  useCreateConfigDefinitionMutation,
  useGetCapabilitiesQuery,
  useGetConfigDefinitionsQuery,
  useSetConfigValuesMutation,
  useSetEntitlementMutation,
  useSetOverrideMutation,
} from "@/redux/services/config-api";

export type ConfigDialogMode = "definition" | "value" | "capability" | "entitlement" | "override";

const TITLES: Record<ConfigDialogMode, string> = {
  definition: "New definition",
  value: "Set configuration value",
  capability: "New capability",
  entitlement: "Set entitlement",
  override: "Add override",
};

/** Coerce the raw input string to the definition's value type. */
function parse(raw: string, type?: string) {
  if (!raw) return null;
  if (type === "BOOLEAN") return raw === "true";
  if (type === "INTEGER" || type === "DECIMAL") return Number(raw);
  if (type === "JSON") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export function ConfigDialog({ mode, close }: { mode: ConfigDialogMode; close: () => void }) {
  // Pickers only fetch when their mode needs them.
  const defs = useGetConfigDefinitionsQuery(undefined, { skip: mode !== "value" });
  const caps = useGetCapabilitiesQuery(undefined, { skip: !["entitlement", "override"].includes(mode) });

  const [createDef, { isLoading: creatingDef }] = useCreateConfigDefinitionMutation();
  const [setValue, { isLoading: settingValue }] = useSetConfigValuesMutation();
  const [createCap, { isLoading: creatingCap }] = useCreateCapabilityMutation();
  const [setEnt, { isLoading: settingEnt }] = useSetEntitlementMutation();
  const [setOver, { isLoading: settingOver }] = useSetOverrideMutation();
  const busy = creatingDef || settingValue || creatingCap || settingEnt || settingOver;

  const [form, setForm] = useState<Record<string, string>>({
    key: "",
    label: "",
    description: "",
    value_type: "STRING",
    default_value: "",
    allowed_scopes: "platform",
    sensitivity: "PUBLIC",
    value: "",
    reason: "",
    kind: "MODULE",
    default_enabled: "false",
    requires_entitlement: "true",
    capability: "",
    state: mode === "entitlement" ? "GRANTED" : "INHERIT",
    source: "MANUAL",
  });

  const set =
    (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((x) => ({ ...x, [k]: ev.target.value }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (mode === "definition")
      await createDef({
        key: form.key,
        label: form.label,
        description: form.description,
        value_type: form.value_type,
        default_value: parse(form.default_value, form.value_type),
        validation_rules: {},
        allowed_scopes: form.allowed_scopes.split(",").map((x) => x.trim()),
        sensitivity: form.sensitivity,
        is_active: true,
      }).unwrap();
    if (mode === "value")
      await setValue({
        values: [
          {
            key: form.key,
            value: parse(form.value, defs.data?.data.find((x) => x.key === form.key)?.value_type),
            reason: form.reason,
          },
        ],
      }).unwrap();
    if (mode === "capability")
      await createCap({
        key: form.key,
        label: form.label,
        description: form.description,
        kind: form.kind,
        default_enabled: form.default_enabled === "true",
        requires_entitlement: form.requires_entitlement === "true",
        is_active: true,
        metadata: {},
        dependencies: [],
      }).unwrap();
    if (mode === "entitlement")
      await setEnt({ capability: form.capability, state: form.state, source: form.source, reason: form.reason }).unwrap();
    if (mode === "override")
      await setOver({ capability: form.capability, state: form.state, reason: form.reason }).unwrap();

    toast.success(`${TITLES[mode]} saved`);
    close();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <p className="text-xs text-gray-01">Platform settings</p>
          <DialogTitle>{TITLES[mode]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {mode === "definition" && (
            <>
              <Field label="Key">
                <Input
                  required
                  pattern="[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*"
                  value={form.key}
                  onChange={set("key")}
                  placeholder="module.setting_name"
                />
              </Field>
              <Field label="Label">
                <Input required value={form.label} onChange={set("label")} />
              </Field>
              <Field label="Description">
                <Textarea value={form.description} onChange={set("description")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Value type"
                  value={form.value_type}
                  onChange={set("value_type")}
                  options={["STRING", "INTEGER", "DECIMAL", "BOOLEAN", "JSON", "CHOICE", "SECRET_REFERENCE"]}
                />
                <Select
                  label="Sensitivity"
                  value={form.sensitivity}
                  onChange={set("sensitivity")}
                  options={["PUBLIC", "INTERNAL", "SECRET_REFERENCE"]}
                />
              </div>
              <Field label="Default value">
                <Input value={form.default_value} onChange={set("default_value")} />
              </Field>
              <Field label="Allowed scopes (comma separated)">
                <Input value={form.allowed_scopes} onChange={set("allowed_scopes")} />
              </Field>
            </>
          )}

          {mode === "value" && (
            <>
              <Select
                label="Configuration key"
                value={form.key}
                onChange={set("key")}
                options={(defs.data?.data ?? []).map((x) => x.key)}
              />
              <Field label="Value">
                <Textarea required value={form.value} onChange={set("value")} />
              </Field>
              <Field label="Reason">
                <Input value={form.reason} onChange={set("reason")} />
              </Field>
            </>
          )}

          {mode === "capability" && (
            <>
              <Field label="Key">
                <Input required value={form.key} onChange={set("key")} />
              </Field>
              <Field label="Label">
                <Input required value={form.label} onChange={set("label")} />
              </Field>
              <Field label="Description">
                <Textarea value={form.description} onChange={set("description")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Kind" value={form.kind} onChange={set("kind")} options={["MODULE", "FEATURE"]} />
                <Select
                  label="Default"
                  value={form.default_enabled}
                  onChange={set("default_enabled")}
                  options={["false", "true"]}
                />
              </div>
              <Select
                label="Requires entitlement"
                value={form.requires_entitlement}
                onChange={set("requires_entitlement")}
                options={["false", "true"]}
              />
            </>
          )}

          {(mode === "entitlement" || mode === "override") && (
            <>
              <Select
                label="Capability"
                value={form.capability}
                onChange={set("capability")}
                options={(caps.data?.data ?? []).map((x) => x.key)}
              />
              <Select
                label="State"
                value={form.state}
                onChange={set("state")}
                options={mode === "entitlement" ? ["GRANTED", "DENIED"] : ["INHERIT", "ENABLED", "DISABLED"]}
              />
              {mode === "entitlement" && (
                <Select
                  label="Source"
                  value={form.source}
                  onChange={set("source")}
                  options={["PACKAGE", "PLATFORM", "MANUAL", "IMPORT"]}
                />
              )}
              <Field label="Reason">
                <Textarea value={form.reason} onChange={set("reason")} />
              </Field>
            </>
          )}

          <DialogFooter className="gap-3">
            <Button type="button" variant="white" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <NativeSelect required value={value} onChange={onChange}>
        <option value="">Select…</option>
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </NativeSelect>
    </Field>
  );
}
