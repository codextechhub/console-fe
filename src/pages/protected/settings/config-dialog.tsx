/**
 * Create/edit dialog shared by the Settings panels: new setting definitions,
 * setting a (typed) configuration value, and new capabilities. Entitlements
 * and overrides are edited inline on the Features switchboard, not here.
 *
 * `initial.key` prefills the value form when a System Settings row's Edit
 * action opens the dialog.
 *
 * Every picker shows the backend's words for a stored value ("Whole number"
 * for INTEGER, "Each branch" for branch), read from the definition and
 * capability choice endpoints. The only code a person types here is a new
 * definition's or feature's key, because that key is what the product's code
 * reads and nothing else can supply it.
 */

import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/utils/api-errors";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCreateCapabilityMutation,
  useCreateConfigDefinitionMutation,
  useGetCapabilityChoicesQuery,
  useGetConfigDefinitionChoicesQuery,
  useGetConfigDefinitionsQuery,
  useSetConfigValuesMutation,
  type LabelledOption,
} from "@/redux/services/config-api";

export type ConfigDialogMode = "definition" | "value" | "capability";

export interface ConfigDialogInitial {
  /** Definition key to prefill (mode "value"). */
  key?: string;
}

const YES_NO: LabelledOption[] = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

const ON_OFF: LabelledOption[] = [
  { value: "true", label: "On" },
  { value: "false", label: "Off" },
];

const TITLES: Record<ConfigDialogMode, string> = {
  definition: "New setting",
  value: "Edit setting value",
  capability: "New feature",
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

export function ConfigDialog({
  mode,
  close,
  initial,
}: {
  mode: ConfigDialogMode;
  close: () => void;
  initial?: ConfigDialogInitial;
}) {
  // The definitions list backs the key picker + type-aware value input.
  const defs = useGetConfigDefinitionsQuery({ page_size: "100" }, { skip: mode !== "value" });
  const definitionChoices = useGetConfigDefinitionChoicesQuery(undefined, { skip: mode !== "definition" });
  const capabilityChoices = useGetCapabilityChoicesQuery(undefined, { skip: mode !== "capability" });

  const [createDef, { isLoading: creatingDef }] = useCreateConfigDefinitionMutation();
  const [setValue, { isLoading: settingValue }] = useSetConfigValuesMutation();
  const [createCap, { isLoading: creatingCap }] = useCreateCapabilityMutation();
  const busy = creatingDef || settingValue || creatingCap;

  const [form, setForm] = useState<Record<string, string>>({
    key: initial?.key ?? "",
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
  });

  const set =
    (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((x) => ({ ...x, [k]: ev.target.value }));

  // The picked definition drives the type-aware value input below.
  const pickedDef = defs.data?.data.find((x) => x.key === form.key);

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
        allowed_scopes: form.allowed_scopes.split(",").filter(Boolean),
        sensitivity: form.sensitivity,
        is_active: true,
      }).unwrap();
    if (mode === "value")
      // Its own message: setConfigValues opts out of the global 400 toast so a
      // guard refusal that names people can be shown on screen where it is
      // raised. This dialog has no such surface, so it speaks for itself.
      await setValue({
        values: [{ key: form.key, value: parse(form.value, pickedDef?.value_type), reason: form.reason }],
      })
        .unwrap()
        .catch((error) => {
          toast.error(apiErrorMessage(error, "That value could not be saved."));
          throw error;
        });
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

    toast.success(`${TITLES[mode]} saved`);
    close();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[90vh] sm:max-w-xl flex flex-col">
        <ScrollArea className="min-h-0 flex-auto">
          <div className="flex flex-col gap-4">
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
                      label="Kind of value"
                      value={form.value_type}
                      onChange={set("value_type")}
                      options={definitionChoices.data?.data.value_types ?? []}
                    />
                    <Select
                      label="Sensitivity"
                      value={form.sensitivity}
                      onChange={set("sensitivity")}
                      options={definitionChoices.data?.data.sensitivities ?? []}
                    />
                  </div>
                  <Field label="Default value">
                    <Input value={form.default_value} onChange={set("default_value")} />
                  </Field>
                  <fieldset className="grid gap-1 text-sm font-medium">
                    <legend>Where it can be set</legend>
                    <div className="flex flex-wrap gap-4 pt-1">
                      {(definitionChoices.data?.data.allowed_scopes ?? []).map((scope) => {
                        const chosen = form.allowed_scopes.split(",").filter(Boolean);
                        return (
                          <label key={scope.value} className="flex items-center gap-2 font-normal">
                            <input
                              type="checkbox"
                              className="size-4 accent-primary"
                              checked={chosen.includes(scope.value)}
                              onChange={(ev) => {
                                const next = ev.target.checked
                                  ? [...chosen, scope.value]
                                  : chosen.filter((x) => x !== scope.value);
                                setForm((x) => ({ ...x, allowed_scopes: next.join(",") }));
                              }}
                            />
                            {scope.label}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </>
              )}

              {mode === "value" && (
                <>
                  {initial?.key ? (
                    // Opened from a settings row - the setting is already chosen.
                    <div>
                      <p className="text-sm font-medium">
                        {pickedDef?.label ?? (defs.isLoading ? "Loading setting…" : "This setting is no longer available")}
                      </p>
                      {pickedDef?.description && (
                        <p className="text-xs text-gray-01">{pickedDef.description}</p>
                      )}
                    </div>
                  ) : (
                    <Select
                      label="Setting"
                      value={form.key}
                      onChange={set("key")}
                      options={(defs.data?.data ?? []).map((x) => ({
                        value: x.key,
                        label: `${x.group_label}: ${x.label}`,
                      }))}
                    />
                  )}
                  <ValueInput
                    valueType={pickedDef?.value_type}
                    valueTypeLabel={pickedDef?.value_type_label}
                    value={form.value}
                    onChange={set("value")}
                  />
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
                    <Select
                      label="Kind"
                      value={form.kind}
                      onChange={set("kind")}
                      options={capabilityChoices.data?.data.kinds ?? []}
                    />
                    <Select
                      label="On by default"
                      value={form.default_enabled}
                      onChange={set("default_enabled")}
                      options={YES_NO}
                    />
                  </div>
                  <Select
                    label="Requires a plan (entitlement)"
                    value={form.requires_entitlement}
                    onChange={set("requires_entitlement")}
                    options={YES_NO}
                  />
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

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Value input matched to the definition's declared type. `valueType` picks
 * the control; `valueTypeLabel` is the backend's word for it, shown to the
 * person ("Value (Whole number)").
 */
function ValueInput({
  valueType,
  valueTypeLabel,
  value,
  onChange,
}: {
  valueType?: string;
  valueTypeLabel?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  const label = valueTypeLabel ? `Value (${valueTypeLabel})` : "Value";
  if (valueType === "BOOLEAN")
    return <Select label={label} value={value} onChange={onChange} options={ON_OFF} />;
  if (valueType === "INTEGER" || valueType === "DECIMAL")
    return (
      <Field label={label}>
        <Input
          required
          type="number"
          step={valueType === "DECIMAL" ? "any" : "1"}
          value={value}
          onChange={onChange}
        />
      </Field>
    );
  if (valueType === "JSON")
    return (
      <Field label={label}>
        <Textarea required className="font-mono text-xs" rows={5} value={value} onChange={onChange} />
      </Field>
    );
  return (
    <Field label={label}>
      <Textarea required value={value} onChange={onChange} />
    </Field>
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
  options: LabelledOption[];
}) {
  return (
    <Field label={label}>
      <NativeSelect required value={value} onChange={onChange}>
        <option value="">Select…</option>
        {options.map((x) => (
          <option key={x.value} value={x.value}>
            {x.label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}
