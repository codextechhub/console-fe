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

/** The authenticator to set up, for a sign-in refused with TWO_STEP_SET_UP_REQUIRED. */
export interface TwoStepSetUpResponse {
  message: string
  data: {
    /** The secret, to type in where a camera is not to hand. */
    secret: string
    /** The `otpauth://` address the QR code carries. */
    otpauth_uri: string
    /** The name the app lists the account under: CodeX. */
    issuer: string
    account: string
  }
}

/** The signed-in person's own two-step sign-in. */
export interface MyTwoStep {
  set_up: boolean
  /** Whether their role needs it; for CodeX staff, always. */
  required: boolean
  recovery_codes_left: number
}

/** The challenge a sign-in refused for a two-step code carries in `error`. */
export interface TwoStepChallenge {
  code: "TWO_STEP_REQUIRED" | "TWO_STEP_SET_UP_REQUIRED"
  detail: string
  challenge: string
  expires_in: number
}
