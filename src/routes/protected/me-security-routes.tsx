import { type RouteObject } from "react-router";
import MeSecurityOverview from "@/pages/protected/me-security/overview";
import MyActiveSessions from "@/pages/protected/me-security/active-sessions";
import MyLoginHistory from "@/pages/protected/me-security/login-history";
import MyPassword from "@/pages/protected/me-security/password";
import MyActivity from "@/pages/protected/me-security/activity";
import MyPrivacy from "@/pages/protected/me-security/privacy";

export const meSecurityRoutes: RouteObject[] = [
  { path: "/me/security", element: <MeSecurityOverview /> },
  { path: "/me/security/sessions", element: <MyActiveSessions /> },
  { path: "/me/security/login-history", element: <MyLoginHistory /> },
  { path: "/me/security/password", element: <MyPassword /> },
  { path: "/me/security/activity", element: <MyActivity /> },
  { path: "/me/security/privacy", element: <MyPrivacy /> },
];
