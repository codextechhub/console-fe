export interface PlatformRole {
  id: string;
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

export interface UserAssignment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role_id: string;
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
  permission_key: string;
  operation: "ADD" | "REMOVE";
  permission_description?: string;
}

export interface ChangeRequest {
  id: string;
  target_role_id: string;
  target_role_name: string;
  delta_items: ChangeRequestDelta[];
  status: "PENDING" | "APPROVED" | "DENIED" | "APPLIED" | "APPLY_FAILED";
  requested_by_id: string;
  requested_by_name: string;
  justification: string;
  submitted_at: string;
  decided_at: string | null;
  decided_by_id: string | null;
  decided_by_name: string | null;
  reviewer_note: string | null;
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
