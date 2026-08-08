/**
 * PermissionGate - conditionally renders UI based on the user's permissions.
 * Import permission codes from @/permissions and use P.* constants.
 *
 * Hide entirely (default):
 *   <PermissionGate permission={P.ONBOARD_SCHOOL}>
 *     <Button>Add New School</Button>
 *   </PermissionGate>
 *
 * Render a fallback instead:
 *   <PermissionGate permission={P.MODIFY_SCHOOL} fallback={<p>Read-only</p>}>
 *     <Button>Edit School</Button>
 *   </PermissionGate>
 *
 * Array - any one (default):
 *   <PermissionGate permission={[P.ONBOARD_SCHOOL, P.MODIFY_SCHOOL]}>
 *     <Button>Save</Button>
 *   </PermissionGate>
 *
 * Array - must have all:
 *   <PermissionGate permission={[P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL]} mode="all">
 *     <Button>Edit</Button>
 *   </PermissionGate>
 */
import { type PermissionCode } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";

interface Props {
  permission: PermissionCode | PermissionCode[];
  mode?: "any" | "all";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGate({ permission, mode = "any", fallback = null, children }: Props) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const codes = Array.isArray(permission) ? permission : [permission];

  const allowed =
    codes.length === 1
      ? hasPermission(codes[0])
      : mode === "all"
        ? hasAllPermissions(...codes)
        : hasAnyPermission(...codes);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
