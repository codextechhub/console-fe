import { lazy } from "react";
import { type RouteObject } from "react-router";
import { routesPath } from "@/routes/routesPath";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const OrganogramPage = lazy(() => import("@/pages/protected/organogram"));
const OrganogramManage = lazy(() => import("@/pages/protected/organogram/manage"));
const StaffDirectory = lazy(() => import("@/pages/protected/organogram/staff"));
const StaffDetail = lazy(() => import("@/pages/protected/organogram/staff/staff-detail"));
const StaffForm = lazy(() => import("@/pages/protected/organogram/staff/staff-form"));
const MyProfile = lazy(() => import("@/pages/protected/me-profile"));

const O = routesPath.PROTECTED.ORGANOGRAM;

export const organogramRoutes: RouteObject[] = [
  { path: O.INDEX, element: <OrganogramPage /> },
  { path: O.MANAGE, element: <OrganogramManage /> },
  { path: O.STAFF, element: <StaffDirectory /> },
  { path: O.STAFF_CREATE, element: <StaffForm /> },
  { path: O.STAFF_VIEW_PATH, element: <StaffDetail /> },
  { path: O.STAFF_EDIT_PATH, element: <StaffForm /> },
  { path: routesPath.PROTECTED.ME_PROFILE.INDEX, element: <MyProfile /> },
];
