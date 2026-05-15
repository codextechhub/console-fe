import { type RouteObject } from "react-router";
import { schoolRoutes } from "./school-routes";
import { overviewRoutes } from "./overview-routes";
import { teamMgtRoutes } from "./team-mgt-routes";

export const protectedRoutes = [
  ...overviewRoutes,
  ...schoolRoutes,
  ...teamMgtRoutes,
] as RouteObject[];
