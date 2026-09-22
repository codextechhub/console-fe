/**
 * The `field_access` map as the login response and `/user/auth/me/` send it.
 *
 * Stored in this mutable shape because the store's reducers cannot hold the
 * read-only arrays of the finance package's `FieldAccessMap`. Every reader
 * gets it back as a `FieldAccessMap`, which this shape satisfies.
 */
export type FieldAccessPayload = Record<string, {
  hidden?: string[]
  read_only?: string[]
  open_on_create?: string[]
}>

export interface Auth {
  session_id?: number
  user?: User | null
  school?: AuthSchool | null
  /** The caller's own tenant - asserted on every authenticated request as ?tenant=<slug>. */
  tenant?: AuthTenant | null
  /** When set, requests run as an impersonated target: overrides the tenant assertion + sends the session header. */
  impersonation?: ActiveImpersonation | null
  permissions?: string[]
  /**
   * Which fields the effective user may not read or change, keyed by
   * `module.resource`, exactly as the login response and `/user/auth/me/`
   * send it. An absent resource or name means full access, so `{}` is a user
   * with no restrictions. It always describes the same person as
   * `permissions`: the proxied target while impersonating, the actor otherwise.
   */
  field_access?: FieldAccessPayload
}

export interface AuthSchool {
  id: number
  name: string
  slug: string
  logo: string | null
}

/** Session tenant context - from the login/`/me` `data.tenant` and the `tenant_slug` JWT claim. */
export interface AuthTenant {
  slug: string
  name: string
  /** PLATFORM is Codex itself; SCHOOL / ORGANIZATION are customers. */
  kind?: "PLATFORM" | "SCHOOL" | "ORGANIZATION"
}

/** Active impersonation session - the target tenant's slug is asserted in place of the caller's. */
export interface ActiveImpersonation {
  id: number
  tenantSlug: string
  target: ProxyTargetIdentity
  /** Original signed-in context, retained while the effective user changes. */
  actor: AuthContextSnapshot
}

export interface ProxyTargetIdentity {
  id: number
  email: string
  full_name: string
  /** Which side of the platform boundary the account sits on: PLATFORM or SCHOOL. */
  tenant_kind: string
  role: string
  tenant_slug: string
  tenant_name: string
  school_name: string | null
}

export interface AuthContextSnapshot {
  user: User | null
  school: AuthSchool | null
  tenant: AuthTenant | null
  permissions: string[]
  /** Required, so a writer can never swap identities and keep the old map. */
  field_access: FieldAccessPayload
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: string
  status: string
  password_changed_at: string | null
  last_login_at: string
  created_at: string
  updated_at: string
}
