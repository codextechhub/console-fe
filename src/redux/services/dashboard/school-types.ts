import type { PaginatedResponse } from "@/types"

export interface ContactInfo {
  full_name: string
  email: string
  phone: string
  created_at: string
  updated_at: string
}

export interface BranchPrimaryAdmin {
  id: string
  branch_role: string
  role_label: string
  invite_status: string
  invite_queued_at: string | null
  invite_sent_at: string | null
  contact: ContactInfo
}

export interface SchoolPrimaryAdmin {
  id: string
  school_role: string
  role_label: string
  invite_status: string
  invite_queued_at: string | null
  invite_sent_at: string | null
  contact: ContactInfo
}

export interface Branch {
  code: number
  school_slug: string
  name: string
  is_main: boolean
  _type: string
  status: string
  country: string
  state: string
}

export interface BranchDetail extends Branch {
  address: string
  email: string
  opened_at: string | null
  activated_at: string | null
  primary_admin: BranchPrimaryAdmin | null
}

export interface SchoolBranding {
  logo: string | null
  created_at: string
  updated_at: string
}

export interface PackagePlan {
  id: string
  name: string
  code: string
  description: string
  billing_cycle: string
  max_students: number | null
  max_teachers: number | null
  max_admins: number | null
  max_branch: number | null
  is_active: boolean
}

export interface XVSModule {
  id: string
  key: string
  name: string
  description: string
  is_active: boolean
}

export interface PackageSetup {
  id: string
  package_plan: PackagePlan
  enabled_modules: XVSModule[]
  student_capacity: number
  teacher_capacity: number
  admin_capacity: number
  subscription_expires_at: string | null
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface School {
  id: number
  name: string
  slug: string
  code: string
  ownership_type: string
  status: string
  activated_at: string | null
  total_students: number
  main_branch: Branch | null
}

export interface SchoolDetail extends School {
  address: string
  website: string
  motto: string
  term_structure: string
  currency: string
  registration_id: string
  deactivated_at: string | null
  branches: BranchDetail[]
  branding: SchoolBranding | null
  primary_admin: SchoolPrimaryAdmin | null
  package_setup: PackageSetup | null
}

export interface SchoolStats {
  all: number
  active: number
  pending: number
  inactive: number
}

export interface BranchStats {
  all: number
  active: number
  pending: number
  suspended: number
  inactive: number
  closed: number
}

export interface SchoolsRes extends PaginatedResponse {
  data: School[]
}

export interface SchoolDetailRes {
  success: boolean
  message: string
  data: SchoolDetail
}

export interface SchoolStatsRes {
  success: boolean
  message: string
  data: SchoolStats
}

export interface BranchesRes extends PaginatedResponse {
  data: BranchDetail[]
}

export interface BranchDetailRes {
  success: boolean
  message: string
  data: BranchDetail
}

export interface PackagePlansRes {
  success: boolean
  message: string
  data: PackagePlan[]
}

export interface ModulesRes {
  success: boolean
  message: string
  data: XVSModule[]
}
