import type { PaginatedResponse } from "@/types"
import type { ResponseMessage } from "../auth/type"

export interface TeamMembersRes extends PaginatedResponse {
  data: TeamMember[]
}
export interface TeamMember {
  id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  phone?: string
  gender?: string
  user_type: string
  role: string
  status: string
  school_id?: string
  school_name?: string
  branch_id?: string
  branch_name?: string
  invited_by_id?: string
  invited_by_name?: string
  password_changed_at?: string
  last_login_at?: string
  created_at: string
  updated_at?: string
  invitation_email_status?: string
  invitation_expires_at?: string
}

export interface AllRolesRes extends PaginatedResponse {
  data: Role[]
}
export interface Role {
  id: string
  name: string
  status: string
  is_system_role: boolean
  is_locked: boolean
  version: number
  assigned_users_count: number
  permissions_count: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TeamMemberRes extends ResponseMessage {
  data: TeamMember
}