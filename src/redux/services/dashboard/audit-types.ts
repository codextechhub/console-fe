export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export type AuditEventQueryParams = Record<
  string,
  string | number | boolean | (string | number)[]
>;

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
  | "EXPORTS"
  | "PLATFORM"
  | "SYSTEM";

export interface AuditFilterOption {
  value: string;
  label: string;
}

export interface AuditEventFilterOptions {
  modules: AuditFilterOption[];
  actions: AuditFilterOption[];
  severities: AuditFilterOption[];
  statuses: AuditFilterOption[];
  actor_types: AuditFilterOption[];
  /**
   * The tenants `tenant_slug` accepts, plus the `__none__` sentinel for
   * platform-level rows that belong to no customer.
   *
   * Populated only for platform-tenant callers: handing a school's audit
   * officer the name of every other school would be Codex's customer list. An
   * empty array is a complete answer, not a broken one - a single-tenant caller
   * has no tenant dimension to narrow by - so the control is hidden rather than
   * rendered empty.
   */
  tenants: AuditFilterOption[];
}

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
  effective_user: ActorSlim | null;
  impersonation_session: number | null;
  actor_label: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  entity_user: { id: string; full_name: string; email: string } | null;
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
  // The authorised route to fetch the CSV, published by the API. Null whenever
  // there is nothing to take: the job is not COMPLETED, or its file has
  // expired. The storage key itself is never exposed, so this is the only way
  // to the bytes - gate the download control on it, not on the status, because
  // an expired job stays COMPLETED.
  download_url: string | null;
  row_count: number;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export interface AuditExportJobDetail extends AuditExportJob {
  filter_payload: Record<string, unknown>;
  failure_reason: string;
}

export type ComplianceRuleType = "RETENTION" | "MASKING" | "ACCESS" | "EXPORT";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  rule_type: ComplianceRuleType;
  school: { id: string; name: string; slug: string } | null;
  module_key: string;
  action_type: string;
  is_active: boolean;
  retention_days: number | null;
  updated_at: string;
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
