import { type RouteObject } from "react-router";
import { schoolRoutes } from "./school-routes";
import { overviewRoutes } from "./overview-routes";
import { teamMgtRoutes } from "./team-mgt-routes";
import Unauthorized from "@/pages/unauthorized";

export const protectedRoutes = [
  ...overviewRoutes,
  ...schoolRoutes,
  ...teamMgtRoutes,
  { path: "/unauthorized", Component: Unauthorized },
] as RouteObject[];
