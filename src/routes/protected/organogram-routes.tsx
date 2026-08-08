import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";
import { routesPath } from "@/routes/routes-path";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
// The staff directory was retired - profiles are reached from Team Management
// ("View Details" → STAFF_BY_USER) or by clicking people in the org chart.
const OrganogramPage = lazy(() => import("@/pages/protected/organogram"));
const OrganogramManage = lazy(() => import("@/pages/protected/organogram/manage"));
const StaffDetail = lazy(() => import("@/pages/protected/organogram/staff/staff-detail"));
const StaffForm = lazy(() => import("@/pages/protected/organogram/staff/staff-form"));
const MyProfile = lazy(() => import("@/pages/protected/me-profile"));

const O = routesPath.PROTECTED.ORGANOGRAM;

export const organogramRoutes: RouteObject[] = [
  { path: O.INDEX, element: <OrganogramPage />, handle: { title: "Organogram" } satisfies DashboardHandle },
  { path: O.MANAGE, element: <OrganogramManage />, handle: { title: "Manage Organogram" } satisfies DashboardHandle },
  { path: O.STAFF_CREATE, element: <StaffForm />, handle: { title: "New Profile", back: true } satisfies DashboardHandle },
  { path: O.STAFF_VIEW_PATH, element: <StaffDetail />, handle: { title: "Staff Profile", back: true } satisfies DashboardHandle },
  { path: O.STAFF_BY_USER_PATH, element: <StaffDetail />, handle: { title: "Staff Profile", back: true } satisfies DashboardHandle },
  { path: O.STAFF_EDIT_PATH, element: <StaffForm />, handle: { title: "Edit Profile", back: true } satisfies DashboardHandle },
  { path: routesPath.PROTECTED.ME_PROFILE.INDEX, element: <MyProfile />, handle: { title: "My Profile" } satisfies DashboardHandle },
];
