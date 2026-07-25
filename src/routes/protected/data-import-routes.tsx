import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const ImportBatchesList = lazy(() => import("@/pages/protected/data-imports/batches"));
const NewImportBatch = lazy(() => import("@/pages/protected/data-imports/batches/new"));
const ViewBatch = lazy(() => import("@/pages/protected/data-imports/batches/view-batch"));
const ImportTemplatesList = lazy(() => import("@/pages/protected/data-imports/templates"));
const ViewTemplate = lazy(() => import("@/pages/protected/data-imports/templates/view"));
const NewTemplate = lazy(() => import("@/pages/protected/data-imports/templates/new"));
const EditTemplate = lazy(() => import("@/pages/protected/data-imports/templates/edit"));

export const dataImportRoutes: RouteObject[] = [
  { path: "/data-imports/batches", element: <ImportBatchesList />, handle: { title: "Import Batches" } satisfies DashboardHandle },
  { path: "/data-imports/batches/new", element: <NewImportBatch />, handle: { title: "Data Imports", back: true } satisfies DashboardHandle },
  { path: "/data-imports/batches/:id/view", element: <ViewBatch />, handle: { title: "Batch Detail", back: routesPath.PROTECTED.DATA_IMPORTS.BATCHES.INDEX } satisfies DashboardHandle },
  { path: "/data-imports/templates", element: <ImportTemplatesList />, handle: { title: "Import Templates" } satisfies DashboardHandle },
  { path: "/data-imports/templates/new", element: <NewTemplate />, handle: { title: "New Import Template", back: routesPath.PROTECTED.DATA_IMPORTS.TEMPLATES.INDEX } satisfies DashboardHandle },
  { path: "/data-imports/templates/:id/view", element: <ViewTemplate />, handle: { title: "Template Detail", back: routesPath.PROTECTED.DATA_IMPORTS.TEMPLATES.INDEX } satisfies DashboardHandle },
  { path: "/data-imports/templates/:id/edit", element: <EditTemplate />, handle: { title: "Edit Template" } satisfies DashboardHandle },
];
