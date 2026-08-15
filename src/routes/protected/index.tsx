import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
// EAGER on purpose. The shell (sidebar, header, session hooks) is a LAYOUT
// ROUTE above every protected page, so it ships in the entry bundle and paints
// the moment the app boots. Previously each page imported it, which made it a
// shared dependency of the lazy page chunks only - rollup hoisted it into its
// own ~128 kB chunk that had to be fetched before the frame could be drawn.
import DashboardLayout from "@/components/layout/dashboard-layout";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
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
// Static list, so declaring the paths does not pull in the lazy Settings chunk.
import { SETTINGS_SECTIONS } from "@/pages/protected/settings/sections";
import { healthRoutes } from "./health-routes";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const Notifications = lazy(() => import("@/pages/protected/notifications"));
const NotificationsAdmin = lazy(() => import("@/pages/protected/notifications/admin"));
const NotificationTemplateEditor = lazy(
  () => import("@/pages/protected/notifications/template-editor"),
);
const Settings = lazy(() => import("@/pages/protected/settings"));
const Support = lazy(() => import("@/pages/protected/support"));
const TicketDetail = lazy(() => import("@/pages/protected/support/detail"));
const HowToGuides = lazy(() => import("@/pages/protected/support/guides"));
const GuideArticle = lazy(() => import("@/pages/protected/support/guide-article"));
const Documents = lazy(() => import("@/pages/protected/documents"));

export const protectedRoutes = [
  {
    Component: DashboardLayout,
    children: [
      { path: routesPath.PROTECTED.NOTIFICATIONS, element: <Notifications />, handle: { title: "Notifications" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.NOTIFICATIONS_ADMIN, element: <NotificationsAdmin />, handle: { title: "Notifications" } satisfies DashboardHandle },
      // "new" is declared before ":id" so it is never read as a template id.
      { path: routesPath.PROTECTED.NOTIFICATION_TEMPLATE_NEW, element: <NotificationTemplateEditor mode="create" />, handle: { title: "Notifications" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.NOTIFICATION_TEMPLATE_PATH, element: <NotificationTemplateEditor />, handle: { title: "Notifications" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.SETTINGS.INDEX, element: <Settings />, handle: { title: "Settings" } satisfies DashboardHandle },
      // One path per section that exists, rather than `:section` matching any URL.
      // An unknown section matches no route and falls through to the app's 404.
      ...SETTINGS_SECTIONS.map((section) => ({
        path: `${routesPath.PROTECTED.SETTINGS.INDEX}/${section}`,
        element: <Settings section={section} />,
        handle: { title: "Settings" } satisfies DashboardHandle,
      })),
      { path: routesPath.PROTECTED.SUPPORT.INDEX, element: <Support />, handle: { title: "Support" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.SUPPORT.TICKETS, element: <Support />, handle: { title: "Support" } satisfies DashboardHandle },
      // Deep-linkable "new ticket": the Support page with the composer already open.
      { path: routesPath.PROTECTED.SUPPORT.NEW, element: <Support />, handle: { title: "Support" } satisfies DashboardHandle },
      // Starts at "Support"; the page swaps in the ticket number once the
      // ticket loads (useDashboardTitle) - exactly the old behaviour.
      { path: routesPath.PROTECTED.SUPPORT.DETAIL_PATH, element: <TicketDetail />, handle: { title: "Support" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.SUPPORT.GUIDES, element: <HowToGuides />, handle: { title: "How-to Guides" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.SUPPORT.GUIDE_DETAIL_PATH, element: <GuideArticle />, handle: { title: "How-to Guides" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.SUPPORT.GUIDE_ALIAS, element: <Navigate replace to={routesPath.PROTECTED.SUPPORT.GUIDES} />, handle: { title: "How-to Guides" } satisfies DashboardHandle },
      { path: routesPath.PROTECTED.DOCUMENTS.INDEX, element: <Documents />, handle: { title: "Documents" } satisfies DashboardHandle },
      ...overviewRoutes,
      ...schoolRoutes,
      ...teamMgtRoutes,
      ...rbacRoutes,
      ...dataImportRoutes,
      ...auditRoutes,
      ...healthRoutes,
      ...workflowRoutes,
      ...organogramRoutes,
      ...todoRoutes,
      ...exportRoutes,
      ...financeRoutes,
      ...procurementRoutes,
      ...meSecurityRoutes,
    ],
  },
] as RouteObject[];
