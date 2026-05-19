export const FRIENDLY_ACTION: Record<string, string> = {
  // Generic CRUD
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",

  // Identity / authentication
  USER_CREATED: "User created",
  USER_INVITED: "User invited",
  ACCOUNT_ACTIVATED: "Account activated",
  LOGIN_SUCCESS: "Login success",
  LOGIN_FAILED: "Login failed",
  TOKEN_REVOKED: "Token revoked",
  FORCE_LOGOUT: "Force logout",
  ACCOUNT_LOCKED: "Account locked",
  ACCOUNT_UNLOCKED: "Account unlocked",
  ACCOUNT_SUSPENDED: "Account suspended",
  ACCOUNT_REACTIVATED: "Account reactivated",
  ACCOUNT_DEACTIVATED: "Account deactivated",
  PASSWORD_RESET_REQUESTED: "Password reset requested",
  PASSWORD_RESET: "Password reset",
  PASSWORD_CHANGED: "Password changed",
  EMAIL_CHANGED: "Email changed",

  // Data import
  DATA_FILE_UPLOADED: "File uploaded",
  DATA_IMPORT_STARTED: "Import started",
  DATA_IMPORT_ROW_PROCESSED: "Row processed",
  DATA_IMPORT_COMPLETED: "Import completed",
  DATA_IMPORT_FAILED: "Import failed",
  DATA_IMPORT_ROLLED_BACK: "Import rolled back",

  // RBAC
  ROLE_ASSIGNED: "Role assigned",
  ROLE_CHANGED: "Role changed",
  PERMISSION_CHANGED: "Permission changed",

  // Other
  CONFIG_CHANGED: "Config changed",
  FINANCIAL_TRANSACTION: "Financial transaction",
  PROCUREMENT_ACTION: "Procurement action",
  EXPORT_REQUESTED: "Export requested",
  EXPORT_COMPLETED: "Export completed",
  EXPORT_FAILED: "Export failed",
  CUSTOM: "Custom",
};

export function friendlyAction(code: string): string {
  return FRIENDLY_ACTION[code] ?? code;
}
