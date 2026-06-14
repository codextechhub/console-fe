export interface Auth {
  access?: string
  refresh?: string
  session_id?: number
  user?: User | null
  permissions?: string[]
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
