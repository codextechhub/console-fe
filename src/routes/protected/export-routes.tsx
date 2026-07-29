import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const QueuesPage = lazy(() => import("@/pages/protected/export/queues"));
const FilesPage = lazy(() => import("@/pages/protected/export/files"));
const RunDetailPage = lazy(() => import("@/pages/protected/export/run-detail"));
const SavedExportsPage = lazy(() => import("@/pages/protected/export/saved"));
const ExportBuilderPage = lazy(() => import("@/pages/protected/export/builder"));

export const exportRoutes: RouteObject[] = [
  { path: routesPath.PROTECTED.EXPORT.SAVED, element: <SavedExportsPage />, handle: { title: "Exports" } satisfies DashboardHandle },
  { path: routesPath.PROTECTED.EXPORT.NEW, element: <ExportBuilderPage />, handle: { title: "New export" } satisfies DashboardHandle },
  { path: routesPath.PROTECTED.EXPORT.EDIT_PATH, element: <ExportBuilderPage />, handle: { title: "Edit export" } satisfies DashboardHandle },
  { path: routesPath.PROTECTED.EXPORT.FILES, element: <FilesPage />, handle: { title: "Files" } satisfies DashboardHandle },
  { path: routesPath.PROTECTED.EXPORT.RUN_PATH, element: <RunDetailPage />, handle: { title: "Export run" } satisfies DashboardHandle },
  { path: routesPath.PROTECTED.EXPORT.QUEUES, element: <QueuesPage />, handle: { title: "Queues" } satisfies DashboardHandle },
];
