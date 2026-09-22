import type { AuthSchool, AuthTenant, FieldAccessPayload, User } from "@/redux/features/auth/auth-types";

export interface ResponseMessage {
    status: boolean;
    message: string;
}

export interface LoginResponse extends ResponseMessage {
  data: {
    access: string
    session_id: number
    user: User
    school: AuthSchool | null
    tenant: AuthTenant | null
    permissions: string[]
    field_access?: FieldAccessPayload
  }
}
