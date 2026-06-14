import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import { routesPath } from "../routes-path";
import AuthLayout from "@/components/layout/auth-layout";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const Login = lazy(() => import("@/pages/auth/login"));
const SignUp = lazy(() => import("@/pages/auth/signup"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ActivateAccount = lazy(() => import("@/pages/auth/activate"));
const SpecialLogin = lazy(() => import("@/pages/auth/special-login"));

export const authRoutes = [
  {
    Component: AuthLayout,
    children: [
      { index: true, element: <Navigate to={routesPath.AUTH.LOGIN} /> },
      { path: routesPath.AUTH.LOGIN, Component: Login },
      { path: routesPath.AUTH.SIGNUP, Component: SignUp },
      { path: routesPath.AUTH.FORGOT_PASSWORD, Component: ForgotPassword },
      { path: routesPath.AUTH.RESET_PASSWORD, Component: ResetPassword },
      { path: routesPath.AUTH.ACTIVATE, Component: ActivateAccount },
      { path: routesPath.AUTH.SPECIAL_LOGIN, Component: SpecialLogin },
    ],
  },
] as RouteObject[];
