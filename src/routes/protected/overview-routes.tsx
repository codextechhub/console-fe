import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const Overview = lazy(() => import("@/pages/protected/overview"));

export const overviewRoutes = [
  { path: routesPath.PROTECTED.OVERVIEW.INDEX, Component: Overview },
] as RouteObject[];
