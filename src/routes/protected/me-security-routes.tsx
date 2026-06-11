import { lazy } from "react";
import { type RouteObject } from "react-router";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const MeSecurityOverview = lazy(() => import("@/pages/protected/me-security/overview"));
const MyActiveSessions = lazy(() => import("@/pages/protected/me-security/active-sessions"));
const MyLoginHistory = lazy(() => import("@/pages/protected/me-security/login-history"));
const MyPassword = lazy(() => import("@/pages/protected/me-security/password"));
const MyActivity = lazy(() => import("@/pages/protected/me-security/activity"));
const MyPrivacy = lazy(() => import("@/pages/protected/me-security/privacy"));

export const meSecurityRoutes: RouteObject[] = [
  { path: "/me/security", element: <MeSecurityOverview /> },
  { path: "/me/security/sessions", element: <MyActiveSessions /> },
  { path: "/me/security/login-history", element: <MyLoginHistory /> },
  { path: "/me/security/password", element: <MyPassword /> },
  { path: "/me/security/activity", element: <MyActivity /> },
  { path: "/me/security/privacy", element: <MyPrivacy /> },
];
