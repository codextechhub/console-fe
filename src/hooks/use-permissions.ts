import { selectPermissions } from "@/redux/features/auth/auth-slice";
import { useAppSelector } from "@/redux/store";
import { type PermissionCode, resolvePermissionKey } from "@/permissions";

export function usePermissions() {
  const permissions = useAppSelector(selectPermissions);

  const hasPermission = (code: PermissionCode): boolean =>
    permissions.includes(resolvePermissionKey(code));

  const hasAnyPermission = (...codes: PermissionCode[]): boolean =>
    codes.some((c) => permissions.includes(resolvePermissionKey(c)));

  const hasAllPermissions = (...codes: PermissionCode[]): boolean =>
    codes.every((c) => permissions.includes(resolvePermissionKey(c)));

  // True when the user holds ANY backend key under a module prefix
  // (e.g. "finance.", "procurement.", "payments."). Used for whole-console
  // visibility, where gating on one specific key would be too narrow — a user
  // with only finance.report.view should still see the Finance console. This is
  // the one place we read raw backend keys, by design.
  const hasModuleAccess = (...prefixes: string[]): boolean =>
    permissions.some((key) => prefixes.some((p) => key.startsWith(p)));

  return { hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess };
}
