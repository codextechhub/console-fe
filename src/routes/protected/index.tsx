import { type RouteObject } from "react-router";
import { schoolRoutes } from "./school-routes";
import { overviewRoutes } from "./overview-routes";
import { teamMgtRoutes } from "./team-mgt-routes";
import { rbacRoutes } from "./rbac-routes";
import { dataImportRoutes } from "./data-import-routes";
import { auditRoutes } from "./audit-routes";
import { meSecurityRoutes } from "./me-security-routes";

export const protectedRoutes = [
  ...overviewRoutes,
  ...schoolRoutes,
  ...teamMgtRoutes,
  ...rbacRoutes,
  ...dataImportRoutes,
  ...auditRoutes,
  ...meSecurityRoutes,
] as RouteObject[];
