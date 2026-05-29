import { type RouteObject } from "react-router";
import { schoolRoutes } from "./school-routes";
import { overviewRoutes } from "./overview-routes";
import { teamMgtRoutes } from "./team-mgt-routes";
import { rbacRoutes } from "./rbac-routes";
import { dataImportRoutes } from "./data-import-routes";
import { auditRoutes } from "./audit-routes";
import { meSecurityRoutes } from "./me-security-routes";
import { workflowRoutes } from "./workflow-routes";
import Notifications from "@/pages/protected/notifications";
import { routesPath } from "@/routes/routesPath";

export const protectedRoutes = [
  { path: routesPath.PROTECTED.NOTIFICATIONS, element: <Notifications /> },
  ...overviewRoutes,
  ...schoolRoutes,
  ...teamMgtRoutes,
  ...rbacRoutes,
  ...dataImportRoutes,
  ...auditRoutes,
  ...workflowRoutes,
  ...meSecurityRoutes,
] as RouteObject[];
