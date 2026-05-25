import { type RouteObject } from "react-router";
import ImportBatchesList from "@/pages/protected/data-imports/batches";
import NewImportBatch from "@/pages/protected/data-imports/batches/new";
import ViewBatch from "@/pages/protected/data-imports/batches/view-batch";
import ImportTemplatesList from "@/pages/protected/data-imports/templates";
import ViewTemplate from "@/pages/protected/data-imports/templates/view";
import NewTemplate from "@/pages/protected/data-imports/templates/new";
import EditTemplate from "@/pages/protected/data-imports/templates/edit";

export const dataImportRoutes: RouteObject[] = [
  { path: "/data-imports/batches", element: <ImportBatchesList /> },
  { path: "/data-imports/batches/new", element: <NewImportBatch /> },
  { path: "/data-imports/batches/:id/view", element: <ViewBatch /> },
  { path: "/data-imports/templates", element: <ImportTemplatesList /> },
  { path: "/data-imports/templates/new", element: <NewTemplate /> },
  { path: "/data-imports/templates/:id/view", element: <ViewTemplate /> },
  { path: "/data-imports/templates/:id/edit", element: <EditTemplate /> },
];
