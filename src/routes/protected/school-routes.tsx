import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "../routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const SchoolManagement = lazy(() => import("@/pages/protected/school-mgt"));
const CreateSchool = lazy(() => import("@/pages/protected/school-mgt/create-school"));
const ViewSchool = lazy(() => import("@/pages/protected/school-mgt/view-school"));
const EditSchool = lazy(() => import("@/pages/protected/school-mgt/edit-school"));
const ViewBranch = lazy(() => import("@/pages/protected/school-mgt/view-branch"));
const EditBranch = lazy(() => import("@/pages/protected/school-mgt/edit-branch"));
const CreateBranch = lazy(() => import("@/pages/protected/school-mgt/create-branch"));

export const schoolRoutes: RouteObject[] = [
  { path: routesPath.PROTECTED.SCHOOL_MGT.INDEX, Component: SchoolManagement },
  { path: routesPath.PROTECTED.SCHOOL_MGT.VIEW_PATH, Component: ViewSchool },
  { path: routesPath.PROTECTED.SCHOOL_MGT.VIEW_BRANCH_PATH, Component: ViewBranch },
  { path: routesPath.PROTECTED.SCHOOL_MGT.CREATE, Component: CreateSchool },
  { path: routesPath.PROTECTED.SCHOOL_MGT.EDIT_PATH, Component: EditSchool },
  { path: routesPath.PROTECTED.SCHOOL_MGT.CREATE_BRANCH_PATH, Component: CreateBranch },
  { path: routesPath.PROTECTED.SCHOOL_MGT.EDIT_BRANCH_PATH, Component: EditBranch },
];
