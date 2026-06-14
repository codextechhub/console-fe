import { lazy } from "react";
import { type RouteObject } from "react-router";
import { schoolRoutes } from "./school-routes";
import { overviewRoutes } from "./overview-routes";
import { teamMgtRoutes } from "./team-mgt-routes";
import { rbacRoutes } from "./rbac-routes";
import { dataImportRoutes } from "./data-import-routes";
import { auditRoutes } from "./audit-routes";
import { meSecurityRoutes } from "./me-security-routes";
import { workflowRoutes } from "./workflow-routes";
import { organogramRoutes } from "./organogram-routes";
import { todoRoutes } from "./todo-routes";
import { exportRoutes } from "./export-routes";
import { financeRoutes } from "./finance-routes";
import { procurementRoutes } from "./procurement-routes";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const Notifications = lazy(() => import("@/pages/protected/notifications"));

export const protectedRoutes = [
  { path: routesPath.PROTECTED.NOTIFICATIONS, element: <Notifications /> },
  ...overviewRoutes,
  ...schoolRoutes,
  ...teamMgtRoutes,
  ...rbacRoutes,
  ...dataImportRoutes,
  ...auditRoutes,
  ...workflowRoutes,
  ...organogramRoutes,
  ...todoRoutes,
  ...exportRoutes,
  ...financeRoutes,
  ...procurementRoutes,
  ...meSecurityRoutes,
] as RouteObject[];
