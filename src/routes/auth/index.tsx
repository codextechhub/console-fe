import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import { routesPath } from "../routes-path";
import AuthLayout from "@/components/layout/auth-layout";
import Guest from "@/middleware/guest";

// Route-level code splitting: each page loads on first visit instead of
// shipping in the main bundle. Suspense fallback lives in routes/index.tsx.
const Login = lazy(() => import("@/pages/auth/login"));
const SignUp = lazy(() => import("@/pages/auth/signup"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ActivateAccount = lazy(() => import("@/pages/auth/activate"));
const SpecialLogin = lazy(() => import("@/pages/auth/special-login"));
const VendorRfq = lazy(() => import("@/pages/public/vendor-rfq"));

export const authRoutes = [
  { path: routesPath.AUTH.VENDOR_RFQ, Component: VendorRfq },
  {
    Component: AuthLayout,
    children: [
      // Sign-in pages: an already-authenticated user is bounced to the app, so
      // /login can't be reopened (e.g. via Back) once signed in.
      {
        Component: Guest,
        children: [
          { index: true, element: <Navigate to={routesPath.AUTH.LOGIN} /> },
          { path: routesPath.AUTH.LOGIN, Component: Login },
          { path: routesPath.AUTH.SIGNUP, Component: SignUp },
        ],
      },
      // Email-link / out-of-band flows stay reachable even with a live session.
      { path: routesPath.AUTH.FORGOT_PASSWORD, Component: ForgotPassword },
      { path: routesPath.AUTH.RESET_PASSWORD, Component: ResetPassword },
      { path: routesPath.AUTH.ACTIVATE, Component: ActivateAccount },
      { path: routesPath.AUTH.SPECIAL_LOGIN, Component: SpecialLogin },
    ],
  },
] as RouteObject[];
