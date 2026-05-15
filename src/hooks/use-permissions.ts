import { useAppSelector } from "@/redux/store";
import { selectPermissions } from "@/redux/features/auth/authSlice";

export function usePermissions() {
  const permissions = useAppSelector(selectPermissions);

  const hasPermission = (key: string): boolean => permissions.includes(key);

  const hasAnyPermission = (...keys: string[]): boolean =>
    keys.some((k) => permissions.includes(k));

  const hasAllPermissions = (...keys: string[]): boolean =>
    keys.every((k) => permissions.includes(k));

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}
