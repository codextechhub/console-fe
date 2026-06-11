import { lazy } from "react";
import { type RouteObject } from "react-router";

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
  { path: "/data-imports/batches", element: <ImportBatchesList /> },
  { path: "/data-imports/batches/new", element: <NewImportBatch /> },
  { path: "/data-imports/batches/:id/view", element: <ViewBatch /> },
  { path: "/data-imports/templates", element: <ImportTemplatesList /> },
  { path: "/data-imports/templates/new", element: <NewTemplate /> },
  { path: "/data-imports/templates/:id/view", element: <ViewTemplate /> },
  { path: "/data-imports/templates/:id/edit", element: <EditTemplate /> },
];
