// The draft shape for one workflow stage in the template builder, shared by the
// builder form and the live approver-preview component.
import type {
  StageKind,
  ApproverSource,
  ApproverScope,
  OrganogramTarget,
  StageAdvanceRule,
  StageOnRejection,
} from "@/redux/services/dashboard/workflow-types";

export interface StageForm {
  code: string;
  label: string;
  kind: StageKind;
  approver_source: ApproverSource;
  approver_permission_key: string;
  approver_scope: ApproverScope;
  organogram_target: OrganogramTarget | "";
  organogram_levels: string;
  organogram_position_code: string;
  advance_rule: StageAdvanceRule;
  quorum_count: string;
  on_rejection: StageOnRejection;
  skip_if_no_approvers: boolean;
  inclusion_condition_text: string;
}

export const emptyStage = (): StageForm => ({
  code: "",
  label: "",
  kind: "APPROVAL",
  approver_source: "RBAC_PERMISSION",
  approver_permission_key: "",
  approver_scope: "SCHOOL",
  organogram_target: "",
  organogram_levels: "1",
  organogram_position_code: "",
  advance_rule: "ANY",
  quorum_count: "0",
  on_rejection: "TERMINAL",
  skip_if_no_approvers: true,
  inclusion_condition_text: "",
});
