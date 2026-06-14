import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: the Tasks page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const TodoPage = lazy(() => import("@/pages/protected/todo"));

export const todoRoutes: RouteObject[] = [
  { path: routesPath.PROTECTED.TODO.INDEX, element: <TodoPage /> },
];
