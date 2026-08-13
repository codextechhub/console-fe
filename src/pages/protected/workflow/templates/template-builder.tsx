import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomInput } from "@/components/custom/custom-input";
import { SearchSelect } from "@/components/custom/search-select";
import { toast } from "sonner";
import { routesPath } from "@/routes/routes-path";
import {
  useGetApproverGroupsQuery,
  useGetWorkflowTemplateQuery,
  usePublishWorkflowTemplateMutation,
} from "@/redux/services/dashboard/workflow-api";
import { useGetPositionsQuery } from "@/redux/services/dashboard/organogram-api";
import { useGetTeamMembersQuery } from "@/redux/services/dashboard/team-mgt-api";
import { useGetAllRolesQuery } from "@/redux/services/dashboard/role-api";
import type {
  ApproverScope,
  ApproverSource,
  OrganogramTarget,
  PublishTemplatePayload,
  StageAdvanceRule,
  StageKind,
  StageOnRejection,
  WorkflowStagePayload,
} from "@/redux/services/dashboard/workflow-types";
import {
  type StageForm,
  conditionToRuleFields,
  emptyRule,
  emptyStage,
  newRuleKey,
  rulesPayload,
} from "./components/stage-form";
import {
  Section,
  ApproverPreview,
  DynamicRulesEditor,
} from "./components/template-builder-bits";

const SOURCE_OPTIONS = [
  { value: "ROLE", label: "Role holders" },
  { value: "WORKFLOW_GROUP", label: "Approver group" },
  { value: "DYNAMIC_ROLE", label: "Role chosen by the document" },
  { value: "ORGANOGRAM", label: "Organogram (relative to requester)" },
];
// What each source resolves to, in the words an administrator uses. Shown under
// the picker because the choice decides who can approve, and the difference
// between a role and a group is not guessable from the name alone.
const SOURCE_HINT: Record<string, string> = {
  ROLE: "Whoever currently holds this role in the tenant that raised the request.",
  WORKFLOW_GROUP:
    "A named pool built on the Approver Groups screen - people, roles and org seats mixed.",
  DYNAMIC_ROLE:
    "The document picks the role: ordered rules, first match wins (e.g. amount thresholds).",
  ORGANOGRAM: "Climbs the org chart relative to whoever raised the request.",
};
const TARGET_OPTIONS = [
  { value: "DIRECT_MANAGER", label: "Direct manager" },
  { value: "N_LEVELS_UP", label: "N levels up the chain" },
  { value: "DEPARTMENT_HEAD", label: "Department head" },
  { value: "SPECIFIC_POSITION", label: "Specific position" },
];

const KIND_OPTIONS = [
  { value: "APPROVAL", label: "Approval (waits for votes)" },
  { value: "BRANCH", label: "Branch (routing only)" },
];
const SCOPE_OPTIONS = [
  { value: "SCHOOL", label: "School" },
  { value: "BRANCH", label: "Branch" },
  { value: "PLATFORM", label: "Platform" },
];
const RULE_OPTIONS = [
  { value: "UNANIMOUS", label: "Unanimous - all must approve" },
  { value: "QUORUM", label: "Quorum - N of M" },
  { value: "ANY", label: "Any one approver" },
];
const REJECT_OPTIONS = [
  { value: "TERMINAL", label: "Ends the workflow" },
  { value: "RETURN_TO_REQUESTER", label: "Returns to requester" },
];
// The lifecycle points the engine actually emits (backend NOTIF_WIRED_EVENT_KEYS).
// An untouched template notifies for all of these; toggling any switch makes
// the dict exact intent (unchecked = off).
const NOTIF_EVENTS = [
  { key: "workflow.stage_activated", label: "Stage activated - notify that stage's approvers" },
  { key: "workflow.returned", label: "Returned for revision - notify the requester" },
  { key: "workflow.rejected", label: "Rejected - notify the requester" },
  { key: "workflow.final_approved", label: "Fully approved - notify the requester" },
];

export default function TemplateBuilder() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading: isLoadingExisting } = useGetWorkflowTemplateQuery(id ?? "", {
    skip: !isEdit,
  });
  const [publish, { isLoading: isPublishing }] = usePublishWorkflowTemplateMutation();

  // Organogram approver-source support: positions for SPECIFIC_POSITION, and a
  // sample requester so the "who would approve?" preview can resolve live.
  const { data: positionsRes } = useGetPositionsQuery({ page_size: 100 });
  const { data: usersRes } = useGetTeamMembersQuery({ page_size: 100, user_type: "CX_STAFF" });
  // Roles and approver groups are what stages now name; both are picked from a
  // list rather than typed, so a stage cannot reference something that is not
  // there (the publish endpoint refuses that anyway - this just gets there first).
  const { data: rolesRes } = useGetAllRolesQuery({ page: 1, page_size: 200 });
  const { data: groupsRes } = useGetApproverGroupsQuery({ page: 1, page_size: 100 });
  const roleOptions = useMemo(
    () =>
      (rolesRes?.data ?? [])
        .filter((r) => r.status === "ACTIVE")
        .map((r) => ({ value: r.key, label: `${r.name} · ${r.assigned_users_count ?? 0} holder(s)` })),
    [rolesRes],
  );
  const groupOptions = useMemo(
    () =>
      (groupsRes?.data ?? [])
        .filter((g) => g.is_active)
        .map((g) => ({ value: g.code, label: `${g.name} · ${g.member_count} member(s)` })),
    [groupsRes],
  );
  const positionOptions = useMemo(
    () => (Array.isArray(positionsRes?.data) ? positionsRes!.data : []).map((p) => ({ value: p.code, label: `${p.code} · ${p.title}` })),
    [positionsRes],
  );
  const requesterOptions = useMemo(
    () => (Array.isArray(usersRes?.data) ? usersRes!.data : []).map((u: { id: string; full_name: string; email: string }) => ({ value: u.id, label: `${u.full_name} · ${u.email}` })),
    [usersRes],
  );
  const [sampleRequester, setSampleRequester] = useState("");

  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageForm[]>([emptyStage()]);
  const [routesText, setRoutesText] = useState("");
  const [notifEvents, setNotifEvents] = useState<Record<string, boolean>>({});
  const [prefilled, setPrefilled] = useState(false);

  // Prefill once when editing an existing template.
  useEffect(() => {
    if (!isEdit || !existing || prefilled) return;
    setName(existing.name);
    setDocumentType(existing.document_type);
    setCode(existing.code);
    setDescription(existing.description ?? "");
    setNotifEvents(existing.notification_events ?? {});
    setStages(
      [...existing.stages]
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          code: s.code,
          label: s.label,
          kind: s.kind,
          approver_source: s.approver_source ?? "ROLE",
          approver_scope: s.approver_scope,
          approver_role_key: s.approver_role_key ?? "",
          approver_group_code: s.approver_group_code ?? "",
          dynamic_rules: (s.dynamic_role_rules ?? []).length
            ? [...(s.dynamic_role_rules ?? [])]
                .sort((a, b) => a.order - b.order)
                .map((r) => ({
                  key: newRuleKey(),
                  role_key: r.role_key,
                  label: r.label ?? "",
                  ...conditionToRuleFields(r.condition),
                }))
            : [emptyRule()],
          sample_document_text: "",
          organogram_target: s.organogram_target ?? "",
          organogram_levels: String(s.organogram_levels ?? 1),
          organogram_position_code: s.organogram_position_code ?? "",
          advance_rule: s.advance_rule,
          quorum_count: String(s.quorum_count ?? 0),
          on_rejection: s.on_rejection,
          skip_if_no_approvers: s.skip_if_no_approvers,
          inclusion_condition_text: s.inclusion_condition
            ? JSON.stringify(s.inclusion_condition, null, 2)
            : "",
        })),
    );
    setRoutesText(
      existing.routes.length
        ? JSON.stringify(
            [...existing.routes]
              .sort((a, b) => a.order - b.order)
              .map((r) => ({
                from_stage_code: r.from_stage_code,
                to_stage_code: r.to_stage_code,
                order: r.order,
                condition: r.condition,
              })),
            null,
            2,
          )
        : "",
    );
    setPrefilled(true);
  }, [isEdit, existing, prefilled]);

  const updateStage = (i: number, patch: Partial<StageForm>) =>
    setStages((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addStage = () => setStages((prev) => [...prev, emptyStage()]);
  const removeStage = (i: number) => setStages((prev) => prev.filter((_, j) => j !== i));
  const moveStage = (i: number, dir: -1 | 1) =>
    setStages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handlePublish = () => {
    if (!name.trim() || !documentType.trim() || !code.trim()) {
      toast.error("Name, document type, and code are required.");
      return;
    }
    if (stages.length === 0) {
      toast.error("Add at least one stage.");
      return;
    }
    // Build stage payloads, parsing per-stage inclusion conditions.
    const stagePayloads: WorkflowStagePayload[] = [];
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      if (!s.code.trim() || !s.label.trim()) {
        toast.error(`Stage ${i + 1}: code and label are required.`);
        return;
      }
      let inclusion = undefined;
      if (s.inclusion_condition_text.trim()) {
        try {
          inclusion = JSON.parse(s.inclusion_condition_text);
        } catch {
          toast.error(`Stage ${i + 1}: inclusion condition is not valid JSON.`);
          return;
        }
      }
      const isOrg = s.kind === "APPROVAL" && s.approver_source === "ORGANOGRAM";
      if (isOrg && !s.organogram_target) {
        toast.error(`Stage ${i + 1}: pick an organogram target.`);
        return;
      }
      if (isOrg && s.organogram_target === "SPECIFIC_POSITION" && !s.organogram_position_code) {
        toast.error(`Stage ${i + 1}: pick a specific position.`);
        return;
      }
      const isApproval = s.kind === "APPROVAL";
      if (isApproval && s.approver_source === "ROLE" && !s.approver_role_key) {
        toast.error(`Stage ${i + 1}: pick the role that approves this stage.`);
        return;
      }
      if (isApproval && s.approver_source === "WORKFLOW_GROUP" && !s.approver_group_code) {
        toast.error(`Stage ${i + 1}: pick the approver group this stage routes to.`);
        return;
      }
      // Mirror the publish endpoint's rule checks so a bad ladder is caught in
      // the form, where it can be fixed, rather than as a 400 after a save.
      if (isApproval && s.approver_source === "DYNAMIC_ROLE") {
        if (!s.dynamic_rules.length) {
          toast.error(`Stage ${i + 1}: a document-driven stage needs at least one rule.`);
          return;
        }
        for (let r = 0; r < s.dynamic_rules.length; r++) {
          const rule = s.dynamic_rules[r];
          if (!rule.role_key) {
            toast.error(`Stage ${i + 1}, rule ${r + 1}: pick a role.`);
            return;
          }
          if (!rule.is_fallback && rule.raw === null && !rule.field.trim()) {
            toast.error(`Stage ${i + 1}, rule ${r + 1}: name the field to test.`);
            return;
          }
          if (!rule.is_fallback && rule.raw === null && !rule.value.trim()) {
            toast.error(`Stage ${i + 1}, rule ${r + 1}: give the value to compare against.`);
            return;
          }
          if (rule.is_fallback && r !== s.dynamic_rules.length - 1) {
            toast.error(
              `Stage ${i + 1}: the "Otherwise" rule must be last - rules after it can never fire.`,
            );
            return;
          }
        }
      }
      stagePayloads.push({
        code: s.code.trim(),
        label: s.label.trim(),
        kind: s.kind,
        order: i + 1,
        approver_source: s.approver_source,
        // Each source's own field, blanked otherwise: sending a stale role key on
        // a group stage would leave the wrong answer sitting in the row.
        approver_role_key: s.approver_source === "ROLE" ? s.approver_role_key : "",
        approver_group_code: s.approver_source === "WORKFLOW_GROUP" ? s.approver_group_code : "",
        dynamic_role_rules:
          s.approver_source === "DYNAMIC_ROLE" ? rulesPayload(s.dynamic_rules) : undefined,
        approver_scope: s.approver_scope,
        // Organogram fields are OMITTED, not blanked, on any other source: the
        // publish validator checks every key it is given against the enum, so an
        // empty organogram_target is rejected as an invalid value rather than
        // read as "not applicable".
        ...(isOrg
          ? {
              organogram_target: s.organogram_target,
              organogram_levels: Number(s.organogram_levels) || 1,
              organogram_position_code:
                s.organogram_target === "SPECIFIC_POSITION" ? s.organogram_position_code : "",
            }
          : {}),
        advance_rule: s.advance_rule,
        quorum_count: Number(s.quorum_count) || 0,
        on_rejection: s.on_rejection,
        skip_if_no_approvers: s.skip_if_no_approvers,
        inclusion_condition: inclusion,
      });
    }
    // Parse advanced routes JSON.
    let routes = [];
    if (routesText.trim()) {
      try {
        routes = JSON.parse(routesText);
        if (!Array.isArray(routes)) throw new Error("not array");
      } catch {
        toast.error("Routes must be a valid JSON array.");
        return;
      }
    }

    const payload: PublishTemplatePayload = {
      name: name.trim(),
      document_type: documentType.trim(),
      code: code.trim(),
      description: description.trim(),
      notification_events: notifEvents,
      stages: stagePayloads,
      routes,
    };

    publish(payload)
      .unwrap()
      .then((t) => {
        toast.success(isEdit ? "Template updated." : "Template published.");
        navigate(routesPath.PROTECTED.WORKFLOW.TEMPLATE_DETAIL(t.id));
      })
      .catch(() => {});
  };

  if (isEdit && isLoadingExisting) {
    return (
      <>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <main className="px-4.5 py-6 space-y-5 text-black-01 max-w-3xl">
        {/* Meta */}
        <Section title="Template details">
          <div className="space-y-4">
            <CustomInput
              id="tpl-name"
              label="Name"
              isRequired
              placeholder="e.g. Standard Leave Approval"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CustomInput
                id="tpl-doc-type"
                label="Document type"
                isRequired
                placeholder="e.g. leave.request"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              />
              <CustomInput
                id="tpl-code"
                label="Code"
                isRequired
                placeholder="e.g. standard"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this approval path for?"
              />
            </div>
            {isEdit && (
              <p className="rounded-md bg-yellow-01/10 px-3 py-2 text-xs text-yellow-01">
                Publishing with the same document type + code updates this template in place.
                Changing either creates a new template.
              </p>
            )}
          </div>
        </Section>

        {/* Stages */}
        <Section
          title="Stages"
          action={
            <Button variant="outline" size="sm" onClick={addStage}>
              <Plus className="size-3.5" /> Add stage
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-white-02 bg-pry-01/30 px-3 py-2">
              <span className="text-xs font-medium text-gray-01">Sample requester</span>
              <div className="min-w-60 flex-1 sm:max-w-xs">
                <SearchSelect
                  id="sample-requester"
                  options={requesterOptions}
                  value={sampleRequester}
                  onChange={(e) => setSampleRequester(e.target.value)}
                  placeholder="Pick a CX staff member to preview approvers"
                />
              </div>
              <span className="text-[11px] text-gray-01">Organogram stages resolve relative to this person ↓</span>
            </div>
            {stages.map((s, i) => (
              <div key={i} className="rounded-md border border-white-02 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <GripVertical className="size-4 text-gray-05" />
                  <span className="grid size-6 place-content-center rounded-full bg-pry-01 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {s.label.trim() || `Stage ${i + 1}`}
                  </span>
                  <button
                    type="button"
                    className="text-gray-01 hover:text-black-01 disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => moveStage(i, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="text-gray-01 hover:text-black-01 disabled:opacity-30"
                    disabled={i === stages.length - 1}
                    onClick={() => moveStage(i, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="text-gray-01 hover:text-destructive disabled:opacity-30"
                    disabled={stages.length === 1}
                    onClick={() => removeStage(i)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CustomInput
                    id={`stage-code-${i}`}
                    label="Code"
                    isRequired
                    placeholder="e.g. line-manager"
                    value={s.code}
                    onChange={(e) => updateStage(i, { code: e.target.value })}
                  />
                  <CustomInput
                    id={`stage-label-${i}`}
                    label="Label"
                    isRequired
                    placeholder="e.g. Line Manager Approval"
                    value={s.label}
                    onChange={(e) => updateStage(i, { label: e.target.value })}
                  />
                  <SearchSelect
                    id={`stage-kind-${i}`}
                    label="Kind"
                    options={KIND_OPTIONS}
                    value={s.kind}
                    onChange={(e) => updateStage(i, { kind: e.target.value as StageKind })}
                  />
                  {s.kind === "APPROVAL" && (
                    <>
                      <SearchSelect
                        id={`stage-source-${i}`}
                        label="Approver source"
                        containerClass="sm:col-span-2"
                        clearable={false}
                        options={SOURCE_OPTIONS}
                        value={s.approver_source}
                        onChange={(e) => updateStage(i, { approver_source: e.target.value as ApproverSource })}
                      />

                      <p className="text-xs text-gray-01 sm:col-span-2 -mt-2">
                        {SOURCE_HINT[s.approver_source]}
                      </p>

                      {/* Scope narrows the role lookup, so it applies to a role
                          stage, to a group's role members, and to each dynamic
                          rule's role - but means nothing to an organogram climb. */}
                      {s.approver_source !== "ORGANOGRAM" && (
                        <SearchSelect
                          id={`stage-scope-${i}`}
                          label="Approver scope"
                          options={SCOPE_OPTIONS}
                          value={s.approver_scope}
                          onChange={(e) => updateStage(i, { approver_scope: e.target.value as ApproverScope })}
                        />
                      )}

                      {s.approver_source === "ROLE" && (
                        <SearchSelect
                          id={`stage-role-${i}`}
                          label="Approver role"
                          options={roleOptions}
                          value={s.approver_role_key}
                          onChange={(e) => updateStage(i, { approver_role_key: e.target.value })}
                          placeholder="Pick a role"
                        />
                      )}

                      {s.approver_source === "WORKFLOW_GROUP" && (
                        <SearchSelect
                          id={`stage-group-${i}`}
                          label="Approver group"
                          options={groupOptions}
                          value={s.approver_group_code}
                          onChange={(e) => updateStage(i, { approver_group_code: e.target.value })}
                          placeholder="Pick a group"
                        />
                      )}

                      {s.approver_source === "ORGANOGRAM" && (
                        <>
                          <SearchSelect
                            id={`stage-target-${i}`}
                            label="Organogram target"
                            options={TARGET_OPTIONS}
                            value={s.organogram_target}
                            onChange={(e) => updateStage(i, { organogram_target: e.target.value as OrganogramTarget })}
                          />
                          {s.organogram_target === "N_LEVELS_UP" && (
                            <CustomInput
                              id={`stage-levels-${i}`}
                              label="Levels up"
                              type="number"
                              min={1}
                              value={s.organogram_levels}
                              onChange={(e) => updateStage(i, { organogram_levels: e.target.value })}
                            />
                          )}
                          {s.organogram_target === "SPECIFIC_POSITION" && (
                            <SearchSelect
                              id={`stage-pos-${i}`}
                              label="Position"
                              containerClass="sm:col-span-2"
                              options={positionOptions}
                              value={s.organogram_position_code}
                              onChange={(e) => updateStage(i, { organogram_position_code: e.target.value })}
                              placeholder="Select a seat"
                            />
                          )}
                        </>
                      )}

                      <SearchSelect
                        id={`stage-rule-${i}`}
                        label="Advance rule"
                        options={RULE_OPTIONS}
                        value={s.advance_rule}
                        onChange={(e) => updateStage(i, { advance_rule: e.target.value as StageAdvanceRule })}
                      />
                      {s.advance_rule === "QUORUM" && (
                        <CustomInput
                          id={`stage-quorum-${i}`}
                          label="Quorum count"
                          type="number"
                          min={1}
                          value={s.quorum_count}
                          onChange={(e) => updateStage(i, { quorum_count: e.target.value })}
                        />
                      )}
                      <SearchSelect
                        id={`stage-reject-${i}`}
                        label="On rejection"
                        options={REJECT_OPTIONS}
                        value={s.on_rejection}
                        onChange={(e) => updateStage(i, { on_rejection: e.target.value as StageOnRejection })}
                      />
                    </>
                  )}
                </div>

                {s.kind === "APPROVAL" && (
                  <div className="mt-3 flex items-center justify-between rounded-md border border-white-02 px-3 py-2">
                    <span className="text-xs text-gray-01">
                      Auto-skip this stage if no eligible approvers are found
                    </span>
                    <Switch
                      checked={s.skip_if_no_approvers}
                      onCheckedChange={(v) => updateStage(i, { skip_if_no_approvers: v })}
                    />
                  </div>
                )}

                <div className="mt-3 space-y-1.5">
                  <label className="text-xs font-medium">
                    Inclusion condition{" "}
                    <span className="text-gray-01">(JSON, optional - stage skipped if false)</span>
                  </label>
                  <Textarea
                    rows={2}
                    className="font-mono text-xs"
                    placeholder='{ "op": "gte", "field": "amount", "value": 500000 }'
                    value={s.inclusion_condition_text}
                    onChange={(e) => updateStage(i, { inclusion_condition_text: e.target.value })}
                  />
                </div>

                {s.kind === "APPROVAL" && s.approver_source === "DYNAMIC_ROLE" && (
                  <DynamicRulesEditor
                    rules={s.dynamic_rules}
                    roleOptions={roleOptions}
                    stageIndex={i}
                    onChange={(next) => updateStage(i, { dynamic_rules: next })}
                  />
                )}

                {s.kind === "APPROVAL" && (
                  <ApproverPreview
                    stage={s}
                    requester={sampleRequester}
                    sampleText={s.sample_document_text}
                    onSampleChange={(v) => updateStage(i, { sample_document_text: v })}
                    sampleId={`stage-sample-${i}`}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notification events">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {NOTIF_EVENTS.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-2 rounded-md border border-white-02 px-3 py-2 text-xs">
                <span className="text-gray-01">{label}</span>
                <Switch
                  checked={!!notifEvents[key]}
                  onCheckedChange={(v) => setNotifEvents((prev) => ({ ...prev, [key]: v }))}
                />
              </label>
            ))}
          </div>
        </Section>

        {/* Advanced routes */}
        <Section title="Routing (advanced)">
          <p className="mb-2 text-xs text-gray-01">
            Leave blank for linear routing (stages run in order). Otherwise provide a JSON array of
            routes: <code className="font-mono">{`{ from_stage_code, to_stage_code, order, condition }`}</code>.
            Use <code className="font-mono">null</code> for ENTRY/EXIT or an always-true condition.
          </p>
          <Textarea
            rows={6}
            className="font-mono text-xs"
            placeholder={`[\n  { "from_stage_code": null, "to_stage_code": "line-manager", "order": 1, "condition": null }\n]`}
            value={routesText}
            onChange={(e) => setRoutesText(e.target.value)}
          />
        </Section>

        <div className="flex justify-end gap-3">
          <Button variant="outline" size="lg" onClick={() => navigate(-1)} disabled={isPublishing}>
            Cancel
          </Button>
          <Button size="lg" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? "Publishing…" : isEdit ? "Update template" : "Publish template"}
          </Button>
        </div>
      </main>
    </>
  );
}

