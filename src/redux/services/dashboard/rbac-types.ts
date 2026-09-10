export interface PlatformRole {
  id: string;
  /** Per-tenant slug key - how roles are addressed on the unified RBAC surface. */
  key: string;
  /** Owning tenant slug (read-only). */
  tenant?: string;
  branch?: string | null;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  is_system_role: boolean;
  is_locked: boolean;
  version: number;
  assigned_users_count: number;
  permissions_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformRoleDetail extends PlatformRole {
  role_permissions: Array<{ permission_key: string; granted: boolean }>;
  role_groups: Array<{ group: PermissionGroupList }>;
}

export interface PermissionGroupList {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroupDetail extends PermissionGroupList {
  permissions: Permission[];
}

export interface Permission {
  key: string;
  module_key: string;
  resource_key: string;
  action_key: string;
  description?: string;
  sensitivity_level: "NORMAL" | "SENSITIVE" | "CRITICAL";
  is_restricted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionDetail extends Permission {
  groups?: Array<{ id: string; name: string; is_system?: boolean }>;
  dependencies?: Array<{ key: string; description?: string }>;
  dependents?: Array<{ key: string; description?: string }>;
}

export interface PermissionModule {
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionResource {
  id: string;
  module: string;
  name: string;
  description?: string;
  is_active: boolean;
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionAction {
  name: string;
  description?: string;
  is_active: boolean;
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionDependency {
  id: string;
  permission_key: string;
  depends_on_key: string;
  created_at: string;
}

export interface UserAssignment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role_id: string;
  role_key: string;
  role_name: string;
  assignment_status: "ACTIVE" | "REVOKED";
  assigned_by_id: string | null;
  assigned_by_name: string | null;
  assigned_at: string;
  revoked_by_id: string | null;
  revoked_by_name: string | null;
  revoked_at: string | null;
  reason_note: string | null;
}

export interface ChangeRequestDelta {
  /** Write shape (create): the permission key being added/removed. */
  permission_key?: string;
  /** Read shape: the resolved permission object returned by the backend. */
  permission?: { key: string; description?: string } | null;
  operation: "ADD" | "REMOVE";
  permission_description?: string;
}

/**
 * Where a request has got to in its approval ladder.
 *
 * `status` says PENDING or APPROVED; this says who it is waiting on. Null for a
 * request raised before role changes were routed through the approval engine -
 * those have no ladder to act on and cannot be decided.
 */
export interface ChangeRequestApproval {
  instance_id: string;
  /** The engine's own status: IN_PROGRESS, APPROVED, REJECTED, and so on. */
  status: string;
  /** The stage the ladder is waiting on, empty once it is finished. */
  stage_label: string;
  /**
   * Whether the reader is on this stage's approver list. Read from the frozen
   * snapshot the server checks when the button is pressed, so a button that
   * shows is a button that works.
   */
  can_act: boolean;
  /** Whether the reader is the person who raised it. */
  self_raised: boolean;
}

export interface ChangeRequest {
  id: string;
  /** Target role primary key (read-only from the backend). */
  target_role: string;
  /** Resolved client-side from the tenant roles list for display. */
  target_role_name?: string;
  delta_items: ChangeRequestDelta[];
  status: "PENDING" | "APPROVED" | "DENIED" | "APPLIED" | "APPLY_FAILED";
  /** Requester / reviewer primary keys (the backend no longer returns display names). */
  requested_by: string;
  requested_by_name?: string;
  reviewer: string | null;
  reviewer_notes: string | null;
  impact_summary?: unknown;
  justification: string;
  submitted_at: string;
  decided_at: string | null;
  approval?: ChangeRequestApproval | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
}
