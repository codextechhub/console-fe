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

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
