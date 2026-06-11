import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const TeamManagement = lazy(() => import("@/pages/protected/team-mgt"));
const CreateAdmin = lazy(() => import("@/pages/protected/team-mgt/create-admin"));
const EditAdmin = lazy(() => import("@/pages/protected/team-mgt/edit-admin"));
const ViewAdmin = lazy(() => import("@/pages/protected/team-mgt/view-admin"));

export const teamMgtRoutes: RouteObject[] = [
  { path: routesPath.PROTECTED.TEAM_MGT.INDEX, Component: TeamManagement },
  { path: routesPath.PROTECTED.TEAM_MGT.VIEW_PATH, Component: ViewAdmin },
  { path: routesPath.PROTECTED.TEAM_MGT.CREATE, Component: CreateAdmin },
  { path: routesPath.PROTECTED.TEAM_MGT.EDIT_PATH, Component: EditAdmin },
];
