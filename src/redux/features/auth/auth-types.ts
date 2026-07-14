export interface Auth {
  access?: string
  refresh?: string
  session_id?: number
  user?: User | null
  school?: AuthSchool | null
  /** The caller's own tenant — asserted on every authenticated request as ?tenant=<slug>. */
  tenant?: AuthTenant | null
  /** When set, requests run as an impersonated target: overrides the tenant assertion + sends the session header. */
  impersonation?: ActiveImpersonation | null
  permissions?: string[]
}

export interface AuthSchool {
  id: number
  name: string
  slug: string
  logo: string | null
}

/** Session tenant context — from the login/`/me` `data.tenant` and the `tenant_slug` JWT claim. */
export interface AuthTenant {
  slug: string
  name: string
}

/** Active impersonation session — the target tenant's slug is asserted in place of the caller's. */
export interface ActiveImpersonation {
  id: number
  tenantSlug: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  user_type: string
  role: string
  status: string
  password_changed_at: string | null
  last_login_at: string
  created_at: string
  updated_at: string
}
