import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/custom/custom-input";
import { routesPath } from "@/routes/routesPath";
import {
  useCreateComplianceRuleMutation,
  useGetComplianceRuleDetailQuery,
  useUpdateComplianceRuleMutation,
} from "@/redux/services/dashboard/auditApi";
import { toast } from "sonner";

const RULE_TYPES = ["RETENTION", "MASKING", "ACCESS", "EXPORT"] as const;

export default function ComplianceRuleForm() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!params.id;

  const { data: detail } = useGetComplianceRuleDetailQuery(params.id ?? "", { skip: !isEdit });
  const [createRule, { isLoading: creating }] = useCreateComplianceRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateComplianceRuleMutation();

  const [form, setForm] = useState({
    name: "",
    description: "",
    rule_type: "RETENTION" as typeof RULE_TYPES[number],
    module_key: "",
    action_type: "",
    retention_days: "" as string,
    masking_fields_text: "",
    is_active: true,
  });

  useEffect(() => {
    if (detail?.data) {
      setForm({
        name: detail.data.name,
        description: detail.data.description,
        rule_type: detail.data.rule_type,
        module_key: detail.data.module_key,
        action_type: detail.data.action_type,
        retention_days: detail.data.retention_days ? String(detail.data.retention_days) : "",
        masking_fields_text: (detail.data.masking_fields ?? []).join(", "),
        is_active: detail.data.is_active,
      });
    }
  }, [detail]);

  const canSubmit =
    form.name.trim().length > 0 &&
    (form.rule_type !== "RETENTION" || Number(form.retention_days) > 0);

  const handleSubmit = () => {
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      rule_type: form.rule_type,
      module_key: form.module_key.trim().toUpperCase(),
      action_type: form.action_type.trim().toUpperCase(),
      is_active: form.is_active,
    };
    if (form.rule_type === "RETENTION") {
      body.retention_days = Number(form.retention_days);
    }
    if (form.rule_type === "MASKING") {
      body.masking_fields = form.masking_fields_text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
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

  return (
    <DashboardLayout title={isEdit ? "Edit Compliance Rule" : "New Compliance Rule"}>
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-2xl">
        <Button
          variant="white"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULES)}
        >
          <ArrowLeft className="size-3" /> Back to rules
        </Button>
        <div>
          <p className="font-semibold font-mont text-gray-01">
            {isEdit ? "Edit Compliance Rule" : "Create Compliance Rule"}
          </p>
          <p className="text-xs text-gray-01 mt-0.5">
            Retention, masking, access and export policies are enforced server-side by the audit pipeline.
          </p>
        </div>

        <div className="bg-white rounded-md p-5 space-y-4">
          <CustomInput
            id="name"
            label="Name"
            placeholder="e.g. Retain finance events for 7 years"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div>
            <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">Description</label>
            <textarea
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-01 mb-2 block">Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RULE_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="rule_type"
                    checked={form.rule_type === t}
                    onChange={() => setForm({ ...form, rule_type: t })}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomInput
              id="module_key"
              label="Module (optional)"
              placeholder="e.g. FINANCE"
              value={form.module_key}
              onChange={(e) => setForm({ ...form, module_key: e.target.value })}
            />
            <CustomInput
              id="action_type"
              label="Action type (optional)"
              placeholder="e.g. FINANCIAL_TRANSACTION"
              value={form.action_type}
              onChange={(e) => setForm({ ...form, action_type: e.target.value })}
            />
          </div>

          {form.rule_type === "RETENTION" && (
            <CustomInput
              id="retention_days"
              label="Retention (days)"
              type="number"
              placeholder="e.g. 2555"
              value={form.retention_days}
              onChange={(e) => setForm({ ...form, retention_days: e.target.value })}
            />
          )}

          {form.rule_type === "MASKING" && (
            <div>
              <label className="text-xs font-semibold uppercase text-gray-01 mb-1 block">
                Masking fields (comma-separated)
              </label>
              <textarea
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-mono"
                placeholder="e.g. password, ssn, before_data.password"
                value={form.masking_fields_text}
                onChange={(e) => setForm({ ...form, masking_fields_text: e.target.value })}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active (enforce immediately)
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="white"
            size="lg"
            onClick={() => navigate(routesPath.PROTECTED.AUDIT.COMPLIANCE_RULES)}
          >
            Cancel
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={!canSubmit || creating || updating}>
            {creating || updating ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
          </Button>
        </div>
      </main>
    </DashboardLayout>
  );
}
