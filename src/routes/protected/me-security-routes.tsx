import { lazy } from "react";
import { type RouteObject } from "react-router";
import type { DashboardHandle } from "@/components/layout/dashboard-header";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const MeSecurityOverview = lazy(() => import("@/pages/protected/me-security/overview"));
const MyActiveSessions = lazy(() => import("@/pages/protected/me-security/active-sessions"));
const MyLoginHistory = lazy(() => import("@/pages/protected/me-security/login-history"));
const MyPassword = lazy(() => import("@/pages/protected/me-security/password"));
const MyActivity = lazy(() => import("@/pages/protected/me-security/activity"));
const MyPrivacy = lazy(() => import("@/pages/protected/me-security/privacy"));

export const meSecurityRoutes: RouteObject[] = [
  { path: "/me/security", element: <MeSecurityOverview />, handle: { title: "My Security" } satisfies DashboardHandle },
  { path: "/me/security/sessions", element: <MyActiveSessions />, handle: { title: "Active Sessions" } satisfies DashboardHandle },
  { path: "/me/security/login-history", element: <MyLoginHistory />, handle: { title: "Login History" } satisfies DashboardHandle },
  { path: "/me/security/password", element: <MyPassword />, handle: { title: "Password & Sign-in" } satisfies DashboardHandle },
  { path: "/me/security/activity", element: <MyActivity />, handle: { title: "My Activity" } satisfies DashboardHandle },
  { path: "/me/security/privacy", element: <MyPrivacy />, handle: { title: "Data & Privacy" } satisfies DashboardHandle },
];
