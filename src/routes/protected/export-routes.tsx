import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const QueuesPage = lazy(() => import("@/pages/protected/export/queues"));

export const exportRoutes: RouteObject[] = [
  { path: routesPath.PROTECTED.EXPORT.QUEUES, element: <QueuesPage /> },
];
