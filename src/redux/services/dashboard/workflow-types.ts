// ─────────────────────────────────────────────────────────────────────────────
// vs_workflow - TypeScript contract.
//
// Mirrors apps/vs_workflow serializers + constants exactly.
//
// Envelope notes (verified against backend):
//   • List endpoints (templates / instances / delegations) are paginated by
//     core.pagination.XVSPagination → { success, message, pagination, data }.
//   • Detail + action endpoints return the PLAIN serializer dict (no wrapper).
//   • Dashboard endpoints: /pending/ → { results, count }; /submitted/ and
//     /team-load/ return a plain array.
// ─────────────────────────────────────────────────────────────────────────────

import type { PaginatedResponse } from "./rbac-types";

// ── Enums (string unions, matching vs_workflow.constants) ────────────────────

export type WorkflowInstanceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "RETURNED"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "CANCELLED";

export type WorkflowStageStatus =
  | "PENDING"
  | "ACTIVE"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED"
  | "SKIPPED";

export type WorkflowStageActionKind = "APPROVED" | "REJECTED" | "RETURNED" | "WITHDRAWN";

/** Actions an approver can submit via POST /instances/{id}/actions/. */
export type VoteAction = "APPROVED" | "REJECTED" | "RETURNED";

export type StageAdvanceRule = "UNANIMOUS" | "QUORUM" | "ANY";
export type StageOnRejection = "TERMINAL" | "RETURN_TO_REQUESTER";
export type ApproverScope = "BRANCH" | "SCHOOL" | "PLATFORM";
export type StageKind = "APPROVAL" | "BRANCH";

export type AuditEventType =
  | "INSTANCE_SUBMITTED"
  | "INSTANCE_WITHDRAWN"
  | "INSTANCE_CANCELLED"
  | "INSTANCE_APPROVED"
  | "INSTANCE_REJECTED"
  | "INSTANCE_RETURNED"
  | "INSTANCE_RESUBMITTED"
  | "STAGE_ACTIVATED"
  | "STAGE_APPROVED"
  | "STAGE_REJECTED"
  | "STAGE_SKIPPED_NO_APPROVER"
  | "STAGE_SKIPPED_CONDITION"
  | "APPROVER_ACTED"
  | "ACTION_REVERSED"
  | "ROUTE_EVALUATED";

/** Declarative condition JSON used on routes + stage inclusion_condition. */
export type WorkflowCondition =
  | { op: string; field: string; value: unknown }
  | { all: WorkflowCondition[] }
  | { any: WorkflowCondition[] }
  | { not: WorkflowCondition }
  | { fn: string; args?: Record<string, unknown> }
  | null;

// ── Templates ────────────────────────────────────────────────────────────────

export interface WorkflowStage {
  id: string;
  code: string;
  label: string;
  kind: StageKind;
  order: number;
  approver_source: ApproverSource;
  approver_permission_key: string;
  approver_scope: ApproverScope;
  organogram_target: OrganogramTarget | "";
  organogram_levels: number;
  organogram_position_code: string | null;
  advance_rule: StageAdvanceRule;
  quorum_count: number;
  on_rejection: StageOnRejection;
  skip_if_no_approvers: boolean;
  inclusion_condition: WorkflowCondition;
}

export interface WorkflowRoutePath {
  id: string;
  from_stage_code: string | null;
  to_stage_code: string | null;
  order: number;
  condition: WorkflowCondition;
}

export interface WorkflowTemplate {
  id: string;
  school: string | null;
  branch: string | null;
  document_type: string;
  code: string;
  name: string;
  description: string;
  notification_events: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  stages: WorkflowStage[];
  routes: WorkflowRoutePath[];
}

/** Stage payload accepted by POST /templates/publish/ (server upserts by code). */
export interface WorkflowStagePayload {
  code: string;
  label: string;
  kind: StageKind;
  order: number;
  approver_source?: ApproverSource;
  approver_permission_key?: string;
  approver_scope?: ApproverScope;
  organogram_target?: OrganogramTarget | "";
  organogram_levels?: number;
  organogram_position_code?: string;
  advance_rule?: StageAdvanceRule;
  quorum_count?: number;
  on_rejection?: StageOnRejection;
  skip_if_no_approvers?: boolean;
  inclusion_condition?: WorkflowCondition;
}

export interface WorkflowRoutePayload {
  from_stage_code?: string | null;
  to_stage_code?: string | null;
  order?: number;
  condition?: WorkflowCondition;
}

export interface PublishTemplatePayload {
  document_type: string;
  code: string;
  name: string;
  description?: string;
  notification_events?: Record<string, boolean>;
  stages: WorkflowStagePayload[];
  routes?: WorkflowRoutePayload[];
}

// ── Instances ────────────────────────────────────────────────────────────────

export interface WorkflowStageAction {
  id: string;
  action: WorkflowStageActionKind;
  actor: string;
  on_behalf_of: string | null;
  comment: string;
  attempt: number;
  acted_at: string;
  reversed_at: string | null;
  reversed_by: string | null;
  reversal_reason: string;
  is_reversal_of: string | null;
}

export interface WorkflowStageApprover {
  id: string;
  user: string;
  on_behalf_of: string | null;
  attempt: number;
  recorded_at: string;
}

export interface WorkflowStageInstance {
  id: string;
  stage_code: string;
  stage_label: string;
  stage_kind: StageKind;
  status: WorkflowStageStatus;
  // Denormalised from the stage definition (see serializer).
  on_rejection: StageOnRejection;
  advance_rule: StageAdvanceRule;
  quorum_count: number;
  activated_at: string | null;
  resolved_at: string | null;
  skip_reason: string;
  attempt: number;
  eligible_approvers: WorkflowStageApprover[];
  actions: WorkflowStageAction[];
}

export interface WorkflowAuditLog {
  id: string;
  event_type: AuditEventType;
  actor: string | null;
  stage_instance: string | null;
  context: Record<string, unknown>;
  message: string;
  occurred_at: string;
}

export interface WorkflowInstance {
  id: string;
  document_type: string;
  document_object_id: string;
  template_code: string;
  status: WorkflowInstanceStatus;
  current_stage_code: string | null;
  current_stage_label: string | null;
  requested_by: string;
  submitted_at: string | null;
  completed_at: string | null;
  /** Last activity - bumps on every state change. */
  updated_at: string;
}

/** Display-only snapshot of the business document, captured at submission. */
export interface DocumentSummaryField {
  label: string;
  value: string;
}
export interface DocumentSummary {
  title?: string;
  subtitle?: string;
  fields?: DocumentSummaryField[];
  link?: string;
}

/** Read-only preview of where an approval sends the request next. */
export interface NextStagePreview {
  label: string | null;
  is_final: boolean;
}

export interface WorkflowInstanceDetail extends WorkflowInstance {
  /** Empty object when the document's handler provides no summary. */
  document_summary: DocumentSummary;
  /** Null when the instance isn't awaiting a decision. */
  next_stage: NextStagePreview | null;
  stage_instances: WorkflowStageInstance[];
  audit_logs: WorkflowAuditLog[];
}

/** One row from GET /dashboard/pending/ - list shape + queue metadata. */
export interface PendingApproval extends WorkflowInstance {
  awaiting_on_stage: string;
  /** When the stage activated - i.e. when it reached this approver's queue. */
  awaiting_since: string | null;
  on_behalf_of: string | null;
}

export interface PendingApprovalsResponse {
  results: PendingApproval[];
  count: number;
}

export interface TeamLoadRow {
  document_type: string;
  stage_code: string;
  stage_label: string | null;
  active_count: number;
}

// ── Delegations ────────────────────────────────────────────────────────────────

export interface ApprovalDelegation {
  id: string;
  delegator: string;
  delegate: string;
  starts_at: string;
  ends_at: string;
  document_type: string;
  exclusive: boolean;
  reason: string;
  created_at: string;
  revoked_at: string | null;
}

export interface DelegationWritePayload {
  delegate: string;
  starts_at: string;
  ends_at: string;
  document_type?: string;
  exclusive?: boolean;
  reason?: string;
}

// ── Convenience aliases for list responses ───────────────────────────────────

export type WorkflowTemplatesResponse = PaginatedResponse<WorkflowTemplate>;
export type WorkflowInstancesResponse = PaginatedResponse<WorkflowInstance>;
export type ApprovalDelegationsResponse = PaginatedResponse<ApprovalDelegation>;

// ── Approver preview (organogram/RBAC resolver) ──────────────────────────────

export type ApproverSource = "RBAC_PERMISSION" | "ORGANOGRAM";
export type OrganogramTarget =
  | "DIRECT_MANAGER"
  | "N_LEVELS_UP"
  | "DEPARTMENT_HEAD"
  | "SPECIFIC_POSITION";

export interface ApproverPreviewPayload {
  requester: string;
  approver_source: ApproverSource;
  organogram_target?: OrganogramTarget | "";
  organogram_levels?: number;
  organogram_position_code?: string;
  approver_permission_key?: string;
  approver_scope?: ApproverScope;
  document_type?: string;
}

export interface ApproverPreviewUser {
  id: string;
  full_name: string;
  email: string;
}

export interface ApproverPreviewResult {
  approver_source: ApproverSource;
  organogram_target: OrganogramTarget | null;
  count: number;
  approvers: { user: ApproverPreviewUser; on_behalf_of: ApproverPreviewUser | null }[];
}
