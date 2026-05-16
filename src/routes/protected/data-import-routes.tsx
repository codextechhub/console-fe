import { type RouteObject } from "react-router";
import ImportBatchesList from "@/pages/protected/data-imports/batches";
import ViewBatch from "@/pages/protected/data-imports/batches/view-batch";
import ImportTemplatesList from "@/pages/protected/data-imports/templates";

export const dataImportRoutes: RouteObject[] = [
  { path: "/data-imports/batches", element: <ImportBatchesList /> },
  { path: "/data-imports/batches/:id/view", element: <ViewBatch /> },
  { path: "/data-imports/templates", element: <ImportTemplatesList /> },
];
