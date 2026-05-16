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

export interface PermissionModule {
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
