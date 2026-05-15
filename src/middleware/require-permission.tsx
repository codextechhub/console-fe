/**
 * RequirePermission — wrap route groups that need FLS enforcement.
 * Import permission codes from @/permissions and use P.* constants.
 *
 * Single permission:
 *   element: <RequirePermission permission={P.BROWSE_SCHOOLS} />
 *
 * Any one of these (default mode):
 *   element: <RequirePermission permission={[P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL]} />
 *
 * Must have ALL of these:
 *   element: <RequirePermission permission={[P.BROWSE_SCHOOLS, P.MODIFY_SCHOOL]} mode="all" />
 *
 * Unauthorised users see a toast and are sent back to their previous page,
 * or to the dashboard if there is no history to go back to.
 */
import { useEffect } from "react";
import { type PermissionCode } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { Outlet, useNavigate } from "react-router";
import { routesPath } from "@/routes/routesPath";
import { toast } from "sonner";

interface Props {
  permission: PermissionCode | PermissionCode[];
  mode?: "any" | "all";
}

export default function RequirePermission({ permission, mode = "any" }: Props) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const navigate = useNavigate();

  const codes = Array.isArray(permission) ? permission : [permission];

  const allowed =
    codes.length === 1
      ? hasPermission(codes[0])
      : mode === "all"
        ? hasAllPermissions(...codes)
        : hasAnyPermission(...codes);

  useEffect(() => {
    if (!allowed) {
      toast.error("Access denied. You don't have permission to view this page.");
      // Go back if there's a previous entry in the React Router history stack,
      // otherwise fall back to the dashboard.
      const canGoBack = (window.history.state?.idx ?? 0) > 0;
      if (canGoBack) {
        navigate(-1);
      } else {
        navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
      }
    }
  }, [allowed]);

  if (!allowed) return null;
  return <Outlet />;
}
