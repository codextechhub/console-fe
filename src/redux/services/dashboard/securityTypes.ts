export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface LoginSession {
  id: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
  school: { id: string; name: string; slug: string } | null;
  ip_address: string | null;
  user_agent: string;
  device_label: string;
  last_seen_at: string;
  refresh_jti: string;
  is_active: boolean;
  ended_at: string | null;
  end_reason: string;
  created_at: string;
}

export interface AuthAttempt {
  id: string;
  email_entered: string;
  user: { id: string; email: string } | null;
  school: { id: string; name: string; slug: string } | null;
  ip_address: string | null;
  user_agent: string;
  result: "SUCCESS" | "FAIL" | "BLOCKED";
  failure_code: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AccountLockout {
  id: string;
  user: { id: string; email: string; first_name?: string; last_name?: string };
  locked_until: string | null;
  locked_reason: string;
  failure_count: number;
  last_failure_at: string | null;
  last_failure_ip: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImpersonationSession {
  id: number;
  staff_user: number;
  staff_email: string;
  school: number;
  target_user: number;
  target_email: string;
  justification: string;
  status: "ACTIVE" | "ENDED";
  started_at: string;
  ends_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}
