export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AuditStatus = "SUCCESS" | "FAILED" | "DENIED" | "PARTIAL";
export type AuditActorType = "USER" | "SYSTEM";
export type AuditModuleKey =
  | "ONBOARDING"
  | "IDENTITY"
  | "USER"
  | "RBAC"
  | "IMPORT"
  | "CONFIG"
  | "FINANCE"
  | "PROCUREMENT"
  | "SCHOOL"
  | "BRANCH"
  | "SYSTEM";

export interface ActorSlim {
  id: string;
  email: string;
  full_name: string;
}

export interface AuditEventListItem {
  id: string;
  module_key: AuditModuleKey | string;
  action_type: string;
  severity: AuditSeverity;
  status: AuditStatus;
  actor_type: AuditActorType;
  actor_user: ActorSlim | null;
  actor_label: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  summary: string | null;
  ip_address: string | null;
  event_at: string;
}

export interface AuditEventDetail extends AuditEventListItem {
  before_data: Record<string, unknown> | null;
  diff_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface EntityTrail {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  event_count: number;
  first_event_at: string | null;
  last_event_at: string | null;
}

export interface EntityTrailDetail {
  trail: EntityTrail;
  events: AuditEventDetail[];
}

export type ExportJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "EXPIRED";
export type ExportFormat = "CSV";

export interface AuditExportJob {
  id: string;
  requested_by: ActorSlim | null;
  export_format: ExportFormat;
  status: ExportJobStatus;
  file_name: string;
  row_count: number;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export interface AuditExportJobDetail extends AuditExportJob {
  filter_payload: Record<string, unknown>;
  file_path: string;
  failure_reason: string;
}

export type ComplianceRuleType = "RETENTION" | "MASKING" | "ACCESS" | "EXPORT";

export interface ComplianceRule {
  id: string;
  name: string;
  rule_type: ComplianceRuleType;
  school: { id: string; name: string; slug: string } | null;
  module_key: string;
  action_type: string;
  is_active: boolean;
  retention_days: number | null;
}

export interface ComplianceRuleDetail extends ComplianceRule {
  description: string;
  masking_fields: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditDashboardSummary {
  kpis: {
    active_sessions: number;
    events_24h: number;
    critical_24h: number;
    failed_denied_24h: number;
    locked_accounts: number;
    active_impersonations: number;
  };
  severity_series: Array<{ date: string; INFO: number; WARNING: number; CRITICAL: number }>;
  module_breakdown: Array<{ module_key: string; count: number }>;
  signin_series: Array<{ date: string; SUCCESS: number; FAIL: number }>;
  critical_heatmap: number[][];
  generated_at: string;
}
