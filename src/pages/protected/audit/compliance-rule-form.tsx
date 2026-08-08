import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { Switch } from "@/components/ui/switch";
import { routesPath } from "@/routes/routes-path";
import {
  useCreateComplianceRuleMutation,
  useGetComplianceRuleDetailQuery,
  useUpdateComplianceRuleMutation,
} from "@/redux/services/dashboard/audit-api";
import { useGetSchoolsQuery } from "@/redux/services/dashboard/school-mgt-api";
import { formatRelativeDate } from "@/utils/helpers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const RULE_TYPES = ["RETENTION", "MASKING", "ACCESS", "EXPORT"] as const;
type RuleType = typeof RULE_TYPES[number];

const MODULE_KEYS = [
  "ONBOARDING", "IDENTITY", "USER", "RBAC", "IMPORT",
  "CONFIG", "FINANCE", "PROCUREMENT", "SCHOOL", "BRANCH", "SYSTEM",
] as const;

const ACTION_TYPES = [
  "CREATE", "UPDATE", "DELETE",
  "USER_CREATED", "USER_INVITED", "ACCOUNT_ACTIVATED",
  "LOGIN_SUCCESS", "LOGIN_FAILED", "TOKEN_REVOKED", "FORCE_LOGOUT",
  "ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED", "ACCOUNT_SUSPENDED",
  "ACCOUNT_REACTIVATED", "ACCOUNT_DEACTIVATED",
  "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET", "PASSWORD_CHANGED", "EMAIL_CHANGED",
  "DATA_FILE_UPLOADED", "DATA_IMPORT_STARTED", "DATA_IMPORT_ROW_PROCESSED",
  "DATA_IMPORT_COMPLETED", "DATA_IMPORT_FAILED", "DATA_IMPORT_ROLLED_BACK",
  "ROLE_ASSIGNED", "ROLE_CHANGED", "PERMISSION_CHANGED",
  "CONFIG_CHANGED", "FINANCIAL_TRANSACTION", "PROCUREMENT_ACTION",
  "EXPORT_REQUESTED", "EXPORT_COMPLETED", "EXPORT_FAILED", "CUSTOM",
] as const;

const TYPE_STYLE: Record<RuleType, string> = {
  RETENTION: "bg-blue-50 text-blue-700 border-blue-200",
  MASKING:   "bg-purple-50 text-purple-700 border-purple-200",
  ACCESS:    "bg-red-50 text-red-700 border-red-200",
  EXPORT:    "bg-green-50 text-green-700 border-green-200",
};

const TYPE_HELP: Record<RuleType, string> = {
  RETENTION: "Archive or purge events older than a configured age.",
  MASKING:   "Mask sensitive field values in event payloads before display.",
  ACCESS:    "Restrict who can view or export matching events.",
  EXPORT:    "Constrain export jobs - row caps, allowed formats, watermarking.",
};

type Tab = "general" | "scope" | "policy" | "preview";

// ── Main component ────────────────────────────────────────────────────────────

export default function ComplianceRuleForm() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!params.id;

  const { data: detail } = useGetComplianceRuleDetailQuery(params.id ?? "", { skip: !isEdit });
  const { data: schoolsData } = useGetSchoolsQuery({ page_size: 200 });
  const [createRule, { isLoading: creating }] = useCreateComplianceRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateComplianceRuleMutation();

  const [tab, setTab] = useState<Tab>("general");
  const [maskingInput, setMaskingInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    rule_type: "RETENTION" as RuleType,
    school_id: "",
    module_key: "",
    action_type: "",
    retention_days: "" as string,
    masking_fields: [] as string[],
    is_active: true,
  });

  // Hydrate the form when the fetched rule arrives (guarded render-phase
  // adjustment instead of a setState-in-effect cascade).
  const [hydratedFrom, setHydratedFrom] = useState<typeof detail | null>(null);
  if (detail?.data && detail !== hydratedFrom) {
    setHydratedFrom(detail);
    const d = detail.data;
    setForm({
      name: d.name,
      description: d.description,
      rule_type: d.rule_type as RuleType,
      school_id: d.school?.id ?? "",
      module_key: d.module_key,
      action_type: d.action_type,
      retention_days: d.retention_days ? String(d.retention_days) : "",
      masking_fields: d.masking_fields ?? [],
      is_active: d.is_active,
    });
  }

  const schools = schoolsData?.data ?? [];

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const addMaskingField = () => {
    const val = maskingInput.trim();
    if (!val || form.masking_fields.includes(val)) return;
    update({ masking_fields: [...form.masking_fields, val] });
    setMaskingInput("");
  };

  const removeMaskingField = (f: string) =>
    update({ masking_fields: form.masking_fields.filter((x) => x !== f) });

  const canSubmit =
    form.name.trim().length > 0 &&
    (form.rule_type !== "RETENTION" || Number(form.retention_days) > 0);

  const handleSubmit = () => {
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      rule_type: form.rule_type,
      school: form.school_id || null,
      module_key: form.module_key,
      action_type: form.action_type,
      is_active: form.is_active,
    };
    if (form.rule_type === "RETENTION") {
      body.retention_days = Number(form.retention_days);
    }
    if (form.rule_type === "MASKING") {
      body.masking_fields = form.masking_fields;
    }

    const action = isEdit
      ? updateRule({ id: params.id!, body }).unwrap()
      : createRule(body).unwrap();

    action
      .then(() => {
        toast.success(isEdit ? "Rule updated." : "Rule created.");
        navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULES);
      })
      .catch(() => {});
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "scope",   label: "Scope" },
    { key: "policy",  label: "Policy" },
    ...(isEdit ? [{ key: "preview" as Tab, label: "Preview & history" }] : []),
  ];

  return (
    <>
      <main className="px-4.5 py-6 text-black-01 max-w-2xl space-y-5">

        {/* Page heading */}
        <div>
          <p className="font-semibold font-mont text-gray-01">
            {isEdit ? "Edit Compliance Rule" : "Create Compliance Rule"}
          </p>
          <p className="text-xs text-gray-01 mt-0.5">
            Retention, masking, access and export policies are enforced server-side by the audit pipeline.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 bg-white rounded-md border p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-1.5 text-xs rounded transition-colors font-medium",
                tab === t.key ? "bg-primary text-white" : "text-gray-01 hover:text-black-01",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="bg-white rounded-md border p-5 space-y-5">

          {/* ── General ───────────────────────────────────────────────────── */}
          {tab === "general" && (
            <>
              <CustomInput
                id="name"
                label="Name"
                placeholder="e.g. Retain finance events for 7 years"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
              />

              <div>
                <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Description</label>
                <textarea
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  placeholder="What does this rule enforce? Who is affected?"
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-01 mb-2 block">Rule type</label>
                <div className="flex flex-wrap gap-2">
                  {RULE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update({ rule_type: t })}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wide transition-colors",
                        form.rule_type === t
                          ? TYPE_STYLE[t]
                          : "border-gray-200 text-gray-01 hover:border-gray-300",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-01 mt-2">{TYPE_HELP[form.rule_type]}</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => update({ is_active: v })}
                  data-size="sm"
                />
                <span className="text-xs font-medium">Active</span>
                <span className="text-[10px] text-gray-01">- rule is enforced when on.</span>
              </label>
            </>
          )}

          {/* ── Scope ─────────────────────────────────────────────────────── */}
          {tab === "scope" && (
            <>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-01 mb-1.5 block">School</label>
                <SearchSelect
                  value={form.school_id}
                  onChange={(e) => update({ school_id: e.target.value })}
                  placeholder="Global (all schools)"
                  options={schools.map((s) => ({ value: String(s.id), label: s.name }))}
                />
                <p className="text-[10px] text-gray-01 mt-1">Leave blank to apply platform-wide.</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-01 mb-1.5 block">Module</label>
                <SearchSelect
                  value={form.module_key}
                  onChange={(e) => update({ module_key: e.target.value })}
                  placeholder="Any module"
                  options={MODULE_KEYS.map((m) => ({ value: m, label: m }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-01 mb-1.5 block">Action type</label>
                <SearchSelect
                  value={form.action_type}
                  onChange={(e) => update({ action_type: e.target.value })}
                  placeholder="Any action"
                  options={ACTION_TYPES.map((a) => ({ value: a, label: a }))}
                />
                <p className="text-[10px] text-gray-01 mt-1">Leave blank to apply to all actions in the module.</p>
              </div>
            </>
          )}

          {/* ── Policy ────────────────────────────────────────────────────── */}
          {tab === "policy" && (
            <>
              {form.rule_type === "RETENTION" && (
                <CustomInput
                  id="retention_days"
                  label="Retention (days)"
                  type="number"
                  placeholder="e.g. 2555"
                  value={form.retention_days}
                  onChange={(e) => update({ retention_days: e.target.value })}
                />
              )}

              {form.rule_type === "MASKING" && (
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-01 mb-1.5 block">Fields to mask</label>

                  {/* Chip row */}
                  {form.masking_fields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.masking_fields.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium">
                          {f}
                          <button type="button" onClick={() => removeMaskingField(f)} className="hover:text-purple-900 ml-0.5">
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-xs border border-gray-300 rounded px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="e.g. metadata.password"
                      value={maskingInput}
                      onChange={(e) => setMaskingInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMaskingField(); } }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addMaskingField}>Add</Button>
                  </div>
                  <p className="text-[10px] text-gray-01 mt-1">Press Enter or click Add. Use dot notation for nested paths, e.g. <code className="font-mono">before_data.ssn</code>.</p>
                </div>
              )}

              {(form.rule_type === "ACCESS" || form.rule_type === "EXPORT") && (
                <div className="rounded-md bg-gray-50 border px-4 py-3">
                  <p className="text-xs font-medium text-gray-01">
                    {form.rule_type === "ACCESS"
                      ? "Access rules restrict which roles can view or export matching events. Advanced config is managed server-side."
                      : "Export rules constrain export jobs - row caps, allowed formats, and watermarking. Advanced config is managed server-side."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Preview & history (edit only) ─────────────────────────────── */}
          {tab === "preview" && isEdit && detail?.data && (
            <>
              {/* Stat strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Type",         value: detail.data.rule_type },
                  { label: "State",        value: detail.data.is_active ? "Active" : "Inactive" },
                  { label: "Created",      value: formatRelativeDate(detail.data.created_at) },
                  { label: "Last updated", value: formatRelativeDate(detail.data.updated_at) },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border bg-gray-50 px-3 py-2.5">
                    <p className="text-[10px] text-gray-01">{s.label}</p>
                    <p className="text-xs font-semibold mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Scope summary */}
              <div className="rounded-md border px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold font-mont text-gray-01 uppercase tracking-wide">Scope</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-gray-01">School</span>
                    <p className="font-medium mt-0.5">{detail.data.school?.name ?? "Global"}</p>
                  </div>
                  <div>
                    <span className="text-gray-01">Module</span>
                    <p className="font-medium font-mono mt-0.5">{detail.data.module_key || "Any"}</p>
                  </div>
                  <div>
                    <span className="text-gray-01">Action</span>
                    <p className="font-medium font-mono mt-0.5">{detail.data.action_type || "Any"}</p>
                  </div>
                </div>
              </div>

              {/* Rule change history */}
              <div>
                <p className="text-xs font-semibold font-mont text-gray-01 mb-3">Rule change history</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold">U</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Last updated</p>
                      <p className="text-[10px] text-gray-01 mt-0.5">{formatRelativeDate(detail.data.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold">C</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Created</p>
                      <p className="text-[10px] text-gray-01 mt-0.5">{formatRelativeDate(detail.data.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="white"
            size="lg"
            onClick={() => navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULES)}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || creating || updating}
          >
            {creating || updating ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
          </Button>
        </div>
      </main>
    </>
  );
}
