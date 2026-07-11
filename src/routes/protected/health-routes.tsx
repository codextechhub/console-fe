import { lazy } from "react";
import type { RouteObject } from "react-router";
import { routesPath } from "@/routes/routes-path";

const HealthPage = lazy(() => import("@/pages/protected/health"));
const H = routesPath.PROTECTED.HEALTH;

export const healthRoutes: RouteObject[] = [
  H.INDEX,
  H.UPTIME,
  H.API,
  H.JOBS,
  H.INCIDENTS,
  H.TENANTS,
  H.SLOS,
].map((path) => ({ path, element: <HealthPage /> }));
